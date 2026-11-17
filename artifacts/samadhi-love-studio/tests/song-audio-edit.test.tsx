import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {editSongSection} from "../app/song-section-data";
import {assemblyDuration,planAudioAssembly} from "../app/audio-assembly";
import {waveformTime} from "../app/song-waveform";
import {SongSectionEditor} from "../app/song-section-editor";
import {SongCard,SongHubProvider,type SongHub} from "../app/song-card";
import {freshSong} from "../app/studio-data";
import type {Song} from "../app/studio-data";

test("crop and cuts at start, middle and ending retain the right source ranges and automatically close gaps",()=>{
 assert.deepEqual(editSongSection('s',120,'trim',10,100),[{id:'s',from:10,to:100}]);assert.deepEqual(editSongSection('s',120,'remove',0,10),[{id:'s',from:10,to:120}]);assert.deepEqual(editSongSection('s',120,'remove',100,120),[{id:'s',from:0,to:100}]);const middle=editSongSection('s',120,'remove',30,45);assert.deepEqual(middle,[{id:'s',from:0,to:30},{id:'s',from:45,to:120}]);const p=planAudioAssembly(middle,.015,600);assert.ok(Math.abs(assemblyDuration(p)-104.985)<1e-8);assert.ok(Math.abs(p[1].start-29.985)<1e-8);assert.throws(()=>editSongSection('s',120,'trim',5,5));assert.throws(()=>editSongSection('s',120,'remove',0,120));
});
test("waveform pointer times clamp to the actual song duration",()=>{assert.equal(waveformTime(350,100,1000,120),30);assert.equal(waveformTime(-1,100,1000,120),0);assert.equal(waveformTime(2000,100,1000,120),120);assert.equal(waveformTime(NaN,0,1000,120),0);});

test("the visible editor crops, previews, blocks stale saves and saves a new version with original lineage",async()=>{
 const fixture=(globalThis as any).__audioEdit;fixture.renders=[];fixture.uploads=[];
 const dom=new JSDOM('<div id="root"></div>',{url:'https://studio.test'});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 dom.window.HTMLMediaElement.prototype.play=async()=>{};dom.window.HTMLMediaElement.prototype.pause=()=>{};
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root')!);const song={...freshSong('original','My creation',0),audioId:'original-recording',audioFormat:'mp3' as const};const before=JSON.stringify(song);let saved:any;
 const button=(label:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent===label)!;
 const input=async(field:HTMLInputElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field),'value')!.set!.call(field,value);field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
 const wait=async(done:()=>boolean)=>{for(let i=0;i<200&&!done();i++)await act(async()=>{await new Promise(r=>setTimeout(r,5));});assert.ok(done());};
 try{await act(async()=>root.render(<SongSectionEditor song={song} songs={[song]} owner="owner" working={()=>{}} saved={async value=>{saved=value;}}/>));await wait(()=>document.body.textContent!.includes('120.00 seconds'));assert.ok(document.querySelector('svg[aria-label="Song waveform with selected time range"]'));
 const action=document.querySelector('select')!;await act(async()=>{action.value='trim';action.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});const from=[...document.querySelectorAll('label')].find(l=>l.textContent?.startsWith('Section start'))!.querySelector('input')!,to=[...document.querySelectorAll('label')].find(l=>l.textContent?.startsWith('Section end'))!.querySelector('input')!;await input(from,'10');await input(to,'100');await act(async()=>button('Preview edited version').click());assert.deepEqual(fixture.renders.at(-1),[{id:'original',from:10,to:100}]);assert.equal(fixture.uploads.length,0);
 await input(to,'95');assert.ok(button('Save as a new version').disabled);assert.ok(document.body.textContent!.includes('selection has changed'));await act(async()=>button('Preview edited version').click());assert.ok(!button('Save as a new version').disabled);await act(async()=>button('Save as a new version').click());assert.equal(fixture.uploads.length,1);assert.equal(fixture.uploads[0].options.editPlan.sourceAudioId,'original-recording');assert.equal(fixture.uploads[0].options.projectId,'original');assert.deepEqual(fixture.uploads[0].options.editPlan.clips,[{songId:'original',audioId:'original-recording',from:10,to:95}]);assert.equal(saved.id,'edited');assert.equal(JSON.stringify(song),before);
 }finally{await act(async()=>root.unmount());dom.window.close();}
});

test("Make it longer starts after the saved recording and asks before requesting another passage",async()=>{
 const fixture=(globalThis as any).__audioEdit;fixture.renders=[];fixture.uploads=[];
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 let confirmation="";dom.window.confirm=(message:string)=>{confirmation=message;return false;};
 const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 const song={...freshSong("original","My creation",0),audioId:"original-recording",audioFormat:"mp3" as const};
 const button=(label:string)=>[...document.querySelectorAll<HTMLButtonElement>("button")].find(item=>item.textContent===label)!;
 const wait=async(done:()=>boolean)=>{for(let i=0;i<200&&!done();i++)await act(async()=>{await new Promise(resolve=>setTimeout(resolve,5));});assert.ok(done());};
 try{
  await act(async()=>root.render(<SongSectionEditor song={song} songs={[song]} owner="owner" working={()=>{}} saved={async()=>{}} initialAction="insert"/>));
  await wait(()=>document.body.textContent!.includes("120.00 seconds"));
  assert.equal(document.querySelector("select")!.value,"insert");
  const start=document.querySelector<HTMLInputElement>('[aria-label="Waveform selection start"]')!;
  const end=document.querySelector<HTMLInputElement>('[aria-label="Waveform selection end"]')!;
  assert.equal(start.value,"120");assert.equal(end.value,"120");
  const prompt= [...document.querySelectorAll("details")].find(item=>item.textContent?.includes("Generate a replacement section from a prompt"))!;
  await act(async()=>{prompt.open=true;});
  const field=prompt.querySelector("textarea")!;await act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field),"value")!.set!.call(field,"Add a gentle closing chorus");field.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});
  await act(async()=>button("Generate replacement section").click());
  assert.match(confirmation,/one 15-second replacement passage/);assert.match(confirmation,/original recording stays saved/i);
  assert.equal((globalThis as any).__audioEdit.renders.length,0);assert.equal((globalThis as any).__audioEdit.uploads.length,0);
 }finally{await act(async()=>root.unmount());dom.window.close();}
});

test("section generation exposes saved language, editable choices for legacy songs and an instrumental bypass",async()=>{
 const old:Song={...freshSong("legacy","Legacy song",0),audioFormat:"mp3"};
 const known:Song={...old,id:"known",generation:{provider:"ElevenLabs",model:"music_v2_5",audioId:"known",approvedLyrics:"شو حلو هالليل معك",compositionPlan:{},createdAt:"2026-11-15T00:00:00Z",captionReady:true,timingSource:"not-provided",languageProfile:{language:"auto",resolved:"ar",dialect:"ar-LB",source:"script-suggestion"}}};
 for(const song of [old,known,{...old,id:"instrumental",creationKind:"instrumental" as const}]){
  const dom=new JSDOM('<div id="root"></div>',{url:'https://studio.test'});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
  dom.window.HTMLMediaElement.prototype.pause=()=>{};
  const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  try{
   await act(async()=>root.render(<SongSectionEditor song={song} songs={[song]} owner="owner" working={()=>{}} saved={async()=>{}}/>));
   const action=document.querySelector("select")!;
   await act(async()=>{action.value="replace";action.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});
   const checkbox=[...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find(i=>i.parentElement?.textContent?.includes("Instrumental replacement"))!;
   assert.equal(checkbox.checked,song.creationKind==="instrumental");
   const language=()=>[...document.querySelectorAll("select")].find(s=>s.parentElement?.textContent?.startsWith("Singing language"));
   if(song.creationKind==="instrumental"){assert.equal(language(),undefined);await act(async()=>checkbox.click());assert.equal(language()!.value,"auto");}
   else{
    assert.equal(language()!.value,song.id==="known"?"ar":"auto");
    if(song.id==="known"){const dialect=[...document.querySelectorAll("select")].find(s=>s.parentElement?.textContent?.startsWith("Dialect"))!;assert.equal(dialect.value,"ar-LB");}
    await act(async()=>{language()!.value="ja";language()!.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});
    assert.equal(language()!.value,"ja");
   }
  }finally{await act(async()=>root.unmount());dom.window.close();}
 }
});

test("completed song cards expose editing, voice recording and mixing in the simple creator flow",async()=>{
 const dom=new JSDOM('<div id="card"></div>',{url:'https://studio.test'});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});const{createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('card')!);const song={...freshSong('made','Made song',0),audioId:'audio',audioFormat:'mp3' as const};let action='';const hub:SongHub={busy:false,simple:true,folders:[],stemsConnected:false,expanded:song.id,setExpanded(){},preview:'',setPreview(){},save:async()=>true,action:a=>{action=a;},archive:async()=>true,duplicate:async()=>true,publish:async()=>{},playlist:async()=>true};
 try{await act(async()=>root.render(<SongHubProvider value={hub}><SongCard song={song}/></SongHubProvider>));const button=(label:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent===label)!;await act(async()=>button('Edit audio').click());assert.equal(action,'sections');await act(async()=>button('Add / record voice').click());assert.equal(action,'record');await act(async()=>button('Mix / add audio').click());assert.equal(action,'mix');assert.ok(document.querySelector('a[download]'));
 }finally{await act(async()=>root.unmount());dom.window.close();}
});
