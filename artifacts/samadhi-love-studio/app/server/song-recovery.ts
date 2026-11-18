import {serverStorage as env} from "./storage";
import {readStudio,writeStudio,audioKey} from "../api/studio/store";
import {emptyCreatorStudio,freshSong,type Song} from "../studio-data";
const prefix=(owner:string)=>`private/recovery/audio/${encodeURIComponent(owner)}/`;
type Receipt={version:1;song:Song;audioKey:string;done?:boolean};
const receiptMetadata=(receipt:Receipt)=>({songId:receipt.song.id,audioId:receipt.song.audioId??receipt.song.id,done:receipt.done?"1":"0"});
export async function preservePaidSong(owner:string,song:Song){
  if(!env.BUCKET)throw new Error("Private recovery storage is unavailable.");
  const key=prefix(owner)+song.id+".json";
  const receipt:Receipt={version:1,song,audioKey:audioKey(owner,song.audioId??song.id)};
  await env.BUCKET.put(key,JSON.stringify(receipt),{httpMetadata:{contentType:"application/json"},customMetadata:receiptMetadata(receipt)});
  return key;
}
/** Complete only this audio's receipt; never overwrite a newer attempt's index. */
export async function finishPaidSong(owner:string,song:Song,entry?:{receipt:Receipt;etag:string}){
  const bucket=env.BUCKET;
  if(!bucket)throw new Error("Private recovery storage is unavailable.");
  const key=prefix(owner)+song.id+".json";
  if(!entry){
    const record=await bucket.get(key);
    if(!record)return true;
    entry={receipt:await record.json<Receipt>(),etag:record.etag};
  }
  if(entry.receipt.audioKey!==audioKey(owner,song.audioId??song.id))return false;
  if(entry.receipt.done)return true;
  const receipt={...entry.receipt,done:true};
  return await bucket.put(key,JSON.stringify(receipt),{onlyIf:{etagMatches:entry.etag},
    httpMetadata:{contentType:"application/json"},customMetadata:receiptMetadata(receipt)})!==null;
}
export async function recoverPaidSongs(owner:string){
  const bucket=env.BUCKET;
  if(!bucket)throw new Error("Private recovery storage is unavailable.");
  const library=await readStudio(owner);
  const existingSongs=new Map(library.data?.songs.map(song=>[song.id,song]));
  const attachedAudio=new Set<string>();
  const unattachedSongs=new Set<string>();
  for(const song of existingSongs.values()){
    if(song.audioFormat)attachedAudio.add(audioKey(owner,song.audioId??song.id));
    for(const take of song.audioHistory??[])attachedAudio.add(audioKey(owner,take.audioId));
  }
  // Old receipts can be skipped by filename when a playable song has no
  // unmatched audio. Keep different, unattached takes visible as pending;
  // recovery must still never overwrite a newer recording.
  const coveredSong=(id:string)=>{const song=existingSongs.get(id);return !!(song?.deletedAt||song?.audioFormat&&!unattachedSongs.has(id));};
  // The audio object's metadata is the second recovery index if a separate
  // receipt could not be written. It contains no lyrics or provider keys.
  let mediaCursor:string|undefined;
  do{
    // S3-compatible production listings fetch one HEAD per object when metadata
    // is requested. Filter keys first, then inspect only possible orphans.
    const media=await bucket.list({prefix:`songs/${encodeURIComponent(owner)}/`,limit:100,cursor:mediaCursor});
    for(const item of media.objects){
      if(attachedAudio.has(item.key))continue;
      const metadata=(await bucket.head(item.key))?.customMetadata;
      if(metadata?.recoverable!=="1"||!metadata.songId||item.key!==audioKey(owner,metadata.audioId??metadata.songId))continue;
      if(existingSongs.get(metadata.songId)?.deletedAt)continue;
      unattachedSongs.add(metadata.songId);
      const prior=await bucket.get(prefix(owner)+metadata.songId+".json");
      const receipt=prior?await prior.json<Receipt>():undefined;
      if(receipt&&(receipt.done||await bucket.head(receipt.audioKey)))continue;
      const formats=["mp3","wav","m4a","flac","ogg","opus","webm"];
      const song={...(receipt?.song??freshSong(metadata.songId,metadata.title||"Recovered song",0)),
        ...(metadata.audioId&&metadata.audioId!==metadata.songId?{audioId:metadata.audioId}:{}),
        ...(receipt?.song.generation?{generation:{...receipt.song.generation,audioId:metadata.audioId??metadata.songId}}:{}),
        audioFormat:(formats.includes(metadata.audioFormat??"")?metadata.audioFormat:"mp3") as Song["audioFormat"],creationDraft:false};
      await preservePaidSong(owner,song);
    }
    mediaCursor=media.truncated?media.cursor:undefined;
  }while(mediaCursor);
  let cursor:string|undefined,recovered=0,pending=0;
  do{
    const page=await bucket.list({prefix:prefix(owner),limit:100,cursor});
    for(const item of page.objects){
      const songId=item.customMetadata?.songId??(item.key.endsWith(".json")?item.key.slice(prefix(owner).length,-5):"");
      if(item.customMetadata?.done==="1"||coveredSong(songId))continue;
      const record=await bucket.get(item.key);
      if(!record)continue;
      const receipt=await record.json<Receipt>();
      if(receipt.done)continue;
      const song=receipt.song;
      if(!song||receipt.audioKey!==audioKey(owner,song.audioId??song.id)){pending++;continue;}
      const audio=await bucket.head(receipt.audioKey);
      if(!audio){pending++;continue;}
      let attached=false;
      for(let attempt=0;attempt<3&&!attached;attempt++){
        const current=await readStudio(owner),data=current.data??emptyCreatorStudio;
        const existing=data.songs.find(s=>s.id===song.id);
        if(existing?.deletedAt)break;
        if(existing?.audioFormat){
          // Never replace a newer recording or undo a deliberate later edit.
          attached=(existing.audioId??existing.id)===(song.audioId??song.id);
          break;
        }
        const tombstone=await env.DB?.prepare("SELECT song_id FROM song_deletion_jobs WHERE owner=? AND song_id=?").bind(owner,song.id).first();
        if(tombstone)break;
        const restored=existing?{...existing,audioFormat:song.audioFormat,audioId:song.audioId,generation:song.generation??(existing.generation?{...existing.generation,audioId:song.audioId??song.id,status:"complete" as const}:undefined),creationDraft:false,updatedAt:new Date().toISOString()}:song;
        const next={...data,songs:existing?data.songs.map(s=>s.id===song.id?restored:s):[restored,...data.songs]};
        if(await writeStudio(owner,current.revision,JSON.stringify(next))){attached=true;recovered++;}
      }
      if(attached){
        if(!await finishPaidSong(owner,song,{receipt,etag:record.etag}))pending++;
      }
      else pending++;
    }
    cursor=page.truncated?page.cursor:undefined;
  }while(cursor);
  return {recovered,pending};
}
