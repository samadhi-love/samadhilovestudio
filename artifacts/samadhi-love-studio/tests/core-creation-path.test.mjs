// Offline orchestration through real app routes. The provider and browser
// encoder are fixtures; native browser encoding and singing need the live run.
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";

const directory="generated-artifacts/tests/core-path";
mkdirSync(directory,{recursive:true});
const lines=[
  "Morning light across the sea",
  "A little hope awakens me",
  "One small spark can light the way",
  "We begin a brighter day",
];
const lyrics=`[Verse]\n${lines.slice(0,2).join("\n")}\n[Chorus]\n${lines.slice(2).join("\n")}`;
const starts=[1,8,16,23];
const run=(command,args)=>{
  const result=spawnSync(command,args,{encoding:"utf8",timeout:60_000});
  assert.equal(result.status,0,result.error?.message??result.stderr);
  return result.stdout;
};
// Real, synthetic media makes the save/download integrity check stronger than
// a renamed text blob, without spending credits or claiming to test singing.
run("ffmpeg",["-v","error","-y","-f","lavfi","-i","sine=frequency=440:sample_rate=44100:duration=30","-c:a","libmp3lame","-b:a","64k",`${directory}/synthetic.mp3`]);
const filters=lines.map((text,i)=>`drawtext=text='${text}':fontcolor=white:fontsize=16:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${starts[i]},${starts[i]+6})'`).join(",");
run("ffmpeg",["-v","error","-y","-f","lavfi","-i","color=c=0x160d35:s=320x568:r=8:d=30","-i",`${directory}/synthetic.mp3`,"-vf",filters,"-c:v","libx264","-preset","ultrafast","-pix_fmt","yuv420p","-c:a","aac","-t","30","-movflags","+faststart",`${directory}/synthetic.mp4`]);
const audio=readFileSync(`${directory}/synthetic.mp3`),video=readFileSync(`${directory}/synthetic.mp4`);
const characters=lines.flatMap((line,index)=>[...line+"\n"].map((text,i)=>({text,start:starts[index]+i*5/line.length,end:starts[index]+(i+1)*5/line.length})));
globalThis.__corePath={};
await build({stdin:{contents:`
export {POST as create} from "./app/api/studio/create/route";
export {POST as sync} from "./app/api/studio/lyric-sync/route";
export {PUT as saveProject,GET as openProject} from "./app/api/studio/lyric-project/route";
export {POST as saveAsset,GET as download} from "./app/api/studio/lyric-assets/route";
export {newProSettings} from "./app/lyric-pro-data";
export {videoThemes} from "./app/lyric-video-data";
export {emptyCreatorStudio} from "./app/studio-data";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/routes.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",plugins:[{name:"offline-core-path",setup(b){
  b.onResolve({filter:/.*/},a=>{
    if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fixture"};
    if(/studio-access$/.test(a.path))return {path:"access",namespace:"fixture"};
    if(/\/store$/.test(a.path))return {path:"store",namespace:"fixture"};
    if(/credits\/production$/.test(a.path))return {path:"credits",namespace:"fixture"};
    if(/\/elevenlabs\/vault$/.test(a.path))return {path:"vault",namespace:"fixture"};
    if(/\/elevenlabs\/provider$/.test(a.path))return {path:"music",namespace:"fixture"};
    if(/\/elevenlabs\/audio-upload$/.test(a.path))return {path:"alignment",namespace:"fixture"};
  });
  b.onLoad({filter:/.*/,namespace:"fixture"},a=>({loader:"js",contents:{
    storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__corePath.env[k]});",
    access:"export const privateWorkspace=async()=>globalThis.__corePath.access;",
    store:`export const privateHeaders={"Cache-Control":"private,no-store"};export const maxStudioBytes=1500000;export const audioKey=(o,a)=>"songs/"+o+"/"+a;
      export const readStudio=async owner=>owner==="owner"?structuredClone(globalThis.__corePath.studio):{data:null,revision:0};
      export async function writeStudio(owner,revision,text){const s=globalThis.__corePath;if(owner!=="owner"||revision!==s.studio.revision)return undefined;if(s.conflicts>0){s.conflicts--;s.studio.revision++;return undefined;}s.studio={data:JSON.parse(text),revision:revision+1};return {revision:revision+1};}
      export const saveConflict=()=>Response.json({error:"conflict"},{status:409});`,
    credits:"export const jobExecution=new WeakMap();export const managedProviderKey=()=>null;export const withProductionUsage=f=>f;",
    vault:"export const resolveElevenLabsKey=async owner=>owner==='owner'?'offline-dummy-key':null;",
    music:`export const stemFormats={standard:'mp3_44100_128',high:'mp3_44100_192'};export async function stemOutputFormat(){return 'mp3_44100_128';}export const musicModel="offline-music";export const elevenLabsFailureMessage=async()=>"Fixture failed";
      export async function elevenLabsRequest(key,path,payload){const s=globalThis.__corePath;s.music.push({path,payload});if(!path.startsWith("music?"))throw new Error("Unexpected provider call");return new Response(s.audio,{headers:{"Content-Type":"audio/mpeg"}});}`,
    alignment:`export async function sendProviderAudio(audio,format,key,fields,endpoint){const s=globalThis.__corePath;s.alignments.push({fields,endpoint});return Response.json({characters:s.characters});}`,
  }[a.path]}));
}}]});
const api=await import(`../${directory}/routes.mjs`);
globalThis.FixedLengthStream=class extends TransformStream{constructor(){super();}};
function fixture(){
  const objects=new Map();
  const state=globalThis.__corePath={access:{id:"owner",role:"owner"},env:{},studio:{data:structuredClone(api.emptyCreatorStudio),revision:0},audio,characters,music:[],alignments:[],conflicts:0};
  state.env.BUCKET={
    async put(key,value,options={}){
      const prior=objects.get(key);
      if(options.onlyIf?.etagMatches&&prior?.etag!==options.onlyIf.etagMatches||options.onlyIf?.etagDoesNotMatch==="*"&&prior)return null;
      const bytes=new Uint8Array(await new Response(value).arrayBuffer());
      const object={key,bytes,size:bytes.length,etag:crypto.randomUUID(),uploaded:new Date(),...options};
      objects.set(key,object);return object;
    },
    async head(key){return objects.get(key)??null;},
    async get(key,options={}){
      const o=objects.get(key);if(!o)return null;
      const bytes=options.range?o.bytes.slice(options.range.offset,options.range.offset+options.range.length):o.bytes;
      return {...o,body:new Response(bytes).body,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),json:async()=>JSON.parse(new TextDecoder().decode(bytes))};
    },
    async list({prefix}){return {objects:[...objects.values()].filter(o=>o.key.startsWith(prefix)),truncated:false};},
    async delete(){throw new Error("This core-path test must not delete media.");},
  };
  return {state,objects};
}
const request=(path,body,method="POST")=>new Request(`https://studio.test/api/studio/${path}`,{method,headers:{origin:"https://studio.test","Content-Type":"application/json","X-Studio-Workspace":"owner"},body:JSON.stringify(body)});
async function created(){
  const response=await api.create(request("create",{action:"song",title:"Offline core path",prompt:"A 30-second uplifting English acoustic pop song. Sing the exact supplied lyrics clearly, without ad-libs.",lyrics,duration:30,language:"en",instrumental:false,captionReady:true}));
  assert.equal(response.status,200,await response.clone().text());
  const saved=await response.json();
  return saved.data.songs.find(song=>song.id===saved.songId);
}
async function synced(song){
  const response=await api.sync(request("lyric-sync",{songId:song.id,audioId:song.audioId??null,sourceAudioId:song.audioId??song.id,mode:"align",text:lyrics,duration:30}));
  assert.equal(response.status,200,await response.clone().text());
  return response.json();
}
test("offline core path preserves lyrics through song, sync, project, private save/reopen and exact media download",async()=>{
  const {state,objects}=fixture(),song=await created();
  assert.equal(song.notes.lyrics,lyrics);
  assert.equal(song.creationDraft,false);
  assert.equal(state.music.length,1);
  assert(state.music[0].payload.composition_plan);
  assert(objects.has(`songs/owner/${song.audioId??song.id}`));
  const timing=await synced(song);
  assert.deepEqual(timing.cues.map(c=>c.text),lines);
  for(let i=0;i<lines.length;i++)assert(Math.abs(timing.cues[i].time-starts[i])<0.1);
  const project={theme:Object.keys(api.videoThemes)[0],format:"vertical",motion:"still",cues:timing.cues,pro:api.newProSettings(song,30)};
  const saved=await api.saveProject(request("lyric-project",{songId:song.id,project,expected:null},"PUT"));
  assert.equal(saved.status,200,await saved.clone().text());
  const reopened=await api.openProject(new Request(`https://studio.test/api/studio/lyric-project?song=${song.id}`));
  assert.equal(reopened.status,200);
  assert.deepEqual((await reopened.json()).project.cues,timing.cues);
  const uploaded=await api.saveAsset(new Request("https://studio.test/api/studio/lyric-assets",{method:"POST",headers:{origin:"https://studio.test","X-Studio-Workspace":"owner","X-Song-Id":song.id,"X-Asset-Kind":"video","X-Asset-Size":String(video.length),"Content-Type":"video/mp4;codecs=avc1.42001e,mp4a.40.2"},body:video}));
  assert.equal(uploaded.status,200,await uploaded.clone().text());
  const {id}=await uploaded.json(),url=`https://studio.test/api/studio/lyric-assets?song=${song.id}&asset=${id}`;
  const download=await api.download(new Request(url));
  assert.equal(download.status,200);
  assert.match(download.headers.get("Cache-Control"),/private/);
  assert.equal(download.headers.get("Content-Type"),"video/mp4");
  const bytes=Buffer.from(await download.arrayBuffer());
  assert.equal(createHash("sha256").update(bytes).digest("hex"),createHash("sha256").update(video).digest("hex"));
  const range=await api.download(new Request(url,{headers:{Range:"bytes=0-31"}}));
  assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,32);
  const probe=JSON.parse(run("ffprobe",["-v","error","-show_streams","-show_format","-of","json",`${directory}/synthetic.mp4`]));
  assert(probe.streams.some(s=>s.codec_type==="video"&&s.codec_name==="h264"));
  assert(probe.streams.some(s=>s.codec_type==="audio"&&s.codec_name==="aac"));
  assert(Math.abs(Number(probe.format.duration)-30)<=0.1);
  assert.equal(state.alignments.length,1);
});
test("project save retries an independent revision conflict without generating or syncing again",async()=>{
  const {state}=fixture(),song=await created(),timing=await synced(song);
  state.conflicts=1;
  const project={theme:Object.keys(api.videoThemes)[0],format:"vertical",motion:"still",cues:timing.cues,pro:api.newProSettings(song,30)};
  const saved=await api.saveProject(request("lyric-project",{songId:song.id,project,expected:null},"PUT"));
  assert.equal(saved.status,200);
  assert.equal(state.music.length,1);assert.equal(state.alignments.length,1);
  state.access={id:"another-owner",role:"owner"};
  const denied=await api.openProject(new Request(`https://studio.test/api/studio/lyric-project?song=${song.id}`));
  assert.equal(denied.status,404);
});
test("a changed source recording is rejected before a paid alignment request",async()=>{
  const {state}=fixture(),song=await created();
  const response=await api.sync(request("lyric-sync",{songId:song.id,audioId:"wrong-recording",mode:"align",text:lyrics,duration:30}));
  assert.equal(response.status,409);assert.equal(state.alignments.length,0);
});
