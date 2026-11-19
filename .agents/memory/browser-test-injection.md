---
name: Browser test DOM injection
description: Distinguish browser-injected markup from application hydration bugs
---
Browser-assisted checks can inject `bb-customSelect` wrappers around native select elements before React hydrates. Do not treat those wrappers alone as proof that the app's server and client renders differ.

A development-tab hydration report showed `/__replco/static/devtools/injected.js` where React expected a head stylesheet. A fresh public capture alone did not reproduce it. Controlled hydration reproduced the failure when the server stylesheet had been promoted to a resource but the client still expected an ordinary link.

Vite RSC can mark server-rendered stylesheets with `data-precedence` automatically. Declare React stylesheet `precedence` explicitly for shared head stylesheets so the server and client agree about resource classification. Do not remove the preview script or suppress hydration errors across the app.

**Why:** A signed-in Studio check showed the wrappers only in the testing browser DOM, not in the raw server response, application source, or dependencies. The browser harness or an extension was the likely source; the exact injector was not confirmed.

**How to apply:** When hydration reports reference these wrappers or the injected devtools script, compare the raw response and app source with the live DOM and a fresh navigation before changing product components. For head stylesheets, reproduce the server's resource attributes as well as injected nodes; a plain render-to-string test alone can miss the mismatch. Report signed-in/device testing limits honestly.
