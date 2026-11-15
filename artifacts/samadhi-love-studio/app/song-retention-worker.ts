import {isStudio} from "./studio-validation";
import type {Studio} from "./studio-data";
import {audioIdsForSong,deletionDeadline,normalizeSongDeletion,songDependsOn,withoutDeletedSongs} from "./song-deletion";
type Bindings={DB?:D1Database;BUCKET?:R2Bucket};
const valid=(s:unknown):s is string=>typeof s==="string"&&/^[\w-]{1,100}$/.test(s);
const parse=(content:string):Studio=>{const value=JSON.parse(content);if(!isStudio(value))throw new Error("Invalid workspace; cleanup paused.");return value;};
/** Called by the Worker scheduler, independent of a browser. No public cleanup endpoint. */
export async function runSongRetention(env:Bindings,now=Date.now()){
 const db=env.DB,bucket=env.BUCKET;if(!db||!bucket)throw new Error("Song cleanup requires DB and BUCKET.");
 const cursorKey="maintenance/song-retention/v1/scan.json";
 const cursorFile=await bucket.get(cursorKey),cursor=cursorFile?await cursorFile.json<{owner:string}>():{owner:""};
 const page=await db.prepare("select owner,content,revision from studios where owner > ? order by owner limit 25").bind(cursor.owner??"").all<{owner:string;content:string;revision:number}>();
 let claimed=0,completed=0,failed=0;
 for(const row of page.results){try{
  const data=parse(row.content),upgraded={...data,songs:data.songs.map(s=>s.deletedAt&&deletionDeadline(s)===null?normalizeSongDeletion(s,s,now):s)};
  const due=upgraded.songs.filter(s=>{const deadline=deletionDeadline(s);return deadline!==null&&deadline<=now;});
  const dueIds=new Set(due.map(s=>s.id));
  // Resolve dependencies to a fixed point: a retained dependent may retain its sources.
  let changed=true;while(changed){changed=false;for(const song of due){if(dueIds.has(song.id)&&upgraded.songs.some(other=>!dueIds.has(other.id)&&songDependsOn(other,song))){dueIds.delete(song.id);changed=true;}}}
  const expired=due.filter(s=>dueIds.has(s.id));
  const removed=new Set(expired.map(s=>s.id)),next=withoutDeletedSongs(upgraded,removed);
  if(!removed.size&&JSON.stringify(upgraded)===JSON.stringify(data))continue;
  const jobs=expired.map(s=>({id:s.id,audio:audioIdsForSong(s)}));
  // D1 batch is atomic. Only a successful revision claim can enqueue file removal.
  const result=await db.batch([
   db.prepare("update studios set content = ?, revision = revision + 1 where owner = ? and revision = ?").bind(JSON.stringify(next),row.owner,row.revision),
   db.prepare("insert into song_deletion_jobs(owner,song_id,audio_ids,state,created_at,updated_at) select ?, json_extract(value,'$.id'), json_extract(value,'$.audio'), 'queued', ?, ? from json_each(?) where changes() = 1 on conflict(owner,song_id) do nothing").bind(row.owner,now,now,JSON.stringify(jobs)),
  ]);
  if(result[0].meta.changes)claimed+=removed.size;
 }catch{failed++;}}
 await bucket.put(cursorKey,JSON.stringify({owner:page.results.length===25?page.results.at(-1)!.owner:""}),{httpMetadata:{contentType:"application/json"}});
 const jobs=await db.prepare("select owner,song_id,audio_ids from song_deletion_jobs where state != 'done' order by updated_at limit 25").all<{owner:string;song_id:string;audio_ids:string}>();
 for(const job of jobs.results){try{
  if(!valid(job.song_id))throw new Error("Invalid cleanup job.");
  const ids:unknown=JSON.parse(job.audio_ids);if(!Array.isArray(ids)||!ids.every(valid))throw new Error("Invalid cleanup media list.");
  const row=await db.prepare("select content from studios where owner = ?").bind(job.owner).first<{content:string}>();
  if(!row)throw new Error("Workspace unavailable; cleanup paused.");
  const data=parse(row.content);if(data.songs.some(s=>s.id===job.song_id))throw new Error("Song still exists; cleanup paused.");
  const protectedAudio=new Set(data.songs.flatMap(s=>[...audioIdsForSong(s),s.master?.audioId,s.lyricVideo?.pro?.sourceAudioId].filter((id):id is string=>!!id)));
  const owner=encodeURIComponent(job.owner),song=job.song_id;
  await db.prepare("update community_releases set listed = 0 where owner = ? and song_id = ?").bind(job.owner,song).run();
  for(const id of ids)if(!protectedAudio.has(id))await bucket.delete(`songs/${owner}/${id}`);
  let remaining=false;
  for(const prefix of [`lyric-assets/${owner}/${song}/`,`lyric-projects/${owner}/${song}/`]){
   const files=await bucket.list({prefix,limit:100});if(files.objects.length)await bucket.delete(files.objects.map(o=>o.key));if(files.truncated)remaining=true;
  }
  // Scrub the song from workspace backups as well, preserving all other songs.
  let cursor:string|undefined;
  do{const files=await bucket.list({prefix:`checkpoints/${owner}/`,limit:100,...(cursor?{cursor}:{})});
   for(const file of files.objects){const object=await bucket.get(file.key);if(!object)continue;const backup=await object.json<{data?:Studio|null}>();if(backup.data?.songs.some(s=>s.id===song)){
    const saved=await bucket.put(file.key,JSON.stringify({...backup,data:withoutDeletedSongs(backup.data,new Set([song]))}),{onlyIf:{etagMatches:object.etag},httpMetadata:{contentType:"application/json"}});if(!saved)throw new Error("Backup changed; retry cleanup.");
   }}cursor=files.truncated?files.cursor:undefined;
  }while(cursor);
  await bucket.delete(`song-sharing/${owner}/${song}.json`);
  await db.prepare("update song_deletion_jobs set state = ?, audio_ids = ?, updated_at = ? where owner = ? and song_id = ? and state != 'done'").bind(remaining?"queued":"done",remaining?job.audio_ids:"[]",now,job.owner,song).run();
  if(!remaining)completed++;
 }catch{failed++;await db.prepare("update song_deletion_jobs set updated_at = ? where owner = ? and song_id = ? and state != 'done'").bind(now,job.owner,job.song_id).run();}}
 return {claimed,completed,failed,scanned:page.results.length};
}
