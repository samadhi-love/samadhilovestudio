import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.PREVIEW_PASSWORD = "test-preview";
process.env.OWNER_PASSWORD = "owner-test-password";
process.env.STORE_DIR = mkdtempSync(path.join(tmpdir(), "sl-store-"));
delete process.env.SITE_PUBLIC;
const { handle } = await import("../server.js");
const { resetOwnerForTests } = await import("../lib/owner.js");

const preview = "Basic " + Buffer.from("samadhi:test-preview").toString("base64");
const HOST = "site.test";

function call(url, { method = "GET", body, type, cookie, origin = `https://${HOST}`, ip = "1.1.1.1", range } = {}) {
  return new Promise((resolve) => {
    const buf = body ? Buffer.from(body) : Buffer.alloc(0);
    const req = Readable.from(buf.length ? [buf] : []);
    Object.assign(req, { url, method, headers: { host: HOST, authorization: preview, "x-forwarded-for": ip,
      ...(type ? { "content-type": type, "content-length": String(buf.length) } : {}),
      ...(cookie ? { cookie } : {}), ...(method === "POST" && origin ? { origin } : {}), ...(range ? { range } : {}) } });
    const res = {
      headersSent: false, status: 0, headers: {}, body: "", raw: null,
      writeHead(status, headers) { this.status = status; this.headers = headers; this.headersSent = true; },
      end(b) { this.raw = b ? Buffer.from(b) : Buffer.alloc(0); this.body = this.raw.toString("utf8"); resolve(this); },
    };
    handle(req, res);
  });
}
const form = (obj) => new URLSearchParams(obj).toString();
const URLENC = "application/x-www-form-urlencoded";

function multipart(fields, files = []) {
  const boundary = "----test" + Math.random().toString(16).slice(2);
  const parts = [];
  for (const [k, v] of Object.entries(fields)) parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  for (const f of files) parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\nContent-Type: ${f.type}\r\n\r\n`), f.bytes, Buffer.from("\r\n"));
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(parts), type: `multipart/form-data; boundary=${boundary}` };
}

// A tiny real JPEG with a GPS-style APP1 (Exif) block that must be removed.
const exif = Buffer.concat([Buffer.from([0xff, 0xe1, 0x00, 0x10]), Buffer.from("Exif\0\0GPS-HERE")]);
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.from([0xff, 0xe0, 0x00, 0x06, 0x4a, 0x46, 0x49, 0x46]), exif, Buffer.from([0xff, 0xda, 0x00, 0x02, 1, 2, 3, 0xff, 0xd9])]);

async function signIn() {
  const res = await call("/owner/login", { method: "POST", type: URLENC, body: form({ password: "owner-test-password" }) });
  assert.equal(res.status, 303);
  return res.headers["Set-Cookie"].split(";")[0];
}

test("the owner page asks for the password and refuses a wrong one", async () => {
  resetOwnerForTests();
  const page = await call("/owner");
  assert.equal(page.status, 200);
  assert.match(page.body, /Owner password/);
  const bad = await call("/owner/login", { method: "POST", type: URLENC, body: form({ password: "nope" }) });
  assert.equal(bad.status, 401);
  assert.equal(bad.headers["Set-Cookie"], undefined);
});

test("after 5 wrong passwords, sign-in is locked even with the right one", async () => {
  resetOwnerForTests();
  for (let i = 0; i < 5; i++) await call("/owner/login", { method: "POST", type: URLENC, body: form({ password: "wrong" + i }), ip: "9.9.9.9" });
  const locked = await call("/owner/login", { method: "POST", type: URLENC, body: form({ password: "owner-test-password" }), ip: "9.9.9.9" });
  assert.equal(locked.status, 429);
  resetOwnerForTests();
});

test("forms from another website are refused", async () => {
  const cookie = await signIn();
  const res = await call("/owner/links", { method: "POST", type: URLENC, body: form({ YouTube: "https://youtube.com/@x" }), cookie, origin: "https://evil.example" });
  assert.equal(res.status, 403);
});

test("a forged session cookie does not get in", async () => {
  const res = await call("/owner", { cookie: "sl_owner=9999999999.abc.forged" });
  assert.match(res.body, /Owner password/);
  assert.doesNotMatch(res.body, /Welcome, Samadhi/);
});

test("the session cookie is locked down", async () => {
  const res = await call("/owner/login", { method: "POST", type: URLENC, body: form({ password: "owner-test-password" }) });
  const c = res.headers["Set-Cookie"];
  for (const flag of ["HttpOnly", "Secure", "SameSite=Strict"]) assert.ok(c.includes(flag), flag);
});

test("Samadhi can post an English teaching with a cover photo, and it shows in its Library tab", async () => {
  const cookie = await signIn();
  const { body, type } = multipart({ kind: "teaching", lang: "en", title: "The Light Within", tab: "teachings", summary: "", body: "## Breathe\n\nThe light is already here.", youtube: "", action: "publish" },
    [{ name: "cover", filename: "me.jpg", type: "image/jpeg", bytes: jpeg }]);
  const saved = await call("/owner/save", { method: "POST", type, body, cookie });
  assert.equal(saved.status, 303, saved.body);
  const tab = await call("/library?tab=teachings");
  assert.match(tab.body, /The Light Within/);
  const slug = /\/teachings\/(the-light-within-[a-f0-9]{6})/.exec(tab.body)[1];
  const page = await call(`/teachings/${slug}`);
  assert.equal(page.status, 200);
  assert.match(page.body, /<h2[^>]*>Breathe<\/h2>/);
  const cover = /src="\/(media\/[a-f0-9]{12}\.jpg)"/.exec(page.body)[1];
  const img = await call("/" + cover);
  assert.equal(img.status, 200);
  assert.equal(img.headers["Content-Type"], "image/jpeg");
  assert.ok(!img.raw.includes(Buffer.from("GPS-HERE")), "photo location data removed");
});

test("an Arabic teaching reads right to left and gets its own Arabic tab", async () => {
  const cookie = await signIn();
  const { body, type } = multipart({ kind: "teaching", lang: "ar", title: "الله محبة", tab: "teachings", body: "النور في داخلك.", action: "publish" });
  assert.equal((await call("/owner/save", { method: "POST", type, body, cookie })).status, 303);
  const tab = await call("/library?tab=arabic");
  assert.match(tab.body, /الله محبة/);
  const slug = /\/teachings\/(post-[a-f0-9]{6})/.exec(tab.body)[1];
  const page = await call(`/teachings/${slug}`);
  assert.match(page.body, /dir="rtl" lang="ar"/);
});

test("drafts and hidden posts stay off the site", async () => {
  const cookie = await signIn();
  const { body, type } = multipart({ kind: "teaching", lang: "en", title: "Secret Draft", tab: "teachings", body: "Not yet.", action: "draft" });
  await call("/owner/save", { method: "POST", type, body, cookie });
  assert.doesNotMatch((await call("/library?tab=teachings")).body, /Secret Draft/);
  const dash = await call("/owner", { cookie });
  assert.match(dash.body, /Secret Draft/);
  assert.match(dash.body, /Draft/);
});

test("videos, podcasts (with a recording) and photos appear on their pages; hide and delete work", async () => {
  const cookie = await signIn();
  const v = multipart({ kind: "video", title: "Sunrise Song", youtube: "https://youtu.be/dQw4w9WgXcQ", note: "" });
  assert.equal((await call("/owner/save", { method: "POST", ...v, cookie })).status, 303);
  assert.match((await call("/videos")).body, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);

  const mp3 = Buffer.concat([Buffer.from("ID3"), Buffer.alloc(200, 1)]);
  const p = multipart({ kind: "podcast", title: "Evening Meditation", note: "", link: "" }, [{ name: "audio", filename: "m.mp3", type: "audio/mpeg", bytes: mp3 }]);
  assert.equal((await call("/owner/save", { method: "POST", ...p, cookie })).status, 303);
  const pods = await call("/podcasts");
  const audio = /<audio controls preload="none" src="\/(media\/[a-f0-9]{12}\.mp3)"/.exec(pods.body)[1];
  const part = await call("/" + audio, { range: "bytes=0-9" });
  assert.equal(part.status, 206);
  assert.equal(part.raw.length, 10);

  const g = multipart({ kind: "photo", caption: "Golden hour" }, [{ name: "photos", filename: "a.jpg", type: "image/jpeg", bytes: jpeg }, { name: "photos", filename: "b.jpg", type: "image/jpeg", bytes: jpeg }]);
  assert.equal((await call("/owner/save", { method: "POST", ...g, cookie })).status, 303);
  const gallery = await call("/gallery");
  assert.equal((gallery.body.match(/class="photo"/g) || []).length, 2);

  // Hide the video, then delete it.
  const dash = await call("/owner", { cookie });
  const id = /href="\/owner\/edit\?id=([a-f0-9]{12})"[\s\S]*?$/.exec(dash.body.split("Sunrise Song")[1])[1];
  await call("/owner/status", { method: "POST", type: URLENC, body: form({ id, to: "hidden" }), cookie });
  assert.doesNotMatch((await call("/videos")).body, /dQw4w9WgXcQ/);
  const ask = await call(`/owner/delete?id=${id}`, { cookie });
  assert.match(ask.body, /Yes, delete forever/);
  await call("/owner/delete", { method: "POST", type: URLENC, body: form({ id }), cookie });
  assert.doesNotMatch((await call("/owner", { cookie })).body, /Sunrise Song/);
});

test("files that are not really photos or recordings are refused", async () => {
  const cookie = await signIn();
  const fake = multipart({ kind: "photo", caption: "" }, [{ name: "photos", filename: "x.jpg", type: "image/jpeg", bytes: Buffer.from("<script>alert(1)</script> not an image") }]);
  const res = await call("/owner/save", { method: "POST", ...fake, cookie });
  assert.equal(res.status, 400);
  assert.match(res.body, /not a JPG, PNG or WebP/);
});

test("social links saved on the owner page show in the footer; bad links are refused", async () => {
  const cookie = await signIn();
  const bad = await call("/owner/links", { method: "POST", type: URLENC, body: form({ Instagram: "javascript:alert(1)" }), cookie });
  assert.equal(bad.status, 400);
  await call("/owner/links", { method: "POST", type: URLENC, body: form({ Instagram: "https://instagram.com/samadhilove", YouTube: "", Facebook: "", TikTok: "", X: "" }), cookie });
  assert.match((await call("/about")).body, /href="https:\/\/instagram\.com\/samadhilove"/);
});

test("the backup export downloads everything as one file", async () => {
  const cookie = await signIn();
  const res = await call("/owner/export", { cookie });
  assert.match(res.headers["Content-Disposition"], /attachment/);
  const data = JSON.parse(res.body);
  assert.ok(data.posts.length >= 3);
});

test("media paths cannot be used to read other files", async () => {
  for (const p of ["/media/../site/posts.json", "/media/site/posts.json", "/media/%2e%2e/x"]) {
    const res = await call(p);
    assert.equal(res.status, 404, p);
  }
});

test("sign out ends the session", async () => {
  const res = await call("/owner/logout", { method: "POST", type: URLENC, body: "" });
  assert.match(res.headers["Set-Cookie"], /Max-Age=0/);
});
