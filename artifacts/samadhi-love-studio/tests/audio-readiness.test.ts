import test from "node:test";
import assert from "node:assert/strict";
import { checkAudioReadiness } from "../app/audio-readiness";
import type { PCMSource } from "../app/audio-export-pcm";
function source(left: Float32Array,right?:Float32Array):PCMSource{return{sampleRate:8000,length:left.length,numberOfChannels:right?2:1,getChannelData:c=>c===0?left:right!};}
const sine=(seconds=1)=>Float32Array.from({length:8000*seconds},(_,i)=>.5*Math.sin(2*Math.PI*200*i/8000));
test("clean mono audio has expected peak/RMS without invented stereo or mastering results",async()=>{const r=await checkAudioReadiness(source(sine()));assert.ok(Math.abs(r.peakDb!-(-6.0206))<.001);assert.ok(Math.abs(r.rmsDb!-(-9.0309))<.001);assert.equal(r.correlation,null);assert.equal(r.monoChangeDb,null);assert.equal(r.warnings.length,0);});
test("opposite-phase stereo flags actual mono cancellation; identical stereo remains unchanged",async()=>{const l=sine(),r=Float32Array.from(l,x=>-x);const cancel=await checkAudioReadiness(source(l,r));assert.ok(cancel.correlation!<-.999);assert.equal(cancel.monoCancelled,true);assert.ok(cancel.warnings.some(w=>w.includes("combined to mono")));const clean=await checkAudioReadiness(source(l,l));assert.ok(clean.correlation!>.999);assert.ok(Math.abs(clean.monoChangeDb!)<1e-9);assert.equal(clean.monoCancelled,false);});
test("all-silent input, long quiet edges and clipped samples produce distinct observations",async()=>{const empty=await checkAudioReadiness(source(new Float32Array(8000)));assert.equal(empty.silent,true);assert.equal(empty.peakDb,null);const data=new Float32Array(8000*7);data.set(sine(),8000*2);data[16001]=1.1;const r=await checkAudioReadiness(source(data));assert.equal(r.clipped,1);assert.ok(r.leadingQuiet>=2);assert.ok(r.trailingQuiet>=3.99);assert.equal(r.warnings.filter(w=>w.includes("opening")||w.includes("ending")).length,2);});
test("one missing stereo channel and a DC offset are reported without pretending they prove an error",async()=>{const r=await checkAudioReadiness(source(sine(),new Float32Array(8000)));assert.equal(r.correlation,null);assert.ok(r.warnings.some(w=>w.includes("channel has much less")));const dc=await checkAudioReadiness(source(new Float32Array(8000).fill(.02)));assert.ok(dc.warnings.some(w=>w.includes("DC offset")));});
test("invalid samples, mismatched channels and cancelled checks cannot produce a report",async()=>{await assert.rejects(checkAudioReadiness(source(new Float32Array([NaN]))),/invalid samples/);await assert.rejects(checkAudioReadiness(source(sine(),new Float32Array(1))),/lengths/);const controller=new AbortController();await assert.rejects(checkAudioReadiness(source(sine(10)),{signal:controller.signal,progress:()=>controller.abort()}),e=>(e as Error).name==="AbortError");});


test("explicit opening trim removes an eight-second silent lead-in from a genuine WAV copy and preserves source samples",async()=>{
 const {prepareOpeningTrim}=await import('../app/audio-opening-trim');const audio=new Float32Array(8000*10);audio.set(sine(2),8000*8);const snapshot=audio.slice();
 const output=await prepareOpeningTrim(source(audio));assert.ok(Math.abs(output.removedSeconds-7.85)<.001);assert.deepEqual(audio,snapshot);
 const bytes=new Uint8Array(await output.blob.arrayBuffer()),view=new DataView(bytes.buffer);assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(new TextDecoder().decode(bytes.slice(8,12)),'WAVE');assert.equal(view.getUint16(34,true),24);assert.equal(view.getUint32(24,true),8000);
 assert.ok(Math.abs(view.getUint32(40,true)/3/8000-2.15)<.001);assert(bytes.slice(44+Math.floor(.151*8000)*3).some(value=>value!==0));
 await assert.rejects(prepareOpeningTrim(source(new Float32Array(8000))),/No removable/);await assert.rejects(prepareOpeningTrim(source(sine())),/No removable/);
 const cancelled=new AbortController();cancelled.abort();await assert.rejects(prepareOpeningTrim(source(audio),{signal:cancelled.signal}),e=>(e as Error).name==='AbortError');
});
