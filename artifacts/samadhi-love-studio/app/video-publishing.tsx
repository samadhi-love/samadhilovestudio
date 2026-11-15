"use client";

import { HelpControl, HelpField } from "./help-tip";
import { useState } from "react";
import { Copy, Download, ExternalLink, Mail, Share2 } from "lucide-react";
import { hasExplicitWords } from "./clean-content";

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

export function VideoPublishing({ output, title, caption, platform, setPlatform }: {
  output: VideoExport; title: string; caption: string; platform: VideoPlatform; setPlatform: (platform: VideoPlatform) => void;
}) {
  const [status, setStatus] = useState("");
  const cleanTitle = hasExplicitWords(title) ? "Samadhi Love" : title;
  const blocked = cleanTitle !== title || hasExplicitWords(caption);
  const filename = (cleanTitle.replace(/[\\/:*?"<>|]/g, "-").trim().slice(0, 100) || "Samadhi Love") + "." + output.extension;
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
