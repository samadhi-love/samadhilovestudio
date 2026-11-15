import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {applyVisualJob,visualDownloadUrl,type VisualJob} from "../app/visual-generation-data";
import {VisualGenerationControls} from "../app/visual-generation-controls";
import {newProSettings} from "../app/lyric-pro-data";
import {freshSong} from "../app/studio-data";
import {isLyricProject,type LyricProject} from "../app/lyric-video-data";
const song=freshSong("visual-song","Golden universe",0);
const makeProject=():LyricProject=>({theme:"cosmic",motion:"still",format:"vertical",cues:[{text:"Approved lyrics",time:10,end:12,words:[{offset:8,time:10},{offset:15,time:11}]}],pro:{...newProSettings(song,60),range:{start:8,end:40}}});
const job:VisualJob={id:"test-id",song:song.id,source:song.audioId??song.id,mode:"image",prompt:"A golden cosmos",format:"vertical",createdAt:"2026-11-14T12:00:00Z",status:"ready",asset:"private-image",mime:"image/png"};
test("generated looks preserve exact audio, timing, range and reusable project schema",()=>{
  const original=makeProject(),before=JSON.stringify(original);
  for(const format of ["wide","vertical","square"] as const){const p={...original,format};const next=applyVisualJob(p,job);assert.equal(next.pro!.background,job.asset);assert.equal(next.pro!.useTemplateBackground,true);assert.deepEqual(next.cues,p.cues);assert.deepEqual(next.pro!.range,p.pro!.range);assert.equal(next.pro!.sourceAudioId,p.pro!.sourceAudioId);assert(isLyricProject(next));const scene=applyVisualJob(p,job,true);assert.equal(scene.pro!.adPhotoStory!.photos.length,1);assert(isLyricProject(scene));assert.equal(applyVisualJob(scene,job,true).pro!.adPhotoStory!.photos.length,1);const motion=applyVisualJob(scene,{...job,mode:"animate",asset:"private-clip",mime:"video/mp4"},false,4);assert.equal(motion.pro!.backgroundVideo!.duration,4);assert(motion.pro!.backgroundVideo!.loop);assert.deepEqual(motion.cues,p.cues);assert(isLyricProject(motion));}
  assert.equal(JSON.stringify(original),before,"input project not mutated");assert.throws(()=>applyVisualJob(original,{...job,source:"replaced"}));assert.throws(()=>applyVisualJob(original,{...job,song:"another-song"}));assert.throws(()=>applyVisualJob(original,{...job,status:"pending"}));assert.throws(()=>applyVisualJob(original,{...job,mode:"video"},false,61));
});
test("download allowlist rejects credentials, insecure/private hosts and lookalike suffixes",()=>{for(const url of ["http://storage.googleapis.com/x","https://storage.googleapis.com.evil.test/x","https://evil.test/x","https://user:password@storage.googleapis.com/x","https://storage.googleapis.com:8443/x","https://127.0.0.1/x"])assert.equal(visualDownloadUrl(url),null);assert(visualDownloadUrl("https://storage.googleapis.com/generation?signature=ok"));});
test("visual controls require consent, present saved media and apply or animate without changing captions",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
  const calls:unknown[]=[],applied:unknown[]=[];globalThis.fetch=async(_input,options)=>{if(options?.method==="POST"){calls.push(JSON.parse(String(options.body)));return Response.json({job:{...job,status:"pending"}});}return Response.json({configured:true,jobs:[job],images:[{id:job.asset,label:job.prompt}]});};
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);const project=makeProject();
  const button=(text:string)=>[...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent===text)!;
  try{await act(async()=>root.render(<VisualGenerationControls project={project} disabled={false} apply={async(j,scene)=>{applied.push([j.id,scene]);}}/>));assert.equal(calls.length,0,"opening panel never generates");assert.match(document.body.textContent!,/cannot quote the exact cost/);assert.match(document.body.textContent!,/does not stop processing or charges/);
    assert(button("Create an image · paid generation").disabled);await act(async()=>button("Use in video").click());assert.deepEqual(applied,[[job.id,false]]);await act(async()=>button("Add as a scene").click());assert.deepEqual(applied[1],[job.id,true]);await act(async()=>button("Animate this image").click());assert.equal(document.querySelector("select")!.value,job.asset);const boxes=[...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];await act(async()=>{boxes[0].click();boxes[1].click();});assert(!button("Animate an image · paid generation").disabled);
    await act(async()=>button("Animate an image · paid generation").click());assert.equal(calls.length,1);const payload=calls[0] as Record<string,unknown>;assert.equal(payload.mode,"animate");assert.equal(payload.reference,job.asset);assert.equal(payload.billingConsent,true);assert.equal(payload.rightsConsent,true);assert.equal(payload.source,project.pro!.sourceAudioId);assert.equal(boxes[1].checked,false,"new spend requires approval again");assert.deepEqual(project.cues,makeProject().cues);
  }finally{await act(async()=>root.unmount());dom.window.close();}
});
