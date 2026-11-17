---
name: Step 2 feature freeze
description: Restrict work to the foundation fixes until the owner approves completion.
---
Finish Step 2 (secrets, per-song saving with verified copy, shared backend helpers, durable jobs) before any new features or UI changes. Keep Stage 3 intact. Flag feature requests to the user rather than implementing them until the user approves Step 2.

After the approved fresh-start Step 2 completion, the owner approved Step 3
self-healing Part A only (safe retries, health/recovery, error boundaries,
private-safe logging and input checks). The feature freeze remains: no new
product features or visual redesign, no deleting anything, no publishing and
no paid provider calls. Stop after the approved Part A and report.

The owner subsequently approved Part B only: durable processing, safe explicit
retries, video recovery, account autosave and rough lyric timing. Keep the
feature freeze and stop after reporting Part B. A provider charge cannot be
inferred from missing output, so built-in retry is limited to failures confirmed
before any provider request, including paid composition planning.

**Why:** The user explicitly made Step 2 the top priority after feature work proceeded while foundation work was unfinished.

**How to apply:** Work in small sub-steps with existing tests after each; stop after 2D and report exact results and unfinished work. Do not publish, change domains, enable billing, or delete user data or files. Preserve the old studios bundle and R2 checkpoints unchanged during the migration.
