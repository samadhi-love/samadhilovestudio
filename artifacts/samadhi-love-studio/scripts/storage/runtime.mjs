import { resourceConfig } from "./resources.mjs";
import { D1Http } from "./d1.mjs";
import {recoverStaleJobs} from "./jobs.mjs";
import { R2PrivateBucket } from "./r2.mjs";
import { readFile } from "node:fs/promises";
import { TransformStream } from "node:stream/web";

// Storage setup is independent of hosting. In particular, an unpublished app
// has no production origin yet; diagnostics/migrations must not invent one.
export function storageConfig(source = process.env) {
  const resources = resourceConfig(source);
  const names = ["STUDIO_CLOUDFLARE_D1_API_TOKEN", "STUDIO_R2_ACCESS_KEY_ID", "STUDIO_R2_SECRET_ACCESS_KEY"];
  for (const name of names) if (!source[name]?.trim()) throw new Error(`Add ${name} in Replit Secrets before starting production.`);
  // Keep the established encryption identity. Never generate or rotate here.
  const vault = source.STUDIO_ELEVENLABS_VAULT_KEY ?? source.vault;
  if (!/^[a-f0-9]{64}$/i.test(vault ?? "")) throw new Error("STUDIO_ELEVENLABS_VAULT_KEY must be the existing stable 64-hex-character encryption key.");
  return {...resources,token:source.STUDIO_CLOUDFLARE_D1_API_TOKEN,
    accessKeyId:source.STUDIO_R2_ACCESS_KEY_ID,secretAccessKey:source.STUDIO_R2_SECRET_ACCESS_KEY,vault};
}
export function runtimeConfig(source = process.env) {
  const storage=storageConfig(source);
  const port = Number(source.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid allocated port.");
  const publicOrigin = source.STUDIO_PUBLIC_ORIGIN;
  let origin;
  try { origin = new URL(publicOrigin); } catch { throw new Error("STUDIO_PUBLIC_ORIGIN must be a valid HTTPS origin."); }
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash)
    throw new Error("STUDIO_PUBLIC_ORIGIN must be a valid HTTPS origin.");
  return {...storage,port,publicOrigin:origin.origin};
}
export async function verifyStorage(DB, BUCKET) {
  const schema = await readFile(new URL("../../db/schema.ts", import.meta.url), "utf8");
  const expected = [...schema.matchAll(/sqliteTable\("([^"]+)"/g)].map(m => m[1]);
  expected.push("studio_catalog_songs");
  const rows = await DB.prepare("SELECT name FROM sqlite_master WHERE type IN (?,?)").bind("table","view").all();
  const present = new Set(rows.results.map(r => r.name));
  const missing = expected.filter(name => !present.has(name));
  if (missing.length) throw new Error(`Existing D1 schema is missing: ${missing.join(", ")}. Startup will not create or migrate tables.`);
  await BUCKET.checkAccess();
}
export async function initializeRuntime(source = process.env, adapters) {
  const config = runtimeConfig(source);
  const DB = adapters?.DB ?? new D1Http(config);
  const BUCKET = adapters?.BUCKET ?? new R2PrivateBucket(config);
  await verifyStorage(DB, BUCKET);
  await recoverStaleJobs(DB);
  // Owner explicitly restored legacy saving. Per-song data is preserved but
  // never copied or made active by startup.
  // Production cannot silently activate project-funded generation or billing.
  const env = { DB, BUCKET, STUDIO_ROW_STORAGE: "legacy", STUDIO_OWNER_EMAIL: source.STUDIO_OWNER_EMAIL,
    STUDIO_ELEVENLABS_VAULT_KEY: config.vault, STUDIO_PUBLIC_ORIGIN: config.publicOrigin,
    STUDIO_CREATOR_BETA: "1" };
  globalThis[Symbol.for("samadhi.node.bindings")] = env;
  if (!globalThis.FixedLengthStream) globalThis.FixedLengthStream = class extends TransformStream {
    constructor(expected) {
      let count = 0;
      super({ transform(chunk, controller) {
        count += chunk.byteLength;
        if (count > expected) throw new Error("Upload exceeds declared size.");
        controller.enqueue(chunk);
      }, flush() { if (count !== expected) throw new Error("Upload did not match declared size."); } });
    }
  };
  return { config, env };
}
