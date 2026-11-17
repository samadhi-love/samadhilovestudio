import { detectPromptGenres, suggestGenreFusion } from "./genre-assist";
import type { Song } from "./studio-data";

/** Free, local wording help. It suggests from the existing genre catalog and never calls a provider. */
export function expandSongDescription(value: string, history: Song[] = []) {
  const idea = value.trim().replace(/\s+/g, " ");
  if (!idea) return "";
  const explicit = detectPromptGenres(idea);
  const suggestion = suggestGenreFusion(idea, "", history, false).genres[0];
  const style = explicit.length ? explicit.slice(0, 2).join(" and ") : suggestion;
  const styleText = style
    ? `Use a ${style} direction${explicit.length ? "" : " as a starting point"}`
    : "Use a style that fits the idea";
  const language = /\b(?:sing|sung|singing|lyrics?|language)\b|باللغة|غني|غنّي/iu.test(idea)
    ? "Keep the singing language and dialect exactly as described"
    : "Use the singing language I choose; do not guess it from the style";
  return `${idea}. ${styleText}. ${language}. Write coherent, singable lyrics that stay focused on the subject, build toward a memorable chorus, and end with a clear resolution.`;
}

export function insertLyricSection(
  text: string,
  start: number,
  end: number,
  section: string,
) {
  const before = text.slice(0, Math.max(0, start));
  const after = text.slice(Math.max(0, end));
  const leading = before && !before.endsWith("\n") ? "\n\n" : "";
  const label = `[${section}]\n`;
  const trailing = after ? (after.startsWith("\n") ? "" : "\n") : "";
  const insertion = leading + label + trailing;
  return {
    text: before + insertion + after,
    cursor: before.length + leading.length + label.length,
  };
}

export function bestShortStart(
  duration: number,
  sections: readonly { name?: string; time?: number; end?: number }[] = [],
  peaks: readonly number[] = [],
  requestedSeconds = 20,
) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const length = Math.min(duration, Math.max(15, Math.min(30, requestedSeconds)));
  const chorus = sections.find(
    section =>
      /chorus|hook|refrain|لازمة|كورس|припев|nakarat/i.test(section.name ?? "") &&
      Number.isFinite(section.time),
  );
  if (chorus?.time !== undefined) return clampStart(duration, chorus.time, length);

  if (peaks.length) {
    const windowSize = Math.max(1, Math.min(peaks.length, Math.round((length / duration) * peaks.length)));
    const stride = Math.max(1, Math.floor(windowSize / 8));
    let strongestStart = 0;
    let strongestEnergy = -1;
    for (let first = 0; first + windowSize <= peaks.length; first += stride) {
      const energy = peaks.slice(first, first + windowSize).reduce((sum, peak) => sum + (Number.isFinite(peak) ? Math.max(0, peak) : 0), 0) / windowSize;
      if (energy > strongestEnergy) {
        strongestEnergy = energy;
        strongestStart = first / peaks.length * duration;
      }
    }
    if (strongestEnergy > 0) return clampStart(duration, strongestStart, length);
  }
  return 0;
}

function clampStart(duration: number, start: number, length: number) {
  return Math.round(Math.max(0, Math.min(start, duration - length)) * 100) / 100;
}
