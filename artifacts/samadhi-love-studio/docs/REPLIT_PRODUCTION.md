# Personal-use readiness: Replit Node + existing Cloudflare storage

## Safety boundary

Do not publish, change domains/DNS, enable billing, run paid provider operations,
apply unapproved remote migrations or delete user data as part of setup. The built retention
implementation has **no active scheduler**. Startup does not seed accounts or
create tables. Preview remains on its isolated emulated D1/R2 storage and does not
use the production adapters even when production credentials exist.

## Production path

`pnpm --filter @workspace/samadhi-love-studio run build` produces a Vinext **Node**
build. `pnpm --filter @workspace/samadhi-love-studio run start` validates storage,
then starts Vinext on `PORT`, bound to `0.0.0.0`. Existing artifact commands already
use those scripts. There is no Worker gateway, Wrangler production server, static
fallback, PostgreSQL conversion, or persistent local-file fallback.

Production resource identifiers are now read from Secrets by
`scripts/storage/resources.mjs`: `CLOUDFLARE_ACCOUNT_ID`,
`CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_D1_DATABASE_NAME`,
`STUDIO_R2_BUCKET_NAME`. They must identify the existing resources; there is no
fallback that guesses a live database/bucket. Never expose private files using
`r2.dev`. This app has not been published: `STUDIO_PUBLIC_ORIGIN` is intentionally
pending. Development and storage configuration/diagnostics do not require it.
Immediately after first publish, obtain the actual published address and remind
the owner to set its HTTPS origin. Production startup/sign-in still validates
this setting strictly; do not invent an address or use a development origin.
Setting this value does not alter domain/DNS configuration.

Startup requires credentials and a valid existing 64-hex-character vault key,
verifies every application table name with a parameterized read-only D1 query,
and performs S3 HeadBucket. It refuses to serve if either check fails. It does not
prove that live media writes or all schema columns are correct; opt-in checks and
the final real-account journey remain separate.

## Owner checklist — use Replit Secrets, never chat

Open this project's **Secrets** tool from the workspace tools search. Add the
following exact names. If entering production-only values, use the Production
environment. Do not replace an existing working credential just to rename it.

| Name | Where to get the value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | The existing Cloudflare account's Account ID; not an API token. |
| `CLOUDFLARE_D1_DATABASE_ID` | The existing D1 database's UUID from its details page. |
| `CLOUDFLARE_D1_DATABASE_NAME` | The exact existing D1 database name. |
| `STUDIO_R2_BUCKET_NAME` | The exact existing private R2 bucket name; do not create a public replacement. |
| `STUDIO_PUBLIC_ORIGIN` | Pending until first publish. Then use the actual published HTTPS origin, without a path. Not needed for development or storage setup. |
| `STUDIO_CLOUDFLARE_D1_API_TOKEN` | Cloudflare profile → API Tokens → Create Token → custom token configuration. Permission: **Account → D1 → Edit**, limited to the account containing the named existing database. Copy the token value, not its token ID. |
| `STUDIO_R2_ACCESS_KEY_ID` | Cloudflare account → R2 Object Storage → Manage R2 API Tokens → create a bucket-scoped **Object Read & Write** S3 credential for `samadhi-love-studio-media`. Use its **Access Key ID**, not its API token value. |
| `STUDIO_R2_SECRET_ACCESS_KEY` | The **Secret Access Key** from that same R2 credential pair. This is a separate secret field. Keep the bucket private. |
| `STUDIO_ELEVENLABS_VAULT_KEY` | The **existing, stable** 64-hex-character encryption key used for stored provider keys. This project already has the compatibility secret `vault`; preserve it. That alias remains supported. If standardizing the name, copy the identical existing value securely—never generate a new value or rotate it without an explicit re-encryption plan. |
| `STUDIO_OWNER_EMAIL` | The email you will actually verify and sign in with through this app's managed Clerk sign-in. This is an allowlist, not a password or a signup invitation. |

Clerk stays Replit-managed; do not replace its keys. Development and production
identities/storage remain separate.

After the required credentials are supplied:

1. Run the authorized read-only storage check if desired; do **not** publish.
2. Sign in with the verified owner email. Open `/owner` or My Studio.
3. Press **Claim owner** once. Only the matching verified account sees that
   control. Claims use a private conditional R2 write; a different account cannot
   replace the claim. No first signup becomes administrator.
4. In **Settings → Connect ElevenLabs**, paste the owner's ElevenLabs API key
   from ElevenLabs → Developers → API Keys. The key is encrypted per account.
   There is no automatic attachment or fallback to a shared project key.
5. Press **Test Connection**. It reads subscription information only. Enable
   User read for that free account check; review Music and Forced Alignment
   permissions for the features you want. No composition plan, song, alignment,
   speech or stem job is started by this test.
6. Review all three feature results. **Not verified** is intentional where the
   free provider response does not expose permissions; it is not a false pass
   or evidence that a feature is broken. Actual singing, alignment accuracy and
   stem quality still require separately approved processing later.
7. Complete the signed-in song/sketch → My Songs → reopen → captions → short
   vertical video → download journey, including a phone-sized screen. This
   browser journey remains pending if testing credits are unavailable.

**Preview does not become permanent storage just because these secrets are
supplied.** Durable production saving is implemented but is not live-verified or
activated by a publish in this work. Existing preview data is not automatically
copied into the live database.

### Step 2 per-song copy

Cloud connectivity was checked read-only after resource settings were supplied:
D1 and private R2 were reachable, but the selected D1 contained 0 legacy accounts
and 0 songs and did not yet have the normalized foundation tables/view. Confirm
this target before any live schema application. The D1 transport uses the
documented single-query object / batch envelope, never a bare array.

The local preview was copied and verified separately (3 accounts, 7 songs).
Production has **not** been copied. The production Node path uses per-song rows
and refuses to open a legacy account without its verified copy receipt. Tables
and the current-song catalog view must exist before startup.

The explicit, additive `scripts/copy-song-storage.mjs` command applies the new
schema and checks each owner before activating that owner's rows. It never
modifies `studios` content or R2 checkpoints; triggers make verified legacy
bundles read-only. It is not a build/startup hook. Live mode requires explicit
approval and database-ID confirmation as described in
`STEP2_FOUNDATION_REPORT.md`. Confirm older apps using the same live database
before cutover; their legacy writes will be blocked after copy verification.

## Offline verification

From the workspace root:

```sh
pnpm run build
pnpm --filter @workspace/samadhi-love-studio run verify:studio
pnpm --filter @workspace/samadhi-love-studio run test:runtime
pnpm --filter @workspace/samadhi-love-studio run test:elevenlabs
```

All other `test:*` scripts in the Studio package are offline as well. The adapter
tests cover bound SQL, one-request D1 batches, no ambiguous-write retry,
conditional private uploads, temporary-file cleanup, multilingual/camelCase
metadata, ranged streaming reads, missing configuration/schema, and owner-claim
authorization.

After building, this additional **offline** smoke test starts the actual Node
build with in-memory storage fixtures and tests signed-out routes:

```sh
cd artifacts/samadhi-love-studio
node scripts/smoke-node-build.mjs
```

## Opt-in live checks — not part of startup or offline tests

Only the owner should opt in after supplying Secrets. From the Studio directory:

```sh
# Read-only: expected D1 tables + HeadBucket. Does not apply schema changes.
STUDIO_RUN_LIVE_STORAGE_CHECKS=yes node scripts/check-storage-live.mjs --d1

# Uses the configured vault key only in memory with dummy text.
STUDIO_RUN_LIVE_STORAGE_CHECKS=yes node scripts/check-storage-live.mjs --vault

# Separate approval: writes one new random private diagnostic object, reads it,
# and deletes only that object. Never run under a no-deletion instruction.
STUDIO_RUN_LIVE_STORAGE_CHECKS=yes node scripts/check-storage-live.mjs --r2 --allow-temp-cleanup
```

Without explicit opt-in the command prints SKIPPED and sends no live requests.
Do not run the R2 roundtrip while the current no-deletion restriction applies.
No live check calls ElevenLabs or changes account funding/bucket access.

## Storage semantics

D1 writes use bound parameters. Multiple statements use one batch request and
are not retried after an ambiguous result. S3 uploads use conditional headers
where requested, a private temporary file with a 512 MiB cap and cleanup in
`finally`. These temporary files are not a persistent-data fallback.

The metadata envelope preserves custom metadata key casing and multilingual
strings. Object reads stream privately and support byte ranges. S3 clients
disable automatic retries, so a failed generation save cannot silently reissue
an ambiguous media write. Retention must remain disabled until the owner approves
permanent deletion separately.
