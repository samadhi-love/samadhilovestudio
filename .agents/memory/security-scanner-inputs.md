---
name: Security scanner inputs
description: Why published vulnerability findings can disagree with the active installed dependency graph
---
Publishing dependency scans can inspect retained lockfiles from a different package manager even when the application builds exclusively from the workspace lockfile.

**Why:** An imported standalone npm lockfile continued reporting critical framework vulnerabilities after the active pnpm installation had already moved to patched versions. The scan correctly described the retained manifest, not the running dependency graph.

**How to apply:** Match each advisory's reported file path to the actual build/install inputs before proposing framework replacements or upgrades. Keep a single authoritative package-manager lock, update compatibility installers when retiring an alternate lock, and re-scan without suppressing findings. A zero-critical result does not establish that lower-severity findings or live production risks are resolved.
