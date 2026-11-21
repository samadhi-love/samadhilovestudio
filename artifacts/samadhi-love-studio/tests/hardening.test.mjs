import test from "node:test";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {build} from "esbuild";

const directory="generated-artifacts/tests/hardening";
mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`
export {rateLimited,resetRateLimits,limits} from "./app/server/rate-limit";
export {stemOutputFormat,stemFormats} from "./app/api/studio/elevenlabs/provider";
export {cspSummary,POST as cspReport} from "./app/api/studio/csp-report/route";
export {summarizeDeletedSongs,retentionPreview} from "./app/server/retention-preview";
export {falLyricRequest,falLyricModel,falLyricWriter} from "./app/server/fal-music";
export {falRequest} from "./app/server/ai-provider";
export {safetyHeaders,contentPolicy} from "./next.config";
export {default as nextConfig} from "./next.config";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/bundle.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"silent",plugins:[{name:"offline",setup(b){
  b.onResolve({filter:/^cloudflare:workers$/},()=>({path:"cf",namespace:"offline"}));
  b.onLoad({filter:/.*/,namespace:"offline"},()=>({contents:"export const env={};",loader:"js"}));
}}]});
const api=await import(`../${directory}/bundle.mjs`);

test("speed limits allow normal use, then slow one person down without affecting others",()=>{
  api.resetRateLimits();
  const now=1_000_000;
  for(let i=0;i<api.limits.stems.perMinute;i++)assert.equal(api.rateLimited("stems","ana",now+i),null);
  const blocked=api.rateLimited("stems","ana",now+10);
  assert.equal(blocked.status,429);
  assert.ok(Number(blocked.headers.get("Retry-After"))>0);
  assert.equal(api.rateLimited("stems","ben",now+10),null,"another person is not affected");
  assert.equal(api.rateLimited("upload","ana",now+10),null,"other actions are counted separately");
  assert.equal(api.rateLimited("stems","ana",now+61_000),null,"a minute later it works again");
});

test("speed-limit message is friendly and says nothing was lost",async()=>{
  api.resetRateLimits();
  for(let i=0;i<api.limits.stems.perMinute;i++)api.rateLimited("stems","cy",5);
  const body=await api.rateLimited("stems","cy",6).json();
  assert.equal(body.code,"rate-limited");assert.match(body.error,/Slow down/);assert.match(body.error,/Nothing was lost/);
});

test("hourly cap applies even when spread out",()=>{
  api.resetRateLimits();
  let t=0;for(let i=0;i<api.limits.stems.perHour;i++){assert.equal(api.rateLimited("stems","dee",t),null);t+=25_000;}
  assert.equal(api.rateLimited("stems","dee",t).status,429);
});

test("stems use 192k MP3 on Creator plans and above, 128k otherwise or when the check fails",async()=>{
  const original=globalThis.fetch;
  const plan=tier=>async()=>Response.json({tier,character_count:1,character_limit:10});
  try{
    for(const [tier,expected] of [["creator","mp3_44100_192"],["pro","mp3_44100_192"],["free","mp3_44100_128"],["starter","mp3_44100_128"]]){
      globalThis.fetch=plan(tier);assert.equal(await api.stemOutputFormat("key"),expected,tier);
    }
    globalThis.fetch=async()=>new Response("",{status:401});assert.equal(await api.stemOutputFormat("key"),"mp3_44100_128");
    globalThis.fetch=async()=>{throw new TypeError("offline");};assert.equal(await api.stemOutputFormat("key"),"mp3_44100_128");
  }finally{globalThis.fetch=original;}
});

test("lyric writer uses fal's supported router with a pinned model",()=>{
  assert.equal(api.falLyricModel,"openrouter/router");
  const body=api.falLyricRequest({description:"sunrise",singing:"",duration:90});
  assert.equal(body.model,api.falLyricWriter);assert.ok(body.system_prompt.includes("Return ONLY the lyrics"));
  assert.throws(()=>api.falRequest("k","/fal-ai/any-llm",{method:"POST"}),/Unexpected fal destination/,"retired endpoint is no longer reachable");
  assert.throws(()=>api.falRequest("k","/openrouter/router/other",{method:"POST"}),/Unexpected fal destination/);
});

test("safety headers: watch-only policy, no frame blocking, microphone kept",async()=>{
  const [rule]=await api.nextConfig.headers();
  assert.equal(rule.source,"/:path*");
  const names=rule.headers.map(h=>h.key);
  assert.ok(names.includes("Content-Security-Policy-Report-Only"));
  assert.ok(!names.includes("Content-Security-Policy"),"policy must not block yet");
  assert.ok(!names.includes("X-Frame-Options"),"Replit preview frames the app");
  assert.match(rule.headers.find(h=>h.key==="Permissions-Policy").value,/microphone=\(self\)/);
  assert.match(api.contentPolicy,/report-uri \/api\/studio\/csp-report/);
  assert.match(api.contentPolicy,/worker-src 'self' blob:/,"video export worker allowed");
});

test("content-policy reports keep only rule and host name",async()=>{
  assert.deepEqual(api.cspSummary({"csp-report":{"effective-directive":"img-src","blocked-uri":"https://evil.example/path?token=secret"}}),{directive:"img-src",blocked:"evil.example"});
  assert.deepEqual(api.cspSummary({"csp-report":{"violated-directive":"script-src 'self'","blocked-uri":"inline"}}),{directive:"script-src",blocked:"inline"});
  assert.equal(api.cspSummary("nope"),null);
  const reply=await api.cspReport(new Request("https://x.test/api/studio/csp-report",{method:"POST",body:JSON.stringify({"csp-report":{"effective-directive":"img-src","blocked-uri":"https://a.b/c"}})}));
  assert.equal(reply.status,204);
  const junk=await api.cspReport(new Request("https://x.test/api/studio/csp-report",{method:"POST",body:"not json"}));
  assert.equal(junk.status,204);
});

test("cleanup preview counts deleted songs past the 30-day grace period and deletes nothing",async()=>{
  const day=86_400_000,now=Date.UTC(2026,10,21);
  const iso=t=>new Date(t).toISOString();
  const rows=[
    {deleted_at:iso(now-40*day),delete_after:iso(now-10*day)},
    {deleted_at:iso(now-5*day),delete_after:iso(now+25*day)},
    {deleted_at:iso(now-40*day),delete_after:null},
    {deleted_at:null,delete_after:null},
  ];
  const summary=api.summarizeDeletedSongs(rows,now);
  assert.equal(summary.pastGrace,1);assert.equal(summary.restorable,2);assert.equal(summary.deletedSongs,3);
  assert.equal(summary.oldestPastGrace,iso(now-10*day));
  const sql=[];
  const DB={prepare(q){sql.push(q);return {bind:()=>({all:async()=>({results:rows})})};}};
  const preview=await api.retentionPreview(DB,now);
  assert.equal(preview.mode,"preview");assert.equal(preview.pastGrace,1);
  assert.ok(sql.every(q=>/^\s*SELECT/i.test(q)),"read-only");
  assert.equal(await api.retentionPreview({prepare(){throw new Error("busy");}},now),null);
});
