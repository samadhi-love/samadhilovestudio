// Legacy saving keeps a whole library in one D1 row, and D1 rejects any row
// over 2,000,000 bytes. Drives the real PUT/GET routes, store and drizzle code
// on SQLite with every migration applied; the fixture D1 enforces that limit.
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync,readdirSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";

const D1_MAX=2_000_000;
const directory="generated-artifacts/tests/legacy-storage-limit";
mkdirSync(directory,{recursive:true});
globalThis.__storageLimit={};
await build({stdin:{contents:`
export {GET,PUT} from "./app/api/studio/route";
export {recoverableRoute} from "./app/api/studio/request-errors";
export {StorageFullError,maxLegacyRowBytes} from "./app/api/studio/storage-full";
export {emptyCreatorStudio,freshSong} from "./app/studio-data";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/routes.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"error",plugins:[{name:"storage-limit",setup(b){
  b.onResolve({filter:/.*/},a=>{
    if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fx"};
    if(/studio-access$/.test(a.path))return {path:"access",namespace:"fx"};
  });
  b.onLoad({filter:/.*/,namespace:"fx"},a=>({loader:"js",contents:{
    storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__storageLimit.env[k]});",
    access:"export const privateWorkspace=async()=>globalThis.__storageLimit.access;export const studioAccess=async()=>globalThis.__storageLimit.access??{role:'none'};",
  }[a.path]}));
}}]});
const api=await import(`../${directory}/routes.mjs`);

const tooBig=()=>new Error("D1_ERROR: string or blob too big: SQLITE_TOOBIG");
function d1(){
  const sql=new DatabaseSync(":memory:");
  for(const file of readdirSync("drizzle").filter(f=>f.endsWith(".sql")).sort())
    for(const statement of readFileSync(`drizzle/${file}`,"utf8").split("--> statement-breakpoint"))if(statement.trim())sql.exec(statement);
  const prepare=(query,params=[])=>({
    bind:(...values)=>{
      const fail=values.some(v=>typeof v==="string"&&Buffer.byteLength(v)>D1_MAX);
      const next=prepare(query,values.map(v=>v===undefined?null:typeof v==="boolean"?Number(v):v));
      return fail?{...next,all:()=>Promise.reject(tooBig()),first:()=>Promise.reject(tooBig()),run:()=>Promise.reject(tooBig()),raw:()=>Promise.reject(tooBig())}:next;
    },
    async all(){return {results:sql.prepare(query).all(...params),success:true,meta:{}};},
    async first(column){const row=sql.prepare(query).get(...params);return row?(column?row[column]:row):null;},
    async run(){return {success:true,meta:{changes:Number(sql.prepare(query).run(...params).changes)}};},
    async raw(){const s=sql.prepare(query);s.setReturnArrays(true);return s.all(...params);},
  });
  return {sql,prepare};
}
function bucket(){
  const objects=new Map();
  return {
    async put(key,value,o={}){if(o.onlyIf?.etagDoesNotMatch==="*"&&objects.has(key))return null;const bytes=new Uint8Array(await new Response(value).arrayBuffer());const obj={key,size:bytes.length,etag:crypto.randomUUID()};objects.set(key,{...obj,bytes});return obj;},
    async head(key){return objects.get(key)??null;},
    async get(key){const o=objects.get(key);return o?{...o,json:async()=>JSON.parse(new TextDecoder().decode(o.bytes))}:null;},
    async list({prefix=""}={}){return {objects:[...objects.values()].filter(o=>o.key.startsWith(prefix)),truncated:false};},
    async delete(){throw new Error("No deletes expected.");},
  };
}
function fixture(){
  globalThis.__storageLimit={access:{id:"owner",role:"owner"},env:{DB:d1(),BUCKET:bucket(),STUDIO_ROW_STORAGE:"legacy"}};
  return globalThis.__storageLimit.env;
}
const put=body=>api.PUT(new Request("https://studio.test/api/studio",{method:"PUT",
  headers:{origin:"https://studio.test","Content-Type":"application/json","X-Studio-Workspace":"owner"},body:JSON.stringify(body)}));
const library=(count,lyricsBytes)=>{
  const lyrics="Morning light across the sea, a little hope awakens me.\n".repeat(Math.ceil(lyricsBytes/56));
  return {...structuredClone(api.emptyCreatorStudio),songs:Array.from({length:count},(_,i)=>{const s=api.freshSong(crypto.randomUUID(),`Song ${i}`,i);s.notes.lyrics=lyrics;return s;})};
};
const bytes=value=>Buffer.byteLength(JSON.stringify(value));

test("the legacy guard sits below D1's 2,000,000-byte row limit",()=>{
  assert.ok(api.maxLegacyRowBytes<D1_MAX);
});
test("a library past the row limit is refused with a clear 413 and nothing is written",async()=>{
  const env=fixture();
  const data=library(60,35_000);
  assert.ok(bytes(data)>D1_MAX);
  const response=await put({data,revision:0});
  const body=await response.json();
  console.log(`  ${(bytes(data)/1e6).toFixed(2)} MB library → HTTP ${response.status}: ${body.error}`);
  assert.equal(response.status,413);
  assert.match(body.error,/storage limit/);
  assert.match(body.error,/existing songs are safe/);
  assert.equal(env.DB.sql.prepare("select count(*) as n from studios").get().n,0);
});
test("a library just under the guard still saves and reopens",async()=>{
  fixture();
  const data=library(50,35_000);
  assert.ok(bytes(data)<api.maxLegacyRowBytes);
  const response=await put({data,revision:0});
  assert.equal(response.status,200,await response.clone().text());
  const opened=await (await api.GET(new Request("https://studio.test/api/studio"))).json();
  assert.equal(opened.data.songs.length,50);
});
test("every route wrapped by recoverableRoute reports a full library as 413, not a retryable 503",async()=>{
  const route=api.recoverableRoute(async()=>{throw new api.StorageFullError();},"fallback");
  const response=await route();
  assert.equal(response.status,413);
  assert.match((await response.json()).error,/storage limit/);
});
