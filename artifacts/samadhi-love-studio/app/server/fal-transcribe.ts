import {falRequest} from "./ai-provider";
import type {HeardWord} from "../lyric-alignment";
export const falTranscribeModel="fal-ai/whisper";
const path="/"+falTranscribeModel;
type Client={request:typeof falRequest;wait:(ms:number)=>Promise<void>;now:()=>number};
const client:Client={request:falRequest,wait:ms=>new Promise(r=>setTimeout(r,ms)),now:()=>Date.now()};
type Chunk={text?:unknown;timestamp?:unknown;start?:unknown;end?:unknown};
export class FalSyncFailed extends Error{constructor(public reason:string,message:string){super(message);}}
/** Word timings from whisper chunks; tolerant of [start,end] or {start,end} shapes. */
export function heardWordsFromChunks(chunks:unknown):HeardWord[]{
  if(!Array.isArray(chunks))return [];
  const words:HeardWord[]=[];
  for(const chunk of chunks.slice(0,30_000) as Chunk[]){
    if(!chunk||typeof chunk.text!=="string")continue;
    const pair=Array.isArray(chunk.timestamp)?chunk.timestamp:[chunk.start,chunk.end];
    const start=Number(pair[0]),end=Number(pair[1]);
    if(!Number.isFinite(start)||start<0)continue;
    for(const [index,part] of chunk.text.trim().split(/\s+/).filter(Boolean).entries()){
      // Rarely a "word" chunk holds several words; spread them across the chunk.
      const count=chunk.text.trim().split(/\s+/).filter(Boolean).length;
      const span=Number.isFinite(end)&&end>start?(end-start)/count:0;
      words.push({text:part,start:start+span*index,...(span?{end:start+span*(index+1)}:{})});
    }
  }
  return words;
}
/** One transcription request for a short-lived private audio link. Polls a bounded time; never resubmits. */
export async function transcribeWithFal(key:string,audioUrl:string,language:string|undefined,api:Client=client,maxWaitMs=4*60_000){
  const body={audio_url:audioUrl,task:"transcribe",chunk_level:"word",...(language&&language!=="auto"?{language}:{})};
  let response:Response;
  try{response=await api.request(key,path,{method:"POST",body:JSON.stringify(body),signal:AbortSignal.timeout(30_000)});}
  catch{throw new FalSyncFailed("submit-network","fal.ai could not be reached for word timing.");}
  if(!response.ok)throw new FalSyncFailed(`submit-http-${response.status}`,"fal.ai did not accept the word-timing request.");
  const queued=await response.json() as {request_id?:string};
  if(!queued.request_id||!/^[\w-]{1,128}$/.test(queued.request_id))throw new FalSyncFailed("submit-no-id","fal.ai returned no request reference.");
  const deadline=api.now()+maxWaitMs;
  for(let polls=0;polls<160&&api.now()<deadline;polls++){
    const status=await api.request(key,`${path}/requests/${queued.request_id}/status`,{signal:AbortSignal.timeout(30_000)});
    if(!status.ok)throw new FalSyncFailed(`status-http-${status.status}`,"Could not check fal.ai word timing.");
    const state=await status.json() as {status?:string};
    if(state.status==="COMPLETED"){
      const output=await api.request(key,`${path}/requests/${queued.request_id}`,{signal:AbortSignal.timeout(30_000)});
      if(!output.ok)throw new FalSyncFailed(`result-http-${output.status}`,"fal.ai finished but the word timing could not be read.");
      const result=await output.json() as {text?:unknown;chunks?:unknown;inferred_languages?:unknown};
      const words=heardWordsFromChunks(result.chunks);
      if(!words.length)throw new FalSyncFailed("no-words","No sung words were heard in this recording.");
      return {words,text:typeof result.text==="string"?result.text:words.map(w=>w.text).join(" "),
        language:Array.isArray(result.inferred_languages)&&typeof result.inferred_languages[0]==="string"?result.inferred_languages[0]:undefined};
    }
    if(state.status!=="IN_QUEUE"&&state.status!=="IN_PROGRESS")throw new FalSyncFailed(`state-${String(state.status).slice(0,20)}`,"fal.ai word timing did not finish.");
    await api.wait(1500);
  }
  throw new FalSyncFailed("timeout","fal.ai word timing took too long.");
}
