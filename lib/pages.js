import { site, about, vision, respect, categories, PROMISE, SAMADHI_SAYINGS, WISDOM_SAYINGS, findTeaching, truths, gallery, groupByFamily } from "./content.js";
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
import { carryArt } from "./companion.js";
import { storyArt } from "./stories.js";
import { expansionArt } from "./expansion.js";
import { messengersArt } from "./messengers.js";
import { journeyArt } from "./journey.js";
import { mysteryArt } from "./mysteryschools.js";
import { dailyArt } from "./dailylife.js";
import { additionsArt } from "./additions.js";
import { pathArt, stageFor, nextStage, STAGES } from "./path.js";
import { namesArt } from "./names.js";
import { replacement, replacementAt } from "./replacements.js";
import { jungMandala } from "./newteachers.js";
import { dawnArt } from "./blessing.js";
import { starArt } from "./starart.js";
import { crossArt } from "./crosses.js";
import { violetArt, violetPanel, sgPortrait } from "./saintgermain.js";
import { starMap } from "./starmaps.js";
import { samadhiViewScroll } from "./plantmedicine.js";
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
const fonts = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600&family=IM+Fell+English:ital@0;1&family=Pinyon+Script&display=swap";
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
  const tabLink = (c) => `<a href="/library?tab=${c.id}"${cur(c.id)}>${e(c.label)}${c.subtitle ? `<span class="nav-sub">${e(c.subtitle)}</span>` : ""}</a>`;
  const music = musicMenu.filter(([, , key]) => hasContent(key));
  const inMusic = music.some(([, , key]) => key === active);
  const musicLinks = music.map(([href, label, key]) => `<a href="${href}"${cur(key)}>${e(label)}</a>`).join("");
  const contact = `<a class="pill" href="/contact"${cur("contact")}>Contact</a>`;
  const columns = groups.map((g) => `<div class="nav-col"><p class="nav-col-title">${g.sign ? `<img class="nav-sign" src="/images/sign-${g.sign}.png" width="24" height="24" alt="" aria-hidden="true">` : ""}${e(g.label)}</p>${g.cats.map(tabLink).join("")}</div>`).join("");
  const desktop = `<div class="nav-links">
<details class="nav-drop nav-drop-library" name="site-menu"><summary${inLibrary ? ' class="is-current"' : ""}>Library ${chevron}</summary><div class="nav-panel nav-panel-library"><div class="nav-cols">${columns}</div><a class="nav-all" href="/library">See the whole Library →</a></div></details>
<a href="/masters"${cur("masters")}>Masters &amp; Angels</a>
<details class="nav-drop nav-drop-music" name="site-menu"><summary${inMusic ? ' class="is-current"' : ""}>Music ${chevron}</summary><div class="nav-panel nav-panel-music">${musicLinks}</div></details>
<a href="/studio">Versual Studio</a>
<a href="/about"${cur("about")}>About</a>
<a class="nav-search" href="/search" aria-label="Search the Library"${cur("search")}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg></a>
${contact}</div>`;
  const families = groups.map((g) => `<details class="nav-family"><summary>${e(g.label)} ${chevron}</summary><div class="nav-family-links">${g.cats.map(tabLink).join("")}</div></details>`).join("");
  const phone = `<details class="nav-menu"><summary><span class="nav-menu-bars" aria-hidden="true"></span>Menu</summary><div class="nav-menu-panel"><form class="search-form" action="/search" method="get" role="search"><label for="sq-m" class="sr-only">Search the Library</label><input id="sq-m" type="search" name="q" placeholder="Search the Library" autocomplete="off"><button type="submit" class="btn">Search</button></form>
<p class="nav-menu-title">Library of Light</p>${families}<a class="nav-family-all" href="/library">See the whole Library →</a>
<div class="nav-menu-group"><p class="nav-menu-title">Music</p>${musicLinks}</div>
<div class="nav-menu-group nav-menu-end"><a href="/studio">Versual Studio</a><a href="/about"${cur("about")}>About</a>${contact}</div></div></details>`;
  return `<nav class="nav wrap" aria-label="Main"><a class="brand" href="/"><span class="om om-coin" aria-hidden="true"><img src="/images/om-coin.png" width="44" height="44" alt=""></span>${e(site.name)}</a>
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
<meta name="theme-color" content="#0b0906">
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
${main.includes('class="promise"') ? "" : `<aside class="closing closing-page wrap narrow" aria-label="A promise">${promise()}</aside>`}
</main>
${ticker("bottom")}
<footer>
  <div class="foot wrap">
    <div class="sacred"><h2>This is a sacred space</h2><p>Every path is honoured here. Take what is true for you, speak with kindness, and honour the work. Nothing here replaces medical or professional advice. Thank you for walking here gently. <a href="/about#respect">Read more</a></p></div>
    <nav aria-label="Footer"><a href="/library">Library of Light</a><a href="/masters">Masters &amp; Angels</a><a href="/music">Music</a><a href="/studio">Versual Studio</a><a href="/about">About</a><a href="/about#vision">My Vision</a><a href="/contact">Contact</a><a href="/credits">Picture credits</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
  </div>
  ${socialLinks()}
  <p class="legal">${e(site.motto)} · © ${new Date().getFullYear()} ${e(site.name)}</p>
</footer>
${isPublic() ? "" : '<p class="preview-flag">Private preview</p>'}
</body>
</html>`;
}

function banner({ scene, eyebrow, title, lead, cls = "" }) {
  const desk = cls === "gold-banner" ? `<div class="banner-desk" aria-hidden="true"><img src="/images/library-desk.jpg" width="1600" height="900" alt="" fetchpriority="high" decoding="async"></div>` : "";
  return `<header class="banner${cls ? ` ${cls}` : ""}"><canvas data-sky="${e(scene)}" aria-hidden="true"></canvas>${desk}<div class="shade"></div><div class="fade"></div>
@@NAV@@
<div class="banner-text wrap">${eyebrow ? `<p class="eyebrow">${e(eyebrow)}</p>` : ""}<h1 dir="auto">${e(title)}</h1>${lead ? `<p class="lead" dir="auto">${e(lead)}</p>` : ""}</div></header>`;
}


// The wisdom tablet in the middle of the seven families: one saying from each tradition, in turn.
// Every saying is quoted exactly from the translation named under it (checked Nov 2026).

function wisdomTablet() {
  const all = WISDOM_SAYINGS;
  const items = all.map(([t, src], i) => `<figure class="wt-item${i ? "" : " is-on"}"${i ? ' aria-hidden="true"' : ""}><blockquote>${e(t)}</blockquote><figcaption>${e(src)}</figcaption></figure>`).join("");
  // Samadhi's temple of wisdom (Nov 28, 2026): an arch carved "Wisdom of the Ages" between two columns, the arch open
  // on a small room lit by a hanging lantern and a candle; the sayings glow on the room's back wall, the button rests on the
  // steps, and old star tools stand outside (a telescope, an armillary sphere, an astrolabe, books and a star map).
  return `<aside class="wisdom-tablet wt-doorway card" aria-label="Wisdom of the Ages: a saying of wisdom"><picture><source media="(max-width: 699px)" srcset="/images/wisdom-doorway-phone.jpg" width="760" height="1288"><img class="wt-door" src="/images/wisdom-doorway.jpg" width="1100" height="1100" alt="An ancient temple doorway at night under the stars: an arch carved Wisdom of the Ages between two columns, open on a small room lit by a hanging lantern and a candle; an old brass telescope and books on the left, an armillary sphere, astrolabe and star map on the right" loading="lazy" decoding="async"></picture><div class="wt-glow" aria-hidden="true"></div><div class="wt-wall"><div class="wt-words" data-wisdom-tablet>${items}</div></div><button type="button" class="wt-more" data-wt-next>Another word of wisdom <span aria-hidden="true">›</span></button></aside>`;
}

// Small engraved geometric signs for the home page (drawn once, used many times). Each family has its own.
const FAMILY_GLYPH = { start: "compass", spiritual: "seed", practice: "rosette", messengers: "sun", philosophy: "tetractys", sciences: "squared", history: "gates" };
const ring12 = Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return [Math.sin(a), -Math.cos(a)]; });
const f1 = (n) => Number(n.toFixed(2));
const GLYPHS = {
  compass: `<circle r="10.5" stroke-dasharray="1 1.6"/><circle r="4"/><path d="M0-11 1.8-1.8 11 0 1.8 1.8 0 11-1.8 1.8-11 0-1.8-1.8Z"/>`,
  seed: `<circle r="4"/>${ring12.filter((_, i) => i % 2 === 0).map(([x, y]) => `<circle cx="${f1(x * 4)}" cy="${f1(y * 4)}" r="4"/>`).join("")}<circle r="8.6"/>`,
  rosette: `${[0, 45, 90, 135].map((d) => `<ellipse rx="2.6" ry="9" transform="rotate(${d})"/>`).join("")}<circle r="1.6"/><circle r="10.8" stroke-dasharray="1 1.6"/>`,
  sun: `<circle r="4"/>${ring12.map(([x, y]) => `<path d="M${f1(x * 6.2)} ${f1(y * 6.2)}L${f1(x * 10.5)} ${f1(y * 10.5)}"/>`).join("")}<circle r="1.2"/>`,
  tetractys: `<circle r="10.8"/><path d="M0-9.5 8.2 4.75H-8.2Z"/>${[[0, -5.2], [-1.7, -2.2], [1.7, -2.2], [-3.4, .8], [0, .8], [3.4, .8], [-5.1, 3.4], [-1.7, 3.4], [1.7, 3.4], [5.1, 3.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="currentColor"/>`).join("")}`,
  squared: `<circle r="10.4"/><rect x="-7.3" y="-7.3" width="14.6" height="14.6"/><rect x="-7.3" y="-7.3" width="14.6" height="14.6" transform="rotate(45)"/><circle r="3.6"/>`,
  gates: `<circle r="10.6"/><circle r="6.6" stroke-dasharray="9.2 1.2"/><circle r="2.6"/><path d="M0-10.6V-6.6M10.6 0H6.6M0 10.6V6.6M-10.6 0H-6.6"/>`,
  "compass-rose": `<circle r="11.4"/><circle r="10.2" stroke-dasharray=".6 1.1"/>${ring12.map(([x, y], i) => `<path d="M${f1(x * 8.2)} ${f1(y * 8.2)}L${f1(x * (i % 3 ? 9.4 : 11.4))} ${f1(y * (i % 3 ? 9.4 : 11.4))}"/>`).join("")}<path d="M0-9 1.6-1.6 9 0 1.6 1.6 0 9-1.6 1.6-9 0-1.6-1.6Z"/><path d="M0-5.6 1-1 5.6 0 1 1 0 5.6-1 1-5.6 0-1-1Z" transform="rotate(45)"/><circle r="1.1" fill="currentColor"/>`,
};
const GLYPH_DEFS = `<svg class="glyph-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>${Object.entries(GLYPHS).map(([k, v]) => `<symbol id="gs-${k}" viewBox="-12 -12 24 24"><g fill="none" stroke="currentColor" stroke-width=".75">${v}</g></symbol>`).join("")}</defs></svg>`;
const glyph = (k, extra = "", cls = "gs") => `<svg class="${cls} gs-turn${extra}" viewBox="-12 -12 24 24" aria-hidden="true" focusable="false"><use href="#gs-${k}" x="-12" y="-12" width="24" height="24"/></svg>`;

// The Path of Study wheel: twelve points on a slowly turning gold ring, one for each stage.
function pathWheel() {
  const pts = ring12.map(([x, y]) => [x * 40, y * 40]);
  const star = pts.map((_, i) => pts[(i * 5) % 12]).map(([x, y], i) => `${i ? "L" : "M"}${f1(x)} ${f1(y)}`).join("") + "Z";
  const dots = ring12.map(([x, y], i) => `<circle cx="${f1(x * 46)}" cy="${f1(y * 46)}" r="${i === 0 ? 3.4 : 2.4}"${i === 0 ? ' fill="currentColor"' : ""}/>`).join("");
  return `<svg class="path-wheel gs-turn" viewBox="-56 -56 112 112" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width=".7"><circle r="52"/><circle r="49.5" stroke-dasharray="1 2.2"/><circle r="40"/>${dots}<path d="${star}" stroke-opacity=".75"/><circle r="17"/><circle r="9" stroke-dasharray="1.4 1.4"/><circle r="3.2" fill="currentColor"/></g></svg>`;
}

function home() {
  const paths = groupByFamily(libraryCategories()).filter((g) => g.id !== "more").map((g) => {
    const list = g.cats.map((c) => `<li><a href="/library?tab=${c.id}">${e(c.label)}</a></li>`).join("");
    const count = g.cats.reduce((n, c) => n + c.items.length, 0);
    const art = g.sign ? `<img class="family-sign" src="/images/sign-${g.sign}.png" width="96" height="96" alt="" aria-hidden="true">` : `<canvas class="orb" data-sky="${g.orb}" aria-hidden="true"></canvas>`;
    // Samadhi (Nov 28): a gold thread down the left of the tab buttons, with small geometric signs turning slowly.
    const sign = FAMILY_GLYPH[g.id] || "compass";
    const marks = Array.from({ length: Math.max(2, Math.ceil(g.cats.length / 2) + 1) }, (_, i) => glyph(sign, i % 2 ? " gs-rev" : "")).join("");
    const fill = g.id === "start" ? `<li class="fam-fill" aria-hidden="true">${glyph("compass-rose", "", "gs-big")}</li>` : "";
    return `<article class="card family-card stone-card">${art}
<h3>${e(g.label)}</h3><p>${e(g.line)}</p><div class="fam-body"><span class="fam-rail" aria-hidden="true">${marks}</span><ul class="family-tabs">${list}${fill}</ul></div>
<a class="more" href="/library?tab=${g.cats[0].id}">${count} teachings</a></article>`;
  }).join("\n");
  const pick = [["death-is-a-doorway", "art2", "#d9c8ff"], ["the-mystery-schools", "art1", "#f2b8cf"], ["love-and-marriage", "art3", "#ffd59a"]];
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
<div class="hero-text wrap"><figure class="hero-scroll"><img src="/images/hero-scroll.jpg" width="1792" height="1008" alt="An ancient parchment scroll on wooden rollers by candlelight, with an ink cup and a brush pen" fetchpriority="high" decoding="async"><div class="hero-scroll-text"><h1>${e(site.name)}</h1><p class="lead">${e(site.tagline)}</p></div></figure>
<div class="actions stone-actions"><a class="btn stone-btn stone-btn-glow" href="/library?tab=start"><svg class="btn-ico" width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><circle cx="16" cy="16" r="14.5"/><circle cx="16" cy="16" r="11.5" stroke-dasharray="1 2"/><path d="M16 2.5 18.2 13.8 29.5 16 18.2 18.2 16 29.5 13.8 18.2 2.5 16 13.8 13.8Z"/><path d="M16 2.5V29.5M2.5 16H29.5" stroke-width=".6"/><path d="m16 8.5 1.4 6.1 6.1 1.4-6.1 1.4-1.4 6.1-1.4-6.1-6.1-1.4 6.1-1.4Z" transform="rotate(45 16 16)" stroke-width=".8"/><circle cx="16" cy="16" r="1.6" fill="currentColor"/></svg>New here? Start Here</a><a class="btn stone-btn" href="/library"><svg class="btn-ico" width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 9C12.5 6.5 8 6 3 6.8V25c5-.8 9.5-.3 13 2.2 3.5-2.5 8-3 13-2.2V6.8C24 6 19.5 6.5 16 9Z"/><path d="M16 9v18.2"/><path d="M6 10.5c3-.4 5.6-.1 7.6 1M6 14c3-.4 5.6-.1 7.6 1M6 17.5c3-.4 5.6-.1 7.6 1M26 10.5c-3-.4-5.6-.1-7.6 1M26 14c-3-.4-5.6-.1-7.6 1M26 17.5c-3-.4-5.6-.1-7.6 1" stroke-width=".8"/><path d="M16 2.5v2.5M11 3.5l1.2 2M21 3.5l-1.2 2" stroke-width=".9"/></svg>Explore the Teachings</a><a class="btn stone-btn" href="/music"><svg class="btn-ico" width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4c-3 1.5-4 5-2.5 9.5C8 18 10 21 10.5 25M23 4c3 1.5 4 5 2.5 9.5C24 18 22 21 21.5 25"/><path d="M9 4c1 .3 1.5 1.4 1 2.4M23 4c-1 .3-1.5 1.4-1 2.4"/><path d="M8.2 9.5h15.6" stroke-width="1.6"/><path d="M10 25.5h12l-1.2 3.5h-9.6Z"/><path d="M13 9.5v16M16 9.5v16M19 9.5v16" stroke-width=".7"/></svg>Listen to the Music</a></div></div>
<div class="hero-triptych wrap"><figure class="triptych-panel triptych-centre"><div class="art-frame"><img class="hero-centrepiece" src="/images/home-sound-scroll.jpg" width="1400" height="788" alt="Two ancient scrolls on dark stone by candlelight, with golden waves of sound rising from the parchment. Picture shared by SAMADHI LOVE." decoding="async"></div><figcaption class="triptych-caption">${e(site.motto)}</figcaption></figure><figure class="triptych-panel triptych-left"><div class="art-frame"><img class="hero-prayer" src="/images/home-om-book.jpg" width="960" height="536" alt="" decoding="async"></div></figure><figure class="triptych-panel triptych-right"><div class="art-frame"><img class="hero-galaxy" src="/images/home-temple-stars.jpg" width="960" height="536" alt="" decoding="async"></div></figure></div></header>`;

  const main = `<section class="home-sec home-first"><div class="wrap"><div class="fam-head"><img class="fam-col" src="/images/library-column.png" width="240" height="696" alt="" aria-hidden="true"><div class="fam-head-text"><p class="eyebrow">The Library of Light</p><h2 class="section-title">Seven families of knowledge</h2>
<p class="section-intro">Every teaching is filed under a title, and every title belongs to a family, so you can follow one path at a time or wander between them.</p></div><img class="fam-col fam-col-r" src="/images/library-column.png" width="240" height="696" alt="" aria-hidden="true"></div>
${GLYPH_DEFS}<div class="grid family-grid" data-geo-live>${paths.split("</article>").slice(0, 6).join("</article>")}</article><div class="fam-middle">${wisdomTablet()}<div class="path-band gk-frame has-wheel fam-path" data-geo-live><div class="path-band-text"><p class="eyebrow" style="color:var(--gold)">New · The Path of Study</p><h3>Twelve stages, from the Source back to the Source</h3>
<p>Prefer to learn in order? Follow the whole Library as one story, step by step, like a school year: the soul, the human story, the messengers, wisdom, the mystics, the sacred sciences, practice, daily life, and the soul's journey home.</p>
<a class="btn btn-gold" href="/teachings/the-path-of-study">Begin the Path of Study ${arrow}</a> <a class="btn" href="/teachings/questions-people-ask">Questions People Ask ${arrow}</a></div>${pathWheel()}</div></div>${paths.split("</article>").slice(6).join("</article>")}</div>
</div></section>
<section class="quote home-sec"><div class="wrap">${star}<blockquote>“Hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.”</blockquote><cite>The Buddha · Dhammapada, verse 5</cite></div></section>
<section class="home-sec"><div class="wrap"><p class="eyebrow" style="color:var(--rose)">New teachings</p><h2 class="section-title">Read, reflect, remember</h2><div class="grid grid-wide">${stories}</div></div></section>
<section class="band home-band"><canvas data-sky="studio" aria-hidden="true"></canvas><div class="shade"></div><div class="wrap">
<p class="eyebrow">Music &amp; Versual Studio</p><h2 class="section-title" style="max-width:660px">A unique creative platform where music, positive vibes and frequency meet</h2>
<p class="versual-tagline">Versual — where verse meets vision.</p>
<p class="section-intro" style="color:#d9d4f5">Listen to SAMADHI LOVE songs, or make your own in Versual Studio, the music app behind them.</p>
<div class="actions"><a class="btn btn-teal" href="/music">Listen to the songs</a><a class="btn btn-ghost" href="/studio">Open the Studio</a></div></div></section>
<section class="center home-sec"><div class="wrap narrow"><div class="about-box gk-frame stone-card"><p class="eyebrow" style="color:var(--gold)">About</p><h2 class="section-title">Samadhi</h2>
<p class="about-hand">A spiritual musician and lifelong student of the world's mystical traditions, with roots in Lebanon. His songs are not written down: they arrive whole and are carried in memory. SAMADHI LOVE is the home of that work, a place to listen, reflect and grow.</p>
<p class="about-hand-sign" aria-hidden="true">Samadhi</p><p><a class="btn stone-btn" href="/about">Read the full story</a></p></div></div></section>`;
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

// One of Samadhi's own sayings at the end of each tab. Tabs follow the Library order, so the saying
// changes from each tab to the next and the same one never sits next to itself.
function samadhiSaying(tabId) {
  const order = groupByFamily(libraryCategories()).flatMap((g) => g.cats.map((c) => c.id));
  const i = Math.max(0, order.indexOf(tabId));
  return `<figure class="samadhi-saying"><blockquote>${e(SAMADHI_SAYINGS[i % SAMADHI_SAYINGS.length])}</blockquote><figcaption>— Samadhi</figcaption></figure>`;
}

// A tab's subtitle (Knowledge & Insight: "Health, food and energy") and any "see also" link (Yoga and Kriya: Babaji).
const tabExtras = (c) => `${c.id === "wisdom" ? wisdomTablet() : ""}${c.subtitle ? `<p class="tab-subtitle">${e(c.subtitle)}</p>` : ""}${c.also ? `<p class="tab-also">See also: <a href="${e(c.also[1])}">${e(c.also[0])}</a>, ${e(c.also[2])}.</p>` : ""}`;

function library(params) {
  const cats = libraryCategories();
  const current = cats.find((c) => c.id === params.get("tab")) || cats[0];
  const pill = (c) => {
    const on = c.id === current.id;
    const style = "";
    return `<a class="tab" href="/library?tab=${c.id}"${on ? ' aria-current="page"' : ""}${style}>${e(c.label)}${c.subtitle ? `<span class="tab-sub">&nbsp;· ${e(c.subtitle)}</span>` : ""}<span class="count">· ${c.items.length}</span></a>`;
  };
  const sign = (g) => (g.sign ? `<img class="fam-sign" src="/images/sign-${g.sign}.png" width="40" height="40" alt="" aria-hidden="true">` : "");
  const tabs = groupByFamily(cats).map((g) => `<div class="tab-family"><h2 class="tab-family-title">${sign(g)}<span>${e(g.label)}</span></h2><div class="tab-family-pills">${g.cats.map(pill).join("")}</div></div>`).join("");
  const shelf = (it) => `<a class="story-shelf-item" href="/teachings/${it.slug}" aria-label="${e(it.storyName)}, ${e(it.storyBy)}: open the story"><span class="st-wood"><img src="/images/about-scroll-top.png" width="800" height="133" alt="" aria-hidden="true"><span class="st-carve st-name${it.storyName.length > 24 ? " st-long" : ""}">${e(it.storyName)}</span></span><span class="st-wood st-shelf-bot"><img src="/images/about-scroll-bot.png" width="800" height="132" alt="" aria-hidden="true"><span class="st-carve st-by">${e(it.storyBy)}</span></span></a>`;
  const cards = current.id === "stories" ? `<div class="story-shelf">${current.items.map(shelf).join("\n")}</div>` : current.items.map((it) => `<article class="card"><p class="tag" style="color:${current.accent}">${e(it.tag)}</p>
<h3 dir="auto">${omMini}${e(it.title)}</h3><p dir="auto">${e(it.summary)}</p><a class="more" href="/teachings/${it.slug}">${it.lang === "ar" ? "اقرأ · Read" : "Read"}</a></article>`).join("\n");
  const artwork = current.id === "teachings" && (replacementAt("tab:teachings") || current.artwork);
  const header = artwork ? `<header class="banner teachings-masthead"><canvas data-sky="lib" aria-hidden="true"></canvas><div class="fade"></div>
@@NAV@@
</header>` : banner({ scene: "lib", cls: "gold-banner", eyebrow: "Teachings and wisdom", title: "The Library of Light", lead: "Every teaching filed under its title. Choose a path below." });
  const artBanner = artwork ? `<figure class="teachings-art-banner art-frame"><img src="${e(artwork.src)}" width="${artwork.width}" height="${artwork.height}" alt="${e(artwork.alt)}" fetchpriority="high" decoding="async"></figure><div class="teachings-heading wrap"><h1>${e(current.heading || current.label)}</h1><p>${e(current.blurb)}</p>${tabExtras(current)}</div>` : "";
  const main = `<section${artwork ? ' class="teachings-library"' : ""} style="padding-top:16px">${artBanner}<div class="wrap"><div class="lib-frame"><img class="lib-column" src="/images/library-column.png" width="240" height="696" alt="" aria-hidden="true"><nav class="tabs" aria-label="Paths of knowledge"><div class="tabs-families">${tabs}</div></nav></div>
${artwork ? "" : current.sides ? `<div class="tab-flank">${sideImg(current.sides[0])}<div class="tab-flank-text"><h2 class="section-title" style="margin-top:0">${e(current.heading || current.label)}</h2><p class="section-intro">${e(current.blurb)}</p>${tabExtras(current)}</div>${sideImg(current.sides[1])}</div>` : `<h2 class="section-title" style="margin-top:36px">${e(current.heading || current.label)}</h2><p class="section-intro">${e(current.blurb)}</p>${tabExtras(current)}`}
${current.images ? `<div class="tab-pictures">${current.images.map((im) => `<img src="${e(im.src)}" width="${im.width}" height="${im.height}" alt="${e(im.alt)}" loading="lazy" decoding="async">`).join("")}</div>` : ""}
${current.wide ? `<figure class="cover tab-wide${current.id === "prayers" ? " prayer-quote-cover" : ""}">${current.id === "prayers" ? `<figcaption class="prayer-image-caption"><blockquote class="prayer-image-quote"><p><span>If we all pray to One God, share One Creator,</span>
<span>and return to that same One God—</span>
<span>why do we destroy each other</span>
<span>just to reach Him?</span>
<span>Did God ever ask for that?</span></p></blockquote><p class="prayer-image-signature">— Samadhi-Love</p></figcaption>` : ""}<img src="${e(((current.id === "prayers" && replacementAt("tab:prayers")) || current.wide).src)}" width="${current.wide.width}" height="${current.wide.height}" alt="${e(current.wide.alt)}" loading="lazy" decoding="async"></figure>` : ""}
${current.id === "stories" ? cards : `<div class="grid grid-wide">${cards}</div>`}${samadhiSaying(current.id)}</div></section>`;
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
// Samadhi's decision (Nov 2026): the seven portraits show. A numbered picture in public/images/replacements/
// (slots 01-07, optional) takes a family's place if he ever adds one.
const SHOW_STAR_FAMILY_PHOTOS = true;
function familyPicture(item) {
  const rep = replacementAt(`star:${item.slug}`);
  if (rep) return `<figure class="star-art star-portrait tall"><img src="${e(rep.src)}" width="${rep.width}" height="${rep.height}" alt="${e(rep.alt)}" loading="lazy"><figcaption>${e(portraitCaption)}</figcaption></figure>`;
  if (!SHOW_STAR_FAMILY_PHOTOS) return "";
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

// Samadhi's short promise: at the foot of every page ("personal beliefs" links to his statement on /about).
function promise() {
  const [first, ...rest] = PROMISE.split("personal beliefs");
  return `<p class="promise">${e(first)}<a href="/about#statement">personal beliefs</a>${e(rest.join("personal beliefs"))} <span class="promise-sign">— Samadhi</span></p>`;
}

// Site-wide closing lines (Part E): every teaching ends with an invitation and a humble note; pages that
// touch death or the afterlife add a gentle line of care; health pages add a reminder about doctors;
// the Ages of the World end in hope.
const DEATH_TABS = new Set(["souls-journey", "beyond-the-veil"]);
const HEALTH_TABS = new Set(["knowledge", "plant-medicine"]);
const HEALTH_SLUGS = new Set(["breath-of-peace", "trataka", "fasting-across-the-traditions", "practices-and-inner-work"]);
const DEATH_WORDS = /\b(afterlife|after death|life after death|the dead|beyond death|death is a doorway|near-death|between lives|the departed|grief|grieving)\b/i;
function closing(tabId, item) {
  const lines = [];
  if (tabId === "ages-of-the-world") lines.push(`<p class="cl-hope">The cycle always turns. The Golden Age returns, and each soul that awakens brings it closer.</p>`);
  if (HEALTH_TABS.has(tabId) || HEALTH_SLUGS.has(item.slug)) lines.push(`<p class="cl-health">Spiritual guidance, not a replacement for your doctor.</p>`);
  lines.unshift(promise());
  lines.push(`<p class="cl-take">Take what resonates with your heart; leave the rest.</p>`);
  lines.push(`<p class="cl-humble">Offered with love and deep respect for every path. If you notice an error, please <a href="/contact">contact us</a>.</p>`);
  if (DEATH_TABS.has(tabId) || DEATH_WORDS.test(item.body || "")) lines.push(`<p class="cl-care">If you are struggling, please reach out. In the US, call or text 988. You are loved, and you are not alone.</p>`);
  return `<aside class="closing" aria-label="A closing word">${lines.join("")}</aside>`;
}

// Psychedelics and Plant Medicine: the same calm safety box at the top of every page of the tab.
function plantSafetyBox(slug) {
  const more = slug === "plant-medicine-safety" ? "" : ` <a href="/teachings/plant-medicine-safety">Read the full safety page</a>.`;
  return `<aside class="pm-safety" role="note" aria-label="Before anything else"><p class="pm-safety-title">Before anything else</p><ul>
<li><strong>Education only.</strong> Not medical, legal or professional advice, and not encouragement to take any substance.</li>
<li><strong>Dangerous with some medicines.</strong> Ayahuasca and other MAO inhibitors can cause life-threatening reactions with many antidepressants (SSRIs, SNRIs, MAOIs), lithium, stimulants and some foods. Never stop a prescribed medicine on your own; talk to your doctor.</li>
<li><strong>Not for everyone.</strong> Anyone with a personal or family history of psychosis, schizophrenia or bipolar disorder, or with heart disease, seizures or pregnancy, faces serious risks.</li>
<li><strong>Mostly illegal.</strong> These substances are controlled in most countries and under US federal law, with narrow religious and regulated exceptions.</li>
</ul><p class="pm-safety-more">In a crisis in the US, call or text 988; in an emergency, call 911.${more}</p></aside>`;
}

// The Path of Study sign at the foot of every teaching: which stage this tab belongs to, and the way on.
function pathStrip(tabId) {
  const st = stageFor(tabId);
  if (!st) return "";
  const nx = nextStage(st);
  return `<aside class="path-strip" aria-label="Path of Study"><a href="/teachings/the-path-of-study#stage-${st.n}"><span class="path-strip-label">Path of Study</span> Stage ${st.n} of ${STAGES.length}: ${e(st.title)}</a><a href="/teachings/${nx.begin}">Next stage: ${e(nx.title)} →</a></aside>`;
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
${category.id === "plant-medicine" ? plantSafetyBox(item.slug) : ""}
${item.float === "kriya" ? kriyaFloat() : ""}
${item.figure === "chakras" && item.slug !== "meditation-and-prayer" ? chakraFigure() : ""}
${portraitFor(item.slug) ? starPortrait(item) : familyPicture(item) || (item.painting ? painting(replacementAt(`page:${item.slug}`) ? { ...item.painting, src: replacementAt(`page:${item.slug}`).src.slice(1) } : item.painting) : item.art ? starArt(item.art) : "")}
${item.image ? `<figure class="cover${item.image.small ? " cover-small" : ""}"><img src="${e((replacementAt(`page:${item.slug}`) || item.image).src)}" width="${item.image.width}" height="${item.image.height}" alt="${e(item.image.alt)}" decoding="async">${item.image.caption ? `<figcaption class="fine">${e(item.image.caption)}</figcaption>` : ""}</figure>` : ""}
${item.cover ? `<figure class="cover"><img src="/${e(item.cover)}" alt="" loading="lazy"></figure>` : item.body && item.body.includes("{{home-photo}}") ? "" : teachingPicture(item.slug)}
${item.lang === "ar" ? `<div class="rtl" dir="rtl" lang="ar">${renderMarkdown(item.body)}</div>` : linkTeachingTitles(renderMarkdown(item.body), item.slug).replace("<p>{{home-photo}}</p>", () => homeSky(item.slug)).replace(/<p>\{\{([a-z0-9-]+)\}\}<\/p>/g, (m, k) => (item.inline && item.inline[k] ? painting(item.inline[k]) : k.startsWith("cross-") ? crossArt(k) : k === "dawn-art" ? dawnArt(): k === "jung-mandala" ? jungMandala(): k.startsWith("tree-") ? treeArt(k): k.startsWith("veil-") ? veilArt(k): k.startsWith("geo-") ? geometryArt(k): k.startsWith("philo-") ? philosophyArt(k): k.startsWith("lotus-") ? lotusArt(k): k.startsWith("text-") ? sacredTextArt(k): k.startsWith("prophet-") ? prophetArt(k): k.startsWith("practice-") ? practiceArt(k, geometryArt): k.startsWith("start-") ? startArt(k): k.startsWith("land-") ? landArt(k): k.startsWith("heart-") ? heartArt(k): k.startsWith("carry-") ? carryArt(k): k.startsWith("story-") ? storyArt(k): k.startsWith("xp-") ? expansionArt(k): k.startsWith("word-") ? messengersArt(k): k.startsWith("soul-") ? journeyArt(k): k.startsWith("myst-") ? mysteryArt(k): k.startsWith("life-") ? dailyArt(k): k.startsWith("add-") || k.startsWith("num-") ? additionsArt(k): k.startsWith("path-") ? pathArt(k, libraryCategories()): k.startsWith("names-") ? namesArt(k): k === "pm-view" ? samadhiViewScroll() : k === "sg-art" ? violetArt() : k === "sg-panel" ? violetPanel() : k === "sg-portrait" ? sgPortrait() : ""))}
${item.youtube && youtubeId(item.youtube) ? `<div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(item.youtube)}" title="${e(item.title)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` : ""}
${item.slug === "meditation-and-prayer" ? chakraFigure() : ""}
${wisdomSection(item.slug)}
${closing(category.id, item)}
${pathStrip(category.id)}
<nav class="next" aria-label="More teachings">${prev ? `<a href="/teachings/${prev.slug}">← ${e(prev.title)}</a>` : "<span></span>"}${next ? `<a href="/teachings/${next.slug}">${e(next.title)} →</a>` : `<a href="/library?tab=${category.id}">Back to ${e(category.label)}</a>`}</nav>
</div></article>`;
  return layout({ title: item.title, description: item.summary, active: category.id, header, main, canonical: `/teachings/${item.slug}`, type: "article" });
}

function simple({ key, scene, eyebrow, title, lead, body, description }) {
  return layout({ title, description: description || lead, active: key, header: banner({ scene, eyebrow, title, lead }), main: `<section style="padding-top:24px"><div class="wrap narrow">${body}</div></section>` });
}

// Site search: a plain form and a results page built on the server, so it works on every device, with no scripts.
// Nothing typed is stored or logged.
function searchPage(params) {
  const raw = String((params && params.get("q")) || "").slice(0, 120).trim();
  const norm = (t) => String(t).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[*_`#>\[\]()|]/g, " ");
  const terms = norm(raw).split(/\s+/).filter((w) => w.length > 1).slice(0, 8);
  let results = [];
  if (terms.length) {
    for (const c of libraryCategories()) for (const it of c.items) {
      const title = norm(it.title), sum = norm(it.summary || ""), body = norm(it.body || "");
      let score = 0, all = true;
      for (const t of terms) {
        const s = (title.includes(t) ? 10 : 0) + (sum.includes(t) ? 4 : 0) + (body.includes(t) ? 1 + Math.min(4, body.split(t).length - 2) : 0);
        if (!s) { all = false; break; }
        score += s;
      }
      if (all) results.push({ c, it, score });
    }
    const seen = new Set();
    results = results.sort((a, b) => b.score - a.score).filter((r) => !seen.has(r.it.slug) && seen.add(r.it.slug)).slice(0, 40);
  }
  const form = `<form class="search-form search-form-big" action="/search" method="get" role="search"><label for="sq" class="sr-only">Search the Library</label><input id="sq" type="search" name="q" value="${e(raw)}" placeholder="Search a teaching, a name or a word" autocomplete="off"><button type="submit" class="btn btn-gold">Search</button></form>`;
  const list = results.map(({ c, it }) => `<li class="search-hit"><a href="/teachings/${it.slug}"><span class="eyebrow" style="color:${c.accent || "var(--gold)"}">${e(c.label)}</span><strong>${e(it.title)}</strong><span class="search-sum">${e(it.summary || "")}</span></a></li>`).join("");
  const msg = !raw ? `<p class="section-intro">Type a word, a name or a question: <em>forgiveness</em>, <em>Metatron</em>, <em>after death</em>, <em>Rumi</em>.</p>`
    : results.length ? `<p class="section-intro">${results.length === 40 ? "The first 40 teachings" : results.length === 1 ? "One teaching" : `${results.length} teachings`} for <strong>${e(raw)}</strong>.</p>`
    : `<p class="section-intro">No teaching matches <strong>${e(raw)}</strong> yet. Try a shorter or different word, look in <a href="/teachings/questions-people-ask">Questions People Ask</a>, or browse the <a href="/library">whole Library</a>.</p>`;
  return layout({ title: raw ? `Search: ${raw}` : "Search the Library", description: "Search every teaching in the SAMADHI LOVE Library of Light.", active: "search",
    header: banner({ scene: "lib", eyebrow: "Library of Light", title: "Search the Library", lead: "Find any teaching by a word, a name or a question." }),
    main: `<section style="padding-top:24px"><div class="wrap narrow">${form}${msg}<ul class="search-hits">${list}</ul><p class="fine">Nothing you type here is saved.</p></div></section>` });
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
  return simple({ key: "credits", scene: "art3", eyebrow: "Thank you", title: "Picture credits", lead: "The artists and photographers behind the pictures on this site.", body: `<div class="article"><p>Teachings banner and home portrait: Artwork by SAMADHI LOVE.</p><p>The cedars of Lebanon (Sacred Lands): an artistic image shared by SAMADHI LOVE.</p><p>Olive trees above Jerusalem (Sacred Lands, Jerusalem: City of Peace): a picture shared by SAMADHI LOVE.</p><p>The white dove with an olive branch (Sacred Lands, Peace in the Land of God): a picture shared by SAMADHI LOVE.</p><p>The owl of Athena (Philosophy, What Is Philosophy?): a picture shared by SAMADHI LOVE.</p><p>The small lamp (Spirit in Daily Life): a picture shared by SAMADHI LOVE.</p><p>The open door of light and the stairway of light (The Soul's Journey): pictures shared by SAMADHI LOVE.</p><p>The Chart of the I AM Presence (Mystery Schools, The I AM Teachings): a picture shared by SAMADHI LOVE.</p><p>The heart of light (The Heart and the Ego, Grace, Surrender and Humility): a picture shared by SAMADHI LOVE.</p><p>Sunrise over the hills (Blessing &amp; Gratitude, Blessing God): a picture shared by SAMADHI LOVE.</p><p>The body of light and the silver cord, the tunnel and the light, the inner eye, channeling divine light, and light language (Beyond the Veil): pictures shared by SAMADHI LOVE.</p><p>The violet flame and the Maltese cross (Saint Germain and the Violet Flame): a picture shared by SAMADHI LOVE.</p><p>Light over the prairie, a symbol of Wakan Tanka (The Names of God, Indigenous Traditions): a picture shared by SAMADHI LOVE.</p><p>The rose with a heart of light (Mystery Schools, Dreams, The Divine Feminine) and the golden rose cross (The Rosicrucian Path and The Cross): pictures shared by SAMADHI LOVE.</p><p>The living cross of light, the cross of the world soul above the Earth, the sun cross carved in stone, the ankh, the tau and the Celtic cross (The Cross of Light): pictures shared by SAMADHI LOVE.</p><p>The mandala (Carl Jung), the wheel of the inner journey (The Path of Study), rings of light on still water (Sacred Sound, Mantra and Frequency; The Power of Silence), the tau and the Celtic cross (The Cross of Light), old holy books and scrolls (Sacred Texts), the scroll of light among the stars (The Torah, The Books of Enoch), the old map of the land (The Holy Land and Lebanon; names added for the site), and the great golden tree (The Ten Sefirot; the Tree of Life drawn over it for the site): pictures shared by SAMADHI LOVE.</p><p>The meditator with the seven chakra lights (The Seven Chakras) and the seven lotuses of the chakras (Root, Sacral, Solar Plexus, Heart, Throat, Third Eye and Crown): pictures shared by SAMADHI LOVE.</p><p>The Earth at sunrise with the ships of light (The Star Nations of Light), the Hathors in their temple of light, the Essassani family, and light shining through the clouds (The Shadow Side): pictures shared by SAMADHI LOVE.</p><p>Many lamps, one Light (Those Who Carried the Word); the ark and the rainbow (Noah), the well at evening (Isaac), the ladder of light (Jacob), the coat of many colours (Joseph), the house with two pillars (Solomon), the chariot of fire (Elijah), the white lily (Mary), the dove over the Jordan (John the Baptist), and the hills of Jerusalem at sunrise (The Temple in Jerusalem): pictures shared by SAMADHI LOVE.</p><p>The open doors of light (42), the pilgrim's path (Sacred Sites of the World), the Treasury of Petra, the cedars and the open book (Kahlil Gibran), the hermit's cell (The Desert Fathers and Mothers), the forest and the whistle (The Baal Shem Tov), the white temple by the river (Sri Ramakrishna), the temple on the rock (Swami Vivekananda), the garlanded doorway (Anandamayi Ma), the lotus at sunrise (Sri Aurobindo), the jar in the desert (The Gnostics), the cave above the Dead Sea (The Essenes), the weighing of the heart (The Egyptian Mysteries), the alchemist's table (Spiritual Alchemy), the lyre under the stars (Pythagoras), the river and the fire (Heraclitus), the astrolabe (Hypatia), the Persian library (Avicenna), the desert arch (al-Ghazali), the arches of Córdoba (Averroes), the study above Cairo (Maimonides), the forest pond (Emerson), the holy lights (Sacred Days), the prayer beads, the pilgrim's road (Pilgrimage), the whirling robes (Sufi Whirling), the pyramids and the Sphinx (Giza), the columns of Baalbek, Stonehenge at sunrise, the temple columns of Delphi, Machu Picchu in the clouds, and Angkor Wat in the lotus pool: pictures shared by SAMADHI LOVE.</p><p>The seven heavens rising in rings of light (The Books of Enoch): a picture shared by SAMADHI LOVE.</p><p>The nine spheres of light (Numerology; numbers added for the site): a picture shared by SAMADHI LOVE.</p><p>Many lamps, one light (Prophets and Teachers; One Source, One Message): a picture shared by SAMADHI LOVE.</p><p>The scroll and the seven rings of light (Enoch): a picture shared by SAMADHI LOVE.</p><p>Abraham's tent under the stars, the sacred fire of Zarathushtra, the burning bush, the Bodhi tree under a full moon, the new heart, the dove and the lamb, the lamp in the niche, the flute, bow and lotus, and the lotus at sunrise (the pages of the prophets and teachers): pictures shared by SAMADHI LOVE.</p><p>The hanging scroll with the misty mountains (About): a picture shared by SAMADHI LOVE.</p><p>The scrolls with golden waves of sound, the open book with the Om, and the temple arch under the stars (home page): pictures shared by SAMADHI LOVE.</p><p>The candlelit scroll (home page), the scholar's desk with the globe and the written Om (Library), the gold Om coin (the site's sign), and the gold family signs: pictures shared by SAMADHI LOVE.</p><p>The Immaculate Heart of Mary and the Sacred Heart of Jesus (A Prayer to Mother Mary): an artistic image shared by SAMADHI LOVE.</p>${body}</div>` });
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
  const paths = ["/", "/library", "/masters", "/music", "/videos", "/podcasts", "/gallery", "/about", "/contact", "/credits", "/privacy", "/terms"];
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
    if (pathname === "/search") return searchPage(params);
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
      body: `<figure class="about-scroll" aria-label="About Samadhi, written on an ancient scroll"><img class="as-roll" src="/images/about-scroll-top.png" width="800" height="133" alt="" aria-hidden="true"><div class="as-unroll"><div class="as-inner"><div class="as-text" id="statement">${renderMarkdown(about)}<p class="as-sign">Samadhi</p></div></div></div><img class="as-roll as-roll-bot" src="/images/about-scroll-bot.png" width="800" height="132" alt="" aria-hidden="true"></figure><div class="article"><h2 id="vision">My Vision</h2>${renderMarkdown(vision)}<h2 id="respect">Respect for this space</h2>${renderMarkdown(respect)}</div>` });
    if (pathname === "/privacy") return simple({ key: "privacy", scene: "lib", eyebrow: "Privacy", title: "Privacy Policy", lead: "No tracking, no ads, no sign-up: what this site does and does not do with your information.",
      body: `<p class="fine">Last updated: November 2026. Written in plain language. This is not legal advice.</p>
<h2>In short</h2><p>SAMADHI LOVE is a free place of teachings and music. It does not ask you to sign up, does not sell anything, does not show ads and does not track you.</p>
<h2>What this site does not do</h2><ul><li>No accounts for visitors, no sign-up and no newsletter list.</li><li>No advertising, no tracking pixels and no analytics tools.</li><li>No cookies for visitors. The only cookie is a private sign-in cookie used by the site owner on the owner page.</li><li>Nothing is sold, and no information about you is sold or shared for marketing.</li></ul>
<h2>What happens when you visit</h2><ul><li><strong>Hosting.</strong> Like every website, the server that hosts this site briefly records technical information such as your IP address, the page you asked for and the time, to keep the site working and safe.</li>
<li><strong>Fonts.</strong> Some letters on the site are loaded from Google Fonts, which means Google receives your IP address when the font is loaded.</li>
<li><strong>Videos.</strong> Videos are shown with YouTube's privacy-enhanced mode (youtube-nocookie.com). When you press play, YouTube's own privacy policy applies.</li>
<li><strong>Tools on the pages.</strong> The breathing guides, sounds, gazing meditation, glossary search and numerology calculator run only in your own browser. Nothing you type into them is sent or saved.</li></ul>
<h2>If you write to us</h2><p>If you send an email, we receive your email address and your message, and use them only to read and answer you. We do not add you to any list. You may ask us at any time to delete your messages.</p>
<h2>Children</h2><p>This site is for a general audience and does not knowingly collect information from children.</p>
<h2>Changes</h2><p>If this policy changes, the new version will be posted here with its date.</p>
<h2>Questions</h2><p>Please write through the <a href="/contact">Contact</a> page.</p>` });
    if (pathname === "/terms") return simple({ key: "terms", scene: "lib", eyebrow: "Terms", title: "Terms of Use", lead: "Simple terms for a place of teachings and music, offered with love.",
      body: `<p class="fine">Last updated: November 2026. Written in plain language. This is not legal advice.</p>
<h2>Welcome</h2><p>By using ${e(site.address)} you agree to these simple terms. If you do not agree, please do not use the site.</p>
<h2>What this site offers</h2><p>SAMADHI LOVE shares spiritual teachings, the wisdom of the world's traditions, music and simple practices, offered with love and deep respect for every path. Samadhi's own understanding is labelled as his view. No violence, sexual content or hatred is published here. Take what resonates with your heart; leave the rest.</p>
<h2>Personal beliefs</h2>${promise()}
<h2>Not professional advice</h2><p>Nothing on this site is medical, mental-health, legal or financial advice. Spiritual guidance is not a replacement for your doctor. Practices such as breathing, fasting and gazing are optional and done at your own choice and responsibility; stop any practice that makes you feel unwell. If you are struggling, please reach out: in the US, call or text 988.</p>
<h2>Using the content</h2><p>The writing, artwork and music on this site belong to SAMADHI LOVE unless stated otherwise. Pictures from other sources are listed on the <a href="/credits">Picture credits</a> page. You are welcome to share links and short quotations with credit; please ask before copying whole pages, artwork or music.</p>
<h2>Versual Studio</h2><p>Versual Studio, at ${e(site.address)}/studio, is a separate music app and may have its own terms.</p>
<h2>Respect</h2><p>This is a sacred space. Please speak with kindness when you write to us.</p>
<h2>Accuracy</h2><p>Great care is taken to quote sacred texts and history accurately. If you notice an error, please <a href="/contact">contact us</a>.</p>
<h2>Links to other sites</h2><p>Some pages link to other websites for sources. We are not responsible for their content.</p>
<h2>Changes</h2><p>These terms may be updated from time to time; the new version will be posted here with its date.</p>` });
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
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Private preview · SAMADHI LOVE</title></head><body style="background:#0b0906;color:#ece9ff;font-family:system-ui,sans-serif;text-align:center;padding:96px 20px"><h1>SAMADHI LOVE</h1><p>This website is a private preview. Please enter the preview password.</p></body></html>`;
  },
  locked() {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Private preview · SAMADHI LOVE</title></head><body style="background:#0b0906;color:#ece9ff;font-family:system-ui,sans-serif;text-align:center;padding:96px 20px"><h1>SAMADHI LOVE</h1><p>This website is a private preview and is locked.</p><p>The owner unlocks it by adding a secret named PREVIEW_PASSWORD.</p></body></html>`;
  },
};
