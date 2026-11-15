# Signature lyric-video workflow

The existing Lyric Video Pro editor now offers the SAMADHI LOVE Signature Collection: Awaken, Violet Flame, and Unity. Preview a look before selecting a recording, or apply it in Step 4 of an existing video. Applying replaces visual background overrides and typography/layout settings. Existing Undo restores the prior design. It preserves source recording IDs, approved lyrics, cue/word times, sections' language/singer directions, export history, and account assets.

The presets combine existing background designs/caption renderers with bounded procedural light rays, rising lights, or connected-circle geometry. Wide, vertical, and square outputs receive individual safe-area layout defaults. This is a canvas-rendered visual system, not a new video editor or a third-party template format.

Independent controls adjust background speed, overlay design/strength, overlay motion, and lyric motion. BPM and the playhead beat-origin button control animation phase; they do not detect beats or change caption timing. Existing analyzed audio energy can still influence overlay brightness/size. System reduced-motion preferences are respected in previews; saved export motion remains the user's explicit choice.

## Before export

A shared readiness function drives both the export checklist and its blocking behavior. It checks project/range validity, required visual assets, source changes, caption presence in the excerpt, out-of-bounds captions, and real-time fallback constraints. Nonblocking review notes cover reading speed, estimated word highlighting, format previews, unreviewed alignment, and differences from the selected project master.

The preview offers explicit soundtrack-version confirmation. It is tied to the immutable source ID and selected enhancement asset; switching enhancements invalidates the confirmation naturally. Editing cue timing/text or approved lyrics clears a previously reviewed alignment flag. Manual captions can be marked reviewed without a provider-generated alignment.

Clean video can export without lyric cues. Only assets used by the current design and section overrides are loaded as export prerequisites. Export still validates the actual decoded soundtrack duration before rendering. The checklist does not certify audio quality, exact text bounds, device memory, platform approval, or successful browser encoding.

## Validation

Run `node scripts/test-lyric-video-pro.mjs`, `npm run test:workflow`, `node scripts/verify-lyric-pro-api.mjs`, `npx tsc --noEmit`, and `npm run build`.

New tests cover three presets/all formats, preservation of audio/timing/directions, layer validation/portable templates, deterministic overlay geometry, beat phase, render blockers, clean videos, source/master comparisons, and simulated clicks on preset/layer controls. Browser-control tools were unavailable during this implementation; actual canvas appearance, microphone capture, video encoders, real devices, and live provider calls remain unverified.

Direct social publishing, distributor submission, audio inpainting, a template marketplace, and offline video editing are not implemented by this update.
