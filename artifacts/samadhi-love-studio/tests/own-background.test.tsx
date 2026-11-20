import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {BackgroundChooser} from "../app/background-chooser";
import {cameraClipType,cameraProblem,type OwnBackground} from "../app/own-background";
import {applyPlayVisual} from "../app/creative-video-handoff";
import {applyLyricBackground} from "../app/lyric-background-picker";
import {activeAdMedia} from "../app/active-visual-source";
import {freshSong} from "../app/studio-data";
import {newProSettings} from "../app/lyric-pro-data";
import type {LyricProject} from "../app/lyric-video-data";

const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const settle=async()=>{for(let i=0;i<6;i++)await act(async()=>{await new Promise(r=>setTimeout(r,0));});};

async function mount(own?:OwnBackground){
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,File:dom.window.File,Blob:dom.window.Blob,IS_REACT_ACT_ENVIRONMENT:true});
  Object.defineProperty(globalThis,"navigator",{configurable:true,value:dom.window.navigator});
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  await act(async()=>root.render(<BackgroundChooser isSelected={()=>false} pick={()=>{}} own={own}/>));await settle();
  return {dom,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}
async function choose(input:HTMLInputElement,file:File){
  Object.defineProperty(input,"files",{value:[file],configurable:true});
  await act(async()=>{input.dispatchEvent(new window.Event("change",{bubbles:true}));});await settle();
}

test("the Yours tab shows only where your own media is offered",async()=>{
  const a=await mount();assert.equal(q("qv-chip-yours"),null,"no Yours tab without upload support");await a.close();
  const b=await mount({active:null,photo(){},video(){}});assert.ok(q("qv-chip-yours"));
  await act(async()=>q("qv-chip-yours")!.click());
  assert.ok(q("own-background"),"Yours panel opens in the same picker area");
  assert.ok(q("own-bg-photo")&&q("own-bg-video")&&q("own-bg-camera"),"photo, video and camera are all one tap away");
  await b.close();
});

test("a photo or a short video you pick goes straight to the background; wrong files explain why",async()=>{
  const photos:File[]=[],videos:File[]=[];
  const m=await mount({active:null,photo:f=>{photos.push(f);},video:f=>{videos.push(f);}});
  await act(async()=>q("qv-chip-yours")!.click());
  await choose(q("own-bg-photo")!.querySelector("input")!,new File(["x"],"me.jpg",{type:"image/jpeg"}));
  assert.equal(photos[0]?.name,"me.jpg");
  await choose(q("own-bg-video")!.querySelector("input")!,new File(["x"],"dance.mp4",{type:"video/mp4"}));
  assert.equal(videos[0]?.name,"dance.mp4");
  await choose(q("own-bg-photo")!.querySelector("input")!,new File(["x"],"doc.pdf",{type:"application/pdf"}));
  assert.match(q("own-bg-problem")!.textContent!,/JPG, PNG or WebP/);
  assert.equal(photos.length,1);
  await m.close();
});

test("when your own picture is on, the picker opens on Yours and offers to stop using it",async()=>{
  let cleared=0;
  const m=await mount({active:"video",name:"dance.mp4",photo(){},video(){},clear:()=>{cleared++;}});
  assert.match(q("own-bg-status")!.textContent!,/Your video is the background · dance\.mp4/);
  await act(async()=>q("own-bg-clear")!.click());assert.equal(cleared,1);
  await m.close();
});

test("any connected camera: pick a camera, take a photo, or record a short clip",async()=>{
  const photos:File[]=[],videos:File[]=[];
  const m=await mount({active:null,photo:f=>{photos.push(f);},video:f=>{videos.push(f);}});
  const stopped:string[]=[];const asked:MediaStreamConstraints[]=[];
  const stream=(id:string)=>({getTracks:()=>[{stop:()=>stopped.push(id)}]}) as unknown as MediaStream;
  Object.defineProperty(window.navigator,"mediaDevices",{configurable:true,value:{
    getUserMedia:async(c:MediaStreamConstraints)=>{asked.push(c);return stream(`s${asked.length}`);},
    enumerateDevices:async()=>[{kind:"videoinput",deviceId:"front",label:"Front camera"},{kind:"videoinput",deviceId:"usb",label:"USB webcam"},{kind:"audioinput",deviceId:"mic",label:"Mic"}],
  }});
  Object.defineProperty(window.HTMLMediaElement.prototype,"play",{configurable:true,value:async()=>{}});
  Object.defineProperty(window.HTMLVideoElement.prototype,"videoWidth",{configurable:true,get:()=>1280});
  Object.defineProperty(window.HTMLVideoElement.prototype,"videoHeight",{configurable:true,get:()=>720});
  window.HTMLCanvasElement.prototype.getContext=(()=>({drawImage(){}})) as any;
  window.HTMLCanvasElement.prototype.toBlob=function(cb:BlobCallback,type?:string){cb(new window.Blob(["jpg"],{type}));};
  class FakeRecorder{static isTypeSupported=(t:string)=>t.startsWith("video/webm");state="inactive";ondataavailable?:(e:{data:Blob})=>void;onstop?:()=>void;options:any;
    constructor(_s:MediaStream,o:any){this.options=o;}start(){this.state="recording";}stop(){this.state="inactive";this.ondataavailable?.({data:new window.Blob(["clip"],{type:this.options.mimeType})});this.onstop?.();}}
  Object.assign(globalThis,{MediaRecorder:FakeRecorder});

  await act(async()=>q("qv-chip-yours")!.click());
  await act(async()=>q("own-bg-camera")!.click());await settle();
  assert.ok(q("own-camera"),"live camera view opens inside the picker");
  const select=q("own-camera-select") as unknown as HTMLSelectElement;
  assert.deepEqual([...select.options].map(o=>o.textContent),["Default camera","Front camera","USB webcam"],"only cameras are listed");
  await act(async()=>{select.value="usb";select.dispatchEvent(new window.Event("change",{bubbles:true}));});await settle();
  assert.deepEqual((asked.at(-1)!.video as any).deviceId,{exact:"usb"},"the chosen camera is used");
  assert.ok(stopped.includes("s1"),"the old camera turns off when switching");

  await act(async()=>q("own-camera-photo")!.click());await settle();
  assert.equal(photos[0]?.type,"image/jpeg");assert.match(photos[0]!.name,/^camera-photo-\d+\.jpg$/);
  assert.equal(q("own-camera"),null,"camera closes after the photo");

  await act(async()=>q("own-bg-camera")!.click());await settle();
  await act(async()=>q("own-camera-record")!.click());await settle();
  assert.match(q("own-camera-stop")!.textContent!,/15s left/);
  await act(async()=>q("own-camera-stop")!.click());await settle();
  assert.equal(videos[0]?.type,"video/webm","codec details are dropped so the upload accepts it");
  assert.match(videos[0]!.name,/\.webm$/);
  await m.close();
});

test("camera problems are explained in plain words",()=>{
  assert.match(cameraProblem({name:"NotAllowedError"}),/blocked/);
  assert.match(cameraProblem({name:"NotFoundError"}),/No camera/);
  assert.match(cameraProblem({name:"NotReadableError"}),/Another app/);
  assert.equal(cameraClipType(t=>t==="video/mp4"),"video/mp4");
  assert.equal(cameraClipType(()=>false),"");
});

function project():LyricProject{
  const song={...freshSong("s","Song",0),audioId:"a",audioFormat:"mp3" as const};
  return {theme:"cosmic",motion:"drift",format:"vertical",cues:[],pro:newProSettings(song,60)} as LyricProject;
}

test("a video from the Create page becomes a looping, frame-filling background in LyriVid",()=>{
  const next=applyPlayVisual(project(),"theme:flag",undefined,{asset:"clip-1",duration:12});
  assert.deepEqual(next.pro!.backgroundVideo,{asset:"clip-1",duration:12,trimStart:0,trimEnd:12,loop:true,fit:"cover"});
  assert.equal(activeAdMedia(next.pro).footage?.asset,"clip-1","the video is what plays");
  const tooLong=applyPlayVisual(project(),undefined,undefined,{asset:"clip-2",duration:90});
  assert.equal(tooLong.pro!.backgroundVideo,undefined,"over 60 seconds is refused");
});

test("picking a gallery background after your video switches to the gallery picture (your clip stays saved)",()=>{
  const withVideo=applyPlayVisual(project(),undefined,undefined,{asset:"clip-1",duration:12});
  const back=applyLyricBackground(withVideo,"liberty","all",0);
  assert.equal(back.theme,"liberty");
  assert.equal(activeAdMedia(back.pro).footage,undefined,"gallery picture is what plays");
  assert.equal(back.pro!.backgroundVideo?.asset,"clip-1","your clip is kept, not deleted");
});
