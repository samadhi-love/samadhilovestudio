import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {autoInstruments,quickGenres,blendName} from "../app/auto-instruments";
import {QuickCreate} from "../app/quick-create";

test("the band fits the genre, blends take turns, and instruments you name always win",()=>{
  assert.match(autoInstruments("A song of gratitude",["Gospel"]),/^Hammond organ, grand piano/);
  assert.match(autoInstruments("A track about the city",["Hip Hop"]),/808 bass/);
  assert.match(autoInstruments("A peaceful mantra for the morning",[]),/singing bowls/,"the idea alone can choose");
  assert.match(autoInstruments("A sing-along for kids",[]),/ukulele/);
  assert.doesNotMatch(autoInstruments("A gospel ballad",["Gospel"]),/four-on-the-floor/,"never a dance beat on a ballad");
  const blend=autoInstruments("A love song",["Soul","Gospel"]).split(", ");
  assert.deepEqual(blend.slice(0,2),["Rhodes electric piano","Hammond organ"],"a blend takes turns between styles");
  assert.ok(blend.length<=6&&new Set(blend.map(b=>b.toLowerCase())).size===blend.length,"no repeats, at most six");
  assert.equal(autoInstruments("A soft song with piano and cello",["Pop"]),"","named instruments are left to you");
  assert.equal(autoInstruments("A song about my grandmother",[]),"piano, acoustic guitar, warm bass, light drums, soft strings");
  assert.equal(blendName(["Soul","Gospel"]),"Soul × Gospel");
  assert.equal(quickGenres.length,16);
});

async function setup(){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
  dom.window.confirm=()=>true;
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  const sent:any[]=[];
  await act(async()=>root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{sent.push(input);return "s";}} saveSketch={async()=>undefined}/>));
  const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const click=async(id:string)=>act(async()=>q(id)!.click());
  const type=async(el:HTMLTextAreaElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),"value")!.set!.call(el,value);el.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});
  const submit=async()=>act(async()=>document.querySelector("form")!.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true})));
  return {dom,root,q,click,type,submit,sent,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}

test("Just Begin: genres sit beside the idea, blend when several are tapped, and a fitting band goes into the song",async()=>{
  const h=await setup();
  try{
    await h.type(h.q("input-song-description") as HTMLTextAreaElement,"A song of gratitude for a new morning");
    assert.ok(h.q("genre-toggles"),"genre chips right under the vision");
    await h.click("toggle-genre-soul");await h.click("toggle-genre-gospel");
    assert.equal(h.q("toggle-genre-soul")!.getAttribute("aria-pressed"),"true");
    assert.match(h.q("text-genre-blend")!.textContent!,/Soul × Gospel/);
    assert.match(h.q("text-auto-instruments")!.textContent!,/Instruments chosen for you: Rhodes electric piano, Hammond organ/);
    await h.submit();
    assert.equal(h.sent[0].genres,"Soul, Gospel");
    assert.equal(h.sent[0].instruments,autoInstruments("A song of gratitude for a new morning",["Soul","Gospel"]));
    await h.click("toggle-genre-soul");
    assert.equal(h.q("text-genre-blend"),null,"untapping leaves one genre");
    await h.click("checkbox-instrumental");await h.submit();
    assert.equal(h.sent.at(-1).instruments,autoInstruments("A song of gratitude for a new morning",["Gospel"]),"No Vocals songs get their band too");
  }finally{await h.close();}
});

test("Shape It: your own lyrics are sung in the blend, and the suggested band is used only when you say so",async()=>{
  const h=await setup();
  try{
    await h.click("tab-mode-custom");
    await h.type(h.q("input-song-idea") as HTMLTextAreaElement,"A hopeful love song");
    await h.type(h.q("input-lyrics") as HTMLTextAreaElement,"Hold me close\nUnder the stars");
    await h.click("toggle-genre-r-b");await h.click("toggle-genre-afrobeats");
    assert.match(h.q("text-lyrics-blend")!.textContent!,/Your lyrics will be sung as R&B × Afrobeats/);
    assert.match(h.q("text-suggested-instruments")!.textContent!,/Suggested band: electric keys, log drums/);
    await h.submit();
    assert.equal(h.sent[0].genres,"R&B, Afrobeats");
    assert.equal(h.sent[0].instruments,"","Shape It sends only what you chose");
    await h.click("button-use-band");
    await h.submit();
    assert.match(h.sent.at(-1).instruments,/^electric keys, log drums/);
  }finally{await h.close();}
});
