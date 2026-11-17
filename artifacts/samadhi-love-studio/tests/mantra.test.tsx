import test from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { MantraAudio, echoTaps, preparePhrase, repeatPeriod, type CaptureKind, type ReplayMode } from "../app/mantra-audio";
import { MantraRecorder, type MantraSave } from "../app/mantra-recorder";
import { wavAudio } from "../app/recording-dsp";
import { validCreationReference } from "../app/studio-data";

test("recording save receipts allow safe UUID retries without pretending the recording is an instrumental",()=>{
 const id="ae81d2dc-570c-4b66-864d-2af93fbe7123";
 assert(validCreationReference(id,null,null));
 assert(!validCreationReference(id,"existing-song",null));
 assert(!validCreationReference("../another-account",null,null));
 assert(!validCreationReference("arbitrary-recording",null,null));
 assert(validCreationReference("legacy-sketch",null,"encoded-instrumental"));
 assert(validCreationReference(null,"existing-song",null));
});

test("repeat buffers have sample-accurate periods, silent gaps and click-reducing edges",()=>{
 const original=Float32Array.from({length:4410},(_,i)=>Math.sin(i*0.1));
 const padded=preparePhrase(original,44100,0.5);
 assert.equal(padded.length,repeatPeriod(original.length,44100,0.5));
 assert.equal(padded[0],0);assert.equal(padded[original.length-1],0);
 assert(padded.slice(original.length).every(value=>value===0));
 for(let cycle=0;cycle<1000;cycle++)assert.equal(cycle*padded.length,Math.round(cycle*0.6*44100));
 assert.equal(preparePhrase(original,44100).length,original.length);
 assert.notEqual(original[original.length-1],0);
});
test("echo taps are finite, progressively quieter and match synthetic impulse delays",()=>{
 assert.deepEqual(echoTaps("off"),[]);
 for(const preset of ["soft","medium","long"] as const){
  const taps=echoTaps(preset),signal=new Float32Array(6001);
  for(const tap of taps)signal[Math.round(tap.delay*1000)]+=tap.gain;
  let previous=1;
  for(const tap of taps){assert(tap.gain>0&&tap.gain<previous);assert(tap.delay<5);assert(Math.abs(signal[Math.round(tap.delay*1000)]-tap.gain)<1e-6);previous=tap.gain;}
 }
});

class GraphNode {
 connections:GraphNode[]=[];gain={value:1,setTargetAtTime(value:number){this.value=value;}};delayTime={value:0};
 threshold={value:0};ratio={value:0};attack={value:0};release={value:0};curve?:Float32Array;
 buffer:any;loop=false;started:number[]=[];stopped=false;onended?:()=>void;
 connect(node:GraphNode){this.connections.push(node);return node;}
 disconnect(node?:GraphNode){this.connections=node?this.connections.filter(value=>value!==node):[];}
 start(at:number){this.started.push(at);}
 stop(){this.stopped=true;}
}
function audioBuffer(length=4410,rate=44100){
 const data=new Float32Array(length).fill(0.2);
 return {length,sampleRate:rate,numberOfChannels:1,duration:length/rate,getChannelData:()=>data,copyToChannel:(input:Float32Array)=>data.set(input)};
}
test("real engine routes performance to the mix, captures the original separately, replaces loops and releases microphones",async()=>{
 const saved={AudioContext:globalThis.AudioContext,MediaRecorder:globalThis.MediaRecorder,navigator:Object.getOwnPropertyDescriptor(globalThis,"navigator")};
 const inputTrack={stopped:false,stop(){this.stopped=true;},addEventListener(){}};
 const inputStream={active:true,getTracks:()=>[inputTrack],getAudioTracks:()=>[inputTrack]};
 const recordTrack={stop(){}},mixStream={getTracks:()=>[recordTrack]};
 let context:any;
 class Context {
  state="running";currentTime=2;destination=new GraphNode();sources:GraphNode[]=[];
  constructor(){context=this;}
  createGain(){return new GraphNode();}createDelay(){return new GraphNode();}createDynamicsCompressor(){return new GraphNode();}
  createWaveShaper(){return new GraphNode();}createMediaStreamDestination(){return Object.assign(new GraphNode(),{stream:mixStream});}
  createMediaStreamSource(){return new GraphNode();}createBuffer(_channels:number,length:number,rate:number){return audioBuffer(length,rate);}
  createBufferSource(){const node=new GraphNode();this.sources.push(node);return node;}
  decodeAudioData(){return Promise.resolve(audioBuffer());}resume(){this.state="running";return Promise.resolve();}suspend(){this.state="suspended";return Promise.resolve();}close(){this.state="closed";return Promise.resolve();}
 }
 const instances:any[]=[];
 class Recorder {
  static isTypeSupported(){return true;}
  state="inactive";mimeType="audio/webm";ondataavailable?:(event:any)=>void;onstop?:()=>void;
  constructor(public stream:unknown){instances.push(this);}
  start(){this.state="recording";}
  stop(){this.state="inactive";queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(["fixture"])});this.onstop?.();});}
 }
 Object.assign(globalThis,{AudioContext:Context,MediaRecorder:Recorder});
 Object.defineProperty(globalThis,"navigator",{configurable:true,value:{mediaDevices:{getUserMedia:async()=>inputStream}}});
 const engine=new MantraAudio();
 try{
  await engine.startCapture("phrase","");
  assert.equal(instances[0].stream,inputStream);
  assert.equal((await engine.finishCapture())!.kind,"phrase");assert(inputTrack.stopped);
  inputTrack.stopped=false;
  await engine.loadPhrase(new Blob(["fixture"]));
  await engine.play("once",0.5);
  assert.equal(context.sources[0].loop,false);assert.equal(context.sources[0].started.length,1);
  assert.equal(context.sources[0].started[0],2.52);
  await engine.play("loop",0.5);
  assert(context.sources[0].stopped);assert(context.sources[1].loop);
  assert.equal(context.sources[1].buffer.length,26460);
  engine.setEcho("long");
  await engine.startCapture("performance","");
  assert.equal(instances[1].stream,mixStream);
  const result=await engine.stopAll();
  assert.equal(result!.kind,"performance");assert(result!.blob.size>0);
  assert(context.sources[1].stopped);assert(inputTrack.stopped);
  engine.dispose();await new Promise(resolve=>setImmediate(resolve));assert.equal(context.state,"closed");
 }finally{
  engine.dispose();Object.assign(globalThis,{AudioContext:saved.AudioContext,MediaRecorder:saved.MediaRecorder});
  if(saved.navigator)Object.defineProperty(globalThis,"navigator",saved.navigator);
 }
});

class FixtureAudio extends MantraAudio {
 kind?:CaptureKind;starts:CaptureKind[]=[];plays:ReplayMode[]=[];released=false;failure?:Error;
 async startCapture(kind:CaptureKind){if(this.failure)throw this.failure;this.kind=kind;this.starts.push(kind);}
 async stopAll(){this.silence();const kind=this.kind;this.kind=undefined;return kind?{kind,blob:wavAudio(new Float32Array(4410).fill(0.1))}:undefined;}
 async loadPhrase(){}
 async play(mode:ReplayMode){this.plays.push(mode);}
 setEcho(){}setVolume(){}setMonitoring(){}silence(){this.onReplayEnded?.();}
 dispose(){this.released=true;}
}
async function ui(engine:FixtureAudio,save:MantraSave){
 const dom=new JSDOM("<div id='root'></div>",{url:"https://studio.test"});
 const originalAudio=globalThis.AudioContext;
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true,confirm:()=>true});
 dom.window.HTMLMediaElement.prototype.pause=()=>{};
 Object.assign(globalThis,{AudioContext:class{async decodeAudioData(){return audioBuffer();}async close(){}}});
 const {createRoot}=await import("react-dom/client");const root=createRoot(document.getElementById("root")!);
 await act(async()=>root.render(<MantraRecorder active disabled={false} device="" save={save} open={()=>{}} onCapture={()=>{}} createAudio={()=>engine}/>));
 return {
  click:async(name:string)=>act(async()=>{const button=[...document.querySelectorAll("button")].find(b=>b.textContent===name);assert(button,`Missing ${name}`);button.click();}),
  close:async()=>{await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,{AudioContext:originalAudio});},
 };
}
test("recording UI keeps phrase and mix separate; failed saves retain downloads and retry with one stable receipt",async()=>{
 const engine=new FixtureAudio();const calls:any[]=[];
 const h=await ui(engine,async(...args)=>{calls.push(args);if(calls.length===1)throw new Error("Fixture upload failed");return{id:args[4]!,name:args[1]};});
 try{
  assert.equal(engine.starts.length,0);
  assert.equal((document.querySelector('input[type="checkbox"]') as HTMLInputElement).checked,false);
  await h.click("Start phrase");await h.click("Finish phrase");
  assert.equal(document.querySelectorAll("audio").length,1);assert.deepEqual(engine.plays,["once"]);
  await h.click("Stop all");await h.click("Record performance");await h.click("Finish performance");
  assert.equal(document.querySelectorAll("audio").length,2);
  await h.click("Save performance privately");assert.match(document.body.textContent!,/Fixture upload failed/);
  assert.equal(document.querySelectorAll("a[download]").length,2);
  await h.click("Save performance privately");
  assert.equal(calls[0][4],calls[1][4]);assert.equal(calls[0][2],null);
  assert.equal(calls[1][0].type,"audio/wav");
  await h.click("Save phrase privately");assert.notEqual(calls[1][4],calls[2][4]);
  assert.equal(engine.starts.length,2);
 }finally{await h.close();assert(engine.released);}
});
test("microphone denial is explicit and does not create or upload a recording",async()=>{
 const engine=new FixtureAudio();engine.failure=new DOMException("Denied","NotAllowedError");let calls=0;
 const h=await ui(engine,async()=>{calls++;return null;});
 try{await h.click("Start phrase");assert.match(document.body.textContent!,/Microphone access is blocked/);assert.equal(document.querySelectorAll("audio").length,0);assert.equal(calls,0);}
 finally{await h.close();}
});
