# Member login and monthly subscriptions

Existing project: appgprj_6af2936d32488191a41ff8ccab32ed79. Built on version 71 / 6806b02. The owner confirmed a U.S. business and USD billing. No second application or identity system is introduced.

## Product decision and source research

Reviewed official sources on November 12, 2026 (America/New_York):

- Suno: https://suno.com/pricing — Free, Pro and Premier, distinct monthly allowances, monthly/yearly display, non-rollover subscription credits. The retrieved page shows $10/$30 monthly reference prices and $8/$24 equivalents billed annually. Its credit and download units are specific to Suno.
- Udio: https://help.udio.com/en/articles/10739134-credits-and-credit-limits and https://help.udio.com/en/articles/10739199-changing-or-canceling-your-subscription — free and Standard/Pro allowances, monthly resets and subscription changes. The current credit help lists 2400/6000 monthly credits; older official pages contain different numbers. The pricing application itself did not expose readable price text, so no current price comparison is inferred from it.
- SOUNDRAW: https://soundraw.io/pricing — separate creator/artist plans, different download and stem entitlements, enterprise API access. Retrieved prices were localized in JPY; they are not presented as USD prices.
- BandLab: https://help.bandlab.com/hc/en-us/articles/20758981227033-BandLab-Membership-FAQ — free creative tools plus membership services; official FAQ lists Pro at $14.99 monthly and annual offers. It also marks some Max availability as forthcoming. No unimplemented BandLab feature is promised by SAMADHI.

Recommended SAMADHI model: keep the existing creative workspace accessible; charge for explicit processing allowances rather than removing working tools. Explorer $0 / no included Studio-funded generation; Creator $15 / 300 credits; Artist Pro $29 / 800; Studio $49 / 1500. Monthly USD only. No annual commitment, free card trial, unlimited AI promise or purchased top-up is offered. Names/credit quantities are our own and not directly comparable to another provider's credits. The prior cost-based allowance assumptions remain provisional until the authorized provider quote is confirmed.

## Public and private routes

- `/login`: actual hosted ChatGPT sign-in, clear member entrance and links to registration/plans. No fake email/password form, separate password store, Google or Apple button.
- `/members`: registration for signed-in new adults; existing members get their private account, current allowance, saved plan choice, hosted billing management and verified-payment refresh.
- `/plans`: public four-plan comparison and useful credit/duration examples. Unconfigured paid plans are clearly proposed and only save a preference.
- `/membership-notice`: factual onboarding/privacy/music-rights information and versioned acknowledgment. It does not pretend to replace complete operator-specific legal policies.
- `/api/membership`: authenticated account-only status, plan preference and acknowledgment. Plan selection is never payment or a credit grant.
- `/api/billing`: authenticated, same-origin and exact-workspace-checked checkout/portal/refresh actions.
- `/api/billing/webhook`: no browser session requirement; raw-body HMAC verification with a five-minute timestamp tolerance and live/test mode checks before any provider lookup or entitlement processing.

Studio, Community, creator entrance, and Credits & Usage link into the member flow. Existing owner and creator authorization remain intact. New registration requires adult self-declaration and the current notice version; this is not verified age/identity. Existing creator identities and libraries are not rewritten or forced through new registration.

## Genuine payment integration, closed until configured

Stripe REST integration uses pinned API version `2024-06-20`, hosted Checkout and the billing portal. No card numbers or payment secrets are sent to the browser. The owner must configure Stripe's subscription/customer-portal settings, public terms, tax registrations and the webhook endpoint. No Stripe account, live customer, Price, subscription or charge is created by deployment or automated tests.

Required runtime configuration (values belong in Sites environment settings, never source or chat):

- Existing production configuration: `STUDIO_CREDITS_ENABLED=1`, `STUDIO_MANAGED_PRODUCTION_APPROVED=1`, `STUDIO_MANAGED_ELEVENLABS_KEY`. Written provider permission must cover this embedded commercial use and the offered end-user rights.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- `STRIPE_PRICE_CREATOR`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_STUDIO`: active monthly USD prices with interval count 1 and unit amounts 1500, 2900, 4900 cents respectively. The server verifies the advertised amount before creating Checkout.
- `STUDIO_LEGAL_BUSINESS_NAME`, `STUDIO_BILLING_CONTACT_EMAIL`, `STUDIO_TERMS_URL`, `STUDIO_PRIVACY_URL`, `STUDIO_REFUND_URL`: verified operator details and actual published HTTPS policies.
- `STUDIO_BILLING_LAUNCH_APPROVED=1`: set only after the business, legal policies, provider permission, pricing, taxes and payment tests have been reviewed.
- Optional `STRIPE_AUTOMATIC_TAX=1`: requires configured Stripe Tax and relevant registrations. Address collection is required. This flag does not determine the business's legal tax obligations.
- Optional `STRIPE_PORTAL_CONFIGURATION`: dedicated hosted portal configuration. Start with cancellation at period end, payment methods and invoices. Disable in-period price/quantity changes and prorated upgrades in this first release; new plan purchases are prevented while a nonterminated subscription exists. Plan-switch automation is not implemented.

Pausing new checkout in the app does not cancel existing Stripe renewals; manage or cancel those at Stripe.

Public paid sales require live keys and all readiness conditions. Test-key checkout is restricted to the owner, and the owner dashboard labels it sandbox mode. Use a dedicated sandbox account/customer set; do not switch existing sandbox customer IDs into a live environment without an explicit billing-data reconciliation. Do not enable a real paid AI key merely to test billing.

Checkout collects recurring-billing confirmation in the app and Stripe's required Terms consent. Set Stripe's own public policy URLs to the reviewed operator policies. Returning to a success URL, or changing its query, grants nothing. Customer mappings are account-owned. A checkout lock, durable session reference and customer idempotency key limit duplicate purchases; active/incomplete subscriptions route users to management rather than another purchase. Checkout sessions for another selected plan are expired before a replacement is created.

## Verified monthly entitlements

Configure webhook events: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `charge.dispute.created`.

Provider objects are fetched again using the pinned API and checked against the saved customer, subscription owner metadata, configured price, quantity, currency and billing period. Only a verified paid subscription-create/cycle invoice can replace a monthly allowance. Durable invoice receipts and atomic wallet/ledger updates prevent replay or concurrent double grants. Late older periods and obsolete subscription cancellations cannot overwrite a newer entitlement.

Successful renewal replaces the included credits for the paid period, without rollover. Running reservations retain their original period reference, so refunding an old job cannot inflate a new period. Paid entitlements work with the existing production credit gate. Owners cannot replace an active paid allowance with a beta grant.

Scheduled cancellation preserves the current paid period. Immediate provider termination pauses funded production but never deletes songs or blocks the account's private library. Failed payment records status and does not grant a fresh period. A verified full charge refund or dispute pauses funded use and flags owner review; automatic refund/dispute resolution is not implemented. The owner dashboard can clear a reviewed restriction without restoring credits or money; the original Stripe subscription must be handled at Stripe and a new verified paid period is required to resume funded use. Stripe manages actual money refunds; processing-credit refunds are separate.

## Persistence and preservation

Migration 0006 adds only `billing_accounts`, `billing_invoices` and their indexes. Previous migrations are unchanged. It does not backfill accounts, republish songs, alter ownership or migrate private media. Existing ElevenLabs vault keys, credit jobs, meditative features, exports, projects and integrations are retained.

## Verified and not verified

Automated tests use actual tracked migrations with an isolated SQLite database, real registration/credit/billing handlers, separate identities, HMAC signatures and mocked Stripe HTTP responses. They cover signup acknowledgments and replay, private member status, account switching, price mismatch, duplicate checkout, raw-body tampering, signature expiry, verified paid access, duplicate/concurrent invoice events, period renewal, cancellation, failed payments, late events, full refund review, sandbox isolation, client-return nonactivation and absence of payment secrets in responses. UI tests cover registration gating/retry, plan choices and the inactive checkout state.

No real payment or provider generation is used. Live Stripe/Tax/portal behavior, event configuration, customer emails, actual provider contracts, complete legal policies, real browser sessions and physical mobile devices remain unverified. The required Sites browser/workflow helpers are absent from this environment; no improvised browser session is claimed. Native Sites publication verifies deployment; it does not prove a live purchase.
