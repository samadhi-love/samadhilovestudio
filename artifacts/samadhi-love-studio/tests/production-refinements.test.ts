import assert from "node:assert/strict";
import test from "node:test";
import {estimateBeats,beatGrid} from "../app/beat-analysis";
import {projectBeatPulse,beatPulse} from "../app/lyric-visual-layers";
import {soundtrackIdentity} from "../app/lyric-audio-identity";
import {newProSettings} from "../app/lyric-pro-data";
import {isLyricProject,type LyricProject} from "../app/lyric-video-data";
import {freshSong} from "../app/studio-data";
import {readStemArchive} from "../app/stem-archive";
import {zipSync} from "fflate";
import {measureAudio} from "../app/audio-measurements";
import {detectVoiceMime} from "../app/my-voice-data";
const song={...freshSong("beat-song","Original",0),audioFormat:"wav" as const,audioId:"original-v1"};
const base:LyricProject={theme:"cosmic",motion:"drift",format:"wide",cues:[{text:"Original lyrics",time:1,end:4}],pro:newProSettings(song,20)};
function percussion(bpm:number){const rate=11025,samples=new Float32Array(rate*20);for(let t=.25;t<20;t+=60/bpm){const at=Math.floor(t*rate);for(let i=0;i<Math.min(800,samples.length-at);i++)samples[at+i]=Math.sin(i*.9)*Math.exp(-i/130);}return{samples,rate};}
test("onset analysis estimates regular synthetic beats without modifying source samples",()=>{
 for(const bpm of [90,120,150]){const {samples,rate}=percussion(bpm),before=samples.slice();const estimate=estimateBeats(samples,rate);assert(Math.abs(estimate.bpm-bpm)<4,`expected near ${bpm}, got ${estimate.bpm}`);assert(estimate.beats.length>15);assert(estimate.beats.every((t,i,a)=>t>=0&&t<=20&&(i===0||t>a[i-1])));assert.deepEqual(samples,before);}
});
test("silence and insufficient audio do not produce invented beat certainty",()=>{assert.throws(()=>estimateBeats(new Float32Array(11025*5),11025));assert.throws(()=>estimateBeats(new Float32Array(1000),11025));assert.throws(()=>beatGrid(0,0,20));});
test("reviewed source-specific beat grid drives pulses and stale grids fall back to manual tempo",()=>{
 const p={...base,pro:{...base.pro!,beatGrid:{source:soundtrackIdentity(base),bpm:120,offset:.25,beats:[.25,.8,1.3],method:"onset-grid/v1" as const,reviewed:true}}};
 assert(isLyricProject(p));assert.equal(projectBeatPulse(.8,p),1);assert(projectBeatPulse(.9,p)<1);assert.equal(p.cues,base.cues);
 const stale={...p,pro:{...p.pro,sourceAudioId:"replacement"}};assert.equal(projectBeatPulse(.8,stale),beatPulse(.8,100,0));
 for(const changes of [{beats:[1,1]},{bpm:NaN},{beats:[21]},{source:"x".repeat(401)}])assert(!isLyricProject({...p,pro:{...p.pro,beatGrid:{...p.pro.beatGrid,...changes}}}));
});
test("stem archives expose supported audio only, omit traversal, and reject excessive file counts",async()=>{
 const zip=zipSync({"folder/vocals.wav":new Uint8Array([1,2,3]),"bass.mp3":new Uint8Array([4,5]),"notes.txt":new Uint8Array([6]),"../escape.wav":new Uint8Array([7])});
 const files=await readStemArchive(new Blob([new Uint8Array(zip)]),new AbortController().signal);assert.deepEqual(files.map(f=>f.name).sort(),["bass.mp3","vocals.wav"]);assert.equal(files.find(f=>f.name==="vocals.wav")!.blob.type,"audio/wav");
 const tooMany=zipSync(Object.fromEntries(Array.from({length:13},(_,i)=>[i+".wav",new Uint8Array([i])])));await assert.rejects(()=>readStemArchive(new Blob([new Uint8Array(tooMany)]),new AbortController().signal));
 const canceled=new AbortController();canceled.abort();await assert.rejects(()=>readStemArchive(new Blob([new Uint8Array(zip)]),canceled.signal),{name:"AbortError"});
});
test("mix measurements report sample peaks, RMS and clipping without claiming LUFS",()=>{
 const result=measureAudio({sampleRate:44100,numberOfChannels:1,getChannelData:()=>new Float32Array([0,1,-1,0])});assert.equal(result.peakDb,0);assert.equal(result.clipped,2);assert(Math.abs(result.rmsDb+3.0103)<.001);
 assert.equal(measureAudio({sampleRate:44100,numberOfChannels:1,getChannelData:()=>new Float32Array(2)}).peakDb,-Infinity);assert.throws(()=>measureAudio({sampleRate:44100,numberOfChannels:1,getChannelData:()=>new Float32Array([NaN])}));
});
test("saved original voice MIME can be recovered from older untyped session blobs",()=>{
 assert.equal(detectVoiceMime(new TextEncoder().encode("RIFF0000WAVEdata")),"audio/wav");assert.equal(detectVoiceMime(new Uint8Array([0x1a,0x45,0xdf,0xa3])),"audio/webm");assert.equal(detectVoiceMime(new TextEncoder().encode("ID3")),"audio/mpeg");assert.equal(detectVoiceMime(new Uint8Array([1]),"text/html"),"application/octet-stream");
});
test("background beat-analysis adapter transfers a copy and terminates on completion or cancellation",async()=>{
 const {analyzeBeatBuffer}=await import("../app/beat-analysis-client");const previous=Object.getOwnPropertyDescriptor(globalThis,"Worker");const workers:FakeWorker[]=[];let automatic=true;
 class FakeWorker{onmessage:((event:{data:unknown})=>void)|null=null;onerror:(()=>void)|null=null;terminated=false;message:{samples:Float32Array;sampleRate:number}|undefined;constructor(){workers.push(this);}postMessage(message:{samples:Float32Array;sampleRate:number}){this.message=message;if(automatic)queueMicrotask(()=>this.onmessage?.({data:{result:{bpm:120,offset:0,beats:[0,.5],strength:.8,onsets:[0,.5]}}}));}terminate(){this.terminated=true;}}
 Object.defineProperty(globalThis,"Worker",{value:FakeWorker,configurable:true});const samples=new Float32Array(44100*5).fill(.2),buffer={length:samples.length,duration:5,sampleRate:44100,numberOfChannels:1,getChannelData:()=>samples}as unknown as AudioBuffer;
 try{const estimate=await analyzeBeatBuffer(buffer,new AbortController().signal);assert.equal(estimate.bpm,120);assert(workers[0].terminated);assert.notEqual(workers[0].message!.samples,samples);assert.equal(samples[0],Math.fround(.2));
 automatic=false;const canceled=new AbortController();const pending=analyzeBeatBuffer(buffer,canceled.signal);canceled.abort();await assert.rejects(()=>pending,{name:"AbortError"});assert(workers[1].terminated);
 }finally{if(previous)Object.defineProperty(globalThis,"Worker",previous);else Reflect.deleteProperty(globalThis,"Worker");}
});
