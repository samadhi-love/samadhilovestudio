/** Limits decoded originals; rendering may require additional memory. */
export const maxDecodedSourceBytes = 512 * 1024 * 1024;
export function decodedBytes(buffer: Pick<AudioBuffer, "length" | "numberOfChannels">) {
  return buffer.length * buffer.numberOfChannels * 4;
}
export function assertAudioBudget(buffers: Iterable<Pick<AudioBuffer, "length" | "numberOfChannels">>, incoming?: Pick<AudioBuffer, "length" | "numberOfChannels">) {
  const total = [...buffers].reduce((sum, b) => sum + decodedBytes(b), incoming ? decodedBytes(incoming) : 0);
  if (total > maxDecodedSourceBytes) throw new Error("Decoded originals exceed this session's 512 MiB memory budget. Use shorter sources or split the work into sessions; originals are preserved.");
  return total;
}
export function recordedPlacement(duration: number, requestedAt: number, sessionSeconds: number) {
  const start = Math.max(0, -requestedAt), at = Math.max(0, requestedAt);
  const end = Math.min(duration, start + sessionSeconds - at);
  if (end - start < .05) throw new Error("Move the playhead earlier or reduce the recording offset.");
  return { start, at, end };
}
