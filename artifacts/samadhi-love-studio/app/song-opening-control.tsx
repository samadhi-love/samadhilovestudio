"use client";
import { songOpenings, type SongOpening } from "./song-opening";
export function SongOpeningControl({ value, change, disabled = false }: { value: SongOpening; change: (next: SongOpening) => void; disabled?: boolean }) {
  return <label className="field">Song opening<select value={value} disabled={disabled} onChange={event => change(event.target.value as SongOpening)}>{Object.entries(songOpenings).map(([id, option]) => <option value={id} key={id}>{option.name}</option>)}</select><small className="muted">Guides the next generation. Exact vocal entry depends on the provider; existing recordings are unchanged.</small></label>;
}
