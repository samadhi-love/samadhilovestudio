import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import React from "react";

const directory="generated-artifacts/tests/ace-step";
mkdirSync(directory,{recursive:true});
globalThis.__ace={};
await build({stdin:{contents:`
export {POST as create} from "./app/api/studio/create/route";
export {GET as settings,PUT as choose} from "./app/api/studio/music-engine/route";
export {falSongInput,generateFal,downloadFalAudio,FalRejected} from "./app/server/fal-music";
export {emptyCreatorStudio} from "./app/studio-data";
export {MusicEngineSettings} from "./app/music-engine-settings";
export {jobExecution} from "./app/credits/production";
`,resolveDir:process.cwd(),loader:"ts"},bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic",outfile:`${directory}/api.mjs`,plugins:[{name:"offline-fal",setup(b){
  b.onResolve({filter:/.*/},a=>{
    if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fake"};
    if(/studio-access$/.test(a.path))return {path:"auth",namespace:"fake"};
    if(/\/store$/.test(a.path))return {path:"store",namespace:"fake"};
    if(/credits\/production$/.test(a.path))return {path:"credits",namespace:"fake"};
    if(/elevenlabs\/vault$/.test(a.path))return {path:"vault",namespace:"fake"};
    if(/elevenlabs\/provider$/.test(a.path))return {path:"eleven",namespace:"fake"};
    if(/ai-provider$/.test(a.path))return {path:"fal",namespace:"fake"};
  });
  b.onLoad({filter:/.*/,namespace:"fake"},a=>({loader:"js",contents:{
    storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__ace.env[k]});",
    auth:"export const privateWorkspace=async()=>globalThis.__ace.access;",
    store:`export const privateHeaders={"Cache-Control":"private,no-store"};export const maxStudioBytes=1500000;export const audioKey=(o,a)=>"songs/"+o+"/"+a;
      export const readStudio=async()=>structuredClone(globalThis.__ace.studio);
      export async function writeStudio(owner,revision,text){const s=globalThis.__ace;if(s.writeConflict||revision!==s.studio.revision)return null;s.studio={data:JSON.parse(text),revision:revision+1};return {revision:revision+1};}`,
    credits:"export const jobExecution=new WeakMap();export const withProductionUsage=f=>f;export const managedProviderKey=()=>null;",
    vault:"export const resolveElevenLabsKey=async()=>globalThis.__ace.elevenKey;",
    eleven:`export const musicModel="music_v2_5";export const elevenLabsFailureMessage=async()=>"ElevenLabs rejected";
      export async function elevenLabsRequest(key,path,payload){const s=globalThis.__ace;s.eleven.push({path,payload});return path==="music/plan"?Response.json({chunks:[{text:"[Verse]\\nLight upon the sea",duration_ms:30000}]}):new Response("ID3fixture MP3 audio",{headers:{"Content-Type":"audio/mpeg"}});}`,
    fal:`export async function falRequest(key,path,init={}){const s=globalThis.__ace;s.fal.push({path,method:init.method??"GET",input:init.body?JSON.parse(init.body):undefined});
      if(init.method==="POST"){if(s.networkFailure)throw new TypeError("network reset");if(s.submitStatus)return new Response("",{status:s.submitStatus});return Response.json({request_id:"request-123"});}
      if(path.endsWith("/status"))return Response.json({status:s.queueState??"COMPLETED"});
      if(s.resultFailure)return new Response("",{status:503});
      return Response.json({audios:Array.from({length:s.outputs??2},(_,i)=>({audio:{url:"https://fal.media/take-"+i+".flac"}}))});}
      export async function falMediaRequest(url){const s=globalThis.__ace;s.downloads.push(url);if(s.downloadFailure)return new Response("",{status:503});return new Response("fLaCsynthetic offline audio bytes",{headers:{"Content-Type":"audio/flac"}});}`,
  }[a.path]}));
}}]});
const api=await import(`../${directory}/api.mjs`);
function fixture(overrides={}){
  const objects=new Map();
  const state=globalThis.__ace={access:{id:"owner",role:"owner"},env:{FAL_KEY:"offline-fal-fixture"},studio:{data:structuredClone(api.emptyCreatorStudio),revision:0},elevenKey:"offline-eleven-fixture",fal:[],eleven:[],downloads:[],...overrides};
  state.env.BUCKET={
    async put(key,value,options={}){
      if(state.mediaFailure&&key.startsWith("songs/"))throw new Error("R2 unavailable");
      const bytes=await new Response(value).arrayBuffer();
      const item={key,size:bytes.byteLength,etag:crypto.randomUUID(),...options};
      objects.set(key,{...item,json:async()=>JSON.parse(new TextDecoder().decode(bytes))});return item;
    },
    async get(key){return objects.get(key)??null;},async head(key){return objects.get(key)??null;},
    async list({prefix}){return {objects:[...objects.values()].filter(item=>item.key.startsWith(prefix)),truncated:false};},
    async delete(){throw new Error("This test must never delete stored work.");},
  };
  return {state,objects};
}
const input={action:"song",title:"Light",prompt:"Hopeful soul with piano",lyrics:"[Verse]\nLight upon the sea\n[Chorus]\nCome back home to me",duration:30,arrangement:"",voice:"female soul",genres:"soul",instruments:"piano"};
const request=(body=input)=>new Request("https://studio.test/api/studio/create",{method:"POST",headers:{"Content-Type":"application/json",origin:"https://studio.test"},body:JSON.stringify(body)});
test("owner defaults to thinking ACE-Step; two outputs save as private FLAC takes with completed receipts",async()=>{
  const {state,objects}=fixture();
  const response=await api.create(request()),body=await response.json();
  assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.songIds.length,2);
  assert.equal(state.eleven.length,0);assert.equal(state.fal.filter(c=>c.method==="POST").length,1);
  const paid=state.fal[0].input;assert.equal(paid.num_outputs,2);assert.equal(paid.thinking,true);assert.equal(paid.duration,30);assert.equal(paid.vocal_language,"en");assert.equal(paid.enable_safety_checker,true);
  const songs=state.studio.data.songs;assert.equal(songs.length,2);assert.equal(songs[0].projectId,songs[1].id);
  for(const song of songs){assert.equal(song.audioFormat,"flac");assert.equal(song.generation.provider,"fal.ai");assert.equal(song.generation.providerRequestId,"request-123");assert.equal(song.creationDraft,false);assert.equal(song.notes.lyrics,input.lyrics);}
  for(const [key,item] of objects){if(key.startsWith("songs/"))assert.equal(item.httpMetadata.contentType,"audio/flac");if(key.startsWith("private/recovery/"))assert.equal((await item.json()).done,true);}
  assert.equal(JSON.stringify(state.studio).includes("https://fal.media"),false);
});
test("one take works; explicit selected language wins over Spanish in description",async()=>{
  const {state}=fixture();const response=await api.create(request({...input,versions:1,language:"ar",selected:true,languagePrompt:"sung in Spanish"}));
  assert.equal(response.status,200);assert.equal((await response.json()).songIds.length,1);assert.equal(state.fal[0].input.vocal_language,"ar");
});
test("description language uses the existing full catalog and Auto length uses the existing planner",async()=>{
  const {state}=fixture();const response=await api.create(request({...input,language:"auto",selected:false,languagePrompt:"sing in Yoruba",autoLength:true}));
  assert.equal(response.status,200);assert.equal(state.fal[0].input.vocal_language,"yo");assert.ok(state.fal[0].input.duration>=10&&state.fal[0].input.duration<=360);
});
test("missing fal configuration falls back to personal ElevenLabs with a calm note",async()=>{
  const {state}=fixture({env:{}});const response=await api.create(request());const body=await response.json();
  assert.equal(response.status,200);assert.match(body.engineNotice,/Using your ElevenLabs/);assert.equal(state.fal.length,0);assert.equal(state.eleven.length,1);
});
test("non-owner cannot select or spend the owner's fal key",async()=>{
  const {state}=fixture({access:{id:"creator",role:"creator"}});
  const response=await api.create(request({...input,engine:"ace-step",versions:2}));
  assert.equal(response.status,403);assert.equal(state.fal.length,0);
  assert.equal((await (await api.settings()).json()).engine,"elevenlabs");
  assert.equal((await api.choose(new Request("https://studio.test/api/studio/music-engine",{method:"PUT",headers:{origin:"https://studio.test"},body:'{\"engine\":\"ace-step\"}'}))).status,403);
});
test("owner engine preference persists; cross-origin changes cannot write",async()=>{
  fixture();let response=await api.choose(new Request("https://studio.test/api/studio/music-engine",{method:"PUT",headers:{origin:"https://studio.test"},body:'{\"engine\":\"elevenlabs\"}'}));
  assert.equal(response.status,200);assert.equal((await(await api.settings()).json()).engine,"elevenlabs");
  response=await api.choose(new Request("https://studio.test/api/studio/music-engine",{method:"PUT",headers:{origin:"https://foreign.test"},body:'{\"engine\":\"ace-step\"}'}));assert.equal(response.status,403);
});
test("a definite rejected submission can use backup; only one audio generation is accepted",async()=>{
  const {state}=fixture({submitStatus:401});const response=await api.create(request());
  assert.equal(response.status,200);assert.equal(state.fal.filter(c=>c.method==="POST").length,1);assert.equal(state.eleven.length,1);assert.match((await response.json()).engineNotice,/could not accept/);
});
for(const scenario of [{submitStatus:503},{networkFailure:true},{resultFailure:true}]){
  test(`uncertain fal failure never replays or automatically calls ElevenLabs: ${JSON.stringify(scenario)}`,async()=>{
    const {state}=fixture(scenario);const response=await api.create(request());
    assert.equal(response.status,502);assert.equal(state.fal.filter(c=>c.method==="POST").length,1);assert.equal(state.eleven.length,0);
    assert.equal(state.studio.data.songs[0].creationDraft,true);assert.equal(state.studio.data.songs[0].notes.lyrics,input.lyrics);
  });
}
test("partial two-output result keeps the first take and reports the missing one without replay",async()=>{
  const {state}=fixture({outputs:1});const response=await api.create(request()),body=await response.json();
  assert.equal(response.status,200);assert.equal(body.songIds.length,1);assert.match(body.warning,/fewer takes/);assert.equal(state.fal.filter(c=>c.method==="POST").length,1);
});
test("private downloads remain recoverable after final library conflicts",async()=>{
  const {state,objects}=fixture();
  const original=state.env.BUCKET.put;
  state.env.BUCKET.put=async(...args)=>{const result=await original(...args);if(args[0].startsWith("songs/"))state.writeConflict=true;return result;};
  const response=await api.create(request());assert.equal(response.status,502);
  assert.equal([...objects.keys()].filter(k=>k.startsWith("songs/")).length,2);
  assert.equal([...objects.keys()].filter(k=>k.startsWith("private/recovery/")).length,2);
});
test("unconnected automatic lyric writer does not silently return an instrumental",async()=>{
  const {state}=fixture({elevenKey:null});const response=await api.create(request({...input,lyrics:""}));
  assert.equal(response.status,400);assert.match((await response.json()).error,/automatic lyric writing/);assert.equal(state.fal.length,0);
});
test("description-only songs reuse existing lyric writing before fal sings",async()=>{
  const {state}=fixture();const response=await api.create(request({...input,lyrics:""}));
  assert.equal(response.status,200);assert.equal(state.eleven.length,1);assert.equal(state.eleven[0].path,"music/plan");assert.match(state.fal[0].input.lyrics,/Light upon the sea/);
});
test("short and over-limit text preflight use backup without a fal submission; six-minute cap is enforced",async()=>{
  for(const change of [{duration:3,lyrics:"[Verse]\nA bright day"},{prompt:"gentle ".repeat(100)}]){
    const {state}=fixture();assert.equal((await api.create(request({...input,...change}))).status,200);assert.equal(state.fal.length,0);assert.equal(state.eleven.length,1);
  }
  const {state}=fixture();assert.equal((await api.create(request({...input,duration:361}))).status,400);assert.equal(state.fal.length,0);
});
test("instrumentals use the documented Instrumental token and need no ElevenLabs key",async()=>{
  const {state}=fixture({elevenKey:null});assert.equal((await api.create(request({...input,instrumental:true}))).status,200);assert.equal(state.fal[0].input.lyrics,"[Instrumental]");
});
test("genre delivery, cues, language and bounded original inputs map honestly",()=>{
  const mapped=api.falSongInput({prompt:"Hope in the city, 92 BPM",lyrics:"[Verse]\n{whisper}Here we go",duration:60,voice:"female",genres:"hip hop",instruments:"808 bass",arrangement:"",language:"es",instrumental:false,versions:2});
  assert.match(mapped.prompt,/rapper/);assert.match(mapped.prompt,/whisper/);assert.match(mapped.prompt,/808/);assert.equal(mapped.bpm,92);assert.equal(mapped.vocal_language,"es");assert.doesNotMatch(mapped.lyrics,/[{}]/);assert.match(mapped.lyrics,/\[Verse\]/);
  assert.throws(()=>api.falSongInput({...mapped,voice:"",genres:"",instruments:"",arrangement:"",language:"en",instrumental:false,versions:2,lyrics:"a".repeat(4097)}),/4,096/);
});
test("bounded polling ends rather than waiting forever and persists acceptance before reading status",async()=>{
  let time=0,submitted=0,accepted=false;
  const fake={now:()=>time,wait:async ms=>{time+=ms;},media:async()=>{throw new Error("unexpected");},
    request:async(key,path,init={})=>{if(init.method==="POST"){submitted++;return Response.json({request_id:"saved-id"});}assert.equal(accepted,true);return Response.json({status:"IN_PROGRESS"});}};
  await assert.rejects(api.generateFal("dummy",{},async()=>{accepted=true;},fake),/taking longer/);assert.equal(submitted,1);assert.equal(time,720000);
});
test("owner engine card is hidden in Simple and for non-owners; no cloning claims",()=>{
  const access={status:{owner:true,preferred:"ace-step",engine:"ace-step",configured:true,notice:""},busy:false,error:"",update:async()=>{}};
  assert.equal(renderToStaticMarkup(React.createElement(api.MusicEngineSettings,{access,advanced:false})),"");
  const html=renderToStaticMarkup(React.createElement(api.MusicEngineSettings,{access,advanced:true}));assert.match(html,/thinking quality/);assert.match(html,/owner-only/);
  assert.equal(renderToStaticMarkup(React.createElement(api.MusicEngineSettings,{access:{...access,status:{...access.status,owner:false}},advanced:true})),"");
  const source=readFileSync("app/quick-create.tsx","utf8");assert.match(source,/Compare your takes/);assert.match(source,/favoriteTake/);assert.match(source,/makeTwoVersions&&!localSketch&&!falActive/);
});
