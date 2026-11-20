"use client";
import {brand} from "./brand";
import {MobileProjectBar} from "./mobile-project-bar";
import {containDialogFocus} from "./dialog-focus";
import {deletionNotice} from "./song-deletion";
import {coverPng,coverStyleForTitle} from "./song-cover";
import {SongCoverDesigner} from "./song-cover-designer";
import {SongSectionEditor} from "./song-section-editor";
import {sectionCueMidi} from "./song-sections-midi";
import {downloadBlob} from "./lyric-pro-media";
import {BrandLogoDesigner} from "./brand-logo-designer";
import type {OverlayStyle} from "./lyric-overlay-designs";
import {uploadLyricAsset} from "./lyric-pro-media";
import {NewSongForm,SongTemplateBrowser} from "./new-song-form";
import {availableSongTemplates,isStudioPreset,songFromStarter} from "./song-presets";
import {CreditBadge} from "./credits/credit-panel";
import {productionFetch} from "./credits/client";
import {CosmicHomeHero,CosmicHomeSky,CosmicHomeStory} from "./cosmic-home";
import {MyVoices} from "./my-voices";
import {myVoiceUrl,type SavedVoice} from "./my-voice-data";
import {wordsOnlyResult} from "./production-result";
import { sameGenre, uniqueGenreNames } from "./music-genres";
import { GenrePicker } from "./genre-picker";
import {SongCard,SongHubProvider,type SongAction} from "./song-card";
import {sortSongs,type SongSort} from "./song-library";
import {SaveVoiceReference} from "./save-voice-reference";
import type {RegionOperation} from "./song-region-actions";

import { lyricVideoFor, pinnedMaster, projectRoot } from "./project-assets";
import { isStudio } from "./studio-validation";
import { mergeSavedSong, rebaseStudio, syncSongSource } from "./song-save-merge";
import { createSaveQueue } from "./save-queue";
import { canSendChanges, studioChanges } from "./studio-changes";
import { ProjectAssets, ProjectComparison } from "./project-production";
import { DraftRecoveryProvider, RecoveryPanel, useDraftRecovery } from "./draft-recovery";
import {claimAutomaticSongRecovery,retryAutomaticSongRecovery} from "./song-recovery-session";
import { HelpControl, HelpField } from "./help-tip";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Trash2, ArrowDown, ArrowLeft, ArrowRight, Check, ChevronRight, Film, ClipboardList, Copy, FileText, GitCompareArrows, Layers3, ListMusic, LockKeyhole, Mic, Plus, Radio, Search, Settings2, Sparkles, Upload, X } from "lucide-react";
import { audioAccept, audioFormatsLabel, artNames, emptyNotes, fields, freshSong, initialStudio, isAudioFormat, maxAudioBytes, songAudioUrl, stages, styles, tasks, type Field, type Folder, type Mix, type Song, type Studio, type Template } from "./studio-data";

import { StudioWelcome } from "./studio-welcome";
import { ElevenLabsSettingsPanel, useElevenLabsKey } from "./elevenlabs-key";
import {MusicEngineSettings,useMusicEngine} from "./music-engine-settings";
import { isInstrumental, type Instrumental } from "./creation-guide";
import { InstrumentalExports, SeparatedStems } from "./production-exports";
import { artistDashboardHref,type ArtistDashboard } from "./community/data";
import { QuickCreate, type QuickSeed } from "./quick-create";
import { CreateStudio } from "./create-studio";
import { PartySpotlight } from "./party/spotlight";
import { RadioWorkspace } from "./radio";
import { SharedRadio } from "./shared-radio";
import { AudioActions } from "./audio-actions";
import { AudioPlayer } from "./audio-player";
import { ListenerSettings } from "./listener-settings";
import { ReleaseTools } from "./release-tools";
import { ArtistConsole } from "./community/artist-dashboard/studio";
import { PanelErrorBoundary } from "./panel-error-boundary";
import {JobStatus} from "./job-status";
import {makeSavedSongPrompt,savedPromptFromSong,sameSavedPrompt,type PromptDraft} from "./saved-song-prompts";
import { VocalStudio } from "./vocal/vocal-studio";
import type { Role } from "./vocal/session";
import { SavedLyricVideos } from "./saved-lyric-videos";
import { CleanLyricsChecker } from "./clean-lyrics-checker";
import { cleanWordsMessage, hasExplicitWords, isExplicitSong } from "./clean-content";
import { bestShortStart } from "./creation-shortcuts";
import { songWaveformAnalysis } from "./song-waveform";

import { MusicWorkflow, type WorkflowStep } from "./music-workflow";
import { MeditativeVibes } from "./meditative-vibes";
import { MusicLibrary } from "./music-library";
import { InternationalMusicTent } from "./international-music-tent";
import { PromptLab, VocalDirector } from "./music-creation-tools";
import { emptyDiscovery, type CreateSeed } from "./music-workspace-data";

import { StudioNavigation, ScreenContextHelp, ScreenSections, ContextBack, workspaceNavigation, type WorkspaceView as View } from "./studio-navigation";
import { HologramScope, HologramVideoDescription, HologramOriginalsLine, HologramStartSongNote } from "./hologram-slogan";
import { resolveLocation, screenHome, screenOf, studioUrl, type Screen } from "./studio-routes";
import { ExploreScreen, PlanCreditsScreen, PromoteScreen, RadioSourceSwitch, RecordSwitch, type ExploreTab, type PlanTab, type RadioSource } from "./studio-screens";
import { StudioQuickTour } from "./studio-tour";
import { SongSky, SongSkyToggle } from "./song-sky";
// Heavy editors download only when first opened, not before the Studio can be used.
const RecordingDesk = lazy(() => import("./recording-desk").then(m => ({ default: m.RecordingDesk })));
const Multitrack = lazy(() => import("./multitrack").then(m => ({ default: m.Multitrack })));
const LyricVideoPro = lazy(() => import("./lyric-video-pro").then(m => ({ default: m.LyricVideoPro })));
const opening = <p className="muted" role="status">Opening…</p>;
const noFolders: Folder[] = [];

type Tab = "Writing" | "Production" | "Visuals & promo" | "Mix lab" | "Release";
const tabs: Tab[] = ["Writing", "Production", "Visuals & promo", "Mix lab", "Release"];
const uid = () => crypto.randomUUID();
const tagsFrom = (text: string) => uniqueGenreNames(text.split(","));
const dateText = (date: string) => new Date(date.length === 10 ? date + "T12:00:00" : date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function Artwork({ art, small = false }: { art: number; small?: boolean }) {
  return <div aria-hidden="true" className={`art art-${art % 4} ${small ? "art-small" : ""}`}><div className="disc"><i/><i/><i/><b>✧</b></div></div>;
}
function Badge({ stage }: { stage: string }) {
  return <span className={`stage stage-${stages.indexOf(stage)}`}><i/>{stage}</span>;
}
function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="section"><div className="section-head"><h2>{title}</h2>{action}</div>{children}</section>;
}

export default function Studio({ signOut, creatorName }: { signOut: string; creatorName?: string }) {
  const [data, setData] = useState<Studio>(creatorName ? { ...initialStudio, songs: [] } : initialStudio);
  const [revision, setRevision] = useState(0);
  // Create can resolve and auto-save a prompt before React's next render; keep the committed song and revision available synchronously.
  const dataRef=useRef(data),revisionRef=useRef(revision);
  dataRef.current=data;revisionRef.current=revision;
  const [loaded, setLoaded] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const elevenLabs = useElevenLabsKey();
  const musicEngine=useMusicEngine(workspaceId);
  const [saving, setSaving] = useState(false);
  const duplicateIntents=useRef(new Map<string,string>());
  const [creating,setCreating]=useState(false);
  const [releaseBusy,setReleaseBusy]=useState(false),[releaseLoaded,setReleaseLoaded]=useState(false),[releaseMap,setReleaseMap]=useState<Record<string,{status:string;releaseId?:string}>>({});
  const releaseRequest=useRef(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [beginner,setBeginner]=useState(true);
  useEffect(()=>{if(workspaceId){try{setBeginner(localStorage.getItem(`samadhi:pro-tools:${workspaceId}`)!=="on");}catch{}}},[workspaceId]);
  function changeBeginner(value:boolean){setBeginner(value);try{if(workspaceId)localStorage.setItem(`samadhi:pro-tools:${workspaceId}`,value?"off":"on");}catch{}}
  const [view, setView] = useState<View>("overview");
  const [pane,setPane]=useState<"plan-credits"|null>(null);
  const [exploreTab,setExploreTab]=useState<ExploreTab>("radio"),[planTab,setPlanTab]=useState<PlanTab>("membership");
  const fromHistory=useRef(false);
  const [quickSeed,setQuickSeed]=useState<QuickSeed|null>(null);
  const [artistOpen,setArtistOpen]=useState(false);
  const [radioSource,setRadioSource]=useState<RadioSource>("personal"),[sharedOpened,setSharedOpened]=useState(false);
  function chooseRadioSource(next:RadioSource){setRadioSource(next);if(next==="community")setSharedOpened(true);try{window.history.replaceState(null,"",`${window.location.pathname}?studio=explore${next==="community"?"&section=community-radio":""}`);}catch{}}
  const [promptSeed, setPromptSeed] = useState<CreateSeed | null>(null);
  const [createSeed, setCreateSeed] = useState<CreateSeed | null>(null);
  const [firstSongRequest, setFirstSongRequest] = useState(false);
  const finishFirstSongRequest = useCallback(() => setFirstSongRequest(false), []);
  const [showCreationDrafts, setShowCreationDrafts] = useState(false);
  const [deskOpened, setDeskOpened] = useState(false);
  const [deskMode, setDeskMode] = useState<"record" | "podcast">("record");
  const [vocalInput, setVocalInput] = useState<{ blob: Blob; title: string; role: Role; projectId?: string } | null>(null);
  const createPane = useRef<HTMLDivElement>(null);
  const [tentOpened, setTentOpened] = useState(false);
  const [vocalOpened, setVocalOpened] = useState(false);
  const [mixOpened, setMixOpened] = useState(false);
  const [workflowSong, setWorkflowSong] = useState("");
  const [mixInput, setMixInput] = useState<{ blob: Blob; title: string; projectId?: string; baseSongId?:string; kind?: "stems" } | null>(null);
  const captureActive = useRef(false);
  const [capturing, setCapturing] = useState(false);
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState<Tab>("Writing");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [stage, setStage] = useState("");
  const [explicitView, setExplicitView] = useState(false);
  const [archiveView, setArchiveView] = useState(false);
  const [songSort,setSongSort]=useState<SongSort>("newest"),[draftsOnly,setDraftsOnly]=useState(false),[songPreview,setSongPreview]=useState(""),[songExpanded,setSongExpanded]=useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [libraryMode,setLibraryMode]=useState<"sky"|"list">("sky");
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const folders = data.folders ?? noFolders;
  const songTemplates = availableSongTemplates(data.templates);
  const [autoCaptionRequest, setAutoCaptionRequest] = useState<{ songId: string; id: string } | null>(null);
  const [vocalVoiceId, setVocalVoiceId] = useState("");
  const [coverBusy,setCoverBusy]=useState(false);
  const [coverSongId,setCoverSongId]=useState("");
  const [sectionInitialAction,setSectionInitialAction]=useState<RegionOperation>("remove");
  const [coverVideoRequest,setCoverVideoRequest]=useState<{id:string;songId:string;asset:string;overlay:OverlayStyle}|null>(null);
  const [socialVideoRequest,setSocialVideoRequest]=useState<{id:string;songId:string;look?:string;photoAsset?:string;footage?:{asset:string;duration:number};audioId?:string;start?:number;seconds?:number}|null>(null);
  const [lyricSongId, setLyricSongId] = useState("");
  const [modal, setModal] = useState<"new" | "upload" | "template" | "help" | "tour" | "connections" | "cover" | "logo" | "sections" | "stems-midi" | "save-voice" | null>(null);
  const [undoPromptFavorite,setUndoPromptFavorite]=useState<{id:string;favorite?:boolean}|null>(null);
  const modalBusy = modal === "cover"||modal === "logo"||modal === "sections"||modal === "stems-midi"?coverBusy||saving:modal === "connections" ? elevenLabs.busy : saving;
  const [uploadForVideo, setUploadForVideo] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<Song | null>(null);
  const [chosenTemplate, setChosenTemplate] = useState("");
  const [templateEdit, setTemplateEdit] = useState<Template | null>(null);
  const [compareSong, setCompareSong] = useState("");
  const pendingSave = useRef(false);
  const saveQueue = useRef<ReturnType<typeof createSaveQueue> | null>(null);
  if (!saveQueue.current) saveQueue.current = createSaveQueue(() => pendingSave.current);
  const hasDraft = useRef(false);
  // The library exactly as the server last confirmed it. Only set from server
  // responses, so a changes-only save is always measured against stored data.
  const confirmedRef = useRef<{ data: Studio; revision: number } | null>(null);

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/studio", { cache: "no-store" });
      const result = await response.json().catch(() => null) as { error?: string; data?: Studio; revision: number; workspace?: string;warning?:string } | null;
      if (!response.ok || !result || !Number.isSafeInteger(result.revision))
        throw new Error(result?.error || "The studio could not load. Try again.");
      if (result.data) {
        if (!isStudio(result.data)) throw new Error("The saved workspace could not be read safely. Your account data has not been changed. Try again or contact support.");
        dataRef.current=result.data;setData(result.data);
      }
      if (result.workspace) setWorkspaceId(result.workspace);
      revisionRef.current=result.revision;setRevision(result.revision);
      confirmedRef.current=result.data?{data:result.data,revision:result.revision}:null;
      setLoaded(true);
      if(result.warning)setError(result.warning);
    } catch (e) { setError(e instanceof Error ? e.message : "Studio unavailable. Try again."); }
  }
  const [recoveringSongs,setRecoveringSongs]=useState(false);
  async function recoverUnfinishedSongs(automatic=false){
    if(recoveringSongs||saving||pendingSave.current||hasDraft.current)return;
    if(automatic&&!claimAutomaticSongRecovery(workspaceId))return;
    setRecoveringSongs(true);
    try{
      const response=await fetch("/api/studio/recover-songs",{method:"POST",headers:{"Content-Type":"application/json","X-Studio-Workspace":workspaceId},body:"{}"});
      const result=await response.json() as {error?:string;recovery?:{pending:number}};
      if(!response.ok)throw new Error(result.error??"Recovery could not finish. Your recordings are preserved.");
      await load();
      if(result.recovery?.pending){retryAutomaticSongRecovery(workspaceId);console.warn("Some saved recordings are still awaiting automatic recovery; audio is preserved.");}
    }catch{retryAutomaticSongRecovery(workspaceId);console.warn("Automatic song recovery did not finish; existing recordings are preserved.");}
    finally{setRecoveringSongs(false);}
  }
  useEffect(() => { void load(); }, []);
  useEffect(()=>{
    if(view==="songs"&&loaded&&workspaceId&&!pendingSave.current&&!hasDraft.current)void recoverUnfinishedSongs(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  },[view,loaded,workspaceId]);
  const jobCompleted=useRef(()=>{});
  jobCompleted.current=()=>{if(!pendingSave.current&&!hasDraft.current)void load();};
  const refreshCompletedJobs=useRef(()=>jobCompleted.current()).current;
  useEffect(()=>{
    if(!loaded||!workspaceId)return;
    try{if(localStorage.getItem(`samadhi:guided-tour:v1:${workspaceId}`)!=="done")setModal(current=>current??"tour");}
    catch{setModal(current=>current??"tour");}
  },[loaded,workspaceId]);
  const releaseSignature=JSON.stringify(data.songs.map(s=>[s.id,s.audioId,s.audioFormat,s.deletedAt,s.creationDraft,s.explicit]));
  useEffect(()=>{if(!loaded||!workspaceId)return;let current=true;const token=++releaseRequest.current;setReleaseLoaded(false);void fetch("/api/community?dashboard=1",{cache:"no-store"}).then(async response=>{if(!response.ok)return;const dashboard=await response.json() as ArtistDashboard;if(!Array.isArray(dashboard.songs))return;if(current&&token===releaseRequest.current){setReleaseMap(Object.fromEntries(dashboard.songs.map(s=>[s.songId,{status:s.status,releaseId:s.releaseId}])));setReleaseLoaded(true);}}).catch(()=>{});return()=>{current=false;};},[loaded,workspaceId,releaseSignature]);
  function applyLocation(push:boolean){const r=resolveLocation(window.location.search,window.location.hash);if(!r)return false;fromHistory.current=!push;
    if(r.screen==="plan-credits"){if(canNavigate(null)){setPane("plan-credits");setSelected("");if(r.section==="plans"||r.section==="credits"||r.section==="membership")setPlanTab(r.section);}fromHistory.current=false;return true;}
    if(r.screen==="explore"&&r.section&&["radio","discover","party","listening-room"].includes(r.section))setExploreTab(r.section as ExploreTab);
    if(r.screen==="explore"&&(r.section==="community-radio"||r.section==="radio")){setExploreTab("radio");setRadioSource(r.section==="community-radio"?"community":"personal");if(r.section==="community-radio")setSharedOpened(true);}
    navigate(r.legacy??r.view);fromHistory.current=false;
    if(r.section==="artist-dashboard")setArtistOpen(true);
    if(r.song&&r.release){setSelected(r.song);setTab("Release");}
    else if(r.song){if(r.view==="songs")setSongExpanded(r.song);else if(r.view==="lyric-video")setLyricSongId(r.song);else setWorkflowSong(r.song);}
    return true;}
  const applyLocationRef=useRef(applyLocation),navigateRef=useRef(navigate);
  useEffect(()=>{applyLocationRef.current=applyLocation;navigateRef.current=navigate;});
  // Initial URL entry and back/forward both go through the resolver; the initial apply is deferred to a frame so it runs after mount.
  useEffect(()=>{const frame=requestAnimationFrame(()=>applyLocationRef.current(false));const pop=()=>{if(!applyLocationRef.current(false)){fromHistory.current=true;navigateRef.current("overview");fromHistory.current=false;}};window.addEventListener("popstate",pop);return()=>{cancelAnimationFrame(frame);window.removeEventListener("popstate",pop);};},[]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  useEffect(()=>{if(!loaded)return;const params=new URLSearchParams(window.location.search),recording=params.get("song");if(resolveLocation(window.location.search,window.location.hash)?.screen!=="songs"||!recording)return;const found=data.songs.find(s=>s.id===recording);if(found){setArchiveView(!!found.deletedAt);setSongExpanded(found.id);setSelected("");requestAnimationFrame(()=>document.querySelector(`[data-song-id="${found.id}"]`)?.scrollIntoView({block:"center"}));}},[loaded]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const close = (e: KeyboardEvent) => { if (e.key === "Escape" && !modalBusy) { if(modal==="tour")finishTour();else setModal(null); } };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [modal, modalBusy]);

  useEffect(()=>{if(!modal)return;const trigger=document.activeElement as HTMLElement|null;const dialog=document.querySelector<HTMLElement>('.modal-shade [role="dialog"]');if(dialog)return containDialogFocus(dialog,trigger);},[modal]);

  // A save that arrives while another is running waits its turn instead of being
  // dropped. Function arguments are evaluated when the save actually runs, so a
  // queued save is built from the newest saved library and revision.
  async function saveRequest(url: string, request: RequestInit | (() => RequestInit), message: string, next?: Studio | (() => Studio), throwOnError = false) {
    if (!loaded) return null;
    return saveQueue.current!(() => sendSaveRequest(url, request, message, next, throwOnError));
  }
  async function sendSaveRequest(url: string, prepare: RequestInit | (() => RequestInit), message: string, prepared?: Studio | (() => Studio), throwOnError = false) {
    pendingSave.current = true; setError(""); setSaving(true);
    try {
      const request = typeof prepare === "function" ? prepare() : prepare;
      const next = typeof prepared === "function" ? prepared() : prepared;
      const headers = new Headers(request.headers);
      if(url==="/api/studio")headers.set("X-Studio-Deletion-Policy","14-days-v1");
      if (workspaceId) headers.set("X-Studio-Workspace", workspaceId);
      const response = await (url === "/api/studio/create" ? productionFetch : fetch)(url, { ...request, headers });
      const result = await response.json().catch(() => null) as { error?: string; data?: Studio; revision: number; songId?: string;songIds?:string[];engineNotice?:string;warning?:string;lyrics?:string } | null;
      if (!response.ok && result?.data && Number.isSafeInteger(result.revision)) {
        dataRef.current=result.data;setData(result.data);revisionRef.current=result.revision;setRevision(result.revision);
        confirmedRef.current={data:result.data,revision:result.revision};
      }
      if (wordsOnlyResult(response.ok, result)) { setToast(message); return result; }
      if (!response.ok || !result || !Number.isSafeInteger(result.revision)) throw new Error(result?.error ?? (url === "/api/studio/create"
        ? "The production result could not be confirmed. Keep this tab open and check Your songs and your provider history before generating again to avoid a duplicate charge."
        : "The save could not be confirmed. Keep this tab open and retry."));
      const savedData = result.data ?? next;
      if (savedData) {dataRef.current=savedData;setData(savedData);}
      revisionRef.current=result.revision;setRevision(result.revision); setToast(message);
      confirmedRef.current=result.data?{data:result.data,revision:result.revision}:null;
      if(result.warning)setError(result.warning);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed. Try again.");
      if (throwOnError) throw e;
      return null;
    }
    finally { pendingSave.current = false; setSaving(false); }
  }
  async function commit(next: Studio, message: string) {
    setUndoPromptFavorite(null);
    const latest=dataRef.current;
    if(next.songs.some(s=>!!s.deletedAt!==!!latest.songs.find(old=>old.id===s.id)?.deletedAt)){releaseRequest.current++;setReleaseLoaded(false);}
    // Callers build `next` from this render's `data`. If anything newer was saved
    // since (an earlier queued save, a finished job), replay only this edit's
    // changes on top of it instead of sending the older copy back.
    const base = data;
    let payload: Studio | undefined;
    const prepared = () => payload ??= dataRef.current === base ? next : rebaseStudio(base, next, dataRef.current);
    // Send only what changed when the server-confirmed copy is current;
    // otherwise (or if unsure) send the whole library as before.
    const body = (payload: Studio) => {
      const confirmed = confirmedRef.current;
      return confirmed && confirmed.revision === revisionRef.current && canSendChanges(confirmed.data, payload)
        ? { changes: studioChanges(confirmed.data, payload), revision: revisionRef.current }
        : { data: payload, revision: revisionRef.current };
    };
    return !!(await saveRequest("/api/studio", () => ({
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body(prepared())),
    }), message, prepared));
  }
  async function createRequest(payload: Record<string, unknown>, message: string, throwOnError = false) {
    try{const result=await saveRequest("/api/studio/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, message, undefined, throwOnError);
    if(!result)retryAutomaticSongRecovery(workspaceId);
    if(result?.engineNotice)setToast(result.engineNotice);
    return result;
    }catch(error){retryAutomaticSongRecovery(workspaceId);throw error;}
  }
  const saveSong = (song: Song, message = "Song saved") => commit({ ...data, songs: data.songs.map(s => s.id === song.id ? song : s) }, message);
  async function saveMelodyReference(songId:string,blob:Blob,durationSeconds:number){
    const before=dataRef.current.songs.find(song=>song.id===songId&&!song.deletedAt);
    if(!before)throw new Error("The saved song could not be found. The recording remains in Create.");
    const assetId=await uploadLyricAsset(songId,"reference",blob,undefined,before.audioId??before.id);
    const latest=dataRef.current;
    const song=latest.songs.find(item=>item.id===songId&&!item.deletedAt);
    if(!song)throw new Error("The song changed before its private reference could be saved. Check Your songs.");
    const contentType=(blob.type||"audio/webm").split(";")[0].toLowerCase();
    const melodyReference={assetId,contentType,durationSeconds:Math.max(1,Math.min(300,Math.round(durationSeconds))),savedAt:new Date().toISOString()};
    return commit({...latest,songs:latest.songs.map(item=>item.id===songId?{...item,melodyReferences:[...(item.melodyReferences??[]),melodyReference]}:item)},"Private melody reference saved");
  }
  async function archiveSong(song:Song){
    if(!confirm(`Delete “${song.name}”? ${deletionNotice} Any Community release will be unlisted. Download anything you want to keep before deleting.`))return false;
    const saved=await saveSong({...song,deletedAt:new Date().toISOString()},"Song deleted · recoverable for 30 days");if(saved&&songPreview===song.id)setSongPreview("");return saved;
  }
  async function duplicateSong(song:Song){
    if(saving)return false;setSaving(true);setError("");
    const copyId=duplicateIntents.current.get(song.id)??uid();duplicateIntents.current.set(song.id,copyId);
    try{
      const response=await fetch("/api/studio/song-actions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"duplicate",songId:song.id,id:copyId})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error??"The copy could not be confirmed. Your original is safe.");
      await load();duplicateIntents.current.delete(song.id);setToast("Audio, words and matching captions copied privately. Artwork, exported videos and hum takes stay with the original.");return true;
    }catch(error){setError(error instanceof Error?error.message:"The copy could not save.");return false;}
    finally{setSaving(false);}
  }
  async function publishSong(song:Song){if(song.creationDraft&&!await saveSong({...song,creationDraft:false},"Recording ready for release review"))return;if(navigate("songs"))openSong(song.id,"Release");}
  async function unlistSong(song:Song){
    if(!confirm(`Unlist “${song.name}” from Community? Your private song and its originals remain saved.`))return false;
    setReleaseBusy(true);setReleaseLoaded(false);releaseRequest.current++;try{const response=await fetch("/api/community",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"unlist",id:song.id})}),result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error??"The release could not be unlisted.");setReleaseMap(map=>({...map,[song.id]:{...map[song.id],status:"Unlisted"}}));setReleaseLoaded(true);setToast("Release unlisted. Your creation is preserved.");return true;}catch(e){setError(e instanceof Error?e.message:"Try unlisting again.");return false;}finally{setReleaseBusy(false);}
  }
  async function addSongPlaylist(song:Song,id:string){
    const current=data.station??{skin:"cosmic" as const},lists=current.customPlaylists??[];
    if(id==="__new"){
      const name=prompt("Name your private playlist","")?.trim();if(!name)return false;
      if(name.length>60||hasExplicitWords(name)){setError("Use a positive playlist name up to 60 characters.");return false;}
      if(lists.length>=30){setError("Your playlist collection is full. Choose an existing playlist.");return false;}
      return commit({...data,station:{...current,customPlaylists:[...lists,{id:uid(),name,tracks:[song.id]}]}},"Private playlist created");
    }
    const list=lists.find(p=>p.id===id);if(!list)return false;
    return commit({...data,station:{...current,customPlaylists:lists.map(p=>p.id===id?{...p,tracks:[...new Set([...p.tracks,song.id])]}:p)}},"Added to private playlist");
  }
  async function saveReusablePrompt(input:PromptDraft){const current=dataRef.current;const preset=makeSavedSongPrompt(input,"prompt-"+uid());const existing=current.templates.find(t=>t.id.startsWith("prompt-")&&sameSavedPrompt(t,preset));if(existing){setToast("This prompt is already saved privately.");return existing;}return await commit({...current,templates:[preset,...current.templates]},"Prompt saved privately for reuse")?preset:undefined;}
  async function favoriteReusablePrompt(id:string,favorite:boolean){
    const latest=dataRef.current;const current=latest.templates.find(t=>t.id===id&&t.id.startsWith("prompt-"));
    if(!current)return false;
    const previous=current.favorite;
    if(!await commit({...latest,templates:latest.templates.map(t=>t.id===id?{...t,favorite}:t)},"Prompt favorite updated"))return false;
    setUndoPromptFavorite({id,favorite:previous});
    return true;
  }
  async function undoFavoritePrompt(){
    const previous=undoPromptFavorite;
    if(!previous)return;
    const latest=dataRef.current;const current=latest.templates.find(t=>t.id===previous.id);
    if(!current){setUndoPromptFavorite(null);return;}
    if(await commit({...latest,templates:latest.templates.map(t=>{if(t.id!==previous.id)return t;const restored={...t};if(previous.favorite===undefined)delete restored.favorite;else restored.favorite=previous.favorite;return restored;})},"Prompt favorite restored"))
      setToast("Prompt favorite restored.");
  }
  async function setPromptAutoSave(enabled:boolean){
    await commit({...dataRef.current,autoSavePrompts:enabled},enabled?"Automatic prompt saving is on":"Automatic prompt saving is off");
  }
  function lastUsedVideoLook(){try{return localStorage.getItem("samadhi:last-video-look:v1")||undefined;}catch{return undefined;}}
  function finishTour(){
    if(workspaceId){try{localStorage.setItem(`samadhi:guided-tour:v1:${workspaceId}`,"done");}catch{}}
    setModal(null);
  }
  function songAction(action:SongAction,song:Song){
    if(action==="save-voice"){setCoverSongId(song.id);setModal("save-voice");return;}
    if(action==="sections"){setCoverSongId(song.id);setSectionInitialAction("remove");setModal("sections");return;}
    if(action==="extend"||action==="redo-part"){setCoverSongId(song.id);setSectionInitialAction(action==="extend"?"insert":"replace");setModal("sections");return;}
    if(action==="stems-midi"){setCoverSongId(song.id);setModal(action);return;}
    if(action==="logo"){if(navigate("promote"))setCoverSongId(song.id);return;}
    if(action==="cover"){setCoverSongId(song.id);setModal("cover");return;}
    if(action==="save-prompt"){void saveReusablePrompt(savedPromptFromSong(song));return;}
    if(action==="remix"){remix(song);return;}
    if(action==="regenerate"){navigate("create",false,{projectId:projectRoot(data.songs,song).id,title:song.name.slice(0,84)+" · New version",genres:uniqueGenreNames(song.tags),idea:song.notes.prompt.slice(0,1000)||song.summary||"A new arrangement",lyrics:song.notes.lyrics.slice(0,5000),vocal:song.notes.vocals,seconds:song.creationSeconds,instrumental:song.creationKind==="instrumental",sectionDirections:song.sectionDirections});return;}
    if(action==="make-like-this"){
      const profile=song.generation?.languageProfile;
      const languageChoice=profile?.resolved?{language:profile.resolved,dialect:profile.dialect??""}:undefined;
      if(navigate("overview"))setQuickSeed({id:uid(),projectId:projectRoot(data.songs,song).id,title:song.name,idea:song.notes.prompt.slice(0,1000)||song.summary||"A new song inspired by this one",styles:uniqueGenreNames(song.tags),lyrics:song.notes.lyrics.slice(0,5000),vocal:song.notes.vocals,languageChoice,custom:true,notice:"Song details copied into Create. Edit anything you like, then press Create when ready."});
      return;
    }
    if(action==="mix"){
      void (async()=>{try{const response=await fetch(songAudioUrl(song.id,song.audioId));if(!response.ok)throw new Error("This recording could not load for mixing.");const blob=await response.blob();if(navigate("multitrack"))setMixInput({blob,title:song.name,projectId:projectRoot(data.songs,song).id});}catch(e){setError(e instanceof Error?e.message:"The mixer could not open this recording.");}})();return;
    }
    if(action==="record"){openWorkflow("record",song);return;}
    if(action==="short-video"){
      if(navigate("lyric-video")){
        const id=uid(),look=lastUsedVideoLook(),sections=song.lyricVideo?.pro?.sections??[];
        const duration=song.lyricVideo?.pro?.duration??song.creationSeconds??0;
        const fallbackStart=bestShortStart(duration,sections,[],30);
        setLyricSongId(song.id);setSocialVideoRequest({id,songId:song.id,look,start:fallbackStart,seconds:30});
        if(!song.lyricVideo?.cues.length&&song.creationKind!=="instrumental")setAutoCaptionRequest({songId:song.id,id:uid()});
        if(song.audioFormat)void songWaveformAnalysis(songAudioUrl(song.id,song.audioId),new AbortController().signal).then(analysis=>{
          const start=bestShortStart(analysis.duration,sections,analysis.peaks,30);
          setSocialVideoRequest(current=>current?.id===id?{...current,start}:current);
        }).catch(()=>{});
      }
      return;
    }
    if(action==="auto-video"){if(navigate("lyric-video")){setLyricSongId(song.id);setAutoCaptionRequest({songId:song.id,id:uid()});}return;}
    if(action==="video"){openWorkflow("video",song);return;}
    if(action==="export"){if(navigate("songs"))openSong(song.id,"Release");return;}
    if(navigate("songs"))openSong(song.id,action==="artwork"?"Visuals & promo":action==="release"?"Release":action==="master"||action==="versions"?"Mix lab":"Writing");
  }
  function canNavigate(next:View|null) {
    if(creating){setToast("Let this creation finish saving before changing workspaces.");return;}
    if (captureActive.current && next !== view) { setToast("Stop the take before leaving this recording workspace."); return; }
    if (pendingSave.current||releaseBusy) { setToast("Wait for the current save to finish."); return; }
    if (hasDraft.current && !confirm("Leave this song and discard unsaved changes?")) return;
    return true;
  }
  function leaveStudio(href:string){if(canNavigate(null))window.location.assign(href);}
  function navigate(next: View, toCreationDrafts = false, seed: CreateSeed | null = null): true | undefined {
    if(next==="prompt-lab"||next==="vocal-director"||next==="templates"){
      if(!navigate("overview"))return;
      setQuickSeed({...(seed?quickFromCreate(seed):{}),id:uid(),custom:next!=="templates"||undefined,panel:next==="prompt-lab"?"prompts":next==="vocal-director"?"vocals":"recipes"});
      return true;
    }
    if(next==="create"){
      // Detailed production now lives in Create > Custom > Pro production (same screen, no parallel page).
      if(!navigate("overview"))return;
      setShowCreationDrafts(toCreationDrafts); setCreateSeed(seed);
      setQuickSeed({id:uid(),custom:true,panel:"pro"});
      return true;
    }
    if(next==="releases"||next==="distribution"){
      if(!navigate("songs"))return;
      if(!fromHistory.current)setToast("Open a song and choose Release for its checklist and export tools.");
      return true;
    }
    if(!canNavigate(next))return;
    hasDraft.current = false;
    setAutoCaptionRequest(null);setSocialVideoRequest(null);setCoverVideoRequest(null);
    if (next === "recording" || next === "podcast") { setDeskOpened(true); setDeskMode(next === "podcast" ? "podcast" : "record"); }
    if (next === "international-tent") setTentOpened(true);
    if (next === "vocal-studio") setVocalOpened(true);
    if (next === "multitrack") setMixOpened(true);
    setWorkflowSong("");
    setError(""); setSelected(""); setView(next); setPane(null); window.scrollTo(0, 0);
    if(!fromHistory.current){try{const url=studioUrl(window.location.pathname,next,next===view?new URLSearchParams(window.location.search).get("song")??undefined:undefined);if(url!==window.location.pathname+window.location.search)window.history.pushState(null,"",url);}catch{}}
    return true;
  }
  function quickFromCreate(seed:CreateSeed):Omit<QuickSeed,"id">{return {projectId:seed.projectId,idea:seed.idea,styles:seed.genres,lyrics:seed.lyrics,vocal:seed.vocal,title:seed.title,custom:!!(seed.lyrics||seed.vocal||seed.genres?.length),notice:"Loaded into Create. Review, then press Create when you are ready."};}
  // The main page's welcome and worlds lead straight into the song box.
  function focusCreateBox(){
    const still=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("quick-create-heading")?.scrollIntoView({behavior:still?"auto":"smooth",block:"start"});
    window.setTimeout(()=>document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"],[data-testid="input-song-idea"]')?.focus({preventScroll:true}),still?0:400);
  }
  // A saved voice becomes its own song, then opens LyriVid with automatic captions.
  async function voiceLyricVideo(voice:SavedVoice){
    const response=await fetch(myVoiceUrl(voice.id),{cache:"no-store"});
    if(!response.ok)throw new Error("The saved voice could not be opened.");
    const blob=await response.blob(),file=new File([blob],voice.name,{type:blob.type||voice.mime});
    const result=await sendAudio(file,voice.name.slice(0,100),null);
    if(result?.songId&&navigate("lyric-video")){setLyricSongId(result.songId);setAutoCaptionRequest({songId:result.songId,id:uid()});}
  }
  function sendToCreate(seed:CreateSeed){if(navigate("overview"))setQuickSeed({...quickFromCreate(seed),id:uid()});}
  function openScreen(screen:Screen){
    if(screen==="plan-credits"){if(!canNavigate(null))return;setPane("plan-credits");setSelected("");try{window.history.pushState(null,"",`${window.location.pathname}?studio=plan-credits&section=${planTab}`);}catch{}window.scrollTo(0,0);return true;}
    if(screenOf(view)===screen&&!pane&&!selected)return true;
    return navigate(screenHome[screen]);
  }
  function remix(song: Song) {
    // A sung song remixes into a fresh take in Create with its words, style, singer and language copied in.
    // (Recording your own voice over it stays one tap away: Record my voice & mix.)
    if (!isInstrumental(song.instrumental)) { songAction("make-like-this", song); return; }
    const settings = song.instrumental;
    navigate("create", false, { projectId: projectRoot(data.songs, song).id, title: song.name.slice(0, 86) + " · Remix", genres: uniqueGenreNames(song.tags),
      idea: song.notes.prompt.slice(0, 1000) || "A fresh arrangement of " + song.name,
      instrumental: true, instrumentSettings: settings });
  }
  const saveDiscovery = (discovery: NonNullable<Studio["discovery"]>) => commit({ ...data, discovery }, "Music collection saved");
  function openWorkflow(step: WorkflowStep, song?: Song) {
    const seed = song ? {
      projectId: projectRoot(data.songs, song).id, title: song.name, genres: uniqueGenreNames(song.tags), idea: song.notes.prompt.slice(0, 1000) || song.summary.slice(0, 1000),
      lyrics: song.notes.lyrics.slice(0, 5000), vocal: song.notes.vocals.slice(0, 1000),
      seconds: song.creationSeconds, sectionDirections: song.sectionDirections, instrumental: song.creationKind === "instrumental" ? true : song.notes.lyrics.trim() ? false : undefined,
    } : null;
    if (step === "idea") { newSong(); return; }
    const target: View = {
      prompt: "prompt-lab", lyrics: "overview", generate: "create", record: "vocal-studio", edit: "songs",
      mix: "multitrack", master: "compare", video: "lyric-video", release: "releases",
      template: "templates", podcast: "podcast", distribution: "distribution",
    }[step] as View;
    if (!navigate(target, false, seed)) return;
    setWorkflowSong(song?.id ?? "");
    if (song && step === "lyrics") openSong(song.id, "Writing");
    if (song && step === "edit") openSong(song.id, "Production");
    if (song && step === "master") setCompareSong(song.id);
    if (step === "video") { setAutoCaptionRequest(null); const master = song ? pinnedMaster(data.songs, projectRoot(data.songs,song)) : null; setLyricSongId(master?.song.id ?? song?.id ?? ""); }
    if (song && step === "release") openSong(song.id, "Release");
  }
  function openSong(id: string, next: Tab = "Writing") {
    if(creating){setToast("Let this creation finish saving before opening another song.");return;}
    setSelected(id); setTab(next); window.scrollTo(0, 0);
  }
  function newSong(template = "") { if(creating){setToast("Let this creation finish saving first.");return;} if (captureActive.current) { setToast("Stop the take before starting a song."); return; } if(view==="overview"&&!pane&&!selected&&!template){window.dispatchEvent(new window.CustomEvent("versual:new-song",{detail:{scope:workspaceId,source:"header"}}));return;} if (hasDraft.current && !confirm("Start a new song and discard unsaved changes?")) return; setError(""); setChosenTemplate(template); setModal("new"); }
  async function createSong(name: string, templateId: string, genres: string[], stylePrompt = "") {
    const song = songFromStarter(uid(), name, data.songs.length, songTemplates.find(t => t.id === templateId), genres, stylePrompt);
    if (await commit({ ...data, songs: [song, ...data.songs] }, "New song created")) { setModal(null); setView("songs"); openSong(song.id); return true; }
    return false;
  }
  function openUpload(target: Song | null = null, forVideo = false) {
    setError("");
    setUploadForVideo(forVideo);
    setUploadTarget(target);
    setModal("upload");
  }
  async function uploadSong(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const file = values.get("audio");
    if (!(file instanceof File) || !file.size) { setError("Choose a non-empty audio file."); return; }
    const format = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!isAudioFormat(format)) { setError(`Choose a supported file (${audioFormatsLabel}).`); return; }
    if (file.size > maxAudioBytes) { setError("Choose an audio file up to 96 MB."); return; }
    const title = String(values.get("name") ?? "").trim() || file.name.slice(0, -(format.length + 1)).trim().slice(0, 100);
    if (!uploadTarget && !title) { setError("Enter a song title."); return; }
    if (values.get("clean") !== "on") { setError("Confirm the recording is clean before uploading."); return; }
    const result = await sendAudio(file, title, uploadTarget);
    if (result?.songId) {
      setModal(null);
      if (uploadForVideo) { setLyricSongId(result.songId); return; }
      if (!uploadTarget) {
        setQuery(""); setTag(""); setStage(""); setExplicitView(false); setArchiveView(false); setFolderFilter(""); setView("songs");
      }
      openSong(result.songId, "Production");
    }
  }
  async function sendAudio(file: File, title: string, target: Song | null, instrumental?: { prompt: string; settings: Instrumental; arrangement?: string }, projectId?: string, sessionId?: string,creationId?:string) {
    const format = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!isAudioFormat(format)) return null;
    return saveRequest("/api/studio/audio", () => ({
      method: "POST",
      headers: {
        "X-Audio-Format": format,
        "X-Audio-Size": String(file.size),
        "X-Studio-Clean-Audio": "1",
        ...(target ? { "X-Song-Id": target.id } : { "X-Song-Title": encodeURIComponent(title) }),
        "X-Studio-Revision": String(revisionRef.current),
        ...(projectId && { "X-Project-Song-Id": projectId }),
        ...(sessionId && { "X-Source-Session-Id": sessionId }),
        ...(creationId&&{"X-Creation-Id":creationId}),
        ...(instrumental && { "X-Studio-Instrumental": encodeURIComponent(JSON.stringify(instrumental)) }),
      },
      body: file,
    }), instrumental ? "Instrumental saved to Your songs" : target ? "Recording saved" : "Song uploaded");
  }
  function editTemplate(template: Template | null, song?: Song) {
    setTemplateEdit(template ?? { id: uid(), name: song ? song.name + " Template" : "", description: song?.summary ?? "", tags: song?.tags ?? [], notes: song?.notes ?? { ...emptyNotes } });
    setError(""); setModal("template");
  }
  async function saveTemplate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!templateEdit) return;
    const values = new FormData(e.currentTarget);
    const name = String(values.get("name")).trim();
    if (!name) return;
    const updated = { ...templateEdit, name, description: String(values.get("description")), tags: tagsFrom(String(values.get("tags"))), notes: { ...templateEdit.notes } };
    (Object.keys(fields) as Field[]).forEach(field => { updated.notes[field] = String(values.get(field)); });
    const next = data.templates.some(t => t.id === updated.id) ? data.templates.map(t => t.id === updated.id ? updated : t) : [...data.templates, updated];
    if (await commit({ ...data, templates: next }, "Template saved")) setModal(null);
  }
  async function copy(value: string) {
    if (hasExplicitWords(value)) { setError(cleanWordsMessage); return; }
    try { await navigator.clipboard.writeText(value); setToast("Copied to clipboard"); }
    catch { setToast("Select the text to copy it manually."); }
  }

  const uploadButton = <HelpControl subject="Upload song" tip="Add an audio file from your device to the Song Library."><button className="secondary" disabled={saving} onClick={() => openUpload()}><Upload size={17}/> Upload song</button></HelpControl>;
  function connectionSettings() { setModal("connections"); }
  function openFirstSong() {
    if (captureActive.current || pendingSave.current) return;
    if (!navigate("create")) return;
    setModal(null);
    setFirstSongRequest(true);
  }
  const modalTitle = modal === "save-voice"?"Save Voice":modal === "tour"?"Quick tour":modal === "sections"?"Shape · edit your song":modal === "stems-midi"?"Stems & MIDI":modal === "logo"?"Logo Creator":modal === "cover"?"Create / animate cover":modal === "connections" ? "Settings" : modal === "new" ? "Start a song" : modal === "upload" ? (uploadTarget ? (uploadTarget.audioFormat ? "Replace audio" : "Attach audio") : "Upload song") : modal === "help" ? "Studio guide" : "Song template";
  const song = data.songs.find(s => s.id === selected && !s.deletedAt);
  const library = sortSongs(data.songs.filter(s => !s.deletedAt&&(!["account-writing-simple","account-writing-custom"].includes(s.id)||!!s.audioFormat)));
  const cleanLibrary = library.filter(song => !isExplicitSong(song));
  const videoDraft = data.songs.find(song => song.id === lyricSongId && song.creationDraft && !song.deletedAt && !isExplicitSong(song));
  const visibleLibrary = explicitView ? library.filter(isExplicitSong) : cleanLibrary;
  const allTags = uniqueGenreNames([...styles, ...visibleLibrary.flatMap(s => s.tags)]);
  const match = query.trim().toLowerCase();
  const filtered = sortSongs(visibleLibrary.filter(s => (!tag || s.tags.some(value => sameGenre(value, tag))) && (!stage || s.stage === stage) && (!draftsOnly||s.creationDraft||!s.audioFormat) &&
    (!folderFilter || s.folderId === folderFilter) &&
    (!match || [s.name, s.summary, ...s.tags, ...Object.values(s.notes)].some(value => value.toLowerCase().includes(match)))),songSort);
  const activeSong = cleanLibrary.find(s => s.stage === "Production") ?? cleanLibrary[0];
  const comparison = data.songs.find(s => s.id === compareSong && !s.deletedAt && !isExplicitSong(s)) ?? cleanLibrary.find(s => s.mixes.length >= 2) ?? cleanLibrary[0];

  // Song cards re-draw only when a value they show changes, not on every Studio
  // update. Actions go through a ref, so they always run the newest version.
  const hubActions = useRef({ save: saveSong, action: songAction, archive: archiveSong, duplicate: duplicateSong, publish: publishSong, playlist: addSongPlaylist, unlist: unlistSong });
  hubActions.current = { save: saveSong, action: songAction, archive: archiveSong, duplicate: duplicateSong, publish: publishSong, playlist: addSongPlaylist, unlist: unlistSong };
  const stableHubActions = useRef({
    save: (song: Song, message?: string) => hubActions.current.save(song, message),
    action: (action: SongAction, song: Song) => hubActions.current.action(action, song),
    archive: (song: Song) => hubActions.current.archive(song),
    duplicate: (song: Song) => hubActions.current.duplicate(song),
    publish: (song: Song) => hubActions.current.publish(song),
    playlist: (song: Song, id: string) => hubActions.current.playlist(song, id),
    unlist: (song: Song) => hubActions.current.unlist(song),
  }).current;
  const hubBusy = saving || creating || releaseBusy;
  const songHub = useMemo(() => ({ engine: musicEngine.status.engine, simple: beginner, busy: hubBusy, releases: releaseMap, releaseLoaded, folders, station: data.station,
    stemsConnected: elevenLabs.connected, preview: songPreview, setPreview: setSongPreview, expanded: songExpanded, setExpanded: setSongExpanded, ...stableHubActions }),
    [musicEngine.status.engine, beginner, hubBusy, releaseMap, releaseLoaded, folders, data.station, elevenLabs.connected, songPreview, songExpanded, stableHubActions]);
  return <DraftRecoveryProvider scope={workspaceId}><SongHubProvider value={songHub}><div className="shell" data-simple={beginner} data-workspace={song ? "songs" : view} data-cosmic-screen={modal==="connections"?"settings":modal==="help"||modal==="tour"?"guide":pane??(song?"songs":screenOf(view))}>
    <HologramScope primary={view === "overview" && !song && !pane ? "video-description" : "simple-view"}>
    <div className="cosmic-shell-sky" aria-hidden="true"><i/><i/><i/></div>
    <aside className="sidebar">
      <button className="brand cosmic-brand" onClick={() => navigate("overview")}><img src="/favicon.svg" alt=""/><span><strong>VERSUAL STUDIO</strong><small>{brand.subline}</small></span></button>
       <StudioNavigation activeView={song ? "songs" : view} activeScreen={pane??(song?"songs":screenOf(view))} openScreen={openScreen} activeUtility={modal === "connections" ? "settings" : modal === "help"||modal==="tour" ? "guide" : undefined}
        beginner={beginner} changeBeginner={changeBeginner} owner={!creatorName} navigate={navigate} visit={leaveStudio} settings={connectionSettings} guide={() => setModal("help")}/>
      <div className="sidebar-bottom"><p className="studio-motto">From the silence<br/>comes the light.</p><div className="private"><div className="avatar">S</div><div><strong>{creatorName ?? "Samadhi"}</strong><small>{creatorName ? "Private creator workspace" : "Owner workspace"}</small></div><LockKeyhole size={13}/></div><a className="owner-signout" href={signOut} target="_top">Sign out</a></div>
    </aside>
    <main>
      {loaded && view==="overview" && !song && !pane && <CosmicHomeSky/>}
      <header className="topbar"><div className="breadcrumb"><span>Studio</span><ChevronRight size={14}/><strong>{song ? song.name : pane==="plan-credits" ? "Plan & Credits" : workspaceNavigation.find(n => n.id === view)?.label}</strong><ScreenContextHelp screen={pane??(song?"songs":screenOf(view))}/></div>
        <div className="topbar-actions"><CreditBadge/><button type="button" className="secondary small" onClick={connectionSettings} aria-label="Settings"><Settings2 size={16}/><span>Settings</span></button>
          <button className="primary" disabled={!loaded || saving} onClick={() => beginner ? navigate("overview") : newSong()}><Plus size={17}/> {beginner ? "Create music" : "New song"}</button></div></header>
      <MobileProjectBar songs={cleanLibrary} currentId={song?.id??""} disabled={!loaded||saving||creating} select={id=>{if(navigate("songs"))openSong(id);}}/>
      <div className="content">
        {loaded && !song && !pane && <ContextBack screen={screenOf(view)} open={openScreen}/>}
        {loaded && !song && !pane && <ScreenSections activeView={view} navigate={navigate} beginner={beginner} extra={view==="overview"?<button type="button" className="secondary small" data-testid="button-open-world-sounds" onClick={()=>openScreen("world-sounds")}>🌍 World sounds</button>:undefined}/>}
        {loaded&&<PanelErrorBoundary panel="studio"><JobStatus completed={refreshCompletedJobs}/></PanelErrorBoundary>}
        {loaded && !song && pane==="plan-credits" && <PanelErrorBoundary panel="plan-credits"><PlanCreditsScreen tab={planTab} setTab={t=>{setPlanTab(t);try{window.history.replaceState(null,"",`${window.location.pathname}?studio=plan-credits&section=${t}`);}catch{}}} owner={!creatorName} signOut={signOut}/></PanelErrorBoundary>}
        <StudioWelcome view={view} visible={loaded && !song && !pane && !modal}/>
        {error && !modal && (view !== "create" || !!song) && <div className="notice" role="alert">{error}{!loaded && <button onClick={load}>Retry</button>}</div>}
        {loaded && <PanelErrorBoundary panel="explore" visible={view==="radio"&&!song&&!pane}>
          {view === "radio" && !song && !pane && <ExploreScreen tab={exploreTab} setTab={t=>{setExploreTab(t);try{window.history.replaceState(null,"",`${window.location.pathname}?studio=explore${t==="radio"?"":"&section="+t}`);}catch{}}} signOut={signOut} owner={!creatorName}/>}
          {view === "radio" && !song && !pane && exploreTab==="radio" && <><PageTitle icon={<Radio/>} title="SAMADHI LOVE Radio" subtitle={radioSource==="personal"?"A continuous rotation of the sounds you choose. Your own corner of the universe.":"One shared programme of reviewed submissions from the Studio community."} action={radioSource==="personal"?uploadButton:undefined}/><RadioSourceSwitch value={radioSource} change={chooseRadioSource}/></>}
          {sharedOpened && <SharedRadio active={view === "radio" && !song && !pane && exploreTab==="radio" && radioSource==="community" && !capturing}/>}
          <RadioWorkspace active={view === "radio" && !song && !pane && exploreTab==="radio" && radioSource==="personal"} songs={cleanLibrary} station={data.station} saving={saving} pauseForRecording={capturing || !!song || ["recording", "podcast", "multitrack", "vocal-studio", "lyric-video", "meditative-vibes"].includes(view)}
            save={station => commit({ ...data, station }, "Station updated")}/>
        </PanelErrorBoundary>}
        {loaded && !song && !pane && screenOf(view)==="record" && <RecordSwitch view={view} beginner={beginner} capturing={capturing} navigate={navigate}/>}
        {loaded && deskOpened && <PanelErrorBoundary panel="record" visible={(view==="recording"||view==="podcast")&&!song&&!pane}><Suspense fallback={opening}><RecordingDesk active={(view === "recording" || view === "podcast") && !song} requestedMode={deskMode} songs={cleanLibrary} consolidated advanced={!beginner} beginSavedSong={id => { const savedSong = data.songs.find(item => item.id === id && !item.deletedAt); if (savedSong) songAction("make-like-this", savedSong); }}
          mixTake={(blob, title, projectId) => { if (navigate("multitrack")) setMixInput({ blob, title, projectId }); }}
          layerOverSong={(blob,title,songId)=>{if(navigate("multitrack"))setMixInput({blob,title,baseSongId:songId,projectId:songId});}}
          vocalTake={(blob, title, narration, projectId) => { if (navigate("vocal-studio")) setVocalInput({ blob, title, projectId, role: narration ? "Narration" : "Lead vocal" }); }}
          saving={saving} onCapture={active => { captureActive.current = active; setCapturing(active); }}
          save={async (file, title, target, projectId, saveId) => {
            if (!confirm("Confirm this recording contains clean content.")) return null;
            const result = await sendAudio(file, title, target, undefined, projectId, undefined, saveId);
            return result?.songId ? { id: result.songId, name: target?.name ?? title } : null;
          }}
          open={id => { setView("songs"); openSong(id, "Production"); }}/></Suspense></PanelErrorBoundary>}
        {loaded && mixOpened && <PanelErrorBoundary panel="mix" visible={view==="multitrack"&&!song&&!pane}><Suspense fallback={opening}><Multitrack active={view === "multitrack" && !song} songs={workflowSong ? data.songs.filter(s => !s.deletedAt && !isExplicitSong(s) && (!s.creationDraft || s.id === workflowSong)) : cleanLibrary} initialSongId={workflowSong} input={mixInput} saving={saving} openLyrics={id=>{if(navigate("lyric-video"))setLyricSongId(id);}}
          save={async (file, title, projectId) => confirm("Confirm this mix contains clean content.") && !!(await sendAudio(file, title, null, undefined, projectId))}/></Suspense></PanelErrorBoundary>}
        {loaded && vocalOpened && <PanelErrorBoundary panel="record" visible={view==="vocal-studio"&&!song&&!pane}><VocalStudio active={view === "vocal-studio" && !song} saving={saving} initialSongId={workflowSong} initialVoiceId={vocalVoiceId} input={vocalInput}
          projects={cleanLibrary} songs={cleanLibrary.filter(s=>s.audioFormat)}
          onCapture={active => { captureActive.current = active; setCapturing(active); }}
          publish={async (file, title, projectId, sessionId) => (await sendAudio(file, title, null, undefined, projectId, sessionId))?.songId}
          sendMix={(blob, title, projectId) => { if (navigate("multitrack")) setMixInput({ blob, title, projectId }); }}
          layerOverSong={(blob,title,songId)=>{if(navigate("multitrack"))setMixInput({blob,title,baseSongId:songId,projectId:songId});}}
          openSong={(id, step) => {
            const target = dataRef.current.songs.find(s => s.id === id) ?? data.songs.find(s => s.id === id);
            // "Make lyric video" opens the mix with YOUR voice (never the project's pinned master),
            // and its words start timing to your voice right away.
            if (target && step === "video") {
              if (!navigate("lyric-video")) return;
              const open = lyricVideoFor(target);
              setLyricSongId(open.songId);
              setAutoCaptionRequest(open.autoCaptions ? { songId: open.songId, id: uid() } : null);
              return;
            }
            if (target) openWorkflow(step === "production" ? "edit" : step, target);
          }}/></PanelErrorBoundary>}
        {loaded && tentOpened && <PanelErrorBoundary panel="world-sounds" visible={view==="international-tent"&&!song&&!pane}><InternationalMusicTent active={view === "international-tent" && !song} send={seed => seed.sectionDirections?.length&&!beginner ? navigate("create", false, seed) : sendToCreate(seed)} copy={copy} openVocalStudio={() => navigate("vocal-studio")}/></PanelErrorBoundary>}
        <PanelErrorBoundary resetKey={pane??(song?"songs":screenOf(view))} panel={pane??(song?"songs":screenOf(view))}>
        {pane ? null : !loaded ? <div className="empty">{error ? "Your studio is temporarily unavailable." : "Opening your studio…"}</div> : song ?
          <SongEditor key={song.id} release={<section className="panel form-panel song-release-step" data-testid="section-song-release"><h2>Export & release tools</h2><ReleaseTools initialSongId={song.id} songs={cleanLibrary} saving={saving} save={saveSong}/><h2>Artist publishing</h2><p className="muted">Nothing is published until you confirm it here.</p>{song.creationDraft?<p className="muted">Move this creation to Your songs before publishing.</p>:<ArtistConsole key={song.id} studioHref={creatorName?"/creator":"/owner"} moderator={!creatorName} selectedRecording={song.id}/>}</section>} songs={data.songs} saveProject={saveSong} openRelated={id => { if (navigate("songs")) openSong(id); }} song={song} tab={tab} setTab={setTab} saving={saving} remix={() => remix(song)} stemsConnected={elevenLabs.connected} mixStems={archive=>{ if(navigate("multitrack")) setMixInput({blob:archive,title:song.name+" stems",projectId:projectRoot(data.songs,song).id,kind:"stems"}); }} vocalStudio={() => { if (navigate("vocal-studio")) setWorkflowSong(song.id); }} folders={folders} save={saveSong} copy={copy} back={() => navigate(song.creationDraft ? "create" : "songs", song.creationDraft)} template={editTemplate} onDirty={dirty => { hasDraft.current = dirty; }} attach={() => openUpload(song)} lyricVideo={() => { setLyricSongId(song.id); navigate("lyric-video"); }}
            remove={async value => { if (await saveSong({ ...(value??song), deletedAt: new Date().toISOString() }, "Song deleted · recoverable for 30 days")) { hasDraft.current = false; navigate("songs"); } }}/>
        : view === "meditative-vibes" ? <MeditativeVibes workspaceId={workspaceId} saving={saving} projects={cleanLibrary.filter(s => !s.projectId && !s.example)}
          dirty={active => { hasDraft.current = active; }} persistBusy={active => { pendingSave.current = active; setSaving(active); }}
          saveAudio={async (file, title, projectId) => !!(await sendAudio(file, title, null, undefined, projectId))}
          sendMix={(blob, title, projectId) => { if (navigate("multitrack")) setMixInput({ blob, title, projectId }); }} recordVoice={() => navigate("recording")} useInSong={idea => sendToCreate({ idea })}/>
        : view === "workflow" ? <MusicWorkflow songs={data.songs.filter(s => !s.deletedAt && !isExplicitSong(s))} open={openWorkflow}/> : view === "music-library" || view === "rhythm-atlas" ?
          <MusicLibrary key={view} atlas={view === "rhythm-atlas"} data={data.discovery ?? emptyDiscovery} saving={saving} save={saveDiscovery}
            openPrompt={idea => sendToCreate({ idea })}/> :
          view === "prompt-lab" ? <PromptLab key={promptSeed?.idea ?? "new"} seed={promptSeed} data={data.discovery ?? emptyDiscovery} saving={saving} save={saveDiscovery} copy={copy}
            send={seed => navigate("create", false, seed)}/> :
          view === "vocal-director" ? <VocalDirector ready={elevenLabs.connected && elevenLabs.status.musicAccess === "available"} connect={connectionSettings} copy={copy} send={seed => navigate("create", false, seed)}/> :
          view === "my-voices" ? <MyVoices useInSong={()=>{navigate("vocal-studio");}} makeVideo={voiceLyricVideo}/> :
          view === "recording" || view === "podcast" || view === "multitrack" || view === "vocal-studio" ? null : view === "promote" ? <PromoteScreen songs={cleanLibrary} songId={coverSongId} setSongId={setCoverSongId} creatorName={creatorName??"SAMADHI LOVE"} working={setCoverBusy} saveSong={saveSong} createAd={seed=>{if(navigate("overview"))setQuickSeed({...seed,id:uid()});}} openVideo={id=>{if(navigate("lyric-video")){setLyricSongId(id);setSocialVideoRequest({id:uid(),songId:id});}}}/> : view === "radio" ? creatorName || exploreTab!=="radio" ? null : <ListenerSettings songs={cleanLibrary}/> : view === "lyric-video" ?
          <Suspense fallback={opening}><LyricVideoPro coverVideoRequest={coverVideoRequest} createSong={()=>{navigate("overview");}} advanced={!beginner} socialVideoRequest={socialVideoRequest} autoCaptionRequest={autoCaptionRequest} key={lyricSongId} songs={data.songs.filter(s=>!s.deletedAt&&!isExplicitSong(s))} initialSongId={lyricSongId} saving={saving} save={saveSong}
            elevenLabs={elevenLabs} connectionSettings={connectionSettings} upload={() => openUpload(null, true)}
            generate={async payload=>{const result=await createRequest(payload,"Caption-ready song saved to My Originals");return result?.data?.songs.find(s=>s.id===result.songId);}}
            importFile={async (file,title)=>{const result=await sendAudio(file,title,null);return result?.data?.songs.find(s=>s.id===result.songId);}}
            persisted={(next,nextRevision)=>{dataRef.current=next;setData(next);revisionRef.current=nextRevision;setRevision(nextRevision);}}
            persistBusy={active=>{pendingSave.current=active;setSaving(active);}} dirty={active=>{hasDraft.current=active;}}/></Suspense> : view === "distribution" ?
          <ReleaseTools initialSongId={workflowSong} songs={cleanLibrary} saving={saving} save={saveSong}/> : view === "overview" ? <>
          <CosmicHomeHero begin={focusCreateBox} video={()=>{navigate("lyric-video");}}/>
          <QuickCreate singWithVoice={(songId,voice)=>{setWorkflowSong(songId);setVocalVoiceId(voice.id);navigate("vocal-studio");}} engine={musicEngine.status} favoriteTake={async id=>{const song=dataRef.current.songs.find(s=>s.id===id);if(song)await saveSong({...song,favorite:true},"Favourite take kept; both recordings stay saved");}} seed={quickSeed} recipes={songTemplates} editRecipe={t=>editTemplate(t&&isStudioPreset(t.id)?{...t,id:uid(),name:(t.name+" (my recipe)").slice(0,100)}:t)}
            writeLyrics={async input=>(await createRequest({...input,action:"lyric-plan"},"Your words are ready to shape",true))?.lyrics}
            promptHelpers={apply=><PromptLab seed={null} data={data.discovery ?? emptyDiscovery} saving={saving} save={saveDiscovery} copy={copy} send={seed=>apply({...quickFromCreate(seed),id:uid(),custom:true})}/>}
            vocalHelpers={apply=><VocalDirector ready={elevenLabs.connected && elevenLabs.status.musicAccess === "available"} connect={connectionSettings} copy={copy} send={seed=>apply({...quickFromCreate(seed),id:uid(),custom:true})}/>}
            proProduction={<div ref={createPane} className="qc-pro-engine"><CreateStudio projects={data.songs.filter(s => !s.deletedAt && !s.projectId && !isExplicitSong(s))} key={createSeed ? "seed-" + JSON.stringify(createSeed) : "create"}
          seed={createSeed} working={setCreating} historySongs={cleanLibrary} remix={remix} voiceDesignAllowed={!creatorName} elevenLabs={elevenLabs} drafts={sortSongs(data.songs.filter(s => !s.deletedAt&&!s.example&&(s.creationDraft||s.generation||s.instrumental)))} voices={data.voices ?? []}
          saving={saving} operationError={error} startAtDrafts={showCreationDrafts} firstSongRequest={firstSongRequest} finishFirstSongRequest={finishFirstSongRequest} openVocalStudio={() => navigate("vocal-studio")} connectionSettings={connectionSettings} send={async (payload, message) => !!(await createRequest(payload, message))} open={id => openSong(id)}
          saveInstrumental={async (file, title, prompt, settings, projectId,saveId) => !!(await sendAudio(file, title, null, { prompt, settings }, projectId,undefined,saveId))}
          saveDraft={(title, prompt, lyrics, voice, duration, sectionDirections, projectId) => {
            const draft = freshSong(uid(), title.trim() || "Untitled song", data.songs.length);
            draft.creationDraft = true;
            draft.projectId = projectId;
            draft.creationSeconds = duration ?? undefined;
            draft.sectionDirections = sectionDirections;
            draft.notes = { ...draft.notes, prompt, lyrics, vocals: voice };
            return commit({ ...data, songs: [draft, ...data.songs] }, "Writing draft saved");
          }}
          move={async (draft, publish) => {
            if (!await saveSong({ ...draft, creationDraft: false }, "Song moved to the library")) return false;
            if (publish) { if (navigate("songs")) openSong(draft.id, "Release"); return true; }
            setQuery(""); setTag(""); setStage(""); setExplicitView(false); setArchiveView(false); setFolderFilter(""); navigate("songs");
            return true;
          }}/></div>}
             simpleExperience={beginner} recordVoice={()=>navigate("recording")} uploadOwn={()=>openUpload(null,true)} autoCover={async song=>{const blob=await coverPng(song.name,creatorName??"SAMADHI LOVE",coverStyleForTitle(song.name));const asset=await uploadLyricAsset(song.id,"background",blob);if(!await saveSong({...song,coverAsset:asset},"Cover created from your title"))throw new Error("Cover save not confirmed.");}} savedPrompts={data.templates.filter(t=>t.id.startsWith("prompt-"))} savePrompt={saveReusablePrompt} favoritePrompt={favoriteReusablePrompt} autoSavePrompts={data.autoSavePrompts===true} setAutoSavePrompts={enabled=>{void setPromptAutoSave(enabled);}} connected={elevenLabs.connected} saving={saving} drafts={data.songs} working={setCreating}
            makeVideo={async(song,short,visual)=>{const photoAsset=visual?.photo?await uploadLyricAsset(song.id,"background",visual.photo,undefined,song.audioId??song.id):undefined;let footage:{asset:string;duration:number}|undefined;if(visual?.video){const {openFootage}=await import("./advertising-footage");const decoder=await openFootage(visual.video);const duration=decoder.duration;decoder.dispose();footage={asset:await uploadLyricAsset(song.id,"sourceVideo",visual.video,undefined,song.audioId??song.id),duration};}if(navigate("lyric-video")){setLyricSongId(song.id);if(short||song.musicalAd)setSocialVideoRequest({id:uid(),songId:song.id,look:visual?.look,photoAsset,footage,audioId:song.audioId??song.id});if(!song.lyricVideo?.cues.length&&song.creationKind!=="instrumental")setAutoCaptionRequest({songId:song.id,id:uid()});}}} publish={song=>void publishSong(song)} settings={connectionSettings} guided={() => navigate("create")} openDrafts={() => navigate("create", true)}
            connectionChecking={elevenLabs.operation==="GET"} connectionError={elevenLabs.error||elevenLabs.status.error} refreshConnection={()=>{void elevenLabs.update("GET");}}
            generateSong={async input => {const result=await createRequest({ ...input, action: "song" }, "Song saved privately to Your songs", true);return result?.songId?{songId:result.songId,songIds:result.songIds,warning:result.warning}:undefined;}}
             saveMelodyReference={saveMelodyReference}
            saveSketch={async (file, title, prompt, arrangement, settings,saveId) =>
              (await sendAudio(file, title, null, { prompt, arrangement, settings },undefined,undefined,saveId))?.songId}/>
          <section className="panel form-panel creator-visual-gateway" aria-label="Make your creation visual"><h2>Make your creation visual</h2><p className="muted"><HologramVideoDescription/></p><div className="actions"><button type="button" className="primary" disabled={creating||saving} onClick={()=>{if(navigate("lyric-video")){setLyricSongId("");setAutoCaptionRequest(null);}}}>Browse lyric video templates</button><label className="field">Auto lyric video from My Music<select value="" disabled={creating||saving} onChange={e=>{if(e.target.value&&navigate("lyric-video")){setLyricSongId(e.target.value);const target=cleanLibrary.find(s=>s.id===e.target.value);setAutoCaptionRequest(target&&!target.lyricVideo?.cues.length&&target.creationKind!=="instrumental"&&!isInstrumental(target.instrumental)?{songId:target.id,id:uid()}:null);}}}><option value="">Choose a saved song…</option>{cleanLibrary.filter(s=>s.audioFormat).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div></section>
          <CosmicHomeStory pickWorld={world=>{setQuickSeed({id:uid(),idea:world.idea,styles:[...world.styles]});focusCreateBox();}}/>
          {!beginner && <section className="studio-shortcuts" aria-label="Studio quick actions">
            {([{ label: "Music Creation", target: "overview", icon: Sparkles, hint: "Start with an idea" },
              { label: "Your songs", target: "songs", icon: ListMusic, hint: "Upload and organize" },
              { label: "Record Studio", target: "recording", icon: Mic, hint: "Capture and tune takes" },
              { label: "Use My Voice", target: "vocal-studio", icon: Mic, hint: "Sing over your own music" },
              { label: "Playlists", target: "radio", icon: Radio, hint: "Set your rotation" },
              { label: "Lyric Video Creator", target: "lyric-video", icon: Film, hint: "Put words in motion" },
              { label: "Podcast Studio", target: "podcast", icon: Mic, hint: "Record and polish a voice" },
              { label: "My Releases", target: "releases", icon: ClipboardList, hint: "Plan the next release" }] as const).map(({ label, target, icon: Icon, hint }) =>
                <button className="studio-shortcut" key={target} onClick={() => navigate(target)}><Icon size={21}/><strong>{label}</strong><span>{hint}</span></button>)}
          </section>}
          {!beginner && <PartySpotlight/>}
          <div className="overview-grid">
            <Section title="Song library" action={<div className="actions library-actions">{uploadButton}<button className="text-button" onClick={() => navigate("songs")}>View all <ArrowRight size={15}/></button></div>}>
              <p className="section-sub"><HologramOriginalsLine/></p>
              <div className="song-list">{cleanLibrary.slice(0, 4).map(s => <SongRow key={s.id} song={s} open={() => openSong(s.id)}/>)}
                {!cleanLibrary.length && <div className="empty"><HologramStartSongNote/></div>}</div>
            </Section>
            {!beginner && <div>
              <Section title="Release focus">
                <p className="section-sub hologram-guide">Bring your next track into the world.</p>
                {activeSong ? <div className="focus panel">
                  <div className="focus-head"><Artwork art={activeSong.art} small/><div><span className="eyebrow">IN FOCUS</span><h3>{activeSong.name}</h3></div></div>
                  <Checklist song={activeSong} preview/>
                  <button className="secondary full" onClick={() => openSong(activeSong.id, "Release")}>Open release checklist <ArrowRight size={15}/></button>
                </div> : <div className="empty">A release checklist comes with each new song.</div>}
              </Section>
            </div>}
          </div>
          {!beginner && <Section title="Explore by style" action={<button className="text-button" onClick={() => { setTag(""); setQuery(""); setStage(""); navigate("songs"); }}>All styles <ArrowRight size={15}/></button>}>
            <GenrePicker label="Explore genres" value={tag ? [tag] : []} single allowCustom={false} extraOptions={allTags} change={next=>{setTag(next[0]??"");setQuery("");setStage("");navigate("songs");}}/>
          </Section>}
        </> : view === "songs" ? <>
          <PageTitle icon={<ListMusic/>} title="Your songs" subtitle="Every song you make becomes a star. Private until you choose to share." action={<div className="actions">{uploadButton}</div>}/>
          <div className="chips library-scope">
            <button className={`chip ${!explicitView && !archiveView ? "active" : ""}`} aria-pressed={!explicitView && !archiveView} onClick={() => { setExplicitView(false); setArchiveView(false); setTag(""); }}>Active creations</button>
            <HelpControl subject="Needs cleanup" tip="View songs flagged by the clean-content check so you can review and edit them."><button className={`chip ${explicitView && !archiveView ? "active" : ""}`} aria-pressed={explicitView && !archiveView} onClick={() => { setExplicitView(true); setArchiveView(false); setTag(""); }}>Needs review</button></HelpControl>
            <button className={`chip ${archiveView ? "active" : ""}`} aria-pressed={archiveView} onClick={() => setArchiveView(true)}>Recently deleted</button>
          </div>
          {archiveView ? <section className="panel form-panel"><h2>Recently deleted</h2><p className="muted">{deletionNotice}</p>{sortSongs(data.songs.filter(s=>s.deletedAt)).map(s=><SongCard key={s.id} song={s}/>)}{!data.songs.some(s => s.deletedAt) && <p className="muted">No recently deleted songs.</p>}</section> : <>
          {explicitView && <p className="muted playlist-description">Playback and exports are blocked here. Open a song to clean the text or replace a flagged recording.</p>}
          <div className="filters"><label className="search"><Search size={18}/><input aria-label="Search songs" placeholder="Search titles, lyrics, prompts, and tags…" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={16}/></button>}</label>
            <select aria-label="Filter by stage" value={stage} onChange={e => setStage(e.target.value)}><option value="">All stages</option>{stages.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="actions library-organization">
            <label>Sort<select aria-label="Sort Your songs" value={songSort} onChange={e=>setSongSort(e.target.value as SongSort)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="liked">Liked songs</option></select></label>
            <select aria-label="Filter by folder" value={folderFilter} onChange={e => setFolderFilter(e.target.value)}><option value="">All folders</option>{folders.map(folder => <option value={folder.id} key={folder.id}>{folder.name}</option>)}</select>
            <button className="secondary small" onClick={() => setEditingFolder({ id: "", name: "" })}>New folder</button>
            {folders.some(folder => folder.id === folderFilter) && <button className="secondary small" onClick={() => setEditingFolder(folders.find(folder => folder.id === folderFilter) ?? null)}>Rename folder</button>}
          </div>
          {editingFolder && <form className="panel form-panel" onSubmit={async e => {
            e.preventDefault();
            const name = editingFolder.name.trim();
            if (!name) return;
            if (folders.some(folder => folder.id !== editingFolder.id && folder.name.toLowerCase() === name.toLowerCase())) { setError("That folder already exists."); return; }
            const folder = { id: editingFolder.id || uid(), name };
            const next = editingFolder.id ? folders.map(item => item.id === folder.id ? folder : item) : [...folders, folder];
            if (await commit({ ...data, folders: next }, "Folder saved")) setEditingFolder(null);
          }}><HelpField label={<>Folder name</>} subject="Folder" tip="Place the song in a folder so it is easier to find in Your songs."><input required maxLength={80} value={editingFolder.name} onChange={e => setEditingFolder({ ...editingFolder, name: e.target.value })}/></HelpField>
            <div className="actions"><button className="primary" disabled={saving}>Save folder</button><button className="secondary" type="button" onClick={() => setEditingFolder(null)}>Cancel</button></div>
          </form>}
          <GenrePicker label="Filter by genre" value={tag ? [tag] : []} single allowCustom={false} extraOptions={allTags} change={next=>setTag(next[0]??"")}/>
          <details className="panel form-panel artist-dashboard-fold" data-testid="fold-artist-dashboard" open={artistOpen||undefined} onToggle={e=>setArtistOpen((e.currentTarget as HTMLDetailsElement).open)}><summary>Artist Dashboard · releases and listening</summary>{artistOpen&&<ArtistConsole studioHref={creatorName?"/creator":"/owner"} moderator={!creatorName}/>}</details>
          <div className="song-sky-bar"><p className="count">{filtered.length} {filtered.length === 1 ? "song" : "songs"}</p><SongSkyToggle mode={libraryMode} change={setLibraryMode}/></div>
          {libraryMode==="sky"&&<SongSky songs={filtered} allSongs={data.songs} open={id=>openSong(id)}/>}
          <div className="song-list">{filtered.map(s => <SongRow key={s.id} song={s} open={() => openSong(s.id)}/>)}{!filtered.length && <div className="empty">No songs match these filters.</div>}</div>
          </>}
        </> : view === "templates" ? <>
          <PageTitle icon={<Layers3/>} title="Song templates" subtitle="Start with an arrangement you love. Give each new song a life of its own." action={<button className="secondary" onClick={() => editTemplate(null)}><Plus size={17}/> New template</button>}/>
          <SongTemplateBrowser templates={songTemplates} savedTemplateIds={data.templates.map(t=>t.id)} render={(t, i) => <article className="panel template-card" key={t.id}><Artwork art={i}/><h2>{t.name}</h2><p>{t.description}</p><div className="chips">{t.tags.map(x => <span key={x} className="chip">{x}</span>)}</div><div className="actions"><button className="primary" onClick={() => newSong(t.id)}>Use template <ArrowRight size={15}/></button><button className="secondary" onClick={() => editTemplate(t)}>{isStudioPreset(t.id) && !data.templates.some(saved => saved.id === t.id) ? "Customize" : "Edit"}</button></div></article>}/>
        </> : view === "compare" ? <>
          <PageTitle icon={<GitCompareArrows/>} title="Mix lab" subtitle="Compare alternate mixes or record and produce a new vocal session." action={<button className="primary" type="button" onClick={() => { if (navigate("vocal-studio")) setWorkflowSong(comparison?.id ?? ""); }}><Mic size={16}/> Open Vocal Studio</button>}/>
          {comparison ? <><label className="field compact">Choose a song<select value={comparison.id} onChange={e => setCompareSong(e.target.value)}>{[comparison, ...cleanLibrary.filter(item => item.id !== comparison.id)].map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><MixLab key={comparison.id} song={comparison} songs={data.songs} saveProject={saveSong} save={saveSong} saving={saving}/></> : <div className="empty">Create a song to compare mixes.</div>}
        </> : <>
          <PageTitle icon={<ClipboardList/>} title="Release board" subtitle="Take each original from final mix to the moment you share it."/>
          <div className="card-grid">{cleanLibrary.map(s => <article className="panel release-card" key={s.id}><div className="focus-head"><Artwork art={s.art} small/><div><Badge stage={s.stage}/><h3>{s.name}</h3></div></div><Checklist song={s} preview/><SavedLyricVideos song={s}/><p className="muted">{s.releaseDate ? dateText(s.releaseDate) : "Release date open"}</p><button className="secondary full" onClick={() => openSong(s.id, "Release")}>Open checklist <ArrowRight size={15}/></button></article>)}</div>
          {!cleanLibrary.length && <div className="empty">Add a song to start planning a release.</div>}
        </>}
        </PanelErrorBoundary>
      </div>
    </main>
    {toast && <div className="toast" role="status"><Check size={17}/>{toast}{undoPromptFavorite&&<button type="button" className="text-button" data-testid="button-undo-prompt-favorite" onClick={()=>void undoFavoritePrompt()}>Undo</button>}</div>}
    {modal && modal!=="tour" && <div className="modal-shade" onClick={e => { if (e.target === e.currentTarget && !modalBusy) setModal(null); }}><div className={modal === "connections" ? "modal settings-modal" : modal === "new" ? "modal song-start-modal" : "modal"} role="dialog" aria-modal="true" aria-label={modalTitle}>
      <div className="modal-head"><h2>{modalTitle}</h2><button className="icon-button" aria-label="Close" onClick={() => setModal(null)} disabled={modalBusy}><X size={20}/></button></div>
      <PanelErrorBoundary key={modal} panel={modal==="connections"?"settings":"tools"}>
      {modal==="connections"&&<MusicEngineSettings access={musicEngine} advanced={!beginner}/>}
      {error && modal !== "connections" && <div className="notice" role="alert">{error}</div>}
      {modal==="save-voice"&&data.songs.find(s=>s.id===coverSongId)?<SaveVoiceReference key={coverSongId} song={data.songs.find(s=>s.id===coverSongId)!} working={setCoverBusy} saved={async()=>{await load();setToast("Vocal idea saved privately in Your Sounds. The clip is a reference, not a clone.");setModal(null);}}/>:
      modal === "sections"&&data.songs.find(s=>s.id===coverSongId)?<SongSectionEditor key={coverSongId} engine={musicEngine.status.engine} song={data.songs.find(s=>s.id===coverSongId)!} songs={cleanLibrary} owner={workspaceId} working={setCoverBusy} saved={async()=>{await load();}} initialAction={sectionInitialAction}/>:modal === "stems-midi"&&data.songs.find(s=>s.id===coverSongId)?<section><p className="muted">Export real audio stems or MIDI available for this recording. Originals stay intact.</p>{isInstrumental(data.songs.find(s=>s.id===coverSongId)!.instrumental)?<InstrumentalExports working={setCoverBusy} settings={data.songs.find(s=>s.id===coverSongId)!.instrumental!} title={data.songs.find(s=>s.id===coverSongId)!.name}/>:<><SeparatedStems working={setCoverBusy} songId={coverSongId} audioId={data.songs.find(s=>s.id===coverSongId)!.audioId} title={data.songs.find(s=>s.id===coverSongId)!.name} connected={elevenLabs.connected}/><p className="muted">This recording has no stored editable MIDI notes. The cue-map export below contains tempo and section markers, not inferred instrument notes.</p></>}<button type="button" className="secondary" onClick={()=>{const source=data.songs.find(s=>s.id===coverSongId)!;downloadBlob(sectionCueMidi(source,source.lyricVideo?.bpm??source.instrumental?.bpm??120),source.name+" - section cues.mid");}}>Download section cue-map MIDI</button><p className="muted">Cue-map tempo uses the saved BPM or 120 BPM when unspecified. MIDI note/trigger import remains available in Audio + Visual Studio.</p></section>:modal === "logo"?<BrandLogoDesigner key={coverSongId||"standalone"} working={setCoverBusy} name={creatorName??"SAMADHI LOVE"} initial={data.songs.find(s=>s.id===coverSongId)?.logoDesign} save={coverSongId?async(blob,design)=>{const asset=await uploadLyricAsset(coverSongId,"logo",blob);const source=data.songs.find(s=>s.id===coverSongId);if(!source)throw new Error("Choose an available song before saving the logo.");const next={...source,logoAsset:asset,logoDesign:design,...(source.lyricVideo?.pro?{lyricVideo:{...source.lyricVideo,pro:{...source.lyricVideo.pro,logo:asset}}}:{})};if(!await saveSong(next,"Logo saved privately"))throw new Error("Logo upload finished, but the project save could not be confirmed. Retry.");}:undefined}/>:modal === "cover"&&data.songs.find(s=>s.id===coverSongId)?<SongCoverDesigner working={setCoverBusy} key={coverSongId} title={data.songs.find(s=>s.id===coverSongId)!.name} artist={creatorName??"SAMADHI LOVE"} save={async blob=>{const asset=await uploadLyricAsset(coverSongId,"background",blob);const song=data.songs.find(s=>s.id===coverSongId)!;if(!await saveSong({...song,coverAsset:asset},"Cover saved privately"))throw new Error("Cover uploaded, but the song save could not be confirmed. Retry.");}} animate={data.songs.find(s=>s.id===coverSongId)?.audioFormat?async (blob,overlay)=>{const asset=await uploadLyricAsset(coverSongId,"background",blob);setModal(null);if(navigate("lyric-video")){setLyricSongId(coverSongId);setCoverVideoRequest({id:uid(),songId:coverSongId,asset,overlay});}}:undefined}/>:modal === "connections" ? <ElevenLabsSettingsPanel access={elevenLabs} firstSong={openFirstSong}/> : modal === "new" ? <NewSongForm templates={songTemplates} savedTemplateIds={data.templates.map(t=>t.id)} initialTemplateId={chosenTemplate} saving={saving} create={createSong}/> : modal === "upload" ? <form onSubmit={uploadSong} aria-busy={saving}>
        <fieldset disabled={saving}>
          <HelpField label="Audio file" tip="Choose a clean recording such as an MP3, WAV, or M4A. The file limit is 96 MB."><input name="audio" type="file" accept={audioAccept} aria-describedby="audio-formats" required autoFocus/></HelpField>
          <p className="muted upload-note" id="audio-formats">{audioFormatsLabel} up to 96 MB. Your audio is saved in your private workspace.</p>
          {uploadTarget ? <p className="muted upload-note">For <strong>{uploadTarget.name}</strong>. {uploadTarget.audioFormat && "If shared, approve the new recording in Radio before subscribers can hear it."}</p> :
            <label className="field">Song title <span className="muted">(optional)</span><input name="name" maxLength={100} placeholder="Uses the filename if left blank"/></label>}
          <label className="checkline"><input type="checkbox" name="clean" required/> I confirm this recording contains clean content.</label>
          <div className="actions"><button className="primary"><Upload size={17}/>{saving ? "Uploading…" : modalTitle}</button></div>
        </fieldset>
      </form> : modal === "template" && templateEdit ? <form onSubmit={saveTemplate}>
        <label className="field">Template name<input name="name" autoFocus required maxLength={100} defaultValue={templateEdit.name}/></label>
        <HelpField label="Creative direction" tip="Write the mood, meaning, or direction you want to remember for this song."><input name="description" defaultValue={templateEdit.description}/></HelpField>
        <HelpField label="Style tags, separated by commas" tip="Add style labels to make this song easier to find or use in a playlist."><input name="tags" defaultValue={templateEdit.tags.join(", ")}/></HelpField>
        {(Object.keys(fields) as Field[]).map(f => <label className="field" key={f}>{fields[f]}<textarea name={f} rows={3} defaultValue={templateEdit.notes[f]}/></label>)}
        <div className="actions"><button className="primary" disabled={saving}>Save template</button>
          {data.templates.some(t => t.id === templateEdit.id) && <button type="button" className="secondary danger" disabled={saving} onClick={async () => {
            if (confirm(isStudioPreset(templateEdit.id) ? "Reset this Studio template to its default? Songs created from it will keep their contents." : "Delete this template? Songs created from it will keep their contents.") && await commit({ ...data, templates: data.templates.filter(t => t.id !== templateEdit.id) }, isStudioPreset(templateEdit.id) ? "Studio template reset" : "Template deleted")) setModal(null);
          }}>{isStudioPreset(templateEdit.id) ? "Reset Studio template" : "Delete template"}</button>}</div>
      </form> : <div className="guide"><p>Start with a blank song or a reusable template. Writing returns automatically when you come back. New song clears the form without deleting saved work. Open any song to attach a recording, or use Upload song to create a song from a file.</p><p>Use <strong>Save song</strong> to keep your edits. Use <strong>Save version</strong> in Writing to keep a named snapshot of your lyrics or creative prompt.</p><p>Compare directions in Mix lab, then use the release checklist to plan the master, visuals, and promotion.</p><button type="button" className="primary" data-testid="button-restart-tour" onClick={()=>setModal("tour")}>Take the quick tour</button></div>}
      </PanelErrorBoundary>
    </div></div>}
    {modal==="tour"&&<div className="modal-shade" onClick={event=>{if(event.target===event.currentTarget)finishTour();}}><div className="modal" role="dialog" aria-modal="true" aria-label="Quick tour"><div className="modal-head"><h2>Quick tour</h2><button type="button" className="icon-button" aria-label="Close" onClick={finishTour}><X size={20}/></button></div><StudioQuickTour onDone={finishTour}/></div></div>}
    </HologramScope></div></SongHubProvider></DraftRecoveryProvider>;
}

function PageTitle({ icon, title, subtitle, action }: { icon: ReactNode; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="page-title"><div><span className="title-icon">{icon}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function SongRow({ song, open }: { song: Song; open: () => void }) {
  return <SongCard song={song}/>;
}

function Checklist({ song, preview, toggle }: { song: Song; preview?: boolean; toggle?: (index: number) => void }) {
  const completed = song.done.filter(Boolean).length;
  const items = preview ? tasks.slice(0, 3) : tasks;
  return <div className="checklist"><div className="progress-label"><span>Release checklist</span><strong>{completed}/{tasks.length} complete</strong></div><progress max={tasks.length} value={completed} aria-label="Release progress"/>
    {items.map((task, index) => preview ? <div className="checkline" key={task}><span className={`checkbox-preview ${song.done[index] ? "checked" : ""}`}>{song.done[index] && <Check size={12}/>}</span>{task}</div> :
      <label className="checkline" key={task}><input type="checkbox" checked={!!song.done[index]} onChange={() => toggle?.(index)}/>{task}</label>)}</div>;
}

function SongEditor({ release, song, tab, setTab, saving, folders, save, copy, back, template, remove, onDirty, attach, lyricVideo, vocalStudio, remix, stemsConnected, songs, saveProject, openRelated, mixStems }: { release?: ReactNode;
  songs: Song[]; saveProject: (song: Song, message?: string) => Promise<boolean>; openRelated: (id: string) => void;
  remix: () => void; stemsConnected: boolean; mixStems: (archive: Blob) => void;
  song: Song; tab: Tab; setTab: (tab: Tab) => void; saving: boolean; folders: Folder[]; save: (song: Song, message?: string) => Promise<boolean>;
  copy: (text: string) => Promise<void>; back: () => void; template: (template: null, song: Song) => void; remove: (value?:Song) => Promise<void>; onDirty: (dirty: boolean) => void; attach: () => void; lyricVideo: () => void; vocalStudio: () => void;
}) {
  const [draft, setDraft] = useState(song);
  const [tagText, setTagText] = useState(song.tags.join(", "));
  const latestDraft = useRef({ draft, tagText }); latestDraft.current = { draft, tagText };
  useEffect(() => {
    setDraft(current => syncSongSource(current, song));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  }, [song.audioFormat, song.audioId, song.audioHistory, song.generation, song.instrumental, song.creationKind, song.creationSeconds, song.explicit, song.master?.songId, song.master?.audioId, song.projectId, song.sourceSessionId,song.createdAt,song.updatedAt]);
  const dirty = JSON.stringify({ ...draft, audioFormat: undefined, audioId: undefined }) !== JSON.stringify({ ...song, audioFormat: undefined, audioId: undefined }) || tagText !== song.tags.join(", ");
  useEffect(() => {
    onDirty(dirty);
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { onDirty(false); window.removeEventListener("beforeunload", beforeUnload); };
  }, [dirty, onDirty]);

  function patch(changes: Partial<Song>) { setDraft(current => ({ ...current, ...changes })); }
  function edit(field: Field, value: string) { setDraft(current => ({ ...current, notes: { ...current.notes, [field]: value } })); }
  const recovery = useDraftRecovery(`song-writing:${song.id}`, { name: draft.name, summary: draft.summary, stage: draft.stage, notes: draft.notes, tagText, releaseDate: draft.releaseDate, done: draft.done, suno: draft.suno }, value => {
    const { tagText: recoveredTags, ...fields } = value;
    setDraft(current => ({ ...current, ...fields })); setTagText(recoveredTags);
  }, dirty);
  async function persist(value: Song = draft, message?: string) {
    const title = value.name.trim();
    if (!title) { document.getElementById("song-title")?.focus(); return false; }
    const next = { ...value, name: title, tags: tagsFrom(tagText) };
    const submitted = latestDraft.current;
    if (!await save(next, message)) return false;
    const unchanged = JSON.stringify(latestDraft.current) === JSON.stringify(submitted);
    setDraft(current => mergeSavedSong(submitted.draft, current, next));
    setTagText(current => current === submitted.tagText ? next.tags.join(", ") : current);
    if (unchanged) await recovery.clear();
    return true;
  }
  const autoSave = useRef(persist);
  autoSave.current = persist;
  const attempted = useRef("");
  const autosaveFailures = useRef(0);
  const autoInput = JSON.stringify({ draft, tagText });
  useEffect(() => { autosaveFailures.current = 0; }, [autoInput]);
  const cleanDraft = !hasExplicitWords(draft.name, draft.summary, tagText, ...Object.values(draft.notes));
  useEffect(() => {
    if (!recovery.ready || autosaveFailures.current >= 3 || !dirty || saving || !draft.name.trim() || !cleanDraft || attempted.current === autoInput) return;
    const timer = window.setTimeout(() => {
      attempted.current = autoInput;
      const now = Date.now();
      const versions = { ...draft.versions };
      for (const field of ["lyrics", "prompt"] as const) {
        const text = draft.notes[field];
        const last = versions[field][0];
        if (text === song.notes[field] || !text.trim() || text === last?.text ||
            versions[field].filter(item => ["Autosaved draft","Autosaved writing"].includes(item.label)).length >= 24 ||
            (last&&["Autosaved draft","Autosaved writing"].includes(last.label) && now - Date.parse(last.date) < 60000)) continue;
        versions[field] = [{ id: uid(), label: "Autosaved writing", date: new Date(now).toISOString(), text }, ...versions[field]];
      }
      void autoSave.current({ ...draft, versions }, "").then(saved => { if (!saved) { autosaveFailures.current++; attempted.current = ""; } else autosaveFailures.current = 0; });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [autoInput, cleanDraft, dirty, draft, saving, song.notes, recovery.ready]);
  async function version(field: "lyrics" | "prompt", label: string) {
    const snapshot = { id: uid(), label, date: new Date().toISOString(), text: draft.notes[field] };
    return persist({ ...draft, versions: { ...draft.versions, [field]: [snapshot, ...draft.versions[field]] } }, "Version saved");
  }
  const note = (field: Field, placeholder: string) => <label className="field" key={field}>{fields[field]}<textarea rows={6} placeholder={placeholder} value={draft.notes[field]} onChange={e => edit(field, e.target.value)}/></label>;
  return <div className="editor"><RecoveryPanel recovery={recovery}/>
    <button className="text-button back" onClick={back}><ArrowLeft size={15}/> {song.creationDraft ? "Back to saved creations" : "Back to Your songs"}</button>
    <div className="editor-top"><Artwork art={draft.art}/><div><div className="eyebrow">{song.example ? "EXAMPLE SONG" : "SAMADHI LOVE ORIGINAL"}</div><h1>{song.name}</h1><Badge stage={song.stage}/></div><div className="editor-save"><button className="secondary small" aria-pressed={draft.favorite === true} onClick={() => patch({ favorite: !draft.favorite })}>{draft.favorite ? "♥ Liked" : "♡ Like"}</button><span aria-live="polite">{saving ? "Saving…" : dirty ? "Unsaved changes" : "Saved"}</span><button className="primary" disabled={saving || !draft.name.trim()} onClick={() => persist()}><Check size={16}/> Save song</button></div></div>
    <section className="panel form-panel song-recording">
      <div className="section-head"><h2>Recording</h2><HelpControl subject="Attach or replace audio" tip="Attach an audio file to this song, or replace the file already attached."><button className="secondary small" disabled={saving} onClick={attach}><Upload size={15}/>{song.audioFormat ? "Replace audio" : "Attach audio"}</button></HelpControl></div>
      {isExplicitSong(song) && <p className="notice">Playback and sharing are blocked. Clean the title, lyrics, or captions and replace a previously flagged recording with clean audio.</p>}
      {song.audioFormat && !isExplicitSong(song) ? <>
        <AudioPlayer key={`recording:${song.audioId ?? song.id}`} label={`Listen to ${song.name}`} src={songAudioUrl(song.id, song.audioId)}/>
        <AudioActions song={song}/>
        <div className="actions">
          {!song.creationDraft && <button type="button" className="primary small" data-testid="button-open-release" onClick={() => setTab("Release")}>Publish or share in Community</button>}
          {isInstrumental(song.instrumental) ? <button type="button" className="secondary small" onClick={remix}>Remix in Motif Forge</button>
            : <button type="button" className="secondary small" onClick={remix} data-testid="button-remix-sung">Remix · new take like this</button>}
        </div>
        {isInstrumental(song.instrumental) ? <InstrumentalExports settings={song.instrumental} title={song.name} disabled={saving}/>
          : <SeparatedStems key={`stems:${song.audioId ?? song.id}`} songId={song.id} audioId={song.audioId} title={song.name} connected={stemsConnected} openMixer={mixStems}/>}
        <HelpControl subject="Open in Vocal Studio" tip="Bring this recording into the vocal workspace and add it as a clip."><button type="button" className="secondary small" onClick={vocalStudio}><Mic size={15}/> Record my voice & mix</button></HelpControl>
        {!isExplicitSong(song) && <HelpControl subject="Make lyric video" tip="Open this recording in the lyric video editor to add timed lyrics and visuals."><button className="secondary small" onClick={lyricVideo}><Film size={15}/> Make lyric video</button></HelpControl>}
      </> : !song.audioFormat && <p className="muted">Attach a clean recording to play it here and add it to Radio.</p>}
    </section>
    <ProjectAssets songs={songs} song={song} open={openRelated}/>
    <div className="tabs" aria-label="Song sections">{tabs.map(t => <button key={t} aria-pressed={t === tab} className={t === tab ? "tab-active" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
    <fieldset disabled={saving}>
      {(tab === "Visuals & promo" || tab === "Release") && <SavedLyricVideos song={song}/>}
      {tab === "Writing" ? <>
        <div className="panel form-panel"><h2>Song details</h2><div className="field-grid">
          <label className="field">Song title<input id="song-title" required maxLength={100} value={draft.name} onChange={e => patch({ name: e.target.value })}/></label>
          <HelpField label="Stage" tip="Track whether this song is an idea, in writing or production, ready to release, or released."><select value={draft.stage} onChange={e => patch({ stage: e.target.value })}>{stages.map(s => <option key={s}>{s}</option>)}</select></HelpField>
          <HelpField label="Creative direction" tip="Write the mood, meaning, or direction you want to remember for this song."><input value={draft.summary} onChange={e => patch({ summary: e.target.value })} placeholder="What do you want this song to make someone feel?"/></HelpField>
          <HelpField label="Artwork palette" tip="Choose the color scheme of the song card inside the Studio."><select value={draft.art} onChange={e => patch({ art: Number(e.target.value) })}>{artNames.map((art, i) => <option key={art} value={i}>{art}</option>)}</select></HelpField>
          <HelpField label="Folder" tip="Place the song in a folder so it is easier to find in Your songs."><select value={draft.folderId ?? ""} onChange={e => patch({ folderId: e.target.value || undefined })}><option value="">Unfiled</option>{folders.map(folder => <option value={folder.id} key={folder.id}>{folder.name}</option>)}</select></HelpField>
        </div><HelpField label="Style tags, separated by commas" tip="Add style labels to make this song easier to find or use in a playlist."><input value={tagText} onChange={e => setTagText(e.target.value)} placeholder="Arabian Euro House, Spiritual Dance"/></HelpField>
          <GenrePicker label="Song genre tags" value={tagsFrom(tagText)} maxSelected={32} disabled={saving} change={next=>setTagText(next.join(", "))}/>
        </div>
        <div className="two-col">
          {(["lyrics", "prompt"] as const).map(f => <VersionPanel key={f} field={f} value={draft.notes[f]} versions={draft.versions[f]} edit={value => edit(f, value)} copy={copy} save={label => version(f, label)}/>)}
        </div>
      </> : tab === "Production" ? <div className="panel form-panel"><h2>Performance & arrangement</h2><div className="two-col">{note("vocals", "Lead voices, duet parts, diction, harmonies and ad-libs…")}{note("instruments", "Tempo, groove, featured instruments, breakdown and drop…")}</div></div>
      : tab === "Visuals & promo" ? <div className="panel form-panel"><h2>Visual world & promotion</h2><div className="two-col">{note("cover", "Composition, palette, symbols and artwork ideas…")}{note("video", "Opening shot, lyric placement, transitions and clip ideas…")}</div>{note("promotion", "Platforms, teasers, captions, collaborators and release-day plans…")}</div>
      : tab === "Mix lab" ? <MixLab song={draft} songs={songs} saveProject={saveProject} saving={saving} save={persist}/>
      : <div className="panel form-panel"><h2>Release plan</h2><HelpField label="Target release date" tip="Record a date for your release plan. This does not schedule distribution." className="compact"><input type="date" value={draft.releaseDate} onChange={e => patch({ releaseDate: e.target.value })}/></HelpField><Checklist song={draft} toggle={index => patch({ done: draft.done.map((done, i) => i === index ? !done : done) })}/></div>}
      {tab === "Release" && release}
    </fieldset>
    <div className="editor-footer"><button className="secondary" disabled={saving} onClick={() => template(null, { ...draft, tags: tagsFrom(tagText) })}><Layers3 size={16}/> Save as template</button><button className="text-button" disabled={saving} onClick={() => { if (confirm(`Delete this song? ${deletionNotice} Any Community release will be unlisted.`)) void remove({...draft,name:draft.name.trim()||song.name,tags:tagsFrom(tagText)}); }}><Trash2 size={16}/> Delete song</button></div>
  </div>;
}

function VersionPanel({ field, value, versions, edit, copy, save }: {
  field: "lyrics" | "prompt"; value: string; versions: Song["versions"]["lyrics"]; edit: (value: string) => void;
  copy: (value: string) => Promise<void>; save: (label: string) => Promise<boolean>;
}) {
  const [label, setLabel] = useState("");
  const [version, setVersion] = useState("");
  const previous = versions.find(v => v.id === version);
  const title = fields[field];
  return <section className="panel form-panel">
    <div className="section-head"><h2><FileText size={18}/>{title}</h2><button className="secondary small" type="button" onClick={() => copy(value)} disabled={!value}><Copy size={14}/> Copy</button></div>
    <textarea className="writing" aria-label={title} value={value} rows={13} placeholder={field === "lyrics" ? "[Intro]\n\n[Verse]\n\n[Chorus]" : "Genre, tempo, vocal clarity, instrumentation and arrangement…"} onChange={e => edit(e.target.value)}/>
    {field === "lyrics" && <CleanLyricsChecker lyrics={value} change={edit}/>}
    <div className={`counter ${field === "lyrics" && value.length > 5000 ? "warning" : ""}`}>{value.length.toLocaleString()} characters{field === "lyrics" && " · 5,000 target"}</div>
    <form className="snapshot" onSubmit={async e => { e.preventDefault(); if (value.trim() && await save(label.trim() || `Version ${versions.length + 1}`)) setLabel(""); }}>
      <input aria-label={`${title} version name`} placeholder="Name this snapshot" maxLength={80} value={label} onChange={e => setLabel(e.target.value)}/><button className="secondary" disabled={!value.trim()}>Save version</button>
    </form>
    <label className="field">Version history <span className="muted">({versions.length})</span>
      <select value={version} onChange={e => setVersion(e.target.value)}><option value="">Choose a saved version</option>{versions.map(v => <option key={v.id} value={v.id}>{v.label==="Autosaved draft"?"Autosaved writing":v.label} · {dateText(v.date)}</option>)}</select>
    </label>
    {previous && <div className="version-preview"><pre>{previous.text}</pre><div className="actions"><button className="secondary small" onClick={() => { if (value === previous.text || !value.trim() || confirm("Replace the current text with this snapshot? Saved versions will stay in history.")) edit(previous.text); }}><ArrowDown size={14}/> Use version</button><button className="text-button" onClick={() => copy(previous.text)}>Copy version</button></div></div>}
  </section>;
}

const emptyMix: Mix = { id: "", name: "", notes: "", link: "" };
function MixLab({ song, save, saving, songs, saveProject }: { songs: Song[]; saveProject: (song: Song, message?: string) => Promise<boolean>; song: Song; save: (song: Song, message?: string) => Promise<boolean>; saving: boolean }) {
  const [left, setLeft] = useState(song.mixes[0]?.id ?? "");
  const [right, setRight] = useState(song.mixes[1]?.id ?? "");
  const [editing, setEditing] = useState<Mix | null>(null);
  const [linkError, setLinkError] = useState("");
  const a = song.mixes.find(m => m.id === left);
  const b = song.mixes.find(m => m.id === right);
  async function saveMix(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing?.name.trim()) return;
    const link = editing.link.trim();
    if (link && !/^https?:\/\/[^\s]+$/i.test(link)) { setLinkError("Enter a full http or https link."); return; }
    const item = { ...editing, id: editing.id || uid(), name: editing.name.trim(), link };
    const mixes = editing.id ? song.mixes.map(m => m.id === item.id ? item : m) : [...song.mixes, item];
    if (await save({ ...song, mixes }, "Mix saved")) {
      if (!left) setLeft(item.id); else if (!right && left !== item.id) setRight(item.id);
      setEditing(null); setLinkError("");
    }
  }
  function mixCard(side: string, item: Mix | undefined, value: string, choose: (id: string) => void) {
    return <div className="panel form-panel">
      <label className="field">Mix {side}<select value={value} onChange={e => choose(e.target.value)}><option value="">Choose a mix</option>{song.mixes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      {item ? <><div className="mix-title"><h3>{item.name}</h3>{song.preferred === item.id && <span className="preferred"><Check size={14}/> Preferred</span>}</div>
        <p className="mix-notes">{item.notes || "Add notes about the arrangement, mood, or performance."}</p>
        {item.link && <a className="text-button" href={item.link} target="_blank" rel="noreferrer">Open listening link <ArrowRight size={14}/></a>}
        <div className="actions"><button className="secondary" onClick={() => { setEditing(item); setLinkError(""); }}>Edit mix</button>
          {song.preferred !== item.id && <button className="secondary" disabled={saving} onClick={() => save({ ...song, preferred: item.id }, "Preferred mix updated")}>Mark preferred</button>}</div>
      </> : <p className="muted">Choose a mix or create an alternate direction.</p>}
    </div>;
  }
  return <section className="mixlab"><ProjectComparison songs={songs} song={song} saving={saving} save={saveProject}/>
    <div className="section-head"><h2>Side-by-side comparison</h2><button className="secondary" disabled={saving} onClick={() => { setEditing({ ...emptyMix }); setLinkError(""); }}><Plus size={16}/> Add mix</button></div>
    <div className="two-col">{mixCard("A", a, left, setLeft)}{mixCard("B", b, right, setRight)}</div>
    {editing && <form className="panel form-panel mix-form" onSubmit={saveMix}><h2>{editing.id ? "Edit mix" : "New mix or concept"}</h2>
      <label className="field">Mix name<input required autoFocus maxLength={100} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></label>
      <HelpField label="Listening link (optional)" tip="Add a link to an exported mix so you can open and listen to it from Mix Lab."><input type="url" value={editing.link} onChange={e => setEditing({ ...editing, link: e.target.value })} placeholder="https://…"/></HelpField>
      {linkError && <p className="notice" role="alert">{linkError}</p>}
      <HelpField label="Arrangement or concept notes" tip="Describe the difference between this mix and your other versions."><textarea rows={5} value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })}/></HelpField>
      <div className="actions"><button className="primary" disabled={saving}>Save mix</button><button type="button" className="secondary" disabled={saving} onClick={() => setEditing(null)}>Cancel</button>
        {editing.id && <button type="button" className="text-button danger" disabled={saving} onClick={async () => {
          if (!confirm("Delete this mix?")) return;
          if (await save({ ...song, mixes: song.mixes.filter(m => m.id !== editing.id), preferred: song.preferred === editing.id ? "" : song.preferred }, "Mix deleted")) {
            if (left === editing.id) setLeft(""); if (right === editing.id) setRight(""); setEditing(null);
          }
        }}>Delete mix</button>}</div></form>}
  </section>;
}
