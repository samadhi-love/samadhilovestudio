// H3: a save sends only what changed; the server rebuilds the full library
// from its stored copy and validates it exactly like a full save. Also checks
// the per-save database reads and storage round-trips the server makes.
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";

const directory="generated-artifacts/tests/studio-changes";
mkdirSync(directory,{recursive:true});
globalThis.__changes={};
await build({stdin:{contents:`
export {studioChanges,applyStudioChanges,canSendChanges,isStudioChanges} from "./app/studio-changes";
export {GET,PUT} from "./app/api/studio/route";
export {emptyCreatorStudio,freshSong} from "./app/studio-data";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/bundle.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"error",plugins:[{name:"studio-changes",setup(b){
  b.onResolve({filter:/.*/},a=>{
    if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fx"};
    if(/studio-access$/.test(a.path))return {path:"access",namespace:"fx"};
  });
  b.onLoad({filter:/.*/,namespace:"fx"},a=>({loader:"js",contents:{
    storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__changes.env[k]});",
    access:"export const privateWorkspace=async()=>({id:'owner',role:'owner'});export const studioAccess=async()=>({id:'owner',role:'owner'});",
  }[a.path]}));
}}]});
const api=await import(`../${directory}/bundle.mjs`);

const library=(count,lyrics="Morning light across the sea\n".repeat(200))=>({...structuredClone(api.emptyCreatorStudio),
  songs:Array.from({length:count},(_,i)=>{const s=api.freshSong(`song-${i}`,`Song ${i}`,i);s.notes.lyrics=lyrics;return s;})});

test("only the edited song and changed settings are included",()=>{
  const saved=library(5),next=structuredClone(saved);
  next.songs[2].name="Renamed";next.autoSavePrompts=true;
  const changes=api.studioChanges(saved,next);
  assert.deepEqual(changes.songs.map(s=>s.id),["song-2"]);
  assert.deepEqual(changes.fields,{autoSavePrompts:true});
  assert.deepEqual(changes.unset,[]);
});
test("applying the changes to the stored copy rebuilds exactly the edited library",()=>{
  const saved=library(4);saved.autoSavePrompts=true;
  const cases=[
    s=>{s.songs[0].notes.lyrics="new words";},
    s=>{s.songs.unshift(api.freshSong("song-new","Fresh",9));},
    s=>{s.songs[3].deletedAt=new Date(0).toISOString();},
    s=>{delete s.autoSavePrompts;s.folders=[{id:"f1",name:"Live"}];},
    ()=>{},
  ];
  for(const edit of cases){
    const next=structuredClone(saved);edit(next);
    assert.ok(api.canSendChanges(saved,next));
    assert.deepEqual(api.applyStudioChanges(structuredClone(saved),api.studioChanges(saved,next)),next);
  }
});
test("anything a changes-only save cannot express falls back to a full save",()=>{
  const saved=library(3);
  const reordered={...saved,songs:[saved.songs[1],saved.songs[0],saved.songs[2]]};
  const removed={...saved,songs:saved.songs.slice(1)};
  const newInMiddle={...saved,songs:[saved.songs[0],api.freshSong("x","X",5),...saved.songs.slice(1)]};
  const rowStorage={...saved,_storage:{songs:{}}};
  for(const next of [reordered,removed,newInMiddle,rowStorage])assert.equal(api.canSendChanges(saved,next),false);
});
test("malformed or prototype-polluting change sets are rejected",()=>{
  for(const bad of [null,[],{},{songs:{},fields:{},unset:[]},{songs:[{}],fields:{},unset:[]},{songs:[],fields:[],unset:[]},
    {songs:[],fields:{songs:[]},unset:[]},{songs:[],fields:JSON.parse('{"__proto__":{"x":1}}'),unset:[]},{songs:[],fields:{},unset:["songs"]},{songs:[],fields:{},unset:[1]}])
    assert.equal(api.isStudioChanges(bad),false,JSON.stringify(bad));
  assert.equal(api.isStudioChanges({songs:[],fields:{},unset:[]}),true);
});

function d1(log){
  const sql=new DatabaseSync(":memory:");
  for(const file of readdirSync("drizzle").filter(f=>f.endsWith(".sql")).sort())
    for(const statement of readFileSync(`drizzle/${file}`,"utf8").split("--> statement-breakpoint"))if(statement.trim())sql.exec(statement);
  const prepare=(query,params=[])=>({
    bind:(...values)=>prepare(query,values.map(v=>v===undefined?null:typeof v==="boolean"?Number(v):v)),
    async all(){log.push(query);return {results:sql.prepare(query).all(...params),success:true,meta:{}};},
    async first(column){log.push(query);const row=sql.prepare(query).get(...params);return row?(column?row[column]:row):null;},
    async run(){log.push(query);return {success:true,meta:{changes:Number(sql.prepare(query).run(...params).changes)}};},
    async raw(){log.push(query);const s=sql.prepare(query);s.setReturnArrays(true);return s.all(...params);},
  });
  return {prepare};
}
function bucket(calls){
  const objects=new Map();
  return {
    async put(key,value,o={}){calls.push("put");if(o.onlyIf?.etagDoesNotMatch==="*"&&objects.has(key))return null;const obj={key,etag:crypto.randomUUID()};objects.set(key,obj);return obj;},
    async head(key){calls.push("head");return objects.get(key)??null;},async get(){return null;},
    async list(){return {objects:[],truncated:false};},async delete(){throw new Error("No deletes expected.");},
  };
}
function server(){
  const queries=[],storage=[];
  globalThis.__changes={env:{DB:d1(queries),BUCKET:bucket(storage),STUDIO_ROW_STORAGE:"legacy"}};
  const send=body=>{const text=JSON.stringify(body);return {bytes:Buffer.byteLength(text),response:api.PUT(new Request("https://studio.test/api/studio",{method:"PUT",
    headers:{origin:"https://studio.test","Content-Type":"application/json","X-Studio-Workspace":"owner"},body:text}))};};
  const read=async()=>(await api.GET(new Request("https://studio.test/api/studio"))).json();
  return {queries,storage,send,read};
}

test("editing one song in a 50-song library sends a small request and saves the same result as a full save",async()=>{
  const s=server();
  assert.equal((await s.send({data:library(50),revision:0}).response).status,200);
  const confirmed=await s.read();
  const next=structuredClone(confirmed.data);next.songs[7].name="Only this changed";
  const full=JSON.stringify({data:next,revision:confirmed.revision});
  const {bytes,response}=s.send({changes:api.studioChanges(confirmed.data,next),revision:confirmed.revision});
  const result=await (await response).json();
  console.log(`  request size: full library ${(Buffer.byteLength(full)/1024).toFixed(0)} KB → changes only ${(bytes/1024).toFixed(1)} KB`);
  assert.equal(result.revision,2);
  assert.ok(bytes*20<Buffer.byteLength(full));
  const saved=await s.read();
  assert.equal(saved.data.songs.length,50);
  assert.equal(saved.data.songs[7].name,"Only this changed");
  assert.deepEqual(saved.data.songs.filter((_,i)=>i!==7).map(x=>x.notes.lyrics),confirmed.data.songs.filter((_,i)=>i!==7).map(x=>x.notes.lyrics));
});
test("a changes-only save from an old revision is refused as a conflict",async()=>{
  const s=server();
  await s.send({data:library(3),revision:0}).response;
  const confirmed=await s.read();
  const next=structuredClone(confirmed.data);next.songs[0].name="A";
  assert.equal((await s.send({changes:api.studioChanges(confirmed.data,next),revision:confirmed.revision}).response).status,200);
  next.songs[1].name="B";
  assert.equal((await s.send({changes:api.studioChanges(confirmed.data,next),revision:confirmed.revision}).response).status,409);
});
test("changes-only saves get the same validation as full saves",async()=>{
  const s=server();
  await s.send({data:library(3),revision:0}).response;
  const confirmed=await s.read();
  const badLyricVideo=structuredClone(confirmed.data);badLyricVideo.songs[0].lyricVideo={not:"a lyric project"};
  const full=await (await s.send({data:badLyricVideo,revision:1}).response);
  const delta=await (await s.send({changes:api.studioChanges(confirmed.data,badLyricVideo),revision:1}).response);
  assert.equal(delta.status,full.status);
  assert.equal((await delta.json()).error,(await full.json()).error);
  for(const changes of [{songs:"x"},{songs:[],fields:{__proto__:1},unset:"songs"}])
    assert.equal((await s.send({changes,revision:1}).response).status,400);
  assert.equal((await s.read()).revision,1);
});
test("changes-only saves are refused when per-song row storage is active",async()=>{
  const s=server();globalThis.__changes.env.STUDIO_ROW_STORAGE="verified";
  assert.equal((await s.send({changes:{songs:[],fields:{},unset:[]},revision:0}).response).status,400);
});
test("each save reads the stored library once and stops re-checking backups once they exist",async()=>{
  const s=server();
  await s.send({data:library(10),revision:0}).response;
  let confirmed=await s.read();
  const perSave=[];
  for(let i=0;i<5;i++){
    const next=structuredClone(confirmed.data);next.songs[0].name=`Edit ${i}`;
    s.queries.length=0;s.storage.length=0;
    const response=await s.send({changes:api.studioChanges(confirmed.data,next),revision:confirmed.revision}).response;
    assert.equal(response.status,200);
    perSave.push({reads:s.queries.filter(q=>/select/i.test(q)&&/"studios"/.test(q)).length,heads:s.storage.filter(c=>c==="head").length});
    confirmed=await s.read();
  }
  console.log(`  per save (library reads incl. response, backup checks): ${perSave.map(p=>`${p.reads}/${p.heads}`).join("  ")}`);
  assert.ok(perSave.slice(1).every(p=>p.heads===0),"backup existence is re-checked on every save");
  assert.ok(perSave.every(p=>p.reads<=2),"the stored library is read more than once before writing");
});
