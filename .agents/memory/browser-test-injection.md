---
name: Browser test DOM injection
description: Distinguish browser-injected markup from application hydration bugs
---
Browser-assisted checks can inject `bb-customSelect` wrappers around native select elements before React hydrates. Do not treat those wrappers alone as proof that the app's server and client renders differ.

A development-tab hydration report also showed `/__replco/static/devtools/injected.js` where React expected a head stylesheet after a restart. Fresh public auth-page captures did not reproduce it; that does not prove that every signed-in hydration issue is external.

**Why:** A signed-in Studio check showed the wrappers only in the testing browser DOM, not in the raw server response, application source, or dependencies. The browser harness or an extension was the likely source; the exact injector was not confirmed.

**How to apply:** When hydration reports reference these wrappers or the injected devtools script, compare the raw response and app source with the live DOM and a fresh navigation before changing product components. Report the testing limitation rather than masking hydration errors across the app.
