import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, ""),
  files = new Map();
const scratch = path.join(root, "work", "lyric-pro-api-tests");
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
  async list({ prefix, limit = 1000, cursor }) {
    const all = [...files].filter(([k]) => k.startsWith(prefix)).sort(([a],[b]) => a.localeCompare(b));
    const offset = Number(cursor ?? 0), rows = all.slice(offset, offset + limit);
    return { objects: rows.map(([key, item]) => ({ ...item, key, size: item.data.length })), truncated: offset + limit < all.length, cursor: String(offset + limit) };
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
    contents: `export * from '${root}/app/studio-data.ts';export * from '${root}/app/lyric-pro-data.ts';`,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(scratch, "helpers.mjs"),
});
const { freshSong, newProSettings } = await import(
    pathToFileURL(path.join(scratch, "helpers.mjs")).href
  ),
  project = await import(pathToFileURL(path.join(scratch, "project.mjs")).href),
  assets = await import(pathToFileURL(path.join(scratch, "assets.mjs")).href),
  sync = await import(pathToFileURL(path.join(scratch, "sync.mjs")).href),
  audio = await import(pathToFileURL(path.join(scratch, "audio.mjs")).href),
  create = await import(pathToFileURL(path.join(scratch, "create.mjs")).href);
const state = globalThis.__pro;
const original = {
  ...freshSong("song-1", "Original recording", 0),
  audioFormat: "mp3",
  audioId: "original-audio",
  notes: { ...freshSong("x", "x", 0).notes, lyrics: "[Verse]\nLove and light" },
  mixes: [
    {
      id: "mix-1",
      name: "Mix one",
      notes: "Keep the original",
      link: "https://example.test/listen",
    },
  ],
};
const other = {
  ...freshSong("song-2", "Another original", 1),
  audioFormat: "mp3",
  audioId: "other-audio",
};
state.studio = {
  songs: [original, other],
  templates: [{ id: "keep-template" }],
  voices: [{ id: "keep-voice" }],
  station: { skin: "classic" },
  folders: [{ id: "keep-folder" }],
};
await bucket.put("songs/owner/original-audio", new Uint8Array([1, 2, 3, 4]), {
  httpMetadata: { contentType: "audio/mpeg" },
});
const before = structuredClone(state.studio),
  settings = {
    ...newProSettings(original, 180),
    approvedLyrics: original.notes.lyrics,
  };
const input = {
  cues: [
    {
      text: "Love and light",
      time: 2,
      end: 5,
      words: [
        { offset: 4, time: 2 },
        { offset: 8, time: 3 },
        { offset: 14, time: 4 },
      ],
    },
  ],
  theme: "cosmic",
  motion: "still",
  format: "vertical",
  captionTemplate: "neon-pulse",
  pro: settings,
};
const request = (url, method, body, headers = {}) =>
  new Request("https://studio.test" + url, {
    method,
    headers: {
      Origin: "https://studio.test", "X-Studio-Deletion-Policy":"14-days-v1",
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body !== undefined
      ? {
          body: typeof body === "string" ? body : JSON.stringify(url==="/api/studio/create"?{language:"en",...body}:body),
          duplex: "half",
        }
      : {}),
  });
let checks = 0;
function checked(condition, message) {
  assert(condition, message);
  checks++;
}
let r = await project.PUT(
  request("/api/studio/lyric-project", "PUT", {
    songId: "song-1",
    project: input,
    expected: null,
    snapshot: true,
    label: "First verified version",
  }),
);
checked(r.status === 200, "private project saves");
const saved = await r.json();
assert.deepEqual(state.studio.songs[1], before.songs[1]);
assert.deepEqual(state.studio.voices, before.voices);
assert.deepEqual(state.studio.templates, before.templates);
assert.deepEqual(state.studio.station, before.station);
assert.deepEqual(state.studio.folders, before.folders);
checks += 5;
assert.deepEqual(
  { ...state.studio.songs[0], lyricVideo: undefined },
  { ...before.songs[0], lyricVideo: undefined },
);
checks++;
r = await project.PUT(
  request("/api/studio/lyric-project", "PUT", {
    songId: "song-1",
    project: input,
    expected: null,
  }),
);
checked(r.status === 409, "stale save rejected");
r = await project.GET(request("/api/studio/lyric-project?song=song-1", "GET"));
const history = await r.json();
checked(history.versions.length === 1, "history snapshot is durable");
r = await project.GET(
  request(
    "/api/studio/lyric-project?song=song-1&version=" + saved.snapshotId,
    "GET",
  ),
);
const restored = await r.json();
assert.deepEqual(restored, saved.project);
checks++;
state.id = "different-user";
r = await project.GET(request("/api/studio/lyric-project?song=song-1", "GET"));
checked(r.status === 404, "cross-account project denied");
state.id = "";
r = await project.PUT(request("/api/studio/lyric-project", "PUT", {}));
checked(r.status === 401, "unauthenticated save denied");
state.id = "owner";
r = await project.PUT(
  request("/api/studio/lyric-project", "PUT", {
    songId: "song-1",
    project: { ...input, pro: { ...settings, sourceAudioId: "not-owned" } },
    expected: saved.project.pro.updatedAt,
  }),
);
checked(r.status === 409, "foreign source denied");
r = await project.PUT(
  request("/api/studio/lyric-project", "PUT", {
    songId: "song-1",
    project: { ...input, pro: { ...settings, language: "unsupported" } },
    expected: saved.project.pro.updatedAt,
  }),
);
checked(r.status === 400, "invalid settings rejected");
r = await assets.POST(
  request("/api/studio/lyric-assets", "POST", "RIFF-fake-wave", {
    "Content-Type": "audio/wav",
    "X-Song-Id": "song-1",
    "X-Asset-Kind": "analysis",
    "X-Asset-Size": "14",
  }),
);
checked(r.status === 200, "private derivative saves");
const derivative = await r.json();
r = await assets.GET(
  request("/api/studio/lyric-assets?song=song-1&asset=" + derivative.id, "GET"),
);
checked(r.status === 200, "private derivative reloads");
state.id = "different-user";
r = await assets.GET(
  request("/api/studio/lyric-assets?song=song-1&asset=" + derivative.id, "GET"),
);
checked(r.status === 404, "cross-account derivative denied");
state.id = "owner";
// Replace an audio source through the existing upload tool. The original remains referenced and available.
r = await audio.POST(
  request("/api/studio/audio", "POST", "NEW-AUDIO", {
    "Content-Type": "audio/mpeg",
    "X-Audio-Format": "mp3",
    "X-Audio-Size": "9",
    "X-Song-Id": "song-1",
    "X-Studio-Clean-Audio": "1",
    "X-Studio-Revision": String(state.revision),
  }),
);
checked(r.status === 200, "replacement audio upload succeeds");
const replaced = state.studio.songs[0];
checked(
  replaced.audioId !== "original-audio",
  "new recording gets a separate ID",
);
checked(
  replaced.audioHistory[0].audioId === "original-audio",
  "original reference retained",
);
checked(
  files.has("songs/owner/original-audio"),
  "untouched original bytes retained",
);
assert.deepEqual(replaced.lyricVideo, saved.project);
checks++;
r = await assets.GET(
  request(
    "/api/studio/lyric-assets?song=song-1&source=original-audio",
    "GET",
    undefined,
    { Range: "bytes=1-2" },
  ),
);
checked(r.status === 206, "historical source supports range playback");
assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [2, 3]);
checks++;
state.providerResult = {
  characters: [..."Love and light"].map((text, i) => ({
    text,
    start: 2 + i * 0.1,
    end: 2 + (i + 1) * 0.1,
  })),
};
r = await sync.POST(
  request("/api/studio/lyric-sync", "POST", {
    songId: "song-1",
    audioId: replaced.audioId,
    sourceAudioId: "original-audio",
    duration: 180,
    mode: "align",
    text: original.notes.lyrics,
    language: "ara",
  }),
);
checked(r.status === 200, "approved original lyrics align to original source");
const aligned = await r.json();
checked(aligned.cues[0].text === "Love and light", "approved words unchanged");
checked(aligned.confidenceAvailable === false, "no invented word confidence");
state.providerResult = {
  text: "Love and night now",
  language_code: "eng",
  words: [
    { type: "word", text: "Love", start: 2, end: 2.2 },
    { type: "word", text: "and", start: 2.3, end: 2.5 },
    { type: "word", text: "night", start: 2.6, end: 2.9 },
    { type: "word", text: "now", start: 3, end: 3.3 },
  ],
};
r = await sync.POST(
  request("/api/studio/lyric-sync", "POST", {
    songId: "song-1",
    audioId: replaced.audioId,
    sourceAudioId: "original-audio",
    duration: 180,
    mode: "audit",
    text: original.notes.lyrics,
    language: "eng",
  }),
);
checked(r.status === 200, "recognition comparison succeeds");
const audit = await r.json();
checked(audit.differences.length > 0, "changed/added recognized words flagged");
checked(
  state.studio.songs[0].notes.lyrics === original.notes.lyrics,
  "audit never rewrites approved original",
);
state.providerResult = {
  text: "نور الحب",
  language_code: "ara",
  language_probability: 0.9,
  words: [
    { type: "audio_event", text: "[music]", start: 0, end: 1 },
    { type: "word", text: "نور", start: 2, end: 2.5, speaker_id: "A" },
    { type: "word", text: "الحب", start: 2.6, end: 3, speaker_id: "A" },
  ],
};
r = await sync.POST(
  request("/api/studio/lyric-sync", "POST", {
    songId: "song-1",
    audioId: replaced.audioId,
    duration: 180,
    mode: "transcribe",
    language: "ara",
  }),
);
const transcript = await r.json();
checked(
  r.status === 200 && transcript.language === "ara",
  "detected language returned",
);
checked(transcript.cues[0].text === "نور الحب", "Arabic wording retained");
checked(
  state.providerCalls.at(-1).fields.language_code === "ara",
  "corrected language sent to provider",
);
// A provider failure does not mutate project state.
const unchanged = JSON.stringify(state.studio);
state.providerStatus = 429;
r = await sync.POST(
  request("/api/studio/lyric-sync", "POST", {
    songId: "song-1",
    audioId: replaced.audioId,
    mode: "transcribe",
  }),
);
checked(r.status === 429, "rate-limit error is actionable");
checked(
  JSON.stringify(state.studio) === unchanged,
  "provider failure preserves project",
);
state.providerStatus = 200;
r = await project.PATCH(
  request("/api/studio/lyric-project", "PATCH", {
    sourceSongId: "song-1",
    mixId: "mix-1",
    audioSongId: "song-2",
  }),
);
checked(r.status === 200, "saved mix can attach uploaded audio");
checked(
  state.studio.songs[0].mixes[0].audioSongId === "song-2",
  "mix link retains local audio reference",
);
checked(
  state.studio.songs[1].notes.lyrics === original.notes.lyrics,
  "saved mix automatically inherits lyrics",
);
r = await create.POST(
  request("/api/studio/create", "POST", {
    action: "song",
    title: "Caption ready",
    language: "en",
    instruments:"Oud, Piano",genres:"Jazz, Lebanese Dabke",autoTitle:true,
    prompt: "Clear original music",
    lyrics: "[Verse]\nApproved words stay exact!",
    voice: "Solo, English",
    duration: 30,
    instrumental: false,
    captionReady: true,
  }),
);
checked(
  r.status === 200,
  "caption-ready generation saves a linked original with a mocked provider: " + (r.status===200?"ok":await r.clone().text()),
);
const generated = state.studio.songs[0];
checked(generated.notes.instruments==="Oud, Piano"&&generated.tags.includes("Jazz"),"instrument and genre selections are saved with the actual song");
checked(generated.name==="Approved words stay exact","automatic title comes from approved lyrics while lyrics stay unchanged");
checked(generated.creationDraft===false&&Number.isFinite(Date.parse(generated.createdAt)),"completed generated songs are ready in My Songs with a server creation date");
checked(
  generated.notes.lyrics === "[Verse]\nApproved words stay exact!",
  "exact approved lyrics preserved",
);
checked(
  generated.generation?.timingSource === "not-provided",
  "missing provider timing is explicit",
);
checked(
  generated.generation?.compositionPlan?.chunks?.length > 0,
  "provider composition plan preserved",
);
checked(
  state.studio.voices[0].id === "keep-voice",
  "existing voice collection remains unchanged",
);
checked(
  new Set(state.studio.songs.map((s) => s.id)).size ===
    state.studio.songs.length,
  "pending generation does not duplicate its source song",
);
checked(
  generated.generation.audioId === generated.id,
  "generation provenance points to the generated audio",
);
// Reject placeholders before paid requests; opening preferences must reach composition styles.
const beforeEmpty=state.providerCalls.length, beforeEmptySongs=JSON.stringify(state.studio.songs);
for(const lyrics of ["[Intro]\n[Verse 1]\n[Chorus]", "[Verse]\n{Soft lead vocals}"]){
  const bad=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Empty template",prompt:"Uplifting music",lyrics,duration:60}));
  checked(bad.status===400,"section-only lyric skeleton is rejected");
}
checked(state.providerCalls.length===beforeEmpty&&JSON.stringify(state.studio.songs)===beforeEmptySongs,"empty lyric validation makes no provider call or song changes");
const sourceLyrics="[Intro]\n{Gentle atmospheric instrumental opening}\n[Verse]\nLove and light we sing together\n[Chorus]\nLove and light we sing together";
r=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Prompt start",prompt:"Original uplifting music",lyrics:sourceLyrics,duration:60,openingMode:"direct"}));
checked(r.status===200,"explicit song opening is accepted");
const openingSong=state.studio.songs[0],openingPlan=openingSong.generation.compositionPlan.chunks;
checked(openingSong.notes.lyrics===sourceLyrics,"opening preference preserves every approved lyric and cue");
checked(openingPlan[0].duration_ms===3000&&openingPlan.reduce((sum,c)=>sum+c.duration_ms,0)===60000,"empty intro instructions receive minimum time rather than word-weighted lyric time");
checked(openingPlan[1].duration_ms>openingPlan[0].duration_ms,"sung words receive the performed-word allocation");
checked(state.providerCalls.findLast(c=>c.path.startsWith("music?")).payload.composition_plan.chunks.every(c=>c.positive_styles.some(s=>s.includes("Begin the musical hook"))),"opening direction reaches the actual music request");
const bracketLyrics="[Style: Celestial Oud-Trance, warm oud and light darbuka]\n[deep male vocals with soft female repetition]\nsamadhi love original sending light and love (whisper gently)\n[short Intro: soft oud over distant shimmer]";
r=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Bracket directions",prompt:"Original uplifting music",lyrics:bracketLyrics,duration:60,captionReady:true}));
checked(r.status===200,"brackets and parentheses accepted as production directions");
const bracketSong=state.studio.songs[0],bracketCall=state.providerCalls.findLast(c=>c.path.startsWith("music?")),bracketChunks=bracketCall.payload.composition_plan.chunks;
checked(bracketSong.notes.lyrics===bracketLyrics&&bracketSong.generation.approvedLyrics===bracketLyrics,"original bracket and parenthesis source preserved exactly");
checked(bracketChunks.map(c=>c.text).join("\n")==="[Verse]\nsamadhi love original sending light and love\n[Intro]","actual music payload excludes instruction prose from performed text");
checked(["Celestial Oud-Trance","deep male vocals","whisper gently","soft oud"].every(note=>JSON.stringify(bracketChunks.map(c=>c.positive_styles)).includes(note)),"all bracket and parenthesis instructions reach provider styles");
const beforeMalformed=state.providerCalls.length;
r=await create.POST(request("/api/studio/create","POST",{action:"song",prompt:"Original music",lyrics:"Love [whisper",duration:60,readLyricStyles:false}));
checked(r.status===400&&state.providerCalls.length===beforeMalformed,"unclosed notation is rejected before provider even with genre reading off");
const beforeMode=state.providerCalls.length;
r=await create.POST(request("/api/studio/create","POST",{action:"song",prompt:"Original music",duration:60,openingMode:"invalid"}));
checked(r.status===400&&state.providerCalls.length===beforeMode,"invalid opening option fails before generation");
const codedLyrics = "[Verse 1 | genre: Lebanese Dabke]\nنور وحب\n[Chorus]\n{genre: Afro House}\nLove and light\n[Chorus | genre: R&B]\nLove and light";
r=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Coded fusion",prompt:"Original uplifting music",lyrics:codedLyrics,duration:60,instrumental:false,captionReady:true}));
checked(r.status===200,"coded section genres generate through the existing endpoint");
const codedSong=state.studio.songs[0],codedPlan=codedSong.generation.compositionPlan.chunks;
checked(codedSong.notes.lyrics===codedLyrics&&codedSong.generation.approvedLyrics===codedLyrics,"coded approved lyrics remain exact in both saved records");
checked(["Lebanese Dabke","Afro House","R&B"].every((g,i)=>codedPlan[i].positive_styles.includes(g)),"repeated section names keep their own coded genres");
checked(codedPlan[0].text==="[Verse 1]\nنور وحب"&&codedPlan[1].text==="[Chorus]\nLove and light","only production notation is removed from provider text");
const codedCall=state.providerCalls.findLast(c=>c.path.startsWith("music?"));
checked(codedCall.payload.composition_plan.chunks[2].positive_styles.includes("R&B"),"coded styles reach the actual provider payload");
const beforeInvalid=state.providerCalls.length;
r=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Invalid cue",prompt:"Original music",lyrics:"[Verse | genre: "+"x".repeat(161)+"]\nApproved words",duration:30}));
checked(r.status===400&&state.providerCalls.length===beforeInvalid,"invalid lyric genre code is rejected before a paid provider request");
r=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Ignore coded styles",prompt:"Original music",lyrics:codedLyrics,duration:60,readLyricStyles:false}));
checked(r.status===200,"lyric style interpretation has an explicit off switch");
checked(state.studio.songs[0].generation.compositionPlan.chunks.every(c=>!c.text.includes("genre:")&&!c.positive_styles.includes("Afro House")),"disabled cues are removed from provider text without applying their styles");
state.failMusic = true;
r = await create.POST(
  request("/api/studio/create", "POST", {
    action: "song",
    title: "Recovery draft",
    prompt: "Clear original music",
    lyrics: "[Verse]\nThese approved words must survive failure",
    voice: "Solo",
    duration: 30,
    instrumental: false,
    captionReady: true,
  }),
);
checked(r.status === 502, "failed music generation returns a useful failure");
const failed = await r.json(),
  writing = state.studio.songs.find((s) => s.id === failed.songId);
checked(
  !!failed.data && Number.isSafeInteger(failed.revision),
  "failed generation returns refreshed Studio state",
);
checked(
  writing?.notes.lyrics ===
    "[Verse]\nThese approved words must survive failure",
  "approved writing survives provider failure",
);
checked(
  writing?.generation?.status === "incomplete" && !writing.audioFormat,
  "incomplete generation is not advertised as playable audio",
);
state.failMusic = false;
// Regression checks: no hidden 100-version cap; opaque storage continuation remains accessible.
for(let i=0;i<1004;i++) await bucket.put(`lyric-projects/owner/song-1/page-${String(i).padStart(4,"0")}.json`,"{}",{customMetadata:{name:"History fixture",at:new Date(1700000000000+i*1000).toISOString(),audioId:"original-audio"}});
let pageResponse=await project.GET(request("/api/studio/lyric-project?song=song-1","GET"));const firstPage=await pageResponse.json();
checked(firstPage.versions.length===1000&&firstPage.truncated&&firstPage.next,"history exposes all entries in its first storage page");
pageResponse=await project.GET(request("/api/studio/lyric-project?song=song-1&cursor="+encodeURIComponent(firstPage.next),"GET"));const lastPage=await pageResponse.json();
checked(lastPage.versions.length===5&&!lastPage.next,"remaining history entries are reachable");
checked(new Set([...firstPage.versions,...lastPage.versions].map(v=>v.id)).size===1005,"history pages do not lose or duplicate snapshots");
checked((await project.GET(request("/api/studio/lyric-project?song=song-1&cursor="+"x".repeat(2049),"GET"))).status===400,"invalid history cursor rejected");
await bucket.put("lyric-assets/owner/song-1/classic-video",new Uint8Array([1,2]),{customMetadata:{song:"song-1",kind:"video",source:"original-audio",createdAt:new Date().toISOString()},httpMetadata:{contentType:"video/webm"}});
await bucket.put("lyric-assets/owner/song-1/private-image",new Uint8Array([1]),{customMetadata:{song:"song-1",kind:"background"},httpMetadata:{contentType:"image/png"}});
const videoResponse=await assets.GET(request("/api/studio/lyric-assets?song=song-1&videos=1","GET"));const videosPage=await videoResponse.json();
checked(videosPage.videos.some(v=>v.id==="classic-video"&&v.extension==="webm"),"Classic uploaded exports are discoverable without project rewrites");
checked(!videosPage.videos.some(v=>v.id==="private-image"),"saved-video listing excludes images");
state.id="other-owner";checked((await assets.GET(request("/api/studio/lyric-assets?song=song-1&videos=1","GET"))).status===404,"other account cannot list private song exports");state.id="owner";
// Musical advertisements reuse real production and private media routes.
const adBrief={brand:"Bright Coffee",benefit:"Freshly roasted coffee",audience:"Local coffee lovers",cta:"Visit our store",seconds:15,style:"jingle"};
let adResponse=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Coffee ad",prompt:"Create an original coffee jingle",lyrics:"[Hook]\nBright Coffee today\n[Brand ending]\nVisit our store",duration:15,musicalAd:adBrief}));
checked(adResponse.status===200,"musical advertisement uses existing song production");
checked(JSON.stringify(state.studio.songs[0].musicalAd)===JSON.stringify(adBrief)&&JSON.parse(state.studio.songs[0].notes.promotion).kind==="musical-ad/v1","ad brief persists privately with the generated song");
const beforeAdInvalid=state.providerCalls.length;
adResponse=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Invalid",prompt:"Music",duration:30,musicalAd:adBrief}));checked(adResponse.status===400&&state.providerCalls.length===beforeAdInvalid,"ad duration mismatch is rejected without provider charges");
adResponse=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Invalid",prompt:"Music",duration:15,musicalAd:{...adBrief,benefit:""}}));checked(adResponse.status===400&&state.providerCalls.length===beforeAdInvalid,"incomplete ad brief is rejected before provider requests");
const footageSong=state.studio.songs.find(s=>s.id==="song-1"),footageProject={...structuredClone(input),pro:{...newProSettings(footageSong,180),sourceAudioId:footageSong.audioId??footageSong.id,backgroundVideo:{asset:"product-video",duration:5,trimStart:0,trimEnd:5,loop:true,fit:"contain"},advertisement:{brand:"Bright Coffee",cta:"Visit our store"}}};
const footageRequest=()=>request("/api/studio/lyric-project","PUT",{songId:footageSong.id,project:footageProject,expected:footageSong.lyricVideo?.pro?.updatedAt??null});
let footageResponse=await project.PUT(footageRequest());checked(footageResponse.status===400,"unknown/foreign video asset cannot attach to an owned project");
await bucket.put("lyric-assets/owner/song-1/product-video",new Uint8Array([1,2]),{customMetadata:{song:"song-1",kind:"sourceVideo"},httpMetadata:{contentType:"video/mp4"}});
footageResponse=await project.PUT(footageRequest());checked(footageResponse.status===200,"owned product footage and CTA save with the same timed lyric project");
checked(state.studio.songs.find(s=>s.id==="song-1").lyricVideo.pro.backgroundVideo.asset==="product-video","product-video settings survive save and reopen");
// Studio vocals default to caption-ready production, and sync can retrieve the exact saved words.
let clearResponse=await create.POST(request("/api/studio/create","POST",{action:"song",title:"Clear vocal default",prompt:"A warm original song",lyrics:"[Verse]\nClear words from our song",duration:30}));
checked(clearResponse.ok&&state.studio.songs[0].generation.captionReady===true,"caption-ready vocal production is the real generation default");
checked(state.providerCalls.findLast(c=>c.path?.startsWith("music?")).payload.composition_plan.chunks.some(c=>c.positive_styles.some(style=>style.includes("Caption-ready vocal production"))),"clear lead phrasing and restrained reverb directions reach the actual provider request");
const autoCaptionSong=state.studio.songs[0],approvedAuto=autoCaptionSong.generation.approvedLyrics;
state.providerResult={characters:[..."Clear words from our song"].map((text,i)=>({text,start:1+i*.1,end:1+(i+1)*.1}))};
clearResponse=await sync.POST(request("/api/studio/lyric-sync","POST",{songId:autoCaptionSong.id,audioId:autoCaptionSong.audioId,sourceAudioId:autoCaptionSong.audioId??autoCaptionSong.id,duration:30,mode:"auto"}));
const smartCaptions=await clearResponse.json();checked(clearResponse.ok&&smartCaptions.cues[0].text==="Clear words from our song","automatic captions retrieve saved approved lyrics without a pasted text field");checked(state.providerCalls.findLast(c=>c.endpoint).endpoint==="forced-alignment","saved Studio lyrics guide true forced alignment rather than free transcription");checked(autoCaptionSong.generation.approvedLyrics===approvedAuto&&smartCaptions.confidenceAvailable===false,"smart alignment preserves approved lyrics and does not invent confidence scores");
state.providerResult={words:[{text:"Clear",start:1,end:1.4},{text:"words",start:1.5,end:2},{text:"from",start:2.1,end:2.5},{text:"our",start:10,end:10.4},{text:"song",start:10.5,end:11}]};
clearResponse=await sync.POST(request("/api/studio/lyric-sync","POST",{songId:autoCaptionSong.id,audioId:autoCaptionSong.audioId,sourceAudioId:autoCaptionSong.audioId??autoCaptionSong.id,duration:30,mode:"auto"}));
const pauseCaptions=await clearResponse.json();checked(clearResponse.ok&&pauseCaptions.cues.length===2&&pauseCaptions.cues[0].end===2.5&&pauseCaptions.cues[1].time===10,"automatic Studio alignment leaves a measured instrumental pause between sung phrases");checked(pauseCaptions.cues.map(c=>c.text).join(" ")==="Clear words from our song"&&autoCaptionSong.generation.approvedLyrics===approvedAuto,"pause-aware display grouping preserves every approved word and the saved lyrics");
console.log(
  JSON.stringify({
    apiChecks: checks,
    status: "passed",
    provider: "mocked; no live account credits used",
    storage: "in-memory R2/Studio mocks; no live data changed",
  }),
);
