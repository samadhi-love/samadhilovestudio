// Where the owner's posts, photos and recordings are kept.
// On Replit: Replit App Storage (object storage), so nothing is lost when the site restarts.
// For tests and local trials only: a folder on disk, chosen with STORE_DIR.
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

function fsStore(dir) {
  const full = (key) => {
    if (!/^[A-Za-z0-9][A-Za-z0-9/._-]*$/.test(key) || key.includes("..")) throw new Error("bad key");
    return path.join(dir, key);
  };
  return {
    kind: "folder",
    async getBytes(key) {
      try { return await readFile(full(key)); } catch (err) { if (err.code === "ENOENT") return null; throw err; }
    },
    async putBytes(key, bytes) {
      const file = full(key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, bytes);
    },
    async del(key) {
      try { await unlink(full(key)); } catch (err) { if (err.code !== "ENOENT") throw err; }
    },
  };
}

function unwrap(result, what) {
  if (result && typeof result === "object" && "ok" in result) {
    if (!result.ok) {
      const msg = String(result.error?.message || result.error || "");
      if (/not ?found|no such object|404/i.test(msg)) return null;
      throw new Error(`App Storage ${what} failed: ${msg}`);
    }
    return result.value;
  }
  return result;
}

async function replitStore() {
  const { Client } = await import("@replit/object-storage");
  // STORAGE_BUCKET names the App Storage bucket; without it, the app's default bucket is used.
  const bucketId = process.env.STORAGE_BUCKET;
  const client = bucketId ? new Client({ bucketId }) : new Client();
  return {
    kind: "app-storage",
    async getBytes(key) {
      const value = unwrap(await client.downloadAsBytes(key), "read");
      if (value == null) return null;
      return Buffer.from(Array.isArray(value) ? value[0] : value);
    },
    async putBytes(key, bytes) { unwrap(await client.uploadFromBytes(key, Buffer.from(bytes)), "save"); },
    async del(key) {
      try { unwrap(await client.delete(key, { ignoreNotFound: true }), "delete"); } catch (err) { if (!/not ?found/i.test(err.message)) throw err; }
    },
  };
}

let storePromise = null;

// Returns the store, or null when App Storage is not set up (the owner page then explains what to do).
export function getStore() {
  if (!storePromise) {
    storePromise = (async () => {
      if (process.env.STORE_DIR) return fsStore(process.env.STORE_DIR);
      try { return await replitStore(); } catch (err) {
        console.error("App Storage is not available:", err.message);
        return null;
      }
    })();
  }
  return storePromise;
}

