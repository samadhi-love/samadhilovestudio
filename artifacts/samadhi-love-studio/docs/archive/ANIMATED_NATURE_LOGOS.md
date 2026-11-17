# Animated nature logos

November 13, 2026. Added to the existing SAMADHI LOVE Studio Logo Creator. Open **Create → Logo Creator → Animated nature**, or a song's **Song actions → Create logo**. Existing still designs, private assets, lyrics, recordings, provider settings and publishing rules are retained. No new database migration or paid provider is required.

## Scenes and controls

| Scene | Scenery and motion |
| --- | --- |
| Ocean Light | Layered coastal cliffs, rolling turquoise water, foam and drifting clouds |
| Forest Breeze | Swaying evergreen trees, sunbeams and floating fireflies |
| Waterfall Mist | Falling water ribbons, green cliffs, drifting mist and pool ripples |
| Lotus Sanctuary | Floating lotus blossoms, pond ripples and swaying willow leaves |
| Golden Peaks | Snow-capped mountains, drifting clouds and a sunrise lake |
| Desert Reverie | Layered golden dunes, shifting highlights and flowing wind traces |
| Blossom Drift | Cherry branches, falling petals and a mountain pond |
| Aurora Lake | Animated northern lights, twinkling stars and alpine water reflections |

These are original vector illustrations, not photographic footage or external AI-generated video. The existing logo name, tagline, symbols, palettes, fonts and layouts are reused. Choose a steady, floating or softly breathing logo, adjustable scenery motion, 6/10/15-second duration and square/vertical/landscape format. A contrast treatment keeps lettering visible. The preview offers Pause/Play and initially pauses for a reduced-motion preference.

Scene geometry is bounded and generated deterministically from clip time; the preview and export use the same SVG frame function. Effects return to their initial state at the chosen duration. The preview is capped at 16 fps to limit DOM work; the video exporter renders at 30 fps. Pausing the preview does not change export motion. A motion strength of zero freezes the scenery.

## Saving and downloading

**Download animated MP4** uses the existing real MediaBunny/WebCodecs exporter, at 1080p in the selected format with H.264 video and a genuine silent AAC track. Every SVG frame is decoded, painted and awaited before its timestamped video frame is encoded. Source images/bitmaps are disposed after each frame. The completed container is inspected for its video/audio tracks and playable duration. The finished local clip can be played and downloaded again in the dialog.

This export requires a browser that actually supports the required encoders. Unsupported encoding returns an ordinary error; a still image is not renamed into a video. The page must stay visible and open. Progress and cancellation are provided, with choices retained for retry. There is no server render queue or continuation after closing the page. These logo clips have a silent soundtrack; no source song audio is altered.

SVG and PNG downloads remain **still logos**. **Save settings + still logo to song** privately stores the scene/motion settings with `logoDesign.animation` and saves the existing PNG branding asset. Reopening that song's Logo Creator restores the settings. The song-video watermark remains the saved still PNG; animated watermark/intro insertion into a song is not claimed. Download the motion clip separately for use as video media. Standalone settings remain in the open dialog; closing an unsaved standalone design does not create a cloud project.

## Validation

Unit/DOM checks cover all eight scenes across three formats, deterministic loop boundaries, visible changes with a steady logo, zero-motion behavior, safe Unicode/RTL markup, unchanged still-logo behavior, mode switching and configuration serialization. Private API fixtures verify that valid settings save without changing approved lyrics and invalid settings cannot overwrite a saved design. The actual export orchestration is exercised with isolated browser bitmap/codec fixtures for all three formats, 180 frames per six-second clip, silent audio, unsupported codecs, abort and image disposal.

Additional local NAPI Canvas inspection rasterized 16 scene frames and confirmed that each pair differs, producing a contact sheet for visual review. This is actual SVG rasterization, not native browser video encoding. The current full test/build result is `STUDIO_CONSOLIDATION_QA.json`.

The required managed browser runner is unavailable, so no real browser or physical device was tested. Native MP4 encoding, final native file playback, mobile performance and browser-specific fonts still require verification. Existing provider, account and radio services are unchanged. This feature adds no provider charges.
