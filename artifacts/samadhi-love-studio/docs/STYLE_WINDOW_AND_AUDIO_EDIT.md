# Expandable styles, creator workflow and audio editing

Baseline source: published version 81, commit `ec12f62f023c095e29c25de790212f541ec2b355`. Existing projects, branding, membership/billing behavior and external integrations are retained.

## Styles and pasted direction

The shared picker already allowed eight selections in source; a universal two-selection cap was not reproduced. Its selection tray now explicitly displays the count, wraps every selected chip without a fixed-height clip, and remains visible when its options are compacted. Expand styles window opens the larger genre browser. Removing a chip frees its slot; unknown custom genre names still work.

Quick Create, detailed Create and New Song offer Or paste your own music / style prompt. In Create it uses the same description state, so the existing device recovery and saved-prompt flow retain the text. New Song passes the text into the new song's creative notes. Recognition reuses the existing catalog-name/alias detector: the user can review detected labels, apply them, or send the description without genre chips. Unrecognized instructions are still retained as text. Detection is keyword-based, not an acoustic genre classifier or a promise of identical behavior to another provider.

Guided Create previously included the selected styles in prompt text but did not send the genre list for saved tag metadata. It now sends that list, and project workflow/remix/new-version handoffs carry saved genres into the creation editor. The complete combined prompt is checked against the existing 1,600-character provider limit; oversized descriptions are kept editable instead of silently truncated.

## Give your idea a sound — workflow inspection

| Capability | Existing path / adjustment |
|---|---|
| Creation | Quick Create retains connected vocal/instrumental generation, local instrumental sketches, Simple/Custom modes and optional lyric entry. No live paid requests were used in testing. |
| Adding/removing styles | Visible selected tray, count, larger browser, custom labels and reviewed prompt detection; eight selections exercised end-to-end in simulated generation requests. |
| Editing | Completed song cards now expose Edit audio directly. Details, lyrics/prompts, song sections and video tools retain their existing handlers. |
| Recording/mixing/adding audio | Simple song actions now expose Add / record voice and Mix / add audio, reusing the existing Vocal Studio and mixer handoffs. |
| Saving | Successful creations continue to save privately to My Songs. Unconfirmed local instrumental saves keep retry and original download; an explicit confirmed discard removes only the local pending take. |
| Removal | Existing song deletion/restoration policy remains intact. Deleted songs no longer remain displayed as the current Quick Create result. Audio cuts save a new version rather than replacing the source. |
| Downloads | Existing original-format and conversion controls remain in Song actions; edited previews also provide an MP3 download before cloud saving. |
| Sharing / online destinations | Publish & share opens the artist release review. Existing private sharing, device sharing, social shorts, export packages and external upload/distributor links remain. These do not constitute automatic delivery to Spotify or every social service. Quick result handoffs are disabled during active saving/generation. |

## Crop, cut and automatically join

The existing SongSectionEditor, clip-planning functions, streaming renderer and authenticated upload/save path are reused. Edit audio opens this workspace from every ready, available song card. It now offers:

- Source duration, original playback, a bounded streaming waveform overview, tap-to-set boundaries, range sliders and exact second fields.
- Cut selection & close the gap for the beginning, middle or end.
- Crop / keep only the selection.
- Existing replace/insert/import/generated-section functions, retained as separate edit modes.
- A short default join blend, editable by the user; crossfades slightly shorten the result by their overlap, which is reflected in the displayed edited duration.
- Selection audition, rendered preview, MP3 download and Save as a new version. The source song and recording are unchanged, and the saved edit retains project/source lineage.
- A changed selection marks its earlier preview stale and prevents saving that preview until rerendered. The previous preview remains downloadable. After saving a version, users can make another edit on that version.

The existing renderer supports ten-minute edits and writes MP3; conversion does not make it a lossless edit. The waveform is a downsampled overview, not sample-accurate visual certification. If waveform decoding is unavailable, exact time fields remain accessible, while actual preview rendering still depends on the source codec/browser. Changes in timing require review and realignment of existing lyric videos. The existing section-edit API validates owned source audio and protects the original.

## Verification

- `npm run test:genres`: 14 passing tests, including eight visible selections, remove/reselect, pasted direction, metadata, seed preservation and over-limit rejection without sending.
- `node scripts/test-song-presets.mjs`: 7 passing tests, including pasted direction saved with the new song and retry preservation.
- `node scripts/test-creator-workspace.mjs`: 11 passing creator/video workflow regressions.
- `npm run test:library`: 8 passing song-action/sharing/removal regressions.
- `node scripts/test-party-files.mjs`: 8 passing assembly/file tests plus real streaming PCM/LAME MP3 encoding of synthetic authorized audio, independently checked with FFmpeg. No live provider requests.
- `npm run test:audio-edit`: 4 passing tests for crop/cut ranges, gap closure, waveform coordinates, stale preview protection, source-preserving new-version saves and visible card handoffs. Editor browser/encoder/storage dependencies are mocked in its component test. An additional real PCM waveform and crop/middle-cut MP3 check independently verifies kept/removed frequencies and join continuity with FFmpeg.
- TypeScript and production build passed.

Total: 52 automated tests plus actual streaming encode/decode and crop/join signal checks. Real authenticated browser layout, touch behavior, microphones, deployed file exports and live provider/distributor operations remain unverified; no browser-control tool was available. Source checks and simulated controls do not establish every real device's behavior.
