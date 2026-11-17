// Pure D1 repository used by the server and explicit migration command.
// Never performs network calls itself, deletes rows, or changes legacy bundles.
const projectFields = ["stage","done","releaseDate","projectId","master","releaseMetadata"];
const encode = value => JSON.stringify(value);
export function canonical(value) {
  if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
  if(value&&typeof value==="object")return `{${Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
export async function digest(value) {
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(value)));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
}
const stmt = (db,sql,...params) => db.prepare(sql).bind(...params);
const all = async statement => (await statement.all()).results;
// Before server validation/stamping, replace stale untouched records with their
// current value. Otherwise a timestamp-only normalization could turn an
// untouched song into a conflicting write.
export async function rebaseUnchanged(input,current) {
  if(!input._storage||!current?._storage)return input;
  const baseline=structuredClone(input._storage),latest=new Map(current.songs.map(song=>[song.id,song]));
  const songs=[];
  for(const song of input.songs){
    if(baseline.songs[song.id]?.hash===await digest(song)&&latest.has(song.id)){
      songs.push(latest.get(song.id));baseline.songs[song.id]=current._storage.songs[song.id];
    }else songs.push(song);
  }
  for(const song of current.songs)if(!input._storage.songs[song.id]&&!songs.some(item=>item.id===song.id)){
    songs.push(song);baseline.songs[song.id]=current._storage.songs[song.id];
  }
  if(await digest(settingsOf(input))===baseline.settings.hash){
    baseline.settings=current._storage.settings;
    return {...settingsOf(current),songs,_storage:baseline};
  }
  return {...input,songs,_storage:baseline};
}
function settingsOf(value) {
  const {songs,_storage,...settings}=value;
  return settings;
}
function splitSong(song) {
  const {notes,versions,...core}=song;
  const {lyrics,...otherNotes}=notes;
  const {lyrics:lyricVersions,prompt,...otherVersions}=versions;
  const project={};
  for(const key of projectFields)if(Object.hasOwn(core,key)){project[key]=core[key];delete core[key];}
  return {core:{...core,versions:otherVersions},lyrics,lyricVersions,notes:otherNotes,prompt,project};
}
function songStatements(db,owner,song,revision,position,insertOnly=false) {
  const part=splitSong(song);
  const conflict=insertOnly?"DO NOTHING":"DO UPDATE SET revision=excluded.revision,content=excluded.content,removed=0";
  const relatedConflict=insertOnly?"DO NOTHING":null;
  return [
    stmt(db,`INSERT INTO studio_songs(owner,id,revision,content,position) VALUES(?,?,?,?,?) ON CONFLICT(owner,id) ${conflict}`,owner,song.id,revision,encode(part.core),position),
    stmt(db,`INSERT INTO studio_song_lyrics(owner,song_id,lyrics,versions) VALUES(?,?,?,?) ON CONFLICT(owner,song_id) ${relatedConflict??"DO UPDATE SET lyrics=excluded.lyrics,versions=excluded.versions"}`,owner,song.id,part.lyrics,encode(part.lyricVersions)),
    stmt(db,`INSERT INTO studio_song_notes(owner,song_id,content,prompt_versions) VALUES(?,?,?,?) ON CONFLICT(owner,song_id) ${relatedConflict??"DO UPDATE SET content=excluded.content,prompt_versions=excluded.prompt_versions"}`,owner,song.id,encode(part.notes),encode(part.prompt)),
    stmt(db,`INSERT INTO studio_projects(owner,id,parent_id,content) VALUES(?,?,?,?) ON CONFLICT(owner,id) ${relatedConflict??"DO UPDATE SET parent_id=excluded.parent_id,content=excluded.content"}`,owner,song.id,song.projectId??null,encode(part.project)),
  ];
}
async function joinedRows(db,owner) {
  return all(stmt(db,`SELECT s.*,l.lyrics,l.versions AS lyric_versions,n.content AS notes,n.prompt_versions,p.content AS project
    FROM studio_songs s JOIN studio_song_lyrics l ON l.owner=s.owner AND l.song_id=s.id
    JOIN studio_song_notes n ON n.owner=s.owner AND n.song_id=s.id
    JOIN studio_projects p ON p.owner=s.owner AND p.id=s.id
    WHERE s.owner=? AND s.removed=0 ORDER BY s.position,s.id`,owner));
}
function joinSong(row) {
  const {versions,...core}=JSON.parse(row.content);
  return {...core,...JSON.parse(row.project),notes:{...JSON.parse(row.notes),lyrics:row.lyrics},
    versions:{...versions,lyrics:JSON.parse(row.lyric_versions),prompt:JSON.parse(row.prompt_versions)}};
}
async function hydrate(db,owner,account) {
  const rows=await joinedRows(db,owner);
  const songs=rows.map(joinSong);
  const metadata={songs:Object.create(null),settings:{revision:account.settings_revision,hash:await digest(JSON.parse(account.settings))}};
  for(let i=0;i<rows.length;i++)metadata.songs[rows[i].id]={revision:rows[i].revision,hash:await digest(songs[i])};
  return {data:{...JSON.parse(account.settings),songs,_storage:metadata},revision:account.revision};
}
export async function readSongRows(db,owner) {
  const account=await stmt(db,"SELECT * FROM studio_accounts WHERE owner=?",owner).first();
  if(!account){
    const legacy=await stmt(db,"SELECT owner FROM studios WHERE owner=?",owner).first();
    if(legacy)throw new Error("This account needs the verified per-song data copy before it can open. The original workspace is unchanged.");
    return {data:null,revision:0};
  }
  if(!account.verified)throw new Error("Per-song data copy has not passed comparison. The original workspace is unchanged.");
  return hydrate(db,owner,account);
}
export async function copySongRows(db,owner) {
  const legacy=await stmt(db,"SELECT content,revision FROM studios WHERE owner=?",owner).first();
  const source=legacy?JSON.parse(legacy.content):{songs:[],templates:[]};
  if(!Array.isArray(source.songs)||new Set(source.songs.map(s=>s.id)).size!==source.songs.length)
    throw new Error("Copy stopped: invalid or duplicate song records in the original bundle.");
  const sourceHash=await digest(source);
  const prior=await stmt(db,"SELECT * FROM studio_accounts WHERE owner=?",owner).first();
  if(prior?.verified){
    if(prior.source_hash!==sourceHash)throw new Error("The original backup changed after copy; no data was modified.");
    return {...JSON.parse(prior.comparison),alreadyVerified:true};
  }
  await stmt(db,`INSERT INTO studio_accounts(owner,revision,settings,source_hash) VALUES(?,?,?,?) ON CONFLICT(owner) DO NOTHING`,
    owner,legacy?.revision??0,encode(settingsOf(source)),sourceHash).run();
  // Bounded, repeatable inserts. A failed/interrupted copy is never readable.
  for(let i=0;i<source.songs.length;i+=10){
    const statements=source.songs.slice(i,i+10).flatMap((song,j)=>songStatements(db,owner,song,1,i+j,true));
    await db.batch(statements);
  }
  const account=await stmt(db,"SELECT * FROM studio_accounts WHERE owner=?",owner).first();
  const result=await hydrate(db,owner,account);
  const { _storage,...copied}=result.data;
  const checks={
    songCounts:source.songs.length===copied.songs.length,
    lyrics:canonical(source.songs.map(s=>[s.id,s.notes.lyrics,s.versions.lyrics]))===canonical(copied.songs.map(s=>[s.id,s.notes.lyrics,s.versions.lyrics])),
    promptsAndNotes:canonical(source.songs.map(s=>[s.id,s.notes,s.versions.prompt]))===canonical(copied.songs.map(s=>[s.id,s.notes,s.versions.prompt])),
    // All fields includes every current/history audio, video, cover, reference,
    // source/session and other R2 pointer, including extensions we do not know.
    allFieldsAndMediaKeys:canonical(source)===canonical(copied),
  };
  if(Object.values(checks).some(passed=>!passed))throw new Error(`Copy comparison failed: ${Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name).join(", ")}. No read/write switch occurred.`);
  const report={songCount:source.songs.length,checks,sourceHash,verifiedAt:new Date().toISOString()};
  const guard=legacy?"EXISTS(SELECT 1 FROM studios WHERE owner=? AND revision=? AND content=?)":"NOT EXISTS(SELECT 1 FROM studios WHERE owner=?)";
  const params=legacy?[owner,legacy.revision,legacy.content]:[owner];
  const update=await stmt(db,`UPDATE studio_accounts SET verified=1,comparison=?,verified_at=? WHERE owner=? AND source_hash=? AND ${guard}`,
    encode(report),report.verifiedAt,owner,sourceHash,...params).run();
  if(!update.meta?.changes)throw new Error("The original changed during copy; comparison must be repeated. No switch occurred.");
  return report;
}
export async function writeSongRows(db,owner,content) {
  const input=JSON.parse(content), baseline=input._storage;
  let account=await stmt(db,"SELECT * FROM studio_accounts WHERE owner=?",owner).first();
  if(!account){await copySongRows(db,owner);account=await stmt(db,"SELECT * FROM studio_accounts WHERE owner=?",owner).first();}
  if(!account.verified)throw new Error("Complete the verified data copy first.");
  const current=await hydrate(db,owner,account),meta=current.data._storage;
  if(!baseline&&current.data.songs.length)throw new Error("Reload the Studio to use per-song saving; your edits have not been discarded.");
  const incomingSettings=settingsOf(input), settingsChanged=await digest(incomingSettings)!==(baseline?.settings?.hash??await digest({templates:[]}));
  const statements=[],guards=[],guardParams=[];
  const nextIds=new Set(input.songs.map(song=>song.id));
  for(let i=0;i<input.songs.length;i++){
    const song=input.songs[i],old=baseline?.songs?.[song.id],now=meta.songs[song.id];
    if(await digest(song)===old?.hash)continue; // stale, untouched songs never overwrite another tab
    if((old?.revision??0)!==(now?.revision??0))return undefined;
    if(new TextEncoder().encode(encode(song)).byteLength>1_500_000)throw new Error("This song is too large to save; other songs are unaffected.");
    guards.push(old?"EXISTS(SELECT 1 FROM studio_songs WHERE owner=? AND id=? AND revision=? AND removed=0)":"NOT EXISTS(SELECT 1 FROM studio_songs WHERE owner=? AND id=?)");
    guardParams.push(owner,song.id,...(old?[old.revision]:[]));
    statements.push(...songStatements(db,owner,song,(now?.revision??0)+1,old?i:-Date.now()+i));
  }
  for(const [id,old] of Object.entries(baseline?.songs??{})){
    if(nextIds.has(id))continue;
    if(meta.songs[id]?.revision!==old.revision)return undefined;
    guards.push("EXISTS(SELECT 1 FROM studio_songs WHERE owner=? AND id=? AND revision=? AND removed=0)");guardParams.push(owner,id,old.revision);
    statements.push(stmt(db,"UPDATE studio_songs SET removed=1,revision=revision+1 WHERE owner=? AND id=?",owner,id));
  }
  if(settingsChanged){
    if(baseline&&baseline.settings?.revision!==meta.settings.revision)return undefined;
    guards.push("EXISTS(SELECT 1 FROM studio_accounts WHERE owner=? AND settings_revision=?)");guardParams.push(owner,meta.settings.revision);
    statements.push(stmt(db,"UPDATE studio_accounts SET settings=?,settings_revision=settings_revision+1 WHERE owner=?",encode(incomingSettings),owner));
  }
  if(!statements.length)return current;
  // D1 batch is one transaction. Abort the entire batch if any revision changed
  // after the read; never automatically replay an ambiguous write.
  const guard=stmt(db,`SELECT CASE WHEN ${guards.map(s=>`(${s})`).join(" AND ")} THEN 1 ELSE json('song-revision-conflict') END`,...guardParams);
  await db.batch([guard,...statements,stmt(db,"UPDATE studio_accounts SET revision=revision+1 WHERE owner=?",owner)]);
  return readSongRows(db,owner);
}
