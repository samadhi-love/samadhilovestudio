import { wavAudio, sampleRate } from "./recording-dsp";
import { cleanVocal } from "./vocal/effects";
import { dry } from "./vocal/session";
import type { ProSettings } from "./lyric-pro-data";

export async function decodeProjectAudio(
  source: string | Blob,
  signal?: AbortSignal,
): Promise<AudioBuffer> {
  const context = new AudioContext({ sampleRate });
  try {
    signal?.throwIfAborted();
    const blob =
      typeof source === "string"
        ? await fetch(source, { signal }).then((r) => {
            if (!r.ok)
              throw new Error("The original recording could not load.");
            return r.blob();
          })
        : source;
    const bytes = await blob.arrayBuffer();
    let audio: AudioBuffer;
    try {
      audio = await context.decodeAudioData(bytes.slice(0));
    } catch {
      const { Input, BlobSource, ALL_FORMATS, AudioBufferSink } =
        await import("mediabunny");
      const input = new Input({
        source: new BlobSource(blob),
        formats: ALL_FORMATS,
      });
      try {
        const track = await input.getPrimaryAudioTrack();
        if (!track) throw new Error("This file contains no audio track.");
        const duration = await track.computeDuration();
        if (!Number.isFinite(duration) || duration <= 0 || duration > 600.1)
          throw new Error("Choose an audio/video file up to ten minutes long.");
        const buffers: { buffer: AudioBuffer; timestamp: number }[] = [];
        for await (const part of new AudioBufferSink(track).buffers()) {
          signal?.throwIfAborted();
          buffers.push(part);
        }
        if (!buffers.length)
          throw new Error(
            "This browser could not decode the audio track. Try an MP3 or WAV recording.",
          );
        const rate = buffers[0].buffer.sampleRate;
        audio = new AudioBuffer({
          numberOfChannels: Math.min(2, buffers[0].buffer.numberOfChannels),
          sampleRate: rate,
          length: Math.ceil(duration * rate),
        });
        for (const part of buffers)
          for (let c = 0; c < audio.numberOfChannels; c++) {
            const offset = Math.max(0, Math.round(part.timestamp * rate));
            if (offset < audio.length)
              audio.copyToChannel(
                part.buffer
                  .getChannelData(Math.min(c, part.buffer.numberOfChannels - 1))
                  .subarray(0, audio.length - offset),
                c,
                offset,
              );
          }
      } finally {
        input.dispose();
      }
    }
    if (!audio.length || audio.duration > 600.1)
      throw new Error("Choose a recording up to ten minutes long.");
    signal?.throwIfAborted();
    return audio;
  } catch (error) {
    if (error instanceof DOMException && error.name !== "AbortError")
      throw new Error(
        "This browser could not decode the media. Try MP3, WAV, or an MP4 with AAC audio.",
      );
    throw error;
  } finally {
    void context.close();
  }
}
export function analyzeAudio(
  audio: AudioBuffer,
): Pick<ProSettings, "energy" | "waveform" | "accents"> {
  const input = audio.getChannelData(0),
    hop = Math.max(1, Math.round(audio.sampleRate / 20)),
    energy: number[] = [];
  let maximum = 0.02;
  for (let at = 0; at < input.length; at += hop) {
    let sum = 0;
    for (let i = at; i < Math.min(input.length, at + hop); i++)
      sum += input[i] * input[i];
    const rms = Math.sqrt(sum / Math.min(hop, input.length - at));
    energy.push(rms);
    maximum = Math.max(maximum, rms);
  }
  const normalized = energy.map(
      (e) => Math.round(Math.min(1, e / maximum) * 1000) / 1000,
    ),
    accents: number[] = [];
  for (let i = 2; i < normalized.length - 1; i++)
    if (
      normalized[i] > 0.25 &&
      normalized[i] > normalized[i - 1] * 1.3 &&
      normalized[i] >= normalized[i + 1] &&
      (accents.length === 0 || i / 20 - accents.at(-1)! > 0.28)
    )
      accents.push(i / 20);
  const waveform: number[] = [],
    step = Math.ceil(input.length / 1000);
  for (let at = 0; at < input.length; at += step) {
    let peak = 0;
    for (let i = at; i < Math.min(input.length, at + step); i += 4)
      peak = Math.max(peak, Math.abs(input[i]));
    waveform.push(Math.round(Math.min(1, peak) * 1000) / 1000);
  }
  return { energy: normalized, waveform, accents };
}
/** Causal sample-domain processing adds no lookahead, padding, or time stretch. */
export function clarifyChannel(
  input: Float32Array,
  rate: number,
  noise = false,
) {
  const samples =
    rate === sampleRate
      ? cleanVocal(input, { ...dry, noise: noise ? 12 : 0, deEss: 18 })
      : input;
  const out = new Float32Array(samples.length),
    hp = Math.exp((-2 * Math.PI * 65) / rate),
    lp = 1 - Math.exp((-2 * Math.PI * 2600) / rate);
  let previous = 0,
    highpass = 0,
    low = 0,
    envelope = 0,
    gain = 1;
  const attack = 1 - Math.exp(-1 / (rate * 0.008)),
    release = 1 - Math.exp(-1 / (rate * 0.12));
  for (let i = 0; i < samples.length; i++) {
    const raw = samples[i];
    highpass = hp * (highpass + raw - previous);
    previous = raw;
    low += (highpass - low) * lp;
    const x = highpass + (highpass - low) * 0.09,
      level = Math.abs(x);
    envelope += (level - envelope) * (level > envelope ? attack : release);
    const target = envelope > 0.2 ? Math.pow(0.2 / envelope, 0.5) : 1;
    gain += (target - gain) * (target < gain ? attack : release);
    out[i] = x * gain;
  }
  return out;
}
export async function improveClarity(
  audio: AudioBuffer,
  noise: boolean,
  signal?: AbortSignal,
) {
  const offline = new OfflineAudioContext(
    Math.min(2, audio.numberOfChannels),
    Math.ceil(audio.duration * sampleRate),
    sampleRate,
  );
  const source = offline.createBufferSource();
  source.buffer = audio;
  source.connect(offline.destination);
  source.start();
  const decoded = await offline.startRendering();
  signal?.throwIfAborted();
  const channels = Array.from({ length: decoded.numberOfChannels }, (_, c) =>
    clarifyChannel(decoded.getChannelData(c), sampleRate, noise),
  );
  let peak = 0.96;
  for (const ch of channels)
    for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i]));
  const scale = 0.96 / peak;
  for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= scale;
  const enhanced = new AudioBuffer({
    numberOfChannels: channels.length,
    length: channels[0].length,
    sampleRate,
  });
  channels.forEach((ch, c) => enhanced.copyToChannel(ch, c));
  const mono = new Float32Array(Math.ceil(enhanced.duration * 22050));
  // Analysis-only mono derivative; sample positions are calculated from the original time origin.
  for (let i = 0; i < mono.length; i++)
    for (const ch of channels)
      mono[i] += (ch[Math.min(ch.length - 1, i * 2)] ?? 0) / channels.length;
  return {
    audio: enhanced,
    soundtrack: wavAudio(channels[0], channels[1]),
    analysis: wavAudio(mono, undefined, 22050),
    delaySeconds: 0,
  };
}
export async function uploadLyricAsset(
  songId: string,
  kind: string,
  blob: Blob,
  signal?: AbortSignal,
  sourceAudioId?: string,
) {
  if(!blob.size)throw new Error("This file is empty. Choose or create media with content.");
  if(blob.size>120*1024*1024)throw new Error("Choose project media up to 120 MB.");
  if(["background","logo"].includes(kind)&&blob.size>15*1024*1024)throw new Error("Choose an image up to 15 MB.");
  const response = await fetch("/api/studio/lyric-assets", {
    method: "POST",
    signal,
    headers: {
      "X-Song-Id": songId,
      "X-Asset-Kind": kind,
      "X-Asset-Size": String(blob.size),
      "Content-Type": blob.type,
      ...(sourceAudioId ? { "X-Source-Audio-Id": sourceAudioId } : {}),
    },
    body: blob,
  });
  const result = (await response.json()) as { id?: string; error?: string };
  if (!response.ok || !result.id)
    throw new Error(result.error ?? "Project media could not save.");
  return result.id as string;
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
