"use client";
import { useEffect, useRef, useState } from "react";
import type { AudioReadiness } from "./audio-readiness";
import { downloadFormats, type DownloadFormat } from "./audio-convert";
export function AudioFormatDownload({ url, title, sourceKey }: { url: string; title: string; sourceKey: string }) {
  const [format, setFormat] = useState<DownloadFormat>("wav24"), [busy, setBusy] = useState(false), [status, setStatus] = useState(""), [progress, setProgress] = useState(0);
  const [checking, setChecking] = useState(false);
  const [trimmed,setTrimmed]=useState<{url:string;seconds:number}|null>(null);
  const trimmedUrl=useRef("");
  const reportFor = useRef("");
  const [report, setReport] = useState<AudioReadiness | null>(null);
  const controller = useRef<AbortController | null>(null), active = useRef(false), generation = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- counter ref is bumped on purpose so late results from this run are ignored
  useEffect(() => { generation.current++; controller.current?.abort(); setBusy(false); setStatus(""); setReport(null); setTrimmed(null); if(trimmedUrl.current){URL.revokeObjectURL(trimmedUrl.current);trimmedUrl.current="";} return () => { generation.current++; controller.current?.abort(); if(trimmedUrl.current){URL.revokeObjectURL(trimmedUrl.current);trimmedUrl.current="";} }; }, [sourceKey]);
  async function download(check = false) {
    if (active.current) return;
    active.current = true; const token = generation.current, task = new AbortController(); controller.current = task;
    setBusy(true); setChecking(check); setProgress(0); setStatus("Reading the original audio. Conversion runs on this device.");
    try {
      const response = await fetch(url, { signal: task.signal }); if (!response.ok) throw new Error("The original recording could not load. Retry the download.");
      const blob = await response.blob();
      const { convertAudio, analyzeAudioDownload } = await import("./audio-convert");
      if (check) {
        setStatus("Checking the decoded original recording…"); setReport(null);
        const result = await analyzeAudioDownload(blob, { signal: task.signal, progress: setProgress });
        if (!task.signal.aborted && token === generation.current) { reportFor.current = sourceKey; setReport(result); setStatus("Audio check complete. Review the observations below before delivery."); }
        return;
      }
      const output = await convertAudio(blob, format, { signal: task.signal, progress: setProgress });
      if (task.signal.aborted || token !== generation.current) return;
      const name = (title.replace(/[\\/:*?"<>|]/g, "_").trim() || "SAMADHI LOVE") + "." + downloadFormats.find(f => f.id === format)!.extension;
      const address = URL.createObjectURL(output), link = document.createElement("a"); link.href = address; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(address), 20000);
      setStatus("Download prepared. The stored original has not changed.");
    } catch (e) { if (token === generation.current) setStatus(task.signal.aborted ? "Operation cancelled. The original is unchanged." : (e as Error).message); }
    finally { active.current = false; if (token === generation.current) setBusy(false); }
  }
  async function prepareTrim() {
    if(active.current)return;
    active.current=true;const token=generation.current,task=new AbortController();controller.current=task;setBusy(true);setChecking(false);setProgress(0);setStatus("Preparing a separate listening copy…");
    try {
      const response=await fetch(url,{signal:task.signal});if(!response.ok)throw new Error("The original recording could not load. Try again.");
      const {trimAudioOpeningDownload}=await import("./audio-convert");
      const result=await trimAudioOpeningDownload(await response.blob(),{signal:task.signal,progress:setProgress});
      if(task.signal.aborted||token!==generation.current)return;
      if(trimmedUrl.current)URL.revokeObjectURL(trimmedUrl.current);
      trimmedUrl.current=URL.createObjectURL(result.blob);setTrimmed({url:trimmedUrl.current,seconds:result.removedSeconds});setStatus("Preview ready. Your saved original and video timing are unchanged.");
    }catch(e){if(token===generation.current)setStatus(task.signal.aborted?"Cancelled. Original preserved.":(e as Error).message);}
    finally{active.current=false;if(token===generation.current)setBusy(false);}
  }
  return <details className="audio-format-download"><summary>More download formats</summary><p className="muted">Convert the original to WAV, MP3, FLAC or compatible AAC/M4A. WAV/FLAC keep the decoded source sample rate. Conversion cannot restore quality lost in a compressed recording.</p>
    <div className="actions"><label>Download format<select aria-label="Audio download format" value={format} disabled={busy} onChange={e => setFormat(e.target.value as DownloadFormat)}>{downloadFormats.map(f => <option value={f.id} key={f.id}>{f.label}</option>)}</select></label><button type="button" className="secondary small" disabled={busy} onClick={() => void download()}>{busy ? checking ? "Checking…" : "Converting…" : "Convert & download"}</button><button type="button" className="secondary small" disabled={busy} onClick={() => void download(true)}>Check audio readiness</button>{busy && <button type="button" className="secondary small" onClick={() => controller.current?.abort()}>{checking ? "Cancel audio check" : "Cancel audio conversion"}</button>}</div>
    {report && reportFor.current === sourceKey && <section className="audio-readiness-report" aria-label="Audio readiness report"><h4>Original recording · audio checks</h4><p>{report.duration.toFixed(1)} seconds · {report.sampleRate.toLocaleString()} Hz · {report.channels} channel(s)</p><p>Sample peak: {report.peakDb === null ? "Silence" : report.peakDb.toFixed(1) + " dBFS"} · RMS: {report.rmsDb === null ? "Silence" : report.rmsDb.toFixed(1) + " dBFS"}</p>{report.channels === 2 && <p>Stereo correlation: {report.correlation === null ? "Not measurable" : report.correlation.toFixed(2)} · Mono level change: {report.monoCancelled ? "Cancellation" : report.monoChangeDb === null ? "Not measurable" : report.monoChangeDb.toFixed(1) + " dB"}</p>}
      {report.warnings.length ? <ul>{report.warnings.map(w => <li key={w}>{w}</li>)}</ul> : <p>No issues were flagged by these limited checks. Listen to the recording and verify the final export.</p>}
      {!report.silent&&report.leadingQuiet>=.5&&<div><button type="button" className="secondary small" disabled={busy} onClick={()=>void prepareTrim()}>Preview without opening silence</button><p className="muted">Creates a separate 24-bit WAV copy; retains 0.15 seconds before detected sound. Listen for quiet words or intentional ambience before using it.</p></div>}
      {trimmed&&<div><p>{trimmed.seconds.toFixed(2)} seconds removed from this copy only.</p><audio controls src={trimmed.url} aria-label="Preview with opening silence removed"/><a className="secondary small" href={trimmed.url} download={(title.replace(/[\\/:*?"<>|]/g,"_")||"Song")+"-opening-trimmed.wav"}>Download trimmed copy</a><p className="muted">Existing video captions still follow the original. Realign captions if you later use this copy as a different soundtrack.</p></div>}
      <p className="muted">Quiet passages and stereo differences can be intentional. This checks the original decoded recording, not the converted download. It does not measure LUFS or oversampled true peak, establish copyright clearance, or certify mastering quality.</p>
      <button type="button" className="secondary small" onClick={() => { const address = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, source: sourceKey, title, checkedAt: new Date().toISOString(), scope: "Decoded original; sample-level checks, not LUFS/true-peak certification", ...report }, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = address; link.download = (title.replace(/[\\/:*?"<>|]/g, "_") || "SAMADHI LOVE") + "-audio-check.json"; link.click(); setTimeout(() => URL.revokeObjectURL(address), 20000); }}>Download check report</button>
    </section>}
    <p className="muted">AAC requires browser encoder support. FLAC uses a portable lossless encoder; file size can be similar to WAV. Conversions support mono/stereo recordings up to 10 minutes and 96 MB, subject to device memory.</p>{busy && <progress value={progress} max={1} aria-label="Audio conversion progress"/>}{status && <p role="status">{status}</p>}
  </details>;
}
