"use client";
import { useState } from "react";
export function ClaimOwner({ blocked, storageAvailable }: { blocked: boolean; storageAvailable: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <main className="listener-shell"><section className="listener-hero">
    <p className="eyebrow">ONE-TIME OWNER SETUP</p>
    <h1>Claim your private Studio</h1>
    <p>Your verified sign-in email matches the owner email set in this project’s Secrets.
      Press Claim owner to link owner access to this signed-in account. This does not publish anything, start billing or generate music.</p>
    {blocked ? <p role="alert">This workspace has already been claimed by a different verified account. Sign in with that account. No access has been changed.</p> :
      !storageAvailable ? <p role="alert">Connect private storage before claiming the owner account.</p> :
      <button className="primary" disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        try {
          const response = await fetch("/api/studio/claim-owner", { method: "POST" });
          const data = await response.json() as { claimed?: boolean; error?: string };
          if (!response.ok || !data.claimed) throw new Error(data.error ?? "Owner setup could not finish.");
          window.location.assign("/owner");
        } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); setBusy(false); }
      }}>{busy ? "Claiming…" : "Claim owner"}</button>}
    {error && <p role="alert">{error}</p>}
    <p>Other sign-ups cannot claim ownership. Your existing songs and recordings are not changed.</p>
  </section></main>;
}
