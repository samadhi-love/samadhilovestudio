"use client";
/** Echo & Voices: live echo, repeat chorus, many voices, stadium and voice changer, then record the result. */
import { useEffect, useRef, useState } from "react";
import { EchoVoicesAudio, canChooseOutput, defaultFx, voiceShapes, type ChorusSize, type EchoLength, type FxSettings, type Space, type VoiceShape } from "./echo-voices-audio";
import "./echo-voices.css";

const echoChoices: [EchoLength, string][] = [["off", "Off"], ["short", "Short"], ["medium", "Medium"], ["long", "Long"], ["cosmos", "Into the cosmos"]];
const chorusChoices: [ChorusSize, string][] = [[0, "Just me"], [3, "3 voices"], [6, "6 voices"], [12, "12 voices"]];
const spaceChoices: [Space, string][] = [["none", "Off"], ["arena", "Arena"], ["stadium", "Stadium"]];
export const blends: { id: string; name: string; line: string; fx: FxSettings }[] = [
  { id: "cosmic", name: "Cosmic echo", line: "Long fading echo in a wide hall", fx: { ...defaultFx, echo: "cosmos", echoSpeed: 0.45, space: "arena" } },
  { id: "choir", name: "Choir of me", line: "12 of your voices together", fx: { ...defaultFx, chorus: 12, space: "arena" } },
  { id: "stadium", name: "Stadium anthem", line: "A full stadium singing with you", fx: { ...defaultFx, chorus: 6, space: "stadium", echo: "short", echoSpeed: 0.3 } },
  { id: "mantra", name: "Mantra circle", line: "A circle of voices and a long echo", fx: { ...defaultFx, chorus: 6, echo: "long", echoSpeed: 0.6 } },
];
const ext = (type: string) => type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
const same = (a: FxSettings, b: FxSettings) => a.echo === b.echo && a.echoSpeed === b.echoSpeed && a.chorus === b.chorus && a.space === b.space && a.voice === b.voice;

function Choices<T extends string | number>({ label, value, options, change, testid }: { label: string; value: T; options: [T, string][]; change: (v: T) => void; testid: string }) {
  return <div className="ev-choices" role="radiogroup" aria-label={label}>
    {options.map(([v, name]) => <button key={String(v)} type="button" role="radio" aria-checked={value === v} data-testid={`${testid}-${v}`} onClick={() => change(v)}>{name}</button>)}
  </div>;
}

export function EchoVoices({ saveSong, makeVideo, engine }: { saveSong: (file: File, title: string) => Promise<void>; makeVideo: (file: File, title: string) => Promise<void>; engine?: () => EchoVoicesAudio }) {
  const audio = useRef<EchoVoicesAudio | null>(null);
  const [fx, setFx] = useState<FxSettings>(defaultFx);
  const [hear, setHear] = useState(false);
  const [mic, setMic] = useState(false);
  const [phrase, setPhrase] = useState<"none" | "catching" | "ready">("none");
  const [phraseSeconds, setPhraseSeconds] = useState(0);
  const [replay, setReplay] = useState<"" | "once" | "loop">("");
  const [gap, setGap] = useState(0.4);
  const [taking, setTaking] = useState(false);
  const [take, setTake] = useState<{ blob: Blob; url: string } | null>(null);
  const [title, setTitle] = useState("My echo take");
  const [level, setLevel] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  // Live mode: effects go straight out (headphones, speaker or a virtual mic for a livestream). Nothing is recorded or saved.
  const [liveMode, setLiveMode] = useState(false);
  const [outputs, setOutputs] = useState<{ id: string; name: string }[]>([]);
  const [output, setOutput] = useState("");
  const outputChoice = typeof window !== "undefined" && canChooseOutput();
  async function listOutputs() {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices?.() ?? [];
      setOutputs(devices.filter(d => d.kind === "audiooutput" && d.deviceId && d.deviceId !== "default")
        .map((d, i) => ({ id: d.deviceId, name: d.label || `Sound output ${i + 1}` })));
    } catch { setOutputs([]); }
  }
  const chooseOutput = (id: string) => run(async () => { await get().setOutput(id); setOutput(id); });
  const engineRef = useRef(engine);
  const get = () => {
    if (!audio.current) {
      const a = audio.current = engineRef.current?.() ?? new EchoVoicesAudio();
      a.onReplayEnded = () => setReplay("");
      a.onLimit = () => setMessage("That's the longest one recording can be. Press Stop to keep it.");
      a.onInterrupt = text => setMessage(text);
    }
    return audio.current;
  };
  useEffect(() => () => { audio.current?.dispose(); audio.current = null; }, []);
  useEffect(() => { audio.current?.setFx(fx); }, [fx]);
  useEffect(() => { audio.current?.setHearing(hear || liveMode); }, [hear, liveMode]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- device names appear once the microphone is allowed
  useEffect(() => { if (liveMode) void listOutputs(); }, [liveMode, mic]);
  useEffect(() => () => { if (take) URL.revokeObjectURL(take.url); }, [take]);
  useEffect(() => {
    if (!mic && !replay && !taking) { setLevel(0); return; }
    const timer = window.setInterval(() => setLevel(audio.current?.level() ?? 0), 100);
    return () => window.clearInterval(timer);
  }, [mic, replay, taking]);
  const fail = (error: unknown) => setMessage(error instanceof Error && error.message ? error.message : "Something went wrong with the microphone. Try again.");
  async function run(task: () => Promise<void>) { setMessage(""); try { await task(); } catch (error) { fail(error); } }
  const toggleMic = () => run(async () => {
    const a = get(); a.setFx(fx); a.setHearing(hear || liveMode);
    if (mic) { if (taking) return; await a.stopMicrophone(); setMic(false); } else { await a.start(); setMic(true); }
  });
  const catchLine = () => run(async () => {
    const a = get(); a.setFx(fx); a.setHearing(hear || liveMode);
    if (phrase === "catching") { const seconds = await a.keepPhrase(); setPhraseSeconds(seconds); setPhrase(seconds ? "ready" : "none"); return; }
    await a.catchPhrase(); setMic(true); setReplay(""); setPhrase("catching");
  });
  const answer = (loop: boolean) => run(async () => { await get().repeat(loop, gap); setReplay(loop ? "loop" : "once"); });
  const record = () => run(async () => {
    const a = get(); a.setFx(fx); a.setHearing(hear);
    if (!taking) { setTake(null); await a.startTake(); setMic(true); setTaking(true); return; }
    const blob = await a.finishTake(); setTaking(false);
    if (blob) setTake({ blob, url: URL.createObjectURL(blob) });
  });
  const file = () => take ? new File([take.blob], `${title.trim() || "My echo take"}.${ext(take.blob.type)}`, { type: take.blob.type }) : null;
  async function keep(kind: "song" | "video") {
    const f = file(); if (!f) return;
    setBusy(true); setMessage("");
    try { if (kind === "song") { await saveSong(f, title.trim() || "My echo take"); setMessage("Saved to Your songs."); } else await makeVideo(f, title.trim() || "My echo take"); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  const set = (patch: Partial<FxSettings>) => setFx(current => ({ ...current, ...patch }));
  return <section className="ev" aria-labelledby="ev-title" data-testid="echo-voices">
    <p className="ev-eyebrow">Record · Echo &amp; Voices</p>
    <h1 id="ev-title">Echo &amp; Voices</h1>
    <p className="ev-lede">Sing or speak and hear your voice echo into the cosmos, come back as a chorus, multiply into a choir or fill a stadium. It all happens on your device: no AI, no credits.</p>
    <div className="ev-modes" role="radiogroup" aria-label="Echo & Voices mode">
      <button type="button" role="radio" aria-checked={!liveMode} className={!liveMode ? "active" : ""} data-testid="button-mode-record" disabled={taking} onClick={() => setLiveMode(false)}>🎙 Record mode</button>
      <button type="button" role="radio" aria-checked={liveMode} className={liveMode ? "active" : ""} data-testid="button-mode-live" disabled={taking} onClick={() => setLiveMode(true)}>🔴 Live mode · no recording</button>
    </div>
    {liveMode && <section className="ev-live" data-testid="ev-live" aria-label="Live mode">
      <p><strong>Live mode:</strong> every effect plays out as you sing or speak. Nothing is recorded or saved. Use it for practice, a performance, or a livestream.</p>
      {outputChoice ? <label className="ev-title">Send my live voice to
        <select value={output} data-testid="select-live-output" onChange={e => void chooseOutput(e.target.value)}>
          <option value="">This device (headphones)</option>
          {outputs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        {!mic && <small className="muted">Start the microphone to see every sound output by name.</small>}
      </label> : <p className="muted" data-testid="text-live-output-unsupported">This browser plays the live sound on this device only. To send it into a livestream app, use Chrome or Edge on a computer.</p>}
      <details className="ev-guide" data-testid="guide-tiktok-live"><summary>Go live on TikTok (or YouTube, Instagram, Twitch)</summary>
        <ol>
          <li>Use a computer with <strong>Chrome or Edge</strong>, and wear <strong>headphones</strong>.</li>
          <li>Install a free virtual microphone: <strong>VB-CABLE</strong> on Windows, or <strong>BlackHole</strong> on Mac. Restart the browser.</li>
          <li>Here, tap <strong>Start microphone</strong>, then in <strong>Send my live voice to</strong> choose <strong>CABLE Input</strong> (Windows) or <strong>BlackHole</strong> (Mac).</li>
          <li>In <strong>TikTok LIVE Studio</strong> (or OBS), set the microphone to <strong>CABLE Output</strong> or <strong>BlackHole</strong>.</li>
          <li>Pick your blend: Cosmic echo, Choir of me, Stadium… Go live. Your audience hears your voice with every effect.</li>
        </ol>
        <p className="muted">On a phone, the TikTok app listens to the phone&apos;s own microphone, so a web page can&apos;t add effects to a phone livestream. Go live from a computer instead.</p>
      </details>
    </section>}
    <div className="ev-top">
      {!liveMode && <label className="ev-hear"><input type="checkbox" data-testid="checkbox-hear-live" checked={hear} onChange={e => setHear(e.target.checked)}/> 🎧 I&apos;m wearing headphones: let me hear it live</label>}
      <button type="button" className={mic ? "secondary" : "primary"} data-testid="button-ev-mic" disabled={taking || phrase === "catching"} onClick={() => void toggleMic()}>{mic ? "Stop microphone" : "🎙 Start microphone"}</button>
      <div className="ev-meter" aria-hidden="true"><span style={{ width: `${Math.round(level * 100)}%` }}/></div>
    </div>
    {!hear && !liveMode && <p className="muted ev-note">Without headphones the speakers stay quiet so they don&apos;t squeal into the microphone. Your recording still includes every effect.</p>}
    {message && <p role="status" className="ev-message" data-testid="text-ev-message">{message}</p>}

    <h2 className="ev-sub">One-tap blends</h2>
    <div className="ev-blends">
      {blends.map(b => <button key={b.id} type="button" className="ev-blend" aria-pressed={same(fx, b.fx)} data-testid={`blend-${b.id}`} onClick={() => setFx(b.fx)}><strong>{b.name}</strong><span>{b.line}</span></button>)}
      <button type="button" className="ev-blend plain" aria-pressed={same(fx, defaultFx)} data-testid="blend-clear" onClick={() => setFx(defaultFx)}><strong>Clear</strong><span>Just your voice</span></button>
    </div>

    <div className="ev-cards">
      <article className="ev-card echo"><h2>Echo</h2><p>Your voice repeats and fades until it disappears.</p>
        <Choices label="Echo length" value={fx.echo} options={echoChoices} change={echo => set({ echo })} testid="echo"/>
        <label className="ev-range">Repeat speed <span className="muted">fast</span><input type="range" min={0.12} max={0.9} step={0.01} value={fx.echoSpeed} data-testid="range-echo-speed" onChange={e => set({ echoSpeed: Number(e.target.value) })}/><span className="muted">slow</span></label>
      </article>
      <article className="ev-card repeat"><h2>Repeat chorus</h2><p>Catch a line, then it answers you once or loops like a mantra, through all your effects.</p>
        <div className="ev-row">
          <button type="button" className={phrase === "catching" ? "ev-rec live" : "ev-rec"} data-testid="button-catch-line" disabled={taking} onClick={() => void catchLine()}>{phrase === "catching" ? "■ Keep this line" : phrase === "ready" ? "● Catch a new line" : "● Catch a line"}</button>
          {phrase === "ready" && <span className="muted" data-testid="text-line-length">{phraseSeconds.toFixed(1)} s caught</span>}
        </div>
        {phrase === "ready" && <div className="ev-row">
          <button type="button" className="secondary small" data-testid="button-answer-once" onClick={() => void answer(false)}>Answer once</button>
          <button type="button" className="secondary small" data-testid="button-answer-loop" onClick={() => void answer(true)}>Loop like a mantra</button>
          {replay && <button type="button" className="text-button" data-testid="button-stop-repeat" onClick={() => { audio.current?.stopReplay(); setReplay(""); }}>Stop</button>}
        </div>}
        <label className="ev-range">Pause before it answers<input type="range" min={0} max={3} step={0.1} value={gap} data-testid="range-gap" onChange={e => setGap(Number(e.target.value))}/><span className="muted">{gap.toFixed(1)} s</span></label>
      </article>
      <article className="ev-card chorus"><h2>Many voices</h2><p>Your one voice becomes a group singing together.</p>
        <Choices label="How many voices" value={fx.chorus} options={chorusChoices} change={chorus => set({ chorus })} testid="chorus"/>
      </article>
      <article className="ev-card stadium"><h2>Stadium</h2><p>A huge space and a crowd of you singing back.</p>
        <Choices label="Space" value={fx.space} options={spaceChoices} change={space => set({ space })} testid="space"/>
      </article>
      <article className="ev-card changer"><h2>Voice changer</h2><p>Change the color of your voice.</p>
        <Choices label="Voice" value={fx.voice} options={(Object.keys(voiceShapes) as VoiceShape[]).map(v => [v, voiceShapes[v].label] as [VoiceShape, string])} change={voice => set({ voice })} testid="voice"/>
      </article>
    </div>

    {liveMode ? <p className="muted ev-note" data-testid="text-live-no-record">Live mode never records. Switch to Record mode to keep a take.</p> : <div className="ev-take">
      <button type="button" className={taking ? "ev-big live" : "ev-big"} data-testid="button-ev-record" disabled={phrase === "catching"} onClick={() => void record()}>{taking ? "■ Stop recording" : "● Record with effects"}</button>
      {taking && <p className="muted">Recording your voice, the repeats and every effect…</p>}
      {take && <div className="ev-result" data-testid="ev-result">
        <audio controls src={take.url} aria-label="Listen to your take"/>
        <label className="ev-title">Name<input value={title} maxLength={100} data-testid="input-take-title" onChange={e => setTitle(e.target.value)}/></label>
        <div className="ev-row">
          <button type="button" className="primary" disabled={busy} data-testid="button-take-song" onClick={() => void keep("song")}>Save as a song</button>
          <button type="button" className="secondary" disabled={busy} data-testid="button-take-video" onClick={() => void keep("video")}>Make a lyric video</button>
          <a className="secondary button-link" href={take.url} download={`${title.trim() || "My echo take"}.${ext(take.blob.type)}`}>Download</a>
        </div>
      </div>}
    </div>}
    <p className="muted ev-note">The stadium and choir are made from copies of your own voice, so they sound like a group of you. There&apos;s no child-like voice setting.</p>
  </section>;
}
