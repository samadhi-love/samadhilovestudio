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
