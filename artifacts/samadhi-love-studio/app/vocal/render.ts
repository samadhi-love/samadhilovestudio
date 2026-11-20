import { sampleRate, tuneVoice, wavAudio } from "../recording-dsp";
import { cleanVocal, compressor, hasRack, rack, roomImpulse } from "./effects";
import { automationAt, busFor, dry, type Clip, type Session } from "./session";

export function audibleClips(clips: Clip[]) {
  const solo = clips.some(clip => clip.solo && !clip.mute);
  return clips.filter(clip => !clip.mute && (!solo || clip.solo));
}

/** What goes into the saved song: audible tracks without guide tracks. */
export function songClips(clips: Clip[]) {
  return audibleClips(clips).filter(clip => !clip.guide);
}

export function mixLength(clips: Clip[]) {
  return Math.max(0, ...clips.map(clip => clip.at + clip.end - clip.start)) + (clips.some(c => !c.bypass && (c.effects.reverb || c.effects.delay)) ? 1.25 : 0);
}

export async function renderVocal(clips: Clip[], lookup: (id: string) => AudioBuffer | undefined, master: Pick<Session, "master" | "masterLimiter" | "buses">,
  options: { length?: number; signal?: AbortSignal } = {}) {
  if (!clips.length) throw new Error("Unmute at least one clip to render.");
  const length = Math.max(mixLength(clips), options.length ?? 0);
  const context = new OfflineAudioContext(2, Math.max(1, Math.ceil(length * sampleRate)), sampleRate);
  const output = context.createGain();
  output.gain.value = master.master;
  compressor(context, output, master.masterLimiter ? 72 : 0, true).connect(context.destination);
  const buses = { vocals: context.createGain(), music: context.createGain() };
  buses.vocals.gain.value = master.buses?.vocals ?? 1;
  buses.music.gain.value = master.buses?.music ?? 1;
  buses.vocals.connect(output); buses.music.connect(output);
  const room = clips.some(c => !c.bypass && c.effects.reverb) ? roomImpulse(context) : null;
  for (const clip of clips) {
    options.signal?.throwIfAborted();
    const buffer = lookup(clip.source);
    if (!buffer) throw new Error("A source recording is unavailable. Reopen this session to reload it.");
    const startFrame = Math.round(clip.start * sampleRate);
    const endFrame = Math.min(buffer.length, Math.round(clip.end * sampleRate));
    const frames = endFrame - startFrame;
    if (frames < 1) throw new Error("Check the trim on " + clip.name + ".");
    const duration = frames / sampleRate;
    const e = clip.bypass ? dry : clip.effects;
    const source = context.createBufferSource();
    const channels = Math.min(buffer.numberOfChannels, 2);
    const tuning = clip.tuning;
    const tune = !clip.bypass && (tuning.strength || tuning.shift || tuning.formant || tuning.notes.length);
    if (tune || e.noise || e.deEss || e.gate !== -90 || e.breath) {
      const clean = context.createBuffer(channels, frames, sampleRate);
      for (let channel = 0; channel < channels; channel++) {
        let samples = buffer.getChannelData(channel).subarray(startFrame, endFrame);
        if (tune) {
          const tuned = await tuneVoice(samples, tuning.key, tuning.scale, tuning.strength / 100, () => {}, options.signal, {
            speed: tuning.speed, shift: tuning.shift, formant: tuning.formant, notes: tuning.notes, offset: clip.start,
          });
          samples = tuned.samples as Float32Array<ArrayBuffer>;
        }
        clean.copyToChannel(cleanVocal(samples, e) as Float32Array<ArrayBuffer>, channel);
      }
      source.buffer = clean;
    } else source.buffer = buffer;
    const envelope = context.createGain();
    const attack = Math.min(clip.fadeIn, duration / 2);
    const release = Math.min(clip.fadeOut, duration / 2);
    envelope.gain.setValueAtTime(attack ? 0 : 1, clip.at);
    if (attack) envelope.gain.linearRampToValueAtTime(1, clip.at + attack);
    if (release) {
      envelope.gain.setValueAtTime(1, clip.at + duration - release);
      envelope.gain.linearRampToValueAtTime(0, clip.at + duration);
    }
    source.connect(envelope);
    const processed = hasRack(e) ? rack(context, envelope, e, room) : envelope;
    const level = context.createGain();
    const points = clip.automation ?? [];
    level.gain.setValueAtTime(clip.volume * automationAt(points, clip.start), clip.at);
    for (const point of points) {
      if (point.time > clip.start && point.time < clip.end)
        level.gain.linearRampToValueAtTime(clip.volume * point.gain, clip.at + point.time - clip.start);
    }
    if (points.length) level.gain.linearRampToValueAtTime(clip.volume * automationAt(points, clip.end), clip.at + duration);
    const pan = context.createStereoPanner(); pan.pan.value = clip.pan;
    processed.connect(level).connect(pan).connect(buses[busFor(clip)]);
    source.start(clip.at, source.buffer === buffer ? startFrame / sampleRate : 0, duration);
  }
  const audio = await context.startRendering();
  options.signal?.throwIfAborted();
  // Leave WAV headroom without silently normalizing quiet takes.
  const left = audio.getChannelData(0), right = audio.getChannelData(1);
  let peak = 0.98;
  for (let i = 0; i < left.length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  if (peak > 0.98) {
    const gain = 0.98 / peak;
    for (let i = 0; i < left.length; i++) { left[i] *= gain; right[i] *= gain; }
  }
  return audio;
}

export const stereoWav = (audio: AudioBuffer) => wavAudio(audio.getChannelData(0), audio.getChannelData(1));
