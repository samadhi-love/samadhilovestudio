import { notationStyles, parseLyricNotation, productionHeader } from "./lyric-notation";
export const lyricStyleHeader = productionHeader;
export function lyricStyleLine(line: string) { return /^\s*\{\s*(?:genre|style|fusion)\s*:\s*([^{}\r\n]*)\}\s*$/i.exec(line)?.[1].trim(); }
export function lyricStyleCues(text: string) {
  const cues: { section: string; genre: string }[] = [], errors: string[] = [...parseLyricNotation(text).errors];
  let section = "Opening";
  for (const line of text.split(/\r?\n/)) {
    const header = lyricStyleHeader(line); if (header) section = header.name;
    const genre = header?.genre ?? lyricStyleLine(line);
    if (genre === undefined) continue;
    if (!genre || genre.length > 160 || /[\[\]{}]/.test(genre) || !section || section.length > 80) errors.push("Use a section name up to 80 characters and a genre direction of 1–160 characters.");
    else cues.push({ section, genre });
  }
  return { cues, errors };
}

/** Provider text is a derivative; source lyrics and their exact notation remain saved separately. */
export function productionLyricChunks(lyrics: string, readStyles: boolean, repeatHeadings: boolean, names: readonly string[] = []) {
  const parsed = parseLyricNotation(lyrics);
  if (parsed.errors.length) throw new Error(parsed.errors[0]);
  const rawLines = lyrics.split("\n"), cleanLines = parsed.text.split("\n");
  const sections: { text: string; genre?: string; directions?: string[] }[] = [];
  let current = "", heading = "", genre: string|undefined, local: string[] = [];
  const global: string[] = [];
  const emit = () => { if (current.trim()) sections.push({ text: current.trim(), genre, ...(global.length||local.length ? {directions:[...global,...local]} : {}) }); };
  for (let index=0; index<rawLines.length; index++) {
    const raw = rawLines[index], header = lyricStyleHeader(raw,names), cue = lyricStyleLine(raw);
    if (header) { emit(); genre = readStyles ? header.genre : undefined; heading = header.heading; current = heading+"\n"; local = header.direction ? [header.direction] : []; continue; }
    const directions = parsed.directions.filter(d=>d.line===index);
    for (const direction of directions) {
      if (cue !== undefined) { if (readStyles) genre=cue; continue; }
      // Inline explicit genre labels also stay in production metadata, never in performed text.
      const coded = /^(?:genre|style|fusion)\s*:\s*(.*)$/i.exec(direction.text);
      if (direction.delimiter === "{" && coded) { if (readStyles) genre=coded[1].trim(); continue; }
      (heading ? local : global).push(direction.text);
    }
    const text = cleanLines[index] ?? "";
    if (current.trim() && current.length + text.length > 800) { emit(); current = (repeatHeadings || genre) && heading ? heading+"\n" : ""; }
    current += text+"\n";
  }
  emit();
  return sections;
}

/** Last provider boundary: remove prose notes even when a planner or section tool inserted them. */
export function applyChunkStyleCues<T extends { text?: string; positive_styles?: unknown }>(chunks: T[], enabled = true, names: readonly string[] = []) {
  return chunks.map(chunk => {
    const text = chunk.text ?? "", parsed = parseLyricNotation(text);
    if (parsed.errors.length) throw new Error(parsed.errors[0]);
    if (!parsed.directions.length) return chunk;
    const originalLines = text.split("\n"), cleanLines = parsed.text.split("\n"), notes: string[] = [];
    const genres = lyricStyleCues(text);
    for (const direction of parsed.directions) {
      const header = productionHeader(originalLines[direction.line] ?? "",names);
      if (header && direction.delimiter === "[") { cleanLines[direction.line]=header.heading; if(header.direction)notes.push(header.direction); }
      else if (!(direction.delimiter === "{" && /^(?:genre|style|fusion)\s*:/i.test(direction.text))) notes.push(direction.text);
    }
    const styles = Array.isArray(chunk.positive_styles) ? chunk.positive_styles.filter((s): s is string => typeof s === "string") : [];
    const additions = [...(enabled&&!genres.errors.length ? genres.cues.map(c=>c.genre) : []),...notationStyles(notes)];
    const cleaned = cleanLines.map(line=>line.replace(/[\t ]+/g," ").trim()).filter(Boolean).join("\n");
    return { ...chunk, text: cleaned, positive_styles: [...new Set([...additions,...styles])].slice(0,20) };
  });
}
export { notationStyles };

export function lyricDirectionScopes(text: string, enabled = true, names: readonly string[] = []) {
  const parsed = parseLyricNotation(text);
  if (parsed.errors.length) throw new Error(parsed.errors[0]);
  const global: string[] = [], sections: { name: string; notes: string[]; genre?: string }[] = [];
  for (const [index,line] of text.split("\n").entries()) {
    const header = productionHeader(line,names);
    if (header) { sections.push({name:header.name,notes:header.direction ? [header.direction] : [],...(enabled&&header.genre?{genre:header.genre}:{})}); continue; }
    for (const direction of parsed.directions.filter(d=>d.line===index)) {
      const genre = direction.delimiter === "{" && /^(?:genre|style|fusion)\s*:\s*(.*)$/i.exec(direction.text);
      const section = sections.at(-1);
      if (genre) { if(enabled&&section)section.genre=genre[1].trim(); else if(enabled)global.push(genre[1].trim()); }
      else (section ? section.notes : global).push(direction.text);
    }
  }
  return { global, sections };
}

/** Most sections the music engine accepts, and the longest text one section may carry. */
export const maxEngineSections = 30, maxSectionChars = 800;
/** Joins neighbouring sections (shortest pair first) until there are at most `limit`, never
 * letting one section grow past maxSectionChars. Every word, heading and direction is kept in order.
 * Returns null when the lyrics are simply too long to fit. */
export function fitSections<T extends { text: string; genre?: string; directions?: string[] }>(sections: T[], limit: number): T[] | null {
  if (limit < 1) return null;
  const out = sections.map(s => ({ ...s }));
  while (out.length > limit) {
    let best = -1, size = Infinity;
    for (let i = 0; i + 1 < out.length; i++) {
      const joined = out[i].text.length + 2 + out[i + 1].text.length;
      if (joined <= maxSectionChars && joined < size) { best = i; size = joined; }
    }
    if (best < 0) return null;
    const a = out[best], b = out[best + 1];
    const directions = [...(a.directions ?? []), ...(b.directions ?? [])];
    out.splice(best, 2, { ...a, text: `${a.text}\n\n${b.text}`, genre: a.genre ?? b.genre, ...(directions.length ? { directions: [...new Set(directions)] } : {}) });
  }
  return out;
}
