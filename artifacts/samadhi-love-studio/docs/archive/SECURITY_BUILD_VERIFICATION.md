# Security and build blocker verification

## Four critical findings from the November 15 publish

The failed publish log identified these four dependency advisories:

| Advisory | Vulnerability | Flagged version | Minimum fixed version | Current installed version |
| --- | --- | --- | --- | --- |
| GHSA-2464-fhr4-w9xw | Next.js image optimization: unauthenticated remote code execution involving SVG | next 16.3.4 | 16.4.1 | 16.4.6 |
| GHSA-673q-mjm6-r5xr | Next.js `use cache`: unauthenticated remote code execution involving typed-array results | next 16.3.4 | 16.4.1 | 16.4.6 |
| GHSA-vcvr-r3jv-pc5j | Next.js `next/og` ImageResponse remote code execution | next 16.3.4 | 16.3.6 | 16.4.6 |
| GHSA-xqc2-xf4c-x3h3 | React Server Components unauthenticated remote code execution | react-server-dom-webpack 19.2.6 | 19.2.9 | 19.3.1 |

The active pnpm manifest, lockfile and installed modules already used the patched versions. The fresh dependency scanner located **all four** findings exclusively in the obsolete `artifacts/samadhi-love-studio/package-lock.json`, retained from the imported standalone npm project. It was not the dependency tree used by workspace builds.

Changes:

- Removed that obsolete generated dependency lockfile; retained the authoritative root `pnpm-lock.yaml`. No findings were suppressed or excluded from scanning.
- Updated the `install:ci` compatibility entry point to run `pnpm install --frozen-lockfile` at the workspace root instead of requiring the obsolete npm lock.
- Added a workspace build guard against conflicting npm/Yarn lockfiles at package roots, including nested integration packages.
- Removed unused credential-related console diagnostics flagged by the privacy scanner. The flagged output contained configuration/status diagnostics, not a confirmed leak of secret values.

Fresh scanner results:

- Dependency audit: **0 critical**, 24 high, 28 moderate, 8 low.
- Static-code scan: **0 findings**, complete.
- Privacy/dataflow scan: **0 findings**.

This clears the four critical findings that blocked the prior publish. It does **not** mean every dependency vulnerability is resolved. No publish was attempted, so there is no new publish result to claim.

## No-PORT workspace build

The design-preview sandbox configuration now uses Vite's `command === "build"` rather than searching process arguments. Static builds default to port 5173 and base path `/` when variables are absent or empty. Explicit valid settings are retained. Development still requires its managed preview settings, and configured ports must be integers from 1 to 65535. Development-only cartography is not loaded during static builds.

## Verification performed

- `env -u PORT -u BASE_PATH pnpm run build` — passed, including the full workspace typecheck and all package builds.
- Every Studio `test:*` command plus `verify:studio` — **22/22 commands passed**, including all **40 Studio verification groups**. These include Clerk/authentication, owner setup, ElevenLabs transport, song creation, lyrics/video logic, storage/runtime, credits, membership, library, audio editing, audiovisual timing, radio and integrity checks.
- `pnpm run test:dependency-locks` — passed.
- `pnpm --filter @workspace/mockup-sandbox run test:build-config` — five tests passed: programmatic no-env builds, explicit settings, empty settings, development requirements and invalid ports.
- `pnpm --filter @workspace/samadhi-love-studio exec node scripts/smoke-node-build.mjs` — passed against the actual Node build using in-memory fixtures, with no external calls. Creator and Owner pages load, unsigned private API requests are rejected, and forged owner claims are rejected.
- Restarted the managed Studio preview and examined logs and a phone-sized signed-out Creator-page screenshot; no blocking browser errors were observed.

No paid provider calls, publishing, domain/DNS changes, billing activation, production storage changes or user-data deletion occurred. Offline tests use disposable fixtures. Live Cloudflare verification, actual singing/alignment quality and the signed-in song-to-video/download browser journey remain separate pending checks.
