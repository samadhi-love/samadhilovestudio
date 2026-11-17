# Beginner-first Studio review

Existing project: `appgprj_6af2936d32488191a41ff8ccab32ed79`. Reviewed against source through `8292fe6` (production version 73), retaining the latest preset and song-opening changes. This is an extension of the existing Studio, not a second application.

## Evaluation

The main obstacle is discovery: 22 workspace destinations, eight sidebar groups, nine repeated home shortcuts, and two song-creation experiences presented as separate places. The tools serve different purposes, but their equal prominence makes optional production work look compulsory. Beginners need a song description, style choices, a clear create action, listening/correction, and an obvious way to make a video or share. They should not need composition codes, stems or a release workflow to make their first song.

The application already has useful foundations: Quick Create; Beginner/Advanced/Pro levels in Guided Create; shared private songs and Song actions; linked project assets and soundtrack selection; the five-stage Lyric Video Pro flow; draft recovery; non-destructive versions and Archive; centralized provider/credit checks. Reuse these instead of adding another wizard or song store.

## Implemented information structure

Simple view is the default. Five main destinations replace the 22-item navigation. Each old view is assigned exactly once; existing IDs and direct links remain valid. Related tools appear within their workspace. Less common destinations sit in a collapsed More tools disclosure. Pro tools restores the existing full navigation without leaving or resetting the active tool. This device preference is scoped to the signed-in workspace; it is not an account role or permission.

| Existing view | Simple workspace | Access |
| --- | --- | --- |
| Overview / Quick Create | Create Music | Main entry: Quick song |
| Create | Create Music | Guided song; retains Beginner/Advanced/Pro |
| Templates | Create Music | Song templates; searchable recipes and style families |
| Lyrics & Creative Prompts | Create Music | Write lyrics |
| Composer / Music DNA | Create Music | More creative tools |
| Creative Prompt Lab | Create Music | More creative tools |
| Vocal Director | Create Music | More creative tools |
| Universal Music Library | Create Music | More creative tools |
| Meditative Vibes | Create Music | More creative tools |
| World Rhythm Atlas | Create Music | More creative tools |
| International Music Tent | Create Music | More creative tools |
| My Songs | My Music | Songs & recordings; private songs, folders, sorting, likes and Archive |
| Project Workflow | My Music | More tools; optional complete production map |
| Recording Desk | Record | Record a voice |
| Podcast Studio | Record | Record a podcast |
| Vocal Studio Pro | Record | More recording & mixing tools |
| Audio + Visual Studio | Record | More recording & mixing tools |
| Mix Lab | Record | More recording & mixing tools |
| Lyric Videos | Videos & Release | Make a lyric video; existing guided steps |
| Release Board | Videos & Release | Release checklist |
| Release Tools | Videos & Release | Export & release tools |
| Radio | Radio & Community | Radio, with links to Discover artists and Party Mix |

Artist Dashboard is linked from Videos & Release as Publish & share. Settings & Help stays available, including membership, plans, credits and owner-restricted administration. The listening room, moderation and other established links remain in Pro navigation. Party Mix and Community reuse their existing routes. No public/private policy changes.

The simple home removes the duplicated nine-card shortcut grid, release-focus panel, second genre-library browser and Party spotlight. These are retained in Pro view or their existing destinations. Quick Create continues to show genre choices; optional opening/fusion controls sit under More song options. Lyrics, composition and vocal tools keep their distinct saved data and capabilities: this change consolidates access, not their processing engines.

## Accompanying creation corrections

The starter library adds 51 original editable recipes spanning all 17 genre families, alongside the three legacy defaults when present. Saved custom overrides win; old deliberately deleted templates are not restored. Recipes are writing directions, not pre-generated tracks.

A heading-only outline is not treated as completed lyrics. Guided generation requests lyrics to match that structure; the API rejects a supplied outline with no performable words before contacting the provider. Real approved lyrics, including explicitly spoken passages, are preserved. Timing allocation for supplied sections counts performable text rather than long production notes. Quick Create's example no longer requests a whispered opening. Opening choices guide future generation; they cannot guarantee a provider's vocal entrance or remove speech already recorded.

Audio readiness can identify quiet opening samples. An explicit Preview without opening silence action creates a separate 24-bit PCM WAV, retains 150 ms of pre-roll, and allows listening/download. It does not save over the original or change existing video timing. All-silent recordings are refused. The threshold is -60 dBFS; intentional ambience and very quiet vocals still require listening. Reusing a trimmed copy as a soundtrack requires caption realignment.

## Preservation and security

No schema migration, user-data rewrite, account change, secret update or provider replacement is required. Existing storage, ownership checks, ElevenLabs connection, credit controls, publishing consent, mix/version links and recording navigation guards remain in use. Changing the navigation mode does not change the active workspace or unmount its editor. Navigation continues through the existing recording, generation, pending-save and unsaved-edit checks.

## Verification and limits

Automated coverage checks the complete 22-view mapping; five-entry simple menu; Pro toggle; mobile-menu open/close state; destination handoffs; owner-only link filtering; templates/custom overrides; generation payloads; exact approved lyrics; heading-only validation; WAV output and original-sample preservation; source-version changes and playback recovery. Existing regression suites cover account isolation, credits, publishing, drafts, recording rights, shared timelines, radio permissions and lyric video APIs. These use simulated DOM/audio and isolated provider/storage fixtures; they do not establish live provider quality or physical-device usability.

A browser walkthrough and first-time-user trials are still required, especially on iPhone: create a complete song, correct lyrics, reopen it, render a video and share deliberately. Paid generation, actual production playback and native browser encoding require live verification. No promise of bug-free operation, perfect recognition or continuous server-side radio is made by this navigation change.

## Next refinement priorities

1. Observe beginners completing one song-to-video journey; use observed confusion to simplify individual editors further.
2. The per-song action panel and writing editor still expose many optional production choices when opened. Gradually disclose these by task; keep advanced mixing and version tools available.
3. The Recording Desk, vocal sessions and multitrack editor have different jobs and data models. Share selection/return paths before attempting to merge their engines or unsaved-session state.
4. Keep costs and availability visible at the actual generation/export action. Never describe local instrumental sketches as completed provider-generated vocal songs.
5. Keep personal radio listening distinct from public broadcast administration; verify external station infrastructure separately.
6. Measure failed/retried saves, caption alignment uncertainty and exports with authorized test files before calling the entire production path ready.
