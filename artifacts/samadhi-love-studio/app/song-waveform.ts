/** A bounded streaming overview; fine edits must be auditioned rather than inferred from pixels. */
export async function songWaveformAnalysis(source: string | Blob, signal: AbortSignal, bins = 640) {
  if (!Number.isInteger(bins) || bins < 16 || bins > 2048) throw new Error("Choose a bounded waveform resolution.");
  const { Input, UrlSource, BlobSource, ALL_FORMATS, AudioBufferSink } = await import("mediabunny");
  const input = new Input({ source: typeof source === "string" ? new UrlSource(source, { maxCacheSize: 1024 * 1024, requestInit: { credentials: "same-origin" }, getRetryDelay: n => n < 2 ? .25 : null }) : new BlobSource(source), formats: ALL_FORMATS });
  const abort = () => input.dispose(); signal.addEventListener("abort", abort, { once: true });
  try {
    signal.throwIfAborted(); const track = await input.getPrimaryAudioTrack();
    if (!track || !await track.canDecode()) throw new Error("Waveform decoding is unavailable. Use the time controls and audio player instead.");
    const first = Math.max(0, await track.getFirstTimestamp()), seconds = await track.computeDuration() - first;
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 600.1) throw new Error("Waveform editing supports songs up to ten minutes.");
    const peaks = new Float32Array(bins);
    for await (const part of new AudioBufferSink(track).buffers(first, first + seconds)) {
      signal.throwIfAborted(); const audio = part.buffer, step = Math.max(1, Math.floor(audio.sampleRate / 8000));
      for (let c = 0; c < audio.numberOfChannels; c++) {
        const channel = audio.getChannelData(c);
        for (let i = 0; i < channel.length; i += step) {
          const time = part.timestamp - first + i / audio.sampleRate, bin = Math.floor(time / seconds * bins);
          if (bin >= 0 && bin < bins) { const value = Math.abs(channel[i]); if (!Number.isFinite(value)) throw new Error("The waveform contains unreadable samples. Use the original player to review the file."); peaks[bin] = Math.max(peaks[bin], Math.min(1, value)); }
        }
      }
    }
    signal.throwIfAborted(); return { duration: seconds, peaks: Array.from(peaks) };
  } finally { signal.removeEventListener("abort", abort); input.dispose(); }
}
export async function songWaveform(source: string | Blob, signal: AbortSignal, bins = 640) {
  return (await songWaveformAnalysis(source, signal, bins)).peaks;
}
export function waveformTime(clientX: number, left: number, width: number, seconds: number) {
  if (![clientX,left,width,seconds].every(Number.isFinite) || width <= 0 || seconds <= 0) return 0;
  return Math.max(0, Math.min(seconds, Math.round((clientX-left)/width*seconds*100)/100));
}
