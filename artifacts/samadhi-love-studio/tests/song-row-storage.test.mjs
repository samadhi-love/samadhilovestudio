import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync,readdirSync } from "node:fs";
import { copySongRows,readSongRows,writeSongRows,rebaseUnchanged } from "../scripts/storage/song-rows.mjs";
test("a new account saves directly into verified per-song rows without a legacy bundle",async()=>{
  const {db,source,raw}=fixture();
  try{
    db.sql.exec(`CREATE TRIGGER forbid_legacy_insert BEFORE INSERT ON studios BEGIN SELECT RAISE(ABORT,'legacy insert forbidden'); END;
      CREATE TRIGGER forbid_legacy_update BEFORE UPDATE ON studios BEGIN SELECT RAISE(ABORT,'legacy update forbidden'); END;
      CREATE TRIGGER forbid_legacy_delete BEFORE DELETE ON studios BEGIN SELECT RAISE(ABORT,'legacy delete forbidden'); END;`);
    assert.deepEqual(await readSongRows(db,"brand-new"),{data:null,revision:0});
    const fresh=structuredClone(source.songs[0]);fresh.id="fresh";fresh.notes.lyrics="مرحبا / A fresh start";
    const input={songs:[fresh],templates:[]};
    const saved=await writeSongRows(db,"brand-new",JSON.stringify(input));
    assert.equal(saved.data.songs[0].notes.lyrics,"مرحبا / A fresh start");
    const account=db.sql.prepare("SELECT verified,comparison FROM studio_accounts WHERE owner=?").get("brand-new");
    assert.equal(account.verified,1);
    const receipt=JSON.parse(account.comparison);
    assert.equal(receipt.mode,"empty-fresh-start");assert.equal(receipt.songCount,0);
    for(const table of ["studio_songs","studio_song_lyrics","studio_song_notes","studio_projects"])
      assert.equal(db.sql.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE owner=?`).get("brand-new").count,1);
    saved.data.songs[0].notes.lyrics="An edited fresh song";
    await writeSongRows(db,"brand-new",JSON.stringify(saved.data));
    assert.equal((await readSongRows(db,"brand-new")).data.songs[0].notes.lyrics,"An edited fresh song");
    assert.equal(db.sql.prepare("SELECT COUNT(*) AS count FROM studios").get().count,1);
    assert.equal(db.sql.prepare("SELECT content FROM studios WHERE owner=?").get("owner").content,raw);
  }finally{db.sql.close();}
});
test("first save never silently copies an existing legacy bundle",async()=>{
  const {db,source}=fixture();
  try{
    const raw=JSON.stringify(source);
    db.sql.prepare("INSERT INTO studios VALUES(?,?,?)").run("legacy-owner",raw,1);
    await assert.rejects(writeSongRows(db,"legacy-owner",JSON.stringify({songs:[],templates:[]})),/explicit verified per-song data copy/);
    assert.equal(db.sql.prepare("SELECT content FROM studios WHERE owner=?").get("legacy-owner").content,raw);
    assert.equal(db.sql.prepare("SELECT COUNT(*) AS count FROM studio_accounts").get().count,0);
  }finally{db.sql.close();}
});
import { sqliteD1 } from "../scripts/storage/sqlite-fixture.mjs";
function fixture(){
  const db=sqliteD1();
  for(const file of readdirSync(new URL("../drizzle/",import.meta.url)).filter(f=>f.endsWith(".sql")).sort())db.sql.exec(readFileSync(new URL("../drizzle/"+file,import.meta.url),"utf8"));
  const songs=["one","two"].map(id=>({id,name:id,notes:{lyrics:"يا نور / Hello\n[Chorus]\nAgain",prompt:"Warm rap, Arabic and English",vocals:"soft"},versions:{lyrics:[],prompt:[]},audioId:id+"-audio",audioHistory:[{audioId:id+"-old"}],lyricVideo:{sourceVideoAsset:id+"-video"},coverAsset:id+"-cover",stage:"Idea",done:[false],releaseDate:""}));
  const source={songs,templates:[{id:"saved-prompt",notes:{prompt:"Original"}}],extension:{keep:"all fields"}};
  const raw=JSON.stringify(source);
  db.sql.prepare("INSERT INTO studios VALUES(?,?,?)").run("owner",raw,7);
  return {db,source,raw};
}
test("copy compares counts, exact multilingual lyrics, prompts, all fields/media keys; repeat is safe and backup freezes",async()=>{
  const {db,source,raw}=fixture();
  try{
    await assert.rejects(readSongRows(db,"owner"),/verified per-song data copy/);
    const report=await copySongRows(db,"owner");assert.equal(report.songCount,2);assert.ok(Object.values(report.checks).every(Boolean));
    const {data}=await readSongRows(db,"owner");const{_storage,...copied}=data;assert.deepEqual(copied,source);
    assert.equal((await copySongRows(db,"owner")).alreadyVerified,true);
    assert.equal(db.sql.prepare("SELECT content FROM studios").get().content,raw);
    assert.throws(()=>db.sql.prepare("UPDATE studios SET revision=8").run(),/read-only/);
    assert.equal(db.sql.prepare("SELECT count(*) n FROM studio_projects").get().n,2);
  }finally{db.sql.close();}
});
test("different songs from two stale tabs save independently; same song conflicts without overwriting",async()=>{
  const {db,raw}=fixture();
  try{
    await copySongRows(db,"owner");const a=await readSongRows(db,"owner"),b=await readSongRows(db,"owner");
    a.data.songs[0].notes.lyrics="First tab";b.data.songs[1].notes.lyrics="Second tab";
    assert.ok(await writeSongRows(db,"owner",JSON.stringify(a.data)));
    assert.ok(await writeSongRows(db,"owner",JSON.stringify(b.data)));
    let current=await readSongRows(db,"owner");assert.deepEqual(current.data.songs.map(s=>s.notes.lyrics),["First tab","Second tab"]);
    b.data.songs[0].notes.lyrics="stale overwrite";assert.equal(await writeSongRows(db,"owner",JSON.stringify(b.data)),undefined);
    current=await readSongRows(db,"owner");assert.equal(current.data.songs[0].notes.lyrics,"First tab");
    assert.equal(JSON.parse(db.sql.prepare("SELECT value FROM studio_catalog_songs WHERE owner=? AND id=?").get("owner","one").value).notes.lyrics,"First tab");
    assert.equal(db.sql.prepare("SELECT content FROM studios").get().content,raw);
    assert.equal((await copySongRows(db,"owner")).alreadyVerified,true);
  }finally{db.sql.close();}
});
test("copy mismatch cannot activate reads and never changes original data",async()=>{
  const {db,raw}=fixture();
  try{
    db.sql.prepare("INSERT INTO studio_accounts(owner,revision,settings,source_hash) VALUES(?,?,?,?)").run("owner",7,'{"templates":[]}',"wrong");
    await assert.rejects(copySongRows(db,"owner"),/comparison failed/);
    await assert.rejects(readSongRows(db,"owner"),/has not passed/);
    assert.equal(db.sql.prepare("SELECT content FROM studios").get().content,raw);
    assert.equal(db.sql.prepare("SELECT verified FROM studio_accounts").get().verified,0);
  }finally{db.sql.close();}
});
test("rebase keeps unrelated changes, settings and new songs from other tabs without hiding an edited-song conflict",async()=>{
  const {db}=fixture();
  try{
    await copySongRows(db,"owner");const first=await readSongRows(db,"owner"),stale=await readSongRows(db,"owner");
    first.data.songs[0].name="Other tab";first.data.extension={keep:"changed"};
    await writeSongRows(db,"owner",JSON.stringify(first.data));
    stale.data.songs[1].name="My edit";
    const input=await rebaseUnchanged(stale.data,(await readSongRows(db,"owner")).data);
    assert.equal(input.songs[0].name,"Other tab");assert.deepEqual(input.extension,{keep:"changed"});
    assert.ok(await writeSongRows(db,"owner",JSON.stringify(input)));
  }finally{db.sql.close();}
});
test("an account larger than the old bundle cap saves with song-sized independent records",async()=>{
  const {db}=fixture();
  try{
    await copySongRows(db,"owner");const {data}=await readSongRows(db,"owner");
    data.songs.forEach(song=>song.notes.lyrics="a".repeat(800_000));
    assert.ok(await writeSongRows(db,"owner",JSON.stringify(data)));
    assert.equal((await readSongRows(db,"owner")).data.songs[1].notes.lyrics.length,800_000);
  }finally{db.sql.close();}
});
