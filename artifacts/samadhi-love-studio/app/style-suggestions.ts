import { sameGenre } from "./music-genres";

export const styleLimit = 500;
export type StyleCategory = "genre" | "beat" | "regional";
export const styleCategories: { id: StyleCategory; label: string }[] = [
  { id: "genre", label: "Genre" }, { id: "beat", label: "Beat" }, { id: "regional", label: "Regional style" },
];
export const styleSuggestions: Record<StyleCategory, readonly string[]> = {
  genre: ["Pop", "R&B", "Melodic House", "Acoustic", "Hip-hop", "Trance", "Jazz", "Cinematic", "Gospel", "Ambient", "Rock", "Soul", "Synth Pop", "Deep House", "Country", "Lo-fi"],
  beat: ["Four-on-the-floor", "Slow ballad groove", "Boom bap drums", "Trap hi-hats", "Half-time groove", "Driving dance beat", "Swing shuffle", "Gentle heartbeat pulse", "Afro percussion groove", "Reggaeton dembow", "Breakbeat", "Hand-clap rhythm"],
  regional: ["Lebanese Dabke", "Arabian Euro House", "Khaleeji", "Afrobeats", "Amapiano", "Bollywood", "Flamenco Fusion", "Bossa Nova", "Celtic Folk", "K-Pop", "Balkan Brass", "Qawwali", "Latin Pop", "Fado", "Gnawa", "Bhangra"],
};

/** Exactly four suggestions per batch, wrapping around the list. */
export function suggestionBatch(list: readonly string[], batch: number, size = 4): string[] {
  if (!list.length) return [];
  const start = ((batch * size) % list.length + list.length) % list.length;
  return Array.from({ length: Math.min(size, list.length) }, (_, i) => list[(start + i) % list.length]);
}
export function batchCount(list: readonly string[], size = 4) { return Math.max(1, Math.ceil(list.length / size)); }

const parts = (text: string) => text.split(",").map(p => p.trim()).filter(Boolean);
export function hasStyle(text: string, name: string) { return parts(text).some(p => sameGenre(p, name)); }
export function pickedStyles(text: string, catalog: readonly string[]) { return parts(text).filter(p => catalog.some(c => sameGenre(c, p))); }

/** Add a suggestion to the end of the typed text without touching the user's wording. Returns null if it would exceed the limit. */
export function addStyle(text: string, name: string, limit = styleLimit): string | null {
  if (hasStyle(text, name)) return text;
  const base = text.replace(/[\s,]+$/, "");
  const next = base ? `${base}, ${name}` : name;
  return next.length > limit ? null : next;
}
/** Remove only the comma-separated part matching the suggestion; all other typed text stays. */
export function removeStyle(text: string, name: string): string {
  const segments = text.split(",");
  const kept = segments.filter(s => !(s.trim() && sameGenre(s.trim(), name)));
  if (kept.length === segments.length) return text;
  return kept.map((s, i) => i === 0 ? s.replace(/^\s+/, "") : s).filter(s => s.trim()).join(",").replace(/^\s+|[\s,]+$/g, "").replace(/,(?=\S)/g, ", ");
}
