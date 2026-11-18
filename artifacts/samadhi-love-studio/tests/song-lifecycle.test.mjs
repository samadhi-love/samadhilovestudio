import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";
const out="generated-artifacts/tests/song-lifecycle";mkdirSync(out,{recursive:true});
globalThis.__life={};
await build({stdin:{contents:`
export {GET,POST} from "./app/api/studio/song-actions/route";
export {regionEditClips,songEndFadeGain} from "./app/song-region-actions";
export {assemblyDuration,planAudioAssembly} from "./app/audio-assembly";
export {carryEditedCaptions} from "./app/caption-edit-continuity";
export {freshSong,emptyCreatorStudio} from "./app/studio-data";
export {newProSettings} from "./app/lyric-pro-data";
export {readSavedShape} from "./app/saved-song-prompts";
export {normalizeSongDeletion,canRestoreSong,songRecoveryMs,songDependsOn} from "./app/song-deletion";
export {engineCapabilities} from "./app/music-engine-data";
`,resolveDir:process.cwd(),loader:"ts"},bundle:true,platform:"node",format:"esm",packages:"external",outfile:`${out}/bundle.mjs`,
plugins:[{name:"private-offline-lifecycle",setup(b){
  b.onResolve({filter:/.*/},a=>{
    if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"fake"};
    if(/studio-access$/.test(a.path))return {path:"auth",namespace:"fake"};
    if(/\/store$/.test(a.path))return {path:"store",namespace:"fake"};
  });
  b.onLoad({filter:/.*/,namespace:"fake"},a=>({loader:"js",contents:{
    storage:"export const serverStorage=new Proxy({}, {get:(_,key)=>globalThis.__life.env[key]});",
    auth:"export const privateWorkspace=async()=>globalThis.__life.access;",
    store:`export const privateHeaders={"Cache-Control":"private,no-store"};export const maxStudioBytes=1500000;
      export const audioKey=(owner,id)=>"songs/"+encodeURIComponent(owner)+"/"+id;
      export const readStudio=async owner=>structuredClone(globalThis.__life.studios.get(owner)??{data:null,revision:0});
      export async function writeStudio(owner,revision,text){const s=globalThis.__life,current=s.studios.get(owner);s.writes++;
        if(s.throwWrite)throw Error("offline storage error");
        if(s.conflicts>0){s.conflicts--;current.revision++;current.data.songs[1].notes.prompt="Other tab kept";return null;}
        if(current?.revision!==revision)return null;s.studios.set(owner,{data:JSON.parse(text),revision:revision+1});return {revision:revision+1};}`,
  }[a.path]}));
}}]});
const api=await import(`../${out}/bundle.mjs`);
const bytes=new TextEncoder().encode("ID3private original audio fixture");
function setup(){
  const source={...api.freshSong("source","Morning sky",0),audioId:"audio-source",audioFormat:"mp3",creationSeconds:40};
  source.notes.lyrics="[Verse]\nLight upon the sea";source.notes.vocals="Warm soul singer";
  source.lyricVideo={theme:"cosmic",format:"vertical",motion:"drift",cues:[{text:"Light upon the sea",time:2,end:6}],pro:api.newProSettings(source,40)};
  const studio=structuredClone(api.emptyCreatorStudio);studio.songs=[source,api.freshSong("other","Other song",1)];
  const s=globalThis.__life={access:{role:"owner",id:"owner"},env:{},studios:new Map([["owner",{data:studio,revision:1}]]),objects:new Map(),
    gets:[],puts:[],deletes:[],writes:0,conflicts:0,throwWrite:false,throwPut:false,serial:0};
  s.objects.set("songs/owner/audio-source",{bytes,etag:"original",metadata:{},httpMetadata:{contentType:"audio/mpeg"}});
  s.env.BUCKET={
    async head(key){const f=s.objects.get(key);return f?{size:f.bytes.length,etag:f.etag,customMetadata:{...f.metadata},httpMetadata:f.httpMetadata}:null;},
    async get(key){s.gets.push(key);const f=s.objects.get(key);return f?{body:new Response(f.bytes).body,size:f.bytes.length,etag:f.etag,customMetadata:{...f.metadata},httpMetadata:f.httpMetadata,json:async()=>JSON.parse(new TextDecoder().decode(f.bytes))}:null;},
    async put(key,value,options={}){
      if(s.throwPut)throw Error("offline R2 failure");
      const old=s.objects.get(key);
      if(options.onlyIf?.etagDoesNotMatch==="*"&&old||options.onlyIf?.etagMatches&&old?.etag!==options.onlyIf.etagMatches)return null;
      const data=typeof value==="string"?new TextEncoder().encode(value):value instanceof ReadableStream?new Uint8Array(await new Response(value).arrayBuffer()):new Uint8Array(value);
      s.puts.push(key);s.objects.set(key,{bytes:data,etag:String(++s.serial),metadata:options.customMetadata??{},httpMetadata:options.httpMetadata});
      return {etag:String(s.serial)};
    },
    async list({prefix,limit=1000}){return {objects:[...s.objects.keys()].filter(key=>key.startsWith(prefix)).slice(0,limit).map(key=>({key})),truncated:false};},
    async delete(key){s.deletes.push(key);throw Error("Deletion is forbidden in this suite");},
  };
  return s;
}
const current=s=>s.studios.get("owner").data;
const duplicate=(id="copy",extra={})=>new Request("https://studio.test/api/studio/song-actions",{method:"POST",headers:{Origin:"https://studio.test","Content-Type":"application/json"},body:JSON.stringify({action:"duplicate",songId:"source",id,...extra})});
function voice(id="reference",extra={}){
  const form=new FormData();
  for(const[key,value]of Object.entries({id,songId:"source",audioId:"audio-source",name:"Warm voice",vocals:"صوت دافئ · warm soul delivery",from:"2",to:"22",permission:"true",...extra}))form.set(key,value);
  form.set("clip",new Blob([bytes],{type:"audio/mpeg"}),"reference.mp3");
  return new Request("https://studio.test/api/studio/song-actions",{method:"POST",headers:{Origin:"https://studio.test"},body:form});
}
test("Duplicate streams an independent private recording, keeps lyrics/captions and leaves original untouched",async()=>{
  const s=setup(),original=structuredClone(current(s).songs[0]);
  const response=await api.POST(duplicate("copy",{audioId:"foreign",name:"Ignore client metadata"}));
  assert.equal(response.status,200,await response.clone().text());
  const copy=current(s).songs.find(song=>song.id==="copy");
  assert.equal(copy.audioId,"copy");assert.equal(copy.notes.lyrics,original.notes.lyrics);
  assert.equal(copy.lyricVideo.pro.sourceAudioId,"copy");assert.equal(copy.lyricVideo.cues[0].text,"Light upon the sea");
  assert.equal(copy.stage,"Production");assert.equal(copy.creationDraft,false);
  assert.deepEqual(current(s).songs.find(song=>song.id==="source"),original);
  assert.deepEqual(s.objects.get("songs/owner/copy").bytes,bytes);
  assert.equal(api.songDependsOn(copy,original),false);
  const receipt=JSON.parse(new TextDecoder().decode(s.objects.get("private/recovery/audio/owner/copy.json").bytes));
  assert.equal(receipt.done,true);assert.deepEqual(s.deletes,[]);
});
test("Repeated duplicate request is idempotent, and conflicts preserve unrelated edits",async()=>{
  const s=setup();s.conflicts=2;
  assert.equal((await api.POST(duplicate())).status,200);
  assert.equal(current(s).songs.find(song=>song.id==="other").notes.prompt,"Other tab kept");
  const copies=s.puts.filter(key=>key==="songs/owner/copy").length;
  assert.equal((await api.POST(duplicate())).status,200);
  assert.equal(current(s).songs.filter(song=>song.id==="copy").length,1);
  assert.equal(s.puts.filter(key=>key==="songs/owner/copy").length,copies);
});
test("A failed library write keeps duplicate audio and a full recovery receipt, never deletes files",async()=>{
  const s=setup();s.throwWrite=true;
  assert.equal((await api.POST(duplicate())).status,503);
  assert(s.objects.has("songs/owner/copy"));
  const receipt=JSON.parse(new TextDecoder().decode(s.objects.get("private/recovery/audio/owner/copy.json").bytes));
  assert.equal(receipt.song.notes.lyrics,"[Verse]\nLight upon the sea");assert.notEqual(receipt.done,true);
  s.throwWrite=false;assert.equal((await api.POST(duplicate())).status,200);
  assert.equal(s.puts.filter(key=>key==="songs/owner/copy").length,1);assert.deepEqual(s.deletes,[]);
});
test("Writing-only duplication keeps writing, without inventing audio or storage calls",async()=>{
  const s=setup();delete current(s).songs[0].audioFormat;delete current(s).songs[0].audioId;
  assert.equal((await api.POST(duplicate())).status,200);
  const copy=current(s).songs.find(song=>song.id==="copy");
  assert.equal(copy.audioId,undefined);assert.equal(copy.creationDraft,true);assert.equal(s.puts.length,0);
});
test("Private voice reference saves an independent clip and reusable description, not cloned identity",async()=>{
  const s=setup();s.conflicts=1;
  const response=await api.POST(voice());assert.equal(response.status,200,await response.clone().text());
  const template=current(s).templates.find(item=>item.id==="voice-reference");
  assert.equal(api.readSavedShape(template).voiceReferenceId,"reference");
  assert.equal(template.notes.vocals,"صوت دافئ · warm soul delivery");
  assert.equal(template.notes.lyrics,"");assert.equal(template.notes.prompt,"");
  assert.equal(s.objects.get("song-voice-references/v1/owner/reference").metadata.referenceOnly,"true");
  const fetched=await api.GET(new Request("https://studio.test/api/studio/song-actions?voice=reference"));
  assert.equal(fetched.status,200);assert.match(fetched.headers.get("Cache-Control"),/private/);
  assert.deepEqual(new Uint8Array(await fetched.arrayBuffer()),bytes);assert.deepEqual(s.deletes,[]);
});
test("Voice saving can safely retry after a library failure without duplicate clips or presets",async()=>{
  const s=setup();s.throwWrite=true;
  const failed=await api.POST(voice());assert.equal(failed.status,503);assert.match((await failed.json()).error,/kept privately/);
  assert(s.objects.has("song-voice-references/v1/owner/reference"));
  s.throwWrite=false;assert.equal((await api.POST(voice())).status,200);assert.equal((await api.POST(voice())).status,200);
  assert.equal(current(s).templates.filter(t=>t.id==="voice-reference").length,1);
  assert.equal(s.puts.filter(key=>key==="song-voice-references/v1/owner/reference").length,1);
  const changed=await api.POST(voice("reference",{vocals:"Different voice description"}));
  assert.equal(changed.status,409);assert.match((await changed.json()).error,/different details/);
  assert.equal(current(s).templates.find(t=>t.id==="voice-reference").notes.vocals,"صوت دافئ · warm soul delivery");
});
test("Missing consent, invalid ranges, foreign audio and renamed non-audio fail before storing references",async()=>{
  const s=setup();
  for(const patch of [{permission:"false"},{from:"2",to:"33"},{from:"-1"},{audioId:"foreign"},{vocals:""}]){
    const response=await api.POST(voice("bad",patch));assert(response.status>=400);
  }
  const request=voice(),form=await request.formData();form.set("clip",new Blob(["<!DOCTYPE html>not audio"],{type:"audio/mpeg"}),"bad.mp3");
  assert.equal((await api.POST(new Request(request.url,{method:"POST",headers:{Origin:"https://studio.test"},body:form}))).status,400);
  assert.equal(s.puts.length,0);
});
test("Authentication, same-origin and owner isolation protect both song actions and reference reads",async()=>{
  const s=setup();await api.POST(voice());
  s.access=null;assert.equal((await api.POST(duplicate())).status,401);
  assert.equal((await api.GET(new Request("https://studio.test/api/studio/song-actions?voice=reference"))).status,401);
  s.access={role:"creator",id:"other-owner"};
  assert.equal((await api.POST(duplicate())).status,404);
  assert.equal((await api.GET(new Request("https://studio.test/api/studio/song-actions?voice=reference"))).status,404);
  s.access={role:"owner",id:"owner"};
  const cross=duplicate();cross.headers.set("Origin","https://foreign.test");
  assert.equal((await api.POST(cross)).status,403);
  assert.equal((await api.GET(new Request("https://studio.test/api/studio/song-actions?voice=../reference"))).status,400);
});
test("Trim, cut, paste, move and crossfades use the exact renderer assembly; invalid moves are refused",()=>{
  const base={sourceId:"s",seconds:40,start:10,end:20};
  assert.deepEqual(api.regionEditClips({...base,action:"trim"}),[{id:"s",from:10,to:20}]);
  assert.deepEqual(api.regionEditClips({...base,action:"remove"}),[{id:"s",from:0,to:10},{id:"s",from:20,to:40}]);
  const moved=api.regionEditClips({...base,action:"move",at:30});
  assert.deepEqual(moved.map(c=>[c.from,c.to]),[[0,10],[20,30],[10,20],[30,40]]);
  assert.equal(api.assemblyDuration(api.planAudioAssembly(moved,.5)),38.5);
  const pasted=api.regionEditClips({...base,action:"paste",at:30,clipboard:{id:"s",from:10,to:20}});
  assert.equal(api.assemblyDuration(api.planAudioAssembly(pasted,.5)),49);
  assert.throws(()=>api.regionEditClips({...base,action:"move",at:15}),/outside/);
  assert.throws(()=>api.regionEditClips({...base,action:"paste"}),/Copy/);
});
test("Moved and copied caption lines follow actual playback order, including crossfade offsets",()=>{
  const s=setup(),song=current(s).songs[0];
  const project={...song.lyricVideo,cues:[{text:"A",time:2,end:4},{text:"B",time:12,end:14},{text:"C",time:22,end:24},{text:"D",time:32,end:34}]};
  const recipe=clips=>({sourceSongId:"source",sourceAudioId:"audio-source",fade:.5,clips:clips.map(c=>({songId:"source",audioId:"audio-source",from:c.from,to:c.to}))});
  const moved=api.carryEditedCaptions(project,recipe(api.regionEditClips({sourceId:"source",seconds:40,action:"move",start:10,end:20,at:30})),"edited","new-audio");
  assert.deepEqual(moved.cues.map(c=>c.text),["A","C","B","D"]);
  assert(moved.cues.filter(c=>["B","C"].includes(c.text)).every(c=>c.needsReview));
  const pasted=api.carryEditedCaptions(project,recipe(api.regionEditClips({sourceId:"source",seconds:40,action:"paste",start:10,end:20,at:30,clipboard:{id:"source",from:10,to:20}})),"pasted","pasted-audio");
  assert.deepEqual(pasted.cues.map(c=>c.text),["A","B","C","B","D"]);assert.equal(pasted.pro.duration,49);
});
test("Ending fade changes gain, not duration; no unsupported native cover, cloning or repaint is advertised",()=>{
  assert.equal(api.songEndFadeGain(10,40,5),1);assert.equal(api.songEndFadeGain(37.5,40,5),.5);
  assert.equal(api.songEndFadeGain(40,40,5),0);assert.equal(api.songEndFadeGain(40,40),1);
  assert.deepEqual(api.regionEditClips({sourceId:"s",seconds:40,action:"fade",start:0,end:40}),[{id:"s",from:0,to:40}]);
  for(const engine of Object.values(api.engineCapabilities))for(const capability of ["cover","polish","editWords","melodyReference","voiceIdentity"])assert.equal(engine[capability],false);
  assert.equal(api.engineCapabilities.elevenlabs.sectionGenerate,true);assert.equal(api.engineCapabilities["ace-step"].sectionGenerate,false);
});
test("Thirty-day restore extends old shorter windows without modifying stored records or purging files",()=>{
  const at=Date.UTC(2026,10,1),source=api.freshSong("s","Song",0);
  const deleted=api.normalizeSongDeletion({...source,deletedAt:"2000-01-01"},source,at);
  assert.equal(Date.parse(deleted.deleteAfter),at+30*86400000);
  const old={...source,deletedAt:new Date(at).toISOString(),deleteAfter:new Date(at+14*86400000).toISOString()},snapshot=structuredClone(old);
  assert.equal(api.canRestoreSong(old,at+20*86400000),true);assert.equal(api.canRestoreSong(old,at+30*86400000),false);
  assert.deepEqual(old,snapshot);
});
