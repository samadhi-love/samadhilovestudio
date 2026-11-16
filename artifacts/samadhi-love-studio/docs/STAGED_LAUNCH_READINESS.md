# Staged studio launch readiness

Review date: 2026-11-16. Product: existing SAMADHI LOVE Studio; proposed public name: Versual Studio.

## Decision

**Suitable for controlled private verification, not yet approved for a customer pilot or public launch.** A production build and offline checks pass, but the central real song → saved recording → aligned captions → downloaded video journey is not proven end to end.

This is a review, not implementation or launch authorization. No paid requests, subscription changes, registrations, publishing, private-data deletion or database migration were performed. Other working tabs and isolated task agents can contain changes unavailable in this workspace; this report does not certify those unseen changes.

### Evidence labels

- **Verified:** directly checked in this workspace; scope is stated.
- **Partially verified:** implementation exists and some checks pass, but practical behavior remains unproven.
- **Unverified:** no adequate current evidence; not a claim that the feature is broken.
- **Failed:** a specific inspected behavior contradicts the requirement; this can be a failure branch rather than normal operation.
- **Deferred:** deliberately outside the current build/testing stage.

## Existing work reconciled

Task records were read during this review. None was restarted, reassigned or duplicated.

| Existing task | Observed status | Readiness consequence |
|---|---|---|
| #6 — Confirm the first song saves without duplicate charges | Active; waiting for input | Real paid song/save/reopen verification is not complete. Requires explicit test scope and spending approval. Route the generated-audio preservation finding below to this work rather than duplicating it. |
| #7 — Build Party Mix sessions with voiceovers and rights-aware sharing | Active; waiting for execution capacity | Do not infer completion from existing Party screens. Secondary to the core launch. |
| #11 — Build capture-first Song Memory with preserved takes | Active; waiting for execution capacity | Do not claim the requested capture-first workflow has been delivered. Preserve existing takes; do not duplicate this task. |
| #13 — Export the complete project for an external build check | Active; waiting for execution capacity | A source ZIP was delivered earlier in this conversation, but that snapshot is not evidence this assigned task or an external build check finished. |
| #14 — Fix 148 dependency vulnerabilities | Active; waiting for execution capacity | The number is the task title, not a fresh audit count. Remediation is not certified; no dependency/security scan was run for this review. |

## 1. Core creation and beginner journey

**Partially verified.** `app/quick-create.tsx` provides Simple/Custom creation, a default vocal path, retained custom lyrics, explicit provider connection errors and saved-song-to-video actions. Advanced controls are separate from Simple. The explicit local sketch path does not silently replace singing.

`app/api/studio/create/route.ts` requests lyric planning and music composition, validates inputs, and saves approved writing before requesting the recording. Source implementation is not evidence of coherent lyrics, satisfying music or a requested singing style.

**Failed failure-path requirement:** after audio is stored, a returned failure from the final song metadata save leads to `bucket.delete(object)` (lines 312–322 at review). A paid take can disappear, leaving writing but not the recording. Internal credit refunds do not necessarily refund a personal provider charge. Preserve and reconcile the existing take; retry-save must not mean regenerate. Frequency in real use is unknown.

**Unverified:** complete authenticated first-time journey, interruption/cancellation recovery, provider-side billing outcomes, saved playback after reload/restart and real user satisfaction. A screenshot reached the signed-out creator page only; it is not authenticated usability testing.

## 2. Automatic captions and production

**Partially verified.**

- `app/api/studio/lyric-sync/route.ts` checks ownership, selected audio identity and analysis-asset provenance; it uses forced alignment with supplied lyrics or Scribe word timestamps when transcribing.
- `app/lyric-alignment.ts` and caption grouping preserve source wording, including multilingual fixtures. Alignment of supplied text does not establish that those words were actually sung.
- `app/lyric-pro-timeline.tsx` offers text, line/word timing, looping and tap-to-time corrections. Editing invalidates review; text edits clear stale word highlighting.
- `app/lyric-video-pro.tsx` ties projects to source versions, saves generated cues and offers optional recognition comparison. Listening review is not a hard export gate.
- `app/lyric-caption-render.ts` retains full-line shaping, handles text direction and avoids tracking in joined scripts. Mixed-direction text uses a full-line highlight mask rather than proof of isolated-word visual accuracy.
- `app/lyric-readiness.ts` blocks invalid source/range states but marks unreviewed timing as a warning. `captionTokens` can interpolate highlighting when exact word timing is absent; that is not measured alignment.

**Unverified:** actual sung onset accuracy, rapid rap, pauses/overlaps, repeated choruses, Arabic/native-dialect listening, mixed-direction visual highlighting and beginning/middle/end synchronization of finished downloads and excerpts. Reusing saved timing is implemented in project data but not proven across every output workflow.

Do not market “perfect alignment” or “no review required.” The product target remains minimal routine correction, not forcing every beginner through a technical timeline.

## 3. Musical voice variety

**Partially verified implementation; unverified performance quality.** `app/vocal-matching.ts` offers genre-related delivery guidance; `app/creator-music-options.tsx` supplies descriptive controls. These are not a persistent catalog of singing identities. Speech voice design/library IDs must not be advertised as music singers without provider support.

Future explicitly approved listening matrix: pop, country, rap/hip-hop, R&B and Arabic, plus an intentional fusion request. Assess coherent lyrics, vocal delivery, intelligibility, pronunciation and repeatability. Generic “clear sung phrasing” directions warrant checking against spoken/rap intent. Do not spend on this matrix without scope/cost approval.

## 4. Integrated Promo Pack

**Partially verified building blocks, not a certified complete one-button pack.**

| Requested capability | Current evidence |
|---|---|
| Finished-song entry | Saved-song actions open lyric video/social short; release packaging exists. A dedicated complete “Create Promo Pack” entry is not established. |
| Suggest and adjust hook | `creator-video-presets.ts` finds chorus/hook section names, including Arabic, and calculates source-time ranges. This is a heuristic, not a musical hook-quality model. |
| Both 15- and 30-second vertical files | Range/preset tooling can prepare excerpts; current social defaults include 30/60 seconds. One action rendering and packaging both required lengths is unverified. |
| Matching artwork | `release-package.tsx` renders cover art from existing visual design. Native rendering quality not verified here. |
| Actual artist/title and editable text | Release metadata and editable post-caption controls exist. Default artist text can be SAMADHI LOVE; verify actual creator attribution before publishing. |
| Synchronized safe-area captions | Shared source-time data and safe-area controls exist; finished-file accuracy remains unverified. |
| Individual and complete ZIP downloads | Individual media/caption exports and a ZIP release package exist, with a 200 MB package limit. Existing packaging includes selected saved videos; it does not prove generation of both promo lengths. |
| Privacy and no music regeneration | Packaging reads existing media rather than requiring new composition. End-to-end permission behavior remains to be checked. Nothing should publish automatically. |

The release-package README explicitly warns that captions may refer to a different source than the selected master. Check source consistency before calling a package synchronized. Reuse these tools if future consolidation is approved; do not introduce another tab or a competing package system.

## 5. Storage, accounts and recovery

**Partially verified local safeguards; live durability unverified.**

- Existing D1/R2 architecture remains unchanged. Current checked Vite bindings use local preview configuration; `replit.md` explicitly warns storage is locally emulated. No live migration/replacement was demonstrated.
- `app/api/studio/store.ts` scopes metadata by owner, uses revision-checked writes, and maintains named checkpoint objects. These snapshots are not evidence of a complete ongoing backup schedule, media backup or tested disaster recovery.
- Offline auth/vault checks pass, including rejection of forged identity headers and cross-account ciphertext reuse. This is not a full authorization penetration test.
- Generation-attempt limits and credit reservations exist. They are not a complete measured per-account media-storage quota.
- Recovery/retention code and a scheduled cleanup worker exist. Actual production cron activation and successful unattended cleanup are unverified.
- Complete account erasure, retention disclosures, restore drills and cleanup of abandoned temporary/export assets need operational evidence.

Never rotate existing encryption keys or change databases just to finish setup. Do not claim originals, timing or media survive a production restart until verified against durable live bindings.

## 6. Cost and account-plan decisions

**Deferred until core testing, required before launch.** The user accepts introductory break-even pricing and wants an affordable beginner offering.

Measure cost per accepted output, including rejected attempts, retries, alignment/transcription, storage, delivery, rendering, payment fees and support. Use the actual account's provider entitlements/rates; subscription pages alone do not establish app-resale rights or exact music allowances.

Existing credit quotes, confirmation and server reservation code are useful foundations. Future plans need server-enforced generation/storage allowances, usage displays/warnings, controlled overages and clear introductory-price terms. No prices or billing settings were changed. No unlimited promise is justified.

## 7. Business, provider and legal decisions

**Deferred until after build testing and before public business.**

Confirm operator identity, intended jurisdiction/markets, entity and registration choices, audience age, insurance advice and actual data practices. Obtain qualified legal review of privacy, terms, AI/music notices, acceptable use, recording/voice/upload consent, copyright complaints, cookies, refunds and retention/account deletion.

`app/billing/legal.ts` validates configured operator/contact/policy links; it is not a complete policy suite. `membership-notice` is not a substitute for all required policies.

Prior research identified written provider authorization and possible co-branding requirements for this music-platform use case. Confirm current terms and a suitable agreement before letting customers generate through the platform. Paid personal generation rights alone are not sufficient evidence. Do not claim immunity from lawsuits or “we never sell data” without verifying actual practices.

## 8. Public sharing, Party Mix and radio

**Partially verified music sharing; secondary streaming scope deferred.**

Existing `app/api/community/route.ts`, community management and song-share routes implement explicit song release/unlist, artist/community access, audio playback, listening links and moderation paths. These are not all live-tested here. Keep private defaults and explicit creator permission.

Public video-feed completeness is unverified. `video-publishing.tsx` explicitly says recipients of saved-video links need Studio access; these links are not proof of public video hosting. Do not expose private source assets to build a showcase.

Party Mix files, on-demand discovery and continuous radio are distinct products. The user considers unreleased Party Mix/radio “Coming soon” and potentially a special subscription later; no final pricing was selected. Preserve existing working access and queued development; no new main tabs or paid access activation are authorized by this review.

Before radio: choose opt-in originals station versus user live broadcasts; establish composition/recording/performer/provider permissions, explicit permission, moderation/reporting, delivery costs and operating infrastructure. Synchronizing video differs from audio streaming rights. No commercial catalog or continuous station is cleared or launched here.

## 9. Phones and app-store distribution

**Unverified on physical devices; store work deferred.** Browser export code includes genuine frame/audio encoding, output validation, cancellation and fallback restrictions. It does not establish device support or successful full-length playback.

Test web creation, recording permissions, playback, captions, export, download/share, memory use and background/sleep interruption on supported iPhone/Android devices. Keep original work recoverable. Automated desktop emulation must be labeled as such, not physical-device verification.

Prioritize mobile web; later assess Home Screen installation, native value, shared accounts, server rendering if necessary, developer enrollment, store review/privacy and payment requirements. No conversion, enrollment or submission performed.

## 10. Verification evidence

These commands passed earlier in this same review conversation against the unchanged application source:

| Check | Result and limit |
|---|---|
| `pnpm run typecheck:libs` | Passed; shared TypeScript build. |
| Studio `typecheck` | Passed. |
| API-server `typecheck` | Passed. |
| Studio `build` | Passed; optimization/chunk warnings remain. Does not establish deployment readiness. |
| Studio `test:elevenlabs` | 32 passed; offline SDK/auth/vault fixtures, no live provider generation. |
| Studio `test:credits` | 44 checks passed; isolated SQLite/account/provider fixtures, no live billing. |
| Studio `test:quick-mode` | 5 passed; explicit vocal/sketch behavior and recovery choices. |
| `node scripts/test-lyric-video-pro.mjs` | 25 passed; controlled unit/DOM fixtures, including multilingual preservation and cue logic. |
| Creator-page screenshot | Signed-out page rendered. No authenticated workflow or phone testing. |
| Workflow logs | Services running; development authentication warning. No production certification. |

Total: 106 automated tests/checks across the four test groups. No new tests were rerun simply to produce this document. No real paid output, native export cycle, full security audit, load test or physical device test was performed.

## 11. Smallest next sequence

1. **Existing song-verification work:** resolve the generated-recording loss branch, prove recoverable save/reopen, and verify real charge outcomes only under an approved spending scope. Keep Song Memory and security remediation with their existing task owners.
2. **Caption quality:** use authorized existing audio first to measure practical alignment and Arabic/mixed-language correctness; clearly identify estimated timing and outstanding review. If paid processing is required, stop for cost approval.
3. **Finished video:** verify native exported-file playback and timing, cancellation/recovery and documented browser/device limits using existing authorized samples.
4. **Durable operations:** confirm actual production storage/auth configuration, restore/recovery, quota and cleanup evidence before moving toward a public launch.
5. **After testing:** provider agreement, sustainable allowances and actual-practice legal policies; all remain separate decisions.
6. **Limited pilot:** after blockers, invite a small beginner group, measure completion and return usage, and market permissioned real output. Do not assert superiority to Suno without evidence or start paid ads merely because code tests passed.

Optional later offerings: Party Mix/radio subscriptions, public video showcase expansion, native app stores and more elaborate promo automation. None should delay proving the core song/video journey.

**Review completion is not launch approval.** Only this checklist was added; application behavior, credentials, billing and publication are unchanged.
