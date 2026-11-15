import { performanceLines } from "./lyric-notation";
import { isLanguageProfile } from "./music-language";
import { isProSettings, type ProSettings } from "./lyric-pro-data";
import { captionTypefaces, getCaptionTemplate, type CaptionEmphasis, type CaptionTemplateId } from "./lyric-caption-templates";
import { overlayDesigns, type OverlayStyle } from "./lyric-overlay-designs";

export const videoThemes = {
  cosmic: { title: "Cosmic Orbit", colors: ["#714a91", "#21173c", "#100d21", "#f7c7f2"], image: "" },
  silkroad: { title: "Celestial Silk Road", colors: ["#c99351", "#292044", "#0b0c25", "#ffe2ad"], image: "/lyric-art/world/celestial-silk-road.webp" },
  lotusrhythm: { title: "Lotus Rhythm", colors: ["#51b6ac", "#30204d", "#100c29", "#dbfff1"], image: "/lyric-art/world/lotus-rhythm.webp" },
  earthbeat: { title: "Aurora Earthbeat", colors: ["#d8a646", "#203b43", "#0a1329", "#fff0c0"], image: "/lyric-art/world/aurora-earthbeat.webp" },
  dawn: { title: "Golden Awakening", colors: ["#a77038", "#40244c", "#190d20", "#ffe5a8"], image: "" },
  ocean: { title: "Ocean of Light", colors: ["#338d94", "#17315a", "#080f29", "#b9fbef"], image: "" },
  celestial: { title: "Celestial Eclipse", colors: ["#ab723d", "#202b55", "#0b1225", "#ffe2ae"], image: "/studio-scenes/eclipse.webp" },
  nebula: { title: "Coral Nebula", colors: ["#ce776b", "#463260", "#160f32", "#fff1ce"], image: "/studio-scenes/nebula.webp" },
  futuristic: { title: "Futuristic Aurora", colors: ["#338d94", "#17315a", "#080f29", "#b9fbef"], image: "/studio-scenes/aurora.webp" },
  nature: { title: "Mountain Sunrise", colors: ["#dc9264", "#31585a", "#0c252c", "#ffe1b8"], image: "" },
  meditation: { title: "Meditation Halo", colors: ["#819a7a", "#234951", "#0a2431", "#fff1be"], image: "" },
  kriya: { title: "Kriya Lineage", colors: ["#a96d45", "#37213c", "#160e20", "#ffe2ad"], image: "/lyric-art/kriya.webp" },
  masters: { title: "Ascended Masters", colors: ["#965689", "#3d225b", "#170b24", "#ffe1ef"], image: "/lyric-art/masters.webp" },
  archangel: { title: "Archangel Light", colors: ["#ab8643", "#272e56", "#111221", "#fff0c6"], image: "/lyric-art/archangel.webp" },
  jesus: { title: "Jesus", colors: ["#ab723d", "#46272c", "#14111d", "#ffe2ae"], image: "/lyric-art/jesus.webp" },
  mary: { title: "Mother Mary", colors: ["#5d89ac", "#1f3559", "#0c1429", "#ffe6af"], image: "/lyric-art/mary.webp" },
  buddha: { title: "Buddha", colors: ["#bb8938", "#334338", "#111e20", "#ffe3a2"], image: "/lyric-art/buddha.webp" },
  silver: { title: "Silver Moon", colors: ["#778ca8", "#30374d", "#101421", "#f2f6ff"], image: "" },
  rose: { title: "Rose Quartz", colors: ["#b66f91", "#4f284b", "#210f29", "#ffe0ee"], image: "" },
  amber: { title: "Amber Gold", colors: ["#d29a4b", "#624128", "#211522", "#ffedbb"], image: "" },
  emerald: { title: "Emerald Silk", colors: ["#429781", "#204d4b", "#0b222b", "#c3fff0"], image: "" },
  midnight: { title: "Midnight Sapphire", colors: ["#4564ab", "#252c62", "#0b102d", "#d4e8ff"], image: "" },
  lavender: { title: "Lavender Dream", colors: ["#a583cd", "#52376f", "#21152f", "#f0dcff"], image: "" },
  sunset: { title: "Coral Sunset", colors: ["#d4836a", "#763e62", "#28152f", "#ffe9cc"], image: "" },
  monochrome: { title: "Black & Platinum", colors: ["#727b8c", "#30333d", "#090b10", "#f2f3f6"], image: "" },
  lotus: { title: "Lotus Awakening", colors: ["#a47cba", "#39274c", "#100e23", "#ffe8c1"], image: "/lyric-art/designs/lotus.svg" },
  flower: { title: "Flower of Life", colors: ["#6eaf9d", "#214b51", "#0c202a", "#d5ffe9"], image: "/lyric-art/designs/flower-of-life.svg" },
  tree: { title: "Tree of Light", colors: ["#91a478", "#274a3c", "#0b2524", "#eff2bf"], image: "/lyric-art/designs/tree-of-light.svg" },
  temple: { title: "Temple of Stillness", colors: ["#bc9861", "#313d56", "#101a2d", "#ffe3a4"], image: "/lyric-art/designs/temple.svg" },
  wings: { title: "Wings of Grace", colors: ["#a3abc8", "#303855", "#11182b", "#fff0c8"], image: "/lyric-art/designs/wings.svg" },
  mandala: { title: "Golden Mandala", colors: ["#ba955c", "#493047", "#1a1127", "#ffe8b5"], image: "/lyric-art/designs/mandala.svg" },
  lunar: { title: "Lunar Horizon", colors: ["#7799c3", "#263f64", "#0a1932", "#dceaff"], image: "/studio-scenes/designs/lunar-horizon.svg" },
  desert: { title: "Desert Moon", colors: ["#c69280", "#593b60", "#24162f", "#ffe5c4"], image: "/studio-scenes/designs/desert-moon.svg" },
  lake: { title: "Aurora Lake", colors: ["#5fada3", "#234956", "#0b2332", "#c8fff0"], image: "/studio-scenes/designs/aurora-lake.svg" },
  portal: { title: "Star Portal", colors: ["#9d80c4", "#35305b", "#10112e", "#f0d3ff"], image: "/studio-scenes/designs/star-portal.svg" },
  ruby: { title: "Ruby Light", colors: ["#bc557a", "#57243e", "#1c0d25", "#ffd5df"], image: "" },
  arctic: { title: "Arctic Ice", colors: ["#6faabe", "#285069", "#0c2338", "#d8fbff"], image: "" },
  terra: { title: "Terracotta Glow", colors: ["#b87756", "#654134", "#241b28", "#ffdfb9"], image: "" },
  peacock: { title: "Peacock Teal", colors: ["#398a8e", "#274458", "#0b202f", "#bfffee"], image: "" },
} as const;

export type VideoTheme = keyof typeof videoThemes;
export type VideoMotion = "drift" | "zoom" | "still";
export type VideoFormat = "vertical" | "wide" | "square";
export type LyricWord = { offset: number; time: number };
export type LyricCue = { text: string; time: number; end?: number; words?: LyricWord[]; emphasis?: CaptionEmphasis; accentWords?: number[]; singer?: string; role?: "lead" | "backing" | "adlib"; language?: string; translation?: string; transliteration?: string };
export const captionFonts = Object.fromEntries(Object.entries(captionTypefaces).map(([id, face]) => [id, face.label])) as { [K in keyof typeof captionTypefaces]: string };
export const captionColors = { pearl: "#fff7ea", gold: "#ffdda1", turquoise: "#a6fff3", lilac: "#e9d6ff" } as const;
export const captionEffects = { fade: "Fade in", rise: "Gentle rise", still: "Still text" } as const;
export type LyricProject = {
  languageProfile?: import("./music-language").LanguageProfile;
  visualLayers?: { backgroundMotion: number; overlayAmount: number; overlayStyle: OverlayStyle; overlayMotion: boolean; beatOffset: number };
  cues: LyricCue[]; theme: VideoTheme; motion: VideoMotion; format: VideoFormat;
  font?: keyof typeof captionFonts; color?: keyof typeof captionColors; effect?: keyof typeof captionEffects;
  captionTemplate?: CaptionTemplateId; intensity?: "full" | "gentle" | "still"; bpm?: number; captionLayout?: "auto" | "horizontal"; pro?: ProSettings;
};

export const videoSize = (format: VideoFormat) => format === "wide" ? { width: 1280, height: 720 } :
  format === "square" ? { width: 1080, height: 1080 } : { width: 720, height: 1280 };

export const lyricTemplates = [
  { name: "Cosmic Short", note: "Vertical aurora with turquoise captions", theme: "futuristic", format: "vertical", motion: "drift", font: "bold", color: "turquoise", effect: "rise" },
  { name: "Nebula Cover", note: "Square coral nebula with pearl captions", theme: "nebula", format: "square", motion: "still", font: "classic", color: "pearl", effect: "fade" },
  { name: "Celestial Gold", note: "Widescreen eclipse with golden serif text", theme: "celestial", format: "wide", motion: "zoom", font: "classic", color: "gold", effect: "fade" },
  { name: "Quiet Sunrise", note: "Mountain scene with soft pearl captions", theme: "nature", format: "wide", motion: "still", font: "clean", color: "pearl", effect: "fade" },
  { name: "Square Spotlight", note: "Square ocean palette with still captions", theme: "ocean", format: "square", motion: "drift", font: "bold", color: "pearl", effect: "still" },
  { name: "Meditation Halo", note: "Vertical halo and gentle lilac text", theme: "meditation", format: "vertical", motion: "zoom", font: "classic", color: "lilac", effect: "fade" },
] as const satisfies readonly (Omit<LyricProject, "cues"> & { name: string; note: string })[];

export function captionFile(cues: LyricCue[], start: number, end: number, format: "srt" | "vtt") {
  const time = (seconds: number) => {
    const millis = Math.round(seconds * 1000);
    const whole = Math.floor(millis / 1000);
    const parts = [Math.floor(whole / 3600), Math.floor(whole / 60) % 60, whole % 60];
    return parts.map(value => String(value).padStart(2, "0")).join(":") +
      (format === "srt" ? "," : ".") + String(millis % 1000).padStart(3, "0");
  };
  const blocks: string[] = [];
  cues.forEach((cue, index) => {
    const from = Math.max(cue.time, start) - start;
    const to = Math.min(cue.end ?? end, cues[index + 1]?.time ?? end, end) - start;
    if (Math.round(to * 1000) <= Math.round(from * 1000)) return;
    const text = cue.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    blocks.push(`${blocks.length + 1}\n${time(from)} --> ${time(to)}\n${text}`);
  });
  return (format === "vtt" ? "WEBVTT\n\n" : "") + blocks.join("\n\n") + "\n";
}

export function lyricLines(text: string) {
  return performanceLines(text);
}

export function estimatedCues(lines: string[], duration: number) {
  const start = Math.min(1, duration * 0.05);
  const weights = lines.map(line => Math.max(3, line.split(/\s+/).length));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let elapsed = 0;
  return lines.map((text, index) => {
    const time = start + (duration - start) * elapsed / total;
    elapsed += weights[index];
    return { text, time: Math.round(time * 100) / 100 };
  });
}


export function isLyricProject(value: unknown): value is LyricProject {
  try { return validateLyricProject(value); } catch { return false; }
}

function validateLyricProject(value: unknown): value is LyricProject {
  if (typeof value !== "object" || value === null) return false;
  const project = value as LyricProject;
  if (!Object.hasOwn(videoThemes, project.theme) || !["drift", "zoom", "still"].includes(project.motion) ||
      !["vertical", "wide", "square"].includes(project.format) || !Array.isArray(project.cues) || project.cues.length > 200) return false;
  if ((project.font !== undefined && !Object.hasOwn(captionFonts, project.font)) ||
      (project.color !== undefined && !Object.hasOwn(captionColors, project.color)) ||
      (project.effect !== undefined && !Object.hasOwn(captionEffects, project.effect))) return false;
  if ((project.captionTemplate !== undefined && !getCaptionTemplate(project.captionTemplate)) ||
      (project.intensity !== undefined && !["full", "gentle", "still"].includes(project.intensity)) ||
      (project.bpm !== undefined && (!Number.isFinite(project.bpm) || project.bpm < 40 || project.bpm > 240)) ||
      (project.captionLayout !== undefined && !["auto", "horizontal"].includes(project.captionLayout))) return false;
  if (project.visualLayers !== undefined) {
    const l = project.visualLayers;
    if (!l || typeof l !== "object" || !Number.isFinite(l.backgroundMotion) || l.backgroundMotion < 0 || l.backgroundMotion > 1 ||
      !Number.isFinite(l.overlayAmount) || l.overlayAmount < 0 || l.overlayAmount > 1 ||
      !Object.hasOwn(overlayDesigns, l.overlayStyle) || typeof l.overlayMotion !== "boolean" ||
      !Number.isFinite(l.beatOffset) || l.beatOffset < 0 || l.beatOffset > 600) return false;
  }
  if (project.languageProfile !== undefined && !isLanguageProfile(project.languageProfile)) return false;
  if (project.pro !== undefined && !isProSettings(project.pro)) return false;
  return project.cues.every((cue, index) => cue && typeof cue.text === "string" && cue.text.trim().length > 0 &&
    cue.text.length <= 180 && Number.isFinite(cue.time) && cue.time >= 0 &&
    (cue.end === undefined || (Number.isFinite(cue.end) && cue.end > cue.time)) &&
    (index === 0 || cue.time > project.cues[index - 1].time) &&
    ([cue.singer, cue.language].every(s => s === undefined || typeof s === "string" && s.length <= 80)) &&
    ([cue.translation, cue.transliteration].every(s => s === undefined || typeof s === "string" && s.length <= 180)) &&
    (cue.role === undefined || ["lead", "backing", "adlib"].includes(cue.role)) &&
    (cue.emphasis === undefined || ["auto", "glow", "color", "pop"].includes(cue.emphasis)) &&
    (cue.accentWords === undefined || (Array.isArray(cue.accentWords) && cue.accentWords.length <= cue.text.length &&
      cue.accentWords.every(offset => Number.isSafeInteger(offset) && offset > 0 && offset <= cue.text.length))) &&
    (cue.words === undefined || (Array.isArray(cue.words) && cue.words.length <= cue.text.length &&
      cue.words.every((word, i) => word && Number.isSafeInteger(word.offset) && word.offset > 0 &&
        word.offset <= cue.text.length && Number.isFinite(word.time) && word.time >= cue.time &&
        (cue.end === undefined || word.time <= cue.end) &&
        (i === 0 || (word.offset > cue.words![i - 1].offset && word.time >= cue.words![i - 1].time)))))) &&
    project.cues.map(cue => cue.text).join("\n").length <= 5000;
}
