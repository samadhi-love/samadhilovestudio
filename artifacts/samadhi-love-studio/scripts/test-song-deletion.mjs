import{DatabaseSync}from"node:sqlite";import{build}from"esbuild";import{readFileSync,readdirSync,mkdirSync}from"node:fs";import{fileURLToPath,pathToFileURL}from"node:url";import path from"node:path";import assert from"node:assert/strict";
const root=fileURLToPath(new URL("../",import.meta.url)),work=path.join(root,"work","song-deletion-tests");mkdirSync(work,{recursive:true});
await build({stdin:{contents:'export * from "./app/song-retention-worker";export * from "./app/song-deletion";export {freshSong} from "./app/studio-data";',resolveDir:root,loader:"ts"},bundle:true,platform:"node",format:"esm",outfile:path.join(work,"core.mjs")});
const{runSongRetention,normalizeSongDeletion,canRestoreSong,songRecoveryMs,freshSong}=await import(pathToFileURL(path.join(work,"core.mjs")));
let checks=0;const check=(value,message)=>{assert(value,message);checks++;};const now=Date.now();
const original={...freshSong("one","My song",0),audioId:"current",audioFormat:"mp3",audioHistory:[{audioId:"earlier",audioFormat:"wav",name:"Earlier",date:"2026-01-01"}]};
const marked=normalizeSongDeletion({...original,deletedAt:"2000-01-01",deleteAfter:"2000-01-02"},original,now);
check(Date.parse(marked.deleteAfter)===now+songRecoveryMs,"server grants exactly thirty days and ignores supplied backdating");
check(normalizeSongDeletion({...marked,deleteAfter:"2099-01-01"},marked,now+5).deleteAfter===marked.deleteAfter,"editing cannot extend recovery");
check(canRestoreSong(marked,now+songRecoveryMs-1)&&!canRestoreSong(marked,now+songRecoveryMs),"restore cutoff is exact");assert.throws(()=>normalizeSongDeletion({...marked,deletedAt:undefined},marked,now+songRecoveryMs));
check(normalizeSongDeletion({...marked,deletedAt:undefined},marked,now+1).deleteAfter===undefined,"restore clears the deadline");
function fixture(songs=[marked]){
 const sql=new DatabaseSync(":memory:");for(const file of readdirSync(path.join(root,"drizzle")).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(path.join(root,"drizzle",file),'utf8'));
 const data={songs,templates:[]};sql.prepare('insert into studios values(?,?,?)').run('a',JSON.stringify(data),1);sql.prepare('insert into studios values(?,?,?)').run('b',JSON.stringify({songs:[original],templates:[]}),1);
 let beforeBatch,failDelete=false,failBackup=false;const objects=new Map(),deleted=[];let version=0;
 function statement(query,params=[]){return{bind:(...values)=>statement(query,values),async all(){return{results:sql.prepare(query).all(...params)};},async first(column){const row=sql.prepare(query).get(...params);return row?(column?row[column]:row):null;},async run(){return{meta:{changes:Number(sql.prepare(query).run(...params).changes)}};},async execute(){return this.run();}};}
 const db={prepare:statement,async batch(statements){if(beforeBatch){const fn=beforeBatch;beforeBatch=undefined;fn();}sql.exec('begin');try{const results=[];for(const s of statements)results.push(await s.execute());sql.exec('commit');return results;}catch(e){sql.exec('rollback');throw e;}}};
 const bucket={async get(key){const object=objects.get(key);return object?{etag:object.etag,json:async()=>JSON.parse(object.text)}:null;},async put(key,text,options={}){if(failBackup&&key.startsWith('checkpoints/'))return null;if(options.onlyIf?.etagMatches!==undefined&&objects.get(key)?.etag!==options.onlyIf.etagMatches)return null;objects.set(key,{text:String(text),etag:String(++version)});return{etag:String(version)};},async delete(keys){if(failDelete)throw Error('storage outage');for(const key of Array.isArray(keys)?keys:[keys]){deleted.push(key);objects.delete(key);}},async list({prefix,limit=1000,cursor}){const rows=[...objects.keys()].filter(k=>k.startsWith(prefix)).sort();const offset=Number(cursor??0);return{objects:rows.slice(offset,offset+limit).map(key=>({key})),truncated:offset+limit<rows.length,cursor:String(offset+limit)};}};
 for(const id of ['one','current','earlier']){objects.set('songs/a/'+id,{text:'original',etag:'1'});objects.set('songs/b/'+id,{text:'other account',etag:'1'});}
 objects.set('checkpoints/a/pre-upgrade.json',{text:JSON.stringify({data:{songs:[original,freshSong('keep','Keep this',0)],templates:[]}}),etag:'1'});
 return{sql,objects,deleted,env:{DB:db,BUCKET:bucket},get:()=>JSON.parse(sql.prepare('select content from studios where owner=?').get('a').content),race:fn=>{beforeBatch=fn;},failDelete:value=>{failDelete=value;},failBackup:value=>{failBackup=value;}};
}
{
 const f=fixture();let r=await runSongRetention(f.env,now+songRecoveryMs-1);check(r.claimed===0&&f.objects.has('songs/a/current'),"no early removal");
 for(let i=0;i<205;i++)f.objects.set('lyric-assets/a/one/'+String(i).padStart(3,'0'),{text:'video',etag:'1'});
 f.objects.set('lyric-projects/a/one/version.json',{text:'snapshot',etag:'1'});f.objects.set('lyric-assets/b/one/video',{text:'other account',etag:'1'});
 r=await runSongRetention(f.env,now+songRecoveryMs);check(r.claimed===1&&!f.get().songs.length,"deadline removes the song through a revision claim");check(!f.objects.has('songs/a/current')&&!f.objects.has('songs/a/earlier'),"current and earlier original audio bytes are physically removed");check(f.objects.has('songs/b/current')&&f.objects.has('lyric-assets/b/one/video'),"other accounts are isolated");check(f.sql.prepare('select state from song_deletion_jobs where owner=?').get('a').state==='queued',"large file sets remain in durable retry queue");
 await runSongRetention(f.env,now+songRecoveryMs+1);await runSongRetention(f.env,now+songRecoveryMs+2);check(![...f.objects.keys()].some(k=>k.startsWith('lyric-assets/a/one/')||k.startsWith('lyric-projects/a/one/')),"all video and history pages are removed across retries");
 const backup=JSON.parse(f.objects.get('checkpoints/a/pre-upgrade.json').text);check(backup.data.songs.length===1&&backup.data.songs[0].id==='keep',"backup scrubbing preserves every unrelated song");check(f.sql.prepare('select audio_ids from song_deletion_jobs where owner=?').get('a').audio_ids==='[]',"completed cleanup retains only a minimal tombstone");
}
{
 const f=fixture();f.failDelete(true);await runSongRetention(f.env,now+songRecoveryMs);check(!f.get().songs.length&&f.objects.has('songs/a/current'),"storage failure preserves a retryable job instead of pretending files are gone");f.failDelete(false);await runSongRetention(f.env,now+songRecoveryMs+1);check(!f.objects.has('songs/a/current'),"failed file deletion recovers automatically");
}
{
 const f=fixture();f.failBackup(true);await runSongRetention(f.env,now+songRecoveryMs);check(f.sql.prepare('select state from song_deletion_jobs where owner=?').get('a').state==='queued',"conditional backup failure cannot mark a job finished");f.failBackup(false);await runSongRetention(f.env,now+songRecoveryMs+1);check(!JSON.parse(f.objects.get('checkpoints/a/pre-upgrade.json').text).data.songs.some(s=>s.id==='one'),"backup cleanup retries safely");
}
{
 const f=fixture();f.race(()=>{const restored={...marked,deletedAt:undefined,deleteAfter:undefined};f.sql.prepare('update studios set revision=2,content=? where owner=?').run(JSON.stringify({songs:[restored],templates:[]}), 'a');});await runSongRetention(f.env,now+songRecoveryMs);check(f.get().songs.length===1&&f.objects.has('songs/a/current'),"a restore/save winning the revision race protects the original");check(f.sql.prepare('select count(*) as n from song_deletion_jobs').get().n===0,"failed revision claims cannot enqueue deletion");
}
{
 const legacy={...original,deletedAt:'2020-01-01'};const f=fixture([legacy]);await runSongRetention(f.env,now);check(Date.parse(f.get().songs[0].deleteAfter)===now+songRecoveryMs&&f.objects.has('songs/a/current'),"existing archives receive a full thirty-day rollout grace window");
}
{
 const b={...freshSong('dependent','Dependent',0),mixes:[{id:'mix',name:'Linked',notes:'',link:'',audioSongId:'one'}]};const f=fixture([marked,b]);await runSongRetention(f.env,now+songRecoveryMs);check(f.get().songs.length===2&&f.objects.has('songs/a/current'),"references from another retained song block destructive cleanup");
}
console.log(JSON.stringify({checks,status:'passed',scope:'real SQLite migrations/CAS transactions; simulated owner-scoped R2, no live data deleted'}));
