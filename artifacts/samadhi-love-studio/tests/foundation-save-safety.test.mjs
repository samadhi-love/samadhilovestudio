import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";
import {sqliteD1} from "../scripts/storage/sqlite-fixture.mjs";
import {readFileSync,readdirSync} from "node:fs";
mkdirSync("generated-artifacts/tests/foundation",{recursive:true});
globalThis.__foundation={env:{}};
await build({entryPoints:["app/server/song-recovery.ts","app/server/save-safety.ts","app/changed-clean-fields.ts","app/api/studio/route.ts","app/server/jobs.ts"],outdir:"generated-artifacts/tests/foundation",outExtension:{".js":".mjs"},bundle:true,platform:"node",format:"esm",plugins:[{name:"offline-foundation",setup(b){
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
      export async function writeStudio(owner,revision,content){const s=globalThis.__foundation;if(s.failWrite||revision!==s.current.revision)return undefined;s.current={data:JSON.parse(content),revision:revision+1};s.writes++;return {revision:revision+1};}
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
// Load real domain constructors without introducing storage bindings.
await build({entryPoints:["app/studio-data.ts"],outfile:"generated-artifacts/tests/foundation/data.mjs",bundle:true,platform:"node",format:"esm"});
const {freshSong,emptyCreatorStudio}=await import("../generated-artifacts/tests/foundation/data.mjs");
function fixture(){
  const db=sqliteD1();
  for(const name of readdirSync("drizzle").filter(f=>f.endsWith(".sql")).sort())db.sql.exec(readFileSync("drizzle/"+name,"utf8"));
  const objects=new Map();
  const env=globalThis.__foundation.env??={};
  Object.assign(globalThis.__foundation,{current:{data:structuredClone(emptyCreatorStudio),revision:0},objects,revocations:[],failWrite:false,failRevoke:false,writes:0});
  env.DB=db;env.STUDIO_ROW_STORAGE="legacy";
  env.BUCKET={
    async put(key,value,options={}){const prior=objects.get(key);if(options.onlyIf?.etagMatches&&options.onlyIf.etagMatches!==prior?.etag)return null;const item={value:typeof value==="string"?value:new TextDecoder().decode(value),etag:crypto.randomUUID(),customMetadata:options.customMetadata??{},httpMetadata:options.httpMetadata??{}};objects.set(key,item);return item;},
    async head(key){const v=objects.get(key);return v?{...v,key}:null;},
    async get(key){const v=objects.get(key);return v?{...v,json:async()=>JSON.parse(v.value)}:null;},
    async list({prefix}){return {objects:[...objects].filter(([k])=>k.startsWith(prefix)).map(([key,v])=>({key,...v})),truncated:false};}
  };
  const song=freshSong("song","Original",0);
  globalThis.__foundation.current.data.songs=[song];
  return {state:globalThis.__foundation,db,song,bucket:env.BUCKET};
}
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
