import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {vmStorage,vmAI} from "./vm-server-helpers.mjs";
const root=fileURLToPath(new URL("../",import.meta.url));
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):/\.(ts|tsx)$/.test(entry.name)?[path.join(dir,entry.name)]:[]);}
test("only the shared server storage boundary imports Cloudflare bindings",()=>{
  const importers=[...files(path.join(root,"app")),...files(path.join(root,"db"))].filter(file=>readFileSync(file,"utf8").includes('from "cloudflare:workers"')||readFileSync(file,"utf8").includes('from"cloudflare:workers"'));
  assert.deepEqual(importers.map(file=>path.relative(root,file)),["app/server/storage.ts"]);
});
test("client screens and API routes do not contain provider/cloud storage endpoints",()=>{
  for(const file of files(path.join(root,"app"))){
    const source=readFileSync(file,"utf8");
    if(!file.endsWith("route.ts")&&!/^[\s]*["']use client["']/.test(source))continue;
    assert.doesNotMatch(source,/api\.elevenlabs\.io|api\.cloudflare\.com|r2\.cloudflarestorage\.com/,path.relative(root,file));
    if(/^[\s]*["']use client["']/.test(source))assert.doesNotMatch(source,/from ["'][^"']*server\/(?:storage|ai-provider)["']/);
  }
});
test("shared storage keeps request context, method binding and private conditional writes",async()=>{
  const calls=[],db={token:"fixture",prepare(query){assert.equal(this.token,"fixture");return{query};}};
  const bucket={async put(...args){calls.push(args);return{etag:"private"};}};
  const env={DB:db,BUCKET:bucket};
  const {serverStorage}=vmStorage(env);
  assert.equal(serverStorage.DB.prepare("SELECT ?").query,"SELECT ?");
  await serverStorage.BUCKET.put("private/song","bytes",{onlyIf:{etagDoesNotMatch:"*"}});
  assert.equal(calls[0][2].onlyIf.etagDoesNotMatch,"*");
  env.BUCKET=undefined;assert.equal(serverStorage.BUCKET,undefined);
});
test("one AI transport accepts explicit owner keys and rejects foreign destinations without requests",async()=>{
  const calls=[],api=vmAI(async(url,options)=>{calls.push({url,options});return new Response("fixture");});
  await api.providerRequest("owner-fixture-key","user/subscription",{method:"GET"});
  assert.equal(calls.length,1);assert.equal(calls[0].options.headers.get("xi-api-key"),"owner-fixture-key");
  assert.equal(calls[0].options.redirect,"manual");
  assert.throws(()=>api.elevenLabsTransport("https://foreign.test/v1/music"),/Unexpected/);
  assert.throws(()=>api.providerRequest("","music",{}),/your own/);
  assert.equal(calls.length,1);
  await api.providerMediaRequest("https://storage.googleapis.com/fixture/video.mp4");
  assert.equal(calls[1].options.headers,undefined);
  assert.throws(()=>api.providerMediaRequest("https://foreign.test/private"),/Unexpected/);
  assert.equal(calls.length,2);
});
test("fal transport never replays a paid POST and never sends a key to media URLs",async()=>{
  const calls=[],api=vmAI(async(url,options)=>{calls.push({url,options});return new Response("",{status:503});});
  assert.equal((await api.falRequest("offline-fixture","/fal-ai/ace-step-1.5",{method:"POST",body:"{}"})).status,503);
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.headers.get("Authorization"),"Key offline-fixture");
  assert.equal(calls[0].options.redirect,"manual");
  assert.throws(()=>api.falRequest("dummy","/fal-ai/ace-step-1.5/../../other"),/Unexpected/);
  assert.throws(()=>api.falMediaRequest("https://fal.media.evil.test/a"),/Unexpected/);
  assert.throws(()=>api.falMediaRequest("http://fal.media/a"),/Unexpected/);
  const media=vmAI(async(url,options)=>{assert.equal(options.headers,undefined);assert.equal(options.redirect,"manual");return new Response("fLaC");});
  await media.falMediaRequest("https://fal.media/test.flac");
});
