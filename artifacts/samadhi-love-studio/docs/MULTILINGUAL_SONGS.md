# Singing languages and dialects

## What is implemented

- Shared language selector in Quick Create, detailed creation, song + lyric video creation, and the existing party-file generation caller.
- Replacement/inserted song sections reuse the source recording's saved resolved target, offer editable language/dialect controls for older recordings, and explicitly support instrumental replacements without language detection.
- Auto uses conservative script/vocabulary suggestions from supplied lyrics only. It never infers singing language from an English production brief. New writing, short ambiguous text, and unsupported/shared-script cases ask for an explicit choice. Suggestions remain editable. Hindi's shared Devanagari script deliberately requires a choice.
- Separate Arabic dialect targets include Lebanese, Egyptian and Gulf Arabic. Lebanese directions request conversational Levantine vocabulary, vowel patterns, and avoidance of formal case endings; these are targets, not evidence of authentic performance.
- Mixed-language writing retains each passage's script. Existing approved lyric text remains separate from English provider style/pronunciation directions. No automatic translation or romanization.
- New lyric planning receives explicit language instructions. Every sung composition-plan chunk receives the same language and pronunciation direction through `positive_styles`, including plans produced automatically by the provider. Generated non-Latin drafts have a basic expected-script sanity check before starting a singing request; it is not a quality detector.
- No guide recording, speech voice ID, TTS dictionary or voice clone is used for normal songs.
- Unknown/unlisted singing languages and uncertain Auto selections stop before provider calls and the existing credit-reservation wrapper. The provider and model do not switch automatically.
- Language metadata is saved inside the existing song generation record, copied to new video projects, validated, and shown on saved song cards and in the lyric editor. It is not a database schema change. Old projects remain valid.
- The caption-ready editor offers an explicit “Set 15-second paid audition” length preset. It does not generate anything until the user starts it. Existing credit quotes remain in place. There is no free audition, extra paid probe, or automatic retry.

## Evidence and provider limitations

Official documentation checked on 2026-11-15:

- https://elevenlabs.io/docs/overview/capabilities/music
- https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans
- https://elevenlabs.io/docs/api-reference/music/compose

The overview names English, Spanish, German and Japanese as examples. The composition-plan guide explicitly says styles must be in English and lyrics can be any language. The API supports `music_v2_5`, text prompts OR composition plans, 3–600 seconds overall, and chunks of 3–120 seconds. The broad input statement does **not** demonstrate reliable singing, pronunciation, dialect fidelity or native-speaker approval in every language.

`app/music-language.ts` centralizes independent statuses for lyric writing, sung audio, dialect fidelity, transcription/alignment and caption rendering. All selectable language quality claims are experimental/unverified. “Other / not listed” is unavailable for sung requests; users must choose a listed language instead of receiving a silent fallback. No language is marked listening-tested or native-verified. Speech-language lists, voices and dictionaries are not used as music evidence.

The current Auto detector is deliberately limited, not a comprehensive language identification service. Arabic-script suggestions are tentative and do not establish a dialect or distinguish every language using Arabic script. A creator can override them. Mixed languages should be explicitly selected for same-script code-switching that Auto cannot distinguish.

## Verification and rendering audit

`pnpm --filter @workspace/samadhi-love-studio run test:languages` runs offline route, DOM and canvas-call tests with fixtures for:

| Fixture | Code / DOM / serialization / caption calls | Real singing generated or listened to |
| --- | --- | --- |
| Lebanese Arabic | Checked | No |
| English | Checked | No |
| Spanish | Checked | No |
| French | Checked | No |
| Hindi | Checked | No |
| Japanese | Checked | No |
| Mixed Lebanese Arabic / English | Checked | No |

Tests cover explicit selection, Auto overrides and uncertainty, incompatible dialect reset, unavailable language rejection before accounting, provider plan directions, exact supplied writing, generated-script rejection, saved-song and video JSON round trips, and UTF-16 caption offsets.

The existing preview and export share the canvas caption renderer. It draws full shaped lines rather than disconnected Arabic letters, uses RTL for Arabic-leading lines, disables artificial tracking in joined scripts, and retains original text and offsets. Mixed Arabic/Latin lines intentionally receive full-line emphasis rather than incorrectly positioned word masks. Input/previews use `dir="auto"`; multiline approved writing uses plaintext bidi isolation. Existing glyph-safe wrapping, no-transliteration behavior and font fallback remain in place.

Canvas-call tests are **not** screenshots of actual glyph shaping or proof of the final MP4's font coverage. Bundled display fonts are primarily Latin; Arabic, Hindi and Japanese depend on readable browser/system fallback fonts. Missing glyphs, joining and mixed-direction punctuation need review on the intended export device. The signed-in creation UI cannot be visually verified by the unauthenticated preview capture; DOM behavior is covered offline without bypassing authentication.

No live paid lyric, singing, alignment or transcription requests were made. No billing changes, publication, domain changes, production migration, storage replacement, or authentication bypass were introduced.

## Approval-dependent checks

Before any verified label, obtain approval for a bounded paid test budget, generate user-started short samples, and retain provider/model/date plus per-language listening findings. Lebanese authenticity specifically requires a native Lebanese Arabic speaker to review wording, vowel patterns and sung pronunciation. Review mixed-language passages and actual exported Arabic/Hindi/Japanese captions on target browsers. Do not turn fixture success into a claim about sung-audio quality.
