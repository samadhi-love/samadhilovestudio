import test from "node:test";
import "./browser-platform";
import assert from "node:assert/strict";
import React, { act, useState } from "react";
import { JSDOM } from "jsdom";
import { StudioErrorBoundary } from "../app/studio-error-boundary";
import { StudioNavigation, SimpleWorkspaceTools, simpleWorkspaces, navigationGroups, workspaceNavigation } from "../app/studio-navigation";

test("navigation retains every existing workspace exactly once", () => {
  const views = navigationGroups.flatMap(group => group.entries.flatMap(entry => "view" in entry ? [entry.view] : []));
  assert.deepEqual([...views].sort(), workspaceNavigation.map(item => item.id).sort());
  assert.equal(new Set(views).size, workspaceNavigation.length);
  assert(navigationGroups.some(group => group.entries.some(entry => "href" in entry && entry.href === "/party")));
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


test("task-focused workspaces cover every old destination once and keep advanced tool handoffs intact",()=>{
 assert.equal(simpleWorkspaces.length,4);
 const destinations=simpleWorkspaces.flatMap(g=>g.views);
 assert.deepEqual([...destinations].sort(),workspaceNavigation.map(w=>w.id).sort());
 assert.equal(new Set(destinations).size,destinations.length);
 for(const group of simpleWorkspaces){assert(group.primary.includes(group.home));assert(group.primary.every(v=>group.views.includes(v)));}
});
test("beginner navigation opens mobile menu, routes to a workspace, and restores all tools on request",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,getComputedStyle:dom.window.getComputedStyle,requestAnimationFrame:(fn:FrameRequestCallback)=>setTimeout(fn,0),cancelAnimationFrame:(id:number)=>clearTimeout(id),IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);let target="";
 function Screen(){const [simple,setSimple]=useState(true);return <StudioNavigation activeView="vocal-studio" owner={false} beginner={simple} changeBeginner={setSimple} navigate={v=>{target=v;return true;}} settings={()=>{}} guide={()=>{}}/>;}
 try{await act(async()=>root.render(<Screen/>));assert.equal(document.querySelectorAll('.simple-main-navigation button').length,2);assert.equal(document.querySelectorAll('.studio-nav-group').length,1);assert.equal(document.querySelector('.creator-secondary-nav .nav-active')!.textContent,"Recording tools");
 const click=async(el:Element)=>act(async()=>{(el as HTMLButtonElement).click();});
 await click(document.querySelector('.studio-menu-toggle')!);assert.equal(document.querySelector('.studio-menu-toggle')!.getAttribute('aria-expanded'),'true');
 await click([...document.querySelectorAll('.simple-main-navigation button')].find(b=>b.textContent==='Create')!);assert.equal(target,'overview');assert.equal(document.querySelector('.studio-menu-toggle')!.getAttribute('aria-expanded'),'false');
 await click(document.querySelector('[role="switch"]')!);assert.equal(document.querySelector('[role="switch"]')!.getAttribute('aria-checked'),'true');assert.equal(document.querySelectorAll('.studio-nav-group').length,navigationGroups.length);assert.equal(document.querySelector('.simple-main-navigation'),null);
 assert(!document.querySelector('a[href="/admin"]'));await click(document.querySelector('[role="switch"]')!);assert.equal(document.querySelectorAll('.simple-main-navigation button').length,2);
 await act(async()=>root.render(<SimpleWorkspaceTools activeView="multitrack" navigate={v=>{target=v;return true;}}/>));assert(document.querySelector('details')!.open);await click([...document.querySelectorAll('button')].find(b=>b.textContent==='Mix Lab')!);assert.equal(target,'compare');
 }finally{await act(async()=>root.unmount());dom.window.close();}
});
