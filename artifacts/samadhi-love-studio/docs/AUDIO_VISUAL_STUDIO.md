# Audio + Visual Studio

This extends the existing Multitrack Mixer under **Recording & Production → Audio + Visual Studio**. The original mixer, Vocal Studio, Lyric Video Pro, all backgrounds/caption styles, saved projects, provider connections and sharing tools remain available. A direct entry is `/?studio=multitrack` after sign-in.

## Workflow

1. Choose a project and add library audio, your own recording, reusable voice performances, or imported stems using the existing tools.
2. Use the shared playhead to audition the mix and visual canvas. Track placement, trims, level, mute/solo and effects remain editable. Detailed mixer controls are below the visual workspace.
3. Copy a saved timed lyric project and choose the matching vocal track as its timing anchor. Imported source captions are copied, never rewritten. Listen and explicitly review timing. Existing caption alignment tools are linked for songs that still need alignment.
4. Choose caption styles/backgrounds, section scenes and stem/MIDI mappings. Preview wide, vertical or square; text wraps per format. Position/size overrides are saved separately per format. Lead captions and labeled ad-lib/backing callouts render independently. Uploaded artwork/logo references from the source lyric project remain private and reusable by the same account.
5. Save the editable mixer session to retain original tracks, visuals, mappings, markers, feedback and split planning in the account. Save session copy creates an independently editable, named Vibe version associated with the same project when selected. These are session copies, not an arrangement-branch merge graph.
6. Render a full video or excerpt, with optional clean video and sequential three-format export. Download completed files from the active tab. SRT/VTT/LRC use mapped mix time and shift excerpt timing to zero. Finished video files are local downloads; this action does not publish, pin a new master, or add a video to the existing release library automatically.

## Timing and signal model

One Web Audio context schedules all audible sources against a common clock. The canvas reads that clock, rather than running an independent animation timer. The live and offline engines share the same per-track filter/EQ/gain/pan/compression/reverb/echo graph builder. The live preview uses conservative headroom; the exported mix retains the existing peak normalization. They are not claimed to have identical output loudness.

Editing a track reschedules playback from its current timeline time. A brief restart can occur; gapless live editing is not promised. Moving/trimming a lyric anchor transforms caption and word timestamps and anchored section markers by `placement - trimStart`, clipping them to the retained part. Original source timing stays intact. New section markers stay in mix time. A changed vocal trim requires a fresh boundary-word review; simple placement changes preserve that review. Source changes, changed words or time stretching require realignment; a vocal stem itself does not establish word timing.

Per-stem analysis measures bounded, cached relative RMS energy and positive energy changes at 20 Hz from real source samples. Mappings drive restrained background camera zoom, light, hue, or caption scale in both preview and export. Mute, solo, placement, trimming and level affect those signals. EQ, reverb/compression tails and other effects are not reanalyzed as post-effect signals. The system does not classify a drum as a kick/snare, measure pitch-driven typography, or provide probability/confidence scores. Choose the actual stem yourself.

MIDI import accepts standard format 0/1 files with PPQ timing, tempo maps and running status. Note-on velocity drives effects; channel-10 notes 35/36 and 38/40 can supply explicit kick/snare triggers. This is MIDI-trigger rendering, not a new MIDI instrument engine. SMPTE and format 2 are unsupported. Limits are 2 MiB, 2,000 note-on events and eight minutes. Imported MIDI keeps its own tempo-map timestamps when the manual BPM field changes.

The same deterministic frame renderer evaluates section themes, bilingual captions, callouts and mappings at the output's source time. Caption scaling preserves layout rather than recomputing line breaks on every pulse. Clean exports omit captions. Preview guides, editor controls and Creator activity/waveform displays are excluded from finished videos.

## Creator view and production records

Creator view frames the visual, lyrics, manually supplied key/chord notes, a source-input waveform and relative stem activity for screen recording. It does not start an internet broadcast or recognize chords automatically. Timestamped notes and collaborator percentages are private planning records in the account session; they are not multiplayer comments, signed split agreements or automated payments. Production notes can also download as JSON.

## Persistence and boundaries

Audiovisual data is an optional addition to version-1 mixer sessions. Old sessions still validate and reopen, using default visuals. The original storage namespace and immutable audio IDs remain. The private backend validates settings, bounds metadata, preserves existing revision conflicts and checks that linked media/song records belong to the authenticated workspace. No schema migration or account change is needed.

Maximums: six mixer tracks, eight-minute arrangements, 40 scene markers, 12 mappings, 60 notes, 12 split-plan entries and 300,000 metadata characters per mixer session. Existing source/decode budgets still apply. Completed video links have a combined 180 MiB memory budget and can be cleared after download. Long 1080p or multi-format exports can exceed a phone's memory; prefer 720p or an excerpt when needed. Cancellation can wait for an already running offline audio-render step to return.

Rendering uses the existing browser WebCodecs/MediaRecorder pipeline. H.264/AAC MP4 depends on encoder availability; the existing supported fallback may produce WebM. The page must remain visible and open. There is no new cloud-render queue or background-render promise.

## Verification

`npm run test:audiovisual` checks transformed word/scene timing, actual source-sample triggers, mute/solo behavior, MIDI tempo/running-status handling, legacy/new session serialization, preservation of copied lyrics/artwork, shared-clock scheduling and simulated controls. The private API suite additionally checks visual save/reopen, original preservation, invalid metadata and cross-account denial. These are included in `npm run verify:studio`.

Native canvas QA exercises actual shared-frame rendering in wide/vertical/square layouts and a complete 180-second synthetic song using a separate FFmpeg verification harness. That harness validates rendered pixels/container codecs, not the browser encoder, real microphones, live sung-word recognition or physical-device performance. Browser/device acceptance testing remains necessary; the Sites-required browser-control helper is unavailable here.

Still outside this implementation: simultaneous multiplayer editing, phone-monitoring transport, generated music-video scenes with character identity guarantees, automatic pitch-driven typography, a full MIDI DAW, true branch merging, and durable server rendering. No external provider account or paid service was provisioned.
