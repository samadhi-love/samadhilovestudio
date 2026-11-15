import { exportFlac, exportWav, type ExportTask } from "./audio-export-pcm";
export type DownloadFormat = "wav24" | "wav16" | "mp3" | "flac" | "m4a";
export const downloadFormats: { id: DownloadFormat; label: string; extension: string }[] = [
  { id: "wav24", label: "WAV · 24-bit", extension: "wav" }, { id: "wav16", label: "WAV · 16-bit", extension: "wav" }, { id: "mp3", label: "MP3 · 320 kbps", extension: "mp3" }, { id: "flac", label: "FLAC · lossless 24-bit", extension: "flac" }, { id: "m4a", label: "AAC / M4A · device dependent", extension: "m4a" },
];
let mp3Ready: Promise<void> | undefined;
export async function canExportAac() {
  const media = await import("mediabunny");
  return media.canEncodeAudio("aac", { bitrate: 256000, numberOfChannels: 2, sampleRate: 44100 });
}
export async function decodeForDownload(blob: Blob, task: ExportTask = {}) {
  const { Input, BlobSource, ALL_FORMATS } = await import("mediabunny");
  if (blob.size > 96 * 1024 * 1024) throw new Error("Use an original file up to 96 MB for browser conversion.");
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryAudioTrack(); if (!track) throw new Error("This file has no readable audio track.");
    const [rate, channels, duration] = await Promise.all([track.getSampleRate(), track.getNumberOfChannels(), track.computeDuration()]);
    if (![1, 2].includes(channels) || !Number.isFinite(duration) || duration <= 0 || duration > 600 || rate * channels * duration * 4 > 256 * 1024 * 1024) throw new Error("Browser conversion supports mono or stereo audio up to 10 minutes, within the memory limit. Your original remains downloadable.");
    if (task.signal?.aborted) throw new DOMException("Export cancelled.", "AbortError");
    const context = new OfflineAudioContext(channels, 1, rate);
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    if (task.signal?.aborted) throw new DOMException("Export cancelled.", "AbortError");
    return audio;
  } finally { input.dispose(); }
}
let converting = false;
export async function convertAudio(blob: Blob, format: DownloadFormat, task: ExportTask = {}) {
  if (!downloadFormats.some(f => f.id === format)) throw new Error("Choose a supported audio download format.");
  return runAudioJob(() => convertAudioUnlocked(blob, format, task));
}
async function runAudioJob<T>(run: () => Promise<T>): Promise<T> {
  if (converting) throw new Error("Another audio conversion or check is running. Wait for it to finish or cancel it first.");
  converting = true;
  try { return await run(); } finally { converting = false; }
}
export async function analyzeAudioDownload(blob: Blob, task: ExportTask = {}) {
  return runAudioJob(async () => {
    const audio = await decodeForDownload(blob, task);
    const { checkAudioReadiness } = await import("./audio-readiness");
    return checkAudioReadiness(audio, task);
  });
}
async function convertAudioUnlocked(blob: Blob, format: DownloadFormat, task: ExportTask) {
  const audio = await decodeForDownload(blob, task);
  if (format === "wav24" || format === "wav16") return exportWav(audio, format === "wav24" ? 24 : 16, task);
  if (format === "flac") return exportFlac(audio, 24, task);
  const media = await import("mediabunny");
  const codec = format === "mp3" ? "mp3" : "aac", bitrate = codec === "mp3" ? 320000 : 256000;
  if (codec === "mp3" && !await media.canEncodeAudio("mp3")) {
    mp3Ready ??= import("@mediabunny/mp3-encoder").then(m => { m.registerMp3Encoder(); }); await mp3Ready;
  }
  if (!await media.canEncodeAudio(codec, { bitrate, sampleRate: audio.sampleRate, numberOfChannels: audio.numberOfChannels })) throw new Error(`This browser cannot encode ${codec === "aac" ? "AAC/M4A" : "MP3"} at the source settings. Choose WAV or FLAC instead.`);
  const output = new media.Output({ format: codec === "mp3" ? new media.Mp3OutputFormat() : new media.Mp4OutputFormat(), target: new media.BufferTarget() });
  const source = new media.AudioBufferSource({ codec, bitrate }); output.addAudioTrack(source);
  const abort = () => { void output.cancel().catch(() => {}); };
  task.signal?.addEventListener("abort", abort, { once: true });
  try {
    if (task.signal?.aborted) throw new DOMException("Export cancelled.", "AbortError");
    await output.start(); await source.add(audio); source.close(); await output.finalize();
    if (task.signal?.aborted) throw new DOMException("Export cancelled.", "AbortError");
    if (!output.target.buffer?.byteLength) throw new Error("The encoder returned an empty file.");
    task.progress?.(1); return new Blob([output.target.buffer], { type: codec === "mp3" ? "audio/mpeg" : "audio/mp4" });
  } catch (error) { await output.cancel().catch(() => {}); if (task.signal?.aborted) throw new DOMException("Export cancelled.", "AbortError"); throw error; }
  finally { task.signal?.removeEventListener("abort", abort); }
}

export async function trimAudioOpeningDownload(blob: Blob, task: ExportTask = {}) {
  return runAudioJob(async()=>{
    const audio=await decodeForDownload(blob,task);
    const {prepareOpeningTrim}=await import("./audio-opening-trim");
    return prepareOpeningTrim(audio,task);
  });
}
