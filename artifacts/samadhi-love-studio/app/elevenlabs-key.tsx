"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { HelpControl, HelpField } from "./help-tip";
import type { ElevenLabsSettings } from "./elevenlabs-settings-data";

const endpoint = "/api/studio/elevenlabs";
const keysUrl = "https://elevenlabs.io/app/settings/api-keys";
const initialStatus: ElevenLabsSettings = {
  available: false, saved: false, defaultProvider: false, connection: "disconnected", musicAccess: "unknown",
};

export function useElevenLabsKey() {
  const [status, setStatus] = useState(initialStatus);
  const [operation, setOperation] = useState<"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | null>("GET");
  const [error, setError] = useState("");
  const pending = useRef(false);

  async function update(method: NonNullable<typeof operation>, body?: FormData) {
    if (pending.current) return false;
    pending.current = true; setOperation(method); setError("");
    try {
      const response = await fetch(endpoint, {
        method, cache: "no-store",
        ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: body.get("apiKey") }) }),
      });
      const result = await response.json().catch(() => null) as ElevenLabsSettings | null;
      if (!response.ok || !result) throw new Error(result?.error ?? "Could not reach connection settings. Try again.");
      setStatus(current => ({ ...result, ...(method === "PATCH" && { usage: current.usage }) }));
      return method === "POST" ? result.connection === "connected" && result.musicAccess === "available" :
        result.connection === "connected" || method === "DELETE" || method === "GET";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update the connection.");
      return false;
    } finally { pending.current = false; setOperation(null); }
  }

  useEffect(() => { void update("GET"); }, []);

  return {
    status, operation, busy: operation !== null, error, update,
    // Previously stored keys can still be used for voice design or captions, independently of Music permission.
    connected: status.available && status.saved,
    defaultProvider: status.available && status.saved && status.defaultProvider,
  };
}

export type ElevenLabsKey = ReturnType<typeof useElevenLabsKey>;

const steps = ["Get an API key", "Connect your account", "Test the connection", "Make your first song"];

export function ElevenLabsSettingsPanel({ access, firstSong }: { access: ElevenLabsKey; firstSong: () => void }) {
  const { status, busy, operation, error, update } = access;
  const [step, setStep] = useState<number | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [message, setMessage] = useState("");
  const setupHeading = useRef<HTMLHeadingElement>(null);
  const testedMusic = status.connection === "connected" && status.musicAccess === "available";
  const connectionLabel = { connected: "Connected", disconnected: "Disconnected", error: "Error", unchecked: "Saved key · test required" }[status.connection];

  if (status.managed) return <section className="provider-settings"><h3>Studio-funded production</h3><p>Your current funding choice uses SAMADHI credits. No personal ElevenLabs account is required for supported production jobs. Each charge is confirmed before processing.</p><a className="secondary" href="/credits">Credits, usage &amp; funding choices</a><p className="muted">Voice design remains on the owner’s personal provider connection. To manage your personal key, switch funding in Credits &amp; Usage first.</p></section>;

  function goToStep(next: number) {
    setStep(next);
    requestAnimationFrame(() => setupHeading.current?.focus());
  }

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    form.reset();
    setMessage("");
    if (!await update("PUT", payload)) return;
    setReconnecting(false);
    setMessage("ElevenLabs connected. The key was saved securely.");
    if (step === 1) goToStep(2);
  }

  const keyForm = <form onSubmit={connect}>
    <fieldset disabled={busy || !status.available}>
      <HelpField label="Enter API Key" tip="Paste the key from ElevenLabs. Studio verifies it and saves it in the encrypted credential store.">
        <input name="apiKey" type="password" required autoComplete="off" spellCheck={false} maxLength={200} placeholder="Paste your ElevenLabs API key"/>
      </HelpField>
      <div className="actions">
        <button type="submit" className="primary">{operation === "PUT" ? "Verifying key…" : status.saved ? "Verify and replace key" : "Connect ElevenLabs Account"}</button>
        {reconnecting && <button type="button" className="secondary" onClick={() => setReconnecting(false)}>Cancel reconnect</button>}
      </div>
    </fieldset>
  </form>;

  const testButton = <HelpControl subject="Test Connection" tip="Verify the saved key, check Music API access without generating audio, and refresh available credits.">
    <button type="button" className="secondary" disabled={busy || !status.saved || !status.available} onClick={async () => {
      setMessage("");
      if (await update("POST")) setMessage("ElevenLabs Music connection verified.");
    }}>{operation === "POST" ? "Testing connection…" : "Test Connection"}</button>
  </HelpControl>;

  return <section className="provider-settings" aria-labelledby="elevenlabs-settings-heading" aria-busy={busy}>
    <p className="eyebrow">SETTINGS / AI MUSIC PROVIDERS</p>
    <h3 id="elevenlabs-settings-heading">ElevenLabs</h3>
    <p className="muted">Connect your ElevenLabs account to generate songs, design voices, and sync captions using your plan.</p>
    <dl className="provider-status">
      <div><dt>Connection Status</dt><dd>{operation === "GET" ? "Checking…" : error && !status.saved ? "Error" : connectionLabel}</dd></div>
      <div><dt>Music Generation Access</dt><dd>{status.musicAccess === "available" ? "Available · Music plan check passed" : status.musicAccess === "unavailable" ? "Access denied" : "Unverified"}</dd></div>
      <div><dt>Default music provider</dt><dd>{status.defaultProvider ? "ElevenLabs" : "Studio instruments for instrumental tracks"}</dd></div>
    </dl>
    {status.checkedAt && <p className="muted">Last tested {new Date(status.checkedAt).toLocaleString()}</p>}
    {(status.accountMessage || status.musicMessage) && <ul aria-label="Connection diagnostics">
      {status.accountMessage && <li><strong>Account check</strong> · {status.accountMessage}</li>}
      {status.musicMessage && <li><strong>Music check</strong> · {status.musicMessage}</li>}
    </ul>}
    {(error || status.error) && <p className="notice" role="alert">{error || status.error}</p>}
    {message && !error && <p role="status">{message}</p>}
    {!status.available && operation !== "GET" && <p className="notice">Secure key storage is currently unavailable. <button type="button" className="text-button" onClick={() => update("GET")} disabled={busy}>Retry</button></p>}

    {step === null && (!status.saved || reconnecting) && keyForm}
    {reconnecting && <p className="muted">Choose Verify and replace key to test the key in this form.</p>}
    <div className="actions provider-actions">
      {step !== 2 && !reconnecting && testButton}
      <button type="button" className="secondary" disabled={busy || !testedMusic || status.defaultProvider} onClick={async () => {
        setMessage("");
        if (await update("PATCH")) setMessage("ElevenLabs is now the default provider in Guided Studio.");
      }}>Set as Default Provider</button>
      {status.saved && <>
        <button type="button" className="secondary" disabled={busy} onClick={() => { setStep(null); setReconnecting(true); setMessage(""); }}>Reconnect</button>
        <button type="button" className="text-button danger" disabled={busy} onClick={async () => {
          if (!confirm("Disconnect ElevenLabs from this Studio? Your songs and drafts will stay here.")) return;
          setMessage("");
          if (await update("DELETE")) { setReconnecting(false); setStep(null); setMessage("ElevenLabs disconnected."); }
        }}>Disconnect</button>
      </>}
    </div>

    <div className="guide-tip provider-usage">
      <h4>Credits &amp; Usage</h4>
      {status.usage ? <p>{status.usage.tier && <>Plan <strong>{status.usage.tier}</strong> · </>}
        <strong>{status.usage.used.toLocaleString()}</strong> used of <strong>{status.usage.limit.toLocaleString()}</strong> · <strong>{Math.max(0, status.usage.limit - status.usage.used).toLocaleString()}</strong> remaining in the billing allowance.</p>
        : <p className="muted">Run Test Connection to see the current billing allowance. The key needs User read permission for ElevenLabs to return usage.</p>}
      <p className="muted">Test Connection requests a short composition plan and renders no audio. A successful track confirms the compose endpoint works for your key and plan. The balance shown is for the account’s billing allowance.</p>
    </div>

    <div className="guide-tip provider-wizard">
      {step === null ? <><h4>First song setup</h4><p className="muted">Follow four steps from creating your API key to making your first song.</p>
        <button type="button" className="primary" disabled={busy} onClick={() => goToStep(0)}>Start setup wizard</button></> :
        <>
          <p className="eyebrow">STEP {step + 1} OF {steps.length}</p>
          <h4 ref={setupHeading} tabIndex={-1}>{steps[step]}</h4>
          {step === 0 && <p>Sign in to ElevenLabs. In <strong>Developers → API Keys</strong>, create a restricted key named SAMADHI LOVE Studio. Enable <strong>Music</strong> and <strong>User read</strong> for credits. Copy the key while it is visible. <a href={keysUrl} target="_blank" rel="noreferrer">Open ElevenLabs API Keys ↗</a></p>}
          {step === 1 && <><p>Paste the key here to connect and store it securely in your private workspace.</p>{keyForm}</>}
          {step === 2 && <><p>Run the check below and continue when Music Generation Access says Available. This checks the Music API by requesting a short composition plan without rendering a track.</p>
            <div className="actions">{testButton}</div></>}
          {step === 3 && <p>Open Create and choose an experience level if prompted. Enter a title, describe the song, add lyrics if you have them, and choose a length. Click <strong>Generate track</strong> when ready. ElevenLabs may use credits. Your track will appear in Creation Drafts.</p>}
          <div className="actions">
            {step > 0 && <button type="button" className="secondary" disabled={busy} onClick={() => goToStep(step - 1)}>Back</button>}
            {step < 3 && <button type="button" className="primary" disabled={busy || (step === 1 && !status.saved) || (step === 2 && !testedMusic)} onClick={() => goToStep(step + 1)}>Continue</button>}
            {step === 3 && <button type="button" className="primary" disabled={busy || !testedMusic} onClick={firstSong}>Open Create</button>}
            <button type="button" className="text-button" disabled={busy} onClick={() => setStep(null)}>Exit wizard</button>
          </div>
        </>}
    </div>

    <details className="provider-troubleshooting">
      <summary>Troubleshooting</summary>
      <ul>
        <li><strong>Invalid or expired key.</strong> Create a new key in ElevenLabs, then choose Reconnect.</li>
        <li><strong>Music access denied.</strong> Check that your plan includes API music generation and the key has Music access. Check any workspace or IP restrictions.</li>
        <li><strong>Credits unavailable.</strong> Add User read permission, or check usage directly in ElevenLabs.</li>
        <li><strong>Voice design or caption access denied.</strong> Enable the relevant Voice Design, Speech to Text, or Forced Alignment permissions on your key.</li>
        <li><strong>Rate limit or service error.</strong> Wait a moment, then try Test Connection again.</li>
      </ul>
      <a href={keysUrl} target="_blank" rel="noreferrer">Manage keys in ElevenLabs ↗</a> · <a href="https://status.elevenlabs.io/" target="_blank" rel="noreferrer">ElevenLabs status ↗</a>
    </details>
  </section>;
}
