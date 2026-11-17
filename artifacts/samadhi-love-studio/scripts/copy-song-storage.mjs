import { readFile } from "node:fs/promises";
import { D1Http } from "./storage/d1.mjs";
import { runtimeConfig } from "./storage/runtime.mjs";
import { copySongRows } from "./storage/song-rows.mjs";
import { sqliteD1 } from "./storage/sqlite-fixture.mjs";

// Explicit, additive operation, never a startup hook. No credentials are logged.
// Live mode requires resource identity confirmation in addition to env secrets.
const args=process.argv.slice(2);
const local=args.indexOf("--local");
let db;
if(local>=0){
  const path=args[local+1];
  if(!path||path.startsWith("--"))throw new Error("Supply the exact local emulated SQLite path after --local.");
  db=sqliteD1(path);
}else{
  if(!args.includes("--live")||process.env.STUDIO_APPROVE_SONG_COPY!=="yes")
    throw new Error("No database changed. Choose --local <SQLite path>, or explicitly approve --live using STUDIO_APPROVE_SONG_COPY=yes.");
  const config=runtimeConfig({...process.env,PORT:process.env.PORT??"3000"});
  if(process.env.STUDIO_CONFIRM_COPY_DATABASE_ID!==config.databaseId)
    throw new Error("STUDIO_CONFIRM_COPY_DATABASE_ID must match the configured D1 database. No database changed.");
  db=new D1Http(config);
}
try{
  for(const file of ["0008_independent_song_storage.sql","0009_background_jobs.sql"]){
    const schema=await readFile(new URL("../drizzle/"+file,import.meta.url),"utf8");
    for(const statement of schema.split("--> statement-breakpoint").map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
  }
  const owners=(await db.prepare("SELECT owner FROM studios ORDER BY owner").all()).results;
  const totals={accounts:0,songs:0,failed:0,checks:{songCounts:true,lyrics:true,promptsAndNotes:true,allFieldsAndMediaKeys:true}};
  for(const {owner} of owners){
    try{
      const report=await copySongRows(db,owner);
      totals.accounts++;totals.songs+=report.songCount;
      for(const key of Object.keys(totals.checks))totals.checks[key]&&=report.checks[key];
    }catch{totals.failed++;} // do not expose account IDs, lyrics, or media keys
  }
  console.log(JSON.stringify({scope:local>=0?"local emulation":"explicitly approved live D1",...totals,oldBundles:"unchanged; read-only after verified comparison",r2Checkpoints:"not accessed or modified"},null,2));
  if(totals.failed)process.exitCode=1;
}finally{db.sql?.close();}
