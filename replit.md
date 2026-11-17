# SAMADHI LOVE Studio

## Security and build blockers — latest verification

The four critical findings from the November 15 publish are cleared in a fresh dependency scan. The active pnpm installation already used patched Next.js 16.4.6 and React Server Components 19.3.1; an obsolete imported npm lockfile still described the vulnerable versions. That conflicting lockfile was removed, the compatibility installer now uses the frozen workspace pnpm lock, and builds now reject conflicting package-manager lockfiles. Unnecessary credential-related diagnostic logging was also removed. Fresh static-code and privacy scans reported no findings. **Other dependency findings remain: 24 high, 28 moderate and 8 low; this is not a clean bill of health for public launch.**

The preview sandbox now uses Vite's actual build command to select safe build-only defaults (`PORT=5173`, `BASE_PATH=/`), while development still requires managed settings and rejects invalid ports. Full-workspace typecheck/build passed with both variables unset. All 22 offline Studio suites, all 40 Studio verification groups, six new regression tests, and the built-Node-server smoke check passed. The restarted phone-sized signed-out preview rendered correctly. No paid generation or signed-in end-to-end browser test was performed, and nothing was published.

Details and the four advisory IDs: `artifacts/samadhi-love-studio/docs/SECURITY_BUILD_VERIFICATION.md`.

## Stage 1 — owner-first readiness

Implemented: a real Node production build with direct existing Cloudflare D1/private R2 storage, fail-closed startup checks, a one-time verified-email **Claim owner** screen, and Settings → **Connect ElevenLabs** with free-only connection testing. Preview still uses isolated local emulation; no production storage connection, publish, domain/DNS change, paid provider call, billing activation or user-data deletion was performed.

Fixed: lyrics-only creation no longer sends an empty music prompt; obsolete test assumptions were corrected; recording/stem controls have distinct keys; saved videos accept codec-qualified container types; legacy header/cookie identity middleware was removed; the design-preview sandbox can build without runtime-only PORT/BASE_PATH values and its Vite types now match.

Verification: all 22 offline command suites passed, including all 40 Studio verification groups. Full-workspace typechecking and build passed. An additional actual-built-Node-server smoke check passed with in-memory fixtures. New owner-claim and free-only connection tests passed. These results do not certify live Cloudflare saves, provider feature availability or real-browser video playback.

Pending this run: live storage checks were not run because the named Cloudflare credentials are missing. The signed-in browser journey was skipped after the earlier testing-credit block; no additional browser-testing run was purchased or attempted. A signed-out phone-sized preview screenshot rendered correctly, but that is not an end-to-end test.

**Owner checklist:**
1. In Replit **Secrets**, add `STUDIO_CLOUDFLARE_D1_API_TOKEN` (Cloudflare profile → API Tokens → Account/D1/Edit, account-scoped).
2. Add `STUDIO_R2_ACCESS_KEY_ID` and `STUDIO_R2_SECRET_ACCESS_KEY` separately (Cloudflare R2 → Manage R2 API Tokens → bucket-scoped Object Read & Write S3 pair for the existing private bucket). Do not use the API Token value for either S3 field.
3. Preserve the existing vault key. `STUDIO_ELEVENLABS_VAULT_KEY` must be the same stable 64-hex-character encryption key; the existing `vault` secret remains supported. **Do not generate a replacement or overwrite it.**
4. Set `STUDIO_OWNER_EMAIL` in Secrets to your own verified Studio sign-in email. Keep managed Clerk unchanged.
5. Sign in, open `/owner`, and press **Claim owner** once.
6. Open Settings → **Connect ElevenLabs**, paste your own key from ElevenLabs → Developers → API Keys, then press **Test Connection**. It only reads account information; feature permissions absent from that response show **Not verified**, never a false success.
7. Complete live storage verification and the signed-in song-to-video/download journey before calling this fully personal-use verified. Browser testing is pending when testing credits are unavailable. No paid processing is approved.

Full setup, safety boundaries and opt-in live commands: `artifacts/samadhi-love-studio/docs/REPLIT_PRODUCTION.md`.

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
