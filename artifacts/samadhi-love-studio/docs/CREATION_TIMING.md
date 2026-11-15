# Automatic creation duration and volume controls

Quick Create, Guided Studio and Create Song + Lyric Video use the same duration planner. Generated requests stay within the existing 3–360 second range. This changes creation planning only; existing recordings and eight-minute production sessions are preserved.

Auto prioritizes an explicit whole-song duration in the description, then a saved template's target, then supplied lyric length and section structure, then short/extended/cinematic directions and tempo-based instrumental bars. Selecting Beginner no longer forces a short song. English duration units, numeric or one–ten number words, and minutes:seconds notation are supported. A maximum such as “up to six minutes” sets a ceiling rather than forcing every song to six minutes. Clearly labeled intro/verse/etc. durations are excluded from whole-song requests. More elaborate timing prose or non-English duration units may need the manual control.

The displayed duration is sent through the existing audio/lyric generation callbacks and used by built-in instrumental rendering. Quick Create shows its automatic target and reason. Guided and caption-ready creation retain manual controls and presets up to 6:00. Existing explicit seed/manual settings remain valid. Auto is a planning heuristic, not a guarantee that the provider performs every word correctly, and it does not change approved lyrics or establish word-level timing.

Custom volume sliders in song previews and both radio players use a wider track and approximately 22px thumb, with a 36px input height (44px on coarse pointers), keyboard focus indication and grab cursor. Seeking controls and audio gain ranges are unchanged.

`npm run test:duration` checks prompt/template priority, maximum handling, production-cue exclusion, valid bounded outputs, actual Quick/Guided request durations, manual override, and caption-ready lyric/audio request consistency using simulated DOM and providers. Full-song provider generation and physical-browser/mobile ergonomics require interactive verification. The Sites browser helper is unavailable in this environment; no physical-device test is claimed.
