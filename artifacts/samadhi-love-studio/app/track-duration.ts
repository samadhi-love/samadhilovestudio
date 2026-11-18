import { productionHeader } from "./lyric-notation";
import { performanceWeight } from "./song-opening";
export const minTrackSeconds = 3;
// Local synthesized sketches retain their tested six-minute memory budget.
export const maxTrackSeconds = 6 * 60;
export const maxGeneratedSongSeconds = 6 * 60;
// Production also accepts existing eight-minute recordings and rendered tails.
export const maxProductionSeconds = 8 * 60;
export const trackLengthPresets = [30, 60, 120, 180, 240, 300, maxTrackSeconds] as const;

export function isTrackDuration(seconds: unknown): seconds is number {
  return typeof seconds === "number" && Number.isInteger(seconds) && seconds >= minTrackSeconds && seconds <= maxGeneratedSongSeconds;
}

export function formatTrackTime(seconds: number) {
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

export function parseTrackTime(value: string) {
  const input = value.trim();
  const parts = /^(\d{1,2}):(\d{1,2})$/.exec(input);
  const seconds = parts
    ? Number(parts[2]) < 60 ? Number(parts[1]) * 60 + Number(parts[2]) : NaN
    : /^\d{1,3}$/.test(input) ? Number(input) : NaN;
  return isTrackDuration(seconds) ? seconds : null;
}

const numberWords: Record<string,number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
/** Find whole-track requests, ignoring durations explicitly attached to an intro/verse/etc. */
function promptTimes(prompt: string) {
  const hints: { seconds:number; maximum:boolean; index:number }[]=[];
  const add=(seconds:number,index:number,end:number)=>{
    const before=prompt.slice(Math.max(0,index-48),index),after=prompt.slice(end,end+40);
    if(/^\s*[-–—]?\s*(?:intro|outro|verse|chorus|bridge|solo|break|drop)\b/i.test(after)||/(?:intro|outro|verse|chorus|bridge|solo|break|drop)(?:\s+(?:of|lasting|lasts|for))?\s*$/i.test(before))return;
    const maximum=/(?:up to|at most|max(?:imum)?(?:\s+(?:length|duration))?(?:\s+of)?|no longer than|under|less than)\s*$/i.test(before)||/^\s*(?:max(?:imum)?|or less|at most)\b/i.test(after);
    hints.push({seconds,maximum,index});
  };
  let consumed=0;
  for(const match of prompt.matchAll(/\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s*[-–—]?\s*(minutes?|mins?|m|seconds?|secs?|s)\b/gi)){
    const index=match.index!;if(index<consumed)continue;
    const amount=numberWords[match[1].toLowerCase()]??Number(match[1]),minutes=/^m/i.test(match[2]);let end=index+match[0].length;
    const remainder=minutes?/^\s*(?:and\s*)?(\d{1,2})\s*(?:seconds?|secs?|s)\b/i.exec(prompt.slice(end)):null;
    if(remainder)end+=remainder[0].length;
    consumed=end;add(amount*(minutes?60:1)+(remainder?Number(remainder[1]):0),index,end);
  }
  for(const match of prompt.matchAll(/\b(\d{1,2}):([0-5]\d)\b/g))add(Number(match[1])*60+Number(match[2]),match.index!,match.index!+match[0].length);
  return hints.sort((a,b)=>a.index-b.index);
}

/** Duration planning only; it does not estimate word timestamps or change approved lyrics. */
export function autoTrackTime({ vocals, lyrics, bpm, cinematic, prompt="", templateSeconds, sectionCount=0 }: {
  vocals: boolean; lyrics: string; beginner?: boolean; bpm: number; cinematic: boolean;
  prompt?: string; templateSeconds?: number; sectionCount?: number;
}) {
  const hints=promptTimes(prompt),maximums=hints.filter(h=>h.maximum).map(h=>h.seconds);
  const limit=Math.max(minTrackSeconds,Math.floor(Math.min(maxGeneratedSongSeconds,...maximums)));
  const finish=(seconds:number,reason:string,explicit=false)=>({seconds:Math.max(minTrackSeconds,Math.min(limit,Math.round(seconds))),explicit,overLimit:explicit&&seconds>maxGeneratedSongSeconds,reason:reason+(seconds>limit?` Limited to ${formatTrackTime(limit)}.`:"")});
  const requested=hints.find(h=>!h.maximum);
  if(requested)return finish(requested.seconds,"Based on the duration requested in your prompt.",true);
  const words=vocals?performanceWeight(lyrics):0;
  const lyricSections=lyrics.split(/\r?\n/).filter(line=>productionHeader(line)).length;
  const sections=Math.max(Number.isFinite(sectionCount)?sectionCount:0,lyricSections||(prompt.match(/\[(?:intro|verse[^\]]*|chorus|bridge|drop|outro|finale)\]/gi)??[]).length);
  if(words)return finish(Math.round((30+words*60/110+Math.min(30,sections*3))/5)*5,"Based on your lyric length and section structure, with intro/outro space.");
  if(isTrackDuration(templateSeconds))return finish(templateSeconds,"Based on your template’s target duration.");
  if(/\b(?:short|teaser|promo|jingle|stinger|loop)\b/i.test(prompt))return finish(vocals?60:30,"A short format requested in your prompt.");
  // Composition plans require a numeric duration; use a natural three-minute
  // target rather than forcing a short beginner demo or a tempo-derived limit.
  return finish(180,"Auto length: a natural three-minute target when no lyrics or specific length are supplied.");
}

/** The same duration is used by quoting and generation; Auto never bypasses the cap. */
export function creationDuration(input: Record<string,unknown>): number {
  if(input.duration !== undefined && input.duration !== "auto" && !isTrackDuration(Number(input.duration)))return NaN;
  if(input.autoLength !== true && input.duration !== undefined && input.duration !== "auto")return Number(input.duration);
  const timing=autoTrackTime({vocals:input.instrumental!==true,lyrics:typeof input.lyrics==="string"?input.lyrics:"",
    bpm:120,cinematic:false,prompt:typeof input.languagePrompt==="string"?input.languagePrompt:typeof input.prompt==="string"?input.prompt:""});
  return timing.overLimit ? NaN : timing.seconds;
}
