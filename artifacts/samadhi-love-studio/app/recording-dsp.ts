export const sampleRate = 44100;
export const maxTakeSeconds = 8 * 60;
export const noteNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
export type Scale = "chromatic" | "major" | "minor";

const intervals = {
  chromatic: noteNames.map((_, index) => index),
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export async function decodeTake(input: Blob) {
  const context = new AudioContext({ sampleRate });
  try {
    const decoded = await context.decodeAudioData(await input.arrayBuffer());
    if (!decoded.length || decoded.duration > maxTakeSeconds + 0.15)
      throw new Error("Choose an audio take up to 8 minutes long.");
    const mono = new Float32Array(decoded.length);
    for (let c = 0; c < decoded.numberOfChannels; c++) {
      const channel = decoded.getChannelData(c);
      for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / decoded.numberOfChannels;
    }
    return mono;
  } catch (error) {
    if (error instanceof DOMException)
      throw new Error("This browser could not decode the recording. Try MP3, WAV, or M4A.");
    throw error;
  } finally { void context.close(); }
}

export function wavAudio(samples: Float32Array, right?: Float32Array, rate = sampleRate) {
  const channels = right ? 2 : 1;
  const blockSize = channels * 2;
  const dataSize = samples.length * blockSize;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);
  const label = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  label(0, "RIFF"); view.setUint32(4, output.byteLength - 8, true); label(8, "WAVE");
  label(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channels, true); view.setUint32(24, rate, true); view.setUint32(28, rate * blockSize, true);
  view.setUint16(32, blockSize, true); view.setUint16(34, 16, true);
  label(36, "data"); view.setUint32(40, dataSize, true);
  const pcm = (value: number) => {
    const sample = Math.max(-1, Math.min(1, value));
    return sample * (sample < 0 ? 32768 : 32767);
  };
  for (let i = 0; i < samples.length; i++) {
    const offset = 44 + i * blockSize;
    view.setInt16(offset, pcm(samples[i]), true);
    if (right) view.setInt16(offset + 2, pcm(right[i]), true);
  }
  return new Blob([output], { type: "audio/wav" });
}

export function waveform(samples: Float32Array, count = 112) {
  return Array.from({ length: count }, (_, block) => {
    let peak = 0;
    const first = Math.floor(block * samples.length / count);
    const last = Math.floor((block + 1) * samples.length / count);
    for (let i = first; i < last; i++) peak = Math.max(peak, Math.abs(samples[i]));
    return peak;
  });
}

const hop = Math.round(sampleRate * 0.024);
const decimation = 5;
const minimumLag = 12;
const maximumLag = 140;
const windowSize = 232;

function pitchPeriod(samples: Float32Array, center: number, differences: Float32Array) {
  const start = Math.max(0, center - Math.floor(windowSize / 2));
  if (start + windowSize + maximumLag >= samples.length) return 0;
  let energy = 0;
  for (let i = 0; i < windowSize; i++) energy += samples[start + i] ** 2;
  if (energy / windowSize < 0.000025) return 0;

  let accumulated = 0;
  differences[0] = 1;
  for (let lag = 1; lag <= maximumLag; lag++) {
    let difference = 0;
    for (let i = 0; i < windowSize; i++) {
      const delta = samples[start + i] - samples[start + i + lag];
      difference += delta * delta;
    }
    accumulated += difference;
    differences[lag] = accumulated > 0 ? difference * lag / accumulated : 1;
  }
  let lag = minimumLag;
  while (lag < maximumLag && differences[lag] > 0.16) lag++;
  while (lag < maximumLag && differences[lag + 1] < differences[lag]) lag++;
  if (lag >= maximumLag || differences[lag] > 0.16) return 0;
  const a = differences[lag - 1], b = differences[lag], c = differences[lag + 1];
  const curve = a + c - 2 * b;
  return (lag + (curve > 0 ? (a - c) / (2 * curve) : 0)) * decimation;
}

function periodMidi(period: number) {
  return 69 + 12 * Math.log2((sampleRate / period) / 440);
}

function correctionRatio(period: number, key: number, scale: Scale, strength: number, shift: number, manual?: number) {
  const midi = periodMidi(period);
  if (manual !== undefined) return 2 ** (Math.max(-12, Math.min(12, manual - midi + shift)) / 12);
  const candidate = Math.round(midi);
  let target = candidate;
  let distance = Infinity;
  for (let note = candidate - 2; note <= candidate + 2; note++) {
    if (!intervals[scale].includes(((note - key) % 12 + 12) % 12)) continue;
    if (Math.abs(midi - note) < distance) { target = note; distance = Math.abs(midi - note); }
  }
  return 2 ** (((target - midi) * strength + shift) / 12);
}

const yieldFrame = () => new Promise<void>(resolve => setTimeout(resolve, 0));

async function analyzePeriods(samples: Float32Array, progress: (value: number) => void, signal?: AbortSignal) {
  const low = new Float32Array(Math.floor(samples.length / decimation));
  for (let i = 0; i < low.length; i++) {
    const offset = i * decimation;
    for (let j = 0; j < decimation; j++) low[i] += samples[offset + j] / decimation;
  }
  const frames = new Float32Array(Math.ceil(samples.length / hop));
  const differences = new Float32Array(maximumLag + 1);
  for (let i = 0; i < frames.length; i++) {
    if (i % 55 === 0) {
      signal?.throwIfAborted();
      progress(0.63 * i / frames.length);
      await yieldFrame();
    }
    frames[i] = pitchPeriod(low, Math.round((i + 0.5) * hop / decimation), differences);
  }
  return frames;
}

export async function detectVocalNotes(samples: Float32Array, signal?: AbortSignal) {
  const frames = await analyzePeriods(samples, () => {}, signal);
  const detected: { start: number; end: number; midi: number }[] = [];
  for (let i = 0; i < frames.length;) {
    if (!frames[i]) { i++; continue; }
    const start = i;
    const midi = Math.round(periodMidi(frames[i]));
    while (i < frames.length && frames[i] && Math.abs(periodMidi(frames[i]) - midi) <= 0.65) i++;
    if (i - start >= 3 && midi >= 28 && midi <= 100) {
      detected.push({ start: start * hop / sampleRate, end: Math.min(samples.length, i * hop) / sampleRate, midi });
    }
  }
  return detected;
}

type TuneOptions = { speed?: number; shift?: number; formant?: number; offset?: number; notes?: { start: number; end: number; midi: number }[] };

export async function tuneVoice(samples: Float32Array, key: number, scale: Scale, strength: number,
  progress: (value: number) => void, signal?: AbortSignal, options: TuneOptions = {}) {
  const { speed, shift = 0, formant = 0, offset = 0, notes = [] } = options;
  if (!strength && !shift && !formant && !notes.length) return { samples, voicedFrames: 0 };
  const frames = await analyzePeriods(samples, progress, signal);
  const voicedFrames = frames.reduce((count, frame) => count + Number(frame > 0), 0);
  const formantRatio = 2 ** (formant / 12);
  const responsiveness = speed === undefined ? 0.27 : 0.03 + 0.96 * (speed / 100) ** 1.6;
  if (!voicedFrames) return { samples, voicedFrames };

  const output = samples.slice();
  for (let frame = 0; frame < frames.length;) {
    signal?.throwIfAborted();
    if (!frames[frame]) { frame++; continue; }
    const first = frame;
    while (frame < frames.length && frames[frame]) frame++;
    const begin = first * hop;
    const end = Math.min(samples.length, frame * hop);
    if (frame - first < 2) continue;

    const periodAt = (sample: number) => frames[Math.max(first, Math.min(frame - 1, Math.floor(sample / hop)))];
    // Anchor the grains to similar points on successive pitch cycles.
    const marks: number[] = [];
    for (let guess = begin; guess < end;) {
      const period = periodAt(guess);
      const radius = Math.round(period * 0.23);
      let best = Math.min(end - 1, Math.round(guess));
      for (let i = Math.max(begin, best - radius); i < Math.min(end, guess + radius); i++) {
        if (samples[i] > samples[best]) best = i;
      }
      marks.push(best);
      guess = best + period;
    }
    const sum = new Float32Array(end - begin);
    const weight = new Float32Array(end - begin);
    let nearest = 0;
    let ratio = 1;
    for (let target = marks[0], cycle = 0; target < end; cycle++) {
      if (cycle % 200 === 0) {
        signal?.throwIfAborted();
        progress(0.63 + 0.37 * target / samples.length);
        await yieldFrame();
      }
      while (nearest + 1 < marks.length && Math.abs(marks[nearest + 1] - target) < Math.abs(marks[nearest] - target)) nearest++;
      const source = marks[nearest];
      const period = periodAt(source);
      const seconds = source / sampleRate + offset;
      const manual = notes.find(note => seconds >= note.start && seconds < note.end)?.midi;
      const desired = correctionRatio(period, key, scale, strength, shift, manual);
      ratio += (desired - ratio) * responsiveness;
      const radius = Math.round(period * 1.08 * (speed === undefined ? 1 : Math.max(1, 1 / ratio)));
      const center = Math.round(target);
      for (let delta = -radius; delta <= radius; delta++) {
        const at = center + delta - begin;
        const from = source + delta * formantRatio;
        const index = Math.floor(from);
        if (at < 0 || at >= sum.length || index < 0 || index >= samples.length) continue;
        const fraction = from - index;
        const value = samples[index] + ((samples[index + 1] ?? samples[index]) - samples[index]) * fraction;
        const window = (1 + Math.cos(Math.PI * delta / radius)) / 2;
        sum[at] += value * window;
        weight[at] += window;
      }
      target += period / ratio;
    }
    const edge = sampleRate * 0.028;
    for (let i = 0; i < sum.length; i++) {
      if (weight[i] < 0.05) continue;
      const blend = Math.min(1, i / edge, (sum.length - 1 - i) / edge);
      output[begin + i] += (sum[i] / weight[i] - output[begin + i]) * blend;
    }
  }
  progress(1);
  return { samples: output, voicedFrames };
}

export async function podcastCleanup(samples: Float32Array, speechGain: number, bed?: Float32Array, bedLevel = 0) {
  const offline = new OfflineAudioContext(1, samples.length, sampleRate);
  const buffer = offline.createBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  const highpass = offline.createBiquadFilter();
  highpass.type = "highpass"; highpass.frequency.value = 78; highpass.Q.value = 0.7;
  const compressor = offline.createDynamicsCompressor();
  compressor.threshold.value = -24; compressor.knee.value = 16; compressor.ratio.value = 3.3;
  compressor.attack.value = 0.008; compressor.release.value = 0.17;
  source.connect(highpass).connect(compressor).connect(offline.destination);
  source.start();
  const result = (await offline.startRendering()).getChannelData(0);
  let peak = 0;
  for (const value of result) peak = Math.max(peak, Math.abs(value));
  const level = Math.min(4, 0.79 / Math.max(peak, 0.1)) * 10 ** (speechGain / 20);
  const fade = sampleRate * 0.35;
  for (let i = 0; i < result.length; i++) {
    const background = bed && i < bed.length ? bed[i] * bedLevel * Math.min(1, i / fade, (result.length - i) / fade, (bed.length - i) / fade) : 0;
    result[i] = Math.max(-0.97, Math.min(0.97, result[i] * level + background));
  }
  return result;
}
