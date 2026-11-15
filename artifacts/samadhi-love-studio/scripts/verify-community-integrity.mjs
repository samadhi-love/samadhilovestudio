import { DatabaseSync } from "node:sqlite";
import { AsyncLocalStorage } from "node:async_hooks";
import { build } from "esbuild";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
const work = path.join(root, "work", "community-integrity"); mkdirSync(work, { recursive: true });
// Apply the actual tracked migrations to an empty, memory-only SQLite database.
const sql = new DatabaseSync(":memory:");
for (const file of readdirSync(path.join(root, "drizzle")).filter(f => f.endsWith(".sql")).sort()) sql.exec(readFileSync(path.join(root, "drizzle", file), "utf8"));
const context = new AsyncLocalStorage(), media = new Set(), served = [];
function statement(query, parameters = []) {
  return { bind: (...values) => statement(query, values),
    async all() { return { results: sql.prepare(query).all(...parameters), success: true }; },
    async first(column) { const row = sql.prepare(query).get(...parameters); return row ? column ? row[column] : row : null; },
    async run() { const result = sql.prepare(query).run(...parameters); return { meta: { changes: Number(result.changes) }, success: true }; },
    async execute() { return sql.prepare(query).columns().length ? this.all() : this.run(); } };
}
const db = { prepare: statement, async batch(queries) {
  sql.exec("begin");
  try { const result = []; for (const q of queries) result.push(await q.execute()); sql.exec("commit"); return result; }
  catch (e) { sql.exec("rollback"); throw e; }
} };
globalThis.__communityIntegrity = { context, db, media, served, objects: new Map(), objectRevision: 0 };
const mocks = {
  env: `const s=globalThis.__communityIntegrity; export const env={DB:s.db,BUCKET:{head:async key=>s.media.has(key)?{size:100}:null,
    get:async key=>{const row=s.objects.get(key);return row?{etag:row.etag,body:new Blob([row.value]).stream(),json:async()=>JSON.parse(row.value)}:null;},
    put:async(key,value,options)=>{const old=s.objects.get(key);if(options?.onlyIf?.etagDoesNotMatch==='*'&&old)return null;if(options?.onlyIf?.etagMatches&&old?.etag!==options.onlyIf.etagMatches)return null;const row={value,etag:String(++s.objectRevision)};s.objects.set(key,row);return row;}}};`,
  access: "export async function studioAccess(){return globalThis.__communityIntegrity.context.getStore()??{id:null,role:'guest'};} export async function privateWorkspace(){const who=await studioAccess();return who.id&&(who.role==='owner'||who.role==='creator')?who:null;}",
  store: "export const privateHeaders={'Cache-Control':'private, no-store'};export const audioKey=(owner,id)=>'songs/'+encodeURIComponent(owner)+'/'+id;export async function readStudio(id){const row=await globalThis.__communityIntegrity.db.prepare('select content,revision from studios where owner=?').bind(id).first();return {data:row?JSON.parse(row.content):null,revision:row?.revision??0};}",
  audio: "export async function serveAudio(request,owner,id,format){globalThis.__communityIntegrity.served.push({owner,id,format});return new Response('authorized published audio',{headers:{'Content-Length':'8192'}});}",
};
const plugin = { name: "memory-community-runtime", setup(b) {
  b.onResolve({ filter: /cloudflare:workers|studio-access$|studio\/store$|studio\/audio-response$/ }, a => ({ path: a.path === "cloudflare:workers" ? "env" : a.path.endsWith("studio-access") ? "access" : a.path.endsWith("audio-response") ? "audio" : "store", namespace: "fixture" }));
  b.onLoad({ filter: /.*/, namespace: "fixture" }, a => ({ contents: mocks[a.path], loader: "js" }));
} };
for (const [name, entry] of Object.entries({ community: "app/api/community/route.ts", party: "app/api/party/route.ts", sharing: "app/api/song-share/route.ts" }))
  await build({ entryPoints: [path.join(root, entry)], bundle: true, platform: "node", format: "esm", outfile: path.join(work, name + ".mjs"), plugins: [plugin] });
await build({ stdin: { contents: 'export * from "./app/studio-data";export * from "./app/party/data";', resolveDir: root }, bundle: true, platform: "node", format: "esm", outfile: path.join(work, "data.mjs") });
const api = await import(pathToFileURL(path.join(work, "community.mjs")));
const sharing = await import(pathToFileURL(path.join(work, "sharing.mjs")));
const party = await import(pathToFileURL(path.join(work, "party.mjs")));
const { freshSong, blankParty } = await import(pathToFileURL(path.join(work, "data.mjs")));
const a = { id: "artist-a", role: "creator" }, b = { id: "artist-b", role: "creator" }, owner = { id: "owner", role: "owner" };
const songA = { ...freshSong("song-a", "Artist A original", 0), audioId: "audio-a", audioFormat: "mp3" };
const songB = { ...freshSong("song-b", "Artist B private recording", 0), audioId: "audio-b", audioFormat: "mp3" };
function seed(who, song) {
  sql.prepare("insert into studios values (?,?,1)").run(who.id, JSON.stringify({ songs: [song], templates: [] }));
  sql.prepare("insert into creator_accounts(id,display_name,created_at) values (?,?,?)").run(who.id, who.id, new Date().toISOString());
  media.add(`songs/${who.id}/${song.audioId}`);
}
songA.coverAsset="cover-a";globalThis.__communityIntegrity.objects.set("lyric-assets/artist-a/song-a/cover-a",{value:new Uint8Array([137,80,78,71]),etag:"cover"});
songA.tags=["Jazz","Lebanese Dabke"];songA.notes.instruments="Oud, Piano";songB.tags=["Jazz"];songB.notes.instruments="Private violin";
seed(a, songA); seed(b, songB);
const request = (url, body, origin = "https://studio.test") => new Request("https://studio.test" + url, { method: body === undefined ? "GET" : "POST", headers: { Origin: origin, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const get = (who, query = "") => context.run(who, () => api.GET(request("/api/community" + query)));
const post = (who, body, origin) => context.run(who, () => api.POST(request("/api/community", body, origin)));
let checks = 0;
function check(value, message) { assert(value, message); checks++; }
try {
  check((await get(null, "?dashboard=1")).status === 403, "anonymous dashboard blocked");
  check((await post(null, { action: "profile", name: "Guest" })).status === 401, "anonymous mutations blocked");
  check((await post(a, { action: "profile", name: "Artist A", bio: "Original uplifting music" }, "https://foreign.test")).status === 403, "cross-origin changes blocked");
  for (const [who, name] of [[a, "Artist A"], [b, "Artist B"]]) check((await post(who, { action: "profile", name, bio: "Original uplifting music" })).ok, "artist profile saves");
  check((await post(a, { action: "publish", id: songB.id, confirmedClean: true })).status === 400, "another account's recording cannot be published");
  check((await post(a, { action: "publish", id: songA.id, confirmedClean: false })).status === 400, "publishing requires explicit confirmation");
  check((await post(a, { action: "publish", id: songA.id, confirmedClean: true, comments: true })).ok, "authorized recording publishes");
  const release = sql.prepare("select * from community_releases where owner=?").get(a.id);
  let view = await (await get(null)).json();
  check(view.releases.length === 1 && view.releases[0].id === release.id, "anonymous discovery includes only the published recording");
  check(!JSON.stringify(view).includes(songB.name), "private recording details do not leak into discovery");
  check((await get(null, "?audio=" + songB.id)).status === 404, "private audio is unavailable through the community endpoint");
  check((await get(null, "?audio=" + release.id)).ok && served.at(-1).id === songA.audioId, "published audio serves the explicitly approved recording");
  const cover=await get(null,"?cover="+release.id);check(cover.ok&&(await cover.arrayBuffer()).byteLength===4,"an explicitly published song can serve its owned cover");
  check((await get(null,"?cover="+songB.id)).status===404,"private song covers are not publicly accessible");
  check(view.catalog.total === 1 && view.artists[0].songs === 1 && view.artists[0].name === "Artist A", "public catalog and artist cards use published recordings only");
  check((await (await get(null, "?search=private")).json()).catalog.total === 0, "catalog search does not find private recordings");
  check((await (await get(null, "?search=%25")).json()).catalog.total === 0, "search treats percent as literal text, not a wildcard");
  check((await (await get(null,"?genre=Jazz")).json()).catalog.total===1,"genre browsing includes published songs and excludes private recordings");
  check((await (await get(null,"?genre=Trance")).json()).catalog.total===0,"genre filter applies before counting and pagination");
  check((await (await get(null,"?search=oud")).json()).catalog.total===1,"instrument search finds public instrument metadata");
  check((await (await get(null,"?search=dabke")).json()).catalog.total===1,"style search finds genre tags");
  check((await (await get(null,"?search=violin")).json()).catalog.total===0,"instrument search cannot expose private creations");
  check((await (await get(null,"?search=Artist%20A&genre=Jazz")).json()).catalog.total===1,"artist and genre search can be combined");
  const artistPage = await (await get(null, "?artist=" + view.artists[0].id)).json();
  check(artistPage.artist.releases.length === 1 && !JSON.stringify(artistPage).includes(songB.name), "creator public page contains published releases only");
  const guestStart = await post(null, {action:"start",id:release.id});
  const cookie = guestStart.headers.get("set-cookie");
  const guestTicket = (await guestStart.json()).token;
  check(!!guestTicket && cookie.includes("HttpOnly") && cookie.includes("Secure"), "anonymous listeners receive a signed, secure first-party identity");
  const guestRequest=(body, cookieValue=cookie.split(";")[0])=>new Request("https://studio.test/api/community",{method:"POST",headers:{Origin:"https://studio.test","Content-Type":"application/json",Cookie:cookieValue},body:JSON.stringify(body)});
  check((await context.run(null,()=>api.POST(guestRequest({action:"listen",id:release.id,token:guestTicket})))).status===425,"guest plays require served audio and listening time");
  await context.run(null,()=>api.GET(new Request("https://studio.test/api/community?audio="+release.id+"&ticket="+guestTicket,{headers:{Cookie:cookie.split(";")[0]}})));
  check(sql.prepare("select served_at from community_playback where token=?").get(guestTicket).served_at>0,"guest ticket is bound to real published audio serving");
  sql.prepare("update community_playback set served_at=? where token=?").run(Date.now()-11000,guestTicket);
  check((await (await context.run(null,()=>api.POST(guestRequest({action:"listen",id:release.id,token:guestTicket})))).json()).counted===true,"qualified guest play stored in SQL");
  check((await context.run(null,()=>api.POST(guestRequest({action:"reaction",id:release.id,value:"like"})))).status===401,"guest identity cannot authorize likes or private mutations");
  check((await context.run(null,()=>api.POST(guestRequest({action:"listen",id:release.id,token:guestTicket},"samadhi_listener="+"a".repeat(32)+".1999999999."+"0".repeat(64))))).status===409,"forged cookie cannot count plays");
  const nextGuest=await context.run(null,()=>api.POST(guestRequest({action:"start",id:release.id})));
  const nextToken=(await nextGuest.json()).token;
  sql.prepare("update community_playback set served_at=? where token=?").run(Date.now()-11000,nextToken);
  check((await (await context.run(null,()=>api.POST(guestRequest({action:"listen",id:release.id,token:nextToken})))).json()).counted===false,"same browser does not inflate daily play count");
  const sharePost=(who,body,origin)=>context.run(who,()=>sharing.POST(request("/api/song-share",body,origin)));
  const shareGet=(who,query)=>context.run(who,()=>sharing.GET(request("/api/song-share"+query)));
  check((await sharePost(null,{action:"create",songId:songB.id,confirmedRights:true})).status===401,"guest cannot grant song access");
  check((await sharePost(a,{action:"create",songId:songB.id,confirmedRights:true})).status===404,"creator cannot share another account's private recording");
  check((await sharePost(b,{action:"create",songId:songB.id,confirmedRights:false})).status===400,"private sharing requires explicit rights confirmation");
  check((await sharePost(b,{action:"create",songId:songB.id,confirmedRights:true},"https://foreign.test")).status===403,"cross-origin sharing blocked");
  const shared=await (await sharePost(b,{action:"create",songId:songB.id,confirmedRights:true})).json();
  const sharedQuery="?token="+new URL("https://studio.test"+shared.path).searchParams.get("token");
  let metadata=await (await shareGet(null,sharedQuery)).json();
  check(metadata.title===songB.name && !Object.hasOwn(metadata,"owner") && !Object.hasOwn(metadata,"lyrics"),"unlisted listening link exposes only approved public metadata");
  check((await shareGet(null,sharedQuery+"&audio=1")).ok && served.at(-1).owner===b.id,"share streams only its pinned creator recording");
  check(!(await (await get(null)).json()).releases.some(row=>row.title===songB.name),"unlisted sharing does not publish a private song");
  await sharePost(a,{action:"revoke",songId:songB.id});
  check((await shareGet(null,sharedQuery)).ok,"other account cannot revoke creator's link");
  await sharePost(b,{action:"revoke",songId:songB.id});
  check((await shareGet(null,sharedQuery)).status===404,"revocation immediately denies metadata and audio");
  const replacementShare=await (await sharePost(b,{action:"create",songId:songB.id,confirmedRights:true})).json();
  const replacementQuery="?token="+new URL("https://studio.test"+replacementShare.path).searchParams.get("token");
  sql.prepare("update studios set content=? where owner=?").run(JSON.stringify({songs:[{...songB,audioId:"new-private-audio"}],templates:[]}),b.id);
  check((await shareGet(null,replacementQuery+"&audio=1")).status===404,"replacement audio never inherits earlier link permission");
  sql.prepare("update studios set content=? where owner=?").run(JSON.stringify({songs:[songB],templates:[]}),b.id);
  sql.prepare("update creator_accounts set suspended=1 where id=?").run(b.id);
  check((await shareGet(null,replacementQuery)).status===404,"suspended creator's share is unavailable");
  sql.prepare("update creator_accounts set suspended=0 where id=?").run(b.id);
  check((await post(b, { action: "moderate-release", id: release.id, value: true })).status === 403, "creator cannot use moderator controls");
  await post(b, { action: "unlist", id: songA.id });
  check(sql.prepare("select listed from community_releases where id=?").get(release.id).listed === 1, "foreign unlisting cannot change another artist's release");
  check((await post(b, { action: "reaction", id: release.id, value: "love" })).ok, "listener reaction saves");
  view = await (await get(null)).json(); check(view.releases[0].stats.reactions.love === 1, "reaction count comes from stored SQL data");
  check((await post(b, { action: "comment", id: release.id, value: "Beautiful and uplifting music" })).ok, "encouraging comment enters moderation");
  view = await (await get(null, "?song=" + release.id)).json(); check(view.comments.length === 0, "pending comment is not public");
  const comment = sql.prepare("select id from community_comments").get();
  check((await post(owner, { action: "moderate-comment", id: comment.id, value: "approved" })).ok, "owner can approve a comment");
  view = await (await get(null, "?song=" + release.id)).json(); check(view.comments.length === 1, "approved comment appears publicly");
  await post(b, { action: "create-playlist", value: "My collection" });
  const playlist = sql.prepare("select id from community_playlists where viewer=?").get(b.id);
  check((await post(a, { action: "playlist", id: release.id, playlist: playlist.id, value: true })).status === 404, "private playlists cannot cross accounts");
  check((await post(b, { action: "playlist", id: release.id, playlist: playlist.id, value: true })).ok, "playlist owner can add an available release");
  const p = { ...blankParty(), name: "My private party", tracks: ["mine:" + songB.id] };
  let response = await context.run(b, () => party.POST(request("/api/party", { action: "save", party: p })));
  check(response.ok, "private Party Mix saves in its owner's account");
  const savedParty = (await response.json()).party;
  response = await context.run(a, () => party.POST(request("/api/party", { action: "save", party: { ...savedParty, tracks: ["mine:" + songA.id] } })));
  check(response.status === 409, "another account cannot overwrite a private Party set");
  response = await context.run(b, () => party.POST(request("/api/party", { action: "save", party: { ...savedParty, published: true } })));
  check(response.status === 400, "private song cannot become public by publishing a Party set");
  check((await post(a, { action: "unlist", id: songA.id })).ok, "owner can unlist without deleting the recording");
  check((await get(null, "?audio=" + release.id)).status === 404, "unlisted release stops serving through the public endpoint");
  check((await get(null,"?cover="+release.id)).status===404,"unlisting also removes public cover access");
  check(media.has(`songs/${a.id}/${songA.audioId}`), "unlisting retains original media");
  await post(a, { action: "publish", id: songA.id, confirmedClean: true });
  sql.prepare("update studios set content=? where owner=?").run(JSON.stringify({ songs: [{ ...songA, audioId: "replacement" }], templates: [] }), a.id);
  check((await get(null, "?audio=" + release.id)).status === 404, "audio replacement requires explicit republishing");
  check(JSON.parse(sql.prepare("select content from studios where owner=?").get(b.id).content).songs[0].audioId === songB.audioId, "all community operations preserve the other account's original recording");
  const privateFile={id:"file-one",name:"Dabke atmosphere",prompt:"A warm uplifting dance party",genre:"Lebanese Dabke",minutes:30,tracks:["mine:"+songB.id],repeat:false,vocals:false};
  const fileProject={...blankParty(),name:"Private party files",tracks:privateFile.tracks,files:[privateFile]};
  let fileResponse=await context.run(b,()=>party.POST(request("/api/party",{action:"save",party:fileProject})));check(fileResponse.ok,"private 30-minute party-file setup saves with an owned source");const fileSaved=(await fileResponse.json()).party;
  fileResponse=await context.run(b,()=>party.POST(request("/api/party",{action:"save",party:{...fileSaved,published:true}})));check(fileResponse.status===400,"party-file prompts and private sources cannot be published through legacy party controls");
  fileResponse=await context.run(b,()=>party.POST(request("/api/party",{action:"save",party:{...blankParty(),name:"Foreign source",tracks:["mine:"+songA.id],files:[{...privateFile,tracks:["mine:"+songA.id]}]}})));check(fileResponse.status===409,"party files cannot include another creator's private source");
  fileResponse=await context.run(b,()=>party.POST(request("/api/party",{action:"save",party:{...fileSaved,files:Array.from({length:5},(_,i)=>({...privateFile,id:"file-"+i}))}})));check(fileResponse.status===400,"five party files rejected");
  const switched=request("/api/party",{action:"save",party:fileSaved});switched.headers.set("X-Party-Workspace","artist-a");check((await context.run(b,()=>party.POST(switched))).status===409,"account switching cannot save private party recipes into another creator's account");
  fileResponse=await context.run(b,()=>party.POST(request("/api/party",{action:"save",party:{...blankParty(),name:"Prompt before audio",tracks:[],files:[{...privateFile,tracks:[]}]}})));check(fileResponse.ok,"prompt-only file draft saves before any paid generation");
  console.log(JSON.stringify({ communityAndPartyChecks: checks, status: "passed", storage: "actual migrations and SQL in memory; no production data or external requests" }));
} finally { sql.close(); delete globalThis.__communityIntegrity; }
