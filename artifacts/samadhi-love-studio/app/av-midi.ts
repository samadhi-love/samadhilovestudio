import type { MidiTrigger } from "./av-timeline-data";
/** Standard MIDI format 0/1, PPQ timing, running status and global tempo changes. */
export function midiTriggers(bytes: Uint8Array): MidiTrigger[] {
  if (bytes.length > 2 * 1024 * 1024) throw new Error("Choose a MIDI file up to 2 MiB.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let at = 0;
  const need = (count: number, end = bytes.length) => { if (at + count > end) throw new Error("The MIDI file is incomplete."); };
  const u16 = () => { need(2); const v = view.getUint16(at); at += 2; return v; };
  const u32 = () => { need(4); const v = view.getUint32(at); at += 4; return v; };
  const tag = () => { need(4); const s = String.fromCharCode(...bytes.subarray(at, at + 4)); at += 4; return s; };
  const variable = (end: number) => { let n = 0; for (let i = 0; i < 4; i++) { need(1, end); const b = bytes[at++]; n = n * 128 + (b & 127); if (!(b & 128)) return n; } throw new Error("Invalid MIDI event length."); };
  if (tag() !== "MThd") throw new Error("Choose a standard MIDI file (.mid).");
  const header = u32(), format = u16(), tracks = u16(), division = u16();
  if (header < 6 || format > 1 || !tracks || tracks > 64 || !division || division & 0x8000) throw new Error("Use MIDI format 0 or 1 with beat-based timing; SMPTE and format 2 are not supported.");
  at += header - 6; need(0);
  const notes: { tick: number; note: number; velocity: number; channel: number }[] = [], tempos = [{ tick: 0, micros: 500000 }]; let events = 0;
  for (let track = 0; track < tracks; track++) {
    if (tag() !== "MTrk") throw new Error("A MIDI track header is missing.");
    const length = u32(), end = at + length; need(length); let tick = 0, running = 0;
    while (at < end) {
      if (++events > 100000) throw new Error("This MIDI file contains too many events.");
      tick += variable(end); need(1, end); let status = bytes[at];
      if (status >= 128) { at++; if (status < 240) running = status; } else status = running;
      if (!status) throw new Error("Invalid MIDI running status.");
      if (status === 255) {
        need(1, end); const type = bytes[at++], size = variable(end); need(size, end);
        if (type === 81 && size === 3) { const micros = bytes[at] * 65536 + bytes[at + 1] * 256 + bytes[at + 2]; if (!micros) throw new Error("Invalid MIDI tempo."); tempos.push({ tick, micros }); }
        at += size; running = 0;
      } else if (status === 240 || status === 247) { const size = variable(end); need(size, end); at += size; running = 0; }
      else if (status >= 128 && status < 240) {
        const kind = status >> 4, size = kind === 12 || kind === 13 ? 1 : 2; need(size, end);
        const note = bytes[at++], velocity = size === 2 ? bytes[at++] : 0;
        if (note > 127 || velocity > 127) throw new Error("Invalid MIDI note data.");
        if (kind === 9 && velocity) notes.push({ tick, note, velocity: velocity / 127, channel: status & 15 });
      } else throw new Error("This MIDI event format is unsupported.");
    }
  }
  tempos.sort((a, b) => a.tick - b.tick); notes.sort((a, b) => a.tick - b.tick);
  let tempoIndex = 0, previousTick = 0, seconds = 0, micros = 500000;
  const result = notes.map(n => {
    while (tempoIndex < tempos.length && tempos[tempoIndex].tick <= n.tick) { const t = tempos[tempoIndex++]; seconds += (t.tick - previousTick) / division * micros / 1e6; previousTick = t.tick; micros = t.micros; }
    return { time: seconds + (n.tick - previousTick) / division * micros / 1e6, note: n.note, velocity: n.velocity, channel: n.channel };
  });
  if (result.length > 2000 || result.some(e => e.time > 480)) throw new Error("Use a MIDI excerpt up to eight minutes with at most 2,000 note-on events.");
  if (!result.length) throw new Error("No note-on triggers were found in this MIDI file.");
  return result;
}
