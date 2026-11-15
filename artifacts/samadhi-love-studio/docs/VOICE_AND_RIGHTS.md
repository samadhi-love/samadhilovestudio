# Own-voice production and rights review

## Record and mix your own performance

Home's **Use My Voice** shortcut opens the existing Vocal Studio. Song Library also offers **Record my voice & mix**. Choose a project, add an authorized instrumental from Song Library audio, render the backing mix, enable overdub, select Lead vocal, and record through headphones. The microphone remains a separate original recording. Live monitoring is optional; its audible latency depends on the device/browser. Recording does not clone a voice or send it to a voice-generation provider.

Backing playback level and a manual -500 to +500 ms recording-offset correction are available. Positive correction moves a new take earlier, trimming only its timeline view when it would start before zero. The original blob is preserved. This is an adjustable correction, not an automatic hardware-latency calibration. Listen to a short test take before recording the full performance.

Vocal sessions retain eight-minute timelines, 16 clips, and 24 original-source slots. The aggregate original-duration budget is now 48 minutes, subject to a 512 MiB decoded-original guard on import/recovery/reopen. Six four-minute stereo sources at the application's 44.1 kHz rate fit that guard; six six-minute stereo sources exceed it. Rendering and the application need additional memory. These limits are not a guarantee that a phone can process a large session. Old sessions retain their schema and namespace.

## Editable mixer account saves

Multitrack Mixer has explicit **Save editable session**, **Save session copy**, and an account session picker. Account saves retain original track files, trims, placement, volume, pan, EQ, effects, mute/solo and project association. They are distinct from WAV rendering and device recovery. Original files are immutable; repeated saves skip originals already uploaded from the current tab. Save conflicts return an error instead of overwriting newer work. Save a copy to preserve a conflicting edit.

Vocal and mixer routes reuse a private audio-session handler, with separate storage namespaces. Session metadata cannot save before referenced originals exist. Existing vocal-session storage, revisions, source IDs and routes remain compatible. Failed saves can leave private unreferenced uploads; no cleanup/deletion was introduced.

Lyric Video Pro's separation request now carries its retained source recording ID, and the server resolves the matching historical format. It does not silently substitute the current recording.

## Rights and recording matches

Release Tools shows a recording-version-specific review for the selected master, or the selected recording before a master is pinned. Users separately document the recording source, composition/lyrics, performer permissions, and license references. This is a user declaration; the server timestamps and allowlists its fields. It is not a verified license. Notes/results remain private and are included in release packages as rights-review.json.

Optional AudD recognition is implemented but requires a real AudD account token in the Site's server-side runtime variable **AUDD_API_TOKEN**. Configure it through Site runtime settings; do not put secrets in source, client storage, permission notes, or chat. No dependency installation or browser token entry is required. Review AudD pricing, terms and privacy before connecting. This implementation does not create an account or purchase a plan.

A user explicitly authorizes each check. The client creates up to three mono 22.05 kHz PCM excerpts, at most 10 seconds each, selected near the beginning/middle/end. Only those excerpt bytes are sent through the authenticated backend to https://api.audd.io/. Original recordings are unchanged. The backend enforces WAV/size bounds, source membership, origin checks, a fixed provider endpoint, content hashes, cached results, and 12 excerpt attempts per account per UTC day. Attempts that reach the provider may consume budget even on failure or cancellation. A canceled request may already have been processed by AudD. Configure only an account whose usage and costs the owner accepts.

The server stores sanitized match metadata, recording references, submitted excerpt hashes, times and duration, not excerpt copies. The source/version reference is selected by the client; the report is not an independently verified attestation that the excerpt represents the entire recording. It is also not a registration service, YouTube Content ID enrollment, an AI-music detector, or a detector of all copied melodies/lyrics/covers/voices. Catalog matches can be authorized works, including the user's own release. No match means unknown, not copyright-free. There is no automatic publication block or deletion based on a match. Permission review remains necessary for composition, lyrics, samples and voices. History responses explicitly indicate truncation.

## Verification

```
npm run test:voice-rights
npm run test:workflow
node scripts/test-lyric-video-pro.mjs
node scripts/verify-lyric-pro-api.mjs
npx tsc --noEmit
npm run build
```

The new suite checks resource budgets, placement corrections, WAV coverage, mixer serialization, simulated recording/backing/pause/resume/resource cleanup, inactive recognition UI, mixer save/reopen, and isolated backend authorization, immutable originals, revision conflicts, consent, quotas, recognition failures, and historical-source separation.

No live AudD or music-generation requests were made. Shared browser-control tools were unavailable. Real microphones, timing correction on hardware, listening quality, actual layout, and browser video/audio exports still require interactive acceptance testing.
