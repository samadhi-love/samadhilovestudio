import test from "node:test";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {build} from "esbuild";
import {EventEmitter} from "node:events";
import {setImmediate as nextTurn} from "node:timers/promises";
import React,{act} from "react";
import {JSDOM} from "jsdom";
const directory="generated-artifacts/tests/connection-reliability";
mkdirSync(directory,{recursive:true});
globalThis.__connectionCheck={};
await build({stdin:{contents:`
export {GET,PUT,POST} from "./app/api/studio/elevenlabs/route";
export {POST as diagnostic} from "./app/api/studio/elevenlabs/diagnostic/route";
export {resolveElevenLabsKey,saveElevenLabsKey} from "./app/api/studio/elevenlabs/vault";
export {testElevenLabs} from "./app/api/studio/elevenlabs/provider";
export {safeCheckFailure,diagnoseProviderConnectivity,observeProviderCheck} from "./app/server/provider-check-diagnostics";
export {useElevenLabsKey,ElevenLabsSettingsPanel} from "./app/elevenlabs-key";
export {ElevenLabsNetworkDiagnostic} from "./app/elevenlabs-network-diagnostic";
export {pendingKeyMessage} from "./app/elevenlabs-settings-data";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/bundle.mjs`,bundle:true,platform:"node",format:"esm",jsx:"automatic",packages:"external",plugins:[{name:"offline-connection",setup(b){
 b.onResolve({filter:/.*/},a=>{
  if(/server\/storage$/.test(a.path))return {path:"storage",namespace:"fixture"};
  if(/studio-access$/.test(a.path))return {path:"access",namespace:"fixture"};
  if(/\/store$/.test(a.path))return {path:"store",namespace:"fixture"};
  if(/credits\/account-ledger$/.test(a.path))return {path:"credits",namespace:"fixture"};
  if(a.path==="node:https")return {path:"https",namespace:"fixture"};
 });
 b.onLoad({filter:/.*/,namespace:"fixture"},a=>({loader:"js",contents:{
  storage:"export const serverStorage=new Proxy({},{get:(_,key)=>globalThis.__connectionCheck.env[key]});",
  access:"export const privateWorkspace=async()=>globalThis.__connectionCheck.access;",
  store:'export const privateHeaders={"Cache-Control":"private,no-store"};',
  credits:"export const managedAvailable=()=>false;export const ensureCreditAccount=async()=>({});",
  https:"export const request=(...args)=>globalThis.__connectionCheck.requester(...args);",
 }[a.path]}));
}}]});
const api=await import(`../${directory}/bundle.mjs`);
function fixture(){
 const objects=new Map(),logs=[],calls=[];
 const state=globalThis.__connectionCheck={env:{vault:"c".repeat(64)},access:{id:"owner",role:"owner"},objects,calls,logs};
 state.env.BUCKET={
  async head(key){return objects.get(key)??null;},
  async get(key){const value=objects.get(key);return value?{...value,arrayBuffer:async()=>value.bytes.buffer.slice(0)}:null;},
  async put(key,bytes,options){
   const current=objects.get(key);
   if(options.onlyIf?.etagMatches&&current?.etag!==options.onlyIf.etagMatches||options.onlyIf?.etagDoesNotMatch==="*"&&current)return null;
   const value={bytes:new Uint8Array(bytes),size:bytes.byteLength,etag:crypto.randomUUID(),customMetadata:options.customMetadata};
   objects.set(key,value);return value;
  },
 };
 return state;
}
const key="fixture-key-private-sentinel";
const request=(method="PUT",origin="https://studio.test")=>new Request("https://studio.test/api/studio/elevenlabs",{method,headers:{origin,"Content-Type":"application/json"},...(method==="PUT"?{body:JSON.stringify({apiKey:key})}:{})});
async function isolated(run){
 const oldFetch=globalThis.fetch,oldWarn=console.warn;
 const state=fixture();console.warn=(...args)=>state.logs.push(args);
 try{await run(state);}finally{globalThis.fetch=oldFetch;console.warn=oldWarn;}
}
test("network failure saves an encrypted unverified key, keeps it across reload and logs only safe causes",()=>isolated(async state=>{
 globalThis.fetch=async(url,init)=>{state.calls.push({url,init});throw Object.assign(new Error(key),{cause:{code:"ENOTFOUND",message:key}});};
 const response=await api.PUT(request()),result=await response.json();
 assert.equal(response.status,200);assert.equal(result.saved,true);assert.equal(result.connection,"unchecked");assert.equal(result.owner,true);
 assert.equal(await api.resolveElevenLabsKey("owner"),key);
 assert(!(new TextDecoder().decode([...state.objects.values()][0].bytes)).includes(key));
 const reloaded=await (await api.GET()).json();assert.equal(reloaded.saved,true);assert.equal(reloaded.connection,"unchecked");
 assert.notEqual(result.accountMessage,result.musicMessage);assert.match(result.musicMessage,/not tested/i);
 assert.equal(state.calls.length,1);assert.equal(state.calls[0].init.method,"GET");
 assert.equal(response.headers.get("X-Studio-Request-Id"),result.requestId);
 assert.equal(state.logs[0][1].requestId,result.requestId);assert.equal(state.logs[0][1].kind,"dns");
 assert(!JSON.stringify(state.logs).includes(key));assert(!JSON.stringify(result).includes(key));
}));
test("a hung subscription check is bounded at 30 seconds total and still saves the key",async context=>{
 await isolated(async state=>{
  globalThis.fetch=async()=>{state.calls.push("GET");return new Promise(()=>{});};
  context.mock.timers.enable({apis:["setTimeout","Date"],now:0});
  try{
   let finished=false;
   const pending=api.PUT(request()).then(async response=>({status:response.status,result:await response.json()})).finally(()=>{finished=true;});
   for(let step=0;step<8&&!finished;step++){await nextTurn();context.mock.timers.tick(5_000);}
   const {status,result}=await pending;
   assert.equal(status,200);assert.equal(result.saved,true);assert.equal(result.connection,"unchecked");
   assert.match(result.accountMessage,/30-second/);assert.equal(state.calls.length,1);
   assert.equal(state.logs[0][1].elapsedMs,30_000);
  }finally{context.mock.timers.reset();}
 });
});
test("actual 401 and missing-permission 403 refuse replacement and preserve the previous encrypted key",()=>isolated(async state=>{
 await api.saveElevenLabsKey("owner","old-fixture-key",{connection:"connected",musicAccess:"unknown"},true);
 const before=[...state.objects.values()][0];
 for(const status of [401,403]){
  globalThis.fetch=async()=>Response.json({detail:{status:status===401?"invalid_api_key":"missing_permissions",message:key}},{status});
  const response=await api.PUT(request()),result=await response.json();
  assert.equal(response.status,422);assert.match(result.error,/not saved/);
  assert(!result.error.includes("Music check:"));
  assert.equal(await api.resolveElevenLabsKey("owner"),"old-fixture-key");
  assert.equal([...state.objects.values()][0],before);
 }
 assert.deepEqual(state.logs.map(([,log])=>log.httpStatus),[401,403]);
 assert(!JSON.stringify(state.logs).includes(key));
}));
test("a stalled response body is bounded; known rejection headers still prevent replacing a key",async context=>{
 await isolated(async state=>{
  context.mock.timers.enable({apis:["setTimeout","Date"],now:0});
  try{
   for(const status of [200,401,403]){
    globalThis.fetch=async()=>new Response(new ReadableStream({start(){}}),{status});
    let finished=false;
    const pending=api.PUT(request()).finally(()=>{finished=true;});
    for(let step=0;step<8&&!finished;step++){await nextTurn();context.mock.timers.tick(5_000);}
    const response=await pending;
    assert.equal(response.status,status===200?200:422);
    assert.equal(state.logs.at(-1)[1].kind,"body_timeout");
    assert.equal(state.logs.at(-1)[1].httpStatus,status);
    assert.equal(await api.resolveElevenLabsKey("owner"),key);
   }
  }finally{context.mock.timers.reset();}
 });
});
test("a free successful check remains honest about untested paid features and retesting uses the saved key",()=>isolated(async state=>{
 globalThis.fetch=async(url,init)=>{state.calls.push({url,init});return Response.json({tier:"creator",character_count:1,character_limit:100});};
 assert.equal((await api.PUT(request())).status,200);
 const retested=await (await api.POST(request("POST"))).json();
 assert.equal(retested.connection,"connected");
 assert.equal(state.calls.length,2);
 assert(state.calls.every(({url,init})=>String(url).endsWith("/v1/user/subscription")&&init.method==="GET"&&!init.body));
 assert(Object.values(retested.capabilities).every(value=>value.state==="unknown"));
 assert.equal(state.logs.length,0);
}));
test("rate limits, server errors, redirects and malformed replies are not treated as invalid keys",async context=>{
 await isolated(async state=>{
  context.mock.timers.enable({apis:["setTimeout"]});
  try{
   for(const status of [429,503,302,200]){
    globalThis.fetch=async()=>status===200?Response.json({unexpected:true}):new Response(null,{status});
    let settled=false;
    const pending=api.PUT(request()).finally(()=>{settled=true;});
    for(let step=0;step<8&&!settled;step++){await nextTurn();context.mock.timers.tick(1_000);}
    const response=await pending;assert.equal(response.status,200);
    assert.equal((await response.json()).connection,"unchecked");
   }
  }finally{context.mock.timers.reset();}
 });
});
function fakeHttps(capture,failure){
 return (url,options,callback)=>{
  capture.push({url,options});
  const req=new EventEmitter();req.destroy=()=>{};
  req.end=()=>queueMicrotask(()=>{
   const socket=new EventEmitter();req.emit("socket",socket);
   if(failure){req.emit("error",failure);return;}
   socket.emit("lookup");socket.emit("connect");socket.emit("secureConnect");
   callback({statusCode:401,resume(){}});
  });
  return req;
 };
}
test("only an authenticated same-origin owner may run the key-free diagnostic",()=>isolated(async state=>{
 const calls=[];state.requester=fakeHttps(calls);
 for(const access of [null,{id:"creator",role:"creator"}]){
  state.access=access;assert.equal((await api.diagnostic(request("POST"))).status,403);
 }
 state.access={id:"owner",role:"owner"};
 assert.equal((await api.diagnostic(request("POST","https://forged.test"))).status,403);
 assert.equal(calls.length,0);
 const result=await (await api.diagnostic(request("POST"))).json();
 assert.equal(result.reachable,true);assert.equal(result.httpStatus,401);assert.match(result.summary,/expected/);
 assert.equal(calls.length,1);
 assert.deepEqual(calls[0].options,{method:"HEAD",agent:false});
 assert.equal(new URL(calls[0].url).hostname,"api.elevenlabs.io");
 for(const field of ["dnsMs","connectionMs","tlsMs","responseMs","totalMs"])assert.equal(typeof result.timings[field],"number");
}));
test("diagnostic failures classify DNS, reset, TLS and connect/response timeouts without raw details",()=>isolated(async state=>{
 for(const [code,kind]of [["ENOTFOUND","dns"],["ECONNREFUSED","connection_refused"],["ECONNRESET","connection_reset"],["CERT_HAS_EXPIRED","tls"],["UND_ERR_CONNECT_TIMEOUT","connect_timeout"],["UND_ERR_HEADERS_TIMEOUT","response_timeout"]]){
  const error=Object.assign(new Error(key),{code});
  const result=await api.diagnoseProviderConnectivity("fixture-reference",fakeHttps([],error));
  assert.equal(result.reachable,false);assert.equal(state.logs.at(-1)[1].kind,kind);
 }
 assert(!JSON.stringify(state.logs).includes(key));
 assert.equal(api.safeCheckFailure({name:"TimeoutError"},"reading_response").kind,"body_timeout");
 assert.equal(api.safeCheckFailure({name:"TimeoutError"},"connecting").kind,"connect_timeout");
}));
test("a diagnostic that gets no socket or headers also ends calmly",()=>isolated(async()=>{
 const requester=()=>{const req=new EventEmitter();req.end=()=>{};req.destroy=()=>{};return req;};
 const result=await api.diagnoseProviderConnectivity("fixture-deadline",requester,15);
 assert.equal(result.reachable,false);assert.match(result.summary,/timed out/);
}));
test("pending save stays saved in the Settings panel and the owner diagnostic is hidden from creators",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
 const old={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch,FormData:globalThis.FormData};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,FormData:dom.window.FormData,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root"));
 let current={available:true,saved:false,defaultProvider:false,connection:"disconnected",musicAccess:"unknown",owner:true};
 globalThis.fetch=async(_url,init)=>{
  if(init?.method==="PUT")current={...current,saved:true,connection:"unchecked",accountMessage:"Account request timed out.",musicMessage:"Music permissions were not tested."};
  return Response.json(current);
 };
 function Screen(){const access=api.useElevenLabsKey();return React.createElement(api.ElevenLabsSettingsPanel,{access,firstSong(){}});}
 try{
  await act(async()=>root.render(React.createElement(Screen)));
  const field=document.querySelector('input[name="apiKey"]');field.value=key;
  await act(async()=>field.form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true})));
  assert(document.body.textContent.includes(api.pendingKeyMessage));
  assert(!document.body.textContent.includes("ElevenLabs connected."));
  assert(document.body.textContent.includes("Check server reachability"));
  await act(async()=>root.render(React.createElement(api.ElevenLabsNetworkDiagnostic,{owner:false})));
  assert.equal(document.body.textContent,"");
 }finally{await act(async()=>root.unmount());Object.assign(globalThis,old);dom.window.close();}
});
test("owner diagnostic button calls only the app endpoint and presents the measured timings",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"}),calls=[];
 const old={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});
 globalThis.fetch=async(url,init)=>{calls.push({url,init});return Response.json({reachable:true,summary:"ElevenLabs answered; no key was sent.",requestId:"fixture-reference",timings:{dnsMs:3,connectionMs:10,tlsMs:12,responseMs:5,totalMs:30}});};
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root"));
 try{
  await act(async()=>root.render(React.createElement(api.ElevenLabsNetworkDiagnostic,{owner:true})));
  await act(async()=>document.querySelector("button").click());
  assert.equal(calls.length,1);assert.equal(calls[0].url,"/api/studio/elevenlabs/diagnostic");
  assert.equal(calls[0].init.method,"POST");assert.equal(calls[0].init.body,undefined);
  assert.match(document.body.textContent,/Address lookup3 ms/);
  assert.match(document.body.textContent,/Secure connection12 ms/);
  assert.match(document.body.textContent,/fixture-reference/);
 }finally{await act(async()=>root.unmount());Object.assign(globalThis,old);dom.window.close();}
});
