import "./browser-platform";
import test from 'node:test';import assert from 'node:assert/strict';import React,{act} from 'react';import {JSDOM} from 'jsdom';import {StudioNavigation} from '../app/studio-navigation';import {MobileProjectBar} from '../app/mobile-project-bar';import {freshSong} from '../app/studio-data';
async function setup(){const dom=new JSDOM('<div id="root"></div>',{url:'https://studio.test'});let scrolls=0;Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,getComputedStyle:dom.window.getComputedStyle,requestAnimationFrame:(fn:FrameRequestCallback)=>setTimeout(fn,0),cancelAnimationFrame:(id:number)=>clearTimeout(id),IS_REACT_ACT_ENVIRONMENT:true});dom.window.scrollTo=()=>{scrolls++;};const{createRoot}=await import('react-dom/client');const root=createRoot(document.getElementById('root')!);return{dom,root,scrolls:()=>scrolls,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};}
test('phone dock keeps five screens and Studio menu exposes Settings and Help',async()=>{
 const h=await setup(),visited:string[]=[],utilities:string[]=[];
 try{
  await act(async()=>h.root.render(<StudioNavigation activeView="overview" owner beginner navigate={()=>true} openScreen={screen=>{visited.push(screen);return true;}} settings={()=>utilities.push("settings")} guide={()=>utilities.push("guide")}/>));
  const dock=document.querySelector('[aria-label="Mobile quick actions"]')!;
  assert.equal(dock.querySelectorAll('button').length,5);
  for(const name of ['Create','Your songs','Video','Record','Explore'])await act(async()=>[...dock.querySelectorAll('button')].find(b=>b.textContent===name)!.click());
  assert.deepEqual(visited,['create','songs','lyric-video','record','explore']);assert.equal(h.scrolls(),5);
  const menu=document.querySelector<HTMLButtonElement>('.studio-menu-toggle')!;
  await act(async()=>menu.click());
  assert.equal(document.querySelector('.studio-navigation')!.getAttribute('data-mobile-open'),'true');
  assert.equal(menu.getAttribute('aria-expanded'),'true');
  await act(async()=>document.querySelector<HTMLButtonElement>('[data-testid="nav-settings"]')!.click());
  await act(async()=>document.querySelector<HTMLButtonElement>('[data-testid="toggle-settings-help"]')!.click());
  await act(async()=>document.querySelector<HTMLButtonElement>('[data-testid="nav-guide"]')!.click());
  assert.deepEqual(utilities,['settings','guide']);
  assert(document.querySelector('[data-testid="nav-plan-credits"]'));
 }finally{await h.close();}
});
test('blocked navigation keeps the open phone menu and current workspace',async()=>{const h=await setup();try{await act(async()=>h.root.render(<StudioNavigation activeView="recording" owner navigate={()=>false} settings={()=>{}} guide={()=>{}}/>));await act(async()=>document.querySelector<HTMLButtonElement>('.studio-menu-toggle')!.click());await act(async()=>[...document.querySelectorAll<HTMLButtonElement>('.studio-mobile-dock button')].find(b=>b.textContent==='Video')!.click());assert.equal(document.querySelector('.studio-navigation')!.getAttribute('data-mobile-open'),'true');assert.equal(h.scrolls(),0);}finally{await h.close();}});
test('persistent project selector opens the exact saved song and respects busy state',async()=>{const h=await setup();const songs=[freshSong('one','First song',0),freshSong('two','Second song',1)],before=structuredClone(songs),visited:string[]=[];try{await act(async()=>h.root.render(<MobileProjectBar songs={songs} currentId="one" disabled={false} select={id=>visited.push(id)}/>));const select=document.querySelector('select')!;assert.equal(select.value,'one');await act(async()=>{select.value='two';select.dispatchEvent(new h.dom.window.Event('change',{bubbles:true}));});assert.deepEqual(visited,['two']);assert.deepEqual(songs,before);await act(async()=>h.root.render(<MobileProjectBar songs={songs} currentId="one" disabled select={()=>{}}/>));assert(select.disabled);await act(async()=>h.root.render(<MobileProjectBar songs={[]} currentId="" disabled={false} select={()=>{}}/>));assert(document.querySelector('select')!.disabled);}finally{await h.close();}});
