import {privateWorkspace} from "../../../studio-access";
import {privateHeaders,readStudio} from "../store";
import {readBoundedText,recoverableRoute} from "../request-errors";
import {enqueueWork,ownedJob,prepareSong,readJobDocument,type SavedWork} from "../../../server/job-runner";
import {createStudioJob,listStudioJobs,startStudioJob,finishStudioJob,failStudioJob} from "../../../server/jobs";
import {POST as create} from "../create/route";
import {POST as sync} from "../lyric-sync/route";
import {serverStorage as env} from "../../../server/storage";
import {recoverStaleJobs} from "../../../../scripts/storage/jobs.mjs";
import {settleJob} from "../../../credits/account-ledger";
import {quoteProduction} from "../../../credits/production";
import {getRequestExecutionContext} from "vinext/shims/request-context";
export const dynamic="force-dynamic";
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:privateHeaders});
export const GET=recoverableRoute(async(request:Request)=>{
  const owner=(await privateWorkspace())?.id;
  if(!owner)return reply({error:"Sign in to check your saved work."},401);
  const params=new URL(request.url).searchParams;
  const id=params.get("id");
  if(!id){
    const songId=params.get("songId");
    let jobs=await listStudioJobs(owner,songId?{songId}:{});
    if(env.DB&&jobs.some((job:{status:string;updated_at:number})=>["waiting","working"].includes(job.status)&&job.updated_at<Date.now()-600000)){
      await recoverStaleJobs(env.DB,Date.now(),600000,owner);
      jobs=await listStudioJobs(owner,songId?{songId}:{});
    }
    if(songId&&params.get("captions")==="1"){
      for(const job of jobs){
        if(job.type!=="lyric-sync"||job.status!=="done")continue;
        const outcome=await readJobDocument<{body:{cues?:unknown}}>(owner,job.id,"result");
        const work=await readJobDocument<SavedWork>(owner,job.id,"request");
        if(work&&outcome?.body.cues)return reply({captions:outcome.body,sourceAudioId:work.input.sourceAudioId??work.input.audioId??songId,text:work.input.text,jobId:job.id});
      }
      return reply({captions:null});
    }
    return reply({jobs});
  }
  let job=await ownedJob(owner,id);
  if(!job)return reply({error:"This job is unavailable."},404);
  if(env.DB&&["waiting","working"].includes(job.status)&&job.updated_at<Date.now()-600000){
    await recoverStaleJobs(env.DB,Date.now(),600000,owner);
    job=await ownedJob(owner,id)??job;
  }
  const result=["done","failed"].includes(job.status)?await readJobDocument<{status:number;body:object}>(owner,id!,"result"):null;
  if(result&&job.type==="music-generation")result.body={...result.body,...await readStudio(owner)};
  return reply({job,result});
},"Saved work status could not load.");
export const POST=recoverableRoute(async(request:Request)=>{
  const access=await privateWorkspace();
  if(!access)return reply({error:"Sign in to start your saved work."},401);
  const owner=access.id;
  if(request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Open Studio directly to continue."},403);
  const expected=request.headers.get("X-Studio-Workspace");
  if(expected&&expected!==owner)return reply({error:"Your account changed. Reload before continuing."},409);
  let input;
  try{input=JSON.parse(await readBoundedText(request,80000));}
  catch(error){if(error instanceof SyntaxError)return reply({error:"Check the work request."},400);throw error;}
  if(!input||typeof input!=="object")return reply({error:"Choose work to start."},400);
  if(input.video==="start"){
    if(input.resume){
      const prior=await ownedJob(owner,input.resume);
      if(prior?.type==="video-render"&&prior.song_id===input.songId&&prior.status==="working"){
        // Only this device's saved job reference is eligible for explicit takeover.
        // A new job gets its own lease; a late result cannot complete it.
        await failStudioJob(owner,prior.id,"A new export resumed from this device's saved progress.");
      }
    }
    const {job}=await createStudioJob(owner,{type:"video-render",songId:input.songId});
    await startStudioJob(owner,job.id);
    return reply({jobId:job.id},201);
  }
  if(["heartbeat","done","failed"].includes(input.video)){
    const video=await ownedJob(owner,input.jobId);
    if(video?.type!=="video-render"||video.status!=="working")return reply({error:"This export is no longer active."},409);
    if(input.video==="heartbeat")await env.DB!.prepare("UPDATE studio_jobs SET updated_at=? WHERE owner=? AND id=? AND status='working'").bind(Date.now(),owner,video.id).run();
    else if(input.video==="done")await finishStudioJob(owner,video.id);
    else await failStudioJob(owner,video.id,"Open the song's Video editor and choose Resume export. Your saved project is safe.");
    return reply({ok:true});
  }
  let work:SavedWork;
  let songId:string;
  if(input.retry){
    const prior=await ownedJob(owner,input.retry);
    if(!prior||prior.status!=="failed")return reply({error:"Only an unfinished job can be retried. No processing started."},409);
    if(input.confirm!==true)return reply({error:"Confirm a new provider attempt first. Your previous provider charge may be uncertain."},409);
    const outcome=await readJobDocument<{retryable?:boolean}>(owner,prior.id,"result");
    if(outcome?.retryable!==true)return reply({error:"Studio can't confirm that this attempt was uncharged. Check your provider history; no retry was started."},409);
    const saved=await readJobDocument<SavedWork>(owner,prior.id,"request");
    if(!saved)return reply({error:"The saved inputs are unavailable. No processing started."},409);
    let accepted:string|null=null;
    if(env.STUDIO_CREDITS_ENABLED==="1"){
      await settleJob(owner,prior.id,true);
      const quote=await quoteProduction(owner,saved.route,saved.input);
      if(quote.funding==="studio"){
        if(!quote.enabled)return reply({error:quote.message},409);
        if(input.accepted!==quote.credits)return reply({confirmCredits:quote.credits},402);
        accepted=String(quote.credits);
      }
    }
    const claimed=await env.DB!.prepare("UPDATE studio_jobs SET error_message=?,updated_at=? WHERE owner=? AND id=? AND status='failed' AND error_message NOT LIKE 'Retry started:%'")
      .bind("Retry started: check the new attempt below.",Date.now(),owner,prior.id).run();
    if(!claimed.meta.changes)return reply({error:"A retry already started. Check its status below; no extra work was started."},409);
    work={...saved,accepted};
    songId=prior.song_id;
  }else{
    const supplied=request.headers.get("X-Production-Id");
    if(supplied&&!/^[a-f0-9-]{36}$/i.test(supplied))return reply({error:"Invalid work reference."},400);
    if(supplied){
      const prior=await ownedJob(owner,supplied);
      if(prior)return reply({jobId:prior.id,songId:prior.song_id,status:prior.status},202);
    }
    if(!input.input||typeof input.input!=="object"||Array.isArray(input.input))return reply({error:"Describe the work to start."},400);
    if(input.route!=="/api/studio/lyric-sync"&&!(input.route==="/api/studio/create"&&input.input.action==="song"))return reply({error:"Choose song creation or lyric timing."},400);
    work={route:input.route,input:input.input,accepted:request.headers.get("X-Studio-Credits-Accepted")};
    songId=work.route.endsWith("/create")?await prepareSong(owner,work.input,supplied??crypto.randomUUID()):String(work.input.songId??"");
  }
  const {id,task}=await enqueueWork(owner,songId,work,work.route.endsWith("/create")?create:sync,request,access.role);
  if(task)getRequestExecutionContext()?.waitUntil(task);
  return reply({jobId:id,songId,status:"waiting"},202);
},"Your work could not be queued. Your saved drafts are preserved.");
