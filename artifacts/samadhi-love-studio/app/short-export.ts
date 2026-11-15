type ShortOptions = {
  audio?: string; video?: string; title: string; hook: string; start: number; length: number; signal: AbortSignal;
  frameSize?: { width: number; height: number };
  paint?: (context: CanvasRenderingContext2D, audioTime: number) => void;
};

const width = 720;
const height = 1280;
function drawLines(ctx: CanvasRenderingContext2D, text: string, y: number, spacing: number) {
  const width=ctx.canvas.width;
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? line + " " + word : word;
    if (line && ctx.measureText(next).width > width*.8) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  lines.slice(0, 4).forEach((item, i) => ctx.fillText(item, width / 2, y + (i - (Math.min(lines.length, 4) - 1) / 2) * spacing, width*.82));
}

export function drawShortFrame(ctx: CanvasRenderingContext2D, video: HTMLVideoElement | null, title: string, hook: string, elapsed: number) {
  const {width,height}=ctx.canvas,unit=Math.min(width,height)/720,wide=width>height;
  const sky = ctx.createRadialGradient(width*.67, height*.33, 20*unit, width*.55, height*.36, Math.max(width,height)*.7);
  sky.addColorStop(0, "#5e366e"); sky.addColorStop(0.54, "#21183f"); sky.addColorStop(1, "#0c0b18");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  if (video?.readyState && video.videoWidth) {
    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const w = video.videoWidth * scale, h = video.videoHeight * scale;
    ctx.drawImage(video, (width - w) / 2, (height - h) / 2, w, h);
    ctx.fillStyle = "#0c081c70"; ctx.fillRect(0, 0, width, height);
  } else {
    for (let index = 0; index < 115; index++) {
      ctx.fillStyle = index % 3 === 0 ? "#fbc3a68c" : "#ccbaff78";
      ctx.beginPath(); ctx.arc((index * 313.37) % width, (index * 173.63) % height, (index % 7 === 0 ? 1.8 : 0.75)*unit, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = "#e8bda976"; ctx.lineWidth = 2;
    for (let index = 0; index < 4; index++) {
      ctx.beginPath(); ctx.ellipse(width*.5, height*.38, (213 + index * 16)*unit, (78 + index * 19)*unit, -0.49 + elapsed / 120, 0, Math.PI * 2); ctx.stroke();
    }
    const glow = ctx.createRadialGradient(width*.49, height*.37, 6*unit, width*.5, height*.38, 137*unit);
    glow.addColorStop(0, "#f7bb9c"); glow.addColorStop(.44, "#9d597f"); glow.addColorStop(1, "#9d597f00");
    ctx.fillStyle = glow; ctx.fillRect(width*.5-144*unit,height*.38-140*unit,288*unit,280*unit);
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffc8a7"; ctx.font = `600 ${23*unit}px system-ui`; ctx.fillText("S A M A D H I   L O V E", width*.5, height*.16,width*.8);
  ctx.fillStyle = "#fff2ed"; ctx.font = `600 ${66*unit}px Georgia`; drawLines(ctx, title, height*(wide?.51:.59), 70*unit);
  ctx.fillStyle = "#f8ded7"; ctx.font = `${32*unit}px system-ui`; drawLines(ctx, hook, height*.765, 43*unit);
}

function waitFor(media: HTMLMediaElement, event: "loadedmetadata" | "seeked", signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      media.removeEventListener(event, done);
      media.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
    };
    const done = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("This browser could not read the media file.")); };
    const aborted = () => { cleanup(); reject(new DOMException("Export canceled", "AbortError")); };
    if (signal.aborted) return aborted();
    media.addEventListener(event, done, { once: true });
    media.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", aborted, { once: true });
  });
}

export async function exportShort({ audio, video, title, hook, start, length, signal, frameSize, paint }: ShortOptions, progress: (value: number) => void) {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream)
    throw new Error("Use a current version of Chrome or Edge to export your clip.");

  const canvas = document.createElement("canvas");
  canvas.width = frameSize?.width ?? width; canvas.height = frameSize?.height ?? height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not open the video canvas.");
  const visual = video ? document.createElement("video") : null;
  const source = audio ? document.createElement("audio") : visual;
  if (!source) throw new Error("Choose a recording or video.");
  const media = visual && visual !== source ? [source, visual] : [source];
  const context = new AudioContext();
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  let frame = 0;
  try {
    await context.resume();
    if (visual) {
      visual.playsInline = true;
      visual.muted = visual !== source;
      visual.loop = visual !== source;
    }
    for (const element of media) {
      const ready = waitFor(element, "loadedmetadata", signal);
      element.preload = "auto";
      element.src = element === visual ? video! : audio!;
      await ready;
    }
    if (!Number.isFinite(source.duration) || start >= source.duration)
      throw new Error("Choose a start time within the recording or video.");
    if (start > 0) {
      const seeked = waitFor(source, "seeked", signal);
      source.currentTime = start;
      await seeked;
    }
    const destination = context.createMediaStreamDestination();
    context.createMediaElementSource(source).connect(destination);
    if (paint) paint(ctx, start); else drawShortFrame(ctx, visual, title, hook, 0);
    stream = canvas.captureStream(30);
    for (const track of destination.stream.getAudioTracks()) stream.addTrack(track);
    const types = ["video/mp4;codecs=avc1.42001f,mp4a.40.2", "video/mp4", "video/webm;codecs=vp8,opus", "video/webm"];
    const mimeType = types.find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error("This browser has no supported video encoder.");
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_500_000 });
    const chunks: Blob[] = [];
    const capture = recorder;
    const finished = new Promise<Blob>((resolve, reject) => {
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      capture.onstop = () => resolve(new Blob(chunks, { type: capture.mimeType }));
      capture.onerror = () => reject(new Error("The browser could not encode this video."));
    });
    // Keep errors observed if playback fails before awaiting the recording.
    void finished.catch(() => {});
    const stop = () => { if (capture.state !== "inactive") capture.stop(); };
    const duration = Math.min(length, source.duration - start);
    const checkEnd = () => { if (source.ended || source.currentTime - start >= duration) stop(); };
    source.addEventListener("ended", stop, { once: true });
    source.addEventListener("timeupdate", checkEnd);
    signal.addEventListener("abort", stop, { once: true });
    try {
      if (signal.aborted) throw new DOMException("Export canceled", "AbortError");
      capture.start(300);
      await Promise.all(media.map(element => element.play()));
      const tick = () => {
        const elapsed = Math.max(0, source.currentTime - start);
        if (paint) paint(ctx, source.currentTime); else drawShortFrame(ctx, visual, title, hook, elapsed);
        progress(Math.min(1, elapsed / duration));
        if (elapsed >= duration || source.ended) stop();
        else frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      const blob = await finished;
      if (signal.aborted) throw new DOMException("Export canceled", "AbortError");
      if (!blob.size) throw new Error("No video data was captured.");
      progress(1);
      return blob;
    } finally {
      source.removeEventListener("ended", stop);
      source.removeEventListener("timeupdate", checkEnd);
      signal.removeEventListener("abort", stop);
    }
  } finally {
    cancelAnimationFrame(frame);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    for (const element of media) { element.pause(); element.removeAttribute("src"); element.load(); }
    void context.close();
  }
}
