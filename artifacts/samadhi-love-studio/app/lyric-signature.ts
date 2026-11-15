import type { LyricProject, VideoFormat } from "./lyric-video-data";
import { getCaptionTemplate } from "./lyric-caption-templates";
import { applyVisualTemplate } from "./lyric-visual-template";
import { defaultProLook } from "./lyric-pro-data";

export const signatureLooks = [
  { id: "awaken", name: "Awaken", note: "Golden sunrise · unfolding geometry · illuminated verse", theme: "celestial", caption: "illuminated-verse", color: "gold", overlay: "rays" },
  { id: "violet-flame", name: "Violet Flame", note: "Violet atmosphere · rising light · flowing prism lyrics", theme: "lavender", caption: "prism-flow", color: "lilac", overlay: "flame" },
  { id: "unity", name: "Unity", note: "Teal cosmos · connected circles · elegant sacred script", theme: "flower", caption: "sacred-script", color: "turquoise", overlay: "unity" },
  { id: "aurora-silk", name: "Aurora Silk", note: "Flowing northern lights · clean, spacious lyrics", theme: "lake", caption: "quiet-space", color: "turquoise", overlay: "aurora" },
  { id: "star-stories", name: "Star Stories", note: "Drifting constellations · silver cinematic lettering", theme: "midnight", caption: "silver-cinema", color: "pearl", overlay: "constellation" },
  { id: "lunar-orbit", name: "Lunar Orbit", note: "Circling moonlight · softly illuminated words", theme: "lunar", caption: "illuminated-verse", color: "pearl", overlay: "orbit" },
  { id: "neon-skyline", name: "Neon Skyline", note: "Tempo-driven light bars · electric lyric accents", theme: "futuristic", caption: "neon-pulse", color: "turquoise", overlay: "spectrum" },
  { id: "prism-dance", name: "Prism Dance", note: "Color ribbons · luminous dance-floor lyrics", theme: "nebula", caption: "prism-flow", color: "lilac", overlay: "ribbons" },
  { id: "velvet-lights", name: "Velvet Lights", note: "Floating soft lights · intimate handwritten lyrics", theme: "rose", caption: "ink-echo", color: "pearl", overlay: "bokeh" },
  { id: "sacred-bloom", name: "Sacred Bloom", note: "Slowly turning mandala · elegant golden script", theme: "mandala", caption: "sacred-script", color: "gold", overlay: "mandala" },
  { id: "meteor-dreams", name: "Meteor Dreams", note: "Gentle shooting stars · cinematic silver type", theme: "portal", caption: "silver-cinema", color: "pearl", overlay: "comet" },
  { id: "rose-garden", name: "Rose Garden", note: "Drifting petals · warm, expressive handwriting", theme: "sunset", caption: "ink-echo", color: "pearl", overlay: "petals" },
] as const;
export type SignatureLookId = typeof signatureLooks[number]["id"];
export function signatureLayouts() {
  return Object.fromEntries((["wide", "vertical", "square"] as VideoFormat[]).map(format =>
    [format, { ...defaultProLook, position: format === "vertical" ? 0.64 : 0.68, safe: true }]));
}
export function applySignatureLook(project: LyricProject, id: SignatureLookId): LyricProject {
  const look = signatureLooks.find(l => l.id === id)!;
  const caption = getCaptionTemplate(look.caption)!;
  const next = applyVisualTemplate(project, {
    schema: "samadhi-lyric-visual/v1", name: look.name,
    visual: { theme: look.theme, motion: "drift", format: project.format, font: caption.font, color: look.color,
      captionTemplate: look.caption, intensity: "gentle", bpm: project.bpm ?? 100,
      visualLayers: { backgroundMotion: 0.6, overlayAmount: 0.5, overlayStyle: look.overlay, overlayMotion: true, beatOffset: 0 } },
    captionMode: "karaoke",
  });
  // A complete look supplies readable defaults for every output format. Audio and timing stay intact.
  if (next.pro) next.pro = { ...next.pro, look: { ...defaultProLook, safe: true }, formatLooks: signatureLayouts() };
  return next;
}

