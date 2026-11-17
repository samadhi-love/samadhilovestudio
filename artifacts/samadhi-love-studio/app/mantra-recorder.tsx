"use client";
import { useEffect, useRef, useState } from "react";
import { MantraAudio, phraseLimit, performanceLimit, type EchoPreset, type CaptureKind, type ReplayMode } from "./mantra-audio";
import { decodeTake, wavAudio } from "./recording-dsp";
import { microphoneError } from "./microphone-input";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";

type Clip = { id: string; name: string; blob: Blob; saved?: { id: string; name: string } };
export type MantraSave = (file: File, title: string, target: null, projectId?: string, saveId?: string) => Promise<{ id: string; name: string } | null>;
function extension(blob: Blob) { return blob.type.includes("wav") ? "wav" : blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"; }
function ClipPreview({ clip, label, disabled, save, open }: { clip: Clip; label: string; disabled: boolean; save: () => void; open: (id: string) => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => { const url=URL.createObjectURL(clip.blob);setUrl(url);return()=>URL.revokeObjectURL(url); }, [clip.blob]);
  return <div className="mantra-clip">
    <strong>{label}: {clip.name}</strong>
    <audio controls={!disabled} preload="metadata" src={url||undefined} aria-label={`Preview ${label.toLowerCase()}`}/>
    <div className="actions">
      <a className="secondary" href={url} download={`${clip.name.replace(/[\\/:*?"<>|]/g,"-")}.${extension(clip.blob)}`}>Download {label.toLowerCase()}</a>
      <button type="button" className="secondary" disabled={disabled||!!clip.saved} onClick={save}>{clip.saved?"Saved privately":`Save ${label.toLowerCase()} privately`}</button>
      {clip.saved&&<button type="button" className="text-button" disabled={disabled} onClick={()=>open(clip.saved!.id)}>Open saved {label.toLowerCase()}</button>}
    </div>
  </div>;
}

export function MantraRecorder({ active, disabled, device, onCapture, save, open, createAudio=()=>new MantraAudio() }: {
  active: boolean; disabled: boolean; device: string; onCapture: (value: boolean) => void; save: MantraSave; open: (id: string) => void;
  createAudio?: () => MantraAudio;
}) {
  const [phrase,setPhrase]=useState<Clip>();
  const [performance,setPerformance]=useState<Clip>();
  const [title,setTitle]=useState("My mantra");
  const [mode,setMode]=useState<ReplayMode>("once");
  const [echo,setEcho]=useState<EchoPreset>("off");
  const [gap,setGap]=useState(0.5);
  const [volume,setVolume]=useState(0.5);
  const [monitor,setMonitor]=useState(false);
  const [phase,setPhase]=useState<"idle"|"opening"|CaptureKind|"finishing">("idle");
  const [playing,setPlaying]=useState<ReplayMode|null>(null);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const engine=useRef<MantraAudio|undefined>(undefined);
  const alive=useRef(true), activeRef=useRef(active), operation=useRef(0), savingRef=useRef(false);
  const stopping=useRef(false);
  const stopRef=useRef<()=>Promise<void>>(async()=>{});
  const captureCallback=useRef(onCapture);captureCallback.current=onCapture;activeRef.current=active;
  const occupied=phase!=="idle"||!!playing;
  useEffect(()=>{captureCallback.current(occupied);},[occupied]);
  const recovery=useDraftRecovery("mantra-recorder",{phrase,performance,title,mode,echo,gap,volume},value=>{
    for(const clip of [value.phrase,value.performance])if(clip&&(!(clip.blob instanceof Blob)||typeof clip.id!=="string"||typeof clip.name!=="string"))throw new Error("This saved recording could not be restored.");
    setPhrase(value.phrase);setPerformance(value.performance);setTitle(typeof value.title==="string"?value.title:"My mantra");
    setNotice("Recovered audio is kept on this device. Preview, download or save it privately.");
  },!!(phrase||performance)&&phase==="idle");
  function audio() {
    if(!engine.current){
      const item=engine.current=createAudio();
      item.onReplayEnded=()=>{if(alive.current)setPlaying(null);};
      item.onInterrupt=message=>{if(alive.current){setError(message);void stopRef.current();}};
      item.onLimit=()=>{if(alive.current){setNotice("Recording reached its time limit. Your captured audio is being kept.");void stopRef.current();}};
    }
    engine.current.setVolume(volume);engine.current.setEcho(echo);engine.current.setMonitoring(monitor);
    return engine.current;
  }
  useEffect(()=>{
    alive.current=true;
    return()=>{alive.current=false;++operation.current;engine.current?.dispose();captureCallback.current(false);};
  },[]);
  useEffect(()=>{if(!active){++operation.current;void stopRef.current();document.querySelectorAll<HTMLAudioElement>(".mantra-recorder audio").forEach(el=>el.pause());}},[active]);
  useEffect(()=>{
    if(!occupied)return;
    const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);
  },[occupied]);
  const busy=disabled||saving||phase==="opening"||phase==="finishing";
  async function keep(kind:CaptureKind,blob:Blob) {
    let clip:Clip={id:crypto.randomUUID(),name:`${title.trim()||"My mantra"} ${kind==="phrase"?"phrase":"performance"}`,blob};
    if(alive.current)(kind==="phrase"?setPhrase:setPerformance)(clip);
    try {
      const wav=wavAudio(await decodeTake(blob));
      clip={...clip,blob:wav};
      if(alive.current)(kind==="phrase"?setPhrase:setPerformance)(clip);
    }catch{
      if(alive.current)setError("The captured browser audio is preserved, but WAV conversion failed. Download the original recording below.");
    }
    return clip;
  }
  async function stop(autoReplay=false) {
    ++operation.current;
    document.querySelectorAll<HTMLAudioElement>(".mantra-recorder audio").forEach(el=>el.pause());
    engine.current?.silence();
    if(stopping.current)return;
    if(!engine.current)return;
    stopping.current=true;
    if(alive.current){setPhase("finishing");setPlaying(null);}
    try{
      const result=await engine.current.stopAll();
      if(result){
        const clip=await keep(result.kind,result.blob);
        if(autoReplay&&result.kind==="phrase"&&alive.current&&activeRef.current){
          await engine.current.loadPhrase(clip.blob);
          await engine.current.play(mode,gap);
          if(alive.current)setPlaying(mode);
        }
      }
    }catch(e){if(alive.current)setError(e instanceof Error?e.message:"The recording could not finish. Keep any available download.");}
    finally{stopping.current=false;if(alive.current)setPhase("idle");}
  }
  stopRef.current=()=>stop();
  async function start(kind:CaptureKind) {
    if(busy||phase!=="idle"||savingRef.current)return;
    if(recovery.candidate){setError("Restore or dismiss the previous device draft before making a new recording.");return;}
    const previous=kind==="phrase"?phrase:performance;
    if(previous&&!confirm(`Replace this device's ${kind}? Download or save it first. The other recording stays untouched.`))return;
    const token=++operation.current;
    setError("");setNotice("");setPhase("opening");
    document.querySelectorAll<HTMLMediaElement>("audio,video").forEach(el=>el.pause());
    try{
      const item=audio();
      await item.startCapture(kind,device);
      if(token!==operation.current||!activeRef.current){await item.stopAll();return;}
      if(alive.current)setPhase(kind);
      if(kind==="performance"&&phrase){
        await item.loadPhrase(phrase.blob);await item.play(mode,gap);
        if(alive.current)setPlaying(mode);
      }
    }catch(e){
      if(token===operation.current&&alive.current){
        setError(e instanceof DOMException?microphoneError(e):e instanceof Error?e.message:"Microphone recording failed.");
        await engine.current?.stopAll().catch(()=>{});
        setPhase("idle");
      }
    }
  }
  async function replay() {
    if(!phrase||busy||phase==="phrase")return;
    try{setError("");const item=audio();await item.loadPhrase(phrase.blob);await item.play(mode,gap);setPlaying(mode);}
    catch(e){setError(e instanceof Error?e.message:"The phrase could not play.");}
  }
  async function saveClip(kind:CaptureKind) {
    const clip=kind==="phrase"?phrase:performance;
    if(!clip||clip.saved||savingRef.current||occupied||disabled)return;
    savingRef.current=true;setSaving(true);setError("");
    try{
      // Stable per-clip receipt makes retries safe even after a lost response.
      const result=await save(new File([clip.blob],`${clip.name}.${extension(clip.blob)}`,{type:clip.blob.type}),clip.name,null,undefined,clip.id);
      if(!result)throw new Error("Save was not confirmed. Audio is still here: download it or retry saving this same clip.");
      (kind==="phrase"?setPhrase:setPerformance)({...clip,saved:result});
      setNotice("Saved privately. The original phrase and mixed performance remain separate.");
    }catch(e){setError(e instanceof Error?e.message:"Save failed. Your audio remains available for download or retry.");}
    finally{savingRef.current=false;if(alive.current)setSaving(false);}
  }
  return <section className="mantra-recorder panel form-panel" aria-label="Live mantra recording" data-testid="mantra-recorder">
    <h2>Mantra repeat & echo</h2><RecoveryPanel recovery={recovery}/>
    <p>Capture your own phrase, then repeat it while you sing. Browser audio only—no AI generation or provider credits.</p>
    <p className="notice">Use headphones to prevent microphone feedback. Bluetooth can add delay. Live microphone monitoring starts off.</p>
    <fieldset disabled={busy||phase!=="idle"} className="mantra-settings">
      <label className="field">Recording name<input value={title} maxLength={70} onChange={e=>setTitle(e.target.value)}/></label>
      <label className="field">Repeat mode<select value={mode} onChange={e=>{engine.current?.stopReplay();setMode(e.target.value as ReplayMode);}}>
        <option value="once">Repeat once · call and response</option><option value="loop">Mantra loop · until stopped</option>
      </select></label>
      <label className="field">Pause / loop gap: {gap.toFixed(1)} seconds<input type="range" min="0" max="3" step="0.1" value={gap} onChange={e=>{engine.current?.stopReplay();setGap(Number(e.target.value));}}/></label>
    </fieldset>
    <fieldset disabled={disabled||saving||phase==="opening"||phase==="finishing"} className="mantra-settings">
      <label className="field">Repeat volume: {Math.round(volume*100)}%<input type="range" min="0" max="0.8" step="0.05" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);engine.current?.setVolume(v);}}/></label>
      <label className="field">Fading echo · while microphone is active<select value={echo} onChange={e=>{const v=e.target.value as EchoPreset;setEcho(v);engine.current?.setEcho(v);}}>
        <option value="off">Off</option><option value="soft">Soft</option><option value="medium">Medium</option><option value="long">Long</option>
      </select></label>
      <label><input type="checkbox" checked={monitor} onChange={e=>{const value=e.target.checked;if(value&&!confirm("Use headphones. Live microphone monitoring through speakers can cause loud feedback. Enable monitoring?"))return;setMonitor(value);engine.current?.setMonitoring(value);}}/> Hear my live microphone directly</label>
    </fieldset>
    <p role="status" data-testid="mantra-status">{phase==="opening"?"Requesting microphone access…":phase==="phrase"?"MIC ON · capturing original phrase":phase==="performance"?"MIC ON · recording the mixed performance":phase==="finishing"?"Finishing and keeping captured audio…":playing?`MIC OFF · ${playing==="loop"?"phrase looping":"phrase replaying once"}`:"MIC OFF · ready"}</p>
    <div className="actions">
      {phase==="phrase"?<button type="button" className="primary" onClick={()=>void stop(true)}>Finish phrase</button>:<button type="button" className="secondary" disabled={busy||phase!=="idle"} onClick={()=>void start("phrase")}>Start phrase</button>}
      <button type="button" className="secondary" disabled={!phrase||busy||phase==="phrase"} onClick={()=>void replay()}>Play {mode==="loop"?"mantra loop":"phrase once"}</button>
      {phase==="performance"?<button type="button" className="primary" onClick={()=>void stop()}>Finish performance</button>:<button type="button" className="primary" disabled={busy||phase!=="idle"} onClick={()=>void start("performance")}>Record performance</button>}
      <button type="button" className="secondary" onClick={()=>void stop()} data-testid="mantra-stop-all">Stop all</button>
      <button type="button" className="text-button" disabled={busy} onClick={()=>void audio().resume().catch(e=>setError(e instanceof Error?e.message:"Audio could not resume."))}>Resume audio</button>
    </div>
    <p className="muted">Phrase: up to {phraseLimit} seconds. Performance: up to {performanceLimit/60} minutes. A performance records your live voice, phrase replays and echo together—even with direct microphone monitoring off. Phrase capture keeps the unprocessed microphone separately. Finish phrase previews its repeat automatically.</p>
    <p className="muted">Stop all silences phrase playback and echo immediately, ends capture and releases the microphone. Keep Studio open; calls, screen locking and backgrounding may interrupt recording. Device drafts stay local until you choose Save privately.</p>
    {error&&<p role="alert" className="notice" data-testid="mantra-error">{error}</p>}
    {notice&&<p role="status" className="muted">{notice}</p>}
    {phrase&&<ClipPreview clip={phrase} label="Phrase" disabled={disabled||saving||occupied} save={()=>void saveClip("phrase")} open={open}/>}
    {performance&&<ClipPreview clip={performance} label="Performance" disabled={disabled||saving||occupied} save={()=>void saveClip("performance")} open={open}/>}
  </section>;
}
