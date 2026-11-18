# Versual Studio — current guide

## Public home and product identity

**Your song. Your world. Your video.**

**A SAMADHI LOVE creative studio**

The public `/` page is now the cosmic introduction to the existing Studio.
Discover remains at `/community`; it still contains search, genres, artists,
following, saved music and playlists. Party Mix remains under Explore, not on
the home page. Signed-in visitors still enter Studio directly.

The home page has motion-sensitive animations, four illustrative video looks,
and up to four genuine published community releases. It does not invent songs
or audience numbers. Product labels come from the shared `brand.json`;
SAMADHI LOVE artist credits and existing work are not renamed.

Offline verification passed: 31/31 commands, including 46/46 Studio groups;
11/11 landing checks and 8/8 homepage/sign-in SSR checks passed after final
preview adjustments. Workspace typecheck/build passed. Desktop and small-phone
previews were inspected; no paid calls, publishing or data changes were made.
Provider-managed email/OAuth branding remains an external, unverified setting.

## Reliability safeguards — Step 3A

Temporary safe reads retry twice. Paid processing and ambiguous saves do not
auto-repeat. A failed panel offers **Try again** while navigation stays usable.
Crash reports contain only approved technical categories/time/request IDs, not
lyrics, keys or private content. File pickers/forms have shared early checks.
The main server provides `/health`; the production launcher monitors it and
uses bounded restarts. No publishing or live paid test was performed.
See `STEP3A_RELIABILITY_REPORT.md` for exact limits, verification and exceptions.
The feature freeze remains; no new creation features were added.

## Current priority — Step 2 foundation freeze

**Step 2 is finished for the owner's approved fresh start.** Production uses the
new per-song cloud tables from the first save. New accounts are marked verified
with an `empty-fresh-start` receipt on first save; no old bundle is created and
no legacy data is implicitly copied. Do not upload the 7 preview songs. Local
data and all backups stay intact. Read-only cloud checks confirmed the selected
database is empty and ready. Offline new-account save/reopen tests passed:
44/44 verification groups, 25/25 test commands and full workspace typecheck/build.
There was no live song write, publishing, paid call, UI change or feature work.
Signed-in deployed saving remains unverified. Feature freeze remains until the
owner approves lifting it.

### Earlier preparation evidence

No new features or visual changes until the owner approves Step 2. Stage 3 stays
unchanged. Local per-song saving is active after an exact copy of 3 accounts and
7 songs; original bundles are read-only and R2 checkpoints were untouched.
The four Cloudflare resource settings have been supplied. The app is unpublished,
so `STUDIO_PUBLIC_ORIGIN` is pending and not required for development/storage
setup. **Immediately after first publish, remind the owner to add the actual
published HTTPS origin.** Owner-approved cloud schema setup is complete; the
copy command found 0 accounts/0 songs and reported 0 failures. All expected tables
and the catalog view passed the cloud schema check. No local preview songs were
uploaded and no R2 objects were changed. Real-song cloud saving and deployed
cutover remain unverified. Shared storage/provider boundaries and durable job helpers are in
place; no background processing has been enabled. See
`STEP2_FOUNDATION_REPORT.md` for scope, verification totals, limits and leftovers.
Final offline result: 44/44 verification groups and 25/25 test commands passed;
full workspace typecheck/build passed. The totals overlap. Production has not
had a real-song copy or deployed switch, so this is not a completed live cutover.
The owner test checklist below is retained for later owner-approved testing, not
permission to make paid calls or launch during the freeze.

## Owner test checklist — before launch

1. In **Replit Secrets**, add `STUDIO_CLOUDFLARE_D1_API_TOKEN`, `STUDIO_R2_ACCESS_KEY_ID`, `STUDIO_R2_SECRET_ACCESS_KEY`, and `STUDIO_OWNER_EMAIL`. Use the D1 Edit token and the bucket-scoped R2 S3 key pair. Leave the existing `vault` secret unchanged; never paste secret values in chat.
2. Sign in with the verified email matching `STUDIO_OWNER_EMAIL`, then press **Claim owner** once.
3. Open **Settings → Connect ElevenLabs**, paste your own key, and press **Test connection**. This checks account permissions without generating music.
4. On both **desktop and phone**, record a 2-minute melody idea, create one song with **Make 2 versions** off, find it in **My Songs**, then close and reopen the app to confirm it is still saved.
5. Choose **Make a Short**, export and download it, then play the downloaded video and check that the lyrics stay in sync.

The song test may use provider usage or Studio credits; run it only when ready for that cost. Nothing is published or shared automatically.

## Stage 2 status

The guided-screen consolidation is implemented and its final offline verification passed. This guide describes the actual screen homes. Historical feature documents are retained intact under `archive/` and are not current setup instructions.

## Stage 3 — beginner creation improvements

The new creation shortcuts reuse the current music, section-editing and video engines. “Help me describe it” expands the creator’s own words with the existing local style catalog; it makes no AI/provider call and the description stays editable. Lyrics chips insert song-part labels at the cursor, and the existing draft recovery autosaves those lyrics locally.

“Make 2 versions” is off by default. Turning it on warns that it sends two separate requests and uses twice the provider usage or Studio credits; the exact Studio-credit check still appears before each request. Confirmed versions are grouped under the same project and can be listened to and favorited separately.

My Songs offers “Make it longer,” “Redo a part,” and “Make another like this.” Extend and replace use the existing non-destructive section editor; the original is kept, and the user confirms the additional generation cost before proceeding. “Make another like this” fills Create with the saved description, style, vocals and known language.

“Make a Short” opens Video with a vertical 30-second clip. It starts at a saved chorus/hook when available, otherwise uses the strongest audio window that can be analyzed; a slider lets the creator adjust the start. It uses the last-used look and existing caption workflow. Review captions before export.

Create also offers optional microphone recording up to 5 minutes per take, with several takes allowed for one song idea. Each is saved privately as a reference on the song and never sent to ElevenLabs. The three-step welcome now explains **Describe or hum → Listen and keep your favourite → Make a video** and stays reopenable from Studio Guide.

### Stage 3 verification

All **41/41 offline Studio verification groups passed**, including the new creation, multi-take timer, lyric-chip, two-version, song-action, short-slider and insert-at-the-end checks. The full-workspace typecheck and production build also passed. No paid music requests or other provider charges were made. Real microphone hardware, signed-in browser journeys and production saving were not tested in this stage.

## Start here

Studio is for beginners first. Follow one path: **Create → My Songs → Video**. Record your own performance when you want to; Explore is for listening and discovering other work. Existing production engines remain available, but related tools now belong together.

The main navigation is **Create, My Songs, Video, Record, Explore**, with **Settings & Help**. The existing **Pro tools** switch reveals **World Sounds, Mix & Edit, Promote** and deeper controls inside the same screens. It does not create a second copy of the Studio or change your saved projects.

### Create

Choose an optional **Start from a recipe** template, describe the song, choose style chips and press Create. Use **Simple** for the shortest path. **Custom** opens separate lyrics, style, vocals and prompt-helper fold-outs when you want control. Language and singing-arrangement overrides are inside **Custom → Vocals**. The original detailed engine is inside **Custom → Pro production**, not another Create page; it stays mounted when folded away. Saved templates, prompts, lyric versions and drafts remain reusable.

In Simple, **Help me describe it** suggests fuller wording locally without calling an AI service; edit the result before creating. In Custom → Lyrics, tap **Intro, Verse, Pre-Chorus, Chorus, Bridge** or **Outro** to insert a section label at the cursor. Your lyrics use the existing draft recovery. Optional melody recording is private and only becomes an attached reference after a song is saved. It is not used as music-generation input.

“Make 2 versions” starts off. It creates two separate music requests, clearly warns about double usage/cost, and keeps confirmed versions together so you can listen and favorite the one you prefer. Each request still passes the existing credit check; the first stays saved if the second fails.

The header keeps a **Simple / Advanced** switch available on every screen; it only changes navigation and visibility, not saved work. Screen-specific help sits beside the page title. The first visit shows a short tour; reopen it later through **Settings & Help → Studio guide → Take the quick tour**. The tour explains the workflow but does not generate a song or use provider credits.

Open **My prompts** in Create to search, reuse, or favorite saved lyrics and music directions. **Save this prompt** works whenever you choose; automatic saving is optional and starts **off**. When enabled, it saves the prompt only after a song is confirmed—not after a failed or abandoned request. A favorite change can be undone from its confirmation notice. These controls preserve existing saved prompt records and keep them private.

Give clear language directions if Auto asks for clarification—for example: “A hopeful 45-second pop song about a fresh start. Sing in English with a warm female lead.” A regional style name alone does not always establish the language to sing. Custom → Vocals lets you choose it explicitly without changing your lyrics.

Singing generation uses **ElevenLabs Music**, not Suno and not an internally trained music model. Your own account and provider permissions are required. The disconnected/sketch path is not equivalent to a finished AI-sung song. Creation must keep its existing confirmation and saving protections; changing screens is not permission to submit a paid request.

### My Songs

Find songs, drafts and recordings, use folders and filters, and reopen existing projects. A song's next steps are:

1. **Listen** — play the saved recording.
2. **Fix a part** — reopen its writing, audio or production tools.
3. **Make video** — carry its audio, lyrics, timing and visuals into Video.
4. **Release** — review its checklist, exports and explicit sharing/publishing controls.

Covers belong to their song. Project workflow, release planning, release tools and the artist-dashboard entry point belong here rather than becoming competing workspaces. Nothing becomes public merely because it is saved or exported. Recovery controls and the disabled permanent-deletion scheduler remain unchanged.

The song actions include **Make it longer** and **Redo a part** through the non-destructive section editor, plus **Make another like this** to prefill Create. Each new passage is separate; the original stays saved. The screen shows a cost warning before another generation.

### Video

Choose a song and a visual vibe for a local preview, then export when ready. The six featured looks are **Awaken, Violet Flame, Sacred Bloom, Aurora Silk, Star Stories and Neon Skyline**. **Phone** is vertical; **YouTube** is wide. **More looks** contains the rest of the looks, backgrounds, caption styling, signature overlays and square format. Pro exposes the deeper editor within the same screen.

**Make a Short** from My Songs prepares a vertical 30-second excerpt at a chorus/hook when marked, otherwise at the strongest audio window the app can analyze. Move the start with the slider, choose another look, and review captions before exporting. The existing caption/alignment checks still apply.

Preserve saved projects and their actual look IDs; opening a project must not replace its original look with one of the featured six. Arabic and mixed-language text remain part of the original project. A local visual preview is not proof that lyrics are accurately aligned to singing. Automatic alignment and provider processing must retain their existing permission and approval boundaries.

### Record

Use **Voice** or **Podcast** mode. Existing recording, upload, take management and mantra repeat/loop/echo controls remain together here. Vocal Studio Pro processing is available in the Pro section.

Keep the original phrase/take separate from processed performances. Do not leave or remount a recorder during capture. A recorded voice is not automatically a verified AI singing clone.

### Explore

Browse Discover/community, Radio, Party Mix and the subscriber listening room in one listening area. Existing public and subscriber/private gates still apply. Moderation remains owner-only, with server-side enforcement; hiding its menu is not the security boundary.

Radio has **My station / Community station** inside the same section. The existing personal and SharedRadio engines are reused; the inactive source is paused, and recording capture also deactivates playback. The old `/radio` page takes eligible workspace users to Community station; guest/listener access is preserved. Radio and Party Mix remain their existing tools, not a newly activated licensed broadcast service.

### Pro tools

- **World Sounds:** browse the former Universal Music Library, World Rhythm Atlas, International Music Tent and Meditative Vibes in one place. **Use in my song** sends the selected instructions to Create. Existing meditation/audio tools stay in their appropriate section.
- **Mix & Edit:** the existing multitrack/audio-visual editor and mix comparison tools, together. Preserve original recordings and project associations.
- **Promote:** Logo Creator, animated nature logos and Musical Ad creation together. Song-linked promotion assets remain attached to their song. Cover editing stays with the song itself.

### Settings & Help

Use **Settings** for the personal ElevenLabs connection and existing preferences. **Plan & Credits** combines membership, plans and usage, without activating paid billing. Help explains the guided workflow; it should not send beginners through the archived documents.

## Where the old screens moved

| Old screen or view ID | New home |
| --- | --- |
| Music Creation / `overview` | Create → Simple |
| Detailed Song Production / `create` | Create → Custom → Pro production |
| Creative Prompt Lab / `prompt-lab` | Create → Custom → prompt helpers |
| Vocal Director / `vocal-director` | Create → Custom → vocals |
| Templates / `templates` | Create → Start from a recipe |
| Universal Music Library / `music-library` | World Sounds → library |
| World Rhythm Atlas / `rhythm-atlas` | World Sounds → rhythms |
| International Music Tent / `international-tent` | World Sounds → regions |
| Meditative Vibes / `meditative-vibes` | World Sounds → meditation |
| Recording Desk / `recording` | Record → Voice |
| Podcast Studio / `podcast` | Record → Podcast |
| Vocal Studio Pro / `vocal-studio` | Record → Pro controls |
| Audio + Visual Studio / `multitrack` | Mix & Edit → timeline |
| Mix Lab / `compare` | Mix & Edit → comparison |
| My Songs / `songs` | My Songs |
| Project Workflow / `workflow` | My Songs → song next steps |
| Release Board / `releases` | My Songs → Release |
| Release Tools / `distribution` | My Songs → Release → exports |
| Artist Dashboard | My Songs → artist/release area |
| Lyric Videos & Shorts / `lyric-video` | Video |
| Radio / `radio` | Explore → Radio |
| Community / Discover | Explore → Discover |
| Party Mix | Explore → Party Mix |
| Subscriber Listening Room | Explore → listening room |
| My Membership, Plans, Credits & Usage | Plan & Credits → matching section |
| Logo Creator, animated nature logos, Musical Ad builder | Promote |
| Song cover | Inside its song |

Old IDs and direct links must route to the relevant new home/section, preserving song identifiers and existing access requirements. They must not create fresh projects or overwrite stored settings. Explicit links to Pro tools need a clear way to reveal the relevant controls.

## Owner setup and permanent saving

The direct Node production adapter uses the existing **Cloudflare D1** database and **private R2** bucket. It does not convert them to PostgreSQL. Development preview remains isolated local emulation, even when production credentials exist.

The owner has supplied these named Secrets; their existence is not live credential validation:

- `STUDIO_CLOUDFLARE_D1_API_TOKEN` — account-scoped Cloudflare D1 Edit token.
- `STUDIO_R2_ACCESS_KEY_ID` and `STUDIO_R2_SECRET_ACCESS_KEY` — private-bucket Object Read & Write S3 credential pair, entered separately.
- `STUDIO_OWNER_EMAIL` — the email to match against the owner's verified sign-in.

The existing `vault` encryption-key secret is supported. **Keep its bytes unchanged. Do not generate a replacement.** If adopting `STUDIO_ELEVENLABS_VAULT_KEY`, it must be the identical existing key.

Next owner steps:

1. Keep managed Clerk sign-in unchanged.
2. Sign in with the matching verified email, open `/owner` and complete the one-time **Claim owner** step. First signup is never automatically made owner.
3. Open Settings → **Connect ElevenLabs**, enter the owner's own key and press **Test Connection**. The test performs free account checks only.
4. Read Music, Lyrics timing/captions and Stem separation results separately. A permission absent from the account response is **Not verified**, not a false success.
5. Complete authorized live storage verification and the signed-in creation/reopen/video/download journey before relying on full personal-use readiness.

Follow [REPLIT_PRODUCTION.md](REPLIT_PRODUCTION.md) for credential sources, read-only startup checks, private storage behavior and opt-in verification commands. No production table creation, seeding, data reset, storage fallback, automatic paid processing or retention-job activation is part of Stage 2.

## Verification and limits

All **23 offline command suites passed**, including the final **41/41 Studio verification groups**. Stage 2 full-workspace typecheck/build passed with PORT and BASE_PATH unset. The built-Node smoke test, six lock/config regressions, two compressed-request security tests and the patched image-adapter encode/decode check passed. Updated creator checks passed 15/15, the guided-screen checks passed 10/10, and the Simple recording/video handoff checks passed 5/5. The generated combined report is `work/studio-verification/latest.json` (generated output, not a setup instruction).

The latest guided-workspace/prompt-history round also checks the persistent mode control, screen help, restartable tour, backward-compatible prompt metadata, prompt search/reuse/favorites, and opt-in autosaving after confirmed creation only. Its offline checks do not make a paid provider call.

Offline checks do not establish actual song quality, genre-appropriate singing, native-speaker dialect accuracy, sung-word alignment accuracy, live durable saving or device-specific video playback. The signed-in browser end-to-end journey remains pending; Stage 2 permits offline/DOM tests only, with no testing-credit-consuming runs.

The four prior critical dependency findings remain cleared. Stage 2's dependency rescan reduced high-severity findings from **24 to 1** (with 4 moderate and 2 low findings also remaining). Static-code and privacy scans reported no findings.

| Updated dependency | Compatible change |
| --- | --- |
| body-parser | 2.3.0 → 2.4.0 through the existing Express 5 dependency |
| fflate | 0.8.2 → 0.8.3 in Studio; transitive 0.7.3 → 0.7.5 |
| sharp in stable Miniflare | 0.34.5 → 0.35.5 |
| undici 7 | 7.24.8/7.29.1 → 7.30.1 |
| ws 8 | 8.18.0 → 8.23.0, preserving already-patched instances |
| Vite 8 | 8.0.13 → 8.1.6 in both Studio and the preview sandbox |
| Zod 4 tooling consumers | 4.6.5 → 4.6.7, scoped to the tooling packages |

**Deferred high finding:** `GHSA-mrhx-c7xc-m3w5` in **Zod 3.25.76**. The advisory's available fixed line is Zod 4.6.6+, and there is no patched Zod 3 release. The application, shared API schemas, database validation and peer consumers still use Zod 3 contracts. A global major-version override could change parsing, error shapes and integrations; it is not a behavior-preserving dependency patch. That migration needs its own compatibility work rather than silently forcing Zod 4 during this consolidation.

The latest Cloudflare plugin currently pulls a beta Miniflare major. To avoid changing the preview storage/runtime behavior, Stage 2 retains the stable parent and applies narrowly scoped dependency patches instead. No security findings are suppressed.

Nothing in this guide authorizes publishing, domain/DNS changes, billing activation, paid provider calls or user-data deletion.
