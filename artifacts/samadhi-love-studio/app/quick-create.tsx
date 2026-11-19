"use client";
import {brand} from "./brand";
import { MusicLanguageControl } from "./music-language-control";
import { defaultLanguageChoice, resolveLanguage, isLanguageChoice, type LanguageChoice } from "./music-language";
import {playLooks,defaultPlayChoices,validPlayChoices,type PlayChoices,type PlayVisualRequest} from "./creative-play";
import {AudioFormatDownload} from "./audio-format-download";
import {StyleDNAControls} from "./style-dna-controls";
import {defaultSongMap,validSongMap,mapSeconds,mapArrangement,readStyleDNA,type SongMap} from "./style-dna";
import {MusicalAdBuilder} from "./musical-ad-builder";
import {adStyles,emptyMusicalAd,isMusicalAd,recoverMusicalAd,musicalAdPrompt,musicalAdSections,type MusicalAd} from "./musical-ad";
import {matchVocalToSong,promptPerformer,singingArrangements} from "./vocal-matching";
import {titlesFromLyrics} from "./song-cover";
import {creatorVocalDirection,defaultCreatorVocals,worldFusionRecipes,type CreatorVocalOptions} from "./creator-music-options";
import {engineCapabilities} from "./music-engine-data";
import {SoundSoulPicker,VoicePicker,splitPicks} from "./shape-it-controls";
import {performanceWeight} from "./song-opening";
import {readSavedAd,readSavedShape,type PromptDraft} from "./saved-song-prompts";
import type {Template} from "./studio-data";
import {SongOpeningControl} from "./song-opening-control";
import {defaultCreateChoice,recoverCreateChoice,resolveCreateMode,type CreateChoice} from "./quick-create-mode";
import type {SongOpening} from "./song-opening";

import { HelpField } from "./help-tip";
import {SongCard} from "./song-card";
import {RecoveryPanel,useDraftRecovery} from "./draft-recovery";
import {useAccountWriting} from "./use-account-writing";
import { genreTags } from "./music-genres";
import { GenreAssistant } from "./genre-assistant";
import { fusionGenres, suggestGenreFusion } from "./genre-assist";
import { useEffect,useRef,useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Braces, Music2, Settings2, Sparkles, Star } from "lucide-react";
import { CleanLyricsChecker } from "./clean-lyrics-checker";
import { AudioPlayer } from "./audio-player";
import { LyricNotationPreview } from "./lyric-notation-preview";
import { parseLyricNotation } from "./lyric-notation";
import { cleanWordsMessage, hasExplicitWords } from "./clean-content";
import { type Instrumental } from "./creation-guide";
import { renderInstrumental } from "./instrumental";
import { songBlueprint } from "./song-blueprint";
import { songAudioUrl, type Song } from "./studio-data";
import { autoTrackTime, formatTrackTime, parseTrackTime, maxGeneratedSongSeconds } from "./track-duration";
import { TrackLengthControl } from "./track-length-control";
import { expandSongDescription, insertLyricSection } from "./creation-shortcuts";
import { MelodyReferenceRecorder, type MelodyReferenceTake } from "./melody-reference-recorder";
import "./cosmic-views.css";


/** A prefill handed to Create from recipes, World Sounds, helpers, Promote or legacy links. Never submits. */
export type QuickSeed = { id: string; idea?: string; styles?: string[]; lyrics?: string; vocal?: string; instruments?: string; title?: string; custom?: boolean; projectId?: string; languageChoice?: LanguageChoice; panel?: "prompts" | "vocals" | "lyrics" | "style" | "recipes" | "pro"; ad?: MusicalAd; notice?: string };
export function seedFromTemplate(t: Template, id: string): QuickSeed {
  return { id, custom: true, title: t.name, styles: t.tags, lyrics: t.notes.lyrics, vocal: t.notes.vocals, instruments: t.notes.instruments, idea: t.notes.prompt.split("\n\nOpening:")[0], notice: `Recipe "${t.name}" loaded. Review, then Create.` };
}
export function QuickCreate({ engine,favoriteTake,proProduction, seed=null, recipes=[], editRecipe, promptHelpers, vocalHelpers,  connected, connectionError, connectionChecking=false, refreshConnection, saving, drafts, settings, guided, openDrafts, generateSong, saveSketch,working, makeVideo, publish, savedPrompts=[],savePrompt,favoritePrompt,autoSavePrompts=false,setAutoSavePrompts,saveMelodyReference,autoCover,openLogo,simpleExperience=false,recordVoice,uploadOwn,writeLyrics }: {
  /** User-triggered lyric writing before Begin. Returns editable lyrics; never generates music. */
  writeLyrics?:(input:Record<string,unknown>)=>Promise<string|undefined>;
  engine?:import("./music-engine-data").MusicEngineStatus;favoriteTake?:(id:string)=>Promise<void>;
  connected: boolean; saving: boolean; drafts: Song[]; settings: () => void; guided: () => void; openDrafts: () => void;
  connectionError?: string; connectionChecking?: boolean; refreshConnection?: () => void;
  generateSong: (input: { title: string; prompt: string; arrangement: string; duration: number; versions?:1|2;openingMode?: SongOpening; lyrics?:string; voice?:string; instruments?:string; genres?:string; autoTitle?:boolean; instrumental?:boolean; negativeStyle?:string; spark?:number; musicalAd?:MusicalAd; language?:LanguageChoice["language"]; dialect?:LanguageChoice["dialect"]; projectId?:string }) => Promise<string | {songId:string;songIds?:string[];warning?:string} | undefined>;
  saveSketch: (file: File, title: string, prompt: string, arrangement: string, settings: Instrumental,saveId?:string) => Promise<string | undefined>;
  working?:(value:boolean)=>void;
  makeVideo?:(song:Song,short?:boolean,visual?:PlayVisualRequest)=>void|Promise<void>;
  simpleExperience?:boolean;recordVoice?:()=>void;uploadOwn?:()=>void; publish?:(song:Song)=>void;
  autoCover?:(song:Song)=>Promise<void>;openLogo?:()=>void;
   savedPrompts?:Template[];savePrompt?:(draft:PromptDraft)=>Promise<Template|undefined>;
   favoritePrompt?:(id:string,favorite:boolean)=>Promise<boolean>;
    autoSavePrompts?:boolean;setAutoSavePrompts?:(enabled:boolean)=>void;
   saveMelodyReference?:(songId:string,blob:Blob,durationSeconds:number)=>Promise<boolean>;
  seed?:QuickSeed|null; recipes?:Template[]; editRecipe?:(template:Template|null)=>void;
  /** The full production engine (CreateStudio). Rendered outside this form, always mounted, shown in Custom. */
  proProduction?:ReactNode;
  promptHelpers?:(apply:(seed:QuickSeed)=>void)=>ReactNode; vocalHelpers?:(apply:(seed:QuickSeed)=>void)=>ReactNode;
}) {
  const falActive=engine?.owner===true&&engine.engine==="ace-step";
  connected=connected||falActive;
  const [playStage,setPlayStage]=useState<"start"|"play"|"share">("start");
  const [playChoices,setPlayChoices]=useState<PlayChoices>(defaultPlayChoices),[previousChoices,setPreviousChoices]=useState<PlayChoices|null>(null);
  const [photo,setPhoto]=useState<Blob|null>(null),[photoName,setPhotoName]=useState("");
  const [takeIds,setTakeIds]=useState<string[]>([]);
  const createForm=useRef<HTMLFormElement>(null);
  const lyricInput=useRef<HTMLTextAreaElement>(null);
  function changePlay(next:PlayChoices){setPreviousChoices(playChoices);setPlayChoices(next);try{localStorage.setItem("samadhi:last-video-look:v1",playLooks[next.look].preset);}catch{}}
  const [idea, setIdea] = useState("");
  // Two takes is the default for every new song. ElevenLabs keeps its double-cost confirmation at Begin.
  const [makeTwoVersions,setMakeTwoVersions]=useState(true);
  const caps=engineCapabilities[engine?.engine??"elevenlabs"];
  const [negativeStyle,setNegativeStyle]=useState(""),[spark,setSpark]=useState<number|null>(null),[wordsByStudio,setWordsByStudio]=useState(false);
  const [includeWords,setIncludeWords]=useState(false),[lyricStatus,setLyricStatus]=useState(""),[lyricBusy,setLyricBusy]=useState(false);
  const [melodyTakes,setMelodyTakes]=useState<MelodyReferenceTake[]>([]);
  const [melodyStatus,setMelodyStatus]=useState("");
  const [songMap,setSongMap]=useState<SongMap>(defaultSongMap),[mapEnabled,setMapEnabled]=useState(false);
  const [adMode,setAdMode]=useState(false),[adBrief,setAdBrief]=useState<MusicalAd>(emptyMusicalAd);
  const [customMode,setCustomMode]=useState(false);
  const [songTitle,setSongTitle]=useState(""),[voiceEdit,setVoiceEdit]=useState<string|null>(null),[promptNotice,setPromptNotice]=useState(""),[promptBusy,setPromptBusy]=useState(false);
  const [vocalOptions,setVocalOptions]=useState<CreatorVocalOptions>(defaultCreatorVocals);
  const [ownLyrics,setOwnLyrics]=useState(false),[lyrics,setLyrics]=useState("");
  const [languageChoice,setLanguageChoice]=useState<LanguageChoice>(defaultLanguageChoice);
  const [autoLength,setAutoLength]=useState(true),[manualTime,setManualTime]=useState("");
  const [openingMode,setOpeningMode]=useState<SongOpening>("auto");
  const [choice, setChoice] = useState<CreateChoice>(defaultCreateChoice);
  const [genreEdit, setGenreEdit] = useState<string | null>(null);
  const [autoGenre,setAutoGenre]=useState(false),[useHistory,setUseHistory]=useState(true),[fusionName,setFusionName]=useState(""),[fusionVariation,setFusionVariation]=useState(0);
  const [instrumentsEdit, setInstrumentsEdit] = useState<string | null>(null);
  const [codeEdit, setCodeEdit] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [resultId, setResultId] = useState<string>();
  const [pendingTake,setPendingTake]=useState<{blob:Blob;url:string;title:string;prompt:string;code:string;take:Instrumental;saveId:string}>();
  useEffect(()=>()=>{if(pendingTake)URL.revokeObjectURL(pendingTake.url);},[pendingTake?.url]);
  useEffect(()=>{working?.(pending);return()=>working?.(false);},[pending,working]);
  const recovery=useDraftRecovery("quick-create",{autoLength,manualTime,languageChoice,playChoices,photo,photoName,resultId,takeIds,songMap,mapEnabled,idea,choice,openingMode,customMode,adMode,adBrief,songTitle,voiceEdit,vocalOptions,ownLyrics,lyrics,genreEdit,instrumentsEdit,codeEdit,autoGenre,useHistory,fusionName,fusionVariation,makeTwoVersions,negativeStyle,spark,wordsByStudio,melodyTakes,pendingTake:pendingTake?{...pendingTake,url:undefined}:undefined},value=>{
    setAutoLength(value.autoLength!==false);setManualTime(typeof value.manualTime==="string"?value.manualTime:"");
    if(isLanguageChoice(value.languageChoice))setLanguageChoice(value.languageChoice);
    if(validPlayChoices(value.playChoices))setPlayChoices(value.playChoices);if(value.photo instanceof Blob){setPhoto(value.photo);setPhotoName(value.photoName??"My photo");}else{setPhoto(null);setPhotoName("");}setResultId(typeof value.resultId==="string"?value.resultId:undefined);if(Array.isArray(value.takeIds))setTakeIds(value.takeIds.filter((id):id is string=>typeof id==="string").slice(-8));
    setAdMode(value.adMode===true);setAdBrief(recoverMusicalAd(value.adBrief));
    setMakeTwoVersions(value.makeTwoVersions!==false);setNegativeStyle(typeof value.negativeStyle==="string"?value.negativeStyle:"");setSpark(typeof value.spark==="number"&&value.spark>=0&&value.spark<=2?value.spark:null);setWordsByStudio(value.wordsByStudio===true);
    const recoveredTakes=Array.isArray(value.melodyTakes)?[...value.melodyTakes]:[];
    const priorDraft=value as typeof value & {melodyTake?:unknown;melodyDurationSeconds?:number};
    if(typeof Blob!=="undefined"&&priorDraft.melodyTake instanceof Blob)recoveredTakes.unshift({id:`recovered-${Date.now()}`,blob:priorDraft.melodyTake,durationSeconds:priorDraft.melodyDurationSeconds??30});
    setMelodyTakes(recoveredTakes.filter((take:any)=>take&&typeof take.id==="string"&&typeof Blob!=="undefined"&&take.blob instanceof Blob&&Number.isFinite(take.durationSeconds)).map((take:any)=>({...take,durationSeconds:Math.max(1,Math.min(300,Math.round(take.durationSeconds)))})));
    setSongTitle(value.songTitle??"");setVoiceEdit(value.voiceEdit??null);setCustomMode(value.customMode===true);setVocalOptions({...defaultCreatorVocals,...value.vocalOptions});setOwnLyrics(value.ownLyrics===true);setLyrics(typeof value.lyrics==="string"?value.lyrics:"");
    if(validSongMap(value.songMap))setSongMap(value.songMap);setMapEnabled(value.mapEnabled===true);setIdea(value.idea);setChoice(recoverCreateChoice(value.choice));setOpeningMode(value.openingMode&&["auto","direct","short"].includes(value.openingMode)?value.openingMode:"auto");setGenreEdit(value.genreEdit);setInstrumentsEdit(value.instrumentsEdit);setCodeEdit(value.codeEdit);setAutoGenre(value.autoGenre);setUseHistory(value.useHistory);setFusionName(value.fusionName);setFusionVariation(value.fusionVariation);
    if(value.pendingTake){if(!(value.pendingTake.blob instanceof Blob))throw new Error("The device recording is unavailable. Check Your songs before retrying.");setPendingTake({...value.pendingTake,url:URL.createObjectURL(value.pendingTake.blob)});}else setPendingTake(undefined);
  },!!photo||ownLyrics&&!!lyrics.trim()||mapEnabled||!!idea.trim()||!!pendingTake||melodyTakes.length>0||adMode&&!!(adBrief.brand||adBrief.benefit||adBrief.cta));
  const [proOpen,setProOpen]=useState(seed?.panel==="pro");
  const [promptSearch,setPromptSearch]=useState(""),[favoritePromptsOnly,setFavoritePromptsOnly]=useState(false),[promptName,setPromptName]=useState("");
  const [listenReference,setListenReference]=useState("");
  const [openPanel,setOpenPanel]=useState(seed?.panel??""),[panelKey,setPanelKey]=useState(0),[recipeId,setRecipeId]=useState("");
  function applySeed(next:QuickSeed){
    const content=!!(next.idea||next.lyrics||next.styles?.length||next.vocal||next.instruments||next.ad);
    if(content&&(idea.trim()||lyrics.trim())&&!confirm("Replace your current unsaved description and lyrics with this selection?"))return;
    if(next.custom||next.lyrics||next.vocal||next.ad||next.panel&&next.panel!=="recipes")setCustomMode(true);
    if(next.idea!==undefined)setIdea(next.idea.slice(0,1200));
    if(isLanguageChoice(next.languageChoice))setLanguageChoice(next.languageChoice);
    if(next.lyrics!==undefined){const words=performanceWeight(next.lyrics)>0;setLyrics(words?next.lyrics.slice(0,5000):"");setOwnLyrics(words);if(!words&&next.lyrics.trim())setCodeEdit(next.lyrics.slice(0,2000));}
    if(next.styles?.length){setAutoGenre(false);setGenreEdit(next.styles.join(", "));}
    if(next.vocal)setVoiceEdit(next.vocal.slice(0,1000));
    if(next.instruments)setInstrumentsEdit(next.instruments);
    if(next.title)setSongTitle(next.title.slice(0,100));
    if(next.ad){setAdMode(true);setAdBrief(next.ad);setChoice("vocals");setCodeEdit(musicalAdSections(next.ad));setOpeningMode("direct");}
    if(next.panel==="pro"){setProOpen(true);window.setTimeout(()=>document.querySelector("[data-testid=fold-pro-production]")?.scrollIntoView?.({block:"start"}),0);}
    else if(next.panel){setOpenPanel(next.panel);setPanelKey(k=>k+1);}
    setError("");if(next.notice)setPromptNotice(next.notice);
  }
  const appliedSeed=useRef("");
  useEffect(()=>{if(seed&&appliedSeed.current!==seed.id){appliedSeed.current=seed.id;applySeed(seed);}},[seed?.id]);
  const simple=!customMode;
  const adActive=customMode&&adMode;
  const playful=simpleExperience&&simple;
  const mode=resolveCreateMode(choice,connected,simple);
  const instrumental = mode.instrumental;
  const localSketch=customMode&&mode.localSketch;
  const useOwnLyrics=customMode&&!instrumental&&!wordsByStudio&&!!lyrics.trim();
  const fusion=suggestGenreFusion(idea,codeEdit??"",drafts,useHistory,fusionVariation);
  const chosenGenre=genreEdit??(autoGenre?fusionGenres(fusion,fusionName).join(", "):null);
  const blueprint = songBlueprint([chosenGenre, idea].filter(Boolean).join(", "), instrumental);
  // Simple sends only the user's own description; Custom sends only what the creator wrote or chose.
  // Complete picks are stored and saved; only the first ~20 guide the engine prompt.
  const genre = simple?"":(chosenGenre ?? "");
  const instruments = simple?"":(instrumentsEdit ?? "");
  const guidedPicks=splitPicks(genre,instruments);
  const engineGenre=guidedPicks.genres.join(", "),engineInstruments=guidedPicks.instruments.join(", ");
  const mapOn=customMode&&mapEnabled&&!adActive;
  const code = simple?"":mapOn&&validSongMap(songMap)?mapArrangement(songMap):codeEdit ?? "";
  const targetBpm=mapOn?songMap.bpm:blueprint.bpm;
  const inferredPerformer=promptPerformer(idea);
  const chosenPerformer=vocalOptions.delivery===defaultCreatorVocals.delivery?inferredPerformer:vocalOptions.delivery;
  const vocalDirection=instrumental?"":((customMode?voiceEdit:null)??[
    creatorVocalDirection({...(simple?defaultCreatorVocals:vocalOptions),delivery:chosenPerformer??defaultCreatorVocals.delivery}),
    matchVocalToSong(idea,genre,instruments),
  ].join(" "));
  let intentIssue="";
  if(!instrumental&&!localSketch) {
    try {
      resolveLanguage(languageChoice,useOwnLyrics?lyrics:"",idea);
    } catch (e) { intentIssue=e instanceof Error?e.message:"Choose the singing language."; }
    if(inferredPerformer&&vocalOptions.delivery!==defaultCreatorVocals.delivery&&inferredPerformer!==vocalOptions.delivery)
      intentIssue="Your singing arrangement conflicts with the description. Change the arrangement or description before creating.";
  }
  const songTiming=autoTrackTime({vocals:!instrumental,lyrics:useOwnLyrics?lyrics:"",bpm:blueprint.bpm,cinematic:false,prompt:idea,sectionCount:code.match(/^\s*\[[^\]\r\n]+\]\s*$/gm)?.length});
  const baseTiming=adActive?{seconds:adBrief.seconds,reason:"Based on your musical advertisement length."}:mapOn&&validSongMap(songMap)&&!songTiming.explicit?{seconds:mapSeconds(songMap),reason:"Based on your song map targets."}:songTiming;
  const timing=!autoLength&&!adActive&&!mapOn?{...baseTiming,seconds:parseTrackTime(manualTime||formatTrackTime(baseTiming.seconds))??0}:baseTiming;
  const result = drafts.find(song => song.id === resultId && !song.deletedAt);
  useEffect(()=>{if(resultId){setTakeIds(ids=>[...ids.filter(id=>id!==resultId),resultId].slice(-8));setPlayStage("play");}},[resultId]);
  const covered=useRef("");
  useEffect(()=>{if(!autoCover||!result?.audioFormat||result.coverAsset||covered.current===result.id||saving||pending)return;covered.current=result.id;void autoCover(result).then(()=>setPromptNotice("Cover created automatically from your title.")).catch(()=>setPromptNotice("Song saved. Automatic cover could not save; use Create / animate cover to retry."));},[result?.id,result?.coverAsset,saving,pending,autoCover]);
  const busy = saving || pending || promptBusy || lyricBusy;
  async function writeWordsForMe(){
    if(!writeLyrics||lyricBusy)return;
    if(!idea.trim()&&!genre.trim()){setLyricStatus("Add your vision first, so the words have something to say.");return;}
    if(lyrics.trim()&&!confirm("Replace your current lyrics with newly written words? Yours are not kept after replacing."))return;
    setLyricBusy(true);setLyricStatus("Writing your words…");
    try{
      const language=resolveLanguage(languageChoice,useOwnLyrics?lyrics:"",idea).resolved;
      const prompt=["Write original lyrics for this song.",idea.trim()&&`Vision: ${idea.trim()}`,engineGenre&&`Sound and mood: ${engineGenre}`,engineInstruments&&`Instruments: ${engineInstruments}`,vocalDirection&&`Vocal delivery: ${vocalDirection}`].filter(Boolean).join("\n");
      if(prompt.length>1600)throw new Error("Shorten the vision or sound directions before writing lyrics.");
      const written=await writeLyrics({prompt,genres:engineGenre,instruments:engineInstruments,voice:vocalDirection,title:songTitle.trim(),language,dialect:languageChoice.dialect,duration:timing.seconds,autoLength:autoLength&&!mapOn&&!adActive});
      if(!written?.trim()){setLyricStatus("No words came back. Your writing is unchanged; try again.");return;}
      if(written.length>5000)throw new Error("Those words are too long to load safely. Your previous writing is unchanged.");
      setLyrics(written);setOwnLyrics(true);setWordsByStudio(false);setCustomMode(true);if(choice==="instrumental")setChoice("vocals");setError("");
      setLyricStatus("Words written. Edit them freely; Begin sings them as they are.");
    }catch(cause){setLyricStatus(`Words could not be written: ${cause instanceof Error?cause.message:"try again."} Your writing is unchanged.`);}
    finally{setLyricBusy(false);}
  }
  async function saveMelodyReferencesToSong(songId:string){
    if(!melodyTakes.length)return;
    if(!saveMelodyReference){setMelodyStatus("The song saved. Its melody takes are still kept on this device because private song storage is unavailable.");return;}
    const remaining=[...melodyTakes];let saved=0;
    while(remaining.length){
      const take=remaining[0];
      try{if(!await saveMelodyReference(songId,take.blob,take.durationSeconds))break;}
      catch{break;}
      remaining.shift();saved++;setMelodyTakes([...remaining]);
    }
    if(!remaining.length)setMelodyStatus(`Saved ${saved} private melody reference${saved===1?"":"s"} with the song. They were not sent to ElevenLabs.`);
    else setMelodyStatus(`Saved ${saved} reference${saved===1?"":"s"}; ${remaining.length} take${remaining.length===1?" remains":"s remain"} on this device. Check Your songs before retrying.`);
  }
  async function savePending(t:NonNullable<typeof pendingTake>){
    const id=await saveSketch(new File([t.blob],"quick-studio-sketch.wav",{type:"audio/wav"}),t.title,t.prompt,t.code,t.take,t.saveId);
    if(id){await saveMelodyReferencesToSong(id);URL.revokeObjectURL(t.url);setResultId(id);setPendingTake(undefined);}else setError("Your instrumental is ready but its save could not be confirmed. Download it below or Retry save to Your songs.");
  }
  function switchMode(custom:boolean){
    setCustomMode(custom);setError("");
    if(!custom&&choice==="sketch"){setChoice("instrumental");setPromptNotice("Built-in sketch is a Custom advanced option. Simple uses your music account.");}
  }
  function addLyricSection(section:string){
    const field=lyricInput.current;
    const start=field?.selectionStart??lyrics.length,end=field?.selectionEnd??start;
    const inserted=insertLyricSection(lyrics,start,end,section);
    setLyrics(inserted.text.slice(0,5000));setOwnLyrics(true);setError("");
    const restoreCursor=()=>{const target=lyricInput.current;if(target){target.focus();const cursor=Math.min(inserted.cursor,inserted.text.length);target.setSelectionRange(cursor,cursor);}};
    if(typeof window.requestAnimationFrame==="function")window.requestAnimationFrame(restoreCursor);else window.setTimeout(restoreCursor,0);
  }
  function currentPromptDraft(confirmedSong=false):PromptDraft{
    return {
      name:(promptName.trim()||(customMode?songTitle.trim():"")||idea.trim().slice(0,72)||"My saved prompt").slice(0,100),
      tags:genreTags(genre),
      lyrics:(confirmedSong||includeWords)&&customMode&&(!confirmedSong||useOwnLyrics)?lyrics.trim():"",
      idea:confirmedSong||includeWords||simple?idea.trim():"",
      instruments:instruments.trim(),
      vocals:vocalDirection.trim(),
      shape:{negativeStyle,...(spark!==null?{spark}:{}),delivery:vocalOptions.delivery,character:vocalOptions.character},
    };
  }
  function useSavedPrompt(preset:Template){
    const shape=readSavedShape(preset);
    const applyShape=()=>{setNegativeStyle(shape?.negativeStyle??"");setSpark(shape?.spark??null);if(shape?.delivery||shape?.character)setVocalOptions(v=>({...v,...(shape.delivery?{delivery:shape.delivery}:{}),...(shape.character?{character:shape.character}:{})}));};
    const dna=readStyleDNA(preset);
    if(dna){setAutoGenre(false);setGenreEdit(dna.genres.length?dna.genres.join(", "):null);setInstrumentsEdit(dna.instruments||null);setVoiceEdit(dna.vocals||null);setSongMap({bpm:dna.bpm,sections:dna.sections});setMapEnabled(true);setCustomMode(true);applyShape();setPromptNotice(`"${preset.name}" applied: sound, voice and song map. Your words stay unchanged.`);return;}
    const savedIdea=preset.notes.prompt.split("\n\nOpening:")[0];
    const hasWords=!!(savedIdea.trim()||preset.notes.lyrics.trim());
    if(hasWords&&(idea.trim()||lyrics.trim())&&!confirm("Load this saved sound with its words in place of your current unsaved writing?"))return;
    setAutoGenre(false);
    if(hasWords){setIdea(savedIdea);setLyrics(preset.notes.lyrics);setOwnLyrics(performanceWeight(preset.notes.lyrics)>0);setWordsByStudio(false);}
    setGenreEdit(preset.tags.length?preset.tags.join(", "):null);
    setInstrumentsEdit(preset.notes.instruments||null);
    setVoiceEdit(preset.notes.vocals||null);
    if(hasWords)setSongTitle(preset.name);
    applyShape();
    const ad=readSavedAd(preset.notes.promotion);
    setAdMode(!!ad);
    if(ad)setAdBrief(ad);
    setCodeEdit(ad?musicalAdSections(ad):null);
    setCustomMode(true);
    setPromptNotice(hasWords?`"${preset.name}" loaded with its words. Begin makes a new song.`:`"${preset.name}" applied to Sound & Soul and Voice. Your words stay unchanged.`);
  }
  const writingStatus=useAccountWriting("simple",{title:songTitle.trim(),prompt:idea,lyrics,voice:voiceEdit??""},recovery.ready&&!saving&&!pending&&!!(idea.trim()||lyrics.trim()||songTitle.trim()),w=>{setSongTitle(w.title);setIdea(w.prompt);setLyrics(w.lyrics);setVoiceEdit(w.voice||null);if(w.lyrics||w.voice){setCustomMode(true);setOwnLyrics(!!w.lyrics);}},recovery);
  function startFresh(broadcast=true){
    const blank:Parameters<typeof recovery.reset>[0]={autoLength:true,manualTime:"",languageChoice:defaultLanguageChoice,playChoices:defaultPlayChoices,photo:null,photoName:"",resultId:undefined,takeIds:[],songMap:defaultSongMap,mapEnabled:false,idea:"",choice:defaultCreateChoice,openingMode:"auto",customMode:false,adMode:false,adBrief:emptyMusicalAd,songTitle:"",voiceEdit:null,vocalOptions:defaultCreatorVocals,ownLyrics:false,lyrics:"",genreEdit:null,instrumentsEdit:null,codeEdit:null,autoGenre:false,useHistory:true,fusionName:"",fusionVariation:0,makeTwoVersions:true,negativeStyle:"",spark:null,wordsByStudio:false,melodyTakes:[],pendingTake:undefined};
    void recovery.reset(blank);writingStatus.reset({title:"",prompt:"",lyrics:"",voice:""});
    if(broadcast)window.dispatchEvent(new window.CustomEvent("versual:new-song",{detail:{scope:recovery.scope,source:"quick"}}));
    setPlayStage("start");setPreviousChoices(null);setError("");setPromptNotice("");setMelodyStatus("");setRecipeId("");setOpenPanel("");
  }
  const freshCreateRef=useRef(()=>{});freshCreateRef.current=()=>startFresh(false);
  useEffect(()=>{
    const fresh=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.scope===recovery.scope&&detail.source!=="quick")freshCreateRef.current();};
    window.addEventListener("versual:new-song",fresh);return()=>window.removeEventListener("versual:new-song",fresh);
  },[recovery.scope]);
  const promptLibraryItems=savedPrompts.filter(t=>(!favoritePromptsOnly||t.favorite)&&
    (!promptSearch.trim()||[t.name,t.description,...t.tags,...Object.values(t.notes)].some(text=>text.toLowerCase().includes(promptSearch.trim().toLowerCase()))));

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (mode.blocked) { setError(instrumental?"Instrumentals need a connected music account. Connect it, or turn off Instrumental.":"Singing needs a connected music account. Connect your music account to create this song."); return; }
    if (simple&&!idea.trim()) { setError("Describe your song first: what it is about, plus any genre, mood or language you want."); return; }
    if (customMode&&!idea.trim()&&!useOwnLyrics&&!genre.trim()) { setError("Add lyrics, styles or a short description before creating."); return; }
    if(mapOn&&!validSongMap(songMap)){setError("Check the song map tempo and section durations before creating.");return;}
    if(!adActive&&autoLength&&(!mapOn||songTiming.explicit)&&songTiming.overLimit){setError("Songs can be up to 6:00. Choose a shorter length.");return;}
    if(timing.seconds<3||timing.seconds>maxGeneratedSongSeconds){setError("Choose Auto or a length from 0:03 to 6:00.");return;}
    if(localSketch&&timing.seconds>360){setError("Local instrument sketches support six minutes. Choose a shorter length.");return;}
    if(adActive&&!isMusicalAd(adBrief)){setError("Complete the product name, benefit and call to action before creating your ad.");return;}
    if (useOwnLyrics && parseLyricNotation(lyrics).errors.length) { setError(parseLyricNotation(lyrics).errors[0]); return; }
    if (useOwnLyrics && !performanceWeight(lyrics)) {setError("Add words to sing, or clear the lyrics box so they are written for you. Section labels alone are not finished lyrics.");return;}
    if (hasExplicitWords(idea, genre, instruments, code,useOwnLyrics?lyrics:"")) { setError(cleanWordsMessage); return; }
    if (!instrumental && !localSketch) {
      try { resolveLanguage(languageChoice, useOwnLyrics ? lyrics : "",idea); if(intentIssue)throw new Error(intentIssue); }
      catch (error) { setError((error as Error).message); return; }
    }
    if(makeTwoVersions&&!localSketch&&!falActive&&!window.confirm("Make two versions? This uses double your ElevenLabs credits. If the second version fails, the first stays saved."))return;
    setError(""); setPending(true);
    try {
      const described = simple
        ? idea.trim()
        : [engineGenre ? `Style: ${engineGenre}.` : "", idea.trim(), ...(!instrumental&&!useOwnLyrics?["Write coherent original lyrics with a memorable chorus. Style notes are directions, not words to sing."]:[]), mapOn?`Tempo: ${targetBpm} BPM.`:"", engineInstruments?`Instruments: ${engineInstruments}.`:""].filter(Boolean).join("\n");
      const prompt = described || (useOwnLyrics ? "Create an original song using the exact supplied lyrics." : "");
      if(prompt.length>1600)throw new Error("These combined directions are too long. Shorten your description or styles so everything reaches the music provider.");
      if(customMode&&caps.negativeStyle&&negativeStyle.trim().length>500)throw new Error("Keep Leave Out to 500 characters or fewer. Your saved sound has not changed.");
      const duration = timing.seconds;
      const title = ((customMode&&songTitle.trim())||((genre.trim().split(",")[0] || "Studio") + (localSketch ? " Sketch" : instrumental ? " Instrumental" : " Song"))).slice(0,100);
      if (localSketch) {
        const preset = songBlueprint([genre,idea,instruments].join(" "), true).preset;
        const take: Instrumental = { preset, bpm: targetBpm, seconds: duration, tonic: 9,
          minor: preset === "dabke" || preset === "soul", arrangement: /\b(?:steady|meditation|ambient)\b/i.test(genre) ? "steady" : "build",
          seed: crypto.getRandomValues(new Uint32Array(1))[0] };
        const blob = await renderInstrumental(take);
        const prepared={blob,url:URL.createObjectURL(blob),title,prompt,code:code||blueprint.code,take,saveId:crypto.randomUUID()};setPendingTake(prepared);await savePending(prepared);
      } else {
        const input={title,prompt,languagePrompt:idea,autoLength:autoLength&&!adActive&&!mapOn,arrangement:code,duration,openingMode:customMode?openingMode:"auto" as SongOpening,lyrics:useOwnLyrics?lyrics:"",voice:vocalDirection,instruments:engineInstruments,genres:engineGenre,...(customMode&&caps.negativeStyle&&negativeStyle.trim()?{negativeStyle:negativeStyle.trim().slice(0,500)}:{}),...(customMode&&caps.spark&&spark!==null?{spark}:{}),autoTitle:!(customMode&&songTitle.trim()),instrumental,...languageChoice,...(adActive?{musicalAd:adBrief}:{}),...(seed?.projectId?{projectId:seed.projectId}:{})};
        const answer=await generateSong({...input,...(falActive?{versions:makeTwoVersions?2 as const:1 as const}:{})});
        const made=typeof answer==="string"?answer:answer?.songId;
        if(made){
          const madeIds=typeof answer==="object"&&answer.songIds?.length?[...answer.songIds]:[made];setResultId(made);
          if(typeof answer==="object"&&answer.warning)setError(answer.warning);
          if(melodyTakes.length)await saveMelodyReferencesToSong(made);
          if(makeTwoVersions&&!falActive){
            try{
              const secondAnswer=await generateSong({...input,title:(title+" · Version 2").slice(0,100),projectId:seed?.projectId??made});
              const second=typeof secondAnswer==="string"?secondAnswer:secondAnswer?.songId;
              if(second)madeIds.push(second);
              else setError("Version 1 is saved. Version 2 was not confirmed; check Your songs and provider history before retrying.");
            }catch(cause){setError(`Version 1 is saved. Version 2 was not confirmed: ${cause instanceof Error?cause.message:"check Your songs before retrying."}`);}
          }
          setTakeIds(ids=>[...new Set([...ids,...madeIds])].slice(-8));setResultId(madeIds.at(-1));
          if(autoSavePrompts&&savePrompt){
            try{
              const saved=await savePrompt(currentPromptDraft(true));
              setPromptNotice(saved?"Song and prompt saved privately.":"Song saved; automatic prompt saving could not be confirmed. Your song is safe.");
            }catch{setPromptNotice("Song saved; automatic prompt saving could not be confirmed. Your song is safe.");}
          }
        }else setError("This take was not confirmed. Your previous songs are safe. Check Your songs before retrying.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Studio could not create the track. Try again.");
    } finally { setPending(false); }
  }

  return <section className="create-banner quick-create nebula-forge" data-playful={playful} aria-labelledby="quick-create-heading">
    <RecoveryPanel recovery={recovery}/>
    {writingStatus.status&&<small role="status">{writingStatus.status}</small>}
    <div className="eyebrow"><Sparkles size={15}/> {brand.name} · THE NEBULA FORGE</div>
    <span className="forge-glow" aria-hidden="true"/>
    <h1 id="quick-create-heading">Begin a song</h1>
    <button type="button" className="secondary small" disabled={busy} onClick={()=>startFresh()}>New song</button>
    <p className="forge-sub hologram-guide">A few words are enough. Nothing is sent until you press Begin.</p>
    <div className="qc-status" data-connected={connected} data-testid="status-provider" role="status">
      <span className="qc-dot" aria-hidden="true"/>
      <strong>{connectionChecking?"Checking music account…":connected?"Music account connected":"Music account not connected"}</strong>
      <span className="muted" role={connectionError?"alert":undefined}>{connectionError||(connectionChecking?"Checking your saved connection.":connected?"Your key is saved.":"Singing needs a connected music account.")}</span>
      {!connected&&refreshConnection&&<button type="button" className="secondary small" disabled={busy||connectionChecking} onClick={refreshConnection}>Refresh connection</button>}
      {!connected&&<button type="button" className="primary small" data-testid="button-connect-music" disabled={busy} onClick={settings}><Settings2 size={15}/> Connect music account</button>}
    </div>
    <form ref={createForm} onSubmit={create}>
      <fieldset disabled={busy}>
        <div className="forge-grid"><div className="forge-main">
        <div className="qc-modes" role="tablist" aria-label="How do you want to begin">
          <button type="button" role="tab" aria-selected={simple} data-testid="tab-mode-simple" onClick={()=>switchMode(false)}>Just Begin</button>
          <button type="button" role="tab" aria-selected={customMode} data-testid="tab-mode-custom" onClick={()=>switchMode(true)}>Shape It</button>
        </div>
        {simple?<div className="just-begin" data-testid="panel-just-begin">
          <label className="field qc-field jb-vision">Your Vision
            <textarea data-testid="input-song-description" rows={1} maxLength={1200} value={idea} placeholder="A hopeful song about starting again" onChange={e=>{setIdea(e.target.value.replace(/[\r\n]+/g," "));setError("");}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();createForm.current?.requestSubmit();}}}/></label>
          {hasExplicitWords(idea) && <CleanLyricsChecker lyrics={idea} change={value => { setIdea(value); setError(""); }} direction label="Clean song description"/>}
          <div className="jb-row">
            <MusicLanguageControl compact value={languageChoice} change={next=>{setLanguageChoice(next);setError("");}} lyrics="" prompt={idea} disabled={busy}/>
            <label className="qc-check" data-testid="status-create-mode"><input type="checkbox" data-testid="checkbox-instrumental" checked={instrumental} onChange={e=>{setChoice(e.target.checked?"instrumental":"vocals");setError("");}}/> No Vocals</label>
          </div>
          {intentIssue&&<p className="muted" role="status" data-testid="text-understood-prompt">{intentIssue}</p>}
        </div>:<div className="shape-it" data-testid="panel-shape-it">
          <MusicLanguageControl compact value={languageChoice} change={next=>{setLanguageChoice(next);setError("");}} lyrics={useOwnLyrics?lyrics:""} prompt={idea} disabled={busy}/>
          <details className="qc-fold" key={"lyrics"+panelKey} open={!openPanel||openPanel==="lyrics"||undefined} data-testid="fold-lyrics"><summary>Your Words</summary>
            <label className="field qc-field">Your Vision <span className="muted">· optional</span>
              <textarea data-testid="input-song-idea" rows={2} maxLength={1200} value={idea} placeholder="What the song is about, how it should feel" onChange={e=>{setIdea(e.target.value);setError("");}}/></label>
            {hasExplicitWords(idea) && <CleanLyricsChecker lyrics={idea} change={value => { setIdea(value); setError(""); }} direction label="Clean song description"/>}
            <div className="actions forge-help-row"><button type="button" className="secondary small forge-gold-pill" data-testid="button-help-describe" disabled={busy||!idea.trim()} onClick={()=>{const expanded=expandSongDescription(idea,drafts);if(expanded.length>1200){setError("The expanded description is too long. Shorten your idea, then try again.");return;}setIdea(expanded);setError("");setPromptNotice("Vision expanded with local style suggestions. Review it before you Begin; no AI provider was called.");}}><Sparkles size={15}/> Help me describe it</button></div>
            <label className="field qc-field">Lyrics
              <div className="lyric-section-chips" role="group" aria-label="Add song part">{["Intro","Verse","Pre-Chorus","Chorus","Bridge","Outro"].map(section=><button key={section} type="button" className="chip" data-testid={`chip-lyric-${section.toLowerCase().replace(/[^a-z]+/g,"-")}`} disabled={instrumental} onClick={()=>{setWordsByStudio(false);addLyricSection(section);}}>[{section}]</button>)}</div>
              <textarea ref={lyricInput} data-testid="input-lyrics" dir="auto" style={{unicodeBidi:"plaintext"}} rows={8} maxLength={5000} disabled={instrumental} value={lyrics} placeholder={instrumental?"No Vocals is on. Your lyrics are kept for later.":"Paste or write your own sections, or choose Write them for me."} onChange={e=>{setLyrics(e.target.value);setOwnLyrics(!!e.target.value.trim());setWordsByStudio(false);setError("");setLyricStatus("");}}/>
            </label>
            <div className="actions">{writeLyrics&&<button type="button" className="secondary small forge-gold-pill" data-testid="button-write-for-me" disabled={busy} onClick={()=>void writeWordsForMe()}><Sparkles size={15}/> {lyricBusy?"Writing…":"Write them for me"}</button>}
            <small className="muted" data-testid="text-words-source">{instrumental?"No Vocals: no lyrics are sent.":useOwnLyrics?"Your exact lyrics will be sung.":"Leave this empty and the words are written when you Begin."}</small></div>
            {lyricStatus&&<p role="status" data-testid="text-lyric-status">{lyricStatus}</p>}
            {useOwnLyrics && <LyricNotationPreview text={lyrics}/>}
            <details className="qc-fold" key={"prompts"+panelKey} open={openPanel==="prompts"||undefined} data-testid="fold-prompts"><summary>Writing helpers</summary>
              {promptHelpers?.(applySeed)??<p className="muted">Writing helpers are unavailable.</p>}
            </details>
          </details>
          <details className="qc-fold" key={"style"+panelKey} open={!openPanel||openPanel==="style"||openPanel==="recipes"||undefined} data-testid="fold-style"><summary>Sound &amp; Soul</summary>
            <SoundSoulPicker vision={idea} genre={genreEdit??chosenGenre??""} instruments={instrumentsEdit??""} changeGenre={next=>{setAutoGenre(false);setGenreEdit(next);setError("");}} changeInstruments={next=>{setInstrumentsEdit(next);setError("");}} disabled={busy}/>
            {hasExplicitWords(genre) && <CleanLyricsChecker lyrics={genre} change={value => setGenreEdit(value)} direction label="Clean styles"/>}
            {hasExplicitWords(instruments) && <CleanLyricsChecker lyrics={instruments} change={value => setInstrumentsEdit(value)} direction label="Clean instrument notes"/>}
          </details>
          <details className="qc-fold" key={"vocals"+panelKey} open={openPanel==="vocals"||undefined} data-testid="fold-vocals"><summary>Voice</summary>
            {instrumental?<p className="muted">No Vocals is on; voice direction is not sent. Your choices are kept.</p>:<>
              <VoicePicker value={vocalOptions} change={next=>{setVoiceEdit(null);setVocalOptions(next);setError("");}} disabled={busy}/>
              <p className="muted"><strong>Suggested delivery:</strong> {matchVocalToSong(idea,genre,instruments)} <button type="button" className="text-button" data-testid="button-use-vocal" onClick={()=>setVoiceEdit(matchVocalToSong(idea,genre,instruments))}>Use this</button>{voiceEdit&&<> · <button type="button" className="text-button" data-testid="button-clear-vocal" onClick={()=>setVoiceEdit(null)}>Clear</button></>}</p>
              {voiceEdit&&<p className="muted" data-testid="text-vocal-direction">Voice direction: {voiceEdit}</p>}
              <p className="muted" data-testid="text-understood-prompt" role="status">{intentIssue||`${chosenPerformer??"Singer follows your vision"}.`}</p>
            </>}
            {vocalHelpers&&<details className="qc-fold"><summary>Voice helper</summary>{vocalHelpers(applySeed)}</details>}
          </details>
          <div className="qc-fold shape-name"><label className="field qc-field">Name <span className="muted">· optional</span>
            <input data-testid="input-song-title" maxLength={100} value={songTitle} onChange={e=>setSongTitle(e.target.value)} placeholder="Leave blank and it is named from the lyrics"/></label>
            {lyrics.trim()&&<div className="actions"><span className="muted">Ideas:</span>{titlesFromLyrics(lyrics).map(title=><button type="button" className="chip" data-testid={`button-title-idea-${title}`} key={title} onClick={()=>setSongTitle(title)}>{title}</button>)}</div>}
          </div>
          <details className="qc-fold" data-testid="fold-more"><summary>More</summary>
            {caps.negativeStyle&&<label className="field">Leave Out <span className="muted">· optional</span>
              <input data-testid="input-negative-style" maxLength={500} value={negativeStyle} placeholder="heavy autotune, distorted guitars" onChange={e=>setNegativeStyle(e.target.value)}/></label>}
            {caps.spark&&<div className="field shape-spark"><label htmlFor="qc-spark">Spark</label>
              <input id="qc-spark" data-testid="input-spark" type="range" min={0} max={2} step={0.1} value={spark??1} aria-valuetext={spark===null?"Engine default":String(spark)} onChange={e=>setSpark(Number(e.target.value))}/>
              <div className="shape-scale" aria-hidden="true"><span>Familiar</span><span>Adventurous</span></div>
              <small className="muted">{spark===null?"Engine default.":`Set to ${spark.toFixed(1)}.`} {spark!==null&&<button type="button" className="text-button" data-testid="button-reset-spark" onClick={()=>setSpark(null)}>Use default</button>}</small></div>}
            {!adActive&&!mapOn&&<TrackLengthControl automatic={autoLength} onAutomatic={setAutoLength} suggested={baseTiming.seconds} reason={baseTiming.reason} manual={manualTime||formatTrackTime(baseTiming.seconds)} onManual={setManualTime}/>}
            <div className="quick-auto-time" role="status"><strong>{adActive?"Musical ad length":mapOn&&!songTiming.explicit?"Song map length":"Length"}</strong><span>{formatTrackTime(timing.seconds)} · {timing.reason} · up to 6:00</span></div>
            {!instrumental&&<MusicLanguageControl detailsOnly value={languageChoice} change={next=>{setLanguageChoice(next);setError("");}} lyrics={useOwnLyrics?lyrics:""} prompt={idea} disabled={busy}/>}
          </details>
          <details className="qc-fold qc-prompt-library" data-testid="saved-prompt-library"><summary>Your Sounds <small>{savedPrompts.length} saved privately</small></summary>
            <p className="muted hologram-guide">Save your Sound &amp; Soul and Voice as one named sound, then bring it back with one tap. Words stay optional.</p>
            {savePrompt&&<div className="prompt-save-row">
              <label className="field">Name this sound
                <input data-testid="input-saved-prompt-name" maxLength={100} value={promptName} placeholder={songTitle.trim()||"Desert night soul"} onChange={event=>setPromptName(event.target.value)}/></label>
              <label className="qc-check"><input type="checkbox" data-testid="checkbox-include-words" checked={includeWords} onChange={e=>setIncludeWords(e.target.checked)}/> Include my words and vision</label>
              <button type="button" className="secondary small" data-testid="button-save-current-prompt" disabled={busy||!(genre.trim()||instruments.trim()||vocalDirection.trim()||includeWords&&(idea.trim()||lyrics.trim()))}
                onClick={()=>{void savePrompt({...currentPromptDraft(),name:promptName.trim()||songTitle.trim()||idea.trim().slice(0,72)||"My sound"}).then(saved=>setPromptNotice(saved?"Sound saved privately to Your Sounds.":"The save could not be confirmed. Your choices are still here."));}}>Save to Your Sounds</button>
            </div>}
            <label className="field">Search Your Sounds
              <input data-testid="input-search-saved-prompts" value={promptSearch} maxLength={100} placeholder="Search names, words or styles" onChange={event=>setPromptSearch(event.target.value)}/></label>
            <div className="actions">
              <label className="qc-check"><input data-testid="checkbox-favorites-only-prompts" type="checkbox" checked={favoritePromptsOnly} onChange={event=>setFavoritePromptsOnly(event.target.checked)}/> Favorites only</label>
              <label className="qc-check"><input data-testid="checkbox-auto-save-prompts" type="checkbox" checked={autoSavePrompts} disabled={busy||!setAutoSavePrompts} onChange={event=>setAutoSavePrompts?.(event.target.checked)}/> Save each confirmed song's sound automatically</label>
            </div>
            <div className="saved-prompt-list" data-testid="saved-prompt-list">
              {promptLibraryItems.map(prompt=><article className="saved-prompt-item" key={prompt.id} data-testid={`saved-prompt-${prompt.id}`}>
                <div><strong>{prompt.name}</strong><p>{readStyleDNA(prompt)?"Sound + song map · ":""}{prompt.tags.join(" · ")||prompt.description}{prompt.notes.lyrics.trim()||prompt.notes.prompt.trim()?" · with words":""}</p></div>
                {readSavedShape(prompt)?.voiceReferenceId&&<div className="saved-voice-reference"><p className="muted">Voice description plus a private reference clip, for your ears only. Using this sound applies the written description; the clip is never sent to a music provider and is not a voice clone.</p>{listenReference===prompt.id?<AudioPlayer src={`/api/studio/song-actions?voice=${encodeURIComponent(readSavedShape(prompt)!.voiceReferenceId!)}`} label={`Private voice reference for ${prompt.name}`}/>:<button type="button" className="text-button" data-testid={`button-listen-reference-${prompt.id}`} onClick={()=>setListenReference(prompt.id)}>Listen to reference</button>}</div>}
                <div className="actions">
                  <button type="button" className="secondary small" data-testid={`button-use-saved-prompt-${prompt.id}`} onClick={()=>useSavedPrompt(prompt)}>Use</button>
                  {favoritePrompt&&<button type="button" className="text-button" data-testid={`button-favorite-saved-prompt-${prompt.id}`} aria-pressed={!!prompt.favorite} aria-label={prompt.favorite?"Favorited":"Favorite"} disabled={busy}
                    onClick={()=>void favoritePrompt(prompt.id,!prompt.favorite)}><Star size={14} fill={prompt.favorite?"currentColor":"none"}/> {prompt.favorite?"Favorited":"Favorite"}</button>}
                </div>
              </article>)}
              {!promptLibraryItems.length&&<p className="muted">{savedPrompts.length?"Nothing matches this search.":"No saved sounds yet. Shape one above and save it here."}</p>}
            </div>
            <p className="muted">Starter blends</p>
            <div className="shape-chips">{worldFusionRecipes.map(r=><button type="button" key={r.name} className="chip" data-testid={`button-blend-${r.name.toLowerCase().replace(/[^a-z]+/g,"-")}`} onClick={()=>{setAutoGenre(false);setGenreEdit(r.genres.join(", "));setInstrumentsEdit(r.sounds.join(", "));if(!idea.trim())setIdea(r.idea);}}>{r.name}</button>)}</div>
          </details>
          <details className="qc-more" data-testid="section-advanced-options"><summary data-testid="toggle-advanced-options"><Settings2 size={15}/> Studio tools</summary>
          <div className="qc-more-body">
          {recipes.length>0&&<div className="qc-recipes" data-testid="section-recipes">
            <label className="field">Start from a recipe
              <select data-testid="select-recipe" value={recipeId} onChange={e=>setRecipeId(e.target.value)}>
                <option value="">Choose a recipe…</option>{recipes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select></label>
            <div className="actions">
              <button type="button" className="secondary small" data-testid="button-use-recipe" disabled={!recipeId} onClick={()=>{const t=recipes.find(r=>r.id===recipeId);if(t)applySeed(seedFromTemplate(t,"recipe-"+t.id+"-"+Date.now()));}}>Use recipe</button>
              {editRecipe&&<button type="button" className="text-button" data-testid="button-edit-recipe" disabled={!recipeId} onClick={()=>{const t=recipes.find(r=>r.id===recipeId);if(t)editRecipe(t);}}>Edit</button>}
              {editRecipe&&<button type="button" className="text-button" data-testid="button-new-recipe" onClick={()=>editRecipe(null)}>New recipe</button>}
            </div>
            {recipeId&&<p className="muted qc-recipe-note">{recipes.find(r=>r.id===recipeId)?.description}</p>}
          </div>}
          <div className="forge-hum-card">
            <p className="muted">Private melody notes are saved with the song for you. They are not sent to a music engine.</p>
            <MelodyReferenceRecorder disabled={busy} takes={melodyTakes} onTake={(blob,seconds)=>{setMelodyTakes(current=>[...current,{id:crypto.randomUUID(),blob,durationSeconds:seconds}]);setMelodyStatus("Take recorded. It stays private and is attached to the saved song; it is not sent to a music engine.");}} onRemove={id=>{setMelodyTakes(current=>current.filter(take=>take.id!==id));setMelodyStatus("Melody take removed from this song idea.");}}/>
            {melodyStatus&&<p role="status" data-testid="text-melody-reference-status">{melodyStatus}</p>}
          </div>
          {(recordVoice||uploadOwn)&&<div className="actions">{recordVoice&&<button type="button" className="secondary small" data-testid="button-record-voice" onClick={recordVoice}>Record my voice</button>}{uploadOwn&&<button type="button" className="secondary small" data-testid="button-upload-own" onClick={uploadOwn}>Use my recording</button>}</div>}
          <div className="actions quick-options" role="group" aria-label="Output">
            <button type="button" className={`chip ${choice==="sketch"?"active":""}`} aria-pressed={choice==="sketch"} data-testid="button-mode-sketch" onClick={()=>setChoice(choice==="sketch"?"vocals":"sketch")}>Built-in sketch · no singing, no credits</button>
            {choice==="sketch"&&<button type="button" className="secondary small" data-testid="button-switch-to-song" onClick={()=>setChoice("vocals")}>Switch to song</button>}
            {choice!=="sketch"&&<label className="qc-check"><input type="checkbox" data-testid="checkbox-instrumental" checked={instrumental} onChange={e=>{setChoice(e.target.checked?"instrumental":"vocals");setError("");}}/> No Vocals</label>}
          </div>
          <div className="actions" role="group" aria-label="What to create"><button type="button" data-testid="button-kind-song" className={`chip ${!adMode?"active":""}`} aria-pressed={!adMode} onClick={()=>setAdMode(false)}>Song</button><button type="button" data-testid="button-kind-ad" className={`chip ${adMode?"active":""}`} aria-pressed={adMode} onClick={()=>setAdMode(true)}>Musical ad</button></div>
          {adMode&&<MusicalAdBuilder value={adBrief} change={setAdBrief} disabled={busy} prepare={()=>{setIdea(musicalAdPrompt(adBrief));setSongTitle((adBrief.brand+" · Musical ad").slice(0,100));setGenreEdit(adStyles[adBrief.style].genre);setChoice("vocals");setCodeEdit(musicalAdSections(adBrief));setOpeningMode("direct");setPromptNotice(lyrics.trim()?"Ad brief prepared. Your lyrics are kept; clear them to have ad lyrics written.":"Ad brief prepared. Review, then Begin. Add product footage and your logo in Video & Shorts.");}}/>}
          {!instrumental && <SongOpeningControl value={openingMode} change={setOpeningMode} disabled={busy}/>}
          <GenreAssistant fusion={fusion} auto={autoGenre} setAuto={v=>{setAutoGenre(v);if(v)setGenreEdit(null);}} history={useHistory} setHistory={setUseHistory} name={fusionName} setName={setFusionName} variation={()=>setFusionVariation(v=>v+1)} apply={next=>{setAutoGenre(false);setGenreEdit(next.join(", "));}} disabled={busy} showCues={expanded}/>
          {!adMode&&<StyleDNAControls map={songMap} change={setSongMap} enabled={mapEnabled} toggle={setMapEnabled} genres={genreTags(genre)} instruments={instruments} vocals={vocalDirection} saved={[]} disabled={busy} apply={d=>{setAutoGenre(false);setGenreEdit(d.genres.join(", "));setInstrumentsEdit(d.instruments);setVoiceEdit(d.vocals);setSongMap({bpm:d.bpm,sections:d.sections});setMapEnabled(true);}} save={savePrompt?async(name,d)=>{setPromptBusy(true);try{return !!await savePrompt({name,tags:d.genres,lyrics:"",idea:"",instruments:d.instruments,vocals:d.vocals,styleDNA:d});}finally{setPromptBusy(false);}}:undefined}/>}
          <div className="quick-blueprint">
          <div className="actions"><button type="button" className="secondary small" data-testid="button-edit-details" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><Braces size={15}/> {expanded ? "Hide" : "Edit"} arrangement code</button></div>
          {expanded && <div className="quick-code">
            <HelpField label="Arrangement code" tip="Use bracketed section names such as [Verse 1] and put delivery cues such as {Male whisper} in braces. Empty sends nothing."><textarea data-testid="input-arrangement" rows={8} maxLength={2000} value={mapOn?code:codeEdit??""} disabled={mapOn} placeholder={blueprint.code} onChange={event => setCodeEdit(event.target.value||null)}/></HelpField>
            {hasExplicitWords(code) && <CleanLyricsChecker lyrics={code} change={setCodeEdit} direction label="Clean arrangement code"/>}
            <div className="actions"><button type="button" className="text-button" data-testid="button-use-suggested" onClick={() => { setInstrumentsEdit(blueprint.instrumentList); setCodeEdit(blueprint.code); }}>Use suggested instruments &amp; arrangement</button><button type="button" className="text-button" data-testid="button-clear-details" onClick={() => setCodeEdit(null)}>Clear</button></div>
          </div>}
          </div>
          {localSketch && <p className="muted">Built-in sketches use the closest of four instrument palettes.</p>}
          <button type="button" className="text-button" data-testid="button-open-guided" onClick={proProduction?()=>setProOpen(true):guided}>Open Pro production below</button>
          </div>
          </details>
        </div>}
        {error && <p className="notice" role="alert" data-testid="text-create-error">{error}{mode.blocked&&<> <button type="button" className="text-button" data-testid="button-error-connect" onClick={settings}>Connect music account</button></>}</p>}
        <div className="forge-launch">
        {customMode&&!localSketch&&<div className="version-count-control" role="group" aria-label="Takes">
          <label className="qc-check"><input type="checkbox" data-testid="checkbox-make-two-versions" checked={makeTwoVersions} onChange={e=>setMakeTwoVersions(e.target.checked)}/> Two takes</label>
          <p className="muted" data-testid="text-version-cost">{makeTwoVersions?"Two takes, side by side. Both are kept.":"One take."}</p>
        </div>}
        <div className="actions quick-submit">
          <button type="submit" className="primary qc-create" data-testid="button-create-song" disabled={busy}><Music2 size={17}/>
            {pending ? localSketch?"Rendering your sketch…":"Beginning…" : "Begin"}</button>
          {customMode&&<span className="muted" data-testid="text-create-summary">Length: {autoLength&&!adActive&&!mapOn?"Auto":formatTrackTime(timing.seconds)}{!localSketch&&(falActive?" · Uses the studio music engine":" · Uses your ElevenLabs credits")}</span>}
        </div>
        </div>
        {promptNotice&&<p role="status" data-testid="text-prompt-notice">{promptNotice}</p>}
        </div>
        <aside className="forge-side" aria-label="A quiet note">
          <p className="cosmic-poetic forge-poetic">Nada Brahma — the universe is sound.</p>
          <p className="muted forge-signature">{brand.slogan}</p>
        </aside></div>
      </fieldset>
    </form>
    {proProduction&&<details className="qc-fold qc-pro" data-testid="fold-pro-production" hidden={!customMode} open={proOpen} onToggle={e=>setProOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>Pro production · sections, instrumentals and voices</summary>
      {proProduction}
    </details>}
    {engine?.notice&&<p role="status" className="muted">{engine.notice}</p>}
    {takeIds.length>1&&<section className="quick-result qc-takes" aria-label="Compare your takes"><h3>Your takes · all saved</h3><div className="qc-take-grid">{takeIds.map(id=>drafts.find(song=>song.id===id&&!song.deletedAt)).filter((song):song is Song=>!!song?.audioFormat).map(song=><article key={song.id}><h4>{song.name}</h4><AudioPlayer src={songAudioUrl(song.id,song.audioId)} label={`Listen to ${song.name}`}/><button type="button" className="secondary" disabled={busy} aria-pressed={!!song.favorite} data-testid={`button-favorite-take-${song.id}`} onClick={()=>{setResultId(song.id);void favoriteTake?.(song.id);}}>{song.favorite?"Favourite":"Keep as favourite"}</button></article>)}</div></section>}
    {pendingTake&&<div className="quick-result"><strong>{pendingTake.title} · Not saved yet</strong><AudioPlayer src={pendingTake.url} label="Listen to pending instrumental"/><div className="actions"><a className="secondary small" href={pendingTake.url} download={pendingTake.title+".wav"}>Download original</a><button type="button" className="primary small" disabled={busy} onClick={async()=>{setPending(true);try{await savePending(pendingTake);}finally{setPending(false);}}}>Retry save to Your songs</button><button type="button" className="secondary small" disabled={busy} onClick={()=>{if(confirm("Discard this local take? Download it first if you want a copy. No saved song will be deleted.")){setPendingTake(undefined);setError("");}}}>Discard unsaved take</button></div></div>}
    {playful&&result?.audioFormat&&playStage!=="start"&&<section className="creative-play-result" aria-label="Your creation"><p className="eyebrow">YOURS · SAVED PRIVATELY</p><h2>{result.name}</h2><AudioPlayer src={songAudioUrl(result.id,result.audioId)} label="Listen to your creation"/>
      {playStage==="play"?<><p className="muted">A new take keeps this one safe. A new take uses your same description.</p><div className="play-controls"><label>Look<select disabled={busy} value={playChoices.look} onChange={e=>changePlay({...playChoices,look:e.target.value as PlayChoices["look"]})}>{Object.entries(playLooks).map(([v,item])=><option key={v} value={v}>{item.name}</option>)}</select></label></div><div className="actions"><button type="button" className="primary" disabled={busy} onClick={()=>setPlayStage("share")}>Keep this · make it visual</button><button type="button" className="secondary" disabled={busy} onClick={()=>createForm.current?.requestSubmit()}>Try a new take</button>{previousChoices&&<button type="button" className="text-button" disabled={busy} onClick={()=>{setPlayChoices(previousChoices);setPreviousChoices(null);}}>Undo choices</button>}</div><p className="muted">New music requests can use provider credits. All takes remain in Your songs.</p>{takeIds.length>1&&<label>Listen to an earlier take<select value={result.id} disabled={busy} onChange={e=>setResultId(e.target.value)}>{takeIds.map(id=>drafts.find(s=>s.id===id&&!s.deletedAt)).filter((s):s is Song=>!!s?.audioFormat).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}</>:<><p>Your song is saved. Add a photo if you like, then preview your vertical video. Your photo is used as a private background; it is not sent for AI generation.</p><label className="field">My photo · optional<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>15*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("Choose a JPG, PNG or WebP photo up to 15 MB.");return;}setPhoto(file);setPhotoName(file.name);setError("");}}/></label>{photo&&<p>{photoName} <button type="button" className="text-button" disabled={busy} onClick={()=>{setPhoto(null);setPhotoName("");}}>Remove photo</button></p>}{makeVideo&&<button type="button" className="primary" disabled={busy} onClick={async()=>{setPromptBusy(true);setError("");try{await makeVideo(result,true,{look:playLooks[playChoices.look].preset,...(photo?{photo:new File([photo],photoName||"my-photo.png",{type:photo.type})}:{})});}catch(e){setError((e as Error).message||"The video could not open. Your song and photo are still here.");}finally{setPromptBusy(false);}}}>Make my video</button>}<details><summary>Save audio instead</summary><AudioFormatDownload url={songAudioUrl(result.id,result.audioId)} title={result.name} sourceKey={result.audioId??result.id}/></details><p className="muted">Review lyric timing and the video, then download or use your device’s share options. Nothing is posted automatically.</p></>}
      {pending&&<p role="status">Creating a new take. Your current version stays saved.</p>}{error&&<p role="alert" className="notice">{error}</p>}<button type="button" className="text-button" disabled={busy} onClick={()=>setPlayStage("start")}>Hide this take</button></section>}
    {!playful&&result?.audioFormat && <div className="quick-result" aria-live="polite"><p>Saved privately in Your songs.</p><SongCard song={result}/><div className="actions creator-next-actions">{makeVideo&&<><button type="button" className="primary" disabled={busy} onClick={()=>makeVideo(result)}>{result.musicalAd?"Make advertising video":result.creationKind==="instrumental"||result.instrumental?"Make music video":"Auto lyric video"}</button><button type="button" className="secondary" disabled={busy} onClick={()=>makeVideo(result,true)}>Make social short</button></>}{publish&&<button type="button" className="secondary" disabled={busy} onClick={()=>publish(result)}>Publish & share</button>}</div><p className="muted">Song actions includes editing, voice recording, mixing, downloads and removal. Publish &amp; share opens release review; external platforms require their own submission.</p><button type="button" className="text-button" disabled={busy} onClick={openDrafts}>Open saved creations <ArrowRight size={15}/></button></div>}
  </section>;
}
