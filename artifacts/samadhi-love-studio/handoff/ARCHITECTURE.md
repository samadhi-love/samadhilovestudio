# Architecture and continuation map

Read START_HERE.md before changing the deployment, ownership or data model. The full tree is FILE_TREE.txt; this is a guide to the actual main files, not a replacement for the code.

## Entrypoints and platform

| Path | Purpose |
| --- | --- |
| `app/page.tsx`, `app/layout.tsx`, `app/studio.tsx` | Site/application composition and Studio state/UI. |
| `app/studio-navigation.tsx`, `app/mobile-project-bar.tsx`, `app/mobile-studio.css` | Retained main navigation and phone controls. |
| `app/studio-access.ts`, `app/chatgpt-auth.ts`, `app/creator-accounts.ts` | Trusted platform identity, owner/creator gates and account state. |
| `.openai/hosting.json` | Identity of the existing Site and D1/R2 binding declarations. Preserve on existing-site work. |
| `vite.config.ts`, `next.config.ts`, `scripts/vite/` | Vinext/Cloudflare integration, local bindings, portable mock identity, bundled Sites tooling. |
| `worker/index.ts` | Worker fetch handler and scheduled song-retention entrypoint. |
| `db/schema.ts`, `db/index.ts`, `drizzle/` | D1/Drizzle schema, binding and eight ordered SQL migrations. |

## Music, recording and library

| Path | Purpose |
| --- | --- |
| `app/quick-create.tsx`, `app/creative-play.ts`, `app/creative-video-handoff.ts` | Simple/Custom and Start / Play / Share creation/take/video handoff. |
| `app/studio-data.ts`, `app/project-assets.ts`, `app/song-library.ts` | Core song/project shapes, source ownership/asset lineage and library logic; consult the tree for adjacent controls. |
| `app/style-dna.ts`, `app/style-dna-controls.tsx`, `app/saved-song-prompts.ts` | Saved sound recipes, song maps, bounded generation directions and reusable private prompts. |
| `app/api/studio/create/route.ts`, `app/api/studio/elevenlabs/provider.ts` | Actual music-provider generation, provider contracts/errors and persisted song handling. |
| `app/api/studio/elevenlabs/vault.ts`, `app/api/studio/elevenlabs/route.ts` | Per-owner encrypted provider key storage and connection tests/settings. |
| `app/recording-desk.tsx`, `app/vocal/`, `app/recording-dsp.ts` | Recording/vocal/effect and mixing implementation. |
| `app/production-exports.tsx`, `app/api/studio/stems/route.ts`, `app/instrumental-midi.ts` | Available provider separation, actual note MIDI or clearly distinguished marker MIDI. |
| `app/song-retention-worker.ts` | Fourteen-day recovery/cleanup jobs; production scheduler activation must be verified. |
| `app/api/studio/store.ts` | Revision-checked Studio JSON writes with checkpoints. Never replace these with unowned client overwrites. |

## Lyric/video pipeline

| Path | Purpose |
| --- | --- |
| `app/lyric-video-pro.tsx` | Main song → captions → review → look → export workflow, autosave/history and source guards. |
| `app/lyric-video-data.ts`, `app/lyric-pro-data.ts` | Project/word/cue types, validation, backgrounds, clip timing and caption formats. |
| `app/api/studio/lyric-sync/route.ts`, `app/lyric-notation.ts` | Approved-lyric alignment/transcription, audio selection, structural/performance notation. |
| `app/api/studio/lyric-project/route.ts`, `app/api/studio/lyric-assets/route.ts` | Private save/versioning, source-checked project media, bounded streaming and range responses. |
| `app/lyric-pro-render.ts`, `app/lyric-video-render.ts`, `app/lyric-caption-render.ts` | Shared deterministic background/lyric/overlay drawing for preview and exports. |
| `app/lyric-pro-export.ts`, `app/short-export.ts` | Actual browser encoding, codecs, progress/cancel, fallback and visibility constraints. |
| `app/lyric-background-picker.tsx`, `app/lyric-caption-templates.ts`, `app/lyric-signature.ts` | Background/caption/signature choices; existing collections remain intact. |
| `app/creator-video-tools.tsx`, `app/creator-video-presets.ts`, `app/vibe-to-visual.ts` | Existing coordinated-look chooser, optional quick vibes, description matching and format/excerpt presets. |
| `app/av-signals.ts`, `app/stem-reactive.ts`, `app/stem-reactive-controls.tsx` | Measured stem envelopes, source-bound effect selection and restrained motion. |
| `app/active-visual-source.ts`, `app/advertising-footage.ts`, `app/ad-photo-story.ts` | Arbitration of retained backgrounds/photo scenes/video footage; aligned preview/export timing. |
| `app/visual-generation-controls.tsx`, `app/api/studio/visual-generation/` | Actual async provider visuals, approval, durable receipt/recovery, safe private import. |
| `app/lyric-release-kit.ts`, `app/video-export-history.ts` | Real caption/project ZIP and retained finished export references. |
| `public/lyric-art/`, `public/studio-scenes/` | Included public original artwork/template assets. Private user media is not in Git. |

## Community, billing and other tools

`app/community/`, `app/api/community/`, `app/song-sharing.ts` implement explicit publishing, authorized media access, Discover and positive community interactions. `app/credits/`, `app/billing/`, `app/api/billing/` and `app/members/` contain usage/account ledgers, draft plans and verified Stripe handling. `app/party/` and `app/api/party/` contain Party Files/library/mixes/uploads. `app/live-radio/` and `app/api/radio/` contain retained station/queue/playback state and controls; the current product is not a separately verified continuous external broadcast engine.

## Storage / consistency boundaries

- D1 `studios` rows are owner-scoped JSON plus an optimistic revision. Other D1 tables hold creator/community/Party/usage/billing/deletion state. Preserve migrations and schema/indexes; do not flatten or regenerate them blindly.
- R2 holds private audio/media, checkpoints, snapshots, source histories, provider-key ciphertext and job receipts. Access routes authenticate the owner and validate song/source IDs. R2 prefixes and DB references must move together if storage changes.
- The provider vault uses authenticated AES-GCM with owner-specific context. Copying ciphertext without the existing vault secret and owner mapping is insufficient. Never export that secret into a source ZIP or browser code.
- Visual generation records live under their owner's song asset prefix. An immutable receipt/conditional claim is written **before** the billable POST; uncertain outcomes require recovery, not automatic paid retry. Result download URLs and keys stay server-side.
- Caption cues remain in source-audio time. Excerpt/video exports shift both audio and captions together; intros add a separate offset. Replacing audio must keep proper source lineage or clearly require realignment.
- Public/unlisted sharing is explicit. A private-media URL is not a public CDN link. Do not broaden access to make a broken preview “work.”

## Existing detailed documentation to read next

- `docs/RELEASE_STATUS.md` — current scope and caveats.
- `docs/STUDIO_CONSOLIDATION_QA.json` — saved verification evidence; handoff adds a fresh exported-source report.
- `docs/MUSICAL_VIDEO_REVIEW_AND_UPGRADE.md` — comparison of the latest feature proposals, implemented work, source references and deferred infrastructure.
- `docs/AI_VISUAL_GENERATION.md` — provider models/contracts, pricing/permission gates, recovery and storage restrictions.
- `docs/CREATIVE_PLAY_FLOW.md`, `docs/MOBILE_STUDIO_AND_STAGE.md` — preserved latest beginner/phone journey.
- `docs/AUDIT_RELIABILITY_REPAIRS.md`, `docs/STYLE_DNA_AND_STEM_VISUALS.md` — compatibility and reliability context.
- Other feature-specific docs are included in full. Their historical group counts/features describe their own revisions; START_HERE.md and the latest test report take precedence for this snapshot.
