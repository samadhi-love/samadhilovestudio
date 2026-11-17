import test from "node:test";
import assert from "node:assert/strict";
import {retryRead,readOnlySql} from "../scripts/storage/retry.mjs";
import {vmAI,vmStorage} from "./vm-server-helpers.mjs";
import {probeHealth,restartRequired,supervise} from "../scripts/storage/supervisor.mjs";
import {EventEmitter} from "node:events";
import {readFileSync} from "node:fs";
import ts from "typescript";
import vm from "node:vm";
import {build} from "esbuild";
import {JSDOM} from "jsdom";
import React,{act} from "react";
import {createRoot} from "react-dom/client";
import {mkdirSync,readdirSync} from "node:fs";
test("every existing file picker declares accepted formats and the root safety net installs input checks",()=>{
  let pickers=0,forms=0;
  const root=new URL("../app/",import.meta.url);
  function walk(dir){
    for(const e of readdirSync(dir,{withFileTypes:true})){
      const path=new URL(e.name+(e.isDirectory()?"/":""),dir);
      if(e.isDirectory())walk(path);
      else if(e.name.endsWith(".tsx")){
        const source=ts.createSourceFile(path.pathname,readFileSync(path,"utf8"),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
        function visit(node){
          if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)){
            const attrs=node.attributes.properties;
            if(node.tagName.getText(source)==="input"&&attrs.find(a=>a.name?.text==="type")?.initializer?.text==="file"){
              pickers++;assert.ok(attrs.some(a=>a.name?.text==="accept"),path.pathname);
            }
            if(node.tagName.getText(source)==="form"){forms++;assert.ok(attrs.some(a=>["onSubmit","action"].includes(a.name?.text)),path.pathname);}
          }
          ts.forEachChild(node,visit);
        }visit(source);
      }
    }
  }walk(root);assert.ok(pickers>=27);assert.ok(forms>0);
  assert.match(readFileSync(new URL("../app/studio-error-boundary.tsx",import.meta.url),"utf8"),/installInputSafety\(\)/);
  console.log(JSON.stringify({filePickersWithAcceptedTypes:pickers,formsWithHandlers:forms}));
});
test("panel crashes leave siblings usable and Try again remounts only the failed panel",async()=>{
  const out=new URL("../work/self-healing/panel.mjs",import.meta.url);mkdirSync(new URL(".",out),{recursive:true});
  await build({entryPoints:[new URL("../app/panel-error-boundary.tsx",import.meta.url).pathname],outfile:out.pathname,bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic"});
  const {PanelErrorBoundary}=await import(out.href+"?test=panel");
  const dom=new JSDOM("<div id='root'></div>",{url:"https://studio.test"});
  const previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const root=createRoot(document.getElementById("root"));let crash=true,siblingMounts=0;
  function Broken(){if(crash)throw new Error("PRIVATE LYRICS");return React.createElement("span",null,"Recovered");}
  class Sibling extends React.Component{componentDidMount(){siblingMounts++;}render(){return React.createElement("button",null,"Navigation");}}
  const oldError=console.error,oldFetch=globalThis.fetch;console.error=()=>{};const posted=[];
  globalThis.fetch=async(_url,options)=>{posted.push(JSON.parse(options.body));return new Response("",{status:202});};
  try{
    await act(async()=>root.render(React.createElement(React.Fragment,null,React.createElement(Sibling),React.createElement(PanelErrorBoundary,{panel:"create"},React.createElement(Broken)))));
    assert.match(document.body.textContent,/Try again/);assert.match(document.body.textContent,/Navigation/);assert.doesNotMatch(document.body.textContent,/PRIVATE/);
    assert.equal(posted.length,1);assert.equal(posted[0].panel,"create");assert.equal(posted[0].action,"render");
    assert.doesNotMatch(JSON.stringify(posted),/PRIVATE|LYRICS|message|stack/);
    crash=false;await act(async()=>[...document.querySelectorAll("button")].find(b=>b.textContent==="Try again").click());
    assert.match(document.body.textContent,/Recovered/);assert.equal(siblingMounts,1);
  }finally{await act(async()=>root.unmount());console.error=oldError;globalThis.fetch=oldFetch;Object.assign(globalThis,previous);dom.window.close();}
});
test("main-server health is cheap, read-only, bounded and never exposes errors",async()=>{
  const source=readFileSync(new URL("../app/server/health.ts",import.meta.url),"utf8");
  const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  const exports={};vm.runInNewContext(outputText,{exports,setTimeout,clearTimeout});
  const calls=[];
  const env={DB:{prepare(sql){calls.push(sql);return{async first(){return{healthy:1};}};}},BUCKET:{async head(key){calls.push(key);return null;}}};
  assert.equal((await exports.checkHealth(env)).status,"ok");
  assert.deepEqual(calls,["SELECT 1 AS healthy","__studio_read_only_health_probe__"]);
  const failed=await exports.checkHealth({DB:{prepare(){throw new Error("PRIVATE KEY/LYRICS");}},BUCKET:env.BUCKET});
  assert.equal(failed.status,"unavailable");assert.doesNotMatch(JSON.stringify(failed),/PRIVATE/);
  const bounded=await exports.checkHealth({DB:{prepare(){return{first:()=>new Promise(()=>{})};}},BUCKET:env.BUCKET},5);
  assert.equal(bounded.status,"unavailable");
  assert.equal(await probeHealth("http://fixture/health",async()=>Response.json({status:"ok"})),true);
  assert.equal(await probeHealth("http://fixture/health",async()=>new Response("",{status:503})),false);
  assert.equal(restartRequired(3,90000),true);assert.equal(restartRequired(2,90000),false);assert.equal(restartRequired(3,1000),false);
});
test("production supervisor restarts an unresponsive child and stops at its bounded restart budget",async()=>{
  let starts=0,stops=0;const oldError=console.error,oldExit=process.exitCode;
  console.error=()=>{};
  try{
    await supervise("fixture-server",{port:"19559",intervalMs:2,graceMs:0,restartPauseMs:1,killAfterMs:5,
      probe:async()=>false,spawnChild(_command,args){
        starts++;assert.equal(args[1],"--studio-server-child");
        const child=new EventEmitter();child.killed=false;
        child.kill=()=>{if(!child.killed){stops++;child.killed=true;queueMicrotask(()=>child.emit("exit",0));}return true;};
        return child;
      }});
    assert.equal(starts,4);assert.equal(stops,4);assert.equal(process.exitCode,1);
  }finally{console.error=oldError;process.exitCode=oldExit;}
});
test("diagnostic endpoint accepts only private-safe metadata and rejects unauthenticated, oversized or injected reports",async()=>{
  const out=new URL("../work/self-healing/diagnostic.mjs",import.meta.url);
  mkdirSync(new URL(".",out),{recursive:true});
  await build({entryPoints:[new URL("../app/api/studio/client-errors/route.ts",import.meta.url).pathname],outfile:out.pathname,bundle:true,platform:"node",format:"esm",packages:"external",plugins:[{name:"diagnostic-fixtures",setup(b){
    b.onResolve({filter:/studio-access$/},()=>({path:"access",namespace:"fixture"}));
    b.onResolve({filter:/\/store$|^\.\/store$/},a=>a.importer.endsWith("request-errors.ts")?({path:"store",namespace:"fixture"}):undefined);
    b.onLoad({filter:/.*/,namespace:"fixture"},a=>({contents:a.path==="access"?'export async function privateWorkspace(){return globalThis.__diagnosticAccess;}':'export const privateHeaders={"Cache-Control":"private, no-store"};',loader:"js"}));
  }}]});
  const api=await import(out.href),logs=[],oldError=console.error;
  const payload={panel:"video-timeline",action:"render",errorType:"TypeError",occurredAt:new Date().toISOString(),requestId:crypto.randomUUID()};
  const request=(body,origin="https://studio.test")=>new Request("https://studio.test/api/studio/client-errors",{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(body)});
  console.error=(...args)=>logs.push(args);
  try{
    globalThis.__diagnosticAccess=null;assert.equal((await api.POST(request(payload))).status,401);
    globalThis.__diagnosticAccess={id:"fixture",role:"owner"};
    assert.equal((await api.POST(request(payload,"https://foreign.test"))).status,403);
    assert.equal((await api.POST(request({...payload,lyrics:"PRIVATE"}))).status,400);
    assert.equal((await api.POST(request({...payload,panel:"PRIVATE LYRICS"}))).status,400);
    assert.equal((await api.POST(request({...payload,extra:"x".repeat(3000)}))).status,413);
    const response=await api.POST(request(payload));assert.equal(response.status,202);
    assert.equal(response.headers.get("X-Studio-Request-Id"),payload.requestId);
    assert.equal(logs.length,1);assert.doesNotMatch(JSON.stringify(logs),/PRIVATE|fixture|lyrics|password|stack|message/i);
    for(let i=0;i<19;i++)await api.POST(request({...payload,requestId:crypto.randomUUID()}));
    assert.equal((await api.POST(request(payload))).status,429);
  }finally{console.error=oldError;delete globalThis.__diagnosticAccess;}
});
test("upload/form guard rejects wrong types, empty/oversized files and whitespace-only required fields before handlers",async()=>{
  const {outputText}=ts.transpileModule(readFileSync(new URL("../app/input-safety.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
  const exports={};vm.runInNewContext(outputText,{exports});
  const file=(name,type,size)=>({name,type,size});
  assert.match(exports.pickedFileProblem(file("empty.png","image/png",0),"image/png"),/empty/);
  assert.match(exports.pickedFileProblem(file("bad.exe","application/octet-stream",10),".mp3,.wav"),/not supported/);
  for(const[name,type,size,accept]of [["photo.png","image/png",16,"image/png"],["song.mp3","audio/mpeg",97,"audio/*"],["clip.mp4","video/mp4",121,"video/*"],["project.json","application/json",6,".json"],["notes.mid","audio/midi",3,".mid"]])
    assert.match(exports.pickedFileProblem(file(name,type,size*1024*1024),accept),/too large/);
  assert.equal(exports.pickedFileProblem(file("صوت.mp3","",10),".mp3"),null);
  assert.equal(exports.pickedFileProblem(file("take.webm","audio/webm;codecs=opus",10),"audio/*"),null);
  const dom=new JSDOM('<form><input name="title" required value="   "><input name="audio" type="file" accept=".mp3"></form>');
  const doc=dom.window.document,form=doc.querySelector("form"),title=doc.querySelector('[name="title"]'),audio=doc.querySelector('[name="audio"]');
  let handled=0;form.addEventListener("submit",()=>handled++);audio.addEventListener("change",()=>handled++);
  const remove=exports.installInputSafety(doc);
  form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
  assert.equal(handled,0);assert.match(title.validationMessage,/fill in/);
  title.value="A title";title.dispatchEvent(new dom.window.Event("input",{bubbles:true}));
  form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));assert.equal(handled,1);
  Object.defineProperty(audio,"files",{configurable:true,value:[new dom.window.File([],"empty.mp3",{type:"audio/mpeg"})]});
  audio.dispatchEvent(new dom.window.Event("change",{bubbles:true,cancelable:true}));assert.equal(handled,1);assert.match(audio.validationMessage,/empty/);
  remove();dom.window.close();
});
test("temporary read failures retry twice with growing waits; permanent failures never retry",async()=>{
  const waits=[];let calls=0;
  assert.equal(await retryRead(async()=>{if(++calls<3)throw Object.assign(new Error(),{status:503});return "ok";},{sleep:async ms=>waits.push(ms)}),"ok");
  assert.deepEqual(waits,[1000,3000]);assert.equal(calls,3);
  for(const status of [400,401,402,403,404,422]){
    let count=0;await assert.rejects(retryRead(async()=>{count++;throw Object.assign(new Error(),{status});},{sleep:async()=>{}}));
    assert.equal(count,1);
  }
  for(const error of [Object.assign(new Error(),{name:"TimeoutError"}),new TypeError("fetch failed"),Object.assign(new Error(),{code:"ECONNRESET"})]){
    let count=0;await assert.rejects(retryRead(async()=>{count++;throw error;},{sleep:async()=>{}}));assert.equal(count,3);
  }
});
test("the real shared AI/storage read wrappers retry but an UPDATE remains single-attempt",async()=>{
  let aiCalls=0,dbCalls=0,mediaCalls=0,writes=0;
  const api=vmAI(async()=>new Response("",{status:++aiCalls===1?503:200}));
  const statement={bind(){return this;},async first(){if(++dbCalls===1)throw Object.assign(new Error(),{status:503});return{ok:true};},async run(){writes++;throw Object.assign(new Error(),{status:503});}};
  const {serverStorage}=vmStorage({DB:{prepare(){return statement;}},BUCKET:{async head(){if(++mediaCalls===1)throw Object.assign(new Error(),{status:429});return null;}}});
  await Promise.all([api.providerRequest("fixture","user",{method:"GET"}),serverStorage.DB.prepare("SELECT 1").bind().first(),serverStorage.BUCKET.head("fixture")]);
  assert.equal(aiCalls,2);assert.equal(dbCalls,2);assert.equal(mediaCalls,2);
  await assert.rejects(serverStorage.DB.prepare("UPDATE studios SET revision=1").run());assert.equal(writes,1);
});
test("429/5xx reads retry; depleted-credit 429 and cancellation do not",async()=>{
  for(const status of [429,500,502,503,504]){
    let calls=0;await retryRead(async()=>new Response("",{status:++calls<3?status:200}),{sleep:async()=>{}});assert.equal(calls,3);
  }
  let calls=0;const response=await retryRead(async()=>{calls++;return Response.json({detail:{status:"quota_exceeded"}},{status:429});},{sleep:async()=>{}});
  assert.equal(response.status,429);assert.equal(calls,1);
  const controller=new AbortController();controller.abort();
  await assert.rejects(retryRead(()=>{throw new Error("must not send");},{signal:controller.signal}));
});
test("AI POST processing and storage writes are never automatically replayed",async()=>{
  let calls=0;const api=vmAI(async()=>{calls++;return new Response("",{status:503});});
  await api.providerRequest("fixture","music",{method:"POST",body:"{}"});assert.equal(calls,1);
  await api.elevenLabsTransport({url:"https://api.elevenlabs.io/v1/music",method:"POST"});
  assert.equal(calls,2,"foreign Request wrappers must not become retryable GETs");
  let writes=0;const {serverStorage}=vmStorage({DB:{async batch(){writes++;throw Object.assign(new Error(),{status:503});}},BUCKET:{async put(){writes++;throw Object.assign(new Error(),{status:503});}}});
  await assert.rejects(serverStorage.DB.batch([]));await assert.rejects(serverStorage.BUCKET.put("key","bytes"));assert.equal(writes,2);
  assert.equal(readOnlySql("SELECT 1"),true);assert.equal(readOnlySql("SELECT 1; DELETE FROM studios"),false);assert.equal(readOnlySql("UPDATE studios SET revision=1"),false);
});
