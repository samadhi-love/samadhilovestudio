import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {LyricVideoPro} from "../app/lyric-video-pro";
import {freshSong} from "../app/studio-data";
import {newProSettings} from "../app/lyric-pro-data";
import type {ElevenLabsKey} from "../app/elevenlabs-key";

for(const source of ["device","paid-sync"] as const)test(`video silently resumes ${source} captions without a recovery panel or provider request`,async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Image:dom.window.Image,localStorage:dom.window.localStorage,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},IS_REACT_ACT_ENVIRONMENT:true});
 Object.defineProperty(document,"fonts",{value:{load:async()=>[]}});
 window.matchMedia=(()=>({matches:false,addEventListener(){},removeEventListener(){}})) as any;
 dom.window.HTMLCanvasElement.prototype.getContext=(()=>null) as any;
 const base={...freshSong(`quiet-video-${source}`,"Quiet video",0),audioId:"original",audioFormat:"mp3" as const};
 const project={theme:"cosmic" as const,motion:"drift" as const,format:"vertical" as const,cues:source==="device"?[{time:1,end:4,text:"Previously saved words"}]:[],pro:{...newProSettings(base,60),updatedAt:"2026-11-18T12:00:00.000Z"}};
 const song={...base,lyricVideo:project},text="نور — silently kept words";
 const local={...project,cues:[{time:1,end:4,text}]};
 if(source==="device")localStorage.setItem(`samadhi-lyric-recovery:quiet-video-owner:${song.id}`,JSON.stringify(local));
 const oldFetch=globalThis.fetch,saves:any[]=[];let paidCalls=0;
 globalThis.fetch=async(url,init)=>{
  if(String(url)==="/api/studio/lyric-project"&&init?.method==="PUT"){
   const input=JSON.parse(String(init.body));saves.push(input);
   return Response.json({project:{...input.project,pro:{...input.project.pro,updatedAt:"2026-11-18T12:01:00.000Z"}},data:{songs:[song],templates:[]},revision:1});
  }
  if(String(url).includes("/lyric-sync/recovery"))return Response.json(source==="paid-sync"?{recovery:{cues:local.cues,engine:"saved sync",warnings:[]}}:{});
  if(init?.method==="POST"){paidCalls++;throw new Error("No paid calls in this test");}
  return Response.json({versions:[],workspace:"quiet-video-owner"});
 };
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 const provider={connected:true,busy:false,status:{available:true,saved:true,musicAccess:"available"}} as ElevenLabsKey;
 try{
  await act(async()=>root.render(<LyricVideoPro songs={[song]} initialSongId={song.id} saving={false} save={async()=>true} elevenLabs={provider} connectionSettings={()=>{}} upload={()=>{}} generate={async()=>undefined} importFile={async()=>undefined} persisted={()=>{}} persistBusy={()=>{}} dirty={()=>{}}/>));
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,1900));});
  assert.equal(saves.at(-1)?.project.cues[0].text,text);
  assert.equal(paidCalls,0);
  assert(!/Restore recovered edits|Restore your last caption sync|Discard device recovery/.test(document.body.textContent!));
  if(source==="device")assert.equal(JSON.parse(localStorage.getItem(`samadhi-lyric-recovery:quiet-video-owner:${song.id}`)!).cues[0].text,text);
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();}
});

test("an uploaded recording accepts pasted multilingual lyrics and sends exact reference words for alignment without changing song lyrics",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Image:dom.window.Image,localStorage:dom.window.localStorage,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},IS_REACT_ACT_ENVIRONMENT:true});
 Object.defineProperty(document,"fonts",{value:{load:async()=>[]}});window.matchMedia=(()=>({matches:false,addEventListener(){},removeEventListener(){}})) as any;dom.window.HTMLCanvasElement.prototype.getContext=(()=>null) as any;
 const base={...freshSong("uploaded","Created in another app",0),audioId:"uploaded-original",audioFormat:"mp3" as const};
 const song={...base,lyricVideo:{theme:"cosmic" as const,motion:"drift" as const,format:"vertical" as const,cues:[],pro:newProSettings(base,60)}};
 const pasted="[Verse]\nنور وحب, love and light!",requests:Record<string,any>[]=[],saves:Record<string,any>[]=[];
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async(url,init)=>{
  if(String(url)==="/api/studio/credits")return Response.json({funding:"own",credits:0,enabled:true});
  if(String(url)==="/api/studio/jobs"){const queued=JSON.parse(String(init?.body));assert.equal(queued.route,"/api/studio/lyric-sync");const input=queued.input;requests.push(input);return input.mode==="audit"?Response.json({transcript:"نور وحب, love and light!",differences:[],confidenceAvailable:false}):Response.json({cues:[{text:"نور وحب, love and light!",time:1,end:5}],engine:"alignment fixture",warnings:[]});}
  if(String(url)==="/api/studio/lyric-project"&&init?.method==="PUT"){const input=JSON.parse(String(init.body));saves.push(input);return Response.json({project:{...input.project,pro:{...input.project.pro,updatedAt:"2026-11-13T13:00:00Z"}},data:{songs:[song],templates:[]},revision:1});}
  return Response.json({versions:[],workspace:""});
 };
 const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 const provider={connected:true,busy:false,status:{available:true,saved:true,musicAccess:"available"}} as ElevenLabsKey;
 const button=(text:string)=>[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===text)!;
 try{
  await act(async()=>root.render(<LyricVideoPro songs={[song]} initialSongId={song.id} autoCaptionRequest={{songId:song.id,id:"uploaded-auto"}} saving={false} save={async()=>true} elevenLabs={provider} connectionSettings={()=>{}} upload={()=>{}} generate={async()=>undefined} importFile={async()=>undefined} persisted={()=>{}} persistBusy={()=>{}} dirty={()=>{}}/>));
  assert.equal(requests.length,0,"an upload offers reference lyrics before making a paid transcription request");
  await act(async()=>button('Paste / edit lyrics').click());
  const textarea=document.querySelector<HTMLTextAreaElement>('[aria-label="Saved or pasted lyrics"]')!;assert(textarea);assert((textarea.closest('details') as HTMLDetailsElement).open);
  await act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(textarea),'value')!.set!.call(textarea,"[Verse]");textarea.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  await act(async()=>button('Align lyrics to recording').click());assert.equal(requests.length,0);assert(document.body.textContent!.includes('not only section headings'));
  await act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(textarea),'value')!.set!.call(textarea,pasted);textarea.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  await act(async()=>button('Align lyrics to recording').click());
  const aligned=requests.filter(r=>r.mode==='align');assert.equal(aligned.length,1);assert.equal(aligned[0].text,pasted);assert.equal(aligned[0].sourceAudioId,'uploaded-original');assert.equal(aligned[0].audioId,'uploaded-original');
  assert.equal(saves[0].project.pro.approvedLyrics,pasted);assert.equal(saves[0].project.cues[0].text,'نور وحب, love and light!');assert.equal(song.notes.lyrics,'');assert.equal(song.audioId,'uploaded-original');assert(document.body.textContent!.includes('Caption editor'));
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();}
});
