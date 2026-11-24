// Backup of the site's pictures (public/candidates) into Replit App Storage, and restore from it.
// Pictures are kept out of GitHub, so this backup is their safety copy.
//   backups/pictures/latest/<folder>/<file>       the newest copy of every picture
//   backups/pictures/<YYYY-MM-DD>/<folder>/<file>  a dated copy from each backup run
//   backups/pictures/latest/manifest.json         names, sizes and fingerprints (SHA-256) of every file
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { candidatesDir } from "./pictures.js";

const PREFIX = "backups/pictures";
const sha = (b) => createHash("sha256").update(b).digest("hex");
const safeRel = (rel) => /^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/.test(rel) && !rel.includes("..");

export async function listPictureFiles(dir = candidatesDir) {
  const out = [];
  async function walk(sub) {
    let names;
    try { names = await readdir(path.join(dir, sub), { withFileTypes: true }); } catch { return; }
    for (const d of names) {
      const rel = sub ? `${sub}/${d.name}` : d.name;
      if (d.isDirectory()) await walk(rel);
      else if (d.isFile() && safeRel(rel)) out.push(rel);
    }
  }
  await walk("");
  return out.sort();
}

// Copies every picture into App Storage, then reads each copy back and checks its fingerprint.
export async function backupPictures(store, { dir = candidatesDir, date = new Date().toISOString().slice(0, 10) } = {}) {
  const files = await listPictureFiles(dir);
  const manifest = { created: new Date().toISOString(), count: files.length, files: [] };
  for (const rel of files) {
    const bytes = await readFile(path.join(dir, rel));
    const hash = sha(bytes);
    await store.putBytes(`${PREFIX}/latest/${rel}`, bytes);
    await store.putBytes(`${PREFIX}/${date}/${rel}`, bytes);
    manifest.files.push({ path: rel, size: bytes.length, sha256: hash });
  }
  const json = Buffer.from(JSON.stringify(manifest, null, 1));
  await store.putBytes(`${PREFIX}/latest/manifest.json`, json);
  await store.putBytes(`${PREFIX}/${date}/manifest.json`, json);
  const problems = [];
  for (const f of manifest.files) {
    const copy = await store.getBytes(`${PREFIX}/latest/${f.path}`);
    if (!copy || sha(copy) !== f.sha256) problems.push(f.path);
  }
  return { count: files.length, bytes: manifest.files.reduce((n, f) => n + f.size, 0), problems, date };
}

export async function readManifest(store) {
  const bytes = await store.getBytes(`${PREFIX}/latest/manifest.json`);
  return bytes ? JSON.parse(bytes.toString("utf8")) : null;
}

// Puts pictures back from App Storage. By default only missing or changed files are written.
export async function restorePictures(store, { dir = candidatesDir, onlyMissing = true } = {}) {
  const manifest = await readManifest(store);
  if (!manifest) throw new Error("No picture backup found in App Storage.");
  let restored = 0, kept = 0;
  const problems = [];
  for (const f of manifest.files) {
    if (!safeRel(f.path)) { problems.push(f.path); continue; }
    const target = path.join(dir, f.path);
    if (onlyMissing) {
      try { if ((await stat(target)).isFile() && sha(await readFile(target)) === f.sha256) { kept++; continue; } } catch { /* missing: restore it */ }
    }
    const bytes = await store.getBytes(`${PREFIX}/latest/${f.path}`);
    if (!bytes || sha(bytes) !== f.sha256) { problems.push(f.path); continue; }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    restored++;
  }
  return { restored, kept, problems, total: manifest.files.length };
}

// Every picture as zip entries: from the site's folder, or from the backup if the folder is empty.
export async function pictureEntries(store, { dir = candidatesDir } = {}) {
  const files = await listPictureFiles(dir);
  if (files.length) return Promise.all(files.map(async (rel) => ({ name: `samadhi-love-pictures/${rel}`, bytes: await readFile(path.join(dir, rel)) })));
  const manifest = store && await readManifest(store);
  if (!manifest) return [];
  const out = [];
  for (const f of manifest.files) {
    const bytes = await store.getBytes(`${PREFIX}/latest/${f.path}`);
    if (bytes) out.push({ name: `samadhi-love-pictures/${f.path}`, bytes });
  }
  return out;
}
