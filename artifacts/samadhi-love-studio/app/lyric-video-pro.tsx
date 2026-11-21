"use client";
import { isInstrumental } from "./creation-guide";
import { QuickVideoPanel, type CaptionState } from "./quick-video-panel";
import {cosmicScrollBehavior} from "./cosmic-motion";
import {brand} from "./brand";
import {PanelErrorBoundary} from "./panel-error-boundary";
import "./cosmic-views.css";
import { MusicLanguageSummary } from "./music-language-summary";
import {StemReactiveControls} from "./stem-reactive-controls";
import {releaseKit} from "./lyric-release-kit";
import {registerVideoExport} from "./video-export-history";
import {activeAdMedia} from "./active-visual-source";
import {CreatorLookBrowser,SocialVideoTools} from "./creator-video-tools";
import {applyPlayVisual} from "./creative-video-handoff";
import {applySocialVideoPreset,applyVideoShape,creatorVideoLooks,shortClipRange,suggestedHookStart} from "./creator-video-presets";
import {VibeLookPicker} from "./vibe-look-picker";
import {videoFormatLabels} from "./video-format-options";
import {applyVideoPurpose,videoPurposeById,type VideoPurposeId} from "./video-purpose";
import {postCaption as readyPostCaption,postTextFor} from "./post-text";
import {videoPlatforms} from "./video-publishing";
import {savedLyricsForAudio} from "./caption-ready-lyrics";
import {artistDashboardHref} from "./community/data";
import {productionFetch} from "./credits/client";
import {mergeWindowCaptions} from "./caption-edit-continuity";
import type {CaptionRecovery} from "./server/caption-recovery";
import {wavAudio} from "./recording-dsp";
const formatCaptionTime=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}`;
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Film,
  Music2,
  RefreshCw,
  Save,
  Sparkles,
  Undo2,
  Redo2,
  Upload,
} from "lucide-react";
import type { Song, Studio } from "./studio-data";
import { freshSong, isAudioFormat, songAudioUrl } from "./studio-data";
import type { ElevenLabsKey } from "./elevenlabs-key";
import { LyricVideoStudio } from "./lyric-video-studio";
import {
  captionColors,
  captionFile,
  captionFonts,
  estimatedCues,
  isLyricProject,
  lyricLines,
  videoThemes,
  type LyricProject,
  type LyricCue,
  type VideoFormat,
  type VideoTheme,
} from "./lyric-video-data";
import {
  assetUrl,
  sourceUrl,
  newProSettings,
  recommendLook,
  reviewTiming,
  sourceChanged,
  proLanguages,
  clipCues,
  lrcFile,
  sectionsFromLyrics,
  type ProSettings,
  type ProVersion,
  type LyricDifference,
} from "./lyric-pro-data";
import {
  decodeProjectAudio,
  analyzeAudio,
  improveClarity,
  uploadLyricAsset,
  downloadBlob,
} from "./lyric-pro-media";
import {
  LyricBackgroundPicker,
  applyLyricBackground,
  applyCustomLyricBackground,
  type BackgroundScope,
} from "./lyric-background-picker";
import {
  CaptionTemplatePicker,
  CaptionTemplateDemo,
} from "./lyric-caption-picker";
import {
  getCaptionTemplate,
  loadCaptionFonts,
  type CaptionTemplateId,
} from "./lyric-caption-templates";
import { CaptionReadyCreate } from "./lyric-pro-create";
import { ProTimeline } from "./lyric-pro-timeline";
import {
  makeVisualTemplate,
  parseVisualTemplate,
  applyVisualTemplate,
  decodeTemplateBackground,
  maxDesignBytes,
  maxVisualTemplateBytes,
  visualSettings,
  type LyricVisualTemplate,
} from "./lyric-visual-template";
import { drawProFrame } from "./lyric-pro-render";
import { exportProVideo, proVideoSize,inspectVideo } from "./lyric-pro-export";
import {codecCompatibility} from "./video-export-storage";
import {readRender,renderKey,saveRender,segmentStore,videoJob,type VideoCheckpoint} from "./video-render-recovery";
import {
  VideoPublishing,
  VideoLinkActions,
  type VideoExport,
  type VideoPlatform,
} from "./video-publishing";
import { hasExplicitWords, isExplicitSong } from "./clean-content";
import { BeatGridControls } from "./beat-grid-controls";
import { analyzeBeatBuffer } from "./beat-analysis-client";
import { SignaturePicker, VisualLayerControls } from "./lyric-signature-picker";
import {AdvertisingVideoControls} from "./advertising-video-controls";
import {VisualGenerationControls} from "./visual-generation-controls";
import {applyVisualJob,type VisualJob} from "./visual-generation-data";
import {openFootage,footageTime,type FootageDecoder} from "./advertising-footage";
import type {OverlayStyle} from "./lyric-overlay-designs";
import { signatureLayouts } from "./lyric-signature";
import { renderReadiness, soundtrackIdentity } from "./lyric-readiness";

type SaveResponse = {
  project: LyricProject;
  data: Studio;
  revision: number;
  warning?: string;
  error?: string;
  versions?: ProVersion[];
  next?: string | null;
  workspace?: string;
};
type SyncResponse = {
  cues?: LyricCue[];
  error?: string;
  language?: string;
  languageProbability?: number;
  engine?: string;
  warnings?: string[];
  differences?: LyricDifference[];
  transcript?: string;
};

type Props = {
  coverVideoRequest?:{id:string;songId:string;asset:string;overlay:OverlayStyle}|null;
  createSong?:()=>void;
  advanced?:boolean;
  socialVideoRequest?: {songId:string;id:string;look?:string;purpose?:VideoPurposeId;photoAsset?:string;footage?:{asset:string;duration:number};audioId?:string;start?:number;seconds?:number}|null;
  autoCaptionRequest?: { songId: string; id: string } | null;
  songs: Song[];
  initialSongId: string;
  saving: boolean;
  save: (song: Song, message?: string) => Promise<boolean>;
  elevenLabs: ElevenLabsKey;
  connectionSettings: () => void;
  upload: () => void;
  generate: (
    payload: Record<string, string | number | boolean>,
  ) => Promise<Song | undefined>;
  importFile: (file: File, title: string) => Promise<Song | undefined>;
  persisted: (data: Studio, revision: number) => void;
  persistBusy: (busy: boolean) => void;
  dirty: (dirty: boolean) => void;
};
/** Three visible steps. Internal step numbers stay 0–4 so every existing jump still works:
 * Words covers caption creation (1) and the caption editor (2); Look is 3; Make & download is 4. */
const steps = [
  { label: "Words", covers: [1, 2], go: 1 },
  { label: "Look", covers: [3], go: 3 },
  { label: "Make & download", covers: [4], go: 4 },
];
const formatLabels=videoFormatLabels;
const shortTime = (t: number) =>
  `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const signature = (p: LyricProject) =>
  JSON.stringify({
    ...p,
    pro: p.pro ? { ...p.pro, updatedAt: undefined } : undefined,
  });
const looks = [
  { name: "Cosmic & celestial", theme: "cosmic", template: "silver-cinema" },
  {
    name: "Spiritual uplift",
    theme: "meditation",
    template: "illuminated-verse",
  },
  { name: "Futuristic light", theme: "futuristic", template: "neon-pulse" },
  { name: "Arabian elegance", theme: "dawn", template: "sacred-script" },
  { name: "Nature cinema", theme: "nature", template: "silver-cinema" },
  { name: "Minimal typography", theme: "ocean", template: "quiet-space" },
  { name: "Melodic house", theme: "nebula", template: "prism-flow" },
  { name: "Intimate R&B / acoustic", theme: "dawn", template: "ink-echo" },
] as const;
export function LyricVideoPro(props: Props) {
  return <PanelErrorBoundary panel="video-editor"><LyricVideoProContent {...props}/></PanelErrorBoundary>;
}
function LyricVideoProContent(props: Props) {
  const {
    songs,
    initialSongId,
    saving,
    save,
    elevenLabs,
    connectionSettings,
    upload,
  } = props;
  const tracks = songs.filter(
    (s) => s.audioFormat && !s.deletedAt && !isExplicitSong(s),
  );
  const [mode, setMode] = useState<"start" | "existing" | "create" | "classic">(
      initialSongId ? "existing" : "start",
    ),
    [songId, setSongId] = useState(initialSongId),
    [step, setStep] = useState(0);
  const song = tracks.find((s) => s.id === songId);
  const [libraryTab, setLibraryTab] = useState<"backgrounds" | "lyrics">(
    "backgrounds",
  );
  const [starterLook, setStarterLook] = useState<LyricProject>({
    cues: [],
    theme: "cosmic",
    motion: "drift",
    format: "wide",
    captionTemplate: "neon-pulse",
    font: "clean",
    color: "turquoise",
    intensity: "gentle",
  });
  const pendingLook = useRef<Partial<LyricProject> | null>(null);
  const pendingVisualLayout = useRef<Pick<
    LyricVisualTemplate,
    "layout" | "captionMode" | "duetColors"
  > & { formatLooks?: ProSettings["formatLooks"] } | null>(null);
  const pendingDesign = useRef<{ file: File; scope: BackgroundScope } | null>(
    null,
  );
  const [starterBackground, setStarterBackground] = useState("");
  const [project, setProject] = useState<LyricProject | null>(null),
    [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [operation, setOperation] = useState(""),
    [savedState, setSavedState] = useState(""),
    [retrySave, setRetrySave] = useState(false);
  const [captionEditRequest,setCaptionEditRequest]=useState<{id:number;index?:number}>();
  const [lyricsEditorOpen,setLyricsEditorOpen]=useState(false);
  const [captionRecovery,setCaptionRecovery]=useState<CaptionRecovery|null>(null);
  const captionEditSequence=useRef(0);
  // Fine-tune drawer: every advanced tool, closed until the owner asks for it.
  const [fineTune, setFineTune] = useState(false);
  const autoAfterRecovery = useRef("");
  function openFineTune(target: number) {
    setStep(target); setFineTune(true);
    requestAnimationFrame(() => document.getElementById("lvp-finetune")?.scrollIntoView({ block: "start", behavior: cosmicScrollBehavior() }));
  }
  function openCaptionEditor(index?:number){setStep(2);setFineTune(true);setCaptionEditRequest({id:++captionEditSequence.current,index});}
  const [mobilePreview,setMobilePreview]=useState(true);
  useEffect(()=>{if(window.matchMedia("(max-width:640px)").matches)setResolution(720);},[]);
  const [resolution, setResolution] = useState<1080 | 720>(1080),
    [fallback, setFallback] = useState(false),
    [cleanExport, setCleanExport] = useState(false),
    [batch, setBatch] = useState(false),
    [progress, setProgress] = useState<number | null>(null),
    [outputs, setOutputs] = useState<
      (VideoExport & { format: VideoFormat; codec: string })[]
    >([]),
    [platform, setPlatform] = useState<VideoPlatform>("youtube"),
    [postCaption, setPostCaption] = useState(""),
    [videoTitle, setVideoTitle] = useState("");
  const [recovery, setRecovery] = useState<LyricProject | null>(null);
  const workspace = useRef("");
  const [recoveryReady, setRecoveryReady] = useState("");
  const [resumeVideo,setResumeVideo]=useState(false);
  useEffect(()=>{
    if(!recoveryReady||!workspace.current)return;
    let live=true;
    void readRender(renderKey(workspace.current,recoveryReady)).then(item=>{
      if(!live)return;
      setResumeVideo(!!item&&!item.finished);
      if(item&&!item.finished&&item.options){setResolution(item.options.resolution);setFallback(item.options.fallback);setCleanExport(item.options.cleanExport);setBatch(item.options.batch);}
    }).catch(()=>{if(live)setResumeVideo(false);});
    return()=>{live=false;};
  },[recoveryReady]);
  const versionsRequest = useRef(0);
  const [versionsNext, setVersionsNext] = useState<string | null>(null);
  const [versionsLimit, setVersionsLimit] = useState(100);
  const [versionsBusy, setVersionsBusy] = useState(false);
  const [versionsError, setVersionsError] = useState("");
  const [versions, setVersions] = useState<ProVersion[]>([]),
    [versionName, setVersionName] = useState(""),
    [past, setPast] = useState<LyricProject[]>([]),
    [future, setFuture] = useState<LyricProject[]>([]),
    [allowOld, setAllowOld] = useState(false),
    [rights, setRights] = useState(false),
    [noise, setNoise] = useState(false),
    [audit, setAudit] = useState(true),
    [imagesReady, setImagesReady] = useState(false),
    [imageRevision, setImageRevision] = useState(0);
  const footageDecoder=useRef<FootageDecoder|null>(null);
  const [footageReady,setFootageReady]=useState(true);
  const audio = useRef<HTMLAudioElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    current = useRef(project),
    savedSignature = useRef(""),
    expected = useRef<string | null>(null),
    savingTask = useRef<Promise<boolean> | null>(null),
    controller = useRef<AbortController | null>(null),
    autoFor = useRef(""),
    buffers = useRef(new Map<string, AudioBuffer>()),
    images = useRef(new Map<string, HTMLImageElement>()),
    urls = useRef<string[]>([]),
    propsRef = useRef(props),
    mounted = useRef(true),
    generationToken = useRef(0);
  current.current = project;
  propsRef.current = props;
  const p = project?.pro;
  const libraryProject = project ?? starterLook;
  const librarySection = libraryProject.pro?.sections.findLast(
    (s) => s.time <= time && time < s.end,
  );
  const libraryImage =
    librarySection?.background ??
    (librarySection?.theme ? undefined : libraryProject.pro?.background);
  const libraryPreview = {
    ...libraryProject,
    theme: librarySection?.theme ?? libraryProject.theme,
    pro: undefined,
  };
  const busy = !!operation || progress !== null || saving;
  function edit(next: LyricProject) {
    const previous = current.current;
    if (previous?.pro?.alignment?.reviewed && next.pro?.alignment?.reviewed &&
      (JSON.stringify(previous.cues) !== JSON.stringify(next.cues) || previous.pro.approvedLyrics !== next.pro.approvedLyrics)) {
      next = { ...next, pro: { ...next.pro, alignment: { ...next.pro.alignment, reviewed: false } } };
    }
    if (previous) {
      setPast((history) => [...history.slice(-29), previous]);
      setFuture([]);
    }
    current.current = next;
    setProject(next);
    const selectedLook=creatorVideoLooks.find(look=>look.theme===next.theme&&look.caption===next.captionTemplate);
    if(selectedLook)try{localStorage.setItem("samadhi:last-video-look:v1",selectedLook.id);}catch{}
    setRetrySave(false);
  }
  function changeLibraryBackground(next: LyricProject, completePreset = false) {
    pendingDesign.current = null;
    if (starterBackground) URL.revokeObjectURL(starterBackground);
    setStarterBackground("");
    if (current.current) {
      edit(next);
      return;
    }
    const chosen: Partial<LyricProject> = { theme: next.theme };
    if (completePreset)
      Object.assign(chosen, {
        format: next.format,
        motion: next.motion,
        font: next.font,
        color: next.color,
        effect: next.effect,
        captionTemplate: next.captionTemplate,
        intensity: next.intensity,
        bpm: next.bpm,
        visualLayers: next.visualLayers,
      });
    pendingLook.current = { ...pendingLook.current, ...chosen };
    setStarterLook(next);
  }
  function chooseLibraryStyle(id?: CaptionTemplateId) {
    const preset = getCaptionTemplate(id),
      selected = {
        captionTemplate: id,
        ...(preset ? { font: preset.font, color: preset.color } : {}),
      };
    if (current.current?.pro) {
      edit({
        ...current.current,
        ...selected,
        pro: { ...current.current.pro, captionMode: "karaoke" },
      });
      return;
    }
    pendingLook.current = { ...pendingLook.current, ...selected };
    setStarterLook((before) => ({ ...before, ...selected }));
  }
  function openVisualChoices() {
    if (song && project) {
      // Backgrounds and looks live in the Vibe box beside the preview.
      setMode("existing");
      requestAnimationFrame(() =>
        document
          .getElementById("qv-vibe")
          ?.scrollIntoView({ block: "center", behavior: cosmicScrollBehavior() }),
      );
    } else {
      setMode("start");
      requestAnimationFrame(() =>
        document
          .getElementById("lyric-visual-library")
          ?.scrollIntoView({ block: "start", behavior: cosmicScrollBehavior() }),
      );
    }
  }
  function patchPro(patch: Partial<ProSettings>) {
    const old = current.current;
    if (old?.pro) edit({ ...old, pro: { ...old.pro, ...patch } });
  }
  function seek(t: number) {
    if (audio.current) {
      audio.current.currentTime = Math.max(0, t);
    }
    setTime(Math.max(0,t));
  }
  function message(e: unknown, fallback: string) {
    if (!(e instanceof DOMException && e.name === "AbortError"))
      setError(e instanceof Error ? e.message : fallback);
    else setStatus("Canceled. Your project edits are preserved.");
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- on close, release every preview file that exists at that moment, on purpose
      urls.current.forEach(URL.revokeObjectURL);
    };
  }, []);
  useEffect(() => {
    if (!song) {
      current.current = null;
      setProject(null);
      return;
    }
    generationToken.current++;
    setPostCaption("");
    setVideoTitle("");
    controller.current?.abort();
    controller.current = null;
    const prior = song.lyricVideo;
    const settings = prior?.pro ?? newProSettings(song, 0);
    if (!prior?.pro && !settings.approvedLyrics.trim() && prior?.cues.length)
      settings.approvedLyrics = prior.cues.map((c) => c.text).join("\n");
    let next: LyricProject = {
      ...(prior ?? {
        cues: [],
        format: "vertical",
        motion: "drift",
        ...recommendLook(song),
      }),
      intensity:
        prior?.intensity ??
        (window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "still"
          : "gentle"),
      pro: structuredClone(settings),
    };
    const selectedLook = pendingLook.current;
    const selectedLayout = pendingVisualLayout.current;
    if (selectedLook) {
      next = { ...next, ...selectedLook };
      if (selectedLook.theme)
        next = applyLyricBackground(next, selectedLook.theme, "all", 0);
      if (Object.hasOwn(selectedLook, "captionTemplate") && next.pro)
        next = { ...next, pro: { ...next.pro, captionMode: "karaoke" } };
      pendingLook.current = null;
    }
    if (selectedLayout && next.pro) {
      next = {
        ...next,
        pro: {
          ...next.pro,
          ...(selectedLayout.captionMode
            ? { captionMode: selectedLayout.captionMode }
            : {}),
          ...(selectedLayout.duetColors
            ? { duetColors: selectedLayout.duetColors }
            : {}),
          ...(selectedLayout.formatLooks ? { formatLooks: selectedLayout.formatLooks } : {}),
          ...(selectedLayout.layout
            ? {
                formatLooks: {
                  ...next.pro.formatLooks,
                  [next.format]: selectedLayout.layout,
                },
              }
            : {}),
        },
      };
      pendingVisualLayout.current = null;
    }
    current.current = next;
    setProject(next);
    expected.current = prior?.pro?.updatedAt ?? null;
    savedSignature.current = prior?.pro
      ? signature(selectedLook || selectedLayout ? prior : next)
      : "";
    setPast([]);
    setFuture([]);
    setRecovery(null);
    setRecoveryReady("");
    setAllowOld(false);
    setTime(0);
    setPlaying(false);
    setError("");
    setRetrySave(false);
    setStep(
      selectedLook || selectedLayout || pendingDesign.current
        ? 3
        : prior?.cues.length
          ? 2
          : 1,
    );
    setFineTune(false);
    // Words start on their own for songs with vocals (after saved-caption recovery is checked).
    autoAfterRecovery.current = !prior?.cues.length && song.creationKind !== "instrumental" && !isInstrumental(song.instrumental) && props.autoCaptionRequest?.songId !== song.id ? song.id : "";
    setSavedState(
      prior?.pro ? "Saved project loaded" : "Lyrics retrieved from the song",
    );
    void loadVersions(song.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [song?.id, mode === "classic"]);
  async function loadVersions(id: string, cursor?: string) {
    const openedSignature=current.current?signature(current.current):"";
    const historyRequest = ++versionsRequest.current;
    setVersionsBusy(true); setVersionsError("");
    try {
      const r = await fetch(
        `/api/studio/lyric-project?song=${encodeURIComponent(id)}${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`,
      );
      const result = (await r.json()) as SaveResponse;
      if (
        r.ok && historyRequest === versionsRequest.current &&
        mounted.current &&
        current.current?.pro?.sourceSongId === id
      ) {
        setVersions(items => cursor ? [...new Map([...items, ...(result.versions ?? [])].map(v => [v.id, v])).values()].sort((a,b) => b.at.localeCompare(a.at)) : result.versions ?? []);
        setVersionsNext(result.next ?? null); setVersionsLimit(n => cursor ? n + 100 : 100);
        workspace.current = result.workspace ?? "";
        if (workspace.current && !cursor) {
          try {
            const raw = localStorage.getItem(
              `samadhi-lyric-recovery:${workspace.current}:${id}`,
            );
            if (raw) {
              const local = JSON.parse(raw);
              if(isLyricProject(local)&&signature(local)!==signature(current.current!))
                localStorage.setItem(`samadhi-lyric-recovery:${workspace.current}:${id}:preserved:${crypto.randomUUID()}`,raw);
              if (
                isLyricProject(local) &&
                local.pro?.sourceSongId === id &&
                signature(local) !== signature(current.current!) &&
                signature(current.current!)===openedSignature &&
                local.pro?.sourceAudioId===current.current?.pro?.sourceAudioId &&
                local.pro?.updatedAt===current.current?.pro?.updatedAt
              )
                edit({...local,pro:{...local.pro!,updatedAt:expected.current??undefined}});
            }
          } catch {
            /* Local recovery is optional. */
          }
        }
        setRecoveryReady(id);
      } else if (historyRequest === versionsRequest.current && mounted.current && current.current?.pro?.sourceSongId === id) { setVersionsError(result.error ?? "Saved history could not load. Retry; existing snapshots are preserved."); setRecoveryReady(id); }
    } catch {
      if (historyRequest === versionsRequest.current && mounted.current && current.current?.pro?.sourceSongId === id) { setVersionsError("Saved history could not load. Retry; existing snapshots are preserved."); setRecoveryReady(id); }
    } finally { if (historyRequest === versionsRequest.current && mounted.current && current.current?.pro?.sourceSongId === id) setVersionsBusy(false); }
  }
  async function persist(snapshot = false, label?: string): Promise<boolean> {
    if (savingTask.current) {
      await savingTask.current;
      if (
        !snapshot &&
        current.current &&
        signature(current.current) === savedSignature.current
      )
        return true;
    }
    const next = current.current;
    if (!next?.pro || !isLyricProject(next) || !next.pro.duration) {
      setError("Check the caption timing and source recording before saving.");
      return false;
    }
    if (!snapshot && signature(next) === savedSignature.current) return true;
    const submitted = signature(next),
      songAtStart = next.pro.sourceSongId,
      token = generationToken.current;
    propsRef.current.persistBusy(true);
    setSavedState("Saving…");
    const task = (async () => {
      try {
        const r = await fetch("/api/studio/lyric-project", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            songId: songAtStart,
            project: next,
            expected: expected.current,
            snapshot,
            label,
          }),
        });
        const result = (await r.json()) as SaveResponse;
        if (
          !r.ok ||
          !result.project?.pro?.updatedAt ||
          !result.data ||
          !Number.isSafeInteger(result.revision)
        )
          throw new Error(
            result.error ?? "Your edits could not save. Try again.",
          );
        propsRef.current.persisted(result.data, result.revision);
        if (token === generationToken.current) {
          expected.current = result.project.pro!.updatedAt!;
          savedSignature.current = submitted;
          setProject((local) => {
            if (!local?.pro || local.pro.sourceSongId !== songAtStart)
              return local;
            const merged = {
              ...local,
              pro: { ...local.pro, updatedAt: result.project.pro!.updatedAt },
            };
            current.current = merged;
            return merged;
          });
          setSavedState(result.warning ?? "Saved privately");
          setRetrySave(!!result.warning);
          if (snapshot) void loadVersions(songAtStart);
        }
        return true;
      } catch (e) {
        if (mounted.current) {
          message(e, "Autosave failed. Your edits remain in this tab.");
          setSavedState("Not saved · retry available");
          setRetrySave(true);
        }
        return false;
      } finally {
        savingTask.current = null;
        propsRef.current.persistBusy(false);
      }
    })();
    savingTask.current = task;
    return task;
  }
  useEffect(() => {
    if (
      !project?.pro ||
      recoveryReady !== project.pro.sourceSongId ||
      recovery ||
      !project.pro.duration ||
      operation ||
      saving ||
      retrySave ||
      !isLyricProject(project) ||
      signature(project) === savedSignature.current
    )
      return;
    const timer = setTimeout(() => void persist(), 1600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [project, operation, saving, retrySave, recoveryReady, recovery]);
  useEffect(() => {
    if (
      !project?.pro ||
      !workspace.current ||
      recoveryReady !== project.pro.sourceSongId ||
      recovery
    )
      return;
    const key = `samadhi-lyric-recovery:${workspace.current}:${project.pro.sourceSongId}`;
    try {
      localStorage.setItem(key, JSON.stringify(project));
    } catch {
      /* Cloud autosave remains the durable copy. */
    }
  }, [project, recoveryReady, recovery]);
  useEffect(() => {
    propsRef.current.dirty(
      !!operation ||
        progress !== null ||
        (!!project && signature(project) !== savedSignature.current),
    );
  }, [project, operation, progress, saving]);
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (
        (current.current &&
          signature(current.current) !== savedSignature.current) ||
        controller.current
      ) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, []);
  const activeMedia=activeAdMedia(p);
  const templateMedia=!activeMedia.footage&&!activeMedia.photos.length;
  const activeFootageAsset=activeMedia.footage?.asset;
  const imageKeys = JSON.stringify([
    ...new Set([
      ...(activeMedia.photos.map(photo=>assetUrl(p!.sourceSongId,photo.asset))),
      ...(templateMedia&&p?.background ? [assetUrl(p.sourceSongId, p.background)] : []),
      ...(p?.logo ? [assetUrl(p.sourceSongId, p.logo)] : []),
      ...((templateMedia?p?.sections:[])?.flatMap((s) =>
        s.background ? [assetUrl(p!.sourceSongId, s.background)] : [],
      ) ?? []),
      ...(templateMedia&&!p?.background ? [videoThemes[project?.theme ?? "cosmic"].image].filter(Boolean) : []),
      ...((templateMedia?p?.sections:[])?.flatMap(s => !s.background && s.theme ? [videoThemes[s.theme].image].filter(Boolean) : []) ?? []),
    ]),
  ]);
  useEffect(() => {
    let live = true;
    setImagesReady(false);
    const keys: string[] = JSON.parse(imageKeys);
    const required=new Set(keys);
    for(const key of images.current.keys())if(!required.has(key))images.current.delete(key);
    Promise.all([
      loadCaptionFonts(),
      ...keys.map((key) =>
        images.current.has(key)
          ? Promise.resolve()
          : new Promise<void>((resolve, reject) => {
              const im = new Image();
              im.onload = () => {
                if(live)images.current.set(key, im);
                resolve();
              };
              im.onerror = () =>
                reject(
                  new Error(
                    "A background or logo could not load. Choose another visual or retry.",
                  ),
                );
              im.src = key;
            }),
      ),
    ])
      .then(() => {
        if (live) {
          setImagesReady(true);
          setImageRevision((n) => n + 1);
        }
      })
      .catch((e) => {
        if (live) {
          message(e, "Visuals could not load.");
          setImagesReady(false);
        }
      });
    return () => {
      live = false;
    };
  }, [imageKeys]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  useEffect(()=>{const asset=activeFootageAsset;let live=true;const task=new AbortController();footageDecoder.current?.dispose();footageDecoder.current=null;setFootageReady(!asset);if(asset&&project?.pro)void openFootage(assetUrl(project.pro.sourceSongId,asset),task.signal).then(decoder=>{if(live){footageDecoder.current=decoder;setFootageReady(true);setImageRevision(n=>n+1);}else decoder.dispose();}).catch(error=>{if(live){setFootageReady(false);message(error,"Product footage could not load. Remove it or try another MP4.");}});return()=>{live=false;task.abort();footageDecoder.current?.dispose();footageDecoder.current=null;};},[project?.pro?.sourceSongId,activeFootageAsset]);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context || !project) return;
    let frame = 0,live=true;
    const paint = async () => {
      const sourceTime=audio.current?.currentTime??time;let footage;
      try{if(activeAdMedia(project.pro).footage&&footageDecoder.current){const decoded=await footageDecoder.current.frameAt(footageTime(sourceTime,project.pro!.range.start,activeAdMedia(project.pro).footage!));footage={...decoded,fit:activeAdMedia(project.pro).footage!.fit};}}
      catch(error){if(live){setFootageReady(false);message(error,"A product video frame could not load.");}return;}
      if(!live)return;
      drawProFrame(
        context,
        sourceTime,
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ? {
          ...project, motion: "still", intensity: "still",
          visualLayers: project.visualLayers ? { ...project.visualLayers, backgroundMotion: 0, overlayMotion: false } : undefined,
        } : project,
        song?.name ?? "SAMADHI LOVE",
        images.current,
        {
          footage,
          guides: (
            project.pro?.formatLooks?.[project.format] ?? project.pro?.look
          )?.safe,
        },
      );
      if (playing) frame = requestAnimationFrame(paint);
    };
    void paint();
    return () => {live=false;cancelAnimationFrame(frame);};
  }, [project, time, playing, imageRevision, song?.name]);
  useEffect(() => {
    if (song && p?.duration && autoFor.current === song.id && !busy) {
      autoFor.current = "";
      void generateCaptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [song?.id, p?.duration, busy]);
  const handledAutoCaption = useRef("");
  useEffect(()=>{
    setCaptionRecovery(null);
  },[song?.id,p?.sourceAudioId]);
  useEffect(()=>{
    if(!song||!p?.duration||recoveryReady!==song.id||recovery||current.current?.cues.length||props.autoCaptionRequest?.songId===song.id)return;
    let active=true;
    const opened=current.current;
    if(!opened?.pro)return;
    const autoSync=()=>{if(active&&autoAfterRecovery.current===song.id&&!controller.current&&current.current===opened&&!opened.cues.length){autoAfterRecovery.current="";void generateCaptions();}};
    void fetch(`/api/studio/lyric-sync/recovery?song=${encodeURIComponent(song.id)}&audio=${encodeURIComponent(p.sourceAudioId)}`,{cache:"no-store"}).then(async recoveryResponse=>{
      if(recoveryResponse.ok){
        const saved=await recoveryResponse.json() as {recovery?:CaptionRecovery};
        if(saved.recovery?.cues?.length){
          if(active&&!controller.current&&current.current===opened)setCaptionRecovery(saved.recovery);
          return null;
        }
      }
      return fetch(`/api/studio/jobs?songId=${encodeURIComponent(song.id)}&captions=1`,{cache:"no-store"});
    }).then(async response=>{
      if(response===null)return; // a recovery copy was found; the owner chooses what to do with it
      if(!response.ok){autoSync();return;}
      const saved=await response.json() as {captions?:SyncResponse;sourceAudioId?:string;text?:string};
      const source=opened.pro!;
      if(!active||controller.current||current.current!==opened||saved.sourceAudioId!==source.sourceAudioId||!saved.captions?.cues?.length){autoSync();return;}
      if(saved.text?.trim()!==source.approvedLyrics.trim()&&source.approvedLyrics.trim()){autoSync();return;}
      const cues=saved.captions.cues as LyricCue[];
      const approved=source.approvedLyrics.trim()?source.approvedLyrics:cues.map(c=>c.text).join("\n");
      const next:LyricProject={...opened,cues,pro:{...source,approvedLyrics:approved,sections:sectionsFromLyrics(approved,cues,source.duration),alignment:{engine:saved.captions.engine??"Recovered sync",at:new Date().toISOString(),audioId:source.sourceAudioId,reviewed:false,warnings:saved.captions.warnings??[]}}};
      if(isLyricProject(next)){edit(next);setStatus("Recovered your timed captions. Listen and review before exporting.");}
    }).catch(()=>{});
    return()=>{active=false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  },[song?.id,p?.sourceAudioId,p?.duration,recoveryReady,recovery,props.autoCaptionRequest?.songId]);
  useEffect(() => {
    const request = props.autoCaptionRequest;
    if (!request || request.id === handledAutoCaption.current || song?.id !== request.songId || !p?.duration || busy || recoveryReady !== song.id) return;
    handledAutoCaption.current = request.id;
    setStep(1);
    if (recovery) { setError("A lyric-video recovery copy is available. Resolve that copy before generating new captions; your saved timings have not changed."); return; }
    if (current.current?.cues.length) {
      setError("This video already has timed captions. Review them, or use Generate synchronized captions to replace them deliberately.");
      return;
    }
    if(!current.current?.pro?.approvedLyrics.trim()){setLyricsEditorOpen(true);setStatus("Have the words from another app? Paste them and align to this recording, or generate captions directly from its audio.");return;}
    void generateCaptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [props.autoCaptionRequest?.id, song?.id, p?.duration, busy, recoveryReady, recovery]);
  const handledSocialRequest=useRef("");
  /** The song's own name, words and styles for ready-to-paste post text. */
  const postSource=()=>({title:song?.name??"",artist:p?.artist,tags:song?.tags,idea:song?.notes.prompt,lyrics:p?.approvedLyrics||song?.notes.lyrics});
  useEffect(()=>{const request=props.socialVideoRequest;if(!request||request.id===handledSocialRequest.current||song?.id!==request.songId||!p?.duration||busy||recoveryReady!==song.id)return;
    handledSocialRequest.current=request.id;
    if(recovery){setError("Resolve the available recovery copy before changing this video's excerpt. Your saved project is preserved.");return;}
    if(request.audioId&&request.audioId!==p.sourceAudioId){setError("This recording changed. Open its current version before preparing the video; your saved design is preserved.");return;}
    const start=request.start??(song.musicalAd?0:suggestedHookStart(current.current!)),seconds=request.seconds??song.musicalAd?.seconds??30;const purpose=videoPurposeById(request.purpose);
    // What the video is for sets its shape and length: YouTube full song (wide), Shorts highlight, Phone full song, Square box.
    let next=purpose?applyVideoPurpose(current.current!,purpose,purpose.seconds>0?start:0,song.musicalAd?seconds:undefined):applySocialVideoPreset(current.current!,"reels",start,seconds);next=applyPlayVisual(next,request.look,request.photoAsset,request.footage);edit(next);if(song.musicalAd&&song.creationKind==="instrumental")setCleanExport(true);seek(next.pro!.range.start);setPlatform(purpose?.platform??"instagram");if(purpose){setPostCaption(readyPostCaption(purpose.platform,postSource()));setVideoTitle(postTextFor("youtube",postSource()).title);}setStatus(purpose?`Your ${purpose.name} video is prepared: ${purpose.shape}. Review the words and look, then export. You can save it or open the upload page when it's done.`:"Your vertical short is prepared. Review captions and choose a look before export.");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  },[props.socialVideoRequest?.id,song?.id,p?.duration,busy,recoveryReady,recovery]);
  const handledCover=useRef("");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  useEffect(()=>{const request=props.coverVideoRequest;if(!request||handledCover.current===request.id||song?.id!==request.songId||!p?.duration||busy||recoveryReady!==song.id)return;handledCover.current=request.id;if(recovery){setError("Resolve the recovery copy before preparing this cover video.");return;}const currentProject=current.current!;const next=applySocialVideoPreset(currentProject,"reels",0,30);edit({...next,motion:"drift",visualLayers:{backgroundMotion:.6,overlayAmount:.45,overlayStyle:request.overlay,overlayMotion:true,beatOffset:0},pro:{...next.pro!,background:request.asset,intro:0,outro:0,sections:next.pro!.sections.map(section=>({...section,background:undefined,theme:undefined}))}});setCleanExport(true);setStep(4);seek(0);setPlatform("instagram");setStatus("Animated cover prepared. Render the video to include your song and moving cover.");},[props.coverVideoRequest?.id,song?.id,p?.duration,busy,recoveryReady,recovery]);
  async function chooseSong(id: string) {
    if (busy) return;
    if (
      current.current &&
      signature(current.current) !== savedSignature.current &&
      !(await persist())
    )
      return;
    setMode("existing");
    setSongId(id);
  }
  const captionState: CaptionState = /align|transcrib|sync/i.test(operation) ? "timing"
    : !project?.cues.length ? "none" : p?.alignment?.reviewed ? "reviewed"
    : !p?.alignment || p.alignment.engine === "Rough timing" ? "rough" : "synced";
  const originalUrl = p ? sourceUrl(p.sourceSongId, p.sourceAudioId) : "";
  const soundtrackUrl =
    p?.useEnhancedSoundtrack && p.soundtrackAsset
      ? assetUrl(p.sourceSongId, p.soundtrackAsset)
      : originalUrl;
  const exportChecks = project && song ? renderReadiness(project, song, songs, {
    imagesReady: imagesReady&&footageReady, allowOld, clean: cleanExport, fallback,
    formats: batch ? ["vertical", "wide", "square"] : [project.format],
  }) : [];
  async function detectAnimationBeats(){
    if(!project?.pro||busy)return;const before=current.current!;const identity=soundtrackIdentity(before);const task=new AbortController();controller.current=task;setOperation("Estimating soundtrack beats");setError("");
    try{const decoded=await audioBuffer(soundtrackUrl);task.signal.throwIfAborted();const result=await analyzeBeatBuffer(decoded,task.signal);if(!current.current?.pro||soundtrackIdentity(current.current)!==identity)return;
      const latest=current.current;edit({...latest,bpm:result.bpm,visualLayers:{backgroundMotion:1,overlayAmount:0,overlayStyle:"none",overlayMotion:true,...latest.visualLayers,beatOffset:result.offset},pro:{...latest.pro!,beatGrid:{source:identity,bpm:result.bpm,offset:result.offset,beats:result.beats.filter(t=>t<=latest.pro!.duration),method:"onset-grid/v1",reviewed:false}}});setStatus("Beat estimate ready. Listen, correct the grid, then mark it reviewed. Lyric timing is unchanged.");
    }catch(e){if(task.signal.aborted)setStatus("Beat analysis canceled. Saved audio and lyrics are preserved.");else message(e,"Beat estimation could not finish.");}finally{controller.current=null;setOperation("");}
  }
  async function audioBuffer(url = originalUrl) {
    if (buffers.current.has(url)) return buffers.current.get(url)!;
    const decoded = await decodeProjectAudio(url, controller.current?.signal);
    if (buffers.current.size >= 2) buffers.current.clear();
    buffers.current.set(url, decoded);
    return decoded;
  }
  async function importMedia(
    file: File,
    mixTarget?: { sourceSongId: string; mixId: string },
  ) {
    if (!rights) {
      setError(
        "Confirm you have permission to use this media before uploading.",
      );
      return;
    }
    if (busy) return;
    if (
      current.current &&
      signature(current.current) !== savedSignature.current
    ) {
      if (!(await persist())) return;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    setOperation("Importing recording");
    setError("");
    const task = new AbortController();
    controller.current = task;
    try {
      if (file.size > 120 * 1024 * 1024)
        throw new Error(
          "Choose a file up to 120 MB. Existing audio uploads support 96 MB.",
        );
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "",
        isVideo =
          file.type.startsWith("video/") ||
          ["mp4", "mov"].includes(ext) ||
          (ext === "webm" && !file.type.startsWith("audio/"));
      let uploadFile = file;
      if (isVideo) {
        const decoded = await decodeProjectAudio(file, task.signal);
        const { encodeMp3 } = await import("./vocal/mp3");
        const blob = await encodeMp3(decoded);
        uploadFile = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, "") + ".mp3",
          { type: "audio/mpeg" },
        );
      } else if (!isAudioFormat(ext))
        throw new Error(
          "Choose supported audio or an MP4/WebM/MOV with a decodable audio track.",
        );
      const imported = await propsRef.current.importFile(
        uploadFile,
        file.name.replace(/\.[^.]+$/, "").slice(0, 100),
      );
      if (!imported)
        throw new Error(
          "Import could not finish. Your existing songs are unchanged.",
        );
      let sourceVideo: string | undefined;
      if (isVideo) {
        const type =
          file.type ||
          (ext === "webm"
            ? "video/webm"
            : ext === "mov"
              ? "video/quicktime"
              : "video/mp4");
        sourceVideo = await uploadLyricAsset(
          imported.id,
          "sourceVideo",
          new Blob([file], { type }),
          task.signal,
        );
      }
      if (mixTarget) {
        const attached = await fetch("/api/studio/lyric-project", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...mixTarget, audioSongId: imported.id }),
        });
        const result = (await attached.json()) as SaveResponse;
        if (!attached.ok)
          throw new Error(
            result.error ??
              "The recording imported but could not link to the saved mix.",
          );
        propsRef.current.persisted(result.data, result.revision);
      }
      setMode("existing");
      setSongId(imported.id);
      if (sourceVideo) {
        pendingVideo.current = { songId: imported.id, id: sourceVideo };
      }
      setStatus(
        isVideo
          ? "The untouched video is retained privately. Its audio was extracted to a 192 kbps MP3 for Studio playback; the original video remains downloadable."
          : "Recording imported. Choose Generate captions; no copying or pasting is needed.",
      );
    } catch (e) {
      message(e, "Import could not finish.");
    } finally {
      controller.current = null;
      setOperation("");
    }
  }
  const pendingVideo = useRef<{ songId: string; id: string } | null>(null);
  useEffect(() => {
    if (p && pendingVideo.current?.songId === p.sourceSongId) {
      const item = pendingVideo.current;
      pendingVideo.current = null;
      patchPro({ sourceVideo: item.id });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [p?.sourceSongId]);
  async function realignChangedPart(){
    const opened=current.current,pro=opened?.pro,window=pro?.captionEdit;
    if(!opened||!pro||!song||!window||busy)return;
    const lines=opened.cues.filter(c=>c.needsReview||c.time<window.end&&(c.end??c.time)>window.start).map(c=>c.text);
    if(!lines.length){setError("No lyric lines remain in this cut. Review the join manually; no provider call was made.");return;}
    if(!confirm(`Realign only ${formatCaptionTime(window.start)}–${formatCaptionTime(window.end)}? This uses your ElevenLabs account and may cost provider credits. The Studio cost estimate will be checked before processing.`))return;
    const task=new AbortController();controller.current=task;setOperation("Realigning the changed part");setError("");
    try{
      const decoded=await decodeProjectAudio(sourceUrl(pro.sourceSongId,pro.sourceAudioId),task.signal);
      const start=Math.floor(window.start*decoded.sampleRate),end=Math.min(decoded.length,Math.ceil(window.end*decoded.sampleRate));
      const mono=new Float32Array(end-start);
      for(let channel=0;channel<decoded.numberOfChannels;channel++){const samples=decoded.getChannelData(channel);for(let i=0;i<mono.length;i++)mono[i]+=samples[start+i]/decoded.numberOfChannels;}
      const excerpt=wavAudio(mono,undefined,decoded.sampleRate);
      const asset=await uploadLyricAsset(song.id,"analysis",excerpt,task.signal,pro.sourceAudioId,window);
      const response=await productionFetch("/api/studio/lyric-sync",{method:"POST",headers:{"Content-Type":"application/json"},signal:task.signal,body:JSON.stringify({songId:song.id,audioId:song.audioId,sourceAudioId:pro.sourceAudioId,mode:"align",text:lines.join("\n"),language:pro.language,duration:pro.duration,analysisAsset:asset,analysisOffset:0,window})});
      const result=await response.json() as SyncResponse;
      if(!response.ok||!result.cues?.length)throw new Error(result.error??"The changed part could not align. Your other captions are unchanged.");
      if(current.current!==opened)throw new Error("This project changed while aligning. Restore the saved sync before repeating a paid call.");
      edit({...opened,cues:mergeWindowCaptions(opened.cues,result.cues as LyricCue[],window),pro:{...pro,captionEdit:undefined,alignment:{engine:result.engine??"Window alignment",at:new Date().toISOString(),audioId:pro.sourceAudioId,reviewed:false,warnings:result.warnings??[]}}});
      await persist(true,"Realigned changed part");
      setStatus("The changed part is aligned. Captions outside it were kept.");
    }catch(error){message(error,"The changed part could not align. Your captions are preserved.");}
    finally{controller.current=null;setOperation("");}
  }
  function restoreCaptionSync(){
    const opened=current.current;
    if(!opened?.pro||!captionRecovery)return;
    const restored=captionRecovery.window?mergeWindowCaptions(opened.cues,captionRecovery.cues,captionRecovery.window):captionRecovery.cues;
    const next={...opened,cues:restored,pro:{...opened.pro,captionEdit:undefined,alignment:{engine:captionRecovery.engine??"Recovered sync",at:new Date().toISOString(),audioId:opened.pro.sourceAudioId,reviewed:false,warnings:captionRecovery.warnings??[]}}};
    if(!isLyricProject(next)){setError("The recovered captions need a timing review before restoring.");return;}
    edit(next);setCaptionRecovery(null);void persist(true,"Restored last caption sync");
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  useEffect(()=>{if(captionRecovery&&!busy&&!current.current?.cues.length)restoreCaptionSync();},[captionRecovery,busy]);
  async function generateCaptions() {
    const next = current.current;
    if (!next?.pro || !song || busy) return;
    const pro=next.pro;
    // Never fall back silently: say why precise sync didn't happen, so it can be fixed.
    const rough=(reason:string)=>{
      const why=`Precise sync didn't work: ${reason.replace(/\.?$/,".")}`;
      const lines=lyricLines(pro.approvedLyrics);
      if(!lines.length||!pro.duration){setLyricsEditorOpen(true);setStep(1);setStatus(`${why} No words could be recovered. Paste the sung lyrics and Studio can give them rough timing.`);return;}
      if(next.cues.length){setStatus(`${why} Your existing timing was kept; use Estimated timing if you want a new rough draft.`);return;}
      const cues=estimatedCues(lines,pro.duration);
      const warning=`${why} Rough timing only — these lines were spread across the recording, not matched to the voice. Listen and adjust them by hand.`;
      const fallbackProject:LyricProject={...next,cues,pro:{...pro,sections:sectionsFromLyrics(pro.approvedLyrics,cues,pro.duration),alignment:{engine:"Rough timing",at:new Date().toISOString(),audioId:pro.sourceAudioId,reviewed:false,warnings:[warning]}}};
      if(!isLyricProject(fallbackProject)){setStatus("The lyrics need shorter lines before rough timing can be added. Your writing is kept.");return;}
      edit(fallbackProject);setStep(2);setStatus(warning);
    };
    if(next.pro.approvedLyrics.trim()&&!lyricLines(next.pro.approvedLyrics).length){setStep(1);setLyricsEditorOpen(true);setError("Paste the words actually sung, not only section headings. No caption processing was started.");return;}
    // Even without ElevenLabs, the server may time the words with its backup engine (fal Whisper).
    // If neither is available, the server says so and rough timing is used with that reason.
    if (sourceChanged(song, next) && !allowOld) {
      setError(
        "This song has a newer recording. Choose the saved original or realign the current recording.",
      );
      return;
    }
    const mode = lyricLines(pro.approvedLyrics).length ? "align" : "transcribe";
    setOperation(
      mode === "align" ? "Aligning the saved lyrics" : "Transcribing vocals",
    );
    setError("");
    const task = new AbortController();
    controller.current = task;
    try {
      const response = await productionFetch("/api/studio/lyric-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: task.signal,
        body: JSON.stringify({
          songId: song.id,
          audioId: song.audioId,
          sourceAudioId: pro.sourceAudioId,
          duration: pro.duration,
          mode,
          text: pro.approvedLyrics,
          language: pro.language,
          analysisAsset: pro.useEnhancedAnalysis
            ? pro.analysisAsset
            : pro.vocalAsset,
          analysisOffset: pro.analysisOffset,
        }),
      });
      const result = (await response.json()) as SyncResponse;
      if (!response.ok || !result.cues?.length)
        throw new Error(
          result.error ??
            "The vocals could not be synchronized. Try the original audio or review the approved lyrics.",
        );
      const cues = result.cues as LyricCue[];
      const approved =
        mode === "transcribe" && !pro.approvedLyrics.trim()
          ? cues.map((c) => c.text).join("\n")
          : pro.approvedLyrics;
      let differences: LyricDifference[] | undefined,
        transcript: string | undefined;
      const aligned:LyricProject={...next,cues,pro:{...pro,approvedLyrics:approved,detectedLanguage:result.language,languageProbability:result.languageProbability,sections:sectionsFromLyrics(approved,cues,pro.duration),alignment:{engine:result.engine??"ElevenLabs",at:new Date().toISOString(),audioId:pro.sourceAudioId,reviewed:false,warnings:result.warnings??[]}}};
      if(!isLyricProject(aligned))throw new Error("Some returned timings need correction. Your saved lyrics are preserved.");
      edit(aligned);
      if(!await persist(true,"Synchronized lyrics before recognition review")){setStep(2);setStatus("Timed captions are on the preview. Retry the project save before starting another provider request.");return;}
      if (audit && mode === "align" && !task.signal.aborted) {
        try{
        setOperation("Comparing recognized words with approved lyrics");
        const checked = await productionFetch("/api/studio/lyric-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: task.signal,
          body: JSON.stringify({
            songId: song.id,
            audioId: song.audioId,
            sourceAudioId: pro.sourceAudioId,
            duration: pro.duration,
            mode: "audit",
            text: pro.approvedLyrics,
            language: pro.language,
            analysisAsset: pro.useEnhancedAnalysis
              ? pro.analysisAsset
              : pro.vocalAsset,
            analysisOffset: pro.analysisOffset,
          }),
        });
        const report = (await checked.json()) as SyncResponse;
        if (checked.ok) {
          differences = report.differences;
          transcript = report.transcript;
        } else
          result.warnings = [
            ...(result.warnings ?? []),
            "The recognition comparison did not finish: " +
              (report.error ?? "try again later"),
          ];
        }catch(error){result.warnings=[...(result.warnings??[]),"Recognition comparison did not finish. Synchronized captions were retained: "+((error as Error).message||"Review the saved captions.")];}
      }
      const updated: LyricProject = {
        ...next,
        cues,
        pro: {
          ...(current.current?.pro??pro),
          approvedLyrics: approved,
          detectedLanguage: result.language,
          languageProbability: result.languageProbability,
          sections: sectionsFromLyrics(approved, cues, pro.duration),
          alignment: {
            engine: result.engine ?? "ElevenLabs",
            at: new Date().toISOString(),
            audioId: pro.sourceAudioId,
            reviewed: false,
            warnings: result.warnings ?? [],
            differences,
            transcript,
          },
        },
      };
      if (!isLyricProject(updated))
        throw new Error(
          "Some returned timings need correction. Your approved lyrics are preserved; try a shorter or clearer vocal source.",
        );
      edit(updated);
      setStep(2);
      setStatus(
        "Captions are on the preview. Listen at the beginning, middle, and end, then mark the review complete.",
      );
    } catch (error) {
      if(!task.signal.aborted)rough((error as Error)?.message||"the sync service did not answer");
    } finally {
      controller.current = null;
      setOperation("");
    }
  }
  async function analyze(enhance = false) {
    if (!p || busy) return;
    setOperation(
      enhance
        ? "Analyzing & improving clarity"
        : "Analyzing the original waveform",
    );
    setError("");
    const task = new AbortController();
    controller.current = task;
    try {
      const decoded = await audioBuffer();
      const analysis = analyzeAudio(decoded);
      let variants: Record<string, never> | { analysisAsset: string; soundtrackAsset: string } =
        {};
      if (enhance) {
        const improved = await improveClarity(decoded, noise, task.signal);
        const analysisAsset = await uploadLyricAsset(
          p.sourceSongId,
          "analysis",
          improved.analysis,
          task.signal,
          p.sourceAudioId,
        );
        const soundtrackAsset = await uploadLyricAsset(
          p.sourceSongId,
          "soundtrack",
          improved.soundtrack,
          task.signal,
          p.sourceAudioId,
        );
        variants = { analysisAsset, soundtrackAsset };
      }
      patchPro({ ...analysis, ...variants });
      setStatus(
        enhance
          ? "Separate clarity files saved. Choose them independently for analysis or the final soundtrack. The original is untouched."
          : "Waveform and amplitude accents are ready. They do not identify which sounds are lead vocals.",
      );
    } catch (e) {
      message(e, "Audio analysis could not finish.");
    } finally {
      controller.current = null;
      setOperation("");
    }
  }
  async function separate() {
    if (!song || !p || busy) return;
    setOperation("Separating a vocal analysis stem");
    setError("");
    const task = new AbortController();
    controller.current = task;
    try {
      const r = await productionFetch("/api/studio/stems", {
        method: "POST",
        signal: task.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: p.sourceSongId,
          audioId: p.sourceAudioId,
          mode: "two_stems_v1",
          confirmed: true,
        }),
      });
      if (!r.ok) {
        const result = (await r.json()) as SaveResponse;
        throw new Error(result.error ?? "Separation could not finish.");
      }
      const archive = await r.blob();
      if (archive.size > 120 * 1024 * 1024)
        throw new Error(
          "The returned stem archive exceeds project storage limits. Use the existing stem-download tool instead.",
        );
      const { unzipSync } = await import("fflate");
      let chosen = false;
      const files = unzipSync(new Uint8Array(await archive.arrayBuffer()), {
        filter: (file) => {
          if (
            chosen ||
            file.originalSize > 50 * 1024 * 1024 ||
            !/vocal[^/]*\.(mp3|wav|m4a|flac|ogg)$/i.test(file.name) ||
            /back|instrument/i.test(file.name)
          )
            return false;
          chosen = true;
          return true;
        },
      });
      const entry = Object.entries(files)[0];
      if (!entry)
        throw new Error(
          "The archive contained no supported vocal file. The original remains available for captions.",
        );
      const ext = entry[0].split(".").pop()!.toLowerCase(),
        type =
          ext === "wav"
            ? "audio/wav"
            : ext === "m4a"
              ? "audio/mp4"
              : ext === "flac"
                ? "audio/flac"
                : ext === "ogg"
                  ? "audio/ogg"
                  : "audio/mpeg";
      const vocal = new Blob([entry[1] as Uint8Array<ArrayBuffer>], { type }),
        decoded = await decodeProjectAudio(vocal, task.signal);
      if (Math.abs(decoded.duration - p.duration) > 0.15)
        throw new Error(
          "The vocal stem's duration differs from the original. Studio will not assume it is synchronized. Use the original or an externally verified full-length stem.",
        );
      const stemArchive = await uploadLyricAsset(
          p.sourceSongId,
          "stems",
          new Blob([archive], { type: "application/zip" }),
          task.signal,
        ),
        vocalAsset = await uploadLyricAsset(
          p.sourceSongId,
          "vocal",
          vocal,
          task.signal,
        );
      patchPro({ stemArchive, vocalAsset, useEnhancedAnalysis: false });
      setStatus(
        "Full-length vocal stem saved for analysis. Listen and check the offset before alignment; equal duration does not prove zero stem delay. The original soundtrack is unchanged.",
      );
    } catch (e) {
      message(e, "Vocal separation could not finish.");
    } finally {
      controller.current = null;
      setOperation("");
    }
  }
  useEffect(() => {
    if (!p?.duration || busy || !pendingDesign.current) return;
    const design = pendingDesign.current;
    pendingDesign.current = null;
    void uploadOwnBackground(design.file, design.scope);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [p?.sourceSongId, p?.duration, busy]);
  async function validateDesign(file: Blob) {
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      !file.size ||
      file.size > maxDesignBytes
    )
      throw new Error("Choose a JPG, PNG or WebP background up to 15 MB.");
    const url = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          image.naturalWidth && image.naturalHeight
            ? resolve()
            : reject(new Error("The image has no readable dimensions."));
        image.onerror = () =>
          reject(
            new Error(
              "This image could not be read. Export it as JPG, PNG or WebP and try again.",
            ),
          );
        image.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function uploadOwnBackground(
    input: File,
    scope: BackgroundScope = "all",
  ) {
    if (busy) return;
    setOperation("Preparing your background design");
    setError("");
    const task = new AbortController();
    controller.current = task;
    try {
      const type =
        input.type ||
        (/\.png$/i.test(input.name)
          ? "image/png"
          : /\.webp$/i.test(input.name)
            ? "image/webp"
            : /\.jpe?g$/i.test(input.name)
              ? "image/jpeg"
              : "");
      const file = input.type ? input : new File([input], input.name, { type });
      await validateDesign(file);
      task.signal.throwIfAborted();
      const now = current.current;
      if (!now?.pro) {
        if (starterBackground) URL.revokeObjectURL(starterBackground);
        const url = URL.createObjectURL(file);
        urls.current.push(url);
        pendingDesign.current = { file, scope: "all" };
        setStarterBackground(url);
        setStatus(
          "Your design is ready in the preview. Choose or create a song to save it privately with the project. Until then it stays in this tab.",
        );
        return;
      }
      if (
        scope === "section" &&
        !now.pro.sections.some((s) => s.time <= time && time < s.end)
      )
        throw new Error(
          "Seek inside a song section before assigning its background.",
        );
      const source = now.pro.sourceSongId;
      const id = await uploadLyricAsset(
        source,
        "background",
        file,
        task.signal,
      );
      const latest = current.current;
      if (!latest?.pro || latest.pro.sourceSongId !== source) return;
      edit(applyCustomLyricBackground(latest, id, scope, time));
      setStarterBackground("");
      setStep(3);
      setStatus(
        "Your background design is saved privately and applied to the video. Lyrics, recording and timing are preserved.",
      );
    } catch (e) {
      message(e, "Your background design could not save.");
    } finally {
      controller.current = null;
      setOperation("");
    }
  }
  async function importOwnTemplate(file: File) {
    if (busy) return;
    setError("");
    try {
      if (file.size > maxVisualTemplateBytes)
        throw new Error(
          "Choose a Studio template JSON up to 21 MB, including any embedded image.",
        );
      const template = parseVisualTemplate(JSON.parse(await file.text()));
      const background = decodeTemplateBackground(template);
      if (background) await validateDesign(background);
      const before = current.current ?? starterLook,
        next = applyVisualTemplate(before, template);
      if (current.current) edit(next);
      else {
        pendingLook.current = {
          ...pendingLook.current,
          ...visualSettings(next),
          captionTemplate: next.captionTemplate,
        };
        pendingVisualLayout.current = {
          layout: template.layout,
          captionMode: template.captionMode,
          duetColors: template.duetColors,
        };
        pendingDesign.current = null;
        setStarterBackground("");
        setStarterLook(next);
      }
      if (background)
        await uploadOwnBackground(
          new File(
            [background],
            "template-background." +
              (background.type === "image/jpeg"
                ? "jpg"
                : background.type.split("/")[1]),
            { type: background.type },
          ),
        );
      else
        setStatus(
          `“${template.name}” visual settings imported. Source audio, lyrics and timing are unchanged. Upload artwork separately when using a project JSON that references private images.`,
        );
    } catch (e) {
      message(e, "The visual template could not be imported.");
    }
  }
  async function exportOwnTemplate() {
    if (busy) return;
    setOperation("Preparing your visual template");
    setError("");
    try {
      const before = current.current ?? starterLook,
        section = before.pro?.sections.findLast(
          (s) => s.time <= time && time < s.end,
        );
      const template = makeVisualTemplate(
        { ...before, theme: section?.theme ?? before.theme },
        before.pro?.name ?? "SAMADHI LOVE visual look",
      );
      const image =
        section?.background ??
        (section?.theme ? undefined : before.pro?.background);
      const source =
        image && before.pro
          ? assetUrl(before.pro.sourceSongId, image)
          : !before.pro
            ? starterBackground
            : "";
      if (source) {
        const response = await fetch(source);
        if (!response.ok)
          throw new Error(
            "The saved design could not load for this template. Try again or upload the design again.",
          );
        const blob = await response.blob();
        if (blob.size > maxDesignBytes)
          throw new Error("Template images must be 15 MB or smaller.");
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () =>
            reject(new Error("The image could not be added to the template."));
          reader.readAsDataURL(blob);
        });
        template.background = { dataUrl };
      }
      downloadBlob(
        new Blob([JSON.stringify(template, null, 2)], {
          type: "application/json",
        }),
        "samadhi-visual-template.json",
      );
      setStatus(
        "Visual template downloaded. Import this JSON to reuse its look and any embedded background, without copying song audio or lyrics.",
      );
    } catch (e) {
      message(e, "The visual template could not export.");
    } finally {
      setOperation("");
    }
  }
  async function uploadAdPhotos(files:File[]){
    if(!p||busy)return;const existing=p.adPhotoStory?.photos??[];
    if(existing.length+files.length>8){setError("Use up to eight photos. Remove one before adding more.");return;}
    if(files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)){setError("Choose JPG, PNG or WebP photos up to 15 MB each.");return;}
    setOperation("Saving ad photos");setError("");const task=new AbortController();controller.current=task;const photos=[...existing];
    try{for(const file of files){await validateDesign(file);const asset=await uploadLyricAsset(p.sourceSongId,"background",file,task.signal);photos.push({asset,name:file.name.slice(0,100)});patchPro({useTemplateBackground:false,backgroundVideo:undefined,adPhotoStory:{motion:"zoom",fit:"contain",transition:"dissolve",prompt:"",...p.adPhotoStory,photos:[...photos]}});}setStatus("Ad photos saved privately. Review the animated preview, add your logo, then export MP4.");}
    catch(error){message(error,"Some photos could not save. Already saved photos remain in your story; retry the missing ones.");}finally{controller.current=null;setOperation("");}
  }
  async function uploadProductVideo(file:File,fit:"contain"|"cover"="contain"){
    if(!p||busy)return;setOperation(fit==="cover"?"Checking your video":"Checking product video");setError("");const task=new AbortController();controller.current=task;let decoder:FootageDecoder|undefined;
    try{decoder=await openFootage(file,task.signal);const asset=await uploadLyricAsset(p.sourceSongId,"sourceVideo",file,task.signal);patchPro({useTemplateBackground:false,adPhotoStory:undefined,backgroundVideo:{asset,duration:decoder.duration,trimStart:0,trimEnd:decoder.duration,loop:true,fit}});setStatus(fit==="cover"?"Your video is the background now. It loops, its own sound is muted, and your song stays the soundtrack.":"Product video saved privately. Its original audio is muted; your song stays the soundtrack.");}
    catch(error){message(error,fit==="cover"?"Your video could not save. Your song is unchanged.":"The product clip could not save. Your song is unchanged.");}finally{decoder?.dispose();controller.current=null;setOperation("");}
  }
  async function applyGeneratedVisual(job:VisualJob,scene:boolean){
    if(busy)throw new Error("Finish the current action before applying a visual.");
    const before=current.current;
    if(!before?.pro||before.pro.sourceSongId!==job.song||before.pro.sourceAudioId!==job.source)throw new Error("Reopen the original recording for this visual.");
    setOperation("Preparing generated visual");setError("");
    const task=new AbortController();controller.current=task;let decoder:FootageDecoder|undefined;
    try {
      let duration:number|undefined;
      if(job.mode==="image"){
        const response=await fetch(assetUrl(job.song,job.asset!),{signal:task.signal,credentials:"same-origin"});
        if(!response.ok)throw new Error("The saved generated image could not open. Refresh its status.");
        await validateDesign(await response.blob());
      }else{decoder=await openFootage(assetUrl(job.song,job.asset!),task.signal);duration=decoder.duration;}
      task.signal.throwIfAborted();
      const latest=current.current;
      if(!latest)throw new Error("Reopen the lyric-video project before applying this visual.");
      edit(applyVisualJob(latest,job,scene,duration));
      setStatus("Generated visual applied. Your audio, captions and timing are preserved; review the framing before export.");
    } finally {decoder?.dispose();controller.current=null;setOperation("");}
  }
  async function visual(file: File, kind: "background" | "logo") {
    if (kind === "background") {
      await uploadOwnBackground(file);
      return;
    }
    if (!p || busy) return;
    setOperation("Saving " + kind);
    setError("");
    const task = new AbortController();
    controller.current = task;
    try {
      const id = await uploadLyricAsset(
        p.sourceSongId,
        kind,
        file,
        task.signal,
      );
      patchPro({ [kind]: id });
    } catch (e) {
      message(e, "The visual could not save.");
    } finally {
      controller.current = null;
      setOperation("");
    }
  }
  async function restore(id: string, duplicate = false) {
    if (!song || busy) return;
    if (!(await persist())) return;
    setOperation("Opening a saved version");
    setError("");
    try {
      const r = await fetch(
          `/api/studio/lyric-project?song=${song.id}&version=${id}`,
        ),
        next = (await r.json()) as LyricProject & { error?: string };
      if (!r.ok || !isLyricProject(next) || !next.pro)
        throw new Error(next.error ?? "That project version could not open.");
      edit({
        ...next,
        pro: {
          ...next.pro,
          updatedAt: expected.current ?? undefined,
          ...(duplicate
            ? { id: crypto.randomUUID(), name: next.pro.name + " · Alternate" }
            : {}),
        },
      });
      setStatus(
        "Version restored as the current editable project. Existing history remains available.",
      );
    } catch (e) {
      message(e, "The version could not open.");
    } finally {
      setOperation("");
    }
  }
  async function exportVideo() {
    if (!project?.pro || !song || busy) return;
    audio.current?.pause();setPlaying(false);
    const blocked = exportChecks.filter(check => check.level === "block");
    if (blocked.length) { setError(blocked.map(check => check.text).join(" ")); return; }
    if (!(await persist(true, "Before export"))) return;
    const next = structuredClone(current.current!),
      pro = next.pro!;
    setError("");
    setProgress(0);
    setOperation("Preparing video export");
    const task = new AbortController();
    controller.current = task;
    let exportFootage:FootageDecoder|undefined;
    let jobId:string|undefined,timer:ReturnType<typeof setInterval>|undefined;
    const owner=workspace.current;
    try {
      const exportMedia=activeAdMedia(pro);
      if(exportMedia.footage)exportFootage=await openFootage(assetUrl(pro.sourceSongId,exportMedia.footage.asset),task.signal);
      await loadCaptionFonts();
      const decoded = await audioBuffer(soundtrackUrl);
      if (Math.abs(decoded.duration - pro.duration) > 0.2)
        throw new Error(
          "This soundtrack has a different duration. Choose the original or prepare a matching clarity version.",
        );
      const formats: VideoFormat[] = batch
        ? ["vertical", "wide", "square"]
        : [next.format];
      const recoveryKey=renderKey(workspace.current,pro.sourceSongId);
      // Export history changes as each shape finishes, but does not change frames.
      const fingerprint=signature({...next,pro:{...pro,exports:undefined}})+JSON.stringify([formats,resolution,fallback,cleanExport,song.name]);
      const saved=await readRender(recoveryKey).catch(()=>undefined);
      const checkpoint:VideoCheckpoint=saved&&!saved.finished&&saved.fingerprint===fingerprint?saved:{fingerprint,token:crypto.randomUUID(),completed:0,options:{resolution,fallback,cleanExport,batch}};
      jobId=await videoJob({video:"start",songId:pro.sourceSongId,resume:saved&&!saved.finished?saved.jobId:undefined},owner);
      if(!jobId)throw new Error("The video job could not start. Your project is saved.");
      checkpoint.jobId=jobId;
      timer=setInterval(()=>{void videoJob({video:"heartbeat",jobId},owner).catch(()=>{});},30000);
      let localRecovery=true;
      await saveRender(recoveryKey,checkpoint).catch(()=>{localRecovery=false;setStatus("Device storage is unavailable. Keep Studio visible until this export saves.");});
      const finished: typeof outputs = [];
      for (let i = checkpoint.completed; i < formats.length; i++) {
        const format = formats[i];
        setOperation(`Rendering ${formatLabels[format]}`);
        const segments=segmentStore(recoveryKey,checkpoint.token,format);
        let finalBlob=localRecovery?await segments.read(-1):undefined,cachedCodec="";
        if(finalBlob)try{cachedCodec=codecCompatibility(await inspectVideo(finalBlob,pro.intro+pro.range.end-pro.range.start+pro.outro));}
        catch{finalBlob=undefined;setStatus("The saved export was incomplete. Rebuilding it from the saved project.");}
        const result = finalBlob?{blob:finalBlob,extension:finalBlob.type.includes("mp4")?"mp4" as const:"webm" as const,codec:cachedCodec,engine:"Recovered finished video"}:await exportProVideo(
          {
            audio: decoded,
            audioUrl: soundtrackUrl,
            start: pro.range.start,
            end: pro.range.end,
            intro: pro.intro,
            outro: pro.outro,
            format,
            resolution,
            signal: task.signal,
            preferRecorder: fallback,
            checkpoint:localRecovery&&!fallback?segments:undefined,
            requiresFrameEncoding:!!exportMedia.footage,
            paint: async (context, t) => {
              const sourceTime=pro.range.start+Math.max(0,t-pro.intro);
              const footage=exportMedia.footage&&exportFootage?{...await exportFootage.frameAt(footageTime(sourceTime,pro.range.start,exportMedia.footage),task.signal),fit:exportMedia.footage.fit}:undefined;
              drawProFrame(
                context,
                t,
                { ...next, format },
                song.name,
                images.current,
                { clean: cleanExport, exportTime: true,footage },
              );
            },
          },
          (fraction) => setProgress((i + fraction * 0.94) / formats.length),
        );
        const url = URL.createObjectURL(result.blob);
        urls.current.push(url);
        const item: VideoExport & { format: VideoFormat; codec: string } = {
          ...result,
          url,
          format,
        };
        finished.push(item);
        setOutputs([...finished]);
        if(localRecovery&&!finalBlob)await segments.write(-1,result.blob).catch(()=>{});
        let asset: string | undefined;
        if (result.blob.size <= 512 * 1024 * 1024) {
          setOperation("Saving the finished video privately");
          asset = await uploadLyricAsset(
            pro.sourceSongId,
            "video",
            result.blob,
            task.signal,
            pro.sourceAudioId,
            undefined,
            owner,
          );
        } else
          setStatus(
            "The finished video exceeds the 512 MB private-video limit. Choose 720p or a shorter excerpt.",
          );
        if (asset) {
          item.savedUrl = assetUrl(pro.sourceSongId, asset);
          setOutputs([...finished]);
        }
        const exportRecord = {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          format,
          extension: result.extension,
          asset,
          start: pro.range.start,
          end: pro.range.end,
        };
        const latest = current.current!;
        edit(registerVideoExport(song,latest,exportRecord,pro.duration));
        if(!await persist())throw new Error("The video file is available below, but its project record did not save. Keep a download and retry the project save.");
        checkpoint.completed=i+1;
        if(localRecovery)await saveRender(recoveryKey,checkpoint);
      }
      if(finished.some(item=>!item.savedUrl))throw new Error("A video was too large to save privately. Download it from this tab.");
      await videoJob({video:"done",jobId},owner);
      if(localRecovery)await saveRender(recoveryKey,{...checkpoint,finished:true}).catch(()=>{});
      setResumeVideo(false);
      setPostCaption(before=>before.trim()?before:readyPostCaption(platform,postSource()));
      setVideoTitle(before=>before.trim()?before:postTextFor("youtube",postSource()).title);
      setStatus(
        "Video export finished. Download or share the video below. A saved-video link is created automatically for exports up to 120 MB; Studio access is required to open it.",
      );
    } catch (e) {
      if(jobId){setResumeVideo(true);await videoJob({video:"failed",jobId},owner).catch(()=>{});}
      message(
        e,
        "Export failed. Your project is saved. Try again, select 720p, or use real-time fallback.",
      );
    } finally {
      if(timer)clearInterval(timer);
      exportFootage?.dispose();
      controller.current = null;
      setOperation("");
      setProgress(null);
    }
  }
  const flags = project && p ? reviewTiming(project.cues, p.duration) : [];
  const selectedLook =
    project && p ? (p.formatLooks?.[project.format] ?? p.look) : undefined;
  const size = project
    ? proVideoSize(project.format, 720)
    : proVideoSize("vertical", 720);
  const fileBase = (song?.name ?? "Samadhi Love")
    .replace(/[\\/:*?"<>|]/g, "-")
    .slice(0, 90);
  async function downloadReleaseKit(){
    if(!project?.pro||!song||busy)return;
    if(!(await persist()))return;
    try{const bytes=releaseKit(current.current!,song);downloadBlob(new Blob([new Uint8Array(bytes).buffer],{type:"application/zip"}),fileBase+"-release-kit.zip");setStatus("Release kit downloaded: full-song and selected-video captions, approved lyrics, metadata and editable project. Audio and video files remain separate.");}
    catch(error){message(error,"The release kit could not finish. Individual caption downloads remain available.");}
  }
  function captionDownload(type: "srt" | "vtt" | "lrc" | "json") {
    if (!project || !p) return;
    let contents: string;
    const shifted = clipCues(
      project.cues.filter(
        (c) =>
          (p.includeBacking || c.role !== "backing") &&
          (p.includeAdlibs || c.role !== "adlib"),
      ),
      p.range.start,
      p.range.end,
    ).map((c) => ({
      ...c,
      time: c.time + p.intro,
      end: c.end === undefined ? undefined : c.end + p.intro,
      words: c.words?.map((w) => ({ ...w, time: w.time + p.intro })),
    }));
    const total = p.intro + p.range.end - p.range.start + p.outro;
    if (type === "json")
      contents = JSON.stringify(
        {
          schema: "samadhi-lyric-video-pro/v1",
          sourceName: song?.name,
          project,
        },
        null,
        2,
      );
    else if (type === "lrc") contents = lrcFile(shifted, 0, total);
    else contents = captionFile(shifted, 0, total, type);
    downloadBlob(
      new Blob([contents], {
        type: type === "json" ? "application/json" : "text/plain;charset=utf-8",
      }),
      fileBase + "." + type,
    );
  }
  return (
    <div
      className={mode === "classic" ? "lvp-classic-host" : "lyric-video-pro"}
      data-skin="cosmic"
      data-observatory="true"
      onPlayCapture={(event) => {
        const active = event.target;
        if (active instanceof HTMLMediaElement)
          event.currentTarget
            .querySelectorAll("audio,video")
            .forEach((other) => {
              if (other !== active) (other as HTMLMediaElement).pause();
            });
      }}
    >
      <header className="lvp-hero">
        <div>
          <span className="lvp-eyebrow">
            <Sparkles size={16} /> {brand.name} · VISUAL PRODUCTION
          </span>
          <h1>
            Make your <em>video</em>
          </h1>
          <p className="hologram-guide">Pick a vibe. Your lyrics light up in time with your voice.</p>
          <details className="lvp-quick-guide"><summary>How to make a lyric video</summary><ol><li>Choose a Studio song, create one, or upload your authorized recording.</li><li>Choose Auto lyric video. Saved lyrics guide synchronization; uploads can use supplied lyrics or transcription.</li><li>Open Caption editor to correct words and timing.</li><li>Choose a background and lyric style, then YouTube widescreen or upright Shorts / Reels.</li><li>Export the video file, play it, then download or share it for upload.</li></ol><p>Automatic alignment and transcription use the connected provider and applicable credits. Review sung words, dialects and pauses before exporting.</p></details>
          <span className="lvp-feature-badge">
            Sacred backgrounds · Cosmic scenes · Animated lyric styles
          </span>
        </div>
        <div className="lvp-actions">
          {mode !== "classic" && (
            <>
              <button
                type="button"
                className="lvp-primary"
                disabled={busy}
                onClick={openVisualChoices}
              >
                Backgrounds &amp; lyric styles
              </button>
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (project && !(await persist())) return;
              setMode("start");
            }}
          >
            Start options
          </button>
          {(props.advanced||mode==="classic")&&<button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (project && !(await persist())) return;
              setMode(mode === "classic" ? "existing" : "classic");
            }}
          >
            {" "}
            {mode === "classic" ? "Open guided video creator" : "Classic lyric editor"}
          </button>}
        </div>
      </header>
      {mode === "classic" ? (
        <LyricVideoStudio
          {...{
            songs,
            initialSongId: songId || initialSongId,
            saving,
            save,
            elevenLabs,
            connectionSettings,
            upload,
          }}
        />
      ) : (
        <>
          {(mode === "start" || mode === "create" || !song) && (
            <div className="lvp-start-grid">
              <button
                type="button"
                className={
                  mode === "create" ? "lvp-start selected" : "lvp-start"
                }
                disabled={busy}
                onClick={() => props.createSong ? props.createSong() : setMode("create")}
              >
                <Sparkles />
                <strong>Create a song</strong>
                <span>
                  Open the shared song creator, then bring its saved lyrics
                  and recording here for a video or short.
                </span>
              </button>
              <button
                type="button"
                className="lvp-start"
                disabled={busy}
                onClick={() => {
                  setMode("existing");
                  setStep(0);
                  requestAnimationFrame(() =>
                    document
                      .getElementById("lyric-song-upload")
                      ?.scrollIntoView({ behavior: cosmicScrollBehavior(), block: "center" }),
                  );
                }}
              >
                <Upload />
                <strong>Upload Your Own Song</strong>
                <span>
                  Upload audio, generate captions, choose backgrounds and
                  animated lettering, then export and share.
                </span>
              </button>
              <button
                type="button"
                className={
                  mode === "existing" ? "lvp-start selected" : "lvp-start"
                }
                disabled={busy}
                onClick={() => setMode("existing")}
              >
                <Music2 />
                <strong>Use an Existing Song</strong>
                <span>
                  Open Your songs or My Originals, reuse saved lyrics, or import
                  your authorized media.
                </span>
              </button>
            </div>
          )}
          {props.advanced&&props.createSong&&<details><summary>Specialized production tools</summary><button type="button" disabled={busy} onClick={()=>setMode("create")}>Caption-ready production</button></details>}
          {(mode === "start" || (mode === "existing" && !song)) && (
            <section className="lvp-visual-library" id="lyric-visual-library">
              <h2>Find your video’s look</h2>
              <VibeLookPicker project={libraryProject.pro?libraryProject:{...libraryProject,pro:newProSettings(freshSong("vibe-preview","SAMADHI LOVE",0),9)}} change={next=>{if(current.current){edit(next);return;}pendingVisualLayout.current={formatLooks:next.pro?.formatLooks??signatureLayouts()};changeLibraryBackground(next,true);}} disabled={busy}/>
              <details className="lvp-more-looks"><summary>More looks</summary>
              <CreatorLookBrowser project={libraryProject} change={next=>changeLibraryBackground(next,true)} disabled={busy}/>
              </details>
              <p>
                {project && song
                  ? `Customize the look for “${song.name}” here, or continue to its recording preview.`
                  : "Browse and choose a look now—no recording required. Your choices will carry into the next song you open or create."}
              </p>
              <div className="lvp-library-layout">
                <aside className="lvp-library-preview">
                  <CaptionTemplateDemo
                    project={libraryPreview}
                    useProjectBackground
                    backgroundSource={
                      libraryImage && libraryProject.pro
                        ? assetUrl(
                            libraryProject.pro.sourceSongId,
                            libraryImage,
                          )
                        : !project
                          ? starterBackground
                          : undefined
                    }
                  />
                  <button
                    type="button"
                    className="lvp-primary"
                    disabled={busy}
                    onClick={() => {
                      setMode("existing");
                      requestAnimationFrame(() =>
                        document
                          .getElementById("lyric-source-picker")
                          ?.scrollIntoView({
                            block: "center",
                            behavior: cosmicScrollBehavior(),
                          }),
                      );
                    }}
                  >
                    Choose a song to continue <ArrowRight size={16} />
                  </button>
                </aside>
                <div>
                  <div
                    className="lvp-library-tabs"
                    role="group"
                    aria-label="Visual library"
                  >
                    <button
                      type="button"
                      aria-pressed={libraryTab === "backgrounds"}
                      onClick={() => setLibraryTab("backgrounds")}
                    >
                      Sacred images &amp; backgrounds
                    </button>
                    <button
                      type="button"
                      aria-pressed={libraryTab === "lyrics"}
                      onClick={() => setLibraryTab("lyrics")}
                    >
                      Lyric text styles
                    </button>
                  </div>
                  {libraryTab === "backgrounds" ? (
                    <>
                    <SignaturePicker project={libraryProject} change={next => {
                      if (!current.current) pendingVisualLayout.current = { formatLooks: signatureLayouts() };
                      changeLibraryBackground(next, true);
                    }} disabled={busy}/>
                    <LyricBackgroundPicker
                      project={libraryProject}
                      time={time}
                      change={changeLibraryBackground}
                      disabled={busy}
                      initialGroup="sacred"
                      uploadDesign={(file, scope) =>
                        void uploadOwnBackground(file, scope)
                      }
                      importTemplate={(file) => void importOwnTemplate(file)}
                      exportTemplate={() => void exportOwnTemplate()}
                      customPreview={!project && !!starterBackground}
                    />
                    </>
                  ) : (
                    <CaptionTemplatePicker
                      value={libraryProject.captionTemplate}
                      choose={chooseLibraryStyle}
                      disabled={busy}
                      legend="Choose your lyric style"
                      sampleText={project?.cues[0]?.text}
                    />
                  )}
                </div>
              </div>
            </section>
          )}
          {mode === "create" ? (
            <CaptionReadyCreate
              provider={elevenLabs}
              audit={audit}
              changeAudit={setAudit}
              drafts={songs.filter((s) => !s.deletedAt && !isExplicitSong(s))}
              generate={props.generate}
              connect={connectionSettings}
              done={(created) => {
                autoFor.current = created.id;
                setSongId(created.id);
                setMode("existing");
              }}
            />
          ) : (
            mode !== "start" && (
              <>
                {!(song && project && p) && <nav className="lvp-stepper" aria-label="Lyric video workflow">
                  {steps.map((item, i) => (
                    <button
                      type="button"
                      key={item.label}
                      disabled={
                        busy ||
                        !project ||
                        (item.go === 4 && !project?.cues.length)
                      }
                      aria-current={item.covers.includes(step) ? "step" : undefined}
                      onClick={() => setStep(item.go === 1 && project?.cues.length ? 2 : item.go)}
                    >
                      <b>{i + 1}</b>
                      {item.label}
                    </button>
                  ))}
                </nav>}
                <div className="lvp-source-bar" id="lyric-source-picker">
                  <label>
                    Song or original
                    <select
                      value={songId}
                      disabled={busy}
                      onChange={(e) => void chooseSong(e.target.value)}
                    >
                      <option value="">Choose a recording…</option>
                      <optgroup label="Your songs">
                        {tracks
                          .filter((s) => !s.creationDraft)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="My Originals">
                        {tracks
                          .filter((s) => s.creationDraft)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </label>
                  {project && (
                    <span className="lvp-save" role="status">
                      {savedState}
                    </span>
                  )}
                  {retrySave && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setRetrySave(false);
                        void persist();
                      }}
                    >
                      Retry save
                    </button>
                  )}
                </div>
                {(!song || step === 0) && (
                  <section className="lvp-panel">
                    <h2>
                      {song ? "Your song is linked" : "Upload your own song"}
                    </h2>
                    <p>
                      Saved lyrics and caption timing come with Studio
                      recordings automatically. Choose Generate captions to
                      align saved lyrics or transcribe an upload.
                    </p>
                    <label className="lvp-check">
                      <input
                        type="checkbox"
                        checked={rights}
                        onChange={(e) => setRights(e.target.checked)}
                        disabled={busy}
                      />{" "}
                      I have permission to use the audio/video and confirm it
                      meets Studio&apos;s existing clean-content rules.
                    </label>
                    <label className="lvp-upload" id="lyric-song-upload">
                      <Upload size={20} /> Upload your own song or video
                      <input
                        type="file"
                        accept="audio/*,video/mp4,video/webm,video/quicktime,.mp3,.wav,.m4a,.flac,.ogg,.opus,.mp4,.mov,.webm"
                        disabled={busy || !rights}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) void importMedia(f);
                        }}
                      />
                    </label>
                    <p className="lvp-note">
                      Original audio uploads: up to 96 MB. Video imports: up to
                      120 MB and ten minutes, subject to this browser&apos;s decoder.
                      Original videos are retained; their extracted audio is
                      re-encoded for Studio playback. Streaming-service
                      downloads are not supported.
                    </p>
                    {song?.mixes.length ? (
                      <details>
                        <summary>Saved mixes for {song.name}</summary>
                        {song.mixes.map((m) => (
                          <div key={m.id}>
                            <strong>{m.name}</strong>
                            <p>{m.notes}</p>
                            {m.audioSongId &&
                            tracks.some((t) => t.id === m.audioSongId) ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void chooseSong(m.audioSongId!)}
                              >
                                Use this saved mix
                              </button>
                            ) : (
                              <>
                                <p className="lvp-note">
                                  This mix has a listening link but no attached
                                  audio. Attach your authorized local export
                                  once; Studio will carry over its source lyrics
                                  and make it selectable here. Streaming links
                                  are not downloaded.
                                </p>
                                <label>
                                  Attach mix audio
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    disabled={busy || !rights}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      e.target.value = "";
                                      if (file)
                                        void importMedia(file, {
                                          sourceSongId: song.id,
                                          mixId: m.id,
                                        });
                                    }}
                                  />
                                </label>
                              </>
                            )}
                          </div>
                        ))}
                      </details>
                    ) : null}
                    {song && (
                      <button
                        type="button"
                        className="lvp-primary"
                        disabled={busy || !p?.duration}
                        onClick={() => {if(project?.cues.length)openCaptionEditor();else {setStep(1);if(p?.approvedLyrics.trim())void generateCaptions();else setLyricsEditorOpen(true);}}}
                      >
                        {project?.cues.length
                          ? "Open caption editor"
                          : "Auto lyric video"}{" "}
                        <ArrowRight size={16} />
                      </button>
                    )}
                    {song&&<button type="button" disabled={busy||!p?.duration} onClick={()=>{setStep(1);setLyricsEditorOpen(true);}}>Paste lyrics for this recording</button>}
                  </section>
                )}
                {song && project && p && (
                  <><button type="button" className="mobile-preview-toggle" aria-expanded={mobilePreview} aria-controls="mobile-video-preview" onClick={()=>setMobilePreview(!mobilePreview)}>{mobilePreview?"Hide preview · focus on editing":"Show video preview"}</button><p className="mobile-context-note">Phone exports start at 720p to reduce memory use. Keep Studio visible and your screen awake during rendering. Download the result and check playback before sharing. Existing project framing stays unchanged.</p><div className="lvp-workspace" data-mobile-preview={mobilePreview}>
                    <aside className="lvp-preview-panel" id="mobile-video-preview">
                      {/* The playing video stays in view while the page scrolls; its choices sit below it. */}
                      <div className="lvp-sticky-preview" data-testid="sticky-video-preview">
                      <div className={`lvp-video-preview ${project.format}`}>
                        <canvas
                          ref={canvas}
                          width={size.width}
                          height={size.height}
                          aria-label="Synchronized lyric video preview"
                        />
                      </div>
                      <p className="obs-caption-status" role="status" data-testid="status-caption-timing" data-state={!project.cues.length?"none":p.alignment?.reviewed?"reviewed":p.alignment?.engine==="Rough timing"||!p.alignment?"rough":"draft"}>
                        <span aria-hidden="true" className="obs-caption-dot"/>
                        {!project.cues.length?"No captions yet":p.alignment?.reviewed?"Captions reviewed by you":p.alignment?.engine==="Rough timing"||!p.alignment?"Rough timing · listen and adjust":`Synced captions · ${p.alignment.engine} · needs your review`}
                      </p>
                      {p.captionEdit&&<div role="status"><p>Captions moved to your edited song. The changed part ({formatCaptionTime(p.captionEdit.start)}–{formatCaptionTime(p.captionEdit.end)}) needs a quick realign.</p><button type="button" disabled={busy} onClick={()=>void realignChangedPart()}>Realign changed part</button></div>}
                      <audio
                        key={soundtrackUrl}
                        ref={audio}
                        controls
                        preload="metadata"
                        src={soundtrackUrl}
                        aria-label="Original or selected lyric video soundtrack"
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        onEnded={() => setPlaying(false)}
                        onTimeUpdate={(e) =>
                          setTime(e.currentTarget.currentTime)
                        }
                        onSeeked={(e) => setTime(e.currentTarget.currentTime)}
                        onLoadedMetadata={(e) => {
                          const duration = e.currentTarget.duration;
                          if (
                            Number.isFinite(duration) &&
                            duration > 0 &&
                            duration <= 600.1
                          ) {
                            const old = current.current;
                            if (
                              old?.pro &&
                              Math.abs(old.pro.duration - duration) > 0.005
                            ) {
                              const previous = old.pro.duration;
                              edit({
                                ...old,
                                pro: {
                                  ...old.pro,
                                  duration,
                                  range: {
                                    start: Math.min(
                                      old.pro.range.start,
                                      duration,
                                    ),
                                    end:
                                      Math.abs(old.pro.range.end - previous) <
                                      0.1
                                        ? duration
                                        : Math.min(old.pro.range.end, duration),
                                  },
                                },
                              });
                            }
                          } else
                            setError(
                              "This recording is longer than ten minutes or could not report its duration. Choose a shorter source.",
                            );
                        }}
                        onError={() =>
                          setError(
                            "The recording could not load. Reopen the song or choose another saved source.",
                          )
                        }
                      />
                      </div>
                      <div className="lvp-preview-label">
                        <span>
                          {shortTime(time)} / {shortTime(p.duration)}
                        </span>
                        <span>
                          {p.useEnhancedSoundtrack
                            ? "Enhanced soundtrack"
                            : p.sourceVideo
                              ? "Extracted video audio · MP3 copy"
                              : "Untouched source soundtrack"}
                        </span>
                      </div>
                      <details className="lvp-preview-more" data-testid="details-preview-tools"><summary>Soundtrack and caption tools</summary>
                      <div className="lvp-source-confirm">
                        <p className="lvp-note">Soundtrack version: {p.sourceAudioId}. Confirm after listening. Replacing a recording does not silently replace this video&apos;s saved source.</p>
                        <button type="button" disabled={busy || !p.duration || (sourceChanged(song, project) && !allowOld)}
                          onClick={() => patchPro({ soundtrackConfirmed: soundtrackIdentity(project) })}>
                          {p.soundtrackConfirmed === soundtrackIdentity(project) ? "Soundtrack version confirmed" : "Confirm this soundtrack version"}
                        </button>
                      </div>
                      <div className="lvp-actions lvp-caption-shortcut"><button type="button" className="lvp-primary" disabled={busy||!p.duration} onClick={()=>openCaptionEditor(Math.max(0,project.cues.findLastIndex(c=>c.time<=time)))} title="Open the caption editor at the current line to correct words and timing">Edit words</button>
                        <button type="button" data-testid="button-review-timing" disabled={busy||!p.duration||!project.cues.length} onClick={()=>openCaptionEditor(Math.max(0,project.cues.findLastIndex(c=>c.time<=time)))}>Realign a part manually</button></div>
                      <p className="lvp-note obs-realign-note">To fix one part, move its lines in the caption editor. Automatic re-sync covers the whole song and may use provider credits.</p>
                      <a
                        className="lvp-original-download"
                        href={originalUrl}
                        download={fileBase + "-original"}
                      >
                        {p.sourceVideo
                          ? "Download extracted audio copy"
                          : "Download untouched source audio"}
                      </a>
                      <p className="lvp-note">
                        Captions appear directly on the video. Correct timing in
                        Review or expand Professional editor.
                      </p>
                      </details>
                      {sourceChanged(song, project) && (
                        <div className="lvp-error">
                          <strong>
                            A newer recording is attached to this song.
                          </strong>
                          <p>
                            These captions belong to the saved original.
                            Changing audio requires new alignment.
                          </p>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setAllowOld(true)}
                          >
                            Keep using the saved original
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={async () => {
                              if (
                                !(await persist(
                                  true,
                                  "Before source realignment",
                                ))
                              )
                                return;
                              buffers.current.clear();
                              patchPro({
                                sourceAudioId: song.audioId ?? song.id,
                                duration: 0,
                                range: { start: 0, end: 0 },
                                alignment: undefined,
                                analysisAsset: undefined,
                                soundtrackAsset: undefined,
                                vocalAsset: undefined,
                                sourceVideo: undefined,
                                stemArchive: undefined,
                                reactiveStem: undefined,
                                energy: undefined,
                                accents: undefined,
                                waveform: undefined,
                                sections: [],
                                useEnhancedAnalysis: false,
                                useEnhancedSoundtrack: false,
                              });
                              const next = current.current!;
                              edit({ ...next, cues: [] });
                              setStep(1);
                              setAllowOld(false);
                            }}
                          >
                            Use current recording &amp; realign
                          </button>
                          {allowOld && (
                            <p>Saved original selected explicitly.</p>
                          )}
                        </div>
                      )}
                      <div className="lvp-actions">
                        <button
                          type="button"
                          disabled={busy || !past.length}
                          onClick={() => {
                            const previous = past.at(-1)!;
                            setFuture((f) => [project, ...f]);
                            setPast((h) => h.slice(0, -1));
                            setProject(previous);
                            current.current = previous;
                          }}
                        >
                          <Undo2 size={15} /> Undo
                        </button>
                        <button
                          type="button"
                          disabled={busy || !future.length}
                          onClick={() => {
                            const next = future[0];
                            setPast((h) => [...h, project]);
                            setFuture((h) => h.slice(1));
                            setProject(next);
                            current.current = next;
                          }}
                        >
                          <Redo2 size={15} /> Redo
                        </button>
                      </div>
                    </aside>
                    <main className="lvp-controls">
                      <QuickVideoPanel song={song} project={project} time={time} busy={busy} edit={edit} make={() => void exportVideo()} progress={progress}
                        captionState={captionState} blocked={exportChecks.filter(check => check.level === "block").map(check => ({ text: check.text, step: check.step }))}
                        latest={outputs.at(-1)} addWords={() => { openFineTune(1); setLyricsEditorOpen(true); }} fixWords={() => openCaptionEditor(Math.max(0, project.cues.findLastIndex(c => c.time <= time)))}
                        openFineTune={openFineTune} own={{
                          active: project.pro?.backgroundVideo && !project.pro.useTemplateBackground ? "video" : project.pro?.background && project.pro.useTemplateBackground !== false ? "photo" : null,
                          photo: file => uploadOwnBackground(file, "all"),
                          video: file => uploadProductVideo(file, "cover"),
                          clear: () => edit(applyLyricBackground(project, project.theme, "all", time)),
                        }}/>
                      <details className="lvp-finetune" id="lvp-finetune" open={fineTune} onToggle={e => setFineTune((e.currentTarget as HTMLDetailsElement).open)} data-testid="details-fine-tune">
                      <summary>Fine-tune · fix words, timing, fonts, animation, AI visuals, ads, versions</summary>
                      <nav className="lvp-stepper" aria-label="Fine-tune sections">
                        {steps.map((item, i) => (
                          <button type="button" key={item.label} disabled={busy || (item.go === 4 && !project.cues.length)}
                            aria-current={item.covers.includes(step) ? "step" : undefined}
                            onClick={() => setStep(item.go === 1 && project.cues.length ? 2 : item.go)}>
                            <b>{i + 1}</b>{item.label}
                          </button>
                        ))}
                      </nav>
                      {step === 1 && (
                        <section className="lvp-panel">
                          <span className="lvp-kicker">STEP 1 · WORDS</span>
                          <h2>Bring the words onto the screen</h2>
                          <p>
                            {p.approvedLyrics.trim()
                              ? "Your saved or pasted lyrics guide alignment to this recording. Studio groups readable lines and finds where the words are sung."
                              : "Have lyrics from another app? Paste them below to align them with this recording, or generate captions from its audio."}
                          </p>
                          <div className="lvp-actions"><button type="button" disabled={busy} onClick={()=>setLyricsEditorOpen(true)}>Paste / edit lyrics</button>{savedLyricsForAudio(song,p.sourceAudioId).trim()&&<button type="button" disabled={busy} onClick={()=>{patchPro({approvedLyrics:savedLyricsForAudio(song,p.sourceAudioId)});setLyricsEditorOpen(true);}}>Use saved song lyrics</button>}</div>
                          <p className="lvp-note">Saved Studio lyrics are the word reference for this exact recording. Available word-end timing separates vocal phrases across longer pauses, so captions clear during instrumental gaps. Recognition and timing still need a quick review.</p>
                          <button
                            type="button"
                            className="lvp-primary"
                            disabled={
                              busy || !p.duration || (!elevenLabs.connected&&!lyricLines(p.approvedLyrics).length)
                            }
                            aria-describedby={
                              !p.approvedLyrics.trim()
                                ? "caption-extraction-help"
                                : undefined
                            }
                            onClick={generateCaptions}
                          >
                            <Sparkles size={16} />
                            {p.approvedLyrics.trim()
                              ? "Align lyrics to recording"
                              : "Generate captions from audio"}
                          </button>
                          {!elevenLabs.connected && (
                            <button type="button" onClick={connectionSettings}>
                              Open existing ElevenLabs settings
                            </button>
                          )}
                          {!p.approvedLyrics.trim() && (
                            <p id="caption-extraction-help" className="lvp-note">
                              Recognizes sung or spoken words in your recording
                              and creates editable, timed captions. Requires an
                              ElevenLabs connection and may use credits. Review
                              the results for accuracy.
                            </p>
                          )}
                          <label>
                            Caption language
                            <select
                              value={p.language}
                              disabled={busy}
                              onChange={(e) =>
                                patchPro({
                                  language: e.target
                                    .value as ProSettings["language"],
                                })
                              }
                            >
                              {Object.entries(proLanguages).map(
                                ([id, label]) => (
                                  <option key={id} value={id}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                          <p className="lvp-note">
                            Scribe supports requests for English, Arabic,
                            Turkish, and Russian; singing, overlapping voices,
                            mixed languages, and Lebanese/Egyptian/Khaleeji
                            dialects can be harder to recognize. Automatic
                            detection reports a broad language, not a guaranteed
                            dialect. Supplied dialect wording stays unchanged.
                            Joined scripts stay shaped; mixed Arabic/English
                            phrases use line-level emphasis where a word mask
                            would be ambiguous.
                          </p>
                          <details open={lyricsEditorOpen||undefined} onToggle={event=>setLyricsEditorOpen(event.currentTarget.open)}>
                            <summary>
                              Saved or pasted lyrics for this recording
                            </summary>
                            <label htmlFor="lyric-reference-text">Paste the words actually sung in your recording</label>
                            <MusicLanguageSummary profile={p.languageProfile}/>
                            <textarea
                              id="lyric-reference-text"
                              aria-label="Saved or pasted lyrics"
                              rows={10}
                              maxLength={5000}
                              dir="auto"
                              style={{unicodeBidi:"plaintext"}}
                              value={p.approvedLyrics}
                              disabled={busy}
                              onChange={(e) =>
                                patchPro({ approvedLyrics: e.target.value })
                              }
                            />
                            <p className="lvp-note">
                              Lyrics from other apps are welcome. Use the exact sung words, including repeated choruses; headings such as [Verse] can stay. Up to 5,000 characters. Aligning creates a timed visual draft without altering the soundtrack or rewriting the song&apos;s saved lyrics. Review missing or changed words and correct timing in Caption editor.
                            </p>
                          </details>
                          <label className="lvp-check">
                            <input
                              type="checkbox"
                              checked={audit}
                              disabled={busy || !p.approvedLyrics.trim()}
                              onChange={(e) => setAudit(e.target.checked)}
                            />{" "}
                            Also compare recognized words against approved
                            lyrics (an additional ElevenLabs request).
                          </label>
                          <p className="lvp-note">
                            This sends the selected original or analysis audio
                            to ElevenLabs and may use plan credits. Forced
                            alignment places your approved text; an independent
                            recognition comparison can flag possible skipped,
                            repeated, added, or changed words. Recognition
                            differences are review suggestions, not proof of a
                            singing error.
                          </p>
                          <details>
                            <summary>
                              Manual fallback · no provider request
                            </summary>
                            <p className="lvp-note">
                              If automatic recognition fails, spread the saved
                              lyric lines across the recording, then use
                              tap-to-time or word edits below. These are
                              estimates, not synchronized vocals.
                            </p>
                            <button
                              type="button"
                              disabled={
                                busy ||
                                !p.duration ||
                                !lyricLines(p.approvedLyrics).length
                              }
                              onClick={() => {
                                const cues = estimatedCues(
                                  lyricLines(p.approvedLyrics),
                                  p.duration,
                                );
                                edit({
                                  ...project,
                                  cues,
                                  pro: {
                                    ...p,
                                    sections: sectionsFromLyrics(
                                      p.approvedLyrics,
                                      cues,
                                      p.duration,
                                    ),
                                    alignment: {
                                      engine: "Manual estimated timing",
                                      at: new Date().toISOString(),
                                      audioId: p.sourceAudioId,
                                      reviewed: false,
                                      warnings: [
                                        "Estimated pacing only. Listen and correct line and word timing before export.",
                                      ],
                                    },
                                  },
                                });
                                setStep(2);
                              }}
                            >
                              Estimate from saved lyrics
                            </button>
                          </details>
                          <details className="lvp-clarity">
                            <summary>
                              Optional · Analyze &amp; Improve Clarity
                            </summary>
                            <p>
                              Gentle low-cut EQ, presence shaping, compression,
                              de-essing, and peak protection create separate
                              audio files. No pitch correction, time stretching,
                              or aggressive noise removal is applied. Processing
                              may still alter vocal tone or artistic balance.
                            </p>
                            <label className="lvp-check">
                              <input
                                type="checkbox"
                                checked={noise}
                                disabled={busy}
                                onChange={(e) => setNoise(e.target.checked)}
                              />{" "}
                              Add mild quiet-noise attenuation (can reduce
                              breaths or soft syllables)
                            </label>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => analyze(true)}
                            >
                              Analyze &amp; Improve Clarity
                            </button>
                            {p.analysisAsset && (
                              <>
                                <label className="lvp-check">
                                  <input
                                    type="checkbox"
                                    checked={p.useEnhancedAnalysis}
                                    disabled={busy}
                                    onChange={(e) =>
                                      patchPro({
                                        useEnhancedAnalysis: e.target.checked,
                                      })
                                    }
                                  />{" "}
                                  Use enhanced mono audio for caption analysis
                                </label>
                                <label className="lvp-check">
                                  <input
                                    type="checkbox"
                                    checked={p.useEnhancedSoundtrack}
                                    disabled={busy}
                                    onChange={(e) =>
                                      patchPro({
                                        useEnhancedSoundtrack: e.target.checked,
                                      })
                                    }
                                  />{" "}
                                  Apply the enhanced version to the final
                                  soundtrack
                                </label>
                                <div className="lvp-compare-audio">
                                  <label>
                                    Before · untouched original
                                    <audio
                                      controls
                                      preload="none"
                                      src={originalUrl}
                                    />
                                  </label>
                                  <label>
                                    After · optional clarity version
                                    <audio
                                      controls
                                      preload="none"
                                      src={assetUrl(
                                        p.sourceSongId,
                                        p.soundtrackAsset!,
                                      )}
                                    />
                                  </label>
                                </div>
                                <p className="lvp-note">
                                  This processing preserves duration and adds no
                                  lookahead or padding. Analysis and soundtrack
                                  choices are independent.
                                </p>
                              </>
                            )}
                            <button
                              type="button"
                              disabled={
                                busy ||
                                !elevenLabs.connected ||
                                sourceChanged(song, project)
                              }
                              onClick={separate}
                            >
                              Separate vocals for analysis · provider credits
                            </button>
                            <p className="lvp-note">
                              Uses the existing ElevenLabs two-stem tool.
                              Separation can leave instruments or backing vocals
                              in the stem; it cannot reliably isolate a duet
                              lead. Full-length duration is checked. Verify any
                              delay using the waveform and analysis offset
                              before alignment.
                            </p>
                            {p.vocalAsset && (
                              <>
                                <label>
                                  Vocal analysis stem
                                  <audio
                                    controls
                                    preload="none"
                                    src={assetUrl(p.sourceSongId, p.vocalAsset)}
                                  />
                                </label>
                                <label>
                                  Measured stem delay to subtract (seconds)
                                  <input
                                    type="number"
                                    min="-2"
                                    max="2"
                                    step=".001"
                                    value={p.analysisOffset}
                                    disabled={busy}
                                    onChange={(e) => {
                                      if (
                                        Number.isFinite(e.target.valueAsNumber)
                                      )
                                        patchPro({
                                          analysisOffset:
                                            e.target.valueAsNumber,
                                        });
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    patchPro({
                                      vocalAsset: undefined,
                                      analysisOffset: 0,
                                    })
                                  }
                                >
                                  Use original analysis audio
                                </button>
                                {p.stemArchive && (
                                  <a
                                    href={assetUrl(
                                      p.sourceSongId,
                                      p.stemArchive,
                                    )}
                                    download={fileBase + "-stems.zip"}
                                  >
                                    Download provider stem archive
                                  </a>
                                )}
                              </>
                            )}
                          </details>
                        </section>
                      )}
                      {step === 2 && (
                        <section className="lvp-panel">
                          <span className="lvp-kicker">STEP 1 · WORDS</span>
                          <h2>Caption editor</h2>
                          <p className="hologram-guide">Correct your lyrics, move line and word timing, or add a caption. Choose a line below to open it in the editor.</p>
                          <button type="button" className="lvp-primary" disabled={busy} onClick={()=>openCaptionEditor()}>Open caption text &amp; timing editor</button>
                          <p>
                            Check the beginning, middle, and end. Reliable
                            word-level confidence scores are not supplied, so
                            Studio flags timing patterns rather than inventing
                            confidence percentages.
                          </p>
                          <div className="lvp-actions">
                            {[0, 0.5, 0.9].map((f) => (
                              <button
                                type="button"
                                key={f}
                                disabled={busy}
                                onClick={() => seek(p.duration * f)}
                              >
                                {f === 0
                                  ? "Beginning"
                                  : f === 0.5
                                    ? "Middle"
                                    : "End"}
                              </button>
                            ))}
                          </div>
                          {p.detectedLanguage && (
                            <p className="lvp-note">
                              Detected broad language: {p.detectedLanguage}. You
                              can correct the language in Generate captions;
                              assign dialects and singers per section below.
                            </p>
                          )}
                          {p.alignment?.differences?.length ? (
                            <div className="lvp-review-warning">
                              <strong>
                                Possible differences to review · approved lyrics
                                preserved
                              </strong>
                              <ul>
                                {p.alignment.differences.map((d, i) => (
                                  <li key={i}>
                                    {d.kind}:{" "}
                                    {d.approved && (
                                      <span>approved “{d.approved}” </span>
                                    )}
                                    {d.heard && <span>heard “{d.heard}”</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            p.alignment?.transcript && (
                              <p>
                                No word differences were found in this
                                recognition pass. Listen to verify; this is not
                                a guarantee.
                              </p>
                            )
                          )}
                          {p.alignment?.warnings.length ? (
                            <details>
                              <summary>
                                Analysis notes · {p.alignment.engine}
                              </summary>
                              <ul>
                                {p.alignment.warnings.map((warning, i) => (
                                  <li key={i}>{warning}</li>
                                ))}
                              </ul>
                            </details>
                          ) : null}
                          <div className="lvp-caption-list">
                            {project.cues.map((cue, i) => {
                              const warnings = flags.filter(
                                  (f) => f.index === i,
                                ),
                                repeated =
                                  project.cues.filter(
                                    (c) => c.text === cue.text,
                                  ).length > 1;
                              return (
                                <div
                                  key={i}
                                  className={
                                    warnings.length
                                      ? "lvp-caption flagged"
                                      : "lvp-caption"
                                  }
                                >
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {seek(cue.time);openCaptionEditor(i);}}
                                  >
                                    <span>{shortTime(cue.time)}</span>
                                    <strong dir="auto">{cue.text}</strong>
                                  </button>
                                  <small>
                                    {cue.singer && `${cue.singer} · `}
                                    {repeated && "Repeated line · "}
                                    {warnings.map((w) => w.message).join(" ")}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                          <p className="lvp-note">
                            Gaps between recognized words may be instrumental
                            passages or missed vocals. Automatic separation of
                            lead lyrics, ad-libs, and backing vocals is not
                            reliable here; assign roles in the professional
                            editor.
                          </p>
                          <label className="lvp-check">
                            <input
                              type="checkbox"
                              checked={p.includeBacking}
                              disabled={busy}
                              onChange={(e) =>
                                patchPro({ includeBacking: e.target.checked })
                              }
                            />{" "}
                            Include captions marked as backing vocals
                          </label>
                          <label className="lvp-check">
                            <input
                              type="checkbox"
                              checked={p.includeAdlibs}
                              disabled={busy}
                              onChange={(e) =>
                                patchPro({ includeAdlibs: e.target.checked })
                              }
                            />{" "}
                            Include captions marked as ad-libs
                          </label>
                          <button
                            type="button"
                            className="lvp-primary"
                            disabled={busy || !project.cues.length}
                            onClick={() => {
                              patchPro({ alignment: p.alignment ? { ...p.alignment, reviewed: true } : {
                                engine: "Manual timing review", at: new Date().toISOString(), audioId: p.sourceAudioId, reviewed: true, warnings: [],
                              } });
                              setStep(3);
                            }}
                          >
                            <Check size={16} /> Review complete · choose look
                          </button>
                        </section>
                      )}
                      {step === 3 && (
                        <section
                          className="lvp-panel"
                          id="lyric-look-controls"
                          tabIndex={-1}
                        >
                          <span className="lvp-kicker">STEP 2 · LOOK</span>
                          <h2>Choose your look</h2>
                          <VibeLookPicker project={project} change={edit} disabled={busy} title="Featured vibes"/>
                          <h3 className="lvp-backgrounds-title" data-testid="heading-backgrounds">Backgrounds · all {Object.keys(videoThemes).length} designs</h3>
                          <LyricBackgroundPicker
                            initialGroup="sacred"
                            project={project}
                            time={time}
                            change={edit}
                            disabled={busy}
                            uploadDesign={(file, scope) =>
                              void uploadOwnBackground(file, scope)
                            }
                            importTemplate={(file) =>
                              void importOwnTemplate(file)
                            }
                            exportTemplate={() => void exportOwnTemplate()}
                          />
                          <details className="lvp-more-looks" data-testid="details-more-looks"><summary>More looks · caption styles, animated designs, AI visuals & ad tools</summary>
                          <VisualGenerationControls key={p.sourceSongId+"-"+p.sourceAudioId} project={project} apply={applyGeneratedVisual} disabled={busy}/>
                          <AdvertisingVideoControls project={project} change={edit} uploadPhotos={files=>void uploadAdPhotos(files)} upload={file=>void uploadProductVideo(file)} disabled={busy}/>
                          <StemReactiveControls key={p.sourceSongId+"-"+p.sourceAudioId} project={project} change={edit} disabled={busy} working={value=>setOperation(value?"Analyzing stem motion":"")}/>
                          <CreatorLookBrowser key={p.sourceSongId} project={project} change={edit} disabled={busy} hints={[song.notes.prompt,song.notes.instruments,...song.tags].join(" · ")}/>
                          <SocialVideoTools project={project} change={next=>{edit(next);seek(next.pro!.range.start);}} time={time} disabled={busy} choosePlatform={setPlatform}/>
                          <details><summary>Animated looks · 12 signature designs</summary>
                          <SignaturePicker project={project} change={edit} disabled={busy}/>
                          <details><summary>Fine-tune animation layers & tempo</summary>
                          <BeatGridControls project={project} change={edit} disabled={busy} analyze={()=>void detectAnimationBeats()}/>
                          <VisualLayerControls project={project} change={edit} disabled={busy} time={time}/>
                          </details>
                          </details>

                          <details>
                            <summary>Quick complete looks</summary>
                            <p className="lvp-note">
                              Apply a paired background and lyric style, then
                              customize each below.
                            </p>
                            <div className="lvp-look-grid">
                              {looks.map((look) => (
                                <button
                                  type="button"
                                  key={look.name}
                                  disabled={busy}
                                  aria-pressed={
                                    project.theme === look.theme &&
                                    project.captionTemplate === look.template
                                  }
                                  style={{
                                    background: `linear-gradient(135deg,${videoThemes[look.theme].colors[0]},${videoThemes[look.theme].colors[2]})`,
                                  }}
                                  onClick={() => {
                                    const preset = getCaptionTemplate(
                                      look.template,
                                    )!;
                                    const next = applyLyricBackground(
                                      project,
                                      look.theme,
                                      "all",
                                      time,
                                    );
                                    edit({
                                      ...next,
                                      captionTemplate: look.template,
                                      font: preset.font,
                                      color: preset.color,
                                      pro: {
                                        ...next.pro!,
                                        captionMode: "karaoke",
                                      },
                                    });
                                  }}
                                >
                                  {look.name}
                                </button>
                              ))}
                            </div>
                          </details>
                          <details><summary>Customize lettering · animated lyric styles</summary>
                          <CaptionTemplatePicker
                            legend="Choose your lyric style"
                            sampleText={
                              project.cues.findLast((c) => c.time <= time)
                                ?.text ?? lyricLines(p.approvedLyrics)[0]
                            }
                            value={project.captionTemplate}
                            disabled={busy}
                            choose={(id?: CaptionTemplateId) => {
                              const preset = getCaptionTemplate(id);
                              edit({
                                ...project,
                                captionTemplate: id,
                                pro: { ...p, captionMode: "karaoke" },
                                ...(preset
                                  ? { font: preset.font, color: preset.color }
                                  : {}),
                              });
                            }}
                          />
                          </details>
                          <details><summary>Fine-tune typography, motion & branding</summary>
                          <div className="lvp-fields">
                            <label>
                              Caption delivery
                              <select
                                value={p.captionMode}
                                disabled={busy}
                                onChange={(e) =>
                                  patchPro({
                                    captionMode: e.target
                                      .value as ProSettings["captionMode"],
                                  })
                                }
                              >
                                <option value="karaoke">
                                  Word highlighting / template motion
                                </option>
                                <option value="lines">Line-by-line</option>
                              </select>
                            </label>
                            <label>
                              Lyric motion
                              <select
                                value={project.intensity ?? "full"}
                                disabled={busy}
                                onChange={(e) =>
                                  edit({
                                    ...project,
                                    intensity: e.target
                                      .value as LyricProject["intensity"],
                                  })
                                }
                              >
                                <option value="full">Template motion</option>
                                <option value="gentle">Restrained</option>
                                <option value="still">
                                  Still / reduced motion
                                </option>
                              </select>
                            </label>
                            <label>
                              Caption font
                              <select
                                value={project.font ?? "classic"}
                                disabled={busy}
                                onChange={(e) =>
                                  edit({
                                    ...project,
                                    font: e.target
                                      .value as LyricProject["font"],
                                  })
                                }
                              >
                                {Object.entries(captionFonts).map(
                                  ([id, label]) => (
                                    <option key={id} value={id}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                            <label>
                              Caption color
                              <select
                                value={project.color ?? "pearl"}
                                disabled={busy}
                                onChange={(e) =>
                                  edit({
                                    ...project,
                                    color: e.target
                                      .value as LyricProject["color"],
                                  })
                                }
                              >
                                {Object.keys(captionColors).map((c) => (
                                  <option key={c}>{c}</option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Background motion
                              <select
                                value={project.motion}
                                disabled={busy}
                                onChange={(e) =>
                                  edit({
                                    ...project,
                                    motion: e.target
                                      .value as LyricProject["motion"],
                                  })
                                }
                              >
                                <option value="drift">Subtle pan</option>
                                <option value="zoom">Slow zoom</option>
                                <option value="still">Still</option>
                              </select>
                            </label>
                          </div>
                          <label className="lvp-check">
                            <input
                              type="checkbox"
                              disabled={busy || !p.energy?.length}
                              checked={p.audioReactive}
                              onChange={(e) =>
                                patchPro({ audioReactive: e.target.checked })
                              }
                            />{" "}
                            React to analyzed audio energy and detected accents
                          </label>
                          <p className="lvp-note">
                            Load waveform &amp; audio accents below to enable
                            real audio-driven brightness. Detected amplitude
                            accents are not a guaranteed musical beat grid.
                            Template BPM pulses are artistic motion, not beat
                            detection.
                          </p>
                          <div className="lvp-fields">
                            <label>
                              Singer A color
                              <input
                                type="color"
                                value={p.duetColors?.[0] ?? "#ffe2b0"}
                                disabled={busy}
                                onChange={(e) =>
                                  patchPro({
                                    duetColors: [
                                      e.target.value,
                                      p.duetColors?.[1] ?? "#b8eeff",
                                    ],
                                  })
                                }
                              />
                            </label>
                            <label>
                              Singer B color
                              <input
                                type="color"
                                value={p.duetColors?.[1] ?? "#b8eeff"}
                                disabled={busy}
                                onChange={(e) =>
                                  patchPro({
                                    duetColors: [
                                      p.duetColors?.[0] ?? "#ffe2b0",
                                      e.target.value,
                                    ],
                                  })
                                }
                              />
                            </label>
                            <label>
                              Artist / branding
                              <input
                                maxLength={100}
                                value={p.artist}
                                disabled={busy}
                                onChange={(e) =>
                                  patchPro({ artist: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Credits
                              <input
                                maxLength={400}
                                value={p.credits}
                                disabled={busy}
                                onChange={(e) =>
                                  patchPro({ credits: e.target.value })
                                }
                              />
                            </label>
                            <label>
                              Intro (silent seconds)
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step=".5"
                                value={p.intro}
                                disabled={busy}
                                onChange={(e) => {
                                  if (Number.isFinite(e.target.valueAsNumber))
                                    patchPro({ intro: e.target.valueAsNumber });
                                }}
                              />
                            </label>
                            <label>
                              Outro (silent seconds)
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step=".5"
                                value={p.outro}
                                disabled={busy}
                                onChange={(e) => {
                                  if (Number.isFinite(e.target.valueAsNumber))
                                    patchPro({ outro: e.target.valueAsNumber });
                                }}
                              />
                            </label>
                          </div>
                          <div className="lvp-fields">
                            <label>
                              Uploaded background
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={busy}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (file) void visual(file, "background");
                                }}
                              />
                            </label>
                            <label>
                              Artist logo
                              <input
                                type="file"
                                accept="image/png,image/webp"
                                disabled={busy}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (file) void visual(file, "logo");
                                }}
                              />
                            </label>
                          </div>
                          <p className="lvp-note">
                            Use licensed or authorized images. Uploaded assets
                            save privately with the project. You can change
                            scenery by song section and reposition captions
                            around faces in Professional editor.
                          </p>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => patchPro({ background: undefined })}
                          >
                            Use Studio background
                          </button>
                          {p.logo && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => patchPro({ logo: undefined })}
                            >
                              Remove logo
                            </button>
                          )}
                          </details>
                          </details>
                          <button
                            type="button"
                            className="lvp-primary"
                            disabled={busy}
                            onClick={() => setStep(4)}
                          >
                            Continue to export <ArrowRight size={16} />
                          </button>
                        </section>
                      )}
                      {step === 4 && (
                        <section className="lvp-panel">
                          <span className="lvp-kicker">STEP 3 · MAKE & DOWNLOAD</span>
                          <h2>Download, share & promote</h2>
                          <SocialVideoTools project={project} change={next=>{edit(next);seek(next.pro!.range.start);}} time={time} disabled={busy} choosePlatform={setPlatform}/>
                          <div className="lvp-fields">
                            <label>
                              Resolution
                              <select
                                value={resolution}
                                disabled={busy}
                                onChange={(e) =>
                                  setResolution(
                                    Number(e.target.value) as 1080 | 720,
                                  )
                                }
                              >
                                <option value="1080">1080p · 30 fps</option>
                                <option value="720">720p · 30 fps</option>
                              </select>
                            </label>
                            <label>
                              Video format
                              <select
                                value={project.format}
                                disabled={busy}
                                onChange={(e) =>
                                  edit(applyVideoShape(project,e.target.value as VideoFormat))
                                }
                              >
                                {Object.entries(formatLabels).map(
                                  ([id, label]) => (
                                    <option key={id} value={id}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                            <label>
                              Excerpt start (seconds)
                              <input
                                type="number"
                                min="0"
                                max={p.duration}
                                step=".01"
                                value={p.range.start}
                                disabled={busy}
                                onChange={(e) => {
                                  if (Number.isFinite(e.target.valueAsNumber))
                                    patchPro({
                                      range: {
                                        ...p.range,
                                        start: e.target.valueAsNumber,
                                      },
                                    });
                                }}
                              />
                            </label>
                            <label>
                              Excerpt end (seconds)
                              <input
                                type="number"
                                min="0"
                                max={p.duration}
                                step=".01"
                                value={p.range.end}
                                disabled={busy}
                                onChange={(e) => {
                                  if (Number.isFinite(e.target.valueAsNumber))
                                    patchPro({
                                      range: {
                                        ...p.range,
                                        end: e.target.valueAsNumber,
                                      },
                                    });
                                }}
                              />
                            </label>
                          </div>
                          <div className="lvp-actions">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                patchPro({
                                  range: { start: 0, end: p.duration },
                                })
                              }
                            >
                              Full song
                            </button>
                            {[15, 30, 60].map((length) => (
                              <button
                                type="button"
                                key={length}
                                disabled={busy}
                                onClick={() =>
                                  patchPro({
                                    range: shortClipRange(p.duration,time,length),
                                  })
                                }
                              >
                                {length}s from playhead
                              </button>
                            ))}
                          </div>
                          <label className="lvp-check">
                            <input
                              type="checkbox"
                              checked={batch}
                              disabled={busy}
                              onChange={(e) => setBatch(e.target.checked)}
                            />{" "}
                            Export all three aspect ratios sequentially
                          </label>
                          <label className="lvp-check">
                            <input
                              type="checkbox"
                              checked={cleanExport}
                              disabled={busy}
                              onChange={(e) => setCleanExport(e.target.checked)}
                            />{" "}
                            Clean video without lyrics
                          </label>
                          <label className="lvp-check">
                            <input
                              type="checkbox"
                              checked={fallback}
                              disabled={busy}
                              onChange={(e) => setFallback(e.target.checked)}
                            />{" "}
                            Use real-time browser recording fallback
                          </label>
                          <p className="lvp-note">
                            MP4 uses H.264 video and AAC audio when the browser
                            can encode both. Otherwise the real-time fallback
                            uses an honestly labeled supported MP4 or WebM
                            format. No file is renamed to pretend it is MP4.
                            Higher resolutions and frame rates are not offered.
                          </p>
                          <p className="lvp-note">
                            Rendering runs on this device, not a server queue.
                            Keep the page open and visible; closing it stops
                            rendering. Long full-song exports can use
                            substantial memory, especially on phones. A failed
                            export preserves the saved project; retry at 720p or
                            with a shorter excerpt. Private video storage
                            supports files up to 120 MB.
                          </p>
                          <section className="lvp-readiness" aria-label="Render readiness">
                            <h3>Before you render</h3>
                            <p className="lvp-note">Resolve blocked checks. Review notes help you catch issues that require listening or a visual preview.</p>
                            <ul>{exportChecks.map(check => <li key={check.id} data-level={check.level}>
                              <strong>{check.level === "block" ? "Blocked" : check.level === "review" ? "Review" : "Ready"}</strong> · {check.text}
                              {check.level !== "ready" && check.step !== 4 && <button type="button" disabled={busy} onClick={() => setStep(check.step)}>Open {check.step === 1 ? "soundtrack" : check.step === 2 ? "timing" : "look"}</button>}
                            </li>)}</ul>
                          </section>
                          {!p.alignment?.reviewed && (
                            <p className="lvp-note">
                              These captions have not been marked reviewed.
                              Listen before publishing.
                            </p>
                          )}
                          <button
                            type="button"
                            className="lvp-primary"
                            disabled={
                              busy ||
                              exportChecks.some(check => check.level === "block")
                            }
                            onClick={exportVideo}
                          >
                            <Film size={17} /> {resumeVideo?"Resume export":cleanExport?"Create clean video":"Create video"}
                          </button>
                          <p className="lvp-note obs-keep-open">Keep this screen open while it renders.</p>
                          <button type="button" disabled={busy||!project.cues.length} onClick={()=>void downloadReleaseKit()}><Download size={15}/> Download release kit · ZIP</button>
                          <p className="lvp-note">Includes full-song and selected-video SRT/VTT/LRC, approved lyrics, metadata and editable project data. Download your audio and finished videos separately. No distributor submission, loudness mastering or Spotify Canvas loop is performed.</p>
                          <div className="lvp-actions">
                            {(["srt", "vtt", "lrc", "json"] as const).map(
                              (type) => (
                                <button
                                  type="button"
                                  key={type}
                                  disabled={busy || !project.cues.length}
                                  onClick={() => captionDownload(type)}
                                >
                                  <Download size={15} />
                                  {type === "json"
                                    ? "Editable project"
                                    : type.toUpperCase()}
                                </button>
                              ),
                            )}
                          </div>
                          <p className="lvp-note">
                            SRT/VTT preserve line timing; LRC preserves line
                            starts. Editable JSON preserves word timestamps,
                            caption layers, and styles, but private media
                            references require this Studio account. The video
                            contains the finished styling and motion.
                          </p>
                          <label>
                            Restore editable project JSON
                            <input
                              type="file"
                              accept="application/json,.json"
                              disabled={busy}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                try {
                                  if (file.size > 600000)
                                    throw new Error(
                                      "Choose a project file under 600 KB.",
                                    );
                                  const data = JSON.parse(await file.text()),
                                    next = data.project;
                                  if (
                                    !isLyricProject(next) ||
                                    !next.pro ||
                                    next.pro.sourceSongId !== song.id ||
                                    next.pro.sourceAudioId !== p.sourceAudioId
                                  )
                                    throw new Error(
                                      "Choose project data for this song and audio version. Media from another project must be imported separately.",
                                    );
                                  edit({
                                    ...next,
                                    pro: {
                                      ...next.pro,
                                      updatedAt: expected.current ?? undefined,
                                    },
                                  });
                                } catch (err) {
                                  message(
                                    err,
                                    "The project data could not load.",
                                  );
                                }
                              }}
                            />
                          </label>
                          {p.sourceVideo && (
                            <a
                              href={assetUrl(p.sourceSongId, p.sourceVideo)}
                              download
                            >
                              Download untouched imported video
                            </a>
                          )}
                          {p.exports?.filter((e) => e.asset).length ? (
                            <details>
                              <summary>Saved finished videos</summary>
                              {p.exports
                                .filter((e) => e.asset)
                                .slice()
                                .reverse()
                                .map((e) => (
                                  <div key={e.id}>
                                    <a
                                      className="lvp-saved-video"
                                      key={e.id}
                                      href={assetUrl(p.sourceSongId, e.asset!)}
                                      download={`${fileBase}-${e.format}.${e.extension}`}
                                    >
                                      {formatLabels[e.format]} ·{" "}
                                      {e.at.slice(0, 16).replace("T", " ")} ·{" "}
                                      {e.extension.toUpperCase()}
                                    </a>
                                    <VideoLinkActions
                                      url={assetUrl(p.sourceSongId, e.asset!)}
                                      title={song.name}
                                    />
                                  </div>
                                ))}
                            </details>
                          ) : null}
                          {platform==="youtube"&&<label className="creator-post-caption">YouTube title<input data-testid="input-video-title" maxLength={100} value={videoTitle} disabled={busy} placeholder="Song name – Artist (Lyric Video)" onChange={e=>setVideoTitle(e.target.value)}/></label>}
                          <label className="creator-post-caption">{platform==="youtube"?"YouTube description":"Your social post caption"}<textarea data-testid="input-post-caption" rows={platform==="youtube"?7:4} maxLength={2000} value={postCaption} disabled={busy} placeholder="Tell listeners about this song…" onChange={e=>setPostCaption(e.target.value)}/></label>
                          <div className="actions">
                            <button type="button" className="secondary small" data-testid="button-write-post" disabled={busy} onClick={()=>{if(postCaption.trim()&&!confirm("Replace your caption with a new one?"))return;setPostCaption(readyPostCaption(platform,postSource()));if(platform==="youtube")setVideoTitle(postTextFor("youtube",postSource()).title);}}>✨ Write it for {videoPlatforms[platform].label}</button>
                            {platform==="youtube"&&<button type="button" className="text-button" data-testid="button-copy-title" disabled={!videoTitle.trim()} onClick={()=>{void navigator.clipboard?.writeText(videoTitle).then(()=>setStatus("YouTube title copied."),()=>setStatus("Select and copy the title from its box."));}}>Copy title</button>}
                          </div>
                          <p className="lvp-note">Download or share the finished file below. Upload destinations open your own account for review; nothing posts automatically.</p>
                          <button type="button" className="lvp-primary" disabled={busy} onClick={async()=>{if(await persist())window.location.assign(artistDashboardHref(song.id));}}>Publish song / manage visibility</button>
                          {outputs.map((output, i) => (
                            <div key={output.url} className="lvp-result" data-format={output.format}>
                              <h3>
                                {formatLabels[output.format]} ·{" "}
                                {output.extension.toUpperCase()}
                              </h3>
                              <video src={output.url} controls playsInline preload="metadata" aria-label={formatLabels[output.format]+" finished video"}/>
                              <p className="lvp-note">
                                Encoded: {output.codec}
                              </p>
                              <VideoPublishing
                                output={output}
                                title={song.name}
                                caption={postCaption}
                                platform={platform}
                                setPlatform={setPlatform}
                                format={output.format}
                              />
                            </div>
                          ))}
                        </section>
                      )}
                      <ProTimeline
                        project={project}
                        edit={edit}
                        audio={audio}
                        time={time}
                        seek={seek}
                        analyze={() => void analyze()}
                        busy={busy}
                        active={step===2}
                        request={captionEditRequest}
                      />
                      <details className="lvp-history">
                        <summary>
                          Project saving, versions &amp; recovery
                        </summary>
                        <fieldset disabled={busy}>
                          <label>
                            Project name
                            <input
                              value={p.name}
                              maxLength={150}
                              onChange={(e) =>
                                patchPro({ name: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            Version label
                            <input
                              value={versionName}
                              maxLength={100}
                              onChange={(e) => setVersionName(e.target.value)}
                              placeholder="e.g. Gold widescreen version"
                            />
                          </label>
                          <div className="lvp-actions">
                            <button
                              type="button"
                              onClick={() =>
                                void persist(true, versionName || p.name)
                              }
                            >
                              <Save size={15} /> Save version
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  await persist(
                                    true,
                                    p.name + " · before alternate",
                                  )
                                ) {
                                  patchPro({
                                    id: crypto.randomUUID(),
                                    name: p.name + " · Alternate",
                                  });
                                  setStatus(
                                    "Alternate visual version started. Restore the previous version from history at any time.",
                                  );
                                }
                              }}
                            >
                              Duplicate as alternate look
                            </button>
                            <button
                              type="button"
                              onClick={() => captionDownload("json")}
                            >
                              Download editable backup
                            </button>
                          </div>
                          {versionsError && <p role="alert">{versionsError}</p>}
                          <button type="button" disabled={versionsBusy || busy} onClick={() => void loadVersions(song.id)}>{versionsBusy ? "Loading history…" : "Refresh saved history"}</button>
                          {versions.length ? (
                            versions.slice(0, versionsLimit).map((v) => (
                              <div key={v.id} className="lvp-version">
                                <span>
                                  <strong>{v.name}</strong>
                                  <small>
                                    {v.at.slice(0, 16).replace("T", " ")}
                                  </small>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void restore(v.id)}
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void restore(v.id, true)}
                                >
                                  Open alternate
                                </button>
                              </div>
                            ))
                          ) : (
                            <p>
                              No history snapshots yet. Autosave keeps the
                              current edit; Save version creates a restorable
                              snapshot.
                            </p>
                          )}
                          {versionsLimit < versions.length && <button type="button" onClick={() => setVersionsLimit(n => n + 100)}>Show more saved versions</button>}
                          {versionsNext && <><p>More saved versions remain in storage. Load the next page to include them; the newest snapshot may be on another page.</p><button type="button" disabled={versionsBusy || busy} onClick={() => void loadVersions(song.id, versionsNext)}>Load next history page</button></>}
                        </fieldset>
                      </details>
                      </details>
                    </main>
                  </div></>
                )}
              </>
            )
          )}
          {operation && (
            <div className="lvp-operation" role="status">
              <strong>{operation}…</strong>
              {progress !== null && (
                <progress
                  max="1"
                  value={progress}
                  aria-label="Video export progress"
                />
              )}
              {controller.current && (
                <button
                  type="button"
                  onClick={() => controller.current?.abort()}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
          {error && (
            <div className="lvp-error" role="alert">
              {error}
              <button type="button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}
          {status && (
            <p className="lvp-status" role="status">
              {status}
            </p>
          )}
        </>
      )}
    </div>
  );
}
