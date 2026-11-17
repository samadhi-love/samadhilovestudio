# SAMADHI LOVE Studio

## Stage 3 — beginner creation tools

Create now has free, on-device **Help me describe it**, editable lyric-part chips, and optional “Make 2 versions” with clear double-cost confirmation. My Songs adds **Make it longer**, **Redo a part**, and **Make another like this**; originals stay intact. **Make a Short** prepares a vertical 30-second clip from the chorus when marked, otherwise from the strongest available audio window, with a start slider and the last-used look. Creators can record up to 30 seconds of a melody privately as a song reference; it is never sent to ElevenLabs because this music engine cannot follow humming yet. The first-visit guide now explains **Describe or hum → Listen and keep your favourite → Make a video**.

Only offline/DOM verification was used for this stage. All **41/41 Studio verification groups passed**, including the new Create, My Songs, short-video slider and non-destructive section-edit checks. The full-workspace typecheck and production build also passed, including the design-preview sandbox. No paid provider calls, publishing, billing or data deletion occurred. Real microphone hardware, signed-in browser use and live production saving were not tested.

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
