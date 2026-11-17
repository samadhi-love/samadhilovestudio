# SAMADHI LOVE Studio: professional lyric video templates

| Name | Vibe | Caption styling | Animation rules |
|---|---|---|---|
| Neon Pulse | Electric captions for a midnight dance floor. | Clean cyan sans with luminous edges. | Singing words scale and glow; bloom follows your pulse tempo. |
| Sacred Script | Warm, graceful, and contemplative. | Gold calligraphic serif with generous line spacing. | Soft line entrance; a fine underline draws beneath each singing word. |
| Illuminated Verse | A luminous page from an ancient songbook. | Readable manuscript lettering, gilded initial, dark outline. | Slow bloom and light rays frame emphasized words and phrase endings. |
| Pop Burst | Bright, playful, and full of hooks. | Heavy rounded pearl letters with candy-colored accents. | Words arrive with a spring overshoot; emphasized words pop in color. |
| World Glyphs | Flowing words, across languages and borders. | Multilingual fallbacks, natural casing, full joined-script shaping. | Whole lines glide in; active words receive a drawing underline. |
| Ink & Echo | A handwritten note with an acoustic soul. | Warm handwritten brush strokes with a soft shadow. | Grapheme-safe progressive reveal; active words gently lift. |
| Impact Cut | Direct, punchy, and built for the chorus. | Bold condensed headlines with a heavy dark stroke. | Quick line slide, word punch-in, and a brief emphasis shake. |
| Silver Cinema | Polished widescreen drama. | Elegant serif in a silver metallic gradient. | Slow fades and a traveling light sweep; phrase endings glow. |
| Quiet Space | Airy minimalism with room to breathe. | Thin pearl sans with measured tracking; natural script spacing. | A restrained rise and a fine active-word underline. |
| Outline Anthem | Big words for a stadium-sized feeling. | Heavy lettering with a deep, high-contrast outline. | Singing words punch forward; hook words flash a warm accent. |
| Prism Flow | A fluid spectrum of color and light. | Clean sans with a vivid gradient and dark separation stroke. | Smooth hue sweep, floating active words, and color-pop emphasis. |
| Clear Voice | Crisp subtitles that put the words first. | High-contrast white sans on a near-black caption plate. | Short line fades with a gold active-word highlight. |
| Bubble Daydream | Soft pastel joy with a little sparkle. | Rounded lilac letters, plum outline, and pastel accents. | Springy word pop-ups with slow orbiting dots around emphasis. |
| Vertical Garden | A calm editorial composition for global poetry. | CJK-friendly upright columns or a readable horizontal fallback. | Columns reveal progressively; drifting lights follow the active glyph. |

## Use in Studio

Open Lyric Videos, choose a recording, and select one of the 14 professional caption templates. Lyrics and existing timings stay intact. Estimate timings or align the pasted lyrics if no cues exist yet. Play the recording to preview, then Save lyric timing and Export lyric video. You can browse templates and play a silent example before uploading a recording.

Font and color controls customize the selected template. Silver Cinema and Prism Flow keep their metallic and rainbow fills. The original six scene presets remain available separately; choosing one returns to basic caption styling. Changing a background or video format preserves the chosen professional caption template.

Each caption has an emphasis menu (Template rule, Illuminate, Color pop, Pop-up) and selectable word chips. Automatic emphasis chooses phrase endings and the listed hook words. Clicking a word switches that caption to explicit word selection; selecting none disables extra emphasis. Reset automatic emphasis restores the template rule. Emphasis occurs when the word is active, rather than remaining bright throughout the song.

Full, Gentle, and Still settings control caption movement. New unsaved projects respect the browser reduced-motion preference. Pulse tempo is a configurable 40–240 BPM oscillator; there is no automatic beat or strong-syllable detection. The brief Impact Cut shake occurs at emphasized word onsets. All effects use aligned word starts when available; manually timed lines estimate word pacing across the line interval. Check timing by listening before export.

Arabic, Hebrew, and joined Indic scripts render as shaped full lines with clipped emphasis overlays. Tracking is disabled for joined scripts and CJK. Letter reveal follows grapheme boundaries and clips the shaped line without detaching its letters. Vertical Garden uses upright columns for Chinese/Japanese captions; other scripts use the horizontal fallback. Multilingual glyphs use browser/system font fallbacks; bundled decorative faces primarily cover Latin. No lyric text is transliterated or rewritten.

## Implementation files

- app/lyric-caption-templates.ts — typed catalog, font mappings, font readiness helper
- app/lyric-caption-render.ts — wrapping, pacing, typography, gradients, motion, emphasis, CJK columns
- app/lyric-caption-picker.tsx — accessible selection cards, rule summaries, silent animated example
- app/lyric-caption-templates.css — local font faces, responsive cards, word chips
- app/lyric-video-data.ts — optional persisted configuration and validation, preserving older projects
- app/lyric-video-render.ts — shared canvas entry point used by preview and export
- app/lyric-video-studio.tsx — editor controls, saving, per-word emphasis and export integration
- app/layout.tsx — stylesheet import
- public/fonts/lyric/ — six bundled SIL Open Font License display faces and their licenses

## Install this code into the existing app

The implementation is already integrated into SAMADHI LOVE Studio. For another checkout of the same app, copy the bundled app/ and public/ files to matching paths. Merge the stylesheet import into app/layout.tsx if it has additional local changes. The files depend on the app's existing lyric timing, Song, ElevenLabs settings, canvas export, and help components; this is an extension to that app rather than a standalone project. No new npm runtime dependencies are required.

Run the existing dependency installation if needed, then:

```sh
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
```

## Apply a template programmatically

```ts
import { getCaptionTemplate, loadCaptionFonts } from "./lyric-caption-templates";
import { drawLyricVideo } from "./lyric-video-render";
import type { LyricProject } from "./lyric-video-data";

const preset = getCaptionTemplate("neon-pulse")!;
const project: LyricProject = {
  ...existingProject,
  captionTemplate: "neon-pulse",
  font: preset.font,
  color: preset.color,
  intensity: "full",
  bpm: 100,
  captionLayout: "auto",
};
await loadCaptionFonts();
drawLyricVideo(context, audioTime, project, songTitle, backgroundImage);
// Persist project on song.lyricVideo through the existing save handler.
```

The same drawLyricVideo call is used for every exported video frame, so animations are burned into the video. Always await the bundled fonts before capturing export frames. SRT/VTT caption downloads preserve text and timing and cannot carry these animated styles.

## Persisted configuration example

```json
{
  "captionTemplate": "neon-pulse",
  "font": "clean",
  "color": "turquoise",
  "intensity": "full",
  "bpm": 100,
  "captionLayout": "auto",
  "theme": "cosmic",
  "motion": "drift",
  "format": "vertical",
  "cues": [{
    "text": "Love and light",
    "time": 0,
    "end": 3,
    "words": [{"offset": 4, "time": 0}, {"offset": 8, "time": 1}, {"offset": 14, "time": 2}],
    "emphasis": "glow",
    "accentWords": [14]
  }]
}
```

Offsets count UTF-16 code units at the end of a word, matching the existing alignment API. captionTemplate, intensity, bpm, captionLayout, emphasis, and accentWords are optional. Omit accentWords for automatic emphasis; use an empty array for none. Caption validation rejects unknown template IDs and invalid tempo/word offsets. Saving reuses the existing Studio persistence API; no database migration is needed.

## Verification

TypeScript and the production build pass. A native canvas verification rendered 1,260 frames across all 14 templates, three aspect ratios, and six text cases, including Arabic, CJK, emoji/combining marks, and long lines. It verified distinct template previews, aligned timing, old-project compatibility, invalid-setting rejection, wrapping bounds, and static output in reduced-motion mode. Browser interaction and MediaRecorder playback/export were not tested because browser-control tools were unavailable in this session.
