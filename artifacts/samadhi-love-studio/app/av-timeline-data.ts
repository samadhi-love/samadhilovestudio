import { isLyricProject, type LyricCue, type LyricProject } from "./lyric-video-data";
import { newProSettings, isProLook, type ProLook } from "./lyric-pro-data";
import type { MixTrack } from "./multitrack-audio";
import { freshSong, type Song } from "./studio-data";

export type VisualTarget = "camera" | "light" | "lyrics" | "color";
export type VisualMapping = { id: string; source: string; feature: "energy" | "attack"; target: VisualTarget; amount: number };
export type AVMarker = { id: string; name: string; time: number; end: number; theme?: LyricProject["theme"]; anchor?: string; background?: string };
export type MidiTrigger = { time: number; note: number; velocity: number; channel: number };
export type AVSettings = {
  version: 1; bpm: number; key: string; look: Omit<LyricProject, "pro">;
  anchor?: string; lyricSource?: { song: string; audio: string }; reviewed: boolean;
  markers: AVMarker[]; mappings: VisualMapping[]; midi: MidiTrigger[];
  feedback: { id: string; time: number; text: string; resolved: boolean }[];
  splits: { name: string; percent: number }[];
  layouts?: Partial<Record<LyricProject["format"], ProLook>>;
  range?: { start: number; end: number };
  mediaSong?: string; background?: string; logo?: string; artist?: string; credits?: string;
  reviewedAnchor?: { id: string; start: number; end: number };
};
export const newAVSettings = (): AVSettings => ({ version: 1, bpm: 100, key: "", reviewed: false,
  look: { theme: "cosmic", format: "wide", motion: "drift", cues: [], captionTemplate: "illuminated-verse", font: "classic", color: "gold", intensity: "gentle" },
  markers: [], mappings: [], midi: [], feedback: [], splits: [] });
const finite = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const text = (v: unknown, max = 100): v is string => typeof v === "string" && v.length <= max;
const id = (v: unknown): v is string => text(v) && /^[\w:-]{1,100}$/.test(v);
const mediaId = (v: unknown): v is string => text(v) && /^[\w-]{1,100}$/.test(v);
function unique<T extends { id: string }>(v: T[]) { return new Set(v.map(i => i.id)).size === v.length; }
export function validAVSettings(value: unknown): value is AVSettings {
  try {
    const s = value as AVSettings;
    return !!s && s.version === 1 && finite(s.bpm, 40, 240) && text(s.key, 40) && typeof s.reviewed === "boolean" &&
      isLyricProject(s.look) && (s.look as LyricProject).pro === undefined && (s.anchor === undefined || id(s.anchor)) &&
      [s.mediaSong, s.background, s.logo].every(v => v === undefined || mediaId(v)) && (s.artist === undefined || text(s.artist,100)) && (s.credits === undefined || text(s.credits,400)) &&
      (s.reviewedAnchor === undefined || (id(s.reviewedAnchor.id) && finite(s.reviewedAnchor.start,0,480) && finite(s.reviewedAnchor.end,s.reviewedAnchor.start+.001,480))) &&
      (s.layouts === undefined || (!!s.layouts && Object.entries(s.layouts).every(([f, look]) => ["wide", "vertical", "square"].includes(f) && isProLook(look)))) &&
      (s.range === undefined || (finite(s.range.start, 0, 480) && finite(s.range.end, s.range.start + .001, 480))) &&
      (s.lyricSource === undefined || (id(s.lyricSource.song) && id(s.lyricSource.audio))) &&
      Array.isArray(s.markers) && s.markers.length <= 40 && unique(s.markers) && s.markers.every(m => id(m.id) && text(m.name) && !!m.name.trim() && finite(m.time, 0, 480) && finite(m.end, m.time + .001, 480) && (m.anchor === undefined || id(m.anchor)) && (m.background === undefined || mediaId(m.background)) && (m.theme === undefined || isLyricProject({ ...s.look, theme: m.theme }))) &&
      Array.isArray(s.mappings) && s.mappings.length <= 12 && unique(s.mappings) && s.mappings.every(m => id(m.id) && id(m.source) && (!m.source.startsWith("midi:") || ["midi:all","midi:kick","midi:snare"].includes(m.source)) && ["energy", "attack"].includes(m.feature) && ["camera", "light", "lyrics", "color"].includes(m.target) && finite(m.amount, 0, 1)) &&
      Array.isArray(s.midi) && s.midi.length <= 2000 && s.midi.every((m, i) => finite(m.time, 0, 480) && Number.isInteger(m.note) && finite(m.note, 0, 127) && finite(m.velocity, 0, 1) && Number.isInteger(m.channel) && finite(m.channel, 0, 15) && (!i || m.time >= s.midi[i - 1].time)) &&
      (!(s.background||s.logo||s.markers.some(m=>m.background))||!!s.mediaSong) &&
      Array.isArray(s.feedback) && s.feedback.length <= 60 && unique(s.feedback) && s.feedback.every(f => id(f.id) && finite(f.time, 0, 480) && text(f.text, 500) && !!f.text.trim() && typeof f.resolved === "boolean") &&
      Array.isArray(s.splits) && s.splits.length <= 12 && s.splits.every(p => text(p.name) && !!p.name.trim() && finite(p.percent, 0, 100)) && s.splits.reduce((sum, p) => sum + p.percent, 0) <= 100.001;
  } catch { return false; }
}
export function audibleMixTracks(tracks: MixTrack[]) {
  const solo = tracks.some(t => t.solo && !t.mute);
  return tracks.filter(t => !t.mute && (!solo || t.solo));
}
export function timelineLength(tracks: MixTrack[]) { return Math.max(0, ...tracks.map(t => t.at + t.end - t.start).filter(Number.isFinite)); }
export function validTimeline(tracks: MixTrack[]) {
  return tracks.length > 0 && tracks.every(t => [t.start, t.end, t.at, t.level].every(Number.isFinite) && t.start >= 0 && t.end > t.start && t.end <= t.buffer.duration + .001 && t.at >= 0 && t.at + t.end - t.start <= 480.001);
}
export function anchorReviewMatches(settings:AVSettings, tracks:MixTrack[]){const track=tracks.find(t=>t.id===settings.anchor),review=settings.reviewedAnchor;return !!(settings.reviewed&&track&&review&&review.id===track.id&&review.start===track.start&&review.end===track.end);}
export function mappedCues(cues: LyricCue[], anchor: Pick<MixTrack, "start" | "end" | "at"> | undefined, duration: number): LyricCue[] {
  if (!anchor) return [];
  return cues.flatMap((cue, index) => {
    const time = Math.max(cue.time, anchor.start), end = Math.min(cue.end ?? cues[index + 1]?.time ?? anchor.end, anchor.end);
    if (end <= time) return [];
    const delta = anchor.at - anchor.start, from = Math.max(0, time + delta), until = Math.min(duration, end + delta);
    if (until <= from) return [];
    return [{ ...cue, time: from, end: until, words: cue.words?.map(w => ({ ...w, time: Math.max(from, Math.min(until, w.time + delta)) })) }];
  });
}
export function importSongLook(settings: AVSettings, song: Song, anchor?: string): AVSettings {
  const source = song.lyricVideo;
  if (!source?.cues.length) throw new Error("This song has no saved timed lyrics. Open Lyric Video Pro to align or correct them first.");
  const { pro, ...look } = source;
  return { ...settings, look: structuredClone(look), anchor, reviewed: false, reviewedAnchor:undefined,
    mediaSong: song.id, background: pro?.background, logo: pro?.logo, artist: pro?.artist, credits: pro?.credits,
    layouts: pro ? { ...pro.formatLooks, [source.format]: pro.formatLooks?.[source.format] ?? pro.look } : settings.layouts,
    lyricSource: { song: song.id, audio: pro?.sourceAudioId ?? song.audioId ?? song.id },
    markers: (pro?.sections ?? []).filter(s=>s.time<480&&s.end<=480).slice(0, 40).map(s => ({ id: s.id, name: s.name, time: s.time, end: s.end, theme: s.theme, background: s.background, anchor })) };
}
export function timelineProject(settings: AVSettings, tracks: MixTrack[], title: string, format = settings.look.format, captions = true): LyricProject {
  const duration = Math.max(.05, timelineLength(tracks)), anchor = tracks.find(t => t.id === settings.anchor);
  const project: LyricProject = { ...settings.look, format, bpm: settings.bpm,
    cues: captions ? mappedCues(settings.look.cues, anchor, duration) : [],
    pro: { ...newProSettings(freshSong("av-timeline", title, 0), duration), artist: "SAMADHI LOVE", name: title, includeAdlibs: true, includeBacking: true,
      sourceSongId: settings.mediaSong ?? "av-timeline", background: settings.background, logo: settings.logo, ...(settings.artist !== undefined ? {artist:settings.artist}:{}), credits: settings.credits ?? "",
      formatLooks: settings.layouts, look: { position: format === "wide" ? .7 : .64, size: 1, outline: 1, shadow: 1, spacing: 1.35, safe: true } } };
  project.pro!.sections = settings.markers.flatMap(m => {
    const track = m.anchor ? tracks.find(t => t.id === m.anchor) : undefined;
    if (m.anchor && !track) return [];
    const delta = track ? track.at - track.start : 0;
    const time = Math.max(0, m.time + delta, track?.at ?? 0), end = Math.min(duration, m.end + delta, track ? track.at + track.end - track.start : duration);
    return end > time ? [{ ...m, time, end }] : [];
  }).sort((a, b) => a.time - b.time);
  return project;
}
