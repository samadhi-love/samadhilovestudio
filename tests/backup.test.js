import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";

process.env.PREVIEW_PASSWORD = "test-preview";
process.env.OWNER_PASSWORD = "owner-test-password";
process.env.STORE_DIR = mkdtempSync(path.join(tmpdir(), "sl-backup-store-"));
delete process.env.SITE_PUBLIC;

const { getStore } = await import("../lib/store.js");
const { backupPictures, restorePictures, readManifest } = await import("../lib/backup.js");
const { makeZip, crc32 } = await import("../lib/zip.js");
const { handle } = await import("../server.js");

function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), "sl-pics-"));
  mkdirSync(path.join(dir, "giza"));
  mkdirSync(path.join(dir, "Pleiades-Upper"));
  writeFileSync(path.join(dir, "giza", "a.jpg"), Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]));
  writeFileSync(path.join(dir, "Pleiades-Upper", "M45.JPG"), Buffer.from("star-bytes"));
  writeFileSync(path.join(dir, "candidates.json"), "[]");
  return dir;
}

function readZip(buf) {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(end + 10);
  let p = buf.readUInt32LE(end + 16);
  const files = {};
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50);
    const crc = buf.readUInt32LE(p + 16), size = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), off = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    const lnlen = buf.readUInt16LE(off + 26);
    const data = buf.subarray(off + 30 + lnlen, off + 30 + lnlen + size);
    assert.equal(crc32(data), crc, name);
    files[name] = data;
    p += 46 + nlen;
  }
  return files;
}

test("the zip maker writes a valid zip with correct checksums", () => {
  const files = readZip(makeZip([{ name: "x/one.txt", bytes: Buffer.from("hello") }, { name: "two.bin", bytes: Buffer.alloc(1000, 7) }]));
  assert.equal(files["x/one.txt"].toString(), "hello");
  assert.equal(files["two.bin"].length, 1000);
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926); // the standard CRC-32 check value
});

test("every picture is copied to storage, checked, and listed in a manifest", async () => {
  const store = await getStore();
  const dir = fixture();
  const r = await backupPictures(store, { dir, date: "2026-11-24" });
  assert.equal(r.count, 3);
  assert.deepEqual(r.problems, []);
  const manifest = await readManifest(store);
  assert.equal(manifest.files.length, 3);
  assert.ok(await store.getBytes("backups/pictures/2026-11-24/Pleiades-Upper/M45.JPG"));
});

test("restore puts back only what is missing, byte for byte", async () => {
  const store = await getStore();
  const dir = fixture();
  await backupPictures(store, { dir });
  rmSync(path.join(dir, "giza"), { recursive: true });
  const r = await restorePictures(store, { dir });
  assert.equal(r.restored, 1);
  assert.equal(r.kept, 2);
  assert.ok(existsSync(path.join(dir, "giza", "a.jpg")));
  assert.deepEqual(readFileSync(path.join(dir, "giza", "a.jpg")), Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]));
});

function call(url, { cookie, method = "GET", body, type } = {}) {
  return new Promise((resolve) => {
    const buf = body ? Buffer.from(body) : null;
    const req = Readable.from(buf ? [buf] : []);
    Object.assign(req, { url, method, headers: { host: "site.test", origin: "https://site.test", authorization: "Basic " + Buffer.from("s:test-preview").toString("base64"), ...(cookie ? { cookie } : {}), ...(type ? { "content-type": type } : {}) } });
    const res = { writeHead(s, h) { this.status = s; this.headers = h; }, end(b) { this.raw = b ? Buffer.from(b) : Buffer.alloc(0); resolve(this); } };
    handle(req, res);
  });
}

test("the pictures zip is only for the signed-in owner, and contains the pictures", async () => {
  const locked = await call("/owner/pictures.zip");
  assert.notEqual(locked.headers["Content-Type"], "application/zip");
  const login = await call("/owner/login", { method: "POST", type: "application/x-www-form-urlencoded", body: "password=owner-test-password" });
  const cookie = login.headers["Set-Cookie"].split(";")[0];
  const res = await call("/owner/pictures.zip", { cookie });
  assert.equal(res.status, 200);
  assert.equal(res.headers["Content-Type"], "application/zip");
  assert.match(res.headers["Content-Disposition"], /samadhi-love-pictures-/);
  const files = readZip(res.raw);
  assert.ok(Object.keys(files).length >= 1);
  assert.ok(Object.keys(files).every((n) => n.startsWith("samadhi-love-pictures/")));
});

test("backdrops use the small copy when it exists, and the original otherwise", async () => {
  const { backdropFor, candidatesDir } = await import("../lib/pictures.js");
  const { mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  const folder = path.join(candidatesDir, "zz-test-backdrop");
  mkdirSync(folder, { recursive: true });
  try {
    writeFileSync(path.join(folder, "a.jpg"), "x");
    assert.equal(backdropFor("candidates/zz-test-backdrop/a.jpg"), "candidates/zz-test-backdrop/a.jpg");
    writeFileSync(path.join(folder, "a.w960.jpg"), "x");
    assert.equal(backdropFor("candidates/zz-test-backdrop/a.jpg"), "candidates/zz-test-backdrop/a.w960.jpg");
    assert.equal(backdropFor(null), null);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
