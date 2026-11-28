// SAMADHI LOVE website. Plain Node.js, no outside packages.
// Private preview: every page asks for a password until SITE_PUBLIC is set to "true".
import http from "node:http";
import { readFile } from "node:fs/promises";
import { timingSafeEqual, createHash } from "node:crypto";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pages, sitemapXml, robotsTxt, setRequest } from "./lib/pages.js";
import { replacementFile } from "./lib/replacements.js";
import { safeCandidatePath } from "./lib/pictures.js";
import { handleOwner } from "./lib/owner.js";
import { refresh, readMedia } from "./lib/posts.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const isPublic = process.env.SITE_PUBLIC === "true";

const files = {
  "/site.css": ["public/site.css", "text/css; charset=utf-8"],
  "/sky.js": ["public/sky.js", "text/javascript; charset=utf-8"],
  "/practice.js": ["public/practice.js", "text/javascript; charset=utf-8"],
  "/favicon.svg": ["public/favicon.svg", "image/svg+xml"],
  "/owner.js": ["public/owner.js", "text/javascript; charset=utf-8"],
  "/images/chakras.jpg": ["public/images/chakras.jpg", "image/jpeg"],
  "/images/cedars-of-lebanon.jpg": ["public/images/cedars-of-lebanon.jpg", "image/jpeg"],
  "/images/jerusalem-olives.jpg": ["public/images/jerusalem-olives.jpg", "image/jpeg"],
  "/images/peace-dove.jpg": ["public/images/peace-dove.jpg", "image/jpeg"],
  "/images/athena-owl.jpg": ["public/images/athena-owl.jpg", "image/jpeg"],
  "/images/daily-lamp.jpg": ["public/images/daily-lamp.jpg", "image/jpeg"],
  "/images/soul-door.jpg": ["public/images/soul-door.jpg", "image/jpeg"],
  "/images/soul-stairs.jpg": ["public/images/soul-stairs.jpg", "image/jpeg"],
  "/images/i-am-chart.jpg": ["public/images/i-am-chart.jpg", "image/jpeg"],
  "/images/rose-heart.jpg": ["public/images/rose-heart.jpg", "image/jpeg"],
  "/images/rose-cross.jpg": ["public/images/rose-cross.jpg", "image/jpeg"],
  "/images/world-soul-cross.jpg": ["public/images/world-soul-cross.jpg", "image/jpeg"],
  "/images/heart-light.jpg": ["public/images/heart-light.jpg", "image/jpeg"],
  "/images/sunrise-praise.jpg": ["public/images/sunrise-praise.jpg", "image/jpeg"],
  "/images/silver-cord.jpg": ["public/images/silver-cord.jpg", "image/jpeg"],
  "/images/veil-tunnel.jpg": ["public/images/veil-tunnel.jpg", "image/jpeg"],
  "/images/veil-eye.jpg": ["public/images/veil-eye.jpg", "image/jpeg"],
  "/images/veil-language.jpg": ["public/images/veil-language.jpg", "image/jpeg"],
  "/images/veil-channeling.jpg": ["public/images/veil-channeling.jpg", "image/jpeg"],
  "/images/jung-mandala.jpg": ["public/images/jung-mandala.jpg", "image/jpeg"],
  "/images/path-wheel.jpg": ["public/images/path-wheel.jpg", "image/jpeg"],
  "/images/sound-ripples.jpg": ["public/images/sound-ripples.jpg", "image/jpeg"],
  "/images/sacred-books.jpg": ["public/images/sacred-books.jpg", "image/jpeg"],
  "/images/holy-land-map.jpg": ["public/images/holy-land-map.jpg", "image/jpeg"],
  "/images/tree-of-life-gold.jpg": ["public/images/tree-of-life-gold.jpg", "image/jpeg"],
  "/images/scroll-of-light.jpg": ["public/images/scroll-of-light.jpg", "image/jpeg"],
  "/images/abraham-tent.jpg": ["public/images/abraham-tent.jpg", "image/jpeg"],
  "/images/sacred-fire.jpg": ["public/images/sacred-fire.jpg", "image/jpeg"],
  "/images/burning-bush.jpg": ["public/images/burning-bush.jpg", "image/jpeg"],
  "/images/xp-rock-temple.jpg": ["public/images/xp-rock-temple.jpg", "image/jpeg"],
  "/images/xp-ashram-door.jpg": ["public/images/xp-ashram-door.jpg", "image/jpeg"],
  "/images/xp-lotus-sea.jpg": ["public/images/xp-lotus-sea.jpg", "image/jpeg"],
  "/images/xp-gnostic-jar.jpg": ["public/images/xp-gnostic-jar.jpg", "image/jpeg"],
  "/images/xp-qumran-cave.jpg": ["public/images/xp-qumran-cave.jpg", "image/jpeg"],
  "/images/xp-weighing-heart.jpg": ["public/images/xp-weighing-heart.jpg", "image/jpeg"],
  "/images/xp-42-doors.jpg": ["public/images/xp-42-doors.jpg", "image/jpeg"],
  "/images/xp-sacred-path.jpg": ["public/images/xp-sacred-path.jpg", "image/jpeg"],
  "/images/xp-petra.jpg": ["public/images/xp-petra.jpg", "image/jpeg"],
  "/images/xp-gibran-cedars.jpg": ["public/images/xp-gibran-cedars.jpg", "image/jpeg"],
  "/images/xp-desert-cell.jpg": ["public/images/xp-desert-cell.jpg", "image/jpeg"],
  "/images/xp-forest-whistle.jpg": ["public/images/xp-forest-whistle.jpg", "image/jpeg"],
  "/images/xp-river-temple.jpg": ["public/images/xp-river-temple.jpg", "image/jpeg"],
  "/images/noah-ark.jpg": ["public/images/noah-ark.jpg", "image/jpeg"],
  "/images/isaac-well.jpg": ["public/images/isaac-well.jpg", "image/jpeg"],
  "/images/jacob-ladder.jpg": ["public/images/jacob-ladder.jpg", "image/jpeg"],
  "/images/joseph-coat.jpg": ["public/images/joseph-coat.jpg", "image/jpeg"],
  "/images/solomon-temple.jpg": ["public/images/solomon-temple.jpg", "image/jpeg"],
  "/images/elijah-chariot.jpg": ["public/images/elijah-chariot.jpg", "image/jpeg"],
  "/images/mary-lily.jpg": ["public/images/mary-lily.jpg", "image/jpeg"],
  "/images/john-jordan.jpg": ["public/images/john-jordan.jpg", "image/jpeg"],
  "/images/temple-jerusalem.jpg": ["public/images/temple-jerusalem.jpg", "image/jpeg"],
  "/images/carried-word.jpg": ["public/images/carried-word.jpg", "image/jpeg"],
  "/images/seven-heavens.jpg": ["public/images/seven-heavens.jpg", "image/jpeg"],
  "/images/star-federation.jpg": ["public/images/star-federation.jpg", "image/jpeg"],
  "/images/star-hathors.jpg": ["public/images/star-hathors.jpg", "image/jpeg"],
  "/images/star-hathors-2.jpg": ["public/images/star-hathors-2.jpg", "image/jpeg"],
  "/images/star-essassani.jpg": ["public/images/star-essassani.jpg", "image/jpeg"],
  "/images/star-shadow-light.jpg": ["public/images/star-shadow-light.jpg", "image/jpeg"],
  "/images/numerology-nine.jpg": ["public/images/numerology-nine.jpg", "image/jpeg"],
  "/images/prophets-lights.jpg": ["public/images/prophets-lights.jpg", "image/jpeg"],
  "/images/chakras-meditator.jpg": ["public/images/chakras-meditator.jpg", "image/jpeg"],
  "/images/chakra-1-root.jpg": ["public/images/chakra-1-root.jpg", "image/jpeg"],
  "/images/chakra-2-sacral.jpg": ["public/images/chakra-2-sacral.jpg", "image/jpeg"],
  "/images/chakra-3-solar-plexus.jpg": ["public/images/chakra-3-solar-plexus.jpg", "image/jpeg"],
  "/images/chakra-4-heart.jpg": ["public/images/chakra-4-heart.jpg", "image/jpeg"],
  "/images/chakra-5-throat.jpg": ["public/images/chakra-5-throat.jpg", "image/jpeg"],
  "/images/chakra-6-third-eye.jpg": ["public/images/chakra-6-third-eye.jpg", "image/jpeg"],
  "/images/chakra-7-crown.jpg": ["public/images/chakra-7-crown.jpg", "image/jpeg"],
  "/images/bodhi-tree.jpg": ["public/images/bodhi-tree.jpg", "image/jpeg"],
  "/images/new-heart.jpg": ["public/images/new-heart.jpg", "image/jpeg"],
  "/images/dove-lamb.jpg": ["public/images/dove-lamb.jpg", "image/jpeg"],
  "/images/lamp-niche.jpg": ["public/images/lamp-niche.jpg", "image/jpeg"],
  "/images/enoch-heavens.jpg": ["public/images/enoch-heavens.jpg", "image/jpeg"],
  "/images/lotus-sunrise.jpg": ["public/images/lotus-sunrise.jpg", "image/jpeg"],
  "/images/flute-bow-lotus.jpg": ["public/images/flute-bow-lotus.jpg", "image/jpeg"],
  "/images/sign-compass.png": ["public/images/sign-compass.png", "image/png"],
  "/images/sign-lotus.png": ["public/images/sign-lotus.png", "image/png"],
  "/images/sign-laurel.png": ["public/images/sign-laurel.png", "image/png"],
  "/images/sign-flower.png": ["public/images/sign-flower.png", "image/png"],
  "/images/sign-temple.png": ["public/images/sign-temple.png", "image/png"],
  "/images/sign-book.png": ["public/images/sign-book.png", "image/png"],
  "/images/sign-flame.png": ["public/images/sign-flame.png", "image/png"],
  "/images/om-coin.png": ["public/images/om-coin.png", "image/png"],
  "/images/library-column.png": ["public/images/library-column.png", "image/png"],
  "/images/hero-scroll.jpg": ["public/images/hero-scroll.jpg", "image/jpeg"],
  "/images/library-desk.jpg": ["public/images/library-desk.jpg", "image/jpeg"],
  "/images/home-sound-scroll.jpg": ["public/images/home-sound-scroll.jpg", "image/jpeg"],
  "/images/home-om-book.jpg": ["public/images/home-om-book.jpg", "image/jpeg"],
  "/images/home-temple-stars.jpg": ["public/images/home-temple-stars.jpg", "image/jpeg"],
  "/images/about-scroll-top.png": ["public/images/about-scroll-top.png", "image/jpeg"],
  "/images/about-scroll-mid.png": ["public/images/about-scroll-mid.png", "image/jpeg"],
  "/images/about-scroll-bot.png": ["public/images/about-scroll-bot.png", "image/jpeg"],
  "/images/violet-flame.jpg": ["public/images/violet-flame.jpg", "image/jpeg"],
  "/images/wakan-tanka.jpg": ["public/images/wakan-tanka.jpg", "image/jpeg"],
  "/images/sun-cross.jpg": ["public/images/sun-cross.jpg", "image/jpeg"],
  "/images/cross-of-light.jpg": ["public/images/cross-of-light.jpg", "image/jpeg"],
  "/images/ankh.jpg": ["public/images/ankh.jpg", "image/jpeg"],
  "/images/tau-cross.jpg": ["public/images/tau-cross.jpg", "image/jpeg"],
  "/images/celtic-cross.jpg": ["public/images/celtic-cross.jpg", "image/jpeg"],
  "/images/sacred-hearts.jpg": ["public/images/sacred-hearts.jpg", "image/jpeg"],
  "/images/galactic-federation.jpg": ["public/images/galactic-federation.jpg", "image/jpeg"],
  "/images/council-for-earth.jpg": ["public/images/council-for-earth.jpg", "image/jpeg"],
  "/images/prayer.jpg": ["public/images/prayer.jpg", "image/jpeg"],
  "/images/prayer-masters.jpg": ["public/images/prayer-masters.jpg", "image/jpeg"],
  "/images/prayer-forest.jpg": ["public/images/prayer-forest.jpg", "image/jpeg"],
  "/images/prayer-desert.jpg": ["public/images/prayer-desert.jpg", "image/jpeg"],
  "/images/prayer-mountain.jpg": ["public/images/prayer-mountain.jpg", "image/jpeg"],
  "/images/prayer-golden.jpg": ["public/images/prayer-golden.jpg", "image/jpeg"],
  "/images/saint-germain-engraving.jpg": ["public/images/saint-germain-engraving.jpg", "image/jpeg"],
  "/images/yogananda.jpg": ["public/images/yogananda.jpg", "image/jpeg"],
  "/images/babaji.jpg": ["public/images/babaji.jpg", "image/jpeg"],
  "/images/shakespeare.jpg": ["public/images/shakespeare.jpg", "image/jpeg"],
  "/images/homer.jpg": ["public/images/homer.jpg", "image/jpeg"],
  "/images/hermes.jpg": ["public/images/hermes.jpg", "image/jpeg"],
  "/images/zoroaster.jpg": ["public/images/zoroaster.jpg", "image/jpeg"],
  "/images/orpheus.jpg": ["public/images/orpheus.jpg", "image/jpeg"],
  "/images/epictetus.jpg": ["public/images/epictetus.jpg", "image/jpeg"],
  "/images/shankara.jpg": ["public/images/shankara.jpg", "image/jpeg"],
  "/images/patanjali.jpg": ["public/images/patanjali.jpg", "image/jpeg"],
  "/images/hafiz.jpg": ["public/images/hafiz.jpg", "image/jpeg"],
  "/images/krishna.jpg": ["public/images/krishna.jpg", "image/jpeg"],
  "/images/shiva.jpg": ["public/images/shiva.jpg", "image/jpeg"],
  "/images/jesus-animals.jpg": ["public/images/jesus-animals.jpg", "image/jpeg"],
  "/images/prayer-left.jpg": ["public/images/prayer-left.jpg", "image/jpeg"],
  "/images/prayer-right.jpg": ["public/images/prayer-right.jpg", "image/jpeg"],
  "/images/hero-prayer.jpg": ["public/images/hero-prayer.jpg", "image/jpeg"],
  "/images/hero-galaxy.jpg": ["public/images/hero-galaxy.jpg", "image/jpeg"],
  "/images/teachings-sacred-geometry.jpg": ["public/images/teachings-sacred-geometry.jpg", "image/jpeg"],
  "/images/home-cosmic-portrait.jpg": ["public/images/home-cosmic-portrait.jpg", "image/jpeg"],
};

const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://www.youtube-nocookie.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

function samePassword(given, expected) {
  const a = Buffer.from(String(given)), b = Buffer.from(String(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

function allowed(req) {
  if (isPublic) return "open";
  const password = process.env.PREVIEW_PASSWORD;
  if (!password) return "no-password";
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return "ask";
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const given = decoded.slice(decoded.indexOf(":") + 1);
  return samePassword(given, password) ? "open" : "ask";
}

// Text (pages, styles, scripts, sitemap) is sent compressed when the browser accepts it: about 5 times smaller.
const compressible = /^(text\/|application\/(json|xml|javascript)|image\/svg)/;
const packed = new Map(); // compressed copies of the site's own files, made once
function compress(buf, enc) {
  return enc === "br"
    ? zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
    : zlib.gzipSync(buf, { level: 6 });
}
function send(res, status, body, type = "text/html; charset=utf-8", extra = {}, cacheKey = null) {
  const headers = { ...security, "Content-Type": type, ...(isPublic ? {} : { "X-Robots-Tag": "noindex, nofollow" }), ...extra };
  let out = body;
  if (out != null && compressible.test(type)) {
    const buf = Buffer.isBuffer(out) ? out : Buffer.from(String(out));
    const accept = String(res.acceptEncoding || "");
    const enc = /\bbr\b/.test(accept) ? "br" : /\bgzip\b/.test(accept) ? "gzip" : null;
    headers.Vary = "Accept-Encoding";
    if (enc && buf.length > 1024) {
      const key = cacheKey && `${cacheKey}|${enc}`;
      out = key && packed.has(key) ? packed.get(key) : compress(buf, enc);
      if (key) packed.set(key, out);
      headers["Content-Encoding"] = enc;
    } else out = buf;
  }
  res.writeHead(status, headers);
  res.end(out);
}

export async function handle(req, res) {
  res.acceptEncoding = req.headers["accept-encoding"];
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/healthz") return send(res, 200, "ok", "text/plain; charset=utf-8");
  // The site's own address, for canonical and share links: SITE_URL if set, otherwise the address the visitor used.
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim() === "http" ? "http" : "https";
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  const origin = (process.env.SITE_URL || (/^[A-Za-z0-9.-]+(:\d+)?$/.test(host) ? `${proto}://${host}` : "")).replace(/\/+$/, "");
  setRequest(origin, pathname === "/" ? "/" : pathname);
  if (pathname === "/robots.txt" && (req.method === "GET" || req.method === "HEAD")) return send(res, 200, robotsTxt(isPublic), "text/plain; charset=utf-8", { "Cache-Control": "public, max-age=3600" });
  const isOwner = pathname === "/owner" || pathname.startsWith("/owner/");
  const okMethod = req.method === "GET" || req.method === "HEAD" || (req.method === "POST" && isOwner);
  if (!okMethod) return send(res, 405, "Method not allowed", "text/plain; charset=utf-8", { Allow: isOwner ? "GET, HEAD, POST" : "GET, HEAD" });

  const gate = allowed(req);
  if (gate === "no-password") return send(res, 503, pages.locked(), undefined, { "Cache-Control": "no-store" });
  if (gate === "ask") return send(res, 401, pages.askPassword(), undefined, { "WWW-Authenticate": 'Basic realm="SAMADHI LOVE private preview", charset="UTF-8"', "Cache-Control": "no-store" });

  if (pathname === "/studio" || pathname.startsWith("/studio/")) {
    return send(res, 302, "", "text/plain; charset=utf-8", { Location: pages.studioUrl() });
  }
  if (pathname === "/sitemap.xml") { await refresh(); return send(res, 200, sitemapXml(), "application/xml; charset=utf-8", { "Cache-Control": isPublic ? "public, max-age=3600" : "no-store" }); }
  // Samadhi's star family pictures: any /images/star-families/<name>.jpg in that folder.
  const family = /^\/images\/star-families\/([a-z0-9-]+)\.jpg$/.exec(pathname);
  const known = files[pathname] || (family && [`public/images/star-families/${family[1]}.jpg`, "image/jpeg"]) || replacementFile(pathname);
  if (known) {
    const [file, type] = known;
    try {
      const body = await readFile(path.join(root, file));
      // A fingerprint of the file: a browser that already has this version gets a tiny "not changed" reply.
      const etag = `"${createHash("sha1").update(body).digest("base64url").slice(0, 16)}"`;
      const extra = { "Cache-Control": "public, max-age=3600", ETag: etag };
      if (String(req.headers["if-none-match"] || "").split(/,\s*/).includes(etag)) { res.writeHead(304, { ...security, ...extra }); return res.end(); }
      return send(res, 200, body, type, extra, `${pathname}|${etag}`);
    } catch { return send(res, 404, pages.notFound(), undefined); }
  }

  if (pathname === "/choose") return send(res, 302, "", "text/plain; charset=utf-8", { Location: "/owner/choose", "Cache-Control": "no-store" });
  if (isOwner) return handleOwner(req, res, pathname, url.searchParams, send);

  if (pathname.startsWith("/media/")) {
    const file = await readMedia(pathname.slice(1)).catch(() => null);
    if (!file) return send(res, 404, pages.notFound());
    const total = file.bytes.length;
    const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ""));
    const base = { "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes" };
    if (range && (range[1] || range[2])) {
      let start = range[1] ? Number(range[1]) : Math.max(0, total - Number(range[2]));
      let end = range[1] && range[2] ? Math.min(Number(range[2]), total - 1) : total - 1;
      if (start >= total || start > end) return send(res, 416, "", "text/plain; charset=utf-8", { "Content-Range": `bytes */${total}` });
      return send(res, 206, file.bytes.subarray(start, end + 1), file.type, { ...base, "Content-Range": `bytes ${start}-${end}/${total}` });
    }
    return send(res, 200, file.bytes, file.type, base);
  }

  if (pathname.startsWith("/candidates/")) {
    const full = safeCandidatePath(pathname);
    if (!full) return send(res, 404, pages.notFound());
    const ext = path.extname(full).toLowerCase();
    const type = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    try { return send(res, 200, await readFile(full), type, { "Cache-Control": "public, max-age=86400" }); }
    catch { return send(res, 404, pages.notFound()); }
  }

  await refresh();
  const page = pages.route(pathname, url.searchParams);
  if (!page) return send(res, 404, pages.notFound());
  return send(res, 200, page, undefined, { "Cache-Control": isPublic ? "public, max-age=300" : "no-store" });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) send(res, 500, "Something went wrong.", "text/plain; charset=utf-8");
    });
  }).listen(port, "0.0.0.0", () => console.log(`SAMADHI LOVE website on port ${port} (${isPublic ? "public" : "private preview"})`));
}
