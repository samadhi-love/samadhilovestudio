/**
 * Ready-to-paste post text for where the video is going.
 * YouTube gets a title plus a full description; TikTok, Reels and the rest get a
 * short hook line with hashtags. Built only from the song's own name, words and
 * styles: nothing is invented about the artist.
 */
import type { VideoPlatform } from "./video-publishing";

export type PostSource = { title: string; artist?: string; tags?: string[]; idea?: string; lyrics?: string };
export type PostText = { title: string; body: string; hashtags: string[] };

const tag = (word: string) => "#" + word.normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "");
const unique = (items: string[]) => [...new Set(items.filter(t => t.length > 1))];

/** The first sung chorus line (or first sung line), without section labels or {cues}. */
export function hookLine(lyrics = "") {
  const lines = lyrics.split("\n");
  const sung = (from: number) => lines.slice(from).map(l => l.replace(/\{[^{}]*\}/g, "").trim()).find(l => l && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));
  const chorus = lines.findIndex(l => /^\s*\[(?:chorus|hook|refrain)/i.test(l));
  return (chorus >= 0 ? sung(chorus + 1) : undefined) ?? sung(0) ?? "";
}

function aboutLine(idea = "") {
  const first = idea.split("\n\nOpening:")[0].split("\n")[0].replace(/^Style:[^\n]*$/i, "").trim();
  return first.length > 160 ? first.slice(0, 157).trimEnd() + "…" : first;
}

export function postTextFor(platform: VideoPlatform, song: PostSource): PostText {
  const name = song.title.trim() || "New song";
  const artist = song.artist?.trim();
  const genres = (song.tags ?? []).slice(0, 3);
  const hook = hookLine(song.lyrics);
  const about = aboutLine(song.idea);
  const base = unique([tag("LyricVideo"), ...genres.map(tag), ...(artist ? [tag(artist)] : []), tag("NewMusic")]);
  if (platform === "youtube") {
    const title = `${name}${artist ? ` – ${artist}` : ""} (Lyric Video)`.slice(0, 100);
    const body = [
      `${name}${artist ? ` by ${artist}` : ""}, the official lyric video.`,
      about,
      hook ? `“${hook}”` : "",
      genres.length ? `Style: ${genres.join(", ")}` : "",
      "Made with Versual Studio.",
    ].filter(Boolean).join("\n\n");
    return { title, body, hashtags: base.slice(0, 3) };
  }
  const short = platform === "tiktok" || platform === "instagram" || platform === "facebook" || platform === "snapchat";
  const extra = platform === "tiktok" ? ["#fyp", tag("NewSong")] : platform === "instagram" ? [tag("Reels"), tag("NewSong")] : platform === "facebook" ? [tag("Reels")] : [];
  const body = [hook ? `“${hook}”` : about || name, `${name}${artist ? ` · ${artist}` : ""}${short ? " 🎶" : ""}`].filter(Boolean).join("\n");
  return { title: name, body, hashtags: unique([...base, ...extra]).slice(0, platform === "x" || platform === "threads" ? 3 : 8) };
}

/** One caption ready to paste: YouTube puts the title first, others are hook + tags. */
export function postCaption(platform: VideoPlatform, song: PostSource) {
  const post = postTextFor(platform, song);
  return [post.body, post.hashtags.join(" ")].filter(Boolean).join("\n\n");
}
