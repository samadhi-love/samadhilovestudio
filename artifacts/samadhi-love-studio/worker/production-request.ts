type GatewayEnv = {
  STUDIO_PUBLIC_ORIGIN?: string;
  STUDIO_WORKER_PROXY_KEY?: string;
};

function unavailable() {
  return new Response("Studio production connection is not configured.", {
    status: 503, headers: { "Cache-Control": "no-store" },
  });
}

export async function productionRequest(request: Request, env: GatewayEnv): Promise<Request | Response> {
  let origin: URL;
  try { origin = new URL(env.STUDIO_PUBLIC_ORIGIN ?? ""); } catch { return unavailable(); }
  if (origin.protocol !== "https:" || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash ||
      !env.STUDIO_WORKER_PROXY_KEY || env.STUDIO_WORKER_PROXY_KEY.length < 32) return unavailable();
  const supplied = request.headers.get("x-studio-gateway-key");
  if (!supplied || supplied.length > 4096) return new Response("Forbidden.", { status: 403 });
  const digest = (value: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const [left, right] = await Promise.all([digest(supplied), digest(env.STUDIO_WORKER_PROXY_KEY)]);
  const a = new Uint8Array(left), b = new Uint8Array(right);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  if (mismatch) return new Response("Forbidden.", { status: 403 });
  const source = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.delete("x-studio-gateway-key");
  headers.delete("host");
  headers.set("x-forwarded-host", origin.host);
  headers.set("x-forwarded-proto", "https");
  // Restore the browser-facing origin for origin checks and generated URLs.
  // The target comes only from operator configuration, never a caller header.
  return new Request(origin.origin + source.pathname + source.search, new Request(request, { headers }));
}
