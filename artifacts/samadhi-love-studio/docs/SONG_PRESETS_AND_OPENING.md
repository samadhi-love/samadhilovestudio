# Song presets and opening controls

Changes extend the existing project and do not migrate accounts, songs, recordings, provider keys, membership configuration or databases.

## Song starters

The original Start a song dropdown read only the user's saved templates (three by default). It now merges 51 additional Studio presets at read time. An unchanged account sees 54 named templates plus Blank song. The 17 genre families cover Arabian, electronic, pop, R&B, hip-hop, rock, metal, jazz, folk, Latin, African, Asian, global, classical, spiritual and ambient directions. These are editable writing/arrangement presets, not pre-rendered audio.

Both the song form and template library support search and family filtering. The song form exposes the existing full genre picker immediately, including multiple selections and custom style names. Chosen genres enter the new project's tags and creative prompt. Changing a search does not discard the selected template or title. Existing private templates take precedence; catalog defaults are not written into user libraries. Customizing a catalog preset saves a private override; resetting an override restores its default without changing songs made from it.

Built-in instrumental sketches still use four synthesis palettes. Expanded genre directions are passed to the connected song provider; they do not add synthesized instruments or guarantee stylistic accuracy.

## Start delay and structure

The user's reported eight-second delay has not been diagnosed in their actual recording. It could mean leading silence, an intentional instrumental introduction, or playback/network buffering. No original recording is trimmed or regenerated.

Quick Create, Guided Studio and caption-ready creation now offer Follow my prompt, Start promptly and Short musical intro. Choices guide provider generation; they cannot guarantee exact vocal entrance. Quick and Guided recover the opening choice in device drafts. Prompt-following remains the default and respects explicitly requested introductions.

For supplied lyrics, proportional section-duration allocation now counts performed words, excluding bracketed headings and brace production cues. This prevents long introductory directions from receiving the same weight as sung words. Each provider chunk still requires at least three seconds; explicit empty sections are retained. Approved source lyrics remain exact, including their directions. This is a composition heuristic, not forced alignment or word timestamps.

Heading-only starter skeletons are no longer accepted as finished lyrics. Guided creation recognizes them as structure for automatic writing. Both supplied and generated lyrics must contain performed words before the music request starts. Existing provider model, duration limits and section ordering remain intact.

Playback displays Starting audio and Buffering audio where applicable. Changing recording resets stale playback progress and ignores a late failed Play request from the old recording. These status changes do not remove silence from an audio file.

## Verification

Local source tests exercise template coverage, private override precedence, form search and selected-style handoff, all three opening-control handoffs, multilingual word allocation, simulated buffering/retry/source changes, and isolated create API requests. API fixtures verify heading-only lyrics fail without a provider call, approved lyrics survive unchanged, opening direction reaches the actual request body, and cue-only introductory time is minimized while total duration stays correct.

No live provider credits or user music are used by tests. Real-browser/device playback and live generated audio quality are not verified in this environment. The full Studio verification gate also checks existing account/credit isolation, publishing, lyric videos, radio, voice permissions, production and build.
