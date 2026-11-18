import {customCreate,creationIdea,oneTake} from "./create-controls";
import test from "node:test";
import assert from "node:assert/strict";
import React, { act, useState } from "react";
import { JSDOM } from "jsdom";
import { GenrePicker } from "../app/genre-picker";
import { allGenres, featuredGenres, genreDirection, genreFamilies, genreSearchKey, genreTags, replaceGenreTags } from "../app/music-genres";
import { QuickCreate } from "../app/quick-create";
import { CreateStudio } from "../app/create-studio";
import type { ElevenLabsKey } from "../app/elevenlabs-key";
import { hasExplicitWords } from "../app/clean-content";
import { detectPromptGenres, fusionGenres, suggestGenreFusion } from "../app/genre-assist";
import { applyChunkStyleCues, lyricStyleCues, productionLyricChunks } from "../app/lyric-style-cues";
import { freshSong } from "../app/studio-data";
import { lyricLines } from "../app/lyric-video-data";

test("the expanded catalog retains original styles and distinct regional names",()=>{
  assert(allGenres.length>=250); assert.equal(new Set(allGenres.map(s=>s.toLowerCase())).size,allGenres.length);
  for(const name of featuredGenres)assert(allGenres.includes(name));
  for(const name of ["Country","Heavy Metal","Raï","Afrobeats","Afrobeat","K-Pop","Qawwali","Bossa Nova","Tarab"])assert(allGenres.includes(name));
  assert(genreFamilies.length>=15);assert.equal(hasExplicitWords(...allGenres),false);
  assert.equal(genreSearchKey("Hip-hop"),genreSearchKey("hip hop"));assert.equal(genreSearchKey("Raï"),"rai");
  const original="Keep the vocals intimate and place the piano behind them through the entire verse, R&B";
  assert.equal(replaceGenreTags(original,["Jazz"]),original.split(",")[0]+", Jazz");
  assert.deepEqual(genreTags("R&B, Jazz, R&B"),["R&B","Jazz"]);assert.match(genreDirection(["Jazz","Dabke"]),/Jazz, Dabke/);
});

async function setup(){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,requestAnimationFrame:()=>0,IS_REACT_ACT_ENVIRONMENT:true});
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  const button=(name:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent?.replace("✓","").trim()===name)!;
  async function input(element:HTMLInputElement|HTMLTextAreaElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element),"value")!.set!.call(element,value);element.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});}
  async function family(name:string){const el=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value===name))!;await act(async()=>{el.value=name;el.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});}
  async function language(){const el=document.querySelector('select[aria-label="Singing language"]') as unknown as HTMLSelectElement;await act(async()=>{el.value="en";el.dispatchEvent(new dom.window.Event("change",{bubbles:true}));});}
  return {dom,root,button,input,family,language,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}

test("genre switches, categories, search and custom chips preserve a bounded style blend",async()=>{
  const h=await setup();let selected:string[]=[];let submitted=0;
  function Harness(){const [value,change]=useState<string[]>([]);selected=value;return <form onSubmit={e=>{e.preventDefault();submitted++;}}><GenrePicker value={value} change={change} maxSelected={3}/></form>;}
  try{
    await act(async()=>h.root.render(<Harness/>));
    await act(async()=>h.button("R&B").click());
    await act(async()=>(document.querySelector('[role="switch"]') as HTMLButtonElement).click());
    assert.equal(document.querySelector('[role="switch"]')!.getAttribute("aria-checked"),"true");
    await h.family("Jazz & Blues");await act(async()=>h.button("Jazz").click());
    await h.input(document.querySelector('input[type="search"]')!,"smooth");assert(h.button("Smooth Jazz"));assert(!h.button("Country"));
    await h.input(document.querySelector('.genre-custom input')!,"Oud jazz fusion");
    await act(async()=>document.querySelector('.genre-custom input')!.dispatchEvent(new h.dom.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true})));
    assert.deepEqual(selected,["R&B","Jazz","Oud jazz fusion"]);assert.equal(submitted,0);
    assert(h.button("Smooth Jazz").disabled);
    await act(async()=>(document.querySelector('[aria-label="Remove R&B"]') as HTMLButtonElement).click());assert(!h.button("Smooth Jazz").disabled);
    await act(async()=>h.button("Smooth Jazz").click());
    await act(async()=>(document.querySelector('[role="switch"]') as HTMLButtonElement).click());assert.equal(selected.length,3);
    await act(async()=>h.button("Clear selection").click());assert.deepEqual(selected,[]);
  }finally{await h.close();}
});

test("single-genre filters replace their selection and retain legacy custom tags",async()=>{
  const h=await setup();let selected:string[]=[];
  function Harness(){const [value,change]=useState(["Legacy festival mix"]);selected=value;return <GenrePicker value={value} change={change} single allowCustom={false} extraOptions={["Legacy festival mix"]}/>;}
  try{await act(async()=>h.root.render(<Harness/>));await act(async()=>h.button("Pop").click());assert.deepEqual(selected,["Pop"]);await act(async()=>h.button("Show all songs").click());assert.deepEqual(selected,[]);assert(h.button("Legacy festival mix"));}finally{await h.close();}
});

test("Quick Create sends clicked genre blends into the actual generation request",async()=>{
  const h=await setup();let sent:{title:string;prompt:string}|undefined;
  try{
    await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{sent=input;return undefined;}} saveSketch={async()=>undefined}/>));
    await customCreate();
    await h.input(document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-idea"]')!,"Finding our way home through love");
    await h.language();
    await oneTake();
    await act(async()=>h.button("Pop").click());await h.input(document.querySelector<HTMLInputElement>('[data-testid="input-search-sounds"]')!,"amapiano");await act(async()=>h.button("Amapiano").click());
    await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));
    assert.match(sent!.prompt,/^Style: Pop, Amapiano\./);assert(sent!.title.length<=100);
    await h.input(document.querySelector<HTMLInputElement>('[data-testid="input-search-sounds"]')!,"");
    await act(async()=>h.button("Pop").click());
    await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));
    assert.match(sent!.prompt,/^Style: Amapiano\./);
  }finally{await h.close();}
});

test("Guided Studio keeps the selected genres ahead of provider prompt truncation",async()=>{
  const h=await setup();let sent:Record<string,string|number|boolean>|undefined;
  try{
    const elevenLabs={connected:true,defaultProvider:true,busy:false} as ElevenLabsKey;
    await act(async()=>h.root.render(<CreateStudio seed={{idea:"A joyful song about love "+"with a memorable hook ".repeat(45)}} voiceDesignAllowed={false} elevenLabs={elevenLabs} connectionSettings={()=>{}} drafts={[]} voices={[]} saving={false} operationError="" startAtDrafts={false} firstSongRequest={false} finishFirstSongRequest={()=>{}} openVocalStudio={()=>{}} send={async input=>{sent=input;return true;}} saveDraft={async()=>true} saveInstrumental={async()=>true} move={async()=>true} open={()=>{}} remix={()=>{}}/>));
    await act(async()=>[...document.querySelectorAll("button")].find(b=>b.querySelector("strong")?.textContent==="Beginner")!.click());
    await act(async()=>h.button("Country").click());await act(async()=>h.button("Jazz").click());
    await h.language();
    await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));
    assert.match(String(sent!.prompt),/^Musical styles: Country, Jazz\./);assert(String(sent!.prompt).length<=1600);
  }finally{await h.close();}
});

test("automatic fusions use eligible saved prompts, preserve exclusions and never alter source projects",()=>{
  assert.deepEqual(detectPromptGenres("Deep House and hip hop, without jazz. Popcorn by the rocky shore."),["Deep House","Hip-hop"]);
  const saved={...freshSong("mine","My project",0),notes:{...freshSong("x","x",0).notes,prompt:"Afro House with private notes about my family"}};
  const excluded={...freshSong("deleted","Deleted",0),deletedAt:"2026-01-01",tags:["Heavy Metal"]};
  const snapshot=structuredClone([saved,excluded]);
  const fusion=suggestGenreFusion("A joyful song", "",[saved,excluded],true);
  assert(fusion.genres.includes("Afro House"));assert(!fusion.genres.includes("Heavy Metal"));assert.equal(fusion.historyCount,1);
  assert(!suggestGenreFusion("A joyful song","",[saved],false).genres.includes("Afro House"));
  assert(!suggestGenreFusion("No Afro House please","",[saved],true).genres.includes("Afro House"));
  assert.notDeepEqual(suggestGenreFusion("","",[],false,0).genres,suggestGenreFusion("","",[],false,1).genres);
  assert.equal(fusionGenres(fusion,"Samadhi Soul")[0],"Samadhi Soul");assert.deepEqual([saved,excluded],snapshot);
});

test("coded lyric sections preserve original words, repeat scope and long-section styles",()=>{
  const lyrics="[Verse 1 | genre: Lebanese Dabke]\nنور وحب\n[Chorus]\n{genre: Afro House}\nLove and light\n[Chorus | genre: R&B]\nLove and light";
  const parsed=lyricStyleCues(lyrics);assert.equal(parsed.errors.length,0);assert.deepEqual(parsed.cues.map(c=>c.genre),["Lebanese Dabke","Afro House","R&B"]);
  const chunks=productionLyricChunks(lyrics,true,false);assert.deepEqual(chunks.map(c=>c.genre),["Lebanese Dabke","Afro House","R&B"]);
  assert.deepEqual(lyricLines(chunks.map(c=>c.text).join("\n")),lyricLines(lyrics));
  assert.deepEqual(lyricStyleCues("I love jazz and rock me gently").cues,[]);
  const long=productionLyricChunks("[Chorus | genre: Jazz]\n"+"Approved words stay here\n".repeat(80),true,false);
  assert(long.length>1);assert(long.every(c=>c.genre==="Jazz"&&c.text.startsWith("[Chorus]")));
  assert(lyricStyleCues("[Verse | genre: "+"x".repeat(161)+"]").errors.length);
  const derived=applyChunkStyleCues([{text:"[Chorus | genre: Trance]\nنور وحب",positive_styles:["warm vocals"]}]);
  assert.deepEqual(derived[0].positive_styles,["Trance","warm vocals"]);assert.equal(derived[0].text,"[Chorus]\nنور وحب");
  const ignored=applyChunkStyleCues([{text:lyrics}],false)[0];
  assert.deepEqual(lyricLines(ignored.text!),lyricLines(lyrics));assert(!ignored.text!.includes("genre:"));
  assert(productionLyricChunks(lyrics,false,false).every(c=>c.genre===undefined&&!c.text.includes("genre:")));
});

test("Studio chooses sends a named fusion without forwarding private prompt history",async()=>{
  const h=await setup();let sent:{prompt:string}|undefined;
  const saved={...freshSong("mine","My project",0),notes:{...freshSong("x","x",0).notes,prompt:"Afro House. A private family story that must not be forwarded"}};
  try{
    await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[saved]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{sent=input;return undefined;}} saveSketch={async()=>undefined}/>));
    await customCreate();await h.input(creationIdea(),"Make something uplifting");
    await h.language();
    const auto=[...document.querySelectorAll('input[type="checkbox"]')].find(i=>i.parentElement?.textContent?.includes("Studio chooses")) as HTMLInputElement;
    await act(async()=>auto.click());
    await oneTake();
    assert(document.querySelector<HTMLInputElement>('[data-testid="input-styles"]')!.value.includes("Fusion"));
    await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));
    assert.match(sent!.prompt,/Afro House/);assert.match(sent!.prompt,/Fusion/);assert(!sent!.prompt.includes("private family"));
    await act(async()=>h.button("Pop").click());assert(!auto.checked,"a manual chip selection takes back control");
  }finally{await h.close();}
});

test("Guided lyric code can be disabled without changing the approved source",async()=>{
  const h=await setup();let sent:Record<string,string|number|boolean>|undefined;
  const lyrics="[Verse 1 | genre: Lebanese Dabke]\nنور وحب\n[Chorus | genre: Afro House]\nLove and light";
  try{
    const elevenLabs={connected:true,defaultProvider:true,busy:false} as ElevenLabsKey;
    await act(async()=>h.root.render(<CreateStudio seed={{idea:"An uplifting duet",lyrics}} voiceDesignAllowed={false} elevenLabs={elevenLabs} connectionSettings={()=>{}} drafts={[]} voices={[]} saving={false} operationError="" startAtDrafts={false} firstSongRequest={false} finishFirstSongRequest={()=>{}} openVocalStudio={()=>{}} send={async input=>{sent=input;return true;}} saveDraft={async()=>true} saveInstrumental={async()=>true} move={async()=>true} open={()=>{}} remix={()=>{}}/>));
    await act(async()=>[...document.querySelectorAll("button")].find(b=>b.querySelector("strong")?.textContent==="Beginner")!.click());
    assert(document.querySelector(".genre-lyric-cues")!.textContent!.includes("Afro House"));
    const toggle=[...document.querySelectorAll('input[type="checkbox"]')].find(i=>i.parentElement?.textContent?.includes("Read genre directions")) as HTMLInputElement;
    await act(async()=>toggle.click());
    await h.language();
    await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));
    assert.equal(sent!.readLyricStyles,false);assert.equal(sent!.lyrics,lyrics);
  }finally{await h.close();}
});

test("expanded style window holds eight visible selections and releases a slot when a chip is removed",async()=>{
 const h=await setup();let selected:string[]=[];function Harness(){const[value,change]=useState<string[]>([]);selected=value;return <GenrePicker value={value} change={change}/>;}
 try{await act(async()=>h.root.render(<Harness/>));for(const name of ["Pop","Jazz","Trance","R&B","Hip-hop","Country","Afrobeats","Ambient"])await act(async()=>h.button(name).click());
 assert.equal(selected.length,8);assert.equal(document.querySelectorAll('.genre-selected .genre-pill').length,8);assert.ok(document.querySelector('.genre-selected')!.textContent!.includes('8/8'));assert.ok(h.button('Rock').disabled);
 await act(async()=>h.button('Expand styles window').click());assert.ok(document.querySelector('.genre-picker-expanded'));assert.equal(h.button('Compact styles window').getAttribute('aria-expanded'),'true');assert.equal(document.querySelectorAll('.genre-selected .genre-pill').length,8);
 await act(async()=>(document.querySelector('[aria-label="Remove Jazz"]') as HTMLButtonElement).click());assert.equal(selected.length,7);assert.ok(!h.button('Rock').disabled);await act(async()=>h.button('Rock').click());assert.equal(selected.length,8);
 await act(async()=>h.button('Compact styles window').click());assert.equal(document.querySelectorAll('.genre-selected .genre-pill').length,8);
 }finally{await h.close();}
});

test("pasted music direction detects eight styles and reaches Quick Create intact with or without chips",async()=>{
 const h=await setup();let sent:any;const text='Blend Jazz, Lebanese Dabke, Deep House, Trance, R&B, Afrobeats, Ambient and Gospel. Warm oud, natural singing and a spacious middle section. Without rap.';
 try{await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{sent=input;return undefined;}} saveSketch={async()=>undefined}/>));await customCreate();await oneTake();await h.input(creationIdea(),text);assert.equal(creationIdea().value,text);
 await h.language();
 const pressed=()=>document.querySelectorAll('[data-testid="group-genres"] .shape-chip[aria-pressed="true"]').length;
 await act(async()=>h.button('Use styles from my vision · 8').click());assert.equal(pressed(),8);await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(genreTags(sent.genres).length,8);assert.ok(sent.prompt.includes(text));
 await act(async()=>h.button('Clear picks').click());assert.equal(pressed(),0);await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.ok(sent.prompt.startsWith(text));assert.equal(sent.genres,'');assert.ok(!sent.prompt.startsWith('Genre:'));
 }finally{await h.close();}
});

test("Guided Create forwards all eight selected styles in both prompt and saved-genre metadata",async()=>{
 const h=await setup();let sent:any;const names=['Pop','Jazz','Trance','R&B','Hip-hop','Country','Afrobeats','Ambient'];
 try{await act(async()=>h.root.render(<CreateStudio seed={{idea:'A joyful original song about finding home'}} voiceDesignAllowed={false} elevenLabs={{connected:true,defaultProvider:true,busy:false} as ElevenLabsKey} connectionSettings={()=>{}} drafts={[]} voices={[]} saving={false} operationError="" startAtDrafts={false} firstSongRequest={false} finishFirstSongRequest={()=>{}} openVocalStudio={()=>{}} send={async input=>{sent=input;return true;}} saveDraft={async()=>true} saveInstrumental={async()=>true} move={async()=>true} open={()=>{}} remix={()=>{}}/>));await act(async()=>[...document.querySelectorAll('button')].find(b=>b.querySelector('strong')?.textContent==='Beginner')!.click());await h.language();for(const name of names)await act(async()=>h.button(name).click());await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.deepEqual(genreTags(sent.genres),names);for(const name of names)assert.ok(sent.prompt.includes(name));
 }finally{await h.close();}
});

test("oversized combined directions stay editable and are rejected before generation rather than truncated",async()=>{
 const h=await setup();let calls=0;const idea=('A joyful original song. '+'A warm memorable chorus. '.repeat(65)).slice(0,1400);
 try{await act(async()=>h.root.render(<CreateStudio seed={{idea}} voiceDesignAllowed={false} elevenLabs={{connected:true,defaultProvider:true,busy:false} as ElevenLabsKey} connectionSettings={()=>{}} drafts={[]} voices={[]} saving={false} operationError="" startAtDrafts={false} firstSongRequest={false} finishFirstSongRequest={()=>{}} openVocalStudio={()=>{}} send={async()=>{calls++;return true;}} saveDraft={async()=>true} saveInstrumental={async()=>true} move={async()=>true} open={()=>{}} remix={()=>{}}/>));await act(async()=>[...document.querySelectorAll('button')].find(b=>b.querySelector('strong')?.textContent==='Beginner')!.click());for(let i=1;i<=8;i++){await h.input(document.querySelector('.genre-custom input')!,`Custom style ${i} `+'a'.repeat(45));await act(async()=>h.button('Add style').click());}await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(calls,0);assert.ok(document.body.textContent!.includes('exceeds 1600'));assert.equal((document.querySelector('textarea') as HTMLTextAreaElement).value,idea);assert.equal(document.querySelectorAll('.genre-selected .genre-pill').length,8);
 }finally{await h.close();}
});

test("saved song genres survive reopening the creation editor",async()=>{
 const h=await setup();let sent:any;const styles=['Country','Jazz','World Fusion'];
 try{await act(async()=>h.root.render(<CreateStudio seed={{idea:'An original journey home',genres:styles}} voiceDesignAllowed={false} elevenLabs={{connected:true,defaultProvider:true,busy:false} as ElevenLabsKey} connectionSettings={()=>{}} drafts={[]} voices={[]} saving={false} operationError="" startAtDrafts={false} firstSongRequest={false} finishFirstSongRequest={()=>{}} openVocalStudio={()=>{}} send={async input=>{sent=input;return true;}} saveDraft={async()=>true} saveInstrumental={async()=>true} move={async()=>true} open={()=>{}} remix={()=>{}}/>));await act(async()=>[...document.querySelectorAll('button')].find(b=>b.querySelector('strong')?.textContent==='Beginner')!.click());await h.language();assert.equal(document.querySelectorAll('.genre-selected .genre-pill').length,3);await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.deepEqual(genreTags(sent.genres),styles);
 }finally{await h.close();}
});
