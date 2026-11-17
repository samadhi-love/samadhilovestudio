# Audit reliability repairs — November 13, 2026

These changes preserve original songs, recordings, inactive visual assets, lyrics, project IDs and branding. They do not migrate or delete production data.

## Implemented repairs

- Recognize final, last, opening and repeated section labels in the common lyric parser; arbitrary bracket/parenthesis instructions remain separate from performed words.
- Derive active ad footage/photos once for fetching, preview readiness and export. Template selection retains inactive ad media without decoding it or requiring native footage encoding.
- Release image-cache entries no longer needed by the active visual source; late image requests cannot repopulate an inactive cache.
- Use immutable, deduplicated export-history registration for Simple/Classic and Pro video editors, retaining the existing last-30-record bound and private file browser.
- Add collection rename/remove and in-workspace Undo. Removing a collection does not delete favorites, catalog entries or songs.
- Contain modal keyboard focus, skip disabled/closed controls and restore the opening trigger.
- Run the new notation, photo-story, audio-edit and audit-regression checks from `npm run verify:studio`. Continue after failed groups and report a failing exit status if any group fails.

## Local verification

Run `npm run verify:studio`. Results are written to `work/studio-verification/latest.json`; overall success requires every group to pass. The suite includes a genuine synthetic 30-minute audio render and independent audio-file checks, but most UI/API checks use isolated DOM, encoder, provider and storage fixtures. It does not make paid generation calls or alter production accounts.

Result for this source revision: **all 33 verification groups passed**, including TypeScript, the production build, all 25 lyric-video tests, the new five-case audit repair suite, and synthetic audio-file checks. Native-device and live-service limits below still apply.

## Operational work that local code tests cannot certify

The 1.5 MB general workspace document cap remains in place; do not remove a limit without a storage migration/capacity plan. Existing named checkpoints are useful recovery snapshots, not a complete production backup service.

Before schema/storage migration, an authorized operator should take a consistent D1 export plus an R2 object inventory/backup covering audio histories, vocal/mixer sessions, voices, lyric projects/assets, rights, radio state and publication grants. Record schema/version, object checksums and references. Restore into isolated D1/R2 resources; verify project/source links, media hashes, owner boundaries, listening/publication grants and billing-ledger reconciliation. Do not replay billing events or send restored accounts' messages. Keep the current production resources intact until restoration is demonstrated. No such live restoration is claimed by this change.

Physical-device sign-off remains necessary: microphone permissions/capture, upload/reopen, native H.264/AAC decode/encode, playback of downloaded files, foreground/background export behavior, mobile memory, keyboard/screen reader navigation, signed-in provider operations, payment-webhook delivery and deployed cleanup schedules.

AI image/video generation, direct distributor submission and automatic social posting are separate integrations; this repair does not enable or claim them.
