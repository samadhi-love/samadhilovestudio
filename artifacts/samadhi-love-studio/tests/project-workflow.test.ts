import assert from "node:assert/strict";
import test from "node:test";
import { freshSong, maxAudioBytes } from "../app/studio-data";
import { attachRenderedMix, pinnedMaster, projectMembers, projectRoot, validReleaseMetadata } from "../app/project-assets";
import { maxTrackSeconds, maxProductionSeconds } from "../app/track-duration";
import { maxMixSeconds } from "../app/multitrack-audio";
import { sessionSeconds, emptySession, validSession, dry, noTuning } from "../app/vocal/session";
import { averageLevel, matchedGains } from "../app/project-production";
import { packageFileName, zipPackage } from "../app/release-package";
import { unzipSync } from "fflate";

const root = { ...freshSong("root", "Original", 0), audioFormat: "mp3" as const, audioId: "audio-one", notes: { ...freshSong("x", "x", 0).notes, lyrics: "Love and light" } };
const rendered = { ...freshSong("mix", "Final mix", 1), audioFormat: "wav" as const };

test("production accepts a full six-minute stereo WAV, including an effects tail", () => {
  assert(maxProductionSeconds >= maxTrackSeconds);
  assert.equal(maxMixSeconds, sessionSeconds);
  assert(44 + Math.ceil((maxTrackSeconds + 1.3) * 44100) * 4 < maxAudioBytes);
  assert(44 + Math.ceil((maxProductionSeconds + 1.3) * 44100) * 4 < maxAudioBytes);
});
test("existing four-minute sessions and new six-minute sessions keep the same valid schema", () => {
  for (const duration of [240, 360, 480]) {
    const source = { id: crypto.randomUUID(), name: "Original take", duration };
    const session = { ...emptySession(), sources: [source], clips: [{ id: crypto.randomUUID(), source: source.id, name: "Vocal", role: "Lead vocal" as const, start: 0, end: duration, at: 0, volume: 1, pan: 0, mute: false, solo: false, bypass: false, effects: dry, tuning: noTuning, fadeIn: 0, fadeOut: 0 }] };
    assert(validSession(session)); assert.deepEqual(JSON.parse(JSON.stringify(session)), session);
  }
});
test("rendering a mix preserves the original and links its lyrics and folder without mutating inputs", () => {
  const songs = [{ ...root, folderId: "album" }], before = structuredClone(songs);
  const linked = attachRenderedMix(songs, songs[0], rendered, "session-1");
  assert.deepEqual(songs, before); assert.equal(linked.length, 2);
  assert.equal(linked[0].projectId, root.id); assert.equal(linked[0].notes.lyrics, root.notes.lyrics);
  assert.equal(linked[0].folderId, "album"); assert.equal(linked[0].sourceSessionId, "session-1");
  assert.equal(linked[1].mixes[0].audioSongId, rendered.id); assert.equal(linked[1].audioId, root.audioId);
});
test("nested renders stay in their original project and repeated linking does not duplicate records", () => {
  const first = attachRenderedMix([root], root, rendered);
  const second = { ...rendered, id: "second", name: "Second mix" };
  const result = attachRenderedMix(first, first[0], second);
  assert.equal(projectRoot(result, result[0]).id, root.id);
  const again = attachRenderedMix(result, root, second);
  assert.equal(again.filter(s => s.id === second.id).length, 1);
  assert.equal(again.find(s => s.id === root.id)!.mixes.filter(m => m.audioSongId === second.id).length, 1);
});
test("generated variations retain their own approved lyrics", () => {
  const generated = { ...rendered, notes: { ...rendered.notes, lyrics: "New approved words" }, generation: { provider: "ElevenLabs", model: "test", approvedLyrics: "New approved words", compositionPlan: {}, createdAt: "now", captionReady: true, timingSource: "not-provided" } };
  assert.equal(attachRenderedMix([root], root, generated)[0].notes.lyrics, "New approved words");
});
test("section edits of an alternate version retain that version's lyrics and original project", () => {
  const alternate = { ...rendered, audioId:"alternate-audio", projectId:root.id, notes:{...rendered.notes, lyrics:"Alternate approved words",prompt:"Alternate musical direction"} };
  const edited = { ...rendered,id:"section-edit", sectionEdit:{sourceSongId:alternate.id,sourceAudioId:alternate.audioId??alternate.id,fade:.5,clips:[{songId:alternate.id,audioId:alternate.audioId??alternate.id,from:0,to:10}]} };
  const result=attachRenderedMix([root,alternate],alternate,edited);
  assert.equal(result[0].projectId,root.id);assert.equal(result[0].notes.lyrics,alternate.notes.lyrics);assert.equal(result[0].notes.prompt,alternate.notes.prompt);assert.equal(result.find(s=>s.id===root.id)!.notes.lyrics,root.notes.lyrics);assert.equal(result[0].lyricVideo,undefined);
});
test("legacy mix attachments join the project while unrelated and deleted songs stay separate", () => {
  const original = { ...root, mixes: [{ id: "legacy", name: "Legacy mix", notes: "", link: "", audioSongId: rendered.id }] };
  const songs = [original, rendered, freshSong("unrelated", "Unrelated", 0), { ...rendered, id: "trash", projectId: root.id, deletedAt: "now" }];
  assert.deepEqual(projectMembers(songs, original).map(s => s.id), [root.id, rendered.id]);
});
test("invalid parent cycles terminate without modifying records", () => {
  const a = { ...root, projectId: "mix" }, b = { ...rendered, projectId: "root" };
  assert(projectRoot([a, b], a)); assert.equal(a.projectId, "mix");
});
test("master selection remains pinned when the current recording is replaced", () => {
  const project = { ...root, master: { songId: root.id, audioId: "audio-one" }, audioId: "audio-two", audioHistory: [{ audioId: "audio-one", audioFormat: "mp3" as const, date: "now", name: "Original" }] };
  const master = pinnedMaster([project], project)!;
  assert.equal(master.audioId, "audio-one"); assert(master.url.includes("source=audio-one"));
  assert.equal(pinnedMaster([{ ...project, audioHistory: [] }], project), null);
});
test("an unrelated recording cannot resolve as a project's master", () => {
  const project = { ...root, master: { songId: rendered.id, audioId: rendered.id } };
  assert.equal(pinnedMaster([project, rendered], project), null);
});
test("average-level matching reduces the louder source and never boosts or divides by silence", () => {
  assert.deepEqual(matchedGains([0.5, 0.25]), [0.5, 1]);
  assert.deepEqual(matchedGains([0, 0]), [0, 0]);
  assert.deepEqual(matchedGains([0, 0.25]), [0, 1]);
  const samples = new Float32Array(64).fill(0.25);
  assert.equal(averageLevel({ numberOfChannels: 2, getChannelData: () => samples } as unknown as AudioBuffer), 0.25);
});
test("release identifiers are optional and validated rather than invented", () => {
  const metadata = { artist: "SAMADHI LOVE", credits: "Original music", copyright: "", isrc: "", upc: "" };
  assert(validReleaseMetadata(metadata)); assert(validReleaseMetadata({ ...metadata, isrc: "USAAA2600001", upc: "123456789012" }));
  assert(!validReleaseMetadata({ ...metadata, isrc: "bad" })); assert(!validReleaseMetadata({ ...metadata, credits: "x".repeat(4001) }));
});
test("package filenames cannot introduce absolute paths or parent traversal", () => {
  const name = packageFileName("../../music/song\\master");
  assert(!name.includes("..")); assert(!name.includes("/")); assert(!name.includes("\\"));
});
test("release ZIP preserves actual file content and honors cancellation", async () => {
  const bytes = new TextEncoder().encode("Approved lyrics");
  const zip = await zipPackage([{ name: "lyrics.txt", bytes }], new AbortController().signal);
  assert.equal(new TextDecoder().decode(unzipSync(zip)["lyrics.txt"]), "Approved lyrics");
  const canceled = new AbortController(); canceled.abort();
  await assert.rejects(zipPackage([{ name: "lyrics.txt", bytes }], canceled.signal), { name: "AbortError" });
});
