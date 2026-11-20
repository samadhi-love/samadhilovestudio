import {falRequest,falMediaRequest} from "./ai-provider";
export const falMusicModel="fal-ai/ace-step-1.5";
const path="/"+falMusicModel;
export class FalRejected extends Error { constructor(public status:number){super("fal.ai rejected this request before accepting a generation.");} }
export type FalInput={prompt:string;lyrics:string;duration:number;vocal_language:string;num_outputs:1|2;thinking:true;enable_safety_checker:true;bpm?:number;lm_negative_prompt?:string;lm_temperature?:number};
export function falSongInput(input:{prompt:string;lyrics:string;voice:string;genres:string;instruments:string;arrangement:string;duration:number;language:string;dialect?:string;instrumental:boolean;versions:1|2;negativeStyle?:string;spark?:number}):FalInput{
  if(input.duration<10||input.duration>360)throw new Error("ACE-Step supports 0:10 to 6:00 here. Using ElevenLabs for shorter songs.");
  if(input.negativeStyle&&input.negativeStyle.length>500)throw new Error("Keep Leave Out to 500 characters or fewer.");
  if(input.spark!==undefined&&(!Number.isFinite(input.spark)||input.spark<0||input.spark>2))throw new Error("Spark must be between 0 and 2.");
  const lyrics=input.instrumental?"[Instrumental]":input.lyrics.replace(/\{[^{}]*\}/g,"").trim();
  if(!input.instrumental&&!lyrics)throw new Error("Add lyrics, or connect ElevenLabs to write them from your description before ACE-Step sings them.");
  if(lyrics.length>4096)throw new Error("These lyrics exceed ACE-Step's 4,096-character limit. Using ElevenLabs without shortening your words.");
  const cues=[...input.lyrics.matchAll(/\{([^{}]*)\}/g)].map(m=>m[1]);
  const style=[input.genres,input.voice,input.instruments,input.prompt].filter(Boolean).join("; ");
  const delivery=/\b(hip[\s-]?hop|rap|trap)\b/i.test(style)?"Rhythmic rapper delivery and genre-matched flow":
    /\bgospel\b/i.test(style)?"Expressive gospel lead and gospel phrasing":
    /\b(r&b|rnb|neo.?soul|soul)\b/i.test(style)?"Soulful R&B vocal phrasing with smooth runs and warm dynamics":
    /\breggae\b/i.test(style)?"Reggae vocal phrasing and relaxed syncopation":
    /\bafrobeats?\b/i.test(style)?"Afrobeats vocal rhythm and melodic phrasing":"Genre-matched vocal phrasing";
  const prompt=[input.instrumental?"Instrumental":delivery,input.dialect&&`Singing dialect: ${input.dialect}`,input.voice,input.genres,input.instruments,input.prompt,...cues,input.arrangement].filter(Boolean);
  const compact=[...new Set(prompt)].join("; ");
  if(compact.length>512)throw new Error("These combined directions exceed ACE-Step's 512-character limit. Using ElevenLabs without dropping your directions.");
  const bpm=Number(/\b(\d{2,3})\s*bpm\b/i.exec(style)?.[1]);
  return {prompt:compact,lyrics,duration:input.duration,vocal_language:input.instrumental?"unknown":input.language,
    num_outputs:input.versions,thinking:true,enable_safety_checker:true,...(bpm>=30&&bpm<=300?{bpm}:{}),
    ...(input.negativeStyle?.trim()?{lm_negative_prompt:input.negativeStyle.trim()}:{}),
    ...(input.spark!==undefined?{lm_temperature:input.spark}:{})};
}
export type FalResult={audio?:{url:string};audios?:{audio:{url:string};seed?:number}[];duration?:number};
export type FalClient={
  request:typeof falRequest;media:typeof falMediaRequest;wait:(ms:number)=>Promise<void>;now:()=>number;
};
const client:FalClient={request:falRequest,media:falMediaRequest,wait:ms=>new Promise(r=>setTimeout(r,ms)),now:()=>Date.now()};
/** Exactly one submission. Only queue reads are safe to retry. */
export async function generateFal(key:string,input:FalInput,accepted:(id:string)=>Promise<void>,api:FalClient=client):Promise<{requestId:string;result:FalResult}>{
  const response=await api.request(key,path,{method:"POST",body:JSON.stringify(input),signal:AbortSignal.timeout(30_000)});
  if(!response.ok){
    if([400,401,403,404,422,429].includes(response.status))throw new FalRejected(response.status);
    throw new Error("ACE-Step did not confirm acceptance. Check fal.ai history before retrying; no backup was started.");
  }
  const queued=await response.json() as {request_id?:string};
  if(!queued.request_id||!/^[\w-]{1,128}$/.test(queued.request_id))throw new Error("ACE-Step did not return a valid request reference. Check fal.ai history; no backup was started.");
  const requestId=queued.request_id;
  await accepted(requestId);
  const deadline=api.now()+12*60_000;
  for(let polls=0;polls<360&&api.now()<deadline;polls++){
    const status=await api.request(key,`${path}/requests/${requestId}/status`,{signal:AbortSignal.timeout(30_000)});
    if(!status.ok)throw new Error("Could not check ACE-Step's saved request. Check fal.ai history; no paid request was replayed.");
    const state=await status.json() as {status?:string};
    if(state.status==="COMPLETED"){
      const output=await api.request(key,`${path}/requests/${requestId}`,{signal:AbortSignal.timeout(30_000)});
      if(!output.ok)throw new Error("ACE-Step finished, but its result could not be read. Check fal.ai history; do not generate it again.");
      return {requestId,result:await output.json() as FalResult};
    }
    if(state.status!=="IN_QUEUE"&&state.status!=="IN_PROGRESS")throw new Error("ACE-Step didn't finish. Your writing is safe. Check fal.ai history before confirming Try again.");
    await api.wait(2000);
  }
  throw new Error("ACE-Step is taking longer than expected. Your request is saved; check fal.ai history before confirming Try again.");
}
export const falLyricModel="fal-ai/any-llm";
const lyricPath="/"+falLyricModel;
/** Plain-text instructions only: never put keys, account data or private notes in this prompt. */
export function falLyricRequest(input:{description:string;singing:string;duration:number;opening?:string;arrangement?:string;voice?:string;genres?:string}){
  const minutes=Math.max(0.5,Math.min(6,input.duration/60));
  const sections=minutes<1.2?"one verse and one chorus":minutes<2.5?"two verses, a chorus after each, and an optional short bridge":
    minutes<4.5?"two or three verses, a repeated chorus and a bridge":"three verses, a repeated chorus, a bridge and a final chorus";
  const system_prompt=["You write original, clean song lyrics for singers.",
    "Return ONLY the lyrics. No title line, no commentary, no notes, no markdown.",
    "Start every section with a heading in square brackets on its own line, such as [Verse 1], [Chorus], [Bridge], [Outro].",
    `Structure: ${sections}. Keep lines short and singable with natural breath spaces.`,
    "Never use profanity, sexual content, graphic violence, hate or degrading language. Do not copy existing songs.",
  ].join("\n");
  const prompt=[input.singing,`Song idea: ${input.description}`,input.genres&&`Genre and mood: ${input.genres}`,input.voice&&`Voice: ${input.voice}`,
    input.opening&&`Opening: ${input.opening}`,input.arrangement&&`Follow this section order and these cues:\n${input.arrangement}`]
    .filter(Boolean).join("\n").slice(0,4000);
  return {prompt,system_prompt};
}
/** Remove anything an assistant adds around the lyrics; keep headings and sung lines only. */
export function cleanFalLyrics(output:string){
  const lines=output.replace(/\r/g,"").replace(/^```[^\n]*\n?|```$/gm,"").split("\n").map(line=>line.replace(/^\*\*(\[.+\])\*\*$/,"$1").trimEnd());
  const first=lines.findIndex(line=>/^\s*\[[^\]]+\]\s*$/.test(line));
  const body=(first>=0?lines.slice(first):lines).join("\n").replace(/\n{3,}/g,"\n\n").trim();
  return body;
}
/** One lyric-writing request; costs about a tenth of a cent, never retried automatically after acceptance. */
export async function writeFalLyrics(key:string,input:Parameters<typeof falLyricRequest>[0],api:FalClient=client){
  const response=await api.request(key,lyricPath,{method:"POST",body:JSON.stringify(falLyricRequest(input)),signal:AbortSignal.timeout(30_000)});
  if(!response.ok)throw new Error("The lyric writer could not start. Try again or add your own lyrics.");
  const queued=await response.json() as {request_id?:string};
  if(!queued.request_id||!/^[\w-]{1,128}$/.test(queued.request_id))throw new Error("The lyric writer did not return a valid reference. Try again or add your own lyrics.");
  const deadline=api.now()+2*60_000;
  for(let polls=0;polls<90&&api.now()<deadline;polls++){
    const status=await api.request(key,`${lyricPath}/requests/${queued.request_id}/status`,{signal:AbortSignal.timeout(30_000)});
    if(!status.ok)throw new Error("Could not check the lyric writer. Try again or add your own lyrics.");
    const state=await status.json() as {status?:string};
    if(state.status==="COMPLETED"){
      const output=await api.request(key,`${lyricPath}/requests/${queued.request_id}`,{signal:AbortSignal.timeout(30_000)});
      if(!output.ok)throw new Error("The lyric writer finished, but its words could not be read. Try again or add your own lyrics.");
      const result=await output.json() as {output?:unknown};
      const lyrics=typeof result.output==="string"?cleanFalLyrics(result.output):"";
      if(!lyrics)throw new Error("The lyric writer returned no words. Try again or add your own lyrics.");
      return lyrics;
    }
    if(state.status!=="IN_QUEUE"&&state.status!=="IN_PROGRESS")throw new Error("The lyric writer didn't finish. Try again or add your own lyrics.");
    await api.wait(1500);
  }
  throw new Error("The lyric writer is taking too long. Try again or add your own lyrics.");
}
export async function downloadFalAudio(url:string,api:FalClient=client){
  const response=await api.media(url);
  const type=response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  const formats:Record<string,string>={"audio/flac":"flac","audio/x-flac":"flac","audio/mpeg":"mp3","audio/wav":"wav","audio/x-wav":"wav"};
  if(!response.ok||!type||!formats[type]||!response.body)throw new Error("ACE-Step's recording could not be downloaded safely. Check fal.ai history.");
  const max=96*1024*1024,reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;
  try{
    while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max)throw new Error("The generated recording exceeds the safe download size.");parts.push(part.value);}
  }finally{await reader.cancel().catch(()=>{});}
  if(size<12)throw new Error("ACE-Step returned an empty recording.");
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
  const valid=formats[type]==="flac"?new TextDecoder().decode(bytes.subarray(0,4))==="fLaC":formats[type]==="wav"?new TextDecoder().decode(bytes.subarray(0,4))==="RIFF":new TextDecoder().decode(bytes.subarray(0,3))==="ID3"||bytes[0]===255;
  if(!valid)throw new Error("ACE-Step returned a file that does not match its audio format.");
  return {audio:bytes.buffer,format:formats[type] as "flac"|"mp3"|"wav"};
}
