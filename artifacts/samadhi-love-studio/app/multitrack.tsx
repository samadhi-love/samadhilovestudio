"use client";
import { AVTimeline } from "./av-timeline";
import { newAVSettings, validAVSettings } from "./av-timeline-data";
import { assertAudioBudget } from "./audio-resource";
import { serializeMixer, validMixerSession, type MixerSession } from "./mixer-session";
import { listMixerSessions, saveMixerSession, mixerUrl } from "./mixer-storage";
import { sessionRequest, type SessionSummary } from "./vocal/storage";
import { StemImporter } from "./stem-importer";
import type { ExtractedStem } from "./stem-archive";
import { MyVoicePicker } from "./my-voice-picker";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";

import { HelpControl, HelpField } from "./help-tip";
import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "./audio-player";
import { maxMixSeconds, maxMixTracks, renderMix, type MixTrack } from "./multitrack-audio";
import { sampleRate, waveform } from "./recording-dsp";
import { audioAccept, maxAudioBytes, songAudioUrl, type Song } from "./studio-data";

type Input = { blob: Blob; title: string; projectId?: string; kind?: "stems"; baseSongId?: string };
type Props = {
  active: boolean; songs: Song[]; input: Input | null; initialSongId: string; saving: boolean;
  save: (file: File, title: string, projectId?: string) => Promise<boolean>;
  openLyrics?: (songId:string)=>void;
};

const controls = [
  ["level", "Volume", 0, 1.5, .05, "Adjust how loud this track is in the mix."],
  ["pan", "Pan left / right", -1, 1, .05, "Place the track toward the left or right speaker. Zero keeps it centered."],
  ["lowCut", "Low-cut EQ (Hz)", 15, 300, 1, "Reduce low frequencies below this point to clear rumble or make room for bass."],
  ["presence", "Brightness EQ (dB)", -12, 12, 1, "Raise or lower high frequencies to make the track sound brighter or softer."],
  ["reverb", "Reverb", 0, 1, .05, "Add the sound of space around this track, like a room or hall."],
  ["echo", "Delay amount", 0, 0.75, .05, "Blend in a delayed repeat at 280 milliseconds. Zero turns it off."],
] as const;

/** Decodes without touching the session; nothing is committed here. */
async function prepareTracks(items: { blob: Blob; name: string }[]): Promise<MixTrack[]> {
  const context = new AudioContext({ sampleRate });
  try {
    const out: MixTrack[] = [];
    for (const { blob, name } of items) {
      if (!blob.size || blob.size > maxAudioBytes) throw new Error("Choose an audio file up to 96 MB.");
      const buffer = await context.decodeAudioData(await blob.arrayBuffer()).catch(() => { throw new Error("This browser could not decode the track. Try MP3 or PCM WAV."); });
      if (!buffer.duration || buffer.duration > 480) throw new Error("Choose a source recording up to eight minutes long.");
      out.push({ id: crypto.randomUUID(), name: name.trim().slice(0, 100) || "Audio track", sourceBlob: blob, buffer, peaks: waveform(buffer.getChannelData(0), 80),
        start: 0, end: Math.min(buffer.duration, maxMixSeconds), at: 0, level: 1, pan: 0, lowCut: 15, presence: 0, reverb: 0, echo: 0, compression: false, mute: false, solo: false });
    }
    return out;
  } finally { await context.close(); }
}
/** Throws if open tracks plus every incoming layer exceed the decoded-memory budget or track limit. */
export function assertLayerBudget(existing: { buffer: Pick<AudioBuffer, "length" | "numberOfChannels"> }[], incoming: { buffer: Pick<AudioBuffer, "length" | "numberOfChannels"> }[]) {
  if (existing.length + incoming.length > maxMixTracks) throw new Error("Remove a track to make room for the song and this take. Nothing was replaced.");
  const all = [...existing, ...incoming].map(t => t.buffer), last = all.pop();
  try { assertAudioBudget(all, last); } catch (error) { throw new Error((error as Error).message + " Your current mix is unchanged."); }
}

export function Multitrack({ active, songs, input, initialSongId, saving, save, openLyrics }: Props) {
  const [stemArchive,setStemArchive]=useState<Blob>();
  const [audiovisual, setAudiovisual] = useState(newAVSettings);
  const [avBusy, setAvBusy] = useState(false);
  const [tracks, setTracks] = useState<MixTrack[]>([]);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [cloudStatus, setCloudStatus] = useState("");
  const revision = useRef<string | undefined>(undefined);
  const uploadedSources = useRef(new Map<string,Set<string>>());
  useEffect(() => { let live = true; listMixerSessions().then(list => { if (live) setSessions(list); }).catch(e => { if (live) setCloudStatus(e.message); }); return () => { live = false; }; }, []);
  const [songId, setSongId] = useState(initialSongId);
  const [projectId, setProjectId] = useState(initialSongId);
  useEffect(() => { if (initialSongId) { setSongId(initialSongId); setProjectId(initialSongId); } }, [initialSongId]);
  const [output, setOutput] = useState<{ blob: Blob; url: string } | null>(null);
  const [title, setTitle] = useState("SAMADHI LOVE Mix");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const seenInput = useRef<Input | null>(null);
  const pending = useRef(false);
  /** Song audio already loaded for layering; keyed so repeat requests never add a second copy. */
  const layeredSongs = useRef(new Map<string, string>());
  const area=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!active)area.current?.querySelectorAll("audio").forEach(audio=>{if(!audio.paused)audio.pause();});},[active]);
  const recordings = songs.filter(song => song.audioFormat);
  async function run(job: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try { await job(); }
    catch (error) { setError(error instanceof Error ? error.message : "Audio processing failed."); }
    finally { pending.current = false; setBusy(false); }
  }
  async function add(blob: Blob, name: string): Promise<void> {
    if (tracks.length >= maxMixTracks) throw new Error("Remove a track to make room for this take.");
    const [track] = await prepareTracks([{ blob, name }]);
    assertAudioBudget(tracks.map(t => t.buffer), track.buffer);
    setTracks(current => [...current, track]); setOutput(null);
  }
  const recovery = useDraftRecovery("multitrack", { title, songId, projectId, sessionId, audiovisual, revision: revision.current, tracks: tracks.map(({ buffer, peaks, ...track }) => track) }, async value => {
    if (!Array.isArray(value.tracks) || value.tracks.length > maxMixTracks) throw new Error("Invalid mixer recovery.");
    const context = new AudioContext({ sampleRate });
    try {
      const restored = [];
      for (const track of value.tracks) {
        if (!(track.sourceBlob instanceof Blob)) throw new Error("An original track is missing from recovery.");
        const buffer = await context.decodeAudioData(await track.sourceBlob.arrayBuffer());
        assertAudioBudget(restored.map(t => t.buffer), buffer);
        restored.push({ ...track, buffer, peaks: waveform(buffer.getChannelData(0), 80) });
      }
      if (value.audiovisual !== undefined && !validAVSettings(value.audiovisual)) throw new Error("The recovered visual timeline is invalid. The recovery copy is preserved.");
      setTracks(restored); setAudiovisual(value.audiovisual ?? newAVSettings()); setTitle(value.title); setSongId(value.songId); setProjectId(value.projectId); setSessionId(value.sessionId ?? crypto.randomUUID()); revision.current = value.revision; setOutput(null);
    } finally { await context.close(); }
  }, tracks.length > 0);
  useEffect(() => {
    if (!input || input === seenInput.current || busy) return;
    seenInput.current = input;
    if (input.projectId) setProjectId(input.projectId);
    if(input.kind==="stems")setStemArchive(input.blob);
    else if(input.baseSongId)void run(() => layer(input.blob, input.title, input.baseSongId!));
    else void run(() => add(input.blob, input.title));
    // A take is consumed once, when the mixer is ready to decode it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, busy]);
  useEffect(() => {
    if (output) return () => URL.revokeObjectURL(output.url);
  }, [output]);
  async function layer(blob: Blob, name: string, baseSongId: string) {
    const base = songs.find(item => item.id === baseSongId && item.audioFormat);
    if (!base) throw new Error("That song is not available to layer over. Your take is still saved in Record.");
    const key = base.id + ":" + (base.audioId ?? "original");
    const already = layeredSongs.current.get(key), baseLoaded = !!already && tracks.some(track => track.id === already);
    const needed = (baseLoaded ? 0 : 1) + 1;
    if (tracks.length + needed > maxMixTracks) throw new Error("Remove a track to make room for the song and this take. Nothing was replaced.");
    if (tracks.length && !baseLoaded && !confirm(`Add “${base.name}” and “${name}” as new tracks to the mix that is already open? Choose Cancel to keep this mix exactly as it is.`)) {
      setCloudStatus("Your current mix was kept unchanged. The take is still available in Record."); return;
    }
    const incoming: { blob: Blob; name: string }[] = [];
    if (!baseLoaded) {
      const response = await fetch(songAudioUrl(base.id, base.audioId), { credentials: "same-origin" });
      if (!response.ok) throw new Error("Could not load that song from your library. Your current mix is unchanged.");
      incoming.push({ blob: await response.blob(), name: base.name });
    }
    incoming.push({ blob, name });
    const prepared = await prepareTracks(incoming);
    // Both new tracks and every open track must fit together before anything is committed.
    assertLayerBudget(tracks, prepared);
    if (!baseLoaded) layeredSongs.current.set(key, prepared[0].id);
    setTracks(current => [...current, ...prepared]); setOutput(null);
    setProjectId(current => current || base.id);
    setCloudStatus(`Layering “${name}” over “${base.name}”. Each is its own track; place, trim and balance them below.`);
  }
  function patch(id: string, changes: Partial<MixTrack>) {
    setTracks(current => current.map(track => track.id === id ? { ...track, ...changes } : track));
    setOutput(null);
  }
  async function importStems(files:ExtractedStem[]){
    if(pending.current)throw new Error("Wait for the current mix operation.");
    if(files.length+tracks.length>maxMixTracks)throw new Error("Remove a track or select fewer stems.");
    pending.current=true;setBusy(true);setError("");const context=new AudioContext({sampleRate});
    try{const prepared:MixTrack[]=[];for(const file of files){if(!file.blob.size||file.blob.size>maxAudioBytes)throw new Error("A stem exceeds the 96 MiB import limit.");const buffer=await context.decodeAudioData(await file.blob.arrayBuffer());if(!buffer.duration||buffer.duration>maxMixSeconds)throw new Error("A stem exceeds eight minutes.");assertAudioBudget([...tracks,...prepared].map(t=>t.buffer),buffer);prepared.push({id:crypto.randomUUID(),name:file.name,sourceBlob:file.blob,buffer,peaks:waveform(buffer.getChannelData(0),80),start:0,end:buffer.duration,at:0,level:1,pan:0,lowCut:15,presence:0,reverb:0,echo:0,compression:false,mute:false,solo:false});}
      setTracks(current=>[...current,...prepared]);setOutput(null);
    }finally{await context.close();pending.current=false;setBusy(false);}
  }
  async function saveEditable(copy = false) {
    await run(async () => {
      const id = copy ? crypto.randomUUID() : sessionId;
      const snapshot = serializeMixer(id, title, projectId, tracks, audiovisual);
      if(copy)snapshot.name=(title.slice(0,75)+" · Vibe "+new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})).slice(0,100);
      if (!validMixerSession(snapshot)) throw new Error("Check the mix name, track settings, and trim/placement values before saving.");
      const uploaded = uploadedSources.current.get(id) ?? new Set<string>(); uploadedSources.current.set(id, uploaded);
      const result = await saveMixerSession(snapshot, new Map(tracks.filter(t => t.sourceBlob).map(t => [t.id, t.sourceBlob!])), copy ? undefined : revision.current, uploaded);
      revision.current = result.revision; setSessionId(id); if(copy)setTitle(snapshot.name);
      setSessions(list => [{ id, name: snapshot.name, updated: new Date().toISOString() }, ...list.filter(s => s.id !== id)]);
      setCloudStatus("Editable mixer session saved to your account, including original tracks.");
    });
  }
  async function openEditable(id: string) {
    if (!id || id === sessionId) return;
    if (tracks.length && !confirm("Open another mixer session? Save current edits first. Device recovery is not a substitute for an account save.")) return;
    await run(async () => {
      const data = await sessionRequest<{ session: MixerSession; revision: string }>(mixerUrl(id));
      if (!validMixerSession(data.session)) throw new Error("This saved mixer session is invalid.");
      const context = new AudioContext({ sampleRate });
      try {
        const restored: MixTrack[] = [];
        for (const track of data.session.tracks) {
          const response = await fetch(mixerUrl(id, track.id)); if (!response.ok) throw new Error("An original track could not load. Current work is preserved.");
          const blob = await response.blob(); if (blob.size > maxAudioBytes) throw new Error("An original track exceeds the import limit.");
          const buffer = await context.decodeAudioData(await blob.arrayBuffer());
          if (Math.abs(buffer.duration - track.duration) > .1) throw new Error("An original track's duration no longer matches this session.");
          assertAudioBudget(restored.map(t => t.buffer), buffer);
          restored.push({ ...track, buffer, sourceBlob: blob, peaks: waveform(buffer.getChannelData(0),80) });
        }
        setTracks(restored); setAudiovisual(data.session.audiovisual ?? newAVSettings()); setTitle(data.session.name); setProjectId(data.session.projectSongId ?? "");
        setSessionId(id); revision.current = data.revision; uploadedSources.current.set(id, new Set(data.session.tracks.map(t => t.id))); setOutput(null); setCloudStatus("Saved session opened. Originals and editable settings are restored.");
      } finally { await context.close(); }
    });
  }
  const filename = (title.trim().replace(/[\\/:*?"<>|]/g, "-") || "SAMADHI LOVE Mix") + ".wav";
  return <div hidden={!active} ref={area} onPlayCapture={event=>{if(event.target instanceof HTMLAudioElement)area.current?.querySelectorAll("audio").forEach(audio=>{if(audio!==event.target&&!audio.paused)audio.pause();});}}><RecoveryPanel recovery={recovery}/>
    <div className="create-banner"><span className="eyebrow">AUDIO + VISUAL PRODUCTION</span><h1>Multitrack mixer + visual timeline</h1><p>Build a stereo arrangement with up to six tracks. Preview synchronized visuals, then export a WAV or finished music video.</p></div>
    <AVTimeline key={sessionId} active={active} tracks={tracks} settings={audiovisual} change={setAudiovisual} patchTrack={patch} songs={songs} projectId={projectId} title={title} disabled={busy || saving || !recovery.ready} onBusy={setAvBusy} openLyrics={openLyrics}/>
    <div className="panel form-panel">
      <fieldset disabled={busy || saving || avBusy || !recovery.ready}>
        <section className="mixer-session-controls" aria-label="Editable mixer sessions"><h2>Save and reopen your production</h2>
          <label className="field">Open saved mixer session<select value={sessions.some(s => s.id === sessionId) ? sessionId : ""} onChange={e => void openEditable(e.target.value)}><option value="">Choose a saved session</option>{sessions.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
          <div className="actions"><button type="button" className="secondary" disabled={!tracks.length || !recovery.ready} onClick={() => void saveEditable()}>Save editable session</button><button type="button" className="secondary" disabled={!tracks.length || !recovery.ready} onClick={() => void saveEditable(true)}>Save session copy</button></div>
          {cloudStatus && <p role="status">{cloudStatus}</p>}<p className="muted">Account saves include original tracks, mix controls, the visual timeline, mappings and production notes. Use Save session copy for an alternate vibe in the same project; each copy is independently editable. Rendering is a separate step.</p>
        </section>
        <StemImporter archive={stemArchive} disabled={busy||saving||!recovery.ready} slots={maxMixTracks-tracks.length} importStems={importStems}/>
        <MyVoicePicker disabled={busy||saving||!recovery.ready||tracks.length>=maxMixTracks} useVoice={async(blob,name)=>{await run(()=>add(blob,name));}}/>
        <div className="field-grid">
          <HelpField label="Import a track" tip="Load an audio file as a separate track so you can trim, place, and mix it."><input type="file" accept={audioAccept + ",audio/*"} disabled={tracks.length >= maxMixTracks} onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void run(() => add(file, file.name));
          }}/></HelpField>
          <HelpField label="Choose a library recording" tip="Select an existing recording and choose Add library track to include it in this mix."><select value={songId} onChange={event => setSongId(event.target.value)}>
            <option value="">Select audio</option>{recordings.map(song => <option key={song.id} value={song.id}>{song.name}</option>)}
          </select></HelpField>
        </div>
        <button className="secondary" disabled={!songId || tracks.length >= maxMixTracks} onClick={() => run(async () => {
          const song = recordings.find(item => item.id === songId);
          if (!song) throw new Error("Choose a recording from the library.");
          const response = await fetch(songAudioUrl(song.id, song.audioId));
          if (!response.ok) throw new Error("Could not load this recording from the library.");
          await add(await response.blob(), song.name);
          if (!projectId) setProjectId(song.id);
        })}>Add library track</button>
        <p className="muted creation-note">Save an editable session to keep originals and controls in your account. Device recovery also protects unsaved work; a rendered WAV is a separate export.</p>
        {tracks.map((track, index) => <section className="panel form-panel mixer-track" key={track.id} aria-label={`Track ${index + 1}`}>
          <div className="section-head"><h2>{index + 1}. {track.name}</h2><button className="secondary small" onClick={() => {
            setTracks(current => current.filter(item => item.id !== track.id)); setOutput(null);
          }}>Remove track</button></div>
          <svg className="record-wave" viewBox="0 0 320 50" preserveAspectRatio="none" role="img" aria-label="Track waveform">
            <line x1="0" y1="25" x2="320" y2="25" stroke="currentColor"/>
            {track.peaks.map((peak, i) => <line key={i} x1={i * 4 + 2} x2={i * 4 + 2} y1={25 - peak * 23} y2={25 + peak * 23} stroke="currentColor" strokeWidth="2"/>)}
          </svg>
          <div className="mixer-controls">
            {([
              ["at", "Placement (seconds)", maxMixSeconds, "Set when this track enters in the mix."],
              ["start", "Trim start (seconds)", track.buffer.duration, "Skip everything before this point in the original recording."],
              ["end", "Trim end (seconds)", track.buffer.duration, "Leave out everything after this point in the original recording."],
            ] as const).map(([key, label, max, tip]) =>
              <HelpField key={key} label={label} tip={tip}><input type="number" min="0" max={max} step="any" value={track[key]} onChange={event => patch(track.id, { [key]: Number(event.target.value) })}/></HelpField>)}
            {controls.map(([key, label, min, max, step, tip]) => <HelpField key={key} label={<>{label} <span className="muted">{track[key]}</span></>} subject={label} tip={tip}>
              <input type="range" min={min} max={max} step={step} value={track[key]} onChange={event => patch(track.id, { [key]: Number(event.target.value) })}/></HelpField>)}
          </div>
          <div className="actions">{([
            ["mute", "Mute", "Silence this track in the mix."],
            ["solo", "Solo", "Listen only to tracks marked Solo."],
            ["compression", "Compression", "Soften peaks to keep this track’s loudness more even."],
          ] as const).map(([key, label, tip]) =>
            <HelpControl key={key} subject={label} tip={tip}><label className="checkline"><input type="checkbox" checked={track[key]} onChange={event => patch(track.id, { [key]: event.target.checked })}/>{label}</label></HelpControl>)}</div>
        </section>)}
        <HelpField label="Project for this mix" tip="Keep this render with its original lyrics, mixes, videos, and release plan."><select value={projectId} onChange={event => setProjectId(event.target.value)}><option value="">New standalone project</option>{songs.map(song => <option key={song.id} value={song.id}>{song.name}</option>)}</select></HelpField>
        <HelpField label="Mix title" tip="Names the exported WAV and the recording if you save it to Your songs."><input value={title} maxLength={100} onChange={event => setTitle(event.target.value)}/></HelpField>
        <div className="actions"><HelpControl subject="Render mix" tip="Combine the active tracks and their settings into one stereo preview and WAV download."><button className="primary" disabled={!tracks.length} onClick={() => run(async () => { const blob = await renderMix(tracks); setOutput({ blob, url: URL.createObjectURL(blob) }); })}>Render mix</button></HelpControl>
          {output && <><a className="secondary" href={output.url} download={filename}>Download stereo WAV</a>
            <HelpControl subject="Save mix to Your songs" tip="Add the rendered mix to your library as a new recording."><button className="secondary" disabled={!title.trim()} onClick={() => save(new File([output.blob], filename, { type: "audio/wav" }), title.trim(), projectId || undefined)}>Save mix to Your songs</button></HelpControl></>}</div>
      </fieldset>
      {busy && <p role="status">Processing audio…</p>}
      {error && <p className="notice" role="alert">{error}</p>}
      {active && output && <AudioPlayer key={output.url} src={output.url} label="Rendered stereo mix"/>}
    </div>
  </div>;
}
