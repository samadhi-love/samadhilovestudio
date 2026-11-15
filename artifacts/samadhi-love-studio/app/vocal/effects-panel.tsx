"use client";

import { useState } from "react";
import { HelpField, HelpControl } from "../help-tip";
import { hasExplicitWords } from "../clean-content";
import { vocalPresets } from "./effects";
import { dry, effectControls, type Clip, type Effects, type Session } from "./session";

export function EffectsPanel({ clip, presets, update, savePreset, simple }: {
  clip: Clip; presets: Session["presets"]; update: (patch: Partial<Clip>) => void;
  savePreset: (name: string, effects: Effects) => void; simple: boolean;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  return <>
    <div className="actions">
      <HelpField label="Vocal preset" tip="Apply EQ, dynamics, and space settings to this clip. The choir preset layers and widens the take with effects.">
        <select value="" onChange={event => {
          const [kind, index] = event.target.value.split("-");
          if (!kind) return;
          const effects = kind === "factory" ? vocalPresets[Number(index)]?.settings : presets[Number(index)]?.effects;
          if (effects) update({ effects: { ...dry, ...effects }, bypass: false });
        }}><option value="">Choose a preset</option>
          <optgroup label="Studio presets">{vocalPresets.map((preset, index) => <option key={preset.name} value={"factory-" + index}>{preset.name}</option>)}</optgroup>
          {!!presets.length && <optgroup label="Session presets">{presets.map((preset, index) => <option key={preset.name} value={"custom-" + index}>{preset.name}</option>)}</optgroup>}
        </select></HelpField>
      <button type="button" className="secondary" onClick={() => update({ effects: { ...dry, ...vocalPresets[0].settings }, bypass: false })}>Enhance voice</button>
      <HelpControl subject="Bypass processing" tip="Hear the clip with its timing and level but without the effects or pitch edits.">
        <label className="checkline"><input type="checkbox" checked={clip.bypass} onChange={event => update({ bypass: event.target.checked })}/> Bypass processing</label>
      </HelpControl>
      <button type="button" className="text-button" onClick={() => update({ effects: { ...dry }, bypass: false })}>Reset effects</button>
    </div>
    {!simple && <div className="vocal-knobs">{effectControls.map(([key, label, min, max, step, tip]) =>
      <HelpField key={key} label={<>{label} <span className="muted">{clip.effects[key]}</span></>} subject={label} tip={tip}>
        <input type="range" min={min} max={max} step={step} value={clip.effects[key]} onChange={event => update({ effects: { ...clip.effects, [key]: Number(event.target.value) } })}/>
      </HelpField>)}</div>}
    {!simple && <div className="actions">
      <label className="field">Custom preset name<input value={name} maxLength={100} onChange={event => setName(event.target.value)}/></label>
      <button type="button" className="secondary" disabled={!name.trim() || (presets.length >= 24 && !presets.some(preset => preset.name === name.trim()))} onClick={() => {
        if (hasExplicitWords(name)) { setError("Choose a clean preset name."); return; }
        savePreset(name.trim(), clip.effects); setName(""); setError("");
      }}>Save effects preset</button>
    </div>}
    {error && <p className="notice" role="alert">{error}</p>}
  </>;
}
