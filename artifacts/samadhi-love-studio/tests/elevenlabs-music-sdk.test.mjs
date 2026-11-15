import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const sdk = require("@elevenlabs/elevenlabs-js");

function transport(respond) {
  const calls = [];
  const exports = {};
  const source = readFileSync(new URL("../app/api/studio/elevenlabs/music-sdk.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  vm.runInNewContext(outputText, {
    exports, URL, URLSearchParams, Response, AbortSignal,
    require(name) {
      assert.equal(name, "@elevenlabs/elevenlabs-js");
      return sdk;
    },
    fetch: async (url, init) => {
      calls.push({ url: String(url), init });
      assert.equal(init.redirect, "manual");
      assert.ok(init.signal instanceof AbortSignal);
      assert.equal(new URL(String(url)).origin, "https://api.elevenlabs.io");
      return respond(url, init);
    },
  });
  return { ...exports, calls };
}

test("instrumental generation uses the explicit creator key, model, duration and original audio format", async () => {
  const bytes = new Uint8Array([73, 68, 51, 4, 0, 0]);
  const api = transport(() => new Response(bytes, { headers: { "Content-Type": "audio/mpeg" } }));
  const payload = { model_id: "music_v2_5", prompt: "An original piano sketch", music_length_ms: 30000, force_instrumental: true };
  const response = await api.sdkMusicRequest("fixture-creator-key", "music?output_format=mp3_44100_128", payload, 300000);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  assert.equal(api.calls.length, 1);
  const { url, init } = api.calls[0];
  assert.equal(new URL(url).searchParams.get("output_format"), "mp3_44100_128");
  assert.equal(new Headers(init.headers).get("xi-api-key"), "fixture-creator-key");
  assert.deepEqual(JSON.parse(init.body), payload);
});

test("vocal composition preserves approved lyrics, arrangement and chunk timing", async () => {
  const api = transport(() => new Response(new Uint8Array([73, 68, 51]), { headers: { "Content-Type": "audio/mpeg" } }));
  const payload = {
    model_id: "music_v2_5",
    composition_plan: { chunks: [{
      text: "[Verse]\nMy original_lyrics\nحلم جديد",
      duration_ms: 15000,
      positive_styles: ["piano", "warm vocals"],
      negative_styles: ["profanity"],
      context_adherence: "high",
    }] },
  };
  const response = await api.sdkMusicRequest("fixture-vocal-key", "music?output_format=mp3_44100_128", payload, 300000);
  await response.arrayBuffer();
  assert.deepEqual(JSON.parse(api.calls[0].init.body), payload);
});

test("plan output keeps the snake_case contract used by stored drafts and creation routes", async () => {
  const plan = { chunks: [{ text: "[Verse]\nOriginal words", duration_ms: 10000, positive_styles: ["piano"], context_adherence: "high" }] };
  const api = transport(() => Response.json(plan));
  const payload = { model_id: "music_v2_5", prompt: "An original uplifting song", music_length_ms: 10000 };
  const response = await api.sdkMusicRequest("fixture-plan-key", "music/plan", payload, 45000);
  assert.deepEqual(await response.json(), plan);
  assert.deepEqual(JSON.parse(api.calls[0].init.body), payload);
  assert.equal(new URL(api.calls[0].url).pathname, "/v1/music/plan");
});

for (const status of [302, 401, 402, 403, 422, 429, 500]) {
  test(`provider failure ${status} returns to the existing refund/error path without retries`, async () => {
    const failure = { detail: { status: "fixture_error", message: "Fixture failure" } };
    const api = transport(() => Response.json(failure, { status }));
    const response = await api.sdkMusicRequest("fixture-key", "music", { model_id: "music_v2_5", prompt: "Fixture" }, 45000);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), failure);
    assert.equal(api.calls.length, 1);
  });
}

test("no credential fallback or unrelated SDK destinations", async () => {
  const api = transport(() => { throw new Error("Should not make a request"); });
  await assert.rejects(api.sdkMusicRequest("", "music", { prompt: "Fixture" }, 45000), /resolved.*credential/);
  await assert.rejects(api.sdkMusicRequest("fixture", "voices", {}, 45000), /Unsupported/);
  assert.equal(api.calls.length, 0);
});

test("network failures do not retry or masquerade as successful generation", async () => {
  const api = transport(() => { throw new Error("Fixture network unavailable"); });
  await assert.rejects(api.sdkMusicRequest("fixture", "music", { prompt: "Fixture" }, 45000));
  assert.equal(api.calls.length, 1);
});
