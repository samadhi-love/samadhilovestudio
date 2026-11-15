import { validMeditationBlend, type MeditationBlend } from "./meditative-data";
/** A live oscillator bed avoids buffering a ten-minute stereo file in browser memory. */
export class MeditationTransport {
  private context: AudioContext | null = null;
  private sources: OscillatorNode[] = [];
  private started = 0;
  private duration = 0;
  private generation = 0;
  get elapsed() { return this.context ? Math.max(0, Math.min(this.duration, this.context.currentTime - this.started)) : 0; }
  async start(blend: MeditationBlend, seconds: number) {
    if (!validMeditationBlend(blend) || !Number.isFinite(seconds) || seconds < 5 || seconds > 600) throw new Error("Choose a valid meditation session.");
    const request = ++this.generation;
    await this.release();
    if (request !== this.generation) throw new DOMException("Session stopped.", "AbortError");
    if (typeof AudioContext === "undefined") throw new Error("Live audio is unavailable in this browser. The written guide remains available.");
    const context = new AudioContext(); this.context = context; this.duration = seconds;
    const merger = context.createChannelMerger(2), master = context.createGain();
    const gain = blend.volume / Math.max(1, blend.layers.reduce((n, l) => n + l.level, 0));
    const at = context.currentTime; this.started = at;
    master.gain.setValueAtTime(0, at); master.gain.linearRampToValueAtTime(gain, at + 1); master.gain.setValueAtTime(gain, at + seconds - 3); master.gain.linearRampToValueAtTime(0, at + seconds);
    merger.connect(master); master.connect(context.destination);
    const oscillator = (hz: number) => { const o = context.createOscillator(); o.type = "sine"; o.frequency.value = hz; this.sources.push(o); return o; };
    for (const layer of blend.layers) {
      const left = oscillator(layer.hz), level = context.createGain();
      level.gain.value = layer.level; left.connect(level); level.connect(merger, 0, 0);
      if (layer.mode === "binaural") {
        const right = oscillator(layer.hz + layer.beat), rightLevel = context.createGain(); rightLevel.gain.value = layer.level; right.connect(rightLevel); rightLevel.connect(merger, 0, 1);
      } else {
        level.connect(merger, 0, 1);
        if (layer.mode === "pulse") {
          level.gain.value = layer.level / 2; const pulse = oscillator(layer.beat), depth = context.createGain(); depth.gain.value = layer.level / 2; pulse.connect(depth); depth.connect(level.gain);
        }
      }
    }
    for (const source of this.sources) { source.start(at); source.stop(at + seconds); }
    try { await context.resume(); }
    catch { await this.close(); throw new Error("Audio could not start. Press Start again or try another browser."); }
    if (this.context !== context) throw new DOMException("Session stopped.", "AbortError");
  }
  async pause() { if (this.context?.state === "running") await this.context.suspend(); }
  async resume() { if (this.context?.state === "suspended") await this.context.resume(); }
  async close() { this.generation++; await this.release(); }
  private async release() {
    const context = this.context; this.context = null;
    for (const source of this.sources) { try { source.stop(); source.disconnect(); } catch {} }
    this.sources = [];
    if (context && context.state !== "closed") await context.close().catch(() => {});
  }
}
