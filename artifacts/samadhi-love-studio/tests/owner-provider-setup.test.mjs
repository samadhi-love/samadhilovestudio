import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import {vmStorage,vmAI} from "./vm-server-helpers.mjs";

function compile(file, imports, globals = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, ...globals,
    require(name) {
      if(name.endsWith("/server/storage")&&imports["cloudflare:workers"])return vmStorage(imports["cloudflare:workers"].env);
      if(name.endsWith("/server/ai-provider")&&globals.fetch)return vmAI(globals.fetch);
      assert.ok(name in imports, `Unexpected import: ${name}`); return imports[name];
    },
  });
  return exports;
}

function setup({ role = "owner", configured = true, etag, available = true, accepted = true } = {}) {
  const calls = { reads: 0, checks: 0, saves: [] };
  const env = { ELEVENLABS_API_KEY: "fixture-not-a-real-key", ...(configured ? { STUDIO_OWNER_EMAIL: "owner@example.test" } : {}) };
  const api = compile("../app/api/studio/elevenlabs/owner-connection.ts", {
    "cloudflare:workers": { env },
    "./provider": { testElevenLabsAccount: async () => {
      calls.checks++;
      return { connection: accepted ? "connected" : "error", musicAccess: "unknown", error: accepted ? undefined : "Fixture account permission denied" };
    } },
    "./vault": {
      validElevenLabsKey: () => true,
      keyStatus: async () => { calls.reads++; return { status: { available }, etag }; },
      saveElevenLabsKey: async (...args) => { calls.saves.push(args); return true; },
    },
  });
  return { ...api, calls, run: () => api.prepareOwnerConnection({ role, id: "fixture-account" }) };
}

for (const role of ["guest", "subscriber", "creator"]) {
  test(`${role} cannot attach or inspect the owner's project credential`, async () => {
    const api = setup({ role });
    await api.run();
    assert.equal(api.calls.reads, 0);
    assert.equal(api.calls.checks, 0);
    assert.equal(api.calls.saves.length, 0);
  });
}
test("owner bootstrap is disabled without an explicitly configured owner", async () => {
  const api = setup({ configured: false });
  await api.run();
  assert.equal(api.calls.checks, 0);
  assert.equal(api.calls.saves.length, 0);
});
test("owner setup copies the key only through the encrypted vault without claiming music verification", async () => {
  const api = setup();
  await api.run();
  assert.equal(api.calls.checks, 1);
  assert.equal(api.calls.saves.length, 1);
  assert.equal(api.calls.saves[0][0], "fixture-account");
  assert.equal(api.calls.saves[0][2].musicAccess, "unknown");
  assert.equal(api.calls.saves[0][3], false);
});
test("existing records, including disconnect markers, are never overwritten or retested", async () => {
  const api = setup({ etag: "existing-record" });
  await api.run();
  assert.equal(api.calls.checks, 0);
  assert.equal(api.calls.saves.length, 0);
});
test("failed account checks do not save a falsely connected credential", async () => {
  const api = setup({ accepted: false });
  await assert.rejects(api.run(), /account permission denied/);
  assert.equal(api.calls.saves.length, 0);
});
test("setup fails explicitly without the existing encryption store", async () => {
  const api = setup({ available: false });
  await assert.rejects(api.run(), /secure credential store/);
  assert.equal(api.calls.checks, 0);
});
test("the real owner probe performs exactly one read-only subscription request, no music or speech", async () => {
  const calls = [];
  const api = compile("../app/api/studio/elevenlabs/provider.ts", {
    "./music-sdk": {
      isSdkMusicPath: () => false,
      sdkMusicRequest: () => { throw new Error("No generation is allowed"); },
    },
  }, {
    AbortSignal, Date, Response,
    fetch: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ tier: "creator", character_count: 0, character_limit: 100 });
    },
  });
  const status = await api.testElevenLabsAccount("fixture-not-real");
  assert.equal(status.connection, "connected");
  assert.equal(status.musicAccess, "unknown");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.elevenlabs.io/v1/user/subscription");
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.body, undefined);
});

test("Settings Test connection is GET-only and never falsely verifies feature permissions", async () => {
  const calls = [];
  const api = compile("../app/api/studio/elevenlabs/provider.ts", {
    "./music-sdk": { isSdkMusicPath: () => false, sdkMusicRequest: () => { throw new Error("No paid calls"); } },
  }, { AbortSignal, Date, Response, fetch: async (url, options) => {
    calls.push({ url, options });
    return Response.json({ tier: "creator", character_count: 0, character_limit: 100 });
  } });
  const status = await api.testElevenLabs("fixture-key");
  assert.equal(status.connection, "connected");
  assert.equal(status.musicAccess, "unknown");
  for (const feature of ["music", "alignment", "stems"]) {
    assert.equal(status.capabilities[feature].state, "unknown");
    assert.match(status.capabilities[feature].reason, /permission/i);
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.body, undefined);
  assert.match(calls[0].url, /\/user\/subscription$/);
});
