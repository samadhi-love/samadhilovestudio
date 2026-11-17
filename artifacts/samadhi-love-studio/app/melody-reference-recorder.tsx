"use client";

import { useEffect, useRef, useState } from "react";

export function MelodyReferenceRecorder({
  disabled = false,
  take,
  onTake,
  onClear,
}: {
  disabled?: boolean;
  take: Blob | null;
  onTake: (blob: Blob, durationSeconds: number) => void;
  onClear: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const startedAt = useRef(0);
  const audioUrl = useRef("");
  const [previewUrl, setPreviewUrl] = useState("");
  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  useEffect(() => {
    if (!take) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(take);
    audioUrl.current = url;
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      if (audioUrl.current === url) audioUrl.current = "";
    };
  }, [take]);

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
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
      instance.onerror = () => setError("Recording stopped unexpectedly. Your previous song and saved work are safe.");
      instance.onstop = () => {
        const blob = new Blob(chunks.current, { type: instance.mimeType || "audio/webm" });
        input.getTracks().forEach(track => track.stop());
        stream.current = null;
        recorder.current = null;
        setRecording(false);
        if (timer.current !== undefined) window.clearTimeout(timer.current);
        timer.current = undefined;
        if (blob.size) onTake(blob, Math.min(30, Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))));
        else setError("No audio was captured. Check microphone permission and try again.");
      };
      instance.start();
      startedAt.current = Date.now();
      setRecording(true);
      timer.current = window.setTimeout(() => {
        if (instance.state === "recording") instance.stop();
      }, 30_000);
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
      <p className="muted">Record up to 30 seconds. It stays private and is saved with the song as a reference; it is not sent to ElevenLabs because this music engine cannot follow hummed melodies yet.</p>
      {recording
        ? <button type="button" className="primary melody-record-button" data-testid="button-stop-melody-reference" onClick={stop}>Stop recording</button>
        : <button type="button" className="primary melody-record-button" data-testid="button-record-melody-reference" disabled={disabled || !supported} onClick={() => void start()}>Record a melody idea</button>}
      {!supported && <p className="muted">Microphone recording is not available in this browser.</p>}
      {take && <>
        <audio controls src={previewUrl || undefined} aria-label="Preview melody reference"/>
        <div className="actions">
          <span className="muted">Reference ready · up to 30 seconds</span>
          <button type="button" className="text-button" disabled={disabled} onClick={onClear}>Remove reference</button>
        </div>
      </>}
      {error && <p role="alert" className="notice">{error}</p>}
    </section>
  );
}
