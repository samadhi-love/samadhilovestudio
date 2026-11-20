import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {songClips} from "../app/vocal/render";
import {dry,noTuning,emptySession,validSession,type Clip} from "../app/vocal/session";
import {lyricVideoFor} from "../app/project-assets";
import {freshSong} from "../app/studio-data";

const clip=(over:Partial<Clip>):Clip=>({id:crypto.randomUUID(),source:"s",name:"Take",role:"Lead vocal",start:0,end:5,at:0,volume:1,pan:0,mute:false,solo:false,bypass:false,effects:{...dry},tuning:{...noTuning},fadeIn:0,fadeOut:0,...over});

test("the saved song never contains guide tracks (the AI singer you followed)",()=>{
  const music=clip({role:"Instrumental",name:"music"}),guide=clip({role:"Background vocal",name:"AI guide voice",guide:true}),me=clip({name:"My take"}),muted=clip({mute:true});
  assert.deepEqual(songClips([music,guide,me,muted]).map(c=>c.name),["music","My take"]);
  assert.deepEqual(songClips([guide]),[],"nothing to save until you sing");
});

test("sessions with a guide track save and reopen; a bad guide value is rejected",()=>{
  const sourceId=crypto.randomUUID();
  const base={...emptySession(),sources:[{id:sourceId,name:"AI guide voice",duration:10}]};
  const guide=clip({source:sourceId,guide:true});
  assert.ok(validSession({...base,clips:[guide]}));
  assert.ok(!validSession({...base,clips:[{...guide,guide:"yes" as unknown as boolean}]}));
});

test("'Make lyric video' opens the recording with your voice and starts its captions",()=>{
  const mix={...freshSong("mix","My voice mix",0),projectId:"root"};
  assert.deepEqual(lyricVideoFor(mix),{songId:"mix",autoCaptions:true});
  assert.equal(lyricVideoFor({...mix,lyricVideo:{theme:"cosmic",motion:"drift",format:"wide",cues:[{text:"Hi",time:0,end:1}]}}).autoCaptions,false,"existing timing is kept");
  assert.equal(lyricVideoFor({...mix,creationKind:"instrumental"}).autoCaptions,false);
});

test("Vocal Studio offers 'Set up sing-along' for a sung song, splits it once on request, and keeps the song safe if splitting fails",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
  (window as any).confirm=()=>true;(globalThis as any).confirm=()=>true;
  const calls:{url:string;body?:string}[]=[];
  const oldFetch=globalThis.fetch;
  globalThis.fetch=(async(url:string,init?:RequestInit)=>{calls.push({url:String(url),body:init?.body as string|undefined});
    if(String(url)==="/api/studio/stems")return Response.json({error:"ElevenLabs is busy. Try again in a minute."},{status:502});
    if(String(url)==="/api/studio/credits")return Response.json({funding:"own",credits:0,enabled:true});
    return Response.json({sessions:[],voices:[]});}) as typeof fetch;
  const {VocalStudio}=await import("../app/vocal/vocal-studio");
  const {createRoot}=await import("react-dom/client");const root=createRoot(document.getElementById("root")!);
  const sung={...freshSong("sung","Morning Light",0),audioId:"audio-1",audioFormat:"mp3" as const};sung.notes.lyrics="Rise with the morning light";
  const instrumental={...freshSong("inst","Calm Beat",1),audioId:"audio-2",audioFormat:"mp3" as const,creationKind:"instrumental" as const};
  const props={active:true,songs:[sung,instrumental],saving:false,input:null,onCapture(){},publish:async()=>undefined,sendMix(){},openSong(){}};
  const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  try{
    await act(async()=>root.render(<VocalStudio {...props} initialSongId="sung"/>));
    await act(async()=>{await new Promise(r=>setTimeout(r,0));});
    assert.match(q("sing-along")!.textContent!,/Only your voice goes into your song/);
    await act(async()=>q("button-sing-along")!.click());
    await act(async()=>{await new Promise(r=>setTimeout(r,0));});
    const stems=calls.filter(c=>c.url==="/api/studio/stems");
    assert.equal(stems.length,1,"one split, never retried");
    assert.deepEqual(JSON.parse(stems[0].body!),{songId:"sung",audioId:"audio-1",mode:"two_stems_v1",confirmed:true});
    assert.match(document.body.textContent!,/ElevenLabs is busy/);
    assert.ok(q("sing-along"),"nothing was added; the song is unchanged and you can try again");
  }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();}
});

test("after a successful split: the music and the AI guide voice land in the session, the guide is marked 'not in your song', and the words to sing show",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
  (globalThis as any).confirm=()=>true;
  // Stand-in decoder: 10 seconds of quiet stereo audio for any file.
  class FakeAudioContext{async decodeAudioData(){const data=new Float32Array(441000);return {duration:10,length:441000,numberOfChannels:2,sampleRate:44100,getChannelData:()=>data};}close(){return Promise.resolve();}}
  (globalThis as any).AudioContext=FakeAudioContext;
  const {zipSync}=await import("fflate");
  const archive=zipSync({"vocals.mp3":new Uint8Array([1,2,3,4]),"instrumental.mp3":new Uint8Array([5,6,7,8])});
  const oldFetch=globalThis.fetch;
  globalThis.fetch=(async(url:string)=>String(url)==="/api/studio/stems"?new Response(archive,{headers:{"Content-Type":"application/zip"}})
    :String(url)==="/api/studio/credits"?Response.json({funding:"own",credits:0,enabled:true}):Response.json({sessions:[],voices:[]})) as typeof fetch;
  const {VocalStudio}=await import("../app/vocal/vocal-studio");
  const {createRoot}=await import("react-dom/client");const root=createRoot(document.getElementById("root")!);
  const sung={...freshSong("sung","Morning Light",0),audioId:"audio-1",audioFormat:"mp3" as const};sung.notes.lyrics="Rise with the morning light";
  const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  try{
    await act(async()=>root.render(<VocalStudio active songs={[sung]} saving={false} input={null} onCapture={()=>{}} publish={async()=>undefined} sendMix={()=>{}} openSong={()=>{}} initialSongId="sung"/>));
    await act(async()=>{await new Promise(r=>setTimeout(r,0));});
    await act(async()=>q("button-sing-along")!.click());
    for(let i=0;i<5;i++)await act(async()=>{await new Promise(r=>setTimeout(r,0));});
    const text=document.body.textContent!;
    assert.match(text,/Morning Light · music/,"the music track");
    assert.match(text,/AI guide voice · not in your song/,"the guide track, clearly named");
    assert.ok(q("sing-along-ready"),"setup panel replaced by the ready panel");
    assert.match(q("sing-along-ready")!.textContent!,/Rise with the morning light/,"words to sing");
    assert.equal(q("sing-along"),null,"no second split offered");
  }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;delete (globalThis as any).AudioContext;dom.window.close();}
});
