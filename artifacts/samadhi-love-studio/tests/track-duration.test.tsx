import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import { customCreate, creationIdea, englishCreation } from "./create-controls";
import {autoTrackTime,isTrackDuration} from "../app/track-duration";
import {QuickCreate} from "../app/quick-create";
import {CreateStudio} from "../app/create-studio";
import {CaptionReadyCreate} from "../app/lyric-pro-create";
import type {ElevenLabsKey} from "../app/elevenlabs-key";

const base={vocals:true,lyrics:"",beginner:true,bpm:120,cinematic:false};
test("Auto follows whole-song prompt durations and treats maximums as limits",()=>{
  for(const [prompt,expected] of [["A four-minute song",240],["An eight minute song",480],["A 3:47 song",227],["3 minutes 30 seconds",210],["A 90-second jingle",90],["A six-minute song",360],["A 30-second intro then a 4-minute song",240],["Intro lasts 30 seconds. Make the whole song 3:30",210],["Duration 3.5 min",210]] as const)assert.equal(autoTrackTime({...base,prompt}).seconds,expected,prompt);
  assert.equal(autoTrackTime({...base,prompt:"A song up to six minutes"}).seconds,175);
  assert.equal(autoTrackTime({...base,prompt:"A 5-minute song, maximum 4 minutes"}).seconds,240);
  assert.equal(autoTrackTime({...base,prompt:"Maximum 1.11 minutes"}).seconds,66);
  assert.equal(autoTrackTime({...base,prompt:"A dance song at 140 BPM"}).seconds,150);
  assert.notEqual(autoTrackTime({...base,prompt:"A dance song at 90 BPM"}).seconds,autoTrackTime({...base,prompt:"A dance song at 140 BPM"}).seconds);
  assert.equal(autoTrackTime({...base,prompt:"A ten-minute song"}).seconds,600);
});
test("Auto uses template targets and lyric structure without counting production instructions",()=>{
  assert.equal(autoTrackTime({...base,templateSeconds:278}).seconds,278);
  assert.equal(autoTrackTime({...base,prompt:"A 2-minute song",templateSeconds:278}).seconds,120);
  const words="Love and light together";
  assert.equal(autoTrackTime({...base,lyrics:words}).seconds,autoTrackTime({...base,lyrics:"{genre: "+"House ".repeat(120)+"}\n"+words}).seconds);
  assert.equal(autoTrackTime({...base,lyrics:"love ".repeat(1200)}).seconds,600);
  assert(autoTrackTime({...base,prompt:"An extended dance song"}).seconds>autoTrackTime(base).seconds);
  assert.equal(autoTrackTime({...base,prompt:"A short teaser"}).seconds,60);
  assert.equal(autoTrackTime({...base,beginner:false}).seconds,autoTrackTime(base).seconds);
  for(const bpm of [NaN,0,1,50,120,180,1000])for(const cinematic of [true,false])for(const vocals of [true,false])assert(isTrackDuration(autoTrackTime({...base,bpm,cinematic,vocals}).seconds));
});

async function setup(){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,requestAnimationFrame:()=>0,IS_REACT_ACT_ENVIRONMENT:true});
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  const button=(label:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent?.trim()===label)!;
  async function input(element:HTMLInputElement|HTMLTextAreaElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element),"value")!.set!.call(element,value);element.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});}
  const select=async(value:string)=>{if(document.querySelector('[data-testid="tab-mode-custom"]'))await customCreate();await englishCreation();await act(async()=>{const control=[...document.querySelectorAll("select")].find(s=>s.parentElement?.textContent?.startsWith("Song opening"))!;control.value=value;control.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});};
  const submit=()=>act(async()=>{document.querySelector("form")!.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));});
  return {root,button,input,select,submit,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}
test("Quick Create sends the displayed automatic duration instead of its old fixed duration",async()=>{
  const h=await setup();let duration=0,opening="";
  try{
    await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{duration=input.duration;opening=input.openingMode??"";return undefined;}} saveSketch={async()=>undefined}/>));
    await h.select("direct");await h.input(creationIdea(),"A four-minute joyful song");await h.submit();assert.equal(duration,240);assert.equal(opening,"direct");assert.match(document.querySelector('[data-testid="text-create-summary"]')!.textContent!,/4:00/);
    await h.input(creationIdea(),"An eight-minute joyful song");await h.submit();assert.equal(duration,480);assert.match(document.querySelector('[data-testid="text-create-summary"]')!.textContent!,/8:00/);
    await h.input(creationIdea(),"A 30-second joyful hook");await h.submit();assert.equal(duration,30);
    await h.input(creationIdea(),"A 20-minute joyful song");await h.submit();assert.equal(duration,30,"unsupported requests are blocked before generation instead of silently shortened");assert(document.body.textContent!.includes("more than ten minutes"));
  }finally{await h.close();}
});
test("Guided Auto honors prompt timing while retaining manual duration control",async()=>{
  const h=await setup();let duration=0,opening="";
  try{
    await act(async()=>h.root.render(<CreateStudio seed={{idea:"A 4:45 joyful song",seconds:120,instrumental:false}} voiceDesignAllowed={false} elevenLabs={{connected:true,defaultProvider:true,busy:false} as ElevenLabsKey} connectionSettings={()=>{}} drafts={[]} voices={[]} saving={false} operationError="" startAtDrafts={false} firstSongRequest={false} finishFirstSongRequest={()=>{}} openVocalStudio={()=>{}} send={async input=>{duration=Number(input.duration);opening=String(input.openingMode);return true;}} saveDraft={async()=>true} saveInstrumental={async()=>true} move={async()=>true} open={()=>{}} remix={()=>{}}/>));
    await act(async()=>[...document.querySelectorAll("button")].find(b=>b.querySelector("strong")?.textContent==="Beginner")!.click());
    const auto=document.querySelector('.track-length-control input[type="checkbox"]') as HTMLInputElement;
    assert.equal(auto.checked,false);await h.select("short");await h.submit();assert.equal(duration,120);assert.equal(opening,"short");
    await act(async()=>auto.click());await h.submit();assert.equal(duration,285);
    await act(async()=>auto.click());await act(async()=>h.button("2:00").click());await h.submit();assert.equal(duration,120);
  }finally{await h.close();}
});
test("caption-ready lyric drafting and audio creation use the same prompt-based duration",async()=>{
  const h=await setup(),oldFetch=globalThis.fetch;let draftDuration=0,createdDuration=0,approved="",draftOpening="",createdOpening="";
  const lyrics="[Verse]\nLove and light together";
  globalThis.fetch=async(_url,options)=>{if(String(_url)==="/api/studio/credits")return Response.json({funding:"own",credits:0,enabled:true});draftDuration=JSON.parse(String(options?.body)).duration;draftOpening=JSON.parse(String(options?.body)).openingMode;return Response.json({lyrics});};
  try{
    await act(async()=>h.root.render(<CaptionReadyCreate provider={{connected:true} as ElevenLabsKey} generate={async input=>{createdDuration=Number(input.duration);approved=String(input.lyrics);createdOpening=String(input.openingMode);return undefined;}} done={()=>{}} connect={()=>{}} audit={false} changeAudit={()=>{}} drafts={[]}/>));
    await h.select("direct");await h.input(document.querySelector("textarea")!,"A 4-minute joyful song");
    await act(async()=>h.button("Draft lyrics with ElevenLabs").click());assert.equal(draftDuration,240);assert.equal(draftOpening,"direct");
    const approve=[...document.querySelectorAll('input[type="checkbox"]')].find(i=>i.parentElement?.textContent?.includes("I approve")) as HTMLInputElement;
    await act(async()=>approve.click());await act(async()=>h.button("Generate song + prepare lyric video").click());
    assert.equal(createdDuration,240);assert.equal(createdOpening,"direct");assert.equal(approved,lyrics);
  }finally{globalThis.fetch=oldFetch;await h.close();}
});

test("a heading-only template is automatically used as writing structure rather than finished lyrics",async()=>{
  const h=await setup();let payload:Record<string,unknown>|undefined;
  const structure="[Intro]\n\n[Verse]\n\n[Chorus]";
  try{
    await act(async()=>h.root.render(<CreateStudio seed={{idea:"A joyful original song",lyrics:structure,instrumental:false}} voiceDesignAllowed={false} elevenLabs={{connected:true,defaultProvider:true,busy:false} as ElevenLabsKey} connectionSettings={()=>{}} drafts={[]} voices={[]} saving={false} operationError="" startAtDrafts={false} firstSongRequest={false} finishFirstSongRequest={()=>{}} openVocalStudio={()=>{}} send={async input=>{payload=input;return true;}} saveDraft={async()=>true} saveInstrumental={async()=>true} move={async()=>true} open={()=>{}} remix={()=>{}}/>));
    await act(async()=>[...document.querySelectorAll("button")].find(b=>b.querySelector("strong")?.textContent==="Beginner")!.click());
    await englishCreation();await h.submit();
    assert(payload);assert.equal(payload.lyrics,"");assert.equal(payload.arrangement,structure);
  }finally{await h.close();}
});
