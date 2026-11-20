import test from "node:test";import assert from "node:assert/strict";import React,{act} from "react";import {JSDOM} from "jsdom";import {writeFileSync,mkdirSync} from "node:fs";
import {StatusBoard} from "../app/admin/status/status-board";

const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const sample=(historyReady:boolean)=>({at:"2026-11-20T15:00:00.000Z",health:{status:"ok",checks:{server:"ok",database:"ok",storage:"ok"}},historyReady,errorCount:historyReady?1:null,
  jobs:[{type:"music-generation",status:"done",count:19,averageMs:72_000},{type:"music-generation",status:"failed",count:1,averageMs:5000}],
  targets:[{kind:"songSuccess",label:"Songs finish successfully",goal:"95% or more",value:0.95,met:true,sample:20},{kind:"songSpeed",label:"Songs ready within 3 minutes (9 out of 10)",goal:"3 minutes or less",value:240_000,met:false,sample:19},
    {kind:"captionPrecise",label:"Captions matched to the voice (not rough timing)",goal:"90% or more",value:historyReady?0.9:null,met:historyReady?true:null,sample:historyReady?10:null},
    {kind:"aiSuccess",label:"AI requests accepted",goal:"95% or more",value:historyReady?0.95:null,met:historyReady?true:null,sample:historyReady?20:null},
    {kind:"serverErrors",label:"Errors recorded today (server, AI and app crashes)",goal:"5 or fewer",value:historyReady?1:null,met:historyReady?true:null,sample:null}],
  ai:historyReady?[{provider:"fal.ai",step:"ace-step-1.5/submit",calls:20,ok:19,averageMs:960}]:[],
  errors:historyReady?[{at:"2026-11-20T14:00:00.000Z",event:"lyric-sync.problem",status:422,route:"/api/studio/lyric-sync",requestId:"5af71777-a4ae",detail:{reason:"The vocals could not be timed reliably."}}]:[],
  actions:historyReady?[{at:"2026-11-20T13:00:00.000Z",action:"music-engine.change",actor:"owner-1",requestId:"9bcff941-0e37",detail:{engine:"ace-step"}}]:[]});

async function setup(responses:unknown[]){
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
  const calls:{url:string;method:string;body?:string}[]=[];
  (globalThis as {fetch:unknown}).fetch=async(url:string,init:RequestInit={})=>{calls.push({url,method:init.method??"GET",body:init.body as string|undefined});return Response.json(responses.shift());};
  const {createRoot}=await import("react-dom/client");const root=createRoot(document.getElementById("root")!);
  await act(async()=>root.render(<StatusBoard/>));await act(async()=>{await new Promise(r=>setTimeout(r,0));});
  return {calls,root,dom};
}

test("Status page shows health, targets in plain words, AI requests, errors with a reference and owner actions",async()=>{
  const h=await setup([sample(true)]);
  try{
    assert.match(q("status-health")!.textContent!,/The app is up/);
    assert.equal(q("target-songSuccess")!.dataset.met,"true");
    assert.match(q("target-songSpeed")!.textContent!,/4\.0 min.*below target/);
    assert.match(q("target-captionPrecise")!.textContent!,/90%.*on target/);
    assert.match(q("status-jobs")!.textContent!,/Song creation: 19 finished · about 1\.2 min each/);
    assert.match(q("status-ai")!.textContent!,/fal\.ai · ace-step-1\.5\/submit: 19 of 20 accepted/);
    assert.match(q("status-errors")!.textContent!,/The vocals could not be timed reliably.*ref 5af71777/);
    assert.match(q("status-actions")!.textContent!,/music-engine\.change · engine: ace-step/);
    assert.equal(q("status-history-setup"),null);
    mkdirSync("generated-artifacts/tests",{recursive:true});
    writeFileSync("generated-artifacts/tests/app-status.html",`<html><head><meta charset="utf-8"><style>body{background:#0d0b1a;color:#ece6ff;font:15px system-ui;padding:24px;max-width:900px}h2{color:#c9a7ff}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #3a3160;padding:6px;text-align:left}.muted{opacity:.7}button{background:#6d4bd1;color:#fff;border:0;border-radius:8px;padding:6px 12px}section{margin-bottom:22px}</style></head><body><h1>App status</h1>${document.getElementById("root")!.innerHTML}</body></html>`);
  }finally{await act(async()=>h.root.unmount());}
});

test("before history is set up, one button sets it up (owner-approved) and the page reloads",async()=>{
  const h=await setup([sample(false),{ready:true},sample(true)]);
  try{
    assert.match(q("status-history-setup")!.textContent!,/adds that table only/);
    assert.match(q("target-captionPrecise")!.textContent!,/No data yet/);
    await act(async()=>q("button-setup-history")!.click());await act(async()=>{await new Promise(r=>setTimeout(r,0));});
    assert.deepEqual(h.calls.map(c=>[c.method,c.body]),[["GET",undefined],["POST",'{"action":"setup-history"}'],["GET",undefined]]);
    assert.equal(q("status-history-setup"),null);
    assert.ok(q("status-ai"));
  }finally{await act(async()=>h.root.unmount());}
});
