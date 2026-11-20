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
  b.onLoad({filter:/.*/,namespace:"fake"},()=>({loader:"js",contents:"export const privateHeaders={'Cache-Control':'private, no-store'};"}));
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
      await api.falRequest(secret,"/fal-ai/any-llm",{method:"POST",body:"{}"});
      next=()=>{throw Object.assign(new Error(lyric),{name:"TimeoutError"});};
      await assert.rejects(api.falRequest(secret,"/fal-ai/ace-step-1.5",{method:"POST",body:"{}"}));
      next=()=>new Response("{}",{status:200,headers:{"request-id":"el-777"}});
      await api.elevenLabsTransport("https://api.elevenlabs.io/v1/forced-alignment",{method:"POST",body:"x"});
    })));
    assert.deepEqual(lines.map(l=>[l.event,l.provider,l.step,l.ok,l.status,l.providerRequestId,l.errorType,l.requestId,l.jobId]),[
      ["provider.call","fal.ai","ace-step-1.5/submit",true,200,"fal-abc-123",undefined,"req-1","job-9"],
      ["provider.call","fal.ai","any-llm/submit",false,422,undefined,undefined,"req-1","job-9"],
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
