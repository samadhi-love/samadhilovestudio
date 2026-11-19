"use client";
import { RecoveryPanel, useDraftRecovery } from "../draft-recovery";

import { useCallback, useEffect, useRef, useState } from "react";
import { HelpControl, HelpField } from "../help-tip";
import { AudioPlayer } from "../audio-player";
import { sampleRate, wavAudio, waveform } from "../recording-dsp";
import { audioAccept, maxAudioBytes, songAudioUrl, type Song } from "../studio-data";
import { hasExplicitWords } from "../clean-content";
import { assertAudioBudget, recordedPlacement } from "../audio-resource";
import { projectRoot } from "../project-assets";
import { AudioMeasurements } from "../audio-measurements-panel";
import { MyVoicePicker } from "../my-voice-picker";
import { LayerOverSong } from "../layer-over-song";
import { myVoiceUrl, detectVoiceMime } from "../my-voice-data";
import { Capture } from "./capture";
import { EffectsPanel } from "./effects-panel";
import { audibleClips, mixLength, renderVocal, stereoWav } from "./render";
import { ClipControls, ClipTimeline } from "./timeline";
import { encodeMp3 } from "./mp3";
import { TuningPanel } from "./tuning-panel";
import { dry, emptySession, maxClips, maxSources, maxSourceSeconds, noTuning, sessionSeconds, splitClip, type Clip, type Role, type Session } from "./session";
import { allSessions, sessionRequest, sessionUrl, writeSession, type SessionSummary } from "./storage";

type Props = {
  active: boolean; songs: Song[]; projects?: Song[]; initialSongId: string; saving: boolean;
  onCapture: (active: boolean) => void;
  publish: (file: File, title: string, projectId?: string, sessionId?: string) => Promise<string | undefined>;
  sendMix: (blob: Blob, title: string, projectId?: string) => void;
  input: { blob: Blob; title: string; role: Role; projectId?: string } | null;
  openSong: (id: string, step: "production" | "lyrics" | "video" | "release") => void;
  /** Opens Mix & Edit with this original take and the chosen song as two tracks. */
  layerOverSong?: (blob: Blob, title: string, songId: string) => void;
};

type AudioSource = { buffer: AudioBuffer; blob: Blob; peaks: number[] };
async function decode(blob: Blob): Promise<AudioSource> {
  if (!blob.size || blob.size > maxAudioBytes) throw new Error("Choose an audio file up to 96 MB.");
  const context = new AudioContext({ sampleRate });
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    if (buffer.duration < 0.05 || buffer.duration > sessionSeconds + 0.1)
      throw new Error("Choose a recording between 0.05 seconds and eight minutes.");
    return { buffer, blob, peaks: waveform(buffer.getChannelData(0), 96) };
  } catch (error) {
    if (error instanceof DOMException) throw new Error("This browser could not decode that recording. Try MP3 or PCM WAV.");
    throw error;
  } finally { await context.close(); }
}

export function Wave({ peaks, label }: { peaks: number[]; label: string }) {
  return <svg className="record-wave" viewBox="0 0 384 48" preserveAspectRatio="none" role="img" aria-label={label}>
    <line x1="0" x2="384" y1="24" y2="24" stroke="currentColor"/>
    {peaks.map((peak, i) => <line key={i} x1={i * 384 / peaks.length} x2={i * 384 / peaks.length} y1={24 - peak * 22} y2={24 + peak * 22} stroke="currentColor" strokeWidth="2"/>)}
  </svg>;
}

export function VocalStudio({ active, songs, projects = songs, initialSongId, onCapture, saving, publish, sendMix, openSong, input, layerOverSong }: Props) {
  const [session, setSession] = useState<Session>(() => emptySession());
  const [past, setPast] = useState<Session[]>([]);
  const [future, setFuture] = useState<Session[]>([]);
  const [mix, setMix] = useState<{ session: Session; audio: AudioBuffer; blob: Blob; url: string; mp3?: Blob } | null>(null);
  const [mp3Url, setMp3Url] = useState("");
  const [stem, setStem] = useState<{ session: Session; clipId: string; url: string } | null>(null);
  const [published, setPublished] = useState("");
  const [list, setList] = useState<SessionSummary[]>([]);
  const [selection, setSelection] = useState("");
  const [voiceName,setVoiceName]=useState("");
  const [voicePermission,setVoicePermission]=useState(false);
  const [voiceRevision,setVoiceRevision]=useState(0);
  const [voiceStatus,setVoiceStatus]=useState("");
  const [role, setRole] = useState<Role>("Lead vocal");
  const [songId, setSongId] = useState(initialSongId);
  const [playhead, setPlayhead] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [lastSaved, setLastSaved] = useState<Session | null>(null);
  const [processed, setProcessed] = useState<{ clip: Clip; url: string } | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [level, setLevel] = useState<"beginner" | "advanced" | "pro">("beginner");
  const [overdub, setOverdub] = useState(false);
  const [rejectedTake, setRejectedTake] = useState<{ blob: Blob; title: string; role: Role; at: number } | null>(null);
  const imported = useRef<Props["input"]>(null);
  const original = useRef(new Map<string, AudioSource>());
  const getSource = useCallback((id: string) => original.current.get(id)?.buffer, []);
  const uploads = useRef(new Map<string, Blob>());
  const revision = useRef<string | undefined>(undefined);
  const working = useRef(false);
  const saveJob = useRef(false);
  const area = useRef<HTMLDivElement>(null);
  const selected = session.clips.find(clip => clip.id === selection);
  const latestSession = useRef(session); latestSession.current = session;
  const saved = lastSaved === session;
  useEffect(()=>{setVoiceName("");setVoicePermission(false);setVoiceStatus("");},[session.id,selected?.source]);
  const currentMix = mix?.session === session ? mix : null;
  const mixName = (session.name.trim().replace(/[\\/:*?"<>|]/g, "-") || "Vocal mix");
  const sourceLength = selected ? session.sources.find(source => source.id === selected.source)?.duration ?? selected.end : 0;
  const canAdd = session.sources.length < maxSources && session.clips.length < maxClips;

  const recovery = useDraftRecovery("vocal-session", { session, revision: revision.current, sources: session.sources.map(source => ({ id: source.id, blob: original.current.get(source.id)?.blob })) }, async value => {
    const loaded = new Map<string, AudioSource>();
    for (const source of value.sources) {
      if (!(source.blob instanceof Blob)) throw new Error("An original take is missing from recovery.");
      const audio = await decode(source.blob);
      assertAudioBudget([...loaded.values()].map(a => a.buffer), audio.buffer);
      loaded.set(source.id, audio);
    }
    replace(value.session, value.revision, loaded);
    setLastSaved(null);
    for (const source of value.sources) uploads.current.set(source.id, source.blob!);
  }, !saved && session.sources.length > 0 && !capturing);
  const settingsDisabled = busy || capturing || saving || !recovery.ready;
  function captureChanged(value: boolean) { setCapturing(value); onCapture(value); }
  function stopPlayback() { area.current?.querySelectorAll("audio").forEach(audio => audio.pause()); }
  useEffect(() => {
    try {
      const preference = localStorage.getItem("samadhi-love-creation-level");
      if (preference === "advanced" || preference === "pro") setLevel(preference);
    } catch { /* The mode selector still works without browser preferences. */ }
  }, []);
  useEffect(() => { if (!active) stopPlayback(); }, [active]);
  useEffect(() => () => { if (processed) URL.revokeObjectURL(processed.url); }, [processed]);
  useEffect(() => { setProcessed(null); }, [selected]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  useEffect(() => () => { if (mix) URL.revokeObjectURL(mix.url); }, [mix?.url]);
  useEffect(() => () => { if (stem) URL.revokeObjectURL(stem.url); }, [stem]);
  useEffect(() => {
    if (!currentMix?.mp3) { setMp3Url(""); return; }
    const url = URL.createObjectURL(currentMix.mp3); setMp3Url(url);
    return () => URL.revokeObjectURL(url);
  }, [currentMix?.mp3]);
  useEffect(() => { setMix(null); setStem(null); setPublished(""); }, [session]);
  useEffect(() => { if (initialSongId) { setSongId(initialSongId); setSession(current => current.projectSongId ? current : { ...current, projectSongId: initialSongId }); } }, [initialSongId]);
  useEffect(() => {
    let valid = true;
    void allSessions()
      .then(result => { if (valid) setList(result); })
      .catch(error => { if (valid) setSyncError(error.message); });
    return () => { valid = false; };
  }, []);
  useEffect(() => {
    const source = selected && original.current.get(selected.source);
    if (!source) { setSourceUrl(""); return; }
    const buffer = source.buffer;
    const url = URL.createObjectURL(wavAudio(buffer.getChannelData(0), buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : undefined));
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [selected?.source, session.id]);
  useEffect(() => {
    if (saved || (!session.sources.length && !revision.current)) return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [saved, session]);

  async function persist(snapshot = session) {
    if (!recovery.ready || saveJob.current || (lastSaved === snapshot && !syncError)) return;
    saveJob.current = true; setSyncing(true); setSyncError("");
    try {
      revision.current = await writeSession(snapshot, revision.current, uploads.current);
      setLastSaved(snapshot);
      if (snapshot === latestSession.current) await recovery.clear();
      setList(items => [{ id: snapshot.id, name: snapshot.name, updated: new Date().toISOString() }, ...items.filter(item => item.id !== snapshot.id)]);
    } catch (error) { setSyncError(error instanceof Error ? error.message : "Could not save the session."); }
    finally { saveJob.current = false; setSyncing(false); }
  }

  useEffect(() => {
    if (!recovery.ready || saved || syncing || syncError || (!session.sources.length && !revision.current) || !session.name.trim()) return;
    const timer = window.setTimeout(() => { void persist(session); }, 450);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [session, saved, syncing, syncError, recovery.ready]);

  async function job(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true; setBusy(true); setError("");
    try { await action(); }
    catch (error) { setError(error instanceof Error ? error.message : "Audio processing failed."); }
    finally { working.current = false; setBusy(false); }
  }

  function patch(changes: Partial<Session>) {
    setPast(items => [...items.slice(-39), session]); setFuture([]);
    setSession({ ...session, ...changes });
  }

  function history(redo: boolean) {
    const items = redo ? future : past;
    const next = items.at(-1);
    if (!next) return;
    const push = redo ? setPast : setFuture;
    const pop = redo ? setFuture : setPast;
    push(items => [...items.slice(-39), session]);
    pop(items => items.slice(0, -1));
    setSession({ ...next, sources: session.sources });
    if (!next.clips.some(clip => clip.id === selection)) setSelection(next.clips[0]?.id ?? "");
  }

  function moveClip(id: string, at: number) {
    patch({ clips: session.clips.map(clip => clip.id === id
      ? { ...clip, at: Math.max(0, Math.min(sessionSeconds - clip.end + clip.start, at)) } : clip) });
  }

  function splitAtCursor() {
    if (!selected || session.clips.length >= maxClips) return;
    const parts = splitClip(selected, playhead);
    if (!parts) { setError("Move the playhead inside the selected clip to split it."); return; }
    patch({ clips: session.clips.flatMap(clip => clip.id === selected.id ? parts : [clip]) });
    setSelection(parts[1].id); setError("");
  }

  function updateClip(change: Partial<Clip>) {
    if (selected) patch({ clips: session.clips.map(clip => clip.id === selected.id ? { ...clip, ...change } : clip) });
  }
  function replace(next: Session, rev?: string, loaded?: Map<string, AudioSource>) {
    stopPlayback();
    original.current = loaded ?? new Map();
    uploads.current = new Map();
    revision.current = rev;
    setPast([]); setFuture([]);
    setLastSaved(rev ? next : null); setSession(next);
    setSelection(next.clips[0]?.id ?? ""); setPlayhead(0); setSyncError(""); setRejectedTake(null);
  }

  async function open(id: string) {
    if (!id || id === session.id || saveJob.current) return;
    if (!saved && (session.sources.length || revision.current) && !confirm("Switch sessions? Unsaved edits in this tab will be discarded.")) return;
    await job(async () => {
      const result = await sessionRequest<{ session: Session; revision: string }>(sessionUrl(id));
      const loaded = new Map<string, AudioSource>();
      for (const source of result.session.sources) {
        const response = await fetch(sessionUrl(id, source.id));
        if (!response.ok) throw new Error("One of this session’s original recordings could not load.");
        const audio = await decode(await response.blob());
        assertAudioBudget([...loaded.values()].map(a => a.buffer), audio.buffer);
        loaded.set(source.id, audio);
      }
      replace(result.session, result.revision, loaded);
    });
  }

  function newSession() {
    if (saveJob.current || (!saved && (session.sources.length || revision.current) && !confirm("Start a new session and discard unsaved edits in this tab?"))) return;
    replace(emptySession());
  }

  function saveCopy() {
    if (saveJob.current) return;
    const next = { ...session, id: crypto.randomUUID(), name: session.name.slice(0, 90) + " copy" };
    for (const [id, audio] of original.current) uploads.current.set(id, audio.blob);
    revision.current = undefined;
    setPast([]); setFuture([]); setLastSaved(null); setSession(next); setSyncError("");
  }

  async function add(blob: Blob, name: string, role: Role, at: number, projectSongId?: string) {
    if (!canAdd) throw new Error("This session is full. Start another session to add more recordings.");
    const audio = await decode(blob);
    assertAudioBudget([...original.current.values()].map(a => a.buffer), audio.buffer);
    const duration = Math.min(sessionSeconds, audio.buffer.duration);
    if (session.sources.reduce((total, source) => total + source.duration, 0) + duration > maxSourceSeconds)
      throw new Error("This session can hold up to 48 minutes of source audio within its memory budget. Start another session for more takes.");
    const placement = recordedPlacement(duration, at, sessionSeconds);
    const source = { id: crypto.randomUUID(), name: hasExplicitWords(name) ? role : name.trim().slice(0, 100) || role, duration };
    const clip: Clip = { id: crypto.randomUUID(), source: source.id, name: source.name, role, ...placement,
      volume: 1, pan: 0, mute: false, solo: false, bypass: false, effects: { ...dry }, tuning: { ...noTuning }, fadeIn: 0, fadeOut: 0 };
    original.current.set(source.id, audio); uploads.current.set(source.id, blob);
    patch({ projectSongId: session.projectSongId ?? projectSongId, sources: [...session.sources, source], clips: [...session.clips, clip] });
    setSelection(clip.id); setRejectedTake(null); setSyncError("");
  }

  useEffect(() => {
    if (!active || !input || input === imported.current || busy || capturing) return;
    imported.current = input;
    setRejectedTake({ blob: input.blob, title: input.title, role: input.role, at: playhead });
    void job(async () => { await add(input.blob, input.title, input.role, playhead); if (input.projectId) setSession(current => current.projectSongId ? current : { ...current, projectSongId: input.projectId }); });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [active, input, busy, capturing]);

  return <div hidden={!active} className="vocal-workspace" ref={area} onPlayCapture={event => {
    if (event.target instanceof HTMLAudioElement) area.current?.querySelectorAll("audio").forEach(audio => {
      if (audio !== event.target) audio.pause();
    });
  }}>
    <RecoveryPanel recovery={recovery}/><div className="create-banner"><span className="eyebrow">MIX LAB / VOCAL STUDIO</span><h1>Vocal Studio</h1>
      <p>Record your voice and keep each original take in a private, editable session.</p></div>
    <section className="panel form-panel voice-first-guide" aria-label="Use your own voice">
      <h2>Your creation · your voice</h2>
      <ol><li>Choose your own instrumental or a backing track you have permission to use under <strong>Song Library audio</strong>, then select <strong>Add library audio</strong>.</li>
      <li>Select <strong>Render mix</strong> to prepare the backing. Enable <strong>Overdub with rendered mix</strong>, wear headphones, and choose <strong>Lead vocal</strong>.</li>
      <li>Press <strong>Record</strong>. Your microphone becomes a separate original take. Adjust its level, timing, and effects; render again and save the mix to your project.</li></ol>
      <p className="muted">Recording your voice does not clone it or send it to a voice-generation service. Original takes remain in your private session. You still need permission for the backing, lyrics, samples, and any other voices.</p>
    </section>
    <section className="panel form-panel" aria-label="Vocal sessions">
      <div className="field-grid">
        <label className="field">Project for rendered mixes<select value={session.projectSongId ?? ""} disabled={settingsDisabled} onChange={event => patch({ projectSongId: event.target.value || undefined })}><option value="">New standalone project</option>{projects.map(song => <option key={song.id} value={song.id}>{song.name}</option>)}</select></label>
        <label className="field">Session name<input value={session.name} maxLength={100} disabled={settingsDisabled} onChange={e => patch({ name: e.target.value })}/></label>
        <HelpField label="Open saved session" tip="Reopen an editable project with its original recordings from your account."><select value={list.some(item => item.id === session.id) ? session.id : ""}
          disabled={settingsDisabled || syncing} onChange={e => void open(e.target.value)}><option value="">Choose a session</option>
          {list.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></HelpField>
        <label className="field">Vocal Studio mode<select value={level} disabled={settingsDisabled} onChange={e => setLevel(e.target.value as typeof level)}>
          <option value="beginner">Beginner</option><option value="advanced">Advanced</option><option value="pro">Pro</option></select></label>
        <HelpField label="Tempo (BPM)" tip="Sets the count-in, click, and timeline beat grid. Audio speed stays the same."><input type="number" min="40" max="200" value={session.bpm} disabled={settingsDisabled}
          onChange={e => { const value = e.target.valueAsNumber; if (value >= 40 && value <= 200) patch({ bpm: value }); }}/></HelpField>
      </div>
      <div className="actions">
        <button type="button" className="primary" disabled={settingsDisabled || syncing || !session.name.trim()} onClick={() => persist()}>Save session</button>
        <button type="button" className="secondary" disabled={settingsDisabled || syncing} onClick={newSession}>New session</button>
        {syncError && session.sources.length > 0 && <button type="button" className="secondary" disabled={settingsDisabled || syncing || !session.name.trim()} onClick={saveCopy}>Save as new session</button>}
        <span role="status">{syncing ? "Saving originals and edits…" : saved ? "Saved to your account" : session.sources.length ? "Unsaved edits" : "New session"}</span>
      </div>
      {syncError && <p className="notice" role="alert">{syncError}</p>}
    </section>
    <section className="panel form-panel vocal-overdub" aria-label="Recording accompaniment">
      <HelpControl subject="Overdub with rendered mix" tip="Play the current rendered mix in your headphones from the timeline playhead while recording a new clip.">
        <label className="checkline"><input type="checkbox" checked={overdub} disabled={!currentMix || settingsDisabled} onChange={e => setOverdub(e.target.checked)}/> Overdub with rendered mix</label>
      </HelpControl>
      <p className="muted">Render the arrangement to enable backing playback while you record. Use headphones to keep it out of the mic.</p>
    </section>
    <Capture bpm={session.bpm} backing={overdub && currentMix ? currentMix.audio : undefined} position={playhead} retakePosition={selected?.at} busy={busy || saving || !canAdd || !recovery.ready} onCapture={captureChanged} retake={!!selected && selected.role !== "Instrumental"}
      beforeRecord={stopPlayback} role={role} setRole={setRole} onTake={(blob, nextRole, retake, offsetMs) => {
        const take = { blob, title: (retake ? selected?.role ?? nextRole : nextRole) + " " + (session.sources.length + 1),
          role: retake ? selected?.role ?? nextRole : nextRole, at: (retake ? selected?.at ?? playhead : playhead) - offsetMs / 1000 };
        setRejectedTake(take);
        void job(() => add(blob, take.title, take.role, take.at));
      }}/>
    <section className="panel form-panel" aria-label="Audio sources">
      <h2>2. Listen to your takes</h2>
      <fieldset disabled={settingsDisabled || !canAdd}>
        <div className="field-grid">
          <HelpField label="Import audio file" tip="Import a vocal or backing track. Studio keeps a separate copy of the original."><input type="file" accept={audioAccept + ",audio/*"} onChange={event => {
            const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
            if (file) void job(() => add(file, file.name, role, playhead));
          }}/></HelpField>
          <HelpField label="Song Library audio" tip="Choose an uploaded recording or a generated track from your Studio."><select value={songId} onChange={e => setSongId(e.target.value)}>
            <option value="">Choose a recording</option>{songs.map(song => <option value={song.id} key={song.id}>{song.name}</option>)}</select></HelpField>
        </div>
        <button type="button" className="secondary" disabled={!songs.some(song => song.id === songId)} onClick={() => job(async () => {
          const song = songs.find(song => song.id === songId);
          if (!song) return;
          const response = await fetch(songAudioUrl(song.id, song.audioId));
          if (!response.ok) throw new Error("Could not open this library recording.");
          await add(await response.blob(), song.name, "Instrumental", playhead, projectRoot(projects, song).id);
        })}>Add library audio</button>
      </fieldset>
      {!canAdd && <p className="muted">This session is at its clip or original recording limit.</p>}
      <label className="field">Selected take<select value={selection} disabled={settingsDisabled} onChange={e => setSelection(e.target.value)}>
        <option value="">Choose a take</option>{session.clips.map(clip => <option value={clip.id} key={clip.id}>{clip.name}</option>)}</select></label>
      <MyVoicePicker disabled={settingsDisabled||!canAdd} revision={voiceRevision} useVoice={async(blob,name)=>{await job(()=>add(blob,name,"Lead vocal",playhead));}}/>
      {selected&&selected.role!=="Instrumental"&&<section className="voice-save-controls"><h3>Keep this original for future productions</h3>
        <label className="field">Voice recording name<input value={voiceName} maxLength={100} disabled={settingsDisabled} placeholder={selected.name} onChange={e=>setVoiceName(e.target.value)}/></label>
        <label className="checkline"><input type="checkbox" checked={voicePermission} disabled={settingsDisabled} onChange={e=>setVoicePermission(e.target.checked)}/> This is my voice, or I have the performer's permission to save and reuse it.</label>
        <button type="button" className="secondary" disabled={settingsDisabled||syncing||!saved||!voicePermission} onClick={()=>void job(async()=>{
          const source=original.current.get(selected.source);if(!source)throw new Error("The original take is unavailable.");
          await sessionRequest(myVoiceUrl(),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:session.id,sourceId:selected.source,name:voiceName.trim()||selected.name,mime:detectVoiceMime(new Uint8Array(await source.blob.slice(0,32).arrayBuffer()),source.blob.type),permission:voicePermission})});
          setVoiceRevision(n=>n+1);setVoiceStatus("Original voice saved privately to My Voice. You can add it to other productions without re-recording.");
        })}>Save original to My Voice</button>
        {!saved&&<p className="muted">Save this vocal session to your account first; then save the original voice.</p>}{voiceStatus&&<p role="status">{voiceStatus}</p>}
      </section>}
      {selected && layerOverSong && <LayerOverSong key={selected.source} blob={original.current.get(selected.source)?.blob} title={selected.name} songs={songs} disabled={settingsDisabled} initialSongId={session.projectSongId} layer={layerOverSong}/>}
      {selected && <Wave peaks={original.current.get(selected.source)?.peaks ?? []} label={selected.name + " waveform"}/>}
      {active && !capturing && sourceUrl && <AudioPlayer key={sourceUrl} src={sourceUrl} label="Original take playback"/>}
      {rejectedTake && !busy && <div className="actions">
        <button type="button" className="secondary" onClick={() => job(() => add(rejectedTake.blob, rejectedTake.title, rejectedTake.role, playhead))}>Retry adding take at playhead</button>
        <button type="button" className="secondary" onClick={() => {
          const url = URL.createObjectURL(rejectedTake.blob);
          const link = document.createElement("a"); link.href = url;
          link.download = rejectedTake.title + (rejectedTake.blob.type.includes("mp4") ? ".m4a" : rejectedTake.blob.type.includes("ogg") ? ".ogg" : ".webm");
          link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 20000);
        }}>Download original take</button>
      </div>}
    </section>
    {selected && <section className="panel form-panel" aria-label="Vocal effects">
      <h2>3. Shape your sound</h2>
      <p className="muted">Apply a preset or tune the selected clip, then render it to compare with the original above.</p>
      <fieldset disabled={settingsDisabled}>
        <EffectsPanel key={selected.id} clip={selected} simple={level === "beginner"} presets={session.presets} update={updateClip}
          savePreset={(name, effects) => patch({ presets: [...session.presets.filter(preset => preset.name !== name), { name, effects }] })}/>
        {level !== "beginner" && selected.role !== "Instrumental" && <TuningPanel key={selected.id} clip={selected} buffer={original.current.get(selected.source)?.buffer}
          pro={level === "pro"} update={updateClip} run={action => { void job(action); }} harmony={session.clips.length < maxClips ? interval => {
            const clip: Clip = { ...selected, id: crypto.randomUUID(), name: (selected.name.slice(0, 79) + " harmony"),
              role: "Harmony", volume: Math.min(selected.volume, 0.52), pan: selected.pan <= 0 ? 0.35 : -0.35, solo: false, mute: false, bypass: false,
              tuning: { ...selected.tuning, strength: 0, shift: interval, notes: [] } };
            patch({ clips: [...session.clips, clip] }); setSelection(clip.id);
          } : undefined}/>}
        <button type="button" className="primary" onClick={() => job(async () => {
          stopPlayback();
          const audio = await renderVocal([{ ...selected, at: 0, volume: 1, pan: 0 }], id => original.current.get(id)?.buffer, { master: 1, masterLimiter: false });
          setProcessed({ clip: selected, url: URL.createObjectURL(stereoWav(audio)) });
        })}>Render processed take</button>
      </fieldset>
      {active && !capturing && processed?.clip === selected && <AudioPlayer key={processed.url} src={processed.url} label="Processed take playback"/>}
    </section>}
    <section className="panel form-panel" aria-label="Multitrack arrangement">
      <h2>4. Arrange and mix</h2>
      <p className="muted">Place each part on the same timeline to blend or alternate vocals. Projects support up to eight minutes, 16 clips, and up to 48 minutes of originals within a 512 MiB decoded-source budget. Rendering uses additional memory; use shorter sessions on phones.</p>
      <fieldset disabled={settingsDisabled}>
        <ClipTimeline session={session} selected={selected} choose={setSelection} getSource={getSource}
          playhead={playhead} seek={setPlayhead} move={moveClip}/>
        <div className="actions">
          <button type="button" className="secondary small" disabled={!past.length} onClick={() => history(false)}>Undo</button>
          <button type="button" className="secondary small" disabled={!future.length} onClick={() => history(true)}>Redo</button>
          <HelpControl subject="Split at playhead" tip="Divide the selected clip where the timeline playhead sits. Both parts still point to the same original.">
            <button type="button" className="secondary small" disabled={!selected || session.clips.length >= maxClips} onClick={splitAtCursor}>Split at playhead</button></HelpControl>
          <button type="button" className="secondary small" disabled={!selected} onClick={() => selected && moveClip(selected.id, playhead)}>Move clip to playhead</button>
          <HelpControl subject="Remove clip" tip="Remove this clip from the mix. Its original recording stays in the session, and Undo can bring the clip back.">
            <button type="button" className="text-button danger" disabled={!selected} onClick={() => {
              const clips = session.clips.filter(clip => clip.id !== selection);
              patch({ clips }); setSelection(clips[0]?.id ?? "");
            }}>Remove clip</button></HelpControl>
        </div>
        {!!session.sources.length && <details className="guide-stems"><summary>Session originals</summary>
          <ul>{session.sources.map(source => <li key={source.id}>{source.name} · {source.duration.toFixed(2)} s <button className="text-button" type="button"
            disabled={session.clips.length >= maxClips || sessionSeconds - playhead < 0.05} onClick={() => {
              const clip: Clip = { id: crypto.randomUUID(), source: source.id, name: source.name, role, start: 0, end: Math.min(source.duration, sessionSeconds - playhead),
                at: playhead, volume: 1, pan: 0, mute: false, solo: false, bypass: false, effects: { ...dry }, tuning: { ...noTuning }, fadeIn: 0, fadeOut: 0 };
              patch({ clips: [...session.clips, clip] }); setSelection(clip.id);
            }}>Add {source.name} to timeline</button></li>)}</ul>
        </details>}
        {selected && <ClipControls key={selected.id} clip={selected} playhead={playhead} length={sourceLength} update={updateClip} pro={level === "pro"}/>}
        {level === "pro" && <div className="field-grid">
          {(["vocals", "music"] as const).map(bus => <HelpField key={bus} label={(bus === "vocals" ? "Vocal" : "Music") + " bus output"}
            tip="Change the level of this group independently before it feeds the master.">
            <input type="range" min={0} max={1.5} step={0.01} value={session.buses?.[bus] ?? 1}
              onChange={e => patch({ buses: { vocals: 1, music: 1, ...session.buses, [bus]: Number(e.target.value) } })}/>
          </HelpField>)}
        </div>}
        {level !== "beginner" && <div className="field-grid">
          <HelpField label={"Master output · " + Math.round(session.master * 100) + "%"} subject="Master output" tip="Change the stereo mix output level before the master limiter.">
            <input type="range" min={0} max={1.5} step={0.01} value={session.master} onChange={e => patch({ master: Number(e.target.value) })}/></HelpField>
          <HelpControl subject="Master limiter" tip="Reduce loud peaks at the final stereo output.">
            <label className="checkline"><input type="checkbox" checked={session.masterLimiter} onChange={e => patch({ masterLimiter: e.target.checked })}/> Master limiter</label></HelpControl>
        </div>}
        <div className="actions">
          <button type="button" className="primary" disabled={!audibleClips(session.clips).length} onClick={() => job(async () => {
            stopPlayback();
            const audio = await renderVocal(audibleClips(session.clips), getSource, session, { length: mixLength(session.clips) });
            const blob = stereoWav(audio);
            setPublished(""); setMix({ session, audio, blob, url: URL.createObjectURL(blob) });
          })}>{busy ? "Processing audio…" : "Render mix"}</button>
          {selected && <button type="button" className="secondary" onClick={() => job(async () => {
            const length = mixLength(session.clips);
            const audio = await renderVocal([selected], id => original.current.get(id)?.buffer, { master: 1, masterLimiter: false }, { length });
            setStem({ session, clipId: selected.id, url: URL.createObjectURL(stereoWav(audio)) });
          })}>Render selected WAV stem</button>}
          {stem?.session === session && stem.clipId === selection && <a className="secondary" href={stem.url} download={mixName + " - " + (selected?.name.replace(/[\\/:*?"<>|]/g, "-") || "stem") + ".wav"}>Download aligned stem</a>}
        </div>
      </fieldset>
      {active && !capturing && currentMix && <div className="vocal-output">
        <AudioMeasurements audio={currentMix.audio}/>
        <AudioPlayer key={currentMix.url} src={currentMix.url} label="Finished stereo mix" onPosition={time => setPlayhead(Math.min(sessionSeconds - 0.05, time))}/>
        {mp3Url && <details><summary>Listen to MP3</summary><AudioPlayer key={mp3Url} src={mp3Url} label="MP3 mix playback"/></details>}
        <div className="actions">
          <a className="secondary" href={currentMix.url} download={mixName + ".wav"}>Download mix WAV</a>
          {mp3Url ? <a className="secondary" href={mp3Url} download={mixName + ".mp3"}>Download mix MP3</a> :
            <button type="button" className="secondary" disabled={settingsDisabled} onClick={() => job(async () => {
              const mp3 = await encodeMp3(currentMix.audio);
              setMix({ ...currentMix, mp3 });
            })}>Encode mix MP3</button>}
          <button type="button" className="secondary" disabled={settingsDisabled} onClick={() => sendMix(currentMix.blob, mixName, session.projectSongId)}>Send to Multitrack Mixer</button>
          <button type="button" className="primary" disabled={settingsDisabled || !!published} onClick={() => job(async () => {
            if (!session.name.trim() || hasExplicitWords(session.name)) throw new Error("Choose a clean name for this recording.");
            if (!confirm("Confirm this mix contains clean content before adding it to your Song Library.")) return;
            const id = await publish(new File([currentMix.blob], mixName + ".wav", { type: "audio/wav" }), session.name.trim(), session.projectSongId, session.id);
            if (id) setPublished(id);
          })}>Save mix to Song Library</button>
        </div>
        {published && <><p role="status">Mix saved to your Song Library.</p><div className="actions">
          <button type="button" className="secondary small" onClick={() => openSong(published, "production")}>Open in Song Library</button>
          <button type="button" className="secondary small" onClick={() => openSong(published, "lyrics")}>Open lyrics</button>
          <button type="button" className="secondary small" onClick={() => openSong(published, "video")}>Make lyric video</button>
          <button type="button" className="secondary small" onClick={() => openSong(published, "release")}>Open release checklist</button>
        </div></>}
      </div>}
      {error && <p className="notice" role="alert">{error}</p>}
      <p className="muted"><a href="/audio-licenses.html" target="_blank" rel="noreferrer">Audio encoder credits and licenses</a></p>
    </section>
  </div>;
}
