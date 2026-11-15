/** Canvas-native presets: the same configuration drives preview and video export. */
export const captionTypefaces = {
  classic: { label: "Elegant serif", family: '"Studio Serif", Georgia, "Noto Naskh Arabic", serif', weight: 600 },
  clean: { label: "Clean sans", family: 'Arial, "Noto Sans", sans-serif', weight: 600 },
  bold: { label: "Heavy headline", family: 'Arial, "Noto Sans", sans-serif', weight: 900 },
  script: { label: "Calligraphic serif", family: '"Studio Serif", Georgia, "Noto Naskh Arabic", serif', weight: 500, italic: true },
  brush: { label: "Handwritten brush", family: '"Studio Hand", "Segoe Print", cursive', weight: 600 },
  gothic: { label: "Illuminated manuscript", family: '"Studio Gothic", Georgia, serif', weight: 700 },
  condensed: { label: "Condensed impact", family: '"Studio Condensed", Impact, "Arial Narrow", sans-serif', weight: 700 },
  thin: { label: "Minimal thin", family: '"Helvetica Neue", "Noto Sans", Arial, sans-serif', weight: 300 },
  rounded: { label: "Soft rounded", family: '"Studio Rounded", "Arial Rounded MT Bold", sans-serif', weight: 800 },
  global: { label: "Global / multilingual", family: '"Noto Sans", "Noto Naskh Arabic", "Noto Sans CJK JP", system-ui, sans-serif', weight: 600 },
} as const;

export type CaptionFont = keyof typeof captionTypefaces;
export type CaptionAnimation = "pulse" | "underline" | "illuminate" | "pop" | "slide" | "typewriter" | "impact" | "shimmer" | "rise" | "punch" | "rainbow" | "subtitle" | "orbit" | "vertical";
export type CaptionEmphasis = "auto" | "glow" | "color" | "pop";
export type CaptionTemplate = {
  id: string; name: string; description: string; captionStyle: string; animationStyle: string;
  font: CaptionFont; color: "pearl" | "gold" | "turquoise" | "lilac";
  animation: CaptionAnimation; accent: string; fill?: "metallic" | "rainbow";
  outline?: boolean; tracking?: number; plate?: boolean; emphasis: Exclude<CaptionEmphasis, "auto">;
};

export const captionTemplates = [
  { id: "neon-pulse", name: "Neon Pulse", description: "Electric captions for a midnight dance floor.", captionStyle: "Clean cyan sans with luminous edges.", animationStyle: "Singing words scale and glow; bloom follows your pulse tempo.", font: "clean", color: "turquoise", animation: "pulse", accent: "#ff73da", emphasis: "glow" },
  { id: "sacred-script", name: "Sacred Script", description: "Warm, graceful, and contemplative.", captionStyle: "Gold calligraphic serif with generous line spacing.", animationStyle: "Soft line entrance; a fine underline draws beneath each singing word.", font: "script", color: "gold", animation: "underline", accent: "#fff0c8", emphasis: "glow" },
  { id: "illuminated-verse", name: "Illuminated Verse", description: "A luminous page from an ancient songbook.", captionStyle: "Readable manuscript lettering, gilded initial, dark outline.", animationStyle: "Slow bloom and light rays frame emphasized words and phrase endings.", font: "gothic", color: "gold", animation: "illuminate", accent: "#ffe8a3", outline: true, emphasis: "glow" },
  { id: "pop-burst", name: "Pop Burst", description: "Bright, playful, and full of hooks.", captionStyle: "Heavy rounded pearl letters with candy-colored accents.", animationStyle: "Words arrive with a spring overshoot; emphasized words pop in color.", font: "rounded", color: "pearl", animation: "pop", accent: "#ff9fcf", outline: true, emphasis: "pop" },
  { id: "world-glyphs", name: "World Glyphs", description: "Flowing words, across languages and borders.", captionStyle: "Multilingual fallbacks, natural casing, full joined-script shaping.", animationStyle: "Whole lines glide in; active words receive a drawing underline.", font: "global", color: "pearl", animation: "slide", accent: "#8bf7df", emphasis: "color" },
  { id: "ink-echo", name: "Ink & Echo", description: "A handwritten note with an acoustic soul.", captionStyle: "Warm handwritten brush strokes with a soft shadow.", animationStyle: "Grapheme-safe progressive reveal; active words gently lift.", font: "brush", color: "pearl", animation: "typewriter", accent: "#ffc49e", emphasis: "color" },
  { id: "impact-cut", name: "Impact Cut", description: "Direct, punchy, and built for the chorus.", captionStyle: "Bold condensed headlines with a heavy dark stroke.", animationStyle: "Quick line slide, word punch-in, and a brief emphasis shake.", font: "condensed", color: "pearl", animation: "impact", accent: "#ffba69", outline: true, emphasis: "pop" },
  { id: "silver-cinema", name: "Silver Cinema", description: "Polished widescreen drama.", captionStyle: "Elegant serif in a silver metallic gradient.", animationStyle: "Slow fades and a traveling light sweep; phrase endings glow.", font: "classic", color: "pearl", animation: "shimmer", accent: "#c9e9ff", fill: "metallic", emphasis: "glow" },
  { id: "quiet-space", name: "Quiet Space", description: "Airy minimalism with room to breathe.", captionStyle: "Thin pearl sans with measured tracking; natural script spacing.", animationStyle: "A restrained rise and a fine active-word underline.", font: "thin", color: "pearl", animation: "rise", accent: "#c5e8e1", tracking: 0.09, emphasis: "color" },
  { id: "outline-anthem", name: "Outline Anthem", description: "Big words for a stadium-sized feeling.", captionStyle: "Heavy lettering with a deep, high-contrast outline.", animationStyle: "Singing words punch forward; hook words flash a warm accent.", font: "bold", color: "pearl", animation: "punch", accent: "#ffda73", outline: true, emphasis: "pop" },
  { id: "prism-flow", name: "Prism Flow", description: "A fluid spectrum of color and light.", captionStyle: "Clean sans with a vivid gradient and dark separation stroke.", animationStyle: "Smooth hue sweep, floating active words, and color-pop emphasis.", font: "clean", color: "pearl", animation: "rainbow", accent: "#b8ffeb", fill: "rainbow", outline: true, emphasis: "color" },
  { id: "clear-voice", name: "Clear Voice", description: "Crisp subtitles that put the words first.", captionStyle: "High-contrast white sans on a near-black caption plate.", animationStyle: "Short line fades with a gold active-word highlight.", font: "clean", color: "pearl", animation: "subtitle", accent: "#ffe28b", plate: true, emphasis: "color" },
  { id: "bubble-daydream", name: "Bubble Daydream", description: "Soft pastel joy with a little sparkle.", captionStyle: "Rounded lilac letters, plum outline, and pastel accents.", animationStyle: "Springy word pop-ups with slow orbiting dots around emphasis.", font: "rounded", color: "lilac", animation: "orbit", accent: "#b8fff0", outline: true, emphasis: "pop" },
  { id: "vertical-garden", name: "Vertical Garden", description: "A calm editorial composition for global poetry.", captionStyle: "CJK-friendly upright columns or a readable horizontal fallback.", animationStyle: "Columns reveal progressively; drifting lights follow the active glyph.", font: "global", color: "pearl", animation: "vertical", accent: "#e0efab", emphasis: "glow" },
] as const satisfies readonly CaptionTemplate[];

export type CaptionTemplateId = typeof captionTemplates[number]["id"];
export function getCaptionTemplate(id?: string): CaptionTemplate | undefined {
  return captionTemplates.find(item => item.id === id);
}

/** Load bundled Latin display faces before drawing or exporting. Browser font fallback
 * handles other scripts without transliterating, splitting, or altering lyric text. */
export async function loadCaptionFonts() {
  if (typeof document === "undefined") return;
  await Promise.all([
    document.fonts.load('600 48px "Studio Serif"'), document.fonts.load('italic 500 48px "Studio Serif"'),
    document.fonts.load('600 48px "Studio Hand"'), document.fonts.load('700 48px "Studio Gothic"'),
    document.fonts.load('700 48px "Studio Condensed"'), document.fonts.load('800 48px "Studio Rounded"'),
  ]);
}
