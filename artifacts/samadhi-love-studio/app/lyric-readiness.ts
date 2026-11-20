import { isLyricProject, type LyricProject, type VideoFormat } from "./lyric-video-data";
import { reviewTiming, sourceChanged } from "./lyric-pro-data";
import { pinnedMaster, projectRoot } from "./project-assets";
import type { Song } from "./studio-data";
export type RenderCheck = { id: string; level: "block" | "review" | "ready"; text: string; step: number };
export { soundtrackIdentity } from "./lyric-audio-identity";
import { soundtrackIdentity } from "./lyric-audio-identity";
export function renderReadiness(project: LyricProject, song: Song, songs: Song[], options: { imagesReady: boolean; allowOld: boolean; clean: boolean; fallback: boolean; formats: VideoFormat[] }): RenderCheck[] {
  const checks: RenderCheck[] = [], p = project.pro;
  if (!p) return [{ id: "project", level: "block", text: "Open an advanced video project before export.", step: 0 }];
  const add = (id: string, level: RenderCheck["level"], text: string, step: number) => checks.push({ id, level, text, step });
  if (!isLyricProject(project) || p.range.end <= p.range.start || p.duration <= 0)
    add("range", "block", "Choose a valid excerpt inside the soundtrack.", 4);
  else add("range", "ready", `${Math.round((p.range.end - p.range.start + p.intro + p.outro) * 10) / 10}s output · ${options.formats.join(" / ")}.`, 4);
  add("assets", options.imagesReady ? "ready" : "block", options.imagesReady ? "Backgrounds and fonts are loaded." : "Wait for backgrounds and fonts, or replace any asset that failed to load.", 3);
  if (sourceChanged(song, project) && !options.allowOld) add("source", "block", "The song recording changed. Confirm the retained original or realign the replacement.", 1);
  else add("source", p.soundtrackConfirmed === soundtrackIdentity(project) ? "ready" : "review", p.soundtrackConfirmed === soundtrackIdentity(project) ? "This soundtrack version is confirmed." : "Listen and confirm the exact soundtrack before final timing review.", 1);
  const master = pinnedMaster(songs, projectRoot(songs, song));
  if (master && (master.song.id !== p.sourceSongId || master.audioId !== p.sourceAudioId || p.useEnhancedSoundtrack))
    add("master", "review", "This video soundtrack differs from the project's pinned final master. Confirm that this is intentional.", 1);
  if (p.beatGrid && (p.beatGrid.source !== soundtrackIdentity(project) || !p.beatGrid.reviewed)) add("beats", "review", "Animation beat estimates are unreviewed or use another soundtrack. Review them or use manual tempo.", 3);
  if (!options.clean) {
    const cues = project.cues.filter(c => (p.includeBacking || c.role !== "backing") && (p.includeAdlibs || c.role !== "adlib"));
    const visible = cues.filter((c, i) => c.time < p.range.end && (c.end ?? cues[i + 1]?.time ?? p.duration) > p.range.start);
    if (!visible.length) add("lyrics", "block", "No visible lyric lines overlap this excerpt. Add captions or choose clean video.", 2);
    const bad = project.cues.some(c => c.time >= p.duration || (c.end !== undefined && c.end > p.duration + 0.01));
    if (bad) add("timing", "block", "Some captions extend beyond the soundtrack. Correct their timing.", 2);
    const fast = reviewTiming(visible, p.duration).filter(f => f.message.startsWith("Fast caption")).length;
    if (fast) add("speed", "review", `${fast} caption line(s) may be too fast to read.`, 2);
    add("review", p.alignment?.reviewed ? "ready" : "review", p.alignment?.reviewed ? "Caption timing is marked reviewed." : "Caption timing still needs a listening review.", 2);
    if (p.captionMode === "karaoke" && visible.some(c => !c.words?.length)) add("words", "review", "Some word highlights use estimated spacing. Review them against the vocal.", 2);
  }
  const nearEdge = options.formats.filter(format => { const look = p.formatLooks?.[format] ?? p.look; return look.position < 0.3 || look.position > 0.78 || look.size > 1.5; });
  add("layout", "review", nearEdge.length ? `Review text size/placement in ${nearEdge.join(", ")}; it may crowd platform overlays.` : "Preview each output format with safe-area guides; platform controls can cover text.", 3);
  if (options.fallback && (p.intro || p.outro)) add("fallback", "block", "Real-time fallback requires intro and outro to be zero.", 3);
  if (options.fallback && p.backgroundVideo && !p.useTemplateBackground) add("footage", "block", "A video background needs the full video maker. Turn off real-time fallback, or remove the video background.", 3);
  return checks;
}
