---
name: Runtime boundary testing
description: Why native Request-only tests miss failures between Vinext and Workers
---
Test request handoffs with framework-shaped wrappers, not only native Request instances from a single runtime.

**Why:** Native-only tests passed while the development creation endpoint crashed before authentication or provider access when the processing wrapper constructed a Request from another runtime's request object.

**How to apply:** Preserve origin, cookies, account scope, funding overrides and size limits across the boundary. Exercise both metered and unmetered processing. Bounded JSON and streamed uploads need separate handling.

Do not restart or reload the service while a user has a provider generation in progress without first establishing its state.

**Why:** A preview restart during a paid-generation attempt left approved writing saved but the audio response unconfirmed. Provider charges cannot be inferred from missing local audio.

**How to apply:** Inspect active production state before restarting during generation troubleshooting. Never retry an uncertain paid request automatically or call an unfinished writing draft a completed recording.
