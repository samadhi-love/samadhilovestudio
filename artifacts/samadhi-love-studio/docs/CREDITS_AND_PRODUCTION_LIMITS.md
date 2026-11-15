# Credits, usage and production limits

Extends existing SAMADHI LOVE Studio appgprj_6af2936d32488191a41ff8ccab32ed79. Based on version 70 / source e6486a4; preserves later Meditative Vibes, download, private-library and genre updates.

## Implemented

- `/credits` account screen plus Studio balance badge and navigation; protected by existing Sites identity and creator ownership.
- Server-owned D1 credit accounts, immutable activity ledger, and production-job records. Project saves cannot alter credits.
- Three proposed plan configurations: Creator $15 / 300 credits / 1 concurrent job / 20 daily attempts; Pro $29 / 800 / 2 / 60; Studio $49 / 1500 / 3 / 100. These are not live commercial offers.
- Account-scoped beta grants, explicitly authorized by the owner. Each replaces the remaining allowance for 30 days, is recorded with an idempotency key and actor audit, and neither collects money nor renews automatically. Allowance replacement is blocked while jobs are held. No grants are seeded during deployment.
- Server-side preflight estimates, explicit credit acceptance, atomic reservations, request-id deduplication, finalization and idempotent refunds. Concurrent requests cannot overdraw balances.
- Integrated existing song generation, lyric planning, caption synchronization/audit and stem separation. Voice design remains on the owner's personal provider connection.
- Personal provider funding remains available and uses no SAMADHI credits; provider billing still applies. Existing creator attempt limits remain unchanged for those connections. Metered routes add a simultaneous-job limit and usage history.
- Studio-funded jobs enforce plan daily attempts and a global monthly credit-cost cap (default 10,000 credit units). The global cap counts attempted allocations, including refunded requests, conservatively limiting abuse and upstream failure costs. It is not an actual invoice or a dollar-cost meter.
- Inactive/expired/insufficient allowances cannot start Studio-funded work. Original songs, editing and downloads remain accessible.
- Owner recovery of interrupted held jobs older than 15 minutes, with explicit confirmation that provider processing has stopped. Other accounts cannot access or settle those jobs.

## Credit prices and duration safeguards

Draft retail credit prices: music 18/minute; lyric planning 2/request; captions 1/minute; stem separation 12/minute. Estimates round up to whole credits. These are not provider-issued credits and must be approved against the actual provider contract before activation. A four-minute music request reserves 72 credits. Sync and a requested recognition audit are separate processing jobs.

Song requests retain the existing 3–360-second range; the provider's actual maximum may be lower. Caption/stem charges do not trust client duration. For Studio funding they currently accept only the current recording from a completed Studio generation with its protected server-created duration and matching generation recording ID. Uploaded/historical/replaced/analysis audio require a personal provider connection until duration verification is implemented for those sources. Do not bypass this restriction using client-provided duration values.

Browser-based local composition, meditative synthesis, manual editing, local lyric-video rendering, local audio conversion and downloads consume no SAMADHI credits. They still require adequate device resources and retain existing technical limits. Voice samples, projects and originals remain private as before.

## Runtime configuration

- `STUDIO_CREDITS_ENABLED=1`: turns on server production metering. With it disabled, existing personal-provider routes remain available and cannot select the business key via a forged header.
- `STUDIO_MANAGED_PRODUCTION_APPROVED=1`: operator confirmation that the provider permits the embedded commercial use and the credit schedule has been approved. Never enable merely to make a demo work.
- `STUDIO_MANAGED_ELEVENLABS_KEY`: server-side secret belonging to the approved business provider account. Never store it in source, browser bundles, client settings or a creator's credential record.
- `STUDIO_MANAGED_CONCURRENCY_CAP`: optional total simultaneous Studio-funded job ceiling across all accounts. Default 2; match the approved provider concurrency. `0` pauses new Studio-funded production.
- `STUDIO_MANAGED_MONTHLY_CREDIT_CAP`: optional nonnegative whole credit-unit ceiling for the UTC month. `0` stops new Studio-funded attempts. Default 10000.

Managed funding requires the enabled flag, approval flag, business secret, an active beta allowance, sufficient balance and explicit charge acceptance. Personal keys are never silently replaced, copied to another account or used to fund someone else's generation. Switching funding is explicit and account scoped.

Deployment enables metering only. It does not activate business processing, billing, proposed subscriptions, automatic purchases or provider usage. Existing owner/vault/creator configuration is preserved.

## Subscription integration added after this credit foundation

The subsequent membership update implements Stripe hosted checkout/portal, signed webhook handling and verified monthly allowance renewal. See [MEMBERSHIP_AND_SUBSCRIPTIONS.md](MEMBERSHIP_AND_SUBSCRIPTIONS.md) for current configuration, tests and remaining launch requirements. Payments still fail closed until the required business policies, provider authorization, credentials, matching prices and launch flag are configured. Beta grants remain distinct from paid subscriptions. Annual plans, purchased top-ups, automated monetary refunds and automated plan changes are not implemented.

## Limits and operational behavior

Audio uploads retain their existing 96 MB per-file maximum; Studio metadata retains its 1.5 MB limit. Account-wide storage quotas are not implemented or advertised. Preview/video rendering remains browser-based where it was before; no durable server rendering queue is introduced.

Jobs execute within the existing HTTP request. The app does not guarantee completion after closing a tab, device or browser. Ordinary error responses restore credits automatically. If a Worker terminates before settlement, the reservation stays visible for owner review instead of silently charging again or issuing an unsafe automatic refund. Upstream provider costs can still occur for refunded/failed requests; they are an operating expense. A successful streamed stem response is finalized when the validated provider response is ready, not after a device completes downloading it; network/download issues may need support review.

There are no account or source-data migrations/backfills. Migration 0005 adds only three tables and their indexes; prior migrations are immutable. Sites applies the migration before the new Worker is uploaded. Existing libraries, provider settings, ownership and features are preserved.

## Validation

Actual tracked SQL migrations in isolated SQLite with separate creator identities exercise ownership, explicit confirmation, request deduplication, atomic concurrent spending, refunds, period expiry, global/daily/concurrent limits, provider-key routing, duration safeguards, grant replay protection, ledger reconciliation and recovery. Simulated DOM tests exercise cost confirmation/cancellation and the inactive plan/owner-control presentation. Existing Studio, audio download, meditative and catalog regression tests are run separately.

No real payment, provider generation, production credit grant or user library mutation is used for testing. Browser automation infrastructure is unavailable in this environment; real-browser/device behavior and live provider processing remain unverified. Financial cost assumptions are not measured profit margins.
