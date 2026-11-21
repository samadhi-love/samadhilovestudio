"use client";
import {useEffect,useRef,useState} from "react";
import {useRecoveryScope} from "./draft-recovery";
import {lostConnectionMessage,readJobReply} from "./credits/job-wait";
type Job={id:string;type:string;status:string;song_id:string;error_message?:string;updated_at?:number};
/** Finished work shows briefly, then leaves on its own; anything can be closed with ✕. */
export const finishedShownMs=2*60*1000;
const finishedLabel=(type:string)=>type==="music-generation"?"✓ Your song is ready. Find it in Songs.":type==="video-render"?"✓ Your video is ready.":type==="lyric-sync"?"✓ Your lyrics are timed.":"✓ Finished.";
const dismissedKey=(workspace:string)=>`samadhi-dismissed-jobs:${workspace}`;
function readDismissed(workspace:string){try{const v=JSON.parse(window.localStorage.getItem(dismissedKey(workspace))??"[]");return new Set<string>(Array.isArray(v)?v.filter(x=>typeof x==="string"):[]);}catch{return new Set<string>();}}
const uncertainWarning="This may use credits again, because the last attempt may have reached your music provider. Try again?";
export function JobStatus({completed}:{completed:()=>void}){
  const workspace=useRecoveryScope();
  const [jobs,setJobs]=useState<Job[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState("");
  const [connectionError,setConnectionError]=useState(""),[checking,setChecking]=useState(false);
  const [dismissed,setDismissed]=useState<Set<string>>(()=>new Set());
  useEffect(()=>{setDismissed(workspace?readDismissed(workspace):new Set());},[workspace]);
  function dismiss(id:string){
    setDismissed(current=>{const next=new Set(current).add(id);try{window.localStorage.setItem(dismissedKey(workspace),JSON.stringify([...next].slice(-60)));}catch{/* private mode: closes for this visit */}return next;});
  }
  const refreshStatus=useRef<()=>void>(()=>{});
  useEffect(()=>{
    setJobs([]);setConnectionError("");setChecking(false);
    if(!workspace)return;
    let stopped=false,pending=false,known:Set<string>|undefined;
    const controller=new AbortController();
    const refresh=()=>{
      if(pending||stopped)return;
      pending=true;setChecking(true);
      void readJobReply<{jobs?:Job[]}>(signal=>fetch("/api/studio/jobs",{cache:"no-store",signal}),15_000,controller.signal).then(reply=>{
      const v=reply.body;
      if(!stopped&&!Array.isArray(v?.jobs))setConnectionError(lostConnectionMessage);
      if(stopped||!Array.isArray(v?.jobs))return;
      setConnectionError("");
      const done=new Set(v.jobs.filter(job=>job.status==="done"&&job.type==="music-generation").map(job=>job.id));
      if(known&&[...done].some(id=>!known!.has(id)))completed();
      known=done;setJobs(v.jobs);
    }).catch(()=>{if(!stopped)setConnectionError(lostConnectionMessage);}).finally(()=>{pending=false;if(!stopped)setChecking(false);});};
    refreshStatus.current=refresh;
    const interrupted=(event:Event)=>{
      const detail=(event as CustomEvent<{jobId?:string;message?:string}>).detail;
      if(detail?.jobId)setConnectionError(detail.message??lostConnectionMessage);
    };
    refresh();const timer=setInterval(refresh,5000);window.addEventListener("samadhi-jobs-updated",refresh);
    window.addEventListener("samadhi-job-wait-failed",interrupted);
    return()=>{stopped=true;controller.abort();refreshStatus.current=()=>{};clearInterval(timer);window.removeEventListener("samadhi-jobs-updated",refresh);window.removeEventListener("samadhi-job-wait-failed",interrupted);};
  },[workspace,completed]);
  async function retry(job:Job){
    if(busy)return;
    const chargeUncertain=!job.error_message?.startsWith("No provider request");
    const warning=chargeUncertain?uncertainWarning:"Start a new attempt using your saved inputs? The previous attempt did not contact the provider. This new attempt may use your provider allowance.";
    if(!window.confirm(warning))return;
    setBusy(job.id);setError("");
    try{
      const headers={"Content-Type":"application/json","X-Production-Id":crypto.randomUUID(),"X-Studio-Workspace":workspace};
      const submit=(accepted?:number)=>fetch("/api/studio/jobs",{method:"POST",headers,body:JSON.stringify({retry:job.id,confirm:true,confirmChargeUncertain:chargeUncertain,accepted})});
      let response=await submit();
      let result=await response.json() as {error?:string;confirmCredits?:number};
      if(response.status===402&&typeof result.confirmCredits==="number"){
        if(!window.confirm(`Start this attempt for ${result.confirmCredits} SAMADHI credits? Unsuccessful jobs are refunded.`))return;
        response=await submit(result.confirmCredits);
        result=await response.json() as {error?:string};
      }
      if(!response.ok)throw new Error(result.error??"This attempt could not start.");
      window.dispatchEvent(new CustomEvent("samadhi-jobs-updated"));
    }catch(e){setError(e instanceof Error?e.message:"This attempt could not start.");}finally{setBusy("");}
  }
  const now=Date.now();
  const visible=jobs.filter(j=>!j.error_message?.startsWith("Retry started:")&&!dismissed.has(j.id)&&(j.status!=="done"||(typeof j.updated_at==="number"&&now-j.updated_at<finishedShownMs))).slice(0,4);
  if(!visible.length&&!error&&!connectionError)return null;
  return <section className="notice" aria-label="Saved work status" aria-live="polite">
    {visible.map(job=><p key={job.id} className="job-status-line">{job.status==="done"?finishedLabel(job.type):job.status==="failed"?"Didn't finish":job.type==="music-generation"?"Making your song…":job.type==="video-render"?"Making your video…":"Timing your lyrics…"} {job.status==="failed"&&<><span>{job.error_message}</span> {["music-generation","lyric-sync"].includes(job.type)&&<button type="button" disabled={!!busy} onClick={()=>void retry(job)}>Try again</button>}</>}{job.status!=="working"&&job.status!=="waiting"&&<button type="button" className="text-button job-status-close" aria-label="Close this message" data-testid={`button-dismiss-job-${job.id}`} onClick={()=>dismiss(job.id)}>✕</button>}</p>)}
    {error&&<p role="alert">{error}</p>}
    {connectionError&&<p role="alert">{connectionError} <button type="button" disabled={checking} onClick={()=>refreshStatus.current()}>Try again</button></p>}
  </section>;
}
