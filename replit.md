# SAMADHI LOVE Studio

Continue the user's existing music-creation app, with beginner-friendly songs and both easy and advanced visual/lyric videos. Do not build a replacement or discard its features. The user owns `samadhilove.com`; domain cutover and publishing require separate confirmation.

## Run & Operate

- Managed workflow `artifacts/samadhi-love-studio: web` runs the imported studio.
- Managed workflow `artifacts/api-server: API Server` runs the authentication bridge and Clerk proxy.
- `pnpm --filter @workspace/samadhi-love-studio run typecheck` — check the imported app
- `pnpm --filter @workspace/api-server run typecheck` — check the identity service
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/samadhi-love-studio run test:elevenlabs` — offline SDK transport and sign-in regressions
- `pnpm --filter @workspace/samadhi-love-studio run test:runtime` — offline production gateway, Worker boundary, and binding checks
- `pnpm --filter @workspace/samadhi-love-studio run start` — production gateway; requires the configured Cloudflare Worker origin, public origin, and transport secret
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
- Production uses a Replit Node gateway in front of the Cloudflare Worker, not static hosting or Wrangler local development. Actual Worker connection settings, durable resource bindings, secrets, and domain configuration still need to be completed before launch; see `artifacts/samadhi-love-studio/docs/CLOUDFLARE_PRODUCTION.md`. The normal build uses local placeholder bindings for validation; only `build:cloudflare` requires actual resource identifiers for a deployable Worker build.
- The source archive included no account records, saved provider keys, or original hosted private media. Do not claim those were transferred.
- ElevenLabs generation and billing must not be claimed connected based only on source code or an account-status check. No live paid generation has been verified.
- Server-funded production and paid billing remain disabled pending provider setup and operator approval.
- The official ElevenLabs SDK is wired into existing music requests with automatic retries disabled. CLI authentication uses the project secret; creator generation still requires that creator's encrypted vault key. Never silently fall back to the global CLI key for visitors.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
