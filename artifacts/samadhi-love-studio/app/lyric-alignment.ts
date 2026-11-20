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

export type HeardWord = { text: string; start: number; end?: number };
const token = (text: string) => glyphs(text).join("");
function similarity(a: string, b: string) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return 1 - row[b.length] / Math.max(a.length, b.length);
}

/**
 * Match known lyrics to words heard by speech recognition (which often mishears
 * sung words). A monotonic alignment keeps the strongest similar pairs; lyric
 * words with no confident match get times interpolated between their neighbours.
 * Returns null when too few words could be matched to trust the result.
 */
export function alignLyricsToHeardWords(lines: string[], heardInput: HeardWord[], options: { minimumMatch?: number; duration?: number } = {}): { cues: LyricCue[]; matched: number; total: number } | null {
  const heard = heardInput.filter(word => validTime(word.start) && token(word.text)).slice(0, 20_000).map(word => ({ ...word, key: token(word.text) }));
  const expected = lines.flatMap((text, line) => [...text.matchAll(/\S+/gu)].map(match => ({ line, key: token(match[0]), offset: match.index + match[0].length })).filter(word => word.key));
  const n = expected.length, m = heard.length;
  if (!n || !m || n * m > 4_000_000) return null;
  // Weighted longest-common-subsequence over similar words (similarity ≥ 0.6).
  const score = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const s = similarity(expected[i - 1].key, heard[j - 1].key);
    score[i][j] = Math.max(score[i - 1][j], score[i][j - 1], s >= 0.6 ? score[i - 1][j - 1] + s : -1);
  }
  const at: (HeardWord | undefined)[] = new Array(n);
  for (let i = n, j = m; i > 0 && j > 0;) {
    const s = similarity(expected[i - 1].key, heard[j - 1].key);
    if (s >= 0.6 && Math.abs(score[i][j] - (score[i - 1][j - 1] + s)) < 1e-4) { at[i - 1] = heard[j - 1]; i--; j--; }
    else if (score[i - 1][j] >= score[i][j - 1]) i--;
    else j--;
  }
  const matched = at.filter(Boolean).length;
  if (matched / n < (options.minimumMatch ?? 0.35)) return null;
  // Interpolate unmatched words between matched neighbours.
  const times: number[] = new Array(n), ends: (number | undefined)[] = new Array(n);
  const anchors = at.map((word, index) => word ? index : -1).filter(index => index >= 0);
  const step = 0.4;
  for (let k = 0; k < anchors.length; k++) { times[anchors[k]] = at[anchors[k]]!.start; ends[anchors[k]] = at[anchors[k]]!.end; }
  for (let i = 0; i < anchors[0]; i++) times[i] = Math.max(0, times[anchors[0]] - step * (anchors[0] - i));
  for (let k = 0; k < anchors.length - 1; k++) {
    const a = anchors[k], b = anchors[k + 1], from = ends[a] ?? times[a], to = times[b];
    for (let i = a + 1; i < b; i++) times[i] = from + (to - from) * (i - a) / (b - a);
  }
  const last = anchors.at(-1)!;
  for (let i = last + 1; i < n; i++) times[i] = (ends[last] ?? times[last]) + step * (i - last);
  for (let i = 1; i < n; i++) if (times[i] < times[i - 1]) times[i] = times[i - 1];
  const cues: LyricCue[] = [];
  for (let line = 0; line < lines.length; line++) {
    const words = expected.map((word, index) => ({ word, index })).filter(item => item.word.line === line);
    if (!words.length) continue;
    let time = round(times[words[0].index]);
    if (cues.length && time <= cues.at(-1)!.time) time = round(cues.at(-1)!.time + 0.01);
    const lastIndex = words.at(-1)!.index;
    let end = ends[lastIndex] ?? (lastIndex + 1 < n ? times[lastIndex + 1] : times[lastIndex] + step);
    if (options.duration !== undefined) end = Math.min(end, options.duration);
    const lineMatched = words.some(item => at[item.index]);
    cues.push({ text: lines[line], time, ...(end > time ? { end: round(end) } : {}), words: words.map(item => ({ offset: item.word.offset, time: Math.max(time, round(times[item.index])) })), ...(lineMatched ? {} : { needsReview: true }) });
  }
  return cues.length ? { cues, matched, total: n } : null;
}
