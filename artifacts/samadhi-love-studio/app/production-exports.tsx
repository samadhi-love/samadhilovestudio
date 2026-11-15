"use client";
import {productionFetch} from "./credits/client";

import { useEffect,useRef, useState } from "react";
import { Download } from "lucide-react";
import type { Instrumental } from "./creation-guide";
import { renderInstrumental, stems, type Stem } from "./instrumental";
import { instrumentalMidi } from "./instrumental-midi";

function exportName(title: string) {
  return title.replace(/[\\/:*?"<>|]/g, "-").trim() || "SAMADHI LOVE";
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 20000);
}

export function InstrumentalExports({ settings, title, disabled,working }: { settings: Instrumental; title: string; disabled?: boolean;working?:(busy:boolean)=>void }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const name = exportName(title);
  useEffect(()=>{working?.(!!busy);return()=>working?.(false);},[busy,working]);
  async function run(format: Stem | "midi") {
    if (pending.current) return;
    pending.current = true; setBusy(format); setError("");
    try {
      if (format === "midi") download(instrumentalMidi(settings), name + ".mid");
      else download(await renderInstrumental(settings, format), name + " - " + stems[format] + ".wav");
    } catch (error) { setError(error instanceof Error ? error.message : "This export could not finish."); }
    finally { pending.current = false; setBusy(""); }
  }
  return <details className="guide-stems"><summary>Export MIDI &amp; WAV stems</summary>
    <p className="muted creation-note">MIDI contains editable notes for drums, bass, harmony, and melody. The WAV stems contain the Studio’s rendered audio.</p>
    <div className="actions">
      <button type="button" className="secondary small" disabled={disabled || !!busy} onClick={() => run("midi")}><Download size={14}/> Download MIDI</button>
      {(Object.keys(stems) as Stem[]).map(stem => <button type="button" className="secondary small" key={stem} disabled={disabled || !!busy} onClick={() => run(stem)}><Download size={14}/> {stems[stem]} WAV</button>)}
    </div>
    {busy && <p role="status" className="muted">Preparing download…</p>}
    {error && <p className="notice" role="alert">{error}</p>}
  </details>;
}

export function SeparatedStems({ songId, audioId, title, connected, openMixer,working }: { songId: string; audioId?: string; title: string; connected: boolean; openMixer?: (archive: Blob) => void;working?:(busy:boolean)=>void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [archive,setArchive]=useState<Blob|null>(null);
  const [mode, setMode] = useState("two_stems_v1");
  const pending = useRef(false);
  useEffect(()=>{working?.(busy);return()=>working?.(false);},[busy,working]);
  async function separate() {
    if (pending.current || !connected || !confirm("Send this recording to ElevenLabs for stem separation? Your ElevenLabs plan may charge for the request.")) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await productionFetch("/api/studio/stems", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, audioId, mode, confirmed: true }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "ElevenLabs could not separate this recording.");
      }
      const zip = await response.blob();
      const signature = new Uint8Array(await zip.slice(0, 4).arrayBuffer());
      if (signature.join(",") !== "80,75,3,4") throw new Error("ElevenLabs did not return a readable stem ZIP.");
      setArchive(zip);
      download(zip, exportName(title) + " - Stems.zip");
    } catch (error) { setError(error instanceof Error ? error.message : "Stem separation failed."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <details className="guide-stems"><summary>Separate stems with ElevenLabs</summary>
    <p className="muted creation-note">Download a ZIP of separated audio. This sends the recording to ElevenLabs and may use plan credits. MIDI export is available for Studio instrumentals with an editable note arrangement.</p>
    {connected ? <div className="actions">
      <label className="field">Stem count<select value={mode} disabled={busy} onChange={event => setMode(event.target.value)}>
        <option value="two_stems_v1">2 stems · vocals and instrumental</option><option value="six_stems_v1">6 stems · if supported by your plan</option>
      </select></label>
      <button type="button" className="secondary small" disabled={busy} onClick={separate}>{busy ? "Separating audio…" : "Separate and download ZIP"}</button>
    </div> : <p className="muted">Connect ElevenLabs in Settings → AI Music Providers.</p>}
    {archive&&openMixer&&<button type="button" className="secondary" disabled={busy} onClick={()=>openMixer(archive)}>Audition &amp; mix these stems</button>}
    {error && <p className="notice" role="alert">{error}</p>}
  </details>;
}
