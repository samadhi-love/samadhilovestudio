"use client";
import { languageForAudio } from "./music-language";
import {registerVideoExport} from "./video-export-history";
import {VideoFormatPicker} from "./video-format-picker";
import {productionFetch} from "./credits/client";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";
import { uploadLyricAsset } from "./lyric-pro-media";
import { assetUrl } from "./lyric-pro-data";

import { HelpControl, HelpField } from "./help-tip";
import { useEffect, useRef, useState } from "react";
import { Clock, Download, Film, ImagePlus, Plus, Save, Sparkles, X } from "lucide-react";
import type { ElevenLabsKey } from "./elevenlabs-key";
import { CleanLyricsChecker } from "./clean-lyrics-checker";
import { VideoPublishing, type VideoExport, type VideoPlatform } from "./video-publishing";
import { cleanWordsMessage, hasExplicitWords } from "./clean-content";
import { captionColors, captionEffects, captionFile, captionFonts, lyricTemplates, estimatedCues, isLyricProject, lyricLines, videoSize, videoThemes, type LyricCue, type LyricProject, type VideoFormat, type VideoMotion, type VideoTheme } from "./lyric-video-data";
import { captionTokens } from "./lyric-caption-render";
import { CaptionTemplatePicker, CaptionTemplateDemo } from "./lyric-caption-picker";
import { getCaptionTemplate, loadCaptionFonts, type CaptionTemplateId, type CaptionEmphasis } from "./lyric-caption-templates";
import { drawLyricVideo } from "./lyric-video-render";
import { exportShort } from "./short-export";
import { songAudioUrl, type Song } from "./studio-data";

const maxVideoSeconds = 600;
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function LyricVideoStudio({ songs, initialSongId, saving, save, elevenLabs, connectionSettings, upload }: {
  songs: Song[]; initialSongId: string; saving: boolean; save: (song: Song, message?: string) => Promise<boolean>;
  upload: () => void;
  elevenLabs: ElevenLabsKey;
  connectionSettings: () => void;
}) {
  const latestSongs=useRef(songs);latestSongs.current=songs;
  const tracks = songs.filter(song => song.audioFormat);
  const [songId, setSongId] = useState(initialSongId);
  const song = tracks.find(track => track.id === songId) ?? tracks[0];
  const [text, setText] = useState("");
  const [cues, setCues] = useState<LyricCue[]>([]);
  const [nextCue, setNextCue] = useState(0);
  const [theme, setTheme] = useState<VideoTheme>("cosmic");
  const [motion, setMotion] = useState<VideoMotion>("drift");
  const [format, setFormat] = useState<VideoFormat>("vertical");
  const [font, setFont] = useState<keyof typeof captionFonts>("classic");
  const [color, setColor] = useState<keyof typeof captionColors>("pearl");
  const [effect, setEffect] = useState<keyof typeof captionEffects>("fade");
  const [captionTemplate, setCaptionTemplate] = useState<CaptionTemplateId | undefined>();
  const [intensity, setIntensity] = useState<"full" | "gentle" | "still">("full");
  const [bpm, setBpm] = useState(100);
  const [captionLayout, setCaptionLayout] = useState<"auto" | "horizontal">("auto");
  const [fontsReady, setFontsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [picture, setPicture] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [output, setOutput] = useState<VideoExport | null>(null);
  const [platform, setPlatform] = useState<VideoPlatform>("youtube");
  const [postCaption, setPostCaption] = useState("");
  const [clipLength, setClipLength] = useState("full");
  const [clipStart, setClipStart] = useState("0");
  const [progress, setProgress] = useState<number | null>(null);
  const [syncMode, setSyncMode] = useState<"align" | "transcribe" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const audio = useRef<HTMLAudioElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pending = useRef<AbortController | null>(null);
  const pictureUrl = useRef("");
  const outputUrl = useRef("");

  useEffect(() => {
    const project = song?.lyricVideo;
    setText(project ? project.cues.map(cue => cue.text).join("\n") : song?.notes.lyrics ?? "");
    setCues(project?.cues ?? []); setNextCue(0);
    if (pictureUrl.current) URL.revokeObjectURL(pictureUrl.current);
    pictureUrl.current = ""; setPicture("");
    setTheme(project?.theme ?? "cosmic"); setMotion(project?.motion ?? "drift"); setFormat(project?.format ?? "vertical");
    setFont(project?.font ?? "classic"); setColor(project?.color ?? "pearl"); setEffect(project?.effect ?? "fade");
    setCaptionTemplate(project?.captionTemplate); setIntensity(project?.intensity ?? (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "still" : "full"));
    setBpm(project?.bpm ?? 100); setCaptionLayout(project?.captionLayout ?? "auto");
    setTime(0); setPlaying(false); setError(""); setNotice("");
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    outputUrl.current = ""; setOutput(null);
    setClipLength("full"); setClipStart("0"); setPostCaption("");
  }, [song?.id]);

  useEffect(() => () => {
    pending.current?.abort();
    if (pictureUrl.current) URL.revokeObjectURL(pictureUrl.current);
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
  }, []);

  useEffect(() => {
    let live = true;
    loadCaptionFonts().then(() => { if (live) setFontsReady(true); }).catch(() => {
      if (live) { setFontsReady(true); setError("Some display fonts could not load. Captions will use readable fallback fonts."); }
    });
    return () => { live = false; };
  }, []);

  function chooseCaptionTemplate(id?: CaptionTemplateId) {
    setCaptionTemplate(id);
    const preset = getCaptionTemplate(id);
    if (preset) { setFont(preset.font); setColor(preset.color); setEffect("fade"); }
    setError(""); setNotice(preset ? `${preset.name} applied to all captions. Timing and lyrics are preserved.` : "Basic caption styling selected.");
  }

  const imageSource = picture || videoThemes[theme].image;
  useEffect(() => {
    setImage(null);
    if (!imageSource) { setImageLoading(false); return; }
    setImageLoading(true);
    const background = new Image();
    background.onload = () => { setImage(background); setImageLoading(false); };
    background.onerror = () => { setImageLoading(false); setError("The picture could not load. Choose another image or use a studio theme."); };
    background.src = imageSource;
    return () => { background.onload = null; background.onerror = null; };
  }, [imageSource]);

  const size = videoSize(format);
  const sameText = text === cues.map(cue => cue.text).join("\n") ||
    lyricLines(text).join("\n") === cues.map(cue => cue.text).join("\n");
  const clean = !hasExplicitWords(text);
  const project: LyricProject = { cues, theme, motion, format, font, color, effect, captionTemplate, intensity, bpm, captionLayout, languageProfile: song ? languageForAudio(song) ?? song.lyricVideo?.languageProfile : undefined, ...(song?.lyricVideo?.pro ? { pro: song.lyricVideo.pro } : {}) };
  const recovery = useDraftRecovery(`classic-video:${song?.id ?? "none"}:${song?.audioId ?? "original"}`, { project, text, clipLength, clipStart, postCaption }, value => {
    if (!isLyricProject(value.project)) throw new Error("The recovered timing needs review.");
    const p = value.project; setCues(p.cues); setText(value.text); setTheme(p.theme); setMotion(p.motion); setFormat(p.format); setFont(p.font ?? "classic"); setColor(p.color ?? "pearl"); setEffect(p.effect ?? "fade"); setCaptionTemplate(p.captionTemplate); setIntensity(p.intensity ?? "full"); setBpm(p.bpm ?? 100); setCaptionLayout(p.captionLayout ?? "auto"); setClipLength(value.clipLength); setClipStart(value.clipStart); setPostCaption(value.postCaption);
  }, !!song && !!(text.trim() || cues.length));
  const renderProject: LyricProject = { ...project, cues: cues.map((cue, index) => index === cues.length - 1 && cue.end === undefined && duration > cue.time ? { ...cue, end: duration } : cue) };
  const valid = clean && sameText && cues.length > 0 && duration > 0 && isLyricProject(project) &&
    cues.every(cue => cue.time < duration && (cue.end === undefined || cue.end <= duration + 0.005));
  const start = clipLength === "full" ? 0 : Number(clipStart);
  const end = clipLength === "full" ? duration : Math.min(duration, start + Number(clipLength));
  const validRange = (clipLength === "full" || !!clipStart.trim()) && Number.isFinite(start) && start >= 0 && end > start && end - start <= maxVideoSeconds;
  const captionName = (song?.name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 100) || "samadhi-love") + "-captions";
  const busy = !fontsReady || saving || elevenLabs.busy || progress !== null || syncMode !== null;

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    let request = 0;
    function paint() {
      if (!context) return;
      drawLyricVideo(context, audio.current?.currentTime ?? 0, { ...renderProject, cues: clean && sameText ? renderProject.cues : [] }, song?.name ?? "SAMADHI LOVE", image);
      if (playing) request = requestAnimationFrame(paint);
    }
    paint();
    return () => cancelAnimationFrame(request);
  }, [clean, sameText, cues, theme, motion, format, font, color, effect, captionTemplate, intensity, bpm, captionLayout, fontsReady, song?.name, image, playing, time]);

  function estimate() {
    const lines = lyricLines(text);
    if (!duration || !lines.length) { setError("Load a recording and enter one lyric line per row."); return; }
    if (!clean) { setError(cleanWordsMessage); return; }
    if (lines.length > 200 || lines.some(line => line.length > 180)) {
      setError("Use up to 200 lyric lines, with 180 characters or fewer per line."); return;
    }
    setCues(estimatedCues(lines, duration)); setNextCue(0); setError(""); setNotice("Estimated timings are ready. Play the song and stamp lines where they actually begin.");
  }

  function stamp() {
    if (!audio.current || !sameText || nextCue >= cues.length || !clean) return;
    const time = Math.floor(audio.current.currentTime * 100) / 100;
    if (nextCue && time <= cues[nextCue - 1].time) {
      setError("Play past the previous line, then stamp this line."); return;
    }
    setCues(current => current.map((cue, index) => index === nextCue ? { ...cue, time, words: undefined } : cue));
    setNextCue(index => index + 1); setError(""); setNotice("");
  }

  function cleanCaptions(next: string) {
    const lines = lyricLines(next);
    if (sameText && lines.length === cues.length) {
      setCues(cues.map((cue, index) => cue.text === lines[index] ? cue : { ...cue, text: lines[index], words: undefined, accentWords: undefined }));
    }
    setText(next); setError(""); setNotice("");
  }

  function setCaptionText(next: LyricCue[]) {
    setCues(next); setText(next.map(cue => cue.text).join("\n")); setError(""); setNotice("");
  }

  function addCaption() {
    if (!duration || (text.trim() && !sameText) || cues.length >= 200) return;
    const start = Math.round((audio.current?.currentTime ?? 0) * 1000) / 1000;
    if (start >= duration || cues.some(cue => Math.abs(cue.time - start) < 0.005)) {
      setError("Move playback to a free moment before adding a caption."); return;
    }
    const caption = { text: "New caption", time: start };
    const next = [...cues, caption].sort((a, b) => a.time - b.time);
    setCaptionText(next); setNextCue(next.indexOf(caption));
  }

  async function autoSync(mode: "align" | "transcribe") {
    if (!song || !duration || pending.current) return;
    if (!elevenLabs.connected) { setError("Open Music connections to enable automatic sync."); return; }
    const controller = new AbortController();
    pending.current = controller;
    audio.current?.pause();
    setError(""); setNotice(""); setSyncMode(mode);
    try {
      const response = await productionFetch("/api/studio/lyric-sync", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ songId: song.id, audioId: song.audioId, mode, text: mode === "align" ? text : "" }),
      });
      const result = await response.json().catch(() => null) as { cues?: LyricCue[]; error?: string } | null;
      if (!response.ok || !result?.cues) throw new Error(result?.error ?? "Automatic sync could not finish.");
      const next = result.cues.map(cue => {
        const end = cue.end !== undefined ? Math.min(duration, cue.end) : undefined;
        return { ...cue, end, words: cue.words?.filter(word => word.time <= duration) };
      });
      if (!next.length || next.some(cue => cue.time >= duration) || !isLyricProject({ ...project, cues: next }))
        throw new Error("Some captions could not be placed in the recording. Check the lyrics or use manual timing.");
      if (mode === "transcribe") setText(next.map(cue => cue.text).join("\n"));
      setCues(next); setNextCue(0);
      setNotice(mode === "align"
        ? "Lyrics aligned to the vocals. Play the result and adjust any lines that need it."
        : "A timed caption draft is ready. Listen through and correct any words the model missed.");
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Automatic sync could not finish.");
    } finally { pending.current = null; setSyncMode(null); }
  }

  function exportCover() {
    if (!song || imageLoading || (imageSource && !image)) return;
    const art = document.createElement("canvas");
    art.width = art.height = 3000;
    const context = art.getContext("2d");
    if (!context) { setError("This browser could not render the cover."); return; }
    context.scale(3, 3);
    drawLyricVideo(context, 0, { ...project, format: "square", motion: "still", cues: [] }, song.name, image, 1000);
    art.toBlob(blob => {
      if (!blob) { setError("The cover could not export."); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = captionName + "-cover.png"; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 20000);
      setNotice("Cover artwork exported as a 3000 × 3000 PNG.");
    }, "image/png");
  }

  async function renderVideo() {
    if (!song || !valid || !validRange || pending.current || imageLoading || (imageSource && !image)) return;
    const controller = new AbortController();
    pending.current = controller;
    audio.current?.pause();
    setProgress(0); setError(""); setNotice("");
    try {
      await loadCaptionFonts();
      const blob = await exportShort({
        audio: songAudioUrl(song.id, song.audioId), title: song.name, hook: "", start, length: end - start,
        signal: controller.signal, frameSize: size,
        paint: (context, time) => drawLyricVideo(context, time, renderProject, song.name, image),
      }, setProgress);
      if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
      const url = URL.createObjectURL(blob);
      outputUrl.current = url;
      setOutput({ url, blob, extension: blob.type.includes("mp4") ? "mp4" : "webm" });
      if (blob.size <= 120 * 1024 * 1024) {
        try {
          const asset = await uploadLyricAsset(song.id, "video", blob, controller.signal, song.audioId ?? song.id);
          setOutput({ url, blob, extension: blob.type.includes("mp4") ? "mp4" : "webm", savedUrl: assetUrl(song.id, asset) });
          const latest=latestSongs.current.find(s=>s.id===song.id);
          if(latest){const history=registerVideoExport(latest,latest.lyricVideo??project,{id:crypto.randomUUID(),at:new Date().toISOString(),format,extension:blob.type.includes("mp4")?"mp4":"webm",asset,start,end},duration);
            const registered=await save({...latest,lyricVideo:history});
            setNotice(registered?"Lyric video saved and added to shared video history. Its link is ready to share.":"Video file saved. History could not sync; find it under all saved video files or retry saving.");
          }else setNotice("Video file saved. Open the song again to find it in all saved video files.");
        } catch { setNotice("Video ready to download. Cloud saving failed; export again to create a video link."); }
      } else setNotice("Video ready to download. Automatic links support videos up to 120 MB.");
      setPostCaption(current => current || `“${song.name}” by SAMADHI LOVE\n#SamadhiLove #OriginalMusic`);
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "The video could not export.");
    } finally { pending.current = null; setProgress(null); }
  }

  return <>
    <RecoveryPanel recovery={recovery}/><div className="create-banner"><span className="eyebrow"><Film size={16}/> VISUAL PRODUCTION</span>
      <h1>Lyric Videos</h1><p>Give every line its moment. Sync your lyrics to the recording, choose an animated background, and export the finished video.</p><HelpControl subject="Upload song for video" tip="Add an audio file to the library and open it in the lyric video editor."><button className="secondary" onClick={upload} disabled={busy}>Upload song for video</button></HelpControl></div>
    {!song ? <div className="panel form-panel"><h2>Find your visual voice</h2><p>Try all 14 caption templates below. Upload a recording to apply one to your lyrics and export a finished video.</p>
      <CaptionTemplateDemo project={project}/><CaptionTemplatePicker value={captionTemplate} choose={chooseCaptionTemplate} disabled={busy}/></div> :
    <div className="create-layout lyric-layout">
      <section className="panel form-panel">
        <HelpField label="Recording" tip="Choose a clean audio track from My Songs. Studio uses it for preview and caption timing."><select value={song.id} disabled={busy} onChange={event => setSongId(event.target.value)}>
          {tracks.map(track => <option key={track.id} value={track.id}>{track.name}</option>)}</select></HelpField>
        <div className="lyric-preview">
          <canvas ref={canvas} width={size.width} height={size.height} aria-label="Animated lyric-video preview"/>
          <p className="muted">Preview · {timeLabel(time)} / {timeLabel(duration)}</p>
        </div>
        <audio ref={audio} className="lyric-transport" src={songAudioUrl(song.id, song.audioId)} controls preload="metadata" aria-label="Lyric timing playback"
          onLoadStart={() => { setDuration(0); setTime(0); }} onLoadedMetadata={event => {
            const duration = event.currentTarget.duration;
            setDuration(Number.isFinite(duration) ? duration : 0);
          }} onError={() => setError("The recording could not load. Check its playback in Song Library.")}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
          onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onSeeked={event => setTime(event.currentTarget.currentTime)}/>
        <CaptionTemplatePicker value={captionTemplate} choose={chooseCaptionTemplate} disabled={busy}/>
        {captionTemplate && <CaptionTemplateDemo project={project}/>}
        <fieldset className="lyric-presets" disabled={busy}>
          <legend>Scene presets</legend>
          <div className="lyric-template-grid">{lyricTemplates.map(item => {
            const art = videoThemes[item.theme];
            const selected = !captionTemplate && !picture && item.theme === theme && item.format === format && item.motion === motion &&
              item.font === font && item.color === color && item.effect === effect;
            return <button type="button" className="lyric-template" aria-pressed={selected} key={item.name} onClick={() => {
              setCaptionTemplate(undefined); setTheme(item.theme); setFormat(item.format); setMotion(item.motion); setFont(item.font);
              setColor(item.color); setEffect(item.effect); setPicture(""); setError("");
            }}><span aria-hidden="true" style={{ backgroundImage: art.image ? `url(${art.image})` : `linear-gradient(135deg,${art.colors[0]},${art.colors[2]})` }}/>
              <strong>{item.name}</strong><small>{item.note}</small></button>;
          })}</div>
        </fieldset>
        <VideoFormatPicker value={format} change={setFormat} disabled={busy} resolution={720}/>
        <div className="field-grid">
          <HelpField label="Background motion" tip="Choose whether the artwork drifts, slowly zooms, or stays still."><select value={motion} disabled={busy} onChange={event => setMotion(event.target.value as VideoMotion)}>
            <option value="drift">Slow drift</option><option value="zoom">Slow zoom</option><option value="still">Still</option></select></HelpField>
        </div>
        <fieldset disabled={busy}>
          <legend>Background theme</legend>
          <div className="lyric-themes">{(Object.keys(videoThemes) as VideoTheme[]).map(id => {
            const item = videoThemes[id];
            return <button key={id} type="button" className={`lyric-theme ${theme === id && !picture ? "active" : ""}`}
              aria-pressed={theme === id && !picture} onClick={() => { setTheme(id); setPicture(""); setError(""); }}>
              <span aria-hidden="true" style={{ backgroundImage: item.image ? `url(${item.image})` : `linear-gradient(140deg,${item.colors[0]},${item.colors[2]})` }}/>
              {item.title}
            </button>;
          })}</div>
          <HelpField label={<><ImagePlus size={15}/> Use your own picture</>} subject="Use your own picture" tip="Use a JPG, PNG, or WebP as the background for this export. Choose it again when you reopen the editor."><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
            const file = event.target.files?.[0]; event.target.value = "";
            if (!file) return;
            if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) {
              setError("Choose a JPG, PNG, or WebP picture up to 15 MB."); return;
            }
            if (pictureUrl.current) URL.revokeObjectURL(pictureUrl.current);
            pictureUrl.current = URL.createObjectURL(file); setPicture(pictureUrl.current); setError("");
          }}/></HelpField>
          {picture && <button className="secondary small" onClick={() => { setPicture(""); setError(""); }}>Use theme artwork</button>}
        </fieldset>
        <p className="muted creation-note">Studio artwork is illustrative. Your picture is included in the export. Choose it again when you reopen this editor.</p>
      </section>
      <section className="panel form-panel">
        <h2>Lyrics & captions</h2>
        <div className="field-grid">
          <HelpField label="Caption font" tip="Changes the typeface of the text burned into the video."><select value={font} disabled={busy} onChange={event => setFont(event.target.value as keyof typeof captionFonts)}>{Object.entries(captionFonts).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></HelpField>
          <HelpField label="Caption color" tip="Changes the color of the on-screen lyrics. Choose a color with good contrast against the background."><select value={color} disabled={busy} onChange={event => setColor(event.target.value as keyof typeof captionColors)}><option value="pearl">Pearl</option><option value="gold">Celestial gold</option><option value="turquoise">Turquoise</option><option value="lilac">Lilac</option></select></HelpField>
          {!captionTemplate && <HelpField label="Caption animation" tip="Choose whether captions fade, gently rise, or appear without motion."><select value={effect} disabled={busy} onChange={event => setEffect(event.target.value as keyof typeof captionEffects)}>{Object.entries(captionEffects).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></HelpField>}
        </div>
        {captionTemplate && <div className="field-grid">
          <HelpField label="Motion intensity" tip="Full motion uses the template rules. Gentle reduces movement. Still keeps word highlights without animated transforms or pulses."><select value={intensity} disabled={busy} onChange={e => setIntensity(e.target.value as typeof intensity)}><option value="full">Full motion</option><option value="gentle">Gentle</option><option value="still">Still / reduced motion</option></select></HelpField>
          <HelpField label="Pulse tempo (BPM)" tip="Sets a steady visual pulse for glow effects. This is not automatic audio beat detection."><input type="number" min="40" max="240" step="1" value={bpm} disabled={busy} onChange={e => { const value = e.target.valueAsNumber; if (Number.isFinite(value)) setBpm(Math.max(40, Math.min(240, value))); }}/></HelpField>
          {captionTemplate === "vertical-garden" && <HelpField label="Caption layout" tip="Automatic uses upright columns for Chinese and Japanese text. Other scripts keep a readable horizontal layout."><select value={captionLayout} disabled={busy} onChange={e => setCaptionLayout(e.target.value as typeof captionLayout)}><option value="auto">Auto · CJK vertical columns</option><option value="horizontal">Horizontal</option></select></HelpField>}
        </div>}
        {captionTemplate && <p className="muted creation-note">Word effects follow aligned vocals when available, with estimated pacing for manually timed lines. Font and color controls customize the selected template; metallic and rainbow templates retain their special fills. SRT/VTT files contain timing and text; styled motion appears in the video export.</p>}
        <HelpField label="Paste lyrics" tip="Paste the words in the order they are sung, including repeated choruses. Put one caption line on each row."><textarea value={text} maxLength={5000} rows={7} disabled={busy}
          placeholder="Paste the sung words, one line per row. Include repeated choruses as sung."
          onChange={event => { setText(event.target.value); setError(""); setNotice(""); }}/></HelpField>
        <div className="actions">
          <HelpControl subject="Use song lyrics" tip="Load the lyrics saved on this song into the caption editor."><button className="secondary small" disabled={busy || !song.notes.lyrics.trim()} onClick={() => { setText(song.notes.lyrics); setError(""); setNotice(""); }}>Use song lyrics</button></HelpControl>
          <HelpControl subject="Estimate timings" tip="Spread your lyric lines across the recording as a starting point for manual timing."><button className="secondary small" disabled={busy || !duration} onClick={estimate}><Clock size={15}/> Estimate timings</button></HelpControl>
          <HelpControl subject="Add caption at playhead" tip="Insert a new caption at the current preview position."><button className="secondary small" disabled={busy || !duration || (!!text.trim() && !sameText) || cues.length >= 200}
            onClick={addCaption}><Plus size={15}/> Add caption at playhead</button></HelpControl>
        </div>
        <div className="caption-sync">
          <h3>Automatic vocal sync</h3>
          {!elevenLabs.connected && <p className="muted creation-note">Connect ElevenLabs to align vocals automatically. Manual timing is ready to use. <button type="button" className="text-button" disabled={busy} onClick={connectionSettings}>Provider settings</button></p>}
          <div className="actions">
            <HelpControl subject="Align pasted lyrics" tip="Match your pasted words to the recording through ElevenLabs. This replaces the current caption timing and may use plan credits."><button className="primary" disabled={busy || !duration || !clean || !elevenLabs.connected || !lyricLines(text).length} onClick={() => autoSync("align")}>
              <Sparkles size={16}/> Align pasted lyrics</button></HelpControl>
            <HelpControl subject="Create captions from audio" tip="Ask ElevenLabs to transcribe the recording into timed captions. Review the words and timing before export."><button className="secondary" disabled={busy || !duration || !elevenLabs.connected} onClick={() => autoSync("transcribe")}>Create captions from audio</button></HelpControl>
          </div>
          <p className="muted creation-note">These buttons send the selected recording and any lyrics to ElevenLabs and may use plan credits. Automatic captions replace the current caption draft. Review the result, especially for layered vocals.</p>
          {syncMode && <div className="actions"><p role="status">{syncMode === "align" ? "Aligning lyrics to the vocals…" : "Creating captions from the vocals…"}</p>
            <button className="secondary small" onClick={() => pending.current?.abort()}>Cancel sync</button></div>}
        </div>
        {!clean && <CleanLyricsChecker lyrics={text} change={cleanCaptions} styleContext={song.notes.prompt} label="Clean caption rewrite" disabled={busy}/>}
        {clean && cues.length > 0 && !sameText && <p className="muted creation-note">Lyrics changed. Align them again or estimate timings to update the caption list.</p>}
        {sameText && cues.length > 0 && <>
          <p className="muted creation-note">Edit any caption or its times. Select a caption number to seek there. An optional end time clears the line during instrumental gaps.</p>
          <div className="actions">
            <HelpControl subject="Stamp next line" tip="Set the next caption’s start time to the current playback position."><button className="secondary small" disabled={busy || nextCue >= cues.length || !clean} onClick={stamp}>Stamp next line</button></HelpControl>
            <button className="secondary small" disabled={busy} onClick={() => setNextCue(0)}>Start stamping over</button>
          </div>
          <ol className="lyric-cues caption-cues">{cues.map((cue, index) => <li key={index} className={index === nextCue ? "cue-next" : ""}>
            <button type="button" className="text-button" aria-label={`Seek to caption ${index + 1}`} disabled={busy} onClick={() => {
              setNextCue(index); setError("");
              if (audio.current && Number.isFinite(cue.time) && cue.time < duration) audio.current.currentTime = cue.time;
            }}>{index + 1}</button>
            <input aria-label={`Caption ${index + 1} text`} maxLength={180} value={cue.text} disabled={busy} onChange={event => {
              const next = cues.map((item, row) => index === row ? { ...item, text: event.target.value, words: undefined, accentWords: undefined } : item);
              setCaptionText(next);
            }}/>
            <input aria-label={`Line ${index + 1} start time in seconds`} title="Start in seconds" type="number" min="0" step="0.001" max={duration} disabled={busy}
              value={Number.isNaN(cue.time) ? "" : cue.time} onChange={event => {
                const value = event.target.valueAsNumber;
                setCues(current => current.map((item, row) => index === row ? { ...item, time: value, words: undefined } : item));
              }}/>
            <input aria-label={`Line ${index + 1} end time in seconds`} title="End in seconds (optional)" placeholder="End" type="number" min="0" step="0.001" max={duration} disabled={busy}
              value={cue.end ?? ""} onChange={event => {
                const end = event.target.value === "" ? undefined : event.target.valueAsNumber;
                setCues(current => current.map((item, row) => index === row ? { ...item, end, words: item.words?.filter(word => end === undefined || word.time <= end) } : item));
              }}/>
            <button type="button" className="icon-button" aria-label={`Remove caption ${index + 1}`} disabled={busy}
              onClick={() => { setCaptionText(cues.filter((_, row) => row !== index)); setNextCue(Math.max(0, Math.min(nextCue, cues.length - 2))); }}><X size={15}/></button>
            {captionTemplate && <div className="caption-emphasis">
              <label>Line {index + 1} emphasis<select aria-label={`Caption ${index + 1} emphasis`} value={cue.emphasis ?? "auto"} disabled={busy}
                onChange={e => setCues(current => current.map((item, row) => row === index ? { ...item, emphasis: e.target.value as CaptionEmphasis } : item))}>
                <option value="auto">Template rule</option><option value="glow">Illuminate</option><option value="color">Color pop</option><option value="pop">Pop-up</option>
              </select></label>
              <button type="button" className="text-button" disabled={busy} onClick={() => setCues(current => current.map((item, row) => row === index ? { ...item, accentWords: undefined, emphasis: "auto" } : item))}>Reset automatic emphasis</button>
              <div className="caption-word-chips" aria-label={`Caption ${index + 1} emphasized words`} dir="auto">{captionTokens(cue, cues[index + 1]?.time ?? cue.end ?? duration).map(word => <button type="button" key={word.end} disabled={busy} aria-pressed={cue.accentWords?.includes(word.end) ?? false}
                title="Toggle extra emphasis" onClick={() => setCues(current => current.map((item, row) => {
                  if (row !== index) return item;
                  const selected = item.accentWords ?? [];
                  return { ...item, accentWords: selected.includes(word.end) ? selected.filter(offset => offset !== word.end) : [...selected, word.end] };
                }))}>{word.text}</button>)}</div>
              <span className="muted">{cue.accentWords === undefined ? "Automatic emphasis: hook words and phrase endings." : cue.accentWords.length ? "Selected words receive extra emphasis as they are sung." : "No extra word emphasis selected."}</span>
            </div>}
          </li>)}</ol>
          {!valid && <p className="muted creation-note">Use nonempty captions with increasing start times. End times must be after the start and within the recording.</p>}
        </>}
        <div className="field-grid lyric-export-range">
          <HelpField label="Export length" tip="Export the full song or a short clip. Caption downloads follow the same time range."><select value={clipLength} disabled={busy} onChange={event => setClipLength(event.target.value)}>
            <option value="full">Full song</option>{[15, 30, 60].map(value => <option key={value} value={value}>{value}-second clip</option>)}</select></HelpField>
          {clipLength !== "full" && <HelpField label="Clip start (seconds)" tip="Choose where the exported clip starts in the original recording."><input type="number" min="0" max={duration} step="0.01" value={clipStart}
            disabled={busy} onChange={event => setClipStart(event.target.value)}/></HelpField>}
        </div>
        {clipLength !== "full" && <HelpControl subject="Use preview playhead" tip="Set the clip’s starting point to where the preview is currently paused or playing."><button className="secondary small" disabled={busy || !duration} onClick={() => setClipStart(String(Math.round(time * 100) / 100))}>Use preview playhead</button></HelpControl>}
        {!validRange && duration > 0 && <p className="muted creation-note">Choose a start inside the recording or use a shorter clip.</p>}
        <div className="actions">
          <HelpControl subject="Save lyric timing" tip="Keep these captions and visual settings with the song so you can edit them later."><button className="secondary" disabled={busy || !valid} onClick={async () => {
            if (await save({ ...song, lyricVideo: project }, "Lyric timing saved")) { await recovery.clear(); setNotice("Timing and visual settings saved to this song."); }
          }}><Save size={15}/> Save lyric timing</button></HelpControl>
          <HelpControl subject="Export lyric video" tip="Render a video file with the recording, captions, and chosen background. Keep this tab visible during export."><button className="primary" disabled={busy || !valid || imageLoading || (!!imageSource && !image) || !validRange} onClick={renderVideo}><Film size={16}/> Export lyric video</button></HelpControl>
        </div>
        <HelpControl subject="Export square cover" tip="Use the current background and song title to make a 3000 by 3000 pixel PNG. Captions are excluded."><button className="secondary small" disabled={busy || imageLoading || (!!imageSource && !image)} onClick={exportCover}><Download size={15}/> Export cover PNG</button></HelpControl>
        {valid && validRange && <div className="actions" aria-label="Download captions">{(["srt", "vtt"] as const).map(format =>
          <a className="secondary small" key={format} download={captionName + "." + format}
            href={"data:text/plain;charset=utf-8," + encodeURIComponent(captionFile(cues, start, end, format))}><Download size={15}/> Save {format.toUpperCase()} captions</a>)}</div>}
        <p className="muted creation-note">Exports run in real time. Keep this tab visible. Full-song export supports up to 10 minutes.</p>
        {progress !== null && <div className="actions"><progress value={progress} max="1" aria-label="Lyric video export progress"/>
          <button className="secondary small" onClick={() => pending.current?.abort()}>Cancel export</button></div>}
        {error && <p className="notice" role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {output && <div className="lyric-result">
          <h3>Last export</h3><video src={output.url} controls playsInline aria-label="Exported lyric video"/>
          <HelpField label="Post caption" tip="Write the text to accompany your upload. This is separate from the timed lyrics in the video."><textarea rows={3} maxLength={1000} value={postCaption} onChange={event => setPostCaption(event.target.value)}/></HelpField>
          {hasExplicitWords(postCaption) && <CleanLyricsChecker lyrics={postCaption} change={setPostCaption} direction label="Clean post caption"/>}
          <VideoPublishing output={output} title={song.name + " · Lyric Video"} caption={postCaption} platform={platform} setPlatform={setPlatform}/>
        </div>}
      </section>
    </div>}
  </>;
}
