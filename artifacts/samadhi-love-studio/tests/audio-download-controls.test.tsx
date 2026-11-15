import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {AudioActions} from "../app/audio-actions";
import {SongCard,SongHubProvider,type SongHub} from "../app/song-card";
import {freshSong} from "../app/studio-data";
test("original download is retained beside format options and the explicit auto lyric-video handoff",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);const song={...freshSong("song","Original voice",0),audioFormat:"mp3" as const,audioId:"original-audio"};let action="";
 const hub:SongHub={busy:false,folders:[],stemsConnected:false,expanded:song.id,setExpanded(){},preview:"",setPreview(){},save:async()=>true,action:a=>{action=a;},archive:async()=>true,duplicate:async()=>true,publish:async()=>{},playlist:async()=>true};
 try{await act(async()=>root.render(<SongHubProvider value={hub}><SongCard song={song}/></SongHubProvider>));const select=document.querySelector('select[aria-label="Audio download format"]')!;assert.equal(select.querySelectorAll("option").length,5);assert.ok(document.querySelector('a[download="Original voice.mp3"]'));const auto=[...document.querySelectorAll("button")].find(b=>b.textContent==="Auto lyric video")!;await act(async()=>auto.click());assert.equal(action,"auto-video");
 await act(async()=>root.render(<AudioActions song={{...song,audioId:"new-audio"}}/>));assert.ok(document.querySelector('a[href*="new-audio"]'));assert.equal(song.audioId,"original-audio");
 }finally{await act(async()=>root.unmount());dom.window.close();}
});

test("readiness button analyzes a source, offers a version-specific report, and clears it on recording change",async()=>{
 const dom=new JSDOM('<div id="qc"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const {AudioFormatDownload}=await import("../app/audio-format-download"),{exportWav}=await import("../app/audio-export-pcm");
 const samples=Float32Array.from({length:8000},(_,i)=>.5*Math.sin(2*Math.PI*200*i/8000));const pcm={sampleRate:8000,length:samples.length,numberOfChannels:1,getChannelData:()=>samples};const wav=await exportWav(pcm,16);
 const oldFetch=globalThis.fetch,oldOffline=globalThis.OfflineAudioContext;let reads=0;
 globalThis.fetch=async()=>{reads++;return new Response(wav);};globalThis.OfflineAudioContext=class{async decodeAudioData(){return pcm;}} as any;
 const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("qc")!);
 try{await act(async()=>root.render(<AudioFormatDownload url="/private/first" title="Original" sourceKey="song:version-one"/>));const button=[...document.querySelectorAll("button")].find(b=>b.textContent==="Check audio readiness")!;await act(async()=>button.click());for(let i=0;i<200&&!document.querySelector('.audio-readiness-report');i++)await act(async()=>{await new Promise(r=>setTimeout(r,5));});
 assert.ok(document.querySelector('.audio-readiness-report'));assert.ok(document.body.textContent!.includes("-6.0 dBFS"));assert.ok(document.body.textContent!.includes("No issues were flagged"));assert.ok([...document.querySelectorAll("button")].some(b=>b.textContent==="Download check report"));assert.equal(reads,1);
 await act(async()=>root.render(<AudioFormatDownload url="/private/new" title="Original" sourceKey="song:version-two"/>));assert.equal(document.querySelector('.audio-readiness-report'),null);
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;globalThis.OfflineAudioContext=oldOffline;dom.window.close();}
});

test("opening-silence repair offers a preview/download copy and clears it when the original version changes",async()=>{
 const dom=new JSDOM('<div id="trim"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const {AudioFormatDownload}=await import("../app/audio-format-download"),{exportWav}=await import("../app/audio-export-pcm");
 const samples=new Float32Array(8000*10);for(let i=8000*8;i<samples.length;i++)samples[i]=.4*Math.sin(i/10);
 const pcm={sampleRate:8000,length:samples.length,numberOfChannels:1,getChannelData:()=>samples},original=await exportWav(pcm,16);
 const oldFetch=globalThis.fetch,oldOffline=globalThis.OfflineAudioContext,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;let saved:Blob|undefined;const revoked:string[]=[];
 globalThis.fetch=async()=>new Response(original);globalThis.OfflineAudioContext=class{async decodeAudioData(){return pcm;}} as any;URL.createObjectURL=blob=>{saved=blob as Blob;return 'blob:trim-copy';};URL.revokeObjectURL=url=>{revoked.push(url);};
 const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("trim")!);
 const waitFor=async(selector:string)=>{for(let i=0;i<200&&!document.querySelector(selector);i++)await act(async()=>{await new Promise(r=>setTimeout(r,5));});assert(document.querySelector(selector));};
 try{await act(async()=>root.render(<AudioFormatDownload url="/private/original" title="My song" sourceKey="one"/>));await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Check audio readiness')!.click());await waitFor('.audio-readiness-report');
 await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Preview without opening silence')!.click());await waitFor('audio[aria-label="Preview with opening silence removed"]');
 const link=document.querySelector<HTMLAnchorElement>('a[download="My song-opening-trimmed.wav"]')!;assert(link);assert.equal(link.href,'blob:trim-copy');assert(saved&&saved.size<original.size);assert.match(document.body.textContent!,/Realign captions/);
 await act(async()=>root.render(<AudioFormatDownload url="/private/revised" title="My song" sourceKey="two"/>));assert.equal(document.querySelector('audio'),null);assert.equal(document.querySelector('.audio-readiness-report'),null);assert(revoked.includes('blob:trim-copy'));
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;globalThis.OfflineAudioContext=oldOffline;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.close();}
});
