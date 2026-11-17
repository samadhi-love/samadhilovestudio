// Opt-in only. Never invoked by offline verification or application startup.
import assert from "node:assert/strict";
import { randomUUID, webcrypto } from "node:crypto";
import { storageConfig, verifyStorage } from "./storage/runtime.mjs";
import { D1Http } from "./storage/d1.mjs";
import { R2PrivateBucket } from "./storage/r2.mjs";

const modes = process.argv.slice(2);
if (process.env.STUDIO_RUN_LIVE_STORAGE_CHECKS !== "yes" || !modes.some(v => ["--d1", "--r2", "--vault"].includes(v))) {
  console.info("SKIPPED. Owner must explicitly set STUDIO_RUN_LIVE_STORAGE_CHECKS=yes and choose --d1, --r2 or --vault. No live requests made.");
} else {
  try {
    const config = storageConfig();
    const DB = new D1Http(config), BUCKET = new R2PrivateBucket(config);
    if (modes.includes("--d1")) {
      await verifyStorage(DB, BUCKET);
      console.info("PASS: D1 tables and private bucket access checked read-only; no schema or user records changed.");
    }
    if (modes.includes("--vault")) {
      const iv = webcrypto.getRandomValues(new Uint8Array(12));
      const key = await webcrypto.subtle.importKey("raw", Buffer.from(config.vault, "hex"), "AES-GCM", false, ["encrypt", "decrypt"]);
      const params = { name: "AES-GCM", iv, additionalData: new TextEncoder().encode("studio-owner-opt-in-vault-check") };
      const dummy = new TextEncoder().encode("dummy-not-an-elevenlabs-key");
      const encrypted = await webcrypto.subtle.encrypt(params, key, dummy);
      assert.deepEqual(new Uint8Array(await webcrypto.subtle.decrypt(params, key, encrypted)), dummy);
      console.info("PASS: configured vault key encrypted and decrypted dummy text in memory; no saved credentials touched.");
    }
    if (modes.includes("--r2")) {
      if (!modes.includes("--allow-temp-cleanup")) throw new Error("R2 test requires --allow-temp-cleanup to authorize deleting only its new temporary test object.");
      const key = `private/diagnostics/owner-opt-in/${randomUUID()}`;
      let created = false;
      try {
        const result = await BUCKET.put(key, "سلام / Hello", { onlyIf: { etagDoesNotMatch: "*" }, customMetadata: { songTitle: "سلام / Hello", checkAt: "owner-opt-in" } });
        assert.ok(result); created = true;
        const saved = await BUCKET.get(key);
        assert.equal(await saved.text(), "سلام / Hello");
        assert.equal(saved.customMetadata.songTitle, "سلام / Hello");
        console.info("PASS: private temporary media and multilingual metadata roundtrip.");
      } finally { if (created) await BUCKET.delete(key); }
    }
  } catch {
    console.error("Live check failed. Check configured secret names, D1 schema and bucket-scoped permissions. No provider processing or automatic retry occurred.");
    process.exitCode = 1;
  }
}
