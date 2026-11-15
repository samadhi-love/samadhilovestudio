import assert from "node:assert/strict";
import test from "node:test";
import { assertAudioBudget, maxDecodedSourceBytes, recordedPlacement } from "../app/audio-resource";
import { emptySession, validSession } from "../app/vocal/session";
import { serializeMixer, validMixerSession } from "../app/mixer-session";
import { excerptPositions, recognitionExcerpt, validRecognitionWav, validRightsReview } from "../app/rights-data";

test("latency correction adjusts timeline placement without modifying original recordings",()=>{
  assert.deepEqual(recordedPlacement(5,-.1,480),{start:.1,at:0,end:5});
  assert.deepEqual(recordedPlacement(5,9.9,480),{start:0,at:9.9,end:5});
  assert.deepEqual(recordedPlacement(5,479,480),{start:0,at:479,end:1});
  assert.throws(()=>recordedPlacement(5,480,480));
});
test("stem-heavy sessions exceed the old twelve-minute budget while decoded memory remains bounded",()=>{
  const session=emptySession();session.sources=Array.from({length:6},()=>({id:crypto.randomUUID(),name:"Stem",duration:240}));
  assert(validSession(session));
  assertAudioBudget(Array.from({length:6},()=>({length:240*44100,numberOfChannels:2})));
  assert.throws(()=>assertAudioBudget([{length:maxDecodedSourceBytes/4+1,numberOfChannels:1}]));
  session.sources=Array.from({length:7},()=>({id:crypto.randomUUID(),name:"Long original",duration:480}));assert(!validSession(session));
});
test("mixer snapshots preserve editable controls, omitting decoded buffers and local blobs",()=>{
  const buffer={duration:4} as AudioBuffer;
  const track={id:crypto.randomUUID(),name:"My voice",buffer,sourceBlob:new Blob(["original"]),peaks:[.2],start:0,end:4,at:1,level:.8,pan:0,lowCut:40,presence:2,reverb:.1,echo:0,compression:true,mute:false,solo:false};
  const snapshot=serializeMixer(crypto.randomUUID(),"Voice mix","my-project",[track]);
  assert(validMixerSession(snapshot));assert.equal(snapshot.tracks[0].level,.8);assert(!("buffer" in snapshot.tracks[0]));assert(!("sourceBlob" in snapshot.tracks[0]));
  for(const change of [{at:480},{start:5},{level:NaN},{name:""},{echo:1}])assert(!validMixerSession({...snapshot,tracks:[{...snapshot.tracks[0],...change}]}));
});
test("recognition excerpts are bounded mono PCM, preserve source samples and specify honest coverage",()=>{
  const left=new Float32Array(441000).fill(.4),right=new Float32Array(441000).fill(.2),before=left.slice();
  const audio={duration:10,sampleRate:44100,numberOfChannels:2,getChannelData:(i:number)=>i?right:left};
  const result=recognitionExcerpt(audio,0);assert(validRecognitionWav(result.bytes));assert.equal(result.duration,10);assert.equal(result.bytes.length,441044);
  assert.deepEqual(left,before);assert(Math.abs(new DataView(result.bytes.buffer).getInt16(44,true)/32767-.3)<.001);
  assert.deepEqual(excerptPositions(360),[0,175,350]);assert.deepEqual(excerptPositions(5),[0]);assert.deepEqual(excerptPositions(10.1),[0]);assert.deepEqual(excerptPositions(20),[0,10]);
  assert.throws(()=>recognitionExcerpt(audio,-1));assert.throws(()=>excerptPositions(0));
  const bad=result.bytes.slice();bad[24]=0;assert(!validRecognitionWav(bad));assert(!validRecognitionWav(new Uint8Array(600000)));
});
test("permission notes distinguish recording, composition and performer permissions",()=>{
  assert(validRightsReview({recording:"provider",composition:"original",voices:"self",notes:"Provider plan and source references"}));
  assert(!validRightsReview({recording:"copyright-free",composition:"original",voices:"self",notes:""}));
  assert(!validRightsReview({recording:"original",composition:"original",voices:"self",notes:"x".repeat(4001)}));
});
