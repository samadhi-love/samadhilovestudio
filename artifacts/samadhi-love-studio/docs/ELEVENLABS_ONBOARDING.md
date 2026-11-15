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

**Current boundary:** developer CLI authentication and SDK wiring have passed. A managed vault secret has now been securely saved under the name `vault` and validated as a 64-character hexadecimal AES key without displaying it. The local Worker accepts that setup alias when the canonical binding is absent. The actual creator completed sign-in and a successful connection save; the creator also confirmed that Test Connection reported “Music connection verified” and Reconnect returned to “Connected again.” The developer environment key is intentionally not a silent fallback for visitor accounts.

Connection procedure:

1. Configure `STUDIO_ELEVENLABS_VAULT_KEY` through secure secret management. It must be a cryptographically generated 32-byte AES key encoded as 64 hexadecimal characters and available as a Cloudflare Worker secret binding. Confirm the existing value before provisioning: replacing a key without re-encrypting saved credentials makes them unreadable.
2. Keep D1 and R2 bindings intact. The Replit preview currently uses local emulation; this is not production storage.
3. Sign in, open `/creator`, and create the free private workspace if prompted.
4. Open **Settings → AI Music Providers → ElevenLabs** and connect the creator's own provider account through the existing private credential form. Never provide keys through chat.
5. The existing **Test Connection** checks subscription access and calls `music/plan`. ElevenLabs' [current API reference](https://elevenlabs.io/docs/api-reference/music/create-composition-plan) documents plan creation as zero-credit and rate-limited. The creator's connection check passed. This is not audio generation or proof of audio-generation quality.
6. Do not generate music without separate approval of the actual test and expected provider cost.

Do not add a global `ELEVENLABS_API_KEY` fallback to the creator's key resolver, replace the existing provider routes, bypass identity checks, or enable `STUDIO_MANAGED_PRODUCTION_APPROVED` or billing as an onboarding shortcut.

## First-time vault setup without terminal commands

Open `/vault-key-setup.html` in the running Studio, preferably in a separate browser tab. This helper is for the app administrator's **first** vault secret, not for connecting an individual creator's ElevenLabs account.

- Stop if `STUDIO_ELEVENLABS_VAULT_KEY` already exists in managed Secrets, local configuration, or Cloudflare. Reuse the original encryption key; do not generate a replacement without re-encrypting existing credentials.
- Confirm first-time setup, then use **Copy setting name** and paste into the **Key** field in Replit's **Tools → Secrets → New Secret**.
- Return to the helper, use **Generate and copy vault key**, and paste into the **Value** field. Choose **Add Secret**. Keep a backup in a password manager, never in chat.
- The helper generates 32 bytes using browser cryptographic randomness and encodes them as 64 hexadecimal characters. It never displays the secret, submits it, stores it in browser storage, or writes it into source/build files. Its content security policy blocks network connections.
- Repeated copy attempts in the same tab reuse the same generated key. Keep the tab open until saved. Reloading or closing it loses that in-memory key.
- Clipboard access depends on browser permissions. If blocked in the preview frame, open the helper's separate-tab link before generating/saving a key. The helper reports copying failures rather than claiming success.

This helper **does not provision or bind the secret automatically**. Creating or copying an encryption key is not proof that the vault is configured.

### Managed secret binding verification

The development configuration now passes only declared vault process-secret names into Wrangler's secret bindings, retaining previously loaded local bindings. Secret values are never put into Vite `define`, Worker `vars`, or generated configuration. The canonical `STUDIO_ELEVENLABS_VAULT_KEY` takes precedence whenever present, including when invalid, so a malformed existing canonical key never silently switches to the `vault` alias.

Do not generate a new canonical key simply to rename `vault`: once credentials use the alias, changing the effective key without re-encryption makes them unreadable. Preserve the existing secret bytes. Standard Wrangler `.dev.vars` precedence still applies; a local `.dev.vars` file must contain the intended vault binding or be reconciled securely before it can use a process secret.

Builds use an empty local-secret allowlist because the Cloudflare Vite plugin otherwise can serialize local credentials into `dist/.dev.vars`. This does not provision production secrets; production remains unchanged and was not deployed.

Verified with the securely saved vault secret:

- Wrangler resolved a valid `secret_text` vault binding without injecting `ELEVENLABS_API_KEY`.
- The actual vault module ran inside an isolated Cloudflare Worker runtime using an ephemeral, isolated R2 bucket. Encrypted fixture save/read/delete and creator isolation passed. No real creator credentials were added, read, replaced, or deleted.
- The Studio build passed; scanning all 355 build files found no configured secret values and no `.dev.vars` output.
- `test:elevenlabs` passed 32 fixture checks for SDK transport, identity verification, vault safety, and the setup helper. `test:credits` passed 44 checks for existing credit behavior. Studio typechecking passed.
- Anonymous access to provider settings returned HTTP 401; the creator page still requires sign-in.

### Creator-assisted live verification

- The creator signed in and registered their private creator workspace. Runtime records showed successful identity verification, creator registration, and authenticated provider settings access.
- The creator entered their own ElevenLabs API key in Settings → AI Music Providers → ElevenLabs, not in chat. The running app logged a successful `PUT /api/studio/elevenlabs` (HTTP 200) with both account and Music checks marked verified. The route saves only after the account check and encrypted R2 write succeed.
- The creator confirmed **Music connection verified** after clicking **Test Connection**. This reads and decrypts the saved key, checks it, and updates the connection record.
- The creator confirmed **Connected again** after **Reconnect → Verify and replace key**, using the same provider key. These last two UI outcomes were confirmed by the creator, not by an automated browser.
- No key values were exposed in chat or logs. No audio-generation request, paid billing activation, owner-role assignment, server-funded production approval, or deployment was performed. Plan-based Music access is verified; actual audio generation remains intentionally untested.

Offline helper checks (deterministic fixtures only):

```sh
node --test artifacts/samadhi-love-studio/tests/vault-key-setup.test.mjs
```

## Sign-in repair and verification

The server-side identity bridge used `fetch` with `redirect: "error"`, which the Cloudflare runtime rejects once a session cookie is present. It now uses `manual`: redirects are not followed, cookies remain on the fixed identity-service target, and non-success responses still fail closed.

Verification:

- `pnpm --filter @workspace/samadhi-love-studio run test:elevenlabs` — SDK transport and identity-bridge regression tests, using only simulated credentials and responses
- `pnpm --filter @workspace/samadhi-love-studio run test:credits` — credit reservations, refunds and account isolation using local fixtures
- `pnpm run typecheck`
- `PORT=24100 BASE_PATH=/ pnpm --filter @workspace/samadhi-love-studio run build`
- One authenticated browser journey verified free creator registration, Studio access after reload, and access to the provider settings panel. The provider panel reported disconnected/unverified and secure storage unavailable.

The previous secure-vault blocker is resolved in the local preview. The actual creator's personal connection save and user-assisted saved-key test/reconnect are verified as described above. A passed Music plan check does not establish compose-endpoint success, audio quality, or costs for a proposed generation. Paid testing and server-funded production still require separate approval.
