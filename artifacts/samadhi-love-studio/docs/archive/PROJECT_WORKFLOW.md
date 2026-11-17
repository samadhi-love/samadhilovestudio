# Connected project workflow

Existing songs remain intact. Optional projectId relationships attach new recordings and rendered mixes to an existing song/project. Nothing is moved or bulk migrated. Existing manually linked mix recordings remain available. Choose a project in Create, Recording Desk, Vocal Studio, or Multitrack before saving a related result.

Mix Lab compares two saved recordings with synchronized start/seek and sampled average-level attenuation (not LUFS mastering). Playback compares their common duration. Select a final master explicitly; its recording ID remains pinned when a recording is subsequently replaced. Workflow Master opens this comparison/master selection panel.

## Saving and recovery

Account saves retain their existing revision checks. Multitrack also supports explicit editable account-session saves. Device recovery uses account-scoped IndexedDB for composition fields, unsaved takes, mixer sources/settings, vocal sessions, Classic lyric settings, and release credits. A recovery notice requires an explicit restore or discard. Storage failures are visible. Recovery is best effort, device-local, and depends on browser storage; it does not replace account saves or a backup. Uploaded Classic background images and unsaved Short Maker outputs are not part of these snapshots.

Before the first workspace write after this update, the server creates a versioned metadata checkpoint and captures subscriber grants. Failure to create that checkpoint blocks the write. It does not duplicate audio objects and is not a standalone full backup. Existing original recordings and historical assets remain in account storage.

## Limits and release packages

Creation still supports up to six minutes. Vocal and Multitrack production support eight-minute timelines; old four-minute sessions remain accepted. Audio uploads allow 96 MiB, accommodating stereo PCM WAV at the application's output rate with processing tails. Larger or higher-rate source files still need conversion before import. Vocal sessions now allow up to 48 minutes of aggregate originals, subject to a 512 MiB decoded-original guard, while retaining 16 clips and 24 source slots. See VOICE_AND_RIGHTS.md for practical limits.

Release Tools exports a ZIP with the pinned master, lyrics, credits, project relationships, promotion text, optional cover PNG, saved captions, and optional latest saved lyric videos/current project recordings. The package has a 200 MiB content limit. Canceling preserves account assets. Check artwork, metadata, and caption timing before distribution. The ZIP is not a full session/history backup and does not submit or schedule distribution. Unsaved promotional clips are downloaded separately.

## Build and verification

Use the Node version declared in package.json. From the project directory:

```sh
npm run install:ci
npx tsc --noEmit
npm run test:workflow
node scripts/test-lyric-video-pro.mjs
node scripts/verify-lyric-pro-api.mjs
npm run build
```

Workflow tests use React DOM simulation, fake IndexedDB/Web Audio, and isolated API/storage adapters. They exercise account isolation, restoration, shared scheduling, master validation/history, project linkage, package ZIP generation, and checkpoint failures without provider credits or live data writes.

Actual authenticated browser layouts, microphones, physical-device audio quality, provider generation, and rendered video/cover downloads require interactive verification. No browser-control tool was available during implementation. The production build retains a JavaScript chunk-size warning; this change is not a performance certification.
