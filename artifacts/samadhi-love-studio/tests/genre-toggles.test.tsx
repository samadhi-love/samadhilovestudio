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
  assert.equal(quickGenres.length,17);
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

test("Just Begin: instruments are optional; tapping them puts them in the box, which then goes into the song",async()=>{
  const h=await setup();
  try{
    await h.type(h.q("input-song-description") as HTMLTextAreaElement,"A song of gratitude");
    assert.equal(h.q("input-instrument-box"),null,"Just Begin stays simple until you ask");
    await h.click("button-add-instruments");
    await h.click("toggle-instrument-piano");await h.click("toggle-instrument-choir");
    assert.equal((h.q("input-instrument-box") as HTMLInputElement).value,"Piano, Choir");
    assert.equal(h.q("text-auto-instruments"),null,"your own band replaces the automatic one");
    await h.click("toggle-instrument-piano");
    assert.equal((h.q("input-instrument-box") as HTMLInputElement).value,"Choir","tap again to take it out");
    await h.submit();
    assert.equal(h.sent.at(-1).instruments,"Choir");
    await h.click("button-clear-instruments");
    assert.match(h.q("text-auto-instruments")!.textContent!,/chosen for you/);
  }finally{await h.close();}
});

test("Shape It like Suno: lyrics on the left, one Styles box beside them that blends genres, instruments, moods and energy",async()=>{
  const h=await setup();
  try{
    await h.click("tab-mode-custom");
    const fold=h.q("fold-lyrics")!;
    const order=["input-lyrics","input-song-idea"].map(id=>[...fold.querySelectorAll("[data-testid]")].findIndex(e=>(e as HTMLElement).dataset.testid===id));
    assert.ok(order[0]>=0&&order[0]<order[1],"lyrics, then what it's about, in the Words column");
    assert.ok(document.querySelector('.forge-side [data-testid="side-sound"] [data-testid="input-style-blend"]'),"one Styles box in the Sound card beside the words");
    await h.type(h.q("input-lyrics") as HTMLTextAreaElement,"Hold me close\nUnder the stars");
    await h.click("style-chip-r-b");await h.click("style-chip-afrobeats");
    await h.click("style-tab-instruments");await h.click("style-chip-piano");
    await h.click("style-tab-moods");await h.click("style-chip-euphoric");
    await h.click("style-tab-energy");await h.click("style-chip-groovy");
    assert.equal((h.q("input-style-blend") as HTMLTextAreaElement).value,"R&B, Afrobeats, Euphoric, Groovy, Piano");
    assert.match(h.q("text-style-count")!.textContent!,/Blend of 5 styles/);
    assert.match(h.q("text-lyrics-blend")!.textContent!,/sung as R&B × Afrobeats × Euphoric × Groovy with Piano/);
    const box=h.q("input-style-blend") as HTMLTextAreaElement;
    await h.type(box,box.value+", choir, sunset vibes");
    await act(async()=>box.dispatchEvent(new h.dom.window.FocusEvent("focusout",{bubbles:true})));
    await h.submit();
    assert.equal(h.sent[0].genres,"R&B, Afrobeats, Euphoric, Groovy, sunset vibes","typed styles count too");
    assert.equal(h.sent[0].instruments,"Piano, choir","instruments are recognized and sent as the band");
    await h.type(h.q("input-style-search") as HTMLInputElement as unknown as HTMLTextAreaElement,"dabke");
    assert.ok(document.querySelector('[data-testid^="style-chip-"][data-testid*="dabke"]'),"search finds any style in the library");
  }finally{await h.close();}
});

test("Style it for me fills the box from your words, and the box is never limited",async()=>{
  const h=await setup();
  try{
    await h.click("tab-mode-custom");
    await h.type(h.q("input-song-idea") as HTMLTextAreaElement,"A gospel song of gratitude");
    await h.click("button-style-for-me");
    const filled=(h.q("input-style-blend") as HTMLTextAreaElement).value;
    assert.match(filled,/Gospel/);assert.match(filled,/Hammond organ/);
    await h.click("style-tab-genres");await h.click("button-styles-all");
    const chips=[...document.querySelectorAll<HTMLButtonElement>('[data-testid="style-blend"] .chip:not(.active)')].slice(0,30);
    for(const chip of chips)await act(async()=>chip.click());
    assert.ok(Number(/Blend of (\d+)/.exec(h.q("text-style-count")!.textContent!)![1])>=32,"as many styles as you like");
  }finally{await h.close();}
});
