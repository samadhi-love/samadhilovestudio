import type { Song } from "./studio-data";

export type SongSort="newest"|"oldest"|"liked";
export function songCreatedTime(song:Song){for(const date of [song.createdAt,song.generation?.createdAt]){const time=date?Date.parse(date):NaN;if(Number.isFinite(time))return time;}return null;}
export function sortSongs(songs:Song[],sort:SongSort="newest"){
 return songs.map((song,index)=>({song,index,time:songCreatedTime(song)})).filter(v=>sort!=="liked"||v.song.favorite).sort((a,b)=>{
   if(a.time===null&&b.time===null)return a.index-b.index;
   if(a.time===null)return 1;if(b.time===null)return -1;
   return (sort==="oldest"?a.time-b.time:b.time-a.time)||a.index-b.index;
 }).map(v=>v.song);
}
export function songStatus(song:Song){return song.generation?.status==="generating"?"Preparing":song.generation?.status==="incomplete"?"Needs attention":song.audioFormat?"Ready":"Writing draft";}

/** Server-owned creation time is immutable; legacy dates remain unknown unless provenance supplies one. */
export function stampSong(song:Song,previous?:Song,now=new Date().toISOString()):Song{
 const createdAt=previous?[previous.createdAt,previous.generation?.createdAt].find(d=>!!d&&Number.isFinite(Date.parse(d))):now;
 const clean=(s:Song)=>({...s,createdAt:undefined,updatedAt:undefined});
 const changed=!previous||JSON.stringify(clean(song))!==JSON.stringify(clean(previous));
 return {...song,createdAt,updatedAt:changed?now:previous?.updatedAt};
}
/** A duplicate is an independent writing project, never a falsely copied audio/source reference. */
export function duplicateSongDetails(song:Song,id:string):Song{
 return {...song,id,name:(song.name.slice(0,88)+" · Copy").slice(0,100),example:false,creationDraft:true,stage:"Writing",createdAt:undefined,updatedAt:undefined,
   audioFormat:undefined,audioId:undefined,audioHistory:undefined,generation:undefined,lyricVideo:undefined,projectId:undefined,sourceSessionId:undefined,
   master:undefined,coverAsset:undefined,logoAsset:undefined,deletedAt:undefined,deleteAfter:undefined,favorite:false,mixes:[],preferred:"",done:song.done.map(()=>false),releaseDate:"",releaseLinks:undefined,
   notes:{...song.notes},tags:[...song.tags],versions:structuredClone(song.versions)};
}
