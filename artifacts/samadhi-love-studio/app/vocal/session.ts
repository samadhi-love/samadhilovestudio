import type { Scale } from "../recording-dsp";
import { maxProductionSeconds } from "../track-duration";

export const sessionSeconds = maxProductionSeconds;
export const maxClips = 16;
export const maxSources = 24;
export const maxSourceSeconds = 48 * 60;
export const roles = ["Lead vocal", "Male vocal", "Female vocal", "Background vocal", "Harmony", "Ad-lib", "Narration", "Instrumental"] as const;
export type Role = typeof roles[number];

export const effectControls = [
  ["lowCut", "Low cut (Hz)", 0, 300, 5, "Remove low rumble and microphone handling noise. Zero bypasses the filter."],
  ["warmth", "Low EQ (dB)", -12, 12, 1, "Boost or cut low-mid warmth."],
  ["presence", "High EQ (dB)", -12, 12, 1, "Boost or cut vocal brightness."],
  ["compression", "Compression", 0, 100, 1, "Even out loud and quiet words."],
  ["noise", "Noise reduction", 0, 100, 1, "Attenuate quiet background noise with a downward expander."],
  ["deEss", "De-esser", 0, 100, 1, "Reduce sharp S sounds when the high-frequency band becomes loud."],
  ["gate", "Noise gate (dB)", -90, -20, 1, "Quiet the track below this threshold. −90 turns the gate off."],
  ["breath", "Breath control", 0, 100, 1, "Attenuate quiet, airy sounds. Strong settings may also soften consonants."],
  ["reverb", "Reverb", 0, 100, 1, "Blend in a short stereo room reverb."],
  ["delay", "Echo", 0, 100, 1, "Blend in a delayed repeat of the voice."],
  ["delayMs", "Echo time (ms)", 70, 700, 5, "Set the time before the first repeat."],
  ["saturation", "Saturation", 0, 100, 1, "Add soft harmonic distortion."],
  ["chorus", "Chorus", 0, 100, 1, "Blend in a short delay that changes in time for a thicker sound."],
  ["double", "Vocal doubling", 0, 100, 1, "Blend in two lightly delayed copies, one on each side."],
  ["width", "Stereo width", 0, 180, 1, "Adjust the difference between left and right. 100 keeps the original width."],
  ["limiter", "Limiter", 0, 100, 1, "Tame peaks before the track reaches the mix."],
] as const;
export type Effects = Record<typeof effectControls[number][0], number>;
export const dry: Effects = { lowCut: 0, warmth: 0, presence: 0, compression: 0, noise: 0, deEss: 0, gate: -90, breath: 0,
  reverb: 0, delay: 0, delayMs: 280, saturation: 0, chorus: 0, double: 0, width: 100, limiter: 0 };
export type Tuning = { key: number; scale: Scale; strength: number; speed: number; shift: number; formant: number; notes: NoteEdit[] };
export type NoteEdit = { start: number; end: number; midi: number };
export const noTuning: Tuning = { key: 0, scale: "chromatic", strength: 0, speed: 35, shift: 0, formant: 0, notes: [] };
export type Source = { id: string; name: string; duration: number };
export type Bus = "vocals" | "music";
export type VolumePoint = { time: number; gain: number };
export type Clip = {
  id: string; source: string; name: string; role: Role; start: number; end: number; at: number;
  volume: number; pan: number; mute: boolean; solo: boolean; bypass: boolean; effects: Effects; tuning: Tuning;
  fadeIn: number; fadeOut: number; bus?: Bus; automation?: VolumePoint[];
  /** A guide track (e.g. the AI singer to follow): heard while recording, never in the saved song. */
  guide?: boolean;
};
export type Session = {
  version: 1; id: string; name: string; bpm: number; sources: Source[]; clips: Clip[];
  presets: { name: string; effects: Effects }[]; master: number; masterLimiter: boolean; buses?: Record<Bus, number>;
  projectSongId?: string;
};
export const emptySession = (): Session => ({ version: 1, id: crypto.randomUUID(), name: "Untitled vocal session", bpm: 120,
  sources: [], clips: [], presets: [], master: 1, masterLimiter: true });
export const uuid = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);

export function splitClip(clip: Clip, playhead: number) {
  const point = clip.start + playhead - clip.at;
  if (point - clip.start < 0.05 || clip.end - point < 0.05) return null;
  return [
    { ...clip, end: point, fadeOut: 0 },
    { ...clip, id: crypto.randomUUID(), at: playhead, start: point, fadeIn: 0 },
  ];
}

const between = (n: unknown, min: number, max: number): n is number => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const name = (value: unknown): value is string => typeof value === "string" && !!value.trim() && value.length <= 100;
const effects = (value: Effects) => value && effectControls.every(([key, , min, max]) => between(value[key], min, max));
const tuning = (t: Tuning) => t && Number.isInteger(t.key) && between(t.key, 0, 11) && ["chromatic", "major", "minor"].includes(t.scale) &&
  between(t.strength, 0, 100) && between(t.speed, 0, 100) && between(t.shift, -12, 12) && between(t.formant, -6, 6) &&
  Array.isArray(t.notes) && t.notes.length <= 80 && t.notes.every(n => n && between(n.start, 0, sessionSeconds) &&
    between(n.end, n.start + 0.02, sessionSeconds) && between(n.midi, 28, 100));

export function validSession(value: unknown): value is Session {
  try { return validateSession(value); } catch { return false; }
}
function validateSession(value: unknown): value is Session {
  const s = value as Session;
  if (s?.projectSongId !== undefined && (typeof s.projectSongId !== "string" || !/^[\w-]{1,100}$/.test(s.projectSongId))) return false;
  if (!s || s.version !== 1 || !uuid(s.id) || !name(s.name) || !between(s.bpm, 40, 200) ||
    !between(s.master, 0, 1.5) || typeof s.masterLimiter !== "boolean" || !Array.isArray(s.sources) ||
    s.sources.length > maxSources || !s.sources.every(a => a && uuid(a.id) && name(a.name) && between(a.duration, 0.05, sessionSeconds)) ||
    !Array.isArray(s.clips) || s.clips.length > maxClips || !Array.isArray(s.presets) || s.presets.length > 24 ||
    !s.presets.every(p => p && name(p.name) && effects(p.effects))) return false;
  if (s.buses !== undefined && (!s.buses || !between(s.buses.vocals, 0, 1.5) || !between(s.buses.music, 0, 1.5))) return false;
  if (s.sources.reduce((total, source) => total + source.duration, 0) > maxSourceSeconds) return false;
  const sources = new Map(s.sources.map(a => [a.id, a]));
  return sources.size === s.sources.length && new Set(s.clips.map(c => c?.id)).size === s.clips.length && s.clips.every(c => {
    const source = sources.get(c?.source);
    return c && source && (c.bus === undefined || c.bus === "vocals" || c.bus === "music") &&
      (c.automation === undefined || (Array.isArray(c.automation) && c.automation.length <= 32 && c.automation.every((point, index, items) =>
        point && between(point.time, 0, source.duration) && between(point.gain, 0, 1.5) && (index === 0 || point.time > items[index - 1].time)))) &&
      uuid(c.id) && name(c.name) && roles.includes(c.role) &&
      between(c.start, 0, source.duration) && between(c.end, c.start + 0.045, source.duration + 0.001) &&
      between(c.at, 0, sessionSeconds) && c.at + c.end - c.start <= sessionSeconds + 0.001 &&
      between(c.volume, 0, 1.5) && between(c.pan, -1, 1) && [c.mute, c.solo, c.bypass].every(b => typeof b === "boolean") &&
      between(c.fadeIn, 0, 5) && between(c.fadeOut, 0, 5) && effects(c.effects) && tuning(c.tuning) &&
      (c.guide === undefined || typeof c.guide === "boolean");
  });
}

export function busFor(clip: Clip): Bus {
  return clip.bus ?? (clip.role === "Instrumental" ? "music" : "vocals");
}

export function automationAt(points: VolumePoint[], time: number) {
  const right = points.findIndex(point => point.time > time);
  if (right < 0) return points.at(-1)?.gain ?? 1;
  if (right === 0) return points[0].gain;
  const a = points[right - 1], b = points[right];
  return a.gain + (b.gain - a.gain) * (time - a.time) / (b.time - a.time);
}
