import { meditationSample, validMeditationBlend, type MeditationBlend } from "./meditative-data";
export const meditationSampleRate = 44100;
/** Bounded, cooperative PCM rendering with conservative headroom and click-free ends. */
export async function renderMeditation(blend: MeditationBlend, options: { seconds?: number; signal?: AbortSignal; progress?: (value: number) => void } = {}) {
  if (!validMeditationBlend(blend)) throw new Error("Check the blend's frequencies, duration and levels.");
  const seconds = options.seconds ?? blend.seconds;
  if (!Number.isFinite(seconds) || seconds < 1 || seconds > blend.seconds) throw new Error("Choose a valid render length.");
  const frames = Math.round(seconds * meditationSampleRate), bytes = new ArrayBuffer(44 + frames * 4), view = new DataView(bytes);
  const text = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, bytes.byteLength - 8, true); text(8, "WAVE"); text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, meditationSampleRate, true); view.setUint32(28, meditationSampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, frames * 4, true);
  const gain = blend.volume / Math.max(1, blend.layers.reduce((sum, l) => sum + l.level, 0));
  const fade = Math.min(2, seconds / 4);
  for (let start = 0; start < frames; start += 8192) {
    if (options.signal?.aborted) throw new DOMException("Render cancelled.", "AbortError");
    for (let frame = start; frame < Math.min(start + 8192, frames); frame++) {
      const t = frame / meditationSampleRate;
      const edge = Math.min(1, t / fade, (frames - 1 - frame) / meditationSampleRate / fade);
      const envelope = .5 - .5 * Math.cos(Math.PI * Math.max(0, edge));
      let left = 0, right = 0;
      for (const layer of blend.layers) { const [l, r] = meditationSample(layer, t); left += l * layer.level; right += r * layer.level; }
      view.setInt16(44 + frame * 4, Math.round(left * gain * envelope * 32767), true);
      view.setInt16(46 + frame * 4, Math.round(right * gain * envelope * 32767), true);
    }
    options.progress?.(Math.min(1, (start + 8192) / frames));
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return new Blob([bytes], { type: "audio/wav" });
}
