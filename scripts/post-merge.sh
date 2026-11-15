#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

pnpm install --frozen-lockfile

# The imported Studio uses its existing D1 schema, not the template Postgres
# package. Initialize only the local preview store; never touch remote data.
pnpm --filter @workspace/samadhi-love-studio exec wrangler d1 migrations apply DB \
  --local --config replit-local.wrangler.json
