"use client";
import type { LyricProject } from "./lyric-video-data";
import { videoThemes } from "./lyric-video-data";
import { applySignatureLook, signatureLooks, type SignatureLookId } from "./lyric-signature";

/** The six featured vibes shown first. IDs are the stored signature look IDs. */
export const featuredVibeIds: SignatureLookId[] = ["awaken", "violet-flame", "sacred-bloom", "aurora-silk", "star-stories", "neon-skyline"];
export const featuredVibes = featuredVibeIds.map(id => signatureLooks.find(l => l.id === id)!);

/** Which featured vibe the project currently shows (theme + caption template + overlay match), if any. */
export function activeVibe(project: LyricProject): SignatureLookId | undefined {
  return featuredVibes.find(l => project.theme === l.theme && project.captionTemplate === l.caption && project.color === l.color &&
    (project.visualLayers?.overlayStyle ?? l.overlay) === l.overlay)?.id;
}

/** Apply a featured vibe locally. Captions, timing, format and any per-format caption layouts the creator already set are kept. */
export function applyVibe(project: LyricProject, id: SignatureLookId): LyricProject {
  const next = applySignatureLook(project, id);
  const kept = project.pro?.formatLooks;
  if (next.pro && project.pro && kept && Object.keys(kept).length)
    next.pro = { ...next.pro, look: project.pro.look, formatLooks: { ...next.pro.formatLooks, ...kept } };
  return next;
}

/** Picking a vibe applies it locally at once: captions, timing and soundtrack are kept; no provider request is made. */
export function VibeLookPicker({ project, change, disabled = false, title = "Pick a vibe" }: { project: LyricProject; change: (next: LyricProject) => void; disabled?: boolean; title?: string }) {
  const active = activeVibe(project);
  return <section className="vibe-look-picker" aria-label="Pick a vibe" data-testid="vibe-look-picker">
    <h3>{title}</h3>
    <div className="vibe-look-grid">{featuredVibes.map(look => {
      const colors = videoThemes[look.theme].colors;
      return <button type="button" key={look.id} data-testid={`button-vibe-${look.id}`} disabled={disabled} aria-pressed={active === look.id}
        onClick={() => change(applyVibe(project, look.id))}
        style={{ backgroundImage: `linear-gradient(150deg,${colors[0]},${colors[1]} 55%,${colors[2]})` }}>
        <strong>{look.name}</strong><span>{look.note.split(" · ")[0]}</span>
      </button>;
    })}</div>
    <p className="lvp-note">Applied instantly to the preview. Your words, timing and recording stay as they are. Nothing is generated or charged.</p>
  </section>;
}
