/**
 * "What is your video for?" chosen in the Make your video box.
 * It sets the frame shape, how much of the song is used and where the finished
 * file is meant to go (the upload button in the export step opens that site).
 */
import { applyVideoShape, shortClipRange } from "./creator-video-presets";
import type { LyricProject, VideoFormat } from "./lyric-video-data";
import type { VideoPlatform } from "./video-publishing";

export type VideoPurposeId = "youtube" | "shorts" | "phone" | "square";
export type VideoPurpose = {
  id: VideoPurposeId; name: string; icon: string; shape: string; where: string;
  format: VideoFormat; seconds: number; platform: VideoPlatform; file: string;
};

export const videoPurposes: readonly VideoPurpose[] = [
  { id: "youtube", name: "YouTube", icon: "📺", shape: "Landscape 16:9 · full song", where: "YouTube, computers and TV",
    format: "wide", seconds: 0, platform: "youtube", file: "YouTube 16x9" },
  { id: "shorts", name: "Shorts · TikTok · Reels", icon: "⚡", shape: "Tall 9:16 · 60-second highlight", where: "YouTube Shorts, TikTok, Instagram Reels",
    format: "vertical", seconds: 60, platform: "tiktok", file: "Short 9x16" },
  { id: "phone", name: "Phone · full song", icon: "📱", shape: "Tall 9:16 · full song", where: "Stories, WhatsApp, Facebook and phones",
    format: "vertical", seconds: 0, platform: "facebook", file: "Phone 9x16" },
  { id: "square", name: "Square box", icon: "🔲", shape: "Square 1:1 · full song", where: "Instagram and Facebook feeds, album-style post",
    format: "square", seconds: 0, platform: "instagram", file: "Square 1x1" },
];

export const defaultVideoPurpose: VideoPurposeId = "shorts";
export const videoPurposeKey = "versual-video-purpose";

export function videoPurposeById(id: string | undefined | null): VideoPurpose | undefined {
  return videoPurposes.find(p => p.id === id);
}

/** The remembered choice, or the default. Safe where storage is blocked. */
export function readVideoPurpose(): VideoPurposeId {
  try { return videoPurposeById((typeof window === "undefined" ? null : window.localStorage.getItem(videoPurposeKey)))?.id ?? defaultVideoPurpose; }
  catch { return defaultVideoPurpose; }
}
export function rememberVideoPurpose(id: VideoPurposeId) {
  try { if (typeof window !== "undefined") window.localStorage.setItem(videoPurposeKey, id); } catch { /* the choice still works for this visit */ }
}

/** Frame the project for its purpose: shape plus the full song or a highlight starting at `start`. */
export function applyVideoPurpose(project: LyricProject, purpose: VideoPurpose, start = 0, seconds?: number): LyricProject {
  if (!project.pro?.duration) throw new Error("Choose a recording and wait for its length before preparing a video.");
  const length = seconds ?? purpose.seconds;
  const range = length > 0 ? shortClipRange(project.pro.duration, start, length) : { start: 0, end: project.pro.duration };
  return applyVideoShape({ ...project, pro: { ...project.pro, range } }, purpose.format);
}

/** File name that says what the video is for: "My Song – YouTube 16x9.mp4". */
export function purposeFileName(title: string, format: VideoFormat | undefined, extension: string) {
  const base = title.replace(/[\\/:*?"<>|]/g, "-").trim().slice(0, 100) || "Samadhi Love";
  const tag = format === "wide" ? "YouTube 16x9" : format === "square" ? "Square 1x1" : format === "vertical" ? "Phone 9x16" : "";
  return `${base}${tag ? ` – ${tag}` : ""}.${extension}`;
}
