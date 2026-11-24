// The owner's own posts: teachings, videos, podcasts and photos, plus social links.
// Kept in storage as two small JSON files; photos and recordings are kept as separate files.
// The public pages read a copy held in memory, refreshed every 20 seconds.
import { randomBytes } from "node:crypto";
import { getStore } from "./store.js";

const POSTS = "site/posts.json";
const LINKS = "site/links.json";
const TTL = 20_000;

let snapshot = { posts: [], links: {}, loadedAt: 0, ok: true };
let loading = null;

async function readJson(store, key, fallback) {
  const bytes = await store.getBytes(key);
  if (!bytes) return fallback;
  return JSON.parse(bytes.toString("utf8"));
}

export async function refresh({ force = false } = {}) {
  if (!force && Date.now() - snapshot.loadedAt < TTL) return snapshot;
  if (loading) return loading;
  loading = (async () => {
    try {
      const store = await getStore();
      if (!store) { snapshot = { ...snapshot, loadedAt: Date.now(), ok: false }; return snapshot; }
      const posts = await readJson(store, POSTS, []);
      const links = await readJson(store, LINKS, {});
      snapshot = { posts: Array.isArray(posts) ? posts : [], links: links && typeof links === "object" ? links : {}, loadedAt: Date.now(), ok: true };
    } catch (err) {
      console.error("Could not load posts:", err.message);
      snapshot = { ...snapshot, loadedAt: Date.now(), ok: false };
    } finally { loading = null; }
    return snapshot;
  })();
  return loading;
}

// What visitors see: published posts only, newest first.
export function published(kind) {
  return snapshot.posts.filter((p) => p.status === "published" && (!kind || p.kind === kind))
    .sort((a, b) => (b.created || "").localeCompare(a.created || ""));
}
export function allPosts() {
  return [...snapshot.posts].sort((a, b) => (b.updated || b.created || "").localeCompare(a.updated || a.created || ""));
}
export function findPost(id) { return snapshot.posts.find((p) => p.id === id) || null; }
export function findPublishedTeaching(slug) { return published("teaching").find((p) => p.slug === slug) || null; }
export function savedLinks() { return snapshot.links; }
export function storageOk() { return snapshot.ok; }

export async function savePosts(posts) {
  const store = await getStore();
  if (!store) throw new Error("App Storage is not set up");
  await store.putBytes(POSTS, Buffer.from(JSON.stringify(posts, null, 1)));
  snapshot = { ...snapshot, posts, loadedAt: Date.now(), ok: true };
}
export async function saveLinks(links) {
  const store = await getStore();
  if (!store) throw new Error("App Storage is not set up");
  await store.putBytes(LINKS, Buffer.from(JSON.stringify(links, null, 1)));
  snapshot = { ...snapshot, links, loadedAt: Date.now(), ok: true };
}

export function newId() { return randomBytes(6).toString("hex"); }

export function slugFor(title, id) {
  const base = String(title || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return `${base || "post"}-${id.slice(0, 6)}`;
}

// ---- Media files: what is allowed in, checked by the file's own bytes, not its name ----

const kinds = {
  photo: [
    ["jpg", "image/jpeg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
    ["png", "image/png", (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
    ["webp", "image/webp", (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP"],
  ],
  audio: [
    ["mp3", "audio/mpeg", (b) => b.toString("latin1", 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)],
    ["m4a", "audio/mp4", (b) => b.toString("latin1", 4, 8) === "ftyp"],
    ["wav", "audio/wav", (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WAVE"],
    ["ogg", "audio/ogg", (b) => b.toString("latin1", 0, 4) === "OggS"],
  ],
};
export const limits = { photo: 12 * 1024 * 1024, audio: 30 * 1024 * 1024 };

export function sniff(kind, bytes) {
  if (!bytes || bytes.length < 12) return null;
  for (const [ext, type, test] of kinds[kind]) if (test(bytes)) return { ext, type };
  return null;
}

export const mediaTypes = Object.fromEntries(Object.values(kinds).flat().map(([ext, type]) => [ext, type]));

// Removes hidden details from photos, such as the GPS location where a phone photo was taken.
export function stripPhotoData(bytes, ext) {
  try {
    if (ext === "jpg") {
      const out = [bytes.subarray(0, 2)];
      let i = 2;
      while (i + 4 <= bytes.length) {
        if (bytes[i] !== 0xff) break;
        const marker = bytes[i + 1];
        if (marker === 0xda) { out.push(bytes.subarray(i)); return Buffer.concat(out); } // image data follows
        const len = bytes.readUInt16BE(i + 2);
        const isMeta = marker === 0xe1 || (marker >= 0xe2 && marker <= 0xef && marker !== 0xe2) || marker === 0xfe;
        if (!isMeta) out.push(bytes.subarray(i, i + 2 + len));
        i += 2 + len;
      }
      return bytes;
    }
    if (ext === "png") {
      const out = [bytes.subarray(0, 8)];
      let i = 8;
      while (i + 12 <= bytes.length) {
        const len = bytes.readUInt32BE(i);
        const type = bytes.toString("latin1", i + 4, i + 8);
        const end = i + 12 + len;
        if (!["eXIf", "tEXt", "iTXt", "zTXt"].includes(type)) out.push(bytes.subarray(i, end));
        i = end;
        if (type === "IEND") break;
      }
      return Buffer.concat(out);
    }
    if (ext === "webp") {
      const out = [];
      let i = 12;
      while (i + 8 <= bytes.length) {
        const type = bytes.toString("latin1", i, i + 4);
        const len = bytes.readUInt32LE(i + 4);
        const end = i + 8 + len + (len % 2);
        if (type !== "EXIF" && type !== "XMP ") out.push(bytes.subarray(i, Math.min(end, bytes.length)));
        i = end;
      }
      const body = Buffer.concat(out);
      const head = Buffer.alloc(12);
      head.write("RIFF", 0, "latin1"); head.writeUInt32LE(body.length + 4, 4); head.write("WEBP", 8, "latin1");
      if (body.length >= 8 && body.toString("latin1", 0, 4) === "VP8X") body[8] &= ~0x0c; // clear EXIF/XMP flags
      return Buffer.concat([head, body]);
    }
  } catch { /* fall through: keep the file as it is */ }
  return bytes;
}

export async function saveMedia(kind, bytes) {
  const found = sniff(kind, bytes);
  if (!found) throw new Error(kind === "photo" ? "That file is not a JPG, PNG or WebP photo." : "That file is not an MP3, M4A, WAV or OGG recording.");
  if (bytes.length > limits[kind]) throw new Error(kind === "photo" ? "That photo is too large (12 MB at most)." : "That recording is too large (30 MB at most).");
  const clean = kind === "photo" ? stripPhotoData(bytes, found.ext) : bytes;
  const key = `media/${newId()}.${found.ext}`;
  const store = await getStore();
  if (!store) throw new Error("App Storage is not set up");
  await store.putBytes(key, clean);
  return key;
}

export async function deleteMedia(keys) {
  const store = await getStore();
  if (!store) return;
  for (const key of keys) if (key && /^media\/[a-f0-9]{12}\.[a-z0-9]+$/.test(key)) await store.del(key).catch(() => {});
}

const mediaCache = new Map();
let mediaCacheBytes = 0;
export async function readMedia(key) {
  if (!/^media\/[a-f0-9]{12}\.[a-z0-9]+$/.test(key)) return null;
  if (mediaCache.has(key)) return mediaCache.get(key);
  const store = await getStore();
  if (!store) return null;
  const bytes = await store.getBytes(key);
  if (!bytes) return null;
  const file = { bytes, type: mediaTypes[key.split(".").pop()] || "application/octet-stream" };
  if (bytes.length < 3 * 1024 * 1024) {
    mediaCache.set(key, file); mediaCacheBytes += bytes.length;
    while (mediaCacheBytes > 64 * 1024 * 1024) {
      const [oldKey, old] = mediaCache.entries().next().value;
      mediaCache.delete(oldKey); mediaCacheBytes -= old.bytes.length;
    }
  }
  return file;
}

export function resetPostsForTests() { snapshot = { posts: [], links: {}, loadedAt: 0, ok: true }; mediaCache.clear(); mediaCacheBytes = 0; }
