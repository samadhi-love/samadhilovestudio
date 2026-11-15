# Runtime environment inventory — names only

No actual secret values, API keys, passwords, provider key objects or production environment files are supplied. Do not copy values from fixture tests into real service configuration. Set private values through the authorized hosting secret store; `.dev.vars` is local-only and ignored. The role table below is a name inventory, not a statement that every integration is configured or tested.

## Core runtime bindings and identity

| Name | Role / when needed |
| --- | --- |
| `DB` | Cloudflare D1 binding; required for persistent Studio/accounts/community/usage state. Binding, not a text secret. |
| `BUCKET` | Cloudflare R2 binding; required for private media, checkpoints, provider vault and project assets. Binding, not a text secret. |
| `STUDIO_OWNER_EMAIL` | Existing production administrator identity configuration. Keep production identity consistent. Local development has a separate fallback when absent. |
| `STUDIO_CREATOR_BETA` | Controls registered creator workspace access. |
| `STUDIO_ELEVENLABS_VAULT_KEY` | Required to encrypt/decrypt saved per-user ElevenLabs keys; a securely generated 32-byte AES key represented as 64 hexadecimal characters. Preserve the existing value during migration; rotating it without a re-encryption plan breaks decryption. |

## Optional platform credits / managed music production

| Name | Role / when needed |
| --- | --- |
| `STUDIO_CREDITS_ENABLED` | Enablement gate for usage and credit enforcement. |
| `STUDIO_MANAGED_PRODUCTION_APPROVED` | Separate operator approval gate for platform-funded provider production. |
| `STUDIO_MANAGED_ELEVENLABS_KEY` | Optional platform-funded ElevenLabs credential; normal per-user keys remain in the encrypted vault. |
| `STUDIO_MANAGED_MONTHLY_CREDIT_CAP` | Business-wide provider-credit cost cap. |
| `STUDIO_MANAGED_CONCURRENCY_CAP` | Business-wide managed-processing concurrency cap. |

## Optional billing and legal configuration

| Name | Role / when needed |
| --- | --- |
| `STUDIO_BILLING_LAUNCH_APPROVED` | Explicit billing launch gate after service/legal/economic review. |
| `STUDIO_LEGAL_BUSINESS_NAME` | Operator's legal business identity for billing readiness. |
| `STUDIO_BILLING_CONTACT_EMAIL` | Billing support contact configuration. |
| `STUDIO_TERMS_URL` | Published terms URL. |
| `STUDIO_PRIVACY_URL` | Published privacy URL. |
| `STUDIO_REFUND_URL` | Published refund/cancellation policy URL. |
| `STRIPE_SECRET_KEY` | Stripe server credential. |
| `STRIPE_WEBHOOK_SECRET` | Signature verification for the Stripe webhook endpoint. |
| `STRIPE_PRICE_CREATOR` | Recurring Creator plan price identifier. |
| `STRIPE_PRICE_PRO` | Recurring Artist Pro plan price identifier. |
| `STRIPE_PRICE_STUDIO` | Recurring Studio plan price identifier. |
| `STRIPE_PORTAL_CONFIGURATION` | Optional Stripe customer-portal configuration identifier. |
| `STRIPE_AUTOMATIC_TAX` | Optional automatic-tax behavior. |

## Optional outside sources

| Name | Role / when needed |
| --- | --- |
| `JAMENDO_CLIENT_ID` | Authorized catalog integration. |
| `AUDD_API_TOKEN` | Optional recording matching / rights-review assistance. |

## Framework/platform/tooling names

These are not application provider secrets. The normal local run needs no manual secret values for them. Follow the included framework README and execution-profile helpers rather than copying a different machine's settings.

- `NODE_ENV` — framework-selected development/production behavior.
- `CONNECTORS` — optional trusted Sites connector capability, supplied by the platform/request context; not an ElevenLabs key or a substitute for private account authentication.
- `SITES_MANAGED_LINUX_CONTAINER`, `SITES_RUNTIME_ROOT`, `SITES_PROJECT_ROOT`, `SITES_ENV_READY`, `SITES_BUILD_TIMEOUT`, `SITES_NPM_CACHE_SEED`, `SITES_INSTALL_REPORT_PATH` — environment-specific tooling; see `scripts/`.
- `CLOUDFLARE_CF_FETCH_ENABLED`, `WRANGLER_SEND_METRICS` — optional local preview metadata/metrics behavior.
- `PARTY_LONG_TEST` — synthetic long-mix test control; set internally by the relevant test runner.

Cloudflare deployment outside Sites can additionally require that operator's own account/deployment credentials, but those are platform setup, not credentials embedded in this source. No invented music/image provider environment names have been added. The exact app-variable declarations are in `cloudflare-env.d.ts`; authoritative use sites are `app/studio-access.ts`, `app/credits/`, `app/billing/`, and the provider-vault/API modules.
