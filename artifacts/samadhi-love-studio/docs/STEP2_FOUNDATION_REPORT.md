# Step 2 — Clean Structure

Feature freeze: keep Stage 3 unchanged. No new features or visual changes until
the owner approves Step 2. No publishing, domain changes, billing activation,
user-data deletion or leftover-file removal is authorized.

## 2A — Resource configuration

Production no longer contains fallback Cloudflare resource identifiers. These
existing values must be supplied in Replit Secrets:

| Value moved out of production code | Secret name |
| --- | --- |
| Cloudflare account ID | `CLOUDFLARE_ACCOUNT_ID` |
| Existing D1 database UUID | `CLOUDFLARE_D1_DATABASE_ID` |
| Existing D1 database name | `CLOUDFLARE_D1_DATABASE_NAME` |
| Existing private R2 bucket name | `STUDIO_R2_BUCKET_NAME` |
| Existing trusted production origin | `STUDIO_PUBLIC_ORIGIN` |

The fifth setting preserves the same trusted origin; it does not change DNS or
the domain. Startup names missing/invalid settings. The existing D1/R2 credential
names are retained. `vault` remains the effective encryption secret; its value
was not read, replaced or rotated. Local-emulation placeholder IDs and fixture
bucket names intentionally remain isolated from production.

**Unfinished:** the new secret values have not yet been entered by the owner.
Production startup must refuse to guess them.

## 2B — Independent song saving

Added account/settings, song, lyric/version, notes/prompt-version and project
workflow tables. The existing project model attaches workflow information to
a song and can link it to a parent project; that relationship and public format
are retained rather than introducing a different project model.

Each song has its own revision. Unchanged stale songs/settings are rebased to
current data; a changed stale song is rejected without overwriting it. D1 batch
transactions guard the revision again before committing. No ambiguous write is
automatically replayed. Server responses include the saved state and current
revision metadata, including audio and lyric-project save responses.

The old 1.5 MB per-account limit is gone from the active storage path. There is a
1.5 MB metadata limit per song and a separate 32 MiB HTTP transport safety limit;
audio/video bytes remain in private R2. The existing nonvisual API shape is
retained, so the application still loads its workspace representation from the
separate records.

### Copy and comparison actually performed

- **Scope:** this app's local emulated database, not production.
- **Accounts copied:** 3.
- **Songs copied:** 7.
- **Failed accounts:** 0.
- Song counts: matched.
- Exact lyric text and lyric history: matched.
- Prompts, notes and prompt history: matched.
- Every reconstructed field, including all audio/video/cover/reference keys:
  matched.
- Original `studios` content was not rewritten. Database guards make verified
  legacy rows read-only.
- The copy never opened or modified R2; checkpoint backups were untouched.
- Local preview is configured to use the separate records.

Community catalog and moderation queries also use current per-song data for
verified owners, so they do not accidentally display the old frozen backup.
The dormant retention routine refuses to run against migrated accounts; it must
not act on old backup deletion markers. No cleanup scheduler was activated.

The copy is explicit and repeatable. It does bounded insert-only batches, does
not activate incomplete copies, compares every field, and checks that the source
has not changed before activation. Repeating an already verified copy checks the
frozen source and returns the original comparison receipt, without overwriting
later edits in the new tables. A source change or comparison failure stops the
switch; it does not try to repair or overwrite user data.

**Not done:** production schema application, production copy/comparison, or a
production read/write switch. No publish or live migration was performed.

Before a live copy, confirm the intended D1 ID and stop use of older code against
that same database. Once verified, old clients—including a sibling app using the
same database and legacy save code—cannot update the frozen backup.

### Explicit copy command

Local: `node scripts/copy-song-storage.mjs --local <exact-emulated-SQLite-path>`.

Live: only after the owner supplies the resource Secrets, confirms the intended
database and approves the operation. The command requires `--live`,
`STUDIO_APPROVE_SONG_COPY=yes` and `STUDIO_CONFIRM_COPY_DATABASE_ID` matching the
configured database ID. Do not place credentials in command arguments.
It is never a startup/build hook and does not publish.

## 2C — Shared backend boundary

All application Cloudflare binding access goes through `app/server/storage.ts`.
Its internal service wrapper preserves the existing bound SQL, streaming,
conditional writes and request-scoped bindings. Production continues to use the
direct Node D1 HTTP/private R2 adapters. Preview remains local emulation.

All ElevenLabs HTTP, SDK and multipart requests use
`app/server/ai-provider.ts`; generated-media downloads use the same boundary
without forwarding the API key. Existing provider helper names remain compatible.
The helper does not choose a shared key or retry paid requests.

Automated boundary checks reject Cloudflare imports elsewhere in application
code and provider/storage endpoint URLs in screens or API routes. Existing test
fixtures were updated to load the real shared helpers rather than the former
direct imports.

## 2D — Durable jobs

Added `studio_jobs`: job ID, owner, one of the three requested job types, status,
attempt count, plain-language error, creation/update/start/finish timestamps and
an owned-song link. A foreign key prevents dangling song links. Indexes support
owner/status and song lookups.

Shared server functions create, read, list, claim, finish and fail jobs. Status
changes are conditional: only one caller can claim a waiting job. Attempts
increase on claim; completed/failed jobs cannot silently restart. Repeated
creation of the same owner/type/song job ID is safe; other owners cannot read or
change it. Errors should be caller-supplied safe messages, not raw provider
responses or credentials.

The table was added to local emulation. No jobs were created in the real local
workspace by this work, no worker was started, and no actual music, captions or
video work was moved into jobs.

## Leftovers — nothing deleted

| Item | Recommendation |
| --- | --- |
| `lib/db` Postgres package | Likely unused at runtime but still declared by the API package. Review references and dependency removal with owner approval; do not create a PostgreSQL database merely to satisfy its initializer. |
| Preview `worker/` | Keep: the local Vite preview still uses it. Production does not. |
| Studio `work/` | Generated test scratch/output, already ignored by Git. Preserve useful reports; cleanup only with owner approval. |
| `handoff/` | Historical reference plus local migration utilities. Keep until references are reviewed and removal is approved. |
| `examples/` | Optional D1 reference material. Keep until the owner approves archive/removal. |
| Root `generated-artifacts/` | Generated outputs, excluded by both ignore files. Keep; review contents before any cleanup. |
| `mockup-sandbox` | Optional design workspace, currently included in the workspace build. Do not remove or exclude without approval. |
| Separate app `samadhilovestudio` | Not available in this workspace. Leave untouched. Confirm whether it uses the same live database before production cutover. |

## Verification

| Completed sub-step | Verification groups passed / failed | All package test commands passed / failed |
| --- | --- | --- |
| 2A | 41 / 0 | 22 / 0 |
| 2B | 41 / 0 | 23 / 0 |
| 2C | 41 / 0 | 24 / 0 |
| 2D final | 44 / 0 | 25 / 0 |

The final full workspace build also passed, including the workspace typecheck,
Studio, API server and design sandbox. New verification groups were added to
the standard runner so the foundation checks are not separate one-off checks.
The group/command totals overlap; they are not 69 distinct test cases.

The Studio preview was restarted after checking that its local paid-generation
job table had no active entries. The landing page returned 200 and rendered.
This was a signed-out static check, not a signed-in browser journey. Protected
requests returned 401 while signed out. Existing development-key and development
tooling warnings remain; no production readiness is inferred from this preview.

Focused new checks: 5 storage tests, 7 actual GET/PUT API assertions, 4 shared
boundary tests and 4 job-record tests passed, with zero failures. They cover
multilingual exact copies, repeat copies, mismatch refusal, oversized accounts,
two-tab saves, same-song conflicts, latest-state reopen, current catalog reads,
owner isolation and conditional job claims.

While consolidating the backend, some tests initially failed because their VM
mocks still expected the old imports or assumed headers were plain objects.
Those harnesses now load the actual shared helpers against fake storage/fetch;
strict import and permission assertions remain. The final full rerun was green.

No real microphone, signed-in device journey, live Cloudflare copy, paid provider
processing or live exported-video playback is being claimed. No security-scan
clearance is implied by these offline tests. The older sibling app was not
available for inspection; its compatibility with a live cutover remains an
owner confirmation.

## Exact owner action still needed

1. Securely supply the five resource settings listed in 2A, identifying the
   **existing** Cloudflare account, D1 database, private R2 bucket and trusted
   production origin. Existing D1/R2 credentials, owner email and `vault` are
   already present; no replacement vault key is needed.
2. Confirm whether the sibling app still writes to the same live D1 database.
   Stop legacy writers before an approved live copy.
3. Approve/confirm the specific live-copy operation and intended database before
   it runs. It adds tables and copies records; it does not publish or delete.
4. Review the live comparison before considering the foundation work fully
   complete or approving any feature work.

**Bottom line:** local implementation and offline verification through 2D are
finished. Production copy, production comparison and live cutover are **not**
finished. The feature freeze remains in force.
