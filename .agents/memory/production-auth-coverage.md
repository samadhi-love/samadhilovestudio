---
name: Production authentication coverage
description: Why development keys and storage health checks cannot establish production page-render readiness.
---
Production authentication checks must cover server-rendered pages with synthetic
live-key behavior, not only development keys or a healthy storage endpoint.

**Why:** The managed authentication SDK accepts an empty hostname with a test key
but rejects it with a live key. That allowed preview and storage startup checks
to pass while production page rendering failed before the sign-in provider
could initialize.

**How to apply:** Keep browser hostname/proxy wiring canonical, use a trusted
request hostname for server rendering, and include an offline server-render
case with no browser globals and a synthetic live key. Never read, replace or
rotate managed credentials merely to exercise this case.
