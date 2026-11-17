# Step 3A — Reliability safeguards

Scope: the approved self-healing Part A only. No new creation features, visual
redesign, publishing, domain changes, paid provider calls or data deletion.
The fresh-start per-song storage decision remains unchanged. Local preview
songs, old bundles, media and backups were not copied, reset or removed.

## 3A-1 — Safe retries

The shared provider/storage boundaries retry safe reads at most twice, with
waits of 1 second and 3 seconds: three total attempts, never an endless loop.
This covers GET/HEAD provider account/status/media requests, D1 SELECT reads
and private R2 metadata/list/get requests. A returned media stream is not
restarted after partial delivery.

Temporary network failures, timeouts, HTTP 429 and 5xx are eligible. Bad keys,
permission errors, payment/credit/quota failures and invalid input are not.
An explicit cancellation or exhausted caller deadline is not extended.

**No paid processing call is auto-retried.** Music composition, composition
plans, alignment/transcription, stem separation and image/video creation all
remain single-attempt POSTs. The SDK's own retries remain disabled. Studio
production IDs protect local deduplication, but do not prove provider-side
billing idempotency. Retrying after an ambiguous response could charge twice,
so the safe exception requested by the owner is used. Foreign Request wrappers
retain their real HTTP method and cannot accidentally turn a POST into a
retryable GET.

D1 mutations/batches and R2 puts/deletes are also not auto-replayed. Conditional
writes and per-song revision guards stay intact. Credit reservation/refund
logic was not changed; its existing offline checks remain in the full suite.
No paid call was made to test billing or music output.

## 3A-2 — Main-server health and recovery

`GET /health` belongs to the main Studio server. It returns HTTP 200 with
`status: "ok"` or HTTP 503 with fixed database/storage availability labels.
It checks D1 with `SELECT 1` and R2 with a metadata lookup of a fixed, nonexistent
probe key. It never reads a song, lists user files, writes an object, exposes
credentials or returns raw provider errors. The response waits at most about
two seconds and is briefly cached/coalesced to reduce probe traffic.

The existing production start command now launches a separate supervisor
process. Every 30 seconds it calls the main server's `/health`, with a five-second
request deadline. After a 90-second startup grace period and three failed
probes, it terminates/restarts the child server. A child that does not stop is
killed after ten seconds. Unexpected exits are also recovered. There are at
most three local restarts; after that the supervisor exits unsuccessfully rather
than restarting forever. No user request or paid generation is replayed.

Replit Autoscale has no configurable custom health-check-path field. Therefore
no invented setting was added: the existing production command runs the
application-level supervisor, and Replit handles the process exiting.
An interruption may leave a provider request unconfirmed; check existing
production records rather than automatically generating again.

Reference consulted:
https://docs.replit.com/help/troubleshooting/deployments

## 3A-3 — Panel recovery

The active main screen (Create, My Songs, Video, Record, Explore and other
consolidated screens) has a panel boundary outside the navigation. Settings/tool
dialogs, retained recording/vocal/mixing engines, the lyric video editor and its
timeline also have their own boundaries. The original whole-app boundary is
retained.

A failed panel shows a short calm notice and **Try again**. Other navigation
stays mounted. Normal screen changes do not remount all retained recording/
editing engines just to reset an error boundary. A retry remounts the failed
subtree; it cannot restore every piece of unsaved component-local state. Saved
work is not deleted. Event/async failures are logged separately; React
boundaries catch render/lifecycle failures, not all asynchronous code.

## 3A-4 — Private-safe error reports

Panel and whole-app crashes submit to the app's own authenticated
`POST /api/studio/client-errors`. Unhandled browser errors/rejections also send
a best-effort report. Allowed fields are fixed panel/action categories, a fixed
error-type category, occurrence time and a UUID request ID. The server adds its
received time, logs the report and returns the same request ID.

No message, stack, URL, password, API key, lyric, media name or private form
content is sent. Unknown fields/categories, invalid JSON and oversized reports
are rejected. Reports require same-origin requests and a signed-in private
workspace, with a 2 KiB body limit and per-account rate limits. Older raw-error
console logging in save/upload/community/listener handlers was redacted too.

Logging cannot be guaranteed while the browser is offline, signed out, blocked
or closed; failure to submit diagnostics must never crash the app or repeat the
user's operation. Existing platform log access/retention controls still apply.

## 3A-5 — Upload and form checks

The inventory found **27 file pickers and 28 forms**. Every picker declares its
accepted formats and every form has a submit/action handler. Existing server
MIME, size, ownership, structured-JSON and media-decoding checks remain in place.

Filled gaps:

- A shared early guard now rejects empty files and formats that do not match
  the specific picker, instead of relying on the browser's file filter.
- Consistent outer limits cover images (15 MB), audio (96 MB), video/ZIP
  (120 MB), MIDI (2 MB), and JSON project/look imports (5 MB). Existing stricter
  limits, duration/decoder checks and ZIP expansion limits still apply.
- The guard applies to all pickers, including captions/backgrounds, reference
  audio, stems, MIDI, project/look JSON, photos, recordings and party imports.
- Required text fields containing only whitespace are stopped before submit,
  with a plain instruction to fill in the field. Existing browser range/type/
  required checks are retained. Passwords and submitted text are not trimmed.
- The guard does not erase validation errors installed by other code.
- Direct lyric-asset uploads now reject empty/oversized blobs before a request,
  as well as retaining the server-side limits.

These usability checks do not prove that a file is genuine or trusted. Server
validation, media decoding, archive expansion checks and authorization remain
the security boundary. Native browser validation messages may vary by device.

## Verification

- **45/45 Studio verification groups passed; 0 failed.**
- **26/26 package test commands passed; 0 failed.**
- New reliability checks: **10/10 passed**, including real shared read-wrapper
  retry behavior, non-retried writes/paid POSTs, a foreign Request wrapper,
  supervisor restart-budget simulation, DOM panel recovery, diagnostic privacy/
  authentication/rate limits and input/form guards.
- **Full workspace typecheck and build passed.**
- Main Studio preview `/health`: **HTTP 200**, server/database/storage all OK.
- The same health helper against cloud D1/private R2: **OK, read-only**.
- Preview workflow restarted successfully; the signed-out landing page rendered.
- Local data check: **3 legacy accounts / 7 songs**, with **7 current song rows**;
  no active production jobs were present before the restart.

The test totals overlap; do not add them as distinct tests. The final command
batch exceeded the shell's five-minute limit during the ElevenLabs offline
group; its remaining five commands were resumed and all passed. This was a
runner deadline, not a failing application assertion. The final full verification
report had 45 passes and zero failures. No browser testing credits or paid
provider calls were used. Existing development-key, framework and icon-barrel
warnings remain; these checks do not establish production sign-in readiness.

An intermediate staged run caught incomplete JSX/import wiring while adding
panel boundaries; the wiring was fixed. A TypeScript DOM/Worker type overlap
in the new input guard was also fixed. Final results, not an earlier partial
run, determine completion.

## Not verified by offline checks

- A real published instance freezing and recovering under platform traffic.
- Live paid-provider output, duplicate-charge behavior or account capability.
- A signed-in real user's cloud save/reopen.
- Native mobile file-picker/validation UI, real microphone hardware and actual
  downloaded-video playback.
- Diagnostics arriving while the client is offline or unauthenticated.

No fake production owner, cloud song, receipt or test media was inserted.
The production origin stays pending until first publish. The feature freeze
remains; stop after this approved Part A.
