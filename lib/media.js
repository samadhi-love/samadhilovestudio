// Samadhi's YouTube videos and social pages.
// Add a video by pasting its YouTube link into `youtube` (newest first).
// A social button only shows once its link is filled in.

export const youtube = [
  // { url: "https://www.youtube.com/watch?v=XXXXXXXXXXX", title: "Song title" },
];

// Podcast episodes and recordings. A YouTube link plays on the page; any other https link
// (Spotify, Apple Podcasts, SoundCloud…) shows as a "Listen" button.
export const podcasts = [
  // { title: "Episode title", url: "https://...", note: "One line about it" },
];

export const socials = [
  { name: "YouTube", url: "" },
  { name: "Facebook", url: "" },
  { name: "Instagram", url: "" },
  { name: "TikTok", url: "" },
  { name: "X", url: "" },
];

// Accepts youtube.com/watch?v=, youtu.be/, /shorts/ and /embed/ links; returns the 11-character video id.
export function youtubeId(url) {
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(String(url || ""));
  return m ? m[1] : null;
}

export function liveSocials() {
  return socials.filter((s) => /^https:\/\//.test(s.url));
}
