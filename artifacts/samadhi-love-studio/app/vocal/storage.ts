import type { Session } from "./session";

export type SessionSummary = { id: string; name: string; updated: string };
export const sessionUrl = (session?: string, source?: string) => "/api/studio/vocal" +
  (session ? "?session=" + session : "") + (source ? "&source=" + source : "");

export async function sessionRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json<{ error?: string }>().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error ?? "The session could not sync. Try again.");
  return data as T;
}

export async function writeSession(session: Session, revision: string | undefined, pending: Map<string, Blob>) {
  for (const source of session.sources) {
    const blob = pending.get(source.id);
    if (!blob) continue;
    await sessionRequest(sessionUrl(session.id, source.id), { method: "PUT", headers: { "X-Audio-Size": String(blob.size) }, body: blob });
  }
  const result = await sessionRequest<{ revision: string }>(sessionUrl(session.id), {
    method: "PUT", headers: { "Content-Type": "application/json", ...(revision && { "If-Match": revision }) },
    body: JSON.stringify(session),
  });
  session.sources.forEach(source => pending.delete(source.id));
  return result.revision;
}

export async function allSessions() {
  const sessions: SessionSummary[] = []; let cursor: string | null = null;
  const seen = new Set<string>();
  do {
    const page: { sessions: SessionSummary[]; next?: string | null } = await sessionRequest(sessionUrl() + (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""));
    sessions.push(...page.sessions);
    cursor = typeof page.next === "string" ? page.next : null;
    if (cursor && seen.has(cursor)) throw new Error("Session listing stopped. Reload to try again.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return sessions.sort((a, b) => b.updated.localeCompare(a.updated));
}
