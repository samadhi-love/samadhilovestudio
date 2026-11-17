# Live storage verification — November 17, 2026

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

**Owner checklist:** Keep `STUDIO_PUBLIC_ORIGIN` pending as previously requested
while unpublished. Immediately after first publish, set it to the actual HTTPS
origin without a path, then repeat the production-startup verification. Do not
invent a production hostname now. No D1/R2 credential replacement is indicated
by these results. Migration-history reconciliation needs separate approval;
nothing was migrated during this verification.

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
