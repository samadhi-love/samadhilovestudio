"use client";
import { useMemo, useState } from "react";
import { waveformTime } from "./song-waveform";
export function SongWaveformRange({ peaks, duration, start, end, change, disabled }: { peaks: number[]; duration: number; start: number; end: number; change: (start: number, end: number) => void; disabled: boolean }) {
  const [boundary, setBoundary] = useState<"start" | "end">("start");
  const trace = useMemo(() => peaks.map((p,i) => { const x=(i+.5)/peaks.length*1000, height=Math.max(1,Math.min(1,p)*62); return `M${x.toFixed(2)},${(70-height).toFixed(2)}V${(70+height).toFixed(2)}`; }).join(" "), [peaks]);
  const from = Number.isFinite(start) ? Math.min(duration, Math.max(0,start)) : 0, to = Number.isFinite(end) ? Math.min(duration, Math.max(0,end)) : 0;
  return <section className="song-waveform-range" aria-label="Audio cut selection"><div className="actions"><button type="button" className="secondary small" aria-pressed={boundary === "start"} disabled={disabled} onClick={() => setBoundary("start")}>Set start on waveform</button><button type="button" className="secondary small" aria-pressed={boundary === "end"} disabled={disabled} onClick={() => setBoundary("end")}>Set end on waveform</button></div>
    <svg viewBox="0 0 1000 140" preserveAspectRatio="none" role="img" aria-label="Song waveform with selected time range" onPointerDown={event => { if (disabled) return; const box = event.currentTarget.getBoundingClientRect(), time = waveformTime(event.clientX, box.left, box.width, duration); change(boundary === "start" ? time : from, boundary === "end" ? time : to); }}>
      <rect width="1000" height="140" fill="#23363d"/><path d={trace} stroke="#b8e5bd" strokeWidth="1.5" fill="none"/><rect x={from/duration*1000} y="0" width={Math.max(0,(to-from)/duration*1000)} height="140" fill="#f3bf5b33" stroke="#f3cf8b" strokeWidth="2"/>
    </svg><div className="song-waveform-ticks"><span>0:00</span><span>Length {Math.floor(duration/60)}:{(duration%60).toFixed(2).padStart(5,"0")}</span></div>
    <p className="muted">Select a boundary and tap the waveform, or use the keyboard-accessible sliders and exact time fields. This waveform is an overview; listen before saving.</p>
    <label className="field">Selection start · {from.toFixed(2)}s<input aria-label="Waveform selection start" type="range" min="0" max={duration} step=".01" disabled={disabled} value={from} onChange={e => change(Number(e.target.value),to)}/></label><label className="field">Selection end · {to.toFixed(2)}s<input aria-label="Waveform selection end" type="range" min="0" max={duration} step=".01" disabled={disabled} value={to} onChange={e => change(from,Number(e.target.value))}/></label>
  </section>;
}
