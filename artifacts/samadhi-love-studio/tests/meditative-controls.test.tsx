import test from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { MeditativeVibes } from "../app/meditative-vibes";
import type { MeditationBlend } from "../app/meditative-data";

test("catalog combines layers, saves and reopens private recipes, and offers recording without publishing", async () => {
  const dom = new JSDOM('<div id="root"></div>', {url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,HTMLInputElement:dom.window.HTMLInputElement,HTMLAudioElement:dom.window.HTMLAudioElement,IS_REACT_ACT_ENVIRONMENT:true});
  const oldFetch=globalThis.fetch,oldConfirm=globalThis.confirm;
  const records=new Map<string,MeditationBlend>();let last: MeditationBlend|undefined, voice=0, dirty=false, persist=false, fail=false;
  let audioFile: File | undefined, mixBlob: Blob | undefined;
  const requests:{url:string;headers:Headers}[]=[];
  globalThis.confirm=()=>true;
  globalThis.fetch=async(input,init)=>{
    const url=new URL(String(input),"https://studio.test");requests.push({url:url.href,headers:new Headers(init?.headers)});
    const id=url.searchParams.get("session");
    if(init?.method==="PUT") { if(fail)return Response.json({error:"Changed in another tab. Save as new blend."},{status:409});last=JSON.parse(String(init.body));records.set(id!,last!);return Response.json({revision:"r1"}); }
    return Response.json(id?{session:records.get(id),revision:"r1"}:{sessions:[...records.values()].map(s=>({id:s.id,name:s.name,updated:"2026-11-12"})),next:null});
  };
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  const button=(name:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent?.trim()===name)!;
  try {
    await act(async()=>root.render(<MeditativeVibes workspaceId="account-a" projects={[{id:"project",name:"My project"}]} saving={false} dirty={v=>{dirty=v;}} persistBusy={v=>{persist=v;}} saveAudio={async file=>{audioFile=file;return true;}} sendMix={blob=>{mixBlob=blob;}} recordVoice={()=>{voice++;}}/>));
    assert.equal(document.querySelectorAll(".meditative-catalog .meditative-preset").length,20);
    await act(async()=>button("Binaural").click());assert.equal(document.querySelectorAll(".meditative-catalog .meditative-preset").length,5);
    await act(async()=>button("＋ Combine").click());assert.equal(document.querySelectorAll(".meditative-layer").length,3);assert.equal(dirty,true);
    const project=[...document.querySelectorAll("select")].find(s=>s.options[0]?.textContent==="Standalone track")!;
    await act(async()=>{project.value="project";project.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});
    await act(async()=>button("Save blend").click());assert.equal(last!.layers.length,3);assert.equal(last!.projectSongId,"project");assert.equal(dirty,false);assert.equal(persist,false);
    assert.ok(requests.every(r=>r.headers.get("X-Studio-Workspace")==="account-a"));
    await act(async()=>button("＋ Add custom layer").click());assert.equal(dirty,true);
    await act(async()=>button(last!.name).click());assert.equal(document.querySelectorAll(".meditative-layer").length,3);assert.equal(dirty,false);
    await act(async()=>button("＋ Add custom layer").click());fail=true;
    await act(async()=>button("Save blend").click());assert.ok(document.body.textContent!.includes("Changed in another tab"));assert.equal(dirty,true);assert.equal(persist,false);
    fail=false;await act(async()=>button("Save as new blend").click());assert.equal(records.size,2);assert.equal(dirty,false);
    await act(async()=>button("Record my voice").click());assert.equal(voice,1);
    const duration=[...document.querySelectorAll("select")].find(s=>s.options[0]?.textContent==="5 seconds")!;
    await act(async()=>{duration.value="5";duration.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});
    const wait=async(done:()=>boolean)=>{for(let i=0;i<300&&!done();i++)await act(async()=>{await new Promise(r=>setTimeout(r,5));});assert.ok(done(),"render completed");};
    await act(async()=>button("Save audio to My Songs").click());await wait(()=>!!audioFile);
    assert.equal(audioFile!.type,"audio/wav");assert.equal(audioFile!.size,44+44100*5*4);
    await act(async()=>button("Send to Audio + Visual Studio").click());await wait(()=>!!mixBlob);assert.equal(mixBlob!.size,audioFile!.size);
    await act(async()=>button("Prepare preview (up to 10s)").click());await wait(()=>!!document.querySelector("audio"));
    await act(async()=>button("＋ Add custom layer").click());assert.equal(document.querySelector("audio"),null,"changing the blend releases its obsolete preview");
    assert.equal(document.querySelector('[aria-label="Guided meditation player"]'),null);
    assert(!document.body.textContent!.includes("Be Here Now"));assert(!document.body.textContent!.includes("Guided intentions"));
    assert.ok(requests.every(r=>r.url.includes("/api/studio/meditative")),"recipe actions never publish or write songs");
  } finally {await act(async()=>root.unmount());globalThis.fetch=oldFetch;globalThis.confirm=oldConfirm;dom.window.close();}
});
