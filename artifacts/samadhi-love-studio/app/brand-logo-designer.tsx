"use client";
import { useEffect, useRef, useState } from "react";
import { defaultBrandLogo, isBrandLogo, logoFonts, logoPalettes, logoPng, logoSvg, logoSymbols, type BrandLogo } from "./brand-logo";
import { defaultLogoAnimation, logoNatureScenes, natureSceneSvg, type LogoAnimation, type LogoNatureScene } from "./logo-nature-scenes";
import { NatureLogoPreview } from "./nature-logo-preview";
import { downloadBlob } from "./lyric-pro-media";
import type { ProExportResult } from "./lyric-pro-export";
import {VideoFormatPicker} from "./video-format-picker";

const scenes = Object.entries(logoNatureScenes).map(([id, value]) => ({ id: id as LogoNatureScene, ...value, thumbnail: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(natureSceneSvg(id as LogoNatureScene)) }));
export function BrandLogoDesigner({ name, initial, save, working }: { name: string; initial?: BrandLogo; save?: (blob: Blob, design: BrandLogo) => Promise<void>; working?: (busy: boolean) => void }) {
  const [design, setDesign] = useState<BrandLogo>(initial ?? { ...defaultBrandLogo, name: name.slice(0, 70) || defaultBrandLogo.name });
  const [busy, setBusy] = useState(false), [operation, setOperation] = useState(""), [notice, setNotice] = useState(""), [progress, setProgress] = useState(0);
  const [result, setResult] = useState<(ProExportResult & { name: string }) | null>(null), [resultUrl, setResultUrl] = useState("");
  const lastAnimation = useRef(initial?.animation ?? defaultLogoAnimation), task = useRef<AbortController | null>(null);
  useEffect(() => { working?.(busy); return () => working?.(false); }, [busy, working]);
  useEffect(() => () => task.current?.abort(), []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (busy) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
  useEffect(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob); setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);
  const valid = isBrandLogo(design), animation = design.animation;
  const patch = (next: Partial<BrandLogo>) => setDesign(value => ({ ...value, ...next }));
  function animate(next: Partial<LogoAnimation>) {
    const settings = { ...(animation ?? lastAnimation.current), ...next };
    lastAnimation.current = settings; patch({ animation: settings });
  }
  const filename = (value: string) => (value.replace(/[\\/:*?"<>|]/g, "_") || "Brand") + "-logo";
  async function run(action: "svg" | "png" | "save" | "video") {
    if (task.current || !valid) return;
    const controller = new AbortController(); task.current = controller;
    setBusy(true); setOperation(action); setNotice(""); setProgress(0);
    try {
      if (action === "video") {
        const { exportAnimatedLogo } = await import("./animated-brand-logo");
        const output = await exportAnimatedLogo(structuredClone(design), controller.signal, setProgress);
        controller.signal.throwIfAborted();
        const title = filename(design.name) + "-" + animation!.scene + "." + output.extension;
        setResult({ ...output, name: title }); downloadBlob(output.blob, title);
        setNotice("Animated nature logo video is ready. Play the finished file below or download it again.");
      } else {
        const blob = action === "svg" ? new Blob([logoSvg(design)], { type: "image/svg+xml" }) : await logoPng(design);
        controller.signal.throwIfAborted();
        if (action === "save") {
          await save?.(blob, design);
          setNotice(animation ? "Logo and animation settings saved privately with this song. Its branding image is a still PNG; download the animated video here." : "Logo saved privately with this song and applied to its video project.");
        } else { downloadBlob(blob, filename(design.name) + "." + action); setNotice(action.toUpperCase() + " still logo download prepared."); }
      }
    } catch (error) {
      setNotice(controller.signal.aborted ? "Export canceled. Your logo and scene choices are still here; retry when ready." : (error as Error).message || "The logo could not export. Retry.");
    } finally { task.current = null; setBusy(false); setOperation(""); }
  }
  return <section className="brand-logo-designer">
    <p className="muted">Design your artist, product or studio logo. Give it a moving nature scene for a video intro, outro or social clip.</p>
    <div className="actions" role="group" aria-label="Logo type">
      <button type="button" className="secondary" disabled={busy} aria-pressed={!animation} onClick={() => { if (animation) lastAnimation.current = animation; patch({ animation: undefined }); }}>Still logo</button>
      <button type="button" className="secondary" disabled={busy} aria-pressed={!!animation} onClick={() => animate({})}>Animated nature</button>
    </div>
    {valid ? animation ? <NatureLogoPreview design={design} animation={animation} paused={busy}/> : <div className="brand-logo-preview" aria-label="Logo preview"><div dangerouslySetInnerHTML={{ __html: logoSvg(design) }}/></div> : <p>Enter your brand or artist name.</p>}
    <fieldset disabled={busy}>
      {animation && <section className="logo-nature-options">
        <h3>Choose your moving nature scene</h3>
        <div className="logo-nature-grid">{scenes.map(scene => <button type="button" key={scene.id} className="logo-nature-card" aria-pressed={animation.scene === scene.id} onClick={() => animate({ scene: scene.id })}>
          <img src={scene.thumbnail} alt="" width={480} height={270}/><strong>{scene.name}</strong><span>{scene.vibe}</span>
        </button>)}</div>
        <VideoFormatPicker value={animation.format} change={format=>animate({format})} disabled={busy}/>
        <div className="creator-browser-filters logo-animation-controls">
          <label>Clip length<select value={animation.seconds} onChange={event => animate({ seconds: Number(event.target.value) as LogoAnimation["seconds"] })}>{[6, 10, 15].map(seconds => <option key={seconds} value={seconds}>{seconds} seconds</option>)}</select></label>
          <label>Logo movement<select value={animation.logoMotion} onChange={event => animate({ logoMotion: event.target.value as LogoAnimation["logoMotion"] })}><option value="float">Gentle float</option><option value="breathe">Soft breathing</option><option value="still">Keep logo steady</option></select></label>
          <label>Nature motion · {Math.round(animation.intensity * 100)}%<input type="range" min={0} max={1} step={.05} value={animation.intensity} onChange={event => animate({ intensity: Number(event.target.value) })}/></label>
        </div>
        <p className="muted">Original illustrated scenery, animated on your device. The video includes your logo, moving nature and a silent soundtrack. Keep this page visible while exporting.</p>
      </section>}
      <label className="field">Brand or artist name<input maxLength={70} value={design.name} onChange={event => patch({ name: event.target.value })}/></label>
      <label className="field">Tagline (optional)<input maxLength={80} value={design.tagline} onChange={event => patch({ tagline: event.target.value })}/></label>
      <div className="creator-browser-filters">
        <label>Symbol<select value={design.symbol} onChange={event => patch({ symbol: event.target.value as BrandLogo["symbol"] })}>{Object.entries(logoSymbols).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label>Colors<select value={design.palette} onChange={event => patch({ palette: event.target.value as BrandLogo["palette"] })}>{Object.keys(logoPalettes).map(id => <option key={id}>{id}</option>)}</select></label>
        <label>Lettering<select value={design.font} onChange={event => patch({ font: event.target.value as BrandLogo["font"] })}>{Object.keys(logoFonts).map(id => <option key={id}>{id}</option>)}</select></label>
        <label>Layout<select value={design.layout} onChange={event => patch({ layout: event.target.value as BrandLogo["layout"] })}><option value="stacked">Stacked</option><option value="horizontal">Horizontal</option><option value="badge">Badge</option></select></label>
      </div>
      <label className="lvp-check"><input type="checkbox" checked={design.transparent} onChange={event => patch({ transparent: event.target.checked })}/> Transparent background{animation ? " for still PNG / SVG" : ""}</label>
      <div className="actions">
        {animation && <button type="button" className="primary" disabled={!valid} onClick={() => void run("video")}>Download animated MP4</button>}
        <button type="button" className="secondary" disabled={!valid} onClick={() => void run("svg")}>Download SVG</button>
        <button type="button" className="secondary" disabled={!valid} onClick={() => void run("png")}>Download PNG</button>
        {save && <button type="button" className="primary" disabled={!valid} onClick={() => void run("save")}>{animation ? "Save settings + still logo to song" : "Save logo to song"}</button>}
      </div>
    </fieldset>
    {busy && operation === "video" && <div className="logo-export-progress"><progress max={1} value={progress} aria-label="Animated logo export progress"/><span>{Math.round(progress * 100)}%</span><button type="button" className="secondary" onClick={() => task.current?.abort()}>Cancel video export</button></div>}
    <p className="muted">SVG is an editable still logo. PNG works with video branding. Animated MP4 export uses supported browser encoding at 1080p / 30 fps.</p>
    {notice && <p role="status">{notice}</p>}
    {result && <section className="logo-export-result"><h3>Last exported logo video</h3><video controls playsInline loop muted src={resultUrl || undefined}/><p className="muted">{result.codec}</p><button type="button" className="secondary" onClick={() => downloadBlob(result.blob, result.name)}>Download finished video again</button></section>}
  </section>;
}
