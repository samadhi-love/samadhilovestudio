import type { MixTrack } from "./multitrack-audio";
import { maxMixSeconds, maxMixTracks } from "./multitrack-audio";
import { uuid } from "./vocal/session";
import { validAVSettings, type AVSettings } from "./av-timeline-data";
export type SavedMixTrack = Omit<MixTrack, "buffer" | "peaks" | "sourceBlob"> & { duration: number };
export type MixerSession = { version: 1; id: string; name: string; projectSongId?: string; tracks: SavedMixTrack[]; audiovisual?: AVSettings };
const number = (n: unknown, min: number, max: number) => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
export function validMixerSession(input: unknown): input is MixerSession {
  const s = input as MixerSession;
  if (!s || s.version !== 1 || !uuid(s.id) || typeof s.name !== "string" || !s.name.trim() || s.name.length > 100 ||
    (s.projectSongId !== undefined && (typeof s.projectSongId !== "string" || !/^[\w-]{1,100}$/.test(s.projectSongId))) || (s.audiovisual !== undefined && !validAVSettings(s.audiovisual)) || !Array.isArray(s.tracks) || s.tracks.length > maxMixTracks) return false;
  const ids = new Set();
  return s.tracks.every(t => {
    if (!t || !uuid(t.id) || ids.has(t.id)) return false; ids.add(t.id);
    return typeof t.name === "string" && t.name.trim().length > 0 && t.name.length <= 100 && number(t.duration, .05, maxMixSeconds + .1) &&
      number(t.start, 0, t.duration) && number(t.end, t.start + .001, t.duration) && number(t.at, 0, maxMixSeconds) && t.at + t.end - t.start <= maxMixSeconds + .001 &&
      number(t.level, 0, 1.5) && number(t.pan, -1, 1) && number(t.lowCut, 15, 300) && number(t.presence, -12, 12) && number(t.reverb, 0, 1) && number(t.echo, 0, .75) &&
      [t.compression, t.mute, t.solo].every(v => typeof v === "boolean");
  });
}
export function serializeMixer(id: string, name: string, projectSongId: string, tracks: MixTrack[], audiovisual?: AVSettings): MixerSession {
  return { version: 1, id, name: name.trim(), ...(projectSongId ? { projectSongId } : {}), ...(audiovisual ? { audiovisual } : {}), tracks: tracks.map(({ buffer, peaks, sourceBlob, ...track }) => ({ ...track, duration: buffer.duration })) };
}
