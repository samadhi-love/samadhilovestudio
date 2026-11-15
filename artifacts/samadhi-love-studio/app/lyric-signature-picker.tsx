"use client";
import { useState } from "react";
import type { LyricProject } from "./lyric-video-data";
import { videoThemes } from "./lyric-video-data";
import { signatureLooks, applySignatureLook, type SignatureLookId } from "./lyric-signature";
import { newProSettings } from "./lyric-pro-data";
import { freshSong } from "./studio-data";
import { CaptionTemplateDemo } from "./lyric-caption-picker";
import { overlayDesigns } from "./lyric-overlay-designs";
export function SignaturePicker({ project, change, disabled }: { project: LyricProject; change: (p: LyricProject) => void; disabled: boolean }) {
  const [selected, setSelected] = useState<SignatureLookId>("awaken");
  const [demoSettings] = useState(() => newProSettings(freshSong("signature-preview", "SAMADHI LOVE", 0), 9));
  const sample = applySignatureLook(project.pro ? project : { ...project, pro: demoSettings }, selected);
  return <section className="lvp-signatures" aria-label="SAMADHI LOVE signature templates">
    <h3>SAMADHI LOVE · {signatureLooks.length} animated signature looks</h3>
    <p className="lvp-note">Preview a complete look, then apply it to your current format. Your lyrics, timing, and soundtrack stay intact. Existing background overrides are replaced; Undo restores the previous design.</p>
    <div className="lvp-signature-grid">{signatureLooks.map(look => <button type="button" key={look.id} disabled={disabled} aria-pressed={selected === look.id} onClick={() => setSelected(look.id)} style={{ background: `linear-gradient(145deg,${videoThemes[look.theme].colors[1]},${videoThemes[look.theme].colors[2]})` }}><strong>{look.name}</strong><span>{look.note}</span></button>)}</div>
    <CaptionTemplateDemo project={sample} useProjectBackground/>
    <button type="button" className="lvp-primary" disabled={disabled} onClick={() => change(applySignatureLook(project, selected))}>Apply {signatureLooks.find(l => l.id === selected)!.name}</button>
  </section>;
}
export function VisualLayerControls({ project, change, disabled, time }: { project: LyricProject; change: (p: LyricProject) => void; disabled: boolean; time: number }) {
  const layers = project.visualLayers ?? { backgroundMotion: 1, overlayAmount: 0, overlayStyle: "none" as const, overlayMotion: true, beatOffset: 0 };
  const patch = (p: Partial<typeof layers>) => change({ ...project, visualLayers: { ...layers, ...p }, ...(p.beatOffset !== undefined && project.pro?.beatGrid ? { pro: { ...project.pro, beatGrid: { ...project.pro.beatGrid, reviewed: false } } } : {}) });
  return <fieldset disabled={disabled} className="lvp-layer-controls"><legend>Independent visual layers</legend>
    <div className="lvp-fields"><label>Background motion · {Math.round(layers.backgroundMotion * 100)}%<input type="range" min="0" max="1" step=".05" value={layers.backgroundMotion} onChange={e => patch({ backgroundMotion: e.target.valueAsNumber })}/></label>
    <label>Overlay design<select value={layers.overlayStyle} onChange={e => patch({ overlayStyle: e.target.value as typeof layers.overlayStyle })}>{Object.entries(overlayDesigns).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
    <label>Overlay intensity · {Math.round(layers.overlayAmount * 100)}%<input type="range" min="0" max="1" step=".05" value={layers.overlayAmount} onChange={e => patch({ overlayAmount: e.target.valueAsNumber })}/></label>
    <label>Animation tempo (BPM)<input type="number" min="40" max="240" value={project.bpm ?? 100} onChange={e => { const bpm = e.target.valueAsNumber; if (bpm >= 40 && bpm <= 240) change({ ...project, bpm, ...(project.pro?.beatGrid ? { pro: { ...project.pro, beatGrid: { ...project.pro.beatGrid, reviewed: false } } } : {}) }); }}/></label></div>
    <label className="lvp-check"><input type="checkbox" checked={layers.overlayMotion} onChange={e => patch({ overlayMotion: e.target.checked })}/> Animate overlay</label>
    <div className="lvp-actions"><button type="button" onClick={() => patch({ beatOffset: Math.min(600, Math.max(0, Math.round(time * 100) / 100)) })}>Set animation beat at playhead</button><button type="button" onClick={() => patch({ beatOffset: 0 })}>Reset beat offset</button></div>
    <p className="lvp-note">Beat origin: {layers.beatOffset.toFixed(2)}s. Tempo and beat origin are manual animation controls; they do not move lyric timing or detect the song's beat. Background motion uses the selected drift/zoom mode. Changing tempo or beat origin pauses a reviewed grid until you rebuild/review it. Lyric motion is controlled separately below.</p>
  </fieldset>;
}
