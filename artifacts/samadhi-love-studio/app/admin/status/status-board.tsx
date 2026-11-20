"use client";
import { useEffect, useState } from "react";
import type { OwnerStatus } from "../../server/owner-status";

const seconds = (ms: number | null) => ms === null ? "—" : ms < 1000 ? `${ms} ms` : ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${(ms / 60_000).toFixed(1)} min`;
const show = (kind: string, value: number | null) => value === null ? "No data yet" :
  kind === "songSpeed" ? seconds(value) : kind === "serverErrors" ? String(value) : `${Math.round(value * 100)}%`;
const when = (iso: string) => new Date(iso).toLocaleString();
const jobName: Record<string, string> = { "music-generation": "Song creation", "lyric-sync": "Caption sync", "video-render": "Video render" };
const statusName: Record<string, string> = { done: "finished", failed: "failed", working: "in progress", waiting: "waiting" };

export function StatusBoard() {
  const [status, setStatus] = useState<OwnerStatus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/studio/admin/status", { cache: "no-store" });
      const body = await response.json() as OwnerStatus & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Status could not load.");
      setStatus(body);
    } catch (e) { setError((e as Error).message || "Status could not load."); }
    finally { setBusy(false); }
  }
  async function setUpHistory() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/studio/admin/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setup-history" }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "History could not be set up.");
    } catch (e) { setError((e as Error).message || "History could not be set up."); }
    finally { setBusy(false); }
    await load();
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the status once when the page opens
  useEffect(() => { void load(); }, []);
  if (!status) return <section className="section" aria-live="polite">{error ? <><p role="alert">{error}</p><button type="button" onClick={() => void load()}>Try again</button></> : <p>Loading status…</p>}</section>;
  const healthy = status.health.status === "ok";
  return <>
    <section className="section" data-testid="status-health">
      <h2>{healthy ? "✓ The app is up" : "⚠ Something is down"}</h2>
      <p>Database: {status.health.checks.database === "ok" ? "working" : "not answering"} · File storage: {status.health.checks.storage === "ok" ? "working" : "not answering"}</p>
      <p className="muted">Checked {when(status.at)}. <button type="button" disabled={busy} onClick={() => void load()} data-testid="button-refresh-status">{busy ? "Refreshing…" : "Refresh"}</button></p>
      {error && <p role="alert">{error}</p>}
    </section>
    {!status.historyReady && <section className="section" data-testid="status-history-setup">
      <h2>Turn on 30-day history</h2>
      <p>Song results work now. To also see AI requests, caption success, errors and owner actions, the app needs one small history table. Setting it up adds that table only — it does not change or delete anything. Old entries are removed after 30 days.</p>
      <button type="button" className="primary" disabled={busy} onClick={() => void setUpHistory()} data-testid="button-setup-history">Set up history</button>
    </section>}
    <section className="section" data-testid="status-targets"><h2>Targets · last 24 hours</h2>
      <table><thead><tr><th>Target</th><th>Goal</th><th>Now</th><th>Result</th></tr></thead><tbody>
        {status.targets.map(t => <tr key={t.kind} data-testid={`target-${t.kind}`} data-met={t.met === null ? "unknown" : String(t.met)}>
          <td>{t.label}</td><td>{t.goal}</td><td>{show(t.kind, t.value)}{t.sample ? <span className="muted"> ({t.sample})</span> : null}</td>
          <td>{t.met === null ? "—" : t.met ? "✓ on target" : "✗ below target"}</td></tr>)}
      </tbody></table>
    </section>
    <section className="section" data-testid="status-jobs"><h2>Background work · last 24 hours</h2>
      {status.jobs.length ? <ul>{status.jobs.map(j => <li key={j.type + j.status}>{jobName[j.type] ?? j.type}: {j.count} {statusName[j.status] ?? j.status}{j.averageMs !== null && j.status === "done" ? ` · about ${seconds(j.averageMs)} each` : ""}</li>)}</ul> : <p>No songs or caption jobs in the last 24 hours.</p>}
    </section>
    {status.historyReady && <>
      <section className="section" data-testid="status-ai"><h2>AI requests · last 24 hours</h2>
        {status.ai.length ? <ul>{status.ai.map(a => <li key={a.provider + a.step}>{a.provider} · {a.step}: {a.ok} of {a.calls} accepted · about {seconds(a.averageMs)}</li>)}</ul> : <p>No AI requests recorded yet.</p>}
      </section>
      <section className="section" data-testid="status-errors"><h2>Recent errors</h2>
        {status.errors.length ? <ul>{status.errors.map((e, i) => <li key={i}><strong>{when(e.at)}</strong> · {e.event}{e.status ? ` (${e.status})` : ""}{e.route ? ` · ${e.route}` : ""}{typeof e.detail.reason === "string" ? ` · ${e.detail.reason}` : ""}{e.requestId ? <span className="muted"> · ref {e.requestId.slice(0, 8)}</span> : null}</li>)}</ul> : <p>No errors recorded. 🎉</p>}
      </section>
      <section className="section" data-testid="status-actions"><h2>Owner & account actions</h2>
        {status.actions.length ? <ul>{status.actions.map((a, i) => <li key={i}><strong>{when(a.at)}</strong> · {a.action}{Object.keys(a.detail).length ? ` · ${Object.entries(a.detail).map(([k, v]) => `${k}: ${String(v)}`).join(", ")}` : ""}{a.requestId ? <span className="muted"> · ref {a.requestId.slice(0, 8)}</span> : null}</li>)}</ul> : <p>No actions recorded yet.</p>}
      </section>
    </>}
  </>;
}
