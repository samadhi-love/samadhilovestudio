import { performanceLines } from "./lyric-notation";
export const songOpenings = {
  auto: { name: "Follow my prompt", direction: "Begin audible music without unintended leading silence. Use sung lead vocals for songs; add speech or whispers only when explicitly requested in the prompt, arrangement or approved lyrics. Follow an opening or instrumental intro explicitly requested in the song description; otherwise keep any intro short, a few seconds at most, before the first vocal phrase." },
  direct: { name: "Start promptly", direction: "Begin the musical hook or first vocal phrase promptly. Avoid an added instrumental introduction or silent lead-in. Preserve every approved lyric word in its original order." },
  short: { name: "Short musical intro", direction: "Start audible music immediately and use only a short musical intro, around 3 to 4 seconds, before the first vocal phrase. Preserve approved lyric words and allow natural delivery." },
} as const;
export type SongOpening = keyof typeof songOpenings;
export function performedText(text: string) {
  return performanceLines(text).join(" ");
}
export function performanceWeight(text: string) {
  return (performedText(text).match(/[\p{L}\p{N}]+/gu) ?? []).reduce((sum, word) => sum + Math.max(1, Math.ceil(word.length / 7)), 0);
}
