import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/quick-create.tsx", import.meta.url), "utf8");

test("creation playback and downloads use the song identity and audio version separately", () => {
  assert.equal((source.match(/songAudioUrl\(result\.id,result\.audioId\)/g) ?? []).length, 2);
  assert.doesNotMatch(source, /songAudioUrl\(result\.audioId\s*\?\?\s*result\.id\)/);
});

test("missing provider connection explains the next step without sending generation", () => {
  const validation = source.slice(source.indexOf("async function create("), source.indexOf('setError(""); setPending(true)'));
  assert.match(validation, /if \(!instrumental && !connected\).*setError\("Connect your ElevenLabs music account.*return;/);
  assert.match(source, /type="submit" className="primary" disabled=\{busy\}/);
  assert.match(validation, /Describe your song idea first/);
});

test("automatic lyric mode explains how the idea and styles guide the song", () => {
  assert.match(source, /!instrumental&&!ownLyrics/);
  assert.match(source, /Your description supplies the story; your styles, language and vocal choices guide the song/);
});
