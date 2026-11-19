import type { Studio } from "./studio-data";

/**
 * What a save actually changed, relative to the library the server confirmed
 * at the same revision. The server rebuilds the full library from its stored
 * copy and validates it exactly as it validates a full save.
 */
export type StudioChanges = { songs: Studio["songs"]; fields: Record<string, unknown>; unset: string[] };

const blockedKeys = new Set(["songs", "__proto__", "constructor", "prototype"]);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Same existing songs in the same order (new songs may only be added in front). */
export function canSendChanges(saved: Studio, next: Studio) {
  const savedIds = saved.songs.map(song => song.id), known = new Set(savedIds);
  const kept = next.songs.map(song => song.id).filter(id => known.has(id));
  return !saved._storage && !next._storage && same(kept, savedIds) &&
    next.songs.findIndex(song => known.has(song.id)) === next.songs.filter(song => !known.has(song.id)).length;
}

export function studioChanges(saved: Studio, next: Studio): StudioChanges {
  const stored = new Map(saved.songs.map(song => [song.id, JSON.stringify(song)]));
  const songs = next.songs.filter(song => stored.get(song.id) !== JSON.stringify(song));
  const fields: Record<string, unknown> = {}, unset: string[] = [];
  const before = saved as unknown as Record<string, unknown>, after = next as unknown as Record<string, unknown>;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (key === "songs" || same(after[key], before[key])) continue;
    if (after[key] === undefined) unset.push(key); else fields[key] = after[key];
  }
  return { songs, fields, unset };
}

export function isStudioChanges(value: unknown): value is StudioChanges {
  const changes = value as StudioChanges | null;
  return !!changes && typeof changes === "object" &&
    Array.isArray(changes.songs) && changes.songs.every(song => !!song && typeof song === "object" && typeof song.id === "string") &&
    !!changes.fields && typeof changes.fields === "object" && !Array.isArray(changes.fields) &&
    Object.keys(changes.fields).every(key => !blockedKeys.has(key)) &&
    Array.isArray(changes.unset) && changes.unset.every(key => typeof key === "string" && !blockedKeys.has(key));
}

/** Rebuild the full library: changed songs replace stored ones, new songs go first. */
export function applyStudioChanges(saved: Studio, changes: StudioChanges): Studio {
  const merged = { ...saved } as unknown as Record<string, unknown>;
  for (const key of changes.unset) delete merged[key];
  for (const [key, value] of Object.entries(changes.fields)) merged[key] = value;
  const replaced = new Map(changes.songs.map(song => [song.id, song]));
  const storedIds = new Set(saved.songs.map(song => song.id));
  merged.songs = [...changes.songs.filter(song => !storedIds.has(song.id)), ...saved.songs.map(song => replaced.get(song.id) ?? song)];
  return merged as unknown as Studio;
}
