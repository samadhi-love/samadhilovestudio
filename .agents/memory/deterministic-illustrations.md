---
name: Deterministic server-rendered illustrations
description: Normalize floating-point coordinates before rendering decorative SVG across different runtimes.
---
Round trigonometry-derived SVG coordinates to a fixed, useful precision before
rendering shared server/client markup. Normalize negative zero as a number.
Do not hide genuine hydration mismatches with suppression flags.

**Why:** Worker/server and browser implementations of sine produced slightly
different final decimals for the same decorative geometry, causing React
hydration warnings even though the calculations used no random values.

**How to apply:** For procedural SVG shared by server rendering and browser
hydration, emit stable coordinates rather than full floating-point results.
Keep a regression check that introduces tiny trigonometry differences.
