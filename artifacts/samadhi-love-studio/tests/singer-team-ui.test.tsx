import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {QuickCreate} from "../app/quick-create";
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

test("Just Begin: your words choose who sings, and a duet is sent as a real duet",async()=>{
  const h=await setup();
  try{
    await h.type(h.q("input-song-description") as HTMLTextAreaElement,"A love duet about finding home");
    assert.match(h.q("text-team")!.textContent!,/Duet · man \+ woman/);
    assert.match(h.q("text-team-plan")!.textContent!,/Verse 1: Male voice · Verse 2: Female voice · Chorus: Both voices together/);
    assert.equal(h.q("team-auto")!.getAttribute("aria-checked"),"true");
    await h.submit();
    assert.match(h.sent[0].voice,/Duet: a male and a female adult singer/);
  }finally{await h.close();}
});

test("Who sings: a pick is followed exactly, and tapping it again goes back to Auto",async()=>{
  const h=await setup();
  try{
    await h.type(h.q("input-song-description") as HTMLTextAreaElement,"A song for the team before the big game");
    assert.match(h.q("text-team")!.textContent!,/Auto/);
    await h.click("team-group-chant");
    assert.equal(h.q("team-group-chant")!.getAttribute("aria-checked"),"true");
    assert.match(h.q("text-team-plan")!.textContent!,/Whole group chanting together/);
    await h.submit();
    assert.match(h.sent[0].voice,/Group chant: a crowd of adult voices/);
    await h.type(h.q("input-song-description") as HTMLTextAreaElement,"A love duet before the big game");
    assert.match(h.q("text-team-note")!.textContent!,/Your pick is used/);
    await h.click("team-group-chant");
    assert.equal(h.q("team-auto")!.getAttribute("aria-checked"),"true");
    assert.equal(h.q("text-team-note"),null);
  }finally{await h.close();}
});

test("Shape It: words on the left, then Styles and Who sings in the side column; No Vocals hides it",async()=>{
  const h=await setup();
  try{
    await h.click("tab-mode-custom");
    const order=["input-lyrics","input-song-idea","input-style-blend","team-choice"].map(id=>h.q(id)!);
    for(let i=1;i<order.length;i++)assert.ok(order[i-1].compareDocumentPosition(order[i])&4,`${i} in order`);
    await h.click("team-choir");
    assert.match(h.q("text-team")!.textContent!,/Choir/);
    await h.click("tab-mode-simple");
    await act(async()=>(h.q("checkbox-instrumental") as HTMLInputElement).click());
    assert.equal(h.q("team-choice"),null);
  }finally{await h.close();}
});
