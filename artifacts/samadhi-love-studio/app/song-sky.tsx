"use client";
import { useMemo } from "react";
import type { Song } from "./studio-data";
import { projectRoot } from "./project-assets";
import { songCreatedTime } from "./song-library";

/** Deterministic 0..1 value from a song ID (no randomness, stable across renders). */
function hash(id: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}
const round = (n: number) => Math.round(n * 10) / 10;

/** A visual map of the songs currently visible in the library. Uses only the filtered list passed in. */
export function SongSky({ songs, allSongs, open }: { songs: Song[]; allSongs: Song[]; open: (id: string) => void }) {
  const stars = useMemo(() => {
    const ordered = songs.map((song, index) => ({ song, index, time: songCreatedTime(song) }));
    // Rank by real creation time; songs without a saved date keep library order and count as oldest.
    const ranked = [...ordered].sort((a, b) => (b.time ?? -Infinity) - (a.time ?? -Infinity) || a.index - b.index);
    const rank = new Map(ranked.map((v, i) => [v.song.id, i]));
    const n = Math.max(1, songs.length - 1);
    return ordered.map(({ song, time }) => {
      const recency = songs.length === 1 ? 1 : 1 - (rank.get(song.id) ?? 0) / n;
      return {
        song, time,
        x: round(6 + hash(song.id, 1) * 88), y: round(10 + hash(song.id, 2) * 78),
        r: round(1.1 + recency * 1.9), glow: round(0.45 + recency * 0.55),
        root: projectRoot(allSongs, song).id,
      };
    });
  }, [songs, allSongs]);
  const lines = useMemo(() => {
    const groups = new Map<string, typeof stars>();
    for (const s of stars) groups.set(s.root, [...(groups.get(s.root) ?? []), s]);
    const out: { key: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const group of groups.values()) for (let i = 1; i < group.length; i++)
      out.push({ key: group[i - 1].song.id + group[i].song.id, x1: group[i - 1].x, y1: group[i - 1].y, x2: group[i].x, y2: group[i].y });
    return out;
  }, [stars]);

  return <section className="song-sky" aria-labelledby="song-sky-title" data-testid="song-sky">
    <div className="song-sky-head">
      <p className="cosmic-eyebrow" id="song-sky-title">YOUR SONG SKY</p>
      <p className="song-sky-caption">Brighter stars are newer songs · lines join versions of the same song</p>
    </div>
    {!stars.length ? <div className="song-sky-empty"><p className="cosmic-poetic">The sky is still dark.</p><p>No songs match what you are viewing. Each song you save appears here as a star.</p></div> :
    <div className="song-sky-field">
      <svg className="song-sky-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {lines.map(l => <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}/>)}
      </svg>
      <ul className="song-sky-stars">
        {stars.map(s => {
          const label = `${s.song.name}${s.time !== null ? " · " + new Date(s.time).toLocaleDateString(undefined, { dateStyle: "medium" }) : ""}`;
          return <li key={s.song.id} style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            <button type="button" className="song-star" data-testid={`sky-star-${s.song.id}`} title={label} aria-label={`Open ${label}`}
              style={{ ["--star" as string]: `${s.r * 6}px`, ["--glow" as string]: s.glow }} onClick={() => open(s.song.id)}>
              <span className="song-star-core" aria-hidden="true"/>
              <span className="song-star-name" aria-hidden="true">{s.song.name}</span>
            </button>
          </li>;
        })}
      </ul>
    </div>}
  </section>;
}

export function SongSkyToggle({ mode, change }: { mode: "sky" | "list"; change: (mode: "sky" | "list") => void }) {
  return <div className="song-sky-toggle" role="group" aria-label="Library view">
    {(["sky", "list"] as const).map(m => <button key={m} type="button" data-testid={`toggle-library-${m}`} aria-pressed={mode === m} onClick={() => change(m)}>{m === "sky" ? "Sky" : "List"}</button>)}
  </div>;
}
