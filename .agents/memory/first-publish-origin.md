---
name: Verified production origin
description: Only configure a real production origin after verifying deployment metadata or explicit owner authorization.
---

Historical instruction: "The app is NOT published yet, so there is no production HTTPS
origin. Leave that setting empty/pending for now and continue setup with the
other values ... Make sure the app still runs in development without it.
Remind me to add the origin right after the first publish."

The owner later explicitly approved setting the production-only origin to
the existing deployment URL. Deployment metadata confirmed that URL, although
the deployment had not yet had a successful build. The earlier instruction to
leave the origin pending is superseded.

**Why:** the owner approved production configuration before their own publish.

**How to apply:** do not invent an origin from development domains or the separately
owned domain. Keep origin validation strict and use production-scoped settings.
Do not describe the origin as pending after its authorized configuration.
