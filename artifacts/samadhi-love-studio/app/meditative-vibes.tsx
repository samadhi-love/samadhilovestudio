"use client";
import {brand} from "./brand";
import { useEffect, useRef, useState } from "react";
import { downloadFormats, type DownloadFormat } from "./audio-convert";
import { AudioPlayer } from "./audio-player";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";
import { meditationPresets, maxMeditationLayers, newMeditationBlend, validMeditationBlend, type MeditationBlend, type MeditationLayer, type MeditationPreset } from "./meditative-data";
import { renderMeditation } from "./meditative-audio";

type Props = {
  workspaceId: string; saving: boolean; projects: { id: string; name: string }[];
  dirty: (value: boolean) => void; persistBusy: (value: boolean) => void;
  saveAudio: (file: File, title: string, projectId?: string) => Promise<boolean>;
  sendMix: (blob: Blob, title: string, projectId?: string) => void;
  recordVoice: () => void;
  /** Hand the blend to Create as a song description (prefill only, nothing generated). */
  useInSong?: (idea: string) => void;
};
type Saved = { id: string; name: string; updated: string };
const categories = ["All", "Solfeggio", "Binaural", "Pulsed", "Blends"] as const;
export function MeditativeVibes(props: Props) {
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("wav16");
  const [blend, setBlend] = useState(newMeditationBlend);
  const [baseline, setBaseline] = useState(() => JSON.stringify(blend));
  const [revision, setRevision] = useState<string>();
  const [filter, setFilter] = useState<typeof categories[number]>("All");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Saved[]>([]), [next, setNext] = useState<string | null>(null);
  const [listError, setListError] = useState("");
  const [busy, setBusy] = useState(""), [progress, setProgress] = useState(0), [notice, setNotice] = useState("");
  const [audio, setAudio] = useState<{ url: string; label: string } | null>(null);
  const abort = useRef<AbortController | null>(null), working = useRef(false), alive = useRef(true);
  const propsRef = useRef(props); propsRef.current = props;
  const changed = JSON.stringify(blend) !== baseline;
  const latest = useRef({ changed, busy }); latest.current = { changed, busy };
  const disabled = !!busy || props.saving;
  const recovery = useDraftRecovery("meditative-vibes", blend, value => {
    if (!validMeditationBlend(value)) throw new Error("This recovery copy is invalid. Your saved blends are unchanged.");
    setBlend({ ...value, id: crypto.randomUUID() }); setRevision(undefined);
  });
  useEffect(() => { propsRef.current.dirty(changed); }, [changed]);
  useEffect(() => {
    alive.current = true;
    const leave = (e: BeforeUnloadEvent) => { if (latest.current.changed || latest.current.busy) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", leave);
    return () => { alive.current = false; abort.current?.abort(); propsRef.current.dirty(false); window.removeEventListener("beforeunload", leave); };
  }, []);
  useEffect(() => () => { if (audio) URL.revokeObjectURL(audio.url); }, [audio]);
  // Any changed settings invalidate an earlier audition; playback releases on unmount.
  useEffect(() => { setAudio(null); }, [blend]);
  async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers); headers.set("X-Studio-Workspace", props.workspaceId);
    const response = await fetch("/api/studio/meditative" + path, { ...init, headers });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok || !result) throw new Error(result?.error ?? "The private blend library could not sync. Retry without closing this page.");
    return result as T;
  }
  async function loadList(cursor?: string) {
    try {
      const result = await api<{ sessions: Saved[]; next: string | null }>(cursor ? "?cursor=" + encodeURIComponent(cursor) : "");
      if (!alive.current) return;
      setSaved(items => cursor ? [...items, ...result.sessions.filter((s: Saved) => !items.some(i => i.id === s.id))] : result.sessions); setNext(result.next); setListError("");
    } catch (e) { if (alive.current) setListError((e as Error).message); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  useEffect(() => { void loadList(); }, [props.workspaceId]);
  async function run(label: string, action: () => Promise<void>, persist = false) {
    if (working.current || props.saving) return;
    working.current = true; setBusy(label); setNotice(""); setProgress(0);
    if (persist) propsRef.current.persistBusy(true);
    try { await action(); }
    catch (e) { if (alive.current) setNotice((e as Error).name === "AbortError" ? "Render cancelled. Your blend is unchanged." : (e as Error).message); }
    finally { working.current = false; if (persist) propsRef.current.persistBusy(false); if (alive.current) setBusy(""); }
  }
  function patch(change: Partial<MeditationBlend>) { setBlend(b => ({ ...b, ...change })); }
  function layerPatch(id: string, change: Partial<MeditationLayer>) { setBlend(b => ({ ...b, layers: b.layers.map(l => l.id === id ? { ...l, ...change } : l) })); }
  function apply(preset: MeditationPreset, append: boolean) {
    if (append && blend.layers.length + preset.layers.length > maxMeditationLayers) { setNotice("A blend supports up to six layers. Remove a layer before combining more."); return; }
    if (!append && changed && !confirm("Load this preset? Save your current blend first if you want to keep it in your account.")) return;
    const layers = preset.layers.map(l => ({ ...l, id: crypto.randomUUID() }));
    if (append) patch({ layers: [...blend.layers, ...layers] });
    else { setBlend({ ...newMeditationBlend(preset), seconds: blend.seconds }); setRevision(undefined); }
    setNotice(append ? "Added to your blend." : "Preset loaded. Adjust the layers and save your own version.");
  }
  async function save(copy = false) {
    const snapshot = copy ? { ...blend, id: crypto.randomUUID() } : blend;
    const result = await api<{ revision: string }>("?session=" + snapshot.id, { method: "PUT", headers: { "Content-Type": "application/json", ...(!copy && revision ? { "If-Match": revision } : {}) }, body: JSON.stringify(snapshot) });
    setBlend(snapshot); setBaseline(JSON.stringify(snapshot)); setRevision(result.revision); setNotice("Blend saved privately to your account."); await loadList();
  }
  async function open(id: string) {
    if (changed && !confirm("Open a saved blend? Save your current edits first to keep them in your account.")) return;
    const result = await api<{ session: unknown; revision: string }>("?session=" + encodeURIComponent(id));
    if (!validMeditationBlend(result.session)) throw new Error("This saved blend could not be read. It has not been changed.");
    setBlend(result.session); setBaseline(JSON.stringify(result.session)); setRevision(result.revision); setNotice("Saved blend opened.");
  }
  async function render(action: "preview" | "download" | "library" | "mix") {
    setAudio(null); const controller = new AbortController(); abort.current = controller;
    const blob = await renderMeditation(blend, { ...(action === "preview" ? { seconds: Math.min(10, blend.seconds) } : {}), signal: controller.signal, progress: value => setProgress(action === "download" && downloadFormat !== "wav16" ? value / 2 : value) });
    if (!alive.current || controller.signal.aborted) return;
    const filename = blend.name.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 80) || "Meditative blend";
    if (action === "preview") { setAudio({ url: URL.createObjectURL(blob), label: `${blend.name} · ${Math.min(10, blend.seconds)} second preview` }); setNotice("Preview ready. Press Play below; start with your device volume low."); }
    else if (action === "download") {
      const output = downloadFormat === "wav16" ? blob : await (await import("./audio-convert")).convertAudio(blob, downloadFormat, { signal: controller.signal, progress: value => setProgress(.5 + value / 2) });
      if (!alive.current || controller.signal.aborted) return;
      const url = URL.createObjectURL(output), link = document.createElement("a"); link.href = url; link.download = filename + "." + downloadFormats.find(f => f.id === downloadFormat)!.extension; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Audio download prepared. Keep the stereo channels intact for binaural layers.");
    } else if (action === "mix") props.sendMix(blob, blend.name, blend.projectSongId);
    else if (await props.saveAudio(new File([blob], filename + ".wav", { type: "audio/wav" }), blend.name, blend.projectSongId)) setNotice("Original tone track saved to Your songs. Use it in a mix or lyric video.");
    else throw new Error("Audio save was not confirmed. Your blend remains here; retry the save.");
    abort.current = null;
  }
  const presets = meditationPresets.filter(p => (filter === "All" || p.category === filter) && `${p.name} ${p.note}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="meditative-workspace" aria-label="Meditative Vibes">
    <header className="page-title"><div><p className="eyebrow">{brand.name} · FREQUENCY LIBRARY</p><h1>Meditative Vibes</h1><p>Original tones, spacious listening, and a blend that is yours.</p></div><span className="meditative-emblem" aria-hidden="true">✧ ♫ ✧</span></header>
    <aside className="notice"><strong>Create for relaxation and artistic exploration.</strong> Frequency labels are sound parameters, not promises of healing or altered consciousness. Solfeggio meanings are traditional associations; evidence for specific benefits is limited. Higher Hz does not mean greater wellbeing. Use a comfortable low volume, stop if uncomfortable, and avoid listening while driving. Headphones are needed for binaural separation. These are original synthesized presets, unaffiliated with Hemi-Sync.</aside>
    <RecoveryPanel recovery={recovery}/>
    <div className="meditative-layout"><section className="panel meditative-catalog"><h2>Explore frequencies</h2><label>Search name or Hz<input value={search} onChange={e => setSearch(e.target.value)} placeholder="528, theta, two-tone…"/></label>
      <div className="actions meditative-filters" role="group" aria-label="Frequency categories">{categories.map(c => <button type="button" className="chip" aria-pressed={filter === c} key={c} onClick={() => setFilter(c)}>{c}</button>)}</div>
      <p className="muted">Tone Hz = audible pitch. Beat Hz = the difference between ears, or the pulse rate. These are different quantities.</p>
      <div className="meditative-presets">{presets.map(p => <article key={p.id} className="meditative-preset"><small>{p.category}</small><h3>{p.name}</h3><p>{p.note}</p><div className="actions"><button type="button" className="secondary small" disabled={disabled} onClick={() => apply(p, false)}>Load preset</button><button type="button" className="secondary small" disabled={disabled || blend.layers.length + p.layers.length > 6} onClick={() => apply(p, true)}>＋ Combine</button></div></article>)}</div>{!presets.length && <p>No matching presets. Try a different frequency or category.</p>}
    </section><section className="panel meditative-builder"><h2>Your frequency blend</h2><p className="muted">Up to six layers · stereo WAV · 44.1 kHz / 16-bit · up to 3 minutes per render</p>
      <fieldset disabled={disabled}><div className="meditative-fields"><label>Blend name<input maxLength={100} value={blend.name} onChange={e => patch({ name: e.target.value })}/></label><label>Tone-bed export duration<select value={blend.seconds} onChange={e => patch({ seconds: Number(e.target.value) })}>{[5, 15, 30, 60, 120, 180].map(s => <option key={s} value={s}>{s} seconds</option>)}</select></label>
      <label>Attach to project<select value={blend.projectSongId ?? ""} onChange={e => patch({ projectSongId: e.target.value || undefined })}><option value="">Standalone track</option>{props.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Master level · {Math.round(blend.volume * 100)}%<input type="range" min="0" max="0.5" step="0.01" value={blend.volume} onChange={e => patch({ volume: Number(e.target.value) })}/></label></div>
      <div className="meditative-layers">{blend.layers.map((l, i) => <article key={l.id} className="meditative-layer"><h3>Layer {i + 1}</h3><div className="meditative-fields"><label>Sound type<select value={l.mode} onChange={e => layerPatch(l.id, { mode: e.target.value as MeditationLayer["mode"] })}><option value="tone">Pure tone</option><option value="binaural">Binaural pair</option><option value="pulse">Pulsed tone</option></select></label>
      <label>{l.mode === "binaural" ? "Left carrier (Hz)" : "Tone pitch (Hz)"}<input type="number" min="80" max="1200" step="0.5" value={l.hz} onChange={e => layerPatch(l.id, { hz: Number(e.target.value) })}/></label>
      {l.mode !== "tone" && <label>{l.mode === "binaural" ? "Difference (Hz)" : "Pulse rate (Hz)"}<input type="number" min="0.5" max="40" step="0.5" value={l.beat} onChange={e => layerPatch(l.id, { beat: Number(e.target.value) })}/></label>}
      <label>Layer level · {Math.round(l.level * 100)}%<input type="range" min="0" max="1" step="0.01" value={l.level} onChange={e => layerPatch(l.id, { level: Number(e.target.value) })}/></label></div>
      {l.mode === "binaural" && <p className="muted">L {l.hz} Hz · R {l.hz + l.beat} Hz · difference {l.beat} Hz</p>}
      <button type="button" className="text-button" disabled={blend.layers.length === 1} onClick={() => patch({ layers: blend.layers.filter(a => a.id !== l.id) })}>Remove layer {i + 1}</button></article>)}</div>
      <button type="button" className="secondary small" disabled={blend.layers.length >= 6} onClick={() => patch({ layers: [...blend.layers, { id: crypto.randomUUID(), mode: "tone", hz: 528, beat: 4, level: .35 }] })}>＋ Add custom layer</button>
      <label className="meditative-notes">Personal vocal / light-language notes<textarea maxLength={2000} rows={3} value={blend.vocalNotes} onChange={e => patch({ vocalNotes: e.target.value })} placeholder="Your own syllables, intention, mantra or vocal direction…"/></label><p className="muted">Notes are not synthesized speech. Record your own voice in Recording Desk, save it to My Voice, then add it alongside this tone track in Audio + Visual Studio. Use original or permitted vocal material.</p>
      </fieldset>
      {!validMeditationBlend(blend) && <p role="alert">Use a name, pitches of 80–1200 Hz and beat rates of 0.5–40 Hz.</p>}
      <div className="actions meditative-actions"><button type="button" className="primary" disabled={disabled || !validMeditationBlend(blend)} onClick={() => void run("Saving blend", () => save(), true)}>Save blend</button><button type="button" className="secondary" disabled={disabled || !validMeditationBlend(blend)} onClick={() => void run("Saving new blend", () => save(true), true)}>Save as new blend</button>
      <button type="button" className="secondary" disabled={disabled || !validMeditationBlend(blend)} onClick={() => void run("Rendering preview", () => render("preview"))}>Prepare preview (up to 10s)</button></div>
      <label className="meditative-export-format">Tone-bed download format<select disabled={disabled} value={downloadFormat} onChange={e => setDownloadFormat(e.target.value as DownloadFormat)}>{downloadFormats.map(f => <option value={f.id} key={f.id}>{f.label}</option>)}</select></label>
      <p className="muted">AAC/M4A needs browser encoder support. Converting this 16-bit tone bed to 24-bit does not add source detail. Downloads contain tones only, without browser narration.</p>
      <div className="actions meditative-actions">{([['download', 'Download tone audio'], ['library', 'Save audio to Your songs'], ['mix', 'Send to Audio + Visual Studio']] as const).map(([action, label]) => <button key={action} type="button" className="secondary" disabled={disabled || !validMeditationBlend(blend)} onClick={() => void run("Rendering track", () => render(action))}>{label}</button>)}<button type="button" className="secondary" disabled={disabled} onClick={props.recordVoice}>Record my voice</button>{props.useInSong&&<button type="button" className="primary" data-testid="button-meditation-use-in-song" disabled={disabled || !validMeditationBlend(blend)} onClick={() => props.useInSong!(`A slow meditative song called "${blend.name}", built over a calm sustained tone bed (${blend.layers.map(l => l.mode === "binaural" ? `${l.hz} Hz binaural, ${l.beat} Hz difference` : `${l.hz} Hz ${l.mode}`).join("; ")}). Spacious, gentle, ${blend.seconds >= 600 ? "long-form" : "unhurried"}, soft breath-like phrasing.`)}>Use in my song</button>}</div>
      {busy && <div role="status"><p>{busy}{busy.startsWith("Rendering") ? ` · ${Math.round(progress * 100)}%` : "…"}</p>{busy.startsWith("Rendering") && <><progress value={progress} max={1} aria-label="Audio render progress"/><button type="button" className="secondary small" onClick={() => abort.current?.abort()}>Cancel render</button></>}</div>}
      {notice && <p role="status" className="notice">{notice}</p>}{audio && <AudioPlayer key={audio.url} src={audio.url} label={audio.label}/>}
      <section className="meditative-saved"><h2>My saved blends</h2><p className="muted">Private recipes synced to your account; audio is saved separately to Your songs.</p>{listError && <p role="alert">{listError}</p>}<button type="button" className="secondary small" disabled={disabled} onClick={() => void run("Refreshing library", () => loadList())}>Refresh library</button>
      {!saved.length && !listError && <p>No blends saved yet.</p>}<ul>{saved.map(s => <li key={s.id}><button type="button" className="text-button" disabled={disabled} onClick={() => void run("Opening blend", () => open(s.id))}>{s.name}</button></li>)}</ul>{next && <button type="button" className="secondary small" disabled={disabled} onClick={() => void run("Loading library", () => loadList(next))}>Load more blends</button>}</section>
    </section></div>
  </section>;
}
