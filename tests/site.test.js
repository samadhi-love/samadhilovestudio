import { test } from "node:test";
import assert from "node:assert/strict";
import { categories } from "../lib/content.js";
import { renderMarkdown } from "../lib/md.js";

process.env.PREVIEW_PASSWORD = "test-preview";
delete process.env.SITE_PUBLIC;
const { handle } = await import("../server.js");

function call(path, { auth = true } = {}) {
  return new Promise((resolve) => {
    const req = { url: path, method: "GET", headers: auth ? { authorization: "Basic " + Buffer.from("samadhi:test-preview").toString("base64") } : {} };
    const res = {
      headersSent: false, status: 0, headers: {}, body: "",
      writeHead(status, headers) { this.status = status; this.headers = headers; this.headersSent = true; },
      end(body) { this.body = body ? String(body) : ""; resolve(this); },
    };
    handle(req, res);
  });
}

test("the site is locked without the password", async () => {
  const res = await call("/", { auth: false });
  assert.equal(res.status, 401);
  assert.match(res.headers["WWW-Authenticate"], /Basic/);
  assert.equal(res.headers["X-Robots-Tag"], "noindex, nofollow");
});

test("a wrong password is refused", async () => {
  const res = await new Promise((resolve) => {
    const r = { writeHead(s, h) { this.status = s; this.headers = h; }, end() { resolve(this); } };
    handle({ url: "/", method: "GET", headers: { authorization: "Basic " + Buffer.from("x:wrong").toString("base64") } }, r);
  });
  assert.equal(res.status, 401);
});

test("with no password set at all, the site stays locked", async () => {
  const saved = process.env.PREVIEW_PASSWORD;
  delete process.env.PREVIEW_PASSWORD;
  const res = await call("/");
  process.env.PREVIEW_PASSWORD = saved;
  assert.equal(res.status, 503);
  assert.match(res.body, /locked/);
});

test("every main page opens", async () => {
  for (const path of ["/", "/library", "/music", "/videos", "/gallery", "/about", "/contact"]) {
    const res = await call(path);
    assert.equal(res.status, 200, path);
    assert.match(res.body, /SAMADHI LOVE/, path);
    assert.match(res.body, /<canvas data-sky=/, path);
  }
});

test("each Library tab lists its teachings and each teaching has its own page", async () => {
  for (const c of categories) {
    const tab = await call(`/library?tab=${c.id}`);
    assert.equal(tab.status, 200);
    assert.match(tab.body, new RegExp(`aria-current="page"[^>]*>${c.label.replace("&", "&amp;")}`));
    for (const it of c.items) {
      assert.ok(tab.body.includes(`/teachings/${it.slug}`), it.slug);
      const page = await call(`/teachings/${it.slug}`);
      assert.equal(page.status, 200, it.slug);
      assert.ok(page.body.length > 2000, it.slug);
    }
  }
});

test("slugs are unique and the home page shows five paths", async () => {
  const slugs = categories.flatMap((c) => c.items.map((i) => i.slug));
  assert.equal(new Set(slugs).size, slugs.length);
  const home = await call("/");
  assert.match(home.body, /Five paths of knowledge/);
  assert.match(home.body, /♫ ✧ ❨ Music is for the soul ❩ ✧ ♫/);
});

test("/studio goes to Versual Studio", async () => {
  const res = await call("/studio");
  assert.equal(res.status, 302);
  assert.match(res.headers.Location, /^https:\/\//);
});

test("unknown pages show a friendly 404", async () => {
  const res = await call("/nothing-here");
  assert.equal(res.status, 404);
  assert.match(res.body, /Page not found/);
});

test("pages carry security headers", async () => {
  const res = await call("/");
  assert.match(res.headers["Content-Security-Policy"], /script-src 'self'/);
  assert.equal(res.headers["X-Frame-Options"], "DENY");
});

test("markdown is escaped so content cannot inject code", () => {
  const html = renderMarkdown("Hello <script>alert(1)</script> **bold** [x](javascript:alert(1))");
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /href="javascript/);
  assert.match(html, /<strong>bold<\/strong>/);
});

test("health check works without a password", async () => {
  const res = await call("/healthz", { auth: false });
  assert.equal(res.status, 200);
});

test("static files are served", async () => {
  for (const p of ["/site.css", "/sky.js", "/favicon.svg"]) {
    const res = await call(p);
    assert.equal(res.status, 200, p);
  }
});

test("new pages open: masters gallery, podcasts, credits and the private picture chooser", async () => {
  for (const p of ["/masters", "/podcasts", "/credits", "/choose", "/videos"]) {
    const res = await call(p);
    assert.equal(res.status, 200, p);
  }
  const masters = await call("/masters");
  for (const name of ["Jesus", "Mother Mary", "Archangel Michael", "Gautama Buddha", "Saint Germain", "Kuan Yin"]) assert.match(masters.body, new RegExp(name));
});

test("YouTube links of every common shape are understood", async () => {
  const { youtubeId } = await import("../lib/media.js");
  assert.equal(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ?t=3"), "dQw4w9WgXcQ");
  assert.equal(youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youtubeId("https://example.com/video"), null);
});

test("picture files are only served from inside the candidates folder", async () => {
  const { safeCandidatePath } = await import("../lib/pictures.js");
  assert.equal(safeCandidatePath("/candidates/../server.js"), null);
  assert.equal(safeCandidatePath("/candidates/giza/../../server.js"), null);
  assert.ok(safeCandidatePath("/candidates/giza/giza-1.jpg"));
  const res = await call("/candidates/giza/..%2F..%2Fserver.js");
  assert.equal(res.status, 404);
});

test("the home page keeps its look: no sacred-place backdrop there", async () => {
  const home = await call("/");
  assert.doesNotMatch(home.body, /class="journey"/);
});

test("every teaching with gathered wisdom shows it, and every wisdom entry points to a real teaching", async () => {
  const { wisdomFor } = await import("../lib/wisdom.js");
  const { findTeaching } = await import("../lib/content.js");
  for (const [slug, list] of Object.entries(wisdomFor)) {
    assert.ok(findTeaching(slug), `wisdom for unknown teaching ${slug}`);
    const page = await call(`/teachings/${slug}`);
    assert.match(page.body, /Wisdom from the traditions/, slug);
    for (const [saying, who, where] of list) assert.ok(saying && who && where, slug);
  }
});

test("the archangels each have their own page under Masters & Angels", async () => {
  const tab = await call("/library?tab=masters");
  for (const name of ["Michael", "Gabriel", "Raphael", "Uriel", "Raguel", "Sariel", "Remiel", "Selaphiel", "Jegudiel", "Barachiel", "Jeremiel", "Israfil", "Azrael", "Metatron", "Sandalphon", "Raziel", "Haniel", "Jophiel", "Chamuel", "Zadkiel", "Ariel"]) {
    assert.match(tab.body, new RegExp(`Archangel ${name}`), name);
  }
  const michael = await call("/teachings/archangel-michael");
  assert.match(michael.body, /Who is like God/);
});
