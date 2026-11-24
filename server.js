// SAMADHI LOVE website. Plain Node.js, no outside packages.
// Private preview: every page asks for a password until SITE_PUBLIC is set to "true".
import http from "node:http";
import { readFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pages } from "./lib/pages.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const isPublic = process.env.SITE_PUBLIC === "true";

const files = {
  "/site.css": ["public/site.css", "text/css; charset=utf-8"],
  "/sky.js": ["public/sky.js", "text/javascript; charset=utf-8"],
  "/favicon.svg": ["public/favicon.svg", "image/svg+xml"],
};

const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
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
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed", "text/plain; charset=utf-8", { Allow: "GET, HEAD" });

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
