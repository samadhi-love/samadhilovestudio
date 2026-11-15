# ElevenLabs onboarding in the existing Studio

## What was verified

- Ran `npx -y @elevenlabs/cli@latest onboard init` in this artifact's directory.
- Followed the printed `onboard connect --env-path .env.local` and `--wait` steps.
- Browser authorization did not complete: the CLI repeatedly reported that sign-in was no longer running, including with connect and wait in the same background shell.
- After secure credential entry, `onboard init` accepted the project environment key.
- Followed `onboard check --answered --env-path .env.local`, downloaded the official music skill to a temporary directory outside the project, and read its music, installation, and API instructions.
- Installed `@elevenlabs/elevenlabs-js` with pnpm in this artifact, not a duplicate app or integration.
- The final official CLI check confirmed `sdk_declared: true`, `sdk_imported: true`, and a working environment key. Its remaining optional step is a credit-consuming speech test; this was intentionally not run.
- No provider generation request, subscription purchase, billing activation, domain change, or publication was performed.

CLI initialization is not credential validation. Credential validation is not proof of music-generation access or a successful paid generation.

## Two separate credential paths

The CLI uses `ELEVENLABS_API_KEY` for developer tooling. Its `.env.local` file is ignored by Git; never print, commit, or copy its contents into logs or chat. Prefer the managed ElevenLabs connection or secure Secrets entry for authorization. If authentication is interrupted, do not keep issuing approval links indefinitely.

The [official quickstart](https://elevenlabs.io/docs/eleven-api/quickstart) explicitly supports manual key creation when the coding agent runs in a cloud sandbox. If the approval page fails, use [API Keys](https://elevenlabs.io/app/api/api-keys) and secure Secrets entry instead. The older `/app/settings/api-keys` link is not the dashboard route linked by the current official instructions. Limit permissions to the features needed and set a spending cap; entering a key does not approve generation.

The running Studio deliberately uses its existing **per-creator encrypted R2 vault**, not a global CLI key. Connecting the CLI does not connect every creator or authorize server-funded production.

The existing provider now dispatches song composition and composition-plan requests through the official SDK. A server-only adapter preserves the existing snake_case plans, lyrics, model, duration, MP3 format, streaming audio, and HTTP-error contract. It requires the already-resolved creator credential and disables SDK retries to avoid duplicate paid requests. Non-music provider routes retain their existing implementation; credit reservations, refunds, identity checks, D1, and R2 were not replaced.

**Current boundary:** developer CLI authentication and SDK wiring have passed. The Studio's personal-account connection remains blocked until the vault secret is configured and the creator connects their own key. The developer environment key is intentionally not a silent fallback for visitor accounts.

To finish the Studio connection:

1. Configure `STUDIO_ELEVENLABS_VAULT_KEY` through secure secret management. It must be a cryptographically generated 32-byte AES key encoded as 64 hexadecimal characters and available as a Cloudflare Worker secret binding. Confirm the existing value before provisioning: replacing a key without re-encrypting saved credentials makes them unreadable.
2. Keep D1 and R2 bindings intact. The Replit preview currently uses local emulation; this is not production storage.
3. Sign in, open `/creator`, and create the free private workspace if prompted.
4. Open **Settings → AI Music Providers → ElevenLabs** and connect the creator's own provider account through the existing private credential form. Never provide keys through chat.
5. The existing **Test Connection** checks subscription access and calls `music/plan`. ElevenLabs' [current API reference](https://elevenlabs.io/docs/api-reference/music/create-composition-plan) documents plan creation as zero-credit and rate-limited. It does not generate audio or verify audio-generation quality. No live plan creation or audio generation was performed during this task.
6. Do not generate music without separate approval of the actual test and expected provider cost.

Do not add a global `ELEVENLABS_API_KEY` fallback to the creator's key resolver, replace the existing provider routes, bypass identity checks, or enable `STUDIO_MANAGED_PRODUCTION_APPROVED` or billing as an onboarding shortcut.

## Sign-in repair and verification

The server-side identity bridge used `fetch` with `redirect: "error"`, which the Cloudflare runtime rejects once a session cookie is present. It now uses `manual`: redirects are not followed, cookies remain on the fixed identity-service target, and non-success responses still fail closed.

Verification:

- `pnpm --filter @workspace/samadhi-love-studio run test:elevenlabs` — SDK transport and identity-bridge regression tests, using only simulated credentials and responses
- `pnpm --filter @workspace/samadhi-love-studio run test:credits` — credit reservations, refunds and account isolation using local fixtures
- `pnpm run typecheck`
- `PORT=24100 BASE_PATH=/ pnpm --filter @workspace/samadhi-love-studio run build`
- One authenticated browser journey verified free creator registration, Studio access after reload, and access to the provider settings panel. The provider panel reported disconnected/unverified and secure storage unavailable.

Remaining blocker for in-app personal connections: secure vault configuration, followed by the creator's own connection in Settings. CLI credential validity is verified. Live Music entitlement, provider charges for a proposed generation, and actual music generation remain unverified; paid testing and server-funded production still require separate approval.
