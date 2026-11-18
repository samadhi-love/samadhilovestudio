import {serverStorage as env} from "./storage";
import {readStudio,writeStudio,audioKey} from "../api/studio/store";
import {emptyCreatorStudio,freshSong,type Song} from "../studio-data";
const prefix=(owner:string)=>`private/recovery/audio/${encodeURIComponent(owner)}/`;
type Receipt={version:1;song:Song;audioKey:string;done?:boolean};
export async function preservePaidSong(owner:string,song:Song){
  if(!env.BUCKET)throw new Error("Private recovery storage is unavailable.");
  const key=prefix(owner)+song.id+".json";
  const receipt:Receipt={version:1,song,audioKey:audioKey(owner,song.audioId??song.id)};
  await env.BUCKET.put(key,JSON.stringify(receipt),{httpMetadata:{contentType:"application/json"}});
  return key;
}
export async function recoverPaidSongs(owner:string){
  const bucket=env.BUCKET;
  if(!bucket)throw new Error("Private recovery storage is unavailable.");
  // The audio object's metadata is the second recovery index if a separate
  // receipt could not be written. It contains no lyrics or provider keys.
  let mediaCursor:string|undefined;
  do{
    const media=await bucket.list({prefix:`songs/${encodeURIComponent(owner)}/`,limit:100,cursor:mediaCursor,include:["customMetadata"]} as R2ListOptions);
    for(const item of media.objects){
      const metadata=item.customMetadata;
      if(metadata?.recoverable!=="1"||!metadata.songId||item.key!==audioKey(owner,metadata.songId))continue;
      if(await bucket.head(prefix(owner)+metadata.songId+".json"))continue;
      const song={...freshSong(metadata.songId,metadata.title||"Recovered song",0),audioFormat:"mp3" as const,creationDraft:false};
      await preservePaidSong(owner,song);
    }
    mediaCursor=media.truncated?media.cursor:undefined;
  }while(mediaCursor);
  let cursor:string|undefined,recovered=0,pending=0;
  do{
    const page=await bucket.list({prefix:prefix(owner),limit:100,cursor});
    for(const item of page.objects){
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
        const restored=existing?{...existing,audioFormat:song.audioFormat,audioId:song.audioId,generation:song.generation,creationDraft:false,updatedAt:new Date().toISOString()}:song;
        const next={...data,songs:existing?data.songs.map(s=>s.id===song.id?restored:s):[restored,...data.songs]};
        if(await writeStudio(owner,current.revision,JSON.stringify(next))){attached=true;recovered++;}
      }
      if(attached)await bucket.put(item.key,JSON.stringify({...receipt,done:true}),{onlyIf:{etagMatches:record.etag},httpMetadata:{contentType:"application/json"}});
      else pending++;
    }
    cursor=page.truncated?page.cursor:undefined;
  }while(cursor);
  return {recovered,pending};
}
