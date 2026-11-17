// Offline actual-built-server smoke. Uses in-memory fixtures, never real credentials.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { initializeRuntime } from "./storage/runtime.mjs";
const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const tables = [...schema.matchAll(/sqliteTable\("([^"]+)"/g)].map(m => ({ name: m[1] }));
const source = { PORT: "3000", STUDIO_CLOUDFLARE_D1_API_TOKEN: "fixture", STUDIO_R2_ACCESS_KEY_ID: "fixture",
  STUDIO_R2_SECRET_ACCESS_KEY: "fixture", STUDIO_ELEVENLABS_VAULT_KEY: "ab".repeat(32) };
await initializeRuntime(source, {
  DB: { prepare(sql) {
    assert.match(sql, /^SELECT name FROM sqlite_master/);
    return { bind: () => ({ all: async () => ({ results: tables }) }) };
  } },
  BUCKET: { checkAccess: async () => {} },
});
process.env.NODE_ENV = "production";
process.env.VINEXT_TRUSTED_HOSTS = "studio.example.test";
const { startProdServer } = await import("vinext/server/prod-server");
const { server, port } = await startProdServer({ port: 0, host: "127.0.0.1", silent: true });
try {
  const origin = `http://127.0.0.1:${port}`;
  for (const [path, expected] of [["/creator", 200], ["/owner", 200], ["/api/studio", 401], ["/api/studio/elevenlabs", 401]]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, expected, `${path}: ${await response.text()}`);
  }
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
