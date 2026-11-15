import test from "node:test";
import assert from "node:assert/strict";
import React,{act,useState} from "react";
import {JSDOM} from "jsdom";
import {musicCatalog} from "../app/music-catalog";
import {allGenres,sameGenre,genreTags} from "../app/music-genres";
import {GenrePicker} from "../app/genre-picker";
import {MusicLibrary} from "../app/music-library";
import type {Discovery} from "../app/music-workspace-data";
test("genre registry coverage, stable IDs and normalization preserve distinct traditions",()=>{assert.equal(new Set(musicCatalog.map(e=>e.id)).size,musicCatalog.length);assert.ok(allGenres.every(name=>musicCatalog.some(e=>e.kind==="Genre"&&sameGenre(e.name,name))));assert.ok(musicCatalog.some(e=>e.id==="dabke"&&e.region.includes("Lebanon")));assert.deepEqual(genreTags("Hip hop, HIP-HOP, Jazz, jazz"),["Hip hop","Jazz"]);assert.equal(sameGenre("Afrobeat","Afrobeats"),false);assert.equal(sameGenre("Raï","Rai"),true);});
async function setup(){const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);return{dom,root,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};}
test("genre chips do not duplicate punctuation/case variants and selection removes the matching legacy variant",async()=>{const h=await setup();let changed:string[]=[];try{await act(async()=>h.root.render(<GenrePicker value={["Hip hop","HIP-HOP"]} change={v=>{changed=v;}}/>));assert.equal(document.querySelectorAll('.genre-selected .genre-pill').length,1);const selected=[...document.querySelectorAll('.genre-options button')].find(b=>b.textContent?.includes("Hip-hop")) as HTMLButtonElement;assert.equal(selected.getAttribute("aria-pressed"),"true");await act(async()=>selected.click());assert.deepEqual(changed,[]);}finally{await h.close();}});
test("catalog save controls retain failed edits, prevent duplicate collection names and render bounded pages",async()=>{
 const h=await setup();let data:Discovery={favorites:[],collections:[{id:"first",name:"My Collection",entries:[]}],prompts:[]},fail=true,calls=0;
 function Harness(){const[current,set]=useState(data);return <MusicLibrary atlas={false} data={current} saving={false} openPrompt={()=>{}} save={async next=>{calls++;if(fail)return false;data=next;set(next);return true;}}/>;}
 const button=(name:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent===name)!;
 const input=async(el:HTMLInputElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),"value")!.set!.call(el,value);el.dispatchEvent(new h.dom.window.Event("input",{bubbles:true}));});
 try{await act(async()=>h.root.render(<Harness/>));assert.equal(document.querySelectorAll('article.section.music-card').length,60);const more=[...document.querySelectorAll("button")].find(b=>b.textContent?.startsWith("Show more catalog entries"))!;await act(async()=>more.click());assert.equal(document.querySelectorAll('article.section.music-card').length,120);
 const name=document.querySelector('input[placeholder="e.g. Lebanese dance palette"]') as HTMLInputElement;await input(name,"my collection");await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));assert.equal(calls,0);assert.ok(document.body.textContent!.includes("already exists"));
 await input(name,"Second palette");await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));assert.equal(calls,1);assert.equal(name.value,"Second palette");assert.equal(data.collections.length,1);
 fail=false;await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));assert.equal(data.collections.length,2);assert.equal(name.value,"");
 const filter=[...document.querySelectorAll("select")].find(s=>s.options[0]?.textContent==="All entries")!;await act(async()=>{filter.value="";filter.dispatchEvent(new h.dom.window.Event("change",{bubbles:true}));});
 await input(document.querySelector('input[type="search"]')!,"Raï");assert.ok(document.body.textContent!.includes("Raï"));assert.ok(document.querySelectorAll('article.section.music-card').length<60);
 }finally{await h.close();}
});
