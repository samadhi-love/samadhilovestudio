import test from "node:test";import assert from "node:assert/strict";import React,{act} from "react";import {JSDOM} from "jsdom";
import {QuickCreate} from "../app/quick-create";
import {freshSong,type Template} from "../app/studio-data";
import {makeSavedSongPrompt,readSavedShape,type PromptDraft} from "../app/saved-song-prompts";
import {readStyleDNA,defaultSongMap} from "../app/style-dna";
import {musicLanguages} from "../app/music-language";
import type {MusicEngineStatus} from "../app/music-engine-data";

const ace:MusicEngineStatus={owner:true,preferred:"ace-step",engine:"ace-step",configured:true,notice:""};
const eleven:MusicEngineStatus={owner:false,preferred:"elevenlabs",engine:"elevenlabs",configured:true,notice:""};
async function setup(){const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'confirm',{configurable:true,get:()=>dom.window.confirm});const{createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root')!);const button=(name:string)=>[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===name)!;const input=async(el:HTMLInputElement|HTMLTextAreaElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value')!.set!.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});const select=async(el:HTMLSelectElement,value:string)=>act(async()=>{el.value=value;el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});const submit=()=>act(async()=>{document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});return{dom,root,button,input,select,submit,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};}
const q=<T extends Element=HTMLElement>(id:string)=>document.querySelector<T>(`[data-testid="${id}"]`);
const base={connected:true,saving:false,drafts:[],settings:()=>{},guided:()=>{},openDrafts:()=>{},saveSketch:async()=>undefined};
async function shapeIt(h:Awaited<ReturnType<typeof setup>>){await act(async()=>q<HTMLButtonElement>("tab-mode-custom")!.click());await act(async()=>{for(const d of document.querySelectorAll("details"))(d as HTMLDetailsElement).open=true;});}

test("Just Begin exposes only Your Vision (with Save this prompt), language, No Vocals and Begin",async()=>{
 const h=await setup();
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async()=>"s"} savedPrompts={[]} savePrompt={async()=>undefined} recipes={[{id:"r",name:"R",description:"",tags:[],notes:{lyrics:"",prompt:"",vocals:"",instruments:"",cover:"",video:"",promotion:""}} as Template]}/>));
  assert.equal(document.querySelector("h1")!.textContent,"Begin a song");
  assert.equal(q("tab-mode-simple")!.textContent,"Just Begin");assert.equal(q("tab-mode-custom")!.textContent,"Shape It");
  const panel=q("panel-just-begin")!;
  assert.match(panel.textContent!,/Your Vision/);
  const controls=[...panel.querySelectorAll("input,textarea,select")].map(e=>(e as HTMLElement).dataset.testid||e.getAttribute("aria-label"));
  assert.deepEqual(controls,["input-song-description","Singing language","checkbox-instrumental"]);
  assert.match(panel.textContent!,/No Vocals/);
  assert.equal(q("button-create-song")!.textContent!.trim(),"Begin");
  assert.equal(q<HTMLTextAreaElement>("input-song-description")!.rows,4,"vision shows several lines, not one hidden line");
  assert.ok(q<HTMLButtonElement>("button-save-vision")!.disabled,"nothing to save yet");
  for(const hidden of ["input-lyrics","saved-prompt-library","select-recipe","checkbox-make-two-versions","text-create-summary","text-version-cost","section-advanced-options","button-help-describe","input-negative-style"])assert.equal(q(hidden),null,hidden);
  assert.doesNotMatch(document.body.textContent!,/credits|Make 2 versions|My prompts/i);
 }finally{await h.close();}
});

test("language priority: Auto starts English, a description wins over English, an explicit pick wins over both",async()=>{
 const h=await setup();const sent:any[]=[];
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async i=>{sent.push(i);return "s";}}/>));
  const sel=document.querySelector('select[aria-label="Singing language"]') as unknown as HTMLSelectElement;
  assert.equal(sel.value,"auto");assert.match(sel.selectedOptions[0].textContent!,/English by default/);
  await h.input(q<HTMLTextAreaElement>("input-song-description")!,"A warm love song sung in Spanish");
  assert.match(q("text-singing-language")!.textContent!,new RegExp(musicLanguages.es));
  assert.match(q("text-singing-language")!.textContent!,/from your description/);
  await h.select(sel,"fr");
  assert.match(q("text-singing-language")!.textContent!,new RegExp(musicLanguages.fr));
  await h.submit();
  assert.equal(sent.length,1);assert.equal(sent[0].language,"fr");assert.equal(sent[0].selected,true);assert.equal(sent[0].autoLength,true);assert.ok(sent[0].duration<=360);
 }finally{await h.close();}
});

test("mode switching preserves vision and Shape selections; grouped search, See more and unlimited picks keep full state while 20 guide the engine",async()=>{
 const h=await setup();const sent:any[]=[];const savedDrafts:PromptDraft[]=[];
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async i=>{sent.push(i);return "s";}} savePrompt={async d=>{savedDrafts.push(d);return makeSavedSongPrompt(d,"prompt-x");}}/>));
  await h.input(q<HTMLTextAreaElement>("input-song-description")!,"A hopeful song about starting again, sung in English");
  await shapeIt(h);
  assert.equal(q<HTMLTextAreaElement>("input-song-idea")!.value,"A hopeful song about starting again, sung in English");
  const genres=q("group-genres")!;
  const before=genres.querySelectorAll(".shape-chip").length;assert.equal(before,8);
  await act(async()=>q<HTMLButtonElement>("button-see-more-genres")!.click());
  const chips=[...q("group-genres")!.querySelectorAll<HTMLButtonElement>(".shape-chip")];assert.ok(chips.length>25);
  for(const c of chips.slice(0,22))await act(async()=>c.click());
  for(const name of ["oud","cello","synthpads"]){
   await h.input(q<HTMLInputElement>("input-search-sounds")!,name);
   const hit=document.querySelector<HTMLButtonElement>(`[data-testid$="-${name}"].shape-chip`)!;assert.ok(hit,name);await act(async()=>hit.click());
  }
  await h.input(q<HTMLInputElement>("input-search-sounds")!,"oud");
  assert.equal(q("group-genres")?.querySelectorAll(".shape-chip").length??0,[...q("group-genres")?.querySelectorAll(".shape-chip")??[]].filter(c=>/oud/i.test(c.textContent!)).length,"search filters every group");
  await h.input(q<HTMLInputElement>("input-search-sounds")!,"");
  assert.match(q("text-pick-guidance")!.textContent!,/25 picks kept/);assert.match(q("text-pick-guidance")!.textContent!,/5 more are saved/);
  await act(async()=>q<HTMLButtonElement>("tab-mode-simple")!.click());
  await act(async()=>q<HTMLButtonElement>("tab-mode-custom")!.click());
  await act(async()=>{for(const d of document.querySelectorAll("details"))(d as HTMLDetailsElement).open=true;});
  assert.equal(q("group-genres")!.querySelectorAll('.shape-chip[aria-pressed="true"]').length,22,"every chosen genre stays visible and pressed after switching modes");
  assert.match(q("text-pick-guidance")!.textContent!,/25 picks kept/);
  await act(async()=>q<HTMLButtonElement>("button-save-current-prompt")!.click());
  assert.equal(savedDrafts[0].tags.length,22,"every genre pick saved");
  assert.equal(savedDrafts[0].instruments.split(",").length,3);
  assert.equal(savedDrafts[0].lyrics,"");assert.equal(savedDrafts[0].idea,"","words are optional and off by default");
  await h.submit();
  assert.equal(sent[0].genres.split(", ").length,20,"first 20 picks guide the engine");
  assert.equal(sent[0].instruments,"","instrument picks beyond the first 20 are kept but not sent");
 }finally{await h.close();}
});

test("Voice chips become real prompt directions",async()=>{
 const h=await setup();const sent:any[]=[];
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async i=>{sent.push(i);return "s";}}/>));
  await shapeIt(h);
  await h.input(q<HTMLTextAreaElement>("input-song-idea")!,"A song about home, in English");
  await act(async()=>q<HTMLButtonElement>("chip-voice-female")!.click());
  await act(async()=>q<HTMLButtonElement>("chip-voice-style-gospel-lead")!.click());
  assert.equal(q("chip-voice-style-opera")!.getAttribute("aria-pressed"),"false");
  await act(async()=>q<HTMLButtonElement>("button-see-more-voice")!.click());assert.ok(q("chip-voice-call-and-response"));
  assert.match(q("fold-vocals")!.textContent!,/not a fixed singer/);
  await h.submit();
  assert.match(sent[0].voice,/Vocal arrangement: Solo female lead\./);assert.match(sent[0].voice,/Vocal character: Gospel lead\./);
 }finally{await h.close();}
});

test("More shows only engine-supported controls; Leave Out and Spark map to negativeStyle and spark; blank Name uses automatic titling",async()=>{
 for(const [engine,spark] of [[ace,true],[eleven,false]] as const){
  const h=await setup();const sent:any[]=[];
  try{
   await act(async()=>h.root.render(<QuickCreate {...base} engine={engine} generateSong={async i=>{sent.push(i);return "s";}}/>));
   h.dom.window.confirm=()=>true;
   await shapeIt(h);
   const more=q("fold-more")!;
   assert.ok(q("input-negative-style"));assert.equal(!!q("input-spark"),spark,engine.engine);
   assert.doesNotMatch(more.textContent!,/Stay True|Hum a Seed/);assert.match(more.textContent!,/6:00/);
   await h.input(q<HTMLTextAreaElement>("input-song-idea")!,"A calm song, in English");
   await h.input(q<HTMLInputElement>("input-negative-style")!,"autotune");
   if(spark)await h.input(q<HTMLInputElement>("input-spark")!,"1.6");
   await h.submit();
   assert.equal(sent[0].negativeStyle,"autotune");
   if(spark)assert.equal(sent[0].spark,1.6);else assert.equal("spark" in sent[0],false);
   assert.equal(sent[0].autoTitle,true);
  }finally{await h.close();}
 }
});

test("Write them for me requests editable lyrics before Begin, confirms replacement and never generates music",async()=>{
 const h=await setup();const sent:any[]=[];const asks:any[]=[];let fail=false;let allow=false;
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async i=>{sent.push(i);return "s";}} writeLyrics={async i=>{asks.push(i);if(fail)throw new Error("Lyric plan unavailable.");return "[Verse]\nMorning finds me\n\n[Chorus]\nWe begin again";}}/>));
  h.dom.window.confirm=()=>allow;
  await shapeIt(h);
  await h.input(q<HTMLTextAreaElement>("input-song-idea")!,"A hopeful song about starting again, in English");
  await h.input(q<HTMLInputElement>("input-styles")!,"Gospel, Soul");
  await h.input(q<HTMLInputElement>("input-sound-instruments")!,"Piano");
  await act(async()=>q<HTMLButtonElement>("button-write-for-me")!.click());
  assert.equal(asks.length,1);assert.match(asks[0].prompt,/Vision: A hopeful song about starting again, in English/);
  assert.match(asks[0].prompt,/Sound and mood: Gospel, Soul/);assert.match(asks[0].prompt,/Instruments: Piano/);
  assert.ok(asks[0].prompt.length>=20,"short visions still reach the real lyric-plan validator");
  assert.equal(asks[0].autoLength,true);assert.ok(asks[0].duration>0&&asks[0].duration<=360);
  assert.match(q<HTMLTextAreaElement>("input-lyrics")!.value,/We begin again/);
  assert.match(q("text-lyric-status")!.textContent!,/Edit them freely/);
  assert.equal(sent.length,0,"no music is generated");
  await h.input(q<HTMLTextAreaElement>("input-lyrics")!,"[Verse]\nMy own line");
  await act(async()=>q<HTMLButtonElement>("button-write-for-me")!.click());
  assert.equal(asks.length,1,"declined replacement does not call the writer");assert.equal(q<HTMLTextAreaElement>("input-lyrics")!.value,"[Verse]\nMy own line");
  allow=true;fail=true;
  await act(async()=>q<HTMLButtonElement>("button-write-for-me")!.click());
  assert.match(q("text-lyric-status")!.textContent!,/could not be written: Lyric plan unavailable/);assert.equal(q<HTMLTextAreaElement>("input-lyrics")!.value,"[Verse]\nMy own line");
  fail=false;
  await act(async()=>q<HTMLButtonElement>("button-write-for-me")!.click());
  assert.match(q<HTMLTextAreaElement>("input-lyrics")!.value,/Morning finds me/);
  await h.submit();
  assert.equal(sent.length,1);assert.match(sent[0].lyrics,/We begin again/);
  await h.input(q<HTMLTextAreaElement>("input-song-idea")!,"A hopeful prayer");
  await h.input(q<HTMLTextAreaElement>("input-lyrics")!,"[Verse]\nيا نور قلبي في صباح الحياة");
  await act(async()=>q<HTMLButtonElement>("button-write-for-me")!.click());
  assert.equal(asks.at(-1).language,"ar","the writer follows the visible singing language inferred from existing words");
 }finally{await h.close();}
});

test("Your Sounds: old prompts, Style DNA and new combos with Leave Out and Spark round-trip without trimming",async()=>{
 const tags=Array.from({length:30},(_,i)=>`Style ${i+1}`);
 const fresh=makeSavedSongPrompt({name:"Desert night",tags,lyrics:"",idea:"",instruments:"Oud, Cello",vocals:"warm",shape:{negativeStyle:"no autotune",spark:0.4,delivery:"Duet",character:"Soul"}},"prompt-new");
 assert.deepEqual(readSavedShape(fresh),{negativeStyle:"no autotune",spark:0.4,delivery:"Duet",character:"Soul"});
 const old:Template={id:"prompt-old",name:"Old prompt",description:"",tags:["Pop"],notes:{lyrics:"[Verse]\nOld words",prompt:"An old idea",vocals:"bright",instruments:"Piano",cover:"",video:"",promotion:""}};
 const dna=makeSavedSongPrompt({name:"Map",tags:["House"],lyrics:"",idea:"",instruments:"Synth bass",vocals:"airy",styleDNA:{...defaultSongMap,genres:["House"],instruments:"Synth bass",vocals:"airy"},shape:{spark:1.2}},"prompt-dna");
 assert.ok(readStyleDNA(dna),"Style DNA stays readable with Shape extras");
 const h=await setup();const sent:any[]=[];
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async i=>{sent.push(i);return "s";}} savedPrompts={[fresh,old,dna]} savePrompt={async()=>undefined}/>));
  h.dom.window.confirm=()=>true;
  await shapeIt(h);
  await h.input(q<HTMLTextAreaElement>("input-song-idea")!,"Keep my vision, in English");
  await act(async()=>q<HTMLButtonElement>("button-use-saved-prompt-prompt-new")!.click());
  await act(async()=>{for(const d of document.querySelectorAll("details"))(d as HTMLDetailsElement).open=true;});
  assert.equal(q<HTMLTextAreaElement>("input-song-idea")!.value,"Keep my vision, in English","a sound without words keeps current words");
  assert.equal(q<HTMLInputElement>("input-styles")!.value.split(", ").length,30,"all 30 stored picks restored");
  assert.equal(q<HTMLInputElement>("input-negative-style")!.value,"no autotune");
  assert.equal(q("chip-voice-duet")!.getAttribute("aria-pressed"),"true");
  await h.submit();
  assert.equal(sent[0].spark,0.4);assert.equal(sent[0].negativeStyle,"no autotune");assert.equal(sent[0].genres.split(", ").length,20);
  await act(async()=>q<HTMLButtonElement>("button-use-saved-prompt-prompt-old")!.click());
  assert.equal(q<HTMLTextAreaElement>("input-song-idea")!.value,"An old idea");assert.match(q<HTMLTextAreaElement>("input-lyrics")!.value,/Old words/);
  assert.equal(q<HTMLInputElement>("input-styles")!.value,"Pop");
  await act(async()=>q<HTMLButtonElement>("button-use-saved-prompt-prompt-dna")!.click());
  assert.equal(q<HTMLInputElement>("input-styles")!.value,"House");assert.match(q<HTMLTextAreaElement>("input-lyrics")!.value,/Old words/,"Style DNA keeps words");
 }finally{await h.close();}
});

test("two takes default on: ACE-Step makes one request for two takes without a cost dialog; ElevenLabs keeps double-cost consent",async()=>{
 const songs=["take-1","take-2"].map((id,i)=>({...freshSong(id,`Take ${i+1}`,i),audioFormat:"mp3" as const}));
 {
  const h=await setup();const sent:any[]=[];let asked=0;const kept:string[]=[];
  try{
   await act(async()=>h.root.render(<QuickCreate {...base} drafts={songs} engine={ace} favoriteTake={async id=>{kept.push(id);}} generateSong={async i=>{sent.push(i);return {songId:"take-1",songIds:["take-1","take-2"]};}}/>));
   h.dom.window.confirm=()=>{asked++;return true;};
   await h.input(q<HTMLTextAreaElement>("input-song-description")!,"A bright song, in English");
   await h.submit();
   assert.equal(asked,0);assert.equal(sent.length,1);assert.equal(sent[0].versions,2);
   const takes=document.querySelector('[aria-label="Compare your takes"]')!;assert.equal(takes.querySelectorAll("article").length,2);
   await act(async()=>q<HTMLButtonElement>("button-favorite-take-take-2")!.click());assert.deepEqual(kept,["take-2"]);
   await shapeIt(h);assert.equal(q<HTMLInputElement>("checkbox-make-two-versions")!.checked,true);
   await act(async()=>q<HTMLInputElement>("checkbox-make-two-versions")!.click());
   await h.submit();assert.equal(sent[1].versions,1);
  }finally{await h.close();}
 }
 {
  const h=await setup();const sent:any[]=[];let allow=false;
  try{
   await act(async()=>h.root.render(<QuickCreate {...base} drafts={songs} engine={eleven} generateSong={async i=>{sent.push(i);return `take-${sent.length}`;}}/>));
   h.dom.window.confirm=()=>allow;
   await h.input(q<HTMLTextAreaElement>("input-song-description")!,"A bright song, in English");
   await h.submit();assert.equal(sent.length,0,"declined consent sends nothing");
   allow=true;await h.submit();
   assert.equal(sent.length,2);assert.equal("versions" in sent[0],false);assert.equal(sent[1].projectId,"take-1");assert.match(sent[1].title,/Version 2$/);
  }finally{await h.close();}
 }
});

test("Save this prompt saves the vision (typed or app-written) and lyrics into Your Sounds with one tap",async()=>{
 const h=await setup();const saved:PromptDraft[]=[];
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async()=>"s"} savedPrompts={[]} savePrompt={async d=>{saved.push(d);return makeSavedSongPrompt(d,"p"+saved.length);}}/>));
  const vision="Uplifting Afrobeats-soul song about unity, 100 BPM, warm log drums, gospel choir on the chorus";
  await h.input(q<HTMLTextAreaElement>("input-song-description")!,vision);
  await act(async()=>q<HTMLButtonElement>("button-save-vision")!.click());
  assert.ok(q("save-name-box"),"asks for a name first");
  await act(async()=>q<HTMLButtonElement>("button-save-name")!.click());
  assert.equal(saved.length,1);assert.equal(saved[0].idea,vision);assert.equal(saved[0].name,vision.slice(0,72));
  assert.match(document.body.textContent!,/Saved as “Uplifting Afrobeats-soul/);
  await shapeIt(h);
  assert.equal(q<HTMLTextAreaElement>("input-song-idea")!.rows,4);
  await act(async()=>q<HTMLButtonElement>("button-save-vision")!.click());
  assert.ok(q("save-name-box"),"asks for a name first");
  await act(async()=>q<HTMLButtonElement>("button-save-name")!.click());
  assert.equal(saved.length,2);assert.equal(saved[1].idea,vision);
  await h.input(q<HTMLTextAreaElement>("input-lyrics")!,"[Verse]\nWe rise as one");
  await act(async()=>q<HTMLButtonElement>("button-save-lyrics")!.click());
  assert.ok(q("save-name-box"),"asks for a name first");
  await act(async()=>q<HTMLButtonElement>("button-save-name")!.click());
  assert.equal(saved.length,3);assert.equal(saved[2].lyrics,"[Verse]\nWe rise as one");assert.equal(saved[2].idea,vision);assert.match(saved[2].name,/^Lyrics · /);
 }finally{await h.close();}
});

test("a failed prompt save says so and keeps the words",async()=>{
 const h=await setup();
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async()=>"s"} savedPrompts={[]} savePrompt={async()=>undefined}/>));
  await h.input(q<HTMLTextAreaElement>("input-song-description")!,"A calm gospel song");
  await act(async()=>q<HTMLButtonElement>("button-save-vision")!.click());
  assert.ok(q("save-name-box"),"asks for a name first");
  await act(async()=>q<HTMLButtonElement>("button-save-name")!.click());
  assert.match(document.body.textContent!,/Couldn't save just now/);
  assert.equal(q<HTMLTextAreaElement>("input-song-description")!.value,"A calm gospel song");
 }finally{await h.close();}
});

test("Auto singer: hip hop and R&B get a Black American MC or soul lead, and the description's male/female always wins",async()=>{
 for(const [vision,expect] of [
  ["A hip hop track about rising above the noise",/Black American male hip-hop MC/],
  ["A smooth R&B love song for a rainy night",/Black American female R&B lead/],
  ["An R&B slow jam with a male voice",/Black American male R&B lead/],
  ["A hip hop anthem with a female rapper",/Black American female hip-hop MC/],
  ["A gentle folk song about the sea",/warm male country storyteller/],
  ["A jazz ballad about the moon",/Smooth, expressive singing/],
 ] as const){
  const h=await setup();const sent:any[]=[];
  try{
   await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async i=>{sent.push(i);return "s";}}/>));
   await h.input(q<HTMLTextAreaElement>("input-song-description")!,vision);
   await h.submit();
   assert.equal(sent.length,1,vision);
   assert.match(sent[0].voice,expect,vision);
   assert.equal(q("singer-choice"),null,"Just Begin stays simple: no singer cards");
  }finally{await h.close();}
 }
});

test("Shape it: pick any AI singer from the library; a pick that contradicts the description is flagged before anything is made",async()=>{
 const h=await setup();const sent:any[]=[];
 try{
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async i=>{sent.push(i);return "s";}}/>));
  await shapeIt(h);
  await h.input(q<HTMLTextAreaElement>("input-song-idea")!,"A hip hop track about my city");
  assert.match(q("singer-auto")!.textContent!,/Fits your song: Hip-hop MC · male/);
  assert.ok(document.querySelectorAll('[data-testid^="singer-"]').length>=13,"Auto + 12 singers");
  await act(async()=>q<HTMLButtonElement>("singer-hiphop-female")!.click());
  assert.equal(q("singer-hiphop-female")!.getAttribute("aria-checked"),"true");
  await h.submit();
  assert.match(sent[0].voice,/Black American female hip-hop MC/);
  await h.input(q<HTMLTextAreaElement>("input-song-idea")!,"A hip hop track with a male voice");
  assert.match(document.body.textContent!,/You picked “Hip-hop MC · female”, but your description asks for a solo male lead/);
 }finally{await h.close();}
});

test("Just Begin: name it before saving, then bring it back from My saved prompts without leaving Just Begin",async()=>{
 const h=await setup();const saved:any[]=[];
 try{
  const {makeSavedSongPrompt:make}=await import("../app/saved-song-prompts");
  const older=Array.from({length:6},(_,i)=>make({name:`Old ${i+1}`,tags:["Soul"],lyrics:"",idea:`old idea ${i+1}`,instruments:"",vocals:""},`old-${i+1}`));
  const desert=make({name:"Desert Love Song",tags:["Afrobeats","Soul"],lyrics:"",idea:"A desert love story at night",instruments:"oud, hand drums",vocals:"",shape:{team:"duet-mf",purpose:"youtube"}},"desert");
  const library=[desert,...older];
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async()=>"s"} savedPrompts={library} savePrompt={async d=>{saved.push(d);return make(d,"p"+saved.length);}}/>));
  // The row shows the newest five and See all
  const row=q("saved-prompt-row")!;
  assert.equal(row.querySelectorAll(".saved-row-chip").length,5);
  await act(async()=>q<HTMLButtonElement>("button-saved-row-all")!.click());
  assert.equal(row.querySelectorAll(".saved-row-chip").length,7);
  await h.input(q<HTMLInputElement>("input-saved-row-search")!,"desert");
  assert.equal(row.querySelectorAll(".saved-row-chip").length,1);
  // Tap it: words, styles, who sings and the video shape come back, still in Just Begin
  await act(async()=>q<HTMLButtonElement>("saved-row-desert")!.click());
  assert.ok(q("panel-just-begin"),"stays in Just Begin");
  assert.equal(q<HTMLTextAreaElement>("input-song-description")!.value,"A desert love story at night");
  assert.equal(q("team-duet-mf")!.getAttribute("aria-checked"),"true");
  assert.equal(q("cvb-purpose-youtube")!.getAttribute("aria-checked"),"true");
  // Name it: filled in from the words, and you can change it
  await act(async()=>q<HTMLButtonElement>("button-save-vision")!.click());
  assert.equal(q<HTMLInputElement>("input-save-name")!.value,"A desert love story at night");
  await h.input(q<HTMLInputElement>("input-save-name")!,"Desert Love Song 2");
  await act(async()=>q<HTMLButtonElement>("button-save-name")!.click());
  assert.equal(saved[0].name,"Desert Love Song 2");
  assert.equal(saved[0].shape.team,"duet-mf");assert.equal(saved[0].shape.purpose,"youtube");
  assert.match(document.body.textContent!,/Saved as “Desert Love Song 2” ✓/);
  assert.equal(q("save-name-box"),null);
  // Enter in the name box saves the name and never starts a song
  let made=0;
  await act(async()=>h.root.render(<QuickCreate {...base} engine={ace} generateSong={async()=>{made++;return "s";}} savedPrompts={library} savePrompt={async d=>{saved.push(d);return make(d,"p"+saved.length);}}/>));
  await act(async()=>q<HTMLButtonElement>("button-save-vision")!.click());
  await act(async()=>q<HTMLInputElement>("input-save-name")!.dispatchEvent(new h.dom.window.KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true})));
  assert.equal(saved.length,2);assert.equal(made,0,"Enter saved the name only");
  // Cancel keeps nothing
  await act(async()=>q<HTMLButtonElement>("button-save-vision")!.click());
  await act(async()=>q<HTMLButtonElement>("button-cancel-name")!.click());
  assert.equal(saved.length,2);
 }finally{await h.close();}
});

test("Song + video in one go: tick the box, Begin, and the finished song opens its video in the chosen shape, once",async()=>{
 const h=await setup();
 try{
  const videos:{id:string;purpose?:string}[]=[];
  const finished={...freshSong("new-song","Ocean Heart",0),audioId:"a1",audioFormat:"mp3" as const};
  const view=(drafts:any[])=><QuickCreate {...base} drafts={drafts} engine={ace} generateSong={async()=>"new-song"} makeVideo={async(song,_short,visual)=>{videos.push({id:song.id,purpose:visual?.purpose});}}/>;
  await act(async()=>h.root.render(view([])));
  assert.equal(q<HTMLInputElement>("checkbox-auto-video")!.checked,false,"off until you tick it");
  await act(async()=>q<HTMLButtonElement>("cvb-purpose-youtube")!.click());
  assert.match(q("label-auto-video")!.textContent!,/Then make my YouTube video/);
  await act(async()=>q<HTMLInputElement>("checkbox-auto-video")!.click());
  assert.equal(window.localStorage.getItem("versual-auto-video"),"on","remembered");
  await h.input(q<HTMLTextAreaElement>("input-song-description")!,"A love song about the ocean");
  await h.submit();
  assert.equal(videos.length,0,"waits for the song");
  await act(async()=>h.root.render(view([{...finished,audioFormat:undefined}])));
  assert.equal(videos.length,0,"still being made");
  await act(async()=>h.root.render(view([finished])));
  for(let i=0;i<4;i++)await act(async()=>{await new Promise(r=>setTimeout(r,0));});
  assert.deepEqual(videos,[{id:"new-song",purpose:"youtube"}]);
  await act(async()=>h.root.render(view([{...finished,name:"Ocean Heart (edited)"}])));
  assert.equal(videos.length,1,"only once per song");
 }finally{await h.close();}
});

test("Song + video: an older finished song never opens a video just because the box is ticked",async()=>{
 const h=await setup();
 try{
  let opened=0;
  const old={...freshSong("old","Old song",0),audioId:"a",audioFormat:"mp3" as const};
  await act(async()=>h.root.render(<QuickCreate {...base} drafts={[old]} engine={ace} generateSong={async()=>"old"} makeVideo={async()=>{opened++;}}/>));
  await act(async()=>q<HTMLInputElement>("checkbox-auto-video")!.click());
  for(let i=0;i<4;i++)await act(async()=>{await new Promise(r=>setTimeout(r,0));});
  assert.equal(opened,0);
 }finally{await h.close();}
});
