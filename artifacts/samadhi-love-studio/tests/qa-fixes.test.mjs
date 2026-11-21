// QA fixes (Nov 21): save conflicts merge automatically, stalled saves give up,
// iPhone volume slider, and cleanup of abandoned private video upload parts.
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";

const directory="generated-artifacts/tests/qa-fixes";
mkdirSync(directory,{recursive:true});
globalThis.__qaFixes={};
await build({stdin:{contents:`
export {saveWithConflictRetry,isSaveConflict} from "./app/save-conflict";
export {rebaseStudio} from "./app/song-save-merge";
export {GET,PUT} from "./app/api/studio/route";
export {emptyCreatorStudio,freshSong} from "./app/studio-data";
export {pageVolumeWorks} from "./app/page-volume";
export {clearStaleVideoUploads,staleVideoUploadMs} from "./app/server/video-upload-cleanup";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/bundle.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"error",plugins:[{name:"qa-fixes",setup(b){
  b.onResolve({filter:/.*/},a=>{
    if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fx"};
    if(/studio-access$/.test(a.path))return {path:"access",namespace:"fx"};
  });
  b.onLoad({filter:/.*/,namespace:"fx"},a=>({loader:"js",contents:{
    storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__qaFixes.env[k]});",
    access:"export const privateWorkspace=async()=>({id:'owner',role:'owner'});export const studioAccess=async()=>({id:'owner',role:'owner'});",
  }[a.path]}));
}}]});
const api=await import(`../${directory}/bundle.mjs`);

function d1(){
  const sql=new DatabaseSync(":memory:");
  for(const file of readdirSync("drizzle").filter(f=>f.endsWith(".sql")).sort())
    for(const statement of readFileSync(`drizzle/${file}`,"utf8").split("--> statement-breakpoint"))if(statement.trim())sql.exec(statement);
  const prepare=(query,params=[])=>({
    bind:(...values)=>prepare(query,values.map(v=>v===undefined?null:typeof v==="boolean"?Number(v):v)),
    async all(){return {results:sql.prepare(query).all(...params),success:true,meta:{}};},
    async first(column){const row=sql.prepare(query).get(...params);return row?(column?row[column]:row):null;},
    async run(){return {success:true,meta:{changes:Number(sql.prepare(query).run(...params).changes)}};},
    async raw(){const s=sql.prepare(query);s.setReturnArrays(true);return s.all(...params);},
  });
  return {prepare};
}
function bucket(){
  const objects=new Map();
  return {
    async put(key,value,o={}){if(o.onlyIf?.etagDoesNotMatch==="*"&&objects.has(key))return null;const obj={key,etag:crypto.randomUUID()};objects.set(key,obj);return obj;},
    async head(key){return objects.get(key)??null;},async get(){return null;},
    async list(){return {objects:[],truncated:false};},async delete(){throw new Error("No deletes expected.");},
  };
}
const songs=()=>[0,1,2].map(i=>api.freshSong(`song-${i}`,`Song ${i}`,i));
const studio=list=>({...structuredClone(api.emptyCreatorStudio),songs:list});
const put=body=>api.PUT(new Request("https://studio.test/api/studio",{method:"PUT",
  headers:{origin:"https://studio.test","Content-Type":"application/json","X-Studio-Workspace":"owner"},body:JSON.stringify(body)}));
const get=async()=>(await api.GET(new Request("https://studio.test/api/studio"))).json();

test("a stale save gets a clear, machine-readable conflict (no more 'another tab' only)",async()=>{
  globalThis.__qaFixes={env:{DB:d1(),BUCKET:bucket(),STUDIO_ROW_STORAGE:"legacy"}};
  assert.equal((await put({data:studio(songs()),revision:0})).status,200);
  const response=await put({data:studio(songs()),revision:0});
  const body=await response.json();
  assert.equal(response.status,409);
  assert.equal(body.code,"save-conflict");
  assert.ok(api.isSaveConflict(response,body));
  assert.match(body.error,/a song finished/);
});

test("editing while a song finishes in the background: the edit is merged and saved, nothing lost",async()=>{
  globalThis.__qaFixes={env:{DB:d1(),BUCKET:bucket(),STUDIO_ROW_STORAGE:"legacy"}};
  assert.equal((await put({data:studio(songs()),revision:0})).status,200);
  // The page opens the library…
  const opened=await get();
  const client={data:opened.data,revision:opened.revision};
  // …meanwhile the server finishes a song and saves it (revision moves on).
  const finished={...opened.data,songs:opened.data.songs.map(s=>s.id==="song-2"?{...s,name:"Finished in background",summary:"Saved by the server"}:s)};
  assert.equal((await put({data:finished,revision:opened.revision})).status,200);
  // The person renames another song from the page's older copy — same steps as commit().
  const base=client.data,next={...base,songs:base.songs.map(s=>s.id==="song-0"?{...s,name:"My new title"}:s)};
  let payload,payloadOn;
  const prepared=()=>{if(!payload||payloadOn!==client.data){payloadOn=client.data;payload=client.data===base?next:api.rebaseStudio(base,next,client.data);}return payload;};
  const attempts=[];
  const {response,result}=await api.saveWithConflictRetry(async()=>{
    const reply=await put({data:prepared(),revision:client.revision});
    attempts.push(reply.status);
    return {response:reply,result:await reply.json()};
  },async()=>{const latest=await get();client.data=latest.data;client.revision=latest.revision;return true;});
  assert.deepEqual(attempts,[409,200],"first try loses the race, the automatic retry succeeds");
  assert.equal(response.status,200);
  const saved=await get();
  assert.equal(saved.revision,result.revision);
  const names=Object.fromEntries(saved.data.songs.map(s=>[s.id,s.name]));
  assert.equal(names["song-0"],"My new title","the person's edit is kept");
  assert.equal(names["song-2"],"Finished in background","the background song is kept");
  assert.equal(saved.data.songs.find(s=>s.id==="song-2").summary,"Saved by the server");
});

test("conflict retry happens once only, and only for save conflicts",async()=>{
  const reply=(status,body)=>({response:new Response(null,{status}),result:body});
  let calls=0;
  const twice=await api.saveWithConflictRetry(async()=>{calls++;return reply(409,{code:"save-conflict"});},async()=>true);
  assert.equal(calls,2);assert.equal(twice.response.status,409,"a second conflict is shown, never looped");
  calls=0;
  await api.saveWithConflictRetry(async()=>{calls++;return reply(409,{error:"Another song uses this recording"});},async()=>true);
  assert.equal(calls,1,"other 409s (e.g. delete protection) are not retried");
  calls=0;
  await api.saveWithConflictRetry(async()=>{calls++;return reply(409,{code:"save-conflict"});},async()=>false);
  assert.equal(calls,1,"if the newest copy can't load, nothing is resent");
  calls=0;
  await api.saveWithConflictRetry(async()=>{calls++;return reply(409,{code:"save-conflict"});},async()=>true,false);
  assert.equal(calls,1,"uploads and song creation are never retried automatically");
});

test("a stalled save is stopped by its time limit instead of hanging forever",async()=>{
  const started=Date.now(),keepAlive=setTimeout(()=>{},2000);
  const stalled=new Promise((_,reject)=>{const signal=AbortSignal.timeout(50);signal.addEventListener("abort",()=>reject(signal.reason));});
  await assert.rejects(stalled,error=>error instanceof DOMException&&error.name==="TimeoutError");
  clearTimeout(keepAlive);
  assert.ok(Date.now()-started<1000);
  const source=readFileSync("app/studio.tsx","utf8");
  assert.match(source,/librarySaveTimeoutMs = 60_000/);
  assert.match(source,/url === "\/api\/studio" && !init\.signal \? \{ \.\.\.init, signal: AbortSignal\.timeout\(librarySaveTimeoutMs\) \}/,"library saves get the time limit");
  assert.match(readFileSync("app/lyric-video-pro.tsx","utf8"),/signal: AbortSignal\.timeout\(60_000\)/,"video editor saves get the time limit");
});

test("volume slider shows only where the browser honours page volume",()=>{
  assert.equal(api.pageVolumeWorks(()=>({volume:1})),true,"desktop: volume can be set");
  const iphone={get volume(){return 1;},set volume(_){}};
  assert.equal(api.pageVolumeWorks(()=>iphone),false,"iPhone/iPad Safari: volume stays at 1");
});

test("abandoned private upload parts are cleaned after 7 days; recent, current and finished videos are untouched",async()=>{
  const root="private/video-uploads/owner/";
  const old="11111111-1111-4111-8111-111111111111",recent="22222222-2222-4222-8222-222222222222",current="33333333-3333-4333-8333-333333333333";
  const now=Date.now(),day=86400000;
  const objects=[
    {key:root+old+"/manifest",uploaded:new Date(now-9*day)},{key:root+old+"/0",uploaded:new Date(now-9*day)},{key:root+old+"/1",uploaded:new Date(now-8*day)},
    {key:root+recent+"/manifest",uploaded:new Date(now-9*day)},{key:root+recent+"/0",uploaded:new Date(now-1*day)},
    {key:root+current+"/manifest",uploaded:new Date(now-30*day)},
  ];
  const deleted=[];
  const store={async list({prefix}){assert.equal(prefix,root,"only the private upload area is listed");return {objects};},async delete(keys){deleted.push(...[keys].flat());}};
  assert.equal(await api.clearStaleVideoUploads(store,root,current,now),3);
  assert.deepEqual(deleted.sort(),[root+old+"/0",root+old+"/1",root+old+"/manifest"]);
  assert.ok(deleted.every(key=>key.startsWith(root)),"finished videos (lyric-assets/) are never touched");
  const broken={async list(){throw new Error("storage hiccup");},async delete(){}};
  assert.equal(await api.clearStaleVideoUploads(broken,root,null,now),0,"a cleanup problem never blocks a new upload");
});
