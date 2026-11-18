---
name: Accepted verification exceptions
description: Owner decisions about short upload fixtures and deferred playback optimization.
---

Uploads shorter than 12 bytes passing validation are intentional and accepted.
Do not keep reporting that behavior as an outstanding fix.

**Why:** The owner explicitly accepted it and stated that existing tests use
these tiny payloads.

**How to apply:** Preserve this exception during upload-validation reviews
unless the owner changes the requirement. This is an accepted behavior, not a
general claim that all short payloads are harmless.

The owner accepts per-song storage mode loading the whole library for playback
for now. The owner says this mode is switched off; address that optimization
when per-song storage is turned on, not as an unapproved change now.

**Why:** The owner explicitly deferred this known limitation until activation.

**How to apply:** Do not treat it as a current blocker or activate per-song
storage to resolve it. Reconfirm the storage mode before any future cutover.
