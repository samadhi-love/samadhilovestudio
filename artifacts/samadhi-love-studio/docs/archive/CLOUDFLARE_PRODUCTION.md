# Existing Cloudflare D1 and private R2 storage

The old Node-to-Worker gateway was replaced with direct server-only D1 HTTP and
R2 S3 adapters in the Replit Node Vinext build.

Follow [REPLIT_PRODUCTION.md](./REPLIT_PRODUCTION.md) for the current architecture,
exact owner Secrets checklist, safe startup, owner claiming, offline tests and
explicitly opt-in live checks.

Do not use old Worker-origin/proxy-key instructions or deploy a Worker for this
app. Preview remains locally emulated. No remote migrations, publication, DNS,
billing changes or permanent cleanup are authorized by this setup.
