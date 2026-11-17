# Easy lyric videos, caption editing and video formats

November 13, 2026. Updated inside existing SAMADHI LOVE Studio project `appgprj_6af2936d32488191a41ff8ccab32ed79`. Existing songs, recordings, ownership, video templates, providers, credits and settings remain in place. There is no new schema or application.

## Beginner workflow

1. Open **Create → Lyric Videos & Shorts**, or choose **Auto lyric video** on a created song or from My Music.
2. Choose/create a song or upload an authorized recording. Studio retrieves lyrics saved with its matching recording. Auto lyric video starts real forced alignment when reference words are available, or transcription when they are not. Existing timed captions are protected rather than automatically replaced.
3. Open **Caption editor** or **Edit captions · words & timing** beside the preview. Selecting a line in the review list opens that line in the actual editor. Correct words, adjust line/word timing, or add a caption at the playhead. Text corrections clear obsolete word highlights for that line and mark timing unreviewed; the approved lyric reference is preserved. Waveform/playback tools remain expandable.
4. Choose a background and lyric style. Select **YouTube video** or **Shorts / Reels** from the two visible shape cards.
5. Export, play the finished video, then download/share the actual file and upload it using the existing publishing tools. The in-app “How to make a lyric video” guide explains this path.

Automatic processing still uses the authorized connected provider and applicable credits. Singing, mixed languages, dialects and overlapping vocals require review. This does not promise exact performance or perfect recognition, invent confidence scores, or silently modify a song to fit text. Audio restructuring uses the existing separate section-edit/new-version workflow.

For recordings made in another app, choose **Paste lyrics for this recording**, paste the actual sung words, then **Align lyrics to recording**. This visible option accepts up to 5,000 characters, including repeated choruses and optional section headings. **Use saved song lyrics** restores a linked Studio reference where one exists. With no reference text, **Generate captions from audio** uses transcription. An uploaded recording without saved words opens these choices before starting a provider request. Only the video's reference is edited; the recording and the song's stored lyrics are preserved.

## Two clear output shapes

| Choice | 1080p output | Intended framing |
| --- | --- | --- |
| YouTube video | 1920 × 1080, 16:9 | Wide screens, YouTube, desktop and TV |
| Shorts / Reels | 1080 × 1920, 9:16 | Full-height upright phone video for Shorts, Reels and TikTok |

Shape and duration are separate. Changing shape preserves the source audio, word timestamps, selected excerpt, approved lyrics and existing per-format layout overrides. New upright layouts use a readable default position with safe-area guides. Line wrapping follows the actual frame width. Full song and selected-clip actions change only the time range. Square video remains in **More formats**; existing square projects are retained.

The same picker is reused in Lyric Video Pro, the classic editor, Release Tools' clip maker and animated Logo Creator. Legacy classic exports keep their existing 720p dimensions for the two primary shapes; Pro and Release clip defaults are 1080p. New animated nature logo designs default upright, while previously saved formats remain unchanged.

Portrait canvas previews and finished-player containers keep a 9:16 frame with a larger phone-height presentation. The release clip renderer now uses actual target dimensions for backgrounds, titles and video cover-cropping. It preserves the uploaded video's proportions rather than stretching a hardcoded portrait drawing across a wide canvas.

## Pauses and automatic lyric formatting

Approved words are matched to the final audio by the existing real alignment engine. In Pro alignment, a gap of at least 1.25 seconds between a supplied previous word end and the next word onset splits a caption into separate phrases. Each phrase receives its measured end, allowing captions to clear during instrumental gaps. The original approved lyrics remain stored unchanged; word offsets are recalculated within the display groups.

A held note with a late word end is not treated as silence. Missing end times do not invent instrumental gaps. Timing outside the recording is rejected or flagged by the existing checks. Uploaded-song transcription retains its existing pause/speaker grouping. Automatic ad-lib, backing-vocal and duet separation still has the documented engine limitations.

Verse/chorus markers follow the first cue when an approved line spans multiple wrapped or pause-separated display groups. Matching consumes those groups in order so repeated choruses retain their own positions.

## Real exports and verification

Exports reuse actual video rendering and the existing H.264/AAC MP4 path when supported. The real-time fallback produces an honestly labeled supported MP4 or WebM. MP4 is preferable for social uploads; a WebM is never renamed into MP4, and the publishing panel identifies when conversion/another browser is needed. Direct authenticated social publishing and a server render queue are not added. The page must remain open and visible during rendering.

Tests cover the two visible choices; exact dimensions; unchanged audio/caption/range identities; retained layout overrides; opening and editing captions; shifted word times; adding captions; actual clip-drawing dimensions and undistorted cover-cropping; provider-guided grouping; and no lyric drawing during a measured gap. The isolated API test verifies automatic retrieval and pause-aware grouping with approved words unchanged. The full regression/build report is `STUDIO_CONSOLIDATION_QA.json`.

The managed browser runner is unavailable. These unit/DOM/provider/codec fixtures do not constitute native browser, phone or live paid-provider testing. Real native encoding/playback, upload acceptance and final mobile layout still require device verification. No production user records or provider credits were used for local tests.
