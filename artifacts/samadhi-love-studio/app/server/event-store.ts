/**
 * Event history: keeps the important log events (job outcomes, AI calls, caption
 * results, errors, owner actions) in D1 so they survive restarts and feed the
 * owner Status page. Kept for 30 days, then trimmed.
 *
 * The table is created only when the owner taps "Set up history" (startup never
 * creates tables). Until then, and whenever storage fails, recording is skipped
 * silently: history must never break or slow down the app.
 */
import { serverStorage as env } from "./storage";
import { setEventHistory } from "./request-context";

export const EVENTS_TABLE_SQL = [
  `CREATE TABLE IF NOT EXISTS studio_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 at INTEGER NOT NULL,
 event TEXT NOT NULL,
 level TEXT NOT NULL,
 ok INTEGER,
 status INTEGER,
 ms INTEGER,
 request_id TEXT,
 job_id TEXT,
 route TEXT,
 actor TEXT,
 detail TEXT NOT NULL DEFAULT '{}'
)`,
  "CREATE INDEX IF NOT EXISTS studio_events_event_at ON studio_events(event,at)",
  "CREATE INDEX IF NOT EXISTS studio_events_at ON studio_events(at)",
];
export const KEEP_DAYS = 30;

/** Events worth keeping; ordinary successful page/API requests stay in the plain logs only. */
export function persisted(entry: Record<string, unknown>) {
  const event = String(entry.event ?? "");
  return /^(job\.(done|failed|unconfirmed)|provider\.call|caption\.sync|lyric-sync\.(problem|crash)|api\.failure|client\.crash|owner\.action)$/.test(event)
    || event === "api.request" && Number(entry.status) >= 500;
}

const core = new Set(["level", "event", "at", "requestId", "jobId", "route", "ok", "status", "ms", "actor"]);
let writes = 0;

export async function recordEvent(entry: Record<string, unknown>) {
  const DB = env.DB;
  if (!DB || !persisted(entry)) return false;
  const detail: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry))
    if (!core.has(key) && value !== undefined && ["string", "number", "boolean"].includes(typeof value))
      detail[key] = typeof value === "string" ? value.slice(0, 200) : value;
  const text = (value: unknown, max = 100) => typeof value === "string" ? value.slice(0, max) : null;
  const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null;
  try {
    await DB.prepare(`INSERT INTO studio_events(at,event,level,ok,status,ms,request_id,job_id,route,actor,detail)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(
      Date.parse(String(entry.at)) || Date.now(), text(entry.event, 60), entry.level === "error" ? "error" : "info",
      typeof entry.ok === "boolean" ? (entry.ok ? 1 : 0) : null, number(entry.status), number(entry.ms),
      text(entry.requestId, 64), text(entry.jobId, 64), text(entry.route, 120), text(entry.actor, 120),
      JSON.stringify(detail).slice(0, 1000)).run();
    // Trim old history now and then (never on every write).
    if (++writes % 50 === 1)
      await DB.prepare("DELETE FROM studio_events WHERE at < ?").bind(Date.now() - KEEP_DAYS * 86_400_000).run();
    return true;
  } catch {
    return false; // Table not set up yet, or storage busy: plain logs still have it.
  }
}

/** Owner-approved, one-time, additive setup. Safe to run again. */
export async function setUpEventHistory() {
  const DB = env.DB;
  if (!DB) throw new Error("The database is unavailable.");
  for (const sql of EVENTS_TABLE_SQL) await DB.prepare(sql).run();
}

export async function eventHistoryReady() {
  try {
    return !!await env.DB?.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='studio_events'").first();
  } catch { return false; }
}

// Receive important events from the logger (see logEvent in request-context.ts).
setEventHistory(recordEvent);
