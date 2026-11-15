import type {Song,Studio} from "./studio-data";
export const songRecoveryDays=14;
export const songRecoveryMs=songRecoveryDays*24*60*60*1000;
export const deletionNotice="Deleted songs are kept for 14 days so you can restore them. After 14 days, they are automatically permanently deleted to free storage space.";
export function deletionDeadline(song:Pick<Song,"deletedAt"|"deleteAfter">){return song.deletedAt&&song.deleteAfter&&Number.isFinite(Date.parse(song.deleteAfter))?Date.parse(song.deleteAfter):null;}
export function canRestoreSong(song:Pick<Song,"deletedAt"|"deleteAfter">,now=Date.now()){const deadline=deletionDeadline(song);return !!song.deletedAt&&(deadline===null||now<deadline);}
/** The server owns both dates. Existing archives receive a fresh, full recovery window. */
export function normalizeSongDeletion(song:Song,previous:Song|undefined,now=Date.now()):Song {
 if(!song.deletedAt){if(previous?.deletedAt&&!canRestoreSong(previous,now))throw new Error("The 14-day recovery period has ended. This song can no longer be restored.");return {...song,deletedAt:undefined,deleteAfter:undefined};}
 const existing=previous?.deletedAt?deletionDeadline(previous):null;
 return {...song,deletedAt:existing!==null?previous!.deletedAt:new Date(now).toISOString(),deleteAfter:existing!==null?previous!.deleteAfter:new Date(now+songRecoveryMs).toISOString()};
}
export function audioIdsForSong(song:Song){return [...new Set([song.id,song.audioId,...(song.audioHistory??[]).map(a=>a.audioId),song.generation?.audioId].filter((s):s is string=>typeof s==="string"&&/^[\w-]{1,100}$/.test(s)))];}
export function songDependsOn(song:Song,target:Song){const audio=new Set(audioIdsForSong(target));return song.id!==target.id&&(song.master?.songId===target.id||!!song.master?.audioId&&audio.has(song.master.audioId)||song.mixes.some(m=>m.audioSongId===target.id)||song.lyricVideo?.pro?.sourceSongId===target.id||!!song.lyricVideo?.pro?.sourceAudioId&&audio.has(song.lyricVideo.pro.sourceAudioId)||[song.audioId,...(song.audioHistory??[]).map(a=>a.audioId)].some(id=>!!id&&audio.has(id)));}
export function withoutDeletedSongs(data:Studio,ids:Set<string>):Studio {
 return {...data,songs:data.songs.filter(s=>!ids.has(s.id)).map(s=>({...s,...(s.projectId&&ids.has(s.projectId)?{projectId:undefined}:{}),...(s.master&&ids.has(s.master.songId)?{master:undefined}:{}),mixes:s.mixes.filter(m=>!m.audioSongId||!ids.has(m.audioSongId))})),...(data.station?{station:{...data.station,queue:data.station.queue?.filter(id=>!ids.has(id)),playlists:data.station.playlists?Object.fromEntries(Object.entries(data.station.playlists).map(([id,tracks])=>[id,tracks?.filter(t=>!ids.has(t))])):undefined,customPlaylists:data.station.customPlaylists?.map(p=>({...p,tracks:p.tracks.filter(id=>!ids.has(id))}))}}:{})};
}
