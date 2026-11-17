---
name: Melody reference privacy
description: Guardrails for recorded melodies used as references for music generation.
---

Keep a creator's recorded humming or singing private and attach it to the saved song as a reference. Do not send it as music-generation input unless support is verified for the connected account and the creator explicitly consents.

**Why:** The current app has no verified melody-conditioned generation capability; a private recording should not be silently repurposed as provider input.

**How to apply:** Keep the recording out of generation payloads, explain that it is reference-only, and use the private media route for save/playback. Revisit only after confirming provider support and adding an explicit opt-in.
