export const sectionNames = ["Verse 1", "Chorus", "Verse 2", "Bridge", "Finale"] as const;
type SectionName = typeof sectionNames[number];
export type SectionDirection = { name: SectionName; genre: string; instruments: string; voice: string };

export function isSectionDirections(value: unknown): value is SectionDirection[] {
  if (!Array.isArray(value) || !value.length || value.length > sectionNames.length) return false;
  return value.every(section => section && sectionNames.includes(section.name) &&
    typeof section.genre === "string" && !!section.genre.trim() && section.genre.length <= 80 &&
    typeof section.instruments === "string" && section.instruments.length <= 100 &&
    typeof section.voice === "string" && section.voice.length <= 260) &&
    new Set(value.map(section => section.name)).size === value.length;
}

function sectionName(text?: string) {
  const name = /^\s*\[([^\]\r\n]+)\]/.exec(text ?? "")?.[1].trim().toLowerCase();
  if (name === "verse") return "verse 1";
  if (name === "outro") return "finale";
  if (/^chorus(?:\s+\d+)?$/.test(name ?? "")) return "chorus";
  return name;
}

export function directSections<T extends { text?: string; positive_styles?: unknown }>(
  chunks: T[], directions: SectionDirection[], bpm: string, vocalArrangement: string,
) {
  const lookup = new Map(directions.map(item => [item.name.toLowerCase(), item]));
  const used = new Set<SectionName>();
  const directed = chunks.map(chunk => {
    const match = lookup.get(sectionName(chunk.text) ?? "");
    if (!match) return chunk;
    used.add(match.name);
    return {
      ...chunk,
      positive_styles: [match.genre, bpm, match.instruments, match.voice, vocalArrangement, "carry the song’s melodic motif across sections", "clean, uplifting performance"].filter(Boolean),
      context_adherence: "medium" as const,
    };
  });
  return { chunks: directed, missing: directions.filter(item => !used.has(item.name)).map(item => item.name) };
}
