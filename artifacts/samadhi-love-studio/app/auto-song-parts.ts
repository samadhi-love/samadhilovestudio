/**
 * Automatic song parts for beginners: plain lyrics in, [Verse 1] / [Chorus] /
 * [Pre-Chorus] / [Bridge] / [Outro] labels out. Lyrics that already carry any
 * section label are the writer's own map and are never touched.
 */
import { productionHeader } from "./lyric-notation";

export const partNames = ["Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Outro"] as const;
export type PartName = typeof partNames[number];

const words = (block: string[]) => new Set(block.join(" ").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean));
function alike(a: string[], b: string[]) {
  const x = words(a), y = words(b);
  if (!x.size || !y.size) return false;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return shared / (x.size + y.size - shared) >= 0.7;
}
const lineKey = (line: string) => line.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "");

/** Most a song is ever split into automatically; anything longer is regrouped. */
export const maxAutoParts = 12;
const sectionWord = /^\s*(?:(?:short|long|soft|final|last|opening|repeated|instrumental)\s+)*(?:pre[ -]?|post[ -]?)?(?:intro|outro|verse|chorus|bridge|hook|refrain|interlude|breakdown|drop|break|solo|finale)\b/i;
/** A [bracketed] label that names a song part, even with extra words: "[CHORUS – Clear]". */
const isSectionTag = (inside: string) => sectionWord.test(inside) || !!productionHeader(`[${inside}]`);

export function hasSongParts(text: string) {
  return text.split(/\r?\n/).some(line => !!productionHeader(line) || [...line.matchAll(/\[([^\]\r\n]{1,60})\]/g)].some(m => isSectionTag(m[1])));
}

/** Puts a part label that was glued onto a sung line ("…built.[Chorus]") on its own line. Words are untouched. */
export function separateInlineParts(text: string) {
  return text.split(/\r?\n/).map(line => {
    if (productionHeader(line)) return line;
    const tags = [...line.matchAll(/\[([^\]\r\n]{1,60})\]/g)].filter(m => isSectionTag(m[1]));
    if (!tags.length) return line;
    let out = line;
    for (const tag of tags.reverse()) {
      const before = out.slice(0, tag.index).trimEnd(), after = out.slice(tag.index! + tag[0].length).trimStart();
      out = [...(before ? [before, ""] : []), tag[0].trim(), ...(after ? [after] : [])].join("\n");
    }
    return out;
  }).join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Split plain lyrics into stanzas: blank lines first, otherwise groups of four lines. */
function stanzas(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line) current.push(line);
    else if (current.length) { blocks.push(current); current = []; }
  }
  if (current.length) blocks.push(current);
  const all = blocks.flat();
  // One line per paragraph (a blank line after almost every line) is a writing style,
  // not dozens of song parts: treat it like lyrics with no blank lines at all.
  const oneLiners = blocks.filter(b => b.length === 1).length;
  const regroup = (size: number) => { const out: string[][] = []; for (let i = 0; i < all.length; i += size) out.push(all.slice(i, i + size)); return out; };
  let result = blocks;
  if ((blocks.length === 1 && blocks[0].length > 6) || (blocks.length > 6 && oneLiners / blocks.length >= 0.6)) result = regroup(4);
  if (result.length > maxAutoParts) result = regroup(Math.max(4, Math.ceil(all.length / maxAutoParts)));
  return result;
}

export function labelParts(blocks: string[][]): PartName[] {
  const n = blocks.length;
  const parts: (PartName | null)[] = Array(n).fill(null);
  if (n < 2) return Array(n).fill("Verse");
  // Chorus: the stanza that comes back most often.
  let best: number[] = [];
  for (let i = 0; i < n; i++) {
    const group = blocks.map((b, j) => alike(blocks[i], b) ? j : -1).filter(j => j >= 0);
    if (group.length > best.length) best = group;
  }
  if (best.length < 2) {
    // No whole stanza repeats: the stanza holding the most repeated line is the hook.
    const counts = new Map<string, number>();
    for (const b of blocks) for (const l of new Set(b.map(lineKey))) if (l) counts.set(l, (counts.get(l) ?? 0) + 1);
    let hook = "", top = 1;
    for (const [l, c] of counts) if (c > top) { hook = l; top = c; }
    best = hook ? blocks.map((b, j) => b.some(l => lineKey(l) === hook) ? j : -1).filter(j => j >= 0) : [];
  }
  for (const j of best) parts[j] = "Chorus";
  const choruses = best;
  if (choruses.length) {
    const first = choruses[0], last = choruses.at(-1)!;
    // Intro: a short opening stanza before anything else when the song is long enough.
    if (parts[0] === null && blocks[0].length <= 2 && n >= 4) parts[0] = "Intro";
    // Pre-Chorus: a short stanza right before a chorus that follows another non-chorus stanza.
    for (const c of choruses) {
      const p = c - 1;
      if (p >= 1 && parts[p] === null && blocks[p].length <= 4 && parts[p - 1] !== "Chorus" && parts[p - 1] !== "Pre-Chorus") {
        const other = choruses.map(x => x - 1).filter(x => x !== p && x >= 0 && parts[x] !== "Chorus");
        // Only a real build-up: it repeats before another chorus, or it's shorter than the verse before it.
        if (other.some(x => alike(blocks[x], blocks[p])) || blocks[p].length < blocks[p - 1].length) parts[p] = "Pre-Chorus";
      }
    }
    for (const c of choruses) if (parts[c - 1] === "Pre-Chorus") for (let i = 0; i < n; i++) if (parts[i] === null && i !== c - 1 && alike(blocks[i], blocks[c - 1])) parts[i] = "Pre-Chorus";
    // Outro: a final stanza after the last chorus.
    if (last < n - 1 && parts[n - 1] === null && n - 1 > first) parts[n - 1] = "Outro";
    // Bridge: a one-time stanza between two choruses, after the second chorus.
    if (choruses.length >= 2) {
      for (let i = choruses[1] + 1; i < last; i++) if (parts[i] === null && !blocks.some((b, j) => j !== i && alike(b, blocks[i]))) { parts[i] = "Bridge"; break; }
    }
  } else if (n >= 3 && blocks[n - 1].length <= 2) parts[n - 1] = "Outro";
  return parts.map(p => p ?? "Verse");
}

/** Plain lyrics → labeled lyrics. Lyrics with the writer's own labels only get glued labels moved
 * onto their own line (kind "separated"). Returns null when nothing needs to change. */
export function autoSongParts(text: string): { text: string; parts: string[]; kind?: "separated" } | null {
  if (!text.trim()) return null;
  if (hasSongParts(text)) {
    const separated = separateInlineParts(text);
    return separated === text ? null : { text: separated, parts: [], kind: "separated" };
  }
  const blocks = stanzas(text);
  if (blocks.length < 2) return null;
  const parts = labelParts(blocks);
  let verse = 0;
  const names = parts.map(p => p === "Verse" ? `Verse ${++verse}` : p);
  if (verse === 1) names[names.indexOf("Verse 1")] = "Verse";
  return { text: blocks.map((b, i) => `[${names[i]}]\n${b.join("\n")}`).join("\n\n"), parts: names };
}

/** The labels a writer can tap and change, in order. */
export function songPartHeadings(text: string) {
  return text.split(/\r?\n/).flatMap((line, index) => {
    const header = productionHeader(line);
    return header ? [{ index, name: header.name }] : [];
  });
}

/** Change one part label (by line number) without touching any lyric line. Verses are renumbered. */
export function relabelPart(text: string, lineIndex: number, part: PartName) {
  const lines = text.split(/\r?\n/);
  if (!productionHeader(lines[lineIndex] ?? "")) return text;
  lines[lineIndex] = `[${part}]`;
  const verses = lines.map((l, i) => /^\s*\[verse(?:\s+\d+)?\]\s*$/i.test(l) ? i : -1).filter(i => i >= 0);
  verses.forEach((i, k) => { lines[i] = verses.length > 1 ? `[Verse ${k + 1}]` : "[Verse]"; });
  return lines.join("\n");
}
