import test from "node:test";
import assert from "node:assert/strict";
import React,{act,useState} from "react";
import {JSDOM} from "jsdom";
import {indexedDB} from "fake-indexeddb";
import {DraftRecoveryProvider,recoveryStore,useDraftRecovery} from "../app/draft-recovery";
import {useAccountWriting} from "../app/use-account-writing";
import {QuickCreate} from "../app/quick-create";
const wait=(ms=30)=>new Promise(resolve=>setTimeout(resolve,ms));
async function setup(){
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
 const fetch=globalThis.fetch;
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,HTMLElement:dom.window.HTMLElement,indexedDB,IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import("react-dom/client");
 let root=createRoot(document.getElementById("root")!);
 return {dom,get root(){return root;},async reopen(){await act(async()=>root.unmount());await wait();root=createRoot(document.getElementById("root")!);},
  async input(element:HTMLInputElement|HTMLTextAreaElement,text:string){await act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element),"value")!.set!.call(element,text);element.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});},
  async settle(ms=40){await act(async()=>{await wait(ms);});},
  async close(){await act(async()=>root.unmount());globalThis.fetch=fetch;dom.window.close();}};
}
test("Create resumes device writing without prompts, ignores older account text, and New song stays blank on return",async()=>{
 const h=await setup();let calls=0,questions=0;
 let cloud:Record<string,unknown>={revision:0};
 window.confirm=()=>{questions++;return false;};
 globalThis.fetch=async()=>Response.json(cloud);
 const render=()=>h.root.render(<DraftRecoveryProvider scope="quiet-create-owner"><QuickCreate engine={{owner:true,configured:true,preferred:"ace-step",engine:"ace-step",notice:""}} connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>{calls++;return "paid-song";}} saveSketch={async()=>undefined}/></DraftRecoveryProvider>);
 const description=()=>document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"]')!;
 try{
  await act(async()=>render());await h.settle();
  await h.input(description(),"A hopeful pop song about the sunrise. Sing in English.");
  await h.reopen();
  cloud={revision:4,writing:{title:"Writing draft",prompt:"Older account words",lyrics:"",voice:""}};
  await act(async()=>render());await h.settle();
  assert.match(description().value,/hopeful pop/);
  assert(!/restore draft|draft recovery|open saved writing draft|dismiss.*recovery/i.test(document.body.textContent!));
  await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));
  assert.equal(calls,1,`an old device record never blocks generating: ${document.querySelector('[role="alert"]')?.textContent??"no error"}`);
  const fresh=[...document.querySelectorAll("button")].find(button=>button.textContent==="New song")!;
  await act(async()=>fresh.click());
  assert.equal(description().value,"");assert.equal(questions,0);
  await h.reopen();await act(async()=>render());await h.settle();
  assert.equal(description().value,"","neither device nor old account text comes back after New song");
  assert.equal((await recoveryStore<{idea:string}>("quiet-create-owner:quick-create","read"))?.value.idea,"");
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open("samadhi-love-recovery-v1",1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const tx=db.transaction("drafts","readonly"),request=tx.objectStore("drafts").getAllKeys();
  const keys=await new Promise<IDBValidKey[]>(resolve=>{tx.oncomplete=()=>resolve(request.result);});
  assert(keys.some(key=>String(key).startsWith("quiet-create-owner:quick-create:preserved:")),"New song retains the old device text privately");
  db.close();
 }finally{await h.close();}
});
test("account writing opens automatically, saves repeated edits, and a real second-tab conflict does not overwrite it",async()=>{
 const h=await setup();
 let revision=3,cloud={title:"Writing draft",prompt:"Across the stars",lyrics:"نور and light",voice:"Warm"},puts=0;
 let controls:{set:(text:string)=>void;status:string};
 globalThis.fetch=async(_url,init)=>{
  if(init?.method!=="PUT")return Response.json({revision,writing:cloud});
  const input=JSON.parse(String(init.body));puts++;
  if(input.revision!==revision)return Response.json({error:"Conflict"},{status:409});
  cloud=input.writing;return Response.json({revision:++revision});
 };
 function Screen(){
  const [prompt,set]=useState("");
  const local=useDraftRecovery("account-test",{prompt},next=>set(next.prompt),!!prompt);
  const account=useAccountWriting("simple",{title:"",prompt,lyrics:"",voice:""},local.ready&&!!prompt,next=>set(next.prompt),local);
  controls={set,status:account.status};return <span>{prompt}</span>;
 }
 try{
  await act(async()=>h.root.render(<DraftRecoveryProvider scope="quiet-account-owner"><Screen/></DraftRecoveryProvider>));await h.settle();
  assert.equal(document.body.textContent,"Across the stars");
  await act(async()=>controls!.set("First edit"));await h.settle(2300);
  assert.equal(cloud.prompt,"First edit");
  await act(async()=>controls!.set("Second edit"));await h.settle(2300);
  assert.equal(cloud.prompt,"Second edit");assert.equal(puts,2);
  revision++;cloud={...cloud,prompt:"Other tab"};
  await act(async()=>controls!.set("This tab is safe"));await h.settle(2300);
  assert.equal(cloud.prompt,"Other tab");assert.match(controls!.status,/another tab/);
  assert.equal((await recoveryStore<{prompt:string}>("quiet-account-owner:account-test","read"))?.value.prompt,"This tab is safe");
 }finally{await h.close();}
});
test("a late account response cannot replace text just entered in Create",async()=>{
 const h=await setup();let answer!:(response:Response)=>void;
 globalThis.fetch=()=>new Promise<Response>(resolve=>{answer=resolve;});
 try{
  await act(async()=>h.root.render(<DraftRecoveryProvider scope="quiet-late-owner"><QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>undefined} saveSketch={async()=>undefined}/></DraftRecoveryProvider>));
  await h.settle();
  const input=document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-description"]')!;
  await h.input(input,"Keep these new words");
  await act(async()=>answer(Response.json({revision:1,writing:{title:"Old song",prompt:"Stale cloud text",lyrics:"",voice:""}})));
  assert.equal(input.value,"Keep these new words");
 }finally{await h.close();}
});
