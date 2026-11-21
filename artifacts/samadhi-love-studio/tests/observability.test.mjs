import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";

const directory="generated-artifacts/tests/observability";
mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`
export {recoverableRoute} from "./app/api/studio/request-errors";
export {falRequest,elevenLabsTransport} from "./app/server/ai-provider";
export {withJob,withRequestContext,logEvent,traced} from "./app/server/request-context";
`,resolveDir:process.cwd(),loader:"ts"},bundle:true,platform:"node",format:"esm",packages:"external",outfile:`${directory}/api.mjs`,plugins:[{name:"offline",setup(b){
  b.onResolve({filter:/\/store$/},()=>({path:"store",namespace:"fake"}));
  b.onResolve({filter:/\/storage$/},()=>({path:"storage",namespace:"fake"}));
  b.onLoad({filter:/.*/,namespace:"fake"},a=>({loader:"js",contents:a.path==="storage"?"export const serverStorage={};":"export const privateHeaders={'Cache-Control':'private, no-store'};"}));
}}]});
const api=await import(`../${directory}/api.mjs`);

/** Captures structured log lines; every line must be one JSON object. */
async function captured(run){
  const lines=[],log=console.log,error=console.error;
  console.log=line=>lines.push(JSON.parse(line));console.error=line=>lines.push(JSON.parse(line));
  try{await run();}finally{console.log=log;console.error=error;}
  return lines;
}
const secret="KEY-sk_live_SECRET",lyric="my private lyric line";

test("every wrapped API request gets an ID header and one log line, reusing a safe browser ID",async()=>{
  const route=api.recoverableRoute(async request=>Response.json({ok:true,echo:(await request.text()).length}),"x");
  let response;
  const lines=await captured(async()=>{response=await route(new Request("http://s/api/studio/song-actions/0123456789abcdef0123",{method:"POST",body:lyric,headers:{"X-Studio-Request-Id":"browser-req-123"}}));});
  assert.equal(response.headers.get("X-Studio-Request-Id"),"browser-req-123");
  assert.equal(lines.length,1);
  assert.deepEqual({event:lines[0].event,requestId:lines[0].requestId,status:lines[0].status,method:lines[0].method,route:lines[0].route},
    {event:"api.request",requestId:"browser-req-123",status:200,method:"POST",route:"/api/studio/song-actions/:id"});
  assert.equal(typeof lines[0].ms,"number");
  const fresh=await route(new Request("http://s/api/studio",{headers:{"X-Studio-Request-Id":"bad id with spaces <script>"}}));
  assert.match(fresh.headers.get("X-Studio-Request-Id"),/^[0-9a-f-]{36}$/);
});

test("a crash returns the same request ID the logs show, without the private error text",async()=>{
  const route=api.recoverableRoute(async function createSong(){throw new Error(`${lyric} ${secret}`);},"Try again.");
  let response;
  const lines=await captured(async()=>{response=await route(new Request("http://s/api/studio/create",{method:"POST"}));});
  const body=await response.json();
  assert.equal(response.status,503);
  assert.equal(body.requestId,response.headers.get("X-Studio-Request-Id"));
  assert.deepEqual(lines.map(l=>[l.event,l.level,l.requestId]),[["api.failure","error",body.requestId],["api.request","error",body.requestId]]);
  assert.doesNotMatch(JSON.stringify(lines),/SECRET|private lyric/);
});

test("AI calls: paid submissions and failures are logged with timing and provider request ID; polls and keys are not",async()=>{
  const realFetch=globalThis.fetch;let next;
  globalThis.fetch=async()=>next();
  try{
    const lines=await captured(()=>api.withRequestContext({requestId:"req-1",route:"/api/studio/create"},()=>api.withJob("job-9",async()=>{
      next=()=>Response.json({request_id:"fal-abc-123"});
      assert.equal((await (await api.falRequest(secret,"/fal-ai/ace-step-1.5",{method:"POST",body:JSON.stringify({lyrics:lyric})})).json()).request_id,"fal-abc-123");
      next=()=>Response.json({status:"IN_PROGRESS"});
      await api.falRequest(secret,"/fal-ai/ace-step-1.5/requests/fal-abc-123/status");
      next=()=>new Response("{}",{status:422});
      await api.falRequest(secret,"/openrouter/router",{method:"POST",body:"{}"});
      next=()=>{throw Object.assign(new Error(lyric),{name:"TimeoutError"});};
      await assert.rejects(api.falRequest(secret,"/fal-ai/ace-step-1.5",{method:"POST",body:"{}"}));
      next=()=>new Response("{}",{status:200,headers:{"request-id":"el-777"}});
      await api.elevenLabsTransport("https://api.elevenlabs.io/v1/forced-alignment",{method:"POST",body:"x"});
    })));
    assert.deepEqual(lines.map(l=>[l.event,l.provider,l.step,l.ok,l.status,l.providerRequestId,l.errorType,l.requestId,l.jobId]),[
      ["provider.call","fal.ai","ace-step-1.5/submit",true,200,"fal-abc-123",undefined,"req-1","job-9"],
      ["provider.call","fal.ai","lyrics/submit",false,422,undefined,undefined,"req-1","job-9"],
      ["provider.call","fal.ai","ace-step-1.5/submit",false,undefined,undefined,"timeout","req-1","job-9"],
      ["provider.call","ElevenLabs","/v1/forced-alignment",true,200,"el-777",undefined,"req-1","job-9"],
    ]);
    assert.ok(lines.every(l=>typeof l.ms==="number"));
    assert.doesNotMatch(JSON.stringify(lines),/SECRET|private lyric|Authorization|xi-api-key/);
  }finally{globalThis.fetch=realFetch;}
});

test("captions never fall back to rough timing silently: the reason is shown and the server logs it",async()=>{
  const {readFileSync}=await import("node:fs");
  const client=readFileSync("app/lyric-video-pro.tsx","utf8"),server=readFileSync("app/api/studio/lyric-sync/route.ts","utf8");
  assert.doesNotMatch(client,/\brough\(\)/,"every rough-timing fallback must say why");
  assert.match(client,/rough\(\(error as Error\)\?\.message/,"a failed sync shows the server's reason");
  assert.match(client,/Precise sync didn't work: \$\{/);
  assert.match(server,/logEvent\("lyric-sync\.problem", \{ status, reason: error \}/);
  assert.match(server,/logEvent\("lyric-sync\.crash"/);
});

test("a route's own reference ID is kept and linked in the log, not overwritten",async()=>{
  const route=api.traced(async()=>Response.json({ok:true},{headers:{"X-Studio-Request-Id":"settings-check-42"}}));
  let response;
  const lines=await captured(async()=>{response=await route(new Request("http://s/api/studio/elevenlabs",{headers:{"X-Studio-Request-Id":"browser-req-123"}}));});
  assert.equal(response.headers.get("X-Studio-Request-Id"),"settings-check-42");
  assert.deepEqual([lines[0].requestId,lines[0].linkedRequestId],["browser-req-123","settings-check-42"]);
  const crash=api.traced(async()=>{throw new Error(lyric);});
  const failed=await captured(()=>assert.rejects(crash(new Request("http://s/api/radio"))));
  assert.deepEqual([failed[0].event,failed[0].status,failed[0].level],["api.request",500,"error"]);
  assert.doesNotMatch(JSON.stringify(failed),/private lyric/);
});

// ---- 30-day history, owner Status page and owner action log (real SQLite) ----
const {sqliteD1}=await import("../scripts/storage/sqlite-fixture.mjs");
const {readFileSync}=await import("node:fs");
globalThis.__obs={env:{}};
await build({stdin:{contents:`
export {recordEvent,setUpEventHistory,eventHistoryReady,persisted} from "./app/server/event-store";
export {ownerStatus,judge,percentile} from "./app/server/owner-status";
export {logEvent,ownerAction} from "./app/server/request-context";
`,resolveDir:process.cwd(),loader:"ts"},bundle:true,platform:"node",format:"esm",packages:"external",outfile:`${directory}/history.mjs`,plugins:[{name:"fake-storage",setup(b){
  b.onResolve({filter:/\/storage$/},()=>({path:"storage",namespace:"fake"}));
  b.onLoad({filter:/.*/,namespace:"fake"},()=>({loader:"js",contents:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__obs.env[k]});"}));
}}]});
const history=await import(`../${directory}/history.mjs`);
function database(){
  const DB=sqliteD1();
  // Same columns as drizzle/0009_background_jobs.sql (without the songs foreign key).
  DB.sql.exec(`CREATE TABLE studio_jobs (id TEXT PRIMARY KEY NOT NULL, owner TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'waiting',
    attempts INTEGER NOT NULL DEFAULT 0, error_message TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, started_at INTEGER, finished_at INTEGER, song_id TEXT NOT NULL)`);
  globalThis.__obs.env={DB,BUCKET:{async head(){return null;}}};
  return DB;
}

test("history: nothing is recorded (and nothing breaks) until the owner sets it up; then important events are kept",async()=>{
  database();
  assert.equal(await history.eventHistoryReady(),false);
  assert.equal(await history.recordEvent({event:"job.failed",level:"error",at:new Date().toISOString(),ms:5}),false);
  await history.setUpEventHistory();await history.setUpEventHistory(); // safe to repeat
  assert.equal(await history.eventHistoryReady(),true);
  assert.equal(await history.recordEvent({event:"provider.call",level:"info",at:new Date().toISOString(),ok:true,status:200,ms:900,provider:"fal.ai",step:"ace-step-1.5/submit",requestId:"r1",jobId:"j1"}),true);
  assert.equal(await history.recordEvent({event:"api.request",level:"info",status:200,at:new Date().toISOString()}),false,"ordinary requests stay in plain logs only");
  const row=await globalThis.__obs.env.DB.prepare("SELECT event,ok,status,ms,request_id,job_id,detail FROM studio_events").first();
  assert.deepEqual({...row,detail:JSON.parse(row.detail)},{event:"provider.call",ok:1,status:200,ms:900,request_id:"r1",job_id:"j1",detail:{provider:"fal.ai",step:"ace-step-1.5/submit"}});
});

test("the logger's save list and the history's save list are the same",()=>{
  const logger=readFileSync("app/server/request-context.ts","utf8").match(/const keep = (\/.*\/);/)[1];
  const store=readFileSync("app/server/event-store.ts","utf8").match(/return (\/\^\(job.*\)\$\/)\.test\(event\)/)[1];
  assert.equal(logger,store);
  for(const event of ["job.done","job.failed","job.unconfirmed","provider.call","caption.sync","lyric-sync.problem","lyric-sync.crash","api.failure","client.crash","owner.action"])assert.ok(history.persisted({event}),event);
  for(const event of ["job.start","api.request","something.else"])assert.ok(!history.persisted({event,status:200}),event);
});

test("Status page numbers: song success, 9-in-10 speed, caption precision, AI acceptance, errors and owner actions",async()=>{
  const DB=database();await history.setUpEventHistory();
  const now=Date.now(),min=60_000;
  const job=(id,status,ms,ago=min)=>DB.sql.prepare("INSERT INTO studio_jobs(id,owner,type,status,attempts,created_at,updated_at,started_at,finished_at,song_id) VALUES(?,?,?,?,0,?,?,?,?,?)")
    .run(id,"o","music-generation",status,now-ago,now-ago,now-ago,ms===null?null:now-ago+ms,"s"+id);
  for(let i=0;i<18;i++)job("d"+i,"done",60_000+i*1000);
  job("slow","done",400_000);job("f1","failed",5000);job("old","failed",5000,2*86_400_000);
  const at=new Date(now-min).toISOString();
  for(let i=0;i<9;i++)await history.recordEvent({event:"caption.sync",level:"info",at,ok:true});
  await history.recordEvent({event:"lyric-sync.problem",level:"info",at,status:422,reason:"The vocals could not be timed reliably."});
  await history.recordEvent({event:"lyric-sync.problem",level:"info",at,status:401,reason:"Sign in"}); // not a sync failure
  for(let i=0;i<19;i++)await history.recordEvent({event:"provider.call",level:"info",at,ok:true,ms:1000,provider:"fal.ai",step:"ace-step-1.5/submit"});
  await history.recordEvent({event:"provider.call",level:"error",at,ok:false,status:500,ms:200,provider:"fal.ai",step:"ace-step-1.5/submit",requestId:"req-err-1"});
  await history.recordEvent({event:"owner.action",level:"info",at,action:"music-engine.change",actor:"owner-1",engine:"ace-step",requestId:"req-own-1"});
  const status=await history.ownerStatus(now);
  const t=Object.fromEntries(status.targets.map(x=>[x.kind,x]));
  assert.equal(t.songSuccess.value,19/20);assert.equal(t.songSuccess.met,true);assert.equal(t.songSuccess.sample,20);
  assert.equal(t.songSpeed.value,77_000);assert.equal(t.songSpeed.met,true);
  assert.equal(t.captionPrecise.value,0.9);assert.equal(t.captionPrecise.met,true);
  assert.equal(t.aiSuccess.value,0.95);assert.equal(t.aiSuccess.met,true);
  assert.equal(t.serverErrors.value,1);assert.equal(t.serverErrors.met,true);
  assert.deepEqual(status.ai,[{provider:"fal.ai",step:"ace-step-1.5/submit",calls:20,ok:19,averageMs:960}]);
  assert.equal(status.errors[0].requestId,"req-err-1");
  assert.deepEqual([status.actions[0].action,status.actions[0].actor,status.actions[0].requestId,status.actions[0].detail],["music-engine.change","owner-1","req-own-1",{engine:"ace-step"}]);
  assert.equal(status.health.status,"ok");
});

test("Status works before history is set up, and with no data says so instead of guessing",async()=>{
  database();
  const status=await history.ownerStatus();
  assert.equal(status.historyReady,false);
  assert.ok(status.targets.every(t=>t.value===null||t.kind==="serverErrors"));
  assert.ok(status.targets.every(t=>t.met===null));
  assert.equal(history.judge("songSpeed",200_000),false);assert.equal(history.percentile([],0.9),null);
});

test("owner actions are recorded at the moment each one succeeds",()=>{
  const at=(file,action)=>assert.match(readFileSync(file,"utf8"),new RegExp(`ownerAction\\("${action.replace(/\./g,"\\.")}"`),`${file} records ${action}`);
  at("app/api/studio/music-engine/route.ts","music-engine.change");
  at("app/api/studio/recover-songs/route.ts","songs.recover");
  at("app/api/studio/credits/route.ts","credits.funding");
  at("app/api/studio/credits/route.ts","credits.assign-plan");
  at("app/api/studio/credits/route.ts","credits.refund-interrupted-job");
  at("app/api/studio/admin/route.ts","creator-account.update");
  at("app/api/studio/claim-owner/route.ts","owner.claim");
  at("app/api/studio/elevenlabs/route.ts","elevenlabs-key.save");
  at("app/api/studio/elevenlabs/route.ts","elevenlabs-key.remove");
  at("app/api/studio/admin/status/route.ts","event-history.setup");
});

test("a normal log call reaches the history by itself (no extra code at each call site)",async()=>{
  const DB=database();await history.setUpEventHistory();
  const log=console.log,error=console.error;console.log=()=>{};console.error=()=>{};
  try{history.ownerAction("songs.recover","owner-1",{role:"owner"});history.logEvent("job.start",{type:"music-generation"});}
  finally{console.log=log;console.error=error;}
  for(let i=0;i<50&&!(await DB.prepare("SELECT COUNT(*) AS n FROM studio_events").first()).n;i++)await new Promise(r=>setTimeout(r,10));
  const rows=(await DB.prepare("SELECT event,actor FROM studio_events").all()).results;
  assert.deepEqual(rows.map(r=>({...r})),[{event:"owner.action",actor:"owner-1"}],"job.start is not kept; the owner action is");
});

test("a route wrapped twice logs one line under one ID",async()=>{
  const inner=api.recoverableRoute(async()=>Response.json({ok:true}),"x");
  const outer=api.recoverableRoute(request=>inner(request),"y");
  let response;
  const lines=await captured(async()=>{response=await outer(new Request("http://s/api/studio/create",{method:"POST"}));});
  assert.equal(lines.length,1);
  assert.equal(lines[0].requestId,response.headers.get("X-Studio-Request-Id"));
  assert.equal(lines[0].linkedRequestId,undefined);
});
