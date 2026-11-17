import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdirSync,readFileSync,readdirSync } from "node:fs";
import { fileURLToPath,pathToFileURL } from "node:url";
import path from "node:path";
import { sqliteD1 } from "./storage/sqlite-fixture.mjs";
import { copySongRows } from "./storage/song-rows.mjs";
const root=fileURLToPath(new URL("../",import.meta.url)),work=path.join(root,"work","song-rows-api");
mkdirSync(work,{recursive:true});
const db=sqliteD1();
for(const file of readdirSync(path.join(root,"drizzle")).filter(f=>f.endsWith(".sql")).sort())db.sql.exec(readFileSync(path.join(root,"drizzle",file),"utf8"));
globalThis.__songRowsEnv={DB:db,STUDIO_ROW_STORAGE:"verified"};
await build({stdin:{contents:'export * from "./app/api/studio/route";export {freshSong} from "./app/studio-data";',resolveDir:root,loader:"ts"},
  bundle:true,platform:"node",format:"esm",packages:"external",outfile:path.join(work,"route.mjs"),
  plugins:[{name:"isolated-song-row-api",setup(b){
    b.onResolve({filter:/cloudflare:workers|studio-access$|song-sharing$/},a=>({path:a.path,namespace:"fixture"}));
    b.onLoad({filter:/.*/,namespace:"fixture"},a=>({contents:a.path==="cloudflare:workers"?"export const env=globalThis.__songRowsEnv;":a.path.endsWith("studio-access")?'export async function privateWorkspace(){return {id:globalThis.__songRowsOwner??"owner",role:"owner"};}':"export async function revokeSongShare(){}",loader:"js"}));
  }}]});
const api=await import(pathToFileURL(path.join(work,"route.mjs")));
const source={songs:[api.freshSong("one","One",0),api.freshSong("two","Two",1)],templates:[]};
const raw=JSON.stringify(source);db.sql.prepare("INSERT INTO studios VALUES(?,?,?)").run("owner",raw,1);
await copySongRows(db,"owner");
const get=async()=>await(await api.GET()).json();
const put=body=>api.PUT(new Request("https://studio.test/api/studio",{method:"PUT",headers:{Origin:"https://studio.test","Content-Type":"application/json","X-Studio-Workspace":globalThis.__songRowsOwner??"owner"},body:JSON.stringify(body)}));
let checks=0;
function check(value){assert.ok(value);checks++;}
try{
  const a=await get(),b=await get();
  a.data.songs[0].notes.lyrics="First tab";
  check((await put(a)).status===200);
  b.data.songs[1].notes.lyrics="Second tab";
  const response=await put(b),saved=await response.json();
  check(response.status===200);
  check(saved.data.songs[0].notes.lyrics==="First tab"&&saved.data.songs[1].notes.lyrics==="Second tab");
  check(saved.data._storage.songs.one.revision===2&&saved.data._storage.songs.two.revision===2);
  b.data.songs[0].notes.lyrics="Stale edit";
  check((await put(b)).status===409);
  check(db.sql.prepare("SELECT content FROM studios").get().content===raw);
  const reopened=await get();
  check(reopened.data.songs[1].notes.lyrics==="Second tab");
  globalThis.__songRowsOwner="fresh-account";
  db.sql.exec(`CREATE TRIGGER forbid_new_bundle BEFORE INSERT ON studios BEGIN SELECT RAISE(ABORT,'legacy insert forbidden'); END;`);
  const empty=await get();
  check(empty.data===null&&empty.revision===0);
  empty.data={songs:[],templates:[]};
  empty.data.songs.push(api.freshSong("fresh-song","Fresh song",0));
  empty.data.songs[0].notes.lyrics="بداية جديدة / A new beginning";
  const freshResponse=await put(empty),freshSaved=await freshResponse.json();
  check(freshResponse.status===200);
  check(freshSaved.data.songs[0].notes.lyrics==="بداية جديدة / A new beginning");
  const freshAccount=db.sql.prepare("SELECT verified,comparison FROM studio_accounts WHERE owner=?").get("fresh-account");
  check(freshAccount.verified===1&&JSON.parse(freshAccount.comparison).mode==="empty-fresh-start");
  for(const table of ["studio_songs","studio_song_lyrics","studio_song_notes","studio_projects"])
    check(db.sql.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE owner=?`).get("fresh-account").n===1);
  check((await get()).data.songs[0].id==="fresh-song");
  check(db.sql.prepare("SELECT COUNT(*) AS n FROM studios").get().n===1);
  check(db.sql.prepare("SELECT content FROM studios WHERE owner=?").get("owner").content===raw);
  console.log(JSON.stringify({songRowApiChecks:checks,passed:checks,failed:0,scope:"actual GET/PUT and SQLite rows; no live storage or provider calls"}));
}finally{db.sql.close();}
