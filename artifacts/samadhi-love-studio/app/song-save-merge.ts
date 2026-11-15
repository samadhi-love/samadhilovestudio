import type { Song } from "./studio-data";

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
