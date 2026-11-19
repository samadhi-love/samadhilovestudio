import type { Song, Studio } from "./studio-data";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Fields changed from `base` to `next` win; every other field keeps `latest`. */
function rebaseFields<T extends object>(base: T, next: T, latest: T): T {
  const merged = { ...latest } as Record<string, unknown>;
  const before = base as Record<string, unknown>, after = next as Record<string, unknown>;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)]))
    if (!same(after[key], before[key])) merged[key] = after[key];
  return merged as T;
}

/**
 * Replay an edit that was prepared against `base` onto the newest saved
 * `latest`, so a queued save neither undoes the save before it nor is undone.
 */
export function rebaseStudio(base: Studio, next: Studio, latest: Studio): Studio {
  if (latest === base) return next;
  const baseSongs = new Map(base.songs.map(song => [song.id, song]));
  const nextSongs = new Map(next.songs.map(song => [song.id, song]));
  const songs = latest.songs
    .filter(song => !(baseSongs.has(song.id) && !nextSongs.has(song.id)))
    .map(song => {
      const before = baseSongs.get(song.id), after = nextSongs.get(song.id);
      if (!after) return song;
      return before ? rebaseFields(before, after, song) : after;
    });
  const latestIds = new Set(latest.songs.map(song => song.id));
  const added = next.songs.filter(song => !baseSongs.has(song.id) && !latestIds.has(song.id));
  const { songs: _base, ...baseRest } = base, { songs: _next, ...nextRest } = next, { songs: _latest, ...latestRest } = latest;
  return { ...rebaseFields(baseRest, nextRest, latestRest), songs: [...added, ...songs] } as Studio;
}

/** Refresh server-owned source fields without replacing unfinished writing. */
export function syncSongSource(draft: Song, stored: Song): Song {
  return { ...draft, audioFormat: stored.audioFormat, audioId: stored.audioId,
    audioHistory: stored.audioHistory, generation: stored.generation,
    instrumental: stored.instrumental, creationKind: stored.creationKind,
    creationSeconds: stored.creationSeconds, explicit: stored.explicit,
    master: stored.master, projectId: stored.projectId, sourceSessionId: stored.sourceSessionId,createdAt:stored.createdAt,updatedAt:stored.updatedAt };
}

/** Apply a save acknowledgment without discarding changes made while it was in flight. */
export function mergeSavedSong(before: Song, current: Song, saved: Song): Song {
  const next = { ...current };
  for (const key of Object.keys(saved) as (keyof Song)[]) {
    if (JSON.stringify(current[key]) === JSON.stringify(before[key]))
      Object.assign(next, { [key]: saved[key] });
  }
  return next;
}
