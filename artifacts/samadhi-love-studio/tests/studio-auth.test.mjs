import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

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
      exports, URL, AbortSignal,
      process: { env: { NODE_ENV: production ? "production" : "development" } },
      require(name) {
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
    assert.equal(bridge.calls.length, 1);
  });
}

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
