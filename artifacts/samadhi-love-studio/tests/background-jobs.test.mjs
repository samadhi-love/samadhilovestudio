import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {sqliteD1} from "../scripts/storage/sqlite-fixture.mjs";
import {createJob,readJob,updateJob,listJobs} from "../scripts/storage/jobs.mjs";
function fixture(){
  const db=sqliteD1();db.sql.exec("PRAGMA foreign_keys=ON");
  for(const file of readdirSync(new URL("../drizzle/",import.meta.url)).filter(f=>f.endsWith(".sql")).sort())db.sql.exec(readFileSync(new URL("../drizzle/"+file,import.meta.url),"utf8"));
  db.sql.prepare("INSERT INTO studio_songs(owner,id,revision,content,position) VALUES(?,?,?,?,?)").run("owner","song",1,"{}",0);
  return db;
}
test("all three job types create durable waiting records with owner/song links and no processing",async()=>{
  const db=fixture();
  try{
    for(const [index,type] of ["music-generation","lyric-sync","video-render"].entries()){
      const {job,created}=await createJob(db,"owner",{id:"job-"+index,type,songId:"song"},100);
      assert.ok(created);assert.equal(job.status,"waiting");assert.equal(job.attempts,0);
      assert.equal(job.song_id,"song");assert.equal(job.created_at,100);assert.equal(job.error_message,null);
    }
    assert.equal((await listJobs(db,"owner")).length,3);
    assert.equal((await listJobs(db,"owner",{songId:"song",limit:1})).length,1);
  }finally{db.sql.close();}
});
test("only one worker can claim a job; successful completion preserves timestamps and attempt count",async()=>{
  const db=fixture();
  try{
    await createJob(db,"owner",{id:"job",type:"music-generation",songId:"song"},100);
    const outcomes=await Promise.allSettled([updateJob(db,"owner","job","waiting","working",{},200),updateJob(db,"owner","job","waiting","working",{},201)]);
    assert.equal(outcomes.filter(x=>x.status==="fulfilled").length,1);assert.equal(outcomes.filter(x=>x.status==="rejected").length,1);
    const job=await updateJob(db,"owner","job","working","done",{},300);
    assert.equal(job.attempts,1);assert.equal(job.finished_at,300);assert.equal(job.status,"done");
    await assert.rejects(updateJob(db,"owner","job","done","working"),/Invalid/);
  }finally{db.sql.close();}
});
test("failure needs an error, records it, and cannot be silently restarted",async()=>{
  const db=fixture();
  try{
    await createJob(db,"owner",{id:"job",type:"lyric-sync",songId:"song"});
    await updateJob(db,"owner","job","waiting","working");
    await assert.rejects(updateJob(db,"owner","job","working","failed"),/error is required/);
    const job=await updateJob(db,"owner","job","working","failed",{errorMessage:"Timing could not finish."});
    assert.equal(job.error_message,"Timing could not finish.");assert.equal(job.status,"failed");
    await assert.rejects(updateJob(db,"owner","job","failed","working"),/Invalid/);
  }finally{db.sql.close();}
});
test("jobs are owner-isolated, idempotent and reject foreign songs and unsupported types",async()=>{
  const db=fixture();
  try{
    const input={id:"job",type:"video-render",songId:"song"};
    assert.ok((await createJob(db,"owner",input)).created);
    assert.equal((await createJob(db,"owner",input)).created,false);
    assert.equal(await readJob(db,"someone-else","job"),null);
    assert.deepEqual(await listJobs(db,"someone-else"),[]);
    await assert.rejects(createJob(db,"someone-else",{...input,id:"foreign"}),/could not be created/);
    await assert.rejects(updateJob(db,"someone-else","job","waiting","working"),/unavailable/);
    await assert.rejects(createJob(db,"owner",{...input,type:"other"}),/supported/);
    await assert.rejects(createJob(db,"owner",{...input,type:"lyric-sync"}),/could not be created/);
  }finally{db.sql.close();}
});
