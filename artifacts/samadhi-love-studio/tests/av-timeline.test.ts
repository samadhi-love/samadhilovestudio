import test from "node:test";
import assert from "node:assert/strict";
import { newAVSettings, validAVSettings, mappedCues, timelineProject, importSongLook, anchorReviewMatches } from "../app/av-timeline-data";
import { stemEnvelope, visualSignal } from "../app/av-signals";
import { midiTriggers } from "../app/av-midi";
import { serializeMixer, validMixerSession } from "../app/mixer-session";
import { freshSong } from "../app/studio-data";
import { newProSettings } from "../app/lyric-pro-data";
import { AVTransport } from "../app/av-transport";
import type { MixTrack } from "../app/multitrack-audio";
import { instrumentalMidi } from "../app/instrumental-midi";

function track(id = crypto.randomUUID(), at = 0): MixTrack {
  const samples = new Float32Array(16000); samples.fill(.5, 8000, 12000);
  const buffer = { duration: 2, length: samples.length, sampleRate: 8000, numberOfChannels: 1, getChannelData: () => samples } as unknown as AudioBuffer;
  return { id, name: "Vocal", buffer, peaks: [.2,.5], start: 0, end: 2, at, level: 1, pan: 0, lowCut: 15, presence: 0, reverb: 0, echo: 0, compression: false, mute: false, solo: false };
}

test("moving and trimming the vocal anchor shifts words and scenes without rewriting source captions", () => {
  const source = [{ text: "Love and light", time: .5, end: 1.8, words: [{ offset: 4, time: .5 }, { offset: 8, time: 1 }, { offset: 14, time: 1.5 }] }];
  const original = structuredClone(source), anchor = { ...track(), at: 3, start: 1, end: 2 };
  const cues = mappedCues(source, anchor, 4);
  assert.equal(cues[0].time, 3); assert.equal(cues[0].end, 3.8); assert.equal(cues[0].words![2].time, 3.5);
  assert.deepEqual(source, original); assert.deepEqual(mappedCues(source, undefined, 4), []);
  const s = newAVSettings(); s.anchor = anchor.id; s.look.cues = source; s.markers = [{ id: "verse", name: "Verse", time: .5, end: 1.8, anchor: anchor.id, theme: "nature" }];
  const result = timelineProject(s, [anchor], "Song");
  assert.equal(result.pro!.sections[0].time, 3); assert.equal(result.pro!.sections[0].end, 3.8);
  assert.equal(result.cues[0].words![2].time, 3.5);
});

test("stem triggers use actual sample energy, clip offsets, level, mute and solo", () => {
  const a = track(), envelope = stemEnvelope(a.buffer), s = newAVSettings();
  s.mappings = [{ id: "kick", source: a.id, feature: "attack", target: "camera", amount: .8 }];
  const envelopes = new Map([[a.id, envelope]]);
  assert.equal(visualSignal(.2, s, [a], envelopes).camera, 0);
  assert(visualSignal(1.01, s, [a], envelopes).camera > .7);
  assert.equal(visualSignal(1.01, s, [{ ...a, mute: true }], envelopes).camera, 0);
  assert.equal(visualSignal(1.01, s, [{ ...a, level: 0 }], envelopes).camera, 0);
  const shifted = { ...a, start: 1, at: 3 };
  assert(visualSignal(3.01, s, [shifted], envelopes).camera > .7);
  assert.equal(visualSignal(1.01, s, [shifted], envelopes).camera, 0);
  assert.equal(visualSignal(3.01, s, [shifted, { ...track(), solo: true }], envelopes).camera, 0);
  assert.equal(stemEnvelope(a.buffer), envelope, "unchanged originals reuse their bounded analysis");
});

test("saved audiovisual mixer sessions keep the same schema and preserve original file identity", () => {
  const a = track(), s = newAVSettings(); s.anchor = a.id; s.feedback = [{ id: "note", time: 1, text: "أضف مساحة للصوت", resolved: false }];
  s.splits = [{ name: "Vocalist", percent: 60 }, { name: "Producer", percent: 40 }];
  const old = serializeMixer(crypto.randomUUID(), "Legacy", "", [a]); assert(validMixerSession(old));
  const next = serializeMixer(crypto.randomUUID(), "Visual version", "", [a], s);
  assert(validMixerSession(JSON.parse(JSON.stringify(next))));
  assert.equal(next.tracks[0].id, a.id); assert(!("buffer" in next.tracks[0]));
  assert(!validAVSettings({ ...s, splits: [{ name: "A", percent: 101 }] }));
  assert(!validAVSettings({ ...s, look: { ...s.look, pro: newProSettings(freshSong("song","Song",0),2) } }));
  assert(!validAVSettings({ ...s, midi: [{ time: 3, note: 36, channel: 9, velocity: 1 }, { time: 2, note: 36, channel: 9, velocity: 1 }] }));
});

test("copying saved lyrics preserves private artwork and makes timing review explicit", () => {
  const song = { ...freshSong("source", "Arabic song", 0), audioId: "audio", audioFormat: "wav" as const,
    lyricVideo: { ...newAVSettings().look, cues: [{ time: .1, end: 1, text: "نور وحب Love" }], pro: { ...newProSettings(freshSong("source","Arabic song",0),2), sourceAudioId: "audio", background: "private-art" } } };
  const before = JSON.stringify(song), copied = importSongLook(newAVSettings(), song, "vocal");
  assert.equal(copied.reviewed, false); assert.equal(copied.background, "private-art"); assert.equal(copied.mediaSong, song.id);
  assert.equal(copied.lyricSource!.audio, "audio"); assert.equal(JSON.stringify(song), before);
  assert.notEqual(copied.look.cues, song.lyricVideo.cues); assert(validAVSettings(copied));
});

test("MIDI note triggers honor tempo changes and running status instead of assuming one BPM", async () => {
  const tempo = [0,255,81,3,7,161,32, 135,64,255,81,3,15,66,64, 0,255,47,0];
  const notes = [0,153,36,127, 131,96,38,64, 131,96,36,64, 131,96,38,64, 0,255,47,0];
  const header = [77,84,104,100,0,0,0,6,0,1,0,2,1,224];
  const chunk = (data: number[]) => [77,84,114,107,0,0,0,data.length,...data];
  const parsed = midiTriggers(new Uint8Array([...header,...chunk(tempo),...chunk(notes)]));
  assert.deepEqual(parsed.map(n => n.time), [0,.5,1,2]); assert.equal(parsed[1].channel,9);
  assert.throws(()=>midiTriggers(new Uint8Array([0,1,2])), /incomplete|MIDI/);
  const generated = await instrumentalMidi({ preset: "house", bpm: 120, seconds: 10, tonic: 0, minor: false, arrangement: "steady", seed: 1 }).arrayBuffer();
  assert(midiTriggers(new Uint8Array(generated)).length > 0, "the app's existing MIDI export can drive the visual engine");
});

test("the audio transport schedules every stem from one clock and cancels pending playback cleanly", async () => {
  const starts: number[][] = []; let stops = 0, closed = 0;
  const node = () => ({ connect() { return this; }, disconnect() {}, gain: { value: 0 }, frequency: { value: 0 }, Q: { value: 0 }, pan: { value: 0 } });
  const ctx = { currentTime: 10, destination: {}, resume: async()=>{}, close: async()=>{closed++;}, createGain: node, createBiquadFilter: node, createStereoPanner: node,
    createBufferSource: ()=>({ ...node(), buffer: null, start: (...args: number[])=>starts.push(args), stop: ()=>{stops++;} }) };
  const a = { ...track(), start: .5, end: 2, at: 1 }, b = { ...track(), at: 3 };
  const transport = new AVTransport(()=>ctx as unknown as AudioContext);
  await transport.play([a,b], 1.25);
  assert.equal(starts[0][0],10.035); assert.equal(starts[0][1],.75); assert.equal(starts[1][0],11.785);
  ctx.currentTime = 10.535; assert(Math.abs(transport.time-1.75)<1e-9);
  transport.pause(); assert.equal(transport.playing,false); assert.equal(stops,2);
  await assert.rejects(transport.play([{...a,end:0}]),/trim|placement/); assert.equal(transport.playing,false);
  await transport.close(); assert.equal(closed,1);
});


test("moving a reviewed vocal keeps synchronization, while changing its trim requires a fresh review",()=>{
 const a=track(),s=newAVSettings();s.anchor=a.id;s.reviewed=true;s.reviewedAnchor={id:a.id,start:a.start,end:a.end};
 assert(anchorReviewMatches(s,[a]));assert(anchorReviewMatches(s,[{...a,at:4}]));
 assert(!anchorReviewMatches(s,[{...a,start:.5}]));assert(!anchorReviewMatches(s,[{...a,id:crypto.randomUUID()}]));
});
