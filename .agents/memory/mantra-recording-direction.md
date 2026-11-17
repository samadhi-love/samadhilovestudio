---
name: Mantra recording scope
description: Product decisions for local voice repetition and echo
---
Keep mantra repetition and echo inside the existing recording experience, using the creator's captured voice rather than paid AI singer generation.

**Why:** The user requested live microphone call-and-response and fading repeats, without another app or main navigation tab.

**How to apply:** Keep the original phrase separate from the mixed performance; require explicit microphone action and private saving; keep live monitoring off by default. Automatic phrase detection and simulated choir voices were deliberately deferred from the initial scope.

Keep upload retry identity distinct from the stored audio-version identity.

**Why:** Concurrent uploads of the same receipt need separate staging objects so failed-save cleanup cannot remove another upload's successful recording.

**How to apply:** Preserve stable per-clip retry receipts and unique audio objects. Fix duplicate version displays at the view/model boundary, not by removing upload concurrency protections.
