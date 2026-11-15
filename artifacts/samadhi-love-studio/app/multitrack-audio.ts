import { sampleRate, wavAudio } from "./recording-dsp";
import { maxProductionSeconds } from "./track-duration";

export const maxMixSeconds = maxProductionSeconds;
export const maxMixTracks = 6;
export type MixTrack = {
  id: string; name: string; buffer: AudioBuffer; peaks: number[];
  start: number; end: number; at: number; level: number; pan: number;
  lowCut: number; presence: number; reverb: number; echo: number; compression: boolean; mute: boolean; solo: boolean;
  sourceBlob?: Blob;
};

export function mixRoomImpulse(context: BaseAudioContext) {
  const length = Math.round(sampleRate * 1.2);
  const impulse = context.createBuffer(2, length, sampleRate);
  let seed = 1931;
  for (let channel = 0; channel < 2; channel++) {
    const samples = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      samples[i] = (seed / 2147483648 - 1) * (1 - i / length) ** 3;
    }
  }
  return impulse;
}

export function connectMixSource(context: BaseAudioContext, track: MixTrack, destination: AudioNode, room: AudioBuffer | null) {
    const source = context.createBufferSource();
    source.buffer = track.buffer;
    const highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = track.lowCut;
    highpass.Q.value = 0.707;
    const eq = context.createBiquadFilter();
    eq.type = "highshelf"; eq.frequency.value = 3300; eq.gain.value = track.presence;
    const gain = context.createGain();
    gain.gain.value = track.level;
    const pan = context.createStereoPanner();
    pan.pan.value = track.pan;
    source.connect(highpass).connect(eq);
    if (track.compression) {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -22; compressor.ratio.value = 3;
      eq.connect(compressor).connect(gain);
    } else eq.connect(gain);
    gain.connect(pan).connect(destination);
    if (track.reverb && room) {
      const reverb = context.createConvolver();
      const wet = context.createGain();
      reverb.buffer = room; wet.gain.value = track.reverb;
      pan.connect(reverb).connect(wet).connect(destination);
    }
    if (track.echo) {
      const echo = context.createDelay(0.4);
      const wet = context.createGain();
      echo.delayTime.value = 0.28; wet.gain.value = track.echo;
      pan.connect(echo).connect(wet).connect(destination);
    }

  return source;
}

export async function renderMixBuffer(tracks: MixTrack[], options: { signal?: AbortSignal; length?: number } = {}) {
  options.signal?.throwIfAborted();
  const solo = tracks.some(track => track.solo && !track.mute);
  const active = tracks.filter(track => !track.mute && (!solo || track.solo));
  if (!active.length) throw new Error("Unmute at least one track to render your mix.");
  if (active.some(track => track.start < 0 || track.end <= track.start || track.end > track.buffer.duration || track.at < 0))
    throw new Error("Check that each trim end comes after its start and fits inside the recording.");
  const seconds = Math.max(options.length ?? 0, ...active.map(track => track.at + track.end - track.start));
  if (seconds > maxMixSeconds + 0.001) throw new Error("Shorten the arrangement to eight minutes or less.");
  const tail = active.some(track => track.reverb || track.echo) ? 1.3 : 0;
  const context = new OfflineAudioContext(2, Math.ceil((seconds + tail) * sampleRate), sampleRate);
  const room = active.some(track => track.reverb) ? mixRoomImpulse(context) : null;
  for (const track of active) {
    const source = connectMixSource(context, track, context.destination, room);
    source.start(track.at, track.start, track.end - track.start);
  }
  const rendered = await context.startRendering();
  options.signal?.throwIfAborted();
  const left = rendered.getChannelData(0);
  const right = rendered.getChannelData(1);
  let peak = 0.98;
  for (let i = 0; i < left.length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  if (peak > 0.98) for (let i = 0; i < left.length; i++) {
    left[i] *= 0.98 / peak;
    right[i] *= 0.98 / peak;
  }
  return rendered;
}

export async function renderMix(tracks: MixTrack[]) {
  const rendered = await renderMixBuffer(tracks);
  return wavAudio(rendered.getChannelData(0), rendered.getChannelData(1));
}
