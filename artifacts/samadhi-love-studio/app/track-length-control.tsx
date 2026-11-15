"use client";

import { HelpControl, HelpField } from "./help-tip";
import { useId } from "react";
import { formatTrackTime, maxGeneratedSongSeconds, minTrackSeconds, parseTrackTime, trackLengthPresets } from "./track-duration";

export function TrackLengthControl({ automatic, onAutomatic, suggested, reason, manual, onManual }: {
  automatic: boolean; onAutomatic: (value: boolean) => void; suggested: number; reason: string;
  manual: string; onManual: (value: string) => void;
}) {
  const id = useId();
  const selected = parseTrackTime(manual);
  return <fieldset className="track-length-control">
    <legend>Track length</legend>
    <div className="track-length-head">
      <HelpControl subject="Auto length" tip="Studio estimates a generation request from your prompt, lyrics and structure. Turn this off to request a specific time."><label className="checkline"><input type="checkbox" role="switch" checked={automatic} onChange={event => onAutomatic(event.target.checked)}/> Follow my prompt</label></HelpControl>
      <output aria-label="Selected track length">{automatic ? formatTrackTime(suggested) : selected !== null ? formatTrackTime(selected) : "—"}</output>
    </div>
    {automatic ? <p className="muted creation-note">{reason} Turn this off to request a specific time.</p> : <>
      <div className="track-length-manual">
        <HelpField label="Length slider" tip="Drag to set the track duration. The arrow keys adjust it one second at a time."><input type="range" min={minTrackSeconds} max={maxGeneratedSongSeconds} step={1}
            value={selected ?? suggested} aria-valuetext={formatTrackTime(selected ?? suggested)}
            onChange={event => onManual(formatTrackTime(Number(event.target.value)))}/></HelpField>
        <HelpField label="Minutes:seconds" tip="Type a time like 3:45. The longest track you can request is 10:00."><input type="text" autoComplete="off" maxLength={5} placeholder="3:30" value={manual}
            aria-invalid={selected === null} aria-describedby={id}
            onChange={event => onManual(event.target.value)} onBlur={() => {
              if (selected !== null) onManual(formatTrackTime(selected));
            }}/></HelpField>
      </div>
      <p className={`creation-note ${selected === null ? "track-length-error" : "muted"}`} id={id}>
        {selected === null ? "Enter a length from 0:03 to 10:00." : "Type a time like 4:45, drag the slider, or pick a preset."}
      </p>
      <div className="chips" aria-label="Track length presets">{trackLengthPresets.map(seconds =>
        <button type="button" className={`chip ${selected === seconds ? "active" : ""}`} key={seconds}
          aria-pressed={selected === seconds} onClick={() => onManual(formatTrackTime(seconds))}>{formatTrackTime(seconds)}</button>
      )}</div>
    </>}
  </fieldset>;
}
