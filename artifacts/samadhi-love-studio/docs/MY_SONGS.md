> Superseded deletion policy: Delete now provides 14 days of recovery, followed by automatic permanent cleanup. See SONG_DELETION.md.

# My Songs, positive actions and Archive

My Songs includes every active saved song and writing project, including legacy creation drafts. Existing records are not moved or duplicated. Creation drafts remain a useful status/filter rather than a separate place users must manually move songs out of. Completed provider generations and uploaded/rendered instrumentals now become ready library songs automatically. Generated writing retained after a provider failure stays visible with Needs attention status.

The same Song actions card appears in My Songs, recent songs, Quick Create results and Guided Studio results. Artist dashboard entries link back to that creation's expanded controls in the owning Studio. Cards expose personal Like/Unlike (the existing favorite flag), listening, editing/lyrics, remixing through existing tools, new linked generation, recording, mixer handoff, lyric video, artwork, versions/master selection, folders, private playlists, writing-project duplication, release review, downloads and Archive. Context-sensitive controls require an actual ready recording. Stems retain their existing explicit provider action; opening an actions panel does not spend credits.

Publication remains explicit in the Artist dashboard; saving never publishes. Ready cards load the existing owned release status endpoint, expose release links only after Published is verified, and support explicit Unlist. Device sharing/downloads retain the original format and authorization. Private file URLs are never presented as public share links. No social publishing or distributor integration was added. Existing Like, Love and Inspired community reactions remain independent of each creator's personal Liked songs. There is no dislike or negative rating.

## Dates and order

New creation records receive server-owned createdAt and updatedAt fields. Existing generated songs can use their original generation timestamp. Editing, replacing audio, liking, moving folders, or restoring cannot change a known creation date. Older records lacking a reliable date stay undated and keep their relative order after dated entries. No fabricated historical dates or bulk data migration is used. The sort control offers Newest first (default), Oldest first and Liked songs. Sorting is a view operation, not a rewrite of the underlying collection.

## Archive preserves the work

Archive and Restore to My Songs replace the old removal terminology throughout song controls. Original audio, historical recordings, writing, visual projects, versions, likes and relationships stay stored. The legacy deletedAt field remains internally for compatibility with existing eligibility checks; it now represents Archive. Existing hidden records appear in Archive and can be restored. Archiving from the editor includes the current writing edits.

Archive and Restore unlist the creator's matching Community release before the archive-state metadata is written, so restoration cannot silently republish it. This is a safe two-step operation, not an atomic cross-storage transaction: a failed metadata save can leave the release unlisted while the song remains in its previous library state. Originals remain preserved, and the change can be retried. A release-storage failure blocks changing the archive state. No permanent audio deletion, account reset or provider change is introduced.

## Save paths

- AI song creation and caption-ready generation preserve the approved writing first and complete the same library record after audio succeeds.
- Guided Studio now attempts an account save immediately after built-in instrumental rendering. Failed originals stay downloadable and in device recovery, with Retry save to My Songs.
- Quick Create retains a failed instrumental save for download/retry and device recovery. Creation IDs allow an acknowledged upload to be retried without duplicate songs/audio. Per-attempt audio keys preserve committed originals.
- Recording Desk, Vocal Studio and Multitrack save/render callbacks reuse the same owned audio endpoint, timestamps and project links. Existing editable vocal/mixer session saves remain in their private session stores; unsaved raw takes are not silently published or converted into finished songs. Session/project selection and explicit recording/export save controls remain available.
- New-song forms, writing drafts, Creative Prompts and writing-project copies save through the existing private workspace endpoint. Song-editor autosave, revision conflicts and recovery remain in place.

Rendering, provider calls and uploads still require the page to remain open. Working-state guards prevent ordinary workspace navigation during creation; this is not a durable server rendering queue. Unconfirmed local saves remain in their existing editor/device recovery rather than being falsely marked saved.

## Verification

`npm run test:library` checks order stability, legacy dates, positive likes, source-safe writing copies, per-song actions, Archive/Restore, publication gating, actual release share links, automatic instrumental save attempts and retry identity. API fixtures check timestamp ownership, automatic library flags, exact original preservation, idempotent save acknowledgment, scoped release unlisting, blocked archive on release-storage failure, and private access. These run with the existing regression gate. Browser/device visual acceptance testing remains unverified because the Sites-required browser helper is unavailable. No live accounts or library objects are mutated by the tests.
