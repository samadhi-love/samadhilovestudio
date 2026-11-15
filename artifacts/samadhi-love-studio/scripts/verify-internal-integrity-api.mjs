// Reuse the existing isolated route fixtures. No requests reach the live site or providers.
await import("./verify-project-workflow-api.mjs");
import assert from "node:assert/strict";
const work = new URL("../work/project-workflow-api-tests/", import.meta.url);
const workspace = await import(new URL("workspace.mjs", work));
const audio = await import(new URL("audio.mjs", work));
const project = await import(new URL("project.mjs", work));
const assets = await import(new URL("assets.mjs", work));
const create = await import(new URL("create.mjs", work));
const state = globalThis.__pro, original = structuredClone(state.studio);
const request = (url, method, body, headers = {}) => new Request("https://studio.test" + url, { method, headers: { Origin: "https://studio.test", "Content-Type": "application/json", ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
let checks = 0;
function check(value, message) { assert(value, message); checks++; }
for (const data of [null, [], { songs: [null], templates: [] }, { ...original, songs: [...original.songs, original.songs[0]] }, ...["notes", "versions", "mixes"].map(key => ({ ...original, songs: [{ ...original.songs[0], [key]: null }] }))]) {
  const response = await workspace.PUT(request("/api/studio", "PUT", { data, revision: state.revision }));
  check(response.status === 400, "malformed workspace returns a useful 400");
  check(JSON.stringify(state.studio) === JSON.stringify(original), "rejected input leaves all saved data unchanged");
}
let response = await workspace.PUT(request("/api/studio", "PUT", { data: original, revision: state.revision }, { "X-Studio-Workspace": "another-account" }));
check(response.status === 409, "stale account tab cannot save into the new signed-in account");
const song = original.songs.find(s => s.sourceSessionId === "session-keep" && s.audioHistory?.length);
check(!!song, "fixture includes retained audio history");
const old = song.audioHistory[0];
response = await audio.GET(request(`/api/studio/audio?song=${song.id}&v=${old.audioId}`, "GET"));
check(response.ok, "explicit historical recording loads");
check(new Uint8Array(await response.arrayBuffer())[0] === 1, "historical request returns original bytes rather than replacement bytes");
response = await audio.GET(request(`/api/studio/audio?song=${song.id}`, "GET"));
check(new Uint8Array(await response.arrayBuffer())[0] === 5, "unversioned request still returns current recording");
response = await audio.GET(request(`/api/studio/audio?song=${song.id}&v=not-in-this-project`, "GET"));
check(response.status === 404, "unavailable version never silently falls back");
response = await audio.HEAD(request(`/api/studio/audio?song=${song.id}&v=${old.audioId}`, "HEAD", undefined, { Range: "bytes=1-2" }));
check(response.status === 206 && (await response.text()) === "", "historical ranged HEAD has no body");
response = await audio.GET(request(`/api/studio/audio?song=${song.id}&v=${old.audioId}`, "GET", undefined, { Range: "bytes=99-100" }));
check(response.status === 416, "out of bounds audio range is recoverable");
for (const route of [project.PUT, project.PATCH]) {
  response = await route(request("/api/studio/lyric-project", "PUT", null));
  check(response.status === 400, "null video/mix input returns JSON validation error");
}
const realGet = state.env.BUCKET.get;
state.env.BUCKET.get = async () => { throw new Error("temporary storage outage"); };
try {
  response = await audio.GET(request(`/api/studio/audio?song=${song.id}`, "GET"));
  check(response.status === 503 && typeof (await response.json()).error === "string", "audio outage returns recoverable JSON");
  response = await assets.GET(request(`/api/studio/lyric-assets?song=${song.id}&source=${song.audioId}`, "GET"));
  check(response.status === 503, "video source outage is recoverable");
} finally { state.env.BUCKET.get = realGet; }
check(JSON.stringify(state.studio) === JSON.stringify(original), "failed reads never modify songs, settings or integrations");
let pulled = 0, canceled = false;
const stream = new ReadableStream({ pull(controller) { pulled++; controller.enqueue(new Uint8Array(200_000)); if (pulled === 100) controller.close(); }, cancel() { canceled = true; } });
response = await workspace.PUT(new Request("https://studio.test/api/studio", { method: "PUT", headers: { Origin: "https://studio.test" }, body: stream, duplex: "half" }));
check(response.status === 413 && canceled && pulled < 100, "oversize streamed workspace is canceled before reading the full body");
const providerCalls = state.providerCalls.length;
response = await create.POST(request("/api/studio/create", "POST", {}, { "X-Studio-Workspace": "another-account" }));
check(response.status === 409 && state.providerCalls.length === providerCalls, "account switch blocks creation before any provider request");
state.studio.futureSetting = { retained: true };
response = await workspace.PUT(request("/api/studio", "PUT", { revision: state.revision, data: { songs: original.songs, templates: original.templates } }));
check(response.ok && state.studio.futureSetting.retained, "an older client cannot erase omitted future settings or collections");
check(JSON.stringify(state.studio.voices) === JSON.stringify(original.voices) && JSON.stringify(state.studio.station) === JSON.stringify(original.station), "omitted voice and station collections survive a partial legacy save");
console.log(JSON.stringify({ internalApiChecks: checks, status: "passed", environment: "isolated mocks; no live data or paid calls" }));
