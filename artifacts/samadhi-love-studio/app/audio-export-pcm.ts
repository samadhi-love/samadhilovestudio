export type PCMSource = { sampleRate: number; length: number; numberOfChannels: number; getChannelData: (channel: number) => Float32Array };
export type ExportTask = { signal?: AbortSignal; progress?: (fraction: number) => void };
export function pcmInteger(sample: number, bits: 16 | 24) {
  if (!Number.isFinite(sample)) return 0;
  const maximum = 2 ** (bits - 1);
  return Math.max(-maximum, Math.min(maximum - 1, Math.round(sample * maximum)));
}
function check(source: PCMSource) {
  if (![1, 2].includes(source.numberOfChannels) || !Number.isInteger(source.sampleRate) || source.sampleRate < 8000 || source.sampleRate > 192000 || !Number.isInteger(source.length) || source.length < 1 || source.length / source.sampleRate > 600 || source.length * source.numberOfChannels * 4 > 256 * 1024 * 1024) throw new Error("Convert a mono or stereo recording up to 10 minutes, within the browser memory limit.");
}
const cancelled = (task: ExportTask) => { if (task.signal?.aborted) throw new DOMException("Export cancelled.", "AbortError"); };
const yieldTask = () => new Promise(resolve => setTimeout(resolve, 0));
export async function exportWav(source: PCMSource, bits: 16 | 24 = 24, task: ExportTask = {}) {
  check(source); cancelled(task);
  const channels = Array.from({ length: source.numberOfChannels }, (_, c) => source.getChannelData(c));
  const stride = source.numberOfChannels * bits / 8, size = source.length * stride, buffer = new ArrayBuffer(44 + size + (size & 1)), view = new DataView(buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF"); view.setUint32(4, size + 36 + (size & 1), true); text(8, "WAVE"); text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, source.numberOfChannels, true); view.setUint32(24, source.sampleRate, true); view.setUint32(28, source.sampleRate * stride, true); view.setUint16(32, stride, true); view.setUint16(34, bits, true); text(36, "data"); view.setUint32(40, size, true);
  let offset = 44;
  for (let start = 0; start < source.length; start += 16384) {
    cancelled(task);
    for (let i = start; i < Math.min(source.length, start + 16384); i++) for (const channel of channels) {
      const n = pcmInteger(channel[i], bits); if (bits === 16) view.setInt16(offset, n, true);
      else { view.setUint8(offset, n & 255); view.setUint8(offset + 1, (n >> 8) & 255); view.setUint8(offset + 2, (n >> 16) & 255); } offset += bits / 8;
    }
    task.progress?.(Math.min(1, (start + 16384) / source.length)); await yieldTask();
  }
  return new Blob([buffer], { type: "audio/wav" });
}
function crc(bytes: Uint8Array, bits: 8 | 16) {
  let value = 0;
  for (const byte of bytes) { value ^= byte << (bits - 8); for (let i = 0; i < 8; i++) value = (value << 1) ^ ((value & (1 << (bits - 1))) ? (bits === 8 ? 0x07 : 0x8005) : 0); value &= (1 << bits) - 1; }
  return value;
}
function frameNumber(n: number) {
  if (n < 128) return [n];
  if (n < 2048) return [0xc0 | (n >> 6), 0x80 | (n & 63)];
  return [0xe0 | (n >> 12), 0x80 | ((n >> 6) & 63), 0x80 | (n & 63)];
}
/** Standard lossless FLAC verbatim frames. No proprietary encoder or device codec is required. */
export async function exportFlac(source: PCMSource, bits: 16 | 24 = 24, task: ExportTask = {}) {
  check(source); cancelled(task);
  const channels = Array.from({ length: source.numberOfChannels }, (_, c) => source.getChannelData(c));
  const header = new Uint8Array(42), stream = new DataView(header.buffer);
  header.set([102, 76, 97, 67, 128, 0, 0, 34]);
  const block = Math.min(4096, Math.max(16, source.length)); stream.setUint16(8, block); stream.setUint16(10, block);
  stream.setBigUint64(18, (BigInt(source.sampleRate) << BigInt(44)) | (BigInt(source.numberOfChannels - 1) << BigInt(41)) | (BigInt(bits - 1) << BigInt(36)) | BigInt(source.length));
  // Zero MD5 means unknown, as allowed by FLAC; frame CRCs still protect each frame.
  const parts: BlobPart[] = [header];
  for (let start = 0, index = 0; start < source.length; start += 4096, index++) {
    cancelled(task);
    const count = Math.min(4096, source.length - start);
    const bytes = [255, 248, 112, ((source.numberOfChannels - 1) << 4) | (bits === 24 ? 12 : 8), ...frameNumber(index), (count - 1) >> 8, (count - 1) & 255];
    bytes.push(crc(new Uint8Array(bytes), 8));
    const frame = new Uint8Array(bytes.length + source.numberOfChannels * (1 + count * bits / 8) + 2); frame.set(bytes); let offset = bytes.length;
    for (const channel of channels) { frame[offset++] = 2; for (let i = start; i < start + count; i++) { const n = pcmInteger(channel[i], bits); if (bits === 24) frame[offset++] = (n >> 16) & 255; frame[offset++] = (n >> 8) & 255; frame[offset++] = n & 255; } }
    const checksum = crc(frame.subarray(0, offset), 16); frame[offset++] = checksum >> 8; frame[offset] = checksum & 255; parts.push(frame);
    task.progress?.((start + count) / source.length); if (index % 4 === 0) await yieldTask();
  }
  return new Blob(parts, { type: "audio/flac" });
}
