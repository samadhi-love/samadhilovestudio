# Song deletion and 14-day recovery

Existing SAMADHI LOVE Studio only. Replaces the previous indefinite Archive behavior at the owner's request. Activation requires deployment of this source and verification of the hosted scheduler; a local build is not proof of an active production schedule.

## User behavior

Delete song asks for confirmation and states: “Deleted songs are kept for 14 days so you can restore them. After 14 days, they are automatically permanently deleted to free storage space.” Deleted songs move to Recently deleted, show their recovery deadline, and offer Restore to My Songs before that deadline. Restoration keeps releases unlisted and prior listening links revoked. Existing archives receive a fresh full 14-day window when the new policy first checks them; old timestamps do not cause immediate removal.

Dates come from the server. Repeated saves cannot extend the deadline, a browser cannot backdate it, and expired songs cannot be restored even when physical cleanup is still queued. Older open clients using the previous Archive action must reload and see the new policy before a new deletion can start. Omission from an older client's song list is not interpreted as deletion. Each account can delete only its own songs.

If another retained song uses the selected recording as a master, saved mix, or lyric-video source, deletion is blocked with a useful message. The user must choose a replacement/unlink the dependency first. Legacy dependencies are also protected during cleanup. No cascade silently destroys other saved songs.

## Server cleanup

`worker/index.ts` implements a real scheduled Worker event. `vite.config.ts` requests a cron every 15 minutes; the generated `dist/server/wrangler.json` includes `*/15 * * * *`. The routine runs on server infrastructure independently of an open browser. No public cleanup endpoint or visitor-provided account ID exists.

Migration `0007_song_deletion_jobs.sql` adds a small durable job/tombstone table. A conditional workspace revision update and job insertion run in one D1 transaction. A conflicting save/restore cannot accidentally enqueue file deletion. The routine processes up to 25 account records and 25 queued jobs per invocation; a private scan cursor ensures larger account sets continue across runs. Jobs remove owned current/history audio, all paginated lyric assets/finished videos, lyric-project snapshots and the sharing index. Workspace checkpoints are scrubbed of the selected song while retaining other songs and settings. Account prefixes isolate all objects. Failed operations remain queued for retry. Completion clears audio references from the job, keeping only a small tombstone to prevent stale clients or another creation path from resurrecting the permanently removed song ID.

At the deadline, recovery ends. Physical storage removal takes place in scheduled batches; large media collections, account-scan latency or temporary storage failures can delay completion. Files still needed by another retained song are protected. Independent editable Vocal Studio/mixer sessions and reusable templates are separate saved work and are not erased by Delete song. This is not an account-wide data erasure operation.

## Deployment and activation

1. Push the exact tested source through the supported Sites repository connection. Earlier access failures were resolved by a refreshed working credential during this update; do not reuse expired credentials.
2. Deploy the existing project with the packaged Worker and the new D1 migration, preserving DB/BUCKET, users and existing provider settings.
3. Confirm the hosting control plane has applied the Worker cron trigger. A build containing cron configuration alone is not proof of an active production schedule. No Sites cloud-task automation was created against an unavailable/unverified writer.
4. Use an authorized isolated test account to exercise deletion, restoration, an expired synthetic item, retries, file readback and another account's isolation. Verify a fresh scheduled event runs while no browser is open. Do not accelerate ordinary users' deadlines for testing.
5. Only then describe automatic deletion as active. Before activation the live Site retains its prior behavior.

The routine uses the existing Cloudflare D1/R2 bindings; requests, operations and storage count toward the hosting service's limits/costs. It does not call a paid music provider or use production credits.

## Validation

Real in-memory SQLite runs all migrations and the same transactional claim SQL used in the Worker. Tests cover exactly 14 days, client date forgery, restore cutoffs, legacy grace, cross-account file isolation, original/history media removal, more than 200 assets across retries, checkpoint scrubbing, storage/conditional-write failures, a restore winning the revision race, and live dependencies. Isolated API tests cover ownership mechanisms, old-client policy acknowledgement and immutable deadlines. DOM tests verify the policy and disabled expired restore action. No live records have been deleted. Browser/mobile and actual hosted scheduled events still require verification after deployment.
