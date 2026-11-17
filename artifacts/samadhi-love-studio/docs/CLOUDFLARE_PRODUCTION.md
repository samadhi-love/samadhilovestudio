# Production hosting: Replit gateway and Cloudflare backend

## What changed

The Replit web artifact runs a small Node HTTP gateway instead of serving a
nonexistent static `dist/public/index.html`. The gateway forwards app requests
and assets to the existing Cloudflare Worker architecture. The separate Replit
API service still owns `/api/healthz`, `/api/__clerk`, and `/api/replit-auth`.

The app is **not published or production-connected by this change**. No external
resources were created, no database/media migrated, and no provider calls made.
Until the prerequisites below are configured, production startup fails explicitly
instead of silently starting with local storage.

## Required Replit settings

Configure these through managed environment/secret settings, not source files:

| Name | Type | Purpose |
| --- | --- | --- |
| `STUDIO_WORKER_ORIGIN` | Environment | HTTPS origin of the deployed application Worker, without a path. Must differ from the public origin. |
| `STUDIO_PUBLIC_ORIGIN` | Environment | Verified HTTPS public Replit/custom-domain origin. Obtain it from deployment metadata, not a development URL. |
| `STUDIO_WORKER_PROXY_KEY` | Secret | A distinct securely generated transport secret of at least 32 characters, identical on Replit and the Worker. Do not reuse the vault key or an ElevenLabs key. |
| `PORT` | Managed | Allocated by the artifact service; the gateway listens on `0.0.0.0` at this port. |

The existing Clerk secrets stay with the Replit identity service. No global
ElevenLabs fallback is added. The gateway streams uploads/downloads, preserves
cookies and range requests, does not follow upstream redirects, and never retries
generation requests automatically.

## Required Cloudflare backend setup

Use the current installed toolchain; this change does not upgrade Vinext or
Cloudflare packages. Before a production Worker build, configure these nonsecret
identifiers for **existing, explicitly approved** resources:

- `CLOUDFLARE_ACCOUNT_ID`
- `STUDIO_CLOUDFLARE_WORKER_NAME`
- `STUDIO_D1_DATABASE_ID`
- `STUDIO_D1_DATABASE_NAME`
- `STUDIO_R2_BUCKET_NAME`
- `STUDIO_PUBLIC_ORIGIN` — same value as Replit

Then `pnpm --filter @workspace/samadhi-love-studio run build:cloudflare` generates
the Worker output with actual `DB` and `BUCKET` resource bindings. This build fails
if identifiers are absent or the local placeholder database ID is used. It does
not deploy, provision resources, apply migrations, or install secrets.

Configure the matching `STUDIO_WORKER_PROXY_KEY` in the Worker's secure secrets.
Preserve the **exact existing** vault encryption material under its existing
supported `vault` alias or canonical `STUDIO_ELEVENLABS_VAULT_KEY` name. Never
generate a replacement merely because the canonical setting is absent. Existing
saved creator connections can only be decrypted with their original key.

Confirm existing D1 schema/migrations and R2 media before launch. An empty newly
created store is not a migration. Configure owner identity and any other
intentionally enabled settings explicitly. Billing/managed-funding gates stay
unchanged. Worker cron activation and retention policy need separate launch review.

## Origin and authentication boundary

The production Worker rejects missing/incorrect gateway credentials before
running the application. After authentication it restores the configured public
origin so existing same-origin checks and generated links remain correct.
Caller-supplied forwarding headers cannot select the public origin.

The Worker verifies signed-in sessions by requesting the fixed
`/api/replit-auth/session` path on `STUDIO_PUBLIC_ORIGIN` over HTTPS, with redirects
disabled. This path must continue to route to the Replit identity service, **not**
back to the Worker. Only the existing session cookie is used as identity proof.
Development keeps its existing loopback verification path.

The deployed Worker must be reachable from Replit using the configured origin.
Additional Cloudflare Access rules, private Replit deployment gates, DNS, or
network restrictions may require separately approved configuration. Do not disable
those controls silently. Public static assets are not private media; saved private
media must continue to go through existing authenticated application routes.

## Verification and remaining launch steps

- `pnpm --filter @workspace/samadhi-love-studio run test:runtime` checks configuration,
  trusted request reconstruction, streaming HTTP forwarding, cookies/redirects,
  safe failures, and production resource-ID validation with fixtures.
- `test:elevenlabs` also checks development and production session-bridge targets.
- The normal `build` still validates the application using its local binding
  configuration; **do not deploy that local-placeholder build to Cloudflare**.
- `preview:worker` is explicitly local Wrangler development/testing, never the
  Replit production command or durable production storage.

A local production-output smoke check is not a real deployed authentication,
durable-save, media-export, or provider-entitlement test. Before launch: configure
the real resources and matching secret through secure flows; obtain separate
deployment approval; verify the production sign-in and storage path without
unapproved paid generation. No publishing is performed automatically.

### Verification recorded for this change

The application typecheck and production build passed. The gateway checks and
37 provider/authentication/vault regression tests use isolated fixtures.

A separate smoke check executed the **actual built Worker** in an isolated local
Wrangler runtime behind the Node gateway, without a Vite server. The real home
page and its built JavaScript returned 200, private Studio/connection endpoints
returned 401, GET on song creation returned 405, and direct Worker access without
the gateway secret returned 403. The local transport used only a synthetic key
and temporary test storage. This is testing infrastructure, not production
hosting. No live Cloudflare connection or real signed-in round trip was verified.
