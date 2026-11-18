"use client";
import { MusicLanguageControl } from "./music-language-control";
import { defaultLanguageChoice, isLanguageChoice, resolveLanguage, type LanguageChoice } from "./music-language";
import {LyricNotationPreview} from "./lyric-notation-preview";
import {parseLyricNotation} from "./lyric-notation";
import {SongOpeningControl} from "./song-opening-control";
import {performanceWeight, type SongOpening} from "./song-opening";
import {productionFetch} from "./credits/client";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";
import {useAccountWriting} from "./use-account-writing";
import {SongCard} from "./song-card";
import { GenrePicker } from "./genre-picker";
import { genreDirection, uniqueGenreNames } from "./music-genres";
import { GenreAssistant } from "./genre-assistant";
import { fusionGenres, suggestGenreFusion } from "./genre-assist";

import { HelpControl, HelpField } from "./help-tip";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, Download, Headphones, Library, Mic2, Music2, Settings2, SlidersHorizontal, Sparkles } from "lucide-react";
import type { ElevenLabsKey } from "./elevenlabs-key";
import { SavedLyricVideos } from "./saved-lyric-videos";
import { AudioActions } from "./audio-actions";
import { AudioPlayer } from "./audio-player";
import { CleanLyricsChecker } from "./clean-lyrics-checker";
import { cleanWordsMessage, hasExplicitWords, isExplicitSong } from "./clean-content";
import { arrangements, creationPresets, experienceLevels, instrumentalLabel, isInstrumental, motifModes, musicalKeys, recommendPreset, recommendTempo, type ExperienceLevel, type Instrumental, type MotifMode, type Preset } from "./creation-guide";
import { renderInstrumental } from "./instrumental";
import { InstrumentalExports, SeparatedStems } from "./production-exports";
import { songwritingStarter } from "./songwriting";
import { TrackLengthControl } from "./track-length-control";
import { autoTrackTime, formatTrackTime, isTrackDuration, parseTrackTime } from "./track-duration";
import { songAudioUrl, type Song, type Voice } from "./studio-data";

type Preview = { id: string; audio: string };
type Send = (payload: Record<string, string | number | boolean>, message: string) => Promise<boolean>;
type LocalPreview = { blob: Blob; url: string; title: string; prompt: string; settings: Instrumental;saveId?:string };

const preferenceKey = "samadhi-love-creation-level";
const levelIcons = { beginner: BookOpen, advanced: SlidersHorizontal, pro: Sparkles };

function reveal(element: HTMLElement | null) {
  requestAnimationFrame(() => {
    if (!element?.isConnected) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  });
}

import type { SectionDirection } from "./song-section-directions";
import type { CreateSeed } from "./music-workspace-data";

export function CreateStudio({ seed, projects = [], historySongs = projects, voiceDesignAllowed, elevenLabs, connectionSettings, drafts, voices, saving, operationError, startAtDrafts, firstSongRequest, finishFirstSongRequest, openVocalStudio, send, saveDraft, saveInstrumental, move, open, remix,working }: {
  seed: CreateSeed | null;
  voiceDesignAllowed: boolean;
  elevenLabs: ElevenLabsKey;
  connectionSettings: () => void;
  drafts: Song[];
  voices: Voice[];
  saving: boolean;
  operationError: string;
  startAtDrafts: boolean;
  firstSongRequest: boolean;
  finishFirstSongRequest: () => void;
  projects?: Song[];
  historySongs?: Song[];
  openVocalStudio: () => void;
  send: Send;
  saveDraft: (title: string, prompt: string, lyrics: string, voice: string, duration: number | null, sectionDirections?: SectionDirection[], projectId?: string) => Promise<boolean>;
  saveInstrumental: (file: File, title: string, prompt: string, settings: Instrumental, projectId?: string,saveId?:string) => Promise<boolean>;
  move: (song: Song, publish?: boolean) => Promise<boolean>;
  remix: (song: Song) => void;
  working?:(value:boolean)=>void;
  open: (id: string) => void;
}) {
  const sourceSettings = seed?.instrumentSettings;
  const [level, setLevel] = useState<ExperienceLevel | null>(sourceSettings ? "pro" : null);
  const [openingMode,setOpeningMode]=useState<SongOpening>("auto");
  const [step, setStep] = useState(startAtDrafts ? 3 : sourceSettings ? 2 : 1);
  const levelsHeading = useRef<HTMLHeadingElement>(null);
  const createHeading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (startAtDrafts) reveal(resultHeading.current);
  }, [startAtDrafts]);
  const [mode, setMode] = useState<"song" | "voice">("song");
  const [sectionDirections, setSectionDirections] = useState(seed?.sectionDirections);
  const [choice, setChoice] = useState<"vocals" | "instrumental" | null>(seed?.instrumental === undefined ? null : seed.instrumental ? "instrumental" : "vocals");
  const [instrumentEngine, setInstrumentEngine] = useState<"studio" | "connected" | null>(sourceSettings ? "studio" : null);
  const engine = instrumentEngine ?? (elevenLabs.defaultProvider ? "connected" : "studio");
  const [lyricsMode, setLyricsMode] = useState<"auto" | "own">(performanceWeight(seed?.lyrics??"") ? "own" : "auto");
  const [title, setTitle] = useState(seed?.title ?? "");
  const [projectId, setProjectId] = useState(seed?.projectId ?? "");
  const [idea, setIdea] = useState(seed?.idea ?? "");
  const [genres, setGenres] = useState<string[]>(uniqueGenreNames(seed?.genres ?? []));
  const [autoGenre,setAutoGenre]=useState(false),[useHistory,setUseHistory]=useState(true),[fusionName,setFusionName]=useState(""),[fusionVariation,setFusionVariation]=useState(0),[readLyricStyles,setReadLyricStyles]=useState(true);
  const [lyrics, setLyrics] = useState(seed?.lyrics ?? "");
  const [languageChoice,setLanguageChoice] = useState<LanguageChoice>(defaultLanguageChoice);
  const [voice, setVoice] = useState(seed?.vocal ?? "");
  const seedDuration = sourceSettings?.seconds ?? seed?.seconds;
  const [autoLength, setAutoLength] = useState(!isTrackDuration(seedDuration));
  const [manualTime, setManualTime] = useState<string | null>(isTrackDuration(seedDuration) ? formatTrackTime(seedDuration) : null);
  const [presetOverride, setPreset] = useState<Preset | null>(sourceSettings?.preset ?? null);
  const [tempo, setTempo] = useState(sourceSettings ? String(sourceSettings.bpm) : seed?.bpm ?? "");
  const [mood, setMood] = useState("");
  const [tonic, setTonic] = useState(sourceSettings?.tonic ?? 9);
  const [scale, setScale] = useState<"major" | "minor" | "preset">(sourceSettings ? (sourceSettings.minor ? "minor" : "major") : "preset");
  const [shape, setShape] = useState<Instrumental["arrangement"]>(sourceSettings?.arrangement ?? "build");
  const [motif, setMotif] = useState<MotifMode>(sourceSettings?.motif ?? "original");
  const [motifSeed, setMotifSeed] = useState<number | undefined>(sourceSettings?.seed);
  const [direction, setDirection] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [previewId, setPreviewId] = useState("");
  const [auditioning, setAuditioning] = useState(false);
  const [generating, setGenerating] = useState(false);
  useEffect(()=>{working?.(generating);return()=>working?.(false);},[generating,working]);
  const [error, setError] = useState("");
  const [localPreviews, setLocalPreviews] = useState<LocalPreview[]>([]);
  const previewUrls = useRef(new Set<string>());
  const alternateCounter = useRef(0);
  const active = useRef(true);

  useEffect(() => {
    if (sourceSettings) { reveal(createHeading.current); return; }
    try {
      const stored = localStorage.getItem(preferenceKey);
      const previous = experienceLevels.find(item => item.id === stored);
      if (previous) setLevel(previous.id);
    } catch { /* Level selection still works when browser storage is disabled. */ }
  }, []);
  useEffect(() => {
    active.current = true;
    const urls = previewUrls.current;
    return () => {
      active.current = false;
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const recovery = useDraftRecovery(`create:${seed?.title ?? "new"}:${seed?.idea ?? ""}`, { languageChoice, projectId, openingMode, level, step, mode, sectionDirections, choice, instrumentEngine, presetOverride, motifSeed, lyricsMode, title, idea, genres, autoGenre, useHistory, fusionName, fusionVariation, readLyricStyles, lyrics, voice, autoLength, manualTime, tempo, mood, tonic, scale, shape, motif, direction, voiceName, description, previews: localPreviews.map(({ url, ...preview }) => preview) }, value => { if(isLanguageChoice(value.languageChoice))setLanguageChoice(value.languageChoice); setProjectId(value.projectId); setOpeningMode(value.openingMode&&["auto","direct","short"].includes(value.openingMode)?value.openingMode:"auto"); setLevel(value.level); setStep(value.step); setMode(value.mode); setSectionDirections(value.sectionDirections); setChoice(value.choice); setLyricsMode(value.lyricsMode); setTitle(value.title); setIdea(value.idea); setGenres(Array.isArray(value.genres) ? value.genres : []); setAutoGenre(value.autoGenre===true); setUseHistory(value.useHistory!==false); setFusionName(typeof value.fusionName==="string"?value.fusionName:""); setFusionVariation(Number.isSafeInteger(value.fusionVariation)?Math.max(0,value.fusionVariation):0); setReadLyricStyles(value.readLyricStyles!==false); setLyrics(value.lyrics); setVoice(value.voice); setAutoLength(value.autoLength); setManualTime(value.manualTime); setTempo(value.tempo); setMood(value.mood); setTonic(value.tonic); setScale(value.scale); setShape(value.shape); setMotif(value.motif); setDirection(value.direction); setVoiceName(value.voiceName); setDescription(value.description); setInstrumentEngine(value.instrumentEngine); setPreset(value.presetOverride); setMotifSeed(value.motifSeed); setLocalPreviews(value.previews.map(preview => { const url = URL.createObjectURL(preview.blob); previewUrls.current.add(url); return { ...preview, saveId:preview.saveId??crypto.randomUUID(), url }; })); }, !!(idea.trim() || genres.length || autoGenre || lyrics.trim() || title.trim() || description.trim() || localPreviews.length));
  const pro = level === "pro";
  const type = choice ?? (elevenLabs.connected ? "vocals" : "instrumental");
  const isLocal = type === "instrumental" && engine === "studio";
  const advanced = level === "advanced" || pro;
  const fusion=suggestGenreFusion(idea,readLyricStyles&&lyricsMode==="own"&&type==="vocals"?lyrics:"",historySongs,useHistory,fusionVariation);
  const selectedGenres=autoGenre?fusionGenres(fusion,fusionName):genres;
  const recommended = recommendPreset([...selectedGenres, idea].join(", "));
  const presetId = advanced ? (presetOverride ?? recommended) : recommended;
  const preset = creationPresets[presetId];
  const suggestedTempo = recommendTempo(idea, presetId);
  const bpm = advanced && tempo !== "" ? Number(tempo) : suggestedTempo;
  const validTempo = Number.isInteger(bpm) && bpm >= 50 && bpm <= 180;
  const minor = pro && scale !== "preset" ? scale === "minor" : presetId === "dabke" || presetId === "soul";
  const busy = saving || auditioning || elevenLabs.busy || generating;
  const currentLyrics = type === "vocals" && lyricsMode === "own" ? lyrics : "";
  useEffect(() => {
    if (!firstSongRequest) return;
    setMode("song"); setChoice("vocals");
    if (createHeading.current) { setStep(2); reveal(createHeading.current); }
    else reveal(levelsHeading.current);
    finishFirstSongRequest();
  }, [firstSongRequest, finishFirstSongRequest]);

  const suggestedLength = autoTrackTime({
    vocals: type === "vocals", lyrics: currentLyrics, beginner: level === "beginner",
    bpm: validTempo ? bpm : suggestedTempo, cinematic: pro && shape === "cinematic",
    prompt: [idea,pro&&direction].filter(Boolean).join("\n"), templateSeconds: seedDuration, sectionCount: sectionDirections?.length,
  });
  const displayedTime = manualTime ?? formatTrackTime(suggestedLength.seconds);
  const length = autoLength ? suggestedLength.seconds : parseTrackTime(displayedTime);

  function chooseLevel(next: ExperienceLevel) {
    setLevel(next); setStep(2); setError("");
    if (next !== "pro") setMode("song");
    try { localStorage.setItem(preferenceKey, next); } catch { /* Optional browser preference. */ }
    requestAnimationFrame(() => reveal(createHeading.current));
  }

  function goToResult() {
    setStep(3); reveal(resultHeading.current);
  }

  function buildPrompt(alternate = false) {
    const production = [
      !seed && (!selectedGenres.length || isLocal) && preset.prompt, bpm + " BPM", advanced && mood.trim() && "Mood: " + mood.trim(),
      pro && musicalKeys[tonic] + (minor ? " minor" : " major"),
      pro && arrangements[shape].direction, pro && direction.trim(),
      alternate && "Explore a different arrangement with a new lead motif while keeping the central idea and genre.",
    ].filter(Boolean).join(". ");
    return [genreDirection(selectedGenres), idea.trim(), production].filter(Boolean).join("\n");
  }

  function validateIdea() {
    if (buildPrompt().length > 1600) { setError("The combined music direction exceeds 1600 characters. Shorten your description or production notes so every selected style and instruction can be sent intact."); return false; }
    if (!validTempo) { setError("Choose a whole-number tempo between 50 and 180 BPM."); return false; }
    if (lyricsMode === "own" && parseLyricNotation(lyrics).errors.length) { setError(parseLyricNotation(lyrics).errors[0]); return false; }
    if (readLyricStyles&&fusion.cues.errors.length) {setError(fusion.cues.errors[0]);return false;}
    if (hasExplicitWords(idea, title, currentLyrics, mood, voice, direction, ...selectedGenres)) { setError(cleanWordsMessage); return false; }
    setError("");
    return true;
  }
  const writingStatus=useAccountWriting("custom",{title:title.trim(),prompt:idea,lyrics,voice},recovery.ready&&!busy&&!!(idea.trim()||lyrics.trim()),w=>{setTitle(w.title);setIdea(w.prompt);setLyrics(w.lyrics);setVoice(w.voice);if(w.lyrics)setLyricsMode("own");},recovery);
  const freshRef=useRef(()=>{});
  freshRef.current=()=>{
    void recovery.reset({...recovery.value,title:"",idea:"",lyrics:"",voice:"",projectId:"",genres:[],fusionName:"",fusionVariation:0,autoGenre:false,direction:"",mood:"",voiceName:"",description:"",previews:[],sectionDirections:undefined,choice:null,lyricsMode:"auto",openingMode:"auto",languageChoice:defaultLanguageChoice});
    writingStatus.reset({title:"",prompt:"",lyrics:"",voice:""});
  };
  useEffect(()=>{
    const fresh=(event:Event)=>{if((event as CustomEvent).detail?.scope===recovery.scope)freshRef.current();};
    window.addEventListener("versual:new-song",fresh);return()=>window.removeEventListener("versual:new-song",fresh);
  },[recovery.scope]);

  async function create(alternate = false) {
    if (busy || !idea.trim() || length === null || !validateIdea()) return;
    if(autoLength&&suggestedLength.overLimit){setError("This prompt exceeds the ten-minute generation request limit. Request a shorter song or use Party Files for a longer set.");return;}
    if(isLocal&&length>360){setError("Local sketches support six minutes; use connected generation for a longer song.");return;}
    const prompt = buildPrompt(alternate);
    if (prompt.length > 1600) { setError("The complete music direction exceeds 1600 characters. Shorten it before creating this take; nothing has been sent."); return; }
    const songTitle = title.trim() || (isLocal ? preset.name + " Sketch" : "Untitled song");
    const resultTitle = alternate ? songTitle.slice(0, 88) + " · Alt" : songTitle;
    setGenerating(true);
    try {
      if (isLocal) {
        if(localPreviews.length>=2){setError("Save the pending instrumentals below before creating another. Your unsaved results are preserved.");return;}
        const baseSeed = motifSeed ?? crypto.getRandomValues(new Uint32Array(1))[0];
        if (pro && motifSeed === undefined) setMotifSeed(baseSeed);
        const settings: Instrumental = {
          preset: presetId, bpm, seconds: length, tonic: pro ? tonic : 9, minor,
          arrangement: pro ? shape : "build", seed: alternate ? (baseSeed + ++alternateCounter.current) >>> 0 : baseSeed,
          ...(pro && motif !== "original" && { motif }),
        };
        const blob = await renderInstrumental(settings);
        if (!active.current) return;
        const url = URL.createObjectURL(blob);
        const saveId=crypto.randomUUID();
        previewUrls.current.add(url);
        setLocalPreviews(current => [{ blob, url, title: resultTitle, prompt, settings,saveId }, ...current]);
        if(await saveInstrumental(new File([blob],"studio-instrumental.wav",{type:"audio/wav"}),resultTitle,prompt,settings,projectId||undefined,saveId))discardPreview(url);
        else setError("Your instrumental is ready but its account save could not be confirmed. It remains below for download or Retry save.");
        goToResult();
        return;
      }
      if (!elevenLabs.connected) { setError("Open Settings to enable sung songs and connected generation."); return; }
      if (type === "vocals" && lyricsMode === "own" && !performanceWeight(lyrics)) { setError("Add words to sing, or choose Write lyrics for me. Section headings alone are not finished lyrics."); return; }
      if (type === "vocals") resolveLanguage(languageChoice, currentLyrics, prompt);
      if (await send({ action: "song", ...languageChoice, ...(projectId && { projectId }), title: resultTitle, prompt, genres: selectedGenres.join(", "), lyrics: currentLyrics, voice: type === "vocals" ? voice : "",
        duration: length, openingMode, ...(lyricsMode==="auto" && !performanceWeight(lyrics) && lyrics.trim() && {arrangement:lyrics.slice(0,2000)}), instrumental: type === "instrumental", readLyricStyles,
        ...(type === "vocals" && sectionDirections && { sectionDirections: JSON.stringify(sectionDirections) }) }, "Song saved privately to Your songs")) goToResult();
    } catch (error) {
      setError(error instanceof Error ? error.message : "The track could not render. Try a shorter length.");
    } finally { setGenerating(false); }
  }

  async function audition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setAuditioning(true); setError(""); setPreviews([]); setPreviewId("");
    try {
      const response = await productionFetch("/api/studio/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview-voice", description }),
      });
      const result = await response.json() as { previews?: Preview[]; error?: string };
      if (!response.ok || !result.previews) throw new Error(result.error ?? "Voice previews are unavailable.");
      setPreviews(result.previews);
      setPreviewId(result.previews[0]?.id ?? "");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Voice previews are unavailable.");
    } finally { setAuditioning(false); }
  }

  function discardPreview(url: string) {
    URL.revokeObjectURL(url);
    previewUrls.current.delete(url);
    setLocalPreviews(current => current.filter(item => item.url !== url));
  }

  function reuse(song: Song) {
    const settings = isInstrumental(song.instrumental) ? song.instrumental : undefined;
    setMode("song"); setTitle(song.name.slice(0, 84) + " · New take");
    setSectionDirections(song.sectionDirections);
    setMotif(settings?.motif ?? "original"); setMotifSeed(settings?.seed);
    setIdea((song.sectionDirections ? song.notes.prompt : song.notes.prompt.split("\n")[0]).slice(0, 1000));
    setLyrics(song.notes.lyrics); setLyricsMode(performanceWeight(song.notes.lyrics) ? "own" : "auto");
    setLanguageChoice(song.generation?.languageProfile ?? defaultLanguageChoice);
    setVoice(song.notes.vocals); setChoice(settings || song.creationKind === "instrumental" ? "instrumental" : "vocals");
    setInstrumentEngine(song.creationKind === "instrumental" && !settings ? "connected" : "studio"); setPreset(settings?.preset ?? null); setTempo(settings ? String(settings.bpm) : "");
    setTonic(settings?.tonic ?? 9); setScale(settings ? (settings.minor ? "minor" : "major") : "preset"); setShape(settings?.arrangement ?? "build");
    const previousLength = settings?.seconds ?? song.creationSeconds;
    const savedLength = isTrackDuration(previousLength);
    setAutoLength(!savedLength); setManualTime(savedLength ? formatTrackTime(previousLength) : null);
    setMood(""); setDirection(""); setError("");
    if ((settings || song.creationKind === "instrumental") && !pro) { chooseLevel("pro"); return; }
    if (!level) { chooseLevel("advanced"); return; }
    setStep(2); reveal(createHeading.current);
  }

  const levelName = experienceLevels.find(item => item.id === level)?.name;
  const canCreate = !!idea.trim() && validTempo && length !== null && (isLocal || elevenLabs.connected) &&
    (type !== "vocals" || lyricsMode !== "own" || !!lyrics.trim());
  const formError = error || operationError;
  return <div className="guided-creation"><RecoveryPanel recovery={recovery}/>{writingStatus.status&&<small role="status">{writingStatus.status}</small>}
    <div className="create-banner guide-banner">
      <span className="eyebrow"><Sparkles size={15}/> THE CREATION ROOM</span>
      <h1>Give your idea a sound.</h1>
      <p>Describe a song, shape the sound, then listen to your song. The Studio will guide you at the level you choose.</p>
      <div className="actions"><button type="button" className="secondary small" onClick={connectionSettings}><Settings2 size={15}/> AI Music Provider Settings</button><button type="button" className="secondary small" onClick={openVocalStudio}><Mic2 size={15}/> Open Vocal Studio</button></div>
    </div>
    <label className="field">Project<select value={projectId} disabled={busy} onChange={event => setProjectId(event.target.value)}><option value="">Start a new project</option>{projects.filter(song=>!["account-writing-simple","account-writing-custom"].includes(song.id)||!!song.audioFormat).map(song => <option key={song.id} value={song.id}>{song.name}</option>)}</select></label>
    <nav className="guide-steps" aria-label="Creation steps">
      <button aria-current={step === 1 ? "step" : undefined} onClick={() => { setStep(1); reveal(levelsHeading.current); }}><span>01</span> Experience</button>
      <button aria-current={step === 2 ? "step" : undefined} disabled={!level} onClick={() => { setStep(2); reveal(createHeading.current); }}><span>02</span> Create</button>
      <button aria-current={step === 3 ? "step" : undefined} onClick={goToResult}><span>03</span> Listen & save</button>
    </nav>

    <section className="panel form-panel guide-section" aria-labelledby="experience-heading">
      <div className="guide-heading"><span className="eyebrow">01 / EXPERIENCE</span>
        <h2 id="experience-heading" ref={levelsHeading} tabIndex={-1}>How much experience do you have making music?</h2>
        <p className="muted">Pick how much guidance you want. You can switch levels any time.</p>
      </div>
      <div className="guide-levels">{experienceLevels.map(item => {
        const Icon = levelIcons[item.id];
        return <button type="button" className="guide-choice" key={item.id} aria-pressed={level === item.id} disabled={busy} onClick={() => chooseLevel(item.id)}>
          <Icon size={21}/><strong>{item.name}</strong><span>{item.description}</span><ArrowDown size={15} className="guide-choice-arrow"/>
        </button>;
      })}</div>
    </section>

    {level && <section className="panel form-panel guide-section" aria-labelledby="create-heading">
      <div className="guide-heading"><span className="eyebrow">02 / CREATE · {levelName}</span>
        <h2 id="create-heading" ref={createHeading} tabIndex={-1}>{pro && mode === "voice" ? "Design a speaking voice" : "Make your track"}</h2>
        <p className="muted">{level === "beginner" ? "Start with a sentence. Pick vocals or instrumental, then listen to what you make." :
          pro ? "Shape the arrangement and make alternate takes. Local instrumentals can be exported as separate WAV stems." :
            "Give the Studio an idea, then refine the tempo, sound, and vocal direction."}</p>
      </div>
      {pro && voiceDesignAllowed && <div className="tabs creation-tabs" aria-label="Creation tools">
        <button type="button" aria-pressed={mode === "song"} className={mode === "song" ? "tab-active" : ""} disabled={busy} onClick={() => { setMode("song"); setError(""); }}><Music2 size={16}/> Song</button>
        <HelpControl subject="Voice design" tip="Describe a voice, listen to samples, and save a favorite as a reference for future vocal direction."><button type="button" aria-pressed={mode === "voice"} className={mode === "voice" ? "tab-active" : ""} disabled={busy} onClick={() => { setMode("voice"); setError(""); }}><Mic2 size={16}/> Voice design</button></HelpControl>
      </div>}
      {mode === "song" ? <div className="guide-composer">
        <form onSubmit={event => { event.preventDefault(); void create(); }}>
          <fieldset disabled={busy}>
            <legend>What would you like to make?</legend>
            <div className="chips lyric-modes">
              <button type="button" className={`chip ${type === "instrumental" ? "active" : ""}`} aria-pressed={type === "instrumental"} onClick={() => { setChoice("instrumental"); setError(""); }}>Instrumental</button>
              <button type="button" className={`chip ${type === "vocals" ? "active" : ""}`} aria-pressed={type === "vocals"} onClick={() => { setChoice("vocals"); setError(""); }}>Song with vocals</button>
            </div>
            {type === "instrumental" && <HelpField label="Instrumental engine" tip="Studio instruments create audio in your browser. The connected engine uses ElevenLabs and can use plan credits."><select value={engine}
              onChange={event => setInstrumentEngine(event.target.value === "connected" ? "connected" : "studio")}>
              <option value="studio">Studio instruments · built in</option><option value="connected">ElevenLabs · connected provider</option>
            </select></HelpField>}
            {!isLocal && !elevenLabs.connected && <div className="guide-tip"><strong>Connect a music provider for this option</strong>
              <p className="muted creation-note">You can create an instrumental right away or set up full song generation once in Settings.</p>
              <button type="button" className="secondary small" onClick={connectionSettings}><Settings2 size={15}/> Provider settings</button></div>}
            <HelpField label="Describe your idea" tip="Describe the feeling, genre, and sounds you want. Studio uses this to suggest a palette and tempo."><textarea required rows={4} maxLength={1000} value={idea}
              onChange={event => setIdea(event.target.value)} placeholder="A joyful dance song about finding our way home through love, with bright piano and a Lebanese Dabke finale…"/></HelpField>
            {hasExplicitWords(idea) && <CleanLyricsChecker lyrics={idea} change={setIdea} direction label="Clean song description" disabled={busy}/>}
            {!isLocal && <SongOpeningControl value={openingMode} change={setOpeningMode} disabled={busy}/>}
            <GenrePicker prompt={idea} changePrompt={text=>{setIdea(text);setError("");setAutoGenre(false);}} value={selectedGenres} change={next=>{setAutoGenre(false);setGenres(next);}} disabled={busy}/>
            <GenreAssistant fusion={fusion} auto={autoGenre} setAuto={setAutoGenre} history={useHistory} setHistory={setUseHistory} name={fusionName} setName={setFusionName} variation={()=>setFusionVariation(v=>v+1)} apply={next=>{setAutoGenre(false);setGenres(next);}} disabled={busy} readCues={readLyricStyles} setReadCues={setReadLyricStyles} showCues={type==="vocals"}/>
            {isLocal && !!selectedGenres.length && <p className="muted">Built-in sketches use the closest of Studio’s four instrument palettes. Connected generation receives your full genre blend.</p>}
            {!idea.trim() && <button type="button" className="text-button guide-example" onClick={() => setIdea(creationPresets.dabke.example)}>Try a SAMADHI LOVE example <ArrowRight size={14}/></button>}
            <label className="field">Track title <span className="muted">(optional)</span><input maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder="Give your idea a name"/></label>
            <TrackLengthControl automatic={autoLength} onAutomatic={value => {
              if (!value && manualTime === null) setManualTime(formatTrackTime(suggestedLength.seconds));
              setAutoLength(value);
            }} suggested={suggestedLength.seconds} reason={suggestedLength.reason} manual={displayedTime} onManual={setManualTime}/>
            {advanced && <div className="field-grid">
              <HelpField label="Sound palette" tip="Choose the group of instruments and rhythms to start from, or let Studio suggest one."><select value={presetOverride ?? ""} onChange={event => {
                setPreset((event.target.value || null) as Preset | null); setTempo("");
              }}><option value="">Recommend from my idea</option>{(Object.keys(creationPresets) as Preset[]).map(id => <option key={id} value={id}>{creationPresets[id].name}</option>)}</select></HelpField>
              <HelpField label="Tempo (BPM)" tip="Beats per minute set the speed of the track. A higher number usually feels faster."><input type="number" min={50} max={180} step={1} value={tempo} placeholder={String(suggestedTempo)} onChange={event => setTempo(event.target.value)}/></HelpField>
              {!isLocal && <HelpField label="Mood" tip="Describe the feeling you want, such as warm, peaceful, or euphoric."><input maxLength={80} value={mood} placeholder={preset.mood} onChange={event => setMood(event.target.value)}/></HelpField>}
            </div>}
            {type === "vocals" && <>
              <div className="chips lyric-modes">
                <HelpControl subject="Write lyrics for me" tip="Let the music service write words based on your song description."><button type="button" className={`chip ${lyricsMode === "auto" ? "active" : ""}`} aria-pressed={lyricsMode === "auto"} onClick={() => setLyricsMode("auto")}>Write lyrics for me</button></HelpControl>
                <HelpControl subject="Use my lyrics" tip="Open a text box for the exact words and section labels you want to provide."><button type="button" className={`chip ${lyricsMode === "own" ? "active" : ""}`} aria-pressed={lyricsMode === "own"} onClick={() => setLyricsMode("own")}>Use my lyrics</button></HelpControl>
                {advanced && <HelpControl subject="Write starter lyrics" tip="Fill the empty lyrics box with lyrics you can edit."><button type="button" className="text-button" disabled={!idea.trim() || !!lyrics.trim()} onClick={() => {
                  if (hasExplicitWords(idea)) { setError(cleanWordsMessage); return; }
                  setLyricsMode("own");
                  const draft = songwritingStarter(idea, (length ?? 0) >= 240 ? "4" : "3", /duet|call.and.response/i.test(idea + " " + voice));
                  setLyrics(draft.replace(/ · \d+:\d{2}–\d+:\d{2}/g, ""));
                }}>Write starter lyrics</button></HelpControl>}
              </div>
              {lyricsMode === "auto" && lyrics.trim() && !performanceWeight(lyrics) && <p className="muted">Your template supplies the song structure. Studio will write words to fit it.</p>}
              {lyricsMode === "own" && <><HelpField label="Your lyrics" tip="Paste the words you want performed. Label sections such as [Verse 1] and [Chorus] to guide the arrangement."><textarea dir="auto" style={{unicodeBidi:"plaintext"}} rows={7} maxLength={5000} value={lyrics} onChange={event => setLyrics(event.target.value)} placeholder="[Verse 1]"/></HelpField>
                <p className="muted creation-note">{lyrics.length.toLocaleString()} / 5,000 characters</p><CleanLyricsChecker lyrics={lyrics} change={setLyrics}/><LyricNotationPreview text={lyrics}/></>}
              <MusicLanguageControl value={languageChoice} change={setLanguageChoice} lyrics={currentLyrics} prompt={idea} disabled={busy}/>
              {advanced && <HelpField label={<>Vocal direction <span className="muted">(optional)</span></>} subject="Vocal direction" tip="Describe who sings, speaks, or whispers and where each voice enters. For a duet, say who leads each section."><input value={voice} maxLength={1000} onChange={event => setVoice(event.target.value)} placeholder="Deep male call and soaring female response"/></HelpField>}
              {advanced && !!voices.length && <div className="chips voice-chips">{voices.map(profile => <button type="button" key={profile.id} className="chip" onClick={() => setVoice(profile.description)}>{profile.name}</button>)}</div>}
            </>}
            {pro && <>
              <div className="field-grid">
                <HelpField label="Musical key" tip="Choose the note the track centers on. Use the same key as your reference or vocal take if you plan to combine them."><select value={tonic} onChange={event => setTonic(Number(event.target.value))}>{musicalKeys.map((name, index) => <option key={name} value={index}>{name}</option>)}</select></HelpField>
                <HelpField label="Scale" tip="Choose major or minor, or use the default scale for your sound palette."><select value={scale} onChange={event => setScale(event.target.value as typeof scale)}>
                  <option value="preset">Use palette scale</option><option value="major">Major</option><option value="minor">Minor</option>
                </select></HelpField>
                <HelpField label="Arrangement" tip="Choose how the energy develops, such as a rising build, a steady groove, or a cinematic late peak."><select value={shape} onChange={event => setShape(event.target.value as Instrumental["arrangement"])}>
                  {Object.entries(arrangements).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}
                </select></HelpField>
              </div>
              {!isLocal && <HelpField label="Extra production direction" tip="Add a specific instruction, such as bringing the full drums in for the last chorus."><textarea rows={2} maxLength={320} value={direction} onChange={event => setDirection(event.target.value)} placeholder="For example, hold back the full drums until the final chorus"/></HelpField>}
            </>}
            {hasExplicitWords(title) && <CleanLyricsChecker lyrics={title} change={value => setTitle(value.slice(0, 100))} direction label="Clean title" disabled={busy}/>}
            {hasExplicitWords(voice) && <CleanLyricsChecker lyrics={voice} change={setVoice} direction label="Clean vocal direction" disabled={busy}/>}
            {hasExplicitWords(mood) && <CleanLyricsChecker lyrics={mood} change={value => setMood(value.slice(0, 80))} direction label="Clean mood" disabled={busy}/>}
            {hasExplicitWords(direction) && <CleanLyricsChecker lyrics={direction} change={setDirection} direction label="Clean production direction" disabled={busy}/>}
            {isLocal && pro && <div className="guide-tip">
              <h3>Motif Forge</h3>
              <p className="muted">Reshape the main melody while keeping the groove and harmony. Render the new take and export its notes as MIDI.</p>
              <HelpField label="Melody transformation" tip="Mirror the scale steps, play the phrase backward, or start it from a different note.">
                <select value={motif} onChange={event => setMotif(event.target.value as MotifMode)}>
                  {Object.entries(motifModes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </HelpField>
            </div>}
            {type === "vocals" && sectionDirections && <div className="version-preview">
              <h3>International Tent section directions</h3>
              <ul>{sectionDirections.map(section => <li key={section.name}>{section.name} · {section.genre}. {section.voice}</li>)}</ul>
              {lyricsMode === "own" && <p className="muted">Use these section headings on separate lines so your genres and vocal directions match the lyrics.</p>}
            </div>}
            {formError && <p className="notice" role="alert">{formError}</p>}
            {!isLocal && elevenLabs.connected && <p className="muted creation-note">ElevenLabs may use plan credits. Your finished track saves automatically to Your songs.</p>}
            <div className="actions guide-generate">
              <HelpControl subject="Generate track" tip="Make audio from your current settings. ElevenLabs generation may use plan credits."><button type="submit" className="primary" disabled={!canCreate}><Sparkles size={16}/>{generating ? "Creating your track…" : isLocal ? "Create instrumental" : "Generate track"}</button></HelpControl>
              {pro && <HelpControl subject="Make an alternate take" tip="Generate another interpretation of the current idea so you can compare takes."><button type="button" className="secondary" disabled={!canCreate} onClick={() => create(true)}>Make an alternate take</button></HelpControl>}
            </div>
            <p className="muted creation-note">{isLocal ? "Studio instruments turn your selected palette and arrangement into audio in this browser." :
              "Generation sends your prompt and any lyrics to the connected music provider and can use plan credits."}</p>
            {generating && <p role="status" className="muted creation-note">Keep this tab open while the track renders.</p>}
          </fieldset>
        </form>
        <aside className="guide-recommendation" aria-label="Studio recommendations">
          <span className="eyebrow"><Sparkles size={14}/> STUDIO RECOMMENDS</span>
          <h3>{preset.name}</h3><p className="guide-recommendation-meta">{validTempo ? bpm : suggestedTempo} BPM · {mood.trim() && !isLocal ? mood : preset.mood}</p>
          <p>{preset.tips}</p>
          {advanced && presetOverride && presetOverride !== recommended && <button type="button" className="text-button" disabled={busy} onClick={() => {
            setPreset(null); setTempo("");
          }}>Use suggested {creationPresets[recommended].name}</button>}
          <div className="guide-tutor">
            <strong>{level === "beginner" ? "Your first track" : pro ? "Compare your takes" : "Make your idea clearer"}</strong>
            <p>{level === "beginner" ? "A feeling, a musical style, and one instrument are enough to start. Length follows your prompt, lyrics and musical structure." :
              pro ? "Change one variable at a time. Listen to the hook and the transition into it before changing the arrangement again." :
                type === "vocals" ? "Give your hook a short phrase. If you want a duet, say who leads and where they sing together." :
                  "Adjust the tempo for the energy you want. For a slower opening with a bigger finish, use the Pro arrangement controls."}</p>
          </div>
        </aside>
      </div> : <>
        <form className="guide-voice" onSubmit={audition}>
          <fieldset disabled={busy}>
            <p className="muted creation-note">Create a voice for narration or spoken intros. You can reuse its description as vocal direction for a song.</p>
            {!elevenLabs.connected && <button type="button" className="secondary small" onClick={connectionSettings}>Provider settings</button>}
            <HelpField label="Describe the voice" tip="Describe a speaking voice for intros or narration, including tone, pace, and delivery."><textarea rows={4} value={description} minLength={20} maxLength={1000} required
              onChange={event => { setDescription(event.target.value); setPreviews([]); setPreviewId(""); }} placeholder="A deep cinematic speaking voice, warm and grounded, with slow deliberate phrasing…"/></HelpField>
            <HelpControl subject="Preview voices" tip="Generate voice samples from your description through the connected provider."><button className="primary" disabled={!elevenLabs.connected || description.trim().length < 20}><Mic2 size={16}/>{auditioning ? "Designing voices…" : "Preview voices"}</button></HelpControl>
          </fieldset>
        </form>
        {formError && <p className="notice" role="alert">{formError}</p>}
        {!!previews.length && <form className="voice-previews" onSubmit={async event => {
          event.preventDefault();
          if (await send({ action: "save-voice", description, title: voiceName, previewId }, "Voice profile saved")) {
            setPreviews([]); setPreviewId(""); setVoiceName("");
          }
        }}>
          <fieldset disabled={busy}>
            {previews.map((preview, index) => <div className="voice-preview" key={preview.id}>
              <label><input type="radio" name="voice-preview" checked={previewId === preview.id} onChange={() => setPreviewId(preview.id)}/> Voice {index + 1}</label>
              <audio controls preload="none" src={`data:audio/mpeg;base64,${preview.audio}`}/>
            </div>)}
            <label className="field">Voice name<input value={voiceName} required maxLength={80} onChange={event => setVoiceName(event.target.value)} placeholder="Samadhi Cinematic Intro"/></label>
            <HelpControl subject="Save chosen voice" tip="Save the selected preview and its description to your voice collection."><button className="primary" disabled={!voiceName.trim() || !previewId}>{saving ? "Saving voice…" : "Save chosen voice"}</button></HelpControl>
          </fieldset>
        </form>}
        {!!voices.length && <div className="guide-voice"><h3>Saved voice profiles</h3>{voices.map(profile =>
          <div key={profile.id} className="draft-card"><strong>{profile.name}</strong><p className="muted">{profile.description}</p>
            <HelpControl subject="Use as vocal direction" tip="Copy this voice’s description into the song form as performance guidance."><button type="button" className="text-button" disabled={busy} onClick={() => { setVoice(profile.description); setChoice("vocals"); setMode("song"); }}>Use as vocal direction <ArrowRight size={15}/></button></HelpControl></div>
        )}</div>}
      </>}
    </section>}

    <section className="panel form-panel guide-section" aria-labelledby="creation-results" onPlayCapture={event => {
      const activeAudio = event.target;
      if (activeAudio instanceof HTMLAudioElement) event.currentTarget.querySelectorAll("audio").forEach(audio => {
        if (audio !== activeAudio) audio.pause();
      });
    }}>
      <div className="guide-heading"><span className="eyebrow">03 / LISTEN & SAVE</span>
        <h2 id="creation-results" ref={resultHeading} tabIndex={-1}><Headphones size={23}/> Your saved creations</h2>
        <p className="muted">Every saved creation is already in Your songs. Open Song actions to edit, remix, organize, share, or archive it.</p>
      </div>
      {step === 3 && formError && <p className="notice" role="alert">{formError}</p>}
      {localPreviews.map(localPreview => <article className="guide-draft guide-preview" key={localPreview.url}>
        <span className="eyebrow">NEW INSTRUMENTAL PREVIEW</span><h3>{localPreview.title}</h3><p className="muted">{instrumentalLabel(localPreview.settings)}</p>
        <AudioPlayer key={localPreview.url} src={localPreview.url} label={`Listen to ${localPreview.title}`}/>
        <div className="actions"><button type="button" className="primary small" disabled={busy} onClick={async () => {
          const { blob, title, prompt, settings } = localPreview;
          setError("");
          if (await saveInstrumental(new File([blob], "studio-instrumental.wav", { type: "audio/wav" }), title, prompt, settings, projectId || undefined,localPreview.saveId)) discardPreview(localPreview.url);
        }}>Retry save to Your songs <ArrowRight size={15}/></button>
          <a className="secondary small" download={localPreview.title + ".wav"} href={localPreview.url}><Download size={15}/> Download WAV</a>
        </div>
        <InstrumentalExports settings={localPreview.settings} title={localPreview.title} disabled={busy}/>
      </article>)}
      {!drafts.some(song=>song.audioFormat) && !localPreviews.length && <div className="empty"><Library size={20}/> Your saved songs and instrumentals will appear here and in Your songs.</div>}
      <div className="guide-draft-grid">
        {drafts.filter(song=>!!song.audioFormat).map(song => <SongCard key={song.id} song={song} onReuse={reuse}/>)}
      </div>
      <button type="button" className="text-button guide-back-top" onClick={() => { setStep(1); reveal(levelsHeading.current); }}><ArrowUp size={15}/> Back to experience level</button>
    </section>
  </div>;
}
