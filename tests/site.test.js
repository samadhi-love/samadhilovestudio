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

test("Samadhi's vision is on the About page and linked from every footer", async () => {
  const about = await call("/about");
  assert.match(about.body, /id="vision"/);
  assert.match(about.body, /a place of light, not of sides/);
  assert.match(about.body, /God gave every soul free will/);
  const home = await call("/");
  assert.match(home.body, /href="\/about#vision"/);
});

test("the encyclopedia sections are in the Library but the home page keeps its five paths", async () => {
  for (const id of ["sages-and-kings", "mystics", "human-story"]) {
    const c = categories.find((x) => x.id === id);
    assert.ok(c && c.items.length >= 8, id);
  }
  const home = await call("/");
  assert.equal((home.body.match(/<article class="card"><canvas class="orb"/g) || []).length, 5);
  assert.ok(!home.body.includes("/library?tab=mystics"));
  const lib = await call("/library?tab=human-story");
  assert.match(lib.body, /Atlantis/);
  for (const slug of ["atlantis", "lemuria-and-mu", "solon-the-lawgiver", "kabir", "socrates"]) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
  }
});

test("Kriya, the masters, the chakras and the 32 paths all have their pages", async () => {
  const kriya = await call("/teachings/kriya-yoga");
  assert.match(kriya.body, /Kriya is the key and the way back home/);
  assert.match(kriya.body, /class="kriya-float" aria-hidden="true"/);
  const masters = await call("/teachings/the-kriya-masters");
  for (const name of ["Mahavatar Babaji", "Lahiri Mahasaya", "Sri Yukteswar", "Sanyal Mahasaya", "Yogananda", "Autobiography of a Yogi", "Satyananda Giri", "Hariharananda", "Prajnanananda"]) assert.ok(masters.body.includes(name), name);
  const med = await call("/teachings/meditation-and-prayer");
  assert.match(med.body, /class="chakra-figure"/);
  assert.match(med.body, /href="\/teachings\/kriya-yoga"/);
  const tab = await call("/library?tab=chakras");
  assert.equal((tab.body.match(/href="\/teachings\/chakra-/g) || []).length, 7);
  const paths = await call("/teachings/the-32-paths-of-wisdom");
  assert.match(paths.body, /thirty-two mysterious Paths of Wisdom/);
});

test("every page carries the golden Om beside the name", async () => {
  for (const p of ["/", "/library", "/about", "/teachings/kriya-yoga"]) assert.match((await call(p)).body, /<span class="om" aria-hidden="true">ॐ<\/span>/, p);
});

test("the Star Family tab has the star nations of light and a calm word on the shadow side", async () => {
  const tab = await call("/library?tab=star-family");
  for (const slug of ["star-nations-of-light", "pleiadians", "arcturians", "sirians", "andromedans", "lyrans", "orions-of-light", "the-shadow-side", "starseeds"]) assert.ok(tab.body.includes(`/teachings/${slug}`), slug);
  const shadow = await call("/teachings/the-shadow-side");
  assert.match(shadow.body, /This is never about people/);
});
