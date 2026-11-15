import assert from "node:assert/strict";
import test from "node:test";
import { mixLicense } from "../app/party/data";
// The offline player and online builder run this same dependency-free module.
import { planSet, zipFiles, estimateTempo } from "../public/party-runtime.js";

test("mixed sets admit only the license conditions implemented by the app", () => {
  assert.equal(
    mixLicense("https://creativecommons.org/licenses/by/4.0/"),
    "CC BY 4.0",
  );
  assert.equal(
    mixLicense("http://creativecommons.org/licenses/by/3.0"),
    "CC BY 3.0",
  );
  assert.equal(
    mixLicense("https://creativecommons.org/publicdomain/zero/1.0/"),
    "CC0 1.0",
  );
  for (const url of [
    "https://creativecommons.org/licenses/by-nc/4.0/",
    "https://creativecommons.org/licenses/by-nd/4.0/",
    "https://creativecommons.org/licenses/by-sa/4.0/",
    "https://creativecommons.org.evil.test/licenses/by/4.0/",
    "ftp://creativecommons.org/licenses/by/4.0/",
    "invalid",
  ])
    assert.equal(mixLicense(url), null);
});

test("crossfades overlap adjacent tracks and tempo matching adjusts the timeline", () => {
  const party = {
    tracks: ["a", "b", "c"],
    tempos: {},
    fade: 6,
    beatmatch: true,
  };
  const tracks = [
    { id: "a", bpm: 120 },
    { id: "b", bpm: 115 },
    { id: "c", bpm: 125 },
  ];
  const plan = planSet(party, tracks, [
    { duration: 60 },
    { duration: 60 },
    { duration: 60 },
  ]);
  assert.equal(plan[0].rate, 1);
  assert.equal(plan[1].rate, 120 / 115);
  assert.equal(plan[2].rate, 120 / 125);
  for (let i = 1; i < plan.length; i++) {
    assert.equal(
      plan[i].start,
      plan[i - 1].start + plan[i - 1].duration - plan[i].fadeIn,
    );
    assert.equal(plan[i].fadeIn, plan[i - 1].fadeOut);
  }
});

test("short tracks clamp crossfades and unknown tempos preserve original speed", () => {
  const plan = planSet(
    { tracks: ["a", "b"], tempos: {}, fade: 20, beatmatch: true },
    [
      { id: "a", bpm: 0 },
      { id: "b", bpm: 120 },
    ],
    [{ duration: 3 }, { duration: 60 }],
  );
  assert.equal(plan[1].fadeIn, 1);
  assert.equal(plan[1].start, 2);
  assert.equal(plan[1].rate, 1);
});

test("zero crossfade joins track boundaries without a scheduled gap", () => {
  const plan = planSet(
    { tracks: ["a", "b"], tempos: {}, fade: 0, beatmatch: false },
    [{ id: "a" }, { id: "b" }],
    [{ duration: 2.5 }, { duration: 3.75 }],
  );
  assert.equal(plan[1].start, 2.5);
  assert.equal(plan[1].duration + plan[1].start, 6.25);
});

test("ZIP packages media together with attribution using valid stored headers", async () => {
  const blob = await zipFiles([
    { name: "LICENSE.txt", blob: new Blob(["123456789"]) },
    { name: "music.wav", blob: new Blob(["audio"]) },
  ]);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint32(14, true), 0xcbf43926);
  assert.equal(view.getUint32(bytes.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(bytes.length - 12, true), 2);
});

test("tempo estimation handles silence without claiming a tempo", () => {
  const samples = new Float32Array(44100 * 2);
  assert.equal(
    estimateTempo({ sampleRate: 44100, getChannelData: () => samples }),
    0,
  );
});

test("large tempo differences keep the original speed", () => {
  const plan = planSet(
    { tracks: ["a", "b"], tempos: {}, fade: 6, beatmatch: true },
    [
      { id: "a", bpm: 120 },
      { id: "b", bpm: 70 },
    ],
    [{ duration: 30 }, { duration: 30 }],
  );
  assert.equal(plan[1].rate, 1);
});
