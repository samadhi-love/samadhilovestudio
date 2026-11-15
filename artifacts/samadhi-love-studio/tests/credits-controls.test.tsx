import test from "node:test";
import assert from "node:assert/strict";
import React, {act} from "react";
import {JSDOM} from "jsdom";
import {productionFetch} from "../app/credits/client";
import {CreditPanel} from "../app/credits/credit-panel";
import {plans} from "../app/credits/data";

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
test("account screen labels proposed plans honestly and does not show owner grant controls to creators",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>Response.json({account:{owner:"me",plan:"creator",status:"beta",funding:"own",balance:228,period_end:Date.now()+86400000},plans,managedAvailable:false,billingActive:false,limits:{concurrent:1,daily:20,musicSeconds:360,uploadMB:96},held:72,active:0,today:1,used:0,expired:false,jobs:[],ledger:[],owner:false});
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 try{await act(async()=>root.render(<CreditPanel owner={false}/>));assert.match(document.body.textContent!,/228/);assert.match(document.body.textContent!,/not activated/);assert.match(document.body.textContent!,/total account storage is not yet metered/);assert(!document.body.textContent!.includes("Assign beta allowance"));const links=[...document.querySelectorAll("a")].filter(a=>a.textContent==="Select plan · payments not open");assert.equal(links.length,3);assert(links.every(a=>a.href.includes("/members?plan=")));
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();}
});
