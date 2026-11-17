---
name: Provider key ownership
description: Approval boundary for project-level ElevenLabs credentials and owner setup
---
Project-level ElevenLabs credentials may be connected to the explicitly designated, verified Studio owner, but are not general funding for visitors or other creators.

**Why:** The user approved owner/admin setup and owner-only use of the existing project key after project onboarding did not establish a Studio account connection. This did not authorize public use of the owner's provider credits.

**How to apply:** Preserve per-account encrypted connections for creators. Do not replace failed or missing creator credentials with the project key. Treat public studio-funded production as a separate approval and configuration decision. Existing connections and deliberate disconnects must remain respected.

Owner setup should use read-only account verification and must not automatically generate audio, speech, or a composition plan.

**Why:** The user declined a paid speech test while asking to restore the music connection.

**How to apply:** Separate connection verification from billable production. Do not claim that an account check proves song generation, vocal quality, or Music API permissions.

Diagnose provider access from the sanitized connection result, not from an HTTP 200 on the Studio settings endpoint or the mere presence of a project key.

**Why:** A restricted key's missing User read permission was hidden behind a generic “not connected” song-screen message, while Studio itself served the settings request successfully.

**How to apply:** Surface the specific provider rejection where creation is blocked. Do not rotate keys, rerun onboarding, or retry paid generation to diagnose an account-permission failure.
