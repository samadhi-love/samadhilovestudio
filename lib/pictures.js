// Which pictures the site uses. Pictures live in public/candidates/<subject>/ and their
// credits in public/candidates/candidates.json (gathered on Replit, free licences only).
// `chosen` is filled in once Samadhi picks his favourites on the private /choose page.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const candidatesDir = path.join(root, "public", "candidates");

// subject slug -> file path under public/ (for example "candidates/giza/giza-2.jpg")
export const chosen = {};

// Which sacred place sits behind each page (never the home page).
export const placeForPage = {
  teachings: "jerusalem",
  masters: "mount-kailash",
  "star-family": "stonehenge",
  philosophers: "baalbek",
  wisdom: "angkor-wat",
  music: "machu-picchu",
  videos: "giza",
  podcasts: "mount-kailash",
  gallery: "taj-mahal",
  about: "baalbek",
  contact: "giza",
  credits: "angkor-wat",
};

export function candidates() {
  const file = path.join(candidatesDir, "candidates.json");
  if (!existsSync(file)) return [];
  try {
    const list = JSON.parse(readFileSync(file, "utf8"));
    const items = Array.isArray(list) ? list : Array.isArray(list.images) ? list.images : [];
    return items.filter((it) => it && typeof it === "object");
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

export function pictureFor(slug) {
  const key = pictureFolder[slug] || slug;
  return chosen[key] || chosen[slug] || null;
}

export function creditFor(file) {
  return candidates().map(describe).find((c) => c.file === file) || null;
}

// Only serve real picture files that sit inside public/candidates.
export function safeCandidatePath(urlPath) {
  if (!/^\/candidates\/[a-z0-9-]+\/[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i.test(urlPath)) return null;
  const full = path.normalize(path.join(root, "public", urlPath));
  return full.startsWith(candidatesDir + path.sep) ? full : null;
}
