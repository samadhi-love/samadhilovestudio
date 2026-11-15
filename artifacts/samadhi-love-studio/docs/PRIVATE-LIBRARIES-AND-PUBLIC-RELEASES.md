# Private libraries, listening links and public artist releases

Existing project appgprj_6af2936d32488191a41ff8ccab32ed79. No schema migration or user-record rewrite is needed for this update.

## Account boundaries

Sites supplies authenticated identity; `privateWorkspace()` authorizes the owner or an active registered creator. Studio, audio, projects, recordings and provider credentials remain scoped to that identity. The owner uses these same private storage boundaries. Creator registration requires `STUDIO_CREATOR_BETA=1`; music generation uses each creator's own encrypted ElevenLabs key and plan, with existing daily creator limits. Public Site audience enables anonymous discovery; it does not grant Studio authorization.

## Explicit visibility

- Saving: private, no automatic publication.
- Share listening link: deliberate rights-confirmed capability grant. Random 256-bit token, private R2 grant and account/song index; no account IDs, prompts, lyrics or private project data in the public response. Anyone possessing the link can listen. Index validation on every metadata/audio request provides revocation. Pages are noindex with no-referrer policy. This cannot prevent recipients retaining audio they already received.
- Publish: existing rights/clean-content review and artist profile, then an approved immutable recording reference in Community. Public catalog is paginated and searchable. Creator pages show that creator's published songs and actual stored plays and positive reactions. New/private songs never appear there automatically.
- Unlist a public release: removes Community access. An independently issued listening link must be revoked separately. Archive/Restore revoke the listening-link grant and unlist the public release before metadata changes. Replacing audio invalidates both old publication and old link until explicitly approved again.

## Public listening and counts

Public audio streams through approved releases, preserving byte range and HEAD support. Anonymous listeners can request a playback ticket using a 30-day HttpOnly/Secure/SameSite first-party cookie. HMAC authenticity uses a separate random signing secret stored privately in R2 under `community-internal/`. That identity never grants Studio access, reactions, comments or account mutations.

Qualified plays require audio to have been served and at least ten seconds, with one stored play per account/browser and release per UTC day. Own plays are excluded when signed in. These are qualified playback counts, not unique humans or fraud-proof analytics: cookie resets, different devices and signed-out owners can produce additional counts. Likes require authenticated accounts; one positive reaction per account/song; no dislikes. If analytics storage fails, public audio can still play without counting.

## Social sharing

Creators can copy, email, open WhatsApp/X compose links, or use supported device sharing. Existing download/file-share controls remain. Upload buttons open official services for manual upload of downloaded audio/video. No direct social upload, OAuth authorization, scheduled posting or guaranteed device share capability is claimed.

## Runtime and preservation

Public listening requires Site access mode `public`. Only that access mode changes: existing editor/allowlist entries are preserved. Production environment change adds only `STUDIO_CREATOR_BETA=1`; existing owner and vault secrets remain untouched. No song is published as part of deployment. No library, audio, prior versions, credentials or existing feature is deleted.

Unlisted metadata adds two small private R2 records per newly created link; prior token records are inert when their index is revoked/rotated. This uses the existing storage plan. Social accounts and paid music providers are not invoked by tests or deployment.

## Verification

Automated checks apply real tracked SQL migrations to an in-memory database with separate creator identities, plus isolated R2/audio fixtures. Coverage includes foreign-account publication/sharing/revocation denial, explicit confirmation, public-only catalog/search/profile output, signed guest cookies and qualified plays, daily deduplication, private playlist isolation, moderation, revocation, suspended creators, replacement audio, and Archive/Restore behavior. Simulated DOM checks cover deliberate link creation, copyable URL, email/social choices and revocation.

Production build and the existing full Studio regression gate are run before release. Browser automation infrastructure is unavailable in this environment; real browser/device behavior, actual social upload flows, and production multi-account sessions require manual acceptance testing. No production user data or paid processing is exercised by these automated checks.
