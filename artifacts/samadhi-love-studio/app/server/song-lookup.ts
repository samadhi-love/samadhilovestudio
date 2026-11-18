import {serverStorage as env} from "./storage";
import {readStudio} from "../api/studio/store";
import type {Song} from "../studio-data";
import {songLookupSql} from "./song-lookup-sql";

/**
 * One song from the owner's library, without downloading the whole library.
 *
 * Audio players fetch a song in many small byte ranges (every seek, every
 * buffer refill). Reading the full library (up to 32 MB) for each of those was
 * the slowest part of playback. In the current one-document storage the
 * database picks the single song out of the saved library, so only that song
 * is transferred. Per-song row storage already reads by row.
 *
 * Returns the song even if it is marked deleted; callers decide what to allow.
 */
export {songLookupSql};

export async function readOwnedSong(owner: string, songId: string): Promise<Song | null> {
  if (env.STUDIO_ROW_STORAGE !== "verified" && env.DB) {
    try {
      const row = await env.DB.prepare(songLookupSql).bind(owner, songId).first<{song: string}>();
      return row ? (JSON.parse(row.song) as Song) : null;
    } catch (error) {
      // Never fail playback over the faster path: the full read below is the
      // original, proven behaviour. Logged so a persistent problem is visible.
      console.warn("Song lookup fell back to a full library read", {
        errorType: error instanceof Error ? error.name : "unknown",
      });
    }
  }
  const {data} = await readStudio(owner);
  return data?.songs.find((song) => song.id === songId) ?? null;
}
