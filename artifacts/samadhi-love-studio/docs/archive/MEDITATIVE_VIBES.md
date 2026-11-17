# Meditative Vibes

Open Music & World Sounds → Meditative Vibes (or `?studio=meditative-vibes`). Existing navigation destinations and the eight main groups are retained.

## Library and creation

- 20 original synthesis presets: nine modern Solfeggio tones (174–963 Hz), a 432 Hz reference, five binaural difference rates (2, 6, 10, 20, 40 Hz), two smooth pulsed tones, and three combinations.
- Search and category filters; replace with a preset or append its layers. Up to six independently editable layers.
- Tone pitch 80–1200 Hz, difference/pulse rate 0.5–40 Hz. Binaural pairs use a left carrier and right carrier + difference. Pulse modulation changes amplitude; it is not binaural synthesis.
- 5–180 second stereo PCM WAV renders, 44.1 kHz, 16-bit. Up to 10-second audition, adjustable levels, progress and cancellation. No autoplay. Conservative summed headroom and smooth fades prevent clipping/clicks within this renderer; output level does not determine physical listening loudness.
- Download, save an original audio asset to My Songs (optionally linked to an existing project), or pass a rendered track into the existing Audio + Visual Studio. Voice capture remains in Recording Desk / My Voice; add the saved voice as another track in the mixer. Personal light-language text is a vocal direction note, not generated speech or a validated consciousness code.

## Persistence and privacy

Preset catalog definitions ship with the app. User-authored recipes are persisted through `/api/studio/meditative` in private, account-scoped R2 objects under `meditative-vibes/v1/<workspace>/sessions/<uuid>`, using the existing private audio-session service. No new schema migration, public publication, or edits to existing projects are required for saving a recipe. Audio export uses the existing audio-save flow and remains separate from the recipe.

Recipe writes require the existing private-workspace authentication and same-origin check. Payloads have bounded size, server-side frequency/level/duration validation, owned-project checks and optimistic revision checks. Save as new blend preserves an edited copy when a stale revision is rejected. Listings paginate beyond 100 entries. Device recovery uses the existing account-scoped recovery provider. Navigating away from unsaved recipe edits triggers the existing Studio guard; leaving the browser also warns while rendering or editing. Unmount cancels rendering and releases preview object URLs. Radio playback pauses while this workspace is active.

## Claims and provenance

These original oscillators and presets contain no Hemi-Sync recording, proprietary protocol, cloned voice or third-party sample. No affiliation is implied. The interface distinguishes Hz pitch from difference/pulse rate, requires stereo headphones for binaural separation, and states that specific wellness or altered-consciousness effects are not guaranteed. Solfeggio labels refer to a modern tradition, not established medical effects. Higher frequency is not intrinsically more beneficial.

## Verification

`npm run test:meditative` runs numerical synthesis/WAV/cancellation tests, simulated component controls, and mocked private API/storage checks. `npx tsc --noEmit` and `npm run build` verify type safety and production packaging. These checks do not establish perceived audio quality, physical device/headphone behavior, or therapeutic effects. Browser/device listening and real authenticated save/export checks still require manual verification.

## Guided meditations removed

The guided meditation catalog, narration player and scripts have been removed at the owner's request. Existing saved recordings remain in My Songs. Legacy frequency recipes can still open their tone layers; an old guide ID no longer starts narration. Frequency synthesis and independent recording/mixing tools remain available.
