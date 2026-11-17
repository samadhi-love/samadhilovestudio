---
name: First-publish origin reminder
description: The app is unpublished; origin is pending, not a prerequisite for development/storage setup.
---

The user said: "The app is NOT published yet, so there is no production HTTPS
origin. Leave that setting empty/pending for now and continue setup with the
other values ... Make sure the app still runs in development without it.
Remind me to add the origin right after the first publish."

**Why:** the user asked; no production address exists yet.

**How to apply:** do not invent a public origin or block local preview/storage
diagnostics on it. Immediately after the first publish, obtain the actual
published URL using the deployment tools and remind the owner to set
`STUDIO_PUBLIC_ORIGIN` to that HTTPS origin. Do not guess it from development
domains or the separately owned domain. Keep production origin validation strict.
