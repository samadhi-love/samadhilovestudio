import { productionPolish } from "./production-polish";

/**
 * Sound-quality direction for every vocal or instrumental song plan.
 * The music engine reads short style tags best and reads at most 20 per section,
 * so the quality tags sit right after the first user styles (never cut) and each song part gets its own role,
 * which gives the song a real build instead of one flat level from start to end.
 */

export const maxStyleTags = 20;

/** Short tags the engine reads well. Kept first in every section. */
export const qualityTags = [
  "studio-quality production",
  "rich layered instrumentation",
  "wide stereo image",
  "radio-ready mix and master",
];

/** Extra tags for sections with a singer. */
export const vocalQualityTags = [
  "expressive emotional lead vocal",
  "natural vibrato",
];

/** What we never want: added to every section's avoid list. */
export const qualityNegatives = [
  "flat lifeless dynamics",
  "thin weak production",
  "monotone vocal delivery",
  "dry amateur vocal",
];

/** Clear words without a bare, plain sound (replaces the old "restrained reverb, no ad-libs" direction). */
export const clearButRichVocals =
  "Vocal production: clear forward intelligible lead vocal with crisp consonants on top of a full rich arrangement; tasteful reverb and delay; warm backing harmonies in choruses; follow the approved lyrics and section order exactly.";

type Role = { name: string; tags: string[] };

const roles: [RegExp, Role][] = [
  [/pre[- ]?chorus|build|lift/, { name: "pre-chorus", tags: ["building energy", "rising tension into the chorus"] }],
  [/post[- ]?chorus/, { name: "post-chorus", tags: ["full energy", "catchy vocal hook"] }],
  [/chorus|hook|refrain/, { name: "chorus", tags: ["big full chorus", "layered backing harmonies", "soaring lead vocal", "bigger drums"] }],
  [/bridge|middle 8/, { name: "bridge", tags: ["contrasting bridge", "new harmonic colour"] }],
  [/intro/, { name: "intro", tags: ["atmospheric intro", "inviting opening"] }],
  [/outro|ending|coda/, { name: "outro", tags: ["satisfying outro", "gently winding down"] }],
  [/drop|breakdown/, { name: "drop", tags: ["powerful drop", "full low end"] }],
  [/instrumental|solo|interlude/, { name: "instrumental", tags: ["featured instrumental melody", "expressive playing"] }],
  [/verse|rap/, { name: "verse", tags: ["intimate verse", "groove-led arrangement"] }],
];

/** The role of a section, read from its first [Heading]. */
export function sectionRole(text: string | undefined): Role | null {
  const heading = /^\s*\[([^\]]{1,60})\]/.exec(text ?? "")?.[1]?.toLowerCase();
  if (!heading) return null;
  for (const [pattern, role] of roles) if (pattern.test(heading)) return role;
  return null;
}

/** Pieces of the long production sentences, already covered by the short quality tags. */
const pieces = (text: string) => text.split(/[,;\n]/).map(part => part.trim().toLowerCase()).filter(Boolean);
// Drums and hook pieces stay (the quality tags do not say them); the general "polished mix / full arrangement" pieces go.
const covered = new Set([...pieces("Production: " + productionPolish + "."), ...pieces(productionPolish) ].filter(piece => !/drums|hook/.test(piece)));

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()) : [];
}

/** True when a section has words to sing (not only a heading or a cue). */
function hasSungWords(text: string | undefined) {
  return !!(text ?? "").replace(/\[[^\]]*\]|\{[^}]*\}|\([^)]*\)/g, "").trim();
}

/**
 * Put quality first, add each part's role, keep the user's own styles after them,
 * and add the quality avoid-list. Never more than 20 positive tags.
 */
export function polishChunks<T extends { text?: string; positive_styles?: unknown; negative_styles?: unknown }>(chunks: T[], options: { instrumental?: boolean } = {}): T[] {
  return chunks.map(chunk => {
    const own = strings(chunk.positive_styles);
    // The singer direction (added for the chosen voice) stays first so the voice never gets cut.
    const vocal = own.filter(style => /^Vocal performance direction:/i.test(style));
    // "Avoid …" rules are already in the avoid list; as positive tags they only waste the 20 slots.
    const kept = own.filter(style => !vocal.includes(style) && !/^avoid\b|profanity|sexually explicit|graphic violence|degrading|\bhate\b/i.test(style) && !covered.has(style.trim().toLowerCase()));
    // A long direction is often also sent chopped into pieces; the pieces only repeat it and use up slots.
    const rest = kept.filter(style => { const piece = style.toLowerCase().replace(/[.\s]+$/, ""); return !kept.some(other => other !== style && other.length > style.length && other.toLowerCase().includes(piece)); });
    const role = sectionRole(chunk.text);
    const singing = !options.instrumental && hasSungWords(chunk.text);
    // The user's first styles (genre, voice, mood) stay ahead of the quality tags; quality comes next, so neither is ever cut.
    const ordered = [...vocal, ...rest.slice(0, 6), ...qualityTags, ...(singing ? vocalQualityTags : []), ...(role?.tags ?? []), ...rest.slice(6)];
    const seen = new Set<string>();
    const positive = ordered.filter(style => { const key = style.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, maxStyleTags);
    const avoid = strings(chunk.negative_styles);
    // Never ask the engine to avoid a sound the user asked for (lo-fi, dry, raw, minimal, deadpan...).
    const wantsRaw = rest.some(style => /lo-?fi|\bdry\b|\braw\b|minimal|sparse|monotone|deadpan|spoken/i.test(style));
    const negatives = wantsRaw ? avoid : [...avoid, ...qualityNegatives.filter(n => !avoid.some(a => a.toLowerCase() === n))];
    return { ...chunk, positive_styles: positive, negative_styles: negatives };
  });
}
