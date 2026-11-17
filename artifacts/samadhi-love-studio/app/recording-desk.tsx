"use client";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";
import { MantraRecorder } from "./mantra-recorder";

import { allowMicrophone, MicrophoneInput, microphoneError, useMicrophoneInputs } from "./microphone-input";
import { HelpControl, HelpField } from "./help-tip";
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, Download, Mic, Pause, Play, Podcast, Save, Square, Upload } from "lucide-react";
import { decodeTake, maxTakeSeconds, noteNames, podcastCleanup, sampleRate, tuneVoice, wavAudio, waveform, type Scale } from "./recording-dsp";
import { maxAudioBytes, songAudioUrl, type Song } from "./studio-data";

type Mode = "record" | "tune" | "podcast";
type Transport = "idle" | "opening" | "recording" | "paused" | "finishing";
type Take = { id: string; name: string; blob: Blob };
type Result = { blob: Blob; mode: Mode };
type SavedRecording = { id: string; name: string };

const tools = [
  { id: "record", name: "Record", Icon: Mic },
  { id: "tune", name: "Voice Tune", Icon: AudioLines },
  { id: "podcast", name: "Podcast", Icon: Podcast },
] as const;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const filename = (title: string) => (title.trim().replace(/[\\/:*?"<>|]/g, "-") || "Samadhi take") + ".wav";

function useBlobUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!blob) { setUrl(""); return; }
    const url = URL.createObjectURL(blob);
    setUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return url;
}

export function RecordingDesk({ active, requestedMode, songs, saving, onCapture, save, open, mixTake, vocalTake }: {
  active: boolean;
  requestedMode: "record" | "podcast";
  mixTake: (blob: Blob, title: string, projectId?: string) => void;
  vocalTake: (blob: Blob, title: string, narration: boolean, projectId?: string) => void;
  songs: Song[];
  saving: boolean;
  onCapture: (active: boolean) => void;
  save: (file: File, title: string, target: Song | null, projectId?: string, saveId?: string) => Promise<SavedRecording | null>;
  open: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>(requestedMode);
  const [lastRequestedMode, setLastRequestedMode] = useState(requestedMode);
  const microphone = useMicrophoneInputs();
  const [inputMessage, setInputMessage] = useState("");
  const [transport, setTransport] = useState<Transport>("idle");
  const [mantraBusy, setMantraBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [takes, setTakes] = useState<Take[]>([]);
  const [takeId, setTakeId] = useState("");
  const [decoded, setDecoded] = useState<Float32Array | null>(null);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("0");
  const [scale, setScale] = useState<Scale>("chromatic");
  const [keyNote, setKeyNote] = useState("0");
  const [strength, setStrength] = useState(70);
  const [speechGain, setSpeechGain] = useState(0);
  const [bed, setBed] = useState("");
  const [bedLevel, setBedLevel] = useState(13);
  const [title, setTitle] = useState("");
  const [targetId, setTargetId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<SavedRecording | null>(null);
  const [preview, setPreview] = useState<"original" | "processed">("original");
  const recorder = useRef<MediaRecorder | null>(null);
  const input = useRef<MediaStream | null>(null);
  const meterContext = useRef<AudioContext | null>(null);
  const meterFrame = useRef(0);
  const captureLimit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioPreview = useRef<HTMLAudioElement>(null);
  const captureState = useRef<Transport>("idle");
  const started = useRef(0);
  const accumulated = useRef(0);
  const processing = useRef<AbortController | null>(null);
  const alive = useRef(true);

  const take = takes.find(item => item.id === takeId);
  const duration = (decoded?.length ?? 0) / sampleRate;
  const peaks = useMemo(() => decoded ? waveform(decoded) : [], [decoded]);
  const originalUrl = useBlobUrl(take?.blob);
  const processedUrl = useBlobUrl(result?.blob);
  const sourceUrl = preview === "processed" && result ? processedUrl : originalUrl;
  const busy = transport !== "idle" || reading || progress !== null || saving || mantraBusy;
  const trimStart = Number(start);
  const trimEnd = Number(end);
  const validTrim = !!decoded && start !== "" && end !== "" && trimStart >= 0 && trimEnd - trimStart >= 0.095 && trimEnd <= duration + 0.011;

  const recoveryTrim = useRef<{ start: string; end: string; result: Result | null } | null>(null);
  const recovery = useDraftRecovery("recording-desk", { takes, takeId, mode, title, start, end, scale, keyNote, strength, speechGain, bed, bedLevel, targetId, projectId, result }, value => {
    if (!Array.isArray(value.takes) || value.takes.some(take => !(take.blob instanceof Blob))) throw new Error("The saved take is unavailable.");
    recoveryTrim.current = { start: value.start, end: value.end, result: value.result };
    setTakes(value.takes); setTakeId(value.takeId); setMode(value.mode); setTitle(value.title); setScale(value.scale); setKeyNote(value.keyNote); setStrength(value.strength); setSpeechGain(value.speechGain); setBed(value.bed); setBedLevel(value.bedLevel); setTargetId(value.targetId); setProjectId(value.projectId);
  }, takes.length > 0 && transport === "idle");
  function transition(next: Transport) {
    captureState.current = next;
    setTransport(next);
    onCapture(next !== "idle");
  }

  function releaseMic() {
    cancelAnimationFrame(meterFrame.current);
    if (captureLimit.current !== null) clearTimeout(captureLimit.current);
    input.current?.getTracks().forEach(track => track.stop());
    input.current = null;
    if (meterContext.current) void meterContext.current.close();
    meterContext.current = null;
  }

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorder.current?.state !== "inactive") recorder.current?.stop();
      releaseMic();
      processing.current?.abort();
    };
  }, []);

  useEffect(() => { if (!active) audioPreview.current?.pause(); }, [active]);

  useEffect(() => {
    if (transport === "idle") return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [transport]);

  function chooseTake(next: Take) {
    setTakeId(next.id); setTitle(next.name); setTargetId(""); setNotice(""); setError("");
  }

  useEffect(() => {
    let stale = false;
    setResult(null); setPreview("original"); setDecoded(null); setSaved(null);
    if (!take) return;
    setReading(true);
    decodeTake(take.blob).then(samples => {
      if (stale) return;
      setDecoded(samples);
      setStart(recoveryTrim.current?.start ?? "0");
      setEnd(recoveryTrim.current?.end ?? (samples.length / sampleRate).toFixed(2));
      setResult(recoveryTrim.current?.result ?? null);
      recoveryTrim.current = null;
    }).catch(error => {
      if (!stale) setError(error instanceof Error ? error.message : "Could not read this take.");
    }).finally(() => { if (!stale) setReading(false); });
    return () => { stale = true; };
  }, [take]);

  function addTake(blob: Blob, name: string) {
    const next = { id: crypto.randomUUID(), blob, name: name.slice(0, 100) };
    setTakes(items => [...items, next]);
    chooseTake(next);
  }

  function stop() {
    const current = recorder.current;
    if (!current || current.state === "inactive" || captureState.current === "finishing") return;
    if (current.state === "recording") accumulated.current += performance.now() - started.current;
    setElapsed(accumulated.current / 1000);
    transition("finishing");
    current.stop();
    releaseMic();
    setLevel(0);
  }

  async function allowInput() {
    if (captureState.current !== "idle" || !microphone.supported) return;
    transition("opening");
    setError(""); setInputMessage("");
    try {
      await allowMicrophone(microphone.refresh);
      if (alive.current) setInputMessage("Microphone access granted. Choose your input above.");
    } catch (error) {
      if (alive.current) setError(microphoneError(error));
    } finally {
      if (alive.current) transition("idle");
    }
  }

  async function record() {
    if (captureState.current !== "idle" || takes.length >= 3) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Microphone recording is unavailable here. Open the Owner Studio directly in a current browser, or import a file.");
      return;
    }
    transition("opening");
    audioPreview.current?.pause();
    setError(""); setNotice(""); setElapsed(0); setLevel(0);
    let meter: AudioContext | null = null;
    try {
      meter = new AudioContext();
      meterContext.current = meter;
      void meter.resume().catch(() => {});
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...(microphone.device && { deviceId: { exact: microphone.device } }), channelCount: 1, echoCancellation: mode === "podcast", noiseSuppression: mode === "podcast", autoGainControl: false },
      });
      if (!alive.current) { stream.getTracks().forEach(track => track.stop()); return; }
      input.current = stream;
      void microphone.refresh().catch(() => {});
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(item => MediaRecorder.isTypeSupported(item));
      const current = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      let failed = false;
      current.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      current.onerror = () => {
        failed = true;
        stop();
        if (alive.current) setError("Recording stopped because the microphone or browser reported an error.");
      };
      current.onstop = () => {
        releaseMic();
        recorder.current = null;
        if (!alive.current) return;
        transition("idle");
        const blob = new Blob(chunks, { type: current.mimeType || chunks[0]?.type });
        if (!failed && blob.size) addTake(blob, `${mode === "podcast" ? "Podcast" : "Vocal"} take ${takes.length + 1}`);
        else if (!failed) setError("The microphone did not capture any audio.");
      };
      recorder.current = current;
      accumulated.current = 0;
      started.current = performance.now();
      current.start(250);
      transition("recording");
      captureLimit.current = setTimeout(stop, maxTakeSeconds * 1000 - 250);
      stream.getAudioTracks().forEach(track => track.addEventListener("ended", stop, { once: true }));

      // The analyzer reads the microphone without routing it to the speakers.
      const analyzer = meter.createAnalyser();
      analyzer.fftSize = 512;
      meter.createMediaStreamSource(stream).connect(analyzer);
      const values = new Float32Array(analyzer.fftSize);
      let updateAt = 0;
      const draw = (now: number) => {
        if (!recorder.current || recorder.current.state === "inactive") return;
        if (now - updateAt > 80) {
          updateAt = now;
          if (recorder.current.state === "recording") {
            analyzer.getFloatTimeDomainData(values);
            const rms = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
            setLevel(Math.max(0, Math.min(1, (20 * Math.log10(rms) + 55) / 55)));
            const seconds = (accumulated.current + now - started.current) / 1000;
            setElapsed(seconds);
            if (seconds >= maxTakeSeconds - 0.25) { stop(); return; }
          }
        }
        meterFrame.current = requestAnimationFrame(draw);
      };
      meterFrame.current = requestAnimationFrame(draw);
    } catch (error) {
      const current = recorder.current;
      if (current && current.state !== "inactive") current.stop();
      releaseMic();
      if (!alive.current) return;
      transition("idle");
      setError(microphoneError(error));
    }
  }

  function pauseOrResume() {
    const current = recorder.current;
    if (!current) return;
    if (captureState.current === "recording" && current.state === "recording") {
      accumulated.current += performance.now() - started.current;
      if (captureLimit.current !== null) clearTimeout(captureLimit.current);
      current.pause(); setLevel(0); transition("paused");
    } else if (captureState.current === "paused" && current.state === "paused") {
      started.current = performance.now();
      current.resume(); transition("recording");
      captureLimit.current = setTimeout(stop, Math.max(0, maxTakeSeconds * 1000 - accumulated.current - 250));
    }
  }

  function settingsChanged() {
    setResult(null); setPreview("original"); setSaved(null); setNotice(""); setError("");
  }

  async function render() {
    if (!decoded || !validTrim || processing.current) return;
    const controller = new AbortController();
    processing.current = controller;
    setNotice(""); setError(""); setProgress(0); setSaved(null);
    try {
      const segment = decoded.slice(Math.round(trimStart * sampleRate), Math.round(trimEnd * sampleRate));
      let processed: Float32Array = segment;
      if (mode === "tune") {
        const tuned = await tuneVoice(segment, Number(keyNote), scale, strength / 100, setProgress, controller.signal);
        processed = tuned.samples;
        if (strength && !tuned.voicedFrames) setNotice("No steady vocal pitch was detected. Try a clean, solo vocal.");
      }
      if (mode === "podcast") {
        const song = songs.find(song => song.id === bed && song.audioFormat);
        let backing: Float32Array | undefined;
        if (song) {
          const response = await fetch(songAudioUrl(song.id, song.audioId), { signal: controller.signal });
          if (!response.ok) throw new Error("The music bed could not load. Choose another track or select None.");
          backing = await decodeTake(await response.blob());
        }
        setProgress(0.5);
        processed = await podcastCleanup(segment, speechGain, backing, bedLevel / 100);
      }
      controller.signal.throwIfAborted();
      setResult({ blob: wavAudio(processed), mode }); setPreview("processed");
      if (mode !== "tune") setNotice(mode === "podcast" ? "Podcast mix ready to preview." : "Trimmed take ready to preview.");
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Audio processing failed.");
    } finally { processing.current = null; if (alive.current) setProgress(null); }
  }

  if (lastRequestedMode !== requestedMode) {
    setLastRequestedMode(requestedMode);
    setMode(requestedMode);
    setResult(null);
    setPreview("original");
  }
  useEffect(() => () => processing.current?.abort(), [requestedMode]);

  async function saveTake() {
    if (!decoded || !title.trim() || !validTrim) return;
    setError(""); setNotice("");
    const target = songs.find(song => song.id === targetId && !song.audioFormat) ?? null;
    const blob = result?.blob ?? wavAudio(decoded.slice(Math.round(trimStart * sampleRate), Math.round(trimEnd * sampleRate)));
    const saved = await save(new File([blob], filename(title), { type: "audio/wav" }), title.trim(), target, target ? undefined : projectId || undefined);
    if (saved) setSaved(saved);
  }

  return <div hidden={!active}><RecoveryPanel recovery={recovery}/>
    <div className="create-banner"><span className="eyebrow"><AudioLines size={16}/> AUDIO PRODUCTION</span>
      <h1>Recording Desk</h1><p>Capture a vocal, tune a take, or mix a podcast. Preview your work before saving it to the Song Library.</p>
    </div>
    <MantraRecorder active={active} disabled={transport!=="idle"||reading||progress!==null||saving} device={microphone.device}
      onCapture={value=>{setMantraBusy(value);onCapture(value);}} save={save} open={open}/>
    <div className="create-layout recording-layout">
      <section className="panel form-panel">
        <div className="tabs recording-tabs" aria-label="Recording mode">{tools.map(({ id, name, Icon }) =>
          <button key={id} aria-pressed={mode === id} className={mode === id ? "tab-active" : ""} disabled={busy} onClick={() => {
            setMode(id); settingsChanged();
          }}><Icon size={16}/> {name}</button>)}</div>
        <fieldset disabled={busy}>
          <MicrophoneInput microphone={microphone}/>
          <button type="button" className="secondary small" disabled={!microphone.supported} onClick={allowInput}>Allow microphone</button>
        </fieldset>
        {inputMessage && <p className="muted" role="status">{inputMessage}</p>}
        <p className="mobile-context-note">Allow microphone access, then record a short test and listen back. Keep this page open while recording. Stop and save your take before locking the phone or switching apps; calls and backgrounding can interrupt capture.</p>
        <div className="record-transport">
          <div className="record-clock"><span className={transport === "recording" ? "record-live" : ""}>{transport === "recording" ? "● RECORDING" : transport === "paused" ? "● PAUSED" : "INPUT"}</span>
            <strong>{clock(elapsed)}</strong></div>
          <meter aria-label="Microphone input level" min={0} max={1} value={level}/>
          <div className="actions">
            {transport === "idle" ? <HelpControl subject="Start recording" tip="Start a new take using the selected microphone. Your browser may ask for permission."><button className="primary" disabled={busy || takes.length >= 3} onClick={record}><Mic size={16}/> Start recording</button></HelpControl> :
              transport === "recording" || transport === "paused" ? <>
                <button className="secondary" onClick={pauseOrResume}>{transport === "paused" ? <><Play size={15}/> Resume</> : <><Pause size={15}/> Pause</>}</button>
                <button className="primary" onClick={stop}><Square size={15}/> Stop recording</button>
              </> : <p role="status">{transport === "opening" ? "Waiting for microphone access…" : "Finishing take…"}</p>}
          </div>
        </div>
        <p className="muted creation-note">Up to 8 minutes per take. The microphone opens when you press Start recording. Takes stay in this tab until you save or download them.</p>
        <HelpField label={<><Upload size={14}/> Import audio</>} subject="Import audio" tip="Bring in an existing audio file to trim, tune, or mix as a take."><input type="file" accept=".mp3,.wav,.m4a,.aac,.webm,.ogg,.flac,audio/*" disabled={busy || takes.length >= 3} onChange={event => {
          const file = event.target.files?.[0]; event.target.value = "";
          if (!file) return;
          if (!file.size || file.size > maxAudioBytes) { setError("Choose an audio file up to 96 MB."); return; }
          addTake(file, file.name.replace(/\.[^.]+$/, ""));
        }}/></HelpField>
        {takes.length >= 3 && <p className="muted">Three takes are open. Remove one to record or import another.</p>}
        {takes.length > 0 && <div className="actions take-chooser">
          <HelpField label="Take" tip="Switch between the clips you recorded or imported for this session."><select value={takeId} disabled={busy} onChange={event => {
            const next = takes.find(item => item.id === event.target.value);
            if (next) chooseTake(next);
          }}>{takes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></HelpField>
          <button className="secondary" disabled={busy} onClick={() => {
            const remaining = takes.filter(item => item.id !== takeId);
            setTakes(remaining);
            if (remaining.length) chooseTake(remaining[remaining.length - 1]);
            else { setTakeId(""); setTitle(""); setError(""); setNotice(""); }
          }}>Remove take</button>
        </div>}
        {reading && <p role="status">Reading the waveform…</p>}
        {decoded && <>
          <svg className="record-wave" viewBox="0 0 448 88" preserveAspectRatio="none" role="img" aria-label="Take waveform and selected trim range">
            {validTrim && <rect x={trimStart / duration * 448} width={(trimEnd - trimStart) / duration * 448} y="0" height="88" fill="#433250"/>}
            {peaks.map((value, index) => <rect key={index} x={index * 4} width="2" height={Math.max(2, value * 82)}
              y={44 - Math.max(1, value * 41)} rx="1" fill={index / peaks.length * duration >= trimStart && index / peaks.length * duration <= trimEnd ? "#efadcb" : "#70576d"}/>)}
          </svg>
          <div className="field-grid">
            <HelpField label="Trim start (seconds)" tip="Set the first point to keep. Audio before this point is left out of the result."><input type="number" min="0" max={duration.toFixed(2)} step="0.01" value={start} disabled={busy}
              onChange={event => { setStart(event.target.value); settingsChanged(); }}/></HelpField>
            <HelpField label="Trim end (seconds)" tip="Set the last point to keep. Audio after this point is left out of the result."><input type="number" min="0" max={duration.toFixed(2)} step="0.01" value={end} disabled={busy}
              onChange={event => { setEnd(event.target.value); settingsChanged(); }}/></HelpField>
          </div>
          {!validTrim && <p className="muted">Choose a range at least 0.1 seconds long within the take.</p>}
          {result && <div className="chips">
            <button className={`chip ${preview === "original" ? "active" : ""}`} aria-pressed={preview === "original"} onClick={() => setPreview("original")}>Original</button>
            <button className={`chip ${preview === "processed" ? "active" : ""}`} aria-pressed={preview === "processed"} onClick={() => setPreview("processed")}>Processed</button>
          </div>}
          {sourceUrl && <audio ref={audioPreview} className="record-player" controls preload="metadata" aria-label={preview === "processed" ? "Processed audio preview" : "Original audio preview"} src={sourceUrl}/>}
        </>}
        {error && <p className="notice" role="alert">{error}</p>}
      </section>
      <section className="panel form-panel recording-controls">
        <h2>{mode === "tune" ? "Voice Tune" : mode === "podcast" ? "Podcast mix" : "Take editor"}</h2>
        {mode === "tune" ? <>
          <p className="muted creation-note">Correct the pitch of one isolated vocal after recording. Compare it with the original before saving.</p>
          <div className="field-grid">
            <HelpField label="Scale" tip="Choose the notes pitch correction will use. Chromatic allows every note."><select value={scale} disabled={busy} onChange={event => { setScale(event.target.value as Scale); settingsChanged(); }}>
              <option value="chromatic">Chromatic (all notes)</option><option value="major">Major</option><option value="minor">Minor</option></select></HelpField>
            <HelpField label="Key" tip="Set the root note for pitch correction when you select a major or minor scale."><select value={keyNote} disabled={busy || scale === "chromatic"} onChange={event => { setKeyNote(event.target.value); settingsChanged(); }}>
              {noteNames.map((note, index) => <option key={note} value={index}>{note}</option>)}</select></HelpField>
          </div>
          <HelpField label={<>Correction strength · {strength}%</>} subject="Correction strength" tip="A higher percentage moves the vocal pitch more firmly toward the chosen notes."><input type="range" min="0" max="100" value={strength} disabled={busy}
            onChange={event => { setStrength(Number(event.target.value)); settingsChanged(); }}/></HelpField>
        </> : mode === "podcast" ? <>
          <p className="muted creation-note">Reduce low rumble, level speech, and add a quiet music bed.</p>
          <HelpField label={<>Voice gain · {speechGain} dB</>} subject="Voice gain" tip="Raise or lower the voice level in the podcast mix."><input type="range" min="-8" max="6" value={speechGain} disabled={busy}
            onChange={event => { setSpeechGain(Number(event.target.value)); settingsChanged(); }}/></HelpField>
          <HelpField label="Music bed" tip="Choose a library recording to play underneath the voice."><select value={bed} disabled={busy} onChange={event => { setBed(event.target.value); settingsChanged(); }}>
            <option value="">None</option>{songs.filter(song => song.audioFormat).map(song => <option key={song.id} value={song.id}>{song.name}</option>)}</select></HelpField>
          {bed && <HelpField label={<>Music level · {bedLevel}%</>} subject="Music level" tip="Adjust how loud the background music is in the podcast mix."><input type="range" min="0" max="35" value={bedLevel} disabled={busy}
            onChange={event => { setBedLevel(Number(event.target.value)); settingsChanged(); }}/></HelpField>}
        </> : <p className="muted creation-note">Set the start and end points, then preview the trimmed take.</p>}
        <div className="actions"><HelpControl subject="Process take" tip="Process the selected portion of your take. The label changes with the mode you choose."><button className="primary" disabled={!validTrim || busy} onClick={render}>
          {mode === "tune" ? "Apply voice tuning" : mode === "podcast" ? "Mix podcast" : "Preview trim"}</button></HelpControl>
          {progress !== null && <button className="secondary" onClick={() => processing.current?.abort()}>Cancel processing</button>}</div>
        {progress !== null && <progress max="1" value={progress} aria-label="Audio processing progress"/>}
        {notice && <p className="muted" role="status">{notice}</p>}
        <div className="record-save">
          <h2>Save or export</h2>
          <label className="field">Recording title<input value={title} maxLength={100} disabled={busy} onChange={event => { setTitle(event.target.value); setSaved(null); }}/></label>
          <HelpField label="Project for new recordings" tip="Keep a new take linked to an existing project."><select value={projectId} disabled={busy} onChange={event => setProjectId(event.target.value)}><option value="">New standalone project</option>{songs.filter(song => !song.projectId).map(song => <option key={song.id} value={song.id}>{song.name}</option>)}</select></HelpField>
          <HelpField label="Save destination" tip="Save as a new library recording or attach this take to an existing song without audio."><select value={targetId} disabled={busy} onChange={event => { setTargetId(event.target.value); setSaved(null); }}>
            <option value="">New Song Library recording</option>{songs.filter(song => !song.audioFormat).map(song => <option key={song.id} value={song.id}>Attach to {song.name}</option>)}</select></HelpField>
          <div className="actions">
            <button className="secondary" disabled={busy || !title.trim() || !validTrim || (mode !== "record" && !result) || !!saved}
              onClick={saveTake}><Save size={16}/> Save to Song Library</button>
            <HelpControl subject="Add take to mixer" tip="Send this take to the multitrack workspace so you can combine it with other audio."><button className="secondary" disabled={busy || !validTrim || (mode !== "record" && !result)} onClick={() => {
              if (!decoded) return;
              const blob = result?.blob ?? wavAudio(decoded.slice(Math.round(trimStart * sampleRate), Math.round(trimEnd * sampleRate)));
              mixTake(blob, title.trim() || "Recording Desk take", projectId || targetId || undefined);
            }}>Add take to mixer</button></HelpControl>
            <HelpControl subject="Send to Vocal Studio" tip="Copy this take into an editable Vocal Studio session. This keeps the take in the Recording Desk too.">
              <button type="button" className="secondary" disabled={busy || !validTrim || (mode !== "record" && !result)} onClick={() => {
                if (!decoded) return;
                const blob = result?.blob ?? wavAudio(decoded.slice(Math.round(trimStart * sampleRate), Math.round(trimEnd * sampleRate)));
                vocalTake(blob, title.trim() || "Recording Desk take", mode === "podcast", projectId || targetId || undefined);
              }}>Send to Vocal Studio</button></HelpControl>
            {processedUrl && result && <a className="secondary" href={processedUrl} download={filename(title)}><Download size={16}/> Download WAV</a>}
          </div>
          {saved && <p role="status">Saved to Song Library. <button className="text-button" onClick={() => open(saved.id)}>Open {saved.name}</button></p>}
          {!result && mode !== "record" && <p className="muted creation-note">Apply the effect to preview it and enable WAV export.</p>}
        </div>
      </section>
    </div>
  </div>;
}
