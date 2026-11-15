# SAMADHI LOVE Studio — developer / AI handoff

## 1. Source, identity and safe continuation

This ZIP contains the **actual complete source snapshot**, not screenshots, pseudocode or a build-only archive: 600 tracked files, including application/API code, assets, database migrations, dependency lockfile, tests and platform tooling. The additional `handoff/` files explain and validate the export.

- Existing project: `appgprj_6af2936d32488191a41ff8ccab32ed79`.
- Live site: https://samadhi-love-studio.timelycoach1.chatgpt.site
- Published source version: **92**.
- Source commit: `be15dc8f65ea57e613341a4976a3624011abf071`.
- Original repository: a private Sites-managed Git repository, **not an established GitHub repository**. Git history and temporary repository credentials are deliberately excluded. Obtain fresh repository access through the authorized Sites owner/editor if continuing on the hosted app. This ZIP itself is a complete usable source export.
- Use `handoff/SOURCE_MANIFEST.json` to verify every original source file. `handoff/FILE_TREE.txt` lists the full export tree. `handoff/verify-source.mjs` validates the snapshot hashes.
- Keep the original project ID, user ownership IDs, existing D1/R2 bindings, vault encryption key and audience when continuing the existing deployment. Do not create a replacement app, reset a database or replace the existing Studio with a new starter.

The export does **not** contain production database rows, user songs/audio/recordings, private uploaded images/videos, encrypted provider-key objects, actual environment secrets or live account sessions. Those are stored outside Git. It is a full source export, not a production data backup. Existing data and credentials must be preserved and transferred separately under authorized administration if hosting changes.

## 2. Product and intended users

A beginner-friendly music and visual production studio with optional advanced tools. Its core journey is **Start / Play / Share**: describe a song or provide lyrics/authorized audio, create a song, keep alternate takes, prepare synchronized lyrics and attractive full-song or social videos, then download, share or explicitly publish.

SAMADHI LOVE emphasizes world-music fusion, Arabic/multilingual lyrics, cosmic/sacred visual identity and easy creation. It also retains recording/mixing, Party Files, public Discover/community and radio tools. It is not its own trained music model and is not a complete replacement for a professional DAW.

## 3. Local installation and running

Prerequisites: Node.js **22.13 or later**, npm, and a modern browser. The source was verified with Node **24.22.1** / npm **11.9.0** in this environment. Python 3, FFmpeg and FFprobe are needed for the **complete** verification suite; they are not required just to edit the UI. Some tests invoke `python3` directly. Keep that executable available on PATH, including on Windows/WSL. External provider tests require authorized accounts and may cost money; the automated suite uses fixtures and authorized synthetic media.

Extract the ZIP and open a terminal in the folder containing `package.json`:

```sh
npm run install:ci
npm run build
node handoff/apply-local-migrations.mjs
npm run dev
```

`install:ci` performs one locked `npm ci` with required development/optional dependencies. Do not run concurrent installers or discard `package-lock.json`. Install from a directory with its own dependencies, not a symlink to another checkout's `node_modules`. A clean clone has no `.sites-runtime/execution-profile.json`, so the included helper selects the portable profile. Node/npm caches and platform-specific generated state are excluded from this ZIP.

The portable dev server normally uses **http://localhost:5173**; follow the printed URL. To exercise the local sign-in simulator, navigate directly to `/signin-with-chatgpt?return_to=/`; sign-out uses `/signout-with-chatgpt?return_to=/`. This simulator is loopback development only. For an initial local-only test, leaving the owner-email setting unset permits the existing development owner fallback. Do not expose this dev server publicly or use its mock identity in production. Real paid providers are not required to explore the UI; disconnected generation should remain honestly unavailable or require the explicit local sketch option.

The database helper in this export initializes a **fresh local database only**, with all eight existing SQL migrations in order. It hard-codes Wrangler's `--local` and `.wrangler/state`, refuses partially initialized schemas and never resets or deletes a database. On an existing database, inspect and apply only pending migrations manually. It is not a general production migration manager.

For the built Worker locally, after building and initializing the same local database:

```sh
npm start
```

Use the URL printed by Wrangler. This built preview is not the portable dev sign-in simulator; without a trusted identity it may show only public surfaces. `npm start` runs locally and does not deploy. In a managed Codex/Sites environment, follow that environment's Sites preview workflow; the managed preview runner was unavailable during this handoff, so no browser-control test was attempted.

Configure local secret values privately in `.dev.vars` using only the relevant names from `handoff/ENVIRONMENT.md`. Do not commit that file. Cloudflare bindings are read through `cloudflare:workers`; simply creating a frontend `.env` file does not replace D1/R2 bindings. The generic framework/tooling README is retained as `README.md`; use this handoff as the current application guide.

### Installation verification caveat

A clean install in the extracted export succeeded with **737 packages** using the existing npm cache and the unchanged lockfile. The initial uncached/network attempt reported tarball-integrity/retry errors; a public-registry-only install was not established. Do not treat online reproducibility as proven, remove integrity checks or blindly upgrade versions. If installation fails elsewhere, capture the package/registry error, verify the locked versions and the receiving environment's registry/proxy configuration, and resolve it in a reviewed dependency change. See `handoff/TEST_STATUS.md` for final verification evidence.

## 4. What is implemented

- Shared Simple/Custom song creator, lyrics and production-direction parsing, world-genre fusion, private saved prompts / Style DNA, optional bounded song maps, explicit durations up to the connected provider's supported ten-minute request limit. Easy mode can request shorter first takes; explicit prompt/map/lyric duration rules are retained.
- Existing authorized ElevenLabs Music integration; server-side key handling, per-user encrypted key vault, provider errors/permissions, and usage/funding controls. Provider musical quality and language/voice support are provider-dependent.
- Private account libraries, source/audio history, song actions, rename/sort, playlist/folder concepts, downloads, explicit publishing/unpublishing, public Discover and positive reactions/follows. Ownership, revisions and source lineage are tested in isolation.
- Recording Desk / vocal tools, mixing, original-preserving section edits and waveform crop/cut; actual available stems and note MIDI versus clearly labeled marker MIDI. Speech voice features are not a guarantee of realistic singing or authorized personal cloning.
- Lyric Video Pro: saved approved-lyric retrieval, provider forced alignment/transcription, optional vocal analysis stem, word/line correction, review flags, repeated choruses/gaps, duet/translation layers, section markers and tap timing.
- Three aspect ratios, per-format overrides, readable caption templates, 26 coordinated looks, 12 signature overlays, 39 background designs including three new cosmic world-music illustrations, uploads, up to eight image scenes and uploaded/generated short footage. Preview/export share the drawing code.
- Five description-matched visual vibes inside the existing chooser. This is explicit keyword matching, not acoustic mood/instrument recognition. Existing visual art can be preserved.
- One aligned stem can drive lyric, camera, color or background-glow effects using measured envelopes; Still mode suppresses these reactions. More elaborate audio/MIDI mapping exists in the retained Audio + Visual tools, but the main lyric-video workflow does not automatically orchestrate all stems.
- Genuine browser video encoding: H.264/AAC MP4 where supported, clearly reported fallback where supported, progress/cancellation and private saved results. Baseline frame rate is 30 fps. Exports require the page/device to remain available.
- Individual SRT/VTT/LRC/editable JSON downloads and a real release ZIP containing full-song and excerpt captions, exact approved lyrics, metadata and editable project data. The ZIP does not embed media or automatically submit to a distributor.
- Real ElevenLabs Flows image/video request integration with private durable receipts, no automatic duplicate paid submission, recovery, bounded result downloads and private assets. Images can become backgrounds/scenes or an animation start frame. Motion requests are four seconds at 720p; looping or holding is explicit.
- Party Files: authorized uploads, own music, voice recording, up to four 30-minute assembled files, crossfades, actual MP3 output/stream/download and retained section editing. A genuine synthetic 30-minute mix was tested.
- Original procedural logo/cover tools and animated nature/logo/ad-video composition; actual paid photorealistic image/video generation is a separate provider path.
- Membership, credit ledger and Stripe checkout/webhook implementation with explicit enablement, verified event processing and caps. Current prices/credit economics are draft product configuration, not proof of sustainable margins or a working live checkout.
- Fourteen-day delete/recovery deadlines and durable cleanup code. Actual unattended production scheduler activation remains unverified.
- Retained Radio/community queues and synchronized website playback. This is **not verified continuous server-side Icecast/HLS radio**.

Implementation and test coverage do not by themselves prove every live provider, browser, account or billing flow. Read the following limitations before describing the app as launch-ready.

## 5. Incomplete work, reported bugs and decisions

### Most important next steps

1. Complete authorized end-to-end QA with full songs on a supported desktop browser and a real phone: create/upload → align → review → save/close/reopen → change format/trim → export → independently inspect actual codecs and synchronization at the beginning, middle and end. No native browser/device result has yet been established here.
2. Test real sung vocals, fast rap, Lebanese/Egyptian/Khaleeji Arabic, Turkish, Russian, mixed languages, repeated choruses, instrumental gaps, melisma and overlapping duet parts. Timestamp precision is not recognition accuracy; retain visible corrections and discrepancy flags.
3. Recheck the user's reported silent opening followed by spoken delivery / odd song structure using authorized real output. Instruction/lyric parsing and clear-vocal directions have regression coverage, but the complaint has not been conclusively resolved by a live musical-quality test.
4. Exercise private-library isolation with two real accounts, explicit public/unlisted/private transitions, revoked share links, saves/version conflicts, failed generation recovery and independent exported playback. Fixtures are not a production security audit.
5. Verify actual ElevenLabs entitlements/permissions, music/voice restrictions, paid visual generation, cost caps and Stripe sandbox/live lifecycle before enabling commercial subscriptions or platform-funded credits. Review legal identity/policies, taxes, rights and actual provider unit economics.
6. Confirm deletion cron activation, recovery deadlines, retry behavior, storage limits and backups without accelerating a real user's deadlines or deleting songs for testing.

### Explicitly unfinished or limited

- Automated multi-stem-to-layer setup and separate kick/darbuka/oud recognition; self-hosted Demucs/WhisperX services; guaranteed millisecond singing alignment; biometric/liveness-verified personal singing clones; low-latency multiplayer; live phone mix-check infrastructure.
- Measured integrated LUFS/true-peak mastering and proven seamless Spotify Canvas generation. Peak processing is not LUFS measurement. Square feed exports are not Spotify Canvas assets.
- Tested 60 fps/higher-resolution export, a durable authenticated server rendering queue, unattended browser rendering and direct authorized social publishing.
- Verified true 24/7 external radio broadcast that continues independently of every browser. Decide streaming infrastructure, broadcast permissions, bandwidth and running budget before implementation.
- Provider visual jobs can continue remotely when a user leaves, but private-result import resumes when the page is checked; there is no newly implemented unattended webhook importer. The provider contract inspected has no cancellation endpoint. Pausing checks does not cancel charges.
- The user's exact original reference artwork was visible in chat but not provided as a downloadable file. Three generated related designs are included; the original pixels still require the actual attached image file.
- Fresh public-registry installation, native browser performance and account/provider production QA remain explicit verification gaps.

Do not solve these by adding empty controls or making perfect-quality/performance claims. Prioritize the one useful music-to-video journey, then add optional advanced capabilities based on measured needs.

## 6. Architecture, files and data

Read `handoff/ARCHITECTURE.md`, `handoff/ENVIRONMENT.md` and `handoff/FILE_TREE.txt`. Main technologies: TypeScript; React 19; Next-compatible App Router APIs on **Vinext + Vite**; Tailwind/CSS; Cloudflare Workers; D1 SQLite / Drizzle; R2; Web Audio; Canvas; Mediabunny/WebCodecs; FFmpeg/FFprobe for selected independent test checks; fflate ZIP files. `package.json` / `package-lock.json` are the exact version authority. No Remotion, Demucs, WhisperX, Three.js or Framer Motion migration was added by the latest proposal.

### External setup

**Database/storage:** retain `DB` and `BUCKET` from `.openai/hosting.json`. Local Vite emulates these; build emits `dist/server/wrangler.json`. Production bindings and migrations are managed by the existing Sites deployment. Source export does not grant access to the live D1/R2 resources. Back them up before any migration; preserve owner IDs, version histories, share/publish indexes, retention jobs and the vault encryption secret. Never point a local test or reset script at live resources.

**ElevenLabs:** the normal user's key is entered in existing Studio Settings, encrypted in R2 using the vault secret and resolved only server-side. There is no required `ELEVENLABS_API_KEY` variable in this source. Enable only the provider permissions used by that account and test access. Music, speech voice tools, alignment, stem separation and Flows visuals have different entitlements. Visual API requests need the documented Pro-or-higher plan and Image & Video / Flows permission, available credits and spending cap; real availability must be tested. The visual API cannot quote an exact price in this integration, so explicit approval is required and its cost is separate from Studio song credits.

**Platform-funded production:** optional managed key, approval/enablement flags, global/monthly/concurrent caps and per-account ledger exist. Keep disabled until costs and provider terms are reviewed. Voice work and current visual generation are not silently routed through that managed key.

**Stripe:** optional monthly USD plans for a US business. Configure recurring prices, business/legal/contact URLs, secret key and verified webhook secret privately. Webhook route: `/api/billing/webhook`. Handler currently processes `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`; inspect `app/billing/service.ts` before adding events. Test checkout, renewal, cancellation, duplicate/out-of-order events, credits and portal behavior before live activation. The source does not include actual Stripe products, credentials or signing secrets.

**Optional catalog/rights services:** Jamendo client access and AudD recording matching have separate optional credentials. Their failure must not be presented as verified rights clearance. Third-party service/voice/visual licenses remain an operator responsibility.

**Authentication/hosting:** production identity is currently provided by trusted Sites dispatch headers and reserved sign-in routes. It is not a standalone email/password authentication server. If moving away from Sites, implement verified identity/cookies and a trusted boundary that strips spoofed identity headers, then preserve/map the stable existing owner IDs. Merely deploying the ZIP on Vercel or a raw Worker does not supply the existing authentication or data. Do not expose header-trusting routes directly to the public internet.

## 7. Tests and verification commands

```sh
npm run verify:studio
node scripts/test-vibe-release.mjs
node scripts/test-lyric-video-pro.mjs
node scripts/verify-lyric-pro-api.mjs
node scripts/test-visual-generation.mjs
node scripts/test-creator-workspace.mjs
node scripts/test-style-dna.mjs
npm run test:integrity
npm run test:credits
npm run test:membership
npm run test:library
npm run test:audio-edit
npm run test:audiovisual
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm run build
```

`npm run verify:studio` is the broad authority and currently contains **38 groups**, including TypeScript and the production build. It writes `work/studio-verification/latest.json`, continues to record all group failures and exits unsuccessfully if any group fails. `docs/STUDIO_CONSOLIDATION_QA.json` records the prior successful v92 run and final targeted follow-ups. `handoff/TEST_STATUS.md` records the isolated-export rerun and installation/database checks completed during this handoff.

Tests use isolated identity, provider, database or storage fixtures and synthetic authorized audio. They do not establish paid-model quality, native browser encoding, production billing, physical microphone/mobile functionality, cross-account production isolation, actual scheduler activation or continuous external broadcasting. Lint is available but was not part of the passing verification claim. Do not call it passing unless run separately.

## 8. Suggested first developer / AI instruction

“Work exclusively on the existing SAMADHI LOVE Studio source in this archive. Read START_HERE.md, handoff/TEST_STATUS.md, docs/RELEASE_STATUS.md and docs/MUSICAL_VIDEO_REVIEW_AND_UPGRADE.md first. Preserve all existing users, songs, originals, media, settings, provider connections, ownership and production identity. Inspect actual source before editing; do not rebuild or create another app. Focus on one beginner-friendly create/import → lyrics → review → look → export workflow. Reuse working components, keep advanced tools optional, use real paid-provider processing only with authorization, and report verification limits. Begin with the stated native-browser/full-song QA gaps. Do not deploy, reset production storage or activate paid services without the owner's task authorization.”

To place the export in a new **private** GitHub repository for developer collaboration, the owner can create that repository, initialize Git in the extracted source, commit the files and add the provided GitHub remote. The ZIP contains no Git history and grants no existing Sites deployment access. Do not publish the source publicly or apply an open-source license without the owner's decision.
