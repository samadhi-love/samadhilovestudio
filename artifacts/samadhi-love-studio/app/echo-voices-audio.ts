/**
 * Echo & Voices: live voice effects in the browser (Web Audio only — no
 * network, no AI, no credits). Echo that fades away, a caught phrase that comes
 * back as a chorus, one voice becoming many, a stadium, and a voice changer.
 * Every repeat is a finite tap (no feedback loops), and everything passes a
 * limiter before the speakers or the recording.
 */
export type EchoLength = "off" | "short" | "medium" | "long" | "cosmos";
export type ChorusSize = 0 | 3 | 6 | 12;
export type Space = "none" | "arena" | "stadium";
export type VoiceShape = "natural" | "deeper" | "brighter" | "robot" | "radio";
export type FxSettings = { echo: EchoLength; echoSpeed: number; chorus: ChorusSize; space: Space; voice: VoiceShape };
export const defaultFx: FxSettings = { echo: "off", echoSpeed: 0.35, chorus: 0, space: "none", voice: "natural" };
export const phraseLimitSeconds = 30;
export const takeLimitSeconds = 10 * 60;

const echoCounts: Record<Exclude<EchoLength, "off">, { taps: number; first: number }> = {
  short: { taps: 4, first: 0.5 }, medium: { taps: 8, first: 0.55 }, long: { taps: 14, first: 0.6 }, cosmos: { taps: 24, first: 0.62 },
};
/** Repeats that fade evenly until they disappear (the last is about -48 dB), each darker and swinging left/right. */
export function echoPlan(length: EchoLength, speed: number) {
  if (length === "off") return [];
  const { taps, first } = echoCounts[length], step = Math.max(0.08, Math.min(1, speed));
  const ratio = (0.004 / first) ** (1 / Math.max(1, taps - 1));
  return Array.from({ length: taps }, (_, i) => ({
    delay: step * (i + 1), gain: first * ratio ** i, tone: Math.max(1400, 9000 * 0.86 ** i), pan: (i % 2 ? 0.55 : -0.55) * Math.min(1, 0.4 + i * 0.1),
  }));
}
/** One voice becomes many: each copy slightly later, slightly detuned by a slow wobble, spread across the stereo field. */
export function chorusVoices(size: number, spread = 1) {
  return Array.from({ length: size }, (_, i) => {
    const at = size === 1 ? 0 : i / (size - 1);
    return {
      delay: (0.014 + ((i * 7) % 11) * 0.0035) * spread, depth: (0.0012 + (i % 4) * 0.0007) * spread, rate: 0.13 + ((i * 5) % 9) * 0.09,
      pan: (at * 2 - 1) * 0.9, gain: 0.85 / Math.sqrt(size),
    };
  });
}
/** The crowd in an arena or stadium: many of your voices, later and looser, all around. */
export const crowdSize: Record<Space, number> = { none: 0, arena: 8, stadium: 16 };
export const spaceSeconds: Record<Space, number> = { none: 0, arena: 2.6, stadium: 5.2 };
/** A synthetic hall: decaying stereo noise (seeded, so every session sounds the same). */
export function hallImpulse(rate: number, seconds: number, seed = 7) {
  const length = Math.max(1, Math.round(rate * seconds)), left = new Float32Array(length), right = new Float32Array(length);
  let s = seed >>> 0;
  const random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 31 - 1; };
  const preDelay = Math.round(rate * Math.min(0.08, seconds * 0.02));
  for (let i = preDelay; i < length; i++) {
    const t = (i - preDelay) / (length - preDelay), env = (1 - t) ** 3.2;
    left[i] = random() * env; right[i] = random() * env;
  }
  return [left, right] as const;
}
/** Pitch ratio for the voice changer; deliberately no high, child-like setting. */
export const voiceShapes: Record<VoiceShape, { label: string; semitones: number }> = {
  natural: { label: "Natural", semitones: 0 }, deeper: { label: "Deeper", semitones: -4 }, brighter: { label: "Brighter", semitones: 2 },
  robot: { label: "Robot", semitones: 0 }, radio: { label: "Radio", semitones: 0 },
};
/** Ramp depth for the two-tap pitch shifter: delay sweeps by this much each period. */
export function shiftDepth(semitones: number, period: number) {
  const ratio = 2 ** (semitones / 12);
  return { depth: Math.abs(ratio - 1) * period, up: ratio > 1 };
}
export const takeMime = () => typeof MediaRecorder === "undefined" ? undefined : ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find(t => MediaRecorder.isTypeSupported(t));

type Nodes = AudioNode[];
const stop = (nodes: Nodes) => nodes.forEach(n => { try { if ("stop" in n && typeof (n as AudioScheduledSourceNode).stop === "function") (n as AudioScheduledSourceNode).stop(); } catch { /* not started */ } try { n.disconnect(); } catch { /* released */ } });

export class EchoVoicesAudio {
  private context?: AudioContext;
  private stream?: MediaStream;
  private mic?: MediaStreamAudioSourceNode;
  private voiceIn?: GainNode; private fxIn?: GainNode; private mix?: GainNode; private monitor?: GainNode;
  private record?: MediaStreamAudioDestinationNode; private phraseOut?: MediaStreamAudioDestinationNode;
  private voiceNodes: Nodes = []; private fxNodes: Nodes = [];
  private settings: FxSettings = defaultFx;
  private phrase?: AudioBuffer; private replay?: AudioBufferSourceNode;
  private capture?: { recorder: MediaRecorder; done: Promise<Blob>; kind: "phrase" | "take"; timer: ReturnType<typeof setTimeout> };
  private disposed = false;
  private hearing = false;
  /** Lets tests and the meter see the level of what's being made. */
  analyser?: AnalyserNode;
  onReplayEnded?: () => void; onLimit?: () => void; onInterrupt?: (message: string) => void;

  private async ready() {
    if (this.disposed) throw new Error("This session has closed. Open Echo & Voices again.");
    if (!this.context) {
      const c = this.context = new AudioContext();
      this.voiceIn = c.createGain(); this.fxIn = c.createGain(); this.mix = c.createGain();
      this.monitor = c.createGain(); this.monitor.gain.value = this.hearing ? 1 : 0;
      this.record = c.createMediaStreamDestination(); this.phraseOut = c.createMediaStreamDestination();
      this.analyser = c.createAnalyser(); this.analyser.fftSize = 2048;
      // Limit once, then feed speakers (only when "hear it live") and the recording.
      const squeeze = c.createDynamicsCompressor(); squeeze.threshold.value = -10; squeeze.ratio.value = 16; squeeze.attack.value = 0.003; squeeze.release.value = 0.2;
      const clip = c.createWaveShaper(); clip.curve = Float32Array.from({ length: 4097 }, (_, i) => Math.tanh((i / 2048 - 1) * 1.3) * 0.95);
      this.mix.connect(squeeze).connect(clip);
      clip.connect(this.record); clip.connect(this.analyser); clip.connect(this.monitor).connect(c.destination);
      this.rebuildVoice(); this.rebuildFx();
    }
    await this.context.resume();
    if (this.context.state !== "running") throw new Error("Audio is paused by the browser. Tap Start again.");
    return this.context;
  }
  /** Speakers only with headphones on; the recording is made either way. */
  setHearing(on: boolean) { this.hearing = on; if (this.monitor && this.context) this.monitor.gain.setTargetAtTime(on ? 1 : 0, this.context.currentTime, 0.02); }
  setFx(next: FxSettings) {
    const voiceChanged = next.voice !== this.settings.voice;
    this.settings = next;
    if (!this.context) return;
    if (voiceChanged) this.rebuildVoice();
    this.rebuildFx();
  }
  get live() { return !!this.stream?.active; }

  /** Microphone → voice changer → effects. */
  async start() {
    const c = await this.ready();
    if (this.stream?.active) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser can't use a microphone here. Try a current Chrome, Safari or Firefox.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: false, autoGainControl: false } });
    if (this.disposed) { stream.getTracks().forEach(t => t.stop()); throw new Error("This session has closed."); }
    this.stream = stream; this.mic = c.createMediaStreamSource(stream); this.mic.connect(this.voiceIn!);
    stream.getAudioTracks().forEach(t => t.addEventListener("ended", () => { if (!this.disposed) this.onInterrupt?.("The microphone disconnected. Anything recorded so far is kept."); }, { once: true }));
  }
  /** Voice changer between the microphone and the effects. */
  private rebuildVoice() {
    const c = this.context!, input = this.voiceIn!, out = this.fxIn!;
    try { input.disconnect(); } catch { /* fresh */ }
    stop(this.voiceNodes); this.voiceNodes = [];
    const keep = (...n: AudioNode[]) => { this.voiceNodes.push(...n); return n[0]; };
    const shape = this.settings.voice, semitones = voiceShapes[shape].semitones;
    let tail: AudioNode = input;
    if (semitones) tail = this.pitchShift(tail, semitones);
    if (shape === "deeper") { const f = keep(c.createBiquadFilter()) as BiquadFilterNode; f.type = "lowshelf"; f.frequency.value = 220; f.gain.value = 4; tail.connect(f); tail = f; }
    if (shape === "brighter") { const f = keep(c.createBiquadFilter()) as BiquadFilterNode; f.type = "highshelf"; f.frequency.value = 3200; f.gain.value = 5; tail.connect(f); tail = f; }
    if (shape === "robot") {
      const ring = keep(c.createGain()) as GainNode, carrier = keep(c.createOscillator()) as OscillatorNode;
      ring.gain.value = 0; carrier.frequency.value = 55; carrier.connect(ring.gain); carrier.start();
      const body = keep(c.createDelay(0.05)) as DelayNode, back = keep(c.createGain()) as GainNode;
      body.delayTime.value = 0.008; back.gain.value = 0.45;
      tail.connect(ring); ring.connect(body).connect(back); const sum = keep(c.createGain()) as GainNode; ring.connect(sum); back.connect(sum); tail = sum;
    }
    if (shape === "radio") {
      const lo = keep(c.createBiquadFilter()) as BiquadFilterNode, hi = keep(c.createBiquadFilter()) as BiquadFilterNode, drive = keep(c.createWaveShaper()) as WaveShaperNode, trim = keep(c.createGain()) as GainNode;
      lo.type = "highpass"; lo.frequency.value = 450; hi.type = "lowpass"; hi.frequency.value = 3200;
      drive.curve = Float32Array.from({ length: 2049 }, (_, i) => Math.tanh((i / 1024 - 1) * 4)); trim.gain.value = 0.7;
      tail.connect(lo).connect(hi).connect(drive).connect(trim); tail = trim;
    }
    tail.connect(out);
    tail.connect(this.phraseOut!);
  }
  /** Two crossfaded delay taps swept by a ramp: a classic, glitch-free live pitch shift. */
  private pitchShift(input: AudioNode, semitones: number) {
    const c = this.context!, period = 0.1, rate = c.sampleRate, length = Math.round(period * rate);
    const { depth, up } = shiftDepth(semitones, period);
    const ramp = c.createBuffer(1, length, rate), fade = c.createBuffer(1, length, rate);
    const r = ramp.getChannelData(0), f = fade.getChannelData(0);
    for (let i = 0; i < length; i++) { const t = i / length; r[i] = up ? 1 - t : t; f[i] = Math.sin(Math.PI * t) ** 2; }
    const out = c.createGain(), start = c.currentTime + 0.02;
    for (const offset of [0, period / 2]) {
      const delay = c.createDelay(1), mod = c.createBufferSource(), amount = c.createGain(), win = c.createBufferSource(), level = c.createGain();
      delay.delayTime.value = 0.004; amount.gain.value = depth; level.gain.value = 0;
      mod.buffer = ramp; mod.loop = true; win.buffer = fade; win.loop = true;
      mod.connect(amount).connect(delay.delayTime); win.connect(level.gain);
      input.connect(delay).connect(level).connect(out);
      mod.start(start, offset); win.start(start, offset);
      this.voiceNodes.push(delay, mod, amount, win, level);
    }
    this.voiceNodes.push(out);
    return out;
  }
  /** Dry voice, echo taps, chorus voices and the arena/stadium, all from the same input (live voice and repeats). */
  private rebuildFx() {
    const c = this.context!, input = this.fxIn!, mix = this.mix!;
    try { input.disconnect(); } catch { /* fresh */ }
    stop(this.fxNodes); this.fxNodes = [];
    const keep = <T extends AudioNode>(n: T) => { this.fxNodes.push(n); return n; };
    const { echo, echoSpeed, chorus, space } = this.settings;
    const dry = keep(c.createGain()); dry.gain.value = chorus ? 0.55 : 0.85; input.connect(dry).connect(mix);
    const voices = (size: number, spread: number, into: AudioNode) => {
      for (const v of chorusVoices(size, spread)) {
        const d = keep(c.createDelay(1)), lfo = keep(c.createOscillator()), wobble = keep(c.createGain()), pan = keep(c.createStereoPanner()), g = keep(c.createGain());
        d.delayTime.value = v.delay; lfo.frequency.value = v.rate; wobble.gain.value = v.depth; pan.pan.value = v.pan; g.gain.value = v.gain;
        lfo.connect(wobble).connect(d.delayTime); lfo.start();
        input.connect(d).connect(pan).connect(g).connect(into);
      }
    };
    if (chorus) voices(chorus, 1, mix);
    for (const tap of echoPlan(echo, echoSpeed)) {
      const d = keep(c.createDelay(25)), tone = keep(c.createBiquadFilter()), pan = keep(c.createStereoPanner()), g = keep(c.createGain());
      d.delayTime.value = tap.delay; tone.type = "lowpass"; tone.frequency.value = tap.tone; pan.pan.value = tap.pan; g.gain.value = tap.gain;
      input.connect(d).connect(tone).connect(pan).connect(g).connect(mix);
    }
    if (space !== "none") {
      const crowd = keep(c.createGain()); crowd.gain.value = 0.9;
      voices(crowdSize[space], space === "stadium" ? 4.5 : 3, crowd);
      const hall = keep(c.createConvolver()), [left, right] = hallImpulse(c.sampleRate, spaceSeconds[space]);
      const buffer = c.createBuffer(2, left.length, c.sampleRate); buffer.copyToChannel(left, 0); buffer.copyToChannel(right, 1); hall.buffer = buffer;
      const wet = keep(c.createGain()); wet.gain.value = space === "stadium" ? 0.5 : 0.38;
      input.connect(hall); crowd.connect(hall); crowd.connect(mix); hall.connect(wet).connect(mix);
    }
  }
  private begin(kind: "phrase" | "take") {
    if (this.capture) throw new Error("Finish the current recording first.");
    if (typeof MediaRecorder === "undefined") throw new Error("This browser can't record audio. Try a current Chrome, Safari or Firefox.");
    const stream = kind === "phrase" ? this.phraseOut!.stream : this.record!.stream, mime = takeMime();
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined), parts: Blob[] = [];
    const done = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
      recorder.onstop = () => { const b = new Blob(parts, { type: recorder.mimeType || "audio/webm" }); if (b.size) resolve(b); else reject(new Error("Nothing was captured. Check your microphone and try again.")); };
    });
    void done.catch(() => {});
    recorder.start(250);
    const timer = setTimeout(() => this.onLimit?.(), (kind === "phrase" ? phraseLimitSeconds : takeLimitSeconds) * 1000);
    this.capture = { recorder, done, kind, timer };
  }
  private async end() {
    const capture = this.capture; if (!capture) return undefined;
    clearTimeout(capture.timer); if (capture.recorder.state !== "inactive") capture.recorder.stop();
    try { return await capture.done; } finally { if (this.capture === capture) this.capture = undefined; }
  }
  get recording() { return this.capture?.kind; }
  /** Catch a line (with the voice changer, before the effects) for Repeat chorus. */
  async catchPhrase() { await this.start(); this.stopReplay(); this.begin("phrase"); }
  async keepPhrase() {
    const blob = await this.end(); if (!blob) return 0;
    const buffer = await this.context!.decodeAudioData(await blob.arrayBuffer());
    this.phrase = buffer; return buffer.duration;
  }
  /** The caught line comes back through the effects: once (call and response) or looping like a mantra. */
  async repeat(loop: boolean, gap: number) {
    const c = await this.ready(); if (!this.phrase) throw new Error("Catch a line first.");
    this.stopReplay(false);
    const pause = Math.round(Math.max(0, Math.min(3, gap)) * this.phrase.sampleRate), length = this.phrase.length + (loop ? pause : 0);
    const buffer = c.createBuffer(this.phrase.numberOfChannels, length, this.phrase.sampleRate), edge = Math.min(Math.round(this.phrase.sampleRate * 0.006), this.phrase.length >> 1);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const from = this.phrase.getChannelData(ch), to = buffer.getChannelData(ch);
      for (let i = 0; i < from.length; i++) to[i] = from[i] * (edge ? Math.min(1, i / edge, (from.length - 1 - i) / edge) : 1);
    }
    const source = this.replay = c.createBufferSource(); source.buffer = buffer; source.loop = loop;
    source.connect(this.fxIn!);
    source.onended = () => { try { source.disconnect(); } catch { /* released */ } if (this.replay === source) { this.replay = undefined; this.onReplayEnded?.(); } };
    source.start(c.currentTime + 0.03 + (loop ? 0 : gap));
  }
  stopReplay(announce = true) {
    const s = this.replay; this.replay = undefined;
    if (s) { try { s.stop(); s.disconnect(); } catch { /* ended */ } }
    if (announce) this.onReplayEnded?.();
  }
  get hasPhrase() { return !!this.phrase; }
  /** Record everything you hear: your voice, the repeats and all effects. */
  async startTake() { await this.start(); this.begin("take"); }
  async finishTake() { return this.end(); }
  /** Release the microphone (the effects and caught line stay ready). */
  async stopMicrophone() {
    this.mic?.disconnect(); this.mic = undefined;
    this.stream?.getTracks().forEach(t => t.stop()); this.stream = undefined;
  }
  /** The current output level, 0–1, for the meter. */
  level() {
    if (!this.analyser) return 0;
    const data = new Float32Array(this.analyser.fftSize); this.analyser.getFloatTimeDomainData(data);
    let sum = 0; for (const x of data) sum += x * x;
    return Math.min(1, Math.sqrt(sum / data.length) * 4);
  }
  dispose() {
    this.disposed = true; this.onInterrupt = this.onLimit = this.onReplayEnded = undefined;
    this.stopReplay(false);
    void this.end().catch(() => {}).finally(() => {
      void this.stopMicrophone();
      stop(this.voiceNodes); stop(this.fxNodes);
      if (this.context && this.context.state !== "closed") void this.context.close();
    });
  }
}
