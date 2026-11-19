"use client";
import { useEffect, useRef, useState } from "react";
import { assetUrl } from "./lyric-pro-data";
import { uploadLyricAsset } from "./lyric-pro-media";
import { visualActive, visualModes, type VisualJob, type VisualMode } from "./visual-generation-data";
import type { LyricProject } from "./lyric-video-data";

const endpoint="/api/studio/visual-generation";
type Library={configured:boolean;jobs:VisualJob[];images:{id:string;label:string}[]};
type ApiResult={job:VisualJob;tier?:string|null;eligible?:boolean|null;error?:string};
export function VisualGenerationControls({project,apply,disabled}:{project:LyricProject;apply:(job:VisualJob,scene:boolean)=>Promise<void>;disabled:boolean}) {
  const p=project.pro!;
  const [library,setLibrary]=useState<Library>({configured:false,jobs:[],images:[]});
  const [loaded,setLoaded]=useState(false),[mode,setMode]=useState<VisualMode>("image"),[prompt,setPrompt]=useState("");
  const [reference,setReference]=useState(""),[billing,setBilling]=useState(false),[rights,setRights]=useState(false);
  const [working,setWorking]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [poll,setPoll]=useState(true),[recovery,setRecovery]=useState<Record<string,string>>({});
  const [showAll,setShowAll]=useState(false);
  const activeSong=useRef(p.sourceSongId),request=useRef<{id:string;signature:string}|null>(null);
  activeSong.current=p.sourceSongId;
  const alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  const updateJob=(job:VisualJob)=>{if(alive.current&&activeSong.current===job.song)setLibrary(old=>({...old,jobs:[job,...old.jobs.filter(j=>j.id!==job.id)].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),images:job.status==="ready"&&job.mode==="image"&&job.asset&&!old.images.some(i=>i.id===job.asset)?[...old.images,{id:job.asset,label:job.prompt.slice(0,70)}]:old.images}));};
  async function api(payload:object){const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),credentials:"same-origin"});const result=await response.json() as ApiResult;if(!response.ok)throw new Error(result.error??"The visual request could not finish.");return result;}
  async function load(signal?:AbortSignal){const song=p.sourceSongId;const response=await fetch(endpoint+"?song="+encodeURIComponent(song),{signal,credentials:"same-origin"});const result=await response.json() as Library&{error?:string};if(!response.ok)throw new Error(result.error??"The visual library could not open.");if(alive.current&&activeSong.current===song){setLibrary(result);setLoaded(true);}}
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  useEffect(()=>{const task=new AbortController();setLoaded(false);setLibrary({configured:false,jobs:[],images:[]});setReference("");setBilling(false);setRights(false);setError("");setNotice("");request.current=null;void load(task.signal).catch(e=>{if(!task.signal.aborted)setError(e.message);});return()=>task.abort();},[p.sourceSongId]);
  const pending=library.jobs.filter(visualActive);
  useEffect(()=>{
    if(!poll||!pending.length)return;
    const song=p.sourceSongId;let stopped=false;
    const timer=window.setTimeout(async()=>{
      for(const job of pending){if(stopped)break;try{const result=await api({action:"refresh",song,id:job.id});if(!stopped)updateJob(result.job);}catch(e){if(!stopped&&activeSong.current===song){setError(e instanceof Error?e.message:"Checking status failed. Try again.");setPoll(false);}break;}}
    },8000);
    return()=>{stopped=true;window.clearTimeout(timer);};
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs only when the listed values change; reads that render's current values on purpose
  },[library.jobs,poll,p.sourceSongId]);
  const fail=(e:unknown)=>{if(alive.current)setError(e instanceof Error?e.message:"This visual action could not finish.");};
  async function generate(){
    setWorking(true);setError("");setNotice("");const song=p.sourceSongId;
    // Keep the same request ID after a timeout or lost response. Changing inputs deliberately starts a new request.
    const signature=JSON.stringify({song,source:p.sourceAudioId,mode,prompt:prompt.trim(),format:project.format,reference:mode==="animate"?reference:undefined});
    if(request.current?.signature!==signature)request.current={signature,id:crypto.randomUUID()};
    try{const result=await api({action:"create",song,id:request.current.id,source:p.sourceAudioId,mode,prompt:prompt.trim(),format:project.format,reference,billingConsent:billing,rightsConsent:rights});if(activeSong.current===song){updateJob(result.job);if(!["unknown","submitting"].includes(result.job.status))request.current=null;setBilling(false);setPoll(true);setNotice("Request saved. You can leave and return to this song to check its result. Review the visual, then choose Use in video.");}}
    catch(e){fail(e);try{await load();}catch{/* Keep the receipt for a safe manual retry. */}}
    finally{if(alive.current)setWorking(false);}
  }
  async function act(action:()=>Promise<void>){setWorking(true);setError("");try{await action();}catch(e){fail(e);}finally{if(alive.current)setWorking(false);}}
  async function upload(file:File){const song=p.sourceSongId;await act(async()=>{if(!["image/png","image/jpeg","image/webp"].includes(file.type)||!file.size||file.size>15*1024*1024)throw new Error("Choose a PNG, JPG or WebP up to 15 MB.");const bitmap=await createImageBitmap(file);bitmap.close();const id=await uploadLyricAsset(song,"background",file,undefined,p.sourceAudioId);if(activeSong.current===song){setReference(id);setLibrary(old=>({...old,images:[...old.images,{id,label:file.name.slice(0,70)}]}));setNotice("Reference saved privately. It will be sent to ElevenLabs only when you approve and generate.");}});}
  const locked=disabled||working;
  return <section className="visual-generation-controls" aria-label="AI image and video creator">
    <h3>Create AI visuals</h3><p className="lvp-note">Describe a background, bring your image to life, or create a four-second motion scene. Keep your song and synchronized lyrics in the same project.</p>
    <div className="actions" role="group" aria-label="Visual creation type">{Object.entries(visualModes).map(([id,label])=><button key={id} type="button" aria-pressed={mode===id} disabled={locked} onClick={()=>{setMode(id as VisualMode);setBilling(false);}}>{label}</button>)}</div>
    {!loaded?<p role="status">{error?"Visual library unavailable.":"Opening your private visuals…"} <button type="button" disabled={locked} onClick={()=>void act(()=>load())}>Retry</button></p>:!library.configured?<p className="notice">Connect your own ElevenLabs API key in Studio Settings. Image & Video needs an ElevenLabs Pro-or-higher plan and Image & Video (Flows) permission. Your existing music connection stays in place.</p>:<p className="lvp-note">Uses your saved ElevenLabs connection. <button type="button" disabled={locked} onClick={()=>void act(async()=>{const result=await api({action:"check",song:p.sourceSongId});setNotice(result.eligible===false?`Your ElevenLabs plan (${result.tier}) needs an upgrade to Pro or higher for visuals.`:result.tier?`ElevenLabs reports plan: ${result.tier}. Model access, permissions and credits are checked when you generate.`:"Plan could not be read. Enable User read permission to check it here; visual access is checked when you generate.");})}>Check provider plan</button></p>}
    <label>Describe your {mode==="image"?"image":"motion scene"}<textarea rows={3} maxLength={1500} disabled={locked} value={prompt} placeholder={mode==="animate"?"Slow camera drift through the scene, flowing water and softly moving stars. Keep the main subject consistent.":"A celestial lake under a violet nebula, warm gold starlight, cinematic detail, clear space for readable lyrics. No lettering."} onChange={e=>{setPrompt(e.target.value);setBilling(false);}}/></label>
    {mode==="animate"&&<><label>Starting image<select disabled={locked} value={reference} onChange={e=>{setReference(e.target.value);setBilling(false);}}><option value="">Choose a saved image</option>{library.images.map(i=><option key={i.id} value={i.id}>{i.label}</option>)}</select></label><label>Or upload your own image · 15 MB max<input type="file" accept="image/png,image/jpeg,image/webp" disabled={locked} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void upload(file);}}/></label>{reference&&<img className="visual-reference" src={assetUrl(p.sourceSongId,reference)} alt="Selected animation starting image"/>}</>}
    <p className="lvp-note">{mode==="image"?"Gemini 2.5 Flash Image · matches your current video shape. Use a single image for the whole song or add it to up to eight scenes with pan/zoom and dissolves.":"Veo 3.1 Fast · four seconds at 720p · song audio stays unchanged. Loop the clip or hold its final frame for longer videos. Motion is generated, so subject details can change."}{project.format==="square"&&mode!=="image"&&" Square projects use a widescreen generated clip with fit/crop controls."}</p>
    <p className="lvp-note">Paid provider service: billed directly to your own ElevenLabs workspace, separately from Studio song credits. This API does not provide a price quote here. <a href="https://elevenlabs.io/pricing" target="_blank" rel="noreferrer">Review current ElevenLabs visual pricing</a> and set an API-key spending cap before generating. No generation starts just by opening this panel.</p>
    <label className="lvp-check"><input type="checkbox" checked={rights} disabled={locked} onChange={e=>setRights(e.target.checked)}/> I have permission to use these inputs and send my description and selected image to ElevenLabs for processing.</label>
    <p className="lvp-note"><a href="https://elevenlabs.io/privacy-policy" target="_blank" rel="noreferrer">ElevenLabs’ privacy and retention terms</a> apply to those inputs. Removing a Studio song does not remove its history from your provider account.</p>
    <label className="lvp-check"><input type="checkbox" checked={billing} disabled={locked} onChange={e=>setBilling(e.target.checked)}/> I accept the provider’s current charge for this one generation; Studio cannot quote the exact cost.</label>
    <div className="actions"><button type="button" className="primary" disabled={locked||!loaded||!library.configured||!prompt.trim()||!rights||!billing||mode==="animate"&&!reference} onClick={()=>void generate()}>{working?"Working…":visualModes[mode]+" · paid generation"}</button></div>
    {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
    {!!library.jobs.length&&<details open><summary>Your generated visuals · {library.jobs.length}</summary>
      <p className="lvp-note">Provider jobs can continue after you leave. Studio copies finished files into private project storage when you check this page. Final lyric-video export still requires the page open. The provider API has no cancellation endpoint; stopping checks does not stop processing or charges.</p>
      <div className="actions"><button type="button" disabled={locked} onClick={()=>setPoll(!poll)}>{poll?"Pause automatic checks":"Resume automatic checks"}</button><button type="button" disabled={locked} onClick={()=>void act(async()=>{for(const job of library.jobs.filter(j=>visualActive(j)||j.status==="unknown")){const result=await api({action:"refresh",song:p.sourceSongId,id:job.id});updateJob(result.job);}await load();})}>Refresh saved results</button><button type="button" disabled={locked} onClick={()=>{request.current=null;setBilling(false);setNotice("Ready for a separate generation. Check unresolved jobs before approving another charge.");}}>Prepare another generation</button></div>
      {library.jobs.length>6&&<button type="button" onClick={()=>setShowAll(!showAll)}>{showAll?"Show recent visuals":`Show all ${library.jobs.length} visuals`}</button>}
      <ul className="visual-job-list">{(showAll?library.jobs:library.jobs.slice(0,6)).map(job=><li key={job.id}><strong>{visualModes[job.mode]}</strong><p>{job.prompt}</p><p className="lvp-note">{new Date(job.createdAt).toLocaleString()} · {job.status==="ready"?"Saved privately":job.status} {job.source!==p.sourceAudioId&&"· Earlier recording: reopen that version to apply this visual."}</p>{job.error&&<p role={job.status==="failed"?"alert":"status"}>{job.error}</p>}
        {job.status==="ready"&&job.asset&&<>{job.mode==="image"?<img className="visual-generated-image" loading="lazy" src={assetUrl(job.song,job.asset)} alt={job.prompt}/>:<video className="visual-generated-image" controls playsInline preload="metadata" muted src={assetUrl(job.song,job.asset)}/>}<div className="actions"><button type="button" disabled={locked||job.source!==p.sourceAudioId} onClick={()=>void act(async()=>{await apply(job,false);setNotice("Visual applied. Preview your lyrics and framing before exporting.");})}>Use in video</button>{job.mode==="image"&&<><button type="button" disabled={locked||job.source!==p.sourceAudioId||(p.adPhotoStory?.photos.length??0)>=8} onClick={()=>void act(()=>apply(job,true))}>Add as a scene</button><button type="button" disabled={locked} onClick={()=>{setMode("animate");setReference(job.asset!);setBilling(false);setPrompt("Slow cinematic movement, preserve the main subject and composition. Subtle natural motion, no text.");}}>Animate this image</button></>}<a href={assetUrl(job.song,job.asset)} download={`samadhi-visual-${job.id}.${job.mime==="video/mp4"?"mp4":job.mime==="image/jpeg"?"jpg":job.mime==="image/webp"?"webp":"png"}`}>Download original</a></div></>}
        {job.status==="unknown"&&<div><label>Recover from your ElevenLabs Image & Video history<input maxLength={100} value={recovery[job.id]??""} placeholder="Paste the generation ID for this request" disabled={locked} onChange={e=>setRecovery(old=>({...old,[job.id]:e.target.value}))}/></label><button type="button" disabled={locked||!recovery[job.id]?.trim()} onClick={()=>void act(async()=>{const result=await api({action:"recover",song:job.song,id:job.id,providerId:recovery[job.id].trim()});updateJob(result.job);setPoll(true);})}>Recover result · no new generation</button></div>}
      </li>)}</ul>
    </details>}
  </section>;
}
