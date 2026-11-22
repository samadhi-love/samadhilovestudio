import type { VideoFormat } from "./lyric-video-data";
import { exportShort } from "./short-export";
import {videoFrameSize} from "./video-format-options";
import {createVideoFile,assertVideoDuration,codecCompatibility,keepScreenAwake} from "./video-export-storage";

export const proVideoSize=videoFrameSize;
export type ProExportResult = {
  blob: Blob;
  extension: "mp4" | "webm";
  codec: string;
  engine: string;
};
type ProExportOptions = {
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
    checkpoint?: {read:(index:number)=>Promise<Blob|undefined>;write:(index:number,blob:Blob)=>Promise<void>};
};

/** Keeps the screen on for the whole export so a phone doesn't lock and stop it. */
export async function exportProVideo(
  options: ProExportOptions,
  progress: (fraction: number) => void,
): Promise<ProExportResult> {
  const releaseScreen = await keepScreenAwake();
  try {
    return await renderProVideo(options, progress);
  } finally {
    releaseScreen();
  }
}

/** Lets the page breathe between frames. Unlike setTimeout, a message-channel hop is not
 * slowed to once a second (or once a minute) when the tab is in the background. */
function yieldToBrowser() {
  return new Promise<void>(resolve => {
    if (typeof MessageChannel === "undefined") { setTimeout(resolve, 0); return; }
    const channel = new MessageChannel();
    channel.port1.onmessage = () => { channel.port1.close(); resolve(); };
    channel.port2.postMessage(null);
  });
}

async function renderProVideo(
  options: ProExportOptions,
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
    // The real-time recorder plays the song live, so it needs the page on screen.
    if (document.visibilityState !== "visible")
      throw new Error("Keep this page visible while exporting.");
    if(options.requiresFrameEncoding)throw new Error(options.frameEncodingError??"Uploaded-video rendering needs H.264/AAC WebCodecs support. Use a current compatible browser and turn off real-time fallback, or remove the video background.");
    if (intro || outro)
      throw new Error(
        "This browser needs the real-time exporter. Set intro and outro to zero, or use a browser with H.264/AAC WebCodecs support.",
      );
    const localCancel = new AbortController();
    const recordingFile=await createVideoFile();
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
          sink:recordingFile,
        },
        progress,
      );
      const codec = codecCompatibility(await inspectVideo(blob,end-start));
      return {
        blob,
        extension: blob.type.includes("mp4") ? "mp4" : "webm",
        codec,
        engine: "Browser MediaRecorder · real time",
      };
    } catch (error) {
      await recordingFile.dispose();
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
  const file=await createVideoFile();
  const output = new media.Output({
    // Fast start: the file's index goes at the FRONT, so phones, email previews,
    // Google Drive and messaging apps can play it (not only show the first picture).
    format: new media.Mp4OutputFormat({ fastStart: "reserve" }),
    target: new media.StreamTarget(file.stream,{chunked:true,chunkSize:1024*1024}),
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
  const packetVideo=options.checkpoint?new media.EncodedVideoPacketSource("avc"):null;
  const total = intro + (end - start) + outro;
  // Reserved index space: one packet per video frame; AAC packs 1024 samples per packet. A third extra for safety.
  output.addVideoTrack(packetVideo??video, { frameRate: 30, maximumPacketCount: Math.ceil(total * 30 * 1.34) + 60 });
  output.addAudioTrack(sound, { maximumPacketCount: Math.ceil((total * audio.sampleRate / 1024) * 1.34) + 60 });
  const from = Math.round(start * audio.sampleRate),
    until = Math.min(audio.length, Math.round(end * audio.sampleRate));
  // Frame-by-frame encoding does not need the page on screen: switching apps,
  // tabs or covering the window only slows it down, it never stops it.
  const cancel = () => {
    void output.cancel().catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    signal.throwIfAborted();
    await output.start();
    // Keep the decoded source, but never duplicate the complete song. Encode
    // one second at a time, including only the needed intro/outro silence.
    const soundTask=(async()=>{
      const length=Math.ceil(total*audio.sampleRate),lead=Math.round(intro*audio.sampleRate);
      for(let offset=0;offset<length;offset+=audio.sampleRate){
        signal.throwIfAborted();
        const chunk=new AudioBuffer({numberOfChannels:Math.min(2,audio.numberOfChannels),sampleRate:audio.sampleRate,length:Math.min(audio.sampleRate,length-offset)});
        const first=Math.max(offset,lead),last=Math.min(offset+chunk.length,lead+until-from);
        if(last>first)for(let channel=0;channel<chunk.numberOfChannels;channel++)chunk.copyToChannel(audio.getChannelData(channel).subarray(from+first-lead,from+last-lead),channel,first-offset);
        await sound.add(chunk);
      }
      sound.close();
    })();
    void soundTask.catch(() => {});
    const frames = Math.ceil(total * 30);
    const checkVisible=()=>signal.throwIfAborted();
    if(options.checkpoint&&packetVideo){
      const segmentFrames=150;
      for(let first=0;first<frames;first+=segmentFrames){
        checkVisible();
        const index=first/segmentFrames;
        let blob=await options.checkpoint.read(index);
        if(!blob){
          const segment=new media.Output({format:new media.Mp4OutputFormat({fastStart:"in-memory"}),target:new media.BufferTarget()});
          const source=new media.CanvasSource(canvas,{codec:"avc",bitrate:resolution===1080?4_500_000:2_800_000,keyFrameInterval:2});
          segment.addVideoTrack(source,{frameRate:30});
          try{
            await segment.start();
            for(let frame=first;frame<Math.min(frames,first+segmentFrames);frame++){
              checkVisible();
              await options.paint(ctx,frame/30);
              checkVisible();
              await source.add((frame-first)/30,Math.min(1/30,total-frame/30));
              if(frame%6===0)await yieldToBrowser();
            }
            source.close();
            await segment.finalize();
            if(!segment.target.buffer?.byteLength)throw new Error("No video frames were encoded.");
            blob=new Blob([segment.target.buffer],{type:"video/mp4"});
            await options.checkpoint.write(index,blob);
          }catch(error){await segment.cancel().catch(()=>{});throw error;}
        }
        const input=new media.Input({source:new media.BlobSource(blob),formats:[media.MP4]});
        try{
          const track=await input.getPrimaryVideoTrack();
          const config=await track?.getDecoderConfig();
          if(!track||!config)throw new Error("A saved segment could not be read.");
          let firstPacket=true;
          for await(const packet of new media.EncodedPacketSink(track).packets()){
            checkVisible();
            await packetVideo.add(packet.clone({timestamp:packet.timestamp+first/30,sequenceNumber:-1}),firstPacket?{decoderConfig:config}:undefined);
            firstPacket=false;
          }
        }finally{input.dispose();}
        progress(Math.min(.95,.95*(first+segmentFrames)/frames));
      }
      packetVideo.close();
    }else for (let frame = 0; frame < frames; frame++) {
      checkVisible();
      await options.paint(ctx, frame / 30);
      signal.throwIfAborted();
      await video.add(frame / 30, Math.min(1 / 30, total - frame / 30));
      if (frame % 6 === 0) {
        progress((0.95 * frame) / frames);
        await yieldToBrowser();
      }
    }
    if(!packetVideo)video.close();
    await soundTask;
    signal.throwIfAborted();
    await output.finalize();
    const blob = await file.finish();
    const codec=await inspectVideo(blob,total);
    progress(1);
    return {
      blob,
      extension: "mp4",
      codec,
      engine: "WebCodecs · 30 fps · deterministic frame timing",
    };
  } catch (error) {
    await output.cancel().catch(() => {});
    await file.dispose();
    throw error;
  } finally {
    signal.removeEventListener("abort", cancel);
  }
}

/** Parse the finished container rather than inferring codecs from its extension. */
export async function inspectVideo(blob: Blob,expectedDuration?:number) {
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
    if(expectedDuration!==undefined){
      assertVideoDuration(duration,expectedDuration);
      // A full audio track must not hide a truncated video track (or vice versa).
      assertVideoDuration(await video.computeDuration(),expectedDuration);
      assertVideoDuration(await audio.computeDuration(),expectedDuration);
    }
    return `${(await video.getCodecParameterString()) ?? (await video.getCodec())} + ${(await audio.getCodecParameterString()) ?? (await audio.getCodec())}`;
  } finally {
    input.dispose();
  }
}
