import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, ""),
  files = new Map();
const scratch = path.join(root, "work", "project-workflow-api-tests");
mkdirSync(scratch, { recursive: true });
const bytes = async (value) =>
  typeof value === "string"
    ? new TextEncoder().encode(value)
    : value instanceof ReadableStream
      ? new Uint8Array(await new Response(value).arrayBuffer())
      : new Uint8Array(value);
const bucket = {
  async put(key, value, options = {}) {
    const data = await bytes(value);
    files.set(key, {
      data,
      httpMetadata: options.httpMetadata ?? {},
      customMetadata: options.customMetadata ?? {},
      uploaded: new Date(),
    });
    return {};
  },
  async head(key) {
    const item = files.get(key);
    return item ? { ...item, size: item.data.length, key } : null;
  },
  async get(key, options) {
    const item = files.get(key);
    if (!item) return null;
    const data = options?.range
      ? item.data.slice(
          options.range.offset,
          options.range.offset + options.range.length,
        )
      : item.data;
    return {
      ...item,
      size: data.length,
      body: new Response(data).body,
      text: async () => new TextDecoder().decode(data),
      arrayBuffer: async () => data.buffer,
    };
  },
  async delete(key) {
    files.delete(key);
  },
  async list({ prefix }) {
    return {
      objects: [...files]
        .filter(([k]) => k.startsWith(prefix))
        .map(([key, item]) => ({ ...item, key, size: item.data.length })),
      truncated: false,
    };
  },
};
globalThis.__pro = {
  id: "owner",
  env: { BUCKET: bucket },
  revision: 4,
  studio: null,
  providerResult: {},
  providerCalls: [],
};
globalThis.FixedLengthStream = class {
  constructor() {
    const stream = new TransformStream();
    this.readable = stream.readable;
    this.writable = stream.writable;
  }
};
const mocks = {
  env: "export const env=globalThis.__pro.env;",
  access:
    'export async function privateWorkspace(){return globalThis.__pro.id?{id:globalThis.__pro.id,role:"owner"}:null;}',
  store: `export const privateHeaders={"Cache-Control":"private,no-store"};export const maxStudioBytes=1500000;export const audioKey=(owner,id)=>'songs/'+encodeURIComponent(owner)+'/'+id;export async function readStudio(id){return id==='owner'?{data:structuredClone(globalThis.__pro.studio),revision:globalThis.__pro.revision}:{data:null,revision:0};}export async function writeStudio(id,revision,content){if(id!=='owner'||revision!==globalThis.__pro.revision)return;globalThis.__pro.studio=JSON.parse(content);return{revision:++globalThis.__pro.revision};}export function saveConflict(){return Response.json({error:'conflict'},{status:409});}`,
  vault:
    'export async function resolveElevenLabsKey(){return "mock-existing-key";}',
  providerAudio: `export async function sendProviderAudio(audio,format,key,fields,endpoint){globalThis.__pro.providerCalls.push({format,fields,endpoint});return Response.json(globalThis.__pro.providerResult,{status:globalThis.__pro.providerStatus??200});}`,
  provider: `export const musicModel='music_v2_5';export async function elevenLabsFailureMessage(){return 'mock provider rejected';}export async function elevenLabsRequest(key,path,payload){globalThis.__pro.providerCalls.push({path,payload});if(path.startsWith('music?')&&globalThis.__pro.failMusic)return Response.json({error:'mock failure'},{status:503});if(path.startsWith('music?'))return new Response(new Uint8Array([73,68,51,4,0,0,0,0,0,0,255,251]),{headers:{'Content-Type':'audio/mpeg'}});return Response.json({chunks:[{text:'[Verse]\\nApproved words stay exact!',duration_ms:30000}]});}`,
  creator: "export async function reserveCreatorGeneration(){return true;}",
};
const plugin = {
  name: "pro-test-runtime",
  setup(b) {
    b.onResolve(
      {
        filter:
          /cloudflare:workers|studio-access$|\/store$|elevenlabs\/vault$|elevenlabs\/audio-upload$|elevenlabs\/provider$|creator-accounts$/,
      },
      (a) => ({
        path:
          a.path === "cloudflare:workers"
            ? "env"
            : a.path.endsWith("studio-access")
              ? "access"
              : a.path.endsWith("/store")
                ? "store"
                : a.path.endsWith("/vault")
                  ? "vault"
                  : a.path.endsWith("/audio-upload")
                    ? "providerAudio"
                    : a.path.endsWith("/provider")
                      ? "provider"
                      : "creator",
        namespace: "mock",
      }),
    );
    b.onLoad({ filter: /.*/, namespace: "mock" }, (a) => ({
      contents: mocks[a.path],
      loader: "js",
    }));
  },
};
for (const [name, routePath] of Object.entries({
  workspace: "",
  project: "lyric-project",
  assets: "lyric-assets",
  sync: "lyric-sync",
  audio: "audio",
  create: "create",
}))
  await build({
    entryPoints: [`${root}/app/api/studio/${routePath}/route.ts`],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: path.join(scratch, `${name}.mjs`),
    plugins: [plugin],
  });
await build({
  stdin: {
    contents: `export * from '${root}/app/studio-data.ts';export * from '${root}/app/lyric-pro-data.ts';export * from '${root}/app/project-assets.ts';`,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(scratch, "helpers.mjs"),
});
const { freshSong, newProSettings, attachRenderedMix, pinnedMaster } = await import(
    pathToFileURL(path.join(scratch, "helpers.mjs")).href
  ),
  workspace = await import(pathToFileURL(path.join(scratch, "workspace.mjs")).href),
  project = await import(pathToFileURL(path.join(scratch, "project.mjs")).href),
  assets = await import(pathToFileURL(path.join(scratch, "assets.mjs")).href),
  sync = await import(pathToFileURL(path.join(scratch, "sync.mjs")).href),
  audio = await import(pathToFileURL(path.join(scratch, "audio.mjs")).href),
  create = await import(pathToFileURL(path.join(scratch, "create.mjs")).href);
const state = globalThis.__pro;
const original = { ...freshSong("song-1", "Original project", 0), audioFormat: "mp3", audioId: "source-audio", notes: { ...freshSong("x","x",0).notes, lyrics: "Love and light" } };
const unrelated = { ...freshSong("other", "Unrelated", 1), audioFormat: "mp3", audioId: "other-audio" };
state.studio = { songs: [original, unrelated], templates: [], voices: [{id:"voice-keep"}], folders: [{id:"folder-keep",name:"Album"}], station: {skin:"classic"} };
const request = (url, method, body, headers={}) => new Request("https://studio.test"+url,{method,headers:{Origin:"https://studio.test","X-Studio-Deletion-Policy":"14-days-v1","Content-Type":"application/json",...headers},...(body===undefined?{}:{body:typeof body==="string"?body:JSON.stringify(body),duplex:"half"})});
let checks=0;const check=(condition,message)=>{assert(condition,message);checks++;};
let r=await workspace.GET();let result=await r.json();check(result.workspace==="owner","recovery scope is the authenticated workspace");
const initial=structuredClone(state.studio);
r=await audio.POST(new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{Origin:"https://studio.test","X-Studio-Deletion-Policy":"14-days-v1","X-Audio-Format":"wav","X-Audio-Size":"4","X-Studio-Clean-Audio":"1","X-Song-Title":"Rendered mix","X-Studio-Revision":String(state.revision),"X-Project-Song-Id":original.id,"X-Source-Session-Id":"session-keep"},body:new Uint8Array([1,2,3,4]),duplex:"half"}));
result=await r.json();check(r.ok,"linked audio upload succeeds");const child=state.studio.songs.find(s=>s.id===result.songId),rootSong=state.studio.songs.find(s=>s.id===original.id);
check(child.projectId===original.id,"render remains in source project");check(child.notes.lyrics===original.notes.lyrics,"lyrics carry into rendered audio");check(child.sourceSessionId==="session-keep","source session association retained");check(rootSong.mixes.some(m=>m.audioSongId===child.id),"mix comparison attachment created atomically");check(rootSong.audioId===original.audioId,"source recording unchanged");check(JSON.stringify(state.studio.folders)===JSON.stringify(initial.folders),"folders retained");check(JSON.stringify(state.studio.voices)===JSON.stringify(initial.voices),"voices retained");check(JSON.stringify(state.studio.station)===JSON.stringify(initial.station),"station retained");
const put=async data=>workspace.PUT(request("/api/studio","PUT",{revision:state.revision,data}));
let data=structuredClone(state.studio);data.songs.find(s=>s.id===original.id).master={songId:unrelated.id,audioId:unrelated.audioId};
r=await put(data);check(r.status===400,"unrelated master rejected");
data=structuredClone(state.studio);data.songs.find(s=>s.id===original.id).master={songId:child.id,audioId:child.id};
r=await put(data);check(r.ok,"related master selected");check(state.studio.songs.find(s=>s.id===original.id).master.audioId===child.id,"recording version pinned");
data=structuredClone(state.studio);data.songs.find(s=>s.id===child.id).projectId=unrelated.id;
r=await put(data);check(r.ok,"ordinary save remains compatible");check(state.studio.songs.find(s=>s.id===child.id).projectId===original.id,"ordinary save cannot silently reparent a mix");
data=structuredClone(state.studio);data.songs.find(s=>s.id===original.id).releaseMetadata={artist:"SAMADHI LOVE",credits:"Original music",isrc:"invalid",upc:"",copyright:""};
r=await put(data);check(r.status===400,"invalid release identifier rejected");
data.songs.find(s=>s.id===original.id).releaseMetadata.isrc="USAAA2600001";
r=await put(data);check(r.ok,"valid release metadata saved");
const revision=state.revision;r=await workspace.PUT(request("/api/studio","PUT",{revision:revision-1,data:state.studio}));check(r.status===409,"stale saves rejected");check(state.revision===revision,"conflict does not change data");
const oldMaster=state.studio.songs.find(s=>s.id===original.id).master;
r=await audio.POST(new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{Origin:"https://studio.test","X-Studio-Deletion-Policy":"14-days-v1","X-Audio-Format":"wav","X-Audio-Size":"4","X-Studio-Clean-Audio":"1","X-Song-Id":child.id,"X-Studio-Revision":String(state.revision)},body:new Uint8Array([5,6,7,8]),duplex:"half"}));check(r.ok,"recording replacement succeeds");
check(state.studio.songs.find(s=>s.id===child.id).audioHistory.some(a=>a.audioId===child.id),"old master recording retained in history");
check(JSON.stringify(state.studio.songs.find(s=>s.id===original.id).master)===JSON.stringify(oldMaster),"replacing current audio does not change selected master");check(pinnedMaster(state.studio.songs,state.studio.songs.find(s=>s.id===original.id)).audioId===child.id,"pinned master resolves historical version");
data=structuredClone(state.studio);data.songs.unshift({...freshSong("new-writing","New writing",0),createdAt:"1900-01-01T00:00:00Z"});r=await put(data);
check(r.ok,"writing projects save directly to the same private song collection");
const created=state.studio.songs.find(s=>s.id==="new-writing").createdAt;check(created!=="1900-01-01T00:00:00Z"&&Number.isFinite(Date.parse(created)),"new creation dates come from the server");
data=structuredClone(state.studio);data.songs.find(s=>s.id==="new-writing").name="Renamed writing";data.songs.find(s=>s.id==="new-writing").createdAt="2099-01-01T00:00:00Z";r=await put(data);
check(r.ok&&state.studio.songs.find(s=>s.id==="new-writing").createdAt===created,"renaming or forged client dates cannot reorder creation time");
check(state.studio.songs.find(s=>s.id===original.id).createdAt===undefined,"undated original records are not assigned invented creation dates");
const recipe={preset:"house",bpm:120,seconds:3,tonic:9,minor:false,arrangement:"build",seed:123},saveRevision=state.revision;
const localRequest=()=>new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{Origin:"https://studio.test","X-Studio-Deletion-Policy":"14-days-v1","X-Audio-Format":"wav","X-Audio-Size":"4","X-Studio-Clean-Audio":"1","X-Song-Title":"Local creation","X-Studio-Revision":String(saveRevision),"X-Creation-Id":"stable-instrumental","X-Studio-Instrumental":encodeURIComponent(JSON.stringify({prompt:"Original house",settings:recipe}))},body:new Uint8Array([1,2,3,4]),duplex:"half"});
r=await audio.POST(localRequest());check(r.ok,"automatic instrumental save uses the existing owned audio endpoint");
const local=state.studio.songs.find(s=>s.id==="stable-instrumental"),fileCount=files.size,localKey="songs/owner/"+local.audioId;
check(local.creationDraft===false&&Number.isFinite(Date.parse(local.createdAt)),"saved instrumentals are ready in My Songs with creation dates");
r=await audio.POST(localRequest());check(r.ok&&state.studio.songs.filter(s=>s.id===local.id).length===1&&files.size===fileCount,"a confirmed save replay does not create another song or audio object");
const unlisted=[];state.env.DB={prepare(sql){return{bind(...args){return{async run(){unlisted.push({sql,args});return{meta:{changes:1}};}};}};}};
const sharingKey="song-sharing/owner/"+local.id+".json";await bucket.put(sharingKey,JSON.stringify({token:"a".repeat(64)}));
data=structuredClone(state.studio);data.songs.find(s=>s.id===local.id).deletedAt=new Date().toISOString();r=await put(data);
check(JSON.parse(new TextDecoder().decode(files.get(sharingKey).data)).token===null,"Archive revokes unlisted links before storing archived metadata");
check(r.ok&&unlisted.at(-1).args.join("/")==="owner/"+local.id,"Archive unlists only this creator’s selected release");
r=await audio.GET(request("/api/studio/audio?song="+local.id,"GET"));check(r.status===404,"archived recordings are unavailable from the active audio endpoint");
data=structuredClone(state.studio);delete data.songs.find(s=>s.id===local.id).deletedAt;r=await put(data);
check(JSON.parse(new TextDecoder().decode(files.get(sharingKey).data)).token===null,"Restore keeps revoked listening links unavailable");
check(r.ok&&unlisted.length===2,"restoration unlists again and cannot silently republish a release");
check(state.studio.songs.find(s=>s.id===local.id).audioId===local.audioId&&files.size===fileCount+1&&files.get(localKey).data.join(",")==="1,2,3,4","Archive and Restore preserve exact original bytes and recording identity");
state.env.DB={prepare(){return{bind(){return{async run(){throw new Error("simulated release storage unavailable");}};}};}};
data=structuredClone(state.studio);data.songs.find(s=>s.id===local.id).deletedAt=new Date().toISOString();const oldError=console.error;console.error=()=>{};try{r=await put(data);}finally{console.error=oldError;}
check(r.status===503&&!state.studio.songs.find(s=>s.id===local.id).deletedAt,"failed release unlisting blocks archival without changing the saved song");delete state.env.DB;
const beforeDenied=JSON.stringify(state.studio);state.id=null;r=await workspace.GET();check(r.status===401,"unauthenticated workspace read rejected");r=await audio.POST(request("/api/studio/audio","POST",{}));check(r.status===401,"unauthenticated upload rejected");check(JSON.stringify(state.studio)===beforeDenied,"denied requests leave all data unchanged");state.id="owner";
r=await audio.POST(new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{Origin:"https://studio.test","X-Studio-Deletion-Policy":"14-days-v1","X-Audio-Format":"wav","X-Audio-Size":String(96*1024*1024+1)},body:new Uint8Array([1]),duplex:"half"}));check(r.status===413,"oversize audio rejected before storage");
r=await audio.POST(new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{Origin:"https://studio.test","X-Studio-Deletion-Policy":"14-days-v1","X-Audio-Format":"wav","X-Audio-Size":"1","X-Studio-Clean-Audio":"1","X-Song-Title":"Mix","X-Studio-Revision":String(state.revision),"X-Project-Song-Id":"somebody-elses-project"},body:new Uint8Array([1]),duplex:"half"}));check(r.status===400,"unknown/foreign project linkage rejected");
// Per-song logo assets must belong to the same private song and use the logo media kind.
let branded=structuredClone(state.studio);branded.songs[0].logoAsset="brand-logo";const brandId=branded.songs[0].id;
r=await workspace.PUT(request("/api/studio","PUT",{revision:state.revision,data:branded}));check(r.status===400,"unowned logo assets cannot be selected");
await bucket.put(`lyric-assets/owner/${brandId}/brand-logo`,new Uint8Array([1]),{httpMetadata:{contentType:"image/png"},customMetadata:{song:brandId,kind:"logo"}});
r=await workspace.PUT(request("/api/studio","PUT",{revision:state.revision,data:branded}));check(r.ok&&state.studio.songs[0].logoAsset==="brand-logo","owned logo saves privately with its song");
branded=structuredClone(state.studio);const logoLyrics=branded.songs[0].notes.lyrics;branded.songs[0].logoDesign={name:"My artist",tagline:"Music and light",symbol:"lotus",palette:"gold",font:"elegant",layout:"stacked",transparent:true,animation:{scene:"aurora",seconds:15,format:"vertical",logoMotion:"float",intensity:.65}};
r=await workspace.PUT(request("/api/studio","PUT",{revision:state.revision,data:branded}));check(r.ok&&state.studio.songs[0].logoDesign.animation.scene==="aurora"&&state.studio.songs[0].notes.lyrics===logoLyrics,"nature-logo settings save and reopen with the private song without changing approved lyrics");
const invalidLogo=structuredClone(state.studio);invalidLogo.songs[0].logoDesign.animation.scene="https://evil.test/video";r=await workspace.PUT(request("/api/studio","PUT",{revision:state.revision,data:invalidLogo}));check(r.status===400&&state.studio.songs[0].logoDesign.animation.scene==="aurora","invalid nature-logo settings cannot replace a saved design");
// Authorized party audio and section edits reuse owner-scoped Studio storage.
const uploadReceipt=crypto.randomUUID(),partyBody=new Uint8Array([73,68,51,4]);
const ownedUpload=(extra={})=>new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{Origin:"https://studio.test","X-Studio-Workspace":"owner","X-Audio-Format":"mp3","X-Audio-Size":"4","X-Song-Title":"Authorized party source","X-Studio-Clean-Audio":"1","X-Studio-Revision":String(state.revision),"X-Party-Source":"upload","X-Party-Rights":"authorized","X-Party-Upload-Id":uploadReceipt,...extra},body:partyBody,duplex:"half"});
const beforePartyFiles=files.size;r=await audio.POST(ownedUpload({"X-Party-Rights":""}));check(r.status===400&&files.size===beforePartyFiles,"party uploads require explicit mixing permission before writing storage");
r=await audio.POST(ownedUpload());check(r.ok,"approved downloaded audio saves into the creator's private music library");const uploadedPartySong=state.studio.songs.find(s=>s.id===uploadReceipt),savedFiles=files.size;check(uploadedPartySong?.partySource==="upload"&&uploadedPartySong.audioId!==uploadedPartySong.id,"private upload records its origin and an immutable audio asset ID");
r=await audio.POST(ownedUpload({"X-Studio-Revision":"0"}));check(r.ok&&files.size===savedFiles&&state.studio.songs.filter(s=>s.id===uploadReceipt).length===1,"replaying a confirmed party upload cannot duplicate its song or stored audio");
const sectionSource=state.studio.songs.find(s=>s.audioFormat&&!s.deletedAt&&!s.projectId&&s.id!==uploadReceipt),sectionBefore=JSON.stringify(sectionSource.notes),sectionAudio=sectionSource.audioId??sectionSource.id;
const sectionRecipe={sourceSongId:sectionSource.id,sourceAudioId:sectionAudio,fade:.5,clips:[{songId:sectionSource.id,audioId:sectionAudio,from:0,to:2},{songId:uploadReceipt,audioId:uploadedPartySong.audioId,from:0,to:1}]};
const editRequest=(plan)=>ownedUpload({"X-Party-Upload-Id":crypto.randomUUID(),"X-Party-Source":"mix","X-Song-Title":"Edited version","X-Project-Song-Id":sectionSource.id,"X-Section-Edit-Plan":encodeURIComponent(JSON.stringify(plan))});
r=await audio.POST(editRequest({...sectionRecipe,clips:[{...sectionRecipe.clips[0],songId:"someone-elses-song"}]}));check(r.status===400,"section editing cannot reference another creator's source audio");
r=await audio.POST(editRequest(sectionRecipe));check(r.ok,"rendered section edit saves as a new recording in the original project");const editResult=await r.json(),edited=state.studio.songs.find(s=>s.id===editResult.songId);check(edited.sectionEdit.clips.length===2&&!edited.lyricVideo&&edited.notes.lyrics===sectionSource.notes.lyrics,"edited version retains its source recipe and approved lyrics without stale caption timing");check(JSON.stringify(state.studio.songs.find(s=>s.id===sectionSource.id).notes)===sectionBefore&&(state.studio.songs.find(s=>s.id===sectionSource.id).audioId??sectionSource.id)===sectionAudio,"section editing preserves original notes and original audio identity");
r=await audio.POST(new Request("https://studio.test/api/studio/audio",{method:"POST",headers:{Origin:"https://studio.test","X-Studio-Workspace":"owner","X-Audio-Format":"wav","X-Audio-Size":"4","X-Studio-Clean-Audio":"1","X-Song-Id":edited.id,"X-Studio-Revision":String(state.revision)},body:new Uint8Array([5,6,7,8]),duplex:"half"}));check(r.ok,"an edited song can receive a different recording without changing its original");
const replacedEdit=state.studio.songs.find(s=>s.id===edited.id);check(!replacedEdit.sectionEdit&&replacedEdit.partySource==="upload"&&JSON.stringify(replacedEdit.audioHistory.find(a=>a.audioId===edited.audioId)?.sectionEdit)===JSON.stringify(sectionRecipe),"replacement audio clears the old arrangement recipe while preserving it with its historical recording");
console.log(JSON.stringify({apiChecks:checks,status:"passed",storage:"in-memory only; no live data or provider credits used"}));
