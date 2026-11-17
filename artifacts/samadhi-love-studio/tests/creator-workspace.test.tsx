import test from "node:test";import assert from "node:assert/strict";import React,{act,useState} from "react";import {JSDOM} from "jsdom";
import {creatorVideoLooks,applyCreatorVideoLook,applySocialVideoPreset,shortClipRange,suggestedHookStart} from "../app/creator-video-presets";
import {CreatorLookBrowser,SocialVideoTools} from "../app/creator-video-tools";
import {creatorInstruments,worldFusionRecipes} from "../app/creator-music-options";
import {isLyricProject,type LyricProject} from "../app/lyric-video-data";
import {newProSettings,clipCues} from "../app/lyric-pro-data";import {freshSong} from "../app/studio-data";import {QuickCreate} from "../app/quick-create";
const song={...freshSong("song","World original",0),audioId:"original",audioFormat:"mp3" as const};
function project():LyricProject{return{theme:"cosmic",format:"wide",motion:"drift",cues:[{time:122,end:128,text:"نور Love",words:[{offset:3,time:122},{offset:8,time:124}]}],pro:{...newProSettings(song,360),approvedLyrics:"نور Love",sections:[{id:"chorus",name:"Chorus",time:120,end:160,language:"ara",singer:"A"}],background:"saved-image",alignment:{engine:"fixture",at:"test",audioId:"original",reviewed:true,warnings:[]}}};}
test("26 complete looks are valid and preserve approved multilingual lyrics, sections, source, range and alignment",()=>{
 const source=project(),before=structuredClone(source);assert.equal(creatorVideoLooks.length,26);assert.equal(new Set(creatorVideoLooks.map(l=>l.id)).size,26);
 for(const look of creatorVideoLooks){const next=applyCreatorVideoLook(source,look.id);assert(isLyricProject(JSON.parse(JSON.stringify(next))),look.id);assert.deepEqual(next.cues,source.cues);assert.equal(next.pro!.sourceAudioId,source.pro!.sourceAudioId);assert.equal(next.pro!.approvedLyrics,source.pro!.approvedLyrics);assert.deepEqual(next.pro!.range,source.pro!.range);assert.deepEqual(next.pro!.alignment,source.pro!.alignment);assert.equal(next.pro!.sections[0].language,'ara');assert.equal(next.pro!.sections[0].singer,'A');assert.equal(next.pro!.background,undefined);}
 assert.deepEqual(source,before);
});
test("short ranges clamp one shared origin, including end-of-song clips, short files, invalid input and word timestamp shifts",()=>{
 assert.deepEqual(shortClipRange(360,350,60),{start:300,end:360});assert.deepEqual(shortClipRange(9,5,30),{start:0,end:9});assert.deepEqual(shortClipRange(360,-10,15),{start:0,end:15});assert.throws(()=>shortClipRange(NaN,0,30));assert.throws(()=>shortClipRange(360,0,0));
 const original=project();assert.equal(suggestedHookStart(original),120);const short=applySocialVideoPreset(original,'reels',120,30);assert.deepEqual(short.pro!.range,{start:120,end:150});assert.equal(short.format,'vertical');assert(short.pro!.formatLooks!.vertical!.safe);assert.deepEqual(short.cues,original.cues);const captions=clipCues(short.cues,short.pro!.range.start,short.pro!.range.end);assert.equal(captions[0].time,2);assert.equal(captions[0].words![1].time,4);
 const full=applySocialVideoPreset(short,'youtube',350);assert.equal(full.format,'wide');assert.deepEqual(full.pro!.range,{start:0,end:360});assert.equal(original.format,'wide');
});
async function setup(){const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});const{createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('root')!);const button=(name:string)=>[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===name)!;const input=async(el:HTMLInputElement|HTMLTextAreaElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value')!.set!.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});const select=async(el:HTMLSelectElement,value:string)=>act(async()=>{el.value=value;el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});return{dom,root,button,input,select,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};}
test("connection failures show the actual permission error and refresh never generates music",async()=>{
 const h=await setup();let refreshes=0,generations=0;
 const props={connected:false,saving:false,drafts:[],settings:()=>{},guided:()=>{},openDrafts:()=>{},generateSong:async()=>{generations++;return undefined;},saveSketch:async()=>undefined,refreshConnection:()=>{refreshes++;},connectionError:"The key lacks User read. (HTTP 401)"};
 try{
  await act(async()=>h.root.render(<QuickCreate {...props}/>));
  assert.match(document.querySelector('[data-testid="status-provider"]')!.textContent!,/key lacks User read/);
  await act(async()=>h.button('Refresh connection').click());
  assert.equal(refreshes,1);assert.equal(generations,0);
  await act(async()=>h.root.render(<QuickCreate {...props} connectionError={undefined} connectionChecking/>));
  assert.match(document.querySelector('[data-testid="status-provider"]')!.textContent!,/Checking music account/);
  assert.equal(h.button('Refresh connection').disabled,true);
 }finally{await h.close();}
});
test("a rejected song submission displays its exact error and keeps the written prompt",async()=>{
 const h=await setup();let calls=0;
 const description="A short hopeful English pop song about a fresh start.";
 try{
  await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>{calls++;throw new Error("Fixture: the generation response was interrupted. Check your existing draft.");}} saveSketch={async()=>undefined}/>));
  const prompt=document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"]')!;
  await h.input(prompt,description);
  const language=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==="auto")&&[...s.options].some(o=>/^English\b/.test(o.textContent??"")))!;
  assert(language);
  await h.select(language,[...language.options].find(o=>/^English\b/.test(o.textContent??""))!.value);
  await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(calls,1);
  assert.match(document.body.textContent!,/Fixture: the generation response was interrupted/);
  assert.equal(prompt.value,description);
  assert(!document.body.textContent!.includes("This take was not confirmed."));
 }finally{await h.close();}
});
test("Simple recognizes the requested language and singer, exposes alternatives and blocks contradictions",async()=>{
 const h=await setup();const submitted:any[]=[];
 try{
  await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{submitted.push(input);return "fixture-song";}} saveSketch={async()=>undefined}/>));
  const prompt=document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"]')!;
  await h.input(prompt,"A warm acoustic song; sing in Spanish with a female lead.");
  const summary=()=>document.querySelector('[data-testid="text-understood-prompt"]')!.textContent!;
  assert.match(summary(),/Spanish/);assert.match(summary(),/Solo female lead/);
  const submit=async()=>act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));
  await submit();
  assert.equal(submitted.length,1);
  assert.match(submitted[0].voice,/Solo female lead/);
  assert.equal(submitted[0].language,"auto");
  assert.equal(submitted[0].prompt,prompt.value);
  const voices=document.querySelector('[data-testid="select-singing-arrangement"]') as unknown as HTMLSelectElement;
  assert.equal(voices.options.length,6);
  await h.select(voices,"Solo male lead");
  assert.match(summary(),/conflicts with the description/);
  await submit();assert.equal(submitted.length,1);
  await h.input(prompt,"A warm acoustic song; sing in Spanish with a deep male lead.");
  await submit();assert.equal(submitted.length,2);
  assert.match(submitted[1].voice,/Solo male lead/);
  assert.equal(prompt.value,"A warm acoustic song; sing in Spanish with a deep male lead.");
 }finally{await h.close();}
});
test("look collections filter and social cards apply editable clip length and platform without changing source timing",async()=>{
 const h=await setup();let latest=project(),platform='';function Screen(){const[value,setValue]=useState(project());return <><CreatorLookBrowser project={value} change={p=>{latest=p;setValue(p);}}/><SocialVideoTools project={value} change={p=>{latest=p;setValue(p);}} time={355} choosePlatform={p=>{platform=p;}}/></>;}
 try{await act(async()=>h.root.render(<Screen/>));assert.equal(document.querySelectorAll('.creator-look-cards button').length,26);await h.select(document.querySelector('.creator-browser-filters select') as unknown as HTMLSelectElement,'World Fusion');assert.equal(document.querySelectorAll('.creator-look-cards button').length,4);await act(async()=>document.querySelector<HTMLButtonElement>('.creator-look-cards button')!.click());assert.equal(latest.theme,'desert');
 const controls=document.querySelector('.creator-social-tools')!;await h.select(controls.querySelectorAll('select')[0],'15');await h.select(controls.querySelectorAll('select')[1],'playhead');await act(async()=>[...controls.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.querySelector('strong')?.textContent==='Reels')!.click());assert.equal(platform,'instagram');assert.equal(latest.format,'vertical');assert.deepEqual(latest.pro!.range,{start:345,end:360});assert.deepEqual(latest.cues,project().cues);
 }finally{await h.close();}
});
test("world starters and simple vocal/lyric controls reach the real generation callback and result actions",async()=>{
 const h=await setup();let payload:any,videoSong='',short=false,publish='';assert.equal(worldFusionRecipes.length,12);assert.equal(Object.values(creatorInstruments).flat().length,48);
  try{
   const saved={...song,id:'created'};
   await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[saved]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{payload=input;return saved.id;}} saveSketch={async()=>undefined} makeVideo={(s,isShort)=>{videoSong=s.id;short=!!isShort;}} publish={s=>{publish=s.id;}}/>));
   await act(async()=>h.button('Custom').click());
   await act(async()=>h.button('Dabke × House').click());
   const language=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==="mixed"))!;
   await h.select(language,"mixed");
   const dialect=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==="ar-LB"))!;
   await h.select(dialect,"ar-LB");
   await h.select(document.querySelector('[data-testid="select-singing-arrangement"]') as unknown as HTMLSelectElement,"Duet");
   const words='[Chorus]\nنور وحب Love and light';
   await h.input(document.querySelector<HTMLTextAreaElement>('[data-testid="input-lyrics"]')!,words);
   await act(async()=>h.button('Simple').click());
   assert(document.querySelector('[data-testid="text-custom-kept"]'));
   await act(async()=>h.button('Custom').click());
   assert.equal(document.querySelector<HTMLTextAreaElement>('[data-testid="input-lyrics"]')!.value,words);
   await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));
   assert.match(payload.prompt,/Lebanese Dabke, Melodic House/);assert.match(payload.prompt,/Oud, Darbuka, Piano/);
   assert.match(payload.voice,/Duet/);assert.equal(payload.language,"mixed");assert.equal(payload.dialect,"ar-LB");assert.equal(payload.lyrics,words);
   await act(async()=>h.button('Make social short').click());assert.equal(videoSong,'created');assert(short);
   await act(async()=>h.button('Publish & share').click());assert.equal(publish,'created');
 }finally{await h.close();}
});

test("saved prompts retain lyrics and instrument directions and can be loaded and saved in the same creator",async()=>{
 const {makeSavedSongPrompt,savedPromptFromSong}=await import('../app/saved-song-prompts');const source={...song,tags:['Jazz'],notes:{...song.notes,lyrics:'[Chorus]\nنور الحب\nنور الحب',prompt:'A gentle world jazz song',instruments:'Oud, Piano',vocals:'Warm Lebanese Arabic duet'}};
 const preset=makeSavedSongPrompt(savedPromptFromSong(source),'prompt-private'),before=structuredClone(preset);const h=await setup();let saved:any;
  try{await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>undefined} saveSketch={async()=>undefined} savedPrompts={[preset]} savePrompt={async input=>{saved=input;return preset;}}/>));await act(async()=>h.button('Custom').click());const select=document.querySelector('[data-testid="select-saved-prompt"]') as unknown as HTMLSelectElement;await h.select(select,preset.id);assert.equal(document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-idea"]')!.value,source.notes.prompt);assert(document.body.textContent!.includes('نور الحب'));await act(async()=>h.button('Save prompt').click());assert.equal(saved.lyrics,source.notes.lyrics);assert.equal(saved.instruments,'Oud, Piano');assert.equal(saved.vocals,'Warm Lebanese Arabic duet');assert.deepEqual(saved.tags,['Jazz']);assert.deepEqual(preset,before);}finally{await h.close();}
});
test("title suggestions preserve original lyrics, cover designs support Unicode and vocal matching follows musical direction",async()=>{
 const {titlesFromLyrics,coverStyleForTitle,drawSongCover,coverStyles}=await import('../app/song-cover');const {matchVocalToSong}=await import('../app/vocal-matching');const lyrics='[Verse]\nWalking home\n[Chorus]\nنور الحب\nنور الحب';assert.equal(titlesFromLyrics(lyrics)[0],'نور الحب');assert.equal(coverStyleForTitle('Cosmic Moon'),'cosmic');assert.equal(Object.keys(coverStyles).length,8);const texts:string[]=[];const ctx:any={canvas:{width:1600,height:1600},createLinearGradient:()=>({addColorStop(){}}),fillRect(){},beginPath(){},arc(){},stroke(){},fill(){},measureText:(s:string)=>({width:s.length*45}),fillText:(s:string)=>texts.push(s)};drawSongCover(ctx,'نور الحب','Artist','gold');assert.equal(ctx.direction,'rtl');assert(texts.includes('نور الحب'));assert.match(matchVocalToSong('An intimate song','R&B','Piano'),/soulful/);assert.match(matchVocalToSong('A dance anthem','Trance','Synths'),/dance groove/);assert.match(matchVocalToSong('A Lebanese story','Dabke','Oud'),/world-music blend/);
});
test("connected instrumentals use the real generation handoff while new disconnected sessions require an explicit sketch choice",async()=>{
 const h=await setup();let payload:any,sketches=0;
 const props={saving:false,drafts:[],settings(){},guided(){},openDrafts(){},generateSong:async(input:any)=>{payload=input;return undefined;},saveSketch:async()=>{sketches++;return undefined;}};
  try{await act(async()=>h.root.render(<QuickCreate {...props} connected/>));await act(async()=>h.button('Custom').click());await act(async()=>h.button('Dabke × House').click());await act(async()=>document.querySelector<HTMLInputElement>('[data-testid="checkbox-instrumental"]')!.click());await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(payload.instrumental,true);assert.equal(payload.voice,'');assert.equal(payload.lyrics,'');assert.match(payload.instruments,/Oud/);assert.equal(sketches,0);
  await act(async()=>h.root.render(<QuickCreate {...props} key="disconnected" connected={false}/>));assert.equal(document.querySelector<HTMLInputElement>('[data-testid="checkbox-instrumental"]')!.checked,false);await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.match(document.querySelector('[data-testid="text-create-error"]')!.textContent!,/connected music account/);assert.equal(sketches,0);
 }finally{await h.close();}
});

test("Jesus and Mother Mary complete looks activate existing artwork without losing ad photos",()=>{for(const id of ["jesus-light","mary-grace"]){const source=project();source.pro!.adPhotoStory={photos:[{asset:"saved-photo",name:"Product"}],motion:"zoom",fit:"contain",transition:"dissolve",prompt:""};const next=applyCreatorVideoLook(source,id);assert.equal(next.theme,id==="jesus-light"?"jesus":"mary");assert.equal(next.pro!.useTemplateBackground,true);assert.deepEqual(next.pro!.adPhotoStory,source.pro!.adPhotoStory);assert.deepEqual(next.cues,source.cues);}});
