import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function compile(file, imports) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, Request, Response, Headers, URL, TextDecoder, crypto, Error,
    require(name) { assert.ok(name in imports, `Unexpected import: ${name}`); return imports[name]; },
  });
  return exports;
}

function fixture(metered) {
  const settled = [];
  const requests = compile("../app/api/studio/request-errors.ts", { "./store": { privateHeaders: {} } });
  class CreditError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
  const api = compile("../app/credits/production.ts", {
    "cloudflare:workers": { env: { STUDIO_CREDITS_ENABLED: metered ? "1" : undefined } },
    "../studio-access": { privateWorkspace: async () => ({ id: "fixture-owner", role: "owner" }) },
    "../api/studio/store": { privateHeaders: {}, readStudio: async () => ({ data: { songs: [] } }) },
    "../api/studio/request-errors": requests,
    "./data": { creditPrice: () => 0 },
    "./account-ledger": {
      CreditError, managedAvailable: () => false,
      ensureCreditAccount: async () => ({ funding: "own" }),
      reserveJob: async () => ({ id: "fixture-job", funding: "own", credits: 0 }),
      settleJob: async (...args) => { settled.push(args); },
    },
  });
  return { ...api, settled };
}

function wrappedRequest(body, extraHeaders = {}) {
  const native = new Request("https://studio.test/api/studio/create", {
    method: "POST",
    headers: {
      Origin: "https://studio.test", "Content-Type": "application/json",
      Cookie: "__session=fixture-not-real", "X-Studio-Workspace": "fixture-owner",
      "X-Samadhi-Production-Funding": "studio", ...extraHeaders,
    },
    body,
  });
  // Reproduce the framework boundary: Request-shaped, but not accepted as a
  // native Request constructor input by the other runtime.
  return {
    url: native.url, method: native.method, headers: native.headers,
    get body() { return native.body; },
    clone: () => native.clone(),
  };
}

for (const metered of [false, true]) {
  test(`foreign request wrappers preserve the JSON and security headers (metered=${metered})`, async () => {
    const api = fixture(metered);
    const input = { action: "song", duration: 30, lyrics: "نور / A new beginning" };
    let received = 0;
    const handler = api.withProductionUsage(async request => {
      received++;
      assert.ok(request instanceof Request);
      assert.equal(request.method, "POST");
      assert.equal(request.url, "https://studio.test/api/studio/create");
      assert.equal(request.headers.get("origin"), "https://studio.test");
      assert.equal(request.headers.get("cookie"), "__session=fixture-not-real");
      assert.equal(request.headers.get("X-Studio-Workspace"), "fixture-owner");
      assert.equal(request.headers.get("X-Samadhi-Production-Funding"), "own");
      assert.deepEqual(await request.json(), input);
      return Response.json({ saved: true });
    });
    const response = await handler(wrappedRequest(JSON.stringify(input)));
    assert.equal(response.status, 200);
    assert.equal(received, 1);
    assert.equal(api.settled.length, metered ? 1 : 0);
    if (metered) assert.equal(api.settled[0][2], false);
  });
}

test("unmetered handoff rejects oversized bodies before the handler can process them", async () => {
  const api = fixture(false);
  let calls = 0;
  const handler = api.withProductionUsage(async () => { calls++; return Response.json({}); });
  await assert.rejects(handler(wrappedRequest("x".repeat(80_001))), /too large/);
  assert.equal(calls, 0);
});
