import { serverStorage as env } from "../../../server/storage";
import { privateWorkspace } from "../../../studio-access";
import { hasExplicitWords } from "../../../clean-content";
import { uuid, validSession } from "../../../vocal/session";
import { consentPhrase, detectVoiceMime, verifiedVoiceLimit, verifiedVoiceRules as rules, voiceMimeTypes } from "../../../my-voice-data";
import { privateHeaders } from "../store";
import { readBoundedText, recoverableRoute, RequestBodyError } from "../request-errors";
import { logEvent, traced } from "../../../server/request-context";
import { consentMatches, hearConsent } from "../../../server/consent-check";
import { resolveElevenLabsKey } from "../elevenlabs/vault";
import { falKey } from "../../../server/music-engine";
export const dynamic = "force-dynamic";
const problem=(error:string,status:number)=>Response.json({error},{status,headers:privateHeaders});
const consentKey=(account:string,id:string)=>`my-voice-consent/v1/${encodeURIComponent(account)}/${id}`;
/** Read a multipart body without ever holding more than the limit in memory. */
async function boundedForm(request:Request,limit:number){
  if(Number(request.headers.get("Content-Length"))>limit)throw new RequestBodyError("Keep each voice under 25 MB and the consent clip under 4 MB.",413);
  const reader=request.body?.getReader();if(!reader)throw new RequestBodyError("Record or choose your voice first.",400);
  const chunks:Uint8Array[]=[];let length=0;
  try{for(;;){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>limit){await reader.cancel();throw new RequestBodyError("Keep each voice under 25 MB and the consent clip under 4 MB.",413);}chunks.push(part.value);}}
  finally{reader.releaseLock();}
  const body=new Uint8Array(length);let at=0;for(const chunk of chunks){body.set(chunk,at);at+=chunk.length;}
  try{return await new Request(request.url,{method:"POST",headers:{"Content-Type":request.headers.get("Content-Type")??""},body}).formData();}
  catch{throw new RequestBodyError("The voice could not be read. Try again.",400);}
}
async function verifiedCount(bucket:R2Bucket,prefix:string){
  let count=0,cursor:string|undefined;
  do{const page=await bucket.list({prefix,include:["customMetadata"],limit:100,...(cursor?{cursor}:{})} as R2ListOptions);count+=page.objects.filter(o=>o.customMetadata?.verified==="1").length;cursor=page.truncated?page.cursor:undefined;}while(cursor);
  return count;
}
const text=(form:FormData,key:string)=>{const v=form.get(key);return typeof v==="string"?v.trim():"";};
async function audio(form:FormData,key:string,maxBytes:number){
  const file=form.get(key);if(!file||typeof file==="string"||!file.size||file.size>maxBytes)return null;
  // The file's own bytes decide, never its label: a renamed text file is not audio.
  const bytes=new Uint8Array(await file.arrayBuffer()),mime=detectVoiceMime(bytes.subarray(0,16));
  return mime==="application/octet-stream"?null:{bytes,mime};
}
/** A verified voice: the person's own adult voice, with their spoken consent kept beside it. */
async function saveVerified(request:Request,bucket:R2Bucket,account:string,prefix:string){
  const form=await boundedForm(request,rules.voiceBytes+rules.consentBytes+64*1024);
  const name=text(form,"name"),speaker=text(form,"speaker");
  const voiceSeconds=Number(text(form,"voiceDuration")),consentSeconds=Number(text(form,"consentDuration"));
  if(!name||!speaker||name.length>rules.nameMax||speaker.length>rules.nameMax||hasExplicitWords(name)||hasExplicitWords(speaker))return problem("Give the voice a short name and say whose voice it is.",400);
  if(text(form,"ownVoice")!=="true"||text(form,"adult")!=="true")return problem("Only your own voice, as an adult (18 or older), can be saved. Children's voices can't be saved.",400);
  if(text(form,"consentText")!==consentPhrase(speaker))return problem("Read the consent sentence shown on screen, then save again.",400);
  if(!(voiceSeconds>=rules.voiceMin&&voiceSeconds<=rules.voiceMax))return problem("Your voice recording should be between 10 seconds and 10 minutes.",400);
  if(!(consentSeconds>=rules.consentMin&&consentSeconds<=rules.consentMax))return problem("Record the consent sentence in your own voice (a few seconds).",400);
  const voice=await audio(form,"voice",rules.voiceBytes),consent=await audio(form,"consent",rules.consentBytes);
  if(!voice||!consent)return problem("Both recordings must be real audio: your voice and your spoken consent.",400);
  if(await verifiedCount(bucket,prefix)>=verifiedVoiceLimit)return problem(`You already have ${verifiedVoiceLimit} verified voices. Delete one to add another.`,409);
  // Listen to the consent clip: the person must really say the sentence on screen.
  const heard=await hearConsent(consent.bytes,consent.mime,{elevenLabs:await resolveElevenLabsKey(account).catch(()=>null),fal:falKey()});
  let consentHeard="not-checked",heardBy="";
  if("text" in heard){
    const check=consentMatches(heard.text,consentPhrase(speaker));
    logEvent("my-voice.consent-check",{engine:heard.engine,matched:check.matched,score:check.score,missing:check.missing.join("|")});
    if(!check.matched){
      const said=heard.text.trim().replace(/\s+/g," ").slice(0,160);
      return problem(`Your consent clip didn't match the sentence on screen${said?` (we heard: “${said}”)`:" (we heard no words)"}${check.missing.length?`. Be sure to say “${check.missing.join("”, “")}”`:""}. Read the sentence exactly as shown, record it again, then save. Nothing was saved.`,422);
    }
    consentHeard="matched";heardBy=heard.engine;
  }else logEvent("my-voice.consent-check",{engine:"none",matched:false,unavailable:heard.unavailable});
  const id=crypto.randomUUID(),at=new Date().toISOString();
  const kept=await bucket.put(consentKey(account,id),consent.bytes,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:consent.mime},customMetadata:{speaker,consentText:consentPhrase(speaker),recordedAt:at,duration:String(consentSeconds),consentHeard,...(heardBy?{heardBy}:{})}});
  if(!kept)return problem("Your consent clip could not be kept, so nothing was saved. Try again.",409);
  const saved=await bucket.put(prefix+id,voice.bytes,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:voice.mime},customMetadata:{name,speaker,duration:String(Math.round(voiceSeconds*10)/10),verified:"1",consentAt:at,adultConfirmed:"1",ownVoiceConfirmed:"1",consentHeard}});
  if(!saved){await bucket.delete(consentKey(account,id));return problem("Your voice could not save. Nothing was kept; try again.",409);}
  // Two saves at once must not pass the limit: the later one steps back.
  if(await verifiedCount(bucket,prefix)>verifiedVoiceLimit){await bucket.delete([prefix+id,consentKey(account,id)]);return problem(`You already have ${verifiedVoiceLimit} verified voices. Delete one to add another.`,409);}
  return Response.json({voice:{id,name,speaker,duration:Math.round(voiceSeconds*10)/10,mime:voice.mime,createdAt:at,verified:true,consentHeard:consentHeard==="matched"}},{headers:privateHeaders});
}
async function handle(request:Request){
  const access=await privateWorkspace();if(!access)return problem("Sign in to your private voice collection.",401);
  const bucket=env.BUCKET;if(!bucket)return problem("Private voice storage is unavailable.",503);
  const url=new URL(request.url),id=url.searchParams.get("id"),prefix=`my-voice/v1/${encodeURIComponent(access.id)}/`;
  if(id!==null&&!uuid(id))return problem("Choose a saved voice recording.",400);
  const consentId=url.searchParams.get("consent");
  if(request.method==="GET"&&consentId!==null){
    if(!uuid(consentId))return problem("Choose a saved voice.",400);
    const clip=await bucket.get(consentKey(access.id,consentId));
    return clip?new Response(clip.body,{headers:{...privateHeaders,"Content-Type":clip.httpMetadata?.contentType??"application/octet-stream","X-Content-Type-Options":"nosniff"}}):problem("Consent clip not found.",404);
  }
  if(request.method==="GET"){
    if(id){const file=await bucket.get(prefix+id);return file?new Response(file.body,{headers:{...privateHeaders,"Content-Type":file.httpMetadata?.contentType??"application/octet-stream","X-Content-Type-Options":"nosniff"}}):problem("Voice recording not found.",404);}
    const cursor=url.searchParams.get("cursor");if(cursor&&cursor.length>2048)return problem("Invalid voice page.",400);
    const options:R2ListOptions & {include:string[]}={prefix,include:["customMetadata","httpMetadata"],limit:100,...(cursor?{cursor}:{})};
    const page=await bucket.list(options);
    return Response.json({voices:page.objects.map(file=>({id:file.key.slice(prefix.length),name:file.customMetadata?.name??"Saved voice",duration:Number(file.customMetadata?.duration??0),mime:file.httpMetadata?.contentType??"application/octet-stream",createdAt:file.uploaded.toISOString(),verified:file.customMetadata?.verified==="1",...(file.customMetadata?.consentHeard==="matched"?{consentHeard:true}:{}),...(file.customMetadata?.speaker?{speaker:file.customMetadata.speaker}:{})})),next:page.truncated?page.cursor:null},{headers:privateHeaders});
  }
  if(request.headers.get("origin")!==url.origin)return problem("Open Studio directly to save a voice.",403);
  if(request.method==="DELETE"){
    if(!id)return problem("Choose a saved voice to delete.",400);
    await bucket.delete([prefix+id,consentKey(access.id,id)]);
    return Response.json({deleted:id},{headers:privateHeaders});
  }
  if(request.headers.get("Content-Type")?.includes("multipart/form-data"))return saveVerified(request,bucket,access.id,prefix);
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
export const GET=traced(route);export const POST=traced(route);export const DELETE=traced(route);
