import test from "node:test";
import "./browser-platform";
import assert from "node:assert/strict";
import React, { act, useState } from "react";
import { JSDOM } from "jsdom";
import { StudioErrorBoundary } from "../app/studio-error-boundary";
import { StudioNavigation, SimpleWorkspaceTools, ScreenSections, WorkspaceModeSwitch, primaryScreens } from "../app/studio-navigation";
import { resolveView, screenHome, screenOf, screenSections, screens, sectionViews } from "../app/studio-routes";

test("every old engine view resolves into the consolidated screen structure", () => {
  const legacy = ["overview", "workflow", "create", "prompt-lab", "vocal-director", "templates",
    "recording", "vocal-studio", "podcast", "multitrack", "compare", "music-library",
    "meditative-vibes", "rhythm-atlas", "international-tent", "songs", "radio",
    "lyric-video", "releases", "distribution"];
  for (const view of legacy) {
    assert(sectionViews.includes(view as typeof sectionViews[number]), `${view} remains a supported engine view`);
    const resolved = resolveView(view);
    assert(resolved, `${view} remains reachable`);
    assert(screens.includes(resolved.screen));
  }
  const expectedHomes: Record<string,string> = {
    overview:"create",create:"create","prompt-lab":"create","vocal-director":"create",templates:"create",
    "music-library":"world-sounds","rhythm-atlas":"world-sounds","international-tent":"world-sounds","meditative-vibes":"world-sounds",
    recording:"record",podcast:"record","vocal-studio":"record",multitrack:"mix-edit",compare:"mix-edit",
    songs:"songs",workflow:"songs",releases:"songs",distribution:"songs",radio:"explore","lyric-video":"lyric-video",
  };
  for(const view of legacy){
    assert.equal(screenOf(view as typeof sectionViews[number]),expectedHomes[view],`${view} keeps its actual engine home`);
    assert.equal(resolveView(view)!.screen,expectedHomes[view],`${view} opens the correct consolidated screen`);
  }
  const views = Object.values(screenSections).flat().map(entry => entry.view);
  assert(views.every(view=>sectionViews.includes(view)));
  assert.equal(new Set(views).size, views.length);
  assert.equal(SimpleWorkspaceTools, ScreenSections, "legacy helper import remains compatible");
});

test("an unexpected tool render error shows recovery instructions instead of a blank application", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(document.getElementById("root")!);
  const log = console.error; console.error = () => {};
  function FailedTool(): React.ReactNode { throw new Error("simulated unsupported tool"); }
  try {
    await act(async () => root.render(<StudioErrorBoundary><FailedTool/></StudioErrorBoundary>));
    assert.match(document.querySelector('[role="alert"]')!.textContent!, /saved songs and original recordings/);
    assert.equal(document.querySelector("button")!.textContent, "Reload Studio");
    assert(!document.body.textContent!.includes("simulated unsupported tool"));
  } finally { await act(async () => root.unmount()); console.error = log; dom.window.close(); }
});


test("beginner navigation has five destinations and Pro adds only the three requested screens",()=>{
 assert.deepEqual(primaryScreens.filter(item=>!item.pro).map(item=>item.label),["Create","Your songs","Video","Record","Explore"]);
 assert.deepEqual(primaryScreens.filter(item=>item.pro).map(item=>item.label),["World Sounds","Mix & Edit","Promote"]);
 assert.equal(screens.length,9);
 for(const screen of screens){
   if(screen!=="plan-credits")assert.equal(screenOf(screenHome[screen]),screen);
 }
});
test("beginner navigation opens mobile menu, routes to a workspace, and restores all tools on request",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,getComputedStyle:dom.window.getComputedStyle,requestAnimationFrame:(fn:FrameRequestCallback)=>setTimeout(fn,0),cancelAnimationFrame:(id:number)=>clearTimeout(id),IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);let target="";
  function Screen(){const [simple,setSimple]=useState(true);return <><WorkspaceModeSwitch beginner={simple} change={setSimple}/><StudioNavigation activeView="vocal-studio" owner={false} beginner={simple} changeBeginner={setSimple} navigate={v=>{target=v;return true;}} settings={()=>{}} guide={()=>{}}/></>;}
 dom.window.scrollTo=()=>{};
 try{await act(async()=>root.render(<Screen/>));assert.equal(document.querySelectorAll('.simple-main-navigation button').length,5);assert.equal(document.querySelectorAll('.studio-nav-group').length,1);assert.equal(document.querySelector('.simple-main-navigation .nav-active')!.textContent,"Record");
 const click=async(el:Element)=>act(async()=>{(el as HTMLButtonElement).click();});
 await click(document.querySelector('.studio-menu-toggle')!);assert.equal(document.querySelector('.studio-menu-toggle')!.getAttribute('aria-expanded'),'true');
 await click([...document.querySelectorAll('.simple-main-navigation button')].find(b=>b.textContent==='Create')!);assert.equal(target,'overview');assert.equal(document.querySelector('.studio-menu-toggle')!.getAttribute('aria-expanded'),'false');
 await click(document.querySelector('[role="switch"]')!);assert.equal(document.querySelector('[role="switch"]')!.getAttribute('aria-checked'),'true');assert.equal(document.querySelectorAll('.creator-secondary-nav button').length,3);assert.equal(document.querySelectorAll('.simple-main-navigation button').length,5);
 await click(document.querySelector('[data-testid="toggle-settings-help"]')!);
 assert(!document.querySelector('a[href="/admin"]'));assert(!document.querySelector('a[href="/community/moderation"]'));
 await click(document.querySelector('[role="switch"]')!);assert.equal(document.querySelectorAll('.simple-main-navigation button').length,5);assert(!document.querySelector('.creator-secondary-nav'));
 await act(async()=>root.render(<ScreenSections activeView="multitrack" beginner={false} navigate={v=>{target=v;return true;}}/>));await click([...document.querySelectorAll('button')].find(b=>/Compare mixes/.test(b.textContent??""))!);assert.equal(target,'compare');
 }finally{await act(async()=>root.unmount());dom.window.close();}
});
