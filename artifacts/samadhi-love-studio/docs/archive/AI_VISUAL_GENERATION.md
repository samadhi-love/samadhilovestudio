# AI visuals inside the existing Lyric Video workflow

This extends the retained SAMADHI LOVE Studio project `appgprj_6af2936d32488191a41ff8ccab32ed79`; it does not create another application or change accounts, provider keys, database records, pricing plans or the site's audience.

## Implemented and tested

Lyric Video → Choose Look now has **Create AI visuals** with three explicit actions:

- **Create an image:** ElevenLabs Flows, `gemini-2.5-flash-image`, with the project's 9:16 / 16:9 / 1:1 shape.
- **Animate an image:** ElevenLabs Flows, `veo-3.1-fast-generate-001`, a selected private uploaded/generated image as its documented `inline_base64` start frame.
- **Create a short video:** the same video model with a text description and no starting image.

Motion generation requests exactly four seconds at 720p, without generated audio. The selected song remains the soundtrack. A generated clip can loop or hold its final frame using the existing uploaded-video controls; it is not advertised as a newly generated full-song video. Square video projects receive a widescreen clip with existing fit/crop controls. Image generation supports actual square output.

Completed files are streamed into the existing owner/song-scoped R2 asset storage. Images use the `background` kind; video clips use `sourceVideo`. Users can preview/download the original, use an image throughout a song, build up to eight equally timed image scenes, or animate a saved image. The existing photo-story pan/zoom/dissolve engine and final lyric-video renderer do the assembly. Native decoding is checked before applying a saved visual. Applying media preserves audio source IDs, excerpt boundaries, exact lyrics and word timestamps; existing undo/redo, autosave and video versions remain in use.

`/api/studio/visual-generation` enforces authenticated private workspace access, same-origin mutations, song ownership, current or retained audio source, prompt bounds/content rules, explicit provider billing approval and input rights consent. Reference images must belong to that owner's song. No client-supplied remote input URLs are fetched. API keys remain encrypted in the existing per-user ElevenLabs vault and are resolved only on the server. No keys, raw provider errors or signed result URLs are returned to clients.

Job receipts are saved **before** the paid provider POST. An R2 conditional claim admits only one submission per request UUID, including concurrent clicks. Replays return the saved job. Network failures, malformed receipts and ambiguous server responses become unresolved jobs instead of automatically submitting another paid request. After a stale submit or lost receipt, the user can recover using the matching generation ID from their own ElevenLabs history. Checking/recovering a job does not create another generation. Status is real `pending`/`generating`, without invented percentages.

Conditional download leases prevent competing copies. Signed downloads allow only documented HTTPS provider storage origins (`storage.googleapis.com`, `api.elevenlabs.io`), reject redirects, never forward the API key, require a bounded known-length body for R2, and check the image/MP4 signature. Failed copies are removable/retryable without generating again. Result assets remain attached to the original recording, and another recording must not accidentally receive a stale asynchronous result.

Saved jobs live under `lyric-assets/<owner>/<song>/visual-jobs/`; existing 14-day song-retention cleanup therefore includes them and their media. This does not change or newly verify production cron activation. Studio deletion does not delete provider-side history; that account's retention policy applies. The library caps each song at 100 generation records and limits outstanding jobs to three during normal sequential use. No database migration is needed.

Automated evidence: three model/UI/project tests plus 48 isolated API checks, including consent/ownership/origin controls, provider contracts, lower-plan rejection, durable reopen, concurrent duplicate submission, concurrent imports, missing permissions, timeouts/uncertain charges, receipt recovery, redirects/SSRF refusal, invalid media rejection, reference ownership, source replacement and retry. An authorized synthetic four-second H.264 MP4 was generated with FFmpeg, verified with FFprobe and copied through the simulated provider download/private-storage path byte-for-byte. This proves import orchestration, not actual provider model quality or native browser export.

## Requires provider credentials or payment

Users must connect their **own ElevenLabs API key** using existing Studio Settings. The Image & Video API requires **ElevenLabs Pro or higher**, appropriate **Image & Video / Flows** permission, available provider credits, model/region entitlement and a sufficient key spending cap. User read permission enables the optional plan check; failure to read the plan is presented as unknown, not proof of visual access. Known Free/Starter/Creator tiers are rejected before the paid POST. The provider remains authoritative for all other access decisions. Music access is separate and the saved key/music settings are not altered.

This release charges the user's own ElevenLabs workspace directly; it does **not** invent a conversion into SAMADHI song credits or silently spend a platform-managed key. The documented public API has no quote endpoint used by this integration. The UI explicitly says the exact charge is unavailable, links current provider pricing, recommends a key spending cap and requires approval before each request. Model choices/duration are fixed to make the billable request understandable. No paid provider request was made during this task.

## Implemented but not fully verified

Live ElevenLabs image/video entitlement, real generations, output MIME/hosting variations, their subject/motion quality and actual charges require an eligible account and authorized paid test. Unsupported storage hosts or formats fail safely with manual provider-download/upload guidance. A successful nonbillable plan check is not proof of model access.

Browser preview/decode/export and mobile layouts have code and isolated DOM coverage; native browser rendering infrastructure was unavailable in this environment. No physical device was tested. The existing H.264/AAC/WebCodecs final renderer remains browser-dependent; original generated clips can be downloaded even if that browser cannot decode them in the editor.

## Still unfinished / deliberate limits

There is no generation cancellation endpoint in the inspected provider contract. **Pause automatic checks** only stops polling; it cannot cancel provider processing or charges. Jobs may continue at ElevenLabs after leaving the page. Studio copies the result into private storage when the user checks again; this release does not add an unattended webhook/worker import queue. Final full-song assembly/export still requires the browser page to stay open.

This does not add automatic paid multi-scene generation, guaranteed character consistency, arbitrary-length generated motion, multiple simultaneous video scene lanes, managed subscription visual credits, social-account publishing or a server video render queue. Existing image scene assembly, templates and authorized uploads remain available without AI visual API entitlement.

## Public provider contracts consulted

- https://elevenlabs.io/docs/overview/capabilities/image-video
- https://elevenlabs.io/docs/eleven-api/guides/cookbooks/image-and-video
- https://elevenlabs.io/docs/api-reference/flows/image/create
- https://elevenlabs.io/docs/api-reference/flows/video/create
- https://elevenlabs.io/docs/eleven-api/guides/how-to/image-and-video/references
- https://api.elevenlabs.io/openapi.json (downloaded 2026-11-14; request/response models checked locally)
