import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { exportFlac, exportWav, pcmInteger, type PCMSource } from "../app/audio-export-pcm";
const signal=(channels=2,length=6001,rate=44100):PCMSource=>{const data=Array.from({length:channels},(_,c)=>Float32Array.from({length},(_,i)=>.65*Math.sin(2*Math.PI*(220+c*113)*i/rate)));return{sampleRate:rate,length,numberOfChannels:channels,getChannelData:c=>data[c]};};
function expected(source:PCMSource,bits:16|24){const bytes=new Uint8Array(source.length*source.numberOfChannels*bits/8);let offset=0;for(let i=0;i<source.length;i++)for(let c=0;c<source.numberOfChannels;c++){const n=pcmInteger(source.getChannelData(c)[i],bits);bytes[offset++]=n&255;bytes[offset++]=(n>>8)&255;if(bits===24)bytes[offset++]=(n>>16)&255;}return bytes;}
function decode(bytes:Uint8Array,bits:16|24){const r=spawnSync("ffmpeg",["-v","error","-i","pipe:0","-f",bits===24?"s24le":"s16le","-acodec",bits===24?"pcm_s24le":"pcm_s16le","pipe:1"],{input:bytes,maxBuffer:16*1024*1024});assert.equal(r.status,0,r.stderr?.toString());return new Uint8Array(r.stdout);}
test("16/24-bit WAV and FLAC round-trip sample-exactly through independent FFmpeg decoding",async()=>{
 for(const channels of [1,2])for(const bits of [16,24] as const){const source=signal(channels,6001,48000),want=expected(source,bits);
  for(const format of ["wav","flac"]){const blob=await(format==="wav"?exportWav(source,bits):exportFlac(source,bits));assert.deepEqual(decode(new Uint8Array(await blob.arrayBuffer()),bits),want,`${format} ${bits}-bit ${channels} channels`);}
 }
});
test("FLAC frame numbers beyond one-byte UTF-8 and partial final frames decode correctly",async()=>{
 const source=signal(1,4096*129+3,44100);const blob=await exportFlac(source,16);assert.deepEqual(decode(new Uint8Array(await blob.arrayBuffer()),16),expected(source,16));
});
test("WAV includes required padding and clipping is bounded for both bit depths",async()=>{
 const source={sampleRate:44100,length:1,numberOfChannels:1,getChannelData:()=>new Float32Array([1])};const b=await exportWav(source,24),view=new DataView(await b.arrayBuffer());assert.equal(b.size,48);assert.equal(view.getUint32(4,true),40);assert.equal(view.getUint32(40,true),3);
 assert.equal(pcmInteger(1,24),8388607);assert.equal(pcmInteger(-1.5,24),-8388608);assert.equal(pcmInteger(NaN,16),0);
});
test("invalid and cancelled conversions never produce a misleading download",async()=>{
 const control=new AbortController();control.abort();await assert.rejects(exportFlac(signal(),24,{signal:control.signal}),e=>(e as Error).name==="AbortError");await assert.rejects(exportWav({...signal(),numberOfChannels:6}),/mono or stereo/);await assert.rejects(exportFlac({...signal(),length:44100*601}),/10 minutes/);
});
