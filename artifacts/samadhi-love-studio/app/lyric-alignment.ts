import type { LyricCue, LyricWord } from "./lyric-video-data";

type Timing = { text: string; start?: number | null; end?: number | null; type?: string; speaker_id?: string };

const glyphs = (text: string) => Array.from(text.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""));
const validTime = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const round = (value: number) => Math.round(value * 1000) / 1000;

function timingItems(input: unknown): Timing[] {
  if (!Array.isArray(input) || input.length > 60_000) return [];
  return input.filter(item => item && typeof item.text === "string" && item.text.length <= 180);
}

export function alignLyricLines(lines: string[], response: { characters?: unknown; words?: unknown },options:{splitPauses?:boolean}={}): LyricCue[] | null {
  const expected = glyphs(lines.join("\n")).join("");
  for (const source of [response.characters, response.words]) {
    const timed = timingItems(source).flatMap(item => glyphs(item.text).map(glyph => ({ glyph, start: item.start, end: item.end })));
    if (!timed.length || timed.map(item => item.glyph).join("") !== expected) continue;
    const cues: LyricCue[] = [];
    let completed=0;
    let position = 0;
    for (const text of lines) {
      const words: LyricWord[] = [];
      const starts:number[]=[],ends:(number|undefined)[]=[];
      let end = 0;
      for (const match of text.matchAll(/\S+/gu)) {
        const length = glyphs(match[0]).length;
        const part = timed.slice(position, position + length);
        position += length;
        const onset = part.find(item => validTime(item.start))?.start;
        const offset = match.index + match[0].length;
        let wordEnd=0;
        for (const item of part) if (validTime(item.end)) {end = Math.max(end, round(item.end));wordEnd=Math.max(wordEnd,round(item.end));}
        if (validTime(onset)) {words.push({ offset, time: Math.max(words.at(-1)?.time ?? 0, round(onset)) });starts.push(match.index);ends.push(wordEnd>onset?wordEnd:undefined);}
      }
      if (!words.length) break;
      const time = words[0].time;
      if (cues.length && time <= cues.at(-1)!.time) break;
      const boundaries=[0];
      if(options.splitPauses)for(let i=1;i<words.length;i++)if(ends[i-1]!==undefined&&words[i].time-ends[i-1]!>=1.25)boundaries.push(i);
      boundaries.push(words.length);
      for(let i=0;i<boundaries.length-1;i++){
        const a=boundaries[i],b=boundaries[i+1],from=a===0?0:starts[a],until=b===words.length?text.length:starts[b],group=words.slice(a,b).map(w=>({...w,offset:w.offset-from}));
        const groupEnd=boundaries.length===2?end:Math.max(0,...ends.slice(a,b).filter((v):v is number=>v!==undefined));
        cues.push({text:text.slice(from,until).trimEnd(),time:group[0].time,...(groupEnd>group[0].time&&groupEnd>=group.at(-1)!.time?{end:groupEnd}:{}),words:group});
      }
      completed++;
    }
    if (completed === lines.length) return cues;
  }
  return null;
}

export function captionsFromTranscript(input: unknown) {
  const items = timingItems(input);
  const hasSpacing = items.some(item => item.type === "spacing");
  const captions: LyricCue[] = [];
  let text = "";
  let words: LyricWord[] = [];
  let end = 0;
  let separator = "";
  let singer: string | undefined;
  function flush() {
    if (!text || !words.length) return;
    const time = words[0].time;
    if (captions.length && time <= captions.at(-1)!.time) return;
    captions.push({ text, time, ...(singer ? { singer } : {}), ...(end > time && end >= words.at(-1)!.time ? { end } : {}), words });
    text = "";
    words = [];
    end = 0;
  }
  for (const item of items) {
    if (item.type === "spacing") { separator = " "; continue; }
    if (item.type !== "word" || !validTime(item.start) || !item.text.trim()) continue;
    const start = round(item.start);
    const word = item.text.trim();
    if (text && start > words[0].time && (
      (item.speaker_id && singer && item.speaker_id !== singer) ||
      text.length + word.length > 58 || words.length >= 9 || start - end > 0.72 ||
      (words.length >= 4 && /[.!?؟。]$/u.test(text))
    )) flush();
    if (!text) singer = typeof item.speaker_id === "string" ? item.speaker_id.slice(0,80) : undefined;
    const gap = text && !/^[,.!?؟。،]/u.test(word) ? (hasSpacing ? separator : " ") : "";
    text += gap + word;
    words.push({ offset: text.length, time: Math.max(words.at(-1)?.time ?? 0, start) });
    end = Math.max(end, validTime(item.end) ? round(item.end) : start);
    separator = "";
  }
  flush();
  return captions;
}
