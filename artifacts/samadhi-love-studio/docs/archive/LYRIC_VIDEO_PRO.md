# Lyric Video Pro — implementation and verification

## Existing application reused

This upgrade extends the existing Studio rather than replacing it. It retains the classic lyric editor; private Studio/R2/D1 storage; the original song, recording, vocal, mix, library, Party Room, release and community tools; the saved ElevenLabs key vault and settings; the existing Music v2.5 generation, forced-alignment, Scribe transcription and stem-separation paths; the 14 caption templates; canvas drawing; device sharing; and the real MediaRecorder fallback.

No sharing policy, provider credentials, database schema, applied migration, or existing recording is replaced by this deployment. The existing Studio save API preserves server-owned audio history and generation provenance. Source replacement now appends an original-recording reference rather than overwriting its bytes.

## A. Core workflow

The existing Lyric Video navigation opens a bright, five-stage Pro workspace with two starts: **Create Song + Lyric Video** and **Use an Existing Song**. The classic editor remains available alongside it. The landing screen exposes the sacred background gallery, color/scene templates, lyric-style choices, and a real canvas sample preview before a recording is selected. Explicitly chosen starter looks carry into the next recording. A direct Backgrounds & lyric styles button opens the visual controls for an existing project. Cosmic is the default workspace appearance; an optional Light preference is kept on the device. The direct URL query `?studio=lyric-video` opens this workspace.

- My Songs and My Originals retrieve their saved lyrics and any existing word/line timing automatically.
- Uploaded authorized audio is kept through the existing upload path. MP4/WebM/MOV imports use the browser's decoder, retain the untouched video privately, and extract a 192 kbps MP3 audio copy. That copy is labeled separately from the original video.
- A saved mix with attached audio is selectable. Link-only mixes must have an authorized local audio export attached once; source lyrics are carried over. Studio does not download streaming links or bypass restrictions.
- Caption generation aligns the approved lyrics, or transcribes when no lyrics are saved. An optional independent transcription pass compares heard and approved words. The UI discloses the additional provider request/credits. It flags possible missing, added, changed or repeated words without rewriting the approved text.
- Broad language detection and speaker tags are used when returned. Fast/invalid/estimated timing is flagged. Reliable word confidence scores are **not** available, and no percentages are invented. An automatic forced-alignment result alone cannot prove that a singer performed every approved word.
- Captions appear on the real song preview. Review, word/line timing edits, word emphasis, a waveform, loop playback, preview speed, tap-to-time fallback, undo/redo, and manual estimation remain available.
- The current edit autosaves privately through a field-specific endpoint with conflict checks. Named R2 snapshots support restoration and alternate visual versions. An account-scoped local recovery copy supplements cloud saves when edits are not yet saved; it is removed after successful saving.
- Replacing the source keeps the previous audio available. Pro warns when timings belong to an older recording. Choosing current audio requires realignment and saves the preceding project version first.
- Finished videos save privately with the song when within the per-file limit and appear in My Originals, song details, and the Release Board. Device sharing and existing upload-page links remain explicit actions. There is no new automatic public publishing.

## B. Caption-ready production and clarity

Caption-ready generation uses the existing authorized ElevenLabs connection. A user can request a lyric draft through the existing Music planning service, edit it, and approve the exact text before generating the audio. The original approved lyrics, section headings, provider composition plan, model, generated recording ID, and generation date remain linked. Before the audio request begins, the approved writing draft is saved; failed generation retains that draft and refreshes the client revision instead of losing the lyrics. The current Music response is binary audio rather than word timestamps; Studio aligns the completed performance instead of claiming timestamps were supplied.

Directions recommend a forward intelligible lead, clear consonants, manageable phrasing, breath spaces, restrained reverb, and an appropriate vocal/instrument balance. Solo, duet, call-and-response and multilingual directions are available. Those directions do not guarantee performance accuracy or exact dialect/accent. Saved Voice Design/TTS profiles are not falsely presented as selectable singing voices; this path neither clones a person nor selects an unsupported voice ID for Music.

The optional **Analyze & Improve Clarity** tool creates separate files for caption analysis and the final soundtrack. It reuses the existing vocal de-essing/quiet-noise code with gentle low-cut EQ, presence shaping, causal compression and peak protection. Noise attenuation is off by default. There is no automatic pitch correction, time stretching, lookahead, padding, or sample insertion. Before/after players and independent analysis/soundtrack switches keep the original soundtrack unchanged unless the user explicitly chooses the enhanced version.

The existing two-stem service can supply an analysis vocal stem. Studio retains the archive, checks the decoded stem's full-length duration, and offers an explicit measured offset. Equal duration does not prove zero provider/codec delay; this remains a review step. It does not promise to distinguish two overlapping leads or remove all background speech. A failed or differently sized stem does not replace the original.

## C. Visual and multilingual tools

Eight curated starting looks cover cosmic/celestial, spiritual/uplifting, futuristic, Arabian elegance, nature/cinema, minimal typography, melodic house/dance, and intimate R&B/acoustic. They use the existing scene assets and 14 editable caption templates. The visible background library now has 12 sacred-image/master designs, 12 background scenes and 12 color palettes (36 total). The original portraits remain, with six additional original vector sacred motifs and four additional vector scenes. Each collection is available before choosing a song and in the editor; backgrounds can apply to the whole video or the current section. Uploaded JPG/PNG/WebP backgrounds (up to 15 MB) and PNG/WebP logos persist privately. A background selected before a song previews locally and stays in that tab until a song is chosen and the image can be saved with it. “Save current look as template” downloads a portable Studio visual-template JSON with current styling/layout and an embedded uploaded background when present. “Import visual template” accepts that JSON (up to 21 MB) or extracts visual settings from an existing Studio project JSON. It does not copy source songs, lyrics or timing. Private media references in older project exports are not transferred; upload that artwork separately. Native CapCut project files are not supported. Song-section markers can change scenes, and artist names, credits, silent intros/outros, translation and transliteration layers are editable.

Arabic is drawn as shaped full lines, preserving connected characters, punctuation and diacritics. Mixed right-to-left/left-to-right lines use phrase-level emphasis when word-mask geometry would be ambiguous. Other supported scripts use font fallbacks rather than transliteration or rewriting. Translation and transliteration are **manual editable layers**, not an unimplemented automatic translation service. Broad Arabic detection cannot guarantee Lebanese, Egyptian or Khaleeji dialect recognition; supplied wording is retained. English, Arabic, Turkish and Russian request options are available subject to the actual provider/model and account permissions.

Waveform analysis computes real RMS energy and amplitude-onset accents. These can modulate visual brightness. They are not advertised as a guaranteed tempo/beat grid; template BPM oscillation remains an artistic pulse. Captions keep independent safe placement and restrained/reduced-motion options. Position, font size, outline, shadow and line-spacing overrides are saved separately per aspect ratio. Face/subject detection is not implemented; users can reposition text themselves.

## Real video export and limits

The Pro exporter uses the existing Mediabunny dependency with WebCodecs. When H.264 and AAC encoding are supported, it muxes genuine 1080p/720p MP4 at 30 fps from timestamped canvas frames and trimmed audio. It inspects the completed container's actual video/audio codec strings. MP4 is never simulated by changing a filename. The existing MediaRecorder path is retained for browsers without both encoders and returns an accurately labeled supported MP4 or WebM. Intros/outros require the deterministic WebCodecs path; fallback explains this rather than silently changing output.

Full songs and excerpts share source time. Clip caption exports shift line/word times; silent intros shift them forward. Batch export runs vertical 9:16, landscape 16:9 and square 1:1 sequentially from the same project. SRT/VTT preserve line text/timing, LRC preserves line starts, JSON preserves word timing/settings/layers, and the video contains the final visual styling. Private media references in JSON require the same account; JSON is not a self-contained media archive.

Progress, cancellation, visibility errors and retry controls are provided. A saved project remains available after export failure. Results up to 120 MB can be saved privately; larger local results must be downloaded from the active tab. Original audio uploads remain limited to 50 MB. Projects support up to ten minutes, 200 caption lines, and 5,000 lyric characters, retaining existing caption limits. Connected Music generation supports up to six minutes through the existing generation path.

**Rendering happens on the user's device. There is no server rendering queue, and it does not continue after closing the page.** Hidden-page exports stop with a useful error. Long 1080p exports can exceed phone memory; 720p or excerpts are available. Higher resolutions/frame rates are not offered. The Worker runtime is not falsely advertised as a configured FFmpeg render service.

## Verification performed

- Clean locked dependency installation, TypeScript checking and production build.
- Thirteen repeatable tests (including server-rendered landing-page visibility without a recording or provider connection) covering legacy/save serialization, clipped line/word timestamps, discrepancy review, invalid/fast timings, exact Arabic/mixed text, speaker/gap grouping, repeated sections, zero-padding-free clarity processing, 12-per-collection assets, visual-template validation/round trips, safe image validation, custom-background scope, and source/lyric/timing preservation.
- 49 API checks using mocked provider/storage responses: access isolation, conflict rejection, persistence, named history, source replacement/retrieval, unchanged unrelated songs/settings/voices, analysis derivatives, language hints, recognition comparison, failed-provider recovery, saved mix linkage, and exact approved lyric/plan preservation. No live user recording or provider key was changed, and no user credits were spent by these tests.
- The shared canvas renderer loaded all 36 built-in backgrounds and produced distinct frames for each, plus distinct frames for all 14 caption styles. This is native rendering QA, not browser upload or device testing.
- A complete original 180-second synthetic music fixture rendered with the shared canvas renderer and a Linux FFmpeg verification harness. The resulting MP4 is 183.5 seconds including intro/outro, 1920×1080, 30 fps, 5,505 frames, H.264 video and AAC audio. It includes English, Arabic/English, Turkish, Russian, repeated/fast lines, two singer colors and instrumental gaps. Decoded frames were visually inspected. Synthetic onset checks at beginning/middle/end showed about 1 ms of error without accumulating drift; this is **not** a claim of live sung-word recognition accuracy.
- Portrait/square excerpt verification uses the current renderer with a source trim, silent intro/outro and actual H.264/AAC container inspection.

No desktop browser or physical mobile device was tested in this session because the Sites-required browser-control tool was unavailable. Browser WebCodecs/MediaRecorder export, interactive responsive layout, browser upload decoding, live ElevenLabs generation/alignment/separation and device sharing remain implemented but not end-to-end verified. The FFmpeg QA harness does not substitute for those missing browser/provider tests.

## External requirements and unfinished work

Existing ElevenLabs credentials, feature permissions, plan access and credits are required for Music, forced alignment, transcription, comparison and separation. Prices and quotas depend on the connected account. Local clarity processing, manual editing and local video rendering do not require a new processing provider. Private uploaded media/versions/results consume existing Sites storage and its applicable quota.

Still unfinished: durable server/background render jobs; automatic face tracking; dependable automatic separation of lead/backing/ad-libs/overlapping duet parts; precise per-word highlighting for mixed bidirectional runs; automatic translation/transliteration; and direct social publishing integrations. Adding a reliable external render queue would require an authorized render service, durable jobs/storage, credentials, costs and deployment configuration. None of those is implied to be active.

## Repeatable checks

```sh
node scripts/test-lyric-video-pro.mjs
node scripts/verify-lyric-pro-api.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
```

The test scripts use the existing installed build toolchain, write scratch output only under ignored `work/`, and mock external paid services. The existing `tests/party.test.ts` is unchanged.
