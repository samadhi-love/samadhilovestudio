# Logo Creator and advertising music videos

Built inside the existing SAMADHI LOVE Studio, following the consolidated song/video update. No second application, new provider connection or separate production tab is introduced. Existing account isolation, explicit publication, source audio, credits and project saving are reused.

## Where to find the tools

- **Create → Musical ad:** enter the product/brand, one supported benefit, audience and call to action. Choose 15, 30 or 60 seconds and one of six musical approaches. Prepare fills the same song editor with an editable production brief and arrangement. Creating sends the real request through the existing authorized music endpoint and metering. Exact approved/supplied lyrics remain attached to the song. The structured ad brief saves privately with the song and reusable prompts.
- **Create → Logo Creator:** edit a vector mark and download SVG or PNG without paid image generation. Each song's **Song actions → Create logo** can also save the design and transparent PNG privately, applying it to that song's existing or next video project.
- **Video & Shorts → Choose Look → Product video & advertising:** upload a product clip, trim its source range, choose fit/crop and loop or hold the last frame. Add a brand and a final call to action. Existing uploaded images, animated overlays, captions, logo upload, safe areas and multi-format controls remain available.

Existing songs can be used for product videos without creating a new jingle. New generated ads expose Make advertising video, preparing a vertical excerpt from the start with the chosen ad duration. Instrumental ad soundtracks can use clean video without attempting to recognize nonexistent lyrics.

## Logo behavior

Logo Creator now also includes **Animated nature** with eight moving illustrated scenes, live preview controls and genuine browser MP4 export. Saving with a song retains the animation configuration and its still PNG branding asset. See [ANIMATED_NATURE_LOGOS.md](ANIMATED_NATURE_LOGOS.md) for the exact output, controls and verification limits.

Eight original vector symbols, six color palettes, four lettering choices and stacked/horizontal/badge layouts are editable. Arabic/Unicode wording is preserved with text direction. XML text is escaped; unsafe markup and external image/script content are not interpolated. Transparent background is the default. SVG retains vector shapes/text; PNG is rasterized by the browser for the existing logo/video asset pipeline. This is a procedural design tool, not a claimed external AI image generator. Native font appearance depends on the viewing/export browser; final exported artwork still needs visual review.

Private logo assets must be PNG files saved under the current account and song with the logo media kind. Saving a logo does not publish the logo or song. Existing clients that omit new cover/logo/ad fields cannot silently erase saved branding. Existing project defaults retain their prior serialized shape when no logo/ad exists.

## Real uploaded footage pipeline

The existing private `sourceVideo` upload kind and owner-scoped R2 routes are reused. Input is limited to a supported short MP4/WebM/MOV clip up to 60 seconds and 120 MB; the actual video track is parsed and its browser decoding capability checked before upload. MOV/HEVC and other codec combinations depend on the actual browser decoder. No arbitrary streaming-service downloading is implemented.

MediaBunny decodes uploaded frames into a bounded two-canvas pool, preserving video display rotation. Frame selection uses clip trim/loop settings and the selected song excerpt's source time. Preview draws the decoded frames behind the same lyrics, branding and animations used for export. The frame encoder awaits each decoded frame before adding its timestamped H.264 frame; soundtrack samples are cropped from the unchanged selected song. The clip's original audio is muted, with explicit UI wording. Mixing its speech/audio into the new soundtrack is not implemented.

The final call to action appears during the last four seconds of the chosen music excerpt. Product facts and ad wording remain user-editable; generated lyrics and performances require review. Brand text/CTA are part of the visual project, not inserted into subtitle files unless they also occur in the actual lyric cues.

Video-backed export requires working H.264 and AAC WebCodecs encoding. The app blocks the real-time fallback for video-backed projects with a useful error rather than silently exporting a still background. Image-backed projects retain the existing MP4/WebM fallback. The page must stay visible/open. There is no new server rendering queue, automatic background rendering or direct social publishing service.

## Verification scope

The current verification report is `STUDIO_CONSOLIDATION_QA.json`. Added tests cover all 144 symbol/palette/layout combinations as valid safe XML, Unicode/RTL markup, ad brief validation/reuse, unified creator handoff, footage trim/loop/hold/source offsets, decoded-frame drawing and CTA timing, private ownership checks, saved project recovery and unsupported-codec errors. Isolated encoder/decoder fixtures verify awaited frame preparation, soundtrack crop, bounded canvas reuse and cancellation; these tests do not constitute native codec verification.

Actual browser video decoding, PNG rasterization, native H.264/AAC export/playback, physical-device UI, provider song generation and generated music quality remain unverified in this environment. No live credits were spent or existing media replaced during local tests. The full regression suite and build must pass before publishing the matching source.
