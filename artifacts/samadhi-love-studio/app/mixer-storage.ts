import { sessionRequest, type SessionSummary } from "./vocal/storage";
import type { MixerSession } from "./mixer-session";
export const mixerUrl = (id?: string, source?: string) => "/api/studio/mixer" + (id ? `?session=${encodeURIComponent(id)}` : "") + (source ? `&source=${encodeURIComponent(source)}` : "");
export async function listMixerSessions() {
  const result: SessionSummary[] = []; const seen = new Set<string>(); let cursor: string | null = null;
  do {
    const page: { sessions: SessionSummary[]; next?: string } = await sessionRequest(mixerUrl() + (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""));
    result.push(...page.sessions); cursor = page.next ?? null;
    if (cursor && seen.has(cursor)) throw new Error("Mixer session listing stopped. Try again.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return result;
}
export async function saveMixerSession(session: MixerSession, tracks: Map<string, Blob>, revision?: string, uploaded = new Set<string>()) {
  for (const track of session.tracks) {
    if (uploaded.has(track.id)) continue;
    const blob = tracks.get(track.id); if (!blob) throw new Error("An original track is missing. Keep this tab open.");
    await sessionRequest(mixerUrl(session.id, track.id), { method: "PUT", headers: { "X-Audio-Size": String(blob.size) }, body: blob });
    uploaded.add(track.id);
  }
  return sessionRequest<{ revision: string }>(mixerUrl(session.id), { method: "PUT", headers: { "Content-Type": "application/json", ...(revision ? { "If-Match": revision } : {}) }, body: JSON.stringify(session) });
}
