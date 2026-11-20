import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {CosmicHomeHero,CosmicHomeSky,CosmicHomeStory,homeQuotes,homeWorlds,type HomeWorld} from "../app/cosmic-home";

async function setup(reducedMotion=false){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:"https://studio.test"});
  dom.window.matchMedia=((query:string)=>({matches:reducedMotion&&/reduce/.test(query),media:query,addEventListener(){},removeEventListener(){}})) as unknown as typeof dom.window.matchMedia;
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  return {dom,root,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}
const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);

test("the welcome says what the studio is and leads to the song box or a lyric video",async()=>{
  const h=await setup();let begun=0,video=0;
  try{
    await act(async()=>h.root.render(<CosmicHomeHero begin={()=>begun++} video={()=>video++}/>));
    const hero=q("cosmic-home-hero")!;
    assert.equal(hero.querySelector("h2")!.textContent,"Your song. Your world. Your video.");
    assert.match(hero.textContent!,/full-length songs even if you have never written one/);
    assert.match(hero.textContent!,/full-length lyric videos from scratch/);
    assert.equal(hero.querySelectorAll('[aria-hidden="true"]').length>=3,true,"I AM marks and the flower are decoration only");
    assert.equal(hero.querySelector("[aria-live]"),null,"the rotating quote is never announced over and over");
    await act(async()=>q("button-home-begin")!.click());
    await act(async()=>q("button-home-video")!.click());
    assert.deepEqual([begun,video],[1,1]);
  }finally{await h.close();}
});

test("the quote turns every few seconds, pauses on hover, and stays still for reduced motion",async()=>{
  for(const reduced of [false,true]){
    const h=await setup(reduced);
    const timers:Array<()=>void>=[];
    h.dom.window.setInterval=((fn:()=>void)=>{timers.push(fn);return timers.length;}) as unknown as typeof h.dom.window.setInterval;
    h.dom.window.clearInterval=((id:number)=>{timers[id-1]=()=>{};}) as unknown as typeof h.dom.window.clearInterval;
    try{
      await act(async()=>h.root.render(<CosmicHomeHero begin={()=>{}} video={()=>{}}/>));
      const shown=()=>document.querySelector(".cosmic-home-quote blockquote")!.textContent;
      assert.equal(shown(),`“${homeQuotes[0].text}”`);
      await act(async()=>timers.forEach(t=>t()));
      assert.equal(shown(),`“${homeQuotes[reduced?0:1].text}”`,reduced?"no motion when reduced":"the next quote appears");
      if(!reduced){
        await act(async()=>q("cosmic-home-hero")!.dispatchEvent(new h.dom.window.MouseEvent("mouseover",{bubbles:true})));
        await act(async()=>timers.forEach(t=>t()));
        assert.equal(shown(),`“${homeQuotes[1].text}”`,"hovering holds the quote");
      }
    }finally{await h.close();}
  }
});

test("every world starts a real song idea with a style, and the story covers dream, hear and see",async()=>{
  const h=await setup();const picked:HomeWorld[]=[];
  try{
    await act(async()=>h.root.render(<CosmicHomeStory pickWorld={w=>picked.push(w)}/>));
    const story=q("cosmic-home-story")!;
    for(const step of ["1 · Dream it","2 · Hear it","3 · See it"])assert.ok([...story.querySelectorAll("h3")].some(e=>e.textContent===step),step);
    assert.equal(story.querySelectorAll(".cosmic-home-world").length,homeWorlds.length);
    for(const world of homeWorlds){
      await act(async()=>q(`button-world-${world.id}`)!.click());
      assert.ok(world.idea.length>=20&&world.styles.length>0,world.name);
    }
    assert.deepEqual(picked.map(w=>w.id),homeWorlds.map(w=>w.id));
    assert.ok(story.querySelectorAll(".cosmic-home-wisdom figure").length>=6);
  }finally{await h.close();}
});

test("the sky is decoration only: hidden from screen readers, never clickable, behind the page",async()=>{
  const h=await setup();
  try{
    await act(async()=>h.root.render(<CosmicHomeSky/>));
    const sky=q("cosmic-home-sky")!;
    assert.equal(sky.getAttribute("aria-hidden"),"true");
    assert.equal(sky.querySelectorAll("button,a,input,textarea,select").length,0);
    const css=readFileSync("app/cosmic-home.css","utf8");
    assert.match(css,/\.cosmic-home-sky\{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none\}/);
    assert.match(css,/prefers-reduced-motion:reduce/);
    assert.match(css,/@media\(min-width:1940px\)\{\.cosmic-home-saying\{display:block\}\}/,"margin sayings only where there is real empty space");
  }finally{await h.close();}
});

test("the main page shows the cosmic home around the song box, and only there",()=>{
  const studio=readFileSync("app/studio.tsx","utf8");
  assert.match(studio,/\{loaded && view==="overview" && !song && !pane && <CosmicHomeSky\/>\}/);
  const hero=studio.indexOf("<CosmicHomeHero"),box=studio.indexOf("<QuickCreate "),story=studio.indexOf("<CosmicHomeStory");
  assert.ok(hero>0&&box>hero&&story>box,"welcome above the song box, story below it");
  assert.match(studio,/pickWorld=\{world=>\{setQuickSeed\(\{id:uid\(\),idea:world\.idea,styles:\[\.\.\.world\.styles\]\}\);focusCreateBox\(\);\}\}/);
});
