// The numbered replacement list (Samadhi's picture rules, Nov 2026).
// Put a file named 01.jpg (or .png / .webp) in public/images/replacements/ and it takes the place of
// picture 01 automatically. Every slot is OPTIONAL: nothing is switched off waiting for a replacement, and until a file exists the page keeps showing what it shows now.
// Numbers never change once given (09 and 10 were withdrawn by Samadhi: those pictures stay). The same list, in words, is in public/images/replacements/LIST.md.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const replacementsDir = path.join(root, "public", "images", "replacements");
const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

const star = (n, slug, name) => ({ n, place: `star:${slug}`, where: `Star Family tab, page "${name}" (/teachings/${slug})`, replaces: `OPTIONAL. The current ${name} portrait (it stays unless a new picture is added)`,
  wants: `Optional: a new portrait of the ${name} as beings of light, if Samadhi wishes to change it`, shape: "tall", min: "896 × 1200", width: 896, height: 1200, alt: `The ${name}, artwork for SAMADHI LOVE` });

export const REPLACEMENTS = [
  star("01", "andromedans", "Andromedans"),
  star("02", "arcturians", "Arcturians"),
  star("03", "humans", "Humans"),
  star("04", "lyrans", "Lyrans"),
  star("05", "orions-of-light", "Orions of Light"),
  star("06", "pleiadians", "Pleiadians"),
  star("07", "sirians", "Sirians"),
  { n: "08", place: "tab:prayers", where: "Prayers tab, the wide picture under Samadhi's quote (/library?tab=prayers)", replaces: "OPTIONAL. prayer-golden.jpg (it stays unless a new picture is added)",
    wants: "Optional: a new picture of the peoples of the world in prayer beneath beings of light, with calm open sky in the top-left corner for the quote", shape: "wide", min: "1600 × 900", width: 1600, height: 900, alt: "Peoples of the world in prayer beneath beings of light of many skin tones" },
  { n: "11", place: "page:galactic-federation-of-light", where: "Star Family tab, page \"The Galactic Federation of Light\" (/teachings/galactic-federation-of-light)", replaces: "OPTIONAL. galactic-federation.jpg (it stays unless a new picture is added)",
    wants: "Optional: a new picture of a council of star beings around a round table with a glowing galaxy", shape: "wide", min: "960 × 536", width: 960, height: 536, alt: "A council of star beings of many kinds around a table glowing with a galaxy" },
];

const byNumber = new Map(REPLACEMENTS.map((r) => [r.n, r]));
const byPlace = new Map(REPLACEMENTS.map((r) => [r.place, r]));

// The replacement picture for a number, if its file is in the folder: { src, width, height, alt } or null.
export function replacement(n) {
  const r = byNumber.get(n);
  if (!r) return null;
  for (const ext of Object.keys(TYPES)) {
    if (existsSync(path.join(replacementsDir, `${n}.${ext}`))) return { src: `/images/replacements/${n}.${ext}`, width: r.width, height: r.height, alt: r.alt };
  }
  return null;
}
export const replacementAt = (place) => { const r = byPlace.get(place); return r ? replacement(r.n) : null; };

// For the server: /images/replacements/NN.ext -> [file, type], only for numbers on the list.
export function replacementFile(pathname) {
  const m = /^\/images\/replacements\/(\d{2})\.(jpg|png|webp)$/.exec(pathname);
  if (!m || !byNumber.has(m[1])) return null;
  return [`public/images/replacements/${m[1]}.${m[2]}`, TYPES[m[2]]];
}

export function listMarkdown() {
  const rows = REPLACEMENTS.map((r) => `| ${r.n} | ${r.where} | ${r.replaces} | ${r.wants} | ${r.shape} | ${r.min} |`).join("\n");
  return `# Replacement pictures\n\nPut a picture named with its number (for example \`01.jpg\`, \`01.png\` or \`01.webp\`) in this folder and it replaces that place automatically. Until then, the page keeps what it shows now. Numbers never change (09 and 10 were withdrawn: those pictures stay as they are).\n\nEvery slot is OPTIONAL: nothing is switched off waiting for a replacement. Mystery-school symbols, masters, angels and star beings are welcome. Pictures must be free or properly licensed, with credits on the Picture credits page.\n\n| Number | Where it shows (tab and page) | What it replaces | What the new picture should show | Shape | Minimum size in pixels |\n|---|---|---|---|---|---|\n${rows}\n`;
}
