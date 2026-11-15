import { sampleRate } from "../recording-dsp";
import { dry, type Effects } from "./session";

export const vocalPresets: { name: string; settings: Partial<Effects> }[] = [
  { name: "Natural Studio Vocal", settings: { lowCut: 80, compression: 30, noise: 20, deEss: 22, reverb: 8, limiter: 18 } },
  { name: "Warm R&B Vocal", settings: { lowCut: 70, warmth: 4, compression: 43, deEss: 30, saturation: 18, reverb: 17, delay: 9 } },
  { name: "Smooth Pop Vocal", settings: { lowCut: 95, presence: 3, compression: 58, deEss: 35, double: 13, reverb: 13 } },
  { name: "Clean Hip-Hop Vocal", settings: { lowCut: 90, presence: 2, compression: 65, noise: 38, gate: -52, limiter: 50 } },
  { name: "Deep Cinematic Narrator", settings: { lowCut: 60, warmth: 5, presence: -2, compression: 53, saturation: 15, reverb: 15 } },
  { name: "Airy Female Vocal", settings: { lowCut: 110, presence: 5, compression: 33, deEss: 45, reverb: 20, width: 118 } },
  { name: "Powerful Lead Vocal", settings: { lowCut: 90, warmth: 2, presence: 3, compression: 65, saturation: 24, limiter: 60 } },
  { name: "Soft Whisper Vocal", settings: { lowCut: 125, warmth: 2, compression: 68, noise: 20, deEss: 48, breath: 22, reverb: 13 } },
  { name: "Podcast Broadcast Voice", settings: { lowCut: 85, warmth: 2, compression: 58, noise: 55, deEss: 32, breath: 35, limiter: 45 } },
  { name: "Atmospheric Vocal", settings: { lowCut: 120, reverb: 48, delay: 28, delayMs: 390, chorus: 28, width: 145 } },
  { name: "Duet Vocal Blend", settings: { lowCut: 75, compression: 40, deEss: 24, reverb: 16, double: 12, width: 122 } },
  { name: "Harmonized Choir", settings: { lowCut: 105, compression: 38, chorus: 46, double: 48, reverb: 34, width: 150 } },
];

export function cleanVocal(samples: Float32Array, e: Effects) {
  if (!e.noise && !e.deEss && e.gate === -90 && !e.breath) return samples;
  const result = new Float32Array(samples.length);
  const gate = 10 ** (e.gate / 20);
  const noise = e.noise / 100;
  const breath = e.breath / 100;
  const deEss = e.deEss / 100;
  const band = 1 - Math.exp(-2 * Math.PI * 4600 / sampleRate);
  let envelope = 0, highEnvelope = 0, gain = 1, low = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    low += (x - low) * band;
    const high = x - low;
    const amp = Math.abs(x);
    envelope += (amp - envelope) * (amp > envelope ? 0.012 : 0.0005);
    highEnvelope += (Math.abs(high) - highEnvelope) * 0.009;
    const expand = 1 - noise * Math.max(0, 1 - envelope / (0.008 + noise * 0.027)) * 0.96;
    const gateGain = e.gate === -90 ? 1 : Math.max(0.035, Math.min(1, (envelope / gate) ** 3));
    const airy = Math.max(0, Math.min(1, (highEnvelope / Math.max(envelope, 0.001) - 0.22) * 2.2));
    const breathing = 1 - breath * airy * Math.max(0, 1 - envelope / 0.12) * 0.75;
    const sibilance = deEss * Math.min(0.86, Math.max(0, highEnvelope - 0.012) * 15);
    const target = expand * gateGain * breathing;
    gain += (target - gain) * (target > gain ? 0.012 : 0.001);
    result[i] = (x - high * sibilance) * gain;
  }
  return result;
}

function filter(context: BaseAudioContext, from: AudioNode, type: BiquadFilterType, frequency: number, gain: number) {
  const node = context.createBiquadFilter();
  node.type = type; node.frequency.value = frequency; node.Q.value = 0.707; node.gain.value = gain;
  from.connect(node);
  return node;
}

export function compressor(context: BaseAudioContext, input: AudioNode, amount: number, limiting = false) {
  if (!amount) return input;
  const node = context.createDynamicsCompressor();
  node.threshold.value = limiting ? -2 - amount * 0.06 : -10 - amount * 0.28;
  node.ratio.value = limiting ? 18 : 1 + amount * 0.085;
  node.knee.value = limiting ? 0 : 12;
  node.attack.value = limiting ? 0.001 : 0.008;
  node.release.value = limiting ? 0.06 : 0.15;
  input.connect(node);
  return node;
}

export function roomImpulse(context: BaseAudioContext) {
  const length = Math.round(sampleRate * 1.2);
  const impulse = context.createBuffer(2, length, sampleRate);
  let seed = 1931;
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[i] = (seed / 2147483648 - 1) * (1 - i / length) ** 3;
    }
  }
  return impulse;
}

function width(context: BaseAudioContext, input: AudioNode, value: number) {
  if (value === 100) return input;
  const split = context.createChannelSplitter(2);
  const merged = context.createChannelMerger(2);
  const stereo = context.createGain();
  stereo.channelCount = 2; stereo.channelCountMode = "explicit";
  input.connect(stereo).connect(split);
  const side = value / 100;
  for (let i = 0; i < 2; i++) {
    const same = context.createGain(); same.gain.value = (1 + side) / 2;
    const cross = context.createGain(); cross.gain.value = (1 - side) / 2;
    split.connect(same, i).connect(merged, 0, i);
    split.connect(cross, 1 - i).connect(merged, 0, i);
  }
  return merged;
}

export function rack(context: OfflineAudioContext, input: AudioNode, settings: Effects, impulse: AudioBuffer | null) {
  const e = settings;
  let drySignal = input;
  if (e.lowCut) drySignal = filter(context, drySignal, "highpass", e.lowCut, 0);
  if (e.warmth) drySignal = filter(context, drySignal, "lowshelf", 240, e.warmth);
  if (e.presence) drySignal = filter(context, drySignal, "highshelf", 3500, e.presence);
  drySignal = compressor(context, drySignal, e.compression);
  if (e.saturation) {
    const node = context.createWaveShaper();
    const drive = 1 + e.saturation * 0.045;
    node.curve = Float32Array.from({ length: 2048 }, (_, i) => {
      const x = i / 1023.5 - 1;
      return x + (Math.tanh(x * drive) / Math.tanh(drive) - x) * e.saturation / 100;
    });
    node.oversample = "2x";
    drySignal.connect(node); drySignal = node;
  }
  const mixed = context.createGain();
  drySignal.connect(mixed);
  if (e.reverb && impulse) {
    const convolution = context.createConvolver();
    convolution.buffer = impulse;
    const wet = context.createGain(); wet.gain.value = e.reverb / 100;
    drySignal.connect(convolution).connect(wet).connect(mixed);
  }
  function delay(seconds: number, amount: number, pan: number, modulated = false) {
    const delay = context.createDelay(0.8); delay.delayTime.value = seconds;
    const wet = context.createGain(); wet.gain.value = amount;
    const place = context.createStereoPanner(); place.pan.value = pan;
    drySignal.connect(delay).connect(wet).connect(place).connect(mixed);
    if (modulated) {
      const oscillator = context.createOscillator();
      const depth = context.createGain(); depth.gain.value = 0.0036;
      oscillator.frequency.value = 0.63;
      oscillator.connect(depth).connect(delay.delayTime); oscillator.start();
    }
  }
  if (e.delay) {
    delay(e.delayMs / 1000, e.delay / 135, 0.18);
    if (e.delayMs <= 400) delay(e.delayMs / 500, e.delay / 300, -0.23);
  }
  if (e.chorus) delay(0.019, e.chorus / 180, -0.5, true);
  if (e.double) { delay(0.027, e.double / 200, -0.68); delay(0.039, e.double / 215, 0.68); }
  return compressor(context, width(context, mixed, e.width), e.limiter, true);
}

export function hasRack(settings: Effects) {
  return Object.keys(dry).some(key => dry[key as keyof Effects] !== settings[key as keyof Effects]);
}
