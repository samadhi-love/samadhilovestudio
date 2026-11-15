# Test and export status

Source: v92, commit `be15dc8f65ea57e613341a4976a3624011abf071`.
Fresh exported-source verification completed: **2026-11-14 18:39:44 EST**.

## Passed during this handoff

- Snapshot SHA-256 verification: all **600 original tracked files**, no omissions or changes.
- Clean portable-profile dependency installation from the exact lockfile: **737 packages**, using the matching existing npm cache. No runtime provider credentials or private media were copied.
- `npm run verify:studio`: **38/38 groups passed**, including TypeScript and the production build. Full group names, results and durations are in TEST_RESULTS.json.
- Actual eight-migration local D1 initialization through `node handoff/apply-local-migrations.mjs`, against fresh local emulator state.
- Second migration-helper run: detected all expected tables and replayed no SQL. This helper cannot target remote databases.
- Source remained byte-for-byte equal to the manifest after install/build/migration checks.
- Public registry header/reachability checks for the locked Zod, Next and Vinext tarballs returned HTTP success and gzip signatures. This is a small connectivity probe, not a complete public-registry install/integrity test.

## What the broad suite includes

Private ownership and account boundaries, membership/credit/billing fixtures, song actions and recovery, generation/lyric notation, audio openings/downloads, section edits, real synthetic mixing/encoding, MIDI, community/Party/radio permissions, approved multilingual alignment/caption grouping, review and timing, visual templates, generated-media request recovery, actual ZIP decompression, preview/export source-time drawing, phone controls and the Start / Play / Share handoff. Actual synthetic MP3/H.264 fixture checks use FFmpeg/FFprobe where stated. These are not live provider outputs.

## Not established

A complete public-registry-only dependency installation; native browser or physical-device tests; production account save/reopen/export; real microphone/device sharing behavior; paid provider quality/entitlement/charges; a live Stripe lifecycle; live two-account security testing; cron activation and unattended deletion; continuous external broadcasting; actual native H.264/AAC final exports on a particular browser. The initial installation attempt reported tarball retry/integrity warnings and was interrupted; it is not evidence that the lockfile or every registry package is invalid.

No preview/dev server was launched during this handoff because the managed browser runner was unavailable. Build and local migration checks do not constitute browser QA.

## Re-run

```sh
npm run install:ci
npm run build
node handoff/apply-local-migrations.mjs
npm run verify:studio
```

Python 3, FFmpeg and FFprobe must be on PATH for the full suite. No actual user data, provider keys, provider credits or station state are required by that suite. Lint was not run and is not included in the passing claim.
