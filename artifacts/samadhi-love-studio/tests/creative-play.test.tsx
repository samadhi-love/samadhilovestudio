import {customCreate,englishCreation,creationIdea} from "./create-controls";
import test from 'node:test';import assert from 'node:assert/strict';import React,{act,useState} from 'react';import {JSDOM} from 'jsdom';import {QuickCreate} from '../app/quick-create';import {feelingIdeas,playDirection,defaultPlayChoices,validPlayChoices} from '../app/creative-play';import {freshSong,type Song} from '../app/studio-data';
async function setup(){const dom=new JSDOM('<div id="root"></div>',{url:'https://studio.test'});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});dom.window.HTMLFormElement.prototype.requestSubmit=function(){this.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));};const{createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root')!);return{dom,root,button:(text:string)=>[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent?.trim()===text)!,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};}
test('Simple creation preserves separate takes and hands the selected recording to video without automatic publishing',async()=>{
 const h=await setup(),calls:any[]=[],visuals:any[]=[],library:Song[]=[];let failed=false,published=0;
 function Screen(){const[songs,setSongs]=useState<Song[]>([]);return <QuickCreate simpleExperience connected saving={false} drafts={songs} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} saveSketch={async()=>undefined} generateSong={async input=>{calls.push(input);if(failed)return undefined;const song={...freshSong('take-'+calls.length,'My creation '+calls.length,0),audioFormat:'mp3' as const};library.unshift(song);setSongs([...library]);return song.id;}} makeVideo={async(song,short,visual)=>{visuals.push({song,short,visual});}} publish={()=>{published++;}}/>;}
 const describe=async(text:string)=>act(async()=>{const field=creationIdea();Object.getOwnPropertyDescriptor(h.dom.window.HTMLTextAreaElement.prototype,'value')!.set!.call(field,text);field.dispatchEvent(new h.dom.window.Event('input',{bubbles:true}));});
 try{
  await act(async()=>h.root.render(<Screen/>));await englishCreation();
  await describe('A hopeful 90-second pop song about sending love. Sing in English.');
  await act(async()=>h.button('Create').click());assert.equal(calls[0].duration,90);assert.match(calls[0].prompt,/hopeful/);assert.equal(library.length,1);
  const controls=[...document.querySelectorAll('.play-controls select')] as unknown as HTMLSelectElement[];
  await act(async()=>{controls[0].value='sacred';controls[0].dispatchEvent(new h.dom.window.Event('change',{bubbles:true}));});
  await act(async()=>h.button('Try a new take').click());assert.equal(calls.length,2);assert.equal(calls[1].prompt,calls[0].prompt,"Changing a video look does not silently change the music description");assert.equal(library.length,2);assert.equal(library[1].id,'take-1');
  await act(async()=>h.button('Keep this · make it visual').click());await act(async()=>h.button('Make my video').click());assert.equal(visuals[0].song.id,'take-2');assert.equal(visuals[0].short,true);assert.equal(visuals[0].visual.look,'sacred-gold');assert.equal(library.length,2);assert.equal(published,0);
  failed=true;await act(async()=>h.button('Create').click());assert.match(document.body.textContent!,/previous songs are safe/);assert.equal(library.length,2);assert.equal(published,0);
 }finally{await h.close();}
});
test('own lyrics remain exact, explicit song lengths remain respected, and own-voice starts recording',async()=>{
 const h=await setup();let submitted:any,recorded=0,uploaded=0;
 try{
  await act(async()=>h.root.render(<QuickCreate simpleExperience connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} saveSketch={async()=>undefined} generateSong={async input=>{submitted=input;return undefined;}} recordVoice={()=>recorded++} uploadOwn={()=>uploaded++}/>));
  await customCreate();
  await act(async()=>h.button('Record my voice').click());await act(async()=>h.button('Use my recording').click());assert.equal(recorded,1);assert.equal(uploaded,1);
  const input=async(el:HTMLTextAreaElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(h.dom.window.HTMLTextAreaElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new h.dom.window.Event('input',{bubbles:true}));});
  await input(creationIdea(),'A hopeful 2 minute original song');
  const lyrics='[deep male vocals]\nSending love in my own words (whisper softly)';
  await input(document.querySelector<HTMLTextAreaElement>('[data-testid="input-lyrics"]')!,lyrics);
  await act(async()=>h.button('Create').click());assert.equal(submitted.duration,120);assert.equal(submitted.lyrics,lyrics);assert.equal(submitted.instrumental,false);
 }finally{await h.close();}
});
test('play choice metadata validates supported controls and never claims identity/model training',()=>{assert(validPlayChoices(defaultPlayChoices));assert(!validPlayChoices({...defaultPlayChoices,look:'nonexistent'}));assert.match(playDirection(defaultPlayChoices),/Preserve the supplied lyrics/);assert.equal(feelingIdeas.length,3);});
import {applyPlayVisual} from '../app/creative-video-handoff';import {newProSettings} from '../app/lyric-pro-data';import type {LyricProject} from '../app/lyric-video-data';
test('photo and look handoff preserves exact words, source audio, timeframe and inactive media',()=>{const song=freshSong('visual-song','My original',0),project:LyricProject={theme:'cosmic',format:'vertical',motion:'still',cues:[{time:0,end:2,text:'My exact words'}],pro:{...newProSettings(song,60),backgroundVideo:{asset:'saved-clip',duration:5,trimStart:0,trimEnd:5,loop:true,fit:'contain'},sections:[{id:'chorus',name:'Chorus',time:0,end:60,background:'old-photo'}]}};const before=structuredClone(project),next=applyPlayVisual(project,'sacred-gold','my-photo');assert.equal(next.theme,'masters');assert.equal(next.pro!.background,'my-photo');assert.equal(next.pro!.useTemplateBackground,true);assert.equal(next.pro!.sourceAudioId,project.pro!.sourceAudioId);assert.deepEqual(next.pro!.backgroundVideo,project.pro!.backgroundVideo);assert.deepEqual(next.pro!.range,project.pro!.range);assert.deepEqual(next.cues,project.cues);assert.deepEqual(project,before);});
test('lyrics alone can start a creation without forcing a description',async()=>{
 const h=await setup();let payload:any;
 try{
  await act(async()=>h.root.render(<QuickCreate simpleExperience connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} saveSketch={async()=>undefined} generateSong={async input=>{payload=input;return undefined;}}/>));await customCreate();
  const lyrics=document.querySelector<HTMLTextAreaElement>('[data-testid="input-lyrics"]')!;
  await act(async()=>{Object.getOwnPropertyDescriptor(h.dom.window.HTMLTextAreaElement.prototype,'value')!.set!.call(lyrics,'A little light is shining in my heart');lyrics.dispatchEvent(new h.dom.window.Event('input',{bubbles:true}));});
  assert.equal(h.button('Create').disabled,false);await act(async()=>h.button('Create').click());assert.equal(payload.lyrics,'A little light is shining in my heart');assert.match(payload.prompt,/exact supplied lyrics/);
 }finally{await h.close();}
});
