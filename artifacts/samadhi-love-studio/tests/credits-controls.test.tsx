import test from "node:test";
import assert from "node:assert/strict";
import React, {act} from "react";
import {JSDOM} from "jsdom";
import {productionFetch} from "../app/credits/client";
import {CreditPanel} from "../app/credits/credit-panel";
import {plans} from "../app/credits/data";
import {setImmediate as nextTurn} from "node:timers/promises";
import {JobStatus} from "../app/job-status";
import {DraftRecoveryProvider} from "../app/draft-recovery";
import {JobWaitError,lostConnectionMessage} from "../app/credits/job-wait";

test("production preflight confirms server cost and submits a stable reference, while cancellation sends no job",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document});
 const oldFetch=globalThis.fetch;let calls:RequestInit[]=[],confirmed="",allow=false;
 dom.window.confirm=((message:string)=>{confirmed=message;return allow;}) as typeof confirm;
 globalThis.fetch=async(url,init)=>{if(String(url)==="/api/studio/credits")return Response.json({funding:"studio",credits:72,available:300,enabled:true});calls.push(init!);return Response.json({ok:true});};
 try{const init={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"song",duration:240})};
 await assert.rejects(productionFetch("/api/studio/create",init),/canceled/);assert.equal(calls.length,0);assert.match(confirmed,/72 SAMADHI credits/);
 allow=true;await productionFetch("/api/studio/create",init);assert.equal(calls.length,1);const headers=new Headers(calls[0].headers);assert.equal(headers.get("X-Studio-Credits-Accepted"),"72");assert.match(headers.get("X-Production-Id")!,/^[a-f0-9-]{36}$/);
 globalThis.fetch=async()=>Response.json({error:"Accounting unavailable"},{status:503});await assert.rejects(productionFetch("/api/studio/create",init),/Accounting unavailable/);
 }finally{globalThis.fetch=oldFetch;dom.window.close();}
});
test("a lost estimate connection sends no production request and explains the safe next step",async()=>{
 const oldFetch=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;throw new TypeError("Failed to fetch");};
  await assert.rejects(productionFetch("/api/studio/create",{method:"POST",body:JSON.stringify({action:"song"})}),/No generation request was sent/);
  assert.equal(calls,1);
  globalThis.fetch=async()=>{calls++;return new Response("<html>Preview unavailable</html>",{status:502,headers:{"Content-Type":"text/html"}});};
  await assert.rejects(productionFetch("/api/studio/create",{method:"POST",body:"{}"}),/No generation request was sent/);
  assert.equal(calls,2);
 }finally{globalThis.fetch=oldFetch;}
});
test("a lost production connection warns about an uncertain outcome and never automatically retries",async()=>{
 const dom=new JSDOM("",{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window});
 const oldFetch=globalThis.fetch;let calls=0,events=0;
 dom.window.addEventListener("samadhi-usage-updated",()=>events++);
 try{
  globalThis.fetch=async()=>{calls++;if(calls===1)return Response.json({funding:"own"});throw new TypeError("Failed to fetch");};
  await assert.rejects(productionFetch("/api/studio/create",{method:"POST",body:JSON.stringify({action:"song"})}),/Generation may already have started.*Do not click Generate again/);
  assert.equal(calls,2);assert.equal(events,1);
 }finally{globalThis.fetch=oldFetch;dom.window.close();}
});
test("account screen labels proposed plans honestly and does not show owner grant controls to creators",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({account:{owner:"me",plan:"creator",status:"beta",funding:"own",balance:228,period_end:Date.now()+86400000},plans,managedAvailable:false,billingActive:false,limits:{concurrent:1,daily:20,musicSeconds:360,uploadMB:96},held:72,active:0,today:1,used:0,expired:false,jobs:[],ledger:[],owner:false});
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 try{await act(async()=>root.render(<CreditPanel owner={false}/>));assert.match(document.body.textContent!,/228/);assert.match(document.body.textContent!,/not activated/);assert.match(document.body.textContent!,/total account storage is not yet metered/);assert(!document.body.textContent!.includes("Assign beta allowance"));const links=[...document.querySelectorAll("a")].filter(a=>a.textContent==="Select plan · payments not open");assert.equal(links.length,3);assert(links.every(a=>a.href.includes("/members?plan=")));
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();}
});

test("a stalled accepted job shows reconnect instructions and never replays its paid POST",async ctx=>{
 const dom=new JSDOM("",{url:"https://studio.test"}),oldFetch=globalThis.fetch,oldWindow=globalThis.window;
 Object.assign(globalThis,{window:dom.window});
 const calls:{url:string;method:string}[]=[],notices:unknown[]=[];
 dom.window.addEventListener("samadhi-job-wait-failed",event=>notices.push((event as CustomEvent).detail));
 globalThis.fetch=async(url,init)=>{
  const path=String(url);calls.push({url:path,method:init?.method??"GET"});
  if(path==="/api/studio/credits")return Response.json({funding:"own"});
  if(init?.method==="POST")return Response.json({jobId:"saved-job",songId:"saved-song"},{status:202});
  return new Promise<Response>(()=>{});
 };
 ctx.mock.timers.enable({apis:["setTimeout","Date"],now:0});
 try{
  let settled=false;
  const rejected=assert.rejects(productionFetch("/api/studio/create",{method:"POST",signal:null,body:JSON.stringify({action:"song"})}),
   error=>error instanceof JobWaitError&&/Didn't finish.*Try again/.test(error.message)&&/don't press Create again/.test(error.message)).finally(()=>{settled=true;});
  for(let step=0;step<40&&!settled;step++){await nextTurn();ctx.mock.timers.tick(5_000);}
  await rejected;
  assert.equal(calls.filter(call=>call.url==="/api/studio/jobs"&&call.method==="POST").length,1);
  assert(calls.some(call=>call.method==="GET"));
  assert.equal(notices.length,1);
 }finally{ctx.mock.timers.reset();globalThis.fetch=oldFetch;globalThis.window=oldWindow;dom.window.close();}
});

test("Saved work status Try again only reconnects with GET, not a new paid attempt",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
 const old={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const methods:string[]=[];
 globalThis.fetch=async(_url,init)=>{methods.push(init?.method??"GET");return Response.json({jobs:[{id:"saved-job",song_id:"saved-song",type:"music-generation",status:"working"}]});};
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 try{
  await act(async()=>root.render(<DraftRecoveryProvider scope="owner"><JobStatus completed={()=>{}}/></DraftRecoveryProvider>));
  await act(async()=>window.dispatchEvent(new dom.window.CustomEvent("samadhi-job-wait-failed",{detail:{jobId:"saved-job",message:lostConnectionMessage}})));
  assert.match(document.body.textContent!,/Didn't finish/);
  const button=[...document.querySelectorAll("button")].find(button=>button.textContent==="Try again")!;
  assert(button);
  await act(async()=>button.click());
  assert(methods.length>=2);
  assert(methods.every(method=>method==="GET"));
  assert(!document.body.textContent!.includes("Didn't finish"));
  assert.match(document.body.textContent!,/Making your song/);
 }finally{await act(async()=>root.unmount());Object.assign(globalThis,old);dom.window.close();}
});
