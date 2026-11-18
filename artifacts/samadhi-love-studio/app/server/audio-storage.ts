import {serverStorage as env} from "./storage";
import {audioKey} from "../api/studio/store";
import {preservePaidSong} from "./song-recovery";
import type {Song} from "../studio-data";

/** Retries only replayable bytes at a unique storage key; never calls AI. */
export async function storePaidAudio(owner:string,song:Song,audio:ArrayBuffer,wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms))){
  const bucket=env.BUCKET;
  if(!bucket)throw new Error("Private recording storage is unavailable.");
  const put=async(candidate:Song,attempts:number)=>{
    const key=audioKey(owner,candidate.audioId??candidate.id);
    for(let attempt=0;attempt<attempts;attempt++){
      try{
        await bucket.put(key,audio,{httpMetadata:{contentType:"audio/mpeg"},customMetadata:{
          recoverable:"1",songId:candidate.id,audioId:candidate.audioId??candidate.id,
          audioFormat:"mp3",title:candidate.name,createdAt:candidate.updatedAt??new Date().toISOString(),
        }});
        return true;
      }catch{
        // A timed-out storage response may still have committed. No provider
        // request or credit reservation is repeated here.
        try{if((await bucket.head(key))?.size===audio.byteLength)return true;}catch{/* Metadata still indexes ambiguous writes for later recovery. */}
        if(attempt+1<attempts)await wait((attempt+1)*300);
      }
    }
    return false;
  };
  try{await preservePaidSong(owner,song);}catch{/* The audio metadata is a second independent recovery index. */}
  if(await put(song,3))return song;
  const audioId=crypto.randomUUID();
  const fallback={...song,audioId,...(song.generation?{generation:{...song.generation,audioId}}:{})};
  if(await put(fallback,1)){
    try{await preservePaidSong(owner,fallback);}catch{/* Recovery also discovers this private object by its metadata. */}
    return fallback;
  }
  throw new Error("ElevenLabs returned your recording, but it could not be stored. Check ElevenLabs history before generating again; Recover unfinished songs can find any copy that reached storage.");
}
