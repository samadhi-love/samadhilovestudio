"use client";
/**
 * My Voices: up to 4 verified voices per person. A voice is verified when the
 * person reads a consent sentence aloud in that same session, confirms it is
 * their own voice and that they are 18 or older. Children's voices are never
 * saved. Saved voices sing over songs in Vocal Studio and become lyric videos.
 */
import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "./audio-player";
import { consentPhrase, myVoiceConsentUrl, myVoiceUrl, verifiedVoiceLimit, verifiedVoiceRules as rules, type SavedVoice } from "./my-voice-data";
import "./my-voices.css";

type Take = { blob: Blob; seconds: number; url: string };
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** One microphone take. Stops the microphone as soon as the take ends or the screen closes. */
function useTake() {
  const [take, setTake] = useState<Take | null>(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const rec = useRef<{ recorder: MediaRecorder; stream: MediaStream; started: number; timer: number } | null>(null);
  const urlRef = useRef<string | null>(null);
  const release = () => { const r = rec.current; if (r) { window.clearInterval(r.timer); r.stream.getTracks().forEach(t => t.stop()); } rec.current = null; };
  const forget = () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = null; setTake(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- on close only: stop the microphone and free the take that exists at that moment, on purpose
  useEffect(() => () => { release(); if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  async function start() {
    setError(""); forget();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const recorder = new MediaRecorder(stream), chunks: Blob[] = [], started = Date.now();
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" }), url = URL.createObjectURL(blob);
        urlRef.current = url; setTake({ blob, seconds: (Date.now() - started) / 1000, url }); setLive(false); release();
      };
      const timer = window.setInterval(() => setElapsed((Date.now() - started) / 1000), 250);
      rec.current = { recorder, stream, started, timer }; setElapsed(0); recorder.start(); setLive(true);
    } catch { setError("Allow microphone access to record, or upload a file instead."); release(); }
  }
  const stop = () => { if (rec.current?.recorder.state === "recording") rec.current.recorder.stop(); };
  async function upload(file: File) {
    setError(""); forget();
    const url = URL.createObjectURL(file);
    const seconds = await new Promise<number>(resolve => { const a = new Audio(); a.preload = "metadata"; a.onloadedmetadata = () => resolve(a.duration); a.onerror = () => resolve(0); a.src = url; });
    if (!Number.isFinite(seconds) || seconds <= 0) { URL.revokeObjectURL(url); setError("That file isn't playable audio. Try an MP3, WAV, M4A or similar."); return; }
    urlRef.current = url; setTake({ blob: file, seconds, url });
  }
  return { take, live, error, elapsed, start, stop, upload, forget };
}

function Recorder({ label, hint, t, allowUpload, testid }: { label: string; hint: string; t: ReturnType<typeof useTake>; allowUpload?: boolean; testid: string }) {
  return <div className="my-voices-recorder" data-testid={testid}>
    <p className="my-voices-step-hint">{hint}</p>
    <div className="my-voices-row">
      {t.live
        ? <button type="button" className="my-voices-rec live" onClick={t.stop} data-testid={`${testid}-stop`}>■ Stop · {clock(t.elapsed)}</button>
        : <button type="button" className="my-voices-rec" onClick={() => void t.start()} data-testid={`${testid}-record`}>● {t.take ? "Record again" : `Record ${label}`}</button>}
      {allowUpload && !t.live && <label className="my-voices-upload">Upload a file<input type="file" accept="audio/*" data-testid={`${testid}-file`} onChange={e => { const f = e.target.files?.[0]; if (f) void t.upload(f); e.target.value = ""; }}/></label>}
    </div>
    {t.take && <div className="my-voices-take"><audio controls src={t.take.url} aria-label={`Listen to your ${label}`}/><span>{clock(t.take.seconds)}</span></div>}
    {t.error && <p role="alert" className="my-voices-error">{t.error}</p>}
  </div>;
}

/** The person's verified voices (oldest first, so places keep their order). */
export function useVerifiedVoices() {
  const [voices, setVoices] = useState<SavedVoice[] | null>(null);
  const [loadError, setLoadError] = useState("");
  async function load() {
    setLoadError("");
    try {
      const response = await fetch(myVoiceUrl(), { cache: "no-store" });
      const result = await response.json() as { voices?: SavedVoice[]; error?: string };
      if (!response.ok || !Array.isArray(result.voices)) throw new Error(result.error);
      setVoices(result.voices.filter(v => v.verified).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    } catch (error) { setLoadError(error instanceof Error && error.message ? error.message : "Your voices could not load. Try again."); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load the saved voices once when the screen opens; later loads are explicit
  useEffect(() => { void load(); }, []);
  return { voices, setVoices, loadError, load };
}

export function MyVoices({ useInSong, makeVideo }: { useInSong: () => void; makeVideo: (voice: SavedVoice) => Promise<void> }) {
  const { voices, setVoices, loadError, load } = useVerifiedVoices();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  async function remove(voice: SavedVoice) {
    if (!window.confirm(`Delete “${voice.name}” and its consent recording? This can't be undone.`)) return;
    setBusy(voice.id); setStatus("");
    try {
      const response = await fetch(myVoiceUrl(voice.id), { method: "DELETE" });
      if (!response.ok) throw new Error(((await response.json().catch(() => null)) as { error?: string } | null)?.error);
      setVoices(list => (list ?? []).filter(v => v.id !== voice.id)); setStatus(`“${voice.name}” was deleted.`);
    } catch (error) { setStatus(error instanceof Error && error.message ? error.message : "The voice could not be deleted. Try again."); }
    finally { setBusy(""); }
  }
  async function video(voice: SavedVoice) {
    setBusy(voice.id); setStatus("Turning your voice into a song for its lyric video…");
    try { await makeVideo(voice); } catch { setStatus("The lyric video could not start. Try again."); } finally { setBusy(""); }
  }
  const count = voices?.length ?? 0, full = count >= verifiedVoiceLimit;
  return <section className="my-voices" aria-labelledby="my-voices-title" data-testid="my-voices">
    <p className="my-voices-eyebrow">Record · My Voices</p>
    <h1 id="my-voices-title">Your voices, kept safe</h1>
    <p className="my-voices-lede">Save up to {verifiedVoiceLimit} of your own voices. Each one is verified by your spoken consent, then ready to sing over your songs and to star in lyric videos.</p>
    {loadError && <p role="alert" className="my-voices-error">{loadError} <button type="button" className="text-button" onClick={() => void load()}>Try again</button></p>}
    {status && <p role="status" className="my-voices-status">{status}</p>}
    <ol className="my-voices-slots" aria-label={`${count} of ${verifiedVoiceLimit} voices saved`}>
      {Array.from({ length: verifiedVoiceLimit }, (_, i) => {
        const voice = voices?.[i];
        if (!voice) return <li key={`empty-${i}`} className="my-voices-slot empty">
          <span className="orb" aria-hidden="true">{i + 1}</span>
          {voices && i === count && !adding ? <button type="button" className="my-voices-add" data-testid="button-add-voice" onClick={() => { setAdding(true); setStatus(""); }}>+ Add a voice</button> : <span className="muted">Empty</span>}
        </li>;
        return <li key={voice.id} className="my-voices-slot" data-testid={`voice-${voice.id}`}>
          <span className="orb" aria-hidden="true">♪</span>
          <h2>{voice.name}</h2>
          <p className="my-voices-badge">✓ Verified{voice.speaker ? ` · ${voice.speaker}` : ""}</p>
          <p className="muted">{clock(voice.duration)} · saved {new Date(voice.createdAt).toLocaleDateString()}</p>
          <AudioPlayer src={myVoiceUrl(voice.id)} label={`Listen to ${voice.name}`}/>
          <details><summary>Consent recording</summary><AudioPlayer src={myVoiceConsentUrl(voice.id)} label={`Consent recording for ${voice.name}`}/></details>
          <div className="my-voices-actions">
            <button type="button" className="secondary small" data-testid={`button-voice-song-${voice.id}`} disabled={!!busy} onClick={useInSong}>Sing it on a song</button>
            <button type="button" className="secondary small" data-testid={`button-voice-video-${voice.id}`} disabled={!!busy} onClick={() => void video(voice)}>Make a lyric video</button>
            <button type="button" className="text-button danger" data-testid={`button-voice-delete-${voice.id}`} disabled={!!busy} onClick={() => void remove(voice)}>Delete</button>
          </div>
        </li>;
      })}
    </ol>
    {full && <p className="muted" data-testid="text-voices-full">All {verifiedVoiceLimit} places are used. Delete a voice to add a new one.</p>}
    {adding && !full && <AddVoice cancel={() => setAdding(false)} saved={voice => { setVoices(list => [...(list ?? []), voice]); setAdding(false); setStatus(`“${voice.name}” is saved and verified.`); }}/>}
    <p className="my-voices-rules">Only your own voice, and only if you are 18 or older. Children&apos;s voices and other people&apos;s voices can&apos;t be saved. Your recordings stay private to your account; nothing is sent to a music service.</p>
  </section>;
}

export function AddVoice({ cancel, saved }: { cancel: () => void; saved: (voice: SavedVoice) => void }) {
  const [name, setName] = useState(""), [speaker, setSpeaker] = useState("");
  const [own, setOwn] = useState(false), [adult, setAdult] = useState(false);
  const [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const consent = useTake(), voice = useTake();
  const phrase = speaker.trim() ? consentPhrase(speaker) : "";
  const problems = [
    !name.trim() && "Name this voice.",
    !speaker.trim() && "Say whose voice it is.",
    !consent.take && "Record the consent sentence.",
    consent.take && consent.take.seconds < rules.consentMin && "The consent recording is too short; read the whole sentence.",
    !voice.take && "Record or upload your voice.",
    voice.take && voice.take.seconds < rules.voiceMin && "Your voice recording should be at least 10 seconds.",
    voice.take && voice.take.seconds > rules.voiceMax && "Keep your voice recording under 10 minutes.",
    !own && "Confirm it's your own voice.",
    !adult && "Confirm you are 18 or older.",
  ].filter(Boolean) as string[];
  async function save() {
    if (problems.length || !consent.take || !voice.take) { setError(problems[0] ?? ""); return; }
    setSaving(true); setError("");
    const form = new FormData();
    form.set("name", name.trim()); form.set("speaker", speaker.trim()); form.set("consentText", phrase);
    form.set("ownVoice", String(own)); form.set("adult", String(adult));
    form.set("voiceDuration", voice.take.seconds.toFixed(1)); form.set("consentDuration", consent.take.seconds.toFixed(1));
    form.set("voice", voice.take.blob, "voice"); form.set("consent", consent.take.blob, "consent");
    try {
      const response = await fetch(myVoiceUrl(), { method: "POST", body: form });
      const result = await response.json().catch(() => null) as { voice?: SavedVoice; error?: string } | null;
      if (!response.ok || !result?.voice) throw new Error(result?.error);
      saved(result.voice);
    } catch (e) { setError(e instanceof Error && e.message ? e.message : "Your voice could not save. Nothing was kept; try again."); }
    finally { setSaving(false); }
  }
  return <section className="my-voices-add-panel" aria-labelledby="add-voice-title" data-testid="add-voice">
    <h2 id="add-voice-title">Add a voice</h2>
    <div className="my-voices-step"><span className="num">1</span><div>
      <label>Voice name<input data-testid="input-voice-name" onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} maxLength={rules.nameMax} value={name} placeholder="My warm singing voice" onChange={e => setName(e.target.value)}/></label>
      <label>Your name<input data-testid="input-voice-speaker" onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }} maxLength={rules.nameMax} value={speaker} placeholder="Samadhi" onChange={e => setSpeaker(e.target.value)}/></label>
    </div></div>
    <div className="my-voices-step"><span className="num">2</span><div>
      <h3>Say it in your own voice</h3>
      {phrase ? <blockquote className="my-voices-phrase" data-testid="text-consent-phrase">“{phrase}”</blockquote> : <p className="muted">Type your name above to see the sentence.</p>}
      {phrase && <Recorder label="consent" hint="Press record and read the sentence aloud." t={consent} testid="consent"/>}
    </div></div>
    <div className="my-voices-step"><span className="num">3</span><div>
      <h3>Sing or speak</h3>
      <Recorder label="your voice" hint="Sing a little of a song you love, or record clearly for at least 10 seconds. A quiet room works best." t={voice} allowUpload testid="voice"/>
    </div></div>
    <label className="my-voices-check"><input type="checkbox" data-testid="checkbox-own-voice" checked={own} onChange={e => setOwn(e.target.checked)}/> This is my own voice.</label>
    <label className="my-voices-check"><input type="checkbox" data-testid="checkbox-adult" checked={adult} onChange={e => setAdult(e.target.checked)}/> I am 18 or older.</label>
    {error && <p role="alert" className="my-voices-error" data-testid="text-add-voice-error">{error}</p>}
    <div className="my-voices-actions">
      <button type="button" className="primary" data-testid="button-save-voice" disabled={saving || consent.live || voice.live} onClick={() => void save()}>{saving ? "Saving…" : "Save verified voice"}</button>
      <button type="button" className="secondary" disabled={saving} onClick={cancel}>Cancel</button>
    </div>
  </section>;
}

/** Create's voice choice: the AI singer, or one of your verified voices to sing the song with after it's made. */
export function VoiceChoice({ value, change, disabled }: { value: SavedVoice | null; change: (voice: SavedVoice | null) => void; disabled?: boolean }) {
  const { voices, setVoices, loadError, load } = useVerifiedVoices();
  const [adding, setAdding] = useState(false);
  const room = (voices?.length ?? 0) < verifiedVoiceLimit;
  return <fieldset className="voice-choice" data-testid="voice-choice" disabled={disabled}>
    <legend>Your voice</legend>
    <div className="voice-choice-options" role="radiogroup" aria-label="Who sings">
      <button type="button" role="radio" aria-checked={!value} data-testid="voice-choice-ai" onClick={() => change(null)}>✦ AI singer</button>
      {voices?.map(v => <button key={v.id} type="button" role="radio" aria-checked={value?.id === v.id} data-testid={`voice-choice-${v.id}`} onClick={() => change(v)}>🎤 {v.name}</button>)}
      {voices && room && !adding && <button type="button" className="voice-choice-add" data-testid="voice-choice-add" onClick={() => setAdding(true)}>+ Add a voice</button>}
    </div>
    <p className="muted" data-testid="text-voice-choice">{value ? `After your song is made, sing it with “${value.name}” in Vocal Studio. Your voice joins the song; the AI makes the music.` : "The AI singer performs your song. Choose one of your saved voices to sing it yourself after it's made."}</p>
    {loadError && <p className="muted" role="status">{loadError} <button type="button" className="text-button" onClick={() => void load()}>Try again</button></p>}
    {adding && <AddVoice cancel={() => setAdding(false)} saved={voice => { setVoices(list => [...(list ?? []), voice]); setAdding(false); change(voice); }}/>}
  </fieldset>;
}
