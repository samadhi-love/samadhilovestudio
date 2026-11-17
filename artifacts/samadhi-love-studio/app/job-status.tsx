"use client";
import {useEffect,useState} from "react";
import {useRecoveryScope} from "./draft-recovery";
type Job={id:string;type:string;status:string;song_id:string;error_message?:string};
export function JobStatus({completed}:{completed:()=>void}){
  const workspace=useRecoveryScope();
  const [jobs,setJobs]=useState<Job[]>([]),[error,setError]=useState(""),[busy,setBusy]=useState("");
  useEffect(()=>{
    if(!workspace)return;
    let stopped=false,known:Set<string>|undefined;
    const refresh=()=>{void fetch("/api/studio/jobs",{cache:"no-store"}).then(async r=>r.ok?await r.json() as {jobs?:Job[]}:null).then(v=>{
      if(stopped||!Array.isArray(v?.jobs))return;
      const done=new Set(v.jobs.filter(job=>job.status==="done"&&job.type==="music-generation").map(job=>job.id));
      if(known&&[...done].some(id=>!known!.has(id)))completed();
      known=done;setJobs(v.jobs);
    }).catch(()=>{});};
    refresh();const timer=setInterval(refresh,5000);window.addEventListener("samadhi-jobs-updated",refresh);
    return()=>{stopped=true;clearInterval(timer);window.removeEventListener("samadhi-jobs-updated",refresh);};
  },[workspace,completed]);
  async function retry(job:Job){
    if(!window.confirm("Start a new attempt using your saved inputs? The previous attempt did not contact the provider. This new attempt may use your provider allowance."))return;
    setBusy(job.id);setError("");
    try{
      const headers={"Content-Type":"application/json","X-Production-Id":crypto.randomUUID(),"X-Studio-Workspace":workspace};
      const submit=(accepted?:number)=>fetch("/api/studio/jobs",{method:"POST",headers,body:JSON.stringify({retry:job.id,confirm:true,accepted})});
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
  const visible=jobs.filter(j=>!j.error_message?.startsWith("Retry started:")).slice(0,4);
  if(!visible.length&&!error)return null;
  return <section className="notice" aria-label="Saved work status" aria-live="polite">
    {visible.map(job=><p key={job.id}>{job.status==="done"?"Done":job.status==="failed"?"Didn't finish":job.type==="music-generation"?"Making your song…":job.type==="video-render"?"Making your video…":"Timing your lyrics…"} {job.status==="failed"&&<><span>{job.error_message}</span> {job.error_message?.startsWith("No provider request")&&<button type="button" disabled={!!busy} onClick={()=>void retry(job)}>Try again</button>}</>}</p>)}
    {error&&<p role="alert">{error}</p>}
  </section>;
}
