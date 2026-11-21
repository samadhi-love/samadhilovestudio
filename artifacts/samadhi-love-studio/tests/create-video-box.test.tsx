import test from "node:test";
import assert from "node:assert/strict";
import React,{act,useState} from "react";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";
import {CreateVideoBox,previewLines,themeForKey,videoReadySongs} from "../app/create-video-box";
import type {BackgroundKey} from "../app/background-chooser";
import {freshSong,type Song} from "../app/studio-data";

const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const settle=async()=>{for(let i=0;i<4;i++)await act(async()=>{await new Promise(r=>setTimeout(r,0));});};
const song=(id:string,name:string,extra:Partial<Song>={}):Song=>{const s={...freshSong(id,name,0),audioId:`a-${id}`,audioFormat:"mp3" as const,...extra};s.notes={...s.notes,lyrics:"[Verse]\nHold me close {whisper}\nUnder the moon\n[Chorus]\nWe rise"};return s;};

async function mount(songs:Song[],extra:{photo?:Blob|null;clip?:Blob|null}={}){
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
  Object.defineProperty(globalThis,"navigator",{configurable:true,value:dom.window.navigator});
  let urls=0;URL.createObjectURL=(()=>`blob:preview-${++urls}`) as any;URL.revokeObjectURL=(()=>{}) as any;
  const made:Song[]=[];const purposes:string[]=[];const looks:string[]=[];
  function Box(){
    const [id,setId]=useState("");const [look,setLook]=useState<BackgroundKey>("theme:flag");
    return <CreateVideoBox songs={songs} songId={id} setSongId={setId} look={look} pickLook={k=>{looks.push(k);setLook(k);}} own={{active:extra.clip?"video":extra.photo?"photo":null,photo(){},video(){}}}
      photo={extra.photo??null} clip={extra.clip??null} busy={false} make={(s,p)=>{made.push(s);purposes.push(p);}}/>;
  }
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  await act(async()=>root.render(<Box/>));await settle();
  return {made,purposes,looks,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}

test("the video box lists finished songs; tap Use in video and the song is on the screen with its words",async()=>{
  const songs=[song("one","First song"),song("two","Ocean heart"),song("draft","Not sung yet",{audioFormat:undefined}),song("gone","Deleted",{deletedAt:"2026-11-01"})];
  const m=await mount(songs);
  const listed=[...q("cvb-songs")!.querySelectorAll("li span")].map(e=>e.textContent);
  assert.deepEqual(listed.sort(),["First song","Ocean heart"],"only songs with sound, not deleted");
  assert.ok(q("cvb-drop"),"empty screen invites a song");
  assert.equal((q("cvb-make") as HTMLButtonElement).disabled,true);
  await act(async()=>q("cvb-use-two")!.click());await settle();
  assert.equal(q("cvb-drop"),null);
  assert.match(q("cvb-chosen")!.textContent!,/Ocean heart/);
  assert.equal(q("cvb-words")!.textContent,"Hold me close","first sung line, without section labels or cues");
  assert.match(q("cvb-chosen")!.querySelector("audio")!.getAttribute("src")!,/two/,"the chosen song plays over the picture");
  await act(async()=>q("cvb-make")!.click());
  assert.equal(m.made[0]?.id,"two","Make my video sends the chosen song");
  await m.close();
});

test("drag a song onto the screen to put it in the video",async()=>{
  const m=await mount([song("one","First song"),song("two","Ocean heart")]);
  const screen=q("cvb-screen")!;
  const data=new Map<string,string>([["application/x-versual-song","one"]]);
  const event=new window.Event("drop",{bubbles:true,cancelable:true}) as any;
  event.dataTransfer={getData:(t:string)=>data.get(t)??"",dropEffect:""};
  await act(async()=>{screen.dispatchEvent(event);});await settle();
  assert.match(q("cvb-chosen")!.textContent!,/First song/);
  const li=q("cvb-songs")!.querySelector("li")!;assert.equal(li.getAttribute("draggable"),"true","songs can be dragged");
  await m.close();
});

test("your own photo or video shows on the screen right away; a video plays without its sound",async()=>{
  const p=await mount([song("one","First")],{photo:new Blob(["x"],{type:"image/jpeg"})});
  assert.equal(q("cvb-own-photo")!.getAttribute("src"),"blob:preview-1");await p.close();
  const v=await mount([song("one","First")],{clip:new Blob(["x"],{type:"video/mp4"})});
  const video=q("cvb-own-video") as HTMLVideoElement;
  assert.ok(video.muted||video.hasAttribute("muted"),"video sound is off: it's only a background");
  assert.match(q("create-video-box")!.textContent!,/Video sound is off\. Your song is the soundtrack\./);
  await v.close();
});

test("picking a background in the box changes the screen",async()=>{
  const m=await mount([song("one","First")]);
  await act(async()=>q("qv-chip-usa")!.click());
  await act(async()=>q("qv-theme-liberty")!.click());
  assert.deepEqual(m.looks,["theme:liberty"]);
  assert.match(q("cvb-screen")!.getAttribute("style")??"",/liberty/);
  assert.ok(q("qv-chip-yours"),"upload photo, upload video and camera are in the same box");
  await m.close();
});

test("helpers: words, looks and the newest-first list",()=>{
  assert.deepEqual(previewLines("[Intro]\n(ooh)\nLine one {belt}\n\n[Chorus]\nLine two"),["Line one","Line two"]);
  assert.equal(themeForKey("theme:nycnight"),"nycnight");assert.equal(themeForKey("theme:nope"),undefined);
  assert.equal(videoReadySongs([song("x","Clean"),song("y","Bad",{explicit:true})]).length,1,"explicit songs are left out");
  const page=readFileSync("app/quick-create.tsx","utf8");
  assert.match(page,/<div className="qc-split">/,"the box sits beside Begin a song");
  assert.match(page,/songDragProps\(song\.id\)/,"your takes can be dragged into the box");
  assert.match(readFileSync("app/create-video-box.css","utf8"),/@media \(min-width: 980px\) \{ \.qc-split \{ grid-template-columns/,"side by side on a computer, stacked on a phone");
});

test("choose what the video is for: the screen takes that shape, the choice is remembered and sent with the song",async()=>{
  const m=await mount([song("one","First song")]);
  assert.equal(q("cvb-purpose-shorts")!.getAttribute("aria-checked"),"true","Shorts is the first choice");
  assert.equal(q("cvb-screen")!.dataset.format,"vertical");
  await act(async()=>q("cvb-purpose-youtube")!.click());
  assert.equal(q("cvb-screen")!.dataset.format,"wide","YouTube makes a landscape screen");
  assert.match(q("cvb-purpose-note")!.textContent!,/YouTube Studio/);
  assert.equal(window.localStorage.getItem("versual-video-purpose"),"youtube");
  await act(async()=>q("cvb-use-one")!.click());await settle();
  assert.match(q("cvb-make")!.textContent!,/Make my YouTube video/);
  await act(async()=>q("cvb-make")!.click());
  assert.equal(m.purposes[0],"youtube");
  await act(async()=>q("cvb-purpose-square")!.click());
  assert.equal(q("cvb-screen")!.dataset.format,"square");
  await act(async()=>q("cvb-purpose-phone")!.click());
  assert.equal(q("cvb-screen")!.dataset.format,"vertical");
  await act(async()=>q("cvb-make")!.click());
  assert.equal(m.purposes[1],"phone");
  await m.close();
});

test("purposes frame the video: YouTube full song wide, Shorts 60-second tall highlight, Square full song; files say what they are for",async()=>{
  const {applyVideoPurpose,videoPurposeById,purposeFileName}=await import("../app/video-purpose");
  const {newProSettings}=await import("../app/lyric-pro-data");
  const s=song("one","First song");
  const project={cues:[],theme:"nebula",motion:"still",format:"vertical",pro:{...newProSettings(s,200),duration:200}} as any;
  const yt=applyVideoPurpose(project,videoPurposeById("youtube")!,50);
  assert.equal(yt.format,"wide");assert.deepEqual(yt.pro!.range,{start:0,end:200});
  const short=applyVideoPurpose(project,videoPurposeById("shorts")!,50);
  assert.equal(short.format,"vertical");assert.deepEqual(short.pro!.range,{start:50,end:110});
  const box=applyVideoPurpose(project,videoPurposeById("square")!,50);
  assert.equal(box.format,"square");assert.deepEqual(box.pro!.range,{start:0,end:200});
  assert.equal(purposeFileName("Ocean: heart","wide","mp4"),"Ocean- heart – YouTube 16x9.mp4");
  assert.equal(purposeFileName("Ocean","square","mp4"),"Ocean – Square 1x1.mp4");
  const studio=readFileSync("app/lyric-video-pro.tsx","utf8");
  assert.match(studio,/applyVideoPurpose\(current\.current!,purpose/);
  assert.match(studio,/setPlatform\(purpose\?\.platform\?\?"instagram"\)/);
  assert.match(studio,/format=\{output\.format\}/);
  assert.match(readFileSync("app/studio.tsx","utf8"),/purpose:visual\?\.purpose/);
});
