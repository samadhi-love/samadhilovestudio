"use client";

import { useState } from "react";
import { HelpField } from "../help-tip";

export function AccountRow({ account }: { account: { id: string; displayName: string; limit: number; suspended: boolean; attempts: number } }) {
  const [limit, setLimit] = useState(String(account.limit));
  const [suspended, setSuspended] = useState(account.suspended);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="section" onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/studio/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: account.id, limit: Number(limit), suspended }) });
      const result = await response.json().catch(() => null) as { saved?: boolean; error?: string } | null;
      if (!response.ok || !result?.saved) throw new Error(result?.error ?? "Could not save this account.");
      setNotice("Account settings saved.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save this account."); }
    finally { setBusy(false); }
  }}><h2>{account.displayName}</h2><p className="muted">{account.attempts} generation attempts today (UTC)</p>
    <HelpField label="Daily generation attempt limit" tip="Set 0 to pause provider generation. Browser instruments are still available."><input type="number" min="0" max="100" required value={limit} onChange={event => setLimit(event.target.value)}/></HelpField>
    <label className="music-inline"><input type="checkbox" checked={suspended} onChange={event => setSuspended(event.target.checked)}/> Suspend access to the creator workspace</label>
    <button className="secondary small" disabled={busy}>Save account settings</button>
    {notice && <p role="status">{notice}</p>}
  </form>;
}
