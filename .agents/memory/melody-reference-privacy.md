---
name: Melody reference privacy
description: Guardrails for recorded melodies used as references for music generation.
---

Keep a creator's recorded humming or singing private and attach it to the saved song as a reference. Do not send it as music-generation input unless support is verified for the connected account and the creator explicitly consents.

**Why:** The current app has no verified melody-conditioned generation capability; a private recording should not be silently repurposed as provider input.

**How to apply:** Keep the recording out of generation payloads, explain that it is reference-only, and use the private media route for save/playback. Revisit only after confirming provider support and adding an explicit opt-in.

The owner's Save Voice fallback is a reusable description plus a private reference clip, not a cloned identity. Keep the clip independent of the original song's lifecycle.

**Why:** The owner explicitly requested this honest fallback when the active engine cannot reuse a singer's identity; deleting an original must not silently destroy a saved reference.

**How to apply:** Reuse the description in creation, offer private audition, and hide native cloning/seed/cover/repaint controls until the exact selected model actually supports them. Do not silently substitute a different model.
