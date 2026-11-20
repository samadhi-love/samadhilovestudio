"use client";
/**
 * "Yours" in the background picker: use your own photo, your own short video,
 * or take a photo / record a short clip with any camera connected to this
 * device (built-in, USB webcam, phone front or back camera).
 * Your pictures and clips stay private in your song's project.
 */
import { useEffect, useRef, useState } from "react";
import { Camera, CircleStop, Film, ImagePlus, RefreshCw, Video, X } from "lucide-react";

export type OwnBackground = {
  /** What of yours is on the video right now. */
  active: "photo" | "video" | null;
  /** Optional name of the file in use. */
  name?: string;
  photo: (file: File) => void | Promise<void>;
  video: (file: File) => void | Promise<void>;
  /** Stop using your own picture or clip (it stays saved). */
  clear?: () => void;
};

export const ownPhotoTypes = ["image/jpeg", "image/png", "image/webp"];
export const ownVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
export const maxClipSeconds = 15;

/** Picks a recording format this browser can make and the upload accepts. */
export function cameraClipType(supported: (type: string) => boolean = t => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
  for (const type of ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]) if (supported(type)) return type;
  return "";
}

/** Plain words for camera problems. */
export function cameraProblem(error: unknown) {
  const name = (error as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError") return "The camera is blocked. Allow the camera for this site (the camera icon in the address bar), then press Try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found. Connect a camera, then press Try again.";
  if (name === "NotReadableError" || name === "AbortError") return "Another app is using the camera. Close it, then press Try again.";
  return "The camera could not start. Press Try again, or upload a photo or video instead.";
}

export function OwnBackgroundPanel({ own, disabled }: { own: OwnBackground; disabled?: boolean }) {
  const [camera, setCamera] = useState(false);
  const [problem, setProblem] = useState("");
  const status = own.active === "photo" ? `Your photo is the background${own.name ? ` · ${own.name}` : ""}` : own.active === "video" ? `Your video is the background${own.name ? ` · ${own.name}` : ""}` : "Use your own photo or video, or take one with your camera.";
  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!ownPhotoTypes.includes(file.type) || file.size > 15 * 1024 * 1024) { setProblem("Choose a JPG, PNG or WebP photo up to 15 MB."); return; }
    setProblem(""); void own.photo(file);
  };
  const chooseVideo = (file?: File) => {
    if (!file) return;
    if (!ownVideoTypes.includes(file.type.split(";")[0]) || file.size > 120 * 1024 * 1024) { setProblem("Choose an MP4, WebM or MOV video up to 60 seconds and 120 MB."); return; }
    setProblem(""); void own.video(file);
  };
  return (
    <div className="own-bg" data-testid="own-background">
      <p className="own-bg-status" role="status" data-testid="own-bg-status">{status}
        {own.active && own.clear && <button type="button" className="qv-link" disabled={disabled} onClick={own.clear} data-testid="own-bg-clear"><X size={13} aria-hidden="true" /> Stop using it</button>}</p>
      <div className="own-bg-actions">
        <label className={`qv-card own-bg-card${disabled ? " is-disabled" : ""}`} data-testid="own-bg-photo">
          <ImagePlus size={26} aria-hidden="true" /><span className="qv-name">Upload a photo</span>
          <input type="file" className="own-bg-file" accept={ownPhotoTypes.join(",")} disabled={disabled} aria-label="Upload a photo for the background"
            onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; choosePhoto(file); }} />
        </label>
        <label className={`qv-card own-bg-card${disabled ? " is-disabled" : ""}`} data-testid="own-bg-video">
          <Film size={26} aria-hidden="true" /><span className="qv-name">Upload a video <small>· up to 60 s, loops</small></span>
          <input type="file" className="own-bg-file" accept={ownVideoTypes.join(",")} disabled={disabled} aria-label="Upload a short video for the background"
            onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; chooseVideo(file); }} />
        </label>
        <button type="button" className="qv-card own-bg-card" disabled={disabled} aria-pressed={camera} onClick={() => setCamera(on => !on)} data-testid="own-bg-camera">
          <Camera size={26} aria-hidden="true" /><span className="qv-name">Use my camera <small>· photo or {maxClipSeconds} s clip</small></span>
        </button>
      </div>
      {problem && <p className="notice" role="alert" data-testid="own-bg-problem">{problem}</p>}
      {camera && <CameraCapture disabled={disabled} close={() => setCamera(false)}
        photo={file => { setCamera(false); choosePhoto(file); }} video={file => { setCamera(false); chooseVideo(file); }} />}
      <p className="lvp-note">Your photos and clips stay private in this song. A video’s own sound is muted; your song is the soundtrack.</p>
    </div>
  );
}

/** Live camera view with a camera choice, Take photo and Record clip. */
export function CameraCapture(props: { disabled?: boolean; close: () => void; photo: (file: File) => void; video: (file: File) => void }) {
  const view = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [problem, setProblem] = useState("");
  const [ready, setReady] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const stop = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error("no camera api"), { name: "NotFoundError" });
        stop();
        const next = await navigator.mediaDevices.getUserMedia({ video: cameraId ? { deviceId: { exact: cameraId } } : { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (cancelled) { next.getTracks().forEach(t => t.stop()); return; }
        stream.current = next;
        if (view.current) { view.current.srcObject = next; await view.current.play().catch(() => undefined); }
        const all = (await navigator.mediaDevices.enumerateDevices?.()) ?? [];
        if (!cancelled) { setCameras(all.filter(d => d.kind === "videoinput")); setReady(true); }
      } catch (error) { if (!cancelled) setProblem(cameraProblem(error)); }
    })();
    return () => { cancelled = true; };
  }, [cameraId, attempt]);
  // Turn the camera light off when this closes.
  useEffect(() => () => { if (recorder.current?.state === "recording") recorder.current.stop(); stop(); }, []);
  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { recorder.current?.stop(); return; }
    const timer = setTimeout(() => setLeft(s => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const takePhoto = () => {
    const video = view.current;
    if (!video?.videoWidth) { setProblem("The camera is still starting. Try again in a moment."); return; }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) { setProblem("The photo could not be taken. Try again."); return; }
      stop(); props.photo(new File([blob], `camera-photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };
  const record = () => {
    if (!stream.current) return;
    const type = cameraClipType();
    if (!type) { setProblem("This browser cannot record video. Take a photo, or upload a video instead."); return; }
    const parts: Blob[] = [];
    const rec = new MediaRecorder(stream.current, { mimeType: type, videoBitsPerSecond: 6_000_000 });
    rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
    rec.onstop = () => {
      setLeft(null);
      const plain = type.split(";")[0];
      const blob = new Blob(parts, { type: plain });
      if (!blob.size) { setProblem("Nothing was recorded. Try again."); return; }
      stop(); props.video(new File([blob], `camera-clip-${Date.now()}.${plain === "video/mp4" ? "mp4" : "webm"}`, { type: plain }));
    };
    recorder.current = rec;
    rec.start(250);
    setLeft(maxClipSeconds);
  };
  const recording = left !== null;
  return (
    <div className="own-camera" data-testid="own-camera">
      <video ref={view} muted playsInline aria-label="Live camera view" />
      {problem && <p className="notice" role="alert" data-testid="own-camera-problem">{problem} <button type="button" className="qv-link" onClick={() => { setProblem(""); setReady(false); setAttempt(n => n + 1); }}><RefreshCw size={13} aria-hidden="true" /> Try again</button></p>}
      <div className="qv-row">
        {cameras.length > 1 && <label className="own-camera-pick">Camera
          <select value={cameraId} disabled={recording} onChange={e => { setReady(false); setProblem(""); setCameraId(e.target.value); }} data-testid="own-camera-select">
            <option value="">Default camera</option>
            {cameras.map((c, i) => <option key={c.deviceId || i} value={c.deviceId}>{c.label || `Camera ${i + 1}`}</option>)}
          </select></label>}
        <button type="button" className="lvp-primary" disabled={props.disabled || !ready || recording} onClick={takePhoto} data-testid="own-camera-photo"><Camera size={15} aria-hidden="true" /> Take photo</button>
        {recording
          ? <button type="button" onClick={() => recorder.current?.stop()} data-testid="own-camera-stop"><CircleStop size={15} aria-hidden="true" /> Stop · {left}s left</button>
          : <button type="button" disabled={props.disabled || !ready} onClick={record} data-testid="own-camera-record"><Video size={15} aria-hidden="true" /> Record {maxClipSeconds} s clip</button>}
        <button type="button" className="qv-link" disabled={recording} onClick={() => { stop(); props.close(); }}>Close camera</button>
      </div>
    </div>
  );
}
