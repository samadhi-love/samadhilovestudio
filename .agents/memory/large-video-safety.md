---
name: Large video export safety
description: Why full-length exports must remain disk-backed, and why native playback cannot be inferred from offline fakes.
---
The owner's target includes ten-minute 1080p videos around 350 MB, not only
short clips. Keep finished video bytes disk-backed and audio encoding bounded;
do not silently fall back to a whole-file JavaScript buffer when browser
storage is unavailable.

**Why:** A full finished MP4 plus a second decoded soundtrack can exhaust phone
memory. The owner specifically approved fixing this before publishing.

**How to apply:** Preserve explicit browser-storage errors rather than masking
them with a memory-heavy fallback. Prefer ordinary seekable MP4 output for
social/iPhone compatibility over assuming fragmented MP4 is equally supported.
Offline codec fixtures model orchestration only: they cannot establish native
encoding, device storage quota, ten-minute performance or iPhone playback.
