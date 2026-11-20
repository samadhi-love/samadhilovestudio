import { isExplicitSong } from "./clean-content";
import { songAudioUrl, type Song } from "./studio-data";

export function projectRoot(songs: Song[], song: Song): Song {
  const visited = new Set([song.id]);
  let current = song;
  while (current.projectId) {
    const parent = songs.find(s => s.id === current.projectId && !s.deletedAt);
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id); current = parent;
  }
  return current;
}

export function projectMembers(songs: Song[], song: Song) {
  const root = projectRoot(songs, song);
  // Retain legacy manually attached mix recordings without moving their records.
  const attached = new Set(root.mixes.flatMap(m => m.audioSongId ? [m.audioSongId] : []));
  return songs.filter(s => !s.deletedAt && (projectRoot(songs, s).id === root.id || attached.has(s.id)));
}

export function pinnedMaster(songs: Song[], project: Song) {
  const root = projectRoot(songs, project);
  const pin = root.master;
  const song = pin && projectMembers(songs, root).find(s => s.id === pin.songId && !isExplicitSong(s));
  if (!song || !pin) return null;
  const current = (song.audioId ?? song.id) === pin.audioId && song.audioFormat;
  const format = current || song.audioHistory?.find(a => a.audioId === pin.audioId)?.audioFormat;
  if (!format) return null;
  return { song, audioId: pin.audioId, format,
    url: current ? songAudioUrl(song.id, song.audioId) : `/api/studio/lyric-assets?song=${encodeURIComponent(song.id)}&source=${encodeURIComponent(pin.audioId)}` };
}

export function attachRenderedMix(songs: Song[], source: Song, audio: Song, sessionId?: string) {
  const root = projectRoot(songs, source);
  const writing = audio.sectionEdit ? source : root;
  const rendered: Song = { ...audio, projectId: root.id, sourceSessionId: sessionId,
    notes: audio.generation ? audio.notes : { ...audio.notes, lyrics: writing.notes.lyrics, prompt: writing.notes.prompt, vocals: writing.notes.vocals, instruments: writing.notes.instruments },
    tags: [...root.tags], folderId: root.folderId };
  const mix = { id: crypto.randomUUID(), name: audio.name, notes: sessionId ? "Rendered from Vocal Studio" : "Rendered production mix", link: "", audioSongId: audio.id };
  return [rendered, ...songs.filter(s => s.id !== audio.id).map(s => s.id === root.id ? { ...s, mixes: s.mixes.some(m => m.audioSongId === audio.id) ? s.mixes : [...s.mixes, mix] } : s)];
}

export function validReleaseMetadata(value: unknown): value is NonNullable<Song["releaseMetadata"]> {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (["artist", "credits", "isrc", "upc", "copyright"] as const).every(key => typeof m[key] === "string" && m[key].length <= (key === "credits" ? 4000 : 200)) &&
    (!m.isrc || /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(m.isrc as string)) && (!m.upc || /^\d{12,13}$/.test(m.upc as string));
}

/** "Make lyric video" for a recording you just saved (e.g. your vocal mix): open THAT recording,
 * never the project's pinned master, and start timing its words unless it already has captions
 * or is an instrumental. */
export function lyricVideoFor(song: Song) {
  return { songId: song.id, autoCaptions: !song.lyricVideo?.cues.length && song.creationKind !== "instrumental" };
}
