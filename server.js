// SAMADHI LOVE website. Plain Node.js, no outside packages.
// Private preview: every page asks for a password until SITE_PUBLIC is set to "true".
import http from "node:http";
import { readFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pages } from "./lib/pages.js";
import { safeCandidatePath } from "./lib/pictures.js";
import { handleOwner } from "./lib/owner.js";
import { refresh, readMedia } from "./lib/posts.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const isPublic = process.env.SITE_PUBLIC === "true";

const files = {
  "/site.css": ["public/site.css", "text/css; charset=utf-8"],
  "/sky.js": ["public/sky.js", "text/javascript; charset=utf-8"],
  "/favicon.svg": ["public/favicon.svg", "image/svg+xml"],
  "/owner.js": ["public/owner.js", "text/javascript; charset=utf-8"],
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

function send(res, status, body, type = "text/html; charset=utf-8", extra = {}) {
  res.writeHead(status, { ...security, "Content-Type": type, ...(isPublic ? {} : { "X-Robots-Tag": "noindex, nofollow" }), ...extra });
  res.end(body);
}

export async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/healthz") return send(res, 200, "ok", "text/plain; charset=utf-8");
  const isOwner = pathname === "/owner" || pathname.startsWith("/owner/");
  const okMethod = req.method === "GET" || req.method === "HEAD" || (req.method === "POST" && isOwner);
  if (!okMethod) return send(res, 405, "Method not allowed", "text/plain; charset=utf-8", { Allow: isOwner ? "GET, HEAD, POST" : "GET, HEAD" });

  const gate = allowed(req);
  if (gate === "no-password") return send(res, 503, pages.locked(), undefined, { "Cache-Control": "no-store" });
  if (gate === "ask") return send(res, 401, pages.askPassword(), undefined, { "WWW-Authenticate": 'Basic realm="SAMADHI LOVE private preview", charset="UTF-8"', "Cache-Control": "no-store" });

  if (pathname === "/studio" || pathname.startsWith("/studio/")) {
    return send(res, 302, "", "text/plain; charset=utf-8", { Location: pages.studioUrl() });
  }
  if (files[pathname]) {
    const [file, type] = files[pathname];
    try {
      const body = await readFile(path.join(root, file));
      return send(res, 200, body, type, { "Cache-Control": "public, max-age=3600" });
    } catch { return send(res, 404, pages.notFound(), undefined); }
  }

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
