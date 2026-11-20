import test from "node:test";
import assert from "node:assert/strict";
import React,{act,useState} from "react";
import {QuickCreate} from "../app/quick-create";
import {freshSong} from "../app/studio-data";
import {JSDOM} from "jsdom";
import {MyVoices} from "../app/my-voices";
import type {SavedVoice} from "../app/my-voice-data";

const voice=(i:number,verified=true):SavedVoice=>({id:`00000000-0000-4000-8000-00000000000${i}`,name:`Voice ${i}`,speaker:"Samadhi",duration:42,createdAt:"2026-11-20T12:00:00Z",mime:"audio/wav",verified});
async function setup(listed:SavedVoice[]){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:"https://studio.test"});
  const calls:{method:string;url:string;body?:FormData}[]=[];let voices=[...listed];
  const fetch=async(url:string,init:RequestInit={})=>{
    const method=init.method??"GET";calls.push({method,url,body:init.body as FormData});
    if(method==="GET")return Response.json({voices});
    if(method==="DELETE"){const id=new URL(url,"https://studio.test").searchParams.get("id");voices=voices.filter(v=>v.id!==id);return Response.json({deleted:id});}
    const f=init.body as FormData,saved={...voice(9),name:String(f.get("name")),speaker:String(f.get("speaker"))};voices.push(saved);return Response.json({voice:saved});
  };
  // A pretend microphone and file reader: no real devices in tests.
  class FakeRecorder{state="inactive";mimeType="audio/webm";ondataavailable?:(e:{data:Blob})=>void;onstop?:()=>void;
    constructor(public stream:unknown){}start(){this.state="recording";}stop(){this.state="inactive";this.ondataavailable?.({data:new Blob(["sound"])});this.onstop?.();}}
  class FakeAudio{preload="";onloadedmetadata?:()=>void;onerror?:()=>void;duration=30;set src(_v:string){queueMicrotask(()=>this.onloadedmetadata?.());}}
  let now=1_000_000;
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true,fetch,MediaRecorder:FakeRecorder,Audio:FakeAudio});
  Object.defineProperty(globalThis,"navigator",{value:{userAgent:"node",mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},configurable:true});
  dom.window.confirm=()=>true;Date.now=()=>now;
  URL.createObjectURL=()=>"blob:fake";URL.revokeObjectURL=()=>{};
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  const opened:SavedVoice[]=[];let sang=0;
  await act(async()=>root.render(<MyVoices useInSong={()=>sang++} makeVideo={async v=>{opened.push(v);}}/>));
  const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const type=async(el:HTMLInputElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),"value")!.set!.call(el,value);el.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});
  const click=async(id:string)=>act(async()=>q(id)!.click());
  return {dom,root,calls,q,type,click,opened,sang:()=>sang,advance:(s:number)=>{now+=s*1000;},close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}

test("four places: saved verified voices fill them, older plain takes stay out, the next place offers Add",async()=>{
  const h=await setup([voice(1),voice(2,false)]);
  try{
    assert.equal(document.querySelectorAll(".my-voices-slot").length,4);
    assert.ok(h.q(`voice-${voice(1).id}`));assert.equal(h.q(`voice-${voice(2).id}`),null,"unverified takes are not counted");
    assert.match(h.q(`voice-${voice(1).id}`)!.textContent!,/✓ Verified · Samadhi/);
    assert.ok(h.q("button-add-voice"));
    assert.match(document.querySelector(".my-voices-rules")!.textContent!,/Children's voices and other people's voices can't be saved/);
  }finally{await h.close();}
});

test("adding a voice: names, the consent sentence read aloud, the voice itself, both confirmations, then save",async()=>{
  const h=await setup([]);
  try{
    await h.click("button-add-voice");
    await h.click("button-save-voice");
    assert.match(h.q("text-add-voice-error")!.textContent!,/Name this voice/);
    await h.type(h.q("input-voice-name") as HTMLInputElement,"Morning voice");
    await h.type(h.q("input-voice-speaker") as HTMLInputElement,"Samadhi");
    assert.equal(h.q("text-consent-phrase")!.textContent,"“My name is Samadhi. This is my own voice. I am 18 or older, and I agree to use it in Versual Studio.”");
    await h.click("consent-record");h.advance(6);await h.click("consent-stop");
    const file=new File(["RIFF0000WAVEdata"],"song.wav",{type:"audio/wav"});
    const input=h.q("voice-file") as HTMLInputElement;
    await act(async()=>{Object.defineProperty(input,"files",{value:[file],configurable:true});input.dispatchEvent(new h.dom.window.Event("change",{bubbles:true}));});
    await h.click("button-save-voice");
    assert.match(h.q("text-add-voice-error")!.textContent!,/own voice/,"both confirmations are required");
    await h.click("checkbox-own-voice");await h.click("checkbox-adult");
    await h.click("button-save-voice");
    const post=h.calls.find(c=>c.method==="POST")!;
    assert.equal(post.body!.get("consentText"),"My name is Samadhi. This is my own voice. I am 18 or older, and I agree to use it in Versual Studio.");
    assert.deepEqual([post.body!.get("adult"),post.body!.get("ownVoice"),post.body!.get("voiceDuration"),post.body!.get("consentDuration")],["true","true","30.0","6.0"]);
    assert.ok(post.body!.get("voice") instanceof Blob&&post.body!.get("consent") instanceof Blob);
    assert.equal(h.q("add-voice"),null);
    assert.match(document.querySelector('[role="status"]')!.textContent!,/“Morning voice” is saved and verified/);
  }finally{await h.close();}
});

test("when all 4 places are used there is no Add; a saved voice sings on a song, makes a lyric video, or is deleted",async()=>{
  const h=await setup([voice(1),voice(2),voice(3),voice(4)]);
  try{
    assert.equal(h.q("button-add-voice"),null);
    assert.match(h.q("text-voices-full")!.textContent!,/All 4 places are used/);
    await h.click(`button-voice-song-${voice(1).id}`);assert.equal(h.sang(),1);
    await h.click(`button-voice-video-${voice(2).id}`);assert.equal(h.opened[0].id,voice(2).id);
    await h.click(`button-voice-delete-${voice(3).id}`);
    assert.ok(h.calls.some(c=>c.method==="DELETE"&&c.url.includes(voice(3).id)));
    assert.equal(h.q(`voice-${voice(3).id}`),null);
    assert.ok(h.q("button-add-voice"),"a freed place offers Add again");
  }finally{await h.close();}
});

test("in Create: pick the AI singer or a saved voice, add one right there, and sing the finished song with it",async()=>{
  const h=await setup([voice(1)]);
  const sung:{songId:string;voice:string}[]=[];
  function Harness(){
    const [songs,setSongs]=useState<any[]>([]);
    return <QuickCreate connected saving={false} drafts={songs} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} simpleExperience
      singWithVoice={(songId,v)=>sung.push({songId,voice:v.id})}
      generateSong={async()=>{setSongs([{...freshSong("made","Morning song",0),audioFormat:"mp3",creationDraft:false}]);return "made";}} saveSketch={async()=>undefined}/>;
  }
  try{
    await act(async()=>h.root.render(<Harness/>));
    assert.equal(h.q("voice-choice-ai")!.getAttribute("aria-checked"),"true","the AI singer is the default");
    await h.click(`voice-choice-${voice(1).id}`);
    assert.match(h.q("text-voice-choice")!.textContent!,/sing it with “Voice 1” in Vocal Studio/);
    await h.click("voice-choice-add");
    assert.ok(h.q("add-voice"),"Add a voice opens right inside Create");
    const name=h.q("input-voice-name") as HTMLInputElement;
    const enter=new h.dom.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true});
    await act(async()=>{name.dispatchEvent(enter);});
    assert.equal(enter.defaultPrevented,true,"Enter in the voice form never starts a song");
    await act(async()=>{(document.querySelector('[data-testid="add-voice"] .secondary') as HTMLButtonElement).click();});
    const idea=h.q("input-song-description") as HTMLTextAreaElement;
    await act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(idea),"value")!.set!.call(idea,"A hopeful morning song");idea.dispatchEvent(new h.dom.window.Event("input",{bubbles:true}));});
    await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));
    await act(async()=>{await new Promise(r=>setTimeout(r,0));});
    assert.match(h.q("button-sing-with-voice")!.textContent!,/Sing it with Voice 1/);
    await h.click("button-sing-with-voice");
    assert.deepEqual(sung,[{songId:"made",voice:voice(1).id}]);
  }finally{await h.close();}
});

test("Create without a chosen voice shows no Sing button, and instrumental songs have no voice choice",async()=>{
  const h=await setup([voice(1)]);
  try{
    await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} singWithVoice={()=>{}} generateSong={async()=>undefined} saveSketch={async()=>undefined}/>));
    assert.ok(h.q("voice-choice"));assert.equal(h.q("button-sing-with-voice"),null);
    await h.click("checkbox-instrumental");
    assert.equal(h.q("voice-choice"),null,"No Vocals means no voice to choose");
  }finally{await h.close();}
});
