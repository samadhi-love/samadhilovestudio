import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { studioWorkerSecrets } from "../scripts/worker-secrets.mjs";

const fixtureVault = "01".repeat(32);
const fixtureOtherVault = "02".repeat(32);
const fixtureProviderKey = "fixture-provider-key-not-a-real-credential";
const check = { connection: "connected", musicAccess: "available" };

function loadVault(secrets = {}) {
  const records = new Map();
  let version = 0;
  const bucket = {
    async head(key) { return records.get(key) ?? null; },
    async get(key) { return records.get(key) ?? null; },
    async put(key, bytes, options) {
      const previous = records.get(key);
      if ((options.onlyIf?.etagDoesNotMatch === "*" && previous) ||
          (options.onlyIf?.etagMatches && previous?.etag !== options.onlyIf.etagMatches)) return null;
      const record = {
        etag: `fixture-etag-${++version}`, size: bytes.length,
        customMetadata: options.customMetadata,
        arrayBuffer: async () => bytes.slice().buffer,
      };
      records.set(key, record);
      return record;
    },
    async delete(key) { records.delete(key); },
  };
  const env = { BUCKET: bucket, ...secrets };
  const { outputText } = ts.transpileModule(
    readFileSync(new URL("../app/api/studio/elevenlabs/vault.ts", import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  );
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array,
    require(name) {
      assert.equal(name, "cloudflare:workers");
      return { env };
    },
  });
  return { ...exports, env, records };
}

test("Worker config allowlists vault names without copying secret values or a global provider key", () => {
  const source = { vault: fixtureVault, ELEVENLABS_API_KEY: fixtureProviderKey };
  const config = studioWorkerSecrets("serve", { EXISTING_LOCAL_SETTING: {} }, source);
  assert.deepEqual(config.required, ["EXISTING_LOCAL_SETTING", "vault"]);
  assert.equal(JSON.stringify(config).includes(fixtureVault), false);
  assert.equal(JSON.stringify(config).includes(fixtureProviderKey), false);
  assert.deepEqual(source, { vault: fixtureVault, ELEVENLABS_API_KEY: fixtureProviderKey });
});

test("builds never include local or process secret values", () => {
  assert.deepEqual(studioWorkerSecrets("build", {
    STUDIO_ELEVENLABS_VAULT_KEY: { value: fixtureVault },
  }, { vault: fixtureOtherVault }), { required: [] });
});

test("owner setup forwards only named bindings and only with an explicit owner", () => {
  const source = { STUDIO_OWNER_EMAIL: "owner@example.test", ELEVENLABS_API_KEY: fixtureProviderKey, vault: fixtureVault };
  const config = studioWorkerSecrets("serve", {}, source);
  assert.deepEqual(config.required, ["vault", "STUDIO_OWNER_EMAIL", "ELEVENLABS_API_KEY"]);
  assert.equal(JSON.stringify(config).includes(fixtureProviderKey), false);
  assert.equal(JSON.stringify(config).includes("owner@example.test"), false);
  assert.deepEqual(studioWorkerSecrets("build", {}, source), { required: [] });
});

test("owner disconnect leaves a non-secret marker and manual reconnect can replace it", async () => {
  const vault = loadVault({ vault: fixtureVault });
  await vault.saveElevenLabsKey("owner", fixtureProviderKey, check, false);
  await vault.removeElevenLabsKey("owner", true);
  const { status, etag } = await vault.keyStatus("owner");
  assert.equal(status.saved, false);
  assert.equal(status.connection, "disconnected");
  assert.ok(etag);
  assert.equal(await vault.resolveElevenLabsKey("owner"), null);
  assert.equal([...vault.records.values()][0].size, 0);
  assert.equal(await vault.saveElevenLabsKey("owner", fixtureProviderKey, check, false, etag), true);
  assert.equal(await vault.resolveElevenLabsKey("owner"), fixtureProviderKey);
});

test("the setup alias supports encrypted save, reconnect, reload, and disconnect per creator", async () => {
  const vault = loadVault({ vault: fixtureVault });
  assert.equal((await vault.keyStatus("creator-a")).status.available, true);
  assert.equal(await vault.saveElevenLabsKey("creator-a", fixtureProviderKey, check, false), true);
  assert.equal(await vault.resolveElevenLabsKey("creator-a"), fixtureProviderKey);
  assert.equal(await vault.resolveElevenLabsKey("creator-b"), null);
  const { status, etag } = await vault.keyStatus("creator-a");
  assert.equal(status.saved, true);
  assert.equal(status.connection, "connected");
  assert.equal(await vault.saveElevenLabsKey("creator-a", "fixture-reconnected-key", check, false, etag), true);
  assert.equal(await vault.resolveElevenLabsKey("creator-a"), "fixture-reconnected-key");
  assert.equal(await vault.saveElevenLabsKey("creator-a", "fixture-stale-key", check, false, etag), false);
  for (const record of vault.records.values())
    assert.equal(new TextDecoder().decode(await record.arrayBuffer()).includes(fixtureProviderKey), false);
  await vault.removeElevenLabsKey("creator-a");
  assert.equal((await vault.keyStatus("creator-a")).status.saved, false);
});

test("canonical encryption keys are preserved even when a different setup alias exists", async () => {
  const vault = loadVault({ STUDIO_ELEVENLABS_VAULT_KEY: fixtureVault, vault: fixtureOtherVault });
  await vault.saveElevenLabsKey("creator-a", fixtureProviderKey, check, false);
  delete vault.env.vault;
  assert.equal(await vault.resolveElevenLabsKey("creator-a"), fixtureProviderKey);
  vault.env.vault = fixtureOtherVault;
  vault.env.STUDIO_ELEVENLABS_VAULT_KEY = "invalid-existing-key";
  assert.equal((await vault.keyStatus("creator-a")).status.available, false);
  assert.equal(await vault.resolveElevenLabsKey("creator-a"), null);
});

test("ciphertext cannot be moved to another creator's record", async () => {
  const vault = loadVault({ vault: fixtureVault });
  await vault.saveElevenLabsKey("creator-a", fixtureProviderKey, check, false);
  const record = [...vault.records.values()][0];
  vault.records.set("private/elevenlabs/v1/creator-b", record);
  await assert.rejects(vault.resolveElevenLabsKey("creator-b"));
});

test("missing or malformed vault secrets cannot use the global ElevenLabs key as a fallback", async () => {
  for (const secrets of [{}, { vault: "invalid" }, { ELEVENLABS_API_KEY: fixtureProviderKey }]) {
    const vault = loadVault(secrets);
    assert.equal((await vault.keyStatus("creator-a")).status.available, false);
    assert.equal(await vault.saveElevenLabsKey("creator-a", fixtureProviderKey, check, false), false);
    assert.equal(await vault.resolveElevenLabsKey("creator-a"), null);
  }
});
