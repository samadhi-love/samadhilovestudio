"use client";

import { useState } from "react";
import { membershipNoticeVersion } from "../billing/config-data";
import type { Plan } from "../credits/data";
import { HelpField } from "../help-tip";

export function RegisterCreator({ plan = "free", memberFlow = false }: { plan?: Plan; memberFlow?: boolean }) {
  const [name, setName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false), [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <form onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/studio/creator", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, plan, membershipAcknowledged: acknowledged, adult, noticeVersion: membershipNoticeVersion }),
      });
      const result = await response.json().catch(() => null) as { registered?: boolean; error?: string } | null;
      if (!response.ok || !result?.registered) throw new Error(result?.error ?? "Creator registration is temporarily unavailable.");
      if (memberFlow) window.location.assign("/members?plan=" + plan); else window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Creator registration failed.");
      setBusy(false);
    }
  }}>
    <HelpField label="Display name" tip="This name appears inside your private creator workspace."><input maxLength={60} required value={name} onChange={event => setName(event.target.value)}/></HelpField>
    <label className="member-check"><input type="checkbox" checked={adult} onChange={event => setAdult(event.target.checked)}/> I am at least 18 years old.</label>
    <label className="member-check"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/> I have read the <a href="/membership-notice" target="_blank" rel="noreferrer">membership, privacy and music-rights notice</a>. Creating this workspace does not buy a subscription.</label>
    <button className="primary" disabled={busy || !name.trim() || !adult || !acknowledged}>{busy ? "Creating workspace…" : "Create private workspace"}</button>
    {error && <p className="notice" role="alert">{error}</p>}
  </form>;
}
