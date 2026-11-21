import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {echoPlan,chorusVoices,hallImpulse,shiftDepth,voiceShapes,crowdSize,defaultFx,type FxSettings} from "../app/echo-voices-audio";
import {EchoVoices,blends} from "../app/echo-voices";

test("echo repeats fade evenly until they disappear, longer settings repeat more, and they swing left and right",()=>{
  assert.deepEqual(echoPlan("off",0.3),[]);
  const counts=(["short","medium","long","cosmos"] as const).map(l=>echoPlan(l,0.3).length);
  assert.deepEqual(counts,[4,8,14,24]);
  for(const length of ["short","medium","long","cosmos"] as const){
    const taps=echoPlan(length,0.4);
    assert.ok(taps.every((t,i)=>i===0||t.gain<taps[i-1].gain),"each repeat is quieter");
    assert.ok(Math.abs(taps.at(-1)!.gain-0.004)<1e-6,"the last repeat is about -48 dB: gone");
    assert.ok(taps.every((t,i)=>Math.abs(t.delay-0.4*(i+1))<1e-9),"evenly spaced at the chosen speed");
    assert.ok(taps.every((t,i)=>i===0||t.tone<=taps[i-1].tone),"each repeat a little darker");
    assert.ok(taps.every((t,i)=>Math.sign(t.pan)===(i%2?1:-1)),"alternating sides");
  }
  assert.equal(echoPlan("short",5)[0].delay,1,"speed is kept within safe limits");
});

test("many voices: each copy differs in timing, wobble and place, and the group stays at a safe level",()=>{
  for(const size of [3,6,12]){
    const v=chorusVoices(size);
    assert.equal(v.length,size);
    assert.equal(new Set(v.map(x=>x.pan.toFixed(3))).size,size,"spread across the stereo field");
    assert.ok(v[0].pan<-0.8&&v.at(-1)!.pan>0.8);
    assert.ok(Math.abs(v.reduce((s,x)=>s+x.gain**2,0)-0.85**2)<1e-9,"total loudness stays constant");
    assert.ok(new Set(v.map(x=>x.rate)).size>1&&new Set(v.map(x=>x.delay)).size>1);
  }
  assert.ok(crowdSize.stadium>crowdSize.arena&&crowdSize.arena>0);
});

test("the stadium hall fades out, sounds the same every time, and has two different sides",()=>{
  const [l,r]=hallImpulse(8000,2),[l2]=hallImpulse(8000,2);
  assert.equal(l.length,16000);assert.deepEqual(l,l2);assert.notDeepEqual(l,r);
  const energy=(a:Float32Array,from:number,to:number)=>a.slice(from,to).reduce((s,x)=>s+x*x,0);
  assert.ok(energy(l,0,4000)>energy(l,12000,16000)*50,"loud at the start, almost silent at the end");
});

test("voice changer: pitch math is right, and there is no high child-like setting",()=>{
  const up=shiftDepth(12,0.1),down=shiftDepth(-12,0.1);
  assert.ok(up.up&&Math.abs(up.depth-0.1)<1e-9,"an octave up sweeps the full period");
  assert.ok(!down.up&&Math.abs(down.depth-0.05)<1e-9,"an octave down sweeps half the period");
  assert.ok(Object.values(voiceShapes).every(v=>v.semitones<=2),"nothing pitched high enough to sound like a child");
  assert.deepEqual(Object.keys(voiceShapes),["natural","deeper","brighter","robot","radio"]);
});

// A stand-in engine: the screen's job is to drive it correctly.
function fakeEngine(log:string[]){
  let fx=defaultFx;
  return {setFx:(next:FxSettings)=>{fx=next;log.push("fx:"+JSON.stringify(next));},setHearing:(on:boolean)=>log.push("hear:"+on),
    start:async()=>{log.push("start");},stopMicrophone:async()=>{log.push("mic-off");},catchPhrase:async()=>{log.push("catch");},keepPhrase:async()=>{log.push("keep");return 2.5;},
    repeat:async(loop:boolean,gap:number)=>{log.push(`repeat:${loop}:${gap}`);},stopReplay:()=>log.push("stop-repeat"),startTake:async()=>{log.push("take");},
    finishTake:async()=>{log.push("finish");return new Blob(["take"],{type:"audio/webm"});},level:()=>0.5,dispose:()=>log.push("dispose"),get fx(){return fx;}} as never;
}
async function setup(){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
  URL.createObjectURL=()=>"blob:take";URL.revokeObjectURL=()=>{};
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  const log:string[]=[],saved:{name:string;type:string;title:string}[]=[],videos:string[]=[];
  await act(async()=>root.render(<EchoVoices engine={()=>fakeEngine(log)} saveSong={async(f,t)=>{saved.push({name:f.name,type:f.type,title:t});}} makeVideo={async(_f,t)=>{videos.push(t);}}/>));
  const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const click=async(id:string)=>act(async()=>q(id)!.click());
  return {dom,root,q,click,log,saved,videos,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}

test("one-tap blends set every effect, and choices update the sound live",async()=>{
  const h=await setup();
  try{
    await h.click("button-ev-mic");
    assert.ok(h.log.includes("start"));
    await h.click("blend-stadium");
    assert.equal(h.q("blend-stadium")!.getAttribute("aria-pressed"),"true");
    assert.equal(h.q("space-stadium")!.getAttribute("aria-checked"),"true");
    assert.equal(h.q("chorus-6")!.getAttribute("aria-checked"),"true");
    await h.click("voice-deeper");
    assert.equal(h.q("blend-stadium")!.getAttribute("aria-pressed"),"false","changing one effect leaves the blend");
    assert.match(h.log.at(-1)!,/"voice":"deeper"/);
    assert.equal(h.q("checkbox-hear-live")!.hasAttribute("checked")||(h.q("checkbox-hear-live") as HTMLInputElement).checked,false,"speakers stay quiet until headphones are confirmed");
    await h.click("checkbox-hear-live");assert.ok(h.log.includes("hear:true"));
    assert.equal(blends.length,4);
  }finally{await h.close();}
});

test("repeat chorus: catch a line, keep it, then it answers once or loops, and can be stopped",async()=>{
  const h=await setup();
  try{
    await h.click("button-catch-line");assert.ok(h.log.includes("catch"));
    assert.match(h.q("button-catch-line")!.textContent!,/Keep this line/);
    await h.click("button-catch-line");
    assert.match(h.q("text-line-length")!.textContent!,/2\.5 s caught/);
    await h.click("button-answer-once");assert.ok(h.log.includes("repeat:false:0.4"));
    await h.click("button-answer-loop");assert.ok(h.log.includes("repeat:true:0.4"));
    await h.click("button-stop-repeat");assert.ok(h.log.includes("stop-repeat"));
  }finally{await h.close();}
});

test("record with effects, then save the take as a song or make a lyric video",async()=>{
  const h=await setup();
  try{
    await h.click("button-ev-record");assert.ok(h.log.includes("take"));
    assert.match(h.q("button-ev-record")!.textContent!,/Stop recording/);
    await h.click("button-ev-record");assert.ok(h.log.includes("finish"));
    assert.ok(h.q("ev-result"));
    await h.click("button-take-song");
    assert.deepEqual(h.saved,[{name:"My echo take.webm",type:"audio/webm",title:"My echo take"}]);
    assert.match(h.q("text-ev-message")!.textContent!,/Saved to Your songs/);
    await h.click("button-take-video");assert.deepEqual(h.videos,["My echo take"]);
    await act(async()=>h.root.unmount());
    assert.ok(h.log.includes("dispose"),"leaving the screen releases the microphone");
    await act(async()=>{});
  }finally{h.dom.window.close();}
});
