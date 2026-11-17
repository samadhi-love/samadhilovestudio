# Mobile Studio and Stage concept

November 14, 2026. Extends version 89 without replacing its Style DNA, song maps, visual-generation integration, provider settings or any existing workspace/data.

## Mobile implementation

The same account and project model serves desktop and mobile; no separate native app or duplicated data store is introduced. At widths up to 640px:

- Fixed safe-area-aware quick actions open Create, My Songs, Recording Desk and Lyric Videos through existing navigation guards. More exposes the existing full menu. Blocked navigation leaves the current work/menu intact.
- A sticky saved-project selector uses the existing song-opening and draft-protection path; it is disabled during loading/saving/creation.
- Touch controls use 44px minimum targets, form inputs use 16px text, and phone panels use one column with scrollable tool tabs.
- The recording transport remains reachable and explains microphone permissions, test playback, explicit saving, and possible screen-lock/call interruptions.
- Video preview can be hidden to focus on editing and restored without unmounting the soundtrack/project. Phone sessions start with 720p exports to reduce memory; users can still change resolution. Existing project framing is preserved, with vertical Shorts/Reels available in the existing format picker.
- Safe-area spacing keeps the bottom dock away from content, dialogs and notifications.

## Verification boundary

DOM tests cover the quick-action routes, More, blocked navigation, exact project selection and busy/empty states. The full verifier includes this mobile test group. Source CSS checks and simulated DOM do not demonstrate actual responsive rendering, touch, microphone capture, camera-roll handling, native encoders or physical-device stability. No browser-control tool was available for this task; no browser/device success is claimed.

Real-device acceptance: iPhone Safari and Android Chrome at small and large phone sizes; rotate; open/reopen saved projects; record, save and reuse a take; upload from Files/Photos; crop and remove middle audio; select sacred/ordinary templates; create a photo-story ad; render 720p then 1080p; download and open MP4/MP3; test permission denial, calls, screen lock, connection loss, return/retry, keyboard and text zoom. Verify foreground export requirements and report codec/device failures explicitly.

## Stage — assessment, not implemented by this change

The strongest next direction is a project-scoped Show workspace connecting one creative brief to music, visual identity, section timing and eventually a saved live performance. Preserve SAMADHI LOVE branding and the current production tools; do not remove existing workspaces or community features to copy another product's MVP.

Current source already supplies saved Style DNA recipes, bounded song maps, a provider-based AI visual-job pipeline, templates/photo stories, stem-derived light envelopes and an audio/visual timeline. A logical first Stage release would add a 4–6-shot storyboard linked to measured song sections, a pinned motif/reference, and explicit energy/palette/motion controls, then export a 60–90-second show. Target map timings should not be mistaken for measured generated-song timing.

Actual audio brightness should use defined EQ/filter controls. “Human vs synthetic” should specify a provider direction or arrangement choice rather than imply a measurable universal slider. Generated characters, scenes and vocal identity are not guaranteed to remain identical between requests. Melody/section inpainting, guaranteed timbre locking and personal model training require specific provider capability and consent/licensing work; uploaded reference assets and saved preferences are not model training.

Live mode should follow reliable export: one transport clock drives audio and visuals, mapped controls are smoothed, latency/device audio constraints are measured, and performance events are recorded as a new version. Do not promise gesture-controlled broadcasting or audience synchronization before implementing and testing those systems.
