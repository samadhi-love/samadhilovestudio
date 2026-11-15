# SAMADHI LOVE Studio — database and functional review

Reviewed 12 November 2026. Baseline: published version 69, source `81290c50e8aad3e527602a618c89cf4f2d522087`. Scope: read-only live D1 inspection plus targeted source tracing and isolated tests of lyric-video saving/history, genre classification, catalog collections and related project saves. Repairs do not migrate or delete existing records.

## Live database evidence and limits

The Sites database connector returned one binding, `DB`, and 17 tables. Every table was read with the connector's bounded page operation; none required a further page. `studios` returned one row at revision 10. Its JSON `content` was truncated by the connector, so the complete song inventory, duplicate song IDs, tags, asset relationships and metadata size cannot be certified from that response.

The other 16 tables returned zero rows: community_artists, community_comments, community_listens, community_marks, community_playback, community_playlist_songs, community_playlists, community_releases, community_reports, community_shares, creator_accounts, listener_station, party_comments, party_library, party_likes and party_sets. Empty tables indicate no rows at scan time, not proof of broken features or absence of private songs inside the workspace JSON.

R2 holds recordings, lyric assets/history, saved production sessions, reusable voices, meditation recipes, checkpoints and other files. The database connector cannot inventory that bucket. No authenticated browser/object-store inventory was available; byte-identical media duplication, missing R2 objects, actual microphone behavior and live provider health remain unverified. Live D1 reads did not alter data. Tests used isolated fixtures, not production writes.

## Verified findings and implemented repairs

1. **Genre identity differed between search, selection and filtering.** Genre search normalized punctuation/accents, while selection and My Songs filtering compared exact strings or case alone. Variants such as “Hip hop” and “Hip-hop” could become duplicate choices or miss saved songs. Shared identity/uniqueness functions now handle selection, free-form tag edits and My Songs filtering. First labels are retained; distinct names such as Afrobeat and Afrobeats remain distinct. Existing tags are not bulk rewritten.

2. **Reference-library coverage drifted from the genre picker.** The picker contained 298 genres, while the reference catalog contained 74 total entries, including only 18 curated genre entries. A preservation check confirms all original entries and their IDs remain unchanged. The library now contains 362 entries: 288 basic registry references were added to cover every picker style, while preserving the original order. These entries explicitly avoid invented origin, tempo or instrument claims. They are reference/prompt entries, not new licensed recordings. Genre families, labels and generated stable IDs come from the existing central registry.

3. **Growing catalog and collection limits needed clearer handling.** Catalog results render in batches of 60 instead of mounting every expanded entry at once; filters reset that view. Catalog/region search now uses the shared normalization. New case-insensitive duplicate collection names are prevented; failed creations retain the entered name. Existing collections are not renamed or removed. Favorite/collection additions respect the existing 300-reference storage limits; membership additions deduplicate IDs. Current capacity is visible.

4. **Lyric history silently discarded entries.** The API listed up to 1,000 snapshots but returned only 100, while its `truncated` flag only reflected the R2 listing. It now returns every snapshot in each bounded storage page and an opaque continuation cursor. Pro initially renders 100 entries, with controls to show more and load another storage page. History errors are visible and retryable. Stale responses cannot overwrite a later history request. Storage-key pages do not establish global newest-first order until all relevant pages are fetched; the interface states this.

5. **Classic cloud exports were difficult to rediscover.** Classic uploaded videos to the existing private lyric-asset namespace, but the shared saved-video panel only showed recent Pro export-history records. A read-only, account/song-scoped asset listing and explicit Browse saved videos control now expose video files from both editors, including older recording versions. Images, source videos and other asset kinds are excluded. Pagination, error/retry and asset-ID deduplication are supported. No editable project conversion or recording rewrite is required.

6. **Video export uploads could lose historical source identity.** The upload helper already accepts a source recording ID, but the video export calls omitted it. Both editors now supply the selected source ID explicitly, so the server validates and stores the corresponding owned current/history recording. Existing asset metadata is not rewritten or certified retroactively. The saved-video panel explains that older source labels should be confirmed by listening.

## Overlap that should remain intentional

| Areas | Evaluation |
|---|---|
| Universal Music Library / World Rhythm Atlas | Already share MusicLibrary and the discovery save model. Atlas applies a rhythm-specific view; retain both entry points. |
| Genre Picker / reference catalog | Previously separate coverage; now use the central genre registry for coverage and matching while keeping curated references. |
| Classic / Pro lyric editors | Different editing complexity and recovery models. Share private asset discovery; preserve unique controls rather than removing either editor. |
| My Songs / creation drafts | Views of song records and lifecycle state; drafts are not automatically duplicate recordings. |
| Recording Desk / Podcast Studio | Modes of the same capture component, with different presets and purposes. |
| Mix Lab / Audio + Visual Studio | Comparison/master selection versus editable arrangement; useful separate operations. |
| Private Radio / Party Mix / Community playlists | Different listeners, ownership and playback behavior. Do not combine their publication/access state. |

No content-hash deduplication or deletion was performed. Multiple exports, takes and mix versions are often intentional. Source code indicates current-revision checks for workspace saves, immutable original recording storage, project lineage and separate private/public boundaries. These safeguards were exercised in mocked regressions, not certified against every production object.

## Effectiveness and remaining work

- Genre classification remains descriptive/user-directed, with rule-based prompt suggestions. No acoustic AI genre classifier was verified.
- Reference catalog breadth is now consistent, but many added entries are basic style references. Further cultural descriptions and licensed instrument previews require curation.
- Saving a video file, saving editable settings and saving a history snapshot are different actions; finding an export does not imply every local edit was cloud-saved.
- The full workspace JSON still has a 1.5 MB limit. Larger project collections may eventually need separate indexed records or smaller metadata documents; actual current size could not be measured through the truncated viewer.
- Checkpoints are useful metadata recovery aids, not demonstrated full media backups. Bucket inventory and a restoration drill remain recommended.
- Background rendering, source-aligned long guided-session export and physical-device acceptance testing remain separate work, not completed by this review.

## Validation

- Central-registry scan: 298 picker genres covered; all 74 original entries preserved; zero duplicate catalog IDs.
- 53 targeted automated tests across genre controls, catalog saving/classification, saved-video discovery, lyric-video controls/validation, audio downloads and My Songs.
- Additional project-workflow regression: 15 automated tests, 42 mocked API checks and 8 checkpoint checks.
- Lyric-project/media regression: 65 mocked API checks, including 1,005 snapshots across storage pages, Classic video discovery and cross-account denial.
- Audio-conversion routing regression: 15 mocked checks.
- TypeScript and production build passed. Existing build warnings are not performance certification.

Total: 68 automated tests and 130 mocked API/storage/checkpoint checks. Actual authenticated browser layouts, provider output, real R2 inventory and physical-device exports remain unverified.
