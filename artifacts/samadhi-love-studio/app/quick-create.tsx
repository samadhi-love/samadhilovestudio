"use client";
import { MusicLanguageControl } from "./music-language-control";
import { defaultLanguageChoice, resolveLanguage, isLanguageChoice, type LanguageChoice } from "./music-language";
import {feelingIdeas,playEnergies,playMoods,playLooks,defaultPlayChoices,validPlayChoices,playDirection,type PlayChoices,type PlayVisualRequest} from "./creative-play";
import {AudioFormatDownload} from "./audio-format-download";
import {StyleDNAControls} from "./style-dna-controls";
import {defaultSongMap,validSongMap,mapSeconds,mapArrangement,readStyleDNA,type SongMap} from "./style-dna";
import {MusicalAdBuilder} from "./musical-ad-builder";
import {adStyles,emptyMusicalAd,isMusicalAd,recoverMusicalAd,musicalAdPrompt,musicalAdSections,type MusicalAd} from "./musical-ad";
import {matchVocalToSong} from "./vocal-matching";
import {titlesFromLyrics} from "./song-cover";
import {WorldMusicOptions,creatorVocalDirection,defaultCreatorVocals,type CreatorVocalOptions} from "./creator-music-options";
import {performanceWeight} from "./song-opening";
import {readSavedAd,type PromptDraft} from "./saved-song-prompts";
import type {Template} from "./studio-data";
import {SongOpeningControl} from "./song-opening-control";
import type {SongOpening} from "./song-opening";

import { HelpControl, HelpField } from "./help-tip";
import {SongCard} from "./song-card";
import {RecoveryPanel,useDraftRecovery} from "./draft-recovery";
import { GenrePicker } from "./genre-picker";
import { genreTags } from "./music-genres";
import { GenreAssistant } from "./genre-assistant";
import { fusionGenres, suggestGenreFusion } from "./genre-assist";
import { useEffect,useRef,useState, type FormEvent } from "react";
import { ArrowRight, Braces, Music2, Settings2, Sparkles } from "lucide-react";
import { CleanLyricsChecker } from "./clean-lyrics-checker";
import { AudioPlayer } from "./audio-player";
import { LyricNotationPreview } from "./lyric-notation-preview";
import { parseLyricNotation } from "./lyric-notation";
import { cleanWordsMessage, hasExplicitWords } from "./clean-content";
import { type Instrumental } from "./creation-guide";
import { renderInstrumental } from "./instrumental";
import { songBlueprint } from "./song-blueprint";
import { songAudioUrl, type Song } from "./studio-data";
import { autoTrackTime, formatTrackTime } from "./track-duration";

const example = "An uplifting Arabian Euro House song about finding our way home through love, with oud and darbuka at 130 BPM. Sung male and female leads, an immediate musical hook, and a full Dabke drop.";

export function QuickCreate({ connected, saving, drafts, settings, guided, openDrafts, generateSong, saveSketch,working, makeVideo, publish, savedPrompts=[],savePrompt,autoCover,openLogo,simpleExperience=false,recordVoice,uploadOwn }: {
  connected: boolean; saving: boolean; drafts: Song[]; settings: () => void; guided: () => void; openDrafts: () => void;
  generateSong: (input: { title: string; prompt: string; arrangement: string; duration: number; openingMode?: SongOpening; lyrics?:string; voice?:string; instruments?:string; genres?:string; autoTitle?:boolean; instrumental?:boolean; musicalAd?:MusicalAd; language?:LanguageChoice["language"]; dialect?:LanguageChoice["dialect"] }) => Promise<string | undefined>;
  saveSketch: (file: File, title: string, prompt: string, arrangement: string, settings: Instrumental,saveId?:string) => Promise<string | undefined>;
  working?:(value:boolean)=>void;
  makeVideo?:(song:Song,short?:boolean,visual?:PlayVisualRequest)=>void|Promise<void>;
  simpleExperience?:boolean;recordVoice?:()=>void;uploadOwn?:()=>void; publish?:(song:Song)=>void;
  autoCover?:(song:Song)=>Promise<void>;openLogo?:()=>void;
  savedPrompts?:Template[];savePrompt?:(draft:PromptDraft)=>Promise<Template|undefined>;
}) {
  const [playStage,setPlayStage]=useState<"start"|"play"|"share">("start");
  const [playChoices,setPlayChoices]=useState<PlayChoices>(defaultPlayChoices),[previousChoices,setPreviousChoices]=useState<PlayChoices|null>(null);
  const [photo,setPhoto]=useState<Blob|null>(null),[photoName,setPhotoName]=useState("");
  const [takeIds,setTakeIds]=useState<string[]>([]);
  const createForm=useRef<HTMLFormElement>(null);
  function changePlay(next:PlayChoices){setPreviousChoices(playChoices);setPlayChoices(next);}
  const [idea, setIdea] = useState("");
  const [songMap,setSongMap]=useState<SongMap>(defaultSongMap),[mapEnabled,setMapEnabled]=useState(false);
  const [adMode,setAdMode]=useState(false),[adBrief,setAdBrief]=useState<MusicalAd>(emptyMusicalAd);
  const [customMode,setCustomMode]=useState(false);
  const [songTitle,setSongTitle]=useState(""),[voiceEdit,setVoiceEdit]=useState<string|null>(null),[promptNotice,setPromptNotice]=useState(""),[promptBusy,setPromptBusy]=useState(false);
  const [vocalOptions,setVocalOptions]=useState<CreatorVocalOptions>(defaultCreatorVocals);
  const [ownLyrics,setOwnLyrics]=useState(false),[lyrics,setLyrics]=useState("");
  const [languageChoice,setLanguageChoice]=useState<LanguageChoice>(defaultLanguageChoice);
  const [openingMode,setOpeningMode]=useState<SongOpening>("auto");
  const [choice, setChoice] = useState<"vocals" | "instrumental" | "sketch">(
    connected ? "vocals" : "sketch",
  );
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
  const recovery=useDraftRecovery("quick-create",{languageChoice,playChoices,photo,photoName,resultId,takeIds,songMap,mapEnabled,idea,choice,openingMode,customMode,adMode,adBrief,songTitle,voiceEdit,vocalOptions,ownLyrics,lyrics,genreEdit,instrumentsEdit,codeEdit,autoGenre,useHistory,fusionName,fusionVariation,pendingTake:pendingTake?{...pendingTake,url:undefined}:undefined},value=>{
    if(isLanguageChoice(value.languageChoice))setLanguageChoice(value.languageChoice);
    if(validPlayChoices(value.playChoices))setPlayChoices(value.playChoices);if(value.photo instanceof Blob){setPhoto(value.photo);setPhotoName(value.photoName??"My photo");}if(typeof value.resultId==="string")setResultId(value.resultId);if(Array.isArray(value.takeIds))setTakeIds(value.takeIds.filter((id):id is string=>typeof id==="string").slice(-8));
    setAdMode(value.adMode===true);setAdBrief(recoverMusicalAd(value.adBrief));
    setSongTitle(value.songTitle??"");setVoiceEdit(value.voiceEdit??null);setCustomMode(value.customMode===true);setVocalOptions({...defaultCreatorVocals,...value.vocalOptions});setOwnLyrics(value.ownLyrics===true);setLyrics(typeof value.lyrics==="string"?value.lyrics:"");
    if(validSongMap(value.songMap))setSongMap(value.songMap);setMapEnabled(value.mapEnabled===true);setIdea(value.idea);setChoice(value.choice==="vocals"||value.choice==="instrumental"||value.choice==="sketch"?value.choice:"sketch");setOpeningMode(value.openingMode&&["auto","direct","short"].includes(value.openingMode)?value.openingMode:"auto");setGenreEdit(value.genreEdit);setInstrumentsEdit(value.instrumentsEdit);setCodeEdit(value.codeEdit);setAutoGenre(value.autoGenre);setUseHistory(value.useHistory);setFusionName(value.fusionName);setFusionVariation(value.fusionVariation);
    if(value.pendingTake){if(!(value.pendingTake.blob instanceof Blob))throw new Error("The device recording is unavailable. Check My Songs before retrying.");setPendingTake({...value.pendingTake,url:URL.createObjectURL(value.pendingTake.blob)});}
  },!!photo||ownLyrics&&!!lyrics.trim()||mapEnabled||!!idea.trim()||!!pendingTake||adMode&&!!(adBrief.brand||adBrief.benefit||adBrief.cta));
  const playful=simpleExperience&&!customMode&&!adMode;
  // Keep sketch mode local even if a provider connects while editing.
  const type = choice;
  const instrumental = type !== "vocals";
  const localSketch=type==="sketch"||(instrumental&&!connected);
  const fusion=suggestGenreFusion(idea,codeEdit??"",drafts,useHistory,fusionVariation);
  const chosenGenre=genreEdit??(autoGenre?fusionGenres(fusion,fusionName).join(", "):null);
  const blueprint = songBlueprint([chosenGenre, idea].filter(Boolean).join(", "), instrumental);
  const genre = chosenGenre ?? blueprint.genre;
  const instruments = instrumentsEdit ?? blueprint.instrumentList;
  const code = mapEnabled&&!adMode&&validSongMap(songMap)?mapArrangement(songMap):codeEdit ?? blueprint.code;
  const targetBpm=mapEnabled&&!adMode?songMap.bpm:blueprint.bpm;
  const matchedVocal=matchVocalToSong(idea,genre,instruments);
  const vocalDirection=voiceEdit??[matchedVocal,creatorVocalDirection(vocalOptions)].join(" ");
  const songTiming=autoTrackTime({vocals:!instrumental,lyrics:ownLyrics?lyrics:"",bpm:blueprint.bpm,cinematic:false,prompt:idea,sectionCount:codeEdit?.match(/^\s*\[[^\]\r\n]+\]\s*$/gm)?.length});
  const baseTiming=adMode?{seconds:adBrief.seconds,reason:"Based on your musical advertisement length."}:mapEnabled&&validSongMap(songMap)&&!songTiming.explicit?{seconds:mapSeconds(songMap),reason:"Based on your song map targets."}:songTiming;
  const timing=playful&&!songTiming.explicit&&!mapEnabled&&(!ownLyrics||!lyrics.trim())?{...baseTiming,seconds:Math.min(90,Math.max(45,baseTiming.seconds)),reason:"A short first creation; change the length in Custom."}:baseTiming;
  const result = drafts.find(song => song.id === resultId && !song.deletedAt);
  useEffect(()=>{if(resultId){setTakeIds(ids=>[...ids.filter(id=>id!==resultId),resultId].slice(-8));setPlayStage("play");}},[resultId]);
  const covered=useRef("");
  useEffect(()=>{if(!autoCover||!result?.audioFormat||result.coverAsset||covered.current===result.id||saving||pending)return;covered.current=result.id;void autoCover(result).then(()=>setPromptNotice("Cover created automatically from your title.")).catch(()=>setPromptNotice("Song saved. Automatic cover could not save; use Create / animate cover to retry."));},[result?.id,result?.coverAsset,saving,pending,autoCover]);
  const busy = saving || pending || promptBusy;
  async function savePending(t:NonNullable<typeof pendingTake>){
    const id=await saveSketch(new File([t.blob],"quick-studio-sketch.wav",{type:"audio/wav"}),t.title,t.prompt,t.code,t.take,t.saveId);
    if(id){URL.revokeObjectURL(t.url);setResultId(id);setPendingTake(undefined);}else setError("Your instrumental is ready but its save could not be confirmed. Download it below or Retry save to My Songs.");
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((!idea.trim()&&!(playful&&ownLyrics&&!instrumental&&performanceWeight(lyrics)>0)) || busy || (!instrumental && !connected)) return;
    if(recovery.candidate){setError("Restore the previous device draft or dismiss its recovery notice before creating another.");return;}
    if(pendingTake){setError("Save your pending instrumental below before creating another. Your original is preserved.");return;}
    if(mapEnabled&&!adMode&&!validSongMap(songMap)){setError("Check the song map tempo and section durations before creating.");return;}
    if(!adMode&&(!mapEnabled||songTiming.explicit)&&songTiming.overLimit){setError("This prompt needs more than ten minutes in one generation. Request a shorter song or assemble a longer set in Party Files.");return;}
    if(localSketch&&timing.seconds>360){setError("Local instrument sketches support six minutes. Connect a music provider for longer prompt-based songs.");return;}
    if(adMode&&!isMusicalAd(adBrief)){setError("Complete the product name, benefit and call to action before creating your ad.");return;}
    if (ownLyrics && !instrumental && parseLyricNotation(lyrics).errors.length) { setError(parseLyricNotation(lyrics).errors[0]); return; }
    if (ownLyrics && !instrumental && !performanceWeight(lyrics)) {setError("Add words to sing, or choose Write lyrics for me. Section labels alone are not finished lyrics.");return;}
    if (hasExplicitWords(idea, genre, instruments, code,ownLyrics?lyrics:"")) { setError(cleanWordsMessage); return; }
    if (!instrumental && !localSketch) {
      try { resolveLanguage(languageChoice, ownLyrics ? lyrics : ""); }
      catch (error) { setError((error as Error).message); return; }
    }
    setError(""); setPending(true);
    try {
      const prompt = [genre.trim() ? `Genre: ${genre.trim()}.` : "", (idea.trim()||(playful&&ownLyrics?"Create an original emotionally uplifting song around my exact supplied lyrics, with clear singing and a memorable chorus.":"")), ...(playful?[playDirection(playChoices)]:[]), `Tempo: ${targetBpm} BPM. Instruments: ${instruments.trim()}.`].filter(Boolean).join("\n");
      if(prompt.length>1600)throw new Error("These combined directions are too long. Shorten your description or choose fewer styles so all your selections reach the music provider.");
      const duration = timing.seconds;
      const title = (songTitle.trim()||((genre.trim() || "Studio") + (localSketch ? " Sketch" : instrumental ? " Instrumental" : " Song"))).slice(0,100);
      if (localSketch) {
        const preset = songBlueprint(genre + " " + instruments, true).preset;
        const take: Instrumental = { preset, bpm: targetBpm, seconds: duration, tonic: 9,
          minor: preset === "dabke" || preset === "soul", arrangement: /\b(?:steady|meditation|ambient)\b/i.test(genre) ? "steady" : "build",
          seed: crypto.getRandomValues(new Uint32Array(1))[0] };
        const blob = await renderInstrumental(take);
        const prepared={blob,url:URL.createObjectURL(blob),title,prompt,code,take,saveId:crypto.randomUUID()};setPendingTake(prepared);await savePending(prepared);
      } else {
        const made=await generateSong({ title, prompt, arrangement: code, duration, openingMode,lyrics:ownLyrics&&!instrumental?lyrics:"",voice:instrumental?"":vocalDirection,instruments,genres:genre,autoTitle:!songTitle.trim(),instrumental,...languageChoice,...(adMode?{musicalAd:adBrief}:{}) });
        if(made)setResultId(made);else setError("This take was not confirmed. Your previous songs are safe. Check My Songs before retrying.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Studio could not create the track. Try again.");
    } finally { setPending(false); }
  }

  return <section className="create-banner quick-create" data-playful={playful} aria-labelledby="quick-create-heading">
    <RecoveryPanel recovery={recovery}/>
    <div className="eyebrow"><Sparkles size={15}/> SAMADHI LOVE · SONG + VIDEO CREATOR</div>
    <h1 id="quick-create-heading">{playful?"Turn your feeling into something yours.":"Your song. Your world. Your video."}</h1>
    <p>{playful?"Start with a feeling. Play with the result. Make it yours and share it.":"Tell us the feeling, style, or story. We’ll suggest the instruments and structure; you can change them anytime."}</p>
    {playful&&<ol className="creative-play-steps" aria-label="Creative journey">{(["start","play","share"] as const).map((stage,index)=><li key={stage}><button type="button" disabled={busy||stage!=="start"&&!result?.audioFormat} aria-current={playStage===stage?"step":undefined} onClick={()=>setPlayStage(stage)}>{index+1} · {stage[0].toUpperCase()+stage.slice(1)}</button></li>)}</ol>}
    <div className="actions" role="group" aria-label="What to create"><button type="button" className={`chip ${!adMode?"active":""}`} aria-pressed={!adMode} disabled={busy} onClick={()=>setAdMode(false)}>Song</button><button type="button" className={`chip ${adMode?"active":""}`} aria-pressed={adMode} disabled={busy} onClick={()=>setAdMode(true)}>Musical ad</button>{openLogo&&<button type="button" className="secondary small" disabled={busy} onClick={openLogo}>Logo Creator</button>}</div>
    {adMode&&<MusicalAdBuilder value={adBrief} change={setAdBrief} disabled={busy} prepare={()=>{setIdea(musicalAdPrompt(adBrief));setSongTitle((adBrief.brand+" · Musical ad").slice(0,100));setGenreEdit(adStyles[adBrief.style].genre);setChoice("vocals");setCodeEdit(musicalAdSections(adBrief));setOwnLyrics(false);setLyrics("");setOpeningMode("direct");setCustomMode(true);setPromptNotice("Ad brief prepared. Review or add your own lyrics, then Create song. Add product footage and your logo in Video & Shorts.");}}/>}
    <div className="actions creator-mode-tabs" role="group" aria-label="Song creation mode"><button type="button" className={`chip ${!customMode?"active":""}`} aria-pressed={!customMode} disabled={busy} onClick={()=>setCustomMode(false)}>{simpleExperience?"Easy":"Simple"}</button><button type="button" className={`chip ${customMode?"active":""}`} aria-pressed={customMode} disabled={busy} onClick={()=>setCustomMode(true)}>{simpleExperience?"More choices":"Custom"}</button><span className="muted">One editor. Your choices stay with the song.</span></div>
    {!connected&&<aside className="notice" aria-label="Create without a music connection">
      <strong>You can create without connecting a music service.</strong>
      <p>Make an instrumental sketch with the built-in sounds, or use your own recording for a visual or lyric video. Built-in sketches are not AI-generated songs, have limited instrument palettes, and use no music-provider credits.</p>
      <div className="actions">
        {!instrumental&&<button type="button" className="secondary small" disabled={busy} onClick={()=>{setChoice("sketch");setError("");}}>Make a built-in sketch</button>}
        {recordVoice&&<button type="button" className="secondary small" disabled={busy} onClick={recordVoice}>Record my voice</button>}
        {uploadOwn&&<button type="button" className="secondary small" disabled={busy} onClick={uploadOwn}>Use my recording</button>}
      </div>
      {!instrumental&&<p role="status">Your lyrics stay here, but AI singing needs a connected music service. Switch to a sketch or use a recording to continue without one.</p>}
    </aside>}
    <form ref={createForm} hidden={playful&&playStage!=="start"} onSubmit={create}>
      <fieldset disabled={busy}>
        <div className="play-extra">
        <label className="field">Song title (optional)<input maxLength={100} value={songTitle} onChange={e=>setSongTitle(e.target.value)} placeholder="Name it yourself, or use a suggestion from your lyrics"/></label>
        {lyrics.trim()&&<div className="actions"><span className="muted">Title ideas from your lyrics:</span>{titlesFromLyrics(lyrics).map(title=><button type="button" className="chip" key={title} onClick={()=>setSongTitle(title)}>{title}</button>)}</div>}
        {savedPrompts.filter(t=>!readStyleDNA(t)).length>0&&<label className="field">My saved prompts<select value="" onChange={event=>{const preset=savedPrompts.find(p=>p.id===event.target.value);if(!preset)return;if((idea.trim()||lyrics.trim())&&!confirm("Load this saved prompt in place of your current unsaved writing?"))return;setAutoGenre(false);setIdea(preset.notes.prompt.split("\n\nOpening:")[0]);setLyrics(preset.notes.lyrics);setOwnLyrics(performanceWeight(preset.notes.lyrics)>0);setGenreEdit(preset.tags.length?preset.tags.join(", "):null);setInstrumentsEdit(preset.notes.instruments||null);setVoiceEdit(preset.notes.vocals||null);setSongTitle(preset.name);setAdMode(!!preset.notes.promotion&&!!readSavedAd(preset.notes.promotion));const ad=readSavedAd(preset.notes.promotion);if(ad)setAdBrief(ad);setCodeEdit(ad?musicalAdSections(ad):null);setCustomMode(true);setPromptNotice("Saved lyrics and musical directions loaded. Create makes a new song.");}}><option value="">Choose a private saved prompt…</option>{savedPrompts.filter(t=>!readStyleDNA(t)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
        </div>
        {playful&&<><div className="feeling-ideas" aria-label="Ideas to play with">{feelingIdeas.map(item=><button type="button" className="chip" key={item.name} onClick={()=>{setIdea(item.text);setChoice(!connected?"sketch":item.name==="Find my calm"?"instrumental":"vocals");setError("");}}>{item.name}</button>)}</div><div className="actions creative-own-material"><button type="button" className="secondary small" onClick={()=>{setOwnLyrics(true);setChoice("vocals");}}>Use my words</button>{connected&&recordVoice&&<button type="button" className="secondary small" onClick={recordVoice}>Record my voice</button>}{connected&&uploadOwn&&<button type="button" className="secondary small" onClick={uploadOwn}>Use my recording</button>}</div></>}
        <HelpField label={localSketch?"Describe your instrumental sketch":playful?"What are you feeling?":"Song description"} tip={localSketch?"Choose a mood, style and tempo. Studio matches them to its four built-in sound palettes; it does not generate singing or arbitrary instruments.":"Describe what you want to hear. A theme, a genre, and a vocal detail are enough to start."}><textarea rows={4} required={!playful||!ownLyrics||!performanceWeight(lyrics)} maxLength={1200} value={idea}
          placeholder={localSketch?"A calm instrumental sketch with gentle melody and a slow, steady rhythm…":"A joyful Dabke dance song with oud, warm sung vocals, and a bright chorus…"}
          onChange={event => { setIdea(event.target.value); setError(""); }}/></HelpField>
        {hasExplicitWords(idea) && <CleanLyricsChecker lyrics={idea} change={value => { setIdea(value); setError(""); }} direction label="Clean song description"/>}
        <div className="play-extra">{!adMode&&<StyleDNAControls map={songMap} change={setSongMap} enabled={mapEnabled} toggle={setMapEnabled} genres={genreTags(genre)} instruments={instruments} vocals={instrumental?"":vocalDirection} saved={savedPrompts} disabled={busy} apply={d=>{setAutoGenre(false);setGenreEdit(d.genres.join(", "));setInstrumentsEdit(d.instruments);setVoiceEdit(d.vocals);setSongMap({bpm:d.bpm,sections:d.sections});setMapEnabled(true);}} save={savePrompt?async(name,d)=>{setPromptBusy(true);try{return !!await savePrompt({name,tags:d.genres,lyrics:"",idea:"",instruments:d.instruments,vocals:d.vocals,styleDNA:d});}finally{setPromptBusy(false);}}:undefined}/>}
        </div>
        <details className="optional-song-controls" open={customMode||undefined}><summary>Styles, instruments & voices</summary>
        <GenrePicker prompt={idea} changePrompt={text=>{setIdea(text);setError("");setAutoGenre(false);}} value={chosenGenre === null ? [] : genreTags(chosenGenre)} change={next=>{setAutoGenre(false);setGenreEdit(next.join(", "));}} disabled={busy}/>
        <WorldMusicOptions expanded={customMode} instruments={instrumentsEdit?.split(",").map(s=>s.trim()).filter(Boolean)??[]} changeInstruments={next=>setInstrumentsEdit(next.length?next.join(", "):null)} options={vocalOptions} change={next=>{setVoiceEdit(null);setVocalOptions(next);}} disabled={busy} recipe={r=>{setAutoGenre(false);setGenreEdit(r.genres.join(", "));setInstrumentsEdit(r.sounds.join(", "));if(!idea.trim())setIdea(r.idea);}}/>
        </details>
        {!instrumental&&<p className="muted" aria-label="Suggested vocal direction" hidden={!customMode}><strong>Suggested singing delivery:</strong> {voiceEdit||matchedVocal}</p>}
        {!instrumental&&<details className="optional-song-controls play-lyrics" open={customMode||ownLyrics||undefined}><summary>Lyrics · write for me or use my own</summary><div className="actions"><button type="button" className={`chip ${!ownLyrics?"active":""}`} aria-pressed={!ownLyrics} onClick={()=>setOwnLyrics(false)}>Write lyrics for me</button><button type="button" className={`chip ${ownLyrics?"active":""}`} aria-pressed={ownLyrics} onClick={()=>setOwnLyrics(true)}>Use my lyrics</button></div>{ownLyrics&&<label className="field">Words to sing<textarea dir="auto" style={{unicodeBidi:"plaintext"}} value={lyrics} rows={7} maxLength={5000} placeholder="Your lyrics, in your own words and language…" onChange={e=>setLyrics(e.target.value)}/></label>}<p className="muted">Caption-ready vocal production is the default: clear lead phrasing, breathing space and restrained reverb. Your supplied or generated lyrics stay linked to the recording for automatic caption alignment. Review the performance for changed words.</p></details>}
        {!instrumental&&<MusicLanguageControl value={languageChoice} change={setLanguageChoice} lyrics={ownLyrics?lyrics:""} disabled={busy}/>}
        <details className="optional-song-controls" open={customMode||undefined}><summary>More song options</summary>
        {!instrumental && <SongOpeningControl value={openingMode} change={setOpeningMode} disabled={busy}/>}
        <GenreAssistant fusion={fusion} auto={autoGenre} setAuto={v=>{setAutoGenre(v);if(v)setGenreEdit(null);}} history={useHistory} setHistory={setUseHistory} name={fusionName} setName={setFusionName} variation={()=>setFusionVariation(v=>v+1)} apply={next=>{setAutoGenre(false);setGenreEdit(next.join(", "));}} disabled={busy} showCues={expanded}/>
        </details>
        {localSketch && chosenGenre && <p className="muted">Built-in sketches use the closest of four instrument palettes. Connected songs receive the full genre blend.</p>}
        <div className="actions quick-options">
          <HelpControl subject="Song with vocals" tip="Generate a track with a singing or speaking voice through the connected music service."><button type="button" className={`chip ${!instrumental ? "active" : ""}`} aria-pressed={!instrumental} onClick={() => setChoice("vocals")}>{playful?"AI singing":"Song with vocals"}</button></HelpControl>
          <HelpControl subject={connected?"Instrumental":"Instrumental sketch"} tip={connected?"Generate a complete instrumental through the connected music service using your description, genres, and instruments.":"Make a sketch with Studio’s four built-in instrument palettes, without a music service."}><button type="button" className={`chip ${(connected?type==="instrumental":localSketch) ? "active" : ""}`} aria-pressed={connected?type==="instrumental":localSketch} onClick={() => setChoice(connected?"instrumental":"sketch")}>{connected?"Instrumental":"Instrumental sketch"}</button></HelpControl>
          {connected&&<button type="button" className={`chip ${localSketch?"active":""}`} aria-pressed={localSketch} onClick={()=>setChoice("sketch")}>Built-in sketch · no provider credits</button>}
          {!idea.trim() && <HelpControl subject="Try an example" tip="Fill the description with a sample you can change before creating a track."><button type="button" className="text-button" onClick={() => setIdea(example)}>Try an example</button></HelpControl>}
        </div>
        {customMode&&idea.trim() && <div className="quick-blueprint">
          <div className="actions"><HelpControl subject="genre & arrangement code" tip="Open the suggested genre, instruments, and section-by-section directions to edit them."><button type="button" className="secondary small" aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}><Braces size={15}/> {expanded ? "Hide" : "Edit"} song details</button></HelpControl>
            <span className="muted">{genre} · {targetBpm} BPM</span></div>
          {expanded && <div className="quick-code">
            <div className="field-grid">
              <HelpField label="Genre" tip="Set the music style. Studio suggests a genre from your description, and you can edit it here."><input maxLength={500} value={genre} onChange={event => setGenreEdit(event.target.value)}/></HelpField>
              <HelpField label="Instruments" tip="List the sounds you want, such as oud, darbuka, and piano. Instrumental sketches use the closest built-in palette."><input maxLength={180} value={instruments} onChange={event => setInstrumentsEdit(event.target.value)}/></HelpField>
            </div>
            <HelpField label="Arrangement code" tip="Use bracketed section names such as [Verse 1] and put delivery cues such as {Male whisper} in braces."><textarea rows={10} maxLength={2000} value={code} onChange={event => setCodeEdit(event.target.value)}/></HelpField>
            {hasExplicitWords(genre) && <CleanLyricsChecker lyrics={genre} change={value => setGenreEdit(value.slice(0, 500))} direction label="Clean genre"/>}
            {hasExplicitWords(instruments) && <CleanLyricsChecker lyrics={instruments} change={value => setInstrumentsEdit(value.slice(0, 180))} direction label="Clean instrument notes"/>}
            {hasExplicitWords(code) && <CleanLyricsChecker lyrics={code} change={setCodeEdit} direction label="Clean arrangement code"/>}
            <p className="muted">Use [Intro], [Verse 1], or [Chorus] for sections. Put directions like {'{Male whisper}'} in braces.</p>
            <HelpControl subject="Rebuild code from description" tip="Replace your edits to the genre, instruments, and arrangement with fresh suggestions from the current description."><button type="button" className="text-button" onClick={() => { setGenreEdit(null); setInstrumentsEdit(null); setCodeEdit(null); }}>Rebuild code from description</button></HelpControl>
          </div>}
        </div>}
        <div className="quick-auto-time" role="status"><strong>{adMode?"Musical ad length":mapEnabled&&!songTiming.explicit?"Song map length":"Length follows your prompt"}</strong><span>{adMode?"Choose the duration in your ad brief.":mapEnabled?timing.reason:"Describe the length, pacing and structure you want, or let Studio estimate a suitable request from your lyrics and musical direction."}</span><details><summary>Generation request estimate</summary><p>{formatTrackTime(timing.seconds)} · {timing.reason} Credits are quoted for this request before processing.</p></details></div>
        {!instrumental && !connected && <div className="quick-connection">
          <p className="muted">Connect ElevenLabs for sung or spoken vocals.</p>
          <HelpControl subject="Music connections" tip="Open the settings for connecting a music service."><button type="button" className="secondary small" onClick={settings}><Settings2 size={15}/> Provider settings</button></HelpControl>
        </div>}
        {error && <p className="notice" role="alert">{error}</p>}
        {ownLyrics && !instrumental && <LyricNotationPreview text={lyrics}/>}
        {savePrompt&&<div className="actions"><button type="button" className="secondary" disabled={busy||!idea.trim()&&!lyrics.trim()} onClick={async()=>{setPromptBusy(true);try{const saved=await savePrompt({name:songTitle||genre+" prompt",tags:genreTags(genre),lyrics:ownLyrics?lyrics:"",idea,instruments,vocals:vocalDirection,...(adMode?{musicalAd:adBrief}:{})});setPromptNotice(saved?"Prompt saved privately with lyrics, styles, instruments and vocal directions.":"Prompt could not save. Your writing is still here; retry.");}catch(e){setPromptNotice((e as Error).message||"The prompt could not save. Retry.");}finally{setPromptBusy(false);}}}>Save prompt</button></div>}
        {promptNotice&&<p role="status">{promptNotice}</p>}
        <div className="actions quick-submit">
          <HelpControl subject="Create track" tip={localSketch?"Render a sketch with Studio’s built-in instruments.":"Generate music from your description through the connected service. Vocal songs and instrumentals may use plan credits."}><button type="submit" className="primary" disabled={(!idea.trim()&&!(playful&&ownLyrics&&!instrumental&&performanceWeight(lyrics)>0)) || hasExplicitWords(idea, genre, instruments, code,ownLyrics?lyrics:"") || (!instrumental && !connected)}><Music2 size={17}/>
            {pending ? localSketch?"Rendering your sketch…":"Creating your track…" : localSketch?"Create sketch":playful?"Make mine":adMode?"Create musical ad":instrumental ? "Create instrumental" : "Create song"}</button></HelpControl>
        </div>
        <p className="muted quick-note">{localSketch
          ? `A ${formatTrackTime(timing.seconds)} instrumental from Studio’s built-in palettes. Arrangement code saves with the draft.`
          : `A ${formatTrackTime(timing.seconds)} ${instrumental?"instrumental request":"song request with lyrics and vocals"}. The connected music service can use plan credits.`}</p>
      </fieldset>
    </form>
    <details className="optional-song-controls play-extra"><summary>Additional production tools</summary><p className="muted">Optional legacy tools for detailed arrangements and existing production projects.</p><button type="button" className="text-button" disabled={busy} onClick={guided}>Open detailed production editor</button></details>
    {pendingTake&&<div className="quick-result"><strong>{pendingTake.title} · Not saved yet</strong><AudioPlayer src={pendingTake.url} label="Listen to pending instrumental"/><div className="actions"><a className="secondary small" href={pendingTake.url} download={pendingTake.title+".wav"}>Download original</a><button type="button" className="primary small" disabled={busy} onClick={async()=>{setPending(true);try{await savePending(pendingTake);}finally{setPending(false);}}}>Retry save to My Songs</button><button type="button" className="secondary small" disabled={busy} onClick={()=>{if(confirm("Discard this local take? Download it first if you want a copy. No saved song will be deleted.")){setPendingTake(undefined);setError("");}}}>Discard unsaved take</button></div></div>}
    {playful&&result?.audioFormat&&playStage!=="start"&&<section className="creative-play-result" aria-label="Your creation"><p className="eyebrow">YOURS · SAVED PRIVATELY</p><h2>{result.name}</h2><AudioPlayer src={songAudioUrl(result.audioId??result.id)} label="Listen to your creation"/>
      {playStage==="play"?<><p className="muted">A new take keeps this one safe. Sound choices guide the next creation; they do not change this recording.</p><div className="play-controls"><label>Energy<select disabled={busy} value={playChoices.energy} onChange={e=>changePlay({...playChoices,energy:e.target.value as PlayChoices["energy"]})}>{Object.keys(playEnergies).map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label><label>Mood<select disabled={busy} value={playChoices.mood} onChange={e=>changePlay({...playChoices,mood:e.target.value as PlayChoices["mood"]})}>{Object.keys(playMoods).map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></label><label>Look<select disabled={busy} value={playChoices.look} onChange={e=>changePlay({...playChoices,look:e.target.value as PlayChoices["look"]})}>{Object.entries(playLooks).map(([v,item])=><option key={v} value={v}>{item.name}</option>)}</select></label></div><div className="actions"><button type="button" className="primary" disabled={busy} onClick={()=>setPlayStage("share")}>Keep this · make it visual</button><button type="button" className="secondary" disabled={busy} onClick={()=>createForm.current?.requestSubmit()}>Try a new take</button>{previousChoices&&<button type="button" className="text-button" disabled={busy} onClick={()=>{setPlayChoices(previousChoices);setPreviousChoices(null);}}>Undo choices</button>}</div><p className="muted">New music requests can use provider credits. All takes remain in My Songs.</p>{takeIds.length>1&&<label>Listen to an earlier take<select value={result.id} disabled={busy} onChange={e=>setResultId(e.target.value)}>{takeIds.map(id=>drafts.find(s=>s.id===id&&!s.deletedAt)).filter((s):s is Song=>!!s?.audioFormat).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}</>:<><p>Your song is saved. Add a photo if you like, then preview your vertical video. Your photo is used as a private background; it is not sent for AI generation.</p><label className="field">My photo · optional<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>15*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("Choose a JPG, PNG or WebP photo up to 15 MB.");return;}setPhoto(file);setPhotoName(file.name);setError("");}}/></label>{photo&&<p>{photoName} <button type="button" className="text-button" disabled={busy} onClick={()=>{setPhoto(null);setPhotoName("");}}>Remove photo</button></p>}{makeVideo&&<button type="button" className="primary" disabled={busy} onClick={async()=>{setPromptBusy(true);setError("");try{await makeVideo(result,true,{look:playLooks[playChoices.look].preset,...(photo?{photo:new File([photo],photoName||"my-photo.png",{type:photo.type})}:{})});}catch(e){setError((e as Error).message||"The video could not open. Your song and photo are still here.");}finally{setPromptBusy(false);}}}>Make my video</button>}<details><summary>Save audio instead</summary><AudioFormatDownload url={songAudioUrl(result.audioId??result.id)} title={result.name} sourceKey={result.audioId??result.id}/></details><p className="muted">Review lyric timing and the video, then download or use your device’s share options. Nothing is posted automatically.</p></>}
      {pending&&<p role="status">Creating a new take. Your current version stays saved.</p>}{error&&<p role="alert" className="notice">{error}</p>}<button type="button" className="text-button" disabled={busy} onClick={()=>setPlayStage("start")}>Back to my idea</button></section>}
    {!playful&&result?.audioFormat && <div className="quick-result" aria-live="polite"><p>Saved privately in My Songs.</p><SongCard song={result}/><div className="actions creator-next-actions">{makeVideo&&<><button type="button" className="primary" disabled={busy} onClick={()=>makeVideo(result)}>{result.musicalAd?"Make advertising video":result.creationKind==="instrumental"||result.instrumental?"Make music video":"Auto lyric video"}</button><button type="button" className="secondary" disabled={busy} onClick={()=>makeVideo(result,true)}>Make social short</button></>}{publish&&<button type="button" className="secondary" disabled={busy} onClick={()=>publish(result)}>Publish & share</button>}</div><p className="muted">Song actions includes editing, voice recording, mixing, downloads and removal. Publish &amp; share opens release review; external platforms require their own submission.</p><button type="button" className="text-button" disabled={busy} onClick={openDrafts}>Open saved creations <ArrowRight size={15}/></button></div>}
  </section>;
}
