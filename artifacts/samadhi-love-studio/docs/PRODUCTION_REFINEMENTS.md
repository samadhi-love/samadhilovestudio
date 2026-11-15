# Reusable voice, stem handoffs and reviewed beat animation

## My Voice

The existing microphone capture and vocal-session account saves remain in place. Vocal Studio now adds an independent private **My Voice** collection:

1. Record or import an authorized vocal performance in Vocal Studio.
2. Save the vocal session to the account. Select a non-instrumental take.
3. Name it, confirm performer permission, and choose **Save original to My Voice**.
4. Select that saved recording in Vocal Studio or Multitrack Mixer and add it to a production.

The collection stores an independent immutable copy of the original source recording, not a processed clip or a cloned voice model. Trims/effects remain editable in the production session. Copies stay available if a source session changes. The API validates authentication, origin, saved-session/source membership, names and permission confirmation. Each account has its own namespace and paginated list. No generation service receives the saved voice. Existing Recording Desk → Song Library saving is unchanged.

MIME sniffing helps older session recordings that were served as generic binary. Browser codec support still governs playback and decoding. New mixer audition controls pause competing audio within the mixer and on workspace exit; shared player cleanup pauses playback on unmount.

## Connected production order

Project Workflow now guides generation → record/produce → actual multitrack mixing → final soundtrack selection → lyric alignment/visuals → release preparation. Production notes remain accessible as a separate action. The video entry prefers the pinned master's song when available; the existing source confirmation/readiness checks still require review if recording versions differ. No recording or caption project is silently replaced.

## Stem handoff

After provider separation, users can still download the ZIP and can now open it directly for mixer audition. Users may also open their own stem ZIP. Supported audio is filtered, traversal paths and non-audio files are excluded, and archives are bounded to 120 MiB compressed, 128 MiB unpacked, 96 MiB per file and 12 audio entries. Users choose only as many parts as available mixer slots (six tracks total). Large archives can be imported as individual files.

Selected stems decode and validate before any new tracks are committed; failure leaves existing tracks unchanged. Original parts, trims, mute/solo, level/EQ/effects and project lineage can be saved in the editable mixer session. This update does not invent replacement instruments or synthesize new stems.

## Beat estimation and correction

Lyric Video Pro can estimate a fixed-tempo beat grid from the selected soundtrack using onset-envelope analysis. Analysis runs in a dedicated browser worker. The automatic tempo search is 60–180 BPM; manual animation controls remain 40–240 BPM. Silence or insufficient attacks return an error rather than a fabricated estimate. This heuristic is not a probability/confidence score, downbeat detector, or adaptive tempo map.

Users can correct individual beat times, rebuild a grid from tempo/origin and explicitly mark it reviewed. A reviewed grid drives lyric/overlay pulse timing only for its matching source/enhancement identity. Stale/unreviewed grids fall back to manual animation timing. Changing manual tempo/origin pauses reviewed-grid use until review. Actual sung-word timestamps are unchanged. Caption timing and beat timing remain separate.

Projects persist the bounded grid as optional Pro metadata. Portable visual templates do not copy source-specific beat analysis. Old projects remain valid. Synthetic percussion at 90/120/150 BPM is tested; performance and accuracy on real genres, syncopation, rubato, mixed meters and devices require listening tests.

## Mix measurements

Vocal mix previews now show sample peak dBFS, RMS, sample rate/channel count and full-scale sample counts. These checks do not implement LUFS, oversampled true-peak metering, or professional mastering. Invalid samples produce a visible measurement error instead of crashing the editor.

## Validation and scope

```
npm run test:production
npm run test:voice-rights
npm run test:workflow
node scripts/test-lyric-video-pro.mjs
node scripts/verify-lyric-pro-api.mjs
npx tsc --noEmit
npm run build
```

Tests cover source preservation, private voice copying and reuse, synthetic beat timing/validation, stale-grid fallback, explicit review, bounded ZIP handling, all-or-nothing mixer imports and level measurements. Browser-control tools remain unavailable: actual microphone hardware, live provider separation, real-song beat quality, visual appearance, and browser exports are not certified by these tests.

Audio inpainting, conversational project control, Style DNA profiles, direct publishing/distribution, cloud rendering and advanced mastering remain separate work. The existing rights notes and optional, unconfigured AudD integration are unchanged. No accounts or paid services were created, no data migration/deletion was performed, and existing routes/branding are preserved.
