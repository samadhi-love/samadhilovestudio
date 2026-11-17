import { env } from "cloudflare:workers";
import type { ElevenLabsSettings } from "../../../elevenlabs-settings-data";

type Check = Pick<ElevenLabsSettings, "connection" | "musicAccess" | "checkedAt" | "accountMessage" | "musicMessage" | "error" | "capabilities">;

const encoder = new TextEncoder();
const maxKeyLength = 200;
const ivLength = 12;
const tagLength = 16;

function storageKey(ownerId: string) {
  return `private/elevenlabs/v1/${encodeURIComponent(ownerId)}`;
}

export function validElevenLabsKey(value: unknown) {
  return typeof value === "string" && value.length <= maxKeyLength && /^[!-~]+$/.test(value);
}

function encryptionSecret() {
  // Preserve the canonical key whenever present, even if misconfigured.
  // Never silently rotate to the setup alias when an existing key is invalid.
  const secret = env.STUDIO_ELEVENLABS_VAULT_KEY ?? env.vault;
  return secret && /^[a-f0-9]{64}$/i.test(secret) ? secret : null;
}

async function importKey(secret: string) {
  const bytes = Uint8Array.from(secret.match(/.{2}/g) ?? [], byte => parseInt(byte, 16));
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function parameters(ownerId: string, iv: Uint8Array<ArrayBuffer>) {
  return { name: "AES-GCM", iv, additionalData: encoder.encode(storageKey(ownerId)) };
}

export async function keyStatus(ownerId: string) {
  const bucket = env.BUCKET;
  const record = bucket ? await bucket.head(storageKey(ownerId)) : null;
  const disconnected = record?.customMetadata?.disconnected === "1";
  const metadata = record?.customMetadata;
  const available = !!(bucket && encryptionSecret());
  const status: ElevenLabsSettings = {
    available,
    saved: !!record && !disconnected,
    defaultProvider: metadata?.defaultProvider === "elevenlabs",
    connection: record && !disconnected ? metadata?.connection === "connected" ? "connected"
      : metadata?.connection === "error" ? "error" : "unchecked" : "disconnected",
    musicAccess: metadata?.musicAccess === "available" || metadata?.musicAccess === "unavailable"
      ? metadata.musicAccess : "unknown",
    checkedAt: metadata?.checkedAt,
    accountMessage: metadata?.accountMessage,
    musicMessage: metadata?.musicMessage,
    error: metadata?.error,
  };
  if (metadata?.capabilities) {
    try { status.capabilities = JSON.parse(metadata.capabilities); } catch { /* Older connection metadata has no capability report. */ }
  }
  if (record && !available) {
    status.connection = "error";
    status.musicAccess = "unknown";
    status.error = "The secure credential store is unavailable. Try again later.";
  }
  return { status, etag: record?.etag };
}

export async function saveElevenLabsKey(ownerId: string, value: string, check: Check, defaultProvider: boolean, etag?: string) {
  const bucket = env.BUCKET;
  const secret = encryptionSecret();
  if (!bucket || !secret) return false;
  const iv = crypto.getRandomValues(new Uint8Array(ivLength));
  const encrypted = await crypto.subtle.encrypt(parameters(ownerId, iv), await importKey(secret), encoder.encode(value));
  const record = new Uint8Array(iv.byteLength + encrypted.byteLength);
  record.set(iv);
  record.set(new Uint8Array(encrypted), ivLength);
  const result = await bucket.put(storageKey(ownerId), record, {
    onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: "*" },
    customMetadata: {
      connection: check.connection,
      musicAccess: check.musicAccess,
      defaultProvider: defaultProvider ? "elevenlabs" : "",
      ...(check.checkedAt && { checkedAt: check.checkedAt }),
      ...(check.accountMessage && { accountMessage: check.accountMessage }),
      ...(check.musicMessage && { musicMessage: check.musicMessage }),
      ...(check.error && { error: check.error }),
      ...(check.capabilities && { capabilities: JSON.stringify(check.capabilities) }),
    },
  });
  return !!result;
}

export async function removeElevenLabsKey(ownerId: string, rememberDisconnect = false) {
  const bucket = env.BUCKET;
  if (!bucket) return false;
  if (rememberDisconnect) {
    // A non-secret marker prevents first-load owner setup from reconnecting a
    // deliberately disconnected project key. A manual reconnect can replace it.
    await bucket.put(storageKey(ownerId), new Uint8Array(), { customMetadata: { disconnected: "1" } });
  } else await bucket.delete(storageKey(ownerId));
  return true;
}

export async function resolveElevenLabsKey(ownerId: string) {
  const bucket = env.BUCKET;
  const secret = encryptionSecret();
  if (!bucket || !secret) return null;
  const record = await bucket.get(storageKey(ownerId));
  if (!record) return null;
  if (record.customMetadata?.disconnected === "1") return null;
  if (record.size <= ivLength + tagLength || record.size > ivLength + tagLength + maxKeyLength)
    throw new Error("Invalid stored ElevenLabs key.");
  const bytes = new Uint8Array(await record.arrayBuffer());
  const decrypted = await crypto.subtle.decrypt(
    parameters(ownerId, bytes.subarray(0, ivLength)), await importKey(secret), bytes.subarray(ivLength),
  );
  const value = new TextDecoder().decode(decrypted);
  return validElevenLabsKey(value) ? value : null;
}
