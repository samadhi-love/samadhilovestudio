/**
 * Listens to the spoken consent clip and checks the person really said the
 * consent sentence shown on screen. Speech-to-text: ElevenLabs Scribe first
 * (the owner's own key), fal Whisper as the backup. One request each, never
 * retried automatically.
 */
import { providerRequest } from "./ai-provider";
import { FalSyncFailed, transcribeWithFal } from "./fal-transcribe";

const numberWords: Record<string, string> = { "18": "eighteen", "18th": "eighteen" };
/** Lowercase words without punctuation; numbers said as words count the same. */
export function consentWords(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean).map(w => numberWords[w] ?? w);
}
function lcs(a: string[], b: string[]) {
  const row = new Array(b.length + 1).fill(0);
  for (const word of a) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) { const keep = row[j]; row[j] = word === b[j - 1] ? prev + 1 : Math.max(row[j], row[j - 1]); prev = keep; }
  }
  return row[b.length];
}
export type ConsentResult = { matched: boolean; score: number; missing: string[] };
/**
 * True when the heard words follow the consent sentence closely. Names are hard
 * for speech-to-text, so the person's name is not required to be spelled
 * right; the promise itself ("my own voice", "18 or older", "I agree") is.
 */
export function consentMatches(heard: string, expected: string): ConsentResult {
  const said = consentWords(heard), want = consentWords(expected);
  const score = want.length ? lcs(said, want) / want.length : 0;
  const text = ` ${said.join(" ")} `;
  const needed: [string, RegExp][] = [["my own voice", / own voice /], ["18 or older", / eighteen (or|and) (older|over) /], ["I agree", / agree /]];
  const missing = needed.filter(([, re]) => !re.test(text)).map(([label]) => label);
  // "I don't agree" is not consent.
  if (/ (not|dont|never|do not) agree /.test(text) && !missing.includes("I agree")) missing.push("I agree");
  return { matched: score >= 0.75 && !missing.length, score: Math.round(score * 100) / 100, missing };
}

export type HeardConsent = { text: string; engine: "ElevenLabs Scribe" | "fal Whisper" } | { unavailable: string };
type Keys = { elevenLabs?: string | null; fal?: string };
/** Speech-to-text for a short consent clip already in memory (max 4 MB). */
export async function hearConsent(bytes: Uint8Array, mime: string, keys: Keys, request: { eleven?: typeof providerRequest; fal?: typeof transcribeWithFal } = {}): Promise<HeardConsent> {
  const reasons: string[] = [];
  if (keys.elevenLabs) {
    try {
      const form = new FormData();
      form.set("model_id", "scribe_v2");
      form.set("file", new Blob([new Uint8Array(bytes)], { type: mime }), "consent");
      const response = await (request.eleven ?? providerRequest)(keys.elevenLabs, "speech-to-text", { method: "POST", body: form, signal: AbortSignal.timeout(45_000) });
      if (response.ok) {
        const result = await response.json() as { text?: unknown };
        if (typeof result.text === "string") return { text: result.text, engine: "ElevenLabs Scribe" };
        reasons.push("elevenlabs-no-text");
      } else reasons.push(`elevenlabs-http-${response.status}`);
    } catch { reasons.push("elevenlabs-network"); }
  }
  if (keys.fal) {
    try {
      let binary = ""; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const heard = await (request.fal ?? transcribeWithFal)(keys.fal, `data:${mime};base64,${btoa(binary)}`, undefined, undefined, 60_000);
      return { text: heard.text, engine: "fal Whisper" };
    } catch (error) {
      // "No words heard" is a real answer: the clip had no speech in it.
      if (error instanceof FalSyncFailed && error.reason === "no-words") return { text: "", engine: "fal Whisper" };
      reasons.push(error instanceof FalSyncFailed ? `fal-${error.reason}` : "fal-error");
    }
  }
  return { unavailable: reasons.join(",") || "no-service" };
}
