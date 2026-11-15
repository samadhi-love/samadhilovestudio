import type { AVSettings } from "./av-timeline-data";
import { audibleMixTracks } from "./av-timeline-data";
import type { MixTrack } from "./multitrack-audio";
export type StemEnvelope = { fps: number; energy: Float32Array; attack: Float32Array };
export type VisualSignal = { camera: number; light: number; lyrics: number; color: number };
const cache = new WeakMap<AudioBuffer, StemEnvelope>();
/** Amplitude and positive energy changes from real samples; no drum/instrument classification. */
export function stemEnvelope(buffer: AudioBuffer): StemEnvelope {
  const known = cache.get(buffer); if (known) return known;
  const fps = 20, count = Math.ceil(buffer.duration * fps), energy = new Float32Array(count), attack = new Float32Array(count);
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  let max = 0;
  for (let frame = 0; frame < count; frame++) {
    const from = Math.floor(frame * buffer.sampleRate / fps), until = Math.min(buffer.length, Math.floor((frame + 1) * buffer.sampleRate / fps));
    const step = Math.max(1, Math.floor((until - from) / 256)); let sum = 0, n = 0;
    for (let i = from; i < until; i += step) for (const channel of channels) { const v = channel[i]; if (Number.isFinite(v)) { sum += v * v; n++; } }
    energy[frame] = Math.sqrt(sum / Math.max(1, n)); max = Math.max(max, energy[frame]);
  }
  for (let i = 0; i < count; i++) { energy[i] = max > 1e-7 ? energy[i] / max : 0; attack[i] = Math.max(0, energy[i] - (energy[i - 1] ?? 0)); }
  const result = { fps, energy, attack }; cache.set(buffer, result); return result;
}
export function envelopeValue(envelope: StemEnvelope, feature: "energy" | "attack", time: number) {
  const frame = Math.floor(time * envelope.fps);
  if (frame < 0 || frame >= envelope.energy.length) return 0;
  if (feature === "energy") { const fraction=time*envelope.fps-frame;return envelope.energy[frame]*(1-fraction)+(envelope.energy[frame+1]??envelope.energy[frame])*fraction; }
  let value = 0;
  for (let i = Math.max(0, frame - 4); i <= frame; i++) value = Math.max(value, envelope.attack[i] * Math.exp(-(time * envelope.fps - i) / 2));
  return value;
}
export function visualSignal(time: number, settings: AVSettings, tracks: MixTrack[], envelopes: Map<string, StemEnvelope>): VisualSignal {
  const result: VisualSignal = { camera: 0, light: 0, lyrics: 0, color: 0 }, audible = audibleMixTracks(tracks);
  for (const mapping of settings.mappings) {
    let value = 0;
    if (mapping.source.startsWith("midi:")) {
      for (const event of settings.midi) {
        if (event.time > time) break;
        if (time - event.time > .3 || (mapping.source !== "midi:all" && event.channel !== 9) || (mapping.source === "midi:kick" && ![35, 36].includes(event.note)) || (mapping.source === "midi:snare" && ![38, 40].includes(event.note))) continue;
        value = Math.max(value, event.velocity * Math.exp(-(time - event.time) / .12));
      }
    } else {
      const track = audible.find(t => t.id === mapping.source), envelope = track && envelopes.get(track.id);
      if (track && envelope && time >= track.at && time < track.at + track.end - track.start)
        value = envelopeValue(envelope, mapping.feature, time - track.at + track.start) * Math.min(1.5, track.level);
    }
    result[mapping.target] = Math.min(1, Math.max(result[mapping.target], value * mapping.amount));
  }
  return result;
}
