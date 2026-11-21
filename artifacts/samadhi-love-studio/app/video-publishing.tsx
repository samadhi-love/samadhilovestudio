"use client";

import { HelpControl, HelpField } from "./help-tip";
import { useState } from "react";
import { Copy, Download, ExternalLink, Mail, Share2 } from "lucide-react";
import { hasExplicitWords } from "./clean-content";
import { purposeFileName } from "./video-purpose";
import type { VideoFormat } from "./lyric-video-data";

export const videoPlatforms = {
  tiktok: { label: "TikTok", upload: "https://www.tiktok.com/tiktokstudio/upload", destination: "TikTok Studio" },
  youtube: { label: "YouTube / Shorts", upload: "https://studio.youtube.com/", destination: "YouTube Studio" },
  instagram: { label: "Instagram Reels", upload: "https://business.facebook.com/latest/home", destination: "Meta Business Suite" },
  facebook: { label: "Facebook Reels", upload: "https://business.facebook.com/latest/home", destination: "Meta Business Suite" },
  snapchat: { label: "Snapchat Spotlight", upload: "https://profile.snapchat.com/", destination: "Snapchat uploader" },
  pinterest: { label: "Pinterest", upload: "https://www.pinterest.com/pin-creation-tool/", destination: "Pinterest Pin builder" },
  x: { label: "X", upload: "https://x.com/compose/post", destination: "X composer" },
  linkedin: { label: "LinkedIn", upload: "https://www.linkedin.com/feed/", destination: "LinkedIn feed" },
  threads: { label: "Threads", upload: "https://www.threads.com/", destination: "Threads" },
} as const;
export type VideoPlatform = keyof typeof videoPlatforms;
export type VideoExport = { url: string; blob: Blob; extension: "mp4" | "webm"; savedUrl?: string };

export function VideoPublishing({ output, title, caption, platform, setPlatform, format }: {
  output: VideoExport; title: string; caption: string; platform: VideoPlatform; setPlatform: (platform: VideoPlatform) => void;
  /** The frame shape, so the saved file says what it is for ("– YouTube 16x9"). */
  format?: VideoFormat;
}) {
  const [status, setStatus] = useState("");
  const cleanTitle = hasExplicitWords(title) ? "Samadhi Love" : title;
  const blocked = cleanTitle !== title || hasExplicitWords(caption);
  const filename = purposeFileName(cleanTitle, format, output.extension);
  const post = videoPlatforms[platform];
  const email = "mailto:?subject=" + encodeURIComponent(title) + "&body=" +
    encodeURIComponent(caption.trim() + "\n\nAttach " + filename + " from your downloads.");
  async function share() {
    const file = new File([output.blob], filename, { type: "video/" + output.extension });
    if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
      setStatus("File sharing is unavailable here. Download the video, then upload or attach it.");
      return;
    }
    try { await navigator.share({ files: [file], title, text: caption.trim() }); }
    catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setStatus("Your device could not share this file. Download it to upload or attach it.");
    }
  }
  return <div className="video-publishing">
    <h3>Export &amp; share your lyric video</h3>
    {output.savedUrl && <VideoLinkActions url={output.savedUrl} title={title} />}
    <div className="actions">
      <a className="primary" href={output.url} download={filename}><Download size={15}/> Save {output.extension.toUpperCase()}</a>
      <HelpControl subject="Share video file" tip="Open your device’s share menu with the exported video attached, where file sharing is supported."><button className="secondary" type="button" disabled={blocked} onClick={share}><Share2 size={15}/> Share video file</button></HelpControl>
      {!blocked && <HelpControl subject="Open email draft" tip="Open a draft in your email app. Attach the downloaded video there before sending."><a className="secondary" href={email}><Mail size={15}/> Open email draft</a></HelpControl>}
    </div>
    <HelpField label="Social platform" tip="Choose a destination to open its upload page. You review and publish the video there."><select value={platform} onChange={event => setPlatform(event.target.value as VideoPlatform)}>
      {Object.entries(videoPlatforms).map(([id, item]) => <option value={id} key={id}>{item.label}</option>)}</select></HelpField>
    <div className="actions">
      <a className="secondary" href={post.upload} target="_blank" rel="noreferrer">Open {post.destination} <ExternalLink size={15}/></a>
      <HelpControl subject="Copy post caption" tip="Copy the prepared caption so you can paste it into your social post."><button className="secondary" type="button" disabled={blocked || !caption.trim()} onClick={async () => {
        try { await navigator.clipboard.writeText(caption); setStatus("Post caption copied."); }
        catch { setStatus("Select and copy the caption from its text box."); }
      }}><Copy size={15}/> Copy post caption</button></HelpControl>
    </div>
    <p className="muted creation-note">Save the file, then upload it on the platform. To email it, attach the saved file to the draft or choose a mail app from Share video file when available.</p>
    {format === "wide" && <YouTubeThumbnail videoUrl={output.url} title={cleanTitle} />}
    {output.extension === "webm" && <p className="muted creation-note">This export is WebM. Use an MP4-capable browser or convert it if the destination requires MP4.</p>}
    {status && <p role="status">{status}</p>}
  </div>;
}


export function VideoLinkActions({ url, title }: { url: string; title: string }) {
  const [status, setStatus] = useState("");
  const [showLink, setShowLink] = useState(false);
  const absolute = () => new URL(url, window.location.origin).href;
  async function copy() {
    try { await navigator.clipboard.writeText(absolute()); setStatus("Video link copied."); }
    catch { setShowLink(true); setStatus("Copy the video link below."); }
  }
  async function shareLink() {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title, url: absolute() }); setStatus("Video link shared."); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) { setShowLink(true); setStatus("Sharing is unavailable. Copy the link below."); } }
  }
  return <div className="video-link-actions">
    <div className="actions">
      <button className="secondary" type="button" onClick={copy}><Copy size={15}/> Copy video link</button>
      <button className="secondary" type="button" onClick={shareLink}><Share2 size={15}/> Share video link</button>
      <a className="secondary" href={url} target="_blank" rel="noreferrer">Open saved video <ExternalLink size={15}/></a>
    </div>
    <p className="muted creation-note">Automatic saved-video link. Recipients need access to this Studio. To post on social media, share or upload the exported file.</p>
    {showLink && <input aria-label="Video link" readOnly value={absolute()} onFocus={e => e.currentTarget.select()} />}
    {status && <p role="status">{status}</p>}
  </div>;
}


/** Draw a 1280×720 YouTube thumbnail: a frame from the finished video with the song name on it. */
export async function drawThumbnail(videoUrl: string, at: number, title: string): Promise<Blob> {
  const video = document.createElement("video");
  video.muted = true; video.playsInline = true; video.preload = "auto"; video.src = videoUrl;
  await new Promise<void>((resolve, reject) => { video.onloadeddata = () => resolve(); video.onerror = () => reject(new Error("The video could not be read for a thumbnail.")); });
  // Listen first, then jump to the chosen moment.
  const seeked = new Promise<void>(resolve => { video.onseeked = () => resolve(); });
  video.currentTime = Math.max(0, Math.min(video.duration - 0.1, video.duration * at));
  await seeked;
  const canvas = document.createElement("canvas"); canvas.width = 1280; canvas.height = 720;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Thumbnails are unavailable in this browser.");
  ctx.drawImage(video, 0, 0, 1280, 720);
  const shade = ctx.createLinearGradient(0, 300, 0, 720); shade.addColorStop(0, "#0000"); shade.addColorStop(1, "#000c");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, 1280, 720);
  const words = title.trim() || "New song";
  let size = 110; ctx.font = `800 ${size}px system-ui, sans-serif`;
  while (ctx.measureText(words).width > 1160 && size > 54) { size -= 6; ctx.font = `800 ${size}px system-ui, sans-serif`; }
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.lineJoin = "round";
  ctx.lineWidth = Math.round(size / 7); ctx.strokeStyle = "#000"; ctx.fillStyle = "#ffe9a8";
  const lines: string[] = []; let line = "";
  for (const word of words.split(/\s+/)) { const next = line ? line + " " + word : word; if (ctx.measureText(next).width > 1160 && line) { lines.push(line); line = word; } else line = next; }
  lines.push(line);
  lines.slice(-2).forEach((text, i, all) => { const y = 680 - (all.length - 1 - i) * size * 1.05; ctx.strokeText(text, 640, y); ctx.fillText(text, 640, y); });
  video.removeAttribute("src"); video.load();
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("The thumbnail could not be saved.")), "image/png"));
}

function YouTubeThumbnail({ videoUrl, title }: { videoUrl: string; title: string }) {
  const [at, setAt] = useState(0.35);
  const [image, setImage] = useState("");
  const [status, setStatus] = useState("");
  async function make() {
    setStatus("Making your thumbnail…");
    try { const blob = await drawThumbnail(videoUrl, at, title); if (image) URL.revokeObjectURL(image); setImage(URL.createObjectURL(blob)); setStatus(""); }
    catch (error) { setStatus(error instanceof Error ? error.message : "The thumbnail could not be made."); }
  }
  return <div className="video-thumbnail" data-testid="youtube-thumbnail">
    <h4>YouTube thumbnail · 1280×720</h4>
    <label className="field">Pick the moment
      <input type="range" min={0} max={1} step={0.01} value={at} aria-valuetext={`${Math.round(at * 100)}% into the video`} onChange={e => setAt(Number(e.target.value))} data-testid="input-thumbnail-moment" /></label>
    <div className="actions">
      <button type="button" className="secondary" onClick={() => void make()} data-testid="button-make-thumbnail">🖼️ {image ? "Make it again" : "Make thumbnail"}</button>
      {image && <a className="primary" href={image} download={(title.replace(/[\\/:*?"<>|]/g, "-").trim().slice(0, 90) || "Samadhi Love") + " – YouTube thumbnail.png"} data-testid="button-save-thumbnail"><Download size={15}/> Save thumbnail</a>}
    </div>
    {image && <img src={image} alt={`YouTube thumbnail for ${title}`} className="video-thumbnail-preview" />}
    <p className="muted creation-note">Upload it in YouTube Studio under Details → Thumbnail.</p>
    {status && <p role="status">{status}</p>}
  </div>;
}

/** Upload & share for one finished file. Each shape starts on the site it suits
 *  (wide → YouTube, square → Instagram, tall → the chosen short-video site) and
 *  can be switched without changing the other files. */
export function ShareFinishedVideo({ output, title, caption, chosen }: { output: VideoExport & { format: VideoFormat }; title: string; caption: string; chosen: VideoPlatform }) {
  const [site, setSite] = useState<VideoPlatform>(() =>
    output.format === "wide" ? "youtube" : output.format === "square" ? "instagram" : chosen === "youtube" || chosen === "instagram" ? "tiktok" : chosen);
  return <VideoPublishing output={output} title={title} caption={caption} platform={site} setPlatform={setSite} format={output.format}/>;
}
