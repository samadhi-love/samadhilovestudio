import { audibleMixTracks, timelineLength, validTimeline } from "./av-timeline-data";
import { connectMixSource, mixRoomImpulse, type MixTrack } from "./multitrack-audio";

/** One Web Audio clock schedules every stem. Canvas reads this same clock. */
export class AVTransport {
  private context?: AudioContext;
  private bus?: GainNode;
  private nodes: AudioBufferSourceNode[] = [];
  private generation = 0;
  private offset = 0;
  private began = 0;
  private length = 0;
  private running = false;
  private disposed = false;
  constructor(private factory = () => new AudioContext()) {}
  get playing() { return this.running; }
  get time() { return this.running && this.context ? Math.min(this.length, this.offset + Math.max(0, this.context.currentTime - this.began)) : this.offset; }
  pause() {
    this.offset = this.time; this.running = false; this.generation++;
    for (const source of this.nodes) { try { source.stop(); } catch {} source.disconnect(); }
    this.nodes = []; this.bus?.disconnect(); this.bus = undefined;
    return this.offset;
  }
  async play(tracks: MixTrack[], from = this.offset) {
    if (this.disposed) throw new Error("Reopen the timeline to start playback.");
    this.pause();
    if (!validTimeline(tracks)) throw new Error("Check track placement and trims before playing.");
    const audible = audibleMixTracks(tracks);
    if (!audible.length) throw new Error("Unmute at least one track to play.");
    this.length = timelineLength(tracks);
    this.offset = Math.max(0, Math.min(from, this.length));
    if (this.offset >= this.length) this.offset = 0;
    const token = this.generation;
    const context = this.context ??= this.factory();
    await context.resume();
    if (token !== this.generation || this.disposed) return;
    const bus = this.bus = context.createGain();
    // Conservative preview headroom; WAV/video rendering retains the existing peak normalization.
    bus.gain.value = 1 / Math.max(1, audible.reduce((sum, t) => sum + t.level, 0)); bus.connect(context.destination);
    const room = audible.some(t => t.reverb) ? mixRoomImpulse(context) : null;
    this.began = context.currentTime + .035;
    try {
      for (const track of audible) {
        const until = track.at + track.end - track.start;
        if (until <= this.offset) continue;
        const source = connectMixSource(context, track, bus, room);
        this.nodes.push(source);
        const elapsed = Math.max(0, this.offset - track.at);
        source.start(this.began + Math.max(0, track.at - this.offset), track.start + elapsed, track.end - track.start - elapsed);
      }
      this.running = true;
    } catch (error) { this.pause(); throw error; }
  }
  seek(time: number) { this.pause(); this.offset = Math.max(0, Math.min(this.length, time)); }
  async close() { this.pause(); this.disposed = true; await this.context?.close(); this.context = undefined; }
}
