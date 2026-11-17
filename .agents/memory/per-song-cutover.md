---
name: Per-song cutover safety
description: Why the legacy save backup is frozen and shared-database clients require confirmation before live cutover.
---

Copying an owner to independent song records intentionally freezes that owner's
legacy studios bundle as a read-only backup. Before a live copy, confirm whether
the separate sibling app still writes to the same D1 database; older save code
will no longer be able to update the legacy bundle.

Local emulated songs are not automatically present in the configured cloud D1.
Do not treat an empty cloud database as proof that local saves were lost, or
silently upload/merge preview accounts into it.

**Why:** the user explicitly requires an unchanged legacy backup, and older
clients could otherwise save into a store the new app no longer reads.

**How to apply:** require confirmation of the intended live database and compatible
writers before cutover. A successful local-emulator comparison is not production
verification. Keep original R2 checkpoints untouched. Retention must not use
frozen backup deletion markers to act on current migrated songs.
