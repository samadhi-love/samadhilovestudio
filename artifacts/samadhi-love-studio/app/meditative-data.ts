export type MeditationLayer = { id: string; mode: "tone" | "binaural" | "pulse"; hz: number; beat: number; level: number };
export type MeditationBlend = { version: 1; id: string; name: string; seconds: number; volume: number; layers: MeditationLayer[]; vocalNotes: string; guideId?: string; projectSongId?: string };
export const maxMeditationLayers = 6;
export const maxMeditationSeconds = 180;
const finite = (n: unknown, a: number, b: number) => typeof n === "number" && Number.isFinite(n) && n >= a && n <= b;
const uuid = (v: unknown) => typeof v === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v);
export function validMeditationBlend(value: unknown): value is MeditationBlend {
  const s = value as MeditationBlend;
  if (!s || (s.guideId !== undefined && (typeof s.guideId !== "string" || !/^[\w-]{1,100}$/.test(s.guideId))) || s.version !== 1 || !uuid(s.id) || typeof s.name !== "string" || !s.name.trim() || s.name.length > 100 || !finite(s.seconds, 5, maxMeditationSeconds) || !finite(s.volume, 0, .5) || typeof s.vocalNotes !== "string" || s.vocalNotes.length > 2000 || (s.projectSongId !== undefined && (typeof s.projectSongId !== "string" || !/^[\w-]{1,100}$/.test(s.projectSongId))) || !Array.isArray(s.layers) || s.layers.length < 1 || s.layers.length > maxMeditationLayers) return false;
  const ids = new Set<string>();
  return s.layers.every(l => {
    if (!l || !uuid(l.id) || ids.has(l.id)) return false;
    ids.add(l.id);
    return ["tone", "binaural", "pulse"].includes(l.mode) && finite(l.hz, 80, 1200) && finite(l.beat, .5, 40) && finite(l.level, 0, 1);
  });
}
export type MeditationPreset = { id: string; name: string; category: "Solfeggio" | "Binaural" | "Pulsed" | "Blends"; note: string; layers: Omit<MeditationLayer, "id">[] };
const tone = (hz: number): Omit<MeditationLayer, "id"> => ({ mode: "tone", hz, beat: 4, level: .65 });
export const meditationPresets: MeditationPreset[] = [
  ...[174, 285, 396, 417, 528, 639, 741, 852, 963].map(hz => ({ id: `sol-${hz}`, name: `${hz} Hz`, category: "Solfeggio" as const, note: "A pure tone from the modern Solfeggio tradition. Traditional associations are not established medical effects.", layers: [tone(hz)] })),
  { id: "reference-432", name: "432 Hz reference", category: "Blends", note: "A single tuning-reference tone; this does not retune other music to A=432 Hz.", layers: [tone(432)] },
  ...[{ beat: 2, band: "Delta" }, { beat: 6, band: "Theta" }, { beat: 10, band: "Alpha" }, { beat: 20, band: "Beta" }, { beat: 40, band: "Gamma" }].map(({ beat, band }) => ({ id: `bin-${beat}`, name: `${band} · ${beat} Hz difference`, category: "Binaural" as const, note: `Left 220 Hz / right ${220 + beat} Hz. Headphones required for stereo separation. Band names describe the difference rate, not a guaranteed brain state.`, layers: [{ mode: "binaural" as const, hz: 220, beat, level: .65 }] })),
  ...[8, 40].map(beat => ({ id: `pulse-${beat}`, name: `${beat} Hz pulsed tone`, category: "Pulsed" as const, note: `A 220 Hz carrier with smooth amplitude pulses ${beat} times per second. Audible modulation, distinct from binaural beats.`, layers: [{ mode: "pulse" as const, hz: 220, beat, level: .65 }] })),
  { id: "still-water", name: "Still Water", category: "Blends", note: "An original gentle combination: 396 Hz tone and 220/226 Hz binaural pair.", layers: [tone(396), { mode: "binaural", hz: 220, beat: 6, level: .35 }] },
  { id: "open-sky", name: "Open Sky", category: "Blends", note: "An original bright combination: 528 Hz tone and 220/230 Hz binaural pair.", layers: [tone(528), { mode: "binaural", hz: 220, beat: 10, level: .35 }] },
  { id: "golden-space", name: "Golden Space", category: "Blends", note: "An original two-tone palette: 396 and 639 Hz. Combine by ear and adjust levels to taste.", layers: [tone(396), tone(639)] },
];
export function newMeditationBlend(preset = meditationPresets.find(p => p.id === "still-water")!): MeditationBlend {
  return { version: 1, id: crypto.randomUUID(), name: preset.name, seconds: 60, volume: .25, layers: preset.layers.map(l => ({ ...l, id: crypto.randomUUID() })), vocalNotes: "" };
}
/** Difference frequency is metadata; it is never substituted for an audible carrier. */
export function meditationSample(l: MeditationLayer, time: number): [number, number] {
  const left = Math.sin(2 * Math.PI * l.hz * time);
  if (l.mode === "binaural") return [left, Math.sin(2 * Math.PI * (l.hz + l.beat) * time)];
  const modulation = l.mode === "pulse" ? (1 - Math.cos(2 * Math.PI * l.beat * time)) / 2 : 1;
  return [left * modulation, left * modulation];
}
