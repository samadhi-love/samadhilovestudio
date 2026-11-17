# Musical video proposal: comparison and focused implementation

The existing app remains SAMADHI LOVE Studio, project `appgprj_6af2936d32488191a41ff8ccab32ed79`. Source was refreshed from production v91 (`164bffa`) before this update, preserving its phone controls and Start / Play / Share journey. No accounts, private songs, provider credentials, database schemas, billing plans, audience settings or radio infrastructure were changed.

## Product assessment

The strongest direction is one understandable journey: **choose/create an authorized song → retrieve or supply its lyrics → align → review → match a visual look → export a full video or social excerpt**. Lyrics already saved with a Studio song should remain the default input. Authorized downloads can be uploaded from other tools; this is not a direct Suno account integration or a streaming-service downloader.

The proposed music-aware visual identity is useful. A second DAW, extra creation branches, another social network and new rendering frameworks would add complexity without improving this immediate journey. Five understandable vibe shortcuts now sit inside the existing look chooser; the full 26-look browser is expandable. Advanced stem analysis remains in its existing expandable panel. The existing preview, caption editor, format controls, audio-source lineage, private saves and export are reused.

## Comparison with the actual source

| Proposal | Existing implementation reused | Implemented in this update | Remaining limits |
| --- | --- | --- | --- |
| True stem-reactive visuals | Authorized ElevenLabs separation, saved aligned vocal analysis, RMS/transient envelopes, Audio + Visual Studio's mappings, shared visual signal renderer | Main lyric-video stem analysis can target background glow, lyric pulse, gentle camera pulse or color. Saved settings identify the source recording and honor analysis delay. Still animation disables these measured reactions. | One selected full-length aligned stem drives one effect in the main workflow. No new automatic instrument recognition, separate kick/darbuka identification, live Demucs or automatic four-stem orchestration. |
| Vocal-locked typography | Saved approved lyrics, provider forced alignment/transcription, vocal-stem preference, repeated-chorus/gap handling, discrepancy review, manual word/line correction and tap timing | Kept this working path and tested that new looks, stem effects and release files preserve timing. | Numeric timestamp precision is not measured alignment accuracy. Singing, melisma, duets and dialects still need listening/review. No perfect-millisecond claim. |
| Vibe-to-Visual / Style DNA | Private sound recipes, artist prompts/instrument cues, 26 coordinated looks, caption templates and signature overlays | Five quick vibes, “Match my vibe” from saved song directions or an editable description, coherent typography/layers/motion, and an explicit option to keep scene artwork. Three original cosmic world-music backgrounds are selectable in a separate collection. | This is transparent keyword-based styling, not an acoustic mood/instrument classifier. The visual settings autosave through the existing project path; choosing a vibe does not make a paid AI request. |
| Multi-format reframing | 16:9, 9:16 and 1:1, format-specific layout overrides, caption row wrapping, safe guides, shared excerpt time | Preserved and tested in new look/reaction paths. | Platform overlays differ by device and can change. No new face-aware reframing or guarantee that every platform UI is avoided. |
| Release preparation | Individual SRT/VTT/LRC/JSON downloads, explicit publishing, metadata fields, existing finished video downloads | A real ZIP bundles full-song and selected-video captions, exact approved lyrics, artist/song/genre/instrument metadata and an editable project. The excerpt files shift with the trim and intro while full-song files retain source time. | Audio, video and stems remain separate downloads. This does not submit to a distributor, validate rights/splits/ISRC, master audio or create a Spotify Canvas. |
| Efficient browser video | Existing Canvas + Mediabunny/WebCodecs H.264/AAC export at supported 30 fps, honest recorder fallback and private file storage | Shared renderer reused for every new background and stem target; no extra rendering service added. | Native codec support, phone memory, page visibility and thermal limits still apply. No tested 60 fps, zero lag, under-three-minute completion or unattended browser render claim. |

## Three additional backgrounds

1. **Celestial Silk Road:** oud, ney-style flute and hand drum, neon festival lights, violet cosmos and warm gold geometry.
2. **Lotus Rhythm:** sitar, tabla and flute, turquoise light ribbons, a cosmic mountain lake and lotus geometry.
3. **Aurora Earthbeat:** kora, djembe and a wooden wind instrument, emerald aurora, warm gold and distant concert lights.

All are original generated still artwork inspired by the user's supplied concept, with dark central space for captions. They are optimized 1672 × 941 WebP assets and use existing drift/zoom and overlay motion; the pictures themselves are not newly generated video footage. The original generated PNGs remain in the workspace. Existing sacred, scenery and color collections each retain their twelve designs; total selectable backgrounds increase from 36 to 39. The user's exact original chat image was available as a visual reference but not as a downloadable file in this workspace; it has not been substituted with a claimed exact copy. An attachable original file is still needed to host those exact pixels.

## Corrections to the builder prompt

- **Frequency bands are not stems.** A bass filter also contains low vocal/instrument energy, and a midrange filter cannot isolate an oud or a lead singer. Meyda/Web Audio can extract useful features; they do not perform source separation. Use measured separated audio or honestly label full-mix frequency effects.
- **WhisperX is not a perfect singing aligner.** Its own documentation describes language-model requirements, unalignable tokens, overlap and diarization limitations. Adding it would require hosted Python/model workers, operational costs, model/license review and representative sung-language tests. The current authorized provider integration already aligns approved lyrics; retaining and testing it is the practical first step.
- **Spotify Canvas is vertical.** Official guidance describes a 3–8 second 9:16 asset. Square feed videos are separate. Seamless loop detection needs actual first/last-frame and motion tests; an arbitrary eight-second crop is not a verified loop.
- **Caption files are not distributor submission.** SRT/VTT/LRC are useful downloads, but DistroKid has its own plain/synced lyric workflow. No automatic distributor compatibility or publication is implied.
- **Loudness must be measured.** Peak normalization, EQ or compression is not integrated LUFS/true-peak measurement. Streaming playback guidance is not a universal mastering target. A future optional mastering tool must measure, retain the original and present before/after results.
- **Rendering time is hardware-dependent.** Client rendering avoids a new server encoding bill but can be slow or fail on constrained phones. Keep progress, cancel/retry, codec checks and private saves. A future paid server fallback requires a durable authenticated queue, admission limits, storage cleanup and explicit costs.

## Costs and architecture choices

Retain React, the existing Canvas renderer, Web Audio sample analysis and Mediabunny encoding. No new animation/rendering dependency, GPU server or subscription was added. Previewing the new styles and making the text/project ZIP happen locally without provider charges. Paid music/image/video generation, caption alignment, stem separation and file storage still incur their applicable costs. Browser export is not free operation of the entire platform.

Add WebGL only after profiling an observed bottleneck; it is not a guarantee of zero lag. Consider server FFmpeg/Remotion and GPU Demucs/WhisperX only when measured demand or browser limitations justify their deployment, licenses and operating budget. Keep real-time multiplayer, extra social infrastructure and radio expansion outside this focused release.

## Verification and remaining work

New tests cover saved media and format-override preservation, Arabic and mixed-language cues, repeated lines and instrumental gaps, actual ZIP decompression, full-song versus excerpt/intro timing, source isolation, each measured stem target, still mode and identical source-time reaction in preview/export across all three formats. Existing lyric-template and creator regressions cover all 39 backgrounds and all retained looks. The complete verification result is recorded in STUDIO_CONSOLIDATION_QA.json after the run.

Native browser infrastructure is unavailable here, so no physical-device, live paid-provider, production account save/reopen, final H.264/AAC playback or native performance test is claimed. The next release gate is a real authorized full-song pass on a supported desktop browser and a phone, checking the start/middle/end, trim/reopen, caption corrections, failed-job recovery and actual output playback. No new paid generation or live user-data mutation was used for these tests.

Still unfinished: verified automatic multi-stem-to-layer setup, dedicated percussion/instrument recognition, new self-hosted alignment/separation services, measured LUFS/true-peak mastering, genuine seamless Canvas generation, 60 fps exports, server rendering fallback and native cross-device QA. These remain explicit future work rather than decorative controls.

## Primary references checked on 2026-11-14

- https://support.spotify.com/us/artists/article/canvas-guidelines/
- https://support.spotify.com/us/artists/article/loudness-normalization/
- https://github.com/m-bain/whisperX#limitations
- https://support.distrokid.com/hc/en-us/articles/360013534574-Adding-Lyrics-to-Your-Music
- https://distrokid.com/potato/ (its SRT/LRC download descriptions distinguish video subtitles from karaoke use)
