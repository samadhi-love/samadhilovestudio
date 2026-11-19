"use client";

import { useState } from "react";
import { HelpField } from "../help-tip";
import { detectVocalNotes, noteNames, sampleRate } from "../recording-dsp";
import { noTuning, type Clip, type NoteEdit, type Tuning } from "./session";

const sliders = [
  ["strength", "Correction strength", 0, 100, "Blend the detected note toward the selected scale. Zero turns automatic correction off."],
  ["speed", "Correction speed", 0, 100, "Higher settings move to the target faster, for a tighter stylized effect."],
  ["shift", "Pitch shift (semitones)", -12, 12, "Transpose the voiced part up or down without changing its length."],
  ["formant", "Formant shift (semitones)", -6, 6, "Change the color of voiced sounds by stretching or compressing each pitch grain."],
] as const;

function noteLabel(midi: number) {
  return noteNames[midi % 12] + (Math.floor(midi / 12) - 1);
}

export function TuningPanel({ clip, buffer, pro, update, run, harmony }: {
  clip: Clip; buffer: AudioBuffer | undefined; pro: boolean;
  update: (patch: Partial<Clip>) => void; run: (task: () => Promise<void>) => void;
  harmony?: (interval: number) => void;
}) {
  const [detection, setDetection] = useState<{ start: number; end: number; notes: NoteEdit[] } | null>(null);
  const [harmonyInterval, setHarmonyInterval] = useState(4);
  const found = detection?.start === clip.start && detection.end === clip.end ? detection.notes : null;
  const t = clip.tuning;
  const tune = (changes: Partial<Tuning>) => update({ tuning: { ...t, ...changes }, bypass: false });
  async function detect() {
    if (!buffer) return;
    const notes = (await detectVocalNotes(buffer.getChannelData(0).subarray(Math.round(clip.start * sampleRate), Math.round(clip.end * sampleRate))))
      .slice(0, 80).map(note => ({ ...note, start: note.start + clip.start, end: Math.min(clip.end, note.end + clip.start) }));
    setDetection({ start: clip.start, end: clip.end, notes });
  }
  return <div className="vocal-tuning">
    <h3>Voice tuning</h3>
    <p className="muted">Use a single, clear voice. Listen to the original and rendered take before mixing. Tune layered voices on separate clips.</p>
    <div className="actions">
      <button type="button" className="secondary small" onClick={() => tune({ strength: 45, speed: 33 })}>Natural tuning</button>
      <button type="button" className="secondary small" onClick={() => tune({ strength: 100, speed: 96 })}>Strong tuning</button>
      <button type="button" className="text-button" onClick={() => update({ tuning: { ...noTuning } })}>Reset tuning</button>
    </div>
    <div className="vocal-knobs">
      <HelpField label="Tuning key" tip="Choose the root of the musical scale used for automatic tuning.">
        <select value={t.key} onChange={e => tune({ key: Number(e.target.value) })}>{noteNames.map((note, i) => <option key={note} value={i}>{note}</option>)}</select></HelpField>
      <HelpField label="Tuning scale" tip="Chromatic uses all 12 notes. Major and minor use only notes in the selected key.">
        <select value={t.scale} onChange={e => tune({ scale: e.target.value as Tuning["scale"] })}>
          <option value="chromatic">Chromatic</option><option value="major">Major</option><option value="minor">Minor</option></select></HelpField>
      {sliders.map(([key, label, min, max, tip]) => <HelpField key={key} label={label + " · " + t[key]} subject={label} tip={tip}>
        <input type="range" min={min} max={max} value={t[key]} onChange={e => tune({ [key]: Number(e.target.value) })}/></HelpField>)}
    </div>
    <div className="actions">
      <button type="button" className="secondary" disabled={!buffer} onClick={() => run(detect)}>Detect vocal notes</button>
      {!!t.notes.length && <button type="button" className="text-button" onClick={() => tune({ notes: [] })}>Clear manual note edits</button>}
    </div>
    {found && !found.length && <p role="status">No steady notes detected. Try a clear, solo sung take.</p>}
    {found && found.length > 0 && <div className="vocal-note-editor">
      <p className="muted">Set a target for each detected note. Times refer to the original source. Choose Automatic to remove a manual target.</p>
      <div className="vocal-note-map" aria-label="Detected pitch contour" role="img">
        {found.map(note => <span key={note.start} style={{ left: (note.start - clip.start) / (clip.end - clip.start) * 100 + "%",
          width: (note.end - note.start) / (clip.end - clip.start) * 100 + "%", top: (100 - note.midi) / 72 * 95 + "%" }}/>)}
      </div>
      <div className="vocal-note-list">{found.map((note, index) => {
        const current = t.notes.find(edit => Math.abs(edit.start - note.start) < 0.0001 && Math.abs(edit.end - note.end) < 0.0001);
        return <label className="field" key={note.start}>Note {index + 1} · {noteLabel(note.midi)} · {note.start.toFixed(2)}–{note.end.toFixed(2)} s
          <select value={current?.midi ?? ""} onChange={e => {
            const rest = t.notes.filter(edit => edit.start >= note.end || edit.end <= note.start);
            const next = e.target.value === "" ? rest : [...rest, { ...note, midi: Number(e.target.value) }].slice(-80);
            tune({ notes: next });
          }}>
            <option value="">Automatic</option>
            {Array.from({ length: 25 }, (_, i) => i + note.midi - 12).filter(midi => midi >= 28 && midi <= 100)
              .map(midi => <option key={midi} value={midi}>{noteLabel(midi)}</option>)}
          </select></label>;
      })}</div>
    </div>}
    {pro && <div className="actions">
      <HelpField label="Harmony interval" tip="Make a pitch-shifted copy of this solo take. The new clip has its own level and pan.">
        <select value={harmonyInterval} onChange={e => setHarmonyInterval(Number(e.target.value))}>
          <option value={3}>Minor third above (+3)</option><option value={4}>Major third above (+4)</option>
          <option value={7}>Fifth above (+7)</option><option value={-5}>Fourth below (−5)</option><option value={-12}>Octave below (−12)</option>
        </select></HelpField>
      <button type="button" className="secondary" disabled={!harmony} onClick={() => harmony?.(harmonyInterval)}>Add shifted harmony clip</button>
    </div>}
  </div>;
}
