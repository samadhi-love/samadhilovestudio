import {serverStorage as env} from "./storage";
import {revokeSongShare} from "../song-sharing";
import type {Studio} from "../studio-data";
type Effect={id:string;songId:string;deleted:boolean};
type WithEffects=Studio&{_saveEffects?:Effect[]};
export function privacyEffects(previous:Studio|null,next:Studio){
  const old=new Map(previous?.songs.map(s=>[s.id,s]));
  const prior=(previous as WithEffects|null)?._saveEffects??[];
  return [...prior,...next.songs.flatMap(song=>{
    const was=old.get(song.id);
    return was&&!!was.deletedAt!==!!song.deletedAt?[{id:crypto.randomUUID(),songId:song.id,deleted:!!song.deletedAt}]:[];
  })];
}
export async function finishPrivacyEffects(owner:string,committed:Studio|null){
  let pending=0;
  for(const effect of (committed as WithEffects|null)?._saveEffects??[]){
    const receipt=`private/save-effects/${encodeURIComponent(owner)}/${effect.id}.json`;
    try{
      if(!env.BUCKET)throw new Error("Private cleanup receipts unavailable.");
      if(await env.BUCKET.head(receipt))continue;
      const song=committed?.songs.find(s=>s.id===effect.songId);
      if(song&&!!song.deletedAt===effect.deleted){
        await revokeSongShare(owner,effect.songId);
        if(!env.DB)throw new Error("Sharing cleanup unavailable.");
        await env.DB.prepare("UPDATE community_releases SET listed=0 WHERE owner=? AND song_id=?").bind(owner,effect.songId).run();
      }
      await env.BUCKET.put(receipt,JSON.stringify({done:true,at:new Date().toISOString()}),{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"application/json"}});
    }catch{
      pending++;
      console.error("Committed workspace privacy cleanup pending",{requestId:effect.id,at:new Date().toISOString()});
    }
  }
  return pending;
}
