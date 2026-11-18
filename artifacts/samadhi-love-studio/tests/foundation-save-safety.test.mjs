import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";
import {sqliteD1} from "../scripts/storage/sqlite-fixture.mjs";
import {R2PrivateBucket} from "../scripts/storage/r2.mjs";
import {readFileSync,readdirSync} from "node:fs";
mkdirSync("generated-artifacts/tests/foundation",{recursive:true});
globalThis.__foundation={env:{}};
await build({entryPoints:["app/server/song-recovery.ts","app/server/audio-storage.ts","app/server/video-upload.ts","app/video-export-storage.ts","app/api/studio/writing-draft/route.ts","app/api/studio/audio/route.ts","app/api/studio/lyric-assets/route.ts","app/server/save-safety.ts","app/changed-clean-fields.ts","app/api/studio/route.ts","app/server/jobs.ts"],outdir:"generated-artifacts/tests/foundation",outExtension:{".js":".mjs"},bundle:true,platform:"node",format:"esm",plugins:[{name:"offline-foundation",setup(b){
  b.onResolve({filter:/storage$|\/store$|song-sharing$|studio-access$/},a=>{
    if(a.path.endsWith("/storage")||a.path==="./storage")return {path:"storage",namespace:"fixture"};
    if(a.path.endsWith("/store")||a.path==="./store")return {path:"store",namespace:"fixture"};
    if(a.path.endsWith("song-sharing"))return {path:"sharing",namespace:"fixture"};
    if(a.path.endsWith("studio-access"))return {path:"access",namespace:"fixture"};
  });
  b.onLoad({filter:/.*/,namespace:"fixture"},a=>({contents:{
    storage:"export const serverStorage=globalThis.__foundation.env;",
    store:`export const privateHeaders={};export const maxStudioBytes=32*1024*1024;export const audioKey=(owner,id)=>'songs/'+encodeURIComponent(owner)+'/'+id;
      export const readStudio=async()=>structuredClone(globalThis.__foundation.current);
      export async function writeStudio(owner,revision,content){const s=globalThis.__foundation;if(s.throwWrite)throw new Error('offline write');if(s.conflicts>0){s.conflicts--;s.current.revision++;return undefined;}if(s.failWrite||revision!==s.current.revision)return undefined;const data=JSON.parse(content);if(s.env.STUDIO_ROW_STORAGE==='verified'){data._storage={songs:{}};for(const song of data.songs)data._storage.songs[song.id]={revision:(s.current.data?._storage?.songs[song.id]?.revision??0)+1};}s.current={data,revision:revision+1};s.writes++;return {revision:revision+1};}
      export const saveConflict=()=>Response.json({error:'conflict'},{status:409});`,
    sharing:"export const revokeSongShare=async(...args)=>{globalThis.__foundation.revocations.push(args);if(globalThis.__foundation.failRevoke)throw new Error('offline');};",
    access:"export async function privateWorkspace(){return {id:'owner',role:'owner'};}",
  }[a.path],loader:"js"}));
}}]});
const recovery=await import("../generated-artifacts/tests/foundation/server/song-recovery.mjs");
const safety=await import("../generated-artifacts/tests/foundation/server/save-safety.mjs");
const clean=await import("../generated-artifacts/tests/foundation/changed-clean-fields.mjs");
const route=await import("../generated-artifacts/tests/foundation/api/studio/route.mjs");
const jobs=await import("../generated-artifacts/tests/foundation/server/jobs.mjs");
const paidStorage=await import("../generated-artifacts/tests/foundation/server/audio-storage.mjs");
const writing=await import("../generated-artifacts/tests/foundation/api/studio/writing-draft/route.mjs");
const upload=await import("../generated-artifacts/tests/foundation/api/studio/audio/route.mjs");
const assets=await import("../generated-artifacts/tests/foundation/api/studio/lyric-assets/route.mjs");
const videoSafety=await import("../generated-artifacts/tests/foundation/video-export-storage.mjs");
globalThis.FixedLengthStream=class extends TransformStream {constructor(){super();}};
// Load real domain constructors without introducing storage bindings.
await build({entryPoints:["app/studio-data.ts"],outfile:"generated-artifacts/tests/foundation/data.mjs",bundle:true,platform:"node",format:"esm"});
const {freshSong,emptyCreatorStudio}=await import("../generated-artifacts/tests/foundation/data.mjs");
await build({entryPoints:["app/song-recovery-session.ts"],outfile:"generated-artifacts/tests/foundation/recovery-session.mjs",bundle:true,platform:"node",format:"esm"});
const recoverySession=await import("../generated-artifacts/tests/foundation/recovery-session.mjs");
function fixture(){
  const db=sqliteD1();
  for(const name of readdirSync("drizzle").filter(f=>f.endsWith(".sql")).sort())db.sql.exec(readFileSync("drizzle/"+name,"utf8"));
  const objects=new Map();
  const env=globalThis.__foundation.env??={};
  Object.assign(globalThis.__foundation,{current:{data:structuredClone(emptyCreatorStudio),revision:0},objects,revocations:[],failWrite:false,failRevoke:false,throwWrite:false,conflicts:0,writes:0});
  env.DB=db;env.STUDIO_ROW_STORAGE="legacy";
  env.BUCKET={
    async put(key,value,options={}){const prior=objects.get(key);if(options.onlyIf?.etagMatches&&options.onlyIf.etagMatches!==prior?.etag||options.onlyIf?.etagDoesNotMatch==="*"&&prior)return null;const text=typeof value==="string"?value:value instanceof ReadableStream?await new Response(value).text():new TextDecoder().decode(value);const item={value:text,size:new TextEncoder().encode(text).length,etag:crypto.randomUUID(),customMetadata:options.customMetadata??{},httpMetadata:options.httpMetadata??{}};objects.set(key,item);return item;},
    async head(key){const v=objects.get(key);return v?{...v,key}:null;},
    async get(key){const v=objects.get(key);return v?{...v,body:new Response(v.value).body,json:async()=>JSON.parse(v.value)}:null;},
    async delete(key){objects.delete(key);},
    async list({prefix,include}){return {objects:[...objects].filter(([k])=>k.startsWith(prefix)).map(([key,v])=>({key,...v,customMetadata:include?.includes("customMetadata")?v.customMetadata:undefined})),truncated:false};}
  };
  const song=freshSong("song","Original",0);
  globalThis.__foundation.current.data.songs=[song];
  return {state:globalThis.__foundation,db,song,bucket:env.BUCKET};
}
test("paid storage retries bytes three times without replaying AI; a separate key remains recoverable",async()=>{
  const {state,db,song,bucket}=fixture();
  try{
    const original=bucket.put.bind(bucket);let primary=0,fallback=0,receipts=0;
    bucket.put=async(key,value,options)=>{if(key==="songs/owner/song"){primary++;throw new TypeError("offline");}if(key.startsWith("private/recovery/")&&++receipts===2)throw new TypeError("receipt response lost");if(key.startsWith("songs/"))fallback++;return original(key,value,options);};
    const stored=await paidStorage.storePaidAudio("owner",{...song,audioFormat:"mp3",generation:{audioId:song.id,approvedLyrics:"Keep the original words"}},new TextEncoder().encode("paid").buffer,async()=>{});
    assert.equal(primary,3);assert.equal(fallback,1);assert.notEqual(stored.audioId,song.id);
    assert.equal(stored.generation.audioId,stored.audioId);assert.equal(stored.generation.approvedLyrics,"Keep the original words");
    assert.equal((await recovery.recoverPaidSongs("owner")).recovered,1);
    assert.equal(state.current.data.songs[0].audioId,stored.audioId);
    assert.equal(state.current.data.songs[0].generation.audioId,stored.audioId);
  }finally{db.sql.close();}
});
test("total storage outage says to check ElevenLabs history; ambiguous completed puts are not duplicated",async()=>{
  const {db,song,bucket}=fixture();
  try{
    const original=bucket.put.bind(bucket);
    bucket.put=async()=>{throw new TypeError("offline");};
    await assert.rejects(paidStorage.storePaidAudio("owner",song,new ArrayBuffer(4),async()=>{}),/ElevenLabs history/);
    let writes=0;
    bucket.put=async(key,value,options)=>{const result=await original(key,value,options);if(key.startsWith("songs/")){writes++;throw new TypeError("response lost");}return result;};
    assert.equal((await paidStorage.storePaidAudio("owner",song,new TextEncoder().encode("paid").buffer,async()=>{})).id,song.id);
    assert.equal(writes,1);
  }finally{db.sql.close();}
});
const writingRequest=(revision,title)=>new Request("https://studio.test/api/studio/writing-draft",{method:"PUT",headers:{origin:"https://studio.test","X-Studio-Workspace":"owner"},body:JSON.stringify({kind:"simple",revision,writing:{title,prompt:"A song",lyrics:"First line",voice:"Warm"}})});
test("library saves cannot omit, reset or forge writing revisions; the next writing save succeeds",async()=>{
  const {state,db}=fixture();
  try{
    assert.equal((await writing.PUT(writingRequest(0,"Initial writing"))).status,200);
    let revision=1;
    for(const incoming of [undefined,0,999]){
      const next=structuredClone(state.current.data),draft=next.songs.find(s=>s.id==="account-writing-simple");
      if(incoming===undefined)delete draft.writingRevision;else draft.writingRevision=incoming;
      draft.name="Library edit "+revision;
      assert.equal((await route.PUT(request(state,next))).status,200);
      assert.equal(state.current.data.songs.find(s=>s.id===draft.id).writingRevision,revision);
      const saved=await writing.PUT(writingRequest(revision,"Writing after library "+revision));
      assert.equal(saved.status,200);assert.equal((await saved.json()).revision,++revision);
    }
    const next=structuredClone(state.current.data);
    next.songs.push({...freshSong("forged-draft","Client draft",0),writingRevision:900});
    assert.equal((await route.PUT(request(state,next))).status,200);
    assert.equal(state.current.data.songs.find(s=>s.id==="forged-draft").writingRevision,undefined);
  }finally{db.sql.close();}
});
test("attached paid audio completes its receipt and recovery never reads completed or legacy attached receipts",async()=>{
  const {state,db,bucket}=fixture();
  try{
    state.current.data.songs=[];
    for(let i=0;i<50;i++){
      const song={...freshSong("attached-"+i,"Attached "+i,0),audioId:"audio-"+i,audioFormat:"mp3"};
      await paidStorage.storePaidAudio("owner",song,new ArrayBuffer(4),async()=>{});
      state.current.data.songs.push(song);
      if(i%2===0){
        assert.equal(await paidStorage.finishPaidAudio("owner",song),true);
        const receipt=state.objects.get("private/recovery/audio/owner/"+song.id+".json");
        assert.equal(JSON.parse(receipt.value).done,true);assert.equal(receipt.customMetadata.done,"1");
      }else{
        // Pre-existing receipts have no metadata and may use a non-default audioId.
        state.objects.get("private/recovery/audio/owner/"+song.id+".json").customMetadata={};
      }
    }
    // Old takes must not add a receipt read for a playable song, either.
    await bucket.put("songs/owner/old-take","audio",{customMetadata:{recoverable:"1",songId:"attached-0",audioId:"old-take"}});
    state.current.data.songs[0].audioHistory=[{audioId:"old-take",audioFormat:"mp3",date:new Date().toISOString(),name:"Older take"}];
    const originalList=bucket.list.bind(bucket);let lists=0,reads=0,heads=0;
    bucket.list=async options=>{
      lists++;assert.equal(options.include,undefined,"metadata-inclusive listings cause per-object HEAD requests in production");
      const full=await originalList(options),offset=Number(options.cursor??0),objects=full.objects.slice(offset,offset+7);
      return {objects,truncated:offset+7<full.objects.length,cursor:String(offset+7)};
    };
    bucket.get=async()=>{reads++;throw new Error("Attached receipts must not be fetched.");};
    bucket.head=async()=>{heads++;throw new Error("Attached audio must not be probed.");};
    assert.deepEqual(await recovery.recoverPaidSongs("owner"),{recovered:0,pending:0});
    assert.ok(lists>2,"exercise pagination");assert.equal(reads,0);assert.equal(heads,0);
  }finally{db.sql.close();}
});
test("recovery completes the receipt; an obsolete completion cannot overwrite a newer paid attempt",async()=>{
  const {state,db,song,bucket}=fixture();
  try{
    const paid={...song,audioFormat:"mp3"};
    await paidStorage.storePaidAudio("owner",paid,new ArrayBuffer(4),async()=>{});
    assert.equal((await recovery.recoverPaidSongs("owner")).recovered,1);
    const key="private/recovery/audio/owner/song.json";
    assert.equal(JSON.parse(state.objects.get(key).value).done,true);
    assert.equal(state.objects.get(key).customMetadata.done,"1");
    await recovery.preservePaidSong("owner",paid);
    const record=await bucket.get(key),receipt=await record.json();
    await recovery.preservePaidSong("owner",{...paid,audioId:"new-attempt"});
    assert.equal(await recovery.finishPaidSong("owner",paid,{receipt,etag:record.etag}),false);
    assert.equal(JSON.parse(state.objects.get(key).value).song.audioId,"new-attempt");
    assert.notEqual(JSON.parse(state.objects.get(key).value).done,true);
    assert.equal(await paidStorage.finishPaidAudio("owner",paid),false);
  }finally{db.sql.close();}
});
test("the real S3 adapter recovers a 50-song attached library using LIST requests only",async()=>{
  const {state,db}=fixture(),calls=[];
  try{
    state.current.data.songs=Array.from({length:50},(_,i)=>({...freshSong("saved-"+i,"Saved "+i,0),audioId:"recording-"+i,audioFormat:"mp3"}));
    state.env.BUCKET=new R2PrivateBucket({bucket:"offline-private-bucket",client:{async send(command){
      calls.push(command.constructor.name);
      assert.equal(command.constructor.name,"ListObjectsV2Command","GET and HEAD requests are forbidden for attached recordings");
      const keys=state.current.data.songs.map(song=>command.input.Prefix.startsWith("songs/")?
        "songs/owner/"+song.audioId:"private/recovery/audio/owner/"+song.id+".json");
      return {Contents:keys.map(Key=>({Key,Size:4,ETag:'"fixture"'})),IsTruncated:false};
    }}});
    assert.deepEqual(await recovery.recoverPaidSongs("owner"),{recovered:0,pending:0});
    assert.deepEqual(calls,["ListObjectsV2Command","ListObjectsV2Command"]);
  }finally{db.sql.close();}
});
test("a different unattached paid take stays pending without replacing a playable song",async()=>{
  const {state,db,song}=fixture();
  try{
    const paid={...song,audioId:"unattached-paid-take",audioFormat:"mp3"};
    await paidStorage.storePaidAudio("owner",paid,new ArrayBuffer(4),async()=>{});
    state.current.data.songs[0]={...song,audioFormat:"mp3",audioId:"kept-recording"};
    assert.deepEqual(await recovery.recoverPaidSongs("owner"),{recovered:0,pending:1});
    assert.equal(state.current.data.songs[0].audioId,"kept-recording");
    assert.notEqual(JSON.parse(state.objects.get("private/recovery/audio/owner/song.json").value).done,true);
  }finally{db.sql.close();}
});
test("automatic recovery runs once per account/session, survives reloads and tolerates blocked session storage",async()=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,"window"),saved=new Map();
  Object.defineProperty(globalThis,"window",{configurable:true,value:{sessionStorage:{getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)}}});
  try{
    assert.equal(recoverySession.claimAutomaticSongRecovery("session-owner"),true);
    assert.equal(recoverySession.claimAutomaticSongRecovery("session-owner"),false);
    const reloaded=await import("../generated-artifacts/tests/foundation/recovery-session.mjs?reload");
    assert.equal(reloaded.claimAutomaticSongRecovery("session-owner"),false);
    recoverySession.retryAutomaticSongRecovery("session-owner");
    assert.equal(recoverySession.claimAutomaticSongRecovery("session-owner"),true,"an interrupted creation can silently recover on the next visit");
    assert.equal(recoverySession.claimAutomaticSongRecovery("session-owner"),false,"a completed scan is still limited to once per session");
    assert.equal(reloaded.claimAutomaticSongRecovery("another-owner"),true);
    Object.defineProperty(globalThis.window,"sessionStorage",{get(){throw new Error("blocked");}});
    assert.equal(reloaded.claimAutomaticSongRecovery("blocked-owner"),true);
    assert.equal(reloaded.claimAutomaticSongRecovery("blocked-owner"),false);
    reloaded.retryAutomaticSongRecovery("blocked-owner");
    assert.equal(reloaded.claimAutomaticSongRecovery("blocked-owner"),true,"recovery can retry even when session storage is blocked");
    const studio=readFileSync("app/studio.tsx","utf8");
    assert.match(studio,/if\(automatic&&!claimAutomaticSongRecovery\(workspaceId\)\)return/);
    assert.doesNotMatch(studio,/Recover unfinished songs/,"paid recovery runs automatically, without a user prompt");
    assert.match(studio,/if\(!result\)retryAutomaticSongRecovery\(workspaceId\)/);
    assert.match(studio,/if\(result\.recovery\?\.pending\)\{retryAutomaticSongRecovery\(workspaceId\)/);
  }finally{if(previous)Object.defineProperty(globalThis,"window",previous);else delete globalThis.window;}
});
test("legacy account writing saves twice, reloads and saves again; stale second tab conflicts",async()=>{
  const {state,db}=fixture();
  try{
    for(let revision=0;revision<2;revision++){
      const result=await writing.PUT(writingRequest(revision,"Draft "+revision));assert.equal(result.status,200);assert.equal((await result.json()).revision,revision+1);
    }
    const loaded=await (await writing.GET(new Request("https://studio.test/api/studio/writing-draft?kind=simple"))).json();
    assert.equal(loaded.revision,2);
    assert.equal((await writing.PUT(writingRequest(loaded.revision,"After reload"))).status,200);
    assert.equal((await writing.PUT(writingRequest(2,"Stale tab"))).status,409);
    assert.equal(state.current.data.songs.find(s=>s.id==="account-writing-simple").name,"After reload");
  }finally{db.sql.close();}
});
test("verified account writing keeps row revisions and does not add legacy counters",async()=>{
  const {state,db}=fixture();
  try{
    state.env.STUDIO_ROW_STORAGE="verified";
    assert.equal((await writing.PUT(writingRequest(0,"Row draft"))).status,200);
    const loaded=await (await writing.GET(new Request("https://studio.test/api/studio/writing-draft?kind=simple"))).json();
    assert.equal(loaded.revision,1);
    assert.equal((await writing.PUT(writingRequest(1,"Row draft two"))).status,200);
    assert.equal(state.current.data.songs.find(s=>s.id==="account-writing-simple").writingRevision,undefined);
  }finally{db.sql.close();}
});
const audioRequest=()=>new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{origin:"https://studio.test","X-Studio-Workspace":"owner","X-Studio-Revision":"0","X-Studio-Clean-Audio":"1","X-Song-Title":"Uploaded idea","X-Audio-Format":"wav","X-Audio-Size":"4"},body:"wave"});
test("an independent upload rebases library conflicts without deleting bytes or other edits",async()=>{
  const {state,db,song}=fixture();
  try{
    state.conflicts=2;state.current.data.songs[0].notes.lyrics="Keep other edits";
    const result=await upload.POST(audioRequest());assert.equal(result.status,200);
    assert.equal(state.current.data.songs.length,2);assert.equal(state.current.data.songs.find(s=>s.id===song.id).notes.lyrics,"Keep other edits");
    assert.equal([...state.objects.keys()].filter(k=>k.startsWith("songs/")).length,1);
  }finally{db.sql.close();}
});
test("an upload with an uncertain library write is indexed and recoverable",async()=>{
  const {state,db}=fixture();
  try{
    state.throwWrite=true;assert.equal((await upload.POST(audioRequest())).status,503);
    assert.equal([...state.objects.keys()].filter(k=>k.startsWith("songs/")).length,1);
    assert.equal([...state.objects.keys()].filter(k=>k.startsWith("private/recovery/")).length,1);
    state.throwWrite=false;assert.equal((await recovery.recoverPaidSongs("owner")).recovered,1);
    assert.equal(state.current.data.songs.find(s=>s.name==="Uploaded idea").audioFormat,"wav");
  }finally{db.sql.close();}
});
const chunkRequest=(query,size,body=undefined,type="video/mp4;codecs=avc1.42001f,mp4a.40.2")=>new Request("https://studio.test/api/studio/lyric-assets?"+query,{method:"POST",headers:{origin:"https://studio.test","X-Song-Id":"song","X-Asset-Kind":"video","X-Asset-Size":String(size),"Content-Type":type},body});
test("private video chunks assemble, reject changed retries and complete idempotently",async()=>{
  const {state,db}=fixture();
  try{
    const size=8*1024*1024+4;
    const init=await assets.POST(chunkRequest("upload=init",size));assert.equal(init.status,200);
    const {upload:id}=await init.json();
    assert.equal((await assets.POST(chunkRequest(`upload=${id}&complete=1`,size))).status,409);
    assert.equal((await assets.POST(chunkRequest(`upload=${id}&part=0`,size,"a".repeat(8*1024*1024)))).status,200);
    assert.equal((await assets.POST(chunkRequest(`upload=${id}&part=1`,size,"tail"))).status,200);
    assert.equal((await assets.POST(chunkRequest(`upload=${id}&part=1`,size,"edit"))).status,409);
    assert.equal((await assets.POST(chunkRequest(`upload=${id}&complete=1`,size))).status,200);
    const key=`lyric-assets/owner/song/${id}`,saved=state.objects.get(key);
    assert.equal(saved.size,size);assert.equal(saved.httpMetadata.contentType,"video/mp4");assert.equal(saved.customMetadata.source,"song");
    assert.equal((await assets.POST(chunkRequest(`upload=${id}&complete=1`,size))).status,200);
    assert.equal([...state.objects.keys()].filter(k=>/\/\d+$/.test(k)).length,0);
  }finally{db.sql.close();}
});
test("350 MB videos may start chunked uploads; private limits and song authorization still apply",async()=>{
  const {db,state}=fixture();
  try{
    assert.equal((await assets.POST(chunkRequest("upload=init",350*1024*1024))).status,200);
    assert.equal((await assets.POST(chunkRequest("upload=init",513*1024*1024))).status,400);
    state.current.data.songs=[];
    assert.equal((await assets.POST(chunkRequest("upload=init",350*1024*1024))).status,404);
  }finally{db.sql.close();}
});
test("duration checks reject truncated audio/video and codec labels warn about incompatible fallback",()=>{
  videoSafety.assertVideoDuration(600.05,600);
  assert.throws(()=>videoSafety.assertVideoDuration(599.8,600),/not saved or offered/);
  assert.throws(()=>videoSafety.assertVideoDuration(NaN,600),/retry/i);
  assert.match(videoSafety.codecCompatibility("vp8 + opus"),/may not play on iPhone/);
  assert.equal(videoSafety.codecCompatibility("avc1.42001f + mp4a.40.2"),"avc1.42001f + mp4a.40.2");
});
test("paid audio survives a failed save, recovery keeps edited lyrics and is idempotent",async()=>{
  const {state,db,song,bucket}=fixture();
  try{
    const paid={...song,audioFormat:"mp3",creationDraft:false};
    await recovery.preservePaidSong("owner",paid);
    await bucket.put("songs/owner/song","paid bytes");
    state.failWrite=true;
    assert.equal((await recovery.recoverPaidSongs("owner")).recovered,0);
    assert.ok(state.objects.has("songs/owner/song"));
    state.current.data.songs[0].notes.lyrics="Edited while saving";
    state.failWrite=false;
    assert.equal((await recovery.recoverPaidSongs("owner")).recovered,1);
    assert.equal(state.current.data.songs[0].notes.lyrics,"Edited while saving");
    assert.equal(state.current.data.songs[0].audioFormat,"mp3");
    assert.equal((await recovery.recoverPaidSongs("owner")).recovered,0);
    assert.equal(state.current.data.songs.length,1);
  }finally{db.sql.close();}
});
test("audio metadata recovers an absent receipt; another owner's objects are not read",async()=>{
  const {state,db,bucket}=fixture();
  try{
    await bucket.put("songs/owner/new-song","audio",{customMetadata:{recoverable:"1",songId:"new-song",title:"Recovered title"}});
    await bucket.put("songs/foreign/private-song","audio",{customMetadata:{recoverable:"1",songId:"private-song",title:"Other title"}});
    assert.equal((await recovery.recoverPaidSongs("owner")).recovered,1);
    assert.equal(state.current.data.songs.find(s=>s.id==="new-song").name,"Recovered title");
    assert.equal(state.current.data.songs.some(s=>s.id==="private-song"),false);
  }finally{db.sql.close();}
});
test("recovery never replaces archived songs, tombstoned songs or a newer recording",async()=>{
  const {state,db,song,bucket}=fixture();
  try{
    await recovery.preservePaidSong("owner",{...song,audioFormat:"mp3"});
    await bucket.put("songs/owner/song","paid bytes");
    state.current.data.songs[0]={...song,deletedAt:new Date().toISOString()};
    assert.equal((await recovery.recoverPaidSongs("owner")).recovered,0);
    state.current.data.songs[0]={...song,audioFormat:"mp3",audioId:"newer"};
    assert.equal((await recovery.recoverPaidSongs("owner")).recovered,0);
    assert.equal(state.current.data.songs[0].audioId,"newer");
  }finally{db.sql.close();}
});
function request(state,data,revision=state.current.revision){return new Request("https://studio.test/api/studio",{method:"PUT",headers:{origin:"https://studio.test","X-Studio-Workspace":"owner","X-Studio-Deletion-Policy":"14-days-v1"},body:JSON.stringify({data,revision})});}
test("a conflicting save never revokes sharing or unlists a release",async()=>{
  const {state,db}=fixture();
  try{
    const next=structuredClone(state.current.data);next.songs[0].deletedAt=new Date().toISOString();
    state.failWrite=true;
    const response=await route.PUT(request(state,next));
    assert.equal(response.status,409);assert.equal(state.revocations.length,0);
    assert.equal(state.current.data._saveEffects,undefined);
  }finally{db.sql.close();}
});
test("committed cleanup failures stay in the workspace outbox, report and retry once",async()=>{
  const {state,db}=fixture();
  try{
    const next=structuredClone(state.current.data);next.songs[0].deletedAt=new Date().toISOString();
    state.failRevoke=true;
    const response=await route.PUT(request(state,next));
    assert.equal(response.status,200);assert.match((await response.json()).warning,/cleanup/);
    assert.equal(state.current.data._saveEffects.length,1);assert.equal(state.revocations.length,1);
    state.failRevoke=false;
    assert.equal(await safety.finishPrivacyEffects("owner",state.current.data),0);
    assert.equal(state.revocations.length,2);
    await safety.finishPrivacyEffects("owner",state.current.data);
    assert.equal(state.revocations.length,2);
  }finally{db.sql.close();}
});
test("unchanged flagged lyrics don't block another song; changed wording identifies the song and field",async()=>{
  const {state,db}=fixture();
  try{
    state.current.data.songs[0].notes.lyrics="fuck";
    const other=freshSong("other","Other",1);
    state.current.data.songs.push(other);
    let next=structuredClone(state.current.data);next.songs[1].notes.prompt="Warm piano";
    assert.equal((await route.PUT(request(state,next))).status,200);
    next=structuredClone(state.current.data);next.songs[1].notes.lyrics="fuck";
    const response=await route.PUT(request(state,next));assert.equal(response.status,422);
    const body=await response.json();assert.equal(body.songId,"other");assert.equal(body.field,"notes.lyrics");
    assert.equal(clean.changedCleanField([{id:"a",text:"fuck"},{id:"b",text:"Clean"}],[{id:"b",text:"Clean"},{id:"a",text:"fuck"}]),null);
  }finally{db.sql.close();}
});
test("legacy jobs use FK-only anchors without copying songs or changing the legacy workspace",async()=>{
  const {state,db}=fixture();
  try{
    const content=JSON.stringify(state.current.data);
    db.sql.prepare("INSERT INTO studios(owner,content,revision) VALUES(?,?,?)").run("owner",content,1);
    const {job}=await jobs.createStudioJob("owner",{id:"legacy-job",songId:"song",type:"music-generation"});
    assert.equal(job.status,"waiting");
    assert.deepEqual({...db.sql.prepare("SELECT content,revision FROM studio_songs").get()},{content:"{}",revision:0});
    assert.equal(db.sql.prepare("SELECT content FROM studios").get().content,content);
    assert.equal(db.sql.prepare("SELECT count(*) AS n FROM studio_accounts").get().n,0);
  }finally{db.sql.close();}
});
