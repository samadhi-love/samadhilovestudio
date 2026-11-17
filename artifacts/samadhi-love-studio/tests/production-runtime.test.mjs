import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { runtimeConfig, storageConfig, initializeRuntime, verifyStorage } from "../scripts/storage/runtime.mjs";
import { D1Http } from "../scripts/storage/d1.mjs";
import { R2PrivateBucket, encodeMetadata, decodeMetadata, MAX_UPLOAD } from "../scripts/storage/r2.mjs";
import { env } from "../scripts/storage/node-bindings.mjs";

const source = { PORT: "19559", STUDIO_CLOUDFLARE_D1_API_TOKEN: "fixture-d1",
  CLOUDFLARE_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_D1_DATABASE_ID: "00000000-0000-4000-8000-000000000001",
  CLOUDFLARE_D1_DATABASE_NAME: "fixture-database", STUDIO_R2_BUCKET_NAME: "fixture-private-bucket",
  STUDIO_PUBLIC_ORIGIN: "https://studio.example.test",
  STUDIO_R2_ACCESS_KEY_ID: "fixture-s3", STUDIO_R2_SECRET_ACCESS_KEY: "fixture-secret",
  STUDIO_ELEVENLABS_VAULT_KEY: "ab".repeat(32), STUDIO_OWNER_EMAIL: "owner@example.test" };
const resources = runtimeConfig(source);
test("unpublished storage setup needs neither a public origin nor a hosting port",()=>{
  for(const origin of [undefined,"","pending","not-a-url"]){
    const config=storageConfig({...source,PORT:undefined,STUDIO_PUBLIC_ORIGIN:origin});
    assert.equal(config.databaseId,source.CLOUDFLARE_D1_DATABASE_ID);
    assert.equal(config.publicOrigin,undefined);
  }
  assert.throws(()=>runtimeConfig({...source,STUDIO_PUBLIC_ORIGIN:undefined}),/STUDIO_PUBLIC_ORIGIN/);
});
test("development sign-in stays on the local verified-session path without a production origin",async()=>{
  const auth=await readFile(new URL("../app/chatgpt-auth.ts",import.meta.url),"utf8");
  const vite=await readFile(new URL("../vite.config.ts",import.meta.url),"utf8");
  assert.match(auth,/if \(process\.env\.NODE_ENV !== "development"\) \{\s*const configured = new URL\(env\.STUDIO_PUBLIC_ORIGIN/);
  assert.doesNotMatch(vite,/runtimeConfig\s*\(/);
});
const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
const tables = [...schema.matchAll(/sqliteTable\("([^"]+)"/g)].map(m => ({ name: m[1] }));
tables.push({name:"studio_catalog_songs"});
function adapters() {
  const calls = [];
  const DB = { prepare(sql) {
    if(/^UPDATE studio_jobs SET status='failed'/.test(sql))return {bind(...params){assert.equal(params.length,4);return {async run(){calls.push("reconcile-stale-jobs");return {meta:{changes:0}};}};}};
    assert.match(sql, /^SELECT name FROM sqlite_master/);
    return { bind(...params) { assert.deepEqual(params, ["table","view"]); return { async all() { calls.push("schema"); return { results: tables }; } }; } };
  } };
  return { DB, BUCKET: { async checkAccess() { calls.push("head-bucket"); } }, calls };
}
test("production requires every credential and validates vault format and allocated port", () => {
  assert.equal(runtimeConfig(source).databaseId, source.CLOUDFLARE_D1_DATABASE_ID);
  for (const name of ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_D1_DATABASE_ID", "CLOUDFLARE_D1_DATABASE_NAME", "STUDIO_R2_BUCKET_NAME"])
    assert.throws(() => runtimeConfig({ ...source, [name]: "" }), new RegExp(name));
  for (const name of ["STUDIO_CLOUDFLARE_D1_API_TOKEN", "STUDIO_R2_ACCESS_KEY_ID", "STUDIO_R2_SECRET_ACCESS_KEY", "STUDIO_ELEVENLABS_VAULT_KEY"])
    assert.throws(() => runtimeConfig({ ...source, [name]: "" }), /Secrets|encryption key/);
  for (const port of ["NaN", "", "0", "65536", "5.5"]) assert.throws(() => runtimeConfig({ ...source, PORT: port }), /PORT/);
  for (const origin of ["http://untrusted.test", "https://user:password@studio.test", "https://studio.test/path", "not-a-url"])
    assert.throws(() => runtimeConfig({ ...source, STUDIO_PUBLIC_ORIGIN: origin }), /HTTPS origin/);
});
test("canonical vault name never silently rotates an existing alias", () => {
  assert.equal(runtimeConfig({ ...source, STUDIO_ELEVENLABS_VAULT_KEY: undefined, vault: "cd".repeat(32) }).vault, "cd".repeat(32));
  assert.throws(() => runtimeConfig({ ...source, STUDIO_ELEVENLABS_VAULT_KEY: "wrong", vault: "cd".repeat(32) }));
});
test("startup checks schema and bucket before reconciling stale job records without schema writes", async () => {
  const a = adapters();
  const result = await initializeRuntime(source, a);
  assert.deepEqual(a.calls, ["schema", "head-bucket", "reconcile-stale-jobs"]);
  assert.equal(env.DB, a.DB);
  assert.equal(result.env.STUDIO_ROW_STORAGE, "verified");
  assert.equal(result.env.STUDIO_CREDITS_ENABLED, undefined);
  assert.equal(result.env.ELEVENLABS_API_KEY, undefined);
  assert.equal(result.env.STUDIO_BILLING_LAUNCH_APPROVED, undefined);
});
test("production cannot be switched back to legacy bundle storage by an environment override",async()=>{
  const result=await initializeRuntime({...source,STUDIO_ROW_STORAGE:"legacy"},adapters());
  assert.equal(result.env.STUDIO_ROW_STORAGE,"verified");
});
test("missing schema fails startup without creating tables or checking media", async () => {
  let bucket = false;
  await assert.rejects(verifyStorage({ prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }) },
    { checkAccess: async () => { bucket = true; } }), /missing: studios/);
  assert.equal(bucket, false);
});
test("D1 binds multilingual and hostile-looking text without SQL interpolation", async () => {
  const calls = [];
  const db = new D1Http({ ...resources, token: "fixture-only", transport: async (url, options) => {
    calls.push({ url, options });
    return Response.json({ success: true, result: [{ success: true, results: [{ content: "مرحبا", revision: 2 }], meta: { changes: 1 } }] });
  } });
  const value = "مرحبا'); DROP TABLE studios;--";
  const row = await db.prepare("SELECT content, revision FROM studios WHERE owner = ?").bind(value).first();
  assert.equal(row.content, "مرحبا");
  assert.deepEqual(JSON.parse(calls[0].options.body), { sql: "SELECT content, revision FROM studios WHERE owner = ?", params: [value] });
  assert.equal(calls[0].options.redirect, "error");
});
test("D1 multi-statement batch makes exactly one request and preserves order", async () => {
  let count = 0;
  const db = new D1Http({ ...resources, token: "fixture", transport: async (_url, options) => {
    count++;
    assert.equal(Array.isArray(JSON.parse(options.body)),false,"Cloudflare rejects bare request arrays");
    assert.equal(JSON.parse(options.body).batch.length, 2);
    return Response.json({ success: true, result: [
      { success: true, meta: { changes: 1 } }, { success: true, results: [{ value: 3 }] },
    ] });
  } });
  const result = await db.batch([db.prepare("UPDATE studios SET revision = ?").bind(3), db.prepare("SELECT 3 AS value")]);
  assert.equal(result[0].meta.changes, 1);
  assert.equal(result[1].results[0].value, 3);
  assert.equal(count, 1);
});
test("D1 ambiguous writes and provider errors are never automatically repeated or leaked", async () => {
  for (const failure of ["network", "http", "json"]) {
    let count = 0;
    const db = new D1Http({ ...resources, token: "secret-fixture", transport: async () => {
      count++;
      if (failure === "network") throw new Error("secret-fixture");
      return failure === "http" ? new Response("secret-fixture", { status: 503 }) : Response.json({ success: false, errors: ["secret-fixture"] });
    } });
    await assert.rejects(db.prepare("UPDATE studios SET revision = ?").bind(1).run(), e => !e.message.includes("secret-fixture"));
    assert.equal(count, 1);
  }
});
test("D1 raw arrays and first-column lookup preserve ORM mapping", async () => {
  const db = new D1Http({ ...resources, transport: async () => Response.json({ success: true, result: [
    { success: true, results: [{ owner: "a", revision: 2 }, { owner: "b", revision: 3 }] },
  ] }) });
  assert.deepEqual(await db.prepare("SELECT owner, revision FROM studios").raw(), [["a", 2], ["b", 3]]);
  assert.equal(await db.prepare("SELECT owner FROM studios").first("owner"), "a");
  assert.throws(() => db.prepare("SELECT ?").bind(undefined));
});
test("R2 metadata preserves camelCase, Arabic, mixed text and HTTP metadata", () => {
  const custom = { checkedAt: "now", musicAccess: "unknown", songTitle: "سلام / Hello", defaultProvider: "elevenlabs" };
  assert.deepEqual(decodeMetadata(encodeMetadata(custom, { contentType: "video/mp4" })), { custom, http: { contentType: "video/mp4" } });
  assert.equal(decodeMetadata({ defaultprovider: "elevenlabs" }).custom.defaultProvider, "elevenlabs");
});
test("R2 private streaming range reads never create public URLs", async () => {
  const seen = [];
  const bucket = new R2PrivateBucket({ ...resources, client: { send: async command => {
    seen.push(command);
    return { ETag: '"etag"', ContentLength: 3, ContentRange: "bytes 1-3/9", ContentType: "audio/mpeg",
      Metadata: encodeMetadata({ songTitle: "سلام" }), Body: { transformToWebStream: () => new Response(new Uint8Array([0, 255, 128])).body } };
  } } });
  const result = await bucket.get("songs/private/id", { range: { offset: 1, length: 3 } });
  assert.equal(seen[0].input.Range, "bytes=1-3");
  assert.equal(result.size, 9);
  assert.equal(result.httpMetadata.contentType, "audio/mpeg");
  assert.deepEqual(new Uint8Array(await result.arrayBuffer()), new Uint8Array([0,255,128]));
});
test("R2 conditional upload uses a private capped tempfile, preserves metadata and cleans up", async () => {
  const before = (await readdir(tmpdir())).filter(f => f.startsWith("studio-upload-"));
  let file;
  const bucket = new R2PrivateBucket({ ...resources, client: { send: async command => {
    assert.equal(command.constructor.name, "PutObjectCommand");
    assert.equal(command.input.IfNoneMatch, "*");
    file = command.input.Body.path;
    assert.equal((await stat(file)).mode & 0o777, 0o600);
    assert.equal(await readFile(file, "utf8"), "مرحبا");
    assert.equal(command.input.ContentLength, Buffer.byteLength("مرحبا"));
    assert.equal(decodeMetadata(command.input.Metadata).custom.songTitle, "مرحبا");
    return { ETag: '"new"' };
  } } });
  const result = await bucket.put("fixture", "مرحبا", { onlyIf: { etagDoesNotMatch: "*" }, customMetadata: { songTitle: "مرحبا" } });
  assert.equal(result.etag, "new");
  await assert.rejects(stat(file), { code: "ENOENT" });
  assert.deepEqual((await readdir(tmpdir())).filter(f => f.startsWith("studio-upload-")), before);
  assert.equal(MAX_UPLOAD, 512 * 1024 * 1024);
});
test("R2 write conflicts return null, failures clean temporary bytes and never retry", async () => {
  for (const code of [412, 503]) {
    let count = 0, file;
    const bucket = new R2PrivateBucket({ ...resources, client: { send: async command => {
      count++; file = command.input.Body.path;
      throw Object.assign(new Error("sensitive-provider-response"), { $metadata: { httpStatusCode: code } });
    } } });
    if (code === 412) assert.equal(await bucket.put("fixture", "data"), null);
    else await assert.rejects(bucket.put("fixture", "data"), e => !e.message.includes("sensitive-provider-response"));
    assert.equal(count, 1);
    await assert.rejects(stat(file), { code: "ENOENT" });
  }
});
test("R2 lists requested metadata without losing casing, multilingual text or pagination", async () => {
  const calls = [];
  const bucket = new R2PrivateBucket({ ...resources, client: { send: async command => {
    calls.push(command);
    if (command.constructor.name === "ListObjectsV2Command") return {
      Contents: [{ Key: "song/a", Size: 9 }], IsTruncated: true, NextContinuationToken: "next-page",
    };
    return { ETag: '"test"', ContentLength: 9, Metadata: encodeMetadata({ createdAt: "now", songTitle: "سلام" }) };
  } } });
  const result = await bucket.list({ prefix: "song/", include: ["customMetadata"], cursor: "previous", limit: 25 });
  assert.equal(calls[0].input.ContinuationToken, "previous");
  assert.equal(result.objects[0].customMetadata.songTitle, "سلام");
  assert.equal(result.objects[0].customMetadata.createdAt, "now");
  assert.equal(result.cursor, "next-page");
  assert.equal(result.truncated, true);
  calls.length = 0;
  await bucket.list({ prefix: "song/" });
  assert.equal(calls.length, 1, "cleanup scans need not HEAD every object");
});
test("preview is emulated, production has no Worker gateway and no automatic retention scheduler", async () => {
  const config = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
  const startup = await readFile(new URL("../scripts/start-production.mjs", import.meta.url), "utf8");
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(config, /command === "build"[\s\S]*node-bindings/);
  assert.match(startup, /initializeRuntime/);
  assert.match(startup, /startProdServer[\s\S]*0\.0\.0\.0/);
  assert.doesNotMatch(startup, /gateway|wrangler|createGateway/);
  assert.doesNotMatch(worker, /scheduled\(|runSongRetention/);
});
