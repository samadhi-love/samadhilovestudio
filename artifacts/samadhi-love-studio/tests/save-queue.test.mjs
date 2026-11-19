// H1: a save that arrives while another is in flight must wait, not vanish,
// and must be replayed on top of the earlier save instead of undoing it.
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";

const directory="generated-artifacts/tests/save-queue";
mkdirSync(directory,{recursive:true});
globalThis.__saveQueue={};
await build({stdin:{contents:`
export {createSaveQueue} from "./app/save-queue";
export {rebaseStudio} from "./app/song-save-merge";
export {GET,PUT} from "./app/api/studio/route";
export {emptyCreatorStudio,freshSong} from "./app/studio-data";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/bundle.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"error",plugins:[{name:"save-queue",setup(b){
  b.onResolve({filter:/.*/},a=>{
    if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fx"};
    if(/studio-access$/.test(a.path))return {path:"access",namespace:"fx"};
  });
  b.onLoad({filter:/.*/,namespace:"fx"},a=>({loader:"js",contents:{
    storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__saveQueue.env[k]});",
    access:"export const privateWorkspace=async()=>({id:'owner',role:'owner'});export const studioAccess=async()=>({id:'owner',role:'owner'});",
  }[a.path]}));
}}]});
const api=await import(`../${directory}/bundle.mjs`);
const tick=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test("a second save queued during the first runs afterwards instead of being dropped",async()=>{
  const enqueue=api.createSaveQueue(()=>false,1),order=[];
  const first=enqueue(async()=>{order.push("first:start");await tick(20);order.push("first:end");return 1;});
  const second=enqueue(async()=>{order.push("second");return 2;});
  assert.deepEqual(await Promise.all([first,second]),[1,2]);
  assert.deepEqual(order,["first:start","first:end","second"]);
});
test("a queued save is built when it runs, so it sees the newest revision",async()=>{
  const enqueue=api.createSaveQueue(()=>false,1);let revision=1;const sent=[];
  const send=()=>enqueue(async()=>{sent.push(revision);await tick(5);revision++;});
  await Promise.all([send(),send(),send()]);
  assert.deepEqual(sent,[1,2,3]);
});
test("a failed save does not block the saves queued behind it",async()=>{
  const enqueue=api.createSaveQueue(()=>false,1);
  const failed=enqueue(async()=>{throw new Error("network down");});
  const next=enqueue(async()=>"saved");
  await assert.rejects(failed,/network down/);
  assert.equal(await next,"saved");
});
test("a queued save waits while an editor's own save is still running",async()=>{
  let editorBusy=true;const enqueue=api.createSaveQueue(()=>editorBusy,2);let ran=false;
  const run=enqueue(async()=>{ran=true;});
  await tick(15);assert.equal(ran,false);
  editorBusy=false;await run;assert.equal(ran,true);
});

const songs=()=>[0,1,2].map(i=>api.freshSong(`song-${i}`,`Song ${i}`,i));
const studio=list=>({...structuredClone(api.emptyCreatorStudio),songs:list});
test("rebase keeps both edits when two different songs were changed from the same starting point",()=>{
  const base=studio(songs());
  const first={...base,songs:base.songs.map(s=>s.id==="song-0"?{...s,name:"Renamed A"}:s)};
  const second={...base,songs:base.songs.map(s=>s.id==="song-1"?{...s,name:"Renamed B"}:s)};
  const merged=api.rebaseStudio(base,second,first);
  assert.deepEqual(merged.songs.map(s=>s.name),["Renamed A","Renamed B","Song 2"]);
});
test("rebase keeps a newer field on the same song that this edit did not touch",()=>{
  const base=studio(songs());
  const latest={...base,songs:base.songs.map(s=>s.id==="song-0"?{...s,audioId:"new-audio",audioFormat:"mp3"}:s)};
  const edit={...base,songs:base.songs.map(s=>s.id==="song-0"?{...s,name:"New title"}:s)};
  const song=api.rebaseStudio(base,edit,latest).songs.find(s=>s.id==="song-0");
  assert.equal(song.name,"New title");
  assert.equal(song.audioId,"new-audio");
});
test("rebase carries added songs, removed songs and top-level settings",()=>{
  const base=studio(songs());
  const latest={...base,songs:base.songs.map(s=>s.id==="song-2"?{...s,name:"Edited elsewhere"}:s)};
  const added=api.freshSong("song-new","Fresh",3);
  const edit={...base,autoSavePrompts:true,songs:[added,...base.songs.filter(s=>s.id!=="song-1")]};
  const merged=api.rebaseStudio(base,edit,latest);
  assert.deepEqual(merged.songs.map(s=>s.id),["song-new","song-0","song-2"]);
  assert.equal(merged.songs.find(s=>s.id==="song-2").name,"Edited elsewhere");
  assert.equal(merged.autoSavePrompts,true);
});
test("rebase is a no-op when nothing was saved in between",()=>{
  const base=studio(songs()),edit={...base,autoSavePrompts:true};
  assert.equal(api.rebaseStudio(base,edit,base),edit);
});

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
test("two quick edits through the real save route both land, with no conflict and nothing undone",async()=>{
  globalThis.__saveQueue={env:{DB:d1(),BUCKET:bucket(),STUDIO_ROW_STORAGE:"legacy"}};
  const put=body=>api.PUT(new Request("https://studio.test/api/studio",{method:"PUT",
    headers:{origin:"https://studio.test","Content-Type":"application/json","X-Studio-Workspace":"owner"},body:JSON.stringify(body)}));
  const first=await put({data:studio(songs()),revision:0});
  assert.equal(first.status,200,await first.clone().text());
  // The Studio's client state, as studio.tsx keeps it in refs.
  const opened=await (await api.GET(new Request("https://studio.test/api/studio"))).json();
  const client={data:opened.data,revision:opened.revision};
  const enqueue=api.createSaveQueue(()=>false,1),statuses=[];
  // Same steps as commit(): remember the starting point, build the payload when the save runs.
  const commit=change=>{
    const latest=client.data,next=change(latest);let payload;
    const prepared=()=>payload??=client.data===latest?next:api.rebaseStudio(latest,next,client.data);
    return enqueue(async()=>{
      const response=await put({data:prepared(),revision:client.revision});
      statuses.push(response.status);
      const result=await response.json();
      if(response.ok){client.data=result.data;client.revision=result.revision;}
    });
  };
  await Promise.all([
    commit(d=>({...d,songs:d.songs.map(s=>s.id==="song-0"?{...s,name:"First edit"}:s)})),
    commit(d=>({...d,songs:d.songs.map(s=>s.id==="song-1"?{...s,name:"Second edit"}:s)})),
  ]);
  assert.deepEqual(statuses,[200,200]);
  const saved=await (await api.GET(new Request("https://studio.test/api/studio"))).json();
  console.log(`  saved names after two quick edits: ${saved.data.songs.map(s=>s.name).join(", ")} (revision ${saved.revision})`);
  assert.deepEqual(saved.data.songs.map(s=>s.name),["First edit","Second edit","Song 2"]);
  assert.equal(saved.revision,3);
});

// H2: callers build saves from the render-time copy (`data`). When something
// newer was saved in the meantime, commit() must replay only this edit's
// changes on top of the newest copy, never send the older copy back.
test("a save built from the on-screen copy does not undo a newer saved change",async()=>{
  globalThis.__saveQueue={env:{DB:d1(),BUCKET:bucket(),STUDIO_ROW_STORAGE:"legacy"}};
  const put=body=>api.PUT(new Request("https://studio.test/api/studio",{method:"PUT",
    headers:{origin:"https://studio.test","Content-Type":"application/json","X-Studio-Workspace":"owner"},body:JSON.stringify(body)}));
  const read=async()=>(await api.GET(new Request("https://studio.test/api/studio"))).json();
  await put({data:studio(songs()),revision:0});
  const onScreen=(await read()).data;                       // `data` for this render
  const ref={data:onScreen,revision:1};                      // dataRef / revisionRef
  // The lyric editor saves song-0 (studio.tsx:643); the refs update before React re-renders.
  const job=await put({data:{...onScreen,songs:onScreen.songs.map(s=>s.id==="song-0"?{...s,notes:{...s.notes,lyrics:"Lyrics saved by the lyric editor"}}:s)},revision:1});
  const jobResult=await job.json();ref.data=jobResult.data;ref.revision=jobResult.revision;
  // saveSong(song-1) from the still-mounted render: built from `onScreen`.
  const next={...onScreen,songs:onScreen.songs.map(s=>s.id==="song-1"?{...s,name:"Edited title"}:s)};
  const base=onScreen;
  const payload=ref.data===base?next:api.rebaseStudio(base,next,ref.data);   // commit() after the fix
  const response=await put({data:payload,revision:ref.revision});
  assert.equal(response.status,200,await response.clone().text());
  const saved=(await read()).data;
  const s0=saved.songs.find(s=>s.id==="song-0"),s1=saved.songs.find(s=>s.id==="song-1");
  console.log(`  after fix: song-0 lyrics="${s0.notes.lyrics}", song-1 name="${s1.name}"`);
  assert.equal(s0.notes.lyrics,"Lyrics saved by the lyric editor");
  assert.equal(s1.name,"Edited title");
});
