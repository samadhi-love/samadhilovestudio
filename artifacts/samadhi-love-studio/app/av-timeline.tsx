"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AVTransport } from "./av-transport";
import { anchorReviewMatches, audibleMixTracks, importSongLook, timelineLength, timelineProject, validAVSettings, validTimeline, type AVSettings, type VisualMapping } from "./av-timeline-data";
import { stemEnvelope, visualSignal } from "./av-signals";
import { midiTriggers } from "./av-midi";
import { renderMixBuffer, type MixTrack } from "./multitrack-audio";
import { videoThemes, captionFile, type LyricProject, type VideoFormat } from "./lyric-video-data";
import { drawProFrame } from "./lyric-pro-render";
import { exportProVideo, proVideoSize } from "./lyric-pro-export";
import { lrcFile, assetUrl } from "./lyric-pro-data";
import { CaptionTemplatePicker } from "./lyric-caption-picker";
import { getCaptionTemplate, loadCaptionFonts } from "./lyric-caption-templates";
import { LyricBackgroundPicker } from "./lyric-background-picker";
import { wavAudio } from "./recording-dsp";
import type { Song } from "./studio-data";

const clock = (v: number) => `${Math.floor(v / 60)}:${(v % 60).toFixed(1).padStart(4, "0")}`;
const names: Record<VideoFormat, string> = { wide: "YouTube · 16:9", vertical: "Reels / Shorts · 9:16", square: "Feed · 1:1" };
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000); }

export function AVTimeline({ active, tracks, settings, change, patchTrack, songs, projectId, title, disabled, onBusy, openLyrics }: {
  active: boolean; tracks: MixTrack[]; settings: AVSettings; change: (value: AVSettings) => void;
  patchTrack: (id: string, changes: Partial<MixTrack>) => void; songs: Song[]; projectId: string; title: string;
  disabled: boolean; onBusy: (value: boolean) => void;
  openLyrics?: (songId:string)=>void;
}) {
  const [position, setPosition] = useState(0), [playing, setPlaying] = useState(false), [creator, setCreator] = useState(false);
  const [error, setError] = useState(""), [status, setStatus] = useState(""), [assetsReady, setAssetsReady] = useState(false);
  const [assetError,setAssetError]=useState(""),[assetRetry,setAssetRetry]=useState(0);
  const [guides, setGuides] = useState(true), [clean, setClean] = useState(false), [batch, setBatch] = useState(false), [resolution, setResolution] = useState<720 | 1080>(720);
  const [progress, setProgress] = useState<number | null>(null), [results, setResults] = useState<{ url: string; name: string; codec: string }[]>([]);
  const [past, setPast] = useState<AVSettings[]>([]), [future, setFuture] = useState<AVSettings[]>([]);
  const [lyricSong, setLyricSong] = useState(projectId), [feedback, setFeedback] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null), engine = useRef<AVTransport | null>(null), images = useRef(new Map<string, HTMLImageElement>());
  const control = useRef<AbortController | null>(null), urls = useRef<string[]>([]), resultBytes = useRef(0), alive = useRef(true), playRequest = useRef(0);
  const duration = timelineLength(tracks), valid = validTimeline(tracks), busy = progress !== null, locked = disabled || busy;
  const project = useMemo(() => timelineProject(settings, tracks, title), [settings, tracks, title]);
  const envelopes = useMemo(() => new Map(tracks.map(t => [t.id, stemEnvelope(t.buffer)])), [tracks]);
  const current = useRef({ tracks, settings, project, title, position }); current.current = { tracks, settings, project, title, position };
  const editable = songs.filter(s => s.lyricVideo?.cues.length);
  const source = settings.lyricSource && songs.find(s => s.id === settings.lyricSource!.song);
  const sourceChanged = !!settings.lyricSource && (!source || ![source.audioId ?? source.id, ...(source.audioHistory?.map(a => a.audioId) ?? [])].includes(settings.lyricSource.audio));
  const anchorMissing = settings.look.cues.length > 0 && !tracks.some(t => t.id === settings.anchor);
  const mappingMissing = settings.mappings.some(m=>!m.source.startsWith("midi:")&&!tracks.some(t=>t.id===m.source));
  const midiMissing=settings.mappings.some(m=>m.source.startsWith("midi:"))&&!settings.midi.length;
  const reviewed=anchorReviewMatches(settings,tracks);
  const start = settings.range?.start ?? 0, end = settings.range?.end ?? duration;
  const exportReady = valid && audibleMixTracks(tracks).length > 0 && validAVSettings(settings) && !mappingMissing && !midiMissing && assetsReady && start >= 0 && end > start && end <= duration + .001 && (clean || (reviewed && !sourceChanged && !anchorMissing && project.cues.some(c=>c.time<end&&(c.end??duration)>start)));
  function edit(next: AVSettings) { setPast(h => [...h.slice(-19), settings]); setFuture([]); change(next); }
  function pause() { playRequest.current++; engine.current?.pause(); setPlaying(false); }
  async function play(from = position) {
    const token = ++playRequest.current;
    canvas.current?.closest(".av-workspace")?.parentElement?.querySelectorAll("audio").forEach(audio => audio.pause());
    try { setError(""); engine.current ??= new AVTransport(); await engine.current.play(current.current.tracks, from); if (alive.current && token === playRequest.current) setPlaying(engine.current.playing); }
    catch (e) { if (alive.current && token === playRequest.current) { setPlaying(false); setError(e instanceof Error ? e.message : "Playback could not start."); } }
  }
  function seek(time: number) { const wasPlaying = !!engine.current?.playing; engine.current?.seek(time); setPosition(time); if (wasPlaying) void play(time); }
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; playRequest.current++; control.current?.abort(); void engine.current?.close().catch(() => {}); engine.current = null; urls.current.forEach(url => URL.revokeObjectURL(url)); };
  }, []);
  useEffect(() => {
    const workspace = canvas.current?.closest(".av-workspace")?.parentElement;
    const stopForPreview = (event: Event) => { if (event.target instanceof HTMLAudioElement) pause(); };
    workspace?.addEventListener("play", stopForPreview, true);
    return () => workspace?.removeEventListener("play", stopForPreview, true);
  }, []);
  useEffect(() => { if (!active || disabled) { pause(); if (!active) { control.current?.abort(); const transport=engine.current; engine.current=null; void transport?.close().catch(()=>{}); } } }, [active, disabled]);
  useEffect(() => {
    if (engine.current?.playing) void play(engine.current.time);
    if (position > duration) setPosition(Math.max(0, duration));
  }, [tracks]);
  useEffect(() => {
    if (!active || !playing) return;
    const timer = setInterval(() => {
      const transport = engine.current; if (!transport) return;
      setPosition(transport.time);
      if (transport.time >= duration) { transport.pause(); setPlaying(false); }
    }, 33);
    return () => clearInterval(timer);
  }, [active, playing, duration]);
  const imageKeys = JSON.stringify([...new Set([[settings.look.theme,...settings.markers.map(m=>m.theme??settings.look.theme)].map(theme=>videoThemes[theme].image), [project.pro!.background,project.pro!.logo,...settings.markers.map(s=>s.background)].filter((s):s is string=>!!s).map(s=>assetUrl(project.pro!.sourceSongId,s))].flat().filter(Boolean))]);
  useEffect(() => {
    let current = true; setAssetsReady(false);setAssetError("");
    if (typeof Image === "undefined") return;
    const keys:string[]=JSON.parse(imageKeys);images.current=new Map([...images.current].filter(([key])=>keys.includes(key)));
    void Promise.all([loadCaptionFonts(), ...keys.map((key: string) => new Promise<void>((resolve, reject) => {
      if (images.current.has(key)) { resolve(); return; }
      const im = new Image(); im.onload = () => { if(current)images.current.set(key, im); resolve(); }; im.onerror = () => reject(new Error("A scene image could not load. Choose another background or retry.")); im.src = key;
    }))]).then(() => { if (current) setAssetsReady(true); }).catch(e => { if (current) setAssetError(e.message); });
    return () => { current = false; };
  }, [imageKeys,assetRetry]);
  useEffect(() => {
    if (!active || typeof CanvasRenderingContext2D === "undefined") return;
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const size = proVideoSize(settings.look.format, 720); ctx.canvas.width = size.width; ctx.canvas.height = size.height;
    drawProFrame(ctx, position, project, title, images.current, { clean, guides: guides && !creator, signal: visualSignal(position, settings, tracks, envelopes), separateVocals: true });
    if (creator) {
      ctx.save(); ctx.fillStyle = "#080c19d9"; ctx.fillRect(0, 0, size.width, size.height * .18); ctx.fillStyle = "#fff8df";
      ctx.font = `600 ${size.width * .023}px system-ui`; ctx.textAlign = "left";
      ctx.fillText(`${title} · ${settings.bpm} BPM${settings.key ? " · " + settings.key : ""} · ${clock(position)}`, size.width * .04, size.height * .055, size.width * .92);
      tracks.forEach((t, i) => { const level = visualSignal(position, { ...settings, mappings: [{ id: "meter", source: t.id, feature: "energy", target: "light", amount: 1 }] }, tracks, envelopes).light;
        const x = size.width * (.04 + i * .15); ctx.fillStyle = "#fff3"; ctx.fillRect(x, size.height * .085, size.width * .12, size.height * .016); ctx.fillStyle = "#b7e5cd"; ctx.fillRect(x, size.height * .085, size.width * .12 * level, size.height * .016);
        ctx.fillStyle = "#fff"; ctx.font = `${size.width * .014}px system-ui`; ctx.fillText(t.name, x, size.height * .14, size.width * .13);
      }); ctx.restore();
      ctx.save(); ctx.fillStyle="#080c19bf"; ctx.fillRect(0,size.height*.18,size.width,size.height*.08); ctx.strokeStyle="#d9c9a2"; ctx.lineWidth=1.5; ctx.beginPath();
      const audible=audibleMixTracks(tracks);
      for(let i=0;i<256;i++){const t=position+(i/256-.5)*.05;let sample=0;for(const stem of audible){const source=t-stem.at+stem.start;if(source<stem.start||source>=stem.end)continue;const frame=Math.floor(source*stem.buffer.sampleRate);sample+=(stem.buffer.getChannelData(0)[frame]??0)*stem.level/Math.max(1,audible.length);}const x=size.width*(.04+i/256*.92),y=size.height*(.22-Math.max(-1,Math.min(1,sample))*.035);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();ctx.font=`${size.width*.012}px system-ui`;ctx.fillStyle="#ddd";ctx.textAlign="left";ctx.fillText("Input waveform · relative stem activity",size.width*.04,size.height*.25);ctx.restore();
    }
  }, [active, position, project, settings, tracks, envelopes, guides, clean, creator, assetsReady, title]);
  async function importMidi(file: File) {
    try { const midi = midiTriggers(new Uint8Array(await file.arrayBuffer())); edit({ ...settings, midi }); setStatus(`${midi.length} MIDI note triggers imported using the file's tempo map.`); }
    catch (e) { setError(e instanceof Error ? e.message : "MIDI could not import."); }
  }
  async function exportVideo() {
    if (!exportReady || control.current) return;
    pause(); setError(""); setStatus("Rendering the current mix. Originals and session settings stay unchanged.");
    const task = new AbortController(); control.current = task; setProgress(0); onBusy(true);
    let audioUrl = "";
    const snapshot = structuredClone(settings), mix = tracks.map(t => ({ ...t }));
    try {
      if (!validAVSettings(snapshot)) throw new Error("Check visual settings and timeline notes before exporting.");
      const audio = await renderMixBuffer(mix, { signal: task.signal, length: duration });
      audioUrl = URL.createObjectURL(wavAudio(audio.getChannelData(0), audio.getChannelData(1)));
      const formats: VideoFormat[] = batch ? ["wide", "vertical", "square"] : [snapshot.look.format];
      let totalBytes = resultBytes.current;
      for (let i = 0; i < formats.length; i++) {
        task.signal.throwIfAborted(); const format = formats[i], drawing = timelineProject(snapshot, mix, title, format, !clean);
        setStatus(`Encoding ${names[format]}. Keep this tab visible; rendering stops when the page closes.`);
        const output = await exportProVideo({ audio, audioUrl, start, end, intro: 0, outro: 0, format, resolution, signal: task.signal,
          paint: (ctx, elapsed) => drawProFrame(ctx, start + elapsed, drawing, title, images.current, { clean, signal: visualSignal(start + elapsed, snapshot, mix, envelopes), separateVocals: true }) }, fraction => setProgress((i + fraction) / formats.length));
        totalBytes += output.blob.size;
        if (totalBytes > 180 * 1024 * 1024) throw new Error("These results exceed the 180 MiB preview-download budget. Download completed files, then export remaining formats separately or choose a shorter excerpt.");
        resultBytes.current = totalBytes;
        const url = URL.createObjectURL(output.blob); urls.current.push(url);
        if (alive.current) setResults(items => [...items, { url, name: `${title.replace(/[\\/:*?"<>|]/g, "-")}-${format}.${output.extension}`, codec: output.codec }]);
      }
      setStatus("Video ready. Use the download links below. Save the editable mixer session to keep this look, mappings and production notes in your account.");
    } catch (e) { if (alive.current) setError(task.signal.aborted ? "Export canceled. The editable project and completed downloads are preserved." : e instanceof Error ? e.message : "Video export could not finish. Your project is preserved."); }
    finally { if (audioUrl) URL.revokeObjectURL(audioUrl); control.current = null; if (alive.current) { setProgress(null); onBusy(false); } }
  }
  const scene = project.pro!.sections.findLast(s => s.time <= position && s.end > position);
  return <section className={`av-workspace${creator ? " av-creator" : ""}`} aria-label="Audio visual timeline">
    <header className="av-top"><div><p className="eyebrow">CONNECTED PRODUCTION</p><h2>Audio + Visual Studio</h2><p>Mix, lyrics and scenes share one playhead. Save this workspace with your editable mixer session.</p></div>
      <button type="button" className="secondary" onClick={() => setCreator(v => !v)}>{creator ? "Return to editor" : "Creator view"}</button></header>
    <div className="av-layout"><div className="av-preview"><canvas ref={canvas} aria-label="Synchronized music video preview" style={{ aspectRatio: settings.look.format === "wide" ? "16/9" : settings.look.format === "square" ? "1" : "9/16" }}/>
      <div className="av-transport"><button type="button" className="primary" disabled={locked || !valid} onClick={() => playing ? pause() : void play()}>{playing ? "Pause mix" : "Play mix + visuals"}</button><button type="button" className="secondary" disabled={busy} onClick={() => { pause(); engine.current?.seek(0); setPosition(0); }}>Start</button><output>{clock(position)} / {clock(Math.max(0, duration))}</output>{scene && <span>{scene.name}</span>}</div>
      <label className="field">Shared playhead<input aria-label="Audio visual playhead" type="range" min={0} max={Math.max(.05, duration)} step={.01} value={Math.min(position, Math.max(.05, duration))} disabled={locked || !valid} onChange={e => seek(Number(e.target.value))}/></label>
      <p className="muted">Preview has protective headroom; export uses the existing mix peak normalization. Track edits reschedule playback at the current playhead. Effect tails are omitted after the timeline end.</p>
    </div><aside className="av-inspector"><fieldset disabled={locked}>
      <label className="field">Output format<select value={settings.look.format} onChange={e => edit({ ...settings, look: { ...settings.look, format: e.target.value as VideoFormat } })}>{Object.entries(names).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label>
      <label className="checkline"><input type="checkbox" checked={guides} onChange={e => setGuides(e.target.checked)}/> Preview safe-area guide</label>
      <div className="actions"><button type="button" className="secondary small" disabled={!past.length} onClick={() => { const previous = past.at(-1)!; setPast(h => h.slice(0, -1)); setFuture(h => [...h, settings]); change(previous); }}>Undo look</button><button type="button" className="secondary small" disabled={!future.length} onClick={() => { const next = future.at(-1)!; setFuture(h => h.slice(0, -1)); setPast(h => [...h, settings]); change(next); }}>Redo look</button></div>
      <h3>Stem → visual mappings</h3><p className="muted">Choose an actual stem. Attacks measure energy changes; they do not identify instruments automatically.</p>
      {settings.mappings.map(m => <div className="av-mapping" key={m.id}>
        <label>Source<select aria-label="Visual trigger source" value={m.source} onChange={e => edit({ ...settings, mappings: settings.mappings.map(v => v.id === m.id ? { ...v, source: e.target.value } : v) })}><option value="">Choose stem</option>{tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}<option value="midi:all">MIDI · all notes</option><option value="midi:kick">MIDI · kick 35/36</option><option value="midi:snare">MIDI · snare 38/40</option></select></label>
        <label>Signal<select value={m.feature} onChange={e => edit({ ...settings, mappings: settings.mappings.map(v => v.id === m.id ? { ...v, feature: e.target.value as VisualMapping["feature"] } : v) })}><option value="energy">Energy</option><option value="attack">Attacks</option></select></label>
        <label>Visual<select value={m.target} onChange={e => edit({ ...settings, mappings: settings.mappings.map(v => v.id === m.id ? { ...v, target: e.target.value as VisualMapping["target"] } : v) })}><option value="camera">Background camera pulse</option><option value="light">Soft light</option><option value="lyrics">Lyric scale</option><option value="color">Background hue</option></select></label>
        <label>Amount<input type="range" min={0} max={1} step={.05} value={m.amount} onChange={e => edit({ ...settings, mappings: settings.mappings.map(v => v.id === m.id ? { ...v, amount: Number(e.target.value) } : v) })}/></label><button type="button" className="text-button" onClick={() => edit({ ...settings, mappings: settings.mappings.filter(v => v.id !== m.id) })}>Remove mapping</button>
      </div>)}
      <button type="button" className="secondary small" disabled={!tracks.length || settings.mappings.length >= 12} onClick={() => edit({ ...settings, mappings: [...settings.mappings, { id: crypto.randomUUID(), source: tracks[0].id, feature: "attack", target: "light", amount: .5 }] })}>Add stem mapping</button>
      <label className="field">Import MIDI triggers<input type="file" accept=".mid,.midi" onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void importMidi(file); }}/></label>{settings.midi.length > 0 && <p>{settings.midi.length} MIDI note events · tempo-map timestamps stay fixed when the BPM field changes. <button type="button" className="text-button" onClick={() => edit({ ...settings, midi: [] })}>Clear MIDI</button></p>}
    </fieldset></aside></div>
    <fieldset disabled={locked} className="av-lanes"><legend>Shared audio / lyric / scene timeline</legend>
      {tracks.map(t => <div className="av-lane" key={t.id}><strong>{t.name}</strong><svg viewBox="0 0 600 30" preserveAspectRatio="none" aria-label={t.name + " timeline"}><rect x={duration ? t.at / duration * 600 : 0} y={2} width={duration ? (t.end - t.start) / duration * 600 : 0} height={26} rx={4} fill="#bd9c5955"/>{t.peaks.map((p,i)=>{const sourceTime=i/t.peaks.length*t.buffer.duration;if(sourceTime<t.start||sourceTime>=t.end)return null;const x=(t.at+sourceTime-t.start)/Math.max(.01,duration)*600;return <line key={i} x1={x} x2={x} y1={15-p*12} y2={15+p*12} stroke="#8c7256"/>;})}<line x1={position / Math.max(.01, duration) * 600} x2={position / Math.max(.01, duration) * 600} y1={0} y2={30} stroke="#9664ce"/></svg>
        <label>At<input aria-label={t.name + " placement"} type="number" min={0} max={480} step={.01} value={t.at} onChange={e => patchTrack(t.id, { at: Number(e.target.value) })}/></label><label>In<input type="number" min={0} max={t.end} step={.01} value={t.start} onChange={e => patchTrack(t.id, { start: Number(e.target.value) })}/></label><label>Out<input type="number" min={t.start} max={t.buffer.duration} step={.01} value={t.end} onChange={e => patchTrack(t.id, { end: Number(e.target.value) })}/></label><label>Level<input type="range" min={0} max={1.5} step={.05} value={t.level} onChange={e => patchTrack(t.id, { level: Number(e.target.value) })}/></label><label><input type="checkbox" checked={t.mute} onChange={e => patchTrack(t.id, { mute: e.target.checked })}/>Mute</label><label><input type="checkbox" checked={t.solo} onChange={e => patchTrack(t.id, { solo: e.target.checked })}/>Solo</label></div>)}
      {!tracks.length && <p>Add a recording or import stems below to start the shared timeline.</p>}
      {!!settings.midi.length && <div className="av-midi-lane"><strong>MIDI note triggers</strong><svg viewBox="0 0 600 30" preserveAspectRatio="none" aria-label="MIDI note events on the mix timeline">{settings.midi.filter(n=>n.time<=duration).map((n,i)=><line key={i} x1={n.time/Math.max(.01,duration)*600} x2={n.time/Math.max(.01,duration)*600} y1={28-n.velocity*24} y2={28} stroke={n.channel===9?"#a68246":"#8c64bb"} strokeWidth={1.5}/>)}</svg></div>}
      {!!project.pro!.sections.length && <div className="av-cue-lane av-scene-lane">{project.pro!.sections.map(s=><button key={s.id} type="button" onClick={()=>seek(s.time)}>{clock(s.time)} · {s.name}{s.theme?" · "+videoThemes[s.theme].title:""}</button>)}</div>}

      {!!project.cues.length && <div className="av-cue-lane">{project.cues.map((c, i) => <button type="button" key={i} onClick={() => seek(c.time)} title={`${clock(c.time)} · ${c.role ?? "lead"}`}>{clock(c.time)} · {c.text}</button>)}</div>}
    </fieldset>
    <details className="av-details"><summary>Lyrics, scenes &amp; design</summary><fieldset disabled={locked}>
      <div className="field-grid"><label className="field">Saved timed lyric project<select value={lyricSong} onChange={e => setLyricSong(e.target.value)}><option value="">Choose a song with saved captions</option>{editable.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="field">Vocal timing anchor<select value={settings.anchor ?? ""} onChange={e => edit({ ...settings, anchor: e.target.value || undefined, reviewed: false })}><option value="">Choose the matching vocal track</option>{tracks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></div>
      <button type="button" className="secondary" disabled={!editable.some(s=>s.id===lyricSong)} onClick={() => { try { const song = editable.find(s => s.id === lyricSong); if (song) { edit(importSongLook(settings, song, settings.anchor)); setStatus("Saved captions copied into this session. Choose the matching vocal anchor, listen and review. Original song captions are unchanged."); } } catch (e) { setError(e instanceof Error ? e.message : "Lyrics could not load."); } }}>Use saved lyrics &amp; look</button>
      {openLyrics && (lyricSong||projectId) && <button type="button" className="secondary" onClick={()=>openLyrics(lyricSong||projectId)}>Open existing caption alignment tools</button>}
      <p className="muted">The anchor must contain the same performance used for alignment. Moving or trimming it shifts copied captions and linked sections automatically. Changed words, time-stretching or replacement audio require fresh alignment in Lyric Video Pro. No automatic recognition is run here.</p>
      <label className="checkline"><input type="checkbox" disabled={anchorMissing || !settings.look.cues.length || sourceChanged} checked={reviewed} onChange={e => {const anchor=tracks.find(t=>t.id===settings.anchor);edit({ ...settings, reviewed: e.target.checked, reviewedAnchor:anchor?{id:anchor.id,start:anchor.start,end:anchor.end}:undefined });}}/> I listened and reviewed lyric timing against this vocal track.</label>
      {settings.look.cues.length > 0 && <p>Lead lines use the main caption style; saved ad-lib and backing labels use smaller independent callouts. Unlabeled parts are not automatically separated.</p>}
      <CaptionTemplatePicker value={settings.look.captionTemplate} disabled={locked} choose={id => { const template = getCaptionTemplate(id); edit({ ...settings, look: { ...settings.look, captionTemplate: id, ...(template ? { font: template.font, color: template.color } : {}) } }); }}/>
      <LyricBackgroundPicker project={settings.look} time={position} disabled={locked} change={look => { const {pro,...visual}=look; edit({ ...settings, look:visual, background:undefined, markers:settings.markers.map(m=>({...m,theme:undefined,background:undefined})) }); }}/>
      <div className="field-grid">{(["position", "size"] as const).map(key => <label className="field" key={key}>{key === "position" ? "Caption position" : "Caption size"} · {names[settings.look.format]}<input type="range" min={key === "position" ? .25 : .65} max={key === "position" ? .82 : 1.6} step={.01} value={(settings.layouts?.[settings.look.format] ?? project.pro!.look)[key]} onChange={e => edit({ ...settings, layouts: { ...settings.layouts, [settings.look.format]: { ...(settings.layouts?.[settings.look.format] ?? project.pro!.look), [key]: Number(e.target.value) } } })}/></label>)}</div>
      <h3>Section scenes</h3><p className="muted">Keep one caption style across cuts. Imported sections use vocal-source time and follow their anchor; new sections use mix time. Overlapping sections use the latest starting section.</p>
      {settings.markers.map(m => <div className="av-marker" key={m.id}><input aria-label="Section name" maxLength={100} value={m.name} onChange={e => edit({ ...settings, markers: settings.markers.map(v => v.id === m.id ? { ...v, name: e.target.value } : v) })}/><label>Start<input type="number" min={0} max={480} step={.01} value={m.time} onChange={e => edit({ ...settings, markers: settings.markers.map(v => v.id === m.id ? { ...v, time: Number(e.target.value) } : v) })}/></label><label>End<input type="number" min={0} max={480} step={.01} value={m.end} onChange={e => edit({ ...settings, markers: settings.markers.map(v => v.id === m.id ? { ...v, end: Number(e.target.value) } : v) })}/></label><select aria-label="Section scene" value={m.theme ?? ""} onChange={e => edit({ ...settings, markers: settings.markers.map(v => v.id === m.id ? { ...v, theme: e.target.value as LyricProject["theme"] || undefined } : v) })}><option value="">Global background</option>{Object.entries(videoThemes).map(([key, v]) => <option key={key} value={key}>{v.title}</option>)}</select>{m.anchor && <span>Vocal-source timing</span>}<button type="button" className="text-button" onClick={() => edit({ ...settings, markers: settings.markers.filter(v => v.id !== m.id) })}>Remove section</button></div>)}
      <button type="button" className="secondary small" disabled={!duration || settings.markers.length >= 40 || position >= duration} onClick={() => edit({ ...settings, markers: [...settings.markers, { id: crypto.randomUUID(), name: "New section", time: position, end: Math.min(duration, position + 16) }] })}>Add section at playhead</button>
    </fieldset></details>
    <details className="av-details"><summary>Production notes, feedback &amp; split plan</summary><fieldset disabled={locked}><div className="field-grid"><label className="field">BPM<input type="number" min={40} max={240} value={settings.bpm} onChange={e => edit({ ...settings, bpm: Number(e.target.value) })}/></label><label className="field">Key / chord notes<input maxLength={40} value={settings.key} onChange={e => edit({ ...settings, key: e.target.value })} placeholder="e.g. D minor · Dm–Bb–F–C"/></label></div><p className="muted">Key/chord notes are manually supplied, not automatic chord recognition. Notes below are private session notes, not multiplayer comments.</p>
      <label className="field">Feedback at {clock(position)}<input maxLength={500} value={feedback} onChange={e => setFeedback(e.target.value)}/></label><button type="button" className="secondary small" disabled={!feedback.trim() || settings.feedback.length >= 60} onClick={() => { edit({ ...settings, feedback: [...settings.feedback, { id: crypto.randomUUID(), time: position, text: feedback.trim(), resolved: false }] }); setFeedback(""); }}>Add timestamped note</button>
      {settings.feedback.map(f => <div className="av-note" key={f.id}><button type="button" className="text-button" onClick={() => seek(f.time)}>{clock(f.time)}</button><span>{f.text}</span><label><input type="checkbox" checked={f.resolved} onChange={e => edit({ ...settings, feedback: settings.feedback.map(v => v.id === f.id ? { ...v, resolved: e.target.checked } : v) })}/>Resolved</label><button type="button" className="text-button" onClick={() => edit({ ...settings, feedback: settings.feedback.filter(v => v.id !== f.id) })}>Remove</button></div>)}
      <h3>Collaborator split plan</h3>{settings.splits.map((p, i) => <div className="av-split" key={i}><input aria-label="Collaborator name" value={p.name} maxLength={100} onChange={e => edit({ ...settings, splits: settings.splits.map((v, j) => j === i ? { ...v, name: e.target.value } : v) })}/><label>Percent<input type="number" min={0} max={100} value={p.percent} onChange={e => edit({ ...settings, splits: settings.splits.map((v, j) => j === i ? { ...v, percent: Number(e.target.value) } : v) })}/></label><button type="button" className="text-button" onClick={() => edit({ ...settings, splits: settings.splits.filter((_, j) => j !== i) })}>Remove</button></div>)}<button type="button" className="secondary small" disabled={settings.splits.length >= 12} onClick={() => edit({ ...settings, splits: [...settings.splits, { name: "Collaborator", percent: 0 }] })}>Add collaborator</button><p>Total: {settings.splits.reduce((sum, p) => sum + p.percent, 0).toFixed(2)}%. This is a planning record; it has no signatures and is not an executed split agreement.</p>
      <button type="button" className="secondary" disabled={!validAVSettings(settings)} onClick={() => download(new Blob([JSON.stringify({ schema: "samadhi-production-notes/v1", title, bpm: settings.bpm, key: settings.key, markers: settings.markers, feedback: settings.feedback, splits: settings.splits }, null, 2)], { type: "application/json" }), "production-notes.json")}>Download production notes</button>
    </fieldset></details>
    <details className="av-details" open><summary>Export this audio + visual arrangement</summary><fieldset disabled={locked}><div className="field-grid"><label className="field">Resolution<select value={resolution} onChange={e => setResolution(Number(e.target.value) as 720 | 1080)}><option value={720}>720p · lower memory</option><option value={1080}>1080p</option></select></label><label className="checkline"><input type="checkbox" checked={batch} onChange={e => setBatch(e.target.checked)}/> All three formats, one arrangement</label><label className="checkline"><input type="checkbox" checked={clean} onChange={e => setClean(e.target.checked)}/> Clean video without lyrics</label></div>
      <label className="checkline"><input type="checkbox" checked={!!settings.range} onChange={e => edit({ ...settings, range: e.target.checked ? { start: 0, end: Math.max(.05, duration) } : undefined })}/> Export a promotional excerpt</label>{settings.range && <div className="field-grid"><label className="field">Clip start<input type="number" min={0} max={duration} step={.01} value={start} onChange={e => edit({ ...settings, range: { start: Number(e.target.value), end } })}/></label><label className="field">Clip end<input type="number" min={0} max={duration} step={.01} value={end} onChange={e => edit({ ...settings, range: { start, end: Number(e.target.value) } })}/></label></div>}
      <button type="button" className="primary" disabled={!exportReady} onClick={() => void exportVideo()}>Render music video</button><div className="actions">{(["srt", "vtt", "lrc"] as const).map(format => <button type="button" key={format} className="secondary small" disabled={!project.cues.length || end <= start || end > duration} onClick={() => download(new Blob([format === "lrc" ? lrcFile(project.cues, start, end) : captionFile(project.cues, start, end, format)], { type: "text/plain;charset=utf-8" }), `lyrics.${format}`)}>{format.toUpperCase()}</button>)}</div>
    </fieldset><p className="muted">The video encodes the current mix, scenes, captions and stem/MIDI effects together. MP4/H.264/AAC is used when this browser supports it; supported fallback may be WebM. Export runs in this visible tab and does not continue after closing it. Downloaded caption files retain timing, not visual styling. Safe guides and Creator meters are preview-only.</p></details>
    {(!valid && tracks.length > 0) && <p role="alert" className="notice">A track trim or placement is invalid. Keep each track inside its original recording and the eight-minute timeline.</p>}
    {settings.reviewed && !reviewed && !anchorMissing && <p role="alert" className="notice">The vocal trim changed. Listen again and review boundary words before confirming lyric timing.</p>}
    {(anchorMissing || sourceChanged) && <p role="alert" className="notice">Choose the matching vocal anchor or realign the changed source before exporting lyrics.</p>}
    {mappingMissing && <p role="alert" className="notice">A mapping refers to a removed stem. Choose an available source or remove that mapping before export.</p>}
    {midiMissing && <p role="alert" className="notice">A MIDI mapping needs imported note events. Import a MIDI file or remove that mapping before export.</p>}
    {!validAVSettings(settings) && <p role="alert" className="notice">Check section names and times, BPM, and collaborator names/percentages. Split totals must stay at or below 100%.</p>}
    {progress !== null && <div className="av-progress"><progress max={1} value={progress}/><span>{Math.round(progress * 100)}%</span><button type="button" className="secondary" onClick={() => { control.current?.abort(); setStatus("Cancellation requested. The current audio-render step may finish before stopping."); }}>Cancel export</button></div>}
    {status && <p role="status">{status}</p>}{error && <p role="alert" className="notice">{error}</p>}
    {assetError && <p role="alert" className="notice">{assetError} <button type="button" className="secondary small" disabled={busy} onClick={()=>setAssetRetry(v=>v+1)}>Retry scene assets</button></p>}
    {results.map((r, i) => <p key={i}><a className="primary small" href={r.url} download={r.name}>Download {r.name}</a> <small>{r.codec}</small></p>)}
    {!!results.length && <button type="button" className="text-button" disabled={busy} onClick={() => { urls.current.forEach(url=>URL.revokeObjectURL(url)); urls.current=[]; resultBytes.current=0; setResults([]); }}>Clear completed downloads to free memory</button>}
  </section>;
}
