# Party Files, song versions and caption-ready production

November 13, 2026 UTC. This extends the existing SAMADHI LOVE Studio project `appgprj_6af2936d32488191a41ff8ccab32ed79`; it does not create another application or replace its libraries. The DB/R2 bindings, per-user ownership, provider connections, billing and existing recording/video tools are retained. This extension stores optional fields in existing Studio and Party JSON; no new database migration is required.

## Where to find the changes

Create starts with **Music Creation**, followed immediately by **Make your creation visual**. Browse lyric-video templates or choose a saved song to open its linked Lyric Video Pro project. Lyric Videos & Shorts is the second main creation destination. Detailed production tools remain optional.

**Build a Party → Party Files** supports one to four files. Each file can assemble up to 24 authorized sources, with a maximum of 30 minutes: My Music, reviewed catalog audio, uploaded local files and recorded voice. Set a genre blend and instructions independently per file. Select the order and a shared 0–20-second crossfade. Without Repeat, the export ends when the sources end or the maximum is reached. With Repeat, it fills the target length. Original playback speed and pitch are preserved; this is not automatic beat/key matching.

Each rendered file saves as a private My Music item with Play/Stream and MP3 download. Render all files before combining them into a continuous set of up to two hours. Source revisions invalidate the relevant render. Source credit notes are embedded in MP3 metadata and available as a text download; creators remain responsible for applicable rights and attribution.

The recorder requests microphone permission, offers available device selection, supports up to five minutes, and provides preview/download/save. Existing private voice takes can also be reused. Source uploads are capped at 96 MB; rendered mix uploads at 128 MiB. Rendering runs locally and stops when the page closes. The original recordings are not overwritten. A completed render is retained in the tab for save retry or download if its cloud save fails.

Prompt generation uses several actual authorized provider requests of up to four minutes each, with crossfade allowance. A 30-minute file is an assembled set, not a single 30-minute AI song. Cost is estimated before explicit approval; actual provider duration/quality can vary. Completed parts and request receipts save separately so resuming can recover successful requests. Stop during generation finishes the current provider request; it cannot promise to cancel an upstream charge already incurred. An unresolved request is flagged for inspection in My Music/Usage before another attempt.

## Song sections, stems and MIDI

Each recorded song's actions include **Edit song sections** and **Stems & MIDI**. The section editor can remove, insert or replace a range with another owned recording or authorized uploaded excerpt. An optional provider-generated replacement uses the existing metered generation path. It does not claim contextual AI inpainting, an identical singer or a guaranteed seamless musical transition.

Crossfades and a preview are rendered through the same MP3 engine. Save creates a new recording in the original project. Original audio and writing remain intact. Approved lyrics are retained as a reference, but previous caption timings are not attached to a changed arrangement; review words and realign. Replacing an edited recording clears the old edit recipe from the current audio and preserves it in that recording's history. Section renders are limited to ten minutes rather than silently cutting a longer song.

Stems reuse the existing genuine instrumental WAV/MIDI exports where present, or authorized provider vocal/instrument and supported six-stem separation. A separate downloadable marker MIDI contains tempo and section events. It is explicitly a cue map, not inferred instrumental notes from a mixed recording. Arbitrary audio-to-note MIDI is not newly implemented.

## Clear vocals and automatic captions

Sung Studio generation defaults to caption-ready directions: intelligible forward lead vocals, clear consonants, manageable phrasing, breathing space, restrained reverb and reduced instrumental masking. These are directions to the provider, not a guarantee of perfect singing, accent or transcription. Instrumental generation remains instrumental. Approved supplied or generated lyrics, section structure, composition plan and final audio identity are saved together before requesting the audio.

Lyric Video Pro retrieves the saved words automatically and uses real ElevenLabs forced alignment against the completed performance. The automatic API also selects alignment when matching saved lyrics exist and transcription otherwise. Words remain the approved reference; only display line grouping changes. Arabic graphemes and mixed-language text are preserved. Historical generation lyrics are only recovered for their matching immutable audio asset.

Successful timed captions save before the optional additional recognition comparison. A failed or declined comparison retains the synchronized project instead of discarding a paid alignment. Recognition differences and timing warnings are review aids; approved words are not silently rewritten and reliable word confidence is not fabricated. Edited arrangements require fresh alignment. Existing karaoke, caption styles, background templates, clarity analysis, multilingual controls and video export are reused.

Provider alignment currently accepts up to 5,000 characters, 200 caption lines and ten-minute recordings. Longer/denser material needs an excerpt or editing. Recognition of singing, dialects, overlapping voices and ad-libs still needs human review. The captions remain a correction-friendly draft.

## Validation and limits

The full verification result is in `STUDIO_CONSOLIDATION_QA.json`. Tests include a genuine 30-minute stereo 44.1 kHz MP3 produced by the actual streaming decoder/mixer/LAME pipeline from authorized synthetic audio, verified with FFprobe and FFmpeg at the beginning, middle and end. Encoding is incremental with one second of output PCM and at most two active source decoders, rather than allocating the full uncompressed set. Codec padding is normal and the measured file is approximately 1,800.046 seconds.

Unit/DOM/API fixtures cover four-file and duration limits, crossfades, generation approval/resume receipts, recording cleanup, source ordering, section edits, marker MIDI, owner-scoped saves, rights confirmation, foreign-source rejection, private-only Party Files, upload retry, immutable audio history and saved-lyric alignment. They use isolated storage/provider fixtures and no paid live calls or user-data changes. The MP3 codec test uses real processing; the microphone test uses a MediaRecorder mock.

No real browser or physical device was tested because the required browser runner is unavailable. Native decoding support, microphone hardware, multi-hour output, mobile memory/performance, real provider output and production account save/reopen/export remain unverified. MP3 download streaming is an on-demand saved file, not continuous public radio. The existing radio remains separate; server radio, server render queues and direct social publishing are still unfinished. Provider processing needs the existing authorized connection and applicable plan/credits. Subscription/payment configuration and production scheduled-deletion activation retain their separately documented limitations.
