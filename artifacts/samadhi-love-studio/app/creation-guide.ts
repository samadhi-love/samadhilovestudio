import { formatTrackTime, isTrackDuration } from "./track-duration";

export const experienceLevels = [
  { id: "beginner", name: "Beginner", description: "Start with one idea and follow the steps." },
  { id: "advanced", name: "Advanced", description: "Shape the style, tempo, lyrics, and vocals." },
  { id: "pro", name: "Pro", description: "Direct the arrangement, make variations, and export instrumental stems." },
] as const;
export type ExperienceLevel = typeof experienceLevels[number]["id"];

export const creationPresets = {
  dabke: {
    name: "Dabke × Euro House", tempo: 130, mood: "Euphoric",
    prompt: "Arabian Euro House with Lebanese Dabke. Oud and darbuka trade phrases over a bright piano lift and a stomping festival groove.",
    example: "A song about finding our way home through love, with an oud hook and a Lebanese Dabke finale.",
    tips: "Start with the oud motif, build with dum-tek percussion, then save the full piano and four-on-the-floor kick for the hook.",
    match: /dabke|arabian|arabic|lebanese|darbuka|\boud\b|mijwiz|turkish/i,
  },
  house: {
    name: "Melodic House", tempo: 124, mood: "Uplifting",
    prompt: "Uplifting melodic Euro House with shimmering piano, warm synth bass, soft pads, and a wide melodic drop.",
    example: "A bright dance track about starting over, with vintage piano and a melody the crowd can sing back.",
    tips: "Keep one recognizable piano phrase. Start with space, add the bass under the hook, and repeat the melody after the breakdown.",
    match: /house|dance|techno|trance|festival|euro|euphori/i,
  },
  soul: {
    name: "Soulful R&B", tempo: 92, mood: "Warm",
    prompt: "Clean soulful R&B with warm electric keys, a syncopated bass line, gentle swing, and an intimate hook.",
    example: "A clean R&B duet about two people finding their rhythm together, with warm keys and a laid-back beat.",
    tips: "Leave space after each call for the answer. Let the bass and the drums carry the verse and bring fuller chords into the hook.",
    match: /hip.hop|r\s*&\s*b|rnb|soul|rap\b|808|romanc/i,
  },
  still: {
    name: "Spiritual Ambient", tempo: 68, mood: "Peaceful",
    prompt: "Spiritual ambient music with spacious pads, soft bells, a slow harmonic pulse, and a gentle build toward stillness.",
    example: "A peaceful track for a morning meditation about remembering the light within.",
    tips: "Use one simple motif and let each note breathe. A soft pad and bell can carry the track with very light percussion.",
    match: /meditat|mantra|ambient|still|peaceful|spirit|heal|calm|frequency|quiet/i,
  },
} as const;

export const arrangements = {
  build: { name: "Build and release", direction: "Sparse intro, rising energy, full hook, stripped break, and a bigger final hook" },
  steady: { name: "Steady groove", direction: "Consistent pulse with gradual layering and a clean outro" },
  cinematic: { name: "Cinematic journey", direction: "Spacious opening, gradual development, a late peak, and a gentle ending" },
} as const;
export const musicalKeys = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"] as const;
export type Preset = keyof typeof creationPresets;
export const motifModes = {
  original: "Original motif", mirror: "Mirror the intervals", reverse: "Reverse the phrase", rotate: "Shift the starting note",
} as const;
export type MotifMode = keyof typeof motifModes;

export type Instrumental = {
  preset: Preset; bpm: number; seconds: number; tonic: number; minor: boolean;
  arrangement: keyof typeof arrangements; seed: number; motif?: MotifMode;
};

export function recommendPreset(idea: string): Preset {
  return (Object.keys(creationPresets) as Preset[]).find(key => creationPresets[key].match.test(idea)) ?? "house";
}

export function recommendTempo(idea: string, preset: Preset) {
  const tempo = Number(/\b(\d{2,3})\s*bpm\b/i.exec(idea)?.[1]);
  return tempo >= 50 && tempo <= 180 ? tempo : creationPresets[preset].tempo;
}

export function isInstrumental(value: unknown): value is Instrumental {
  if (!value || typeof value !== "object") return false;
  const item = value as Instrumental;
  return typeof item.preset === "string" && Object.hasOwn(creationPresets, item.preset) &&
    typeof item.arrangement === "string" && Object.hasOwn(arrangements, item.arrangement) &&
    (item.motif === undefined || (typeof item.motif === "string" && Object.hasOwn(motifModes, item.motif))) &&
    Number.isInteger(item.bpm) && item.bpm >= 50 && item.bpm <= 180 &&
    isTrackDuration(item.seconds) &&
    Number.isInteger(item.tonic) && item.tonic >= 0 && item.tonic < musicalKeys.length &&
    typeof item.minor === "boolean" && Number.isInteger(item.seed) && item.seed >= 0 && item.seed <= 0xffffffff;
}

export function instrumentalLabel(settings: Instrumental) {
  return `${creationPresets[settings.preset].name} · ${settings.bpm} BPM · ${musicalKeys[settings.tonic]} ${settings.minor ? "minor" : "major"} · ${formatTrackTime(settings.seconds)}`;
}
