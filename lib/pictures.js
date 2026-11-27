// Which pictures the site uses. Pictures live in public/candidates/<subject>/ and their
// credits in public/candidates/candidates.json (gathered on Replit, free licences only).
// `chosen` is filled in once Samadhi picks his favourites on the private /choose page.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { starPictures } from "./starnations.js";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const candidatesDir = path.join(root, "public", "candidates");

// subject slug -> file path under public/ (for example "candidates/giza/giza-2.jpg")
// Starting picks made by Claude so the backdrops show; Samadhi can swap any of them from /choose.
// A pick only shows if its file is really there, so a missing picture never breaks a page.
const picks = {
  "giza": "candidates/giza/sphinx-and-pyramids.jpg",
  "jerusalem": "candidates/jerusalem/dome-at-sunset.jpg",
  "baalbek": "candidates/baalbek/jupiter-and-bacchus.jpg",
  "stonehenge": "candidates/stonehenge/field-at-sunset.jpg",
  "taj-mahal": "candidates/taj-mahal/reflecting-pool.jpg",
  "angkor-wat": "candidates/angkor-wat/dawn-reflections.jpg",
  "machu-picchu": "candidates/machu-picchu/dawn-panorama.jpg",
  "mount-kailash": "candidates/mount-kailash/north-face.jpg",
  "jesus": "candidates/jesus/head-of-christ.jpg",
  "mary": "candidates/mary/virgin-in-prayer.jpg",
  "archangel-michael": "candidates/archangel-michael/rublev-archangel-michael.jpg",
  "buddha": "candidates/buddha/gandhara-standing-buddha.jpg",
  "kuan-yin": "candidates/kuan-yin/white-robed-guanyin.jpg",
  "archangels-gabriel-raphael": "candidates/archangels-gabriel-raphael/three-archangels-and-tobias.jpg",
  "count-saint-germain": "candidates/count-saint-germain/nicolas-thomas-engraving.jpg",
};
export const chosen = Object.fromEntries(Object.entries(picks).filter(([, f]) => existsSync(path.join(root, "public", f))));

// Star family portraits, AI-painted for SAMADHI LOVE (FLUX 1.1 Pro Ultra, see scripts/paint-star-families.mjs).
// They live in public/candidates/<family>-portrait/ and appear in the chooser. A family's page keeps its
// drawn figure until Samadhi picks a portrait here, for example
//   pleiadians: "candidates/pleiadians-portrait/pleiadians-2.jpg",
const portraitPicks = {
};
export const portraitFamilies = ["lyrans", "pleiadians", "sirians", "arcturians", "andromedans", "orions-of-light"];
export const portraitCaption = "AI-painted artwork for SAMADHI LOVE, as the teachings describe them.";
export const portraitChosen = Object.fromEntries(Object.entries(portraitPicks).filter(([, f]) => existsSync(path.join(root, "public", f))));
export const portraitFor = (slug) => portraitChosen[slug] || null;

// Which gathered picture sits behind each inner page (never the home page).
export const placeForPage = {
  teachings: "jerusalem",
  masters: "mount-kailash",
  "star-family": "milky-way-hd",
  philosophers: "parthenon",
  wisdom: "angkor-wat",
  "sages-and-kings": "baalbek",
  mystics: "taj-mahal",
  chakras: "orion-nebula",
  "sacred-geometry": "milky-way-hd",
  "sacred-texts": "jerusalem",
  prophets: "orion-hd",
  practices: "pleiades-hd",
  "sacred-lands": "jerusalem",
  start: "milky-way-hd",
  "souls-journey": "pleiades-hd",
  "mystery-schools": "orion-hd",
  "daily-life": "machu-picchu",
  "human-story": "giza",
  "beyond-the-veil": "pleiades-hd",
  "great-flood": "giza",
  knowledge: "machu-picchu",
  "ages-of-the-world": "milky-way-hd",
  music: "lyra-hd",
  videos: "orion-hd",
  podcasts: "delphi",
  gallery: "pleiades-hd",
  about: "stonehenge",
  contact: "venus-hd",
  credits: "machu-picchu",
};

// Retain the original files and manifest records, but do not display these
// reviewed artworks containing nudity or offer them as picture fallbacks.
const retiredPictures = new Set([
  "candidates/the-deluge-dore/01-deluge.jpg",
  "candidates/the-deluge-dore/02-deluge-cropped.jpg",
  "candidates/the-deluge-michelangelo/01-deluge.jpg",
  "candidates/the-deluge-michelangelo/02-deluge-book-scan.jpg",
  "candidates/school-of-athens/01-school-of-athens.jpg",
  "candidates/death-of-socrates/01-death-of-socrates.jpg",
  "candidates/mary/sistine-madonna.jpg",
  "candidates/mary/immaculate-conception.jpg",
  "candidates/archangel-michael/michael-defeats-satan.jpg",
  "candidates/archangel-michael/saint-michael-vanquishing-satan.jpg",
]);

let cache = { at: 0, list: [] };
// The picture list, re-read at most every 30 seconds (it changes only when pictures are added).
export function candidates() {
  if (Date.now() - cache.at < 30_000) return cache.list;
  cache = { at: Date.now(), list: readCandidates() };
  return cache.list;
}

function readCandidates() {
  const file = path.join(candidatesDir, "candidates.json");
  if (!existsSync(file)) return [];
  try {
    const list = JSON.parse(readFileSync(file, "utf8"));
    const items = Array.isArray(list) ? list : Array.isArray(list.images) ? list.images : [];
    return items.filter((it) => it && typeof it === "object" && !retiredPictures.has(describe(it).file));
  } catch {
    return [];
  }
}

// Normalise one candidate record, whatever exact key names Replit used.
export function describe(it) {
  const pick = (...keys) => { for (const k of keys) if (it[k]) return String(it[k]); return ""; };
  const raw = pick("file", "path", "file_path", "filePath", "src");
  const file = raw.replace(/^\/+/, "").replace(/^public\//, "");
  return {
    subject: pick("subject", "name"),
    slug: pick("subject_slug", "subjectSlug", "slug").toLowerCase(),
    file,
    title: pick("title", "work", "work_title", "workTitle"),
    author: pick("artist", "author", "photographer", "artist_or_photographer", "creator"),
    license: pick("licence", "license", "license_name", "licenseName", "licence_name"),
    licenseUrl: pick("licence_link", "license_link", "license_url", "licenseUrl", "licence_url"),
    changes: pick("changes"),
    source: pick("commons_file_page_url", "commons_url", "commonsUrl", "source", "source_url", "file_page", "commons_file_page"),
  };
}

// Gallery names that are filed under a different picture folder.
const pictureFolder = { "saint-germain": "count-saint-germain", "mount-kailash": "mount-kailash" };

// A chosen picture, or else the first picture gathered for that subject (so new folders show straight away).
export function pictureFor(slug) {
  const key = pictureFolder[slug] || slug;
  if (chosen[key] || chosen[slug]) return chosen[key] || chosen[slug];
  const first = candidates().map(describe).find((c) => c.slug === key && c.file && existsSync(path.join(root, "public", c.file)));
  return first ? first.file : null;
}

// Pictures shown at the top of particular teaching pages (subject folder in public/candidates).
export const pictureForTeaching = {
  "philosophers-on-the-human-path": "parthenon",
  "death-of-socrates": "socrates-bust",
  "socrates": "socrates-bust",
  "plato": "plato-bust",
  "allegory-of-the-cave": "plato-bust",
  "aristotle": "aristotle-bust",
  "pythagoras-music-of-numbers": "pythagoras-bust",
  "the-thinkers": "parthenon",
  "the-stoics": "marcus-aurelius-statue",
  "marcus-aurelius": "marcus-aurelius-statue",
  "diogenes-and-alexander": "delphi",
  "solon-and-croesus": "delphi",
  // Reviewed, non-nude pictures for the Great Flood teachings.
  "the-great-flood": ["flood-tablet", "giza"],
  "flood-stories-of-the-world": ["flood-tablet", "baalbek"],
  "when-the-ice-melted": ["doggerland-map", "giza"],
  "great-civilizations-and-the-fall": ["baalbek", "flood-tablet"],
  "the-great-cycle": "milky-way-hd",
  "the-four-yugas": "mount-kailash",
  "the-rising-ages": "andromeda-hd",
  "hesiods-five-ages": "parthenon",
  "the-astrological-ages": "pleiades-hd",
  "stone-bronze-and-iron-in-history": "giza",
  "the-golden-age-to-come": "orion-hd",
  ...starPictures,
};

export function creditFor(file) {
  return candidates().map(describe).find((c) => c.file === file) || null;
}

// Only serve real picture files that sit inside public/candidates.
export function safeCandidatePath(urlPath) {
  if (!/^\/candidates\/[a-z0-9-]+\/[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i.test(urlPath)) return null;
  const full = path.normalize(path.join(root, "public", urlPath));
  return full.startsWith(candidatesDir + path.sep) ? full : null;
}

// Backdrops are shown faint and soft, so a smaller copy is used when one exists:
// "giza/sphinx.jpg" -> "giza/sphinx.w960.jpg" (made on Replit; the original stays untouched).
export function backdropFor(file) {
  if (!file) return null;
  const small = file.replace(/\.(jpe?g|png|webp)$/i, ".w960.jpg");
  return small !== file && existsSync(path.join(root, "public", small)) ? small : file;
}
