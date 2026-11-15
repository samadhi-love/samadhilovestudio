import assert from "node:assert/strict";
import test from "node:test";
import {
  captionFile,
  isLyricProject,
  type LyricProject,
} from "../app/lyric-video-data";
import { freshSong } from "../app/studio-data";
import {
  newProSettings,
  clipCues,
  lrcFile,
  compareLyrics,
  reviewTiming,
  sectionsFromLyrics,
  sourceChanged,
} from "../app/lyric-pro-data";
import {
  alignLyricLines,
  captionsFromTranscript,
} from "../app/lyric-alignment";
import { clarifyChannel, analyzeAudio } from "../app/lyric-pro-media";
import {captionReadyLines,savedLyricsForAudio} from "../app/caption-ready-lyrics";
const song = {
  ...freshSong("song-1", "QA Original", 0),
  audioId: "original-audio",
  audioFormat: "mp3" as const,
};
test("caption grouping preserves approved multilingual characters and recovers lyrics only for the matching recording",()=>{const text="[Verse]\n"+"نور الحب يرافقنا Love and light guide us ".repeat(9);const before=text,lines=captionReadyLines(text);assert(lines.length>2);assert(lines.every(line=>line.length<=180&&line.split(/\s+/).length<=10));assert.equal(lines.join("").replace(/\s/g,""),text.replace(/^\[Verse\]\n/,"").replace(/\s/g,""));assert.equal(text,before);const saved={...song,notes:{...song.notes,lyrics:"current words"},generation:{provider:"ElevenLabs",model:"fixture",audioId:"old-audio",approvedLyrics:"approved historical words",compositionPlan:{},createdAt:"",captionReady:true,timingSource:"not-provided"}};assert.equal(savedLyricsForAudio(saved,"old-audio"),"approved historical words");assert.equal(savedLyricsForAudio(saved,"original-audio"),"current words");assert.equal(savedLyricsForAudio(saved,"unknown-audio"),"");const asian="愛と光が世界をつなぐ".repeat(30);assert.equal(captionReadyLines(asian).join(""),asian);});
const base: LyricProject = {
  cues: [
    {
      time: 2,
      end: 5,
      text: "Love and light",
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
  pro: newProSettings(song, 180),
};
test("legacy projects stay valid, and pro data survives save/close/reopen serialization", () => {
  assert(isLyricProject({ ...base, pro: undefined }));
  const saved = JSON.stringify(base),
    reopened = JSON.parse(saved);
  assert(isLyricProject(reopened));
  assert.deepEqual(reopened, base);
  assert.ok(reopened.pro);
  assert.equal(reopened.pro.sourceAudioId, "original-audio");
  assert.equal(
    sourceChanged({ ...song, audioId: "replacement" }, reopened),
    true,
  );
  for (const patch of [
    { language: "made-up" },
    { range: { start: 200, end: 300 } },
    { duration: Infinity },
    { duetColors: ["red", "blue"] },
    {
      sections: [
        { id: "a", name: "Verse", time: 0, end: 10, theme: "unknown" },
      ],
    },
  ])
    assert(!isLyricProject({ ...base, pro: { ...base.pro, ...patch } }));
});
test("excerpt timing retains all offsets and shifts word timestamps without modifying source", () => {
  const before = JSON.stringify(base.cues);
  const clipped = clipCues(base.cues, 3.5, 4.8);
  assert.equal(clipped[0].time, 0);
  assert(Math.abs(clipped[0].end! - 1.3) < 1e-9);
  assert.equal(clipped[0].words?.at(-1)?.time, 0.5);
  assert.equal(JSON.stringify(base.cues), before);
  const srt = captionFile(base.cues, 3.5, 4.8, "srt");
  assert.match(srt, /00:00:00,000 --> 00:00:01,300/);
  assert.match(
    lrcFile([{ text: "At the minute", time: 59.999 }], 0, 70),
    /\[01:00.00\]/,
  );
});
test("review flags missing, repeated, added and changed recognized words without rewriting approved lyrics", () => {
  const original =
    "[Verse]\nLove and light\n[Chorus]\nTake me home\nTake me home";
  const result = compareLyrics(original, "Love and bright take me home now");
  assert(result.some((d) => d.kind === "changed" && d.approved === "light"));
  assert(result.some((d) => d.kind === "missing"));
  assert(result.some((d) => d.heard === "now"));
  assert.equal(
    original,
    "[Verse]\nLove and light\n[Chorus]\nTake me home\nTake me home",
  );
  assert.deepEqual(compareLyrics("نورُ الحبّ", "نور الحب"), []);
});
test("timing review finds fast captions and invalid intervals without invented confidence", () => {
  const issues = reviewTiming(
    [
      { text: "A very fast chorus with many words", time: 1, end: 1.2 },
      { text: "Past end", time: 200, end: 201 },
    ],
    180,
  );
  assert(issues.some((i) => i.message.startsWith("Fast caption")));
  assert(issues.some((i) => i.message.startsWith("Timing falls")));
  assert(issues.every((i) => !i.message.includes("confidence")));
});
test("forced alignment preserves Arabic, mixed language and punctuation exactly", () => {
  const line = "نور الحب — love & light!";
  const words = Array.from(line).map((text, i) => ({
    text,
    start: i * 0.1,
    end: (i + 1) * 0.1,
  }));
  const aligned = alignLyricLines([line], { characters: words });
  assert.equal(aligned?.[0].text, line);
  assert(aligned?.[0].words?.length);
  assert.equal(
    alignLyricLines(["Love and light"], {
      words: [{ text: "Love and night", start: 0, end: 2 }],
    }),
    null,
  );
});
test("transcription groups repeated choruses, instrumental gaps and alternating speakers", () => {
  const cues = captionsFromTranscript([
    { type: "audio_event", text: "[music]", start: 0, end: 2 },
    { type: "word", text: "Love", start: 2, end: 2.4, speaker_id: "A" },
    { type: "word", text: "light", start: 2.5, end: 2.8, speaker_id: "A" },
    { type: "word", text: "Love", start: 6, end: 6.3, speaker_id: "B" },
    { type: "word", text: "light", start: 6.4, end: 6.7, speaker_id: "B" },
  ]);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].singer, "A");
  assert.equal(cues[1].singer, "B");
  assert.equal(cues[0].end, 2.8);
  assert.equal(cues[1].time, 6);
  assert(!cues.some((c) => c.text.includes("music")));
});
test("section markers follow repeated approved sections rather than collapsing choruses", () => {
  const cues = [
    { text: "One", time: 2, end: 3 },
    { text: "Home", time: 10, end: 12 },
    { text: "Two", time: 20, end: 21 },
    { text: "Home", time: 30, end: 32 },
  ];
  const sections = sectionsFromLyrics(
    "[Verse 1]\nOne\n[Chorus]\nHome\n[Verse 2]\nTwo\n[Chorus]\nHome",
    cues,
    40,
  );
  assert.deepEqual(
    sections.map((s) => s.time),
    [2, 10, 20, 30],
  );
  assert.equal(sections.at(-1)?.end, 40);
});
test("section markers follow wrapped and pause-separated captions without collapsing repeated lyrics",()=>{
  const cues=[{text:"Love and",time:1,end:2.3},{text:"light",time:8,end:9},{text:"Again we",time:20,end:22},{text:"rise",time:24,end:25},{text:"Love and",time:40,end:42},{text:"light",time:48,end:49}];
  const sections=sectionsFromLyrics("[Verse]\nLove and light\n[Chorus]\nAgain we rise\n[Final chorus]\nLove and light",cues,60);
  assert.deepEqual(sections.map(s=>[s.name,s.time,s.end]),[["Verse",1,20],["Chorus",20,40],["Final chorus",40,60]]);
});
test("clarity processing preserves sample count and time origin with no pitch correction", () => {
  const samples = new Float32Array(44100);
  samples[1000] = 0.9;
  const copy = samples.slice(),
    processed = clarifyChannel(samples, 44100, false);
  assert.equal(processed.length, samples.length);
  assert.deepEqual(samples, copy);
  assert(processed.subarray(0, 1000).every((x) => x === 0));
  assert(processed.every(Number.isFinite));
  const fake = {
    getChannelData: () => samples,
    sampleRate: 44100,
    duration: 1,
  } as unknown as AudioBuffer;
  const analysis = analyzeAudio(fake);
  assert.equal(analysis.energy?.length, 20);
  assert((analysis.waveform?.length ?? 0) <= 1000);
  assert(analysis.energy?.every((n) => n >= 0 && n <= 1));
});
