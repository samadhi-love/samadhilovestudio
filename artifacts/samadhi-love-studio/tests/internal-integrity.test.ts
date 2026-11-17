import test from "node:test";
import assert from "node:assert/strict";
import { isStudio } from "../app/studio-validation";
import { freshSong, initialStudio } from "../app/studio-data";
import { isLyricProject } from "../app/lyric-video-data";
import { newProSettings } from "../app/lyric-pro-data";
import { validSession, emptySession } from "../app/vocal/session";
import { mergeSavedSong, syncSongSource } from "../app/song-save-merge";

test("workspace validation preserves old projects and extensions while rejecting data that crashes tools", () => {
  const extended = { ...structuredClone(initialStudio), futureSetting: { keep: true } };
  extended.songs[0].audioHistory = [{ audioId: "older-audio", audioFormat: "wav", date: "2026-11-01", name: "Original" }];
  const unchanged = JSON.stringify(extended);
  assert(isStudio(extended)); assert.equal(JSON.stringify(extended), unchanged);
  const withMelodyTakes=structuredClone(initialStudio);
  withMelodyTakes.songs[0].melodyReferences=[
    {assetId:"melody-take-one",contentType:"audio/webm",durationSeconds:120,savedAt:"2026-11-17T00:00:00.000Z"},
    {assetId:"melody-take-two",contentType:"audio/webm",durationSeconds:300,savedAt:"2026-11-17T00:00:00.000Z"},
  ];
  assert(isStudio(withMelodyTakes));
  assert.equal(isStudio({...withMelodyTakes,songs:[{...withMelodyTakes.songs[0],melodyReferences:[{assetId:"too-long",contentType:"audio/webm",durationSeconds:301,savedAt:"2026-11-17T00:00:00.000Z"}]},...withMelodyTakes.songs.slice(1)]}),false);
  for (const value of [null, [], { songs: [null], templates: [] }, { ...extended, songs: [...extended.songs, extended.songs[0]] },
    { ...extended, folders: [{ id: "folder", name: null }] }, { ...extended, station: { skin: "cosmic", queue: [null] } },
    ...["notes", "mixes", "versions", "tags", "done"].map(key => ({ ...extended, songs: [{ ...extended.songs[0], [key]: null }] }))]) {
    assert.equal(isStudio(value), false, JSON.stringify(value));
  }
});

test("invalid nested lyric and vocal imports return false instead of throwing", () => {
  const p = newProSettings(freshSong("song", "Song", 0), 30);
  const project = { theme: "cosmic", motion: "drift", format: "wide", cues: [], pro: p };
  assert(isLyricProject(project));
  for (const bad of [{ ...project, pro: { ...p, formatLooks: null } }, { ...project, pro: { ...p, duetColors: [{} , {}] } }]) {
    assert.doesNotThrow(() => isLyricProject(bad)); assert.equal(isLyricProject(bad), false);
  }
  const session = emptySession();
  for (const bad of [{ ...session, sources: [null] }, { ...session, clips: [null] }, { ...session, presets: [null] }]) {
    assert.doesNotThrow(() => validSession(bad)); assert.equal(validSession(bad), false);
  }
});

test("a delayed save retains newly edited lyrics, favorites and tags while acknowledging the saved version", () => {
  const before = freshSong("song", "Original title", 0);
  const saved = { ...before, name: "Approved title", versions: { ...before.versions, lyrics: [{ id: "snapshot", label: "Saved", date: "2026-11-11", text: "Approved words" }] } };
  const newer = { ...before, favorite: true, tags: ["New direction"], notes: { ...before.notes, lyrics: "Newer words typed during save" } };
  const merged = mergeSavedSong(before, newer, saved);
  assert.equal(merged.notes.lyrics, newer.notes.lyrics); assert.equal(merged.favorite, true);
  assert.deepEqual(merged.tags, newer.tags); assert.deepEqual(merged.versions, saved.versions);
  assert.equal(merged.name, saved.name); assert.equal(before.notes.lyrics, "");
});

test("recording replacement refreshes history without false unsaved edits or losing unfinished writing", () => {
  const before = { ...freshSong("song", "My recording", 0), audioFormat: "mp3" as const, audioId: "first" };
  const stored = { ...before, audioId: "second", audioHistory: [{ audioId: "first", audioFormat: "mp3" as const, date: "2026-11-11", name: before.name }] };
  assert.deepEqual(JSON.parse(JSON.stringify(syncSongSource(before, stored))), stored);
  const writing = { ...before, notes: { ...before.notes, lyrics: "Unfinished new words" } };
  const refreshed = syncSongSource(writing, stored);
  assert.equal(refreshed.notes.lyrics, writing.notes.lyrics);
  assert.equal(refreshed.audioId, "second"); assert.deepEqual(refreshed.audioHistory, stored.audioHistory);
  assert.equal(before.audioId, "first");
});
