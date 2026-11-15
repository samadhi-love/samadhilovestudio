"use client";

import { useEffect, useRef, useState } from "react";
import { isExplicitSong } from "./clean-content";
import { pinnedMaster, projectMembers, projectRoot } from "./project-assets";
import { maxAudioBytes, songAudioUrl, type Song } from "./studio-data";

export function averageLevel(buffer: AudioBuffer) {
  let sum = 0, count = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < samples.length; i += 16) { sum += samples[i] ** 2; count++; }
  }
  return Math.sqrt(sum / Math.max(1, count));
}
export function matchedGains(levels: number[]) {
  const target = Math.min(...levels.filter(n => n > 0.000001));
  return levels.map(n => n > 0.000001 && Number.isFinite(target) ? Math.min(1, target / n) : 0);
}

export function ProjectAssets({ songs, song, open }: { songs: Song[]; song: Song; open: (id: string) => void }) {
  const root = projectRoot(songs, song), members = projectMembers(songs, root);
  const master = pinnedMaster(songs, root);
  return <section className="panel form-panel project-assets"><div className="section-head"><h2>Project · {root.name}</h2>
    {root.id !== song.id && <button type="button" className="secondary small" onClick={() => open(root.id)}>Open original project</button>}</div>
    <p className="muted">{master ? `Final master: ${master.song.name} · pinned recording version` : "Choose a final recording in Mix Lab before preparing your release package."}</p>
    {members.length > 1 && <div className="actions">{members.map(member => <button type="button" key={member.id} className="secondary small" disabled={member.id === song.id} onClick={() => open(member.id)}>{member.name}{member.id === root.id ? " · Original" : " · Mix"}</button>)}</div>}
    <p className="muted">Lyrics, related mixes, video projects, and release planning stay linked through this project. Original recordings are preserved.</p>
  </section>;
}

export function ProjectComparison({ songs, song, saving, save }: { songs: Song[]; song: Song; saving: boolean; save: (song: Song, message?: string) => Promise<boolean> }) {
  const root = projectRoot(songs, song);
  const recordings = projectMembers(songs, root).filter(s => s.audioFormat && !isExplicitSong(s));
  const [left, setLeft] = useState(recordings[0]?.id ?? "");
  const [right, setRight] = useState(recordings[1]?.id ?? "");
  const [side, setSide] = useState<0 | 1>(0);
  const [match, setMatch] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(0);
  const [error, setError] = useState("");
  const engine = useRef<{ context: AudioContext; buffers: AudioBuffer[]; levels: number[]; sources: AudioBufferSourceNode[]; gains: GainNode[]; offset: number; started: number; playing: boolean; generation: number } | null>(null);
  const request = useRef<AbortController | null>(null);
  function pause() {
    const e = engine.current;
    if (e?.playing) { e.offset = Math.max(0, Math.min(length, e.offset + e.context.currentTime - e.started)); e.playing = false; e.generation++; }
    e?.sources.forEach(s => { s.onended = null; try { s.stop(); } catch {} s.disconnect(); });
    e?.gains.forEach(g => g.disconnect());
    if (e) { e.sources = []; setPosition(e.offset); }
    setPlaying(false);
  }
  useEffect(() => {
    request.current?.abort(); pause();
    const e = engine.current; engine.current = null; void e?.context.close();
    setReady(false); setLength(0); setPosition(0); setError(""); setBusy(false);
    return () => { request.current?.abort(); const current = engine.current; engine.current = null; if (current) void current.context.close(); };
  }, [left, right, songs.find(s => s.id === left)?.audioId, songs.find(s => s.id === right)?.audioId]);
  useEffect(() => {
    const e = engine.current; if (!e) return;
    const gains = match ? matchedGains(e.levels) : [1, 1];
    e.gains.forEach((node, index) => node.gain.setTargetAtTime(index === side ? gains[index] : 0, e.context.currentTime, 0.008));
  }, [side, match, ready, playing]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => { const e = engine.current; if (e?.playing) setPosition(Math.max(0, Math.min(length, e.offset + e.context.currentTime - e.started))); }, 100);
    return () => clearInterval(timer);
  }, [playing, length]);
  async function prepare() {
    if (busy || !left || !right || left === right) return;
    pause();
    const controller = new AbortController(); request.current = controller; setBusy(true); setError("");
    const context = new AudioContext();
    try {
      const buffers: AudioBuffer[] = [];
      for (const id of [left, right]) {
        const item = recordings.find(s => s.id === id); if (!item) throw new Error("Choose two available project recordings.");
        const response = await fetch(songAudioUrl(item.id, item.audioId), { signal: controller.signal });
        if (!response.ok) throw new Error("A comparison recording could not load.");
        const blob = await response.blob(); if (blob.size > maxAudioBytes) throw new Error("The comparison recording exceeds the audio limit.");
        buffers.push(await context.decodeAudioData(await blob.arrayBuffer())); controller.signal.throwIfAborted();
      }
      const duration = Math.min(...buffers.map(b => b.duration));
      if (!duration) throw new Error("Both recordings need playable audio.");
      const previous = engine.current; if (previous) await previous.context.close();
      engine.current = { context, buffers, levels: buffers.map(averageLevel), sources: [], gains: [], offset: 0, started: 0, playing: false, generation: 0 };
      setLength(duration); setReady(true);
    } catch (e) { await context.close(); if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Comparison could not load."); }
    finally { if (request.current === controller) { request.current = null; setBusy(false); } }
  }
  async function play() {
    const e = engine.current; if (!e || e.playing) return;
    e.playing = true;
    try {
      await e.context.resume();
      if (e.offset >= length) e.offset = 0;
      const token = ++e.generation; const start = e.context.currentTime + 0.04;
      e.sources = []; e.gains = []; e.started = start; e.playing = true;
      const levels = match ? matchedGains(e.levels) : [1, 1];
      e.buffers.forEach((buffer, index) => {
        const source = e.context.createBufferSource(), gain = e.context.createGain();
        source.buffer = buffer; gain.gain.value = index === side ? levels[index] : 0;
        source.connect(gain).connect(e.context.destination);
        if (index === 0) source.onended = () => { if (e.generation === token && engine.current === e) { e.playing = false; e.offset = 0; e.sources.forEach(s => s.disconnect()); e.gains.forEach(g => g.disconnect()); setPosition(0); setPlaying(false); } };
        source.start(start, e.offset, length - e.offset); e.sources.push(source); e.gains.push(gain);
      }); setPlaying(true);
    } catch { pause(); setError("Playback could not start. Try again."); }
  }
  const master = pinnedMaster(songs, root);
  return <section className="panel form-panel"><h2>Audio A/B & final master</h2>
    <p className="muted">Compare related recordings at the same time position. Average-level matching reduces the louder recording; it is not LUFS mastering. Comparison ends at the shorter recording.</p>
    <div className="field-grid">{([left, right] as const).map((value, i) => <label className="field" key={i}>Recording {i === 0 ? "A" : "B"}<select value={value} disabled={busy} onChange={e => (i === 0 ? setLeft : setRight)(e.target.value)}><option value="">Choose recording</option>{recordings.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>)}</div>
    <div className="actions"><button type="button" className="secondary" disabled={busy || !left || !right || left === right} onClick={prepare}>{busy ? "Loading audio…" : "Prepare A/B"}</button>
      <label className="checkline"><input type="checkbox" checked={match} onChange={e => setMatch(e.target.checked)}/> Match average level</label>
      {ready && <><button type="button" className="primary" onClick={() => playing ? pause() : void play()}>{playing ? "Pause comparison" : "Play comparison"}</button>{([0, 1] as const).map(i => <button key={i} type="button" className="secondary" aria-pressed={side === i} onClick={() => setSide(i)}>Listen to {i === 0 ? "A" : "B"}</button>)}</>}</div>
    {ready && <label className="field">Shared playhead · {position.toFixed(1)} / {length.toFixed(1)} seconds<input type="range" min={0} max={length} step={0.1} value={position} onChange={e => { pause(); const at = Number(e.target.value); if (engine.current) engine.current.offset = at; setPosition(at); }}/></label>}
    <div className="actions">{recordings.map(recording => <button key={recording.id} type="button" className="secondary small" disabled={saving || (master?.song.id === recording.id && master.audioId === (recording.audioId ?? recording.id))} onClick={() => void save({ ...root, master: { songId: recording.id, audioId: recording.audioId ?? recording.id } }, "Final master selected")}>Use {recording.name} as final master</button>)}</div>
    <p className="muted">{master ? `Final master: ${master.song.name}. This recording version is pinned; replacing audio will not silently change your master.` : "No final master selected. Save related renders to this project to compare and select them."}</p>
    {error && <p className="notice" role="alert">{error}</p>}
  </section>;
}
