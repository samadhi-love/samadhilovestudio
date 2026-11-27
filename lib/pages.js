import { site, about, vision, respect, categories, findTeaching, truths, gallery, groupByFamily } from "./content.js";
import { candidates, describe, pictureFor, pictureForTeaching, placeForPage, creditFor, chosen, backdropFor, portraitFor, portraitChosen, portraitCaption } from "./pictures.js";
import { youtube, podcasts, youtubeId, liveSocials } from "./media.js";
import { wisdomFor } from "./wisdom.js";
import { geometryNames, geometrySprite } from "./geometry.js";
import { renderMarkdown, escapeHtml as e } from "./md.js";
import { published, findPublishedTeaching, savedLinks } from "./posts.js";
import { chakraFigure } from "./kriya.js";
import { treeArt } from "./treeoflife.js";
import { veilArt } from "./veil.js";
import { geometryArt } from "./sacredgeometry.js";
import { philosophyArt } from "./philosophy.js";
import { lotusArt } from "./lotus.js";
import { sacredTextArt } from "./sacredtexts.js";
import { prophetArt } from "./prophets.js";
import { practiceArt } from "./practices.js";
import { startArt } from "./start.js";
import { landArt } from "./sacredlands.js";
import { heartArt } from "./heart.js";
import { jungMandala } from "./newteachers.js";
import { dawnArt } from "./blessing.js";
import { starArt } from "./starart.js";
import { crossArt } from "./crosses.js";
import { violetArt, violetPanel, sgPortrait } from "./saintgermain.js";
import { starMap } from "./starmaps.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync as readAssetSync } from "node:fs";
import { createHash as hashAsset } from "node:crypto";
// A short fingerprint of each style/script file, added to its link so browsers fetch the new copy whenever it changes.
const assetVersions = {};
function assetVersion(name) {
  if (!assetVersions[name]) {
    try { assetVersions[name] = hashAsset("sha1").update(readAssetSync(new URL(`../public/${name}`, import.meta.url))).digest("hex").slice(0, 10); }
    catch { assetVersions[name] = "1"; }
  }
  return assetVersions[name];
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

const isPublic = () => process.env.SITE_PUBLIC === "true";
const fonts = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600&display=swap";
// The Sanskrit-style font: in full only on pages with Sanskrit-style lettering; elsewhere just the one ॐ glyph (a tiny file).
const sanskritFull = "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit:ital@0;1&display=swap";
const sanskritOm = "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&text=%E0%A5%90&display=swap";

const arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const note = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
const star = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f2c46d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.6h7.6z"/></svg>';

// Music & media: Videos, Podcasts and Gallery appear only once they have content (see hasContent).
const musicMenu = [
  ["/music", "Songs", "music"],
  ["/videos", "Videos", "videos"],
  ["/podcasts", "Podcasts", "podcasts"],
  ["/gallery", "Gallery", "gallery"],
];

// A band of truths drifting across the page, each followed by a sacred-geometry sign.
function ticker(where) {
  const order = where === "bottom" ? [...truths].reverse() : truths;
  const items = order.map((t, i) => `<li class="ticker-item"><span>${e(t)}</span><svg class="sg sg-${i % 4}" aria-hidden="true" focusable="false"><use href="#sg-${geometryNames[i % geometryNames.length]}"/></svg></li>`).join("");
  const control = where === "top" ? '<button type="button" class="ticker-toggle" aria-pressed="false" data-ticker-toggle>Pause</button>' : "";
  return `<div class="ticker ticker-${where}" role="region" aria-label="Truths">${control}<div class="ticker-track"><ul class="ticker-list">${items}</ul><ul class="ticker-list" aria-hidden="true">${items}</ul></div></div>`;
}

// A small golden ॐ before each teaching's name in an open Library tab (hidden from screen readers, so names are read normally).
const omMini = '<span class="om-mini" aria-hidden="true">ॐ</span>';

// Videos, Podcasts and Gallery only appear in the menus once they have something to show.
function hasContent(key) {
  if (key === "videos") return published("video").some((v) => youtubeId(v.youtube)) || youtube.some((v) => youtubeId(v.url));
  if (key === "podcasts") return published("podcast").some((p) => p.audio || /^https:\/\//.test(p.link || "")) || podcasts.some((p) => /^https:\/\//.test(p.url || ""));
  if (key === "gallery") return published("photo").length > 0;
  return true;
}
const chevron = '<svg class="nav-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

// The menu: six items on desktop (Library and Music open panels), and the folding "Menu" on phones.
// Built with <details>/<summary> only, so it works with mouse, touch, keyboard and screen readers without scripts.
// Desktop panels share one name, so opening one closes the other in browsers that support it.
function nav(active) {
  const groups = groupByFamily(libraryCategories());
  const inLibrary = active === "library" || (active !== "masters" && groups.some((g) => g.cats.some((c) => c.id === active)));
  const cur = (key) => (key === active ? ' aria-current="page"' : "");
  const tabLink = (c) => `<a href="/library?tab=${c.id}"${cur(c.id)}>${e(c.label)}</a>`;
  const music = musicMenu.filter(([, , key]) => hasContent(key));
  const inMusic = music.some(([, , key]) => key === active);
  const musicLinks = music.map(([href, label, key]) => `<a href="${href}"${cur(key)}>${e(label)}</a>`).join("");
  const contact = `<a class="pill" href="/contact"${cur("contact")}>Contact</a>`;
  const columns = groups.map((g) => `<div class="nav-col"><p class="nav-col-title">${e(g.label)}</p>${g.cats.map(tabLink).join("")}</div>`).join("");
  const desktop = `<div class="nav-links">
<details class="nav-drop nav-drop-library" name="site-menu"><summary${inLibrary ? ' class="is-current"' : ""}>Library ${chevron}</summary><div class="nav-panel nav-panel-library"><div class="nav-cols">${columns}</div><a class="nav-all" href="/library">See the whole Library →</a></div></details>
<a href="/masters"${cur("masters")}>Masters &amp; Angels</a>
<details class="nav-drop nav-drop-music" name="site-menu"><summary${inMusic ? ' class="is-current"' : ""}>Music ${chevron}</summary><div class="nav-panel nav-panel-music">${musicLinks}</div></details>
<a href="/studio">Versual Studio</a>
<a href="/about"${cur("about")}>About</a>
${contact}</div>`;
  const families = groups.map((g) => `<details class="nav-family"><summary>${e(g.label)} ${chevron}</summary><div class="nav-family-links">${g.cats.map(tabLink).join("")}</div></details>`).join("");
  const phone = `<details class="nav-menu"><summary><span class="nav-menu-bars" aria-hidden="true"></span>Menu</summary><div class="nav-menu-panel">
<p class="nav-menu-title">Library of Light</p>${families}<a class="nav-family-all" href="/library">See the whole Library →</a>
<div class="nav-menu-group"><p class="nav-menu-title">Music</p>${musicLinks}</div>
<div class="nav-menu-group nav-menu-end"><a href="/studio">Versual Studio</a><a href="/about"${cur("about")}>About</a>${contact}</div></div></details>`;
  return `<nav class="nav wrap" aria-label="Main"><a class="brand" href="/"><span class="om" aria-hidden="true">ॐ</span>${e(site.name)}</a>
${desktop}
${phone}</nav>`;
}

function socialLinks() {
  const saved = savedLinks();
  const list = liveSocials().filter((x) => !(x.name in saved)).concat(
    Object.entries(saved).filter(([, url]) => /^https:\/\//.test(url)).map(([name, url]) => ({ name, url })));
  if (!list.length) return "";
  return `<div class="socials" aria-label="Find us on"><span>Find us on</span>${list.map((x) => `<a class="social" href="${e(x.url)}" rel="noopener me" target="_blank">${e(x.name)}</a>`).join("")}</div>`;
}

// A sacred place softly faded in behind the page, once its picture has been chosen.
function journey(active, main) {
  const slug = placeForPage[active];
  const file = backdropFor(slug && pictureFor(slug));
  if (!file) return main;
  return `<div class="journey" style="--place:url('/${e(file)}')">${main}</div>`;
}

// Set for each request by the server: the site's address and the page's own address (for canonical and share links).
const here = { origin: "", path: "/" };
const abs = (p) => (here.origin ? here.origin + p : p);
function shareImage() {
  const file = pictureFor("orion-nebula") || pictureFor("giza");
  return file ? abs("/" + file) : "";
}

function layout({ title, description, active, header, main, canonical, type = "website", backdrop = true }) {
  const fullTitle = title ? `${title} · ${site.name}` : `${site.name} · Wisdom, light and music`;
  const url = abs(canonical || here.path);
  const image = shareImage();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fullTitle)}</title>
<meta name="description" content="${e(description || site.tagline)}">
${isPublic() ? "" : '<meta name="robots" content="noindex, nofollow">'}
<link rel="canonical" href="${e(url)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${e(site.name)}">
<meta property="og:url" content="${e(url)}">
<meta property="og:title" content="${e(fullTitle)}">
<meta property="og:description" content="${e(description || site.tagline)}">
${image ? `<meta property="og:image" content="${e(image)}">
<meta property="og:image:alt" content="The Orion Nebula, a cloud where new stars are born">
<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<meta name="theme-color" content="#05040d">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<link rel="stylesheet" href="${/class="(?:[^"]* )?(?:sanskritish|deva)\b/.test(main) ? sanskritFull : sanskritOm}">
<link rel="stylesheet" href="/site.css?v=${assetVersion("site.css")}">
<script src="/sky.js?v=${assetVersion("sky.js")}" defer></script>
${/data-px-/.test(main) ? `<script src="/practice.js?v=${assetVersion("practice.js")}" defer></script>` : ""}
</head>
<body>
${geometrySprite}
<a class="skip" href="#main">Skip to content</a>
${ticker("top")}
${header.replace("@@NAV@@", nav(active))}
<main id="main">
${active === "home" || !backdrop ? main : journey(active, main)}
</main>
${ticker("bottom")}
<footer>
  <div class="foot wrap">
    <div class="sacred"><h2>This is a sacred space</h2><p>Every path is honoured here. Take what is true for you, speak with kindness, and honour the work. Nothing here replaces medical or professional advice. Thank you for walking here gently. <a href="/about#respect">Read more</a></p></div>
    <nav aria-label="Footer"><a href="/library">Library of Light</a><a href="/masters">Masters &amp; Angels</a><a href="/music">Music</a><a href="/studio">Versual Studio</a><a href="/about">About</a><a href="/about#vision">My Vision</a><a href="/contact">Contact</a><a href="/credits">Picture credits</a></nav>
  </div>
  ${socialLinks()}
  <p class="legal">${e(site.motto)} · © ${new Date().getFullYear()} ${e(site.name)}</p>
</footer>
${isPublic() ? "" : '<p class="preview-flag">Private preview</p>'}
</body>
</html>`;
}

function banner({ scene, eyebrow, title, lead }) {
  return `<header class="banner"><canvas data-sky="${e(scene)}" aria-hidden="true"></canvas><div class="shade"></div><div class="fade"></div>
@@NAV@@
<div class="banner-text wrap">${eyebrow ? `<p class="eyebrow">${e(eyebrow)}</p>` : ""}<h1 dir="auto">${e(title)}</h1>${lead ? `<p class="lead" dir="auto">${e(lead)}</p>` : ""}</div></header>`;
}

function home() {
  const paths = groupByFamily(libraryCategories()).filter((g) => g.id !== "more").map((g) => {
    const list = g.cats.map((c) => `<li><a href="/library?tab=${c.id}">${e(c.label)}</a></li>`).join("");
    const count = g.cats.reduce((n, c) => n + c.items.length, 0);
    return `<article class="card family-card"><canvas class="orb" data-sky="${g.orb}" aria-hidden="true"></canvas>
<h3>${e(g.label)}</h3><p>${e(g.line)}</p><ul class="family-tabs">${list}</ul>
<a class="more" href="/library?tab=${g.cats[0].id}">${count} teachings</a></article>`;
  }).join("\n");
  const firstPrayer = (categories.find((c) => c.id === "prayers") || { items: [] }).items[0];
  const pick = [["sacred-geometry", "art1", "#f2c46d"], ["meditation-and-yoga", "art2", "#9fe7dc"], [firstPrayer && firstPrayer.slug, "art3", "#9cc7ff"]];
  const stories = pick.map(([slug, scene, color]) => {
    const found = findTeaching(slug);
    if (!found) return "";
    const { category, item } = found;
    return `<article class="card story"><canvas data-sky="${scene}" aria-hidden="true"></canvas><div class="inner">
<p class="tag" style="color:${color}">${e(category.label)}</p><h3>${e(item.title)}</h3><p>${e(item.summary)}</p>
<a class="more" href="/teachings/${item.slug}">Read teaching</a></div></article>`;
  }).join("\n");

  const header = `<header class="hero"><canvas data-sky="hero" aria-hidden="true"></canvas><div class="shade"></div><div class="fade"></div>
@@NAV@@
<div class="hero-text wrap"><h1>${e(site.name)}</h1><p class="lead">${e(site.tagline)}</p>
<div class="actions"><a class="btn btn-gold" href="/library">Explore the Teachings ${arrow}</a><a class="btn btn-ghost" href="/music">${note} Listen to the Music</a></div></div>
<div class="hero-triptych wrap"><figure class="triptych-panel triptych-centre"><div class="art-frame"><img class="hero-centrepiece" src="/images/home-cosmic-portrait.jpg" width="1400" height="788" alt="A cosmic portrait in blue and violet starlight, with music notes, galaxies and golden sacred geometry. Artwork by SAMADHI LOVE." decoding="async"></div><figcaption class="triptych-caption">${e(site.motto)}</figcaption></figure><figure class="triptych-panel triptych-left"><div class="art-frame"><img class="hero-prayer" src="/images/hero-prayer.jpg" width="960" height="536" alt="" decoding="async"></div></figure><figure class="triptych-panel triptych-right"><div class="art-frame"><img class="hero-galaxy" src="/images/hero-galaxy.jpg" width="960" height="536" alt="" decoding="async"></div></figure></div></header>`;

  const main = `<section><div class="wrap"><p class="eyebrow">The Library of Light</p><h2 class="section-title">Five families of knowledge</h2>
<p class="section-intro">Every teaching is filed under a title, and every title belongs to a family, so you can follow one path at a time or wander between them.</p>
<div class="grid">${paths}</div></div></section>
<section class="quote"><div class="wrap">${star}<blockquote>“Hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.”</blockquote><cite>The Buddha · Dhammapada, verse 5</cite></div></section>
<section><div class="wrap"><p class="eyebrow" style="color:var(--rose)">New teachings</p><h2 class="section-title">Read, reflect, remember</h2><div class="grid grid-wide">${stories}</div></div></section>
<section class="band"><canvas data-sky="studio" aria-hidden="true"></canvas><div class="shade"></div><div class="wrap">
<p class="eyebrow">Music &amp; Versual Studio</p><h2 class="section-title" style="max-width:660px">A unique creative platform where music, positive vibes and frequency meet</h2>
<p class="versual-tagline">Versual — where verse meets vision.</p>
<p class="section-intro" style="color:#d9d4f5">Listen to SAMADHI LOVE songs, or make your own in Versual Studio, the music app behind them.</p>
<div class="actions"><a class="btn btn-teal" href="/music">Listen to the songs</a><a class="btn btn-ghost" href="/studio">Open the Studio</a></div></div></section>
<section class="center"><div class="wrap narrow"><p class="eyebrow" style="color:var(--gold)">About</p><h2 class="section-title">Samadhi</h2>
<p style="font-size:19px;color:#d9d4f5">A spiritual musician and lifelong student of the world's mystical traditions, with roots in Lebanon. His songs are not written down: they arrive whole and are carried in memory. SAMADHI LOVE is the home of that work, a place to listen, reflect and grow.</p>
<p><a href="/about">Read the full story</a></p></div></section>`;
  return layout({ active: "home", header, main });
}

// Owner posts shaped like Library items.
function ownerItem(p) {
  const plain = String(p.body || "").replace(/[#*_>`\[\]()|-]+/g, " ").replace(/\s+/g, " ").trim();
  return { slug: p.slug, tag: p.lang === "ar" ? "عربي" : "New", title: p.title, summary: p.summary || (plain.length > 160 ? plain.slice(0, 157) + "…" : plain), body: p.body, lang: p.lang, cover: p.cover, youtube: p.youtube, owner: true };
}
// The Library tabs with Samadhi's own posts added (newest first), plus an Arabic tab once there are Arabic posts.
function libraryCategories() {
  const mine = published("teaching");
  const list = categories.map((c) => {
    const extra = mine.filter((p) => p.tab === c.id).map(ownerItem);
    return extra.length ? { ...c, items: [...extra, ...c.items] } : c;
  });
  const arabic = mine.filter((p) => p.lang === "ar").map(ownerItem);
  if (arabic.length) list.push({ id: "arabic", label: "عربي · Arabic", accent: "#f2c46d", scene: "lib", orb: "orb-sun", blurb: "تعاليم باللغة العربية · Teachings written in Arabic.", items: arabic });
  return list;
}

// A picture standing on one side of a tab's heading (Knowledge & Insight: Krishna on the left, Shiva on the right).
const sideImg = (im) => `<img class="tab-side" src="${e(im.src)}" width="${im.width}" height="${im.height}" alt="${e(im.alt)}" loading="lazy" decoding="async">`;

function library(params) {
  const cats = libraryCategories();
  const current = cats.find((c) => c.id === params.get("tab")) || cats[0];
  const pill = (c) => {
    const on = c.id === current.id;
    const style = on ? ` style="background:${c.accent};border-color:${c.accent}"` : "";
    return `<a class="tab" href="/library?tab=${c.id}"${on ? ' aria-current="page"' : ""}${style}>${e(c.label)}<span class="count">· ${c.items.length}</span></a>`;
  };
  const tabs = groupByFamily(cats).map((g) => `<div class="tab-family"><h2 class="tab-family-title">${e(g.label)}</h2><div class="tab-family-pills">${g.cats.map(pill).join("")}</div></div>`).join("");
  const cards = current.items.map((it) => `<article class="card"><p class="tag" style="color:${current.accent}">${e(it.tag)}</p>
<h3 dir="auto">${omMini}${e(it.title)}</h3><p dir="auto">${e(it.summary)}</p><a class="more" href="/teachings/${it.slug}">${it.lang === "ar" ? "اقرأ · Read" : "Read"}</a></article>`).join("\n");
  const artwork = current.id === "teachings" && current.artwork;
  const header = artwork ? `<header class="banner teachings-masthead"><canvas data-sky="lib" aria-hidden="true"></canvas><div class="fade"></div>
@@NAV@@
</header>` : banner({ scene: "lib", eyebrow: "Teachings and wisdom", title: "The Library of Light", lead: "Every teaching filed under its title. Choose a path below." });
  const artBanner = artwork ? `<figure class="teachings-art-banner art-frame"><img src="${e(artwork.src)}" width="${artwork.width}" height="${artwork.height}" alt="${e(artwork.alt)}" fetchpriority="high" decoding="async"></figure><div class="teachings-heading wrap"><h1>${e(current.heading || current.label)}</h1><p>${e(current.blurb)}</p></div>` : "";
  const main = `<section${artwork ? ' class="teachings-library"' : ""} style="padding-top:16px">${artBanner}<div class="wrap"><nav class="tabs" aria-label="Paths of knowledge"><div class="tabs-families">${tabs}</div></nav>
${artwork ? "" : current.sides ? `<div class="tab-flank">${sideImg(current.sides[0])}<div class="tab-flank-text"><h2 class="section-title" style="margin-top:0">${e(current.heading || current.label)}</h2><p class="section-intro">${e(current.blurb)}</p></div>${sideImg(current.sides[1])}</div>` : `<h2 class="section-title" style="margin-top:36px">${e(current.heading || current.label)}</h2><p class="section-intro">${e(current.blurb)}</p>`}
${current.images ? `<div class="tab-pictures">${current.images.map((im) => `<img src="${e(im.src)}" width="${im.width}" height="${im.height}" alt="${e(im.alt)}" loading="lazy" decoding="async">`).join("")}</div>` : ""}
${current.wide ? `<figure class="cover tab-wide${current.id === "prayers" ? " prayer-quote-cover" : ""}">${current.id === "prayers" ? `<figcaption class="prayer-image-caption"><blockquote class="prayer-image-quote"><p><span>If we all pray to One God, share One Creator,</span>
<span>and return to that same One God—</span>
<span>why do we destroy each other</span>
<span>just to reach Him?</span>
<span>Did God ever ask for that?</span></p></blockquote><p class="prayer-image-signature">— Samadhi-Love</p></figcaption>` : ""}<img src="${e(current.wide.src)}" width="${current.wide.width}" height="${current.wide.height}" alt="${e(current.wide.alt)}" loading="lazy" decoding="async"></figure>` : ""}
<div class="grid grid-wide">${cards}</div></div></section>`;
  return layout({ title: `${current.heading || current.label} · Library of Light`, description: current.blurb, active: current.id, header, main, canonical: `/library?tab=${current.id}`, backdrop: current.id !== "teachings" });
}

function wisdomSection(slug) {
  const list = wisdomFor[slug];
  if (!list || !list.length) return "";
  return `<section class="wisdom-from" aria-labelledby="wisdom-${slug}"><h2 id="wisdom-${slug}">Wisdom from the traditions</h2>
<div class="sayings">${list.map(([saying, who, where]) => `<figure class="saying"><blockquote>“${e(saying)}”</blockquote><figcaption><strong>${e(who)}</strong> · ${e(where)}</figcaption></figure>`).join("")}</div></section>`;
}

// "Kriya is the key and the way back home" (Samadhi's words), in Sanskrit-style letters drifting around the page.
function kriyaFloat() {
  const motto = "Kriya is the key and the way back home";
  const words = [["deva", "क्रिया"], ["motto", motto], ["deva", "ॐ"], ["motto", motto], ["deva", "क्रिया"], ["motto", motto], ["deva", "ॐ"]];
  return `<div class="kriya-motto"><span class="deva">क्रिया</span><p class="sanskritish">${e(motto)}</p><span class="who">Samadhi</span></div>
<div class="kriya-float" aria-hidden="true">${words.map(([k, t], i) => `<span class="kf kf-${i} ${k === "deva" ? "deva" : "sanskritish"}">${e(t)}</span>`).join("")}</div>`;
}

function teachingPicture(slug) {
  const subjects = [].concat(pictureForTeaching[slug] || []);
  const available = [...new Set(subjects.map((s) => pictureFor(s)).filter(Boolean))];
  // This teaching deliberately shows ruins first and the flood tablet second.
  // Other subject arrays remain alternative choices for a single picture.
  const selected = slug === "great-civilizations-and-the-fall" ? available : available.slice(0, 1);
  return selected.map((full) => {
    // Shown at most about 760px wide, so the lighter 960px copy is used when it exists (credits still name the original).
    const file = backdropFor(full);
    const c = creditFor(full);
    return `<figure class="cover"><img src="/${e(file)}" alt="${e(c?.title || "")}" loading="lazy">${c ? `<figcaption class="fine">${e(c.title)}${c.author ? " · " + e(c.author) : ""} · <a href="/credits">credits</a></figcaption>` : ""}</figure>`;
  }).join("\n");
}

// "Their home in the sky": the real telescope photo, with a star map drawn beside it where there is one.
function homeSky(slug) {
  const photo = teachingPicture(slug), map = starMap(slug);
  return photo && map ? `<div class="home-sky">${photo}${map}</div>` : photo || map;
}

// The portrait Samadhi chose for a star family (shown in place of the drawn figure).
function starPortrait(item) {
  const full = portraitFor(item.slug);
  return `<figure class="star-art star-portrait"><img src="/${e(backdropFor(full))}" alt="${e(item.title.split(":")[0])}, AI-painted artwork" loading="lazy"><figcaption>${e(portraitCaption)}</figcaption></figure>`;
}

// Samadhi's own AI-painted artwork shown at the top of a teaching (the drawn figure stays in the code).
function painting(p) {
  return `<figure class="star-art star-portrait"><img src="/${e(p.src)}" width="${p.width}" height="${p.height}" alt="${e(p.alt)}" loading="lazy"><figcaption>${e(portraitCaption)}</figcaption></figure>`;
}

// Samadhi's own picture for a star family: public/images/star-families/<page slug>.jpg.
// When the file is there it takes the place of the drawn figure; when it is not, the drawn figure shows.
function familyPicture(item) {
  if (!/^[a-z0-9-]+$/.test(item.slug) || !existsSync(path.join(publicDir, "images", "star-families", `${item.slug}.jpg`))) return "";
  return `<figure class="star-art star-portrait tall"><img src="/images/star-families/${item.slug}.jpg" width="896" height="1200" alt="${e(item.title.split(":")[0])}, AI-painted artwork" loading="lazy"><figcaption>${e(portraitCaption)}</figcaption></figure>`;
}

function ownerTeaching(slug) {
  const p = findPublishedTeaching(slug);
  if (!p) return null;
  const item = ownerItem(p);
  const category = libraryCategories().find((c) => c.id === p.tab) || libraryCategories()[0];
  return { category, item };
}

// Turns mentions of other teachings, written in italics such as "(see *Seneca and Nero*)", into links.
const titleAliases = { "the allegory of the cave": "allegory-of-the-cave", "discernment": "discernment" };
const norm = (t) => String(t).toLowerCase().replace(/&#39;|'/g, "'").replace(/^the /, "").trim();
function titleIndex() {
  const index = new Map(Object.entries(titleAliases));
  for (const c of libraryCategories()) for (const it of c.items) {
    const full = norm(it.title);
    if (!index.has(full)) index.set(full, it.slug);
    const short = norm(it.title.split(":")[0]);
    if (!index.has(short)) index.set(short, it.slug);
  }
  return index;
}
export function linkTeachingTitles(html, currentSlug) {
  const index = titleIndex();
  return html.replace(/<em>([^<]{3,120})<\/em>/g, (whole, text) => {
    const slug = titleAliases[text.toLowerCase()] || index.get(norm(text.replace(/&#39;/g, "'")));
    return slug && slug !== currentSlug ? `<a href="/teachings/${slug}"><em>${text}</em></a>` : whole;
  });
}

function teaching(slug) {
  const found = ownerTeaching(slug) || findTeaching(slug);
  if (!found) return null;
  const { category, item } = found;
  const i = category.items.indexOf(item);
  const prev = category.items[i - 1], next = category.items[i + 1];
  const header = banner({ scene: category.scene, eyebrow: category.label, title: item.title, lead: item.summary });
  const main = `<article class="article"><div class="wrap narrow">
<p class="crumbs"><a href="/library?tab=${category.id}">${e(category.label)}</a> / ${e(item.title)}</p>
${item.float === "kriya" ? kriyaFloat() : ""}
${item.figure === "chakras" && item.slug !== "meditation-and-prayer" ? chakraFigure() : ""}
${portraitFor(item.slug) ? starPortrait(item) : familyPicture(item) || (item.painting ? painting(item.painting) : item.art ? starArt(item.art) : "")}
${item.image ? `<figure class="cover${item.image.small ? " cover-small" : ""}"><img src="${e(item.image.src)}" width="${item.image.width}" height="${item.image.height}" alt="${e(item.image.alt)}" decoding="async">${item.image.caption ? `<figcaption class="fine">${e(item.image.caption)}</figcaption>` : ""}</figure>` : ""}
${item.cover ? `<figure class="cover"><img src="/${e(item.cover)}" alt="" loading="lazy"></figure>` : item.body && item.body.includes("{{home-photo}}") ? "" : teachingPicture(item.slug)}
${item.lang === "ar" ? `<div class="rtl" dir="rtl" lang="ar">${renderMarkdown(item.body)}</div>` : linkTeachingTitles(renderMarkdown(item.body), item.slug).replace("<p>{{home-photo}}</p>", () => homeSky(item.slug)).replace(/<p>\{\{([a-z0-9-]+)\}\}<\/p>/g, (m, k) => (item.inline && item.inline[k] ? painting(item.inline[k]) : k.startsWith("cross-") ? crossArt(k) : k === "dawn-art" ? dawnArt(): k === "jung-mandala" ? jungMandala(): k.startsWith("tree-") ? treeArt(k): k.startsWith("veil-") ? veilArt(k): k.startsWith("geo-") ? geometryArt(k): k.startsWith("philo-") ? philosophyArt(k): k.startsWith("lotus-") ? lotusArt(k): k.startsWith("text-") ? sacredTextArt(k): k.startsWith("prophet-") ? prophetArt(k): k.startsWith("practice-") ? practiceArt(k, geometryArt): k.startsWith("start-") ? startArt(k): k.startsWith("land-") ? landArt(k): k.startsWith("heart-") ? heartArt(k): k === "sg-art" ? violetArt() : k === "sg-panel" ? violetPanel() : k === "sg-portrait" ? sgPortrait() : ""))}
${item.youtube && youtubeId(item.youtube) ? `<div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(item.youtube)}" title="${e(item.title)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` : ""}
${item.slug === "meditation-and-prayer" ? chakraFigure() : ""}
${wisdomSection(item.slug)}
<nav class="next" aria-label="More teachings">${prev ? `<a href="/teachings/${prev.slug}">← ${e(prev.title)}</a>` : "<span></span>"}${next ? `<a href="/teachings/${next.slug}">${e(next.title)} →</a>` : `<a href="/library?tab=${category.id}">Back to ${e(category.label)}</a>`}</nav>
</div></article>`;
  return layout({ title: item.title, description: item.summary, active: category.id, header, main, canonical: `/teachings/${item.slug}`, type: "article" });
}

function simple({ key, scene, eyebrow, title, lead, body, description }) {
  return layout({ title, description: description || lead, active: key, header: banner({ scene, eyebrow, title, lead }), main: `<section style="padding-top:24px"><div class="wrap narrow">${body}</div></section>` });
}

function mastersPage() {
  const cards = gallery.map((m) => {
    const file = pictureFor(m.slug);
    const credit = file && creditFor(file);
    const picture = file
      ? `<figure class="portrait"><img src="/${e(backdropFor(file))}" alt="${e(m.name)}${credit && credit.title ? ", " + e(credit.title) : ""}" loading="lazy" width="600" height="750">${credit ? `<figcaption>${e(credit.title || "")}${credit.author ? " · " + e(credit.author) : ""}</figcaption>` : ""}</figure>`
      : `<div class="portrait portrait-empty" style="--ray:${m.color}"><svg class="sg" aria-hidden="true" focusable="false"><use href="#sg-flower"/></svg></div>`;
    return `<article class="card master" id="${m.slug}">${picture}<p class="tag" style="color:${m.color}">${e(m.role)}</p><h3>${e(m.name)}</h3><p>${e(m.about)}</p><a class="more" href="/teachings/${m.teaching}">Read more</a></article>`;
  }).join("\n");
  const cat = categories.find((c) => c.id === "masters");
  const links = cat.items.map((it) => `<li><a href="/teachings/${it.slug}">${e(it.title)}</a></li>`).join("");
  const header = banner({ scene: "art1", eyebrow: "Masters & Angels", title: "The Masters and the Angels", lead: "Who they are, as the traditions teach them, and how they are honoured." });
  const main = `<section style="padding-top:24px"><div class="wrap"><div class="grid grid-wide">${cards}</div>
<h2 class="section-title" style="margin-top:72px">Teachings on the Masters and Angels</h2><ul class="link-list">${links}</ul></div></section>`;
  return layout({ title: "The Masters and the Angels · Gallery", description: "The Ascended Masters and the Archangels: who they are, as the traditions teach them, with their pictures.", active: "masters", header, main, canonical: "/masters" });
}

function choosePage() {
  const list = candidates().map(describe).filter((c) => c.file);
  const bySubject = new Map();
  for (const c of list) { const key = c.slug || c.subject; if (!bySubject.has(key)) bySubject.set(key, { name: c.subject || key, items: [] }); bySubject.get(key).items.push(c); }
  const picked = new Set([...Object.values(chosen), ...Object.values(portraitChosen)]);
  const card = (g, c, i) => `<figure class="card choose${picked.has(c.file) ? " picked" : ""}"><img src="/${e(backdropFor(c.file))}" alt="${e(g.name)} option ${i + 1}" loading="lazy"><figcaption><strong>${e(g.name)} ${i + 1}</strong>${picked.has(c.file) ? " · chosen" : ""}<br>${e(c.title)}${c.author ? " · " + e(c.author) : ""}<br><span class="fine">${e(c.license)}</span></figcaption></figure>`;
  const isPortrait = (g) => /-portrait$/.test(g.key);
  for (const [key, g] of bySubject) g.key = key;
  const portraitGroups = [...bySubject.values()].filter(isPortrait);
  const portraits = portraitGroups.length ? `<section class="choose-group choose-portraits"><h2>Star family portraits</h2><p>Choose one portrait for each family, for example <em>Pleiadians 2</em>. Until you choose, each page keeps its present figure. Each one will carry the caption: <em>${e(portraitCaption)}</em></p>${portraitGroups.map((g) => `<h3>${e(g.name)}</h3><div class="grid grid-wide">${g.items.map((c, i) => card(g, c, i)).join("")}</div>`).join("")}</section>` : "";
  const groups = portraits + [...bySubject.values()].filter((g) => !isPortrait(g)).map((g) => `<section class="choose-group"><h2>${e(g.name)}</h2><div class="grid grid-wide">${g.items.map((c, i) => card(g, c, i)).join("")}</div></section>`).join("");
  const header = banner({ scene: "lib", eyebrow: "Private", title: "Choose your pictures", lead: "Tell Claude the name and number of each picture you love, for example Pyramids 2." });
  const main = `<section style="padding-top:24px"><div class="wrap">${groups || '<div class="empty"><p>The pictures are still being gathered.</p></div>'}</div></section>`;
  return layout({ title: "Choose your pictures", active: "choose", header, main });
}

function creditsPage() {
  const subjects = [...Object.values(placeForPage), ...gallery.map((m) => m.slug), ...Object.values(pictureForTeaching).flat()];
  const files = [...Object.values(chosen), ...Object.values(pictureForTeaching).map((list) => [].concat(list).map((x) => pictureFor(x)).find(Boolean)), ...subjects.filter((x) => typeof x === "string").map((x) => pictureFor(x))].filter(Boolean);
  const used = [...new Set(files)].map((f) => creditFor(f)).filter(Boolean);
  const cell = (t) => String(t || "").replace(/\|/g, "/");
  // Literal parentheses in Commons filenames would close a Markdown link early.
  const link = (url) => String(url || "").replace(/\(/g, "%28").replace(/\)/g, "%29");
  const rows = used.map((c) => `| ${cell(c.title) || "Untitled"} | ${cell(c.author) || "Unknown"} | [${cell(c.license) || "Licence"}](${link(c.licenseUrl || c.source)}) | [Source](${link(c.source)}) | ${cell(c.changes) || "None"} |`).join("\n");
  const body = used.length
    ? renderMarkdown(`Thank you to the artists and photographers whose work appears on this site, shared under free licences.\n\n| Picture | By | Licence | Where it comes from | Changes made |\n| --- | --- | --- | --- | --- |\n${rows}`)
    : "<p>Pictures and their credits will be listed here.</p>";
  return simple({ key: "credits", scene: "art3", eyebrow: "Thank you", title: "Picture credits", lead: "The artists and photographers behind the pictures on this site.", body: `<div class="article"><p>Teachings banner and home portrait: Artwork by SAMADHI LOVE.</p><p>The cedars of Lebanon (Sacred Lands): an artistic image shared by SAMADHI LOVE.</p><p>The Immaculate Heart of Mary and the Sacred Heart of Jesus (A Prayer to Mother Mary): an artistic image shared by SAMADHI LOVE.</p>${body}</div>` });
}

function videosBody() {
  const mine = published("video").map((v) => ({ url: v.youtube, title: v.title, note: v.note }));
  const list = [...mine, ...youtube].map((v) => ({ ...v, id: youtubeId(v.url) })).filter((v) => v.id);
  if (!list.length) return `<div class="empty"><p>Videos are on the way.</p><p>New YouTube videos will appear here.</p></div>`;
  return `<div class="videos">${list.map((v) => `<figure class="video"><div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${v.id}" title="${e(v.title || "Video")}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>${v.title ? `<figcaption dir="auto">${e(v.title)}${v.note ? `<br><span class="fine">${e(v.note)}</span>` : ""}</figcaption>` : ""}</figure>`).join("")}</div>`;
}

function podcastsBody() {
  const mine = published("podcast").map((p) => ({ title: p.title, note: p.note, url: p.link, audio: p.audio }));
  const list = [...mine, ...podcasts].filter((p) => /^https:\/\//.test(p.url || "") || p.audio);
  if (!list.length) return `<div class="empty"><p>Podcasts and recordings are on the way.</p><p>Talks, meditations and conversations will appear here.</p></div>`;
  return `<div class="episodes">${list.map((p) => {
    const id = p.url && youtubeId(p.url);
    const audio = p.audio ? `<audio controls preload="none" src="/${e(p.audio)}"></audio>` : "";
    const media = audio && !p.url ? audio : id
      ? `<div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${e(p.title || "Episode")}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`
      : `<a class="btn btn-teal" href="${e(p.url)}" rel="noopener" target="_blank">${note} Listen</a>`;
    return `<article class="card episode"><h3 dir="auto">${e(p.title || "Episode")}</h3>${p.note ? `<p dir="auto">${e(p.note)}</p>` : ""}${audio && p.url ? audio : ""}${media}</article>`;
  }).join("")}</div>`;
}

function galleryBody() {
  const photos = published("photo");
  if (!photos.length) return `<div class="empty"><p>The gallery is on the way.</p><p>Photos and art will appear here once they are added from the owner page.</p></div>`;
  return `<div class="photo-grid">${photos.map((p) => `<figure class="photo"><a href="/${e(p.file)}" target="_blank" rel="noopener"><img src="/${e(p.file)}" alt="${e(p.caption || "Photo by SAMADHI LOVE")}" loading="lazy"></a>${p.caption ? `<figcaption dir="auto">${e(p.caption)}</figcaption>` : ""}</figure>`).join("")}</div>`;
}

function studioLink() { return `<a class="btn btn-teal" href="/studio">Open Versual Studio ${arrow}</a>`; }

export function sitemapXml() {
  const paths = ["/", "/library", "/masters", "/music", "/videos", "/podcasts", "/gallery", "/about", "/contact", "/credits"];
  for (const c of libraryCategories()) paths.push(`/library?tab=${c.id}`);
  for (const c of libraryCategories()) for (const it of c.items) paths.push(`/teachings/${it.slug}`);
  const urls = [...new Set(paths)].map((p) => `<url><loc>${e(abs(p))}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(isPublicNow) {
  if (!isPublicNow) return "# Private preview: nothing to index yet.\nUser-agent: *\nDisallow: /\n";
  return `User-agent: *\nDisallow: /owner\nDisallow: /choose\nDisallow: /media/\nAllow: /\n\nSitemap: ${abs("/sitemap.xml")}\n`;
}

export function setRequest(origin, path) { here.origin = origin; here.path = path; }

export const pages = {
  studioUrl: () => site.studioUrl,
  choose: () => choosePage(),
  route(pathname, params) {
    if (pathname === "/") return home();
    if (pathname === "/library") return library(params);
    const t = /^\/teachings\/([a-z0-9-]+)$/.exec(pathname);
    if (t) return teaching(t[1]);
    if (pathname === "/music") return simple({ key: "music", scene: "studio", eyebrow: "Music", title: "Songs of SAMADHI LOVE", lead: "Music is for the soul.",
      description: "Songs of SAMADHI LOVE: spiritual music that arrives whole and is carried in memory, and Versual Studio, the music app behind it.",
      body: `<div class="empty"><p>New songs are on the way.</p><p>Songs will appear here once they are added from the owner page.</p><div class="actions" style="justify-content:center">${studioLink()}</div></div>` });
    if (pathname === "/videos") return simple({ key: "videos", scene: "art3", eyebrow: "Videos", title: "Videos", lead: "Songs, lyric videos and visual journeys from SAMADHI LOVE on YouTube.", body: videosBody() });
    if (pathname === "/podcasts") return simple({ key: "podcasts", scene: "studio", eyebrow: "Listen", title: "Podcasts & Recordings", lead: "Talks, meditations and conversations from SAMADHI LOVE.", body: podcastsBody() });
    if (pathname === "/masters") return mastersPage();
    if (pathname === "/credits") return creditsPage();
    if (pathname === "/gallery") return simple({ key: "gallery", scene: "hero", eyebrow: "Gallery", title: "Gallery", lead: "Photos and sacred art.", body: galleryBody(),
      description: "The SAMADHI LOVE gallery: photos and sacred art shared by Samadhi, to bring light and peace to the eyes and the heart." });
    if (pathname === "/about") return simple({ key: "about", scene: "art1", eyebrow: "About", title: "Samadhi", lead: "Spiritual musician and student of the mystical traditions.",
      body: `<div class="article">${renderMarkdown(about)}<h2 id="vision">My Vision</h2>${renderMarkdown(vision)}<h2 id="respect">Respect for this space</h2>${renderMarkdown(respect)}</div>` });
    if (pathname === "/contact") return simple({ key: "contact", scene: "lib", eyebrow: "Contact", title: "Contact", lead: "Messages are welcome, offered with kindness.",
      body: site.contactEmail
        ? `<p>Write to <a href="mailto:${e(site.contactEmail)}">${e(site.contactEmail)}</a>. Every kind message is read.</p>${socialLinks()}`
        : `<div class="empty"><p>Contact details are coming soon.</p><p>A message form will open with the owner page.</p></div>${socialLinks()}` });
    return null;
  },
  notFound() {
    return simple({ key: "", scene: "art3", eyebrow: "Lost among the stars", title: "Page not found", lead: "This page does not exist, or it has moved.",
      body: `<p><a class="btn btn-gold" href="/">Return home ${arrow}</a></p>` });
  },
  askPassword() {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Private preview · SAMADHI LOVE</title></head><body style="background:#05040d;color:#ece9ff;font-family:system-ui,sans-serif;text-align:center;padding:96px 20px"><h1>SAMADHI LOVE</h1><p>This website is a private preview. Please enter the preview password.</p></body></html>`;
  },
  locked() {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Private preview · SAMADHI LOVE</title></head><body style="background:#05040d;color:#ece9ff;font-family:system-ui,sans-serif;text-align:center;padding:96px 20px"><h1>SAMADHI LOVE</h1><p>This website is a private preview and is locked.</p><p>The owner unlocks it by adding a secret named PREVIEW_PASSWORD.</p></body></html>`;
  },
};
