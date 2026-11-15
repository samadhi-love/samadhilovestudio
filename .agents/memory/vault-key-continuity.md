---
name: Vault key continuity
description: Preserve the effective encryption key when changing managed secret names.
---
Do not provision a new encryption key just to standardize the name of an already configured vault secret. Securely preserve the same secret bytes, or explicitly re-encrypt existing credentials before rotation.

**Why:** First-time setup accepted a managed secret under a simpler name after the user had difficulty with manual secret entry. Once used, that key is the encryption identity for saved creator credentials, regardless of its managed name.

**How to apply:** Before adding a canonical secret or removing setup-alias support, check for an existing effective key and preserve it. Never treat a missing canonical name alone as proof that no vault key exists.
