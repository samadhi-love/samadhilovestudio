---
name: Browser test DOM injection
description: Distinguish browser-injected select markup from application hydration bugs
---
Browser-assisted checks can inject `bb-customSelect` wrappers around native select elements before React hydrates. Do not treat those wrappers alone as proof that the app's server and client renders differ.

**Why:** A signed-in Studio check showed the wrappers only in the testing browser DOM, not in the raw server response, application source, or dependencies. The browser harness or an extension was the likely source; the exact injector was not confirmed.

**How to apply:** When hydration reports reference these wrappers, compare the raw response and app source with the live DOM before changing product components. Report the testing limitation rather than masking hydration errors across the app.
