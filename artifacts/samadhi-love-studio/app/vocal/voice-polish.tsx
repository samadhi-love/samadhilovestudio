"use client";
/**
 * "Make my voice sound better": one tap for beginners.
 * Each level gently tunes the pitch toward the nearest note (works in any key)
 * and adds studio polish: rumble cut, even volume, softer S sounds, a little
 * brightness, a small room and a safety limiter. Your original take is never
 * changed; press "Render processed take" to hear the result, or Off to undo.
 */
import { dry, noTuning, type Clip, type Effects, type Tuning } from "./session";

export type PolishLevel = "off" | "light" | "medium" | "strong";
type Preset = { name: string; line: string; tuning: Partial<Tuning>; effects: Partial<Effects> };

export const polishLevels: Record<Exclude<PolishLevel, "off">, Preset> = {
  light: { name: "Light", line: "Natural: a gentle touch",
    tuning: { scale: "chromatic", strength: 35, speed: 25 },
    effects: { lowCut: 80, compression: 25, deEss: 20, presence: 2, reverb: 12, limiter: 30 } },
  medium: { name: "Medium", line: "Polished: in tune, clear and full",
    tuning: { scale: "chromatic", strength: 60, speed: 45 },
    effects: { lowCut: 90, warmth: 1, compression: 40, deEss: 30, presence: 3, reverb: 18, double: 10, limiter: 45 } },
  strong: { name: "Strong", line: "Radio: tight pitch and a big, bright sound",
    tuning: { scale: "chromatic", strength: 100, speed: 90 },
    effects: { lowCut: 100, warmth: 1, compression: 55, deEss: 35, presence: 4, reverb: 22, double: 20, limiter: 60 } },
};

/** The clip settings for a level. Off returns the untouched voice. Manual note edits are kept. */
export function polishClip(clip: Clip, level: PolishLevel): Pick<Clip, "tuning" | "effects" | "bypass"> {
  if (level === "off") return { tuning: { ...noTuning, notes: clip.tuning.notes }, effects: { ...dry }, bypass: false };
  const preset = polishLevels[level];
  return {
    tuning: { ...noTuning, ...preset.tuning, key: clip.tuning.key, notes: clip.tuning.notes },
    effects: { ...dry, ...preset.effects },
    bypass: false,
  };
}

/** Which level the clip currently matches, if any. */
export function polishLevelOf(clip: Clip): PolishLevel | null {
  for (const level of ["off", "light", "medium", "strong"] as const) {
    const want = polishClip(clip, level);
    const tuned = (Object.keys(want.tuning) as (keyof Tuning)[]).every(k => k === "notes" || want.tuning[k] === clip.tuning[k]);
    const shaped = (Object.keys(want.effects) as (keyof Effects)[]).every(k => want.effects[k] === clip.effects[k]);
    if (tuned && shaped) return level;
  }
  return null;
}

export function VoicePolish({ clip, update, disabled }: { clip: Clip; update: (patch: Partial<Clip>) => void; disabled?: boolean }) {
  const current = polishLevelOf(clip);
  const options: [PolishLevel, string, string][] = [
    ["off", "Off", "Your voice exactly as recorded"],
    ...(Object.entries(polishLevels) as [Exclude<PolishLevel, "off">, Preset][]).map(([id, p]) => [id, p.name, p.line] as [PolishLevel, string, string]),
  ];
  return <div className="voice-polish" data-testid="voice-polish">
    <h3>✨ Make my voice sound better</h3>
    <div className="voice-polish-options" role="radiogroup" aria-label="Make my voice sound better">
      {options.map(([id, name, line]) => <button type="button" role="radio" key={id} aria-checked={current === id} className={current === id ? "active" : ""}
        disabled={disabled} data-testid={`button-polish-${id}`} onClick={() => update(polishClip(clip, id))}>
        <strong>{name}</strong><small>{line}</small>
      </button>)}
    </div>
    <p className="muted">Tunes your pitch to the nearest note and adds studio polish. Your original take is kept. Press <strong>Render processed take</strong> to hear it.</p>
  </div>;
}
