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
