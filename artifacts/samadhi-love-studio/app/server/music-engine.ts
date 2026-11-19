import {serverStorage as env} from "./storage";
import type {MusicEngine,MusicEngineStatus} from "../music-engine-data";
const preferenceKey=(owner:string)=>`private/music-engine/${encodeURIComponent(owner)}.json`;
// Secret names are case-sensitive; accept common spellings so a lowercase Replit Secret still works.
export function falKey(){const e=env as Cloudflare.Env&Record<string,string|undefined>;return (e.FAL_KEY??e.Fal_key??e.Fal_Key??e.fal_key??e["FAL-KEY"]??e["fal-key"])?.trim()??"";}
export async function musicEngineStatus(access:{id:string;role:string}):Promise<MusicEngineStatus>{
  if(access.role!=="owner")return {owner:false,preferred:"elevenlabs",engine:"elevenlabs",configured:false,notice:""};
  const saved=await env.BUCKET?.get(preferenceKey(access.id));
  const value=saved?await saved.json<{engine?:unknown}>():null;
  const preferred:MusicEngine=value?.engine==="elevenlabs"?"elevenlabs":"ace-step";
  const configured=!!falKey();
  const engine=preferred==="ace-step"&&configured?"ace-step":"elevenlabs";
  return {owner:true,preferred,engine,configured,notice:preferred==="ace-step"&&!configured?"ACE-Step is not connected yet. Using your ElevenLabs connection instead.":""};
}
export async function saveMusicEngine(owner:string,engine:MusicEngine){
  if(!env.BUCKET)throw new Error("Private settings storage is unavailable.");
  const saved=await env.BUCKET.put(preferenceKey(owner),JSON.stringify({engine}),{httpMetadata:{contentType:"application/json"}});
  if(!saved)throw new Error("Engine preference could not be saved.");
}
