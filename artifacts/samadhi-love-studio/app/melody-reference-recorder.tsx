"use client";

import { useEffect, useRef, useState } from "react";

export const melodyReferenceLimitSeconds = 5 * 60;
export type MelodyReferenceTake = { id: string; blob: Blob; durationSeconds: number };

export function formatMelodyTimer(value: number) {
  const seconds = Math.max(0, Math.min(melodyReferenceLimitSeconds, Math.floor(Number.isFinite(value) ? value : 0)));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function MelodyReferenceRecorder({
  disabled = false,
  takes,
  onTake,
  onRemove,
}: {
  disabled?: boolean;
  takes: MelodyReferenceTake[];
  onTake: (blob: Blob, durationSeconds: number) => void;
  onRemove: (id: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const ticker = useRef<number | undefined>(undefined);
  const startedAt = useRef(0);
  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  useEffect(() => {
    if (!recording) return;
    const update = () => setElapsedSeconds(Math.min(melodyReferenceLimitSeconds, Math.floor((Date.now() - startedAt.current) / 1000)));
    ticker.current = window.setInterval(update, 1000);
    return () => {
      if (ticker.current !== undefined) window.clearInterval(ticker.current);
      ticker.current = undefined;
    };
  }, [recording]);

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
      if (ticker.current !== undefined) window.clearInterval(ticker.current);
      recorder.current?.stop();
      stream.current?.getTracks().forEach(track => track.stop());
    },
    [],
  );

  async function start() {
    if (!supported || disabled || recording) return;
    setError("");
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = input;
      chunks.current = [];
      const mimeType = typeof MediaRecorder.isTypeSupported === "function"
        ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(type => MediaRecorder.isTypeSupported(type))
        : undefined;
      const instance = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
      recorder.current = instance;
      instance.ondataavailable = event => {
        if (event.data.size) chunks.current.push(event.data);
      };
      instance.onerror = () => {
        setError("Recording stopped unexpectedly. Your previous song and saved work are safe.");
        if (instance.state === "recording") instance.stop();
      };
      instance.onstop = () => {
        const blob = new Blob(chunks.current, { type: instance.mimeType || "audio/webm" });
        input.getTracks().forEach(track => track.stop());
        stream.current = null;
        recorder.current = null;
        setRecording(false);
        if (timer.current !== undefined) window.clearTimeout(timer.current);
        timer.current = undefined;
        const durationSeconds = Math.min(melodyReferenceLimitSeconds, Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
        setElapsedSeconds(durationSeconds);
        if (blob.size) onTake(blob, durationSeconds);
        else setError("No audio was captured. Check microphone permission and try again.");
      };
      setElapsedSeconds(0);
      startedAt.current = Date.now();
      instance.start(1000);
      setRecording(true);
      timer.current = window.setTimeout(() => {
        if (instance.state === "recording") instance.stop();
      }, melodyReferenceLimitSeconds * 1000);
    } catch (cause) {
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
      setError(cause instanceof Error && cause.name === "NotAllowedError"
        ? "Allow microphone access to record a private reference."
        : "The microphone could not start. Check its connection and try again.");
    }
  }

  function stop() {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = undefined;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  return (
    <section className="melody-reference" aria-label="Sing or hum your idea">
      <h3>Sing or hum your idea · optional</h3>
      <p className="muted">Record a full melody up to 5 minutes and keep several takes. They stay private and are saved with your song as references; they are not sent to ElevenLabs.</p>
      <p className="melody-recording-timer" role="status" aria-live="polite" data-testid="melody-recording-timer">{recording ? "Recording" : takes.length ? `${takes.length} take${takes.length === 1 ? "" : "s"} ready` : "Ready"} · {formatMelodyTimer(elapsedSeconds)} / {formatMelodyTimer(melodyReferenceLimitSeconds)}</p>
      {recording
        ? <button type="button" className="primary melody-record-button" data-testid="button-stop-melody-reference" onClick={stop}>Stop recording</button>
        : <button type="button" className="primary melody-record-button" data-testid="button-record-melody-reference" disabled={disabled || !supported} onClick={() => void start()}>{takes.length ? "Record another take" : "Record a melody idea"}</button>}
      {!supported && <p className="muted">Microphone recording is not available in this browser.</p>}
      {!!takes.length && <div className="melody-reference-takes" aria-label="Recorded melody takes">{takes.map((take,index)=><MelodyTakePreview key={take.id} take={take} index={index} disabled={disabled} onRemove={onRemove}/>)}</div>}
      {error && <p role="alert" className="notice">{error}</p>}
    </section>
  );
}

function MelodyTakePreview({take,index,disabled,onRemove}:{take:MelodyReferenceTake;index:number;disabled:boolean;onRemove:(id:string)=>void}) {
  const [url,setUrl]=useState("");
  useEffect(()=>{const next=URL.createObjectURL(take.blob);setUrl(next);return()=>URL.revokeObjectURL(next);},[take.blob]);
  return <div className="melody-reference-take" data-testid="melody-reference-take">
    <strong>Take {index+1} · {formatMelodyTimer(take.durationSeconds)}</strong>
    <audio controls preload="none" src={url||undefined} aria-label={`Play melody take ${index+1}`}/>
    <button type="button" className="text-button" disabled={disabled} onClick={()=>onRemove(take.id)}>Remove take {index+1}</button>
  </div>;
}
