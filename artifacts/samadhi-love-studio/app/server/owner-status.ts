/**
 * Owner Status: one read-only summary of the last 24 hours built from data the app
 * already keeps (studio_jobs) plus the 30-day event history (studio_events).
 * Every query is bounded; nothing here calls an AI provider or changes data.
 */
import { serverStorage as env } from "./storage";
import { checkHealth } from "./health";
import { eventHistoryReady } from "./event-store";

/** The app's targets (SLOs). Plain sentences so the owner can read them as-is. */
export const targets = {
  songSuccess: { label: "Songs finish successfully", goal: 0.95, goalText: "95% or more" },
  songSpeed: { label: "Songs ready within 3 minutes (9 out of 10)", goal: 180_000, goalText: "3 minutes or less" },
  captionPrecise: { label: "Captions matched to the voice (not rough timing)", goal: 0.9, goalText: "90% or more" },
  aiSuccess: { label: "AI requests accepted", goal: 0.95, goalText: "95% or more" },
  serverErrors: { label: "Errors recorded today (server, AI and app crashes)", goal: 5, goalText: "5 or fewer" },
} as const;

type Row = Record<string, unknown>;
const num = (value: unknown) => typeof value === "number" ? value : Number(value ?? 0) || 0;
const parse = (text: unknown) => { try { return JSON.parse(String(text ?? "{}")) as Record<string, unknown>; } catch { return {}; } };

export function percentile(values: number[], p: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
}

export function judge(kind: keyof typeof targets, value: number | null) {
  if (value === null) return null;
  return kind === "songSpeed" || kind === "serverErrors" ? value <= targets[kind].goal : value >= targets[kind].goal;
}

export async function ownerStatus(now = Date.now()) {
  const DB = env.DB;
  const since = now - 86_400_000;
  const health = await checkHealth(env);
  if (!DB) return { at: new Date(now).toISOString(), health, historyReady: false, jobs: [], targets: [], ai: [], errors: [], actions: [], errorCount: null };
  const all = async (sql: string, ...values: unknown[]) => (await DB.prepare(sql).bind(...values).all<Row>()).results ?? [];

  const jobs = (await all(`SELECT type, status, COUNT(*) AS n,
      AVG(CASE WHEN finished_at IS NOT NULL AND started_at IS NOT NULL THEN finished_at - started_at END) AS avg_ms
    FROM studio_jobs WHERE created_at >= ? GROUP BY type, status`, since))
    .map(r => ({ type: String(r.type), status: String(r.status), count: num(r.n), averageMs: r.avg_ms === null ? null : Math.round(num(r.avg_ms)) }));
  const songs = jobs.filter(j => j.type === "music-generation");
  const songDone = songs.filter(j => j.status === "done").reduce((s, j) => s + j.count, 0);
  const songEnded = songs.filter(j => j.status === "done" || j.status === "failed").reduce((s, j) => s + j.count, 0);
  const durations = (await all(`SELECT finished_at - started_at AS ms FROM studio_jobs
    WHERE type = 'music-generation' AND status = 'done' AND created_at >= ? AND started_at IS NOT NULL AND finished_at IS NOT NULL
    ORDER BY created_at DESC LIMIT 500`, since)).map(r => num(r.ms));

  const historyReady = await eventHistoryReady();
  let ai: { provider: string; step: string; calls: number; ok: number; averageMs: number | null }[] = [];
  let captionOk = 0, captionFailed = 0, errorCount: number | null = null;
  let errors: { at: string; event: string; status: number | null; route: string | null; requestId: string | null; detail: Record<string, unknown> }[] = [];
  let actions: { at: string; action: string; actor: string | null; requestId: string | null; detail: Record<string, unknown> }[] = [];
  if (historyReady) {
    ai = (await all(`SELECT json_extract(detail, '$.provider') AS provider, json_extract(detail, '$.step') AS step,
        COUNT(*) AS n, SUM(CASE WHEN ok = 1 THEN 1 ELSE 0 END) AS ok_n, AVG(ms) AS avg_ms
      FROM studio_events WHERE event = 'provider.call' AND at >= ? GROUP BY provider, step ORDER BY n DESC LIMIT 20`, since))
      .map(r => ({ provider: String(r.provider ?? "?"), step: String(r.step ?? "?"), calls: num(r.n), ok: num(r.ok_n), averageMs: r.avg_ms === null ? null : Math.round(num(r.avg_ms)) }));
    const captions = (await all(`SELECT
        SUM(CASE WHEN event = 'caption.sync' THEN 1 ELSE 0 END) AS ok_n,
        SUM(CASE WHEN event = 'lyric-sync.crash' OR (event = 'lyric-sync.problem' AND status IN (422, 429, 502, 503)) THEN 1 ELSE 0 END) AS failed_n
      FROM studio_events WHERE at >= ? AND event IN ('caption.sync', 'lyric-sync.problem', 'lyric-sync.crash')`, since))[0] ?? {};
    captionOk = num(captions.ok_n); captionFailed = num(captions.failed_n);
    errorCount = num((await all("SELECT COUNT(*) AS n FROM studio_events WHERE level = 'error' AND at >= ?", since))[0]?.n);
    errors = (await all(`SELECT at, event, status, route, request_id, detail FROM studio_events
      WHERE level = 'error' ORDER BY at DESC LIMIT 20`))
      .map(r => ({ at: new Date(num(r.at)).toISOString(), event: String(r.event), status: r.status === null ? null : num(r.status), route: r.route === null ? null : String(r.route), requestId: r.request_id === null ? null : String(r.request_id), detail: parse(r.detail) }));
    actions = (await all(`SELECT at, actor, request_id, detail FROM studio_events
      WHERE event = 'owner.action' ORDER BY at DESC LIMIT 20`))
      .map(r => { const detail = parse(r.detail); const { action, ...rest } = detail;
        return { at: new Date(num(r.at)).toISOString(), action: String(action ?? "?"), actor: r.actor === null ? null : String(r.actor), requestId: r.request_id === null ? null : String(r.request_id), detail: rest }; });
  }
  const aiCalls = ai.reduce((s, a) => s + a.calls, 0), aiOk = ai.reduce((s, a) => s + a.ok, 0);
  const measured = {
    songSuccess: songEnded ? songDone / songEnded : null,
    songSpeed: percentile(durations, 0.9),
    captionPrecise: historyReady && captionOk + captionFailed ? captionOk / (captionOk + captionFailed) : null,
    aiSuccess: historyReady && aiCalls ? aiOk / aiCalls : null,
    serverErrors: errorCount,
  };
  return {
    at: new Date(now).toISOString(), health, historyReady, jobs, ai, errors, actions, errorCount,
    targets: (Object.keys(targets) as (keyof typeof targets)[]).map(kind => ({
      kind, label: targets[kind].label, goal: targets[kind].goalText, value: measured[kind], met: judge(kind, measured[kind]),
      sample: kind === "songSuccess" ? songEnded : kind === "songSpeed" ? durations.length : kind === "captionPrecise" ? captionOk + captionFailed : kind === "aiSuccess" ? aiCalls : null,
    })),
  };
}
export type OwnerStatus = Awaited<ReturnType<typeof ownerStatus>>;
