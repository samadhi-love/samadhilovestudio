import { isInstrumental, type Instrumental, type Preset } from "./creation-guide";
import { maxAudioBytes } from "./studio-data";
import { sampleRate as defaultSampleRate, wavAudio } from "./recording-dsp";

export const stems = { rhythm: "Rhythm", bass: "Bass", harmony: "Harmony & melody" } as const;
export type Stem = keyof typeof stems;

const palettes = {
  dabke: { kick: [0, 2, 4, 7, 8, 11, 12, 14], hand: [3, 6, 9, 13, 15], riff: [0, 3, 6, 8, 11, 14], swing: 0.01 },
  house: { kick: [0, 4, 8, 12], hand: [4, 12], riff: [0, 2, 6, 8, 10, 14], swing: 0 },
  soul: { kick: [0, 6, 10, 13], hand: [4, 12], riff: [1, 5, 8, 11, 14], swing: 0.038 },
  still: { kick: [0], hand: [], riff: [2, 9], swing: 0 },
} satisfies Record<Preset, { kick: number[]; hand: number[]; riff: number[]; swing: number }>;

function randomFrom(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function progression(preset: Preset, minor: boolean, seed: number) {
  if (preset === "dabke") return minor ? [0, 1, 3, 1] : [0, 4, 5, 4];
  if (preset === "soul") return seed % 2 ? [1, 4, 0, 5] : [0, 5, 1, 4];
  if (preset === "still") return seed % 2 ? [0, 3, 0, 4] : [0, 5, 3, 4];
  return minor ? [0, 5, 2, 6] : [0, 4, 5, 3];
}

function intensity(settings: Instrumental, bar: number, bars: number) {
  const position = bar / Math.max(1, bars - 1);
  if (bar === 0 || position > 0.92) return 0.32;
  if (settings.arrangement === "steady") return 0.78;
  if (settings.arrangement === "cinematic") return position < 0.22 ? 0.43 : position < 0.58 ? 0.65 : 0.95;
  if (position > 0.56 && position < 0.72) return 0.38;
  return position < 0.28 ? 0.63 : 1;
}

type Sound = "kick" | "hand" | "hat" | "bass" | "pad" | "pluck";

export type InstrumentEvent = { kind: Sound; midi: number; time: number; volume: number; pan: number };

const stemFor = { kick: "rhythm", hand: "rhythm", hat: "rhythm", bass: "bass", pad: "harmony", pluck: "harmony" } as const;

export function instrumentalEvents(settings: Instrumental): InstrumentEvent[] {
  if (!isInstrumental(settings)) throw new Error("Check your instrumental settings and try again.");
  const { bpm, seconds, tonic, preset, seed, minor } = settings;
  const beat = 60 / bpm;
  const bars = Math.ceil(seconds / (beat * 4));
  const pattern = palettes[preset];
  const events: InstrumentEvent[] = [];
  const play = (kind: Sound, midi: number, time: number, volume: number, pan = 0) => {
    if (time < seconds && volume > 0) events.push({ kind, midi, time, volume, pan });
  };
  const scale = preset === "dabke" && minor ? [0, 1, 4, 5, 7, 8, 10] :
    minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const note = (degree: number, root: number) => root + tonic + scale[degree % 7] + Math.floor(degree / 7) * 12;
  const chords = progression(preset, minor, seed);
  const random = randomFrom(seed);
  const original = [0, 2, 4, 5, 4, 2].map((degree, index) => index === 0 ? degree : (degree + Math.floor(random() * 2)) % 7);
  const motif = settings.motif === "mirror" ? original.map(degree => (7 - degree) % 7)
    : settings.motif === "reverse" ? [...original].reverse()
      : settings.motif === "rotate" ? [...original.slice(2), ...original.slice(0, 2)] : original;
  for (let bar = 0; bar < bars; bar++) {
    const energy = intensity(settings, bar, bars);
    const root = chords[(preset === "still" ? Math.floor(bar / 2) : bar) % chords.length];
    const start = bar * beat * 4;
    const at = (step: number) => start + step * beat / 4 + (step % 2 ? pattern.swing : 0);
    // Rhythm
    pattern.kick.forEach((step, index) => {
      if (energy > 0.5 || index === 0) play("kick", 0, at(step), energy * (preset === "still" ? 0.18 : 0.55));
    });
    if (energy > 0.5) pattern.hand.forEach(step => play("hand", 0, at(step), 0.23 * energy, step % 2 ? -0.2 : 0.2));
    if (preset !== "still" && energy > 0.55)
      for (const step of [2, 6, 10, 14]) play("hat", 0, at(step), 0.13 * energy, step % 4 ? 0.25 : -0.25);
    // Bass
    const steps = preset === "still" || energy < 0.45 ? [0] : preset === "soul" ? [0, 6, 10, 13] : [2, 6, 10, 14];
    steps.forEach((step, index) => play("bass", note(root + (index === 3 ? 4 : 0), 36), at(step), 0.31 * energy));
    // Harmony
    [0, 2, 4].forEach((degree, index) => play("pad", note(root + degree, 48), start, 0.12 + 0.035 * energy, (index - 1) * 0.34));
    pattern.riff.forEach((step, index) => {
      if (energy < 0.48 && index % 3 !== 0) return;
      const pitch = note(root + motif[(index + (bar % 4 === 3 ? 1 : 0)) % motif.length], 60);
      play("pluck", pitch, at(step), 0.30 * energy, index % 2 ? 0.27 : -0.27);
      if (preset === "still" || preset === "dabke") play("pluck", pitch, at(step) + beat * 0.72, 0.065 * energy, index % 2 ? -0.58 : 0.58);
    });
  }
  return events;
}

export function instrumentNoteLength(kind: Sound, beat: number) {
  return { kick: 0.25, hand: 0.18, hat: 0.07, bass: beat * 0.82, pad: beat * 3.96, pluck: beat * 1.22 }[kind];
}

export async function renderInstrumental(settings: Instrumental, stem?: Stem) {
  if (!isInstrumental(settings)) throw new Error("Check your instrumental settings and try again.");
  if (typeof OfflineAudioContext === "undefined") throw new Error("This browser cannot render instrumentals. Try a current Chrome, Edge, or Safari browser.");
  const { bpm, seconds, preset, seed } = settings;
  // Keep long stereo WAVs within the existing upload limit.
  const sampleRate = seconds * defaultSampleRate * 4 + 44 > maxAudioBytes ? 32000 : defaultSampleRate;
  const beat = 60 / bpm;
  const context = new OfflineAudioContext(2, Math.round(sampleRate * seconds), sampleRate);
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 3;
  if (stem) master.connect(context.destination);
  else master.connect(compressor).connect(context.destination);
  master.gain.setValueAtTime(0, 0);
  master.gain.linearRampToValueAtTime(0.88, 0.065);
  master.gain.setValueAtTime(0.88, seconds - 1.1);
  master.gain.linearRampToValueAtTime(0, seconds);
  const buffers = new Map<string, AudioBuffer>();

  function soundBuffer(kind: Sound, midi: number) {
    const id = kind + ":" + midi;
    const saved = buffers.get(id);
    if (saved) return saved;
    const length = instrumentNoteLength(kind, beat);
    const buffer = context.createBuffer(1, Math.max(1, Math.round(length * sampleRate)), sampleRate);
    const samples = buffer.getChannelData(0);
    const hz = 440 * 2 ** ((midi - 69) / 12);
    const noise = randomFrom(seed ^ midi ^ (kind === "hand" ? 9203 : 857));
    let previousNoise = 0;
    for (let i = 0; i < samples.length; i++) {
      const t = i / sampleRate;
      const wave = Math.PI * 2 * hz * t;
      const edge = Math.min(1, t / (kind === "pad" ? 0.27 : 0.006), (length - t) / (kind === "pad" ? 0.45 : 0.035));
      if (kind === "kick") samples[i] = Math.sin(2 * Math.PI * (47 * t + 3.2 * (1 - Math.exp(-t * 55)))) * Math.exp(-t * 14) * edge;
      if (kind === "hand" || kind === "hat") {
        const nextNoise = noise() * 2 - 1;
        const bright = (nextNoise - previousNoise) * 0.5;
        previousNoise = nextNoise;
        samples[i] = (kind === "hat" ? bright : 0.68 * bright + 0.32 * Math.sin(2 * Math.PI * (preset === "dabke" ? 212 : 168) * t)) *
          Math.exp(-t * (kind === "hat" ? 48 : 24)) * edge;
      }
      if (kind === "bass") samples[i] = (Math.sin(wave) + 0.16 * Math.sin(wave * 2)) * Math.exp(-t * 2.5) * edge;
      if (kind === "pad") samples[i] = (0.63 * Math.sin(wave) + 0.26 * Math.sin(wave * 1.006) + 0.11 * Math.sin(wave * 2)) * edge;
      if (kind === "pluck") {
        const overtone = preset === "dabke" ? 3 : 2;
        samples[i] = (0.63 * Math.sin(wave) + 0.23 * Math.sin(wave * overtone) + 0.14 * Math.sin(wave * 4.01)) *
          Math.exp(-t * (preset === "still" ? 3.8 : 8)) * edge;
      }
    }
    buffers.set(id, buffer);
    return buffer;
  }

  function play(kind: Sound, midi: number, time: number, volume: number, pan = 0) {
    if (time >= seconds || volume <= 0) return;
    const sound = context.createBufferSource();
    sound.buffer = soundBuffer(kind, midi);
    const level = context.createGain();
    level.gain.value = volume;
    sound.connect(level);
    if (pan) {
      const position = context.createStereoPanner();
      position.pan.value = pan;
      level.connect(position).connect(master);
    } else level.connect(master);
    sound.start(time);
  }

  for (const { kind, midi, time, volume, pan } of instrumentalEvents(settings)) {
    if (!stem || stemFor[kind] === stem) play(kind, midi, time, volume, pan);
  }
  const audio = await context.startRendering();
  return wavAudio(audio.getChannelData(0), audio.getChannelData(1), sampleRate);
}
