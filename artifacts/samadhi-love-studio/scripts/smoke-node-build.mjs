// Offline actual-built-server smoke. Uses in-memory fixtures, never real credentials.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { initializeRuntime } from "./storage/runtime.mjs";
const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const tables = [...schema.matchAll(/sqliteTable\("([^"]+)"/g)].map(m => ({ name: m[1] }));
tables.push({name:"studio_catalog_songs"});
const source = { PORT: "3000", STUDIO_CLOUDFLARE_D1_API_TOKEN: "fixture", STUDIO_R2_ACCESS_KEY_ID: "fixture",
  CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_D1_DATABASE_ID: "00000000-0000-4000-8000-000000000001",
  CLOUDFLARE_D1_DATABASE_NAME: "fixture-database", STUDIO_R2_BUCKET_NAME: "fixture-private-bucket",
  STUDIO_PUBLIC_ORIGIN: "https://studio.example.test",
  STUDIO_R2_SECRET_ACCESS_KEY: "fixture", STUDIO_ELEVENLABS_VAULT_KEY: "ab".repeat(32) };
await initializeRuntime(source, {
  DB: { prepare(sql) {
    // Startup reads the schema and also marks stale jobs interrupted; nothing else may run.
    assert.match(sql, /^\s*(SELECT name FROM sqlite_master|UPDATE studio_jobs SET)/, sql);
    const statement = { all: async () => ({ results: /sqlite_master/.test(sql) ? tables : [] }), run: async () => ({ meta: { changes: 0 } }), first: async () => null };
    return { ...statement, bind: () => statement };
  } },
  BUCKET: { checkAccess: async () => {} },
});
process.env.NODE_ENV = "production";
process.env.VINEXT_TRUSTED_HOSTS = "studio.example.test";
const { startProdServer } = await import("vinext/server/prod-server");
const { server, port } = await startProdServer({ port: 0, host: "127.0.0.1", silent: true });
try {
  const origin = `http://127.0.0.1:${port}`;
  for (const [path, expected] of [["/", 200], ["/creator", 200], ["/owner", 200], ["/api/studio", 401], ["/api/studio/elevenlabs", 401]]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, expected, `${path}: ${await response.text()}`);
  }
  // /health says which build is running (fake storage here, so status is 503, but the version is present).
  const health = await (await fetch(origin + "/health")).json();
  assert.match(health.version?.commit ?? "", /^([0-9a-f]{7,}|unknown)$/, "health shows the running commit");
  assert.doesNotMatch(JSON.stringify(health), /fixture|secret|token/i, "health never exposes secrets");
  const response = await fetch(origin + "/api/studio/claim-owner", { method: "POST", headers: { Origin: "https://attacker.test" } });
  assert.equal(response.status, 403);
  const proxied = await fetch(origin + "/api/studio/claim-owner", { method: "POST", headers: {
    Origin: "https://studio.example.test", "X-Forwarded-Host": "studio.example.test", "X-Forwarded-Proto": "https",
  } });
  assert.match(await proxied.text(), /Only the verified account/, "trusted TLS proxy passes same-origin check, then fails owner authorization");
  const forged = await fetch(origin + "/api/studio/claim-owner", { method: "POST", headers: {
    Origin: "https://attacker.test", "X-Forwarded-Host": "attacker.test", "X-Forwarded-Proto": "https",
  } });
  assert.match(await forged.text(), /Open Studio directly/, "untrusted forwarded hosts cannot authorize a save");
  console.info("PASS: actual Node build serves Creator and Owner pages, denies unsigned private API access and rejects forged owner claims. No external service called.");
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
