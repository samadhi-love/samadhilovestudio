# Internal reliability and verification

This update extends the existing Studio from source `f5d57ed`. No schema migration, account change, provider reconnection, media deletion, or station launch is part of the update. Existing navigation, production tools, project relationships, artwork, caption templates and integrations remain.

## Corrections

- Workspace writes validate song, notes, version, mix, folder, playlist and caption structures before storage. Null entries, duplicate identifiers and unsupported nested structures return validation errors instead of reaching rendering code. Unknown extension fields are not stripped. Optional collections omitted by older clients retain their saved values.
- Protected JSON request bodies are bounded while streaming. The existing character limits remain; multibyte text is allowed within the byte envelope. Core workspace, generation, recording, media, alignment, account and listening-room failures return ordinary JSON errors. Temporary infrastructure errors include a request reference and a sanitized log entry without request bodies or secrets.
- The main Studio sends its loaded workspace identity on saves/uploads/generation. A different signed-in identity returns a conflict before storing data or calling the music provider. This supplements authenticated server ownership; older clients without the header retain the existing authenticated-account semantics.
- A delayed song-save acknowledgment merges unchanged fields and retains newer edits made during that request. Replacing a recording refreshes server-owned audio history and production metadata without discarding unfinished writing or causing a permanently dirty editor.
- `/api/studio/audio?song=…&v=…` resolves the requested current or retained historical recording and format. Unknown versions return 404, never a replacement recording. Unversioned requests still use current audio. HEAD and range responses follow that same version selection and owner isolation.
- Null or malformed lyric-project/session imports return false/validation errors. A conditional original-source upload that loses a race returns a conflict rather than a false success.
- Shared radio advances elapsed programme time before applying commands. Stopping between polls does not put an already completed song back into the queue. This remains the existing synchronized file-based station, not a newly provisioned continuous streaming service.
- A client render error has an explicit reload/recovery screen instead of leaving the whole application blank. It does not promise recovery of work that was never saved to the account or device.

## One repeatable gate

Run from the repository with the lockfile dependencies installed:

```sh
npm run verify:studio
```

The command stops on failure and writes an ignored local report to `work/studio-verification/latest.json`. It runs TypeScript; workflow/recovery and checkpoint checks; private vocal/mixer/voice/rights checks; production/stem/beat tests; shared-radio checks; Lyric Video/template and API tests; internal integrity/error-recovery checks; Party Mix tests; and the production build.

The community integration check applies the actual tracked migrations to **memory-only SQLite**, then exercises the actual community/Party route code through a D1-shaped adapter. It checks publication confirmation, private audio exclusion, owner-specific dashboards/actions/playlists, reactions, comment moderation, unlisting, replacement review and private Party ownership. Cloudflare authentication headers and storage availability are simulated; this is not a live deployment penetration test.

The added failure checks include malformed/null/duplicate workspace payloads, invalid nested imports, concurrent save edits, recording replacement, historical audio bytes, unavailable versions, ranged HEAD, storage outages, streamed body cancellation, account switches, omitted legacy settings, immutable upload conflicts and expired radio transitions. All fixtures are synthetic and isolated from user data and paid services.

## Verification limits and next acceptance tests

Automated verification cannot establish that every possible application behavior is bug-free. DOM/audio controls use simulation, not physical microphone or browser codec hardware. The existing Sites browser-control helper is unavailable in this environment; no alternate browser or preview server was started. Real desktop/mobile layouts, hardware recording latency, browser video exports, long-session memory behavior and multi-device radio playback still need interactive acceptance tests.

Live ElevenLabs/AudD processing, personal voice-model verification/singing conversion, credentials, quotas, rights and a continuously encoded radio stream require separately configured authorized providers. This update makes no paid requests and adds no external accounts. There is no new background/cloud rendering claim. Tests do not change the website audience, production account records, original media or settings.
