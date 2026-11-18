import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";
mkdirSync("generated-artifacts/tests/caption-continuity",{recursive:true});
globalThis.__captionTest={};
await build({stdin:{contents:`
export * from "./app/caption-edit-continuity";
export * from "./app/lyric-pro-data";
export * from "./app/lyric-video-data";
export * from "./app/studio-data";
export * from "./app/server/caption-recovery";
export {PUT as putProject} from "./app/api/studio/lyric-project/route";
export {POST as sync} from "./app/api/studio/lyric-sync/route";
export {GET as getRecovery} from "./app/api/studio/lyric-sync/recovery/route";
export {POST as uploadAudio} from "./app/api/studio/audio/route";
`,resolveDir:process.cwd()},outfile:"generated-artifacts/tests/caption-continuity/bundle.mjs",bundle:true,platform:"node",format:"esm",plugins:[{name:"offline-caption-fixtures",setup(b){
 b.onResolve({filter:/.*/},a=>{
  if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fixture"};
  if(/studio-access$/.test(a.path))return {path:"access",namespace:"fixture"};
  if(/\/store$/.test(a.path))return {path:"store",namespace:"fixture"};
  if(/credits\/production$/.test(a.path))return {path:"credits",namespace:"fixture"};
  if(/\/elevenlabs\/vault$/.test(a.path))return {path:"vault",namespace:"fixture"};
  if(/\/elevenlabs\/audio-upload$/.test(a.path))return {path:"provider",namespace:"fixture"};
  if(/request-errors$/.test(a.path))return {path:"errors",namespace:"fixture"};
  if(/lyric-assets\/route$/.test(a.path))return {path:"asset",namespace:"fixture"};
  if(/server\/song-recovery$/.test(a.path))return {path:"song-recovery",namespace:"fixture"};
  if(/audio-response$/.test(a.path))return {path:"audio-response",namespace:"fixture"};
 });
 b.onLoad({filter:/.*/,namespace:"fixture"},a=>({loader:"js",contents:{
  storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__captionTest.env[k]});",
  access:"export async function privateWorkspace(){return globalThis.__captionTest.access;}",
  store:`export const privateHeaders={"Cache-Control":"private,no-store"};export const maxStudioBytes=1500000;export const audioKey=(o,a)=>"songs/"+o+"/"+a;export const saveConflict=()=>Response.json({error:"conflict"},{status:409});export async function readStudio(){return structuredClone(globalThis.__captionTest.studio);}export async function writeStudio(o,r,text){const s=globalThis.__captionTest;if(s.studio.revision!==r)return false;s.studio={data:JSON.parse(text),revision:r+1};return true;}`,
  credits:"export const jobExecution=new WeakMap();export const managedProviderKey=()=>null;export const withProductionUsage=f=>f;",
  vault:"export const resolveElevenLabsKey=async()=> 'dummy-key';",
  provider:"export async function sendProviderAudio(audio,format,key,fields,endpoint){globalThis.__captionTest.sent={audio,format,fields,endpoint};return Response.json(globalThis.__captionTest.result);}",
  errors:"export const readBoundedText=r=>r.text();export const recoverableRoute=f=>f;",
  asset:"export const lyricAssetKey=(o,s,a)=>`lyric-assets/${o}/${s}/${a}`;",
  "song-recovery":"export const preservePaidSong=async()=>{};",
  "audio-response":"export const serveAudio=async()=>new Response('audio');",
 }[a.path]}));
}}]});
const api=await import("../generated-artifacts/tests/caption-continuity/bundle.mjs");
globalThis.FixedLengthStream=class extends TransformStream{constructor(){super();}};
function fixture(){
 const song={...api.freshSong("source","My song",0),audioId:"original",audioFormat:"wav"};
 const project={theme:"aurora",format:"vertical",motion:"drift",cues:[{text:"Before",time:1,end:3},{text:"Changed one",time:11,end:13},{text:"Changed two",time:14,end:16},{text:"After",time:25,end:28,words:[{offset:5,time:26}]}],pro:api.newProSettings(song,40)};
 // Use an existing canonical theme rather than relying on a visual label.
 project.theme=Object.keys(api.videoThemes)[0];
 song.lyricVideo=project;
 const objects=new Map();
 const state=globalThis.__captionTest={access:{id:"owner",role:"owner"},studio:{data:{...structuredClone(api.emptyCreatorStudio),songs:[song]},revision:0},env:{},objects,result:{}};
 state.env.BUCKET={
  async put(key,value,options={}){objects.set(key,{text:typeof value==="string"?value:await new Response(value).text(),...options});return {};},
  async get(key){const o=objects.get(key);return o?{size:100,customMetadata:o.customMetadata,httpMetadata:o.httpMetadata,body:new Response(o.text).body,json:async()=>JSON.parse(o.text)}:null;},
  async head(key){return objects.get(key)??null;},
  async list(){return {objects:[],truncated:false};},
 };
 return {song,project,state,objects};
}
const plan=clips=>({sourceSongId:"source",sourceAudioId:"original",fade:1,clips:clips.map(([audioId,from,to])=>({songId:audioId==="original"?"source":"replacement",audioId,from,to}))});
const request=(path,body)=>new Request("https://studio.test/api/studio/"+path,{method:"PUT",headers:{origin:"https://studio.test","content-type":"application/json"},body:JSON.stringify(body)});
test("cut shifts trailing cues by the actual clamped crossfade and drops removed lines",()=>{
 const {project}=fixture();
 const moved=api.carryEditedCaptions(project,plan([["original",0,10],["original",20,40]]),"new-song","edited");
 assert.deepEqual(moved.cues.map(c=>c.text),["Before","After"]);
 assert.equal(moved.cues[0].time,1);assert.equal(moved.cues[1].time,14);
 assert.equal(moved.cues[1].words[0].time,15);assert.equal(moved.pro.duration,29);
 assert.equal(moved.pro.sourceAudioId,"edited");assert.equal(project.pro.sourceAudioId,"original");
 assert.ok(api.isLyricProject(moved));
});
test("replace keeps changed lyrics as review-only with distinct rough positions",()=>{
 const {project}=fixture();
 const moved=api.carryEditedCaptions(project,plan([["original",0,10],["new",0,8],["original",20,40]]),"new-song","edited");
 assert.equal(moved.pro.duration,36);
 assert.deepEqual(moved.cues.filter(c=>c.needsReview).map(c=>c.text),["Changed one","Changed two"]);
 assert.ok(moved.cues.filter(c=>c.needsReview).every(c=>!c.words));
 assert.equal(moved.cues.at(-1).time,21);assert.ok(api.isLyricProject(moved));
});
test("insert and extend use the same crossfade timeline as audio assembly",()=>{
 const {project}=fixture();
 const inserted=api.carryEditedCaptions(project,plan([["original",0,10],["new",0,8],["original",10,40]]),"new-song","edited");
 assert.equal(inserted.pro.duration,46);assert.equal(inserted.cues.at(-1).time,31);
 const extended=api.carryEditedCaptions(project,plan([["original",0,40],["new",0,10]]),"new-song","edited");
 assert.equal(extended.pro.duration,49);assert.equal(extended.cues[0].time,1);
 assert.deepEqual(extended.pro.captionEdit,{start:39,end:49});assert.ok(api.isLyricProject(extended));
});
test("very short replacement clips use the renderer's clamped crossfades",()=>{
 const {project}=fixture(),edit=plan([["original",0,10],["new",0,.3],["original",20,40]]);
 edit.fade=2;
 const moved=api.carryEditedCaptions(project,edit,"new-song","edited");
 assert.ok(Math.abs(moved.pro.duration-30.1)<1e-8);
 assert.ok(Math.abs(moved.cues.at(-1).time-15.1)<1e-8);
 assert.ok(api.isLyricProject(moved));
});
test("window merge keeps captions and word times outside the changed window byte-for-byte",()=>{
 const {project}=fixture(),before=structuredClone(project.cues);
 const merged=api.mergeWindowCaptions(before,[{text:"New line",time:12,end:19}],{start:10,end:20});
 assert.deepEqual(merged,[before[0],{text:"New line",time:12,end:19,needsReview:undefined},before[3]]);
});
test("a no-op crop remains a valid project without a false changed-part window",()=>{
 const {project}=fixture();
 const moved=api.carryEditedCaptions(project,plan([["original",0,40]]),"new-song","edited");
 assert.deepEqual(JSON.parse(JSON.stringify(moved.cues)),project.cues);
 assert.equal(moved.pro.captionEdit,undefined);assert.ok(api.isLyricProject(moved));
});
test("inserting a clean caption does not re-flag an unchanged old line; copying the flagged line does",()=>{
 const {project}=fixture();project.cues[0].text="damn";
 const next=structuredClone(project);next.cues.unshift({text:"A clean intro",time:0,end:1});
 assert.equal(api.changedCaptionProblem(next,project),null);
 next.cues.push({text:"damn",time:35,end:36});
 assert.equal(api.changedCaptionProblem(next,project).line,6);
});
test("minor endpoint overruns clip lines and discard words beyond duration; majority outside rejects",()=>{
 const result=api.clipCaptionTimes([{text:"One",time:1,end:3},{text:"Two",time:9,end:10.4,words:[{offset:1,time:9.2},{offset:3,time:10.2}]}],10);
 assert.equal(result.clippedLines,1);assert.equal(result.cues[1].end,10);assert.equal(result.cues[1].words.length,1);
 assert.throws(()=>api.clipCaptionTimes([{text:"a",time:11},{text:"b",time:12},{text:"c",time:1}],10),/Most/);
});
test("private project saves allow unchanged flagged lines but identify a changed translation",async()=>{
 const {state,project}=fixture();project.cues[0].text="damn";state.studio.data.songs[0].lyricVideo=structuredClone(project);
 let response=await api.putProject(request("lyric-project",{songId:"source",project,expected:null}));
 assert.equal(response.status,200);
 const next=structuredClone(state.studio.data.songs[0].lyricVideo);next.cues[1].translation="damn";
 response=await api.putProject(request("lyric-project",{songId:"source",project:next,expected:next.pro.updatedAt}));
 assert.equal(response.status,422);const problem=await response.json();assert.equal(problem.line,2);assert.equal(problem.field,"translation");
});
test("caption recovery overwrites only the owner's same-song/same-audio record and requires sign-in",async()=>{
 const {state}=fixture();
 await api.saveCaptionRecovery("owner","source","original",{cues:[{text:"مرحبا world",time:1,end:2}]});
 await api.saveCaptionRecovery("owner","source","original",{cues:[{text:"Latest",time:2,end:3}]});
 let response=await api.getRecovery(new Request("https://studio.test/api/studio/lyric-sync/recovery?song=source&audio=original"));
 assert.equal((await response.json()).recovery.cues[0].text,"Latest");
 assert.equal(await api.readCaptionRecovery("another-owner","source","original"),null);
 state.access=null;response=await api.getRecovery(new Request("https://studio.test/api/studio/lyric-sync/recovery?song=source&audio=original"));assert.equal(response.status,401);
});
test("paid sync clips an overrun and writes private recovery before returning its captions",async()=>{
 const {state,objects}=fixture();objects.set("songs/owner/original",{text:"dummy audio"});
 state.result={characters:[..."One line"].map((text,i)=>({text,start:9+i*.15,end:9+(i+1)*.15}))};
 const response=await api.sync(new Request("https://studio.test/api/studio/lyric-sync",{method:"POST",headers:{origin:"https://studio.test"},body:JSON.stringify({songId:"source",audioId:"original",sourceAudioId:"original",mode:"align",text:"One line",duration:10})}));
 assert.equal(response.status,200);const result=await response.json();
 assert.equal(result.clippedLines,1);assert.equal(result.cues[0].end,10);
 const recovered=await api.readCaptionRecovery("owner","source","original");assert.deepEqual(recovered.cues,result.cues);
});
test("window-only sync sends the excerpt and selected lyrics, returns absolute times and can restore by merge",async()=>{
 const {state,objects,project}=fixture();
 objects.set("lyric-assets/owner/source/excerpt",{text:"only the excerpt",httpMetadata:{contentType:"audio/wav"},customMetadata:{kind:"analysis",song:"source",source:"original",windowStart:"10",windowEnd:"20"}});
 state.result={characters:[..."New line"].map((text,i)=>({text,start:1+i*.1,end:1+(i+1)*.1}))};
 const response=await api.sync(new Request("https://studio.test/api/studio/lyric-sync",{method:"POST",headers:{origin:"https://studio.test"},body:JSON.stringify({songId:"source",audioId:"original",sourceAudioId:"original",mode:"align",text:"New line",duration:40,analysisAsset:"excerpt",window:{start:10,end:20}})}));
 assert.equal(response.status,200);const result=await response.json();
 assert.equal(state.sent.fields.text,"New line");assert.equal(result.cues[0].time,11);
 const recovered=await api.readCaptionRecovery("owner","source","original");
 assert.deepEqual(recovered.window,{start:10,end:20});
 const restored=api.mergeWindowCaptions(project.cues,recovered.cues,recovered.window);
 assert.deepEqual(restored[0],project.cues[0]);assert.deepEqual(restored.at(-1),project.cues.at(-1));
});
test("audio section upload attaches carried captions and saves an untouched old project snapshot",async()=>{
 const {state,song,project,objects}=fixture();
 state.studio.data.songs.push({...api.freshSong("replacement","Replacement",1),audioId:"new",audioFormat:"wav"});
 const edit=plan([["original",0,10],["new",0,8],["original",20,40]]);
 const original=structuredClone(project);
 const response=await api.uploadAudio(new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{origin:"https://studio.test","X-Audio-Format":"wav","X-Audio-Size":"4","X-Song-Title":"Edited song","X-Studio-Revision":"0","X-Party-Source":"mix","X-Party-Rights":"authorized","X-Studio-Clean-Audio":"1","X-Project-Song-Id":song.id,"X-Section-Edit-Plan":encodeURIComponent(JSON.stringify(edit))},body:"wave"}));
 assert.equal(response.status,200);
 const id=(await response.json()).songId,edited=state.studio.data.songs.find(s=>s.id===id);
 assert.equal(edited.lyricVideo.pro.sourceAudioId,edited.audioId??edited.id);
 assert.equal(edited.lyricVideo.pro.sourceSongId,id);assert.equal(edited.lyricVideo.pro.duration,36);
 const snapshot=[...objects].find(([key])=>key.startsWith("lyric-projects/owner/source/"));
 assert.deepEqual(JSON.parse(snapshot[1].text),original);
 assert.deepEqual(state.studio.data.songs.find(s=>s.id==="source").lyricVideo,original);
});
test("landing headline has an actual intervening space and client exposes restore, changed-window and cost confirmation",()=>{
 const landing=readFileSync("app/landing/index.tsx","utf8"),client=readFileSync("app/lyric-video-pro.tsx","utf8");
 assert.match(landing,/Your soul<\/span>\{" "\}<span/);
 assert.doesNotMatch(client,/Restore your last caption sync|Restore recovered edits/);
 assert.match(client,/if\(captionRecovery&&!busy&&!current\.current\?\.cues\.length\)restoreCaptionSync\(\)/);
 assert.match(client,/Realign changed part/);
 assert.match(client,/window\.start\*decoded\.sampleRate/);assert.match(client,/may cost provider credits/);
});
