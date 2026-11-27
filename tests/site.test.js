import { test } from "node:test";
import assert from "node:assert/strict";
import { categories } from "../lib/content.js";
import { renderMarkdown } from "../lib/md.js";

process.env.PREVIEW_PASSWORD = "test-preview";
delete process.env.SITE_PUBLIC;
const { handle } = await import("../server.js");

function call(path, { auth = true, headers = {} } = {}) {
  return new Promise((resolve) => {
    const req = { url: path, method: "GET", headers: { ...(auth ? { authorization: "Basic " + Buffer.from("samadhi:test-preview").toString("base64") } : {}), ...headers } };
    const res = {
      headersSent: false, status: 0, headers: {}, body: "",
      writeHead(status, headers) { this.status = status; this.headers = headers; this.headersSent = true; },
      end(body) { this.raw = body ? Buffer.from(body) : Buffer.alloc(0); this.body = body ? String(body) : ""; resolve(this); },
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
    assert.match(tab.body, new RegExp(`aria-current="page"[^>]*>${c.label.replace("&", "&amp;").replace("'", "&#39;")}`));
    for (const it of c.items) {
      assert.ok(tab.body.includes(`/teachings/${it.slug}`), it.slug);
      const page = await call(`/teachings/${it.slug}`);
      assert.equal(page.status, 200, it.slug);
      assert.ok(page.body.length > 2000, it.slug);
    }
  }
});

test("slugs are unique and the home page shows the five families", async () => {
  const slugs = categories.flatMap((c) => c.items.map((i) => i.slug));
  assert.equal(new Set(slugs).size, slugs.length);
  const home = await call("/");
  assert.match(home.body, /Five families of knowledge/);
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

test("new pages open: masters gallery, podcasts, credits and videos", async () => {
  for (const p of ["/masters", "/podcasts", "/credits", "/videos"]) {
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

test("the encyclopedia sections are in the Library and in the home page families", async () => {
  for (const id of ["sages-and-kings", "mystics", "human-story"]) {
    const c = categories.find((x) => x.id === id);
    assert.ok(c && c.items.length >= 8, id);
  }
  const home = await call("/");
  assert.equal((home.body.match(/<article class="card family-card"><canvas class="orb"/g) || []).length, 5);
  const grid = home.body.slice(home.body.indexOf("Five families of knowledge"), home.body.indexOf('<section class="quote">'));
  for (const id of ["teachings", "mystics", "chakras", "human-story", "ages-of-the-world", "prayers"]) assert.ok(grid.includes(`/library?tab=${id}`), `home family cards link ${id}`);
  for (const tab of ["sages-and-kings", "mystics", "human-story", "chakras"]) assert.match(home.body, new RegExp(`<nav class="nav[^]*href="/library\\?tab=${tab}"`), `menu links to ${tab}`);
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
  const medArticle = med.body.slice(med.body.indexOf("<article"), med.body.indexOf('<nav class="next"'));
  assert.match(medArticle, /<a href="\/teachings\/kriya-yoga">Kriya Yoga: The Science of the Soul<\/a>/);
  assert.match(medArticle, /<a href="\/teachings\/the-kriya-masters">The Masters of Kriya Yoga<\/a>/);
  assert.match(medArticle, /<a href="\/teachings\/the-seven-chakras">The Seven Chakras<\/a>/);
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

test("no teaching shows an unclickable link, and every 'see *Title*' reference is a working link", async () => {
  for (const c of categories) for (const it of c.items) {
    const page = await call(`/teachings/${it.slug}`);
    const article = page.body.slice(page.body.indexOf("<article"), page.body.indexOf("</article>"));
    const text = article.replace(/<[^>]+>/g, "");
    assert.doesNotMatch(text, /\]\((https?:|\/|#)/, `${it.slug} shows a raw [label](link)`);
    for (const m of String(it.body).matchAll(/[Ss]ee(?: also)? \*([^*]+)\*/g)) {
      const link = new RegExp(`<a href="(/teachings/[a-z0-9-]+)"><em>${m[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "&#39;")}</em></a>`).exec(article);
      assert.ok(link, `${it.slug}: "see ${m[1]}" is not a link`);
      assert.equal((await call(link[1])).status, 200, `${it.slug}: ${link[1]} is broken`);
    }
    for (const m of article.matchAll(/href="(\/teachings\/[a-z0-9-]+)"/g)) assert.equal((await call(m[1])).status, 200, `${it.slug} links to missing ${m[1]}`);
  }
});

test("the picture chooser is private: only the signed-in owner can open it", async () => {
  const pub = await call("/choose");
  assert.equal(pub.status, 302);
  assert.equal(pub.headers.Location, "/owner/choose");
  const owner = await call("/owner/choose");
  assert.doesNotMatch(owner.body, /Choose your pictures/);
});

test("search engines: robots.txt, sitemap, canonical links, share previews and full descriptions", async () => {
  const robots = await call("/robots.txt", { auth: false });
  assert.equal(robots.status, 200);
  assert.match(robots.body, /Disallow: \//, "a private preview asks search engines to stay away");
  const map = await call("/sitemap.xml");
  assert.match(map.body, /<urlset/);
  assert.match(map.body, /\/teachings\/kriya-yoga</);
  assert.doesNotMatch(map.body, /\/owner|\/choose/);
  const lib = await call("/library");
  assert.match(lib.body, /<link rel="canonical" href="[^"]*\/library\?tab=teachings">/);
  assert.match(lib.body, /<meta property="og:url"/);
  assert.match(lib.body, /<meta name="twitter:card"/);
  const masters = await call("/masters");
  const mastersTab = await call("/library?tab=masters");
  const title = (r) => /<title>([^<]*)<\/title>/.exec(r.body)[1];
  assert.notEqual(title(masters), title(mastersTab));
  for (const p of ["/music", "/gallery", "/teachings/archangel-selaphiel", "/teachings/archangel-barachiel", "/teachings/archangel-haniel", "/teachings/archangel-ariel"]) {
    const d = /<meta name="description" content="([^"]*)"/.exec((await call(p)).body)[1];
    assert.ok(d.length >= 60, `${p} description is too short: ${d}`);
  }
});

test("speed: the full Sanskrit-style font loads only where Sanskrit lettering is used", async () => {
  const kriya = await call("/teachings/kriya-yoga");
  assert.match(kriya.body, /family=Tiro\+Devanagari\+Sanskrit:ital@0;1/);
  for (const p of ["/", "/about", "/teachings/unity"]) {
    const page = await call(p);
    assert.doesNotMatch(page.body, /family=Tiro\+Devanagari\+Sanskrit:ital/, p);
    assert.match(page.body, /family=Tiro\+Devanagari\+Sanskrit&text=%E0%A5%90/, `${p} still loads the ॐ glyph`);
  }
});

test("each star family page has its original artwork, and the Federation page tells its real history", async () => {
  for (const slug of ["lyrans", "pleiadians", "sirians", "arcturians", "andromedans", "orions-of-light", "hathors", "essassani", "humans", "galactic-federation-of-light", "star-nations-of-light", "the-shadow-side"]) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    // Samadhi turned the seven portraits back on (Nov 2026).
    if (["sirians", "andromedans", "arcturians", "orions-of-light", "pleiadians", "lyrans", "humans"].includes(slug)) assert.match(page.body, new RegExp(`<figure class="star-art star-portrait tall"><img src="/images/star-families/${slug}\\.jpg"`), slug);
    else if (slug === "galactic-federation-of-light") assert.match(page.body, /<figure class="star-art star-portrait"><img src="\/images\/galactic-federation\.jpg"/, slug);
    else assert.match(page.body, /<figure class="star-art"><svg/, slug);
    assert.doesNotMatch(page.body, /\{\{[a-z0-9-]+\}\}/, slug);
  }
  const gfl = await call("/teachings/galactic-federation-of-light");
  for (const fact of ["Van Tassel", "Law of One", "Confederation of Planets", "Sheldan Nidle", "Haim Eshed", "free will"]) assert.ok(gfl.body.includes(fact), fact);
});

test("the chakra illustration is served and shown with a description", async () => {
  const img = await call("/images/chakras.jpg");
  assert.equal(img.status, 200);
  assert.equal(img.headers["Content-Type"], "image/jpeg");
  for (const p of ["/teachings/the-seven-chakras", "/teachings/meditation-and-prayer"]) {
    const page = await call(p);
    assert.match(page.body, /<img src="\/images\/chakras\.jpg"[^>]*alt="A person seated in meditation/, p);
  }
});

test("weight: pages and files are sent compressed, and unchanged files are not sent twice", async () => {
  const zlib = await import("node:zlib");
  const plain = await call("/teachings/lyrans");
  const gz = await call("/teachings/lyrans", { headers: { "accept-encoding": "gzip, deflate" } });
  assert.equal(gz.headers["Content-Encoding"], "gzip");
  assert.equal(zlib.gunzipSync(gz.raw).toString(), plain.body);
  assert.ok(gz.raw.length < plain.body.length / 3, "compressed page is much smaller");
  const br = await call("/site.css", { headers: { "accept-encoding": "br" } });
  assert.equal(br.headers["Content-Encoding"], "br");
  const etag = br.headers.ETag;
  assert.ok(etag);
  const again = await call("/site.css", { headers: { "if-none-match": etag } });
  assert.equal(again.status, 304);
  const img = await call("/images/chakras.jpg", { headers: { "accept-encoding": "gzip" } });
  assert.equal(img.headers["Content-Encoding"], undefined, "photos are already compressed");
});

test("a small golden ॐ sits beside each teaching's name in an open tab, not in the menu or the tab buttons", async () => {
  const page = await call("/library?tab=mystics");
  const menu = page.body.match(/<div class="nav-links">[\s\S]*?<\/div>/)[0];
  assert.doesNotMatch(menu, /om-mini/);
  const tabs = page.body.match(/<nav class="tabs"[\s\S]*?<\/nav>/)[0];
  assert.doesNotMatch(tabs, /om-mini/);
  const names = page.body.match(/<h3 dir="auto">/g).length;
  assert.equal((page.body.match(/<h3 dir="auto"><span class="om-mini" aria-hidden="true">ॐ<\/span>/g) || []).length, names);
});

test("the six star homes each have a star map beside the real sky photo", async () => {
  const want = { lyrans: "Vega", pleiadians: "The Pleiades", sirians: "Sirius", arcturians: "Arcturus", andromedans: "Andromeda galaxy", "orions-of-light": "Orion's Belt" };
  for (const [slug, home] of Object.entries(want)) {
    const page = await call(`/teachings/${slug}`);
    // On Replit the telescope photo sits beside the map; in this checkout (no picture folder) the map shows alone.
    assert.match(page.body, /<figure class="star-map">\s*<svg/, slug);
    assert.ok(page.body.includes(`>${home.replace("'", "&#39;")}</text>`) || page.body.includes(`>${home}</text>`), `${slug} highlights ${home}`);
  }
  const hathors = await call("/teachings/hathors");
  assert.doesNotMatch(hathors.body, /class="star-map"/);
});

test("Samadhi's two council paintings are on the Galactic Federation page with the AI-painted caption", async () => {
  for (const f of ["galactic-federation", "council-for-earth"]) {
    const img = await call(`/images/${f}.jpg`);
    assert.equal(img.status, 200, f);
    assert.equal(img.headers["Content-Type"], "image/jpeg", f);
  }
  const gfl = await call("/teachings/galactic-federation-of-light");
  assert.match(gfl.body, /<img src="\/images\/council-for-earth\.jpg"[^>]*alt="Star beings of many kinds/);
  assert.equal(gfl.body.split("AI-painted artwork for SAMADHI LOVE, as the teachings describe them.").length - 1, 2);
});

test("Samadhi's star family pictures are served, and nothing outside that folder can be reached through it", async () => {
  for (const f of ["sirians", "andromedans", "arcturians", "orions-of-light", "pleiadians", "lyrans", "humans"]) {
    const img = await call(`/images/star-families/${f}.jpg`);
    assert.equal(img.status, 200, f);
    assert.equal(img.headers["Content-Type"], "image/jpeg", f);
  }
  assert.equal((await call("/images/star-families/no-such-family.jpg")).status, 404);
  assert.notEqual((await call("/images/star-families/..%2F..%2Fserver.jpg")).status, 200);
  const hathors = await call("/teachings/hathors");
  assert.match(hathors.body, /<figure class="star-art"><svg/);
});

test("the Humans page tells the story of the fall and the return, with its sources and an honest note", async () => {
  const page = await call("/teachings/humans");
  assert.equal(page.status, 200);
  for (const fact of ["Genesis 1:27", "khalifa", "Isaac Luria", "as long as the divine nature lasted in them", "Edgar Cayce", "Philip Sclater", "Luke 15:24", "love and compassion", "why-we-came"]) assert.ok(page.body.includes(fact), fact);
});

test("the Prayers tab holds six short prayers, shown line by line, with the Quran's mercy prayers in Arabic", async () => {
  const tab = await call("/library?tab=prayers");
  assert.equal(tab.status, 200);
  for (const slug of ["prayer-archangel-raphael-healing", "prayer-archangel-zadkiel-mercy", "prayer-for-mercy-from-the-quran", "prayer-to-jesus", "prayer-to-mother-mary", "prayer-of-the-one-light"]) {
    assert.ok(tab.body.includes(`/teachings/${slug}`), slug);
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.match(page.body, /<blockquote><p>[^<]+<br>/, slug);
    assert.doesNotMatch(page.body, /\\(<br>|<\/p>)/, slug);
  }
  const quran = await call("/teachings/prayer-for-mercy-from-the-quran");
  for (const t of ["رَبِّ اغْفِرْ وَارْحَمْ", "23:118", "7:23", "Ya-Sin"]) assert.ok(quran.body.includes(t), t);
  assert.match(quran.body, /<p class="arabic" dir="rtl" lang="ar">رَبِّ اغْفِرْ/);
  const med = await call("/teachings/meditation-and-prayer");
  assert.ok(med.body.includes('href="/library?tab=prayers"'));
});

test("the Great Flood tab sits beside The Human Story with its four teachings", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("great-flood"), ids.indexOf("human-story") + 2, "after The Human Story and Beyond the Veil");
  const home = await call("/");
  assert.match(home.body, /<nav class="nav[^]*href="\/library\?tab=great-flood"/, "in the menu");
  const lib = await call("/library?tab=great-flood");
  assert.equal(lib.status, 200);
  for (const t of ["One Memory, Many Peoples", "The Flood Stories of the World", "When the Ice Melted", "The Great Civilizations and the Fall"]) assert.ok(lib.body.includes(t), t);
  for (const slug of ["the-great-flood", "flood-stories-of-the-world", "when-the-ice-melted", "great-civilizations-and-the-fall"]) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
  }
  const stories = await call("/teachings/flood-stories-of-the-world");
  assert.match(stories.body, /<p class="arabic" dir="rtl" lang="ar">وَقِيلَ يَا أَرْضُ ابْلَعِي/, "Quran 11:44 reads right to left");
  for (const t of ["Utnapishtim", "Atrahasis", "Genesis 7:11", "al-Judi", "Matsya", "Deucalion", "Popol Vuh", "Yu the Great", "Nunn"]) assert.ok(stories.body.includes(t), t);
  const science = await call("/teachings/when-the-ice-melted");
  for (const t of ["120 metres", "Meltwater Pulse 1A", "Younger Dryas", "Doggerland", "What the waters remember"]) assert.ok(science.body.includes(t), t);
  for (const t of ["Black Sea", "Most scientists do not accept", "no single flood"]) assert.ok(!science.body.includes(t), `no theory lines: ${t}`);
  const atlantis = await call("/teachings/atlantis");
  assert.match(atlantis.body, /Great Flood tab/, "Atlantis points to the new tab");
});

test("home presents the original artwork as a framed triptych with a portrait-first phone layout", async () => {
  const { readFileSync } = await import("node:fs");
  const { site } = await import("../lib/content.js");
  const { escapeHtml } = await import("../lib/md.js");
  const page = await call("/");
  assert.equal(page.status, 200);
  const header = page.body.match(/<header class="hero">([^]*?)<\/header>/)?.[0] || "";
  const prayer = header.match(/<img class="hero-prayer"[^>]*>/)?.[0] || "";
  const galaxy = header.match(/<img class="hero-galaxy"[^>]*>/)?.[0] || "";
  const portrait = header.match(/<img class="hero-centrepiece"[^>]*>/)?.[0] || "";
  assert.match(prayer, /src="\/images\/hero-prayer\.jpg" width="960" height="536"/);
  assert.match(galaxy, /src="\/images\/hero-galaxy\.jpg" width="960" height="536"/);
  assert.match(portrait, /src="\/images\/home-cosmic-portrait\.jpg" width="1400" height="788"/);
  assert.equal((header.match(/class="hero-centrepiece"/g) || []).length, 1);
  assert.equal((header.match(/class="triptych-panel triptych-/g) || []).length, 3);
  assert.ok(header.indexOf(portrait) < header.indexOf(prayer) && header.indexOf(prayer) < header.indexOf(galaxy), "portrait-first reading order matches phones");
  assert.match(header, /<figcaption class="triptych-caption">♫ ✧ ❨ Music is for the soul ❩ ✧ ♫<\/figcaption>/, "the motto sits under the middle picture");
  assert.equal((header.match(/Music is for the soul/g) || []).length, 1, "shown once in the home header, not twice");
  assert.ok(header.includes(`<h1>${escapeHtml(site.name)}</h1><p class="lead">${escapeHtml(site.tagline)}</p>`), "title and tagline stay together and unchanged");
  assert.match(header, /Explore the Teachings/);
  assert.match(header, /Listen to the Music/);
  const image = await call("/images/home-cosmic-portrait.jpg");
  assert.equal(image.status, 200);
  assert.equal(image.headers["Content-Type"], "image/jpeg");
  const css = readFileSync(new URL("../public/site.css", import.meta.url), "utf8");
  const frame = css.match(/\.art-frame\s*\{([^}]+)\}/)?.[1] || "";
  assert.match(frame, /border:\s*1\.25px solid rgba\(212,\s*175,\s*55,\s*\.7\)/);
  assert.match(frame, /border-radius:\s*14px/);
  assert.match(frame, /box-shadow:/);
  const imageRule = css.match(/\.art-frame img\s*\{([^}]+)\}/)?.[1] || "";
  assert.match(imageRule, /width:\s*100%/);
  assert.match(imageRule, /height:\s*auto/);
  assert.match(css, /grid-template-columns:\s*1fr 1\.4fr 1fr/);
  assert.match(css, /grid-template-areas:\s*"left centre right"/);
  assert.match(css, /grid-template-areas:\s*"centre centre"\s*"left right"/);
  assert.match(css, /\.triptych-centre \.art-frame\s*\{[^}]*max-width:\s*1792px/);
  assert.doesNotMatch(css, /mask-image:|--hero-extra/, "retire the feathered overlapping montage");
  assert.match(css, /@keyframes triptych-rise/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[^]*?\.triptych-panel,\s*\.teachings-art-banner\s*\{\s*animation:\s*none/);
  for (const url of ["/gallery", "/library?tab=teachings", "/library?tab=prayers", "/library?tab=ages-of-the-world"]) {
    const other = await call(url);
    assert.ok(!other.body.includes("/images/home-cosmic-portrait.jpg"), `${url}: home artwork is not added here`);
  }
  const credits = await call("/credits");
  assert.match(credits.body, /Teachings banner and home portrait: Artwork by SAMADHI LOVE/);
});

test("inner pages use their title-matched backdrops and retain picture credits", async () => {
  const { placeForPage, pictureFor, backdropFor, creditFor } = await import("../lib/pictures.js");
  const { escapeHtml } = await import("../lib/md.js");
  const assignments = [
    ["/masters", "masters", "mount-kailash"],
    ["/library?tab=star-family", "star-family", "milky-way-hd"],
    ["/library?tab=philosophers", "philosophers", "parthenon"],
    ["/library?tab=wisdom", "wisdom", "angkor-wat"],
    ["/library?tab=sages-and-kings", "sages-and-kings", "baalbek"],
    ["/library?tab=mystics", "mystics", "taj-mahal"],
    ["/library?tab=chakras", "chakras", "orion-nebula"],
    ["/library?tab=human-story", "human-story", "giza"],
    ["/music", "music", "lyra-hd"],
    ["/videos", "videos", "orion-hd"],
    ["/podcasts", "podcasts", "delphi"],
    ["/gallery", "gallery", "pleiades-hd"],
    ["/about", "about", "stonehenge"],
    ["/contact", "contact", "venus-hd"],
    ["/credits", "credits", "machu-picchu"],
  ];
  const credits = await call("/credits");
  assert.equal(credits.status, 200);
  for (const [url, key, subject] of assignments) {
    assert.equal(placeForPage[key], subject, url);
    const page = await call(url);
    assert.equal(page.status, 200, url);
    const file = pictureFor(subject);
    // Candidate files are kept outside Git; a fresh checkout can have none.
    if (!file) {
      assert.doesNotMatch(page.body, /class="journey"/, url);
      continue;
    }
    const backdrop = backdropFor(file);
    assert.ok(page.body.includes(`--place:url('/${backdrop}')`), `${url}: backdrop`);
    const image = await call(`/${backdrop}`);
    assert.equal(image.status, 200, `${url}: image`);
    assert.equal(image.headers["Content-Type"], "image/jpeg", `${url}: image type`);
    const credit = creditFor(file);
    assert.ok(credit, `${url}: credit record`);
    for (const value of [credit.title, credit.author, credit.license]) {
      assert.ok(value && credits.body.includes(escapeHtml(value)), `${url}: credit ${value}`);
    }
    for (const url of [credit.licenseUrl, credit.source]) {
      const encoded = url?.replace(/\(/g, "%28").replace(/\)/g, "%29");
      assert.ok(encoded && credits.body.includes(`href="${escapeHtml(encoded)}"`), `credit link: ${url}`);
    }
  }
});

test("Restored by Samadhi: the sacred-geometry artwork tops Teachings and prayer-masters is on the Prayer to Jesus", async () => {
  const artwork = categories.find((c) => c.id === "teachings").artwork;
  assert.equal(artwork.src, "/images/teachings-sacred-geometry.jpg");
  const tab = await call("/library?tab=teachings");
  assert.ok(tab.body.includes('<figure class="teachings-art-banner art-frame"><img src="/images/teachings-sacred-geometry.jpg"'));
  const jesus = await call("/teachings/prayer-to-jesus");
  assert.ok(jesus.body.includes('src="/images/prayer-masters.jpg"'));
  const prayers = await call("/library?tab=prayers");
  assert.ok(prayers.body.includes("prayer-golden.jpg"), "restored by Samadhi");
  const { readFileSync } = await import("node:fs");
  const list = readFileSync(new URL("../public/images/replacements/LIST.md", import.meta.url), "utf8");
  assert.match(list, /Mystery-school symbols, masters, angels and star beings are welcome/);
  assert.ok(!/skin|totem|disputed/i.test(list), "no rules on skin tones, masks or disputed sites");
  assert.ok(!/holy names used as decoration/.test(list));
  const guide = readFileSync(new URL("../WRITING-GUIDE.md", import.meta.url), "utf8");
  assert.match(guide.split("\n").slice(0, 4).join(" "), /Every page is written for seekers who are ready and questioning/);
});

test("reviewed nude artworks are not used by teachings, masters or the chooser", async () => {
  const retired = /\/candidates\/(?:(?:the-deluge-dore|the-deluge-michelangelo|school-of-athens|death-of-socrates)\/|mary\/(?:sistine-madonna|immaculate-conception)(?:\.w960)?\.jpg|archangel-michael\/(?:michael-defeats-satan|saint-michael-vanquishing-satan)(?:\.w960)?\.jpg)/;
  for (const url of ["/masters", ...categories.flatMap(c => c.items.map(it => `/teachings/${it.slug}`))]) {
    const page = await call(url);
    assert.equal(page.status, 200, url);
    assert.doesNotMatch(page.body, retired, url);
  }
  const { pages } = await import("../lib/pages.js");
  assert.doesNotMatch(pages.choose(), retired);
  const { pictureFor, pictureForTeaching } = await import("../lib/pictures.js");
  for (const subject of ["the-deluge-dore", "the-deluge-michelangelo", "school-of-athens", "death-of-socrates"]) {
    assert.equal(pictureFor(subject), null, `${subject}: cannot return as a fallback`);
    assert.ok(!Object.values(pictureForTeaching).flat().includes(subject));
  }
});

test("civilizations shows Baalbek and the flood tablet in order with correct replacement credits", async () => {
  const { pictureFor, backdropFor, creditFor } = await import("../lib/pictures.js");
  const { escapeHtml } = await import("../lib/md.js");
  const page = await call("/teachings/great-civilizations-and-the-fall");
  const images = [...page.body.matchAll(/<figure class="cover"><img src="([^"]+)"/g)].map(m => m[1]);
  const expected = ["baalbek", "flood-tablet"].map(pictureFor).filter(Boolean);
  assert.deepEqual(images, expected.map(file => "/" + backdropFor(file)));
  const replacements = [
    ["/teachings/the-great-flood", "flood-tablet"],
    ["/teachings/philosophers-on-the-human-path", "parthenon"],
    ["/teachings/death-of-socrates", "socrates-bust"],
    ["/masters", "mary"],
    ["/masters", "archangel-michael"],
  ];
  const credits = await call("/credits");
  for (const [url, subject] of replacements.concat(expected.map(file => ["/teachings/great-civilizations-and-the-fall", file]))) {
    const file = subject.startsWith("candidates/") ? subject : pictureFor(subject);
    if (!file) continue; // Candidate assets are intentionally not tracked in Git.
    const shown = await call(url);
    assert.ok(shown.body.includes(`src="/${backdropFor(file)}"`), `${url}: ${file}`);
    const credit = creditFor(file);
    assert.ok(credit && credit.license && credit.source, file);
    assert.ok(credits.body.includes(escapeHtml(credit.title)), `${file}: credited title`);
    for (const link of [credit.licenseUrl, credit.source]) {
      const encoded = link.replace(/\(/g, "%28").replace(/\)/g, "%29");
      assert.ok(credits.body.includes(`href="${escapeHtml(encoded)}"`), `${file}: credit link`);
    }
  }
});

test("only the Prayers tab overlays Samadhi's quote on its existing angels picture, with a narrow-screen fallback", async () => {
  const tab = await call("/library?tab=prayers");
  assert.equal(tab.status, 200);
  assert.match(tab.body, /<figure class="cover tab-wide prayer-quote-cover"><figcaption class="prayer-image-caption">/);
  for (const line of [
    "If we all pray to One God, share One Creator,",
    "and return to that same One God—",
    "why do we destroy each other",
    "just to reach Him?",
    "Did God ever ask for that?",
  ]) assert.ok(tab.body.includes(`<span>${line}</span>`), line);
  assert.match(tab.body, /<p class="prayer-image-signature">— Samadhi-Love<\/p>/);
  assert.doesNotMatch(tab.body, /<strong>Did God ever ask for that\?<\/strong>/);
  assert.match(tab.body, /<\/figcaption><img src="\/images\/prayer-golden\.jpg"/, "the unchanged picture stays separate from the live text");
  const css = (await call("/site.css")).body;
  assert.match(css, /\.prayer-image-caption \{[^}]*text-align: left;/, "quote and signature stay in the top-left corner");
  assert.match(css, /\.prayer-image-caption \{[^}]*position: absolute;[^}]*width: 32%;/, "the live text overlays the actual picture rather than a separate side panel");
  assert.doesNotMatch(css, /\.prayer-quote-cover::before/, "no extra sky image is added");
  assert.match(css, /\.prayer-image-quote \{[^}]*font-weight: 400;/);
  assert.match(css, /\.prayer-image-signature \{[^}]*color: #fff;/);
  assert.match(css, /@media \(max-width: 800px\) \{[^]*?\.prayer-quote-cover > img \{ order: -1; \}/, "phones put the same quote below the picture instead of over faces");
  assert.doesNotMatch((await call("/library?tab=teachings")).body, /prayer-image-caption/);
  assert.doesNotMatch((await call("/")).body, /prayer-image-caption/);
});

test("the prayer page opens with its all-paths picture, and every page keeps the place picture as a bottom band", async () => {
  const img = await call("/images/prayer.jpg");
  assert.equal(img.status, 200);
  const page = await call("/teachings/meditation-and-prayer");
  assert.match(page.body, /<figure class="cover"><img src="\/images\/prayer-left\.jpg"[^>]*alt="A great crowd of people of many faiths/);
  const css = (await call("/site.css")).body;
  assert.match(css, /\.journey::after \{[^}]*bottom: 0;/);
});

test("Knowledge & Insight tab: food, compassion, processed food and the sacred seed", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("knowledge"), ids.indexOf("teachings") + 1, "right beside Teachings");
  const home = await call("/");
  assert.match(home.body, /<nav class="nav[^]*href="\/library\?tab=knowledge"/, "in the menu");
  const lib = await call("/library?tab=knowledge");
  assert.equal(lib.status, 200);
  for (const t of ["Food Is Energy", "Compassion on the Plate", "Processed Foods and Meats", "The Sacred Seed"]) assert.ok(lib.body.includes(t), t);
  const pages = { "food-is-energy": ["SMILES", "Sattvic", "not medical advice"],
    "compassion-on-the-plate": ["Govinda", "Go Mata", "tza&#39;ar ba&#39;alei chayim|tza'ar ba'alei chayim", "Temple Grandin"],
    "processed-foods-and-meats": ["NOVA", "carcinogenic to humans", "the higher the risk"],
    "the-sacred-seed": ["Niddah 13a", "Even HaEzer 23:1", "dhatu kshaya", "Never despair", "every soul can begin again", "Lilith", "Genesis 38:9", "Tikkun HaKlali", "brahmacharya", "What medicine says", "No shame"] };
  for (const [slug, words] of Object.entries(pages)) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    for (const w of words) assert.match(page.body, new RegExp(w), `${slug}: ${w}`);
  }
});

test("Krishna and Shiva stand on each side of the Knowledge & Insight heading", async () => {
  const lib = await call("/library?tab=knowledge");
  assert.match(lib.body, /<div class="tab-flank"><img class="tab-side" src="\/images\/krishna\.jpg"[^]*<h2 class="section-title"[^>]*>Knowledge &amp; Insight<\/h2>[^]*<img class="tab-side" src="\/images\/shiva\.jpg"/);
  const plate = await call("/teachings/compassion-on-the-plate");
  assert.match(plate.body, /<figure class="cover"><img src="\/images\/jesus-animals\.jpg"/, "the Good Shepherd picture tops Compassion on the Plate");
  for (const f of ["/images/krishna.jpg", "/images/shiva.jpg", "/images/jesus-animals.jpg"]) assert.equal((await call(f)).status, 200, f);
  const other = await call("/library?tab=great-flood");
  assert.ok(!other.body.includes("tab-flank"), "other tabs unchanged");
});

test("Tree of Life: its own branch after the Chakras, with the Sefirot drawing and all eight pages", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("tree-of-life"), ids.indexOf("chakras") + 1);
  const home = await call("/");
  assert.match(home.body, /href="\/library\?tab=tree-of-life"/);
  const tab = await call("/library?tab=tree-of-life");
  assert.equal(tab.status, 200);
  const slugs = ["the-tree-of-life", "the-ten-sefirot", "the-four-worlds", "the-breaking-of-the-vessels", "tree-of-life-in-scripture", "the-world-trees", "the-tree-in-the-western-mysteries", "living-the-tree-of-life"];
  for (const s of slugs) {
    assert.ok(tab.body.includes(`href="/teachings/${s}"`), s);
    const page = await call(`/teachings/${s}`);
    assert.equal(page.status, 200, s);
    assert.doesNotMatch(page.body, /\{\{/, s);
  }
  const sef = await call("/teachings/the-ten-sefirot");
  assert.match(sef.body, /<svg viewBox="0 0 400 700"[^>]*role="img"/);
  const tree = sef.body.slice(sef.body.indexOf('<svg viewBox="0 0 400 700"'), sef.body.indexOf("</svg>", sef.body.indexOf('<svg viewBox="0 0 400 700"')));
  assert.equal((tree.match(/<line x1=/g) || []).length, 22);
  for (const n of ["Keter", "Chokhmah", "Binah", "Chesed", "Gevurah", "Tiferet", "Netzach", "Hod", "Yesod", "Malkhut"]) assert.ok(sef.body.includes(`>${n}</text>`), n);
  const trees = await call("/teachings/the-world-trees");
  assert.match(trees.body, /I ween that I hung on the windy tree,<br>Hung there for nights full nine;<br>/);
});

test("Knowledge & Insight: the six healthy-living pages are listed and render", async () => {
  const tab = await call("/library?tab=knowledge");
  for (const s of ["the-three-whites", "fried-foods-and-the-third-eye", "fluoride-and-the-pineal-gland", "soft-drinks-and-energy-drinks", "artificial-food-colours", "drinking-water-wisely"]) {
    assert.ok(tab.body.includes(`href="/teachings/${s}"`), s);
    const page = await call(`/teachings/${s}`);
    assert.equal(page.status, 200, s);
    assert.match(page.body, /not medical advice/, s);
    assert.match(page.body, /<h2[^>]*>Sources<\/h2>/, s);
  }
});

test("Homer tab and the eight new teachers render with their pictures", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("homer"), ids.indexOf("shakespeare") + 1);
  const tab = await call("/library?tab=homer");
  for (const s of ["homer-the-man-and-the-mystery", "the-iliad-and-the-odyssey", "the-spiritual-homer"]) assert.ok(tab.body.includes(`href="/teachings/${s}"`), s);
  const pics = { "homer-the-man-and-the-mystery": "homer", "hermes-trismegistus": "hermes", zoroaster: "zoroaster", orpheus: "orpheus", epictetus: "epictetus", "adi-shankara": "shankara", patanjali: "patanjali", hafiz: "hafiz" };
  for (const [slug, img] of Object.entries(pics)) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.ok(page.body.includes(`/images/${img}.jpg`), slug);
    const file = await call(`/images/${img}.jpg`);
    assert.equal(file.status, 200, img);
  }
  const jung = await call("/teachings/carl-jung");
  assert.equal(jung.status, 200);
  assert.match(jung.body, /<svg viewBox="0 0 400 400"/);
  assert.doesNotMatch(jung.body, /\{\{/);
  const phil = await call("/library?tab=philosophers");
  for (const s of ["hermes-trismegistus", "zoroaster", "orpheus", "epictetus", "carl-jung"]) assert.ok(phil.body.includes(`href="/teachings/${s}"`), s);
  const myst = await call("/library?tab=mystics");
  for (const s of ["adi-shankara", "patanjali", "hafiz"]) assert.ok(myst.body.includes(`href="/teachings/${s}"`), s);
});

test("Blessing & Gratitude tab: four pages, placed before Prayers, with the dawn drawing", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("blessing"), ids.indexOf("prayers") - 1);
  const tab = await call("/library?tab=blessing");
  for (const s of ["blessing-god", "the-power-of-gratitude", "the-power-of-affirmations", "a-day-of-blessing"]) {
    assert.ok(tab.body.includes(`href="/teachings/${s}"`), s);
    const page = await call(`/teachings/${s}`);
    assert.equal(page.status, 200, s);
    assert.doesNotMatch(page.body, /\{\{/, s);
  }
  const bless = await call("/teachings/blessing-god");
  assert.match(bless.body, /<svg viewBox="0 0 600 330"/);
  assert.match(bless.body, /Modeh ani lefanecha/);
});

test("Beyond the Veil sits beside The Human Story with seven pages, drawn art, sources and care notes", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("beyond-the-veil"), ids.indexOf("human-story") + 1);
  const home = await call("/");
  assert.match(home.body, /href="\/library\?tab=beyond-the-veil"/);
  const tab = await call("/library?tab=beyond-the-veil");
  assert.equal(tab.status, 200);
  const slugs = ["beyond-the-veil", "out-of-body-travel-and-astral-projection", "near-death-experiences", "remote-viewing", "channeling", "light-language", "walking-safely-beyond-the-veil"];
  for (const slug of slugs) {
    assert.ok(tab.body.includes(`/teachings/${slug}`), `tab links ${slug}`);
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.match(page.body, /<h2[^>]*>Sources<\/h2>/, `${slug} has sources`);
    assert.doesNotMatch(page.body, /\{\{veil-/, `${slug} has no leftover placeholders`);
  }
  for (const slug of ["out-of-body-travel-and-astral-projection", "near-death-experiences", "remote-viewing", "channeling", "light-language"]) {
    const page = await call(`/teachings/${slug}`);
    assert.match(page.body, /<figure class="cross-hero veil-figure"><svg/, `${slug} has its drawn picture`);
  }
  const nde = await call("/teachings/near-death-experiences");
  for (const fact of ["344", "18%", "2,060", "never something to seek"]) assert.ok(nde.body.includes(fact), fact);
  const ll = await call("/teachings/light-language");
  for (const fact of ["Acts 2:4", "Hildegard", "Newberg", "Samadhi&#39;s view|Samadhi's view"]) assert.match(ll.body, new RegExp(fact));
});

test("Sacred Geometry tab follows Tree of Life with six pages, exact drawings, CSS toggles and gentle history notes", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("sacred-geometry"), ids.indexOf("tree-of-life") + 1);
  const home = await call("/");
  assert.match(home.body, /href="\/library\?tab=sacred-geometry"/);
  const slugs = ["sacred-geometry", "the-symbols-of-sacred-geometry", "the-five-platonic-solids", "the-golden-ratio-and-fibonacci", "sacred-geometry-in-architecture", "sacred-geometry-what-history-records"];
  const tab = await call("/library?tab=sacred-geometry");
  for (const slug of slugs) {
    assert.ok(tab.body.includes(`/teachings/${slug}`), slug);
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.match(page.body, /<h2[^>]*>Sources<\/h2>/, `${slug} has sources`);
    assert.doesNotMatch(page.body, /\{\{(geo|tree)-/, `${slug} has no leftover placeholders`);
    assert.doesNotMatch(page.body, /<script(?![^>]*\bsrc=)/, `${slug} has no inline script`);
  }
  const sym = await call("/teachings/the-symbols-of-sacred-geometry");
  assert.equal((sym.body.match(/<figure class="cross-hero sgx">/g) || []).length, 10, "ten exact drawings");
  assert.match(sym.body, /tol-figure/, "the Tree of Life drawing is reused");
  assert.match(sym.body, /<input type="checkbox" id="sgx-metatron-l" class="sgx-lines">/);
  assert.match(sym.body, /<label for="sgx-metatron-l">Show the 13 circles<\/label>/);
  const meta = sym.body.split('<figure class="cross-hero sgx">').find((part) => part.includes('id="metatron-t"')).split("</svg>")[0];
  assert.equal((meta.match(/<line /g) || []).length, 78, "Metatron's Cube has 78 lines");
  for (const t of ["√3", "137.5°", "43", "Euclid"]) assert.ok(sym.body.includes(t), t);
  const css = (await call("/site.css")).body;
  assert.match(css, /\.sgx-lines:checked ~ svg \.sg-c \{ opacity: 1; \}/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.sgx-spin/);
  const hist = await call("/teachings/sacred-geometry-what-history-records");
  for (const t of ["red ochre", "late 20th century", "No ancient plan"]) assert.ok(hist.body.includes(t), t);
  assert.doesNotMatch(hist.body, /\bmyth\b/i, "gentle wording, no 'myth' labels");
});

test("Philosophy pages open the Philosophers tab with the owl, six branch cards and the every-seeker message", async () => {
  const tabItems = categories.find((c) => c.id === "philosophers").items.map((i) => i.slug);
  const slugs = ["what-is-philosophy", "the-six-branches-of-philosophy", "who-is-a-philosopher", "philosophy-as-medicine-for-the-soul"];
  assert.deepEqual(tabItems.slice(0, 4), slugs);
  assert.ok(tabItems.includes("socrates") && tabItems.includes("carl-jung"), "existing philosophers kept");
  for (const slug of slugs) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.match(page.body, /<h2[^>]*>Sources<\/h2>/, `${slug} has sources`);
    assert.doesNotMatch(page.body, /\{\{philo-/, `${slug} has no leftover placeholders`);
    assert.doesNotMatch(page.body, /<script(?![^>]*\bsrc=)/, `${slug} has no inline script`);
  }
  const what = await call("/teachings/what-is-philosophy");
  assert.ok(what.body.includes('src="/images/athena-owl.jpg"'), "Samadhi's owl picture");
  for (const t of ["love of wisdom", "Pythagoras", "darshana", "ubuntu", "Samadhi"]) assert.ok(what.body.includes(t), t);
  const branches = await call("/teachings/the-six-branches-of-philosophy");
  assert.equal((branches.body.match(/class="philo-card"/g) || []).length, 6, "six branch cards");
  assert.equal((branches.body.match(/class="philo-icon"/g) || []).length, 6, "six emblems");
  const who = await call("/teachings/who-is-a-philosopher");
  for (const t of ["stonemason", "born a slave", "weaver", "shoemaker", "You may be one of them"]) assert.ok(who.body.includes(t), t);
  const css = (await call("/site.css")).body;
  assert.match(css, /\.philo-grid \{/);
});

test("Philosophy tab: short menu name, full heading", async () => {
  const home = await call("/");
  assert.match(home.body, /href="\/library\?tab=philosophers"[^>]*>Philosophy</);
  const tab = await call("/library?tab=philosophers");
  assert.ok(tab.body.includes("Philosophy and the Great Philosophers"));
});

test("Tree of Life explorer and chakra lotuses: animated drawings driven by CSS only", async () => {
  const sef = await call("/teachings/the-ten-sefirot");
  assert.equal((sef.body.match(/name="tx-step"/g) || []).length, 7, "seven explorer steps");
  for (const t of ["The lightning flash", "The path of return", "The 22 paths", "Four worlds", "thirty-two paths of wisdom"]) assert.ok(sef.body.includes(t), t);
  assert.equal((sef.body.match(/class="tx-path"/g) || []).length, 22, "22 paths animate");
  assert.doesNotMatch(sef.body, /\{\{tree-/);
  const counts = { "chakra-root": 4, "chakra-sacral": 6, "chakra-solar-plexus": 10, "chakra-heart": 12, "chakra-throat": 16 };
  for (const [slug, n] of Object.entries(counts)) {
    const page = await call(`/teachings/${slug}`);
    const fig = page.body.split('<figure class="cross-hero lx">')[1].split("</svg>")[0];
    const fill = fig.split('class="lx-fill"')[1].split("</g>")[0];
    assert.equal((fill.match(/<path /g) || []).length, n, `${slug} has ${n} petals`);
    assert.doesNotMatch(page.body, /\{\{lotus-/);
  }
  const all = await call("/teachings/the-seven-chakras");
  assert.match(all.body, /id="lx-all-r" class="lx-rise"/);
  assert.equal((all.body.match(/class="lx-node"/g) || []).length, 7);
  const css = (await call("/site.css")).body;
  assert.match(css, /#tx-flash:checked ~ svg \.tx-l-flash/);
  assert.match(css, /\.lx-rise:checked ~ svg \.lx-dot/);
});

test("Animated Tree of Life and chakra lotuses render with CSS-only buttons", async () => {
  const tree = await call("/teachings/the-ten-sefirot");
  assert.match(tree.body, /<figure class="cross-hero tolx">/);
  for (const id of ["tree", "pillars", "flash", "return", "paths", "triads", "worlds"]) assert.match(tree.body, new RegExp(`<input type="radio" name="tx-step" id="tx-${id}"`), id);
  assert.equal((tree.body.match(/class="tx-path"/g) || []).length, 22, "22 paths animate");
  assert.doesNotMatch(tree.body, /\{\{tree-/);
  const petals = { 1: 4, 2: 6, 3: 10, 4: 12, 5: 16, 6: 2 };
  const slugs = { 1: "chakra-root", 2: "chakra-sacral", 3: "chakra-solar-plexus", 4: "chakra-heart", 5: "chakra-throat", 6: "chakra-third-eye", 7: "chakra-crown" };
  for (const [n, slug] of Object.entries(slugs)) {
    const page = await call(`/teachings/${slug}`);
    assert.match(page.body, new RegExp(`id="lx-c${n}-c" class="lx-col"`), slug);
    assert.doesNotMatch(page.body, /\{\{lotus-/, slug);
    if (petals[n]) {
      const fill = page.body.split('<g class="lx-fill"')[1].split("</g>")[0];
      assert.equal((fill.match(/<path /g) || []).length, petals[n], `${slug} has ${petals[n]} petals`);
    }
  }
  const all = await call("/teachings/the-seven-chakras");
  assert.match(all.body, /id="lx-all-r" class="lx-rise"/);
  const css = (await call("/site.css")).body;
  assert.match(css, /#tx-flash:checked ~ svg \.tx-l-flash/);
  assert.match(css, /\.lx-col:checked ~ svg \.lx-fill/);
});

test("Sacred Texts tab: five pages, emblems, 231 gates and history notes", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("sacred-texts"), ids.indexOf("sacred-geometry") + 1);
  const home = await call("/");
  assert.match(home.body, /href="\/library\?tab=sacred-texts"/);
  const slugs = ["sacred-texts", "the-torah", "sefer-yetzirah", "the-zohar", "the-books-of-enoch", "sacred-texts-what-history-records"];
  for (const slug of slugs) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.match(page.body, /<h2[^>]*>Sources<\/h2>/, `${slug} has sources`);
    assert.doesNotMatch(page.body, /\{\{(text|prophet)-/, `${slug} has no leftover placeholders`);
    assert.doesNotMatch(page.body, /<script(?![^>]*\bsrc=)/, `${slug} has no inline script`);
  }
  const sy = await call("/teachings/sefer-yetzirah");
  const gates = sy.body.split('class="sg-c"')[1].split("</g>")[0];
  assert.equal((gates.match(/<line /g) || []).length, 231, "231 gates");
  assert.match(sy.body, /id="st-cube-t"/);
  const ov = await call("/teachings/sacred-texts");
  for (const t of ["Peshat", "Remez", "Derash", "Sod", "Hagigah"]) assert.ok(ov.body.includes(t), t);
  const hist = await call("/teachings/sacred-texts-what-history-records");
  for (const t of ["Moses de Le", "Dead Sea Scrolls", "1558"]) assert.ok(hist.body.includes(t), t);
});

test("Prophets & Teachers tab: overview with filters, golden rule strip and nine emblem pages, no portraits", async () => {
  const ids = categories.map((c) => c.id);
  assert.equal(ids.indexOf("prophets"), ids.indexOf("masters") + 1);
  const home = await call("/");
  assert.match(home.body, /href="\/library\?tab=prophets"/);
  const ov = await call("/teachings/prophets-and-teachers");
  assert.equal((ov.body.match(/class="pf-card /g) || []).length, 10, "ten cards, Enoch included");
  for (const f of ["all", "abr", "dha", "per", "sik"]) assert.match(ov.body, new RegExp(`id="pf-${f}"`), f);
  assert.equal((ov.body.match(/class="pf-gold-card"/g) || []).length, 8, "golden rule strip");
  assert.match(ov.body, /do not teach reincarnation/);
  assert.match(ov.body, /gilgul/);
  const slugs = ["enoch", "abraham", "moses", "zarathushtra", "the-buddha", "isaiah-jeremiah-ezekiel", "jesus-of-nazareth", "muhammad", "krishna-and-rama", "guru-nanak"];
  for (const slug of slugs) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.match(page.body, /class="pf-hero-art"/, `${slug} has its emblem`);
    assert.match(page.body, /<h2[^>]*>Sources<\/h2>/, `${slug} has sources`);
    assert.doesNotMatch(page.body, /\{\{prophet-/, slug);
  }
  const m = await call("/teachings/muhammad");
  assert.doesNotMatch(m.body.split("<main")[1] || m.body, /<img [^>]*alt="[^"]*Muhammad/i, "no picture of the Prophet");
  const css = (await call("/site.css")).body;
  assert.match(css, /#pf-abr:checked ~ \.pf-grid \.pf-card:not\(\.pf-abr\)/);
});

test("Enoch: Idris page in Prophets & Teachers and The Books of Enoch in Sacred Texts, cross-linked", async () => {
  const e = await call("/teachings/enoch");
  for (const t of ["he was not; for God took him", "Idris", "fourth heaven", "Metatron", "Hebrews 11:5"]) assert.ok(e.body.includes(t), t);
  assert.match(e.body, /href="\/teachings\/the-books-of-enoch"/);
  const b = await call("/teachings/the-books-of-enoch");
  for (const t of ["Watchers", "364 days", "360 books", "Rabbi Ishmael", "Ethiopian and Eritrean Orthodox", "John Dee", "modern name"]) assert.ok(b.body.includes(t), t);
  assert.match(b.body, /id="st-heavens-t"/);
  assert.match(b.body, /id="st-sungates-t"/);
  assert.doesNotMatch(b.body, /\{\{text-/);
  const m = await call("/teachings/archangel-metatron");
  assert.match(m.body, /href="\/teachings\/enoch"/);
});

test("Start Here and Practices: where to begin, glossary, principles, breath guides, trataka, prompts and opt-in sound", async () => {
  const home = await call("/");
  assert.match(home.body, /href="\/library\?tab=start"/);
  assert.match(home.body, /href="\/library\?tab=practices"/);
  const lib = await call("/library");
  assert.match(lib.body, /<link rel="canonical" href="[^"]*\/library\?tab=teachings">/, "library still opens on Teachings");
  for (const slug of ["where-to-begin", "glossary", "principles-and-care", "practices-and-inner-work", "breath-of-peace", "trataka", "questions-to-sit-with", "sound-for-stillness"]) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.doesNotMatch(page.body, /\{\{(practice|start)-/, `${slug} has no leftover placeholders`);
    assert.doesNotMatch(page.body, /<script(?![^>]*\bsrc=)/, `${slug} has no inline script`);
  }
  const breath = await call("/teachings/breath-of-peace");
  for (const k of ["belly", "box", "nadi", "kapal"]) assert.match(breath.body, new RegExp(`data-px-pacer="${k}"`), k);
  assert.match(breath.body, /<script src="\/practice\.js\?v=/);
  assert.match(breath.body, /Please do not practise Kapalbhati/);
  assert.match(breath.body, /data-sound="off" aria-pressed="true"/, "silence is the default");
  assert.doesNotMatch(breath.body, /data-px-chimes checked/, "chimes are off until chosen");
  const tk = await call("/teachings/trataka");
  assert.equal((tk.body.match(/name="tk-shape"/g) || []).length, 4);
  const gl = await call("/teachings/glossary");
  assert.ok((gl.body.match(/class="gl-item"/g) || []).length >= 70, "glossary has at least 70 words");
  assert.match(gl.body, /Sefirot/);
  const care = await call("/teachings/principles-and-care");
  assert.match(care.body, /988/);
  const sound = await call("/teachings/sound-for-stillness");
  assert.match(sound.body, /not supported by research/);
  const plain = await call("/teachings/the-torah");
  assert.doesNotMatch(plain.body, /practice\.js/, "the practice script loads only where needed");
  const js = await call("/practice.js");
  assert.equal(js.status, 200);
});

test("Navigation: six top items, Library panel in five families, every tab reachable, grouped Library page", async () => {
  const { libraryFamilies } = await import("../lib/content.js");
  const home = await call("/");
  const desk = home.body.match(/<div class="nav-links">[\s\S]*?<\/div>\n<details class="nav-menu">/)[0];
  const top = desk.replace(/<div class="nav-panel[\s\S]*?<\/details>/g, "</details>");
  assert.deepEqual([...top.matchAll(/<summary[^>]*>([^<]+)</g)].map((m) => m[1].trim()), ["Library", "Music"]);
  assert.deepEqual([...top.matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1]), ["Masters &amp; Angels", "Versual Studio", "About", "Contact"]);
  assert.match(desk, /<a class="pill" href="\/contact">Contact<\/a>/);
  const panel = desk.match(/<div class="nav-panel nav-panel-library">[\s\S]*?<\/details>/)[0];
  for (const c of categories) assert.ok(panel.includes(`href="/library?tab=${c.id}"`), `${c.id} reachable from the desktop menu`);
  const phone = home.body.match(/<details class="nav-menu">[\s\S]*?<\/nav>/)[0];
  for (const c of categories) assert.ok(phone.includes(`href="/library?tab=${c.id}"`), `${c.id} reachable from the phone menu`);
  assert.equal((phone.match(/<details class="nav-family">/g) || []).length >= 5, true, "families fold closed on phones");
  assert.doesNotMatch(phone, /<details class="nav-family" open/);
  const titles = [...panel.matchAll(/<p class="nav-col-title">([^<]+)</g)].map((m) => m[1].replace("&amp;", "&"));
  assert.deepEqual(titles.slice(0, 5), libraryFamilies.map((f) => f.label));
  const music = desk.match(/<div class="nav-panel nav-panel-music">[\s\S]*?<\/div>/)[0];
  assert.match(music, /href="\/music">Songs</);
  const lib = await call("/library?tab=sacred-texts");
  assert.match(lib.body, /<summary class="is-current">Library/, "Library is highlighted on a tab");
  assert.match(lib.body, /<a href="\/library\?tab=sacred-texts" aria-current="page">Sacred Texts<\/a>/);
  const teach = await call("/teachings/the-zohar");
  assert.match(teach.body, /<summary class="is-current">Library/, "and on a teaching page");
  const groups = [...lib.body.matchAll(/<h2 class="tab-family-title">([^<]+)</g)].map((m) => m[1].replace("&amp;", "&"));
  assert.deepEqual(groups.slice(0, 5), libraryFamilies.map((f) => f.label));
  const order = libraryFamilies[0].tabs.filter((id) => categories.some((c) => c.id === id)).map((id) => lib.body.indexOf(`class="tab" href="/library?tab=${id}"`));
  assert.deepEqual([...order].sort((a, b) => a - b), order, "tabs in family order");
  const foot = home.body.match(/<nav aria-label="Footer">([\s\S]*?)<\/nav>/)[1];
  assert.deepEqual([...foot.matchAll(/>([^<]+)<\/a>/g)].map((m) => m[1]), ["Library of Light", "Masters &amp; Angels", "Music", "Versual Studio", "About", "My Vision", "Contact", "Picture credits", "Privacy", "Terms"]);
  // "New teachings" on the home page shows the newest series (updated Nov 2026).
  for (const slug of ["death-is-a-doorway", "the-mystery-schools", "love-and-marriage"]) assert.ok(home.body.includes(`href="/teachings/${slug}"`), slug);
  assert.ok(home.body.includes('href="/teachings/the-path-of-study"'), "Path of Study on the home page");
  assert.equal(categories.find((c) => c.id === "knowledge").blurb, "Science and spirit side by side for a healthy life and good energy: food, water, the life-force, forgiveness and more.");
});

test("Sacred Lands: four peaceful pages in History & Origins, a map with no modern borders, every quote sourced", async () => {
  const { libraryFamilies } = await import("../lib/content.js");
  assert.ok(libraryFamilies.find((f) => f.id === "history").tabs.includes("sacred-lands"));
  const home = await call("/");
  assert.match(home.body, /href="\/library\?tab=sacred-lands"/);
  for (const slug of ["the-holy-land-and-lebanon", "jerusalem-city-of-peace", "lebanon-in-scripture", "peace-in-the-land-of-god"]) {
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.match(page.body, /<h2[^>]*>Sources<\/h2>/, `${slug} has sources`);
    assert.doesNotMatch(page.body, /\{\{land-/, `${slug} has no leftover placeholders`);
    assert.match(page.body, /Samadhi&#39;s view|Samadhi's view/, `${slug} labels Samadhi's view`);
  }
  const map = await call("/teachings/the-holy-land-and-lebanon");
  assert.match(map.body, /id="sl-map-t"/);
  assert.match(map.body, /No modern borders are drawn/);
  assert.match(map.body, /blessed for \(all\) peoples/);
  const peace = await call("/teachings/peace-in-the-land-of-god");
  for (const t of ["Isaac and Ishmael buried him", "as if he had killed all mankind", "Blessed are the peacemakers", "They shall not hurt nor destroy in all my holy mountain", "A prayer for peace"]) assert.ok(peace.body.includes(t), t);
  const leb = await call("/teachings/lebanon-in-scripture");
  for (const t of ["which he hath planted", "Zarephath", "Tyre and Sidon", "Qana", "Qadisha"]) assert.ok(leb.body.includes(t), t);
  assert.match(leb.body, /<img src="\/images\/cedars-of-lebanon\.jpg" width="1400" height="788"/);
  assert.match(leb.body, /An artistic vision of the cedars of Lebanon/);
  assert.doesNotMatch(leb.body, /id="sl-cedar-t"/, "only the real cedar picture, no drawn cedar");
  const img = await call("/images/cedars-of-lebanon.jpg");
  assert.equal(img.status, 200);
});

test("The Heart and the Ego: three linked teachings in the Teachings tab, sourced, with Samadhi's view and no political names", async () => {
  // Since Nov 2026 these live in their own tab, The Heart and the Ego (same addresses).
  const items = categories.find((c) => c.id === "heart-and-ego").items.map((i) => i.slug);
  const slugs = ["give-your-soul-only-to-god", "the-idols-of-today", "charity-sharing-our-blessings", "the-mirror-seeing-god-in-every-face"];
  for (const slug of slugs) {
    assert.ok(items.includes(slug), `${slug} is in The Heart and the Ego`);
    const page = await call(`/teachings/${slug}`);
    assert.equal(page.status, 200, slug);
    assert.match(page.body, /<h2[^>]*>Sources<\/h2>/);
    assert.match(page.body, /Samadhi&#39;s view|Samadhi's view/);
    for (const other of slugs) assert.ok(page.body.includes(`href="/teachings/${other}"`), `${slug} links ${other}`);
  }
  for (const slug of slugs) assert.match((await call(`/teachings/${slug}`)).body, /id="he-t"/, `${slug} has the golden heart`);
  const mary = await call("/teachings/prayer-to-mother-mary");
  assert.match(mary.body, /\/images\/sacred-hearts\.jpg/);
  assert.match(mary.body, /An artistic vision of the Immaculate Heart of Mary/);
  assert.equal((await call("/images/sacred-hearts.jpg")).status, 200);
  const charity = await call("/teachings/charity-sharing-our-blessings");
  assert.match(charity.body, /A word of care/);
  for (const t of ["tzedakah", "zakat", "Maimonides", "lendeth unto the LORD"]) assert.ok(charity.body.includes(t), t);
  const idols = await call("/teachings/the-idols-of-today");
  assert.match(idols.body, /Wealth and children are an ornament/);
  const mirror = await call("/teachings/the-mirror-seeing-god-in-every-face");
  for (const t of ["The believer is the mirror of his brother", "that ye may know one another", "What you hate, you experience", "You are me. You are God"]) assert.ok(mirror.body.includes(t) || mirror.body.includes(t.replace("God's", "God&#39;s")), t);
});

test("Soul contracts (Teachings) and The Grandfather's Letter (Start Here): sourced, careful, with Samadhi's view", async () => {
  assert.ok(categories.find((c) => c.id === "teachings").items.some((i) => i.slug === "soul-contracts-and-soul-families"));
  assert.ok(categories.find((c) => c.id === "start").items.some((i) => i.slug === "the-grandfathers-letter"));
  const soul = await call("/teachings/soul-contracts-and-soul-families");
  for (const t of ["Am I not your Lord?", "conscripted soldiers", "Before I formed thee in the belly", "gilgul", "synchronicity", "Holding these ideas wisely", "Never use it to blame"]) assert.ok(soul.body.includes(t), t);
  const letter = await call("/teachings/the-grandfathers-letter");
  for (const t of ["Who carried the letter?", "isnad", "Prove all things", "Do other witnesses agree?", "write it in their hearts"]) assert.ok(letter.body.includes(t), t);
  for (const page of [soul, letter]) { assert.match(page.body, /<h2[^>]*>Sources<\/h2>/); assert.match(page.body, /Samadhi&#39;s view|Samadhi's view/); }
});

test("One Source, One Message: in Prophets & Teachers after the overview, honest about the hard stories, Samadhi's view labelled", async () => {
  const items = categories.find((c) => c.id === "prophets").items.map((i) => i.slug);
  assert.deepEqual(items.slice(0, 2), ["prophets-and-teachers", "one-source-one-message"]);
  const page = await call("/teachings/one-source-one-message");
  for (const t of ["We make no distinction between any of them", "Truth is one", "The hard stories", "Badr", "Origen", "Eduyot", "There is no hell, only the lives we create"]) assert.ok(page.body.includes(t), t);
  assert.match(page.body, /Samadhi&#39;s view|Samadhi's view/);
  assert.match(page.body, /<h2[^>]*>Sources<\/h2>/);
});

test("Gap-filling teachings: Soul's Journey, Mystery Schools, Spirit in Daily Life, additions and the Path of Study", async () => {
  const { libraryFamilies } = await import("../lib/content.js");
  const ids = categories.map((c) => c.id);
  for (const id of ["souls-journey", "mystery-schools", "daily-life"]) assert.ok(ids.includes(id), id);
  assert.equal(categories.find((c) => c.id === "souls-journey").items.length, 7);
  const fam = Object.fromEntries(libraryFamilies.map((f) => [f.id, f.tabs]));
  assert.ok(fam.spiritual.includes("souls-journey") && fam.spiritual.includes("daily-life") && fam.messengers.includes("mystery-schools"));
  const added = { practices: ["sacred-sound-mantra-and-frequency", "the-power-of-silence", "fasting-across-the-traditions"], "beyond-the-veil": ["dreams-the-language-of-the-soul"], teachings: ["the-divine-feminine", "grace-surrender-and-humility"], "sacred-geometry": ["numerology-the-meaning-of-numbers"], start: ["the-path-of-study"] };
  for (const [tab, slugs] of Object.entries(added)) for (const s of slugs) assert.ok(categories.find((c) => c.id === tab).items.some((i) => i.slug === s), s);
  // Samadhi's numbers are labelled as the teaching of this path; the Karmic Board is drawn as lights.
  const death = await call("/teachings/the-144-year-cycle");
  assert.match(death.body, /The teaching of this path/);
  assert.match(death.body, /Samadhi&#39;s view|Samadhi's view/);
  const board = await call("/teachings/the-life-review-and-the-karmic-board");
  assert.match(board.body, /Vairochana/);
  assert.ok(board.body.includes('src="/images/soul-stairs.jpg"'), "Samadhi's stairway picture");
  // Every teaching in a Path tab carries the Path of Study sign; the wheel links all twelve stages.
  const page = await call("/teachings/love-and-marriage");
  assert.match(page.body, /class="path-strip"[\s\S]*Stage 10 of 12: The Heart and Daily Life[\s\S]*Next stage: Beyond the Veil/);
  const path = await call("/teachings/the-path-of-study");
  assert.equal((path.body.match(/class="pw-node"/g) || []).length, 12);
  assert.equal((path.body.match(/class="pw-stage"/g) || []).length, 12);
  const last = await call("/teachings/losing-someone-we-love");
  assert.match(last.body, /Next stage: Arriving/);
  // The numerology calculator loads the practice script; the care notes are present.
  const num = await call("/teachings/numerology-the-meaning-of-numbers");
  assert.match(num.body, /data-px-num/);
  assert.match(num.body, /practice\.js/);
  const fast = await call("/teachings/fasting-across-the-traditions");
  assert.match(fast.body, /not for everyone/);
  assert.ok(!/\d+\s?(g|grams|kcal|calories)\b/i.test(fast.body.replace(/<[^>]+>/g, " ")), "no measurements on the fasting page");
});

test("The Power of Words: in The Heart and the Ego, Bava Metzia 58b, no swear words, labelled as spiritual teaching", async () => {
  const heart = categories.find((c) => c.id === "heart-and-ego");
  assert.ok(heart.items.some((i) => i.slug === "the-power-of-words"));
  const page = await call("/teachings/the-power-of-words");
  assert.equal(page.status, 200);
  const low = page.body.toLowerCase();
  for (const t of ["Bava Metzia 58b", "Proverbs 18:21", "James 3:9", "Ephesians 4:29", "Sahih al-Bukhari 6018", "Right Speech", "17:15", "lashon hara", "ona", "not as proven science", "the-mirror-seeing-god-in-every-face", "the-golden-rule", "the-power-of-affirmations", "blessing-god"]) assert.ok(low.includes(t.toLowerCase()), t);
  assert.match(page.body, /Stage 10 of 12: The Heart and Daily Life/);
});

test("The Heart and the Ego: one course of 13 lessons gathered from four tabs, addresses unchanged", async () => {
  const { libraryFamilies } = await import("../lib/content.js");
  const heart = categories.find((c) => c.id === "heart-and-ego");
  assert.deepEqual(heart.items.map((i) => i.slug), ["fear-ego-and-grief", "give-your-soul-only-to-god", "the-idols-of-today", "greed-wanting-more-than-we-need", "envy-and-jealousy", "competition-and-rivalry", "hate-and-bad-wishes", "black-magic-and-the-law-of-return", "the-power-of-words", "the-mirror-seeing-god-in-every-face", "the-golden-rule", "the-power-of-forgiveness", "charity-sharing-our-blessings"]);
  assert.ok(libraryFamilies.find((f) => f.id === "spiritual").tabs.includes("heart-and-ego"));
  const all = categories.flatMap((c) => c.items.map((i) => i.slug));
  for (const s of heart.items.map((i) => i.slug)) assert.equal(all.filter((x) => x === s).length, 1, `${s} appears once`);
  for (const s of ["greed-wanting-more-than-we-need", "envy-and-jealousy", "competition-and-rivalry", "hate-and-bad-wishes", "the-golden-rule", "the-power-of-forgiveness"]) {
    const page = await call(`/teachings/${s}`);
    assert.equal(page.status, 200, s);
    assert.match(page.body, /The Heart and the Ego/);
  }
  const hate = await call("/teachings/hate-and-bad-wishes");
  assert.match(hate.body, /Mashallah/);
  assert.match(hate.body, /Samadhi&#39;s view|Samadhi's view/);
});

test("The Names of God: beside Teachings, ten equal traditions, the Holy Name never pronounced, names never at the foot of a page", async () => {
  const { libraryFamilies } = await import("../lib/content.js");
  const { TRADITIONS } = await import("../lib/names.js");
  const tabs = libraryFamilies.find((f) => f.id === "spiritual").tabs;
  assert.equal(tabs[tabs.indexOf("teachings") + 1], "names-of-god");
  const tab = categories.find((c) => c.id === "names-of-god");
  assert.equal(tab.items.length, 11);
  const over = await call("/teachings/the-names-of-god");
  assert.match(over.body, /The order of traditions is not a ranking\. Each is honored equally\./);
  assert.equal((over.body.match(/class="nm-door"/g) || []).length, 10);
  const labels = TRADITIONS.map((t) => t.label);
  assert.deepEqual(labels, [...labels].sort((a, b) => a.replace(/^The /, "").localeCompare(b.replace(/^The /, ""))), "alphabetical, not a ranking");
  const jud = await call("/teachings/the-names-of-god-in-judaism");
  assert.match(jud.body, /יהוה/);
  assert.match(jud.body, /This Name is never spoken aloud\. In prayer it is read as Adonai, and in daily speech as HaShem\./);
  for (const t of TRADITIONS) {
    const page = await call(`/teachings/${t.slug}`);
    assert.equal(page.status, 200, t.slug);
    assert.ok(!/Yahweh|Jehovah|Yahveh/i.test(page.body), `${t.slug}: no pronunciation of the Holy Name`);
    assert.ok(!/<img /.test(page.body.split('<article class="article">')[1] || ""), `${t.slug}: no pictures in the teaching`);
    // The foot of the page (from "Explore the connection" on) carries no sacred script.
    const foot = page.body.slice(page.body.lastIndexOf("Explore the connection"));
    assert.ok(!/[֐-׿؀-ۿऀ-ॿ਀-੿一-鿿]/.test(foot), `${t.slug}: no sacred script at the foot`);
  }
  const islam = await call("/teachings/the-names-of-god-in-islam");
  assert.match(islam.body, /Subhanahu wa Ta&#39;ala \(Glorified and Exalted is He\)|Subhanahu wa Ta'ala \(Glorified and Exalted is He\)/);
  assert.match(islam.body, /peace be upon him/);
});

test("Part E: closing words on every teaching, care on pages about death, health reminder, hope in the Ages, Privacy and Terms", async () => {
  const any = await call("/teachings/the-names-of-god");
  assert.match(any.body, /Take what resonates with your heart; leave the rest\./);
  assert.match(any.body, /If you notice an error, please <a href="\/contact">contact us<\/a>/);
  const death = await call("/teachings/death-is-a-doorway");
  assert.match(death.body, /If you are struggling, please reach out\. In the US, call or text 988\. You are loved, and you are not alone\./);
  const shakespeare = await call("/teachings/shakespeare-the-man");
  assert.ok(!/call or text 988\. You are loved/.test(shakespeare.body), "no care line where death is only history");
  const food = await call("/teachings/food-is-energy");
  assert.match(food.body, /Spiritual guidance, not a replacement for your doctor\./);
  const age = categories.find((c) => c.id === "ages-of-the-world").items[0];
  const agePage = await call(`/teachings/${age.slug}`);
  assert.match(agePage.body, /The cycle always turns\. The Golden Age returns/);
  const plate = await call("/teachings/compassion-on-the-plate");
  assert.match(plate.body, /All life is sacred\. When an animal is raised with love/);
  assert.ok(!/Eat less meat/.test(plate.body));
  const karma = await call("/teachings/reincarnation-and-karma");
  assert.match(karma.body, /Karma is the soul&#39;s school, not a punishment|Karma is the soul's school, not a punishment/);
  const iam = await call("/teachings/the-i-am-teachings");
  assert.match(iam.body, /The drop is ocean, yet the drop is not the whole ocean\./);
  const flood = await call("/teachings/the-great-flood");
  assert.ok(flood.body.indexOf("Noah") < flood.body.indexOf("One memory, many peoples"));
  const jer = await call("/teachings/jerusalem-city-of-peace");
  assert.match(jer.body, /Jerusalem, holy city to Jews, Christians and Muslims\./);
  assert.ok(jer.body.includes('src="/images/jerusalem-olives.jpg"'), "Samadhi's olive-tree picture");
  assert.equal((await call("/images/jerusalem-olives.jpg")).status, 200);
  for (const p of ["/privacy", "/terms"]) { const r = await call(p); assert.equal(r.status, 200, p); }
  const all = categories.flatMap((c) => c.items).map((i) => i.body).join(" ");
  assert.ok(!/Jehovah|Yahweh/.test(all), "the Holy Name is not spelled out anywhere");
  assert.ok(!/religions carry dogma|religion is wrong/i.test(all));
});

test("Respect fixes: morning pictures restored, statement paragraph, The Sacred Seed", async () => {
  const { placeForPage } = await import("../lib/pictures.js");
  assert.equal(placeForPage.teachings, "jerusalem", "restored by Samadhi");
  const about = await call("/about");
  assert.match(about.body, /I represent no sect or group, and this site is not one\./);
  assert.ok(about.body.indexOf("I seek to heal, not to hurt") < about.body.indexOf("What I offer is simple"));
  const seed = await call("/teachings/the-sacred-seed");
  assert.match(seed.body, /Lilith/, "the Lilith passage is restored (Samadhi, Nov 2026)");
  assert.ok(!/liable to death|coffin/i.test(seed.body));
  assert.match(seed.body, /No one should fall into despair; every soul can begin again\./);
});

test("Replacement pictures: a numbered file in public/images/replacements takes its place automatically", async () => {
  const { writeFileSync, rmSync, existsSync } = await import("node:fs");
  const { REPLACEMENTS, replacementsDir } = await import("../lib/replacements.js");
  assert.deepEqual(REPLACEMENTS.map((r) => r.n), ["01", "02", "03", "04", "05", "06", "07", "08", "11"], "09 and 10 withdrawn; numbers never change");
  assert.ok(existsSync(`${replacementsDir}/LIST.md`));
  const before = await call("/teachings/andromedans");
  assert.ok(!before.body.includes("/images/replacements/01"), "nothing changes until the file exists");
  const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex");
  const file = `${replacementsDir}/01.png`;
  writeFileSync(file, png);
  try {
    const after = await call("/teachings/andromedans");
    assert.match(after.body, /<img src="\/images\/replacements\/01\.png"/);
    const img = await call("/images/replacements/01.png");
    assert.equal(img.status, 200);
    assert.equal(img.headers["Content-Type"], "image/png");
  } finally { rmSync(file); }
  assert.notEqual((await call("/images/replacements/99.png")).status, 200, "only numbers on the list are served");
  assert.notEqual((await call("/images/replacements/LIST.md")).status, 200);
});

test("Samadhi's promise on every page, his sayings at the end of each tab, and one address setting", async () => {
  const { site, SAMADHI_SAYINGS, groupByFamily } = await import("../lib/content.js");
  for (const p of ["/teachings/the-names-of-god", "/about", "/library?tab=prayers", "/music", "/terms", "/"]) {
    const r = await call(p);
    assert.equal((r.body.match(/class="promise"/g) || []).length, 1, `${p}: promise once`);
    assert.match(r.body, /<a href="\/about#statement">personal beliefs<\/a>/, p);
  }
  const teach = await call("/teachings/the-names-of-god");
  assert.ok(teach.body.indexOf('class="promise"') < teach.body.indexOf("Take what resonates"), "promise sits above the closing lines");
  const terms = await call("/terms");
  assert.match(terms.body, /<h2>Personal beliefs<\/h2>/);
  assert.match(terms.body, /No violence, sexual content or hatred is published here\./);
  assert.ok(terms.body.includes(`By using ${site.address} you agree`));
  const order = groupByFamily(categories).flatMap((g) => g.cats.map((c) => c.id));
  let last = "";
  for (const id of order) {
    const tab = await call(`/library?tab=${id}`);
    const m = tab.body.match(/<figure class="samadhi-saying"><blockquote>([^<]+)<\/blockquote><figcaption>— Samadhi<\/figcaption>/);
    assert.ok(m, id);
    assert.ok(SAMADHI_SAYINGS.map((q) => q.replace(/'/g, "&#39;")).includes(m[1]), id);
    assert.notEqual(m[1], last, `${id}: not the same saying as the tab before`);
    last = m[1];
  }
});

test("Spirit in Daily Life opens every lesson with Samadhi's lamp picture", async () => {
  for (const i of categories.find((c) => c.id === "daily-life").items) {
    const page = await call(`/teachings/${i.slug}`);
    assert.ok(page.body.includes('src="/images/daily-lamp.jpg"'), i.slug);
  }
  assert.equal((await call("/images/daily-lamp.jpg")).status, 200);
});

test("The Soul's Journey uses Samadhi's door and stairway pictures, no drawings", async () => {
  for (const i of categories.find((c) => c.id === "souls-journey").items) {
    const page = await call(`/teachings/${i.slug}`);
    assert.ok(/src="\/images\/soul-(door|stairs)\.jpg"/.test(page.body), i.slug);
    assert.ok(!/class="sj-figure"/.test(page.body), `${i.slug}: no drawn figure`);
  }
});
