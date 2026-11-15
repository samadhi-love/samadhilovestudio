// Runs the actual frame/export orchestration with isolated browser codec fixtures.
// This is not a native-browser codec or physical-device test.
import {build} from "esbuild";
import {mkdirSync} from "node:fs";
import {fileURLToPath,pathToFileURL} from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
const root=fileURLToPath(new URL("../",import.meta.url)),work=path.join(root,"work","nature-logo-export-tests");mkdirSync(work,{recursive:true});
const state=globalThis.__natureExport={supported:true,frames:[],images:[],closed:0,painted:0,cancelled:0,abort:null};
const mock=`const s=globalThis.__natureExport;export async function canEncodeVideo(){return s.supported;}export async function canEncodeAudio(){return s.supported;}export class Mp4OutputFormat{}export class BlobSource{}export class BufferTarget{buffer=new Uint8Array([1,2,3]).buffer;}export class Output{constructor(o){this.target=o.target;}addVideoTrack(v,o){s.rate=o.frameRate;}addAudioTrack(){}async start(){}async finalize(){}async cancel(){s.cancelled++;}}export class CanvasSource{constructor(canvas){s.canvas=canvas;}async add(t){if(s.painted!==s.frames.length+1)throw new Error('frame not completely decoded and painted');s.frames.push(t);}close(){}}export class AudioBufferSource{async add(b){s.audio=b;}close(){}}export const ALL_FORMATS=[];export class Input{async getPrimaryVideoTrack(){return{getCodecParameterString:async()=> 'avc1.fixture'};}async getPrimaryAudioTrack(){return{getCodecParameterString:async()=> 'mp4a.fixture'};}async computeDuration(){return 6;}dispose(){}}`;
await build({stdin:{contents:'export * from "./app/animated-brand-logo";export {defaultBrandLogo} from "./app/brand-logo";export {defaultLogoAnimation} from "./app/logo-nature-scenes";',resolveDir:root},bundle:true,platform:"node",format:"esm",packages:"external",outfile:path.join(work,"export.mjs"),plugins:[{name:"nature-encoder-fixture",setup(b){b.onResolve({filter:/^mediabunny$/},()=>({path:"fixture",namespace:"fixture"}));b.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:mock}));}}]});
class AudioFixture{constructor({numberOfChannels,sampleRate,length}){this.numberOfChannels=numberOfChannels;this.sampleRate=sampleRate;this.length=length;this.duration=length/sampleRate;this.channels=Array.from({length:numberOfChannels},()=>new Float32Array(length));}getChannelData(c){return this.channels[c];}copyToChannel(a,c,offset=0){this.channels[c].set(a,offset);}}
globalThis.AudioBuffer=AudioFixture;
globalThis.document={visibilityState:"visible",fonts:{load:async()=>[]},addEventListener(){},removeEventListener(){},createElement(){const canvas={width:0,height:0};canvas.getContext=()=>({canvas,drawImage(){state.painted++;}});return canvas;}};
globalThis.createImageBitmap=async(blob)=>{await Promise.resolve();state.images.push(await blob.text());state.abort?.abort();return{close(){state.closed++;}};};
const{exportAnimatedLogo,defaultBrandLogo,defaultLogoAnimation}=await import(pathToFileURL(path.join(work,"export.mjs")));
for(const format of ["square","vertical","wide"]){
 state.frames=[];state.images=[];state.closed=0;state.painted=0;
 const progress=[],design={...defaultBrandLogo,animation:{...defaultLogoAnimation,format,scene:"waterfall",seconds:6}};
 const result=await exportAnimatedLogo(design,new AbortController().signal,value=>progress.push(value));
 assert.equal(result.extension,"mp4");assert.equal(result.blob.type,"video/mp4");assert.match(result.codec,/avc1.fixture \+ mp4a.fixture/);
 assert.equal(state.frames.length,180);assert.equal(state.rate,30);assert.equal(state.closed,180);assert.equal(new Set(state.images).size,180);
 assert.equal(state.canvas.width,format==="wide"?1920:1080);assert.equal(state.canvas.height,format==="vertical"?1920:1080);
 assert.equal(state.audio.duration,6);assert(state.audio.channels.every(c=>c.every(value=>value===0)));assert.equal(progress.at(-1),1);
}
const design={...defaultBrandLogo,animation:{...defaultLogoAnimation,seconds:6}};
state.supported=false;await assert.rejects(exportAnimatedLogo(design,new AbortController().signal,()=>{}),/This browser cannot export an animated logo video/);state.supported=true;
state.abort=new AbortController();const previousClosed=state.closed;await assert.rejects(exportAnimatedLogo(design,state.abort.signal,()=>{}),{name:"AbortError"});assert(state.closed>previousClosed);assert(state.cancelled>0);state.abort=null;
const aborted=new AbortController();aborted.abort();await assert.rejects(exportAnimatedLogo(design,aborted.signal,()=>{}),{name:"AbortError"});
console.log(JSON.stringify({checks:6,status:"passed",scope:"actual nature frame/export orchestration, all aspect ratios, 30fps/1080 settings, silent soundtrack, unsupported codecs and cancellation; isolated browser encoder/bitmap fixtures, not native encoding"}));
