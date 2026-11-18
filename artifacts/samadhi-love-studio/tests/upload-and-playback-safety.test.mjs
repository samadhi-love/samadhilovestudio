// Upload type check + single-song lookup for playback. Plain Node 22.18+ (type stripping).
import test from "node:test";
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {audioSignatureCheck, looksLikeAudio, NotAudioError} from "../app/audio-signature.ts";

const bytes = (...parts) => {
  const out = [];
  for (const part of parts) {
    if (typeof part === "string") for (const char of part) out.push(char.charCodeAt(0));
    else out.push(...part);
  }
  while (out.length < 16) out.push(0);
  return new Uint8Array(out);
};

test("every supported audio format is recognised", () => {
  assert.ok(looksLikeAudio(bytes("ID3")), "mp3 with tags");
  assert.ok(looksLikeAudio(bytes([0xff, 0xfb])), "mp3 frame");
  assert.ok(looksLikeAudio(bytes([0xff, 0xf1])), "aac frame");
  assert.ok(looksLikeAudio(bytes("RIFF", [1, 2, 3, 4], "WAVE")), "wav");
  assert.ok(looksLikeAudio(bytes([0, 0, 0, 0x20], "ftypM4A ")), "m4a");
  assert.ok(looksLikeAudio(bytes("fLaC")), "flac");
  assert.ok(looksLikeAudio(bytes("OggS")), "ogg / opus");
  assert.ok(looksLikeAudio(bytes([0x1a, 0x45, 0xdf, 0xa3])), "webm");
});

test("web pages, images, programs and documents are refused", () => {
  for (const [name, head] of [
    ["html", bytes("<!DOCTYPE html>")],
    ["script", bytes("<script>alert")],
    ["png", bytes([0x89], "PNG")],
    ["jpeg", bytes([0xff, 0xd8, 0xff, 0xe0])],
    ["zip/docx", bytes("PK", [3, 4])],
    ["pdf", bytes("%PDF-1.7")],
    ["exe", bytes("MZ")],
    ["riff but not wave (avi)", bytes("RIFF", [1, 2, 3, 4], "AVI ")],
  ]) assert.equal(looksLikeAudio(head), false, name);
});

async function pump(chunks) {
  const check = audioSignatureCheck();
  const received = [];
  const writer = check.writable.getWriter();
  const reading = (async () => {
    for await (const chunk of check.readable) received.push(...chunk);
  })();
  try {
    for (const chunk of chunks) await writer.write(chunk);
    await writer.close();
    await reading;
    return {received, refused: check.refused};
  } catch (error) {
    await reading.catch(() => {});
    return {error, refused: check.refused};
  }
}

test("audio passes through unchanged, even when its header is split across chunks", async () => {
  const wav = bytes("RIFF", [1, 2, 3, 4], "WAVE", "fmt ");
  const result = await pump([wav.subarray(0, 3), wav.subarray(3, 9), wav.subarray(9)]);
  assert.equal(result.error, undefined);
  assert.deepEqual(result.received, [...wav]);
  assert.equal(result.refused, false);
});

test("a fake audio file is stopped and flagged", async () => {
  const result = await pump([bytes("<html><body>not a song</body></html>")]);
  assert.ok(result.error instanceof NotAudioError);
  assert.equal(result.refused, true);
});

test("tiny test payloads below the check window still pass", async () => {
  const result = await pump([new TextEncoder().encode("wave")]);
  assert.equal(result.error, undefined);
  assert.equal(result.received.length, 4);
});

test("playback lookup returns just the one song from the saved library (real SQLite)", async () => {
  // D1 is SQLite: run the exact query the server uses against the real table shape.
  const {songLookupSql} = await import("../app/server/song-lookup-sql.ts");
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE studios(owner TEXT PRIMARY KEY, content TEXT NOT NULL, revision INTEGER NOT NULL)");
  const library = {songs: [{id: "a", name: "First"}, {id: "b", name: "Second", deletedAt: "2026-11-01"}], templates: []};
  db.prepare("INSERT INTO studios VALUES(?,?,1)").run("owner", JSON.stringify(library));
  db.prepare("INSERT INTO studios VALUES(?,?,1)").run("someone-else", JSON.stringify({songs: [{id: "x", name: "Theirs"}]}));
  const find = (owner, id) => {
    const row = db.prepare(songLookupSql).get(owner, id);
    return row ? JSON.parse(row.song) : null;
  };
  assert.deepEqual(find("owner", "a"), {id: "a", name: "First"});
  assert.equal(find("owner", "b").deletedAt, "2026-11-01", "deleted flag is returned so the route can refuse it");
  assert.equal(find("owner", "x"), null, "another person's song is never returned");
  assert.equal(find("owner", "missing"), null);
  assert.equal(find("nobody", "a"), null);
});
