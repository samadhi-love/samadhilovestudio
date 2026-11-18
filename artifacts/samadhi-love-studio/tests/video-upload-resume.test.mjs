import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";
import {indexedDB} from "fake-indexeddb";
globalThis.indexedDB=indexedDB;
globalThis.FixedLengthStream=class extends TransformStream{constructor(){super();}};
const output="generated-artifacts/tests/video-upload-resume";mkdirSync(output,{recursive:true});
await build({entryPoints:["app/video-upload-client.ts","app/video-render-recovery.ts"],outdir:output,bundle:true,format:"esm",platform:"node",packages:"external",outExtension:{".js":".mjs"}});
await build({entryPoints:["app/api/studio/lyric-assets/route.ts"],outfile:output+"/route.mjs",bundle:true,format:"esm",platform:"node",plugins:[{name:"private-video-fixtures",setup(b){
 b.onResolve({filter:/.*/},a=>{
  if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fixture"};
  if(/studio-access$/.test(a.path))return {path:"access",namespace:"fixture"};
  if(/\/store$/.test(a.path))return {path:"store",namespace:"fixture"};
  if(/request-errors$/.test(a.path))return {path:"errors",namespace:"fixture"};
  if(/audio-response$/.test(a.path))return {path:"audio",namespace:"fixture"};
 });
 b.onLoad({filter:/.*/,namespace:"fixture"},a=>({loader:"js",contents:{
  storage:"export const serverStorage=new Proxy({}, {get:(_,key)=>globalThis.__videoResume.env[key]});",
  access:"export async function privateWorkspace(){return globalThis.__videoResume.owner?{id:globalThis.__videoResume.owner,role:'owner'}:null;}",
  store:"export const privateHeaders={'Cache-Control':'private,no-store'};export async function readStudio(){return {data:{songs:[{id:'song',audioId:'audio',audioFormat:'wav',audioHistory:[{audioId:'previous',audioFormat:'wav'}]}]},revision:0};}",
  errors:"export const recoverableRoute=f=>f;",
  audio:"export const serveAudio=()=>new Response('audio');",
 }[a.path]}));
}}]});
const route=await import("../"+output+"/route.mjs");
const recovery=await import("../"+output+"/video-render-recovery.mjs");
let reload=0;
const client=()=>import("../"+output+"/video-upload-client.mjs?reload="+(++reload));
function fixture(){
 const objects=new Map(),state=globalThis.__videoResume={owner:"owner-"+crypto.randomUUID(),objects,requests:[],failPart:null,failInit:false,loseCompletion:false,env:{}};
 state.env.BUCKET={
  async put(key,value,options={}){
   if(options.onlyIf?.etagDoesNotMatch==="*"&&objects.has(key))return null;
   const data=new Uint8Array(await new Response(value).arrayBuffer());
   const item={data,size:data.length,customMetadata:options.customMetadata??{},httpMetadata:options.httpMetadata??{}};
   objects.set(key,item);return {...item,key};
  },
  async get(key){const item=objects.get(key);return item?{...item,body:new Response(item.data).body,json:async()=>JSON.parse(new TextDecoder().decode(item.data))}:null;},
  async head(key){return objects.get(key)??null;},
  async delete(key){objects.delete(key);},
 };
 globalThis.fetch=async(url,init={})=>{
   const parsed=new URL(url,"https://studio.test");state.requests.push({query:parsed.searchParams,method:init.method??"GET",headers:new Headers(init.headers)});
   if(state.failPart!==null&&parsed.searchParams.get("part")===String(state.failPart))throw new TypeError("Offline connection interruption");
   const response=await route[init.method==="POST"?"POST":"GET"](new Request(parsed,{...init,headers:{...Object.fromEntries(new Headers(init.headers)),...(init.method==="POST"?{origin:parsed.origin}:{})}}));
   if(state.failInit&&parsed.searchParams.get("upload")==="init")throw new TypeError("Init response was lost");
   if(state.loseCompletion&&parsed.searchParams.get("complete")==="1")throw new TypeError("Completion response was lost");
   return response;
 };
 return state;
}
function video(tail="tail"){return new Blob(["a".repeat(8*1024*1024),tail],{type:"video/mp4;codecs=avc1.42001f"});}
const uploads=s=>[...s.objects.keys()].filter(k=>k.endsWith("/manifest"));
const partsSent=(s,index)=>s.requests.filter(r=>r.query.get("part")===String(index)).length;
test("explicit retry reuses the session and skips the immutable completed part",async()=>{
 const s=fixture(),c=await client(),blob=video();
 s.failPart=1;await assert.rejects(c.resumePrivateVideo("song",blob,undefined,"audio",s.owner),/Offline/);
 assert.equal(partsSent(s,0),1);assert.equal(uploads(s).length,1);
 s.failPart=null;const id=await c.resumePrivateVideo("song",blob,undefined,"audio",s.owner);
 assert.ok(id);assert.equal(partsSent(s,0),1);assert.equal(uploads(s).length,1);
 assert.equal(s.objects.get(`lyric-assets/${s.owner}/song/${id}`).size,blob.size);
});
test("reload uses persistent recovery and a cached finished render without retransmitting completed parts",async()=>{
 const s=fixture(),blob=video(),key=recovery.renderKey(s.owner,"song"),segments=recovery.segmentStore(key,"token","vertical");
 await recovery.saveRender(key,{fingerprint:"render",token:"token",completed:0});
 await segments.write(-1,blob);
 s.failPart=1;await assert.rejects((await client()).resumePrivateVideo("song",blob,undefined,"audio",s.owner));
 const saved=await recovery.readRender(key),restored=await recovery.segmentStore(key,saved.token,"vertical").read(-1);
 s.failPart=null;const id=await (await client()).resumePrivateVideo("song",restored,undefined,"audio",s.owner);
 assert.ok(id);assert.equal(partsSent(s,0),1);assert.equal(uploads(s).length,1);
 const requests=s.requests.length,again=await (await client()).resumePrivateVideo("song",restored,undefined,"audio",s.owner);
 assert.equal(again,id);assert.equal(s.requests.slice(requests).filter(r=>r.method==="POST").length,0);
});
test("same-size changed files get a different identity; changed parts cannot alter an existing session",async()=>{
 const s=fixture();s.failPart=1;
 await assert.rejects((await client()).resumePrivateVideo("song",video(),undefined,"audio",s.owner));
 const manifest=JSON.parse(new TextDecoder().decode(s.objects.get(uploads(s)[0]).data));
 s.failPart=null;
 const rejected=await route.POST(new Request(`https://studio.test/api/studio/lyric-assets?upload=${manifest.id}&part=1`,{method:"POST",headers:{origin:"https://studio.test","X-Song-Id":"song","X-Asset-Kind":"video","X-Asset-Size":String(manifest.size),"Content-Type":"video/mp4","X-Source-Audio-Id":"audio","X-Video-Fingerprint":manifest.fingerprint},body:"edit"}));
 assert.equal(rejected.status,409);
 await (await client()).resumePrivateVideo("song",video("edit"),undefined,"audio",s.owner);
 assert.equal(uploads(s).length,2);assert.equal(partsSent(s,0),2);
});
test("status is authenticated, account-scoped and recording-scoped",async()=>{
 const s=fixture();s.failPart=1;await assert.rejects((await client()).resumePrivateVideo("song",video(),undefined,"audio",s.owner));
 const owner=s.owner,manifest=JSON.parse(new TextDecoder().decode(s.objects.get(uploads(s)[0]).data));
 const url=`https://studio.test/api/studio/lyric-assets?song=song&source=audio&upload=${manifest.id}`;
 const headers={"X-Video-Fingerprint":manifest.fingerprint,"X-Studio-Workspace":owner};
 s.owner=null;assert.equal((await route.GET(new Request(url,{headers}))).status,401);
 s.owner="another-owner";assert.equal((await route.GET(new Request(url,{headers}))).status,409);
 assert.equal((await route.GET(new Request(url,{headers:{"X-Video-Fingerprint":manifest.fingerprint}}))).status,404);
 s.owner=owner;assert.equal((await route.GET(new Request(url.replace("source=audio","source=previous"),{headers}))).status,409);
 const response=await route.GET(new Request(url,{headers}));assert.equal(response.status,200);
 assert.deepEqual((await response.json()).parts,[0]);
});
test("lost init responses survive reload with the same session ID",async()=>{
 const s=fixture(),blob=new Blob(["small video"],{type:"video/mp4"});
 s.failInit=true;await assert.rejects((await client()).resumePrivateVideo("song",blob,undefined,"audio",s.owner));
 assert.equal(uploads(s).length,1);
 const before=uploads(s)[0];s.failInit=false;
 await (await client()).resumePrivateVideo("song",blob,undefined,"audio",s.owner);
 assert.equal(uploads(s).length,1);assert.equal(uploads(s)[0],before);
});
test("lost completion responses and subsequent reload return the one saved asset",async()=>{
 const s=fixture(),blob=new Blob(["small video"],{type:"video/mp4"});
 s.loseCompletion=true;await assert.rejects((await client()).resumePrivateVideo("song",blob,undefined,"audio",s.owner));
 assert.equal([...s.objects.keys()].filter(k=>k.startsWith("lyric-assets/")).length,1);
 s.loseCompletion=false;const before=s.requests.length;
 const id=await (await client()).resumePrivateVideo("song",blob,undefined,"audio",s.owner);
 assert.ok(id);assert.equal(s.requests.slice(before).filter(r=>r.method==="POST").length,0);
 assert.equal([...s.objects.keys()].filter(k=>k.startsWith("lyric-assets/")).length,1);
});
test("a stale signed-in account cannot start or resume the original owner's upload",async()=>{
 const s=fixture(),originalOwner=s.owner;
 s.owner="different-owner";
 await assert.rejects((await client()).resumePrivateVideo("song",new Blob(["video"],{type:"video/mp4"}),undefined,"audio",originalOwner),/account changed/);
 assert.equal(uploads(s).length,0);
});
test("main export supplies its original account and reuses the existing render checkpoint",()=>{
 const source=readFileSync("app/lyric-video-pro.tsx","utf8");
 assert.match(source,/pro\.sourceAudioId,\s+undefined,\s+owner,/);
 assert.match(source,/segments\.read\(-1\)/);assert.match(source,/segments\.write\(-1,result\.blob\)/);
});
