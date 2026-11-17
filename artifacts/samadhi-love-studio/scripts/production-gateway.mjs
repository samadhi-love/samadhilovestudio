import { createServer } from "node:http";
import { Readable } from "node:stream";

const hopByHop = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade",
]);

export function httpsOrigin(value, name) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${name} must be an HTTPS origin.`); }
  if (url.protocol !== "https:" || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${name} must be an HTTPS origin without a path or credentials.`);
  }
  return url.origin;
}

export function gatewayConfig(source = process.env) {
  const workerOrigin = httpsOrigin(source.STUDIO_WORKER_ORIGIN, "STUDIO_WORKER_ORIGIN");
  const publicOrigin = httpsOrigin(source.STUDIO_PUBLIC_ORIGIN, "STUDIO_PUBLIC_ORIGIN");
  if (workerOrigin === publicOrigin) throw new Error("The Worker and public origins must differ to prevent a forwarding loop.");
  const key = source.STUDIO_WORKER_PROXY_KEY;
  if (typeof key !== "string" || key.length < 32 || /[\r\n]/.test(key)) {
    throw new Error("STUDIO_WORKER_PROXY_KEY must be configured securely on both services (at least 32 characters).");
  }
  const port = Number(source.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid allocated service port.");
  return { workerOrigin, publicOrigin, key, port };
}

// Test callers may inject a local transport. The production entrypoint always
// uses gatewayConfig(), HTTPS origins, and the real fetch implementation.
export function createGateway(config, transport = fetch) {
  return createServer(async (incoming, outgoing) => {
    if (!incoming.url?.startsWith("/") || incoming.url.startsWith("//")) {
      outgoing.writeHead(400).end("Invalid request target.");
      return;
    }
    if (incoming.headers.upgrade) {
      outgoing.writeHead(426).end("WebSocket upgrades are not supported.");
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000);
    timeout.unref();
    incoming.once("aborted", () => controller.abort());
    outgoing.once("close", () => {
      if (!outgoing.writableFinished) controller.abort();
    });
    try {
      // Concatenate only an origin-form target: never resolve //host or an
      // absolute user-supplied URL into an outbound destination.
      const url = config.workerOrigin + incoming.url;
      const headers = new Headers();
      const connectionHeaders = String(incoming.headers.connection ?? "").toLowerCase().split(",").map(x => x.trim());
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (value === undefined || hopByHop.has(name) || connectionHeaders.includes(name) ||
            name === "host" || name === "content-length" || name === "forwarded" || name === "x-real-ip" ||
            name.startsWith("x-forwarded-") || name.startsWith("cf-") ||
            name === "x-studio-gateway-key") continue;
        for (const item of Array.isArray(value) ? value : [value]) headers.append(name, item);
      }
      headers.set("x-studio-gateway-key", config.key);
      headers.set("accept-encoding", "identity");
      const hasBody = incoming.method !== "GET" && incoming.method !== "HEAD";
      const response = await transport(url, {
        method: incoming.method,
        headers,
        ...(hasBody ? { body: Readable.toWeb(incoming), duplex: "half" } : {}),
        redirect: "manual",
        signal: controller.signal,
      });
      const responseConnection = (response.headers.get("connection") ?? "").toLowerCase().split(",").map(x => x.trim());
      for (const [name, value] of response.headers) {
        // fetch decodes compressed bodies. Do not forward stale encoding/length
        // headers, hop-by-hop headers, or a sensitive transport header.
        if (hopByHop.has(name) || responseConnection.includes(name) ||
            ["set-cookie", "content-length", "content-encoding", "x-studio-gateway-key"].includes(name)) continue;
        let result = value;
        if (name === "location") {
          try {
            const location = new URL(value, config.workerOrigin);
            if (location.origin === config.workerOrigin) result = config.publicOrigin + location.pathname + location.search + location.hash;
          } catch { /* Preserve ordinary relative redirects. */ }
        }
        outgoing.setHeader(name, result);
      }
      const cookies = response.headers.getSetCookie();
      if (cookies.length) outgoing.setHeader("set-cookie", cookies);
      outgoing.writeHead(response.status);
      if (!response.body || incoming.method === "HEAD") {
        outgoing.end();
      } else {
        await new Promise((resolve, reject) => {
          const body = Readable.fromWeb(response.body);
          body.on("error", reject);
          outgoing.once("finish", resolve);
          outgoing.once("close", () => { body.destroy(); resolve(); });
          body.pipe(outgoing);
        });
      }
    } catch {
      if (!outgoing.headersSent) {
        outgoing.writeHead(502, { "content-type": "application/json", "cache-control": "no-store" });
        outgoing.end(JSON.stringify({ error: "Studio backend is unavailable. Please try again; do not repeat a generation until you check your saved songs." }));
      } else {
        outgoing.destroy();
      }
    } finally {
      clearTimeout(timeout);
    }
  });
}
