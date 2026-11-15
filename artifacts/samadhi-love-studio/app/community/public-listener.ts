import { env } from "cloudflare:workers";
const name = "samadhi_listener";
const lifetime = 30 * 86400;
let signingKey: Promise<CryptoKey> | undefined;
const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
async function key() {
  if (!signingKey) signingKey = (async () => {
    if (!env.BUCKET) throw new Error("Listener storage unavailable.");
    const storage = "community-internal/listener-key.json";
    let stored = await env.BUCKET.get(storage);
    if (!stored) {
      await env.BUCKET.put(storage, JSON.stringify({ secret: hex(crypto.getRandomValues(new Uint8Array(32))) }), { onlyIf: { etagDoesNotMatch: "*" } });
      stored = await env.BUCKET.get(storage);
    }
    if (!stored) throw new Error("Listener storage unavailable.");
    const { secret } = await stored.json<{ secret: string }>();
    return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  })().catch(error => { signingKey = undefined; throw error; });
  return signingKey;
}
export async function publicListener(request: Request, create = false): Promise<{ viewer: string | null; cookie?: string }> {
  const raw = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(name + "="))?.slice(name.length + 1);
  if (raw && /^[a-f0-9]{32}\.[0-9]{10}\.[a-f0-9]{64}$/.test(raw)) {
    const [id, expires, signature] = raw.split(".");
    const expiration = Number(expires);
    if (expiration > Date.now() / 1000 && expiration <= Date.now() / 1000 + lifetime + 60) {
      const bytes = new Uint8Array(signature.match(/../g)!.map(pair => parseInt(pair, 16)));
      if (await crypto.subtle.verify("HMAC", await key(), bytes, new TextEncoder().encode(id + "." + expires))) return { viewer: "guest_" + id };
    }
  }
  if (!create) return { viewer: null };
  const id = hex(crypto.getRandomValues(new Uint8Array(16))), expires = Math.floor(Date.now() / 1000) + lifetime;
  const payload = id + "." + expires;
  const signature = hex(new Uint8Array(await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(payload))));
  return { viewer: "guest_" + id, cookie: `${name}=${payload}.${signature}; Path=/api/community; Max-Age=${lifetime}; HttpOnly; Secure; SameSite=Lax` };
}
