import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import {vmStorage} from "./vm-server-helpers.mjs";
import ts from "typescript";
import React, { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import * as languages from "../app/music-language";
import * as vocals from "../app/vocal-matching";
import * as family from "../app/family-voices";
import * as polish from "../app/production-polish";
import * as singerTeam from "../app/singer-team";
import * as instrumentSounds from "../app/instrument-sounds";
import { MusicLanguageControl } from "../app/music-language-control";
import { promptLanguage } from "../app/prompt-language";
import { musicCatalog } from "../app/music-catalog";
import { languageChoices } from "../app/music-dna";
import * as songData from "../app/studio-data";
import * as notation from "../app/lyric-style-cues";
import * as openings from "../app/song-opening";
import * as sections from "../app/song-section-directions";
import * as clean from "../app/clean-content";
import * as duration from "../app/track-duration";
import { newProSettings, isProSettings, lrcFile } from "../app/lyric-pro-data";
import { isStudio } from "../app/studio-validation";
import { isLyricProject, type LyricProject } from "../app/lyric-video-data";
import { captionTokens, drawTemplateCaptions } from "../app/lyric-caption-render";
import { replacementLanguageChoice, sectionGenerationPayload } from "../app/song-section-generation";

const fixtures = [
  { language: "ar", dialect: "ar-LB", text: "شو حلو هالليل معك، بدي ضل حدّك\nهيدا قلبي إلك ومش لغيرك" },
  { language: "en", dialect: "", text: "Our love and the light lead your heart through the night" },
  { language: "es", dialect: "", text: "El amor en nuestro corazón ilumina el cielo" },
  { language: "fr", dialect: "", text: "Notre amour et la lumière dans une chanson avec le cœur" },
  { language: "hi", dialect: "", text: "तेरे साथ मेरा दिल गाए\nरात में सपने जगमगाएँ" },
  { language: "ja", dialect: "", text: "あなたと歩くこの道で\n心の光が明日を照らす" },
  { language: "mixed", dialect: "ar-LB", text: "هيدا قلبي singing with you\nبدي ضل حدّك tonight" },
] as const;

test("English defaults never block uncertain text; clear lyrics select their language", () => {
  assert.equal(languages.defaultLanguageChoice.language, "auto");
  for (const text of ["", "love", "amor", "bonjour", "la la la la la la la"]) {
    assert.equal(languages.resolveLanguage(languages.defaultLanguageChoice, text).resolved, "en");
    assert.equal(languages.resolveLanguage({ language: "auto", dialect: "" }, text).resolved, "en");
  }
  for (const f of fixtures) {
    assert.equal(languages.resolveLanguage({ language: "auto", dialect: f.dialect }, f.text).resolved, f.language);
  }
  assert.equal(languages.resolveLanguage(languages.defaultLanguageChoice,"حب").resolved,"ar");
  assert.equal(languages.resolveLanguage(languages.defaultLanguageChoice,"你好").resolved,"zh");
});
test("explicit language overrides Auto without translating or rewriting lyrics", () => {
  for (const f of fixtures) {
    const before = f.text;
    assert.equal(languages.resolveLanguage({ language: f.language, dialect: f.dialect }, f.text).resolved, f.language);
    assert.equal(f.text, before);
  }
  assert.equal(languages.resolveLanguage({ language: "es", dialect: "" }, fixtures[0].text).resolved, "es");
  assert.throws(() => languages.resolveLanguage({ language: "en", dialect: "ar-LB" }, ""), /compatible/);
  assert.equal(languages.resolveLanguage({ language: "other", dialect: "" }, "").resolved,"other");
  assert.equal(languages.isLanguageChoice({ language: "xx", dialect: "" }), false);
});
test("registry separates stages and never invents tested audio or dialect evidence", () => {
  assert.deepEqual(languages.musicCapabilityRegistry.audioReviews, []);
  for (const f of fixtures) {
    const caps = languages.musicCapabilityRegistry.forLanguage(f.language);
    assert.deepEqual(Object.keys(caps), ["lyricWriting", "sungAudio", "dialectFidelity", "transcriptionAlignment", "captionRendering"]);
    assert(Object.values(caps).every(status => status === "experimental/unverified"));
  }
  assert.equal(languages.musicCapabilityRegistry.forLanguage("other").sungAudio, "experimental/unverified");
});
test("generated script mismatches fail explicitly without rewriting lyrics", () => {
  for (const fixture of fixtures.filter(f => ["ar", "hi", "ja"].includes(f.language))) {
    const profile = languages.resolveLanguage({ language: fixture.language, dialect: fixture.dialect }, "");
    assert.equal(languages.generatedScriptIssue(profile, fixture.text), undefined);
    assert.match(languages.generatedScriptIssue(profile, "Wrong script words")!, /No singing request/);
  }
});
test("Lebanese direction is colloquial, separate from approved text and from voice identity", () => {
  const profile = languages.resolveLanguage({ language: "ar", dialect: "ar-LB" }, "");
  const direction = languages.singingDirection(profile);
  assert.match(direction, /Lebanese Levantine/);
  assert.match(direction, /shu, baddi, hayda and mish/);
  assert.match(direction, /not formal Modern Standard Arabic or Egyptian/);
  assert.match(direction, /Preserve any supplied lyrics/);
  const chunks = [{ text: fixtures[0].text, positive_styles: Array(50).fill("piano") }];
  const directed = languages.languageStyles(chunks, profile);
  assert.equal(directed[0].text, fixtures[0].text);
  assert.equal(directed[0].positive_styles.length, 50);
  assert.equal(directed[0].positive_styles[0], direction);
  assert.deepEqual(chunks[0].positive_styles, Array(50).fill("piano"));
});

test("explicit description instructions resolve language and dialect without guessing from instruments", () => {
 const auto={language:"auto",dialect:""} as const;
 for(const [prompt,language,dialect] of [
  ["Sing in Lebanese Arabic, a warm female lead","ar","ar-LB"],
  ["Sing in Lebanese with an oud","ar","ar-LB"],
  ["غني باللبناني عن الأمل","ar","ar-LB"],
  ["Write Spanish lyrics with a female singer","es",""],
  ["Sing in English and Arabic","mixed",""],
  ["French vocals over Spanish guitar","fr",""],
  ["Sing in English, not Arabic","en",""],
  ["Write lyrics in Farsi","fa",""],
 ] as const){
  const profile=languages.resolveLanguage(auto,"",prompt);
  assert.equal(profile.resolved,language,prompt);
  assert.equal(profile.dialect,dialect,prompt);
  assert.equal(profile.source,"prompt");
  assert(languages.isLanguageProfile(profile));
 }
 for(const prompt of ["An English description of hope","Spanish guitar with an Arabic oud","Lebanese dabke groove","A song about the English countryside"])
  assert.equal(languages.resolveLanguage(auto,"",prompt).resolved,"en",prompt);
 assert.equal(languages.resolveLanguage({language:"en",dialect:"",selected:true},"","Sing in Arabic").resolved,"en");
 assert.equal(languages.resolveLanguage(languages.defaultLanguageChoice,"","Sing in Arabic").resolved,"ar");
 assert.equal(languages.resolveLanguage({language:"ar",dialect:"ar-LB"},"","Sing in Egyptian Arabic").dialect,"ar-LB");
 assert.equal(languages.resolveLanguage({language:"ar",dialect:"ar-LB"},"","Sing in Arabic").dialect,"ar-LB");
});

test("performer recognition distinguishes voices, stories and excluded performers",()=>{
 for(const [prompt,expected] of [
  ["Warm female lead singing R&B","Solo female lead"],["A deep male rapper","Solo male lead"],
  ["Male rap verses and female sung hook","Duet"],["A gospel choir","Choir / group vocals"],
  ["Call and response over drums","Call and response"],["Female vocals, no male voice","Solo female lead"],
  ["A song about a woman finding her courage",undefined],["A song about Manhattan",undefined],
 ] as const)assert.equal(vocals.promptPerformer(prompt),expected,prompt);
 const chunks=[{text:"[Verse]\nMy own words",positive_styles:Array(50).fill("piano")}];
 const result=vocals.vocalStyles(chunks,"Solo female lead, rich and husky");
 assert.equal(result[0].text,chunks[0].text);
 assert.match(result[0].positive_styles![0],/Solo female lead/);
 assert.equal(chunks[0].positive_styles[0],"piano");
});
test("every listed language and dialect is recognized, including the world-music catalog names",()=>{
 for(const [id,name] of Object.entries(languages.musicLanguages))
  assert.equal(promptLanguage(`Sing in ${name}`)?.language,id,name);
 for(const [id,name] of Object.entries(languages.musicDialects))
  assert.equal(promptLanguage(`Sung in ${name}`)?.dialect,id,name);
 const names=new Set([...languageChoices,...musicCatalog.flatMap(item=>item.languages??[])]);
 for(const name of names)if(name!=="Instrumental")assert(promptLanguage(`in ${name}`),name);
 for(const [text,target] of [["sung in Spanish","es"],["in Yoruba","yo"],["Hindi lyrics","hi"],["Brazilian Portuguese","pt"],["Farsi","fa"],["sing in Arabic, not in Spanish","ar"]] as const)
  assert.equal(promptLanguage(text)?.language,target,text);
 assert.equal(promptLanguage("Spanish guitar and warm piano"),undefined);
 assert.equal(promptLanguage("Do not sing in Spanish; sing in Hindi")?.language,"hi");
 assert.equal(promptLanguage("Don't use French; sung in Yoruba")?.language,"yo");
 assert.equal(promptLanguage("a finished song"),undefined);
});
test("dropdown beats description, description beats lyrics, and uncertainty defaults to English",()=>{
 const auto=languages.defaultLanguageChoice;
 for(const [choice,text,prompt,resolved,source] of [
  [auto,"","a hopeful pop song","en","default"],
  [auto,fixtures[3].text,"","fr","script-suggestion"],
  [auto,fixtures[3].text,"in Yoruba","yo","prompt"],
  [{language:"en",dialect:"",selected:true},fixtures[3].text,"in Yoruba","en","selected"],
  [{language:"es",dialect:"",selected:true},fixtures[4].text,"Hindi lyrics","es","selected"],
  [{language:"ar",dialect:"ar-LB",selected:true},fixtures[2].text,"Egyptian Arabic","ar","selected"],
 ] as const){
  const p=languages.resolveLanguage(choice,text,prompt);
  assert.equal(p.resolved,resolved);assert.equal(p.source,source);assert(languages.isLanguageProfile(p));
 }
 assert.equal(languages.resolveLanguage({language:"ar",dialect:"ar-LB",selected:true},"","Egyptian Arabic").dialect,"ar-LB");
 assert.equal(languages.resolveLanguage({language:"auto",dialect:"ar-LB"},"","").source,"selected");
 assert.equal(languages.resolveLanguage(auto,"","a finished song about Manhattan").resolved,"en");
});
test("one calm status explains default, lyrics, description and manual choices while Auto stays selectable",()=>{
 for(const [choice,lyrics,prompt,expected] of [
  [languages.defaultLanguageChoice,"","","Singing in English (English by default)"],
  [languages.defaultLanguageChoice,fixtures[2].text,"","Singing in Spanish (from your lyrics)"],
  [languages.defaultLanguageChoice,fixtures[2].text,"in Yoruba","Singing in Yoruba (from your description)"],
  [{language:"en",dialect:"",selected:true},fixtures[2].text,"in Yoruba","Singing in English (your choice)"],
 ] as const){
  const html=renderToStaticMarkup(<MusicLanguageControl compact value={choice} lyrics={lyrics} prompt={prompt} change={()=>{}}/>);
  assert(html.includes(expected),expected);
  assert.equal((html.match(/role="status"/g)??[]).length,1);
  assert(html.includes('value="auto"'));
  assert(html.includes("change</button>"));
 }
});

/** Real route + real language, notation and validation helpers, but no network or billing.
 * Any provider call here returns a deterministic fixture, never a paid generation.
 */
function routeHarness(sourceSongs: songData.Song[] = []) {
  let stored = structuredClone(songData.emptyCreatorStudio), revision = 0, paidEntries = 0;
  stored.songs = structuredClone(sourceSongs);
  const calls: { path: string; payload: any }[] = [];
  const modules: Record<string, unknown> = {
    "../../../server/rate-limit": { rateLimited: () => null },
    "../../../music-language": languages,
    "../../../vocal-matching": vocals,
    "../../../musical-ad": { isMusicalAd: () => true },
    "../../../instrument-sounds": instrumentSounds,
    "../../../song-cover": { titlesFromLyrics: () => [] },
    "../../../music-genres": { genreTags: () => [] },
    "../../../song-opening": openings,
    "../../../credits/production": {
      managedProviderKey: () => null,
      jobExecution: new WeakMap(),
      withProductionUsage: (handler: (r: Request) => Promise<Response>) => (r: Request) => { paidEntries++; return handler(r); },
    },
    "../../../project-assets": {
      projectRoot: (_songs: unknown, song: songData.Song) => song,
      attachRenderedMix: (songs: songData.Song[], _source: songData.Song, rendered: songData.Song) =>
        songs.map(song => song.id === rendered.id ? rendered : song),
    },
    "../../../clean-content": clean,
    "../../../song-section-directions": sections,
    "../../../lyric-style-cues": notation,
    "../../../song-library": { stampSong: (song: unknown) => song },
    "cloudflare:workers": { env: { BUCKET: { put: async () => {}, delete: async () => {} } } },
    "../../../studio-data": songData,
    "../../../server/audio-storage": {storePaidAudio: async (_owner:string,song:unknown) => song,finishPaidAudio:async()=>true},
    "../../../server/music-engine": {musicEngineStatus:async()=>({engine:"elevenlabs",notice:""}),falKey:()=>""},
    "../../../server/fal-music": {FalRejected:class extends Error{}},
    "../../../server/job-runner": {saveJobDocument:async()=>{throw new Error("This language fixture must not start fal jobs.");}},
    "../../../track-duration": duration,
    "../../../family-voices": family,
    "../../../production-polish": polish,
    "../../../singer-team": singerTeam,
    "../elevenlabs/provider": {
      musicModel: "music_v2_5", elevenLabsFailureMessage: async () => "Fixture error",
      elevenLabsRequest: async (_key: string, path: string, payload: any) => {
        calls.push({ path, payload });
        return path === "music/plan" ? Response.json({ chunks: [{ text: "[Verse]\n" + (payload.prompt.includes("Singing language: Japanese") ? fixtures[5].text : fixtures[0].text), duration_ms: 15000, positive_styles: ["oud"] }] }) :
          new Response(new Uint8Array([73, 68, 51]), { headers: { "content-type": "audio/mpeg" } });
      },
    },
    "../elevenlabs/vault": { resolveElevenLabsKey: async () => "offline-fixture-not-a-key" },
    "../store": {
      privateHeaders: { "Cache-Control": "private, no-store" }, maxStudioBytes: 1e7,
      readStudio: async () => ({ data: structuredClone(stored), revision }),
      writeStudio: async (_id: string, _revision: number, content: string) => { stored = JSON.parse(content); return { revision: ++revision }; },
      audioKey: () => "fixture-object",
    },
    "../../../studio-access": { privateWorkspace: async () => ({ id: "fixture-owner", role: "owner" }) },
    "../../../creator-accounts": {},
    "../request-errors": {
      readBoundedText: async (r: Request, max: number) => {
        const text = await r.text(); if (text.length > max) throw new Error("Too large"); return text;
      },
      recoverableRoute: (handler: unknown) => handler,
    },
  };
  const exports: any = {};
  const file = readFileSync(resolve("app/api/studio/create/route.ts"), "utf8");
  vm.runInNewContext(ts.transpileModule(file, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, Response, Request, URL, TextEncoder, crypto: globalThis.crypto,
    require: (name: string) => {
      if(name.endsWith("/server/storage"))return vmStorage((modules["cloudflare:workers"] as {env:object}).env);
      assert(name in modules, "Unmocked dependency " + name); return modules[name];
    },
  });
  return { calls, stored: () => stored, paidEntries: () => paidEntries,
    post: (input: unknown) => exports.POST(new Request("https://studio.test/api/studio/create", {
      method: "POST", headers: { Origin: "https://studio.test", "Content-Type": "application/json" }, body: JSON.stringify(input),
    })) as Promise<Response> };
}
test("song and lyric-plan API reject lengths over six minutes before accounting",async()=>{
 for(const action of ["song","lyric-plan"])for(const seconds of [2,361,480,600]){
  const h=routeHarness(),r=await h.post({action,title:"Boundary",prompt:"A joyful song",duration:seconds,language:"en"});
  assert.equal(r.status,400);assert.match(await r.text(),/0:03 to 6:00/);
  assert.equal(h.paidEntries(),0);assert.equal(h.calls.length,0);
 }
 const h=routeHarness(),r=await h.post({action:"song",title:"Auto",prompt:"A joyful song",lyrics:"Together we rise",duration:"auto",language:"en"});
 assert.equal(r.status,200,await r.clone().text());
 const chunks=h.calls[0].payload.composition_plan.chunks;
 assert.equal(chunks.reduce((sum:number,c:any)=>sum+c.duration_ms,0),duration.creationDuration({duration:"auto",lyrics:"Together we rise"})*1000);
});
test("unsupported and incompatible selections stop before accounting or provider requests", async () => {
  for (const choice of [{ language: "en", dialect: "ar-LB" }, { language: "xx", dialect: "" }]) {
    const h = routeHarness();
    const r = await h.post({ action: "song", title: "Fixture", prompt: "An original song", duration: 15, ...choice });
    assert.equal(r.status, 400);
    assert.equal(h.paidEntries(), 0);
    assert.equal(h.calls.length, 0);
  }
});
for (const fixture of fixtures) test(`offline song request persists ${fixture.language} metadata, scripts and plan styles`, async () => {
  const h = routeHarness();
  const r = await h.post({ action: "song", prompt: "Original warm piano", duration: 15, title: "Fixture", lyrics: fixture.text, language: fixture.language, dialect: fixture.dialect });
  assert.equal(r.status, 200, await r.clone().text());
  assert.equal(h.calls.length, 1); // Supplied writing never calls the lyric generator.
  const song = h.stored().songs[0];
  assert.equal(song.notes.lyrics, fixture.text);
  assert.equal(song.generation!.approvedLyrics, fixture.text);
  assert.equal(song.generation!.languageProfile!.resolved, fixture.language);
  assert.equal(song.generation!.languageProfile!.dialect, fixture.dialect);
  assert.equal(song.generation!.status, "complete");
  assert(isStudio(h.stored()));
  const plan = h.calls[0].payload.composition_plan;
  assert(plan.chunks.every((c: any) => c.positive_styles[0].includes("Singing language:")));
  assert(!("voice_id" in h.calls[0].payload));
  const pro = newProSettings(song, 15);
  assert.deepEqual(pro.languageProfile, song.generation!.languageProfile);
  assert(isProSettings(JSON.parse(JSON.stringify(pro))));
  const video: LyricProject = { cues: [{ text: fixture.text, time: 0, end: 15 }], theme: "cosmic", motion: "still", format: "vertical", pro };
  assert(isLyricProject(JSON.parse(JSON.stringify(video))));
  assert(lrcFile(video.cues, 0, 15).includes(fixture.text));
});
test("automatic original lyrics use selected Lebanese directions in both plan and sung audio", async () => {
  const h = routeHarness();
  const r = await h.post({ action: "song", prompt: "An original joyful song", title: "Fixture", duration: 15, language: "ar", dialect: "ar-LB" });
  assert.equal(r.status, 200);
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[0].path, "music/plan");
  assert.match(h.calls[0].payload.prompt, /Lebanese Levantine/);
  assert.match(h.calls[1].payload.composition_plan.chunks[0].positive_styles[0], /Lebanese Levantine/);
});
test("prompt-derived language and performer directions survive into the actual offline music request",async()=>{
 const h=routeHarness();
 const response=await h.post({action:"song",prompt:"Sing in Lebanese Arabic with a warm female lead",title:"Fixture",duration:15,language:"auto",dialect:"",voice:"Vocal arrangement: Solo female lead."});
 assert.equal(response.status,200,await response.clone().text());
 assert.equal(h.calls.length,2);
 const audio=h.calls[1].payload;
 assert(audio.composition_plan.chunks.every((chunk:any)=>chunk.positive_styles.some((style:string)=>style.includes("Solo female lead"))));
 assert(audio.composition_plan.chunks.every((chunk:any)=>chunk.positive_styles.some((style:string)=>style.includes("Lebanese"))));
 assert(!("voice_id" in audio));
 assert.equal(h.stored().songs[0].generation!.languageProfile!.source,"prompt");
 const selected=routeHarness();
 assert.equal((await selected.post({action:"song",prompt:"Sing in Arabic",title:"Fixture",duration:15,language:"en",selected:true,lyrics:fixtures[1].text})).status,200);
 assert.equal(selected.stored().songs[0].generation!.languageProfile!.resolved,"en");
});
test("instrumentals bypass singing-language checks; lyric planning honors selection", async () => {
  const h = routeHarness();
  assert.equal((await h.post({ action: "song", instrumental: true, prompt: "An original piano instrumental", title: "Fixture", duration: 15 })).status, 200);
  assert.equal(h.calls[0].payload.force_instrumental, true);
  const lyric = routeHarness();
  assert.equal((await lyric.post({ action: "lyric-plan", language: "ja", dialect: "", prompt: "Original dawn song", duration: 15 })).status, 200);
  assert.match(lyric.calls[0].payload.prompt, /Singing language: Japanese/);
});
test("replacement and inserted section requests pass the route preflight with saved or newly selected language", async () => {
  const original: songData.Song = { ...songData.freshSong("source-song", "Original", 0), audioFormat: "mp3" };
  original.generation = {
    provider: "ElevenLabs", model: "music_v2_5", audioId: original.id,
    approvedLyrics: fixtures[0].text, compositionPlan: {}, createdAt: "2026-11-15T00:00:00Z",
    captionReady: true, timingSource: "not-provided",
    languageProfile: languages.resolveLanguage({ language: "auto", dialect: "ar-LB" }, fixtures[0].text),
  };
  const inherited = replacementLanguageChoice(original);
  assert.deepEqual(inherited, { language: "ar", dialect: "ar-LB" });
  const h = routeHarness([original]);
  const payload = sectionGenerationPayload(original, inherited, false, "A new Lebanese verse", 12);
  assert.equal((await h.post(payload)).status, 200);
  assert.equal(h.calls.length, 2);
  assert.match(h.calls[0].payload.prompt, /Singing language: Arabic/);
  assert.equal(h.stored().songs[0].generation!.languageProfile!.dialect, "ar-LB");
  assert.equal(h.stored().songs[0].projectId, original.id);
  assert.equal(h.stored().songs.find(song => song.id === original.id)!.generation!.approvedLyrics, fixtures[0].text);

  const legacy: songData.Song = { ...songData.freshSong("legacy-song", "Legacy", 0), audioFormat: "mp3" };
  assert.deepEqual(replacementLanguageChoice(legacy), languages.defaultLanguageChoice);
  assert.equal(sectionGenerationPayload(legacy, replacementLanguageChoice(legacy), false, "New verse", 15).language, "auto");
  const selected = routeHarness([legacy]);
  assert.equal((await selected.post(sectionGenerationPayload(legacy, { language: "ja", dialect: "" }, false, "New Japanese passage", 15))).status, 200);
  assert.match(selected.calls[0].payload.prompt, /Singing language: Japanese/);
  assert.equal(sectionGenerationPayload(legacy, { language: "other", dialect: "" }, false, "New verse", 15).language,"other");

  const instrumental = routeHarness([legacy]);
  const instrumentalPayload = sectionGenerationPayload(legacy, languages.defaultLanguageChoice, true, "Piano replacement", 15);
  assert.equal((await instrumental.post(instrumentalPayload)).status, 200);
  assert.equal(instrumental.calls.length, 1);
  assert.equal(instrumental.calls[0].payload.force_instrumental, true);
  assert.equal(replacementLanguageChoice({ ...original, audioId: "different-recording" }).language, "auto");
});
test("invalid language metadata is rejected without breaking old songs or projects", () => {
  const song = songData.freshSong("old-song", "Old song", 0);
  const pro = newProSettings(song, 15);
  assert(isProSettings(pro));
  assert(!isProSettings({ ...pro, languageProfile: { language: "en", resolved: "ar", dialect: "", source: "selected" } }));
});

test("accessible selectors default to English, allow overrides, clear incompatible dialects, and disclose costs", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(document.getElementById("root")!);
  function Harness() {
    const [value, change] = useState<languages.LanguageChoice>(languages.defaultLanguageChoice);
    return <MusicLanguageControl value={value} change={change} lyrics={fixtures[0].text}/>;
  }
  try {
    await act(async () => root.render(<Harness/>));
    const selects = [...document.querySelectorAll("select")];
    assert.equal(selects[0].value, "auto");
    assert.match(document.body.textContent!, /Singing in Arabic \(from your lyrics\) · change/);
    assert(selects.every(select => select.closest("label")));
    assert.doesNotMatch(document.body.textContent!, /Tentative suggestion: Arabic/);
    async function choose(index: number, value: string) {
      await act(async () => { selects[index].value = value; selects[index].dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    }
    await choose(0, "ar"); await choose(1, "ar-LB");
    assert.equal(selects[1].value, "ar-LB");
    await choose(0, "fr");
    assert.equal(selects[0].value, "fr"); assert.equal(selects[1].value, "");
    assert(selects[1].disabled);
    assert.match(document.body.textContent!, /No singing language has been listening-tested/);
    assert.doesNotMatch(document.body.textContent!, /no free audition|paid audition|may use credits/i);
    assert.match(document.body.textContent!, /full-line emphasis/);
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
test("default English and legacy Auto both reach creation; missing settings follow clear lyrics or explicit requests", async () => {
  for (const choice of [{}, {language:"auto"}, {...languages.defaultLanguageChoice}]) {
    const h=routeHarness();
    const response=await h.post({action:"song",prompt:"A hopeful pop song",title:"Sunrise",duration:15,lyrics:"I rise again\nTomorrow is mine",...choice});
    assert.equal(response.status,200,await response.clone().text());
    assert.equal(h.stored().songs[0].generation!.languageProfile!.resolved,"en");
    assert.equal(h.calls.length,1);
  }
  for (const [lyrics,prompt,language] of [
    [fixtures[2].text,"A gentle guitar song","es"],
    [fixtures[3].text,"A piano ballad","fr"],
    [fixtures[4].text,"A gentle ballad","hi"],
    ["Hoy nace mi canción","Sing in Spanish","es"],
    [fixtures[2].text,"in Yoruba","yo"],
    [fixtures[2].text,"Brazilian Portuguese","pt"],
  ]) {
    const h=routeHarness();
    const response=await h.post({action:"song",prompt,title:"Fixture",duration:15,lyrics,...languages.defaultLanguageChoice});
    assert.equal(response.status,200,await response.clone().text());
    assert.equal(h.stored().songs[0].generation!.languageProfile!.resolved,language);
  }
  const selected=routeHarness();
  const result=await selected.post({action:"song",prompt:"Egyptian Arabic with a warm voice",title:"Fixture",duration:15,lyrics:fixtures[0].text,language:"ar",dialect:"ar-LB",selected:true});
  assert.equal(result.status,200,await result.clone().text());
  assert.equal(selected.stored().songs[0].generation!.languageProfile!.dialect,"ar-LB");
  const styleOnly=routeHarness();
  const styleResult=await styleOnly.post({action:"song",prompt:"Style: Arabic pop.\nA hopeful song",languagePrompt:"A hopeful song",title:"Fixture",duration:15,lyrics:fixtures[1].text,...languages.defaultLanguageChoice});
  assert.equal(styleResult.status,200,await styleResult.clone().text());
  assert.equal(styleOnly.stored().songs[0].generation!.languageProfile!.resolved,"en");
  assert(styleOnly.calls[0].payload.composition_plan.chunks[0].positive_styles.some((style:string)=>style.includes("Arabic pop")));
});
test("canvas preview/export captions retain full shaped lines, RTL direction and script offsets", () => {
  for (const f of fixtures) {
    const text = f.text.replace(/\n/g, " ");
    const painted: { text: string; direction: string }[] = [];
    const state: any = { direction: "ltr", letterSpacing: "0px" };
    const ctx = new Proxy(state, { get: (target, prop) => {
      if (prop in target) return target[prop];
      if (prop === "measureText") return (t: string) => ({ width: [...t].length * 7 });
      if (prop === "fillText") return (t: string) => painted.push({ text: t, direction: target.direction });
      if (prop === "createLinearGradient") return () => ({ addColorStop() {} });
      return () => {};
    } }) as CanvasRenderingContext2D;
    const cue = { text, time: 0, end: 15 };
    const project: LyricProject = { cues: [cue], theme: "cosmic", motion: "still", format: "wide", captionTemplate: "clear-voice" };
    drawTemplateCaptions(ctx, 3, project, 1280, 720);
    assert(painted.some(p => p.text === text), f.language + " should paint a full shaped line");
    assert.equal(painted[0].direction, f.language === "ar" || f.language === "mixed" ? "rtl" : "ltr");
    for (const token of captionTokens(cue, 15)) assert.equal(text.slice(token.start, token.end), token.text);
    if (f.language === "ar" || f.language === "mixed" || f.language === "hi") assert.equal(ctx.letterSpacing, "0px");
  }
});

test("accents for English, Spanish and Portuguese: pick them, or ask for them in words",()=>{
 const auto={language:"auto",dialect:""} as const;
 for(const [prompt,language,dialect] of [
  ["Sing it in a Southern accent, slow country ballad","en","en-US-south"],
  ["Sing in Urban American English over a boom bap beat","en","en-US-urban"],
  ["British accent vocals, indie pop","en","en-GB"],
  ["Sing in Nigerian English with afrobeats drums","en","en-NG"],
  ["Jamaican accent, reggae love song","en","en-x-jamaica"],
  ["Sing in Indian English","en","en-IN"],
  ["Sing in Mexican Spanish, a ranchera","es","es-MX"],
  ["Puerto Rican Spanish vocals over reggaeton","es","es-x-caribbean"],
  ["Sing in Brazilian Portuguese, bossa nova","pt","pt-BR"],
 ] as const){
  const profile=languages.resolveLanguage(auto,"",prompt);
  assert.equal(profile.resolved,language,prompt);assert.equal(profile.dialect,dialect,prompt);
  assert(languages.isLanguageProfile(profile),prompt);
 }
 // Picking the accent alone sets its language.
 assert.equal(languages.resolveLanguage({language:"auto",dialect:"pt-BR"},"").resolved,"pt");
 assert.equal(languages.resolveLanguage({language:"es",dialect:"es-MX",selected:true},"").dialect,"es-MX");
 // Accents only go with their own language.
 assert.throws(()=>languages.resolveLanguage({language:"es",dialect:"en-GB"},""),/compatible/);
 assert.deepEqual(languages.dialectsFor("en"),["en-US-south","en-US-urban","en-GB","en-x-jamaica","en-NG","en-IN"]);
 assert.deepEqual(languages.dialectsFor("fr"),[]);
 // The singing direction names the accent and never says "Modern Standard Arabic" for it.
 const sung=languages.singingDirection(languages.resolveLanguage({language:"en",dialect:"en-US-south",selected:true},""));
 assert.match(sung,/Accent target: Southern US English; relaxed Southern US vowels/);
 assert.doesNotMatch(sung,/Arabic/);
 assert.match(languages.singingDirection(languages.resolveLanguage({language:"ar",dialect:"ar-EG",selected:true},"")),/not formal Modern Standard Arabic/);
 // A genre word is not an accent request.
 assert.equal(languages.resolveLanguage(auto,"","Southern soul groove with horns").dialect,"");
});
