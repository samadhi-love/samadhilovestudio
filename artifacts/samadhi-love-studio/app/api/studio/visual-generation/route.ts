import { serverStorage as env } from "../../../server/storage";
import { privateWorkspace } from "../../../studio-access";
import { hasExplicitWords, isExplicitSong } from "../../../clean-content";
import { visualActive, visualDownloadUrl, visualId, visualRequestId, visualSignature, type VisualJob, type VisualMode } from "../../../visual-generation-data";
import { privateHeaders, readStudio } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";
import { resolveElevenLabsKey } from "../elevenlabs/vault";
import { visualFailure, visualJson, visualPayload, visualPlan, visualProvider } from "./provider";
import { providerMediaRequest } from "../../../server/ai-provider";

export const dynamic = "force-dynamic";
type StoredJob = VisualJob & { providerId?:string; reference?:string; touchedAt?:number };
const prefix = (owner:string,song:string) => `lyric-assets/${encodeURIComponent(owner)}/${song}/`;
const jobKey = (owner:string,song:string,id:string) => prefix(owner,song)+"visual-jobs/"+id+".json";
const problem = (error:string,status:number) => Response.json({error},{status,headers:privateHeaders});
const publicJob = ({providerId: _provider, reference: _reference, touchedAt: _touch, ...job}:StoredJob):VisualJob => job;
const json = (value:unknown) => Response.json(value,{headers:privateHeaders});
async function listJobs(owner:string,song:string) {
  const objects = await env.BUCKET!.list({prefix:prefix(owner,song)+"visual-jobs/",limit:101});
  const jobs = await Promise.all(objects.objects.map(async o => {
    const item = await env.BUCKET!.get(o.key);
    return item ? JSON.parse(await item.text()) as StoredJob : null;
  }));
  return {jobs:jobs.filter((j):j is StoredJob=>!!j).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),full:objects.truncated};
}
async function ownedSong(owner:string,id:string) {
  const {data} = await readStudio(owner);
  const song = data?.songs.find(s=>s.id===id&&!s.deletedAt);
  return song&&!isExplicitSong(song) ? song : null;
}
async function getVisuals(request:Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to open your visual library.",401);
  const song = new URL(request.url).searchParams.get("song");
  if (!visualId(song)) return problem("Choose a song first.",400);
  if (!await ownedSong(access.id,song)) return problem("Song not found in your library.",404);
  if (!env.BUCKET) return problem("Private visual storage is unavailable.",503);
  const {jobs} = await listJobs(access.id,song);
  const key = await resolveElevenLabsKey(access.id);
  const assets=await env.BUCKET.list({prefix:prefix(access.id,song),limit:1000,include:["customMetadata","httpMetadata"]} as R2ListOptions);
  const images=assets.objects.filter(o=>o.customMetadata?.kind==="background"&&visualId(o.key.slice(prefix(access.id,song).length))).map(o=>({id:o.key.slice(prefix(access.id,song).length),label:jobs.find(j=>j.asset===o.key.slice(prefix(access.id,song).length))?.prompt.slice(0,70)??"Uploaded image · "+o.key.split("/").pop()!.slice(0,8)}));
  return json({configured:!!key,jobs:jobs.map(publicJob),images});
}

async function postVisuals(request:Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to generate visuals.",401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return problem("Open Studio directly to generate visuals.",403);
  let input:Record<string,unknown>;
  try { input=JSON.parse(await readBoundedText(request,8000)); } catch { return problem("Check the visual request.",400); }
  if (!input||!visualId(input.song)) return problem("Choose a song first.",400);
  const song=await ownedSong(access.id,input.song);
  if (!song) return problem("Song not found in your library.",404);
  const bucket=env.BUCKET;
  if (!bucket) return problem("Private visual storage is unavailable.",503);
  const key=await resolveElevenLabsKey(access.id);
  if (!key) return problem("Connect your own ElevenLabs key in Settings first. Visual generation needs Pro or higher and Image & Video (Flows) permission.",409);
  if(input.action==="check") return json(await visualPlan(key));
  if(!visualRequestId(input.id))return problem("Use a valid generation request ID.",400);
  const recordKey=jobKey(access.id,song.id,input.id), record=await bucket.get(recordKey);
  if(input.action==="create") {
    const mode=input.mode as VisualMode;
    if(!["image","animate","video"].includes(mode)||typeof input.prompt!=="string"||!input.prompt.trim()||input.prompt.length>1500||hasExplicitWords(input.prompt)||!["vertical","wide","square"].includes(String(input.format)))return problem("Describe a positive visual in up to 1,500 characters and choose a video shape.",400);
    if(input.billingConsent!==true||input.rightsConsent!==true)return problem("Confirm provider billing and permission to use your prompt and image before generating.",400);
    if(!visualId(input.source)||input.source!==(song.audioId??song.id)&&!song.audioHistory?.some(a=>a.audioId===input.source))return problem("This recording changed. Reopen its video project before generating.",409);
    const reference=mode==="animate"&&visualId(input.reference)?input.reference:undefined;
    if(mode==="animate"&&!reference)return problem("Choose one of this song’s uploaded or generated images to animate.",400);
    if(record) {
      const job=JSON.parse(await record.text()) as StoredJob;
      if(job.mode!==mode||job.prompt!==input.prompt.trim()||job.source!==input.source||job.format!==input.format||job.reference!==reference)return problem("This request ID already belongs to another generation. Refresh the library.",409);
      return json({job:publicJob(job)}); // Never send a billable request twice.
    }
    const existing=await listJobs(access.id,song.id);
    if(existing.full||existing.jobs.length>=100)return problem("This song has reached its 100-generation history limit. Reuse saved visuals or choose another project.",409);
    if(existing.jobs.filter(j=>visualActive(j)||j.status==="unknown").length>=3)return problem("Finish or recover the active visual jobs before starting another.",409);
    const plan=await visualPlan(key);
    if(plan.eligible===false)return problem("Your ElevenLabs workspace needs Pro or higher for its Image & Video API. Your music connection is unchanged.",402);
    let frame:{content_base64:string;mime_type:string}|undefined;
    if(reference) {
      const asset=await bucket.get(prefix(access.id,song.id)+reference), mime=asset?.httpMetadata?.contentType??"";
      if(!asset||asset.customMetadata?.kind!=="background"||!["image/png","image/jpeg","image/webp"].includes(mime)||asset.size>15*1024*1024)return problem("Choose an owned JPG, PNG or WebP image up to 15 MB.",400);
      const bytes=new Uint8Array(await asset.arrayBuffer());
      if(!visualSignature(bytes,mime))return problem("This reference is not a readable image file. Upload a new PNG, JPG or WebP.",400);
      let binary="";
      for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
      frame={content_base64:btoa(binary),mime_type:mime};
    }
    const job:StoredJob={id:input.id,song:song.id,source:input.source,mode,prompt:input.prompt.trim(),format:input.format as VisualJob['format'],createdAt:new Date().toISOString(),status:"submitting",reference,touchedAt:Date.now()};
    // This immutable receipt must exist before the paid POST. Ambiguous outcomes require recovery, never automatic resubmission.
    const claim=await bucket.put(recordKey,JSON.stringify(job),{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"application/json"}});
    if(!claim)return problem("This generation was already submitted. Refresh its status.",409);
    try {
      const response=await visualProvider(key,mode==="image"?"image":"video",undefined,visualPayload(mode,job.prompt,job.format,frame));
      if(!response.ok) {
        const status=response.status;await response.body?.cancel();
        job.status=[400,401,402,403,404,422,429].includes(status)?"failed":"unknown";job.error=visualFailure(status);
      } else {
        const body=await visualJson(response);
        if(!visualId(body.id)||body.status!=="pending")throw new Error("Unknown provider receipt");
        job.providerId=body.id;job.status="pending";
      }
    } catch {job.status="unknown";job.error="The provider may have accepted the request. Check ElevenLabs Image & Video history, then recover its generation ID here. Studio will not submit it again automatically.";}
    await bucket.put(recordKey,JSON.stringify(job),{onlyIf:{etagMatches:claim.etag},httpMetadata:{contentType:"application/json"}});
    return json({job:publicJob(job)});
  }
  if(!record)return problem("This generation is not in your private library.",404);
  let job=JSON.parse(await record.text()) as StoredJob;
  if(input.action!=="refresh"&&input.action!=="recover")return problem("Choose a supported visual action.",400);
  if(job.status==="ready"||job.status==="failed")return json({job:publicJob(job)});
  if(job.status==="submitting"&&Date.now()-(job.touchedAt??0)<90000)return json({job:publicJob(job)});
  if(job.status==="importing"&&Date.now()-(job.touchedAt??0)<90000)return json({job:publicJob(job)});
  if(input.action==="recover") {
    if(!["unknown","submitting"].includes(job.status)||!visualId(input.providerId))return problem("Paste the generation ID from your own ElevenLabs history for this unresolved request.",400);
    job.providerId=input.providerId;
  }
  if(!job.providerId) {
    job={...job,status:"unknown",error:"No provider receipt was saved. Check ElevenLabs Image & Video history before generating again; paste its generation ID to recover without another charge."};
    await bucket.put(recordKey,JSON.stringify(job),{onlyIf:{etagMatches:record.etag}});
    return json({job:publicJob(job)});
  }
  const response=await visualProvider(key,job.mode==="image"?"image":"video",job.providerId);
  if(!response.ok){const status=response.status;await response.body?.cancel();return problem(visualFailure(status),502);}
  const body=await visualJson(response);
  if(body.id!==job.providerId)return problem("The provider returned a different generation. Retry checking status.",502);
  if(body.status==="failed")job={...job,status:"failed",error:body.failure_reason==="moderated"?"The provider declined this visual under its content rules. Revise the prompt before starting another generation.":"ElevenLabs could not finish this visual. Check provider history and billing before starting another generation."};
  else if(body.status==="pending"||body.status==="generating")job={...job,status:body.status,error:undefined};
  else if(body.status==="completed") {
    const mime=typeof body.content_mime_type==="string"?body.content_mime_type:"",url=visualDownloadUrl(body.content_url);
    if(!url||!(job.mode==="image"?["image/png","image/jpeg","image/webp"]:["video/mp4"]).includes(mime))return problem("The provider returned an unsupported visual format or storage host. Your paid result remains in ElevenLabs; contact support or download and upload it manually.",502);
    const lock=await bucket.put(recordKey,JSON.stringify({...job,status:"importing",touchedAt:Date.now()}),{onlyIf:{etagMatches:record.etag}});
    if(!lock)return problem("Another tab is saving this visual. Check again shortly.",409);
    const asset=prefix(access.id,song.id)+job.id,limit=(job.mode==="image"?15:120)*1024*1024;
    try {
      const media=await providerMediaRequest(url);
      const length=Number(media.headers.get("Content-Length"));
      if(!media.ok||!media.body||!Number.isSafeInteger(length)||length<1||length>limit){await media.body?.cancel();throw new Error();}
      // R2 requires a known-length stream. This also rejects truncated or oversized provider bodies.
      const stream=new FixedLengthStream(length);
      let size=0,header=new Uint8Array();
      const bounded=new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){size+=chunk.length;if(size>limit)throw new Error("Media too large");if(header.length<32){const next=new Uint8Array(Math.min(32,header.length+chunk.length));next.set(header);next.set(chunk.subarray(0,next.length-header.length),header.length);header=next;}controller.enqueue(chunk);}});
      // Stream the short clip into R2: never materialize 120 MB inside a Worker.
      const pipe=media.body.pipeThrough(bounded).pipeTo(stream.writable);
      await Promise.all([pipe,bucket.put(asset,stream.readable,{httpMetadata:{contentType:mime},customMetadata:{song:song.id,kind:job.mode==="image"?"background":"sourceVideo",source:job.source,createdAt:job.createdAt,generation:job.id}})]);
      if(!size||!visualSignature(header,mime)){await bucket.delete(asset);throw new Error();}
      // Recheck deletion/ownership after a long provider download; never resurrect removed project data.
      if(!await ownedSong(access.id,song.id)){await bucket.delete(asset);throw new Error();}
      job={...job,status:"ready",asset:job.id,mime,error:undefined};
    } catch {
      await bucket.delete(asset).catch(()=>{});
      job={...job,status:"pending",error:"Your visual was generated, but its private copy could not finish. Check again to retry the download without paying for another generation."};
    }
    await bucket.put(recordKey,JSON.stringify(job),{onlyIf:{etagMatches:lock.etag},httpMetadata:{contentType:"application/json"}});
    return json({job:publicJob(job)});
  } else return problem("The provider returned an unknown job state. Check again later.",502);
  await bucket.put(recordKey,JSON.stringify(job),{onlyIf:{etagMatches:record.etag},httpMetadata:{contentType:"application/json"}});
  return json({job:publicJob(job)});
}

export const GET=recoverableRoute(getVisuals,"The visual library could not open. Your saved song is unchanged.");
export const POST=recoverableRoute(postVisuals,"The visual request could not finish. Refresh its saved status before generating again.");
