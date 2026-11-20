# Versual Studio — Change log

Every change starts from something Samadhi asked for. Each entry links the
request → what changed → the commit → the tests that prove it.

**How to use it**

- Find a commit: `git show <commit>`. Check what's live: open `/health` on the
  live app. It shows the running commit.
- Add a new entry at the top for every change. Copy the template at the bottom.
  Keep entries in plain language.
- Builders: Claude (this chat) is the single builder. Entries marked *(other
  chat)* came from a second Claude chat before the one-builder rule.

---

## 2026-11-20

### Your recorded voice → your song → lyric video (sing-along)
- **Request:** "make sure we can use the recorded voice into making the song and
  it goes to lyric video" → chose "AI guide + music".
- **Changed:**
  - Vocal Studio **Set up sing-along** (one tap) splits the AI song once into
    the music and the AI singer. The singer becomes a **guide track**: heard in
    your headphones while you record, never in your saved song. Words to sing
    are shown, and recording is ready (Lead vocal, overdub on).
  - **Make lyric video** after saving your mix opens that mix (your voice), not
    the project's pinned master, and its words start timing to your voice.
  - The Create "Your voice" wording now says exactly what happens.
- Builds on the other chat's "My Voices" work (`2fba52d`).
- **Commit:** see "Sing along…" after `2fba52d`.
- **Tests:** `tests/sing-along.test.tsx` (5) · `tests/my-voices-screen.test.tsx`.

### One background picker everywhere you make a video
- **Request:** "keep all backgrounds for video making in same area, easy to find,
  either by title on flat boxes and picture, also by tab groups… all in same
  creation area. Easy is the key."
- **Changed:** one shared picker (`app/background-chooser.tsx`) with a search box
  ("Find a background by name"), group tabs and picture boxes with names. It's
  used on the Create page's "make it visual" step (replacing the 3-item Look
  dropdown) and in LyriVid's Vibe box. The pick carries straight into the video,
  and the last pick is remembered.
- **Commit:** see "One background picker…" after `2127f01`.
- **Tests:** `tests/quick-video-panel.test.tsx` (search by name, handoff) ·
  `tests/creative-play.test.tsx` (Create page pick → video).

### LyriVid in 3 taps: Song → Vibe → Make it
- **Request:** "where you make video and backgrounds are far and so many options…
  like bom bom bom done" → "do not delete backgrounds, make it accessible without
  having to scroll a long page… recommend a good plan and go".
- **Changed:** a 3-tap panel beside the live preview. **Song** (words start timing
  to the voice on their own, also when opened from the LyriVid tab). **Vibe** has
  chips for every collection (For this song, Complete looks, Kids, USA and New
  York, World, Sacred, Cosmic and scenes, Colors); all 46 backgrounds sit in one
  short box with its own scroll bar, plus Surprise me. **Make it** has Phone,
  YouTube or Square, then Make my video, with Download right there. Every other
  tool moved into a closed **Fine-tune** drawer; nothing was removed. Repeated
  pickers under the preview were folded away.
- **Commit:** see "LyriVid in 3 taps…" after `b9bd6c7`.
- **Tests:** `tests/quick-video-panel.test.tsx` (auto captions once, never over
  saved or recovered timing or instrumentals; all 46 backgrounds reachable;
  Fine-tune starts closed; For this song suggestions) · full suite.

### Animated backgrounds: 4 kids, US flag, Statue of Liberty, New York at night
- **Request:** "4 different animated pictures that fit kids songs… copyright safe…
  couple with US flag and Statue of Liberty and one NYC at night" → "make the
  real pictures more realistic" → "AI photos + motion", kids realistic too →
  "need a better flag" (flag across the top, White House behind).
- **Changed:** two new background groups, **Kids songs** (Balloon Party, Rainbow
  Meadow, Under the Sea, Starry Lullaby) and **USA & New York** (Stars & Stripes,
  Liberty Torch, New York at Night). They're drawn and animated in code
  (original art) and work right away. When the AI photos are added, each scene
  shows its photo with live motion on top: twinkling lights found in the photo,
  shimmering water, rising bubbles and floating light, and the flag ripples
  while the building below stays still. Photos come from a one-time script
  (`scripts/generate-scene-photos.mjs`, about $0.06 each, never retried) that
  records each photo's source in `public/lyric-art/photo/SOURCES.json`.
- **Commits:** `a05e353` (scenes + motion) · `1daecb2` (photos, made by Replit with the script) · photos connected in the commit after it.
- **Tests:** `tests/animated-scenes.test.mjs` (all scenes, all shapes, they move;
  photo motion; flag cloth) · `tests/lyric-visual-template.test.ts` (46 designs).

### Owner Status page, 30-day history, owner action log, targets
- **Request:** "GO" on recommendations 6–10 of the traceability review: a status
  panel, success targets, an owner action log, logs kept beyond Replit, and this
  change log.
- **Changed:**
  - New owner-only page **App status** (`/admin/status`, also in the owner menu).
    It shows whether the app is up, five targets (song success ≥95%, songs ready
    in ≤3 min for 9 out of 10, captions matched to the voice ≥90%, AI requests
    accepted ≥95%, ≤5 errors a day), background work, AI requests, recent errors
    with reference IDs, and owner/account actions.
  - **30-day history** (table `studio_events`) keeps job outcomes, AI calls,
    caption results, errors, browser crashes and owner actions. It is created only
    when the owner taps **Set up history**; startup never creates tables.
    Migration file: `drizzle/0010_studio_events.sql`.
  - **Owner action log**: engine change, song recovery, credit funding/plan/refund,
    creator account changes, owner claim, ElevenLabs key save/remove/default, and
    history setup.
  - A route wrapped twice now logs one line under one ID.
- **Commit:** `a7835ab`
- **Tests:** `tests/observability.test.mjs` (12; real SQLite) ·
  `tests/app-status.test.tsx` (2; renders the page) · full suite.

### Traceability: request IDs, structured logs, AI-call logs, caption reasons
- **Request:** "GO" on recommendations 1–4 (request IDs end-to-end, structured
  AI-call logs, caption failure reasons, version on health check).
- **Changed:** every API request (60 handlers) returns `X-Studio-Request-Id` and
  writes one JSON log line. The ID follows the request into its job and every
  fal.ai/ElevenLabs call. Captions now say why precise sync didn't work.
- **Commit:** `08f57bd`
- **Tests:** `tests/observability.test.mjs` · 348/348 at the time.

### Health check shows what's live
- **Request:** recommendation 4 (know which code is running).
- **Changed:** the build stamps its git commit and build time, and `/health`
  returns them.
- **Commit:** `9a5d6b3`
- **Tests:** `scripts/smoke-node-build.mjs` checks `/health` on the real Node build.

### LyriVid: one cosmic look; the video scrolls with the page
- **Request:** "take that off keep the cosmic without option" · "where you
  preview the lyric video stays in the middle of the page and everything moves
  up and down around it."
- **Changed:** removed the Cosmic/Light switch. The video preview and the
  backgrounds preview no longer float; they scroll normally.
- **Commit:** `f548be7`
- **Tests:** full suite (343/343) + a browser measurement (before: pinned
  at 90px; after: moves with the page).

### Create: readable Vision box and "Save this prompt"
- **Request:** "change the vision box to where it could expand and have a side
  hold to scroll… create a save prompt button under each…"
- **Changed:** multi-line Vision boxes with a scroll bar, plus one-tap
  **Save this prompt** / **Save these lyrics** buttons.
- **Commit:** `316ff34`
- **Tests:** `tests/begin-a-song.test.tsx` (37/37 Create tests).

### Fix "Write them for me" *(other chat)*
- **Commit:** `9826944`

## 2026-11-19

### Simplified navigation
- **Request:** the navigation spec ("maximum 5 primary navigation items… wait
  for my 'go'") → "GO".
- **Changed:** five destinations (Create, Songs, LyriVid, Record, Explore).
  Tools open in context; settings are grouped under Account & settings.
- **Commit:** `119fe3c`
- **Tests:** cosmic-studio, studio-consolidation, internal-controls,
  mobile-studio, song-audio-edit, audio-download-controls.

### fal.ai key found whatever its name's capitalization
- **Request:** the live app ignored the key saved as "Fal_key".
- **Commit:** `331e3f0`
- **Tests:** runtime / worker-secrets tests.

### ACE-Step writes its own lyrics
- **Request:** "I need it in the vision section not lyrics so it creates it on
  its own."
- **Commit:** `df74678`
- **Tests:** `tests/ace-step-engine.test.mjs` (25/25).

### Smoke test covers startup and the home page
- **Commit:** `dc78c79`

### Other-chat changes (19 Nov)
- `b4be30c` LyriVid video stays in view while scrolling. *(Replaced on 20 Nov by
  `f548be7` at Samadhi's request.)*
- `81aa2f4` Auto length follows the described style.
- `f94cbaf` Song parts labeled automatically.
- `047ac6e` Lyric sync and stems on Node (streamed uploads).
- `6eafffd`, `fdbae45`…`db1a40e` lint cleanup (235 → 0, now part of
  `verify:studio`).
- `8435185`, `2c47013`, `11a96e2`, `d3971e9`, `06bcfbc`, `dcd4a14` performance
  and save reliability.

---

## Template

```
### <short title>
- **Request:** "<Samadhi's words>"
- **Changed:** <what a user notices, in plain language>
- **Commit:** `<hash>`
- **Tests:** <test files / counts>
```
