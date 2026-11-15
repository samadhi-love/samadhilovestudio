"use client";

import { useMemo, useState } from "react";
import { HelpField } from "../help-tip";
import { waveform, sampleRate } from "../recording-dsp";
import { busFor, roles, sessionSeconds, type Bus, type Clip, type Role, type Session } from "./session";

export function ClipTimeline({ session, selected, choose, getSource, playhead, seek, move }: {
  session: Session; selected?: Clip; choose: (id: string) => void; getSource: (id: string) => AudioBuffer | undefined;
  playhead: number; seek: (at: number) => void; move: (id: string, at: number) => void;
}) {
  const peaksByClip = useMemo(() => new Map(session.clips.map(clip => {
    const samples = getSource(clip.source)?.getChannelData(0).subarray(Math.round(clip.start * sampleRate), Math.round(clip.end * sampleRate));
    return [clip.id, samples ? waveform(samples, 56) : []];
  })), [session.clips, getSource]);
  const duration = Math.max(8, playhead + 1, ...session.clips.map(clip => clip.at + clip.end - clip.start));
  const beat = 60 / session.bpm;
  const division = Math.max(1, Math.ceil(duration / beat / 60)) * beat;
  const percent = (seconds: number) => Math.min(100, seconds / duration * 100) + "%";
  return <>
    <HelpField label="Timeline playhead (seconds)" tip="Click or move the playhead to choose where to record, insert, or split a clip.">
      <input type="number" min={0} max={sessionSeconds - 0.05} step="any" value={Math.round(playhead * 1000) / 1000}
        onChange={event => { const value = event.target.valueAsNumber; if (Number.isFinite(value)) seek(Math.max(0, Math.min(sessionSeconds - 0.05, value))); }}/>
    </HelpField>
    <div className="vocal-timeline" role="group" aria-label="Audio clip timeline">
      <div className="vocal-ruler" aria-hidden="true">
        {[0, 1, 2, 3, 4].map(step => <span key={step} style={{ left: percent(duration * step / 4) }}>{(duration * step / 4).toFixed(1)} s</span>)}
      </div>
      {session.clips.map(clip => {
        const peaks = peaksByClip.get(clip.id) ?? [];
        return <div key={clip.id} className="vocal-lane" style={{ backgroundSize: percent(division) + " 100%" }}
          onClick={event => {
            if (event.target !== event.currentTarget) return;
            const box = event.currentTarget.getBoundingClientRect();
            seek((event.clientX - box.left) / box.width * duration);
          }}>
          <span className="vocal-cursor" style={{ left: percent(playhead) }}/>
          <button type="button" className="vocal-clip" aria-pressed={selected?.id === clip.id}
            aria-label={`Select ${clip.name} at ${clip.at.toFixed(2)} seconds`}
            style={{ left: percent(clip.at), width: percent(clip.end - clip.start), opacity: clip.mute ? 0.48 : 1 }}
            onClick={() => choose(clip.id)}
            onDragStart={event => {
              event.dataTransfer.setData("text/plain", clip.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={event => event.preventDefault()}
            onDragEnd={event => {
              const lane = event.currentTarget.parentElement?.getBoundingClientRect();
              if (lane && event.clientX > lane.left && event.clientX < lane.right && event.clientY >= lane.top && event.clientY <= lane.bottom) {
                choose(clip.id);
                move(clip.id, (event.clientX - lane.left) / lane.width * duration);
              }
            }} draggable>
            <svg viewBox="0 0 112 38" preserveAspectRatio="none" aria-hidden="true">
              {peaks.map((peak, i) => <line key={i} x1={i * 2} x2={i * 2} y1={19 - 18 * peak} y2={19 + 18 * peak} stroke="currentColor"/>)}
            </svg>
            <span>{clip.name}</span>
          </button>
        </div>;
      })}
    </div>
  </>;
}

export function ClipControls({ clip, length, update, pro, playhead }: {
  clip: Clip; length: number; update: (change: Partial<Clip>) => void; pro: boolean; playhead: number;
}) {
  const [pointGain, setPointGain] = useState(100);
  const points = clip.automation ?? [];
  const at = clip.start + playhead - clip.at;
  const fields = [
    ["at", "Timeline start", 0, sessionSeconds - (clip.end - clip.start), "Place this clip at a specific time without changing the source recording."],
    ["start", "Trim in", 0, clip.end - 0.05, "Skip the first part of this source. The original stays intact."],
    ["end", "Trim out", clip.start + 0.05, Math.min(length, clip.start + sessionSeconds - clip.at), "Stop the clip at this time in the source."],
    ...(pro ? [
      ["fadeIn", "Fade in", 0, 5, "Raise this clip’s volume smoothly from silence."],
      ["fadeOut", "Fade out", 0, 5, "Lower this clip’s volume smoothly to silence."],
    ] as const : []),
  ] as const;
  return <>
    <div className="field-grid">
      <label className="field">Clip name<input value={clip.name} maxLength={100} onChange={e => update({ name: e.target.value })}/></label>
      <label className="field">Part<select value={clip.role} onChange={e => update({ role: e.target.value as Role })}>
        {roles.map(role => <option key={role}>{role}</option>)}</select></label>
      {fields.map(([key, label, min, max, tip]) => <HelpField key={key} label={label + " (seconds)"} tip={tip}>
        <input key={clip.id + "-" + clip[key]} type="number" step="any" min={min} max={max} defaultValue={Math.round(clip[key] * 1000) / 1000}
          onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
          onBlur={e => {
            const value = e.target.valueAsNumber;
            if (!Number.isFinite(value)) { e.target.value = String(clip[key]); return; }
            const next = Math.max(min, Math.min(max, value));
            e.target.value = String(Math.round(next * 1000) / 1000);
            if (next !== clip[key]) update({ [key]: next });
          }}/>
      </HelpField>)}
      <HelpField label={"Clip volume · " + Math.round(100 * clip.volume) + "%"} subject="Clip volume" tip="Set the level of this part against the rest of the mix.">
        <input type="range" min={0} max={1.5} step={0.01} value={clip.volume} onChange={e => update({ volume: Number(e.target.value) })}/>
      </HelpField>
      <HelpField label={"Stereo pan · " + clip.pan} subject="Stereo pan" tip="Place the part between the left and right speakers. Zero is centered.">
        <input type="range" min={-1} max={1} step={0.05} value={clip.pan} onChange={e => update({ pan: Number(e.target.value) })}/>
      </HelpField>
    </div>
    <div className="actions">
      <label className="checkline"><input type="checkbox" checked={clip.mute} onChange={e => update({ mute: e.target.checked })}/> Mute clip</label>
      <label className="checkline"><input type="checkbox" checked={clip.solo} onChange={e => update({ solo: e.target.checked })}/> Solo clip</label>
    </div>
    {pro && <details className="guide-stems">
      <summary>Clip routing and volume automation</summary>
      <div className="field-grid">
        <HelpField label="Output bus" tip="Route this clip to the vocal or music group. Both groups feed the stereo master.">
          <select value={busFor(clip)} onChange={e => update({ bus: e.target.value as Bus })}><option value="vocals">Vocal bus</option><option value="music">Music bus</option></select>
        </HelpField>
        <HelpField label="Automation point level (%)" tip="Studio draws a smooth level change between points. Put the playhead inside this clip to add a point.">
          <input type="number" min={0} max={150} value={pointGain} onChange={e => {
            const value = e.target.valueAsNumber; if (value >= 0 && value <= 150) setPointGain(value);
          }}/>
        </HelpField>
      </div>
      <button type="button" className="secondary small" disabled={at < clip.start || at > clip.end || points.length >= 32} onClick={() => {
        const time = Math.min(clip.end, Math.round(at * 1000) / 1000);
        const automation = [...points.filter(point => Math.abs(point.time - time) >= 0.001), { time, gain: pointGain / 100 }].sort((a, b) => a.time - b.time);
        update({ automation });
      }}>Add volume point at playhead</button>
      {!!points.length && <ul>{points.map((point, index) => <li key={point.time}>
        {point.time.toFixed(3)} s in source · {Math.round(point.gain * 100)}%
        <button type="button" className="text-button" aria-label={"Remove volume point at " + point.time.toFixed(3) + " seconds"}
          onClick={() => update({ automation: points.filter((_, i) => i !== index) })}>Remove</button>
      </li>)}</ul>}
    </details>}
  </>;
}
