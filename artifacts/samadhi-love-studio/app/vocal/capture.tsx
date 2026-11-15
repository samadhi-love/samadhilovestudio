"use client";

import { useEffect, useRef, useState } from "react";
import { allowMicrophone, MicrophoneInput, microphoneError, useMicrophoneInputs } from "../microphone-input";
import { HelpField, HelpControl } from "../help-tip";
import { roles, sessionSeconds, type Role } from "./session";

type Transport = "idle" | "opening" | "countdown" | "recording" | "paused" | "finishing";

function release(stream?: MediaStream) {
  stream?.getTracks().forEach(track => track.stop());
}

export function Capture({ bpm, busy, onCapture, onTake, retake, beforeRecord, role, setRole, backing, position, retakePosition }: {
  bpm: number; busy: boolean; onCapture: (active: boolean) => void;
  onTake: (blob: Blob, role: Role, retake: boolean, offsetMs: number) => void;
  backing?: AudioBuffer; position: number; retakePosition?: number;
  retake: boolean; beforeRecord: () => void; role: Role; setRole: (role: Role) => void;
}) {
  const microphone = useMicrophoneInputs();
  const [state, setState] = useState<Transport>("idle");
  const [headphones, setHeadphones] = useState(false);
  const [countIn, setCountIn] = useState(4);
  const [backingLevel, setBackingLevel] = useState(.65);
  const [offsetMs, setOffsetMs] = useState(0);
  const [metronome, setMetronome] = useState(false);
  const [count, setCount] = useState(0);
  const [level, setLevel] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const current = useRef<{ context?: AudioContext; stream?: MediaStream; recorder?: MediaRecorder; timer?: number; playback?: AudioBufferSourceNode; backing?: AudioBuffer; position?: number;
    frame?: number; mode: Transport; canceled?: boolean; time: number; started: number }>({ mode: "idle", time: 0, started: 0 });
  const mounted = useRef(true);
  function dispose() {
    const item = current.current;
    window.clearInterval(item.timer);
    if (item.frame) cancelAnimationFrame(item.frame);
    release(item.stream);
    if (item.context && item.context.state !== "closed") void item.context.close().catch(() => {});
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const item = current.current;
      item.canceled = true;
      if (item.recorder && item.recorder.state !== "inactive") item.recorder.stop();
      dispose();
    };
  }, []);

  useEffect(() => {
    if (state === "idle") return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [state]);

  function transition(mode: Transport) {
    current.current.mode = mode;
    setState(mode);
    onCapture(mode !== "idle");
  }

  function requestMic() {
    return navigator.mediaDevices.getUserMedia({ audio: {
      ...(microphone.device && { deviceId: { exact: microphone.device } }), channelCount: 1,
      echoCancellation: false, autoGainControl: false, noiseSuppression: false,
    } });
  }

  async function allow() {
    if (!microphone.supported || current.current.mode !== "idle") return;
    transition("opening"); setError(""); setPermission("");
    try {
      await allowMicrophone(microphone.refresh);
      if (mounted.current) setPermission("Microphone access granted. Choose an input to record.");
    } catch (error) { if (mounted.current) setError(microphoneError(error)); }
    finally { if (mounted.current) transition("idle"); }
  }

  function playBacking() {
    const item = current.current;
    const offset = (item.position ?? 0) + item.time;
    if (!item.context || !item.backing || offset >= item.backing.duration) return;
    const node = item.context.createBufferSource();
    node.buffer = item.backing;
    const volume = item.context.createGain(); volume.gain.value = backingLevel;
    node.connect(volume).connect(item.context.destination);
    node.start(0, offset);
    item.playback = node;
  }

  function stop() {
    const item = current.current;
    if (item.mode === "idle" || item.mode === "finishing") return;
    if (!item.recorder || item.recorder.state === "inactive") {
      item.canceled = true; dispose(); transition("idle"); setCount(0); setLevel(0);
      return;
    }
    if (item.mode === "recording") item.time += item.context!.currentTime - item.started;
    setElapsed(item.time);
    transition("finishing");
    item.playback?.stop();
    item.recorder.stop();
  }

  async function start(isRetake: boolean) {
    if (!microphone.supported || busy || current.current.mode !== "idle") return;
    beforeRecord();
    setError(""); setPermission(""); setElapsed(0); setLiveWave([]); setLevel(0);
    const at = isRetake ? retakePosition ?? position : position;
    const item = { mode: "opening", time: 0, started: 0, backing, position: at } as typeof current.current;
    current.current = item; transition("opening");
    try {
      const context = item.context = new AudioContext();
      const resumed = context.resume();
      void resumed.catch(() => {});
      const stream = await requestMic();
      if (!mounted.current || item.canceled) { release(stream); return; }
      item.stream = stream;
      await resumed;
      if (item.canceled) return;
      void microphone.refresh().catch(() => {});
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      if (headphones) {
        const monitor = context.createGain(); monitor.gain.value = 0.28;
        source.connect(monitor).connect(context.destination);
      }
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = item.recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const parts: Blob[] = [];
      recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
      recorder.onerror = () => {
        item.canceled = true;
        setError("The microphone stopped unexpectedly. Check your input and try again.");
        stop();
      };
      recorder.onstop = () => {
        if (current.current !== item) return;
        dispose();
        if (!mounted.current) return;
        setLevel(0); setCount(0);
        if (!item.canceled && parts.length) onTake(new Blob(parts, { type: recorder.mimeType || parts[0].type }), role, isRetake, offsetMs);
        else if (!item.canceled) setError("The microphone did not capture an audio file.");
        transition("idle");
      };
      stream.getAudioTracks().forEach(track => track.addEventListener("ended", stop, { once: true }));
      const samples = new Float32Array(analyser.fftSize);
      let lastFrame = 0;
      function meter(now: number) {
        if (now - lastFrame > 65) {
          lastFrame = now;
          analyser.getFloatTimeDomainData(samples);
          const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
          setLevel(Math.max(0, (60 + 20 * Math.log10(Math.max(rms, 0.001))) / 60));
          setLiveWave(Array.from({ length: 64 }, (_, i) => samples[i * 16]));
          const seconds = item.time + (item.mode === "recording" ? context.currentTime - item.started : 0);
          setElapsed(seconds);
          if (seconds >= Math.max(0.05, sessionSeconds - at - 0.15)) { stop(); return; }
        }
        item.frame = requestAnimationFrame(meter);
      }
      item.frame = requestAnimationFrame(meter);
      const beat = 60 / bpm;
      let next = context.currentTime + 0.07;
      let beatIndex = 0;
      function tick() {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.frequency.value = beatIndex % 4 === 0 ? 1150 : 780;
        osc.connect(gain).connect(context.destination);
        gain.gain.setValueAtTime(0.06, next);
        gain.gain.exponentialRampToValueAtTime(0.0001, next + 0.045);
        osc.start(next); osc.stop(next + 0.05);
      }
      function begin() {
        recorder.start(250);
        item.started = context.currentTime;
        playBacking();
        setCount(0); transition("recording");
      }
      if (countIn) { transition("countdown"); setCount(countIn); }
      else begin();
      item.timer = window.setInterval(() => {
        if (item.mode === "recording" && item.time + context.currentTime - item.started >= Math.max(0.05, sessionSeconds - at - 0.15)) { stop(); return; }
        if (item.mode === "paused" || item.mode === "finishing") { next = context.currentTime + 0.05; return; }
        if (next > context.currentTime + 0.025) return;
        next = Math.max(next, context.currentTime);
        if (item.mode === "countdown" && beatIndex === countIn) begin();
        if (item.mode === "countdown") setCount(countIn - beatIndex);
        if (item.mode === "countdown" || metronome) tick();
        next += beat; beatIndex++;
      }, 15);
    } catch (error) {
      if (item.canceled || !mounted.current) return;
      item.canceled = true;
      if (item.recorder && item.recorder.state !== "inactive") item.recorder.stop();
      dispose(); setError(microphoneError(error)); transition("idle");
    }
  }

  function pause() {
    const item = current.current;
    if (item.recorder?.state === "recording") {
      item.time += item.context!.currentTime - item.started;
      item.playback?.stop(); item.playback = undefined;
      item.recorder.pause(); transition("paused");
    } else if (item.recorder?.state === "paused") {
      item.started = item.context!.currentTime;
      item.recorder.resume(); playBacking(); transition("recording");
    }
  }

  return <section className="panel form-panel" aria-label="Vocal recording">
    <h2>1. Record a take</h2>
    <p className="muted">Select any microphone your browser can access. Use headphones for monitoring or the metronome. Retakes add a new clip and keep the original.</p>
    <fieldset disabled={state !== "idle" || busy}>
      <div className="field-grid">
        <MicrophoneInput microphone={microphone}/>
        <HelpField label="Take type" tip="Label the part you’re recording. Each take becomes a separate clip."><select value={role} onChange={e => setRole(e.target.value as Role)}>
          {roles.map(r => <option key={r}>{r}</option>)}</select></HelpField>
        <HelpField label="Count-in" tip="Hear the tempo before the take starts."><select value={countIn} onChange={e => setCountIn(Number(e.target.value))}>
          <option value="0">Off</option><option value="4">4 beats</option><option value="8">8 beats</option></select></HelpField>
        <label className="field">Backing playback · {Math.round(backingLevel * 100)}%<input type="range" min="0" max="1" step=".05" value={backingLevel} onChange={e => setBackingLevel(e.target.valueAsNumber)}/></label>
        <HelpField label="Recording offset correction (ms)" tip="Manual timing adjustment for device latency. Positive values move the new take earlier; negative values move it later. Start at zero and check a short test take."><input type="number" min="-500" max="500" step="5" value={offsetMs} onChange={e => { const n = e.target.valueAsNumber; if (Number.isFinite(n) && n >= -500 && n <= 500) setOffsetMs(n); }}/></HelpField>
      </div>
      <div className="actions">
        <button className="secondary small" type="button" disabled={!microphone.supported} onClick={allow}>Allow microphone</button>
        <HelpControl subject="Headphone monitoring" tip="Hear the dry microphone through your current audio output. Wear headphones to avoid feedback."><label className="checkline">
          <input type="checkbox" checked={headphones} onChange={e => setHeadphones(e.target.checked)}/> Headphone monitoring</label></HelpControl>
        <label className="checkline"><input type="checkbox" checked={metronome} onChange={e => setMetronome(e.target.checked)}/> Metronome</label>
      </div>
    </fieldset>
    <div className="vocal-meter"><meter min={0} max={1} value={Math.min(1, level)} aria-label="Microphone level"/>
      <span>{elapsed.toFixed(1)} s</span></div>
    <svg className="record-wave" viewBox="0 0 320 48" preserveAspectRatio="none" role="img" aria-label="Live microphone waveform">
      <line x1="0" x2="320" y1="24" y2="24" stroke="currentColor"/>
      <polyline points={liveWave.map((value, index) => `${index * 5},${24 - 23 * value}`).join(" ")} fill="none" stroke="currentColor"/>
    </svg>
    <div className="actions">
      {state === "idle" ? <><button type="button" className="primary" disabled={!microphone.supported || busy} onClick={() => start(false)}>Record</button>
        <button type="button" className="secondary" disabled={!microphone.supported || busy || !retake} onClick={() => start(true)}>Retake</button></> :
        <><button type="button" className="secondary" disabled={state !== "recording" && state !== "paused"} onClick={pause}>{state === "paused" ? "Resume" : "Pause"}</button>
          <button type="button" className="primary" disabled={state === "finishing"} onClick={stop}>Stop</button>
          <strong role="status">{state === "countdown" ? `Starts in ${count} beats` : state === "opening" ? "Opening microphone…" : state === "finishing" ? "Saving take…" : state === "paused" ? "Paused" : "Recording"}</strong></>}
    </div>
    {permission && <p role="status">{permission}</p>}
    {error && <p className="notice" role="alert">{error}</p>}
  </section>;
}
