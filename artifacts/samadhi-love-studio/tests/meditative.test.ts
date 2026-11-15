import test from "node:test";
import assert from "node:assert/strict";
import { meditationPresets, newMeditationBlend, validMeditationBlend, meditationSample } from "../app/meditative-data";
import { renderMeditation, meditationSampleRate } from "../app/meditative-audio";

test("every catalog preset produces an independently editable valid original recipe", () => {
  assert.equal(meditationPresets.length, 20);
  for (const preset of meditationPresets) {
    const a = newMeditationBlend(preset), b = newMeditationBlend(preset);
    assert.ok(validMeditationBlend(a), preset.id); assert.notEqual(a.id, b.id); assert.notEqual(a.layers[0].id, b.layers[0].id);
    a.layers[0].hz = 333; assert.notEqual(b.layers[0].hz, 333);
  }
});
test("untrusted recipes cannot request excessive duration, layer count, levels or invalid frequencies", () => {
  const base = newMeditationBlend();
  for (const patch of [{seconds:181}, {seconds:NaN}, {volume:.51}, {name:""}, {vocalNotes:"a".repeat(2001)}, {layers:[]}, {layers:Array(7).fill(base.layers[0])}, {layers:[{...base.layers[0],hz:Infinity}]}, {layers:[{...base.layers[0],beat:41}]}, {layers:[{...base.layers[0],level:-1}]}, {projectSongId:"../other"}, {id:"invalid"}]) assert.equal(validMeditationBlend({...base,...patch}),false);
  assert.equal(validMeditationBlend({...base,layers:[base.layers[0],base.layers[0]]}),false);
});
test("binaural channels carry distinct audible frequencies; pure tones remain identical", () => {
  const layer = {id:crypto.randomUUID(),mode:"binaural" as const,hz:220,beat:6,level:1};
  let leftCrossings=0,rightCrossings=0,pl=0,pr=0;
  for(let i=0;i<44100;i++) {const [l,r]=meditationSample(layer,i/44100); if(pl<=0&&l>0)leftCrossings++;if(pr<=0&&r>0)rightCrossings++;pl=l;pr=r;}
  assert.equal(leftCrossings,220);assert.equal(rightCrossings,226);
  assert.deepEqual(meditationSample({...layer,mode:"tone"},.013),[Math.sin(2*Math.PI*220*.013),Math.sin(2*Math.PI*220*.013)]);
});
test("pulsed tones have a smooth zero-to-full amplitude envelope at the specified rate", () => {
  const l={id:crypto.randomUUID(),mode:"pulse" as const,hz:221,beat:8,level:1};
  assert.ok(Math.abs(meditationSample(l,1/8)[0])<1e-12);
  assert.ok(Math.abs(meditationSample(l,1/16)[0]-Math.sin(2*Math.PI*221/16))<1e-12);
});
test("rendered PCM has correct stereo format, exact length, silent ends and safe summing",async()=>{
  const s=newMeditationBlend();s.seconds=5;s.volume=.5;s.layers=Array.from({length:6},()=>({id:crypto.randomUUID(),mode:"tone" as const,hz:528,beat:4,level:1}));
  const progress:number[]=[];const blob=await renderMeditation(s,{seconds:1,progress:p=>progress.push(p)}),v=new DataView(await blob.arrayBuffer());
  assert.equal(blob.size,44+meditationSampleRate*4);assert.equal(v.getUint16(22,true),2);assert.equal(v.getUint32(24,true),44100);assert.equal(v.getUint16(34,true),16);
  assert.equal(v.getInt16(44,true),0);assert.equal(v.getInt16(blob.size-2,true),0);
  let peak=0;for(let i=44;i<blob.size;i+=4){const a=v.getInt16(i,true);assert.equal(a,v.getInt16(i+2,true));peak=Math.max(peak,Math.abs(a));}assert.ok(peak>16000&&peak<=16384);assert.equal(progress.at(-1),1);
});
test("invalid renders fail before allocation and cancellation interrupts work", async()=>{
  const s=newMeditationBlend();await assert.rejects(renderMeditation({...s,seconds:999}),/Check/);await assert.rejects(renderMeditation(s,{seconds:Infinity}),/valid render/);
  const control=new AbortController();await assert.rejects(renderMeditation(s,{seconds:1,signal:control.signal,progress:()=>control.abort()}),e=>(e as Error).name==="AbortError");
});

test("legacy tone blends with guide metadata remain readable without loading removed narration",()=>{assert(validMeditationBlend({...newMeditationBlend(),guideId:"be-here-now"}));assert(!validMeditationBlend({...newMeditationBlend(),guideId:"../invalid"}));});
