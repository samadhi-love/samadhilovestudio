import type { Instrumental } from "./creation-guide";
import { instrumentalEvents, instrumentNoteLength, type InstrumentEvent } from "./instrumental";

const ticksPerBeat = 480;
const tracks = [
  { name: "Rhythm", kinds: ["kick", "hand", "hat"], channel: 9, program: 0 },
  { name: "Bass", kinds: ["bass"], channel: 0, program: 38 },
  { name: "Harmony", kinds: ["pad"], channel: 1, program: 89 },
  { name: "Melody", kinds: ["pluck"], channel: 2, program: 24 },
];
const drums = { kick: 36, hand: 39, hat: 42 } as const;
const bytes = (number: number, width: number) => Array.from({ length: width }, (_, index) => number >>> ((width - 1 - index) * 8) & 255);
const tag = (text: string) => [...text].map(letter => letter.charCodeAt(0));
function delta(value: number) {
  const result = [value & 127];
  while (value >>>= 7) result.unshift((value & 127) | 128);
  return result;
}
function trackChunk(events: number[]) {
  return [...tag("MTrk"), ...bytes(events.length, 4), ...events];
}

export function instrumentalMidi(settings: Instrumental) {
  const beat = 60 / settings.bpm;
  const toTick = (seconds: number) => Math.round(seconds / beat * ticksPerBeat);
  const duration = toTick(settings.seconds);
  const all = instrumentalEvents(settings);
  const output = [...tag("MThd"), ...bytes(6, 4), 0, 1, 0, tracks.length + 1, ...bytes(ticksPerBeat, 2)];
  output.push(...trackChunk([0, 255, 81, 3, ...bytes(Math.round(60_000_000 / settings.bpm), 3), 0, 255, 88, 4, 4, 2, 24, 8, ...delta(duration), 255, 47, 0]));
  for (const track of tracks) {
    const events: { time: number; message: number[]; off: boolean }[] = [];
    const notes = new Map<number, InstrumentEvent[]>();
    for (const event of all) {
      if (!track.kinds.includes(event.kind)) continue;
      const pitch = event.kind === "kick" || event.kind === "hand" || event.kind === "hat" ? drums[event.kind] : event.midi;
      const prior = notes.get(pitch);
      if (prior) prior.push(event);
      else notes.set(pitch, [event]);
    }
    for (const [pitch, hits] of notes) {
      hits.sort((a, b) => a.time - b.time);
      for (const [index, hit] of hits.entries()) {
        const start = toTick(hit.time);
        const next = hits[index + 1];
        const end = Math.min(duration, toTick(hit.time + instrumentNoteLength(hit.kind, beat)), next ? toTick(next.time) : duration);
        if (end <= start) continue;
        const velocity = Math.max(1, Math.min(127, Math.round(44 + hit.volume * 140)));
        events.push({ time: start, message: [0x90 | track.channel, pitch, velocity], off: false },
          { time: end, message: [0x80 | track.channel, pitch, 0], off: true });
      }
    }
    events.sort((a, b) => a.time - b.time || Number(b.off) - Number(a.off));
    const data = [0, 255, 3, track.name.length, ...tag(track.name)];
    if (track.channel !== 9) data.push(0, 0xc0 | track.channel, track.program);
    let previous = 0;
    for (const event of events) {
      data.push(...delta(event.time - previous), ...event.message);
      previous = event.time;
    }
    data.push(...delta(duration - previous), 255, 47, 0);
    // Append incrementally to avoid spreading a long track into a single function call.
    for (const value of trackChunk(data)) output.push(value);
  }
  return new Blob([Uint8Array.from(output)], { type: "audio/midi" });
}
