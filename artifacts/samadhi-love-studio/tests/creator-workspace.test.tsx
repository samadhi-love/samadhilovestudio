import test from "node:test";import assert from "node:assert/strict";import React,{act,useState} from "react";import {JSDOM} from "jsdom";
import {creatorVideoLooks,applyCreatorVideoLook,applySocialVideoPreset,shortClipRange,suggestedHookStart} from "../app/creator-video-presets";
import {CreatorLookBrowser,SocialVideoTools} from "../app/creator-video-tools";
import {creatorInstruments,worldFusionRecipes} from "../app/creator-music-options";
import {isLyricProject,type LyricProject} from "../app/lyric-video-data";
import {newProSettings,clipCues} from "../app/lyric-pro-data";import {freshSong} from "../app/studio-data";import {QuickCreate} from "../app/quick-create";
import {bestShortStart,expandSongDescription,insertLyricSection} from "../app/creation-shortcuts";
import {SongCard,SongHubProvider,type SongAction,type SongHub} from "../app/song-card";
import {MelodyReferenceRecorder,formatMelodyTimer,melodyReferenceLimitSeconds} from "../app/melody-reference-recorder";
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
test("local song-description help, lyric section insertion and short selection work without provider calls",()=>{
 const description=expandSongDescription("A hopeful song about a fresh start. Sing in English.");
 assert.match(description,/fresh start/i);assert.match(description,/English/);assert.match(description,/coherent, singable lyrics/);
 const inserted=insertLyricSection("First line",5,5,"Verse");assert.equal(inserted.text,"First\n\n[Verse]\n\n line");assert.equal(inserted.cursor,"First\n\n[Verse]\n".length);
 assert.equal(bestShortStart(60,[{name:"Chorus",time:22,end:38}],[],30),22);
 const energy=Array.from({length:60},(_,index)=>index>=30&&index<45?.95:.1);assert.equal(bestShortStart(60,[],energy,15),30);
});
test("Create help is local, lyric chips insert at the cursor, and two versions require clear cost consent",async()=>{
 const h=await setup();let requests:any[]=[];let allowTwo=false;
 h.dom.window.confirm=()=>allowTwo;
 try{
  await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{requests.push(input);return `version-${requests.length}`;}} saveSketch={async()=>undefined} simpleExperience/>));
  const idea=document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"]')!;
  await h.input(idea,"A hopeful pop song about starting again. Sing in English.");
  await act(async()=>h.button("Help me describe it").click());
  assert.match(idea.value,/coherent, singable lyrics/);assert.equal(requests.length,0);
  const versions=document.querySelector<HTMLInputElement>('[data-testid="checkbox-make-two-versions"]')!;
  assert.equal(versions.checked,false);assert.match(document.querySelector('[data-testid="text-version-cost"]')!.textContent!,/one music request/);
  await act(async()=>versions.click());assert.match(document.querySelector('[data-testid="text-version-cost"]')!.textContent!,/2×/);
  await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(requests.length,0);
  allowTwo=true;
  await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(requests.length,2);assert.equal(requests[1].projectId,"version-1");assert.equal(requests[1].title.endsWith("Version 2"),true);
 }finally{await h.close();}
});
test("lyrics chips appear in Custom mode and insert a part at the cursor",async()=>{
 const h=await setup();
 try{
  await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>undefined} saveSketch={async()=>undefined} simpleExperience/>));
  await act(async()=>h.button("Custom").click());
  const lyrics=document.querySelector<HTMLTextAreaElement>('[data-testid="input-lyrics"]')!;
  await h.input(lyrics,"First line");
  lyrics.setSelectionRange(5,5);
  await act(async()=>h.button("[Verse]").click());
  assert.equal(lyrics.value,"First\n\n[Verse]\n\n line");
 }finally{await h.close();}
});
test("My Songs exposes non-destructive next steps and plays a private melody reference",async()=>{
 const h=await setup(),actions:SongAction[]=[];
 const value:SongHub={busy:false,simple:true,folders:[],stemsConnected:false,preview:"",setPreview(){},expanded:"song-next",setExpanded(){},save:async()=>true,action:action=>actions.push(action),archive:async()=>true,duplicate:async()=>true,publish:async()=>{},playlist:async()=>true};
 const saved={...freshSong("song-next","A saved song",0),audioId:"audio-original",audioFormat:"mp3" as const,melodyReference:{assetId:"asset-reference",contentType:"audio/webm",durationSeconds:12,savedAt:"2026-01-01T00:00:00.000Z"},melodyReferences:[{assetId:"asset-reference-2",contentType:"audio/webm",durationSeconds:120,savedAt:"2026-01-01T00:00:00.000Z"},{assetId:"asset-reference-3",contentType:"audio/webm",durationSeconds:300,savedAt:"2026-01-01T00:00:00.000Z"}]};
 try{
  await act(async()=>h.root.render(<SongHubProvider value={value}><SongCard song={saved}/></SongHubProvider>));
  for(const label of ["Make it longer","Redo a part","Make another like this","Make a Short"])await act(async()=>h.button(label).click());
  assert.deepEqual(actions,["extend","redo-part","make-like-this","short-video"]);
  const audio=document.querySelector<HTMLAudioElement>('[data-testid="melody-reference-player"]')!;
  assert.match(audio.src,/song=song-next.*asset=asset-reference/);
  assert.equal(document.querySelectorAll('[data-testid="melody-reference-player"]').length,3);
 }finally{await h.close();}
});
test("the short-start slider moves only the excerpt and keeps caption cues",async()=>{
 const h=await setup();let current=project();
 function Screen(){const[value,setValue]=useState(current);return <SocialVideoTools project={value} change={next=>{current=next;setValue(next);}} time={0}/>;}
 try{
  await act(async()=>h.root.render(<Screen/>));
  await act(async()=>h.button("Use selected clip").click());
  const slider=document.querySelector<HTMLInputElement>('[aria-label="Move the short start point"]')!;
  await h.input(slider,"200");
  assert.equal(current.pro!.range.start,200);assert.equal(current.pro!.range.end,230);assert.deepEqual(current.cues,project().cues);
 }finally{await h.close();}
});
test("the Create melody recorder explains its private reference limits without an available microphone",async()=>{
 const h=await setup();
 try{
  await act(async()=>h.root.render(<MelodyReferenceRecorder takes={[]} onTake={()=>{throw new Error("No microphone should be called by this test");}} onRemove={()=>{}}/>));
  assert.match(document.body.textContent!,/not sent to ElevenLabs/);assert.match(document.body.textContent!,/5 minutes/);
  assert.equal(h.button("Record a melody idea").disabled,true);
  assert.match(document.body.textContent!,/not available in this browser/i);
  assert.equal(formatMelodyTimer(0),"00:00");assert.equal(formatMelodyTimer(125),"02:05");assert.equal(formatMelodyTimer(melodyReferenceLimitSeconds),"05:00");assert.equal(formatMelodyTimer(999),"05:00");
 }finally{await h.close();}
});
test("the melody recorder shows a running five-minute timer and keeps several takes",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
 const oldNavigator=Object.getOwnPropertyDescriptor(globalThis,"navigator"),oldRecorder=Object.getOwnPropertyDescriptor(globalThis,"MediaRecorder");
 let stoppedTracks=0;
 const stream={getTracks:()=>[{stop:()=>{stoppedTracks++;}}]};
 Object.defineProperty(dom.window.navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>stream}});
 Object.defineProperty(globalThis,"navigator",{configurable:true,value:dom.window.navigator});
 class MockRecorder{
  static isTypeSupported(){return true;}
  mimeType="audio/webm";state:"inactive"|"recording"="inactive";ondataavailable?:(event:{data:Blob})=>void;onstop?:()=>void;onerror?:()=>void;
  constructor(_stream:unknown,_options?:unknown){}
  start(){this.state="recording";}
  stop(){if(this.state!=="recording")return;this.state="inactive";this.ondataavailable?.({data:new Blob(["take"],{type:this.mimeType})});this.onstop?.();}
 }
 Object.defineProperty(globalThis,"MediaRecorder",{configurable:true,value:MockRecorder});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 let captures=0;
 function Screen(){const[takes,setTakes]=useState<{id:string;blob:Blob;durationSeconds:number}[]>([]);return <MelodyReferenceRecorder takes={takes} onTake={(blob,durationSeconds)=>{captures++;setTakes(current=>[...current,{id:`take-${captures}`,blob,durationSeconds}]);}} onRemove={id=>setTakes(current=>current.filter(take=>take.id!==id))}/>;}
 const button=(label:string)=>[...document.querySelectorAll<HTMLButtonElement>("button")].find(item=>item.textContent?.trim()===label)!;
 const wait=async(done:()=>boolean)=>{for(let i=0;i<100&&!done();i++)await act(async()=>{await new Promise(resolve=>setTimeout(resolve,20));});assert.ok(done());};
 try{
  await act(async()=>root.render(<Screen/>));
  await act(async()=>{button("Record a melody idea").click();await new Promise(resolve=>setTimeout(resolve,0));});
  await wait(()=>document.body.textContent!.includes("Recording · 00:00"));
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,1100));});
  assert.match(document.querySelector('[data-testid="melody-recording-timer"]')!.textContent!,/00:0[1-2] \/ 05:00/);
  await act(async()=>button("Stop recording").click());
  assert.equal(captures,1);assert.match(document.body.textContent!,/Record another take/);
  await act(async()=>{button("Record another take").click();await new Promise(resolve=>setTimeout(resolve,0));});
  await wait(()=>document.body.textContent!.includes("Recording · 00:00"));
  await act(async()=>button("Stop recording").click());
  assert.equal(captures,2);assert.equal(document.querySelectorAll('[data-testid="melody-reference-take"]').length,2);assert.equal(stoppedTracks,2);
 }finally{
  await act(async()=>root.unmount());dom.window.close();
  if(oldNavigator)Object.defineProperty(globalThis,"navigator",oldNavigator);else delete (globalThis as any).navigator;
  if(oldRecorder)Object.defineProperty(globalThis,"MediaRecorder",oldRecorder);else delete (globalThis as any).MediaRecorder;
 }
});
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
 const description="A short hopeful pop song about a fresh start. Sing in English.";
 try{
  await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>{calls++;throw new Error("Fixture: the generation response was interrupted. Check your existing draft.");}} saveSketch={async()=>undefined}/>));
  const prompt=document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"]')!;
  await h.input(prompt,description);
  const language=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==="auto")&&[...s.options].some(o=>/^English\b/.test(o.textContent??"")))!;
  assert.equal(language,undefined,"Simple infers the requested language instead of showing a language menu");
  assert.match(document.querySelector('[data-testid="text-understood-prompt"]')!.textContent!,/English/);
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
   assert.equal(document.querySelector('[data-testid="select-singing-arrangement"]'),null,"Simple follows the description without an advanced singer menu");
   await act(async()=>h.button("Custom").click());
   await act(async()=>{document.querySelector<HTMLDetailsElement>('[data-testid="fold-vocals"]')!.open=true;});
   const customPrompt=document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-idea"]')!;
   const voices=document.querySelector('[data-testid="select-singing-arrangement"]') as unknown as HTMLSelectElement;
  assert.equal(voices.options.length,6);
  await h.select(voices,"Solo male lead");
  assert.match(summary(),/conflicts with the description/);
  await submit();assert.equal(submitted.length,1);
   await h.input(customPrompt,"A warm acoustic song; sing in Spanish with a deep male lead.");
  await submit();assert.equal(submitted.length,2);
  assert.match(submitted[1].voice,/Solo male lead/);
   assert.equal(customPrompt.value,"A warm acoustic song; sing in Spanish with a deep male lead.");
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
  const preset={...makeSavedSongPrompt(savedPromptFromSong(source),'prompt-private'),favorite:true},before=structuredClone(preset);const h=await setup();let saved:any,favoriteChange:any;
   try{
    await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>undefined} saveSketch={async()=>undefined} savedPrompts={[preset]} autoSavePrompts setAutoSavePrompts={()=>{}} favoritePrompt={async(id,favorite)=>{favoriteChange={id,favorite};return true;}} savePrompt={async input=>{saved=input;return preset;}}/>));
    const library=document.querySelector<HTMLDetailsElement>('[data-testid="saved-prompt-library"]')!;await act(async()=>{library.open=true;});
    const search=document.querySelector<HTMLInputElement>('[data-testid="input-search-saved-prompts"]')!;await h.input(search,"no match");assert.equal(document.querySelector('[data-testid="saved-prompt-prompt-private"]'),null);
    await h.input(search,"gentle world jazz");assert(document.querySelector('[data-testid="saved-prompt-prompt-private"]'));
    await act(async()=>document.querySelector<HTMLButtonElement>('[data-testid="button-use-saved-prompt-prompt-private"]')!.click());
    assert.equal(document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-idea"]')!.value,source.notes.prompt);assert(document.body.textContent!.includes('نور الحب'));
    await act(async()=>document.querySelector<HTMLButtonElement>('[data-testid="button-favorite-saved-prompt-prompt-private"]')!.click());assert.deepEqual(favoriteChange,{id:preset.id,favorite:false});
    await act(async()=>document.querySelector<HTMLButtonElement>('[data-testid="button-save-current-prompt"]')!.click());
    assert.equal(saved.lyrics,source.notes.lyrics);assert.equal(saved.instruments,'Oud, Piano');assert.equal(saved.vocals,'Warm Lebanese Arabic duet');assert.deepEqual(saved.tags,['Jazz']);assert.deepEqual(preset,before);
   }finally{await h.close();}
});

test("automatic prompt history saves only after a confirmed song",async()=>{
 const h=await setup();let saves=0;let submitted:any;
 try{
  await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{submitted=input;return "saved-song";}} saveSketch={async()=>undefined} autoSavePrompts savePrompt={async input=>{saves++;assert.match(input.idea,/new beginning/);return {...(await import('../app/saved-song-prompts')).makeSavedSongPrompt(input,"prompt-auto")};}}/>));
  const field=document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"]')!;
  await h.input(field,"A hopeful song about a new beginning. Sing in English.");
  await act(async()=>document.querySelector('form')!.dispatchEvent(new h.dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(saves,1);assert.match(submitted.prompt,/new beginning/);
 }finally{await h.close();}
});

test("automatic prompt history does not save an unconfirmed generation",async()=>{
 const h=await setup();let saves=0;
 try{
  await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>undefined} saveSketch={async()=>undefined} autoSavePrompts savePrompt={async()=>{saves++;return undefined;}}/>));
  await h.input(document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"]')!,"A hopeful song about starting again. Sing in English.");
  await act(async()=>h.button("Create").click());
  assert.equal(saves,0);assert.match(document.body.textContent!,/This take was not confirmed/);
 }finally{await h.close();}
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
