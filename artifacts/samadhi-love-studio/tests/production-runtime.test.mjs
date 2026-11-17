import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import { test } from "node:test";
import ts from "typescript";
import { createGateway, gatewayConfig } from "../scripts/production-gateway.mjs";
import { cloudflareProductionBindings } from "../scripts/cloudflare-production-bindings.mjs";

const fixtureKey = "fixture-only-not-a-real-secret-123456789";
const source = {
  PORT: "19559", STUDIO_WORKER_ORIGIN: "https://worker.example.workers.dev",
  STUDIO_PUBLIC_ORIGIN: "https://studio.example.test", STUDIO_WORKER_PROXY_KEY: fixtureKey,
};
const { outputText } = ts.transpileModule(readFileSync(new URL("../worker/production-request.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { productionRequest } = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
const workerEnv = { STUDIO_PUBLIC_ORIGIN: source.STUDIO_PUBLIC_ORIGIN, STUDIO_WORKER_PROXY_KEY: fixtureKey };

async function serve(t, transport) {
  const server = createGateway(gatewayConfig(source), transport);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test("production gateway validates required configuration and never permits HTTP or a forwarding loop", () => {
  assert.equal(gatewayConfig(source).port, 19559);
  for (const patch of [
    { STUDIO_WORKER_ORIGIN: undefined }, { STUDIO_WORKER_ORIGIN: "http://localhost:1234" },
    { STUDIO_WORKER_ORIGIN: "https://user:pass@worker.example" },
    { STUDIO_WORKER_ORIGIN: "https://worker.example/path" },
    { STUDIO_WORKER_ORIGIN: source.STUDIO_PUBLIC_ORIGIN },
    { STUDIO_WORKER_PROXY_KEY: undefined }, { STUDIO_WORKER_PROXY_KEY: "short" }, { PORT: "NaN" },
  ]) assert.throws(() => gatewayConfig({ ...source, ...patch }));
});

test("Worker rejects unconfigured, unauthenticated and forged requests before application handling", async () => {
  const request = new Request(source.STUDIO_WORKER_ORIGIN + "/");
  assert.equal((await productionRequest(request, {})).status, 503);
  assert.equal((await productionRequest(request, workerEnv)).status, 403);
  const forged = new Request(request, { headers: { "x-studio-gateway-key": "wrong", "x-forwarded-host": "attacker.test" } });
  assert.equal((await productionRequest(forged, workerEnv)).status, 403);
});

test("Worker restores only the configured public origin and preserves body, cookies and original Origin", async () => {
  const request = new Request(source.STUDIO_WORKER_ORIGIN + "/api/studio/create?test=1", {
    method: "POST",
    headers: {
      "x-studio-gateway-key": fixtureKey, "x-forwarded-host": "attacker.test",
      Origin: source.STUDIO_PUBLIC_ORIGIN, Cookie: "__session=fixture",
    },
    body: '{"action":"fixture-no-provider-call"}',
  });
  const prepared = await productionRequest(request, workerEnv);
  assert.ok(prepared instanceof Request);
  assert.equal(prepared.url, source.STUDIO_PUBLIC_ORIGIN + "/api/studio/create?test=1");
  assert.equal(prepared.headers.get("x-forwarded-host"), "studio.example.test");
  assert.equal(prepared.headers.get("x-studio-gateway-key"), null);
  assert.equal(prepared.headers.get("origin"), source.STUDIO_PUBLIC_ORIGIN);
  assert.equal(prepared.headers.get("cookie"), "__session=fixture");
  assert.match(await prepared.text(), /fixture-no-provider-call/);
});

test("production HTTP gateway streams requests and returns dynamic route status without exposing its key", async t => {
  let calls = 0;
  const origin = await serve(t, async (url, options) => {
    calls++;
    assert.equal(new URL(url).origin, source.STUDIO_WORKER_ORIGIN);
    assert.equal(options.redirect, "manual");
    assert.equal(options.headers.get("x-studio-gateway-key"), fixtureKey);
    assert.equal(options.headers.get("x-forwarded-host"), null);
    assert.equal(options.headers.get("cookie"), "__session=fixture");
    const prepared = await productionRequest(new Request(url, options), workerEnv);
    assert.equal(prepared.url, source.STUDIO_PUBLIC_ORIGIN + "/api/studio?x=1");
    assert.equal(await prepared.text(), '{"lyrics":"مرحبا / Hello"}');
    return new Response('{"error":"fixture signed out"}', {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "x-studio-gateway-key": fixtureKey },
    });
  });
  const response = await fetch(origin + "/api/studio?x=1", {
    method: "POST",
    headers: { Cookie: "__session=fixture", "x-forwarded-host": "attacker.test", "x-studio-gateway-key": "forged" },
    body: '{"lyrics":"مرحبا / Hello"}',
  });
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("x-studio-gateway-key"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(await response.text(), /fixture signed out/);
  assert.equal(calls, 1);
});

test("gateway preserves separate cookies, ranges and redirects without following upstream destinations", async t => {
  const origin = await serve(t, async (_url, options) => {
    assert.equal(options.headers.get("range"), "bytes=0-10");
    const headers = new Headers({ Location: source.STUDIO_WORKER_ORIGIN + "/creator", "Content-Encoding": "gzip" });
    headers.append("Set-Cookie", "first=one; Path=/; HttpOnly; Secure");
    headers.append("Set-Cookie", "second=two; Path=/; HttpOnly; Secure");
    return new Response(null, { status: 302, headers });
  });
  const response = await fetch(origin + "/audio", { redirect: "manual", headers: { Range: "bytes=0-10" } });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), source.STUDIO_PUBLIC_ORIGIN + "/creator");
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.equal(response.headers.get("content-encoding"), null);
});

test("gateway returns a safe error on backend failure without retrying generation", async t => {
  let calls = 0;
  const origin = await serve(t, async () => { calls++; throw new Error("fixture internal details"); });
  const response = await fetch(origin + "/api/studio/create", { method: "POST", body: "{}" });
  assert.equal(response.status, 502);
  const body = await response.text();
  assert.ok(!body.includes("internal details"));
  assert.ok(!body.includes(fixtureKey));
  assert.equal(calls, 1);
});

test("gateway rejects network-path targets instead of forwarding to a caller-selected host", async t => {
  let calls = 0;
  const origin = await serve(t, async () => { calls++; return new Response("unexpected"); });
  const response = await fetch(origin + "//attacker.example/private");
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("gateway preserves binary audio range responses without buffering or corrupting bytes", async t => {
  const origin = await serve(t, async (_url, options) => {
    assert.equal(options.headers.get("range"), "bytes=1-3");
    assert.equal(options.headers.get("forwarded"), null);
    return new Response(new Uint8Array([0, 255, 128]), {
      status: 206,
      headers: { "Content-Type": "audio/mpeg", "Content-Range": "bytes 1-3/9", "Accept-Ranges": "bytes" },
    });
  });
  const response = await fetch(origin + "/api/studio/audio", {
    headers: { Range: "bytes=1-3", Forwarded: "host=attacker.example" },
  });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 1-3/9");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([0, 255, 128]));
});

test("Cloudflare production builds require real identifiers and never accept the local D1 placeholder", () => {
  assert.throws(() => cloudflareProductionBindings({}), /CLOUDFLARE_ACCOUNT_ID/);
  const config = {
    CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), STUDIO_D1_DATABASE_ID: "12345678-1234-4321-8123-123456789012",
    STUDIO_D1_DATABASE_NAME: "fixture-studio-db", STUDIO_R2_BUCKET_NAME: "fixture-studio-media",
    STUDIO_CLOUDFLARE_WORKER_NAME: "fixture-studio", STUDIO_PUBLIC_ORIGIN: source.STUDIO_PUBLIC_ORIGIN,
  };
  const result = cloudflareProductionBindings(config);
  assert.equal(result.d1_databases[0].binding, "DB");
  assert.equal(result.r2_buckets[0].binding, "BUCKET");
  assert.equal(result.vars.STUDIO_PUBLIC_ORIGIN, source.STUDIO_PUBLIC_ORIGIN);
  assert.ok(!JSON.stringify(result).includes(fixtureKey));
  assert.throws(() => cloudflareProductionBindings({ ...config, STUDIO_D1_DATABASE_ID: "00000000-0000-4000-8000-000000000000" }), /not a placeholder/);
});
