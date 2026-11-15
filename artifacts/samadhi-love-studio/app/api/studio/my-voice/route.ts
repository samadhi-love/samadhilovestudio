import { env } from "cloudflare:workers";
import { privateWorkspace } from "../../../studio-access";
import { hasExplicitWords } from "../../../clean-content";
import { uuid, validSession } from "../../../vocal/session";
import { voiceMimeTypes } from "../../../my-voice-data";
import { privateHeaders } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";
export const dynamic = "force-dynamic";
const problem=(error:string,status:number)=>Response.json({error},{status,headers:privateHeaders});
async function handle(request:Request){
  const access=await privateWorkspace();if(!access)return problem("Sign in to your private voice collection.",401);
  const bucket=env.BUCKET;if(!bucket)return problem("Private voice storage is unavailable.",503);
  const url=new URL(request.url),id=url.searchParams.get("id"),prefix=`my-voice/v1/${encodeURIComponent(access.id)}/`;
  if(id!==null&&!uuid(id))return problem("Choose a saved voice recording.",400);
  if(request.method==="GET"){
    if(id){const file=await bucket.get(prefix+id);return file?new Response(file.body,{headers:{...privateHeaders,"Content-Type":file.httpMetadata?.contentType??"application/octet-stream","X-Content-Type-Options":"nosniff"}}):problem("Voice recording not found.",404);}
    const cursor=url.searchParams.get("cursor");if(cursor&&cursor.length>2048)return problem("Invalid voice page.",400);
    const options:R2ListOptions & {include:string[]}={prefix,include:["customMetadata","httpMetadata"],limit:100,...(cursor?{cursor}:{})};
    const page=await bucket.list(options);
    return Response.json({voices:page.objects.map(file=>({id:file.key.slice(prefix.length),name:file.customMetadata?.name??"Saved voice",duration:Number(file.customMetadata?.duration??0),mime:file.httpMetadata?.contentType??"application/octet-stream",createdAt:file.uploaded.toISOString()})),next:page.truncated?page.cursor:null},{headers:privateHeaders});
  }
  if(request.headers.get("origin")!==url.origin)return problem("Open Studio directly to save a voice.",403);
  const raw=await readBoundedText(request,8000);if(raw.length>2000)return problem("Keep the recording name short.",413);
  let input:{sessionId?:string;sourceId?:string;name?:string;mime?:string;permission?:boolean};try{input=JSON.parse(raw);}catch{return problem("Invalid voice request.",400);}
  if(!input||!uuid(input.sessionId)||!uuid(input.sourceId)||typeof input.name!=="string"||!input.name.trim()||input.name.length>100||hasExplicitWords(input.name)||input.permission!==true)return problem("Choose an original take, name it, and confirm performer permission.",400);
  const sessionFile=await bucket.get(`vocal-studio/v1/${encodeURIComponent(access.id)}/sessions/${input.sessionId}`);
  const session=sessionFile?await sessionFile.json():null;
  if(!validSession(session))return problem("Save the vocal session to your account first.",409);
  const source=session.sources.find(s=>s.id===input.sourceId);if(!source)return problem("That take is not in this saved session.",404);
  const original=await bucket.get(`vocal-studio/v1/${encodeURIComponent(access.id)}/recordings/${input.sessionId}/${input.sourceId}`);if(!original)return problem("Original recording not found.",404);
  // Independent immutable copy: future session changes do not remove the reusable take.
  const voiceId=crypto.randomUUID(),mime=typeof input.mime==="string"&&voiceMimeTypes.includes(input.mime.split(";")[0])?input.mime.split(";")[0]:"application/octet-stream";
  const copied=await bucket.put(prefix+voiceId,original.body,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:mime},customMetadata:{name:input.name.trim(),duration:String(source.duration),sessionId:input.sessionId,sourceId:input.sourceId,permissionConfirmedAt:new Date().toISOString()}});
  if(!copied)return problem("The independent voice copy could not save. Retry; the original session is preserved.",409);
  return Response.json({voice:{id:voiceId,name:input.name.trim(),duration:source.duration,mime,createdAt:new Date().toISOString()}},{headers:privateHeaders});
}
const route=recoverableRoute(handle,"Your voice recording could not save or load. Existing originals are preserved.");
export const GET=route;export const POST=route;
