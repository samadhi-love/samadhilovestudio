"use client";

import { useEffect, useState } from "react";
import { isExplicitSong } from "./clean-content";
import { listenerApi, type ListenerTrack } from "./subscriber-room";
import type { Song } from "./studio-data";

export function ListenerSettings({ songs }: { songs: Song[] }) {
  const [selected, setSelected] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const tracks = songs.filter(song => song.audioFormat && !song.creationDraft && !isExplicitSong(song));

  useEffect(() => {
    fetch(listenerApi).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json() as { tracks: ListenerTrack[] };
      setSelected(data.tracks.map(track => track.id));
    }).catch(() => setError("The subscriber playlist could not load. Refresh and try again."));
  }, []);

  async function save() {
    if (selected === null || saving) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const ids = selected.filter(id => tracks.some(track => track.id === id));
      const versions = Object.fromEntries(tracks.filter(track => ids.includes(track.id) && track.audioId)
        .map(track => [track.id, track.audioId]));
      const response = await fetch(listenerApi, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, versions }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error);
      setMessage("Subscriber playlist saved.");
    } catch (error) {
      setError(error instanceof Error && error.message ? error.message : "The subscriber playlist could not save.");
    } finally { setSaving(false); }
  }

  return <section className="panel form-panel station-queue">
    <h2>Subscriber Listening Room</h2>
    <p className="muted">Choose the recordings invited subscribers can hear. The room opens with an empty playlist until you select tracks.</p>
    <fieldset disabled={selected === null || saving} className="listener-checks">
      {tracks.map(track => <label className="checkline" key={track.id}>
        <input type="checkbox" checked={selected?.includes(track.id) ?? false} onChange={event => {
          const checked = event.target.checked;
          setSelected(current => checked ? [...(current ?? []), track.id] : (current ?? []).filter(id => id !== track.id));
        }}/>{track.name}
      </label>)}
    </fieldset>
    <div className="actions">
      <button className="primary" disabled={selected === null || saving} onClick={save}>{saving ? "Saving…" : "Save subscriber playlist"}</button>
      <a className="secondary" href="/subscriber" target="_blank" rel="noreferrer">Preview as subscriber</a>
    </div>
    {message && <p role="status">{message}</p>}{error && <p role="alert" className="notice">{error}</p>}
  </section>;
}
