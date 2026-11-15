import {validReactiveStem,type ReactiveStem} from "./stem-reactive";
import {isAdPhotoStory} from "./ad-photo-story";
import { parseLyricNotation, productionHeader } from "./lyric-notation";
import {isAdFootage} from "./advertising-footage";
import type {
  LyricCue,
  LyricProject,
  VideoFormat,
  VideoTheme,
} from "./lyric-video-data";
import { lyricLines, videoThemes } from "./lyric-video-data";
import type { Song } from "./studio-data";

export const proLanguages = {
  auto: "Detect language / mixed",
  eng: "English",
  ara: "Arabic · preserve your dialect",
  tur: "Turkish",
  rus: "Russian",
} as const;
export type ProLanguage = keyof typeof proLanguages;
export type ProSection = {
  id: string;
  name: string;
  time: number;
  end: number;
  language?: string;
  singer?: string;
  theme?: VideoTheme;
  background?: string;
};
export type ProLook = {
  position: number;
  size: number;
  outline: number;
  shadow: number;
  spacing: number;
  safe: boolean;
};
export type ProSettings = {
  version: 1;
  id: string;
  name: string;
  sourceSongId: string;
  sourceAudioId: string;
  soundtrackConfirmed?: string;
  beatGrid?: { source: string; bpm: number; offset: number; beats: number[]; method: "onset-grid/v1"; reviewed: boolean };
  duration: number;
  approvedLyrics: string;
  language: ProLanguage;
  detectedLanguage?: string;
  languageProbability?: number;
  alignment?: {
    engine: string;
    at: string;
    audioId: string;
    reviewed: boolean;
    warnings: string[];
    transcript?: string;
    differences?: LyricDifference[];
  };
  range: { start: number; end: number };
  look: ProLook;
  formatLooks?: Partial<Record<VideoFormat, ProLook>>;
  duetColors?: [string, string];
  captionMode: "karaoke" | "lines";
  sections: ProSection[];
  includeBacking: boolean;
  includeAdlibs: boolean;
  artist: string;
  credits: string;
  intro: number;
  outro: number;
  background?: string;
  logo?: string;
  useTemplateBackground?:boolean;
  adPhotoStory?:import("./ad-photo-story").AdPhotoStory;
  backgroundVideo?:import("./advertising-footage").AdFootage;
  advertisement?:{brand:string;cta:string};
  analysisAsset?: string;
  soundtrackAsset?: string;
  vocalAsset?: string;
  stemArchive?: string;
  sourceVideo?: string;
  analysisOffset: number;
  useEnhancedAnalysis: boolean;
  useEnhancedSoundtrack: boolean;
  audioReactive: boolean;
  reactiveStem?:ReactiveStem;
  energy?: number[];
  accents?: number[];
  waveform?: number[];
  exports?: {
    id: string;
    at: string;
    format: VideoFormat;
    extension: string;
    asset?: string;
    start: number;
    end: number;
  }[];
  updatedAt?: string;
};
export type LyricDifference = {
  kind: "missing" | "added" | "changed";
  approved: string;
  heard: string;
};
export type ProVersion = {
  id: string;
  name: string;
  at: string;
  audioId: string;
};
export const defaultProLook: ProLook = {
  position: 0.72,
  size: 1,
  outline: 1,
  shadow: 1,
  spacing: 1.35,
  safe: false,
};
export function newProSettings(song: Song, duration: number): ProSettings {
  return {
    version: 1,
    id: crypto.randomUUID(),
    name: song.name + " · Lyric Video",
    sourceSongId: song.id,
    sourceAudioId: song.audioId ?? song.id,
    duration,
    approvedLyrics:
      song.generation?.audioId === (song.audioId ?? song.id)
        ? song.generation.approvedLyrics
        : song.notes.lyrics,
    language: "auto",
    range: { start: 0, end: duration },
    look: { ...defaultProLook,...(song.musicalAd?{position:.6,safe:true}:{}) },
    captionMode: "karaoke",
    sections: [],
    includeBacking: false,
    includeAdlibs: false,
    artist: "SAMADHI LOVE",
    ...(song.logoAsset?{logo:song.logoAsset}:{}),
    ...(song.musicalAd?{artist:song.musicalAd.brand,advertisement:{brand:song.musicalAd.brand,cta:song.musicalAd.cta}}:{}),
    credits: "",
    intro: 0,
    outro: 0,
    analysisOffset: 0,
    useEnhancedAnalysis: false,
    useEnhancedSoundtrack: false,
    audioReactive: false,
  };
}
const finite = (n: unknown, min: number, max: number): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const smallString = (s: unknown, max: number): s is string =>
  typeof s === "string" && s.length <= max;
const asset = (s: unknown) =>
  s === undefined || (typeof s === "string" && /^[\w-]{1,80}$/.test(s));
export function isProLook(value: unknown): value is ProLook {
  const l = value as ProLook;
  return (
    !!l &&
    finite(l.position, 0.25, 0.82) &&
    finite(l.size, 0.65, 1.6) &&
    finite(l.outline, 0, 2) &&
    finite(l.shadow, 0, 2) &&
    finite(l.spacing, 1.1, 1.7) &&
    typeof l.safe === "boolean"
  );
}
export function isProSettings(value: unknown): value is ProSettings {
  try { return validateProSettings(value); } catch { return false; }
}
function validateProSettings(value: unknown): value is ProSettings {
  if (!value || typeof value !== "object") return false;
  const p = value as ProSettings;
  return (
    p.version === 1 &&
    smallString(p.id, 80) &&
    /^[\w-]+$/.test(p.id) &&
    smallString(p.name, 150) &&
    smallString(p.sourceSongId, 100) &&
    smallString(p.sourceAudioId, 100) &&
    (p.soundtrackConfirmed === undefined || smallString(p.soundtrackConfirmed, 400)) &&
    finite(p.duration, 0, 600.1) &&
    (p.beatGrid === undefined || (!!p.beatGrid && smallString(p.beatGrid.source,400) && finite(p.beatGrid.bpm,40,240) && finite(p.beatGrid.offset,0,p.duration) && p.beatGrid.method === "onset-grid/v1" && typeof p.beatGrid.reviewed === "boolean" && Array.isArray(p.beatGrid.beats) && p.beatGrid.beats.length <= 2400 && p.beatGrid.beats.every((t,i,beats)=>finite(t,0,p.duration) && (i===0||t>beats[i-1])))) &&
    smallString(p.approvedLyrics, 5000) &&
    Object.hasOwn(proLanguages, p.language) &&
    (p.detectedLanguage === undefined || smallString(p.detectedLanguage, 30)) &&
    (p.languageProbability === undefined ||
      finite(p.languageProbability, 0, 1)) &&
    !!p.range &&
    finite(p.range.start, 0, p.duration) &&
    finite(p.range.end, p.range.start, p.duration + 0.001) &&
    isProLook(p.look) &&
    (p.formatLooks === undefined ||
      Object.entries(p.formatLooks).every(
        ([key, l]) =>
          ["wide", "vertical", "square"].includes(key) && isProLook(l),
      )) &&
    (p.duetColors === undefined ||
      (Array.isArray(p.duetColors) &&
        p.duetColors.length === 2 &&
        p.duetColors.every((c) => /^#[0-9a-f]{6}$/i.test(c)))) &&
    ["karaoke", "lines"].includes(p.captionMode) &&
    Array.isArray(p.sections) &&
    p.sections.length <= 60 &&
    p.sections.every(
      (s) =>
        s &&
        smallString(s.id, 80) &&
        smallString(s.name, 100) &&
        finite(s.time, 0, p.duration) &&
        finite(s.end, s.time, p.duration + 0.001) &&
        (s.language === undefined || smallString(s.language, 80)) &&
        (s.singer === undefined || smallString(s.singer, 60)) &&
        (s.theme === undefined || Object.hasOwn(videoThemes, s.theme)) &&
        asset(s.background),
    ) &&
    typeof p.includeBacking === "boolean" &&
    typeof p.includeAdlibs === "boolean" &&
    smallString(p.artist, 100) &&
    smallString(p.credits, 400) &&
    finite(p.intro, 0, 10) &&
    finite(p.outro, 0, 10) &&
    (p.useTemplateBackground===undefined||typeof p.useTemplateBackground==="boolean") &&
    (p.adPhotoStory===undefined||isAdPhotoStory(p.adPhotoStory)) &&
    (p.backgroundVideo===undefined||isAdFootage(p.backgroundVideo)) &&
    (p.advertisement===undefined||!!p.advertisement&&smallString(p.advertisement.brand,70)&&smallString(p.advertisement.cta,100)) &&
    finite(p.analysisOffset, -2, 2) &&
    typeof p.useEnhancedAnalysis === "boolean" &&
    typeof p.useEnhancedSoundtrack === "boolean" &&
    typeof p.audioReactive === "boolean" &&
    (p.reactiveStem===undefined||validReactiveStem(p.reactiveStem)&&p.reactiveStem.source===p.sourceAudioId) &&
    [
      p.background,
      p.logo,
      p.analysisAsset,
      p.soundtrackAsset,
      p.vocalAsset,
      p.stemArchive,
      p.sourceVideo,
    ].every(asset) &&
    (p.energy === undefined ||
      (Array.isArray(p.energy) &&
        p.energy.length <= 12001 &&
        p.energy.every((n) => finite(n, 0, 1)))) &&
    (p.waveform === undefined ||
      (Array.isArray(p.waveform) &&
        p.waveform.length <= 1600 &&
        p.waveform.every((n) => finite(n, 0, 1)))) &&
    (p.accents === undefined ||
      (Array.isArray(p.accents) &&
        p.accents.length <= 2400 &&
        p.accents.every((n) => finite(n, 0, p.duration)))) &&
    (p.alignment === undefined ||
      (!!p.alignment &&
        smallString(p.alignment.engine, 100) &&
        smallString(p.alignment.at, 60) &&
        smallString(p.alignment.audioId, 100) &&
        typeof p.alignment.reviewed === "boolean" &&
        Array.isArray(p.alignment.warnings) &&
        p.alignment.warnings.length <= 100 &&
        p.alignment.warnings.every((s) => smallString(s, 400)) &&
        (p.alignment.transcript === undefined ||
          smallString(p.alignment.transcript, 8000)) &&
        (p.alignment.differences === undefined ||
          (Array.isArray(p.alignment.differences) &&
            p.alignment.differences.length <= 60 &&
            p.alignment.differences.every(
              (d) =>
                d &&
                ["missing", "added", "changed"].includes(d.kind) &&
                smallString(d.approved, 300) &&
                smallString(d.heard, 300),
            ))))) &&
    (p.exports === undefined ||
      (Array.isArray(p.exports) &&
        p.exports.length <= 30 &&
        p.exports.every(
          (e) =>
            e &&
            smallString(e.id, 80) &&
            smallString(e.at, 60) &&
            ["wide", "vertical", "square"].includes(e.format) &&
            ["mp4", "webm"].includes(e.extension) &&
            asset(e.asset) &&
            finite(e.start, 0, p.duration) &&
            finite(e.end, e.start, p.duration + 0.001),
        )))
  );
}
export function sourceChanged(song: Song, project: LyricProject) {
  return (
    !!project.pro && project.pro.sourceAudioId !== (song.audioId ?? song.id)
  );
}
export function recommendLook(song: Pick<Song, "notes" | "tags">) {
  const text = song.notes.prompt + " " + song.tags.join(" ");
  if (/arab|leban|egypt|khalee|oud|dabke/i.test(text))
    return {
      theme: "dawn" as const,
      captionTemplate: "sacred-script" as const,
      font: "script" as const,
      color: "gold" as const,
    };
  if (/spirit|meditat|uplift|mantra/i.test(text))
    return {
      theme: "meditation" as const,
      captionTemplate: "illuminated-verse" as const,
      font: "gothic" as const,
      color: "gold" as const,
    };
  if (/house|dance|energe|futuris/i.test(text))
    return {
      theme: "futuristic" as const,
      captionTemplate: "neon-pulse" as const,
      font: "clean" as const,
      color: "turquoise" as const,
    };
  if (/acoustic|r&b|rnb|soul/i.test(text))
    return {
      theme: "dawn" as const,
      captionTemplate: "ink-echo" as const,
      font: "brush" as const,
      color: "pearl" as const,
    };
  return {
    theme: "cosmic" as const,
    captionTemplate: "silver-cinema" as const,
    font: "classic" as const,
    color: "pearl" as const,
  };
}
export function reviewTiming(cues: LyricCue[], duration: number) {
  const flags: { index: number; message: string }[] = [];
  cues.forEach((cue, i) => {
    const end = Math.min(
      cue.end ?? cues[i + 1]?.time ?? duration,
      cues[i + 1]?.time ?? duration,
      duration,
    );
    if (cue.time >= duration || end <= cue.time)
      flags.push({ index: i, message: "Timing falls outside the recording." });
    else if ([...cue.text].length / (end - cue.time) > 24)
      flags.push({
        index: i,
        message: "Fast caption — check readability and word timing.",
      });
    if (!cue.words?.length)
      flags.push({
        index: i,
        message: "Word pacing is estimated; listen to check it.",
      });
    if (cue.words?.some((w) => w.time >= end))
      flags.push({
        index: i,
        message: "A word reaches the next line or a gap. Check this line.",
      });
  });
  return flags;
}
const tokenize = (text: string) =>
  lyricLines(text)
    .join(" ")
    .match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
const normalize = (text: string) =>
  text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
/** LCS reports recognition differences, not proof that the singer made an error. */
export function compareLyrics(
  approved: string,
  heard: string,
): LyricDifference[] {
  const a = tokenize(approved).slice(0, 1200),
    b = tokenize(heard).slice(0, 1200);
  const width = b.length + 1,
    grid = new Uint16Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      grid[i * width + j] =
        normalize(a[i]) === normalize(b[j])
          ? 1 + grid[(i + 1) * width + j + 1]
          : Math.max(grid[(i + 1) * width + j], grid[i * width + j + 1]);
  const differences: LyricDifference[] = [];
  let i = 0,
    j = 0;
  while ((i < a.length || j < b.length) && differences.length < 60) {
    if (i < a.length && j < b.length && normalize(a[i]) === normalize(b[j])) {
      i++;
      j++;
      continue;
    }
    if (
      i < a.length &&
      j < b.length &&
      grid[(i + 1) * width + j] === grid[i * width + j + 1]
    )
      differences.push({ kind: "changed", approved: a[i++], heard: b[j++] });
    else if (
      i < a.length &&
      (j >= b.length || grid[(i + 1) * width + j] >= grid[i * width + j + 1])
    )
      differences.push({ kind: "missing", approved: a[i++], heard: "" });
    else differences.push({ kind: "added", approved: "", heard: b[j++] });
  }
  return differences;
}
export function clipCues(cues: LyricCue[], start: number, end: number) {
  return cues.flatMap((cue, i) => {
    const until = Math.min(
      cue.end ?? cues[i + 1]?.time ?? end,
      cues[i + 1]?.time ?? end,
      end,
    );
    if (until <= start || cue.time >= end) return [];
    return [
      {
        ...cue,
        time: Math.max(0, cue.time - start),
        end: until - start,
        words: cue.words
          ?.filter((w) => w.time < end)
          .map((w) => ({ ...w, time: Math.max(0, w.time - start) })),
      },
    ];
  });
}
export function lrcFile(cues: LyricCue[], start: number, end: number) {
  const stamp = (t: number) => {
    const centis = Math.round(t * 100);
    return `${String(Math.floor(centis / 6000)).padStart(2, "0")}:${((centis % 6000) / 100).toFixed(2).padStart(5, "0")}`;
  };
  return (
    "[re:SAMADHI LOVE Lyric Video Pro]\n" +
    clipCues(cues, start, end)
      .map((c) => `[${stamp(c.time)}]` + c.text)
      .join("\n") +
    "\n"
  );
}
export const assetUrl = (songId: string, id: string) =>
  `/api/studio/lyric-assets?song=${encodeURIComponent(songId)}&asset=${encodeURIComponent(id)}`;
export const sourceUrl = (songId: string, audioId: string) =>
  `/api/studio/lyric-assets?song=${encodeURIComponent(songId)}&source=${encodeURIComponent(audioId)}`;

export function sectionsFromLyrics(
  lyrics: string,
  cues: LyricCue[],
  duration: number,
): ProSection[] {
  const sections: ProSection[] = [];
  let cursor = 0,
    name = "";
  const cleanLines = parseLyricNotation(lyrics).text.split(/\r?\n/);
  for (const [lineIndex, raw] of lyrics.split(/\r?\n/).entries()) {
    const heading = productionHeader(raw);
    if (heading) {
      name = heading.name;
      continue;
    }
    const line = lyricLines(cleanLines[lineIndex] ?? "")[0];
    if (!line) continue;
    const expected=normalize(line).replace(/\s+/gu,"");
    let index=-1,after=cursor;
    // Display wrapping and measured pauses may split one approved line into several cues.
    for(let i=cursor;i<cues.length&&index<0;i++){
      let joined="";
      for(let j=i;j<cues.length;j++){
        const part=normalize(cues[j].text).replace(/\s+/gu,"");if(!part)break;
        joined+=part;
        if(joined===expected){index=i;after=j+1;break;}
        if(!expected.startsWith(joined))break;
      }
    }
    if (index < 0) continue;
    if (name) {
      sections.push({
        id: crypto.randomUUID(),
        name,
        time: cues[index].time,
        end: duration,
      });
      name = "";
    }
    cursor = after;
  }
  return sections.map((s, i) => ({
    ...s,
    end: sections[i + 1]?.time ?? duration,
  }));
}
