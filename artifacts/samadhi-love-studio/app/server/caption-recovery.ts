import {serverStorage} from "./storage";
import type {LyricCue} from "../lyric-video-data";
const valid=(v:string)=>/^[\w-]{1,100}$/.test(v);
export function captionRecoveryKey(owner:string,song:string,audio:string){
  if(!valid(song)||!valid(audio))throw new Error("Invalid recording reference.");
  return `caption-recovery/${encodeURIComponent(owner)}/${song}/${audio}.json`;
}
export type CaptionRecovery={cues:LyricCue[];engine?:string;warnings?:string[];window?:{start:number;end:number};at?:string};
export async function saveCaptionRecovery(owner:string,song:string,audio:string,result:CaptionRecovery){
  if(!serverStorage.BUCKET)throw new Error("Private caption recovery storage is unavailable.");
  await serverStorage.BUCKET.put(captionRecoveryKey(owner,song,audio),JSON.stringify({...result,at:new Date().toISOString()}),{httpMetadata:{contentType:"application/json"}});
}
export async function readCaptionRecovery(owner:string,song:string,audio:string){
  const object=await serverStorage.BUCKET?.get(captionRecoveryKey(owner,song,audio));
  return object?await object.json<CaptionRecovery>():null;
}
