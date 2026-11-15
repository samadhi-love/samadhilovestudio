import { isExplicitSong } from "./clean-content";
import { isAudioFormat, type Song } from "./studio-data";
/** Both publishing and unlisted grants require a ready, clean, active recording. */
export function eligibleSong(song: Song | undefined): song is Song & { audioFormat: NonNullable<Song["audioFormat"]> } {
  return !!song && !song.deletedAt && !song.creationDraft && !!song.audioFormat && isAudioFormat(song.audioFormat) && !isExplicitSong(song);
}
