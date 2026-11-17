/** Local Web Audio only: no network, provider keys or generated voices. */
export type EchoPreset = "off" | "soft" | "medium" | "long";
export type ReplayMode = "once" | "loop";
export type CaptureKind = "phrase" | "performance";
export const phraseLimit = 60;
export const performanceLimit = 8 * 60;
export function echoTaps(preset: EchoPreset) {
  const settings = { off: [0, 0, 0], soft: [0.32, 0.3, 3], medium: [0.45, 0.4, 5], long: [0.6, 0.45, 8] }[preset];
  return Array.from({ length: settings[2] }, (_, i) => ({
    delay: settings[0] * (i + 1), gain: settings[1] * 0.55 ** i,
  }));
}
export function repeatPeriod(length: number, rate: number, gap: number) {
  return length + Math.round(Math.max(0, Math.min(3, gap)) * rate);
}
export function preparePhrase(samples: Float32Array, rate: number, gap = 0) {
  const output = new Float32Array(repeatPeriod(samples.length, rate, gap));
  const fade = Math.min(Math.round(rate * 0.005), Math.floor(samples.length / 2));
  for (let i = 0; i < samples.length; i++) {
    const gain = fade ? Math.min(1, i / fade, (samples.length - 1 - i) / fade) : 1;
    output[i] = samples[i] * gain;
  }
  return output;
}
export const captureMime = () => ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"]
  .find(type => MediaRecorder.isTypeSupported(type));

export class MantraAudio {
  private context?: AudioContext;
  private stream?: MediaStream;
  private mic?: MediaStreamAudioSourceNode;
  private recordBus?: GainNode;
  private monitorBus?: GainNode;
  private micMonitor?: GainNode;
  private repeats?: GainNode;
  private destination?: MediaStreamAudioDestinationNode;
  private wet: AudioNode[] = [];
  private replay?: AudioBufferSourceNode;
  private phrase?: AudioBuffer;
  private capture?: { recorder: MediaRecorder; done: Promise<Blob>; kind: CaptureKind; timer: ReturnType<typeof setTimeout> };
  private disposed = false;
  private opening = 0;
  private echo: EchoPreset = "off";
  private monitoring = false;
  private volume = 0.5;
  onReplayEnded?: () => void;
  onInterrupt?: (message: string) => void;
  onLimit?: () => void;

  private async ready() {
    if (this.disposed) throw new Error("This recording session has closed. Reopen the recorder.");
    if (!this.context) {
      const context = this.context = new AudioContext();
      this.recordBus = context.createGain();
      this.monitorBus = context.createGain();
      this.micMonitor = context.createGain();
      this.micMonitor.gain.value = 0;
      this.micMonitor.connect(this.monitorBus);
      this.repeats = context.createGain();
      this.repeats.gain.value = this.volume;
      this.repeats.connect(this.recordBus);
      this.repeats.connect(this.monitorBus);
      this.destination = context.createMediaStreamDestination();
      const connectLimited = (source: AudioNode, output: AudioNode) => {
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -8; compressor.ratio.value = 20;
        compressor.attack.value = 0.003; compressor.release.value = 0.15;
        const limiter = context.createWaveShaper();
        limiter.curve = Float32Array.from({ length: 4097 }, (_, i) => Math.tanh((i / 2048 - 1) * 1.4) * 0.95);
        source.connect(compressor).connect(limiter).connect(output);
      };
      connectLimited(this.recordBus, this.destination);
      connectLimited(this.monitorBus, context.destination);
      context.onstatechange = () => {
        if (context.state === "suspended" && this.capture)
          this.onInterrupt?.("Browser audio was suspended. The captured portion is being kept. Keep Studio open while recording.");
      };
    }
    await this.context.resume();
    if (this.context.state !== "running") throw new Error("Audio is paused by the browser. Press Resume audio, then try again.");
    return this.context;
  }
  async resume() { await this.ready(); }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(0.8, value));
    if (this.repeats && this.context) this.repeats.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.015);
  }
  setMonitoring(value: boolean) {
    this.monitoring = value;
    if (this.micMonitor) this.micMonitor.gain.value = value ? 0.65 : 0;
  }
  setEcho(value: EchoPreset) { this.echo = value; this.connectEcho(); }
  private clearEcho() {
    this.wet.forEach((node,index) => {
      try { if(index%2===0)this.mic?.disconnect(node); node.disconnect(); } catch { /* Already released. */ }
    });
    this.wet = [];
  }
  private connectEcho() {
    this.clearEcho();
    if (!this.context || !this.mic) return;
    for (const tap of echoTaps(this.echo)) {
      const delay = this.context.createDelay(5);
      const gain = this.context.createGain();
      delay.delayTime.value = tap.delay; gain.gain.value = tap.gain;
      this.mic.connect(delay).connect(gain);
      gain.connect(this.recordBus!); gain.connect(this.monitorBus!);
      this.wet.push(delay, gain);
    }
    // Finite delay taps, deliberately no cyclic feedback connection.
  }
  private async microphone(device: string) {
    const context = await this.ready();
    if (this.stream?.active) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone capture is unavailable. Use a current browser over HTTPS.");
    const attempt = ++this.opening;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: {
      ...(device ? { deviceId: { exact: device } } : {}),
      channelCount: 1, echoCancellation: true, noiseSuppression: false, autoGainControl: false,
    } });
    if (this.disposed || attempt !== this.opening) {
      stream.getTracks().forEach(track => track.stop());
      throw new Error("Microphone opening was cancelled.");
    }
    this.stream = stream;
    this.mic = context.createMediaStreamSource(stream);
    const dry = context.createGain(); dry.gain.value = 0.65;
    this.mic.connect(dry).connect(this.recordBus!);
    this.mic.connect(this.micMonitor!);
    this.setMonitoring(this.monitoring);
    this.connectEcho();
    stream.getAudioTracks().forEach(track => track.addEventListener("ended", () => {
      if (!this.disposed) this.onInterrupt?.("The microphone disconnected. The captured portion is being kept.");
    }, { once: true }));
  }
  async startCapture(kind: CaptureKind, device: string) {
    if (this.capture) throw new Error("Finish the current capture first.");
    if (typeof MediaRecorder === "undefined") throw new Error("This browser cannot record audio. Try a current Chrome, Firefox or Safari.");
    if (kind === "phrase") this.stopReplay();
    await this.microphone(device);
    const recorder = new MediaRecorder(kind === "phrase" ? this.stream! : this.destination!.stream, captureMime() ? { mimeType: captureMime() } : undefined);
    const parts: Blob[] = [];
    const done = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(parts, { type: recorder.mimeType || parts[0]?.type || "audio/webm" });
        if (blob.size) resolve(blob); else reject(new Error("No audio was captured. Check your microphone and try a short phrase."));
      };
      recorder.onerror = () => {
        this.onInterrupt?.("The browser reported a recording error. Any captured audio is being kept.");
      };
    });
    // Attach a rejection handler immediately, even if the browser fails before Stop.
    void done.catch(() => {});
    recorder.start(250);
    const timer = setTimeout(() => this.onLimit?.(), (kind === "phrase" ? phraseLimit : performanceLimit) * 1000);
    this.capture = { recorder, done, kind, timer };
  }
  async finishCapture() {
    const capture = this.capture;
    if (!capture) return;
    clearTimeout(capture.timer);
    if (capture.recorder.state !== "inactive") capture.recorder.stop();
    try { return { kind: capture.kind, blob: await capture.done }; }
    finally { if (this.capture === capture) this.capture = undefined; this.closeMicrophone(); }
  }
  private closeMicrophone() {
    ++this.opening;
    this.clearEcho();
    this.mic?.disconnect(); this.mic = undefined;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = undefined;
  }
  async loadPhrase(blob: Blob) {
    const context = await this.ready();
    const phrase = await context.decodeAudioData(await blob.arrayBuffer());
    if (!phrase.length || phrase.duration > phraseLimit + 0.5) throw new Error("Choose a phrase up to one minute long.");
    this.phrase = phrase;
  }
  async play(mode: ReplayMode, gap: number) {
    const context = await this.ready();
    if (!this.phrase) throw new Error("Capture or restore a phrase first.");
    this.stopReplay();
    const length = mode === "loop" ? repeatPeriod(this.phrase.length, this.phrase.sampleRate, gap) : this.phrase.length;
    const buffer = context.createBuffer(this.phrase.numberOfChannels, length, this.phrase.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) buffer.copyToChannel(preparePhrase(this.phrase.getChannelData(c), buffer.sampleRate, mode === "loop" ? gap : 0), c);
    const source = this.replay = context.createBufferSource();
    source.buffer = buffer; source.loop = mode === "loop";
    source.connect(this.repeats!);
    source.onended = () => { source.disconnect(); if (this.replay === source) { this.replay = undefined; this.onReplayEnded?.(); } };
    source.start(context.currentTime + 0.02 + (mode === "once" ? Math.max(0, Math.min(3, gap)) : 0));
  }
  stopReplay() {
    const source = this.replay; this.replay = undefined;
    if (source) { try { source.stop(); source.disconnect(); } catch { /* Already ended. */ } }
    this.onReplayEnded?.();
  }
  silence() {
    ++this.opening;
    this.stopReplay(); this.clearEcho();
    if (this.micMonitor) this.micMonitor.gain.value = 0;
  }
  async stopAll() {
    this.silence();
    try { return await this.finishCapture(); }
    finally {
      this.closeMicrophone();
      if(!this.disposed&&this.context?.state==="running")await this.context.suspend();
    }
  }
  dispose() {
    this.disposed = true;
    this.onInterrupt = this.onLimit = this.onReplayEnded = undefined;
    void this.stopAll().finally(() => {
      this.destination?.stream.getTracks().forEach(track => track.stop());
      if (this.context?.state !== "closed") void this.context?.close();
    }).catch(() => {});
  }
}
