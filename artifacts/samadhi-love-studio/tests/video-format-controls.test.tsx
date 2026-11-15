import test from "node:test";
import assert from "node:assert/strict";
import React,{act,useState} from "react";
import {JSDOM} from "jsdom";
import {VideoFormatPicker} from "../app/video-format-picker";
import {videoFrameSize} from "../app/video-format-options";
import {applyVideoShape} from "../app/creator-video-presets";
import {ProTimeline} from "../app/lyric-pro-timeline";
import {drawShortFrame} from "../app/short-export";
import {alignLyricLines} from "../app/lyric-alignment";
import {drawProFrame} from "../app/lyric-pro-render";
import {newProSettings} from "../app/lyric-pro-data";
import {freshSong} from "../app/studio-data";
import {isLyricProject,type LyricProject} from "../app/lyric-video-data";
const song={...freshSong("video","My song",0),audioFormat:"mp3" as const,audioId:"original"};
function project():LyricProject{return{theme:"cosmic",format:"wide",motion:"still",cues:[{text:"Love and light",time:2,end:5,words:[{time:2,offset:4},{time:3,offset:13}]}],pro:{...newProSettings(song,360),approvedLyrics:"Love and light",range:{start:120,end:150},alignment:{engine:"fixture",at:"now",audioId:"original",reviewed:true,warnings:[]}}};}
async function setup(){const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);return{dom,root,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};}
test("the two primary video shapes preserve source, caption timing, excerpt and saved layout overrides",async()=>{
 const h=await setup();let latest=project();latest.pro!.formatLooks={wide:{...latest.pro!.look,position:.44}};const original=structuredClone(latest);
 function Screen(){const[p,setP]=useState(original);return<VideoFormatPicker value={p.format} change={format=>{latest=applyVideoShape(p,format);setP(latest);}}/>;}
 try{await act(async()=>h.root.render(<Screen/>));assert.equal(document.querySelectorAll('.video-shape-options button').length,2);assert(document.body.textContent!.includes('1920 × 1080'));assert(document.body.textContent!.includes('1080 × 1920'));
  await act(async()=>[...document.querySelectorAll<HTMLButtonElement>('.video-shape-options button')].find(b=>b.querySelector('strong')!.textContent==='Shorts / Reels')!.click());
  assert.equal(latest.format,"vertical");assert.deepEqual(latest.pro!.range,original.pro!.range);assert.deepEqual(latest.cues,original.cues);assert.equal(latest.pro!.sourceAudioId,"original");assert(latest.pro!.formatLooks!.vertical!.safe);
  await act(async()=>[...document.querySelectorAll<HTMLButtonElement>('.video-shape-options button')].find(b=>b.querySelector('strong')!.textContent==='YouTube video')!.click());assert.deepEqual(latest.pro!.formatLooks!.wide,original.pro!.formatLooks!.wide);assert(isLyricProject(latest));
 }finally{await h.close();}
});
test("caption editor opens a requested line, shifts its word times, corrects text and adds a caption without changing approved lyrics",async()=>{
 const h=await setup();let latest=project();const source=structuredClone(latest);
 function Screen(){const[p,setP]=useState(source);return<ProTimeline project={p} edit={next=>{latest=next;setP(next);}} audio={{current:null}} time={30} seek={()=>{}} analyze={()=>{}} busy={false} active request={{id:1,index:0}}/>;}
 const input=(name:string)=>[...document.querySelectorAll('label')].find(l=>l.firstChild?.textContent?.trim()===name)!.querySelector('input')!;
 const change=async(name:string,value:string)=>act(async()=>{const el=input(name);Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value')!.set!.call(el,value);el.dispatchEvent(new h.dom.window.Event('input',{bubbles:true}));});
 try{await act(async()=>h.root.render(<Screen/>));assert((document.getElementById('lyric-caption-editor') as HTMLDetailsElement).open);assert.equal(input('Caption text').value,'Love and light');
 await change('Start (seconds)','4');assert.equal(latest.cues[0].time,4);assert.equal(latest.cues[0].words![0].time,4);assert.equal(latest.cues[0].end,7);
 await change('Caption text','Corrected lyric');assert.equal(latest.cues[0].text,'Corrected lyric');assert.equal(latest.cues[0].words,undefined);assert.equal(latest.pro!.alignment!.reviewed,false);assert.equal(latest.pro!.approvedLyrics,source.pro!.approvedLyrics);
 await act(async()=>[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Add caption at playhead')!.click());assert.equal(latest.cues.length,2);assert.equal(latest.cues[1].time,30);assert.equal(latest.pro!.sourceAudioId,'original');assert(isLyricProject(latest));
 }finally{await h.close();}
});
function canvas(width:number,height:number){const text:string[]=[],images:unknown[][]=[],rects:unknown[][]=[];const ctx=new Proxy({canvas:{width,height}}, {get:(target,key)=>key==='canvas'?target.canvas:key==='measureText'?(s:string)=>({width:s.length*10}):key==='createRadialGradient'||key==='createLinearGradient'?()=>({addColorStop(){}}):(...args:unknown[])=>{if(key==='fillText')text.push(String(args[0]));if(key==='drawImage')images.push(args);if(key==='fillRect')rects.push(args);},set:()=>true}) as unknown as CanvasRenderingContext2D;return{ctx,text,images,rects};}
test("clip drawing fills the actual upright or wide frame while preserving uploaded-video proportions",()=>{
 for(const format of ['vertical','wide'] as const){const size=videoFrameSize(format),c=canvas(size.width,size.height),video={readyState:4,videoWidth:1920,videoHeight:1080} as HTMLVideoElement;drawShortFrame(c.ctx,video,'Title','Hook',0);assert(c.rects.some(r=>r[2]===size.width&&r[3]===size.height));const image=c.images[0],width=Number(image[3]),height=Number(image[4]);assert(width>=size.width&&height>=size.height);assert(Math.abs(width/height-1920/1080)<.00001);assert(c.text.includes('Title'));assert(c.text.includes('Hook'));}
});
test("approved lyrics split only at measured vocal pauses and disappear during instrumental gaps",()=>{
 const text='Love and light',response={words:[{text:'Love',start:1,end:1.8},{text:'and',start:2,end:2.3},{text:'light',start:8,end:9}]};
 const cues=alignLyricLines([text],response,{splitPauses:true})!;assert.equal(cues.length,2);assert.equal(cues[0].text,'Love and');assert.equal(cues[0].end,2.3);assert.equal(cues[1].time,8);assert.equal(cues[1].words![0].offset,5);assert.equal(cues.map(c=>c.text).join(' '),text);
 const p=project();p.cues=cues;p.pro!.range={start:0,end:30};
 for(const[time,expected]of [[1.2,'Love and'],[5,''],[8.2,'light']] as const){const c=canvas(1080,1920);drawProFrame(c.ctx,time,p,'My song',new Map());if(expected)assert(c.text.includes(expected));else{assert(!c.text.includes('Love and'));assert(!c.text.includes('light'));}}
 const sustained=alignLyricLines(['Love light'],{words:[{text:'Love',start:1,end:7.8},{text:'light',start:8,end:9}]},{splitPauses:true})!;assert.equal(sustained.length,1,'a held sung word is not an instrumental pause');
 const untimed=alignLyricLines(['Love light'],{words:[{text:'Love',start:1},{text:'light',start:8,end:9}]},{splitPauses:true})!;assert.equal(untimed.length,1,'missing word ends do not invent silence');
});
