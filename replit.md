# Latest update — Create keeps writing quietly and never waits for an old recovery notice

Removed the restore/dismiss gates, account-draft buttons and unfinished-writing filter from the creation screens. Create automatically resumes the last writing; an older account response cannot replace newly typed text or a deliberately cleared form. **New song** immediately clears both the main form and its folded detailed-production form. Autosave runs quietly; actual save errors and two-tab conflicts still protect the writing. Internal writing-only account records are hidden from song lists and pickers, while actual recordings remain visible.

Lyric/video editors no longer ask users to manage recovery panels. Applicable device video edits resume automatically, and an existing paid caption-sync result is restored without calling ElevenLabs again. Previous private device copies are preserved. The paid-song recovery endpoint and receipt protections remain: Your songs checks silently, an incomplete check or later interrupted creation re-arms recovery for the next visit, and music generation is never automatically replayed. No songs, recordings, reference takes, videos or cloud backups were deleted; no storage migration, secret, domain or billing changes were made.

**Verification:** all **52/52 Studio groups**, **37 declared workspace test commands**, extra credits-controls, full workspace typecheck and production build passed (**41/41 named commands**). Five new DOM regression tests cover silent reopening, persistent New song clearing, account conflict/late-response safety, device video edits and paid caption recovery; old prompt/label expectations were updated. The initial duration-test failure was only its old button label and passed after correction. Reports: `generated-artifacts/silent-writing-verification/{results.json,full-report.txt}` (ignored generated output). The public mobile preview rendered successfully; signed-in changes were checked with offline DOM tests.

**Owner next step:** publish this revision yourself, then refresh Create. It should reopen the last writing with no question; **New song** should clear it immediately and stay clear when reopened. The new behavior has not been checked on the published app or a real phone. No paid provider calls or credit-consuming browser tests were used.

## Previous update — ElevenLabs connection checks no longer discard unverified keys

The existing Settings connection flow now saves a personal key encrypted when the free account check times out, has a network/server/rate-limit failure, or returns an inconclusive response. It shows **“Key saved — not verified yet. ElevenLabs didn't answer in time; press Test connection again in a moment.”** Only an actual authentication/access rejection prevents replacement; the previous encrypted key stays intact. A known HTTP 401/403 still counts as a rejection even if its response body stalls. Local key-format, sign-in and secure-storage requirements remain enforced. The stable vault key and encryption mechanism were not changed; there is no shared-key fallback.

The subscription GET has a **30-second total deadline**, including existing safe GET retries and reading the response body. Music, alignment and stem permissions remain honestly unverified by this free account check: an account timeout is no longer repeated as a separate failed music test. Paid calls and their no-replay protections are unchanged.

Owners have **Check server reachability** in the existing connection panel. Its owner-only, same-origin `POST /api/studio/elevenlabs/diagnostic` uses a fixed-host HTTPS HEAD, no key/cookie/body, no redirects and no credits, measuring address lookup, connection, TLS and response times on a fresh socket. An unauthenticated HTTP 401 is an expected reachability result, not a failed key check. Failed account/diagnostic checks log a request reference, timing, phase, safe cause category/code and HTTP status when known—never raw errors, keys or provider bodies. Account-check phases not exposed by the runtime remain unknown rather than guessed.

**Verification:** **11/11 new offline API/encryption/timeout/redaction/owner-permission/DOM tests**, **52/52 Studio verification groups**, **37/37 declared workspace test commands**, the extra credits-controls command, full workspace typecheck and production build all passed (**41/41 commands**). The preview was restarted; anonymous connection settings returned 401 and the diagnostic returned 403 as intended. Reports: `generated-artifacts/elevenlabs-connect-repair/{results.json,full-report.txt}` (ignored generated output).

**Owner next step:** publish this revision yourself, then open Settings → Connect ElevenLabs. If the earlier attempt never saved your key, paste it again; otherwise press Test connection. An unverified saved key can be tested again without re-entering it. If checks are still slow, press Check server reachability and use the request reference to find the corresponding safe server log. **Not yet verified:** the new flow against the published server and its actual outbound connection; this revision has not been published. No paid calls or credit-consuming browser runs were used. The separate real song-to-video verification below remains pending owner sign-in.

# Previous update — Step 4 core-path tests passed offline; live owner sign-in pending

Added `test:core-path` to the package commands and Studio verifier. Three connected offline tests now exercise the real creation, alignment, lyric-project and private-media routes: exact supplied lyrics, saved/reopened captions, a private video upload/download with matching bytes and ranged reads, revision-conflict recovery, account isolation and rejecting a changed recording before alignment. Provider calls and persistence use isolated fixtures. A synthetic 30-second MP4 is checked with FFprobe for H.264 video, AAC audio and duration; this is **not** proof of native browser encoding, real singing or real sung-word alignment.

**Results:** **51/51 Studio groups**, **36/36 declared workspace test commands**, the additional credits-controls command, full workspace typecheck and production build passed (**40/40 commands**). Existing creation-UI tests passed **5/5**, phone-export tests **7/7**, and the new core-path tests **3/3**. Logs are under `generated-artifacts/step4-core-verification/`.

**Production attempt:** the public app loaded, and `/health` returned HTTP 200 with server/database/storage OK. The browser was signed out. Its supported automatic Clerk sign-in targets the isolated development tenant, not the existing production owner. The requested owner-browser handoff timed out. No alternate identity, owner claim, provider key, setting, billing, domain or user data was changed. **Paid-call ledger: 0 song generations, 0 lyric-sync calls, 0 other paid provider calls.**

**Still required:** the owner must sign in to the existing production account during a fresh test-browser handoff. Then continue the already-approved one-short-song → cloud save/reopen → caption sync → native vertical video export/save/download check. The global limit remains three song generations, with no automatic replay of an uncertain request. Real caption alignment, production song/video persistence, downloaded native-browser media and playback are **not verified** by this attempt. Step 4 is **not complete**. No runtime app bug was found in the offline portion; only test code/registration and this report changed. No publishing or deletion was performed.

# Earlier update — reliable background-job waiting

Fixed the nullable `RequestInit.signal` type error without changing how paid work is submitted. Job-status requests and their response bodies now have a bounded timeout, while valid progress keeps long-running songs waiting normally and temporary outages retain the two-minute reconnect budget. A stalled connection shows “Didn't finish checking your saved work” with **Try again** in Saved work status. That button only rechecks saved jobs with GET; it does not start another paid attempt or mark an uncertain job failed. Existing confirmed retries for genuinely failed server jobs remain unchanged.

**Verification:** all **50/50 Studio groups**, all **35/35 declared workspace test commands**, the extra credits-controls runner, full workspace typecheck and production build passed — **39/39 verification commands, zero failures**. Polling tests passed **13/13** and credit controls **6/6**, including stalled fetches, stalled bodies, cancellation and GET-only reconnection. Full logs: `generated-artifacts/job-wait-repair-verification/full-report.txt`. No publishing, paid provider calls, new screens, user-data deletion or storage-mode changes. The existing published deployment was not updated; physical-device and live paid-generation testing remain outside this offline pass.

# Earlier update — the cosmic Studio (owner review)

**Resumable private video saves:** Interrupted exports now keep their upload session in the existing device recovery store. Retry or reopen the same recovered video to check the authenticated server session and send only missing, hash-matched chunks. Account, song, source recording, canonical file type, size and every chunk's SHA-256 hash must match; changed files get a separate session, and lost initialization/completion responses reuse the original session/asset. Large files are hashed in 8 MB slices, not loaded whole into memory. Passed **8/8 new upload-recovery regressions, 49/49 Studio verification groups, all five supplemental offline suites, API security, whole-workspace typecheck and build**; results: `generated-artifacts/video-upload-resume-verification/results.json`. No new screen, paid calls, publishing or billing changes. Recovery needs the same file bytes and retained local browser recovery data; phone sleep/network-switch behavior has not been tested on physical devices.

**Caption reliability (Job B):** Section-edited recordings now inherit captions using the real crossfade timeline, keep an unchanged project-history snapshot, and flag changed lines for review. Video offers paid-confirmed, excerpt-only realignment and merges it without retiming unaffected captions. Sync clips small endpoint overruns and reports clipped lines, stores a private per-recording recovery copy, and offers a free restore when captions are missing. Project saves check only changed caption/translation/transliteration text and identify the line; untouched or reordered older lines no longer block a save. The landing headline now contains its missing spoken space. Passed **14/14 new regressions, 48/48 Studio verification groups, all five supplemental offline suites, API security, whole-workspace typecheck and build**; results: `generated-artifacts/caption-continuity-verification/results.json`. No publishing or paid calls; real ElevenLabs timing and physical-phone playback remain unverified. Existing Studio-credit restrictions for uploaded/analysis audio remain unchanged: changed-part alignment uses the owner's personal ElevenLabs connection.

**Compact welcome update:** DivineSpark now reuses its artwork in a slim banner after the landing slogan and on Create only in both modes, preserving all three lines exactly; passed 19/19 cosmic tests, 12/12 landing tests, 47/47 Studio groups plus the supplemental offline suites, API security, whole-workspace typecheck and build; no publishing.

The existing Studio now matches the space-themed home page. This was a
presentation and wording update, not a replacement app or a new music engine.

- **Navigation:** Create, Your songs, Video, Record and Explore are the five
  main destinations on desktop and phone. Settings, Plan & credits, Studio
  Guide and the Simple/Advanced switch remain available; Advanced retains
  World Sounds, Mix & Edit and Promote. Old links and view IDs are unchanged.
- **Distinct screens:** violet Nebula Forge for Create, blue Song Sky for
  Your songs, teal Observatory for Video, pink Resonance Chamber for Record,
  gold/violet Galaxy Map for Explore, and a three-ring Portal for sign-in
  and sign-up. Settings, credits, Guide and Claim owner use the same theme.
  Reduced-motion preferences stop decorative animation and smooth navigation.
- **Your songs:** Sky/List uses the actual filtered library. Stars open the
  existing song; lines join actual project versions. The existing list and
  editing/recovery/release tools remain below it. Common next-step buttons
  are visible without first opening Song actions.
- **Create/Record/Video:** real forms, microphone levels, timers, recorders,
  look pickers, preview renderers and exports were restyled, not replaced.
  A saved recording can open the existing Create prefill without submitting
  anything. The existing limits remain: five minutes for a hum reference,
  eight minutes for a general Recording Desk take.
- **Community:** “Felt this” still uses the existing positive reaction.
  Public listening/reaction/follower metrics are hidden, not deleted;
  the owner's Artist dashboard still shows its statistics. Following uses
  the existing Discover view; Listening Room remains reachable.
- **Honest limits:** “Realign a part manually” opens the existing caption
  editor; automatic re-sync still covers the whole song and may use credits.
  Existing private hum references stay attached to their songs; no separate
  hum-only song store or automatic melody-following engine was added.
  Clerk keeps its accurate Continue/verification button labels rather than
  misleadingly calling every verification step “Enter the studio”.
- **Provider branding:** app-rendered screens use the shared `brand.json`.
  For managed application name/icon, the owner can open Replit's **Users &
  Auth → Configure → App info**, select Development or Production as
  appropriate, and use “Versual Studio” and the app icon. External email sender
  branding is unchanged; current managed-dashboard access requires an active
  personal Replit Pro subscription. No auth credentials or transport changed.
- **Verification:** all **33/33 verification commands passed**, including
  **47/47 Studio verification groups**, all 29 standalone offline test commands,
  dependency-lock and API security checks, and whole-workspace typecheck/build.
  The new cosmic screen suite passed **15/15** tests; the provider/auth group
  passed **64/64**. Old navigation/button-label assertions were updated while
  retaining their save, retry, conflict, restore and navigation checks.
  Static desktop sign-in and 390px phone sign-up previews were inspected.
  Phone form clipping was corrected, with regression tests for both auth-key
  modes; custom Clerk styling now uses its appearance API rather than
  structural CSS selectors. Detailed command results are in
  `generated-artifacts/cosmic-studio-verification/results.json`.
- **Preview note:** the open development tab reported a head hydration
  mismatch involving Replit's injected devtools script during restart.
  Fresh auth-page captures did not reproduce it; no hydration errors were
  suppressed. Refresh the preview before reviewing the new screens.
- **Safety:** no publishing, domain changes, billing changes, paid provider
  calls or changes/deletion of saved user data. Real-account recording,
  provider generation and native downloaded-video playback were not tested
  in a browser, in keeping with the offline-only instruction.

# Earlier update — cosmic homepage and shared branding

The app is now **Versual Studio**, with **“Your song. Your world. Your video.”**
and **“A SAMADHI LOVE creative studio.”** The public home page has the requested
starfield, orbital artwork, rotating quotes, sound/geometry illustrations,
video-look previews and animated closing star. All motion stops for visitors
who prefer reduced motion.

- Discover stays at `/community`, with its existing search, artists, saved
  items and playlists. Party Spotlight is absent from the home page; Party Mix
  remains reachable through Explore. Signed-in visitors still go to `/creator`.
- The release section reads only real published community releases, shows at
  most four and uses the existing audio player. There are no invented releases
  or audience numbers; an empty community gets an honest message.
- `artifacts/samadhi-love-studio/brand.json` is the single product-brand source.
  App navigation, sign-in labels, metadata and generated notices use it. Static
  credit/vault pages receive the name during dev/build; the vault helper stays
  fully offline. SAMADHI LOVE artist credits, defaults and saved work remain
  unchanged.
- **Verification:** 31/31 offline verification commands passed, including all
  46/46 Studio verification groups and 62/62 authentication/provider tests.
  Final targeted checks passed: 11/11 landing-page tests and 8/8 actual
  homepage/sign-in SSR tests, including synthetic live-key coverage. Full
  workspace typecheck/build and the final Studio build passed.
- Desktop and small-phone previews were inspected. A genuine cross-runtime
  rounding mismatch in decorative SVG was fixed and regression-tested; the
  final previews had no hydration errors. No paid browser-testing run was used.
- **Not changed or verified:** provider-managed email sender/template branding
  and hosted OAuth branding are external settings, not this app's config.
  This work did not change provider settings, API routes, storage, saved data,
  domains or billing, make paid-provider calls, or publish anything.

**Owner review:** Open the home page signed out (or in a private browser window)
to see the landing page; signed-in visitors intentionally continue to Studio.
Review before publishing yourself.

## Previous production sign-in startup correction — November 17, 2026

**Job A follow-up:** Library saves preserve server-owned writing revisions; successful paid-song attachment completes its recovery receipt; automatic My Songs recovery runs once per account/tab session (manual recovery stays available), with attached primary/history audio filtered before metadata reads—offline checks confirm 50 attached songs need only LIST requests, not per-song GET/HEAD requests.

Fixed the production-only `Host must not be empty` page-render crash. The root
layout now supplies a trusted server hostname from the configured public origin
(or the preview request when no origin is configured). Clerk resolves its key
during rendering instead of module import; the browser still uses its own
hostname. The proxy, managed credentials, sign-in routes and appearance are
unchanged. Visitor-supplied forwarded hosts cannot override the configured
production origin.

Verification passed: **62/62 authentication/provider tests**, including **eight
new offline regression tests** using synthetic test/live keys and the actual
homepage/sign-in page inside the actual root layout. Full workspace typecheck
and build passed. Network was blocked during the server-render tests.
No publishing, real-account sign-in/OAuth testing, secret changes, domain or
billing changes were performed. A real deployment retry remains owner-controlled.

# Earlier storage, draft-sync and full-song export safeguards — November 17, 2026

- Paid audio storage now tries the same private R2 key up to three times, then
  a separate recovery key. This never repeats the ElevenLabs request. If
  neither can be confirmed, the error says to check ElevenLabs history before
  generating again. Recovery discovers both receipts and stored-file metadata.
- Independent audio uploads merge/retry library revision conflicts. Uncertain
  saves retain indexed audio instead of leaving an untracked file.
- Account writing drafts keep their own revision counter in legacy saving.
  Repeated saves and reloads work; stale tabs still conflict. Verified row-mode
  behavior is unchanged.
- Full video exports use a disk-backed browser file and streaming MP4 output,
  with one-second audio chunks instead of a second full-length audio buffer.
  Private video saves use 8 MiB chunks, up to 512 MiB; image limits remain
  15 MiB. The final file is assembled as a stream through the existing private
  R2 adapter. Interrupted uploads retain their private temporary chunks.
- Encoded container, video and audio durations must each match the requested
  intro + excerpt + outro within 0.1 seconds before download/save. Incomplete
  cached exports are rebuilt. Real-time fallback shows actual codecs and warns
  when they are not H.264/AAC.

**Verification:** all 45 Studio verification groups and all 27 individual
offline suite commands passed (overlapping coverage). The expanded
durable-processing group passed 24/24 tests; the actual creation/media API
fixture passed 102 checks. After the final recovery-key/lyrics linkage
adjustment, the affected tests and full workspace typecheck/build passed again.
Native 10-minute encoding, device storage quotas and iPhone/social playback
are not verified by offline fixtures. Safe exports require writable browser
storage; the original decoded soundtrack still occupies memory. No live
storage checks, paid calls, publishing, domain or billing changes were run.

**Earlier deployment observation (now diagnosed above):** logs for an earlier attempt at 00:30 UTC
on November 18 report `Host must not be empty` during server rendering.
The later approved correction and offline reproduction are described above.
Passing offline checks still do not establish that a new deployment will start.

# Earlier approved foundation repairs — November 17, 2026

The owner confirmed **restore legacy workspace saving**. Production now uses
the `studios` workspace, not verified per-song saving. No song copy or data
cutover was run. Existing per-song tables and preview songs remain unchanged.
Jobs create only empty foreign-key anchor rows for owned legacy songs; these
contain no copied song/lyrics/project data and do not verify an account.

- The deployment service confirmed `https://samadhi-love-studio.replit.app`.
  `STUDIO_PUBLIC_ORIGIN` is set to that value in the **production** environment;
  no domain, DNS, billing or publishing changes were made.
- Before changing D1, recorded a Cloudflare **Time Travel recovery bookmark** at
  `artifacts/samadhi-love-studio/generated-artifacts/d1-before-foundation-fixes-2026-11-17.json`.
  This is a point-in-time recovery bookmark subject to Cloudflare retention,
  not an indefinite SQL export. Do not restore it without explicit approval.
- Compared the live schema with all ten migration definitions. No application
  tables, indexes, triggers or views were missing or mismatched. Added only the
  two missing migration-history entries for 0008 and 0009. The ledger now has
  **10 entries**; foreign-key violations: **0**. Before the change, all live
  legacy/per-song/account/job tables contained **0 rows**.
- Paid music audio is not deleted when the final workspace save fails. A
  private recovery receipt and a second index on the audio object's metadata
  retain the song title, reference and audio key. My Songs attempts recovery
  on entry and has **Recover unfinished songs**. Recovery is owner-scoped,
  idempotent, preserves edited writing and does not replace a newer recording,
  resurrect deleted songs, or call a provider. It retries saves on conflicts.
- Paid visual imports also retain downloaded bytes on failure. Unconfirmed
  visual imports are not presented as ready images; the existing provider job
  can retry importing without requesting another paid generation.
- Archive/restore sharing cleanup now runs **after** a successful workspace
  commit. Its outbox is saved atomically in that workspace. Failures remain
  recorded, return a visible warning and retry when the workspace loads;
  successful cleanup has a private receipt to avoid repeated processing.
- Clean-word validation on song saves checks changed text fields, not unchanged
  flagged text elsewhere. Rejections identify the song and field. Publish/share
  checks remain strict.

**Final verification:** 45/45 Studio verification groups and 27/27 individual
offline test commands passed (overlapping coverage; 28 successful commands
including `verify:studio`). The durable-processing command passed 15/15 tests,
including seven new foundation-safety tests. The actual creation-route fixture
also passed five new checks for paid audio and recovery receipts after a failed
final save. Full-workspace dependency checks, typecheck and build passed.

**Local production startup: PASS.** The initial attempt found the preview port
already occupied. Started the real production entry point on isolated port
19661 with the approved origin and live D1/private R2 credentials; it bound to
`0.0.0.0`, completed startup checks, and `/health` returned HTTP 200 with server,
database and storage all `ok`. Stopped that temporary production process after
the check, then restarted the normal preview workflows.

No paid provider calls were used. Real paid-output generation/recovery and the
next deployed build have not been tested live; those were not simulated by
changing real account data. The owner, not Agent, will trigger publishing.

## Earlier live-check results (superseded where noted above)

Owner-authorized live checks only; no publishing, migrations, paid provider calls
or user-data changes were made.

- **D1: partially passed.** All expected application tables/views exist.
  Foreign keys are enabled, the foreign-key consistency check found no problems,
  and a two-statement read-only batch passed. The migration ledger has eight
  entries but does not record `0008_independent_song_storage.sql` or
  `0009_background_jobs.sql`. These tables already exist: do not blindly rerun
  the migrations. A separately approved reconciliation must compare the full
  migration definitions with the cloud schema before recording any missing
  history. This is not evidence of a token-permission failure.
- **R2: passed the exercised checks.** Authenticated storage, multilingual
  camelCase metadata, ranged reads, streamed upload, create-only writes and stale
  revision rejection passed. Unsigned access to the tested S3 object was rejected
  with HTTP 400 (an authentication error), not object content. All uniquely named
  temporary objects were removed and their absence checked. Cloudflare dashboard
  public-access/custom-domain settings were not independently inspected; S3 denial
  alone does not prove those settings are disabled.
- **Vault: passed.** The actual application vault functions encrypted, stored and
  recovered a dummy key for a unique synthetic owner using the existing vault
  secret unchanged. The synthetic vault object was removed and absence checked.
  No existing owner/provider keys were read or changed.
- **Production startup: attempted once and stopped safely.** With an isolated
  local port, the real production entry point exited with
  `STUDIO_PUBLIC_ORIGIN must be a valid HTTPS origin.` No serving production
  instance was started. A separate read-only check found zero active cloud jobs;
  no startup reconciliation was run against them.

**Historical checklist:** The origin was pending and migration reconciliation
needed approval at the time of these earlier checks. Both are superseded by
the approved foundation-repair results above. No D1/R2 credential replacement
was required.

# Step 3 Part B — saving and recovering work

Studio records music, lyric-timing and video jobs. An interrupted paid request
is never automatically replayed. Create writing saves privately to the account;
when precise caption timing fails, pasted or saved lyrics can get an editable
rough draft. Guided video exports can reuse completed segments on supported
browsers on the same device. See
`artifacts/samadhi-love-studio/docs/STEP3B_RELIABILITY_REPORT.md` for the limits.

# SAMADHI LOVE Studio

## Step 3A — approved reliability work

Added bounded safe-read retries (1s/3s waits), a main-server `/health` route and
production supervisor, recoverable panel/editor/timeline boundaries, private-safe
crash logging, and common early upload/form checks. Paid POST processing and
ambiguous D1/R2 writes are deliberately not auto-retried: Studio request IDs do
not guarantee provider billing idempotency. Credit logic remains unchanged.
No new creation features or redesign were added. No data/backups were removed,
no preview songs were uploaded, and nothing was published or billed.

Full scope, exceptions and final verification:
`artifacts/samadhi-love-studio/docs/STEP3A_RELIABILITY_REPORT.md`.
Final result: **45/45 verification groups, 26/26 test commands, 10/10 new
reliability checks, and the full workspace typecheck/build passed** (overlapping
totals). Main Studio `/health` returned HTTP 200; the cloud D1/R2 health check
also passed read-only. A real published freeze/restart, signed-in cloud saving,
paid output and native phone validation remain unverified.
The feature freeze remains in force. Production origin is still pending first
publish; immediately afterward remind the owner to set the actual HTTPS origin.

## Step 2 finished for the approved fresh start — feature freeze remains

The owner chose to start cloud use with new songs. **Do not copy or upload the
7 local preview songs.** Leave local data, legacy bundles and all backups intact.
Production is pinned to verified per-song D1 storage. A new account's first save
now creates a verified `empty-fresh-start` receipt in `studio_accounts`, then
saves songs/lyrics/notes/projects in their separate tables. It does not run the
copy helper or write a `studios` bundle. Existing legacy accounts are refused
rather than silently imported, overwritten or reset.

The read-only cloud check confirmed the correct database ID/name, the expected
schema, private R2 access, and zero legacy/normalized accounts, songs, lyrics,
notes, projects and jobs. No cloud account marker was inserted just to claim a
test: each real new account receives its verified empty-start receipt on first
save. Offline actual API tests saved and reopened a fresh song while legacy
bundle inserts were blocked. Final checks passed: **44/44 verification groups,
25/25 test commands, full workspace typecheck/build** (overlapping totals).
Storage tests: 7/7; actual song API assertions: 18/18; runtime tests: 20/20.

Step 2's foundation work is complete for this approved fresh-start scope. It is
not a deployed live-song saving test: signed-in cloud save/reopen, paid provider
output and downloaded-video playback remain unverified. Nothing was published.
Keep the feature freeze until explicit owner approval. `STUDIO_PUBLIC_ORIGIN`
stays pending; remind the owner to set the actual HTTPS origin immediately after
first publish.

### Earlier preparation evidence

Work is restricted to secrets, independent song saving, shared server helpers
and durable job records. Keep Stage 3 as it is. Flag feature requests instead of
building them until the owner approves Step 2. No visual changes, publishing,
domain changes, billing activation, data deletion or leftover-file removal.

The local copy of **3 accounts / 7 songs** matched exactly: counts, lyrics,
prompts/notes and all fields including audio/video/media references. Preview now
uses separate D1 records with per-song revisions. The original studios bundles
are read-only backups and R2 checkpoints were not touched. Community catalog and
moderation use current song rows for migrated accounts, not frozen backup data.
Retention remains disabled and refuses migrated data to protect those backups.

The owner supplied these resource settings:
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`,
`CLOUDFLARE_D1_DATABASE_NAME`, and `STUDIO_R2_BUCKET_NAME`.
**The app is not published. `STUDIO_PUBLIC_ORIGIN` is intentionally pending and
must not block development or storage setup checks. Immediately after the first
publish, obtain the actual published URL and remind the owner to add its HTTPS
origin. Never invent an origin or use the development URL.**
Production startup/sign-in keeps strict origin validation. Storage diagnostics
and the explicitly approved copy command do not require an origin or host port.
The owner approved cloud setup after the corrected database name and ID matched
Cloudflare. The additive Step 2 tables, view, backup guards and job indexes are
now present in the selected cloud database. The copy command completed with
**0 accounts / 0 songs / 0 failures** because that database is empty; this is not
a real-song cloud comparison. All expected schema objects and read-only private
R2 access passed. Legacy rows were unchanged. Preview's 3 accounts/7 songs have
not been uploaded, and no R2 objects or checkpoint backups were changed.
Existing credential names and the existing `vault` value
are preserved. Missing production configuration is named explicitly at startup.
**Cloud schema preparation is done; no deployed production read/write switch or
publish has been performed.** Development remains isolated. Do not describe the
local 7-song comparison as live cloud verification. The general jobs helper is
record-keeping only; no processing has been moved into a worker.

Full report, exact verification totals and leftover recommendations:
`artifacts/samadhi-love-studio/docs/STEP2_FOUNDATION_REPORT.md`.
Final offline result: **44/44 verification groups, 25/25 test commands, and the
full workspace typecheck/build passed**. These totals overlap. No paid provider
or signed-in device testing was performed. Code/local verification through 2D is
finished; approved empty-cloud preparation is also finished. Signed-in cloud
saving and production cutover remain unverified. Confirm sibling-app writers
before any future migration of populated legacy accounts. The origin is pending
first publish, not a blocker for development or database setup.

## Owner test checklist — before launch

1. In **Replit Secrets**, add `STUDIO_CLOUDFLARE_D1_API_TOKEN`, `STUDIO_R2_ACCESS_KEY_ID`, `STUDIO_R2_SECRET_ACCESS_KEY`, and `STUDIO_OWNER_EMAIL`. Use the D1 Edit token and the bucket-scoped R2 S3 key pair. Keep the existing `vault` secret unchanged; never paste secret values in chat.
2. Sign in with the verified email matching `STUDIO_OWNER_EMAIL`, then press **Claim owner** once.
3. Open **Settings → Connect ElevenLabs**, paste your own key, and press **Test connection**. This checks account permissions without generating music.
4. Repeat the creation and video check on **desktop and phone**: record a 2-minute melody idea; create one song with **Make 2 versions** off; find it in **My Songs**; close and reopen the app and confirm it is still there.
5. Choose **Make a Short**, export and download the video, then play the downloaded file and check the lyrics appear in sync.

Creating the test song may use provider usage or Studio credits. Run it only when you are ready for that cost. Saving does not publish or share anything.

## Stage 3 — beginner creation tools

Create now has free, on-device **Help me describe it**, editable lyric-part chips, and optional “Make 2 versions” with clear double-cost confirmation. My Songs adds **Make it longer**, **Redo a part**, and **Make another like this**; originals stay intact. **Make a Short** prepares a vertical 30-second clip from the chorus when marked, otherwise from the strongest available audio window, with a start slider and the last-used look. Creators can record several private melody references, up to five minutes each, per song idea; they are never sent to ElevenLabs. The first-visit guide now explains **Describe or hum → Listen and keep your favourite → Make a video**.

Only offline/DOM verification was used for this stage. All **41/41 Studio verification groups passed**, including the new Create, My Songs, short-video slider, multi-take recorder and non-destructive section-edit checks. The full-workspace typecheck and production build also passed, including the design-preview sandbox. No paid provider calls, publishing, billing or data deletion occurred. Real microphone hardware, signed-in browser use and live production saving were not tested.

## Stage 2 — one guided Studio

The main navigation is now **Create, My Songs, Video, Record, Explore**, plus **Settings & Help**. **Pro tools** adds **World Sounds, Mix & Edit, Promote** and deeper controls inside the same screens, not a separate Studio. Existing engines and saved-data formats were reused; no songs, recordings, templates, videos or settings were reset or deleted.

| Previous tools | Where they now live |
| --- | --- |
| Music Creation, Detailed Song Production, Prompt Lab, Vocal Director, Templates | **Create**: recipes at the top, Simple/Custom, then lyrics/style/vocals/prompt-helper fold-outs. The existing detailed production engine stays mounted in Custom → Pro production, outside the main form. |
| Universal Music Library, Rhythm Atlas, International Tent, Meditative Vibes | **World Sounds**: browse sections and “Use in my song” to prefill Create without generating anything. |
| Recording Desk, Podcast Studio, Vocal Studio Pro | **Record**: Voice/Podcast switch, the existing recorder and a Pro fold-out. Switching is locked during capture. Mantra and echo tools remain. |
| Audio + Visual Studio, Mix Lab | **Mix & Edit**: Pro timeline and comparison tools. |
| My Songs, Project Workflow, Release Board/Tools, Artist Dashboard | **My Songs**: Listen → Fix a part → Make video → Release; checklist, exports and artist publishing are inside the song's Release step. Covers stay with their song. |
| Logo Creator, animated nature logos, Musical Ad | **Promote**: existing design tools; ads prefill Custom Create for review, never auto-submit. |
| Community/Discover, personal/community Radio, Party Mix, Listening Room | **Explore**: listening tabs; Radio has My station/Community station, with only one active. Moderation remains owner-only. |
| Membership, Plans, Credits & Usage | **Settings & Help → Plan & Credits**. Billing was not enabled. |
| Lyric Videos & Shorts | **Video**: Awaken, Violet Flame, Sacred Bloom, Aurora Silk, Star Stories and Neon Skyline up front; Phone/YouTube shapes, with square and deeper styling under More looks. Vibe previews are local and preserve caption timing and saved per-format layouts. |

Old view IDs, query/hash links and song identifiers route into these homes. Eligible signed-in legacy pages redirect; guest/public sharing and checkout-return gates remain intact. Simple keeps the main song-description field and style choices; language/singer overrides are in Custom → Vocals.

Recent guided-workspace work adds an always-available Simple/Advanced switch, contextual screen help, and a first-visit tour that can be restarted from **Settings & Help → Studio guide**. Create now has a private, searchable **My prompts** library with one-click reuse, favorites and an immediate Undo for favorite changes. Manual prompt saving is available; optional automatic prompt saving is off by default and only stores a prompt after a confirmed song. Saved records remain compatible, and existing draft recovery, lyric versions, and recently deleted song restore remain in place. This phase adds no paid provider calls.

Current instructions: `artifacts/samadhi-love-studio/docs/STUDIO_GUIDE.md`. Production/setup details: `artifacts/samadhi-love-studio/docs/REPLIT_PRODUCTION.md`. Forty-seven historical documents were moved intact into `docs/archive/`; use the current guide rather than the old handoff.

### Verification and remaining limits

All **23 offline command suites passed**, including the final **41/41 Studio verification groups**. The full-workspace typecheck/build passed with PORT and BASE_PATH unset. Built-Node smoke, six lock/config regressions, two patched request-parser tests and the image-adapter encode/decode check also passed. Navigation, legacy-link, recorder-mode, song-step and format-control tests now check the consolidated structure without discarding the original saving/caption safeguards.

Fresh dependency scan: **0 critical, 1 high, 4 moderate, 2 low**; static-code and privacy scans reported no findings. Compatible patches reduced high findings from 24 to 1. The remaining high is Zod 3 (`GHSA-mrhx-c7xc-m3w5`): its fix requires Zod 4, a behavior-changing major migration, so it was not forced into API/database/form contracts. Details and patched versions are in the current guide. No findings were suppressed. The previous four critical advisory details are preserved in `docs/archive/SECURITY_BUILD_VERIFICATION.md`.

The restarted phone-sized signed-out preview renders, but **no credit-consuming interactive browser journey, paid generation, live Cloudflare verification, publishing, DNS/domain change, billing activation or user-data deletion was performed**. These checks do not certify live saves, sung-language quality or downloaded-video playback.

### Owner checklist — credentials are supplied, live setup is not yet verified

Stage 1's Node → existing Cloudflare D1/private R2 adapter, verified Clerk sign-in, Claim owner and free-only connection test remain in place. Preview still uses isolated local emulation even with production Secrets present.

1. The named D1, R2 and owner-email Secrets have been supplied; do not re-create them merely because live verification is pending. D1 token source: Cloudflare profile → API Tokens → Account/D1/Edit. R2 pair source: R2 → Manage R2 API Tokens → bucket-scoped Object Read & Write; Access Key ID and Secret Access Key go in separate fields, not the API Token value.
2. Preserve the existing `vault` key unchanged. If adopting `STUDIO_ELEVENLABS_VAULT_KEY`, securely use the identical existing 64-hex value, never a new key.
3. Sign in with the verified email matching `STUDIO_OWNER_EMAIL`, open `/owner` and press **Claim owner** once. First signup is never automatic admin.
4. Settings → **Connect ElevenLabs** → paste your own key from ElevenLabs → Developers → API Keys → **Test connection**. This reads free account information only; unknown feature permissions show Not verified. No silent shared-key fallback.
5. Complete the opt-in live storage checks and, when authorized/credits allow, the signed-in create → save → reopen → captions → vertical video → download journey before calling personal-use readiness fully verified. The retention/permanent-deletion job stays disabled.

Continue the user's existing music-creation app, with beginner-friendly songs and both easy and advanced visual/lyric videos. Do not build a replacement or discard its features. The user owns `samadhilove.com`; domain cutover and publishing require separate confirmation.

## Run & Operate

- Managed workflow `artifacts/samadhi-love-studio: web` runs the imported studio.
- Managed workflow `artifacts/api-server: API Server` runs the authentication bridge and Clerk proxy.
- `pnpm --filter @workspace/samadhi-love-studio run typecheck` — check the imported app
- `pnpm --filter @workspace/api-server run typecheck` — check the identity service
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/samadhi-love-studio run test:elevenlabs` — offline SDK transport and sign-in regressions
- `pnpm --filter @workspace/samadhi-love-studio run test:runtime` — offline direct D1/private R2 adapter, safe startup and request-boundary checks
- `pnpm --filter @workspace/samadhi-love-studio run start` — production Node server; requires valid existing storage credentials and vault key
- `pnpm --filter @workspace/samadhi-love-studio run test:credits` — offline credit reservation/refund checks
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/samadhi-love-studio exec wrangler d1 migrations apply DB --local --config replit-local.wrangler.json` — initialize the studio's **local development** D1 store
- Required identity secrets are provisioned through managed Clerk. Never copy secret values into source, logs, or chat.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Imported app: React 19 + Vinext (Next App Router on Vite), original CSS and media assets.
- The original app's API routes remain in its own `app/api` tree.
- Identity bridge: Express 5 with Clerk; OpenAPI codegen remains in `lib/api-spec`.
- Existing storage model: Cloudflare D1 + R2, currently emulated locally for preview. Do not silently convert it to PostgreSQL.

## Where things live

- `artifacts/samadhi-love-studio/` — the imported original app, including its existing docs and handoff.
- `app/studio.tsx`, `app/quick-create.tsx` — original workspace and quick creation.
- `app/api/studio/create/route.ts` — music generation.
- `app/lyric-pro-export.ts` — existing browser video exporter.
- `app/credits/` — original quotas, reservations and refunds.
- `app/chatgpt-auth.ts` retains its old export names for compatibility, but now calls the verified identity service; it must never trust the old identity headers.

## Architecture decisions

- Preserve the imported runtime and data model rather than rewriting hundreds of components during transfer.
- The original source contains platform-asserted identity headers. These are NOT authenticated on Replit; use Clerk session verification instead.
- No automatic owner access or first-signup administrator. Owner setup needs an explicitly verified identity.

## Product

Original screens cover song writing/generation, lyrics, visual and lyric-video creation, recordings, project libraries, and community discovery. Imported capabilities are not evidence of completed end-to-end verification.

## User preferences

Focus on affordability and beginners, with easy and advanced controls in the same app. The user wants technical decisions handled without requesting individual files again.

## Gotchas

- Preview storage is LOCAL ONLY. It is not a production data migration or durable published storage. Do not publish with emulated D1/R2 as if it were production storage.
- Production uses a Replit Node Vinext server with server-only D1 HTTP and private R2 S3 adapters, not a Worker gateway, static hosting or Wrangler. Startup checks the existing schema and bucket read-only; it never migrates or seeds. See `artifacts/samadhi-love-studio/docs/REPLIT_PRODUCTION.md`. Production storage is not live-verified until the owner supplies credentials and approves the appropriate checks.
- The source archive included no account records, saved provider keys, or original hosted private media. Do not claim those were transferred.
- ElevenLabs generation and billing must not be claimed connected based only on source code or an account-status check. No live paid generation has been verified.
- Server-funded production and paid billing remain disabled pending provider setup and operator approval.
- The official ElevenLabs SDK is wired into existing music requests with automatic retries disabled. CLI authentication uses the project secret; creator generation still requires that creator's encrypted vault key. Never silently fall back to the global CLI key for visitors.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
