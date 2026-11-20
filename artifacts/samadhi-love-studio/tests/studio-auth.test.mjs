import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import {vmStorage} from "./vm-server-helpers.mjs";

test("the retained build plugin cannot re-enable legacy header or cookie sign-in", () => {
  const source = readFileSync(new URL("../scripts/vite/sites-vite-plugin.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    process: { cwd: () => "/fixture" },
    require(name) {
      if (name === "node:fs/promises") return {};
      if (name === "node:path") return {};
      throw new Error(`Unexpected build-plugin import: ${name}`);
    },
  });
  for (const options of [undefined, { mockAuth: true }, { mockAuth: false }]) {
    const plugin = exports.sites(options);
    assert.equal(plugin.configureServer, undefined, "No authentication middleware may be installed");
    assert.equal(typeof plugin.closeBundle, "function", "Build-asset copying remains intact");
  }
  assert.doesNotMatch(source, /oai-authenticated-user|__sites_local_auth|signin-with-chatgpt/);
});

// Exercise the real bridge without credentials, external calls, or a running Clerk tenant.
function loadBridge({ cookie = "", production = false, publicOrigin, respond = async () => new Response(null, { status: 401 }) } = {}) {
  const calls = [];
  const compile = (file, imports) => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exports = {};
    vm.runInNewContext(outputText, {
      exports, URL, AbortSignal, Response, setTimeout,
      process: { env: { NODE_ENV: production ? "production" : "development" } },
      require(name) {
        if(name.endsWith("/server/storage")&&imports["cloudflare:workers"])return vmStorage(imports["cloudflare:workers"].env);
        if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
        return imports[name];
      },
      fetch: async (url, options) => {
        calls.push({ url, options });
        // Match the Workers constraint that caused signed-in pages to crash.
        assert.ok(["follow", "manual"].includes(options.redirect));
        return respond(url, options);
      },
    });
    return exports;
  };
  const returnPaths = compile("../app/auth-return-path.ts", {});
  const bridge = compile("../app/chatgpt-auth.ts", {
    "next/headers": { headers: async () => new Headers({
      cookie, host: "studio.example",
      "oai-authenticated-user-id": "untrusted-visitor-header",
    }) },
    "next/navigation": { redirect: () => { throw new Error("redirect"); } },
    "./auth-return-path": returnPaths,
    "cloudflare:workers": { env: { STUDIO_PUBLIC_ORIGIN: publicOrigin } },
  });
  return { ...bridge, calls };
}

test("unsigned visitors cannot authenticate through identity headers", async () => {
  const bridge = loadBridge();
  assert.equal(await bridge.getChatGPTUser(), null);
  assert.equal(bridge.calls.length, 0);
});

test("signed-in pages verify cookies using Workers-compatible non-following fetch", async () => {
  const user = { userId: "fixture-user", email: "fixture@example.test", displayName: "Fixture", fullName: null };
  const bridge = loadBridge({
    cookie: "__session=fixture-not-a-real-session",
    respond: async () => Response.json(user),
  });
  assert.equal(JSON.stringify(await bridge.getChatGPTUser()), JSON.stringify(user));
  assert.equal(bridge.calls.length, 1);
  const { url, options } = bridge.calls[0];
  assert.equal(url, "http://127.0.0.1:80/api/replit-auth/session");
  assert.equal(options.redirect, "manual");
  assert.equal(options.cache, "no-store");
  assert.equal(options.headers.cookie, "__session=fixture-not-a-real-session");
  assert.equal(options.headers["oai-authenticated-user-id"], undefined);
});

for (const status of [401, 403]) {
  test(`rejected sessions stay signed out (${status})`, async () => {
    const bridge = loadBridge({
      cookie: "__session=fixture",
      respond: async () => new Response(null, { status }),
    });
    assert.equal(await bridge.getChatGPTUser(), null);
  });
}

for (const status of [302, 307, 503]) {
  test(`redirects and service failures never authenticate a visitor (${status})`, async () => {
    const bridge = loadBridge({
      cookie: "__session=fixture",
      respond: async () => new Response(null, { status, headers: { Location: "https://untrusted.example" } }),
    });
    await assert.rejects(bridge.getChatGPTUser(), /verification is unavailable/);
    assert.equal(bridge.calls.length, status >= 500 ? 2 : 1, "only a service failure is retried, once");
  });
}

test("a brief sign-in service hiccup is retried once, then the verified identity is used", async () => {
  const user = { userId: "fixture-user", email: "fixture@example.test" };
  let first = true;
  const bridge = loadBridge({
    cookie: "__session=fixture",
    respond: async () => {
      if (first) { first = false; throw new TypeError("connection refused"); }
      return Response.json(user);
    },
  });
  assert.equal(JSON.stringify(await bridge.getChatGPTUser()), JSON.stringify(user));
  assert.equal(bridge.calls.length, 2);
});

test("a retried check that is still rejected stays signed out", async () => {
  const statuses = [502, 401];
  const bridge = loadBridge({ cookie: "__session=fixture", respond: async () => new Response(null, { status: statuses.shift() }) });
  assert.equal(await bridge.getChatGPTUser(), null);
});

test("invalid identity responses fail closed", async () => {
  const bridge = loadBridge({
    cookie: "__session=fixture",
    respond: async () => Response.json({ userId: "fixture-user" }),
  });
  await assert.rejects(bridge.getChatGPTUser(), /Invalid verified studio identity/);
});

test("production verifies cookies only against the configured HTTPS auth service", async () => {
  const user = { userId: "fixture-user", email: "fixture@example.test" };
  const bridge = loadBridge({
    cookie: "__session=fixture", production: true, publicOrigin: "https://public.example.test",
    respond: async () => Response.json(user),
  });
  await bridge.getChatGPTUser();
  assert.equal(bridge.calls[0].url, "https://public.example.test/api/replit-auth/session");
  assert.equal(bridge.calls[0].options.headers["x-forwarded-host"], "public.example.test");
  assert.equal(bridge.calls[0].options.redirect, "manual");
});

for (const publicOrigin of [undefined, "http://public.example.test", "https://public.example.test/path", "https://user:password@public.example.test"]) {
  test(`production never falls back to loopback with invalid origin configuration (${publicOrigin ? "invalid" : "missing"})`, async () => {
    const bridge = loadBridge({ cookie: "__session=fixture", production: true, publicOrigin });
    await assert.rejects(bridge.getChatGPTUser());
    assert.equal(bridge.calls.length, 0);
  });
}

function ownerFixture({ user = { userId: "owner-id", email: "owner@example.test" }, email = "owner@example.test", existing, storage = true } = {}) {
  let record = existing;
  let writes = 0;
  const bucket = {
    async get() { return record ? { json: async () => record } : null; },
    async put(key, value, options) {
      assert.equal(key, "private/setup/owner-claim-v1.json");
      assert.equal(options.onlyIf.etagDoesNotMatch, "*");
      if (record) return null;
      writes++; record = JSON.parse(value); return { etag: "fixture" };
    },
  };
  const env = { STUDIO_OWNER_EMAIL: email, BUCKET: storage ? bucket : undefined };
  function compile(file, imports) {
    const { outputText } = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exports = {};
    vm.runInNewContext(outputText, { exports, URL, Response, Date, require(name) {
      if(name.endsWith("/server/storage")&&imports["cloudflare:workers"])return vmStorage(imports["cloudflare:workers"].env);
      assert.ok(name in imports, `Unexpected import: ${name}`); return imports[name];
    } });
    return exports;
  }
  const access = compile("../app/studio-access.ts", {
    "cloudflare:workers": { env },
    "./creator-accounts": { creatorAccount: async () => null, creatorBetaEnabled: () => true },
    "./chatgpt-auth": { getChatGPTUser: async () => user },
  });
  const endpoint = compile("../app/api/studio/claim-owner/route.ts", {
    "cloudflare:workers": { env }, "../../../studio-access": access,
  });
  return { ...access, ...endpoint, writes: () => writes };
}
test("matching verified email requires an explicit owner claim; first signup is not administrator", async () => {
  const f = ownerFixture();
  assert.equal((await f.studioAccess()).role, "subscriber");
  assert.equal((await f.ownerSetup()).claimed, false);
  const result = await f.POST(new Request("https://studio.test/api/studio/claim-owner", {
    method: "POST", headers: { Origin: "https://studio.test" },
  }));
  assert.equal(result.status, 200);
  assert.equal((await f.studioAccess()).role, "owner");
  assert.equal(f.writes(), 1);
  await f.POST(new Request("https://studio.test/api/studio/claim-owner", { method: "POST", headers: { Origin: "https://studio.test" } }));
  assert.equal(f.writes(), 1, "reclaim is idempotent and cannot overwrite");
});
test("unsigned, nonmatching and unconfigured users cannot claim owner", async () => {
  for (const options of [{ user: null }, { user: { userId: "other", email: "other@example.test" } }, { email: "" }]) {
    const f = ownerFixture(options);
    assert.equal(await f.ownerSetup(), null);
    const result = await f.POST(new Request("https://studio.test/api/studio/claim-owner", { method: "POST", headers: { Origin: "https://studio.test" } }));
    assert.equal(result.status, 403);
    assert.equal(f.writes(), 0);
  }
});
test("owner claim rejects cross-origin requests and never replaces a different owner", async () => {
  const f = ownerFixture();
  assert.equal((await f.POST(new Request("https://studio.test/api/studio/claim-owner", { method: "POST", headers: { Origin: "https://attacker.test" } }))).status, 403);
  assert.equal(f.writes(), 0);
  const occupied = ownerFixture({ existing: { userId: "original-account" } });
  assert.equal((await occupied.studioAccess()).role, "subscriber");
  assert.equal((await occupied.ownerSetup()).blocked, true);
  assert.equal((await occupied.POST(new Request("https://studio.test/api/studio/claim-owner", { method: "POST", headers: { Origin: "https://studio.test" } }))).status, 403);
  assert.equal(occupied.writes(), 0);
});
test("owner claim fails explicitly without private storage", async () => {
  const f = ownerFixture({ storage: false });
  assert.equal((await f.POST(new Request("https://studio.test/api/studio/claim-owner", { method: "POST", headers: { Origin: "https://studio.test" } }))).status, 503);
});
