import {serverStorage as env} from "./storage";
import {createStudioJob,readStudioJob,startStudioJob,finishStudioJob,failStudioJob} from "./jobs";
import {freshSong,emptyCreatorStudio,type Studio} from "../studio-data";
import {readStudio,writeStudio} from "../api/studio/store";
import {jobExecution} from "../credits/production";

export type SavedWork={route:"/api/studio/create"|"/api/studio/lyric-sync";input:Record<string,unknown>;accepted:string|null};
const key=(owner:string,id:string,part:string)=>`private/jobs/${encodeURIComponent(owner)}/${id}/${part}.json`;
const running=new Set<string>();
export async function saveJobDocument(owner:string,id:string,part:string,value:unknown){
  if(!env.BUCKET)throw new Error("Private job storage is unavailable.");
  return env.BUCKET.put(key(owner,id,part),JSON.stringify(value),{httpMetadata:{contentType:"application/json"},...(part==="request"?{onlyIf:{etagDoesNotMatch:"*"}}:{})});
}
export async function readJobDocument<T>(owner:string,id:string,part:string):Promise<T|null>{
  const object=await env.BUCKET?.get(key(owner,id,part));
  return object?object.json<T>():null;
}
export async function prepareSong(owner:string,input:Record<string,unknown>,id:string){
  for(let attempt=0;attempt<4;attempt++){
    const current=await readStudio(owner);
    const prior=current.data?.songs.find(s=>s.id===id&&!s.deletedAt);
    if(prior)return prior.id;
    const data=current.data??emptyCreatorStudio;
    const draft=freshSong(id,String(input.title||"Untitled song").slice(0,120),data.songs.length);
    draft.creationDraft=true;
    draft.notes.lyrics=typeof input.lyrics==="string"?input.lyrics:"";
    draft.notes.prompt=typeof input.prompt==="string"?input.prompt:"";
    draft.notes.vocals=typeof input.voice==="string"?input.voice:"";
    const next:Studio={...data,songs:[draft,...data.songs]};
    if(await writeStudio(owner,current.revision,JSON.stringify(next)))return draft.id;
  }
  throw new Error("Your writing draft changed in another tab. Keep your words and reload before creating.");
}
export async function enqueueWork(owner:string,songId:string,work:SavedWork,execute:(request:Request)=>Promise<Response>,source:Request,role:"owner"|"creator"){
  const supplied=source.headers.get("X-Production-Id");
  const id=supplied&&/^[a-f0-9-]{36}$/i.test(supplied)?supplied:crypto.randomUUID();
  const prior=await readStudioJob(owner,id);
  if(prior)return {id,task:null};
  // Persist the approved input without cookies, bearer tokens or provider keys.
  await saveJobDocument(owner,id,"request",work);
  const saved=await readJobDocument<SavedWork>(owner,id,"request");
  if(!saved||JSON.stringify(saved)!==JSON.stringify(work))throw new Error("This reference already belongs to different work.");
  const created=await createStudioJob(owner,{id,songId,type:work.route.endsWith("/create")?"music-generation":"lyric-sync"});
  return {id,task:created.created?runWork(owner,id,songId,work,execute,source,role):null};
}
async function runWork(owner:string,id:string,songId:string,work:SavedWork,execute:(request:Request)=>Promise<Response>,source:Request,role:"owner"|"creator"){
  if(running.has(id))return;
  running.add(id);
  let heartbeat:ReturnType<typeof setInterval>|undefined;
  try{
    await startStudioJob(owner,id);
    heartbeat=setInterval(()=>{void env.DB?.prepare("UPDATE studio_jobs SET updated_at=? WHERE owner=? AND id=? AND status='working'").bind(Date.now(),owner,id).run().catch(()=>{});},30000);
    const headers=new Headers({"Content-Type":"application/json",origin:new URL(source.url).origin});
    headers.set("X-Production-Id",id);
    headers.set("X-Studio-Workspace",owner);
    if(work.accepted!==null)headers.set("X-Studio-Credits-Accepted",work.accepted);
    else headers.delete("X-Studio-Credits-Accepted");
    const request=new Request(new URL(work.route,source.url),{method:"POST",headers,body:JSON.stringify(work.input)});
    const execution={owner,role,songId,providerStarted:false};
    jobExecution.set(request,execution);
    const response=await execute(request);
    const raw=await response.json() as Record<string,unknown>;
    // A job receipt must never become an old copy of the entire library.
    const {data:unusedData,revision:unusedRevision,...musicBody}=raw;
    const body=work.route.endsWith("/create")?{...musicBody,songId}:raw;
    await saveJobDocument(owner,id,"result",{status:response.status,body,retryable:!response.ok&&!execution.providerStarted});
    if(response.ok)await finishStudioJob(owner,id);
    else await failStudioJob(owner,id,execution.providerStarted?"The provider may already have billed this attempt. Check My Songs and your provider history; this request won't be replayed.":"No provider request was sent. Your saved writing is safe. You can try again.");
  }catch{
    // Never replay an ambiguous paid call. Its durable input remains available.
    try{await failStudioJob(owner,id,"This attempt could not be confirmed. Check My Songs and your provider history. Studio won't replay this request.");}catch{/* Startup/status reconciliation will close a stale lease. */}
  }finally{
    if(heartbeat)clearInterval(heartbeat);
    running.delete(id);
  }
}
export async function ownedJob(owner:string,id:string){
  if(typeof id!=="string"||!/^[\w-]{1,100}$/.test(id))return null;
  return readStudioJob(owner,id);
}
