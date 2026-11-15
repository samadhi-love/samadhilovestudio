import type { VideoFormat } from "./lyric-video-data";
import { exportShort } from "./short-export";
import {videoFrameSize} from "./video-format-options";

export const proVideoSize=videoFrameSize;
export type ProExportResult = {
  blob: Blob;
  extension: "mp4" | "webm";
  codec: string;
  engine: string;
};
export async function exportProVideo(
  options: {
    audio: AudioBuffer;
    audioUrl: string;
    start: number;
    end: number;
    intro: number;
    outro: number;
    format: VideoFormat;
    resolution: 1080 | 720;
    signal: AbortSignal;
    paint: (ctx: CanvasRenderingContext2D, time: number) => void | Promise<void>;
    requiresFrameEncoding?:boolean;
    frameEncodingError?:string;
    preferRecorder?: boolean;
  },
  progress: (fraction: number) => void,
): Promise<ProExportResult> {
  const { audio, start, end, intro, outro, format, resolution, signal } =
    options;
  if (
    start < 0 ||
    end <= start ||
    end > audio.duration + 0.01 ||
    end - start > 600
  )
    throw new Error(
      "Choose an excerpt inside the recording, up to ten minutes long.",
    );
  if (document.visibilityState !== "visible")
    throw new Error("Keep this page visible while exporting.");
  const media = await import("mediabunny"),
    size = proVideoSize(format, resolution);
  const [avc, aac] = await Promise.all([
    media.canEncodeVideo("avc", { ...size, frameRate: 30 }),
    media.canEncodeAudio("aac", {
      numberOfChannels: Math.min(2, audio.numberOfChannels),
      sampleRate: audio.sampleRate,
    }),
  ]);
  if (!avc || !aac || options.preferRecorder) {
    if(options.requiresFrameEncoding)throw new Error(options.frameEncodingError??"Uploaded-video rendering needs H.264/AAC WebCodecs support. Use a current compatible browser and turn off real-time fallback, or remove the video background.");
    if (intro || outro)
      throw new Error(
        "This browser needs the real-time exporter. Set intro and outro to zero, or use a browser with H.264/AAC WebCodecs support.",
      );
    const localCancel = new AbortController();
    let hidden = false;
    const visibility = () => {
      if (document.visibilityState !== "visible") {
        hidden = true;
        localCancel.abort();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    try {
      const blob = await exportShort(
        {
          audio: options.audioUrl,
          title: "",
          hook: "",
          start,
          length: end - start,
          signal: AbortSignal.any([signal, localCancel.signal]),
          frameSize: size,
          paint: (ctx, t) => options.paint(ctx, t - start),
        },
        progress,
      );
      const codec = await inspectVideo(blob);
      return {
        blob,
        extension: blob.type.includes("mp4") ? "mp4" : "webm",
        codec,
        engine: "Browser MediaRecorder · real time",
      };
    } catch (error) {
      if (hidden)
        throw new Error(
          "Export stopped because the page was hidden. The project is saved; retry with this page visible.",
        );
      throw error;
    } finally {
      document.removeEventListener("visibilitychange", visibility);
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("The video canvas could not open.");
  const output = new media.Output({
    format: new media.Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new media.BufferTarget(),
  });
  let videoCodec = "avc",
    audioCodec = "aac";
  const video = new media.CanvasSource(canvas, {
    codec: "avc",
    bitrate: resolution === 1080 ? 4_500_000 : 2_800_000,
    keyFrameInterval: 2,
    onEncoderConfig: (c) => {
      videoCodec = c.codec;
    },
  });
  const sound = new media.AudioBufferSource({
    codec: "aac",
    bitrate: 192_000,
    onEncoderConfig: (c) => {
      audioCodec = c.codec;
    },
  });
  output.addVideoTrack(video, { frameRate: 30 });
  output.addAudioTrack(sound);
  const total = intro + (end - start) + outro;
  const trimmed = new AudioBuffer({
    numberOfChannels: Math.min(2, audio.numberOfChannels),
    sampleRate: audio.sampleRate,
    length: Math.ceil(total * audio.sampleRate),
  });
  const from = Math.round(start * audio.sampleRate),
    until = Math.min(audio.length, Math.round(end * audio.sampleRate));
  for (let c = 0; c < trimmed.numberOfChannels; c++)
    trimmed.copyToChannel(
      audio.getChannelData(c).subarray(from, until),
      c,
      Math.round(intro * audio.sampleRate),
    );
  let hidden = false;
  const visibility = () => {
    if (document.visibilityState !== "visible") hidden = true;
  };
  document.addEventListener("visibilitychange", visibility);
  const cancel = () => {
    void output.cancel().catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    signal.throwIfAborted();
    await output.start();
    const soundTask = sound.add(trimmed).then(() => sound.close());
    void soundTask.catch(() => {});
    const frames = Math.ceil(total * 30);
    for (let frame = 0; frame < frames; frame++) {
      signal.throwIfAborted();
      if (hidden)
        throw new Error(
          "Export paused because the page was hidden. Your project is saved. Return here and retry with this page visible.",
        );
      await options.paint(ctx, frame / 30);
      signal.throwIfAborted();
      await video.add(frame / 30, Math.min(1 / 30, total - frame / 30));
      if (frame % 6 === 0) {
        progress((0.95 * frame) / frames);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
    video.close();
    await soundTask;
    signal.throwIfAborted();
    await output.finalize();
    if (!output.target.buffer?.byteLength)
      throw new Error("The encoder returned no video data.");
    const blob = new Blob([output.target.buffer], { type: "video/mp4" });
    progress(1);
    return {
      blob,
      extension: "mp4",
      codec: await inspectVideo(blob),
      engine: "WebCodecs · 30 fps · deterministic frame timing",
    };
  } catch (error) {
    await output.cancel().catch(() => {});
    throw error;
  } finally {
    document.removeEventListener("visibilitychange", visibility);
    signal.removeEventListener("abort", cancel);
  }
}

/** Parse the finished container rather than inferring codecs from its extension. */
export async function inspectVideo(blob: Blob) {
  const { Input, BlobSource, ALL_FORMATS } = await import("mediabunny");
  const input = new Input({
    source: new BlobSource(blob),
    formats: ALL_FORMATS,
  });
  try {
    const video = await input.getPrimaryVideoTrack(),
      audio = await input.getPrimaryAudioTrack();
    if (!video || !audio)
      throw new Error(
        "The encoded file is missing a video or audio track. Retry the export.",
      );
    const duration = await input.computeDuration();
    if (!Number.isFinite(duration) || duration <= 0)
      throw new Error("The encoded file has no playable duration.");
    return `${(await video.getCodecParameterString()) ?? (await video.getCodec())} + ${(await audio.getCodecParameterString()) ?? (await audio.getCodec())}`;
  } finally {
    input.dispose();
  }
}
