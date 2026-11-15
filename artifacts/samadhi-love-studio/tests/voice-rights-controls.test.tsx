import assert from "node:assert/strict";
import test from "node:test";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {Capture} from "../app/vocal/capture";
import {RightsReview} from "../app/rights-review";
import {freshSong} from "../app/studio-data";

test("own-voice recording plays backing separately, pauses/resumes, and releases microphone resources",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}});
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,"navigator");let stopped=0;const starts:number[][]=[],captures:boolean[]=[];let recorded:Blob|undefined;
  const stream={getTracks:()=>[{stop:()=>stopped++}],getAudioTracks:()=>[{addEventListener:()=>{}}]};
  Object.defineProperty(globalThis,"navigator",{value:{userAgent:"jsdom test",mediaDevices:{getUserMedia:async()=>stream,enumerateDevices:async()=>[],addEventListener:()=>{},removeEventListener:()=>{}}},configurable:true});
  let context:FakeContext;
  const node=()=>({connect:(target:unknown)=>target,stop:()=>{},start:(...args:number[])=>starts.push(args),buffer:null});
  class FakeContext {currentTime=0;state="running";destination={};closed=false;constructor(){context=this;}resume(){return Promise.resolve();}close(){this.closed=true;this.state="closed";return Promise.resolve();}createBufferSource(){return node();}createGain(){return{gain:{value:0},connect:(target:unknown)=>target};}createAnalyser(){return{fftSize:1024,getFloatTimeDomainData:()=>{}};}createMediaStreamSource(){return node();}}
  class FakeRecorder {static isTypeSupported(){return true;}state="inactive";mimeType="audio/webm";onstop?:()=>void;ondataavailable?:(e:{data:Blob})=>void;start(){this.state="recording";}pause(){this.state="paused";}resume(){this.state="recording";}stop(){this.state="inactive";this.ondataavailable?.({data:new Blob(["my original voice"])});this.onstop?.();}}
  Object.assign(globalThis,{AudioContext:FakeContext,MediaRecorder:FakeRecorder});
  const {createRoot}=await import("react-dom/client");const root=createRoot(document.getElementById("root")!);
  try{await act(async()=>root.render(<Capture bpm={100} busy={false} backing={{duration:30} as AudioBuffer} position={1.25} retake={false} beforeRecord={()=>{}} role="Lead vocal" setRole={()=>{}} onCapture={active=>captures.push(active)} onTake={blob=>{recorded=blob;}}/>));
    const count=[...document.querySelectorAll("select")].find(e=>[...e.options].some(o=>o.textContent==="4 beats"))!;
    await act(async()=>{count.value="0";count.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});
    const button=(name:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent?.trim()===name)!;
    await act(async()=>button("Record").click());assert.equal(starts[0][1],1.25);
    context!.currentTime=1;await act(async()=>button("Pause").click());await act(async()=>button("Resume").click());assert.equal(starts[1][1],2.25);
    context!.currentTime=1.5;await act(async()=>button("Stop").click());
    assert.equal(await recorded!.text(),"my original voice");assert(stopped>0);assert(context!.closed);assert(captures.includes(true));assert.equal(captures.at(-1),false);
    assert(document.body.textContent!.includes("Recording offset correction"));
  }finally{await act(async()=>root.unmount());dom.window.close();if(descriptor)Object.defineProperty(globalThis,"navigator",descriptor);}
});

test("rights UI keeps paid matching disabled without configuration and explicit consent",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement});
  const originalFetch=globalThis.fetch;const calls:RequestInit[]=[];
  globalThis.fetch=async(_url,options)=>{calls.push(options??{});return Response.json({available:false,review:null,checks:[]});};
  const {createRoot}=await import("react-dom/client");const root=createRoot(document.getElementById("root")!);
  try{await act(async()=>root.render(<RightsReview song={{...freshSong("song","My creation",0),audioFormat:"wav",audioId:"v1"}} audioId="v1"/>));
    const scan=[...document.querySelectorAll("button")].find(b=>b.textContent?.includes("Check selected"))!;assert(scan.disabled);
    assert(document.body.textContent!.includes("not connected"));assert(document.body.textContent!.includes("No match means unknown"));
    await act(async()=>{(document.querySelector('input[type="checkbox"]') as HTMLInputElement).click();});assert(scan.disabled);assert.equal(calls.length,1);assert.equal(calls[0].method,undefined);
  }finally{await act(async()=>root.unmount());globalThis.fetch=originalFetch;dom.window.close();}
});

test("mixer controls upload originals, save editable settings and reopen a cloud session",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement});
  const originalFetch=globalThis.fetch;let saved:import("../app/mixer-session").MixerSession|undefined;let uploaded=0;
  const buffer={duration:4,length:176400,numberOfChannels:1,getChannelData:()=>new Float32Array(176400)};
  class DecodeContext {async decodeAudioData(){return buffer;}async close(){}}
  Object.assign(globalThis,{AudioContext:DecodeContext});
  globalThis.fetch=async(url,options)=>{const u=new URL(String(url),"https://studio.test");if(u.pathname.includes("my-voice"))return Response.json({voices:[],next:null});
    if(options?.method==="PUT"&&u.searchParams.has("source")){uploaded++;return Response.json({saved:true});}
    if(options?.method==="PUT"){saved=JSON.parse(String(options.body));return Response.json({revision:"saved-revision"});}
    if(u.searchParams.has("source"))return new Response(new Blob(["original take"]));
    if(u.searchParams.has("session"))return Response.json({session:saved,revision:"saved-revision"});
    return Response.json({sessions:saved?[{id:saved.id,name:saved.name,updated:new Date().toISOString()}]:[],next:null});
  };
  const {Multitrack}=await import("../app/multitrack"),{DraftRecoveryProvider}=await import("../app/draft-recovery"),{createRoot}=await import("react-dom/client");
  let root=createRoot(document.getElementById("root")!);
  const mount=async()=>{await act(async()=>root.render(<DraftRecoveryProvider scope="mixer-test"><Multitrack active songs={[]} input={null} initialSongId="" saving={false} save={async()=>true}/></DraftRecoveryProvider>));};
  try{await mount();const input=document.querySelector('input[type="file"][accept*="audio"]')!;
    Object.defineProperty(input,"files",{value:[new File(["original take"],"my-voice.wav",{type:"audio/wav"})]});
    await act(async()=>input.dispatchEvent(new dom.window.Event("change",{bubbles:true})));
    const save=[...document.querySelectorAll("button")].find(b=>b.textContent==="Save editable session")!;assert(!save.disabled);
    await act(async()=>save.click());assert.equal(uploaded,1);assert.equal(saved!.tracks[0].name,"my-voice.wav");assert(!("buffer" in saved!.tracks[0]));
    await act(async()=>save.click());assert.equal(uploaded,1,"unchanged originals are not uploaded again");
    await act(async()=>root.unmount());root=createRoot(document.getElementById("root")!);await mount();
    const select=document.querySelector('.mixer-session-controls select') as unknown as HTMLSelectElement;
    await act(async()=>{select.value=saved!.id;select.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});
    for (let i=0; i<20 && !document.body.textContent!.includes("Saved session opened"); i++) await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
    assert(document.body.textContent!.includes("Saved session opened"),document.body.textContent!);assert(document.body.textContent!.includes("my-voice.wav"));
  }finally{await act(async()=>root.unmount());globalThis.fetch=originalFetch;dom.window.close();}
});
