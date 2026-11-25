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

test("the encyclopedia sections are in the Library but the home page keeps its five paths", async () => {
  for (const id of ["sages-and-kings", "mystics", "human-story"]) {
    const c = categories.find((x) => x.id === id);
    assert.ok(c && c.items.length >= 8, id);
  }
  const home = await call("/");
  assert.equal((home.body.match(/<article class="card"><canvas class="orb"/g) || []).length, 5);
  const grid = home.body.slice(home.body.indexOf("Five paths of knowledge"), home.body.indexOf('<section class="quote">'));
  assert.ok(!grid.includes("/library?tab=mystics"), "the home page cards stay the original five");
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
  for (const fact of ["Genesis 1:27", "khalifa", "Isaac Luria", "as long as the divine nature lasted in them", "Edgar Cayce", "Philip Sclater", "Luke 15:24", "No archaeological trace", "love and compassion"]) assert.ok(page.body.includes(fact), fact);
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
  assert.equal(ids.indexOf("great-flood"), ids.indexOf("human-story") + 1, "right after The Human Story (Atlantis)");
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
  for (const t of ["120 metres", "Meltwater Pulse 1A", "Younger Dryas", "Doggerland", "Black Sea", "Most scientists do not accept"]) assert.ok(science.body.includes(t), t);
  const atlantis = await call("/teachings/atlantis");
  assert.match(atlantis.body, /Great Flood tab/, "Atlantis points to the new tab");
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
    "compassion-on-the-plate": ["Govinda", "Go Mata", "tza&#39;ar ba&#39;alei chayim|tza'ar ba'alei chayim", "has <strong>not</strong> shown", "Temple Grandin"],
    "processed-foods-and-meats": ["NOVA", "carcinogenic to humans", "18%"],
    "the-sacred-seed": ["Niddah 13a", "Even HaEzer 23:1", "sons do not walk behind his coffin", "dhatu kshaya", "Never despair", "Genesis 38:9", "Tikkun HaKlali", "Lilith", "brahmacharya", "What medicine says", "No shame"] };
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
