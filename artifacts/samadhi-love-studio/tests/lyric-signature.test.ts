import assert from "node:assert/strict";
import test from "node:test";
import { applySignatureLook, signatureLooks } from "../app/lyric-signature";
import { beatPulse, drawSignatureOverlay } from "../app/lyric-visual-layers";
import { renderReadiness, soundtrackIdentity } from "../app/lyric-readiness";
import { newProSettings } from "../app/lyric-pro-data";
import { freshSong } from "../app/studio-data";
import { isLyricProject, type LyricProject, type VideoFormat } from "../app/lyric-video-data";
import { makeVisualTemplate, parseVisualTemplate, applyVisualTemplate } from "../app/lyric-visual-template";
import { overlayDesigns } from "../app/lyric-overlay-designs";
const song = { ...freshSong("signature-song", "Love", 0), audioFormat: "wav" as const, audioId: "source-v1" };
const base: LyricProject = { theme: "cosmic", motion: "drift", format: "wide", cues: [{ text: "Love and light", time: 1, end: 6 }],
  pro: { ...newProSettings(song, 60), background: "old-background", sections: [{ id: "verse", name: "Verse", time: 0, end: 60, background: "section-image", singer: "Lead", language: "Arabic" }] } };
const options = { imagesReady: true, allowOld: false, clean: false, fallback: false, formats: ["wide", "vertical", "square"] as VideoFormat[] };
test("signature presets stay valid in every format and preserve source, lyrics, history and section direction", () => {
  const before = JSON.stringify(base);
  for (const look of signatureLooks) for (const format of options.formats) {
    const next = applySignatureLook({ ...base, format }, look.id);
    assert(isLyricProject(next)); assert.equal(next.format, format); assert.equal(next.cues, base.cues);
    assert.equal(next.pro?.sourceAudioId, base.pro?.sourceAudioId);
    assert.equal(next.pro?.approvedLyrics, base.pro?.approvedLyrics);
    assert.equal(next.pro?.sections[0].singer, "Lead"); assert.equal(next.pro?.sections[0].language, "Arabic");
    assert.equal(next.pro?.background, undefined); assert.equal(next.pro?.sections[0].background, undefined);
    for (const f of options.formats) assert.equal(next.pro?.formatLooks?.[f]?.safe, true);
  }
  assert.equal(JSON.stringify(base), before);
});
test("layer controls serialize through saved projects and portable visual templates without source IDs", () => {
  const next = applySignatureLook(base, "unity");
  const template = parseVisualTemplate(JSON.parse(JSON.stringify(makeVisualTemplate(next))));
  assert(!JSON.stringify(template).includes("source-v1"));
  assert.deepEqual(applyVisualTemplate(base, template).visualLayers, next.visualLayers);
  assert(isLyricProject(JSON.parse(JSON.stringify(next))));
  for (const invalid of [{ overlayAmount: 2 }, { backgroundMotion: NaN }, { overlayMotion: "yes" }, { beatOffset: -1 }, { overlayStyle: "arbitrary" }])
    assert(!isLyricProject({ ...next, visualLayers: { ...next.visualLayers, ...invalid } }));
  assert(isLyricProject(base));
});
test("beat offset aligns deterministic animation without changing lyric timestamps", () => {
  assert.equal(beatPulse(2, 120, 2), 1); assert.equal(beatPulse(2.25, 120, 2), 0);
  assert(Math.abs(beatPulse(2.5, 120, 2) - 1) < 1e-10);
});
function geometry(project: LyricProject, time: number) {
  const calls: unknown[] = [];
  const ctx = new Proxy({}, { get: (_, key) => (...args: unknown[]) => {
    calls.push([key, ...args]);
    if (key === "createRadialGradient" || key === "createLinearGradient") return { addColorStop: (...stops: unknown[]) => calls.push(["addColorStop", ...stops]) };
  }, set: (_, key, value) => { if(key !== "fillStyle" && key !== "strokeStyle" || typeof value === "string") calls.push([key, value]); return true; } }) as CanvasRenderingContext2D;
  drawSignatureOverlay(ctx, time, project, 720, 1280, "#ffffff"); return calls;
}
test("overlay rendering is repeatable, distinct per design and independently switchable/frozen", () => {
  const next = applySignatureLook(base, "awaken");
  assert.deepEqual(geometry(next, 2), geometry(next, 2)); assert.notDeepEqual(geometry(next, 2), geometry(next, 3));
  assert.notDeepEqual(geometry(next, 2), geometry(applySignatureLook(base, "unity"), 2));
  assert.deepEqual(geometry({ ...next, visualLayers: { ...next.visualLayers!, overlayAmount: 0 } }, 2), []);
  const still = { ...next, visualLayers: { ...next.visualLayers!, overlayMotion: false } };
  assert.deepEqual(geometry(still, 2), geometry(still, 3));
});
test("all 12 animated looks serialize, draw bounded geometry across a full song and freeze without changing captions", () => {
  assert.equal(signatureLooks.length, 12);
  assert.equal(new Set(signatureLooks.map(l => l.overlay)).size, 12);
  assert.equal(Object.keys(overlayDesigns).length, 13);
  for (const look of signatureLooks) {
    const project = applySignatureLook(base, look.id);
    const template = parseVisualTemplate(JSON.parse(JSON.stringify(makeVisualTemplate(project))));
    assert.deepEqual(applyVisualTemplate(base, template).visualLayers, project.visualLayers);
    for (const time of [0, 1, 180, 359.99]) {
      const frame = geometry(project, time);
      assert(frame.length > 10 && frame.length < 500, look.id + ": bounded render cost");
      assert.deepEqual(frame, geometry(project, time), look.id + ": repeatable seeking/export");
      for (const call of frame as unknown[][]) for (const n of call.slice(1)) if (typeof n === "number") assert(Number.isFinite(n), look.id);
      assert.equal((frame as unknown[][]).filter(c => c[0] === "save").length, (frame as unknown[][]).filter(c => c[0] === "restore").length, look.id + ": restores canvas state");
    }
    assert.notDeepEqual(geometry(project, 1), geometry(project, 180), look.id + ": actual motion");
    const still = { ...project, visualLayers: { ...project.visualLayers!, overlayMotion: false } };
    assert.deepEqual(geometry(still, 1), geometry(still, 180), look.id + ": still option");
    assert.deepEqual(project.cues, base.cues);
  }
});
test("readiness blocks invalid ranges, source changes, missing assets and out-of-bounds captions", () => {
  const has = (p: LyricProject, id: string, opts = options) => renderReadiness(p, song, [song], opts).some(c => c.id === id && c.level === "block");
  assert(has({ ...base, pro: { ...base.pro!, range: { start: 0, end: 0 } } }, "range"));
  assert(has(base, "assets", { ...options, imagesReady: false }));
  assert(has({ ...base, pro: { ...base.pro!, sourceAudioId: "old-source" } }, "source"));
  assert(has({ ...base, cues: [{ text: "Too late", time: 59, end: 62 }] }, "timing"));
  assert(has({ ...base, pro: { ...base.pro!, intro: 2 } }, "fallback", { ...options, fallback: true }));
});
test("clean export accepts caption-free videos while lyric exports require visible lines", () => {
  const empty = { ...base, cues: [] };
  assert(renderReadiness(empty, song, [song], options).some(c => c.id === "lyrics" && c.level === "block"));
  assert(!renderReadiness(empty, song, [song], { ...options, clean: true }).some(c => c.level === "block"));
  const outside = { ...base, pro: { ...base.pro!, range: { start: 20, end: 30 } } };
  assert(renderReadiness(outside, song, [song], options).some(c => c.id === "lyrics"));
});
test("soundtrack confirmation and master comparison use immutable asset IDs", () => {
  const confirmed = { ...base, pro: { ...base.pro!, soundtrackConfirmed: soundtrackIdentity(base) } };
  assert(renderReadiness(confirmed, song, [song], options).some(c => c.id === "source" && c.level === "ready"));
  const enhanced = { ...confirmed, pro: { ...confirmed.pro, useEnhancedSoundtrack: true, soundtrackAsset: "enhanced-audio" } };
  assert(renderReadiness(enhanced, song, [song], options).some(c => c.id === "source" && c.level === "review"));
  const root = { ...song, master: { songId: song.id, audioId: "source-v1" } };
  assert(renderReadiness(enhanced, root, [root], options).some(c => c.id === "master" && c.level === "review"));
});
