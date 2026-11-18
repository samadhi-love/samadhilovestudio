import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync,mkdirSync} from "node:fs";
import {build} from "esbuild";
import {sqliteD1} from "../scripts/storage/sqlite-fixture.mjs";
import {createExclusiveJob,recoverStaleJobs} from "../scripts/storage/jobs.mjs";
mkdirSync("generated-artifacts/tests",{recursive:true});
await build({entryPoints:["app/server/job-runner.ts"],outfile:"generated-artifacts/tests/job-runner.mjs",bundle:true,platform:"node",format:"esm",plugins:[{name:"offline-bindings",setup(b){
  b.onResolve({filter:/cloudflare:workers|\/api\/studio\/store$|\/credits\/production$/},a=>({path:a.path,namespace:"offline"}));
  b.onLoad({filter:/.*/,namespace:"offline"},a=>({contents:a.path==="cloudflare:workers"?"export const env=globalThis.__durable.env;":a.path.endsWith("/production")?"export const jobExecution=new WeakMap();":`export async function readStudio(){return {data:globalThis.__durable.data,revision:0};}export async function writeStudio(){return {revision:1};}`,loader:"js"}));
}}]});
globalThis.__durable={env:{},data:{songs:[]}};
const runner=await import("../generated-artifacts/tests/job-runner.mjs");
function fixture(){
  const db=sqliteD1();
  for(const f of readdirSync("drizzle").filter(f=>f.endsWith(".sql")).sort())db.sql.exec(readFileSync("drizzle/"+f,"utf8"));
  db.sql.prepare("INSERT INTO studio_songs(owner,id,revision,content,position) VALUES(?,?,?,?,?)").run("owner","song",1,"{}",0);
  const objects=new Map();
  Object.assign(globalThis.__durable.env,{DB:db,BUCKET:{async put(key,value){objects.set(key,String(value));return {};},async get(key){const value=objects.get(key);return value?{json:async()=>JSON.parse(value)}:null;}}});
  return {db,objects};
}
async function until(check){for(let i=0;i<100;i++){const result=await check();if(result)return result;await new Promise(r=>setTimeout(r,5));}throw new Error("Offline job did not settle.");}
test("queued work persists approved input, continues independently and completes once",async()=>{
  const {db,objects}=fixture();let calls=0;
  try{
    const source=new Request("https://studio.test/api/studio/jobs",{method:"POST",headers:{"X-Production-Id":"11111111-1111-4111-8111-111111111111",cookie:"private-cookie",authorization:"private-token"}});
    const work={route:"/api/studio/create",input:{action:"song",lyrics:"مرحبا love"},accepted:null};
    const execute=async request=>{calls++;assert.equal(request.headers.has("cookie"),false);assert.equal(request.headers.has("authorization"),false);return Response.json({songId:"song"});};
    const {id}=await runner.enqueueWork("owner","song",work,execute,source,"owner");
    await until(async()=>{const j=await runner.ownedJob("owner",id);return j?.status==="done"&&j;});
    assert.equal((await runner.enqueueWork("owner","song",work,execute,source,"owner")).id,id);
    assert.equal(calls,1);assert.equal(await runner.ownedJob("foreign",id),null);
    assert.ok([...objects.values()].some(v=>v.includes("مرحبا")));
    for(const text of objects.values())assert.doesNotMatch(text,/private-cookie|private-token/);
  }finally{db.sql.close();}
});
test("an ambiguous provider failure is recorded without automatic replay; writing input remains",async()=>{
  const {db}=fixture();let calls=0;
  try{
    const {id}=await runner.enqueueWork("owner","song",{route:"/api/studio/create",input:{action:"song",lyrics:"Saved words"},accepted:null},async()=>{calls++;throw new TypeError("fetch failed");},new Request("https://studio.test/api/studio/jobs"),"owner");
    const job=await until(async()=>{const j=await runner.ownedJob("owner",id);return j?.status==="failed"&&j;});
    assert.match(job.error_message,/could not be confirmed/);assert.equal(calls,1);
    assert.equal((await runner.readJobDocument("owner",id,"request")).input.lyrics,"Saved words");
  }finally{db.sql.close();}
});
test("startup reconciliation fails stale waiting/working work without replaying or touching recent work",async()=>{
  const {db}=fixture();
  try{
    for(const [id,status,at] of [["old-working","working",0],["old-waiting","waiting",0],["recent","working",1000000]]){
      db.sql.prepare("INSERT INTO studio_jobs(id,owner,type,status,created_at,updated_at,song_id) VALUES(?,?,?,?,?,?,?)").run(id,"owner","music-generation",status,at,at,"song");
    }
    await recoverStaleJobs(db,1000100,600000);
    const rows=db.sql.prepare("SELECT id,status FROM studio_jobs ORDER BY id").all();
    assert.deepEqual(rows.map(r=>[r.id,r.status]),[["old-waiting","failed"],["old-working","failed"],["recent","working"]]);
  }finally{db.sql.close();}
});
test("different request IDs cannot both claim the same song and processing type",async()=>{
  const {db}=fixture();
  try{
    const attempts=await Promise.allSettled(["job-one","job-two"].map(id=>createExclusiveJob(db,"owner",{id,type:"lyric-sync",songId:"song"})));
    assert.equal(attempts.filter(r=>r.status==="fulfilled").length,1);
    assert.equal(db.sql.prepare("SELECT count(*) AS total FROM studio_jobs").get().total,1);
  }finally{db.sql.close();}
});
test("only a failure before the provider was contacted is marked safe to retry",async()=>{
  const {db}=fixture();
  try{
    const work={route:"/api/studio/lyric-sync",input:{songId:"song",text:"Saved lines"},accepted:null};
    const {id,task}=await runner.enqueueWork("owner","song",work,async()=>Response.json({error:"Key missing"},{status:400}),new Request("https://studio.test/api/studio/jobs"),"owner");
    await task;
    assert.equal((await runner.ownedJob("owner",id)).status,"failed");
    assert.equal((await runner.readJobDocument("owner",id,"result")).retryable,true);
  }finally{db.sql.close();}
});

await build({entryPoints:["app/api/studio/jobs/route.ts","app/job-status.tsx"],outdir:"generated-artifacts/tests/retry-confirmation",outExtension:{".js":".mjs"},bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic",plugins:[{name:"offline-retry",setup(b){
  const mocks={
    "cloudflare:workers":"export const env=globalThis.__durable.env;",
    "../../../studio-access":"export async function privateWorkspace(){return {id:'owner',role:'owner'};}",
    "../store":"export const privateHeaders={};export async function readStudio(){return {data:globalThis.__durable.data};}",
    "../api/studio/store":"export {readStudio} from '../store';export async function writeStudio(){throw new Error('Unexpected draft write');}",
    "../create/route":"export const POST=request=>globalThis.__durable.execute(request);",
    "../lyric-sync/route":"export const POST=request=>globalThis.__durable.execute(request);",
    "../../../credits/account-ledger":"export const settleJob=(...args)=>globalThis.__durable.settlements.push(args);",
    "../../../credits/production":"export async function quoteProduction(){return {funding:'studio',enabled:true,credits:7};}",
    "../credits/production":"export const jobExecution=new WeakMap();",
    "vinext/shims/request-context":"export function getRequestExecutionContext(){return {waitUntil(task){globalThis.__durable.tasks.push(task);}};}",
    "./draft-recovery":"export const useRecoveryScope=()=> 'owner';",
  };
  b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:"retry-fixture"}:undefined);
  b.onLoad({filter:/.*/,namespace:"retry-fixture"},a=>({contents:mocks[a.path],loader:"js"}));
}}]});
const {POST:retryPost}=await import("../generated-artifacts/tests/retry-confirmation/api/studio/jobs/route.mjs");
for(const type of ["music-generation","lyric-sync"])test(`${type}: uncertainty requires consent, saved inputs and fresh credit approval; double submission cannot replay`,async()=>{
  const {db}=fixture();
  const state=globalThis.__durable;
  state.env.STUDIO_CREDITS_ENABLED="1";
  state.data={songs:[{id:"song",creationDraft:true}]};
  state.tasks=[];state.settlements=[];
  const calls=[];
  state.execute=async(request)=>{calls.push({body:await request.json(),id:request.headers.get("X-Production-Id"),accepted:request.headers.get("X-Studio-Credits-Accepted")});return Response.json({ok:true});};
  const input={action:"song",songId:"song",text:"نور",lyrics:"Saved lyrics",prompt:"Saved prompt"};
  const parent="old-attempt";
  const submit=(body)=>retryPost(new Request("https://studio.test/api/studio/jobs",{method:"POST",headers:{origin:"https://studio.test","X-Production-Id":crypto.randomUUID()},body:JSON.stringify({retry:parent,...body})}));
  try{
    db.sql.prepare("INSERT INTO studio_jobs(id,owner,type,status,created_at,updated_at,song_id,error_message) VALUES(?,?,?,?,?,?,?,?)").run(parent,"owner",type,"failed",0,0,"song","Interrupted");
    await runner.saveJobDocument("owner",parent,"request",{route:type==="music-generation"?"/api/studio/create":"/api/studio/lyric-sync",input,accepted:"3"});
    assert.equal((await submit({confirmChargeUncertain:true})).status,409);
    assert.equal((await submit({confirm:true})).status,409);
    const quote=await submit({confirm:true,confirmChargeUncertain:true,accepted:3});
    assert.equal(quote.status,402);assert.deepEqual(await quote.json(),{confirmCredits:7});
    assert.equal(calls.length,0);
    const results=await Promise.all([1,2].map(()=>submit({confirm:true,confirmChargeUncertain:true,accepted:7,input:{lyrics:"Do not use"}})));
    assert.deepEqual(results.map(r=>r.status).sort(),[202,409]);
    await Promise.all(state.tasks);
    assert.equal(calls.length,1);assert.deepEqual(calls[0].body,input);assert.equal(calls[0].accepted,"7");
    assert.notEqual(calls[0].id,parent);assert.deepEqual(state.settlements,[]);
  }finally{delete state.env.STUDIO_CREDITS_ENABLED;db.sql.close();}
});

test("Try again shows the uncertainty warning and canceling sends no retry request",async()=>{
  const {JSDOM}=await import("jsdom");
  const React=await import("react");
  const {createRoot}=await import("react-dom/client");
  const {JobStatus}=await import("../generated-artifacts/tests/retry-confirmation/job-status.mjs");
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  const original={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT,CustomEvent:globalThis.CustomEvent};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true,CustomEvent:dom.window.CustomEvent});
  const warnings=[],requests=[];
  let confirm=false;
  window.confirm=message=>{warnings.push(message);return confirm;};
  globalThis.fetch=async(_url,init)=>{
    if(init?.method==="POST"){requests.push(JSON.parse(init.body));return Response.json({jobId:"new"},{status:202});}
    return Response.json({jobs:[{id:"interrupted",type:"music-generation",status:"failed",error_message:"Charge uncertain"}]});
  };
  const root=createRoot(document.getElementById("root"));
  try{
    await React.act(async()=>root.render(React.createElement(JobStatus,{completed:()=>{}})));
    const button=document.querySelector("button");
    assert.equal(button?.textContent,"Try again");
    await React.act(async()=>button.click());
    assert.deepEqual(warnings,["This may use credits again, because the last attempt may have reached your music provider. Try again?"]);
    assert.deepEqual(requests,[]);
    confirm=true;
    await React.act(async()=>button.click());
    assert.deepEqual(requests,[{retry:"interrupted",confirm:true,confirmChargeUncertain:true}]);
  }finally{await React.act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,original);}
});
