# SAMADHI LOVE Studio consolidation and animated visuals

This extends the existing project `appgprj_6af2936d32488191a41ff8ccab32ed79`, from published source `24e7d2e2a6f13ae1b34b876392ccd808b2d4945d` and the subsequent local creator/video refinement. It preserves the existing DB/R2 bindings, accounts, saved work, ElevenLabs settings, recording tools, mixing, Party Mix and radio access. Earlier QA documents are historical; the current local verification record is `STUDIO_CONSOLIDATION_QA.json`.

## One creator, optional depth

The primary navigation is Create, My Music and Explore. Recording and Radio remain available, with the detailed production workspaces behind Pro tools. Inside Create, Simple and Custom expand the same editor without losing its current choices. Lyrics and creative directions are part of this editor; Composer and the separate Lyrics & Creative Prompts destination are removed. Existing song writing/version editing remains available. All guided-meditation scripts and players are removed; saved recordings and separate frequency instruments remain intact.

Song creation supports an optional title, lyric-derived title suggestions, exact supplied lyrics, genre blends, instruments, language/dialect, vocal arrangement and character. Vocal directions adapt to rap, R&B, combined rap/R&B, reggae/dancehall, Afrobeats, Arabic/world blends and other supported musical prompts. These are provider directions, not fabricated selectable singer IDs or guarantees of accent/quality. Connected instrumentals use the real music endpoint; disconnected instrumental sketches explicitly use the limited built-in palettes. New disconnected sessions never silently substitute a sketch for a vocal song.

Save prompt works from the creator and each song's actions. It stores private reusable lyrics, styles, instruments and vocal directions in the existing per-user template collection. Loading it fills the unified editor and creates a new song; it does not replace its source recording.

## Visuals and Shorts

The existing exporter and Canvas renderer are reused. There are 24 coordinated video looks, 36 background choices in the existing collections, 14 lyric-caption templates, uploaded backgrounds and portable Studio visual-template JSON. TikTok, Reels, Shorts, YouTube full-song and square presets adapt the same source project with safe-area guides and clamped excerpts. Audio and word timing share the same source-time range.

The animated Signature Collection now has 12 complete looks:

| Look | Visual motion | Caption pairing |
| --- | --- | --- |
| Awaken | Golden light rays and rings | Illuminated Verse |
| Violet Flame | Rising violet lights | Prism Flow |
| Unity | Connected circles | Sacred Script |
| Aurora Silk | Flowing northern-light ribbons | Quiet Space |
| Star Stories | Drifting connected stars | Silver Cinema |
| Lunar Orbit | Circling lights on tilted orbits | Illuminated Verse |
| Neon Skyline | Rhythmic decorative light bars | Neon Pulse |
| Prism Dance | Flowing color ribbons | Prism Flow |
| Velvet Lights | Soft floating orbs | Ink Echo |
| Sacred Bloom | Slowly turning mandala petals | Sacred Script |
| Meteor Dreams | Gentle shooting-star trails | Silver Cinema |
| Rose Garden | Floating pink and violet petals | Ink Echo |

Every effect is deterministic from the song's playback time, uses fixed bounded drawing loops and shares the actual video-rendering path. Selecting a signature look previews before applying, preserves lyrics/audio/timing and supports Undo through the existing editor. Layer strength, overlay animation, background motion and tempo can be adjusted independently. Reduced-motion preview and a still overlay option are retained. Decorative bars/tempo pulses are not audio-frequency meters or detected beats. The existing analyzed/reviewed beat grid and actual audio-energy options remain separate.

Title-based cover generation produces original typographic/geometric PNG artwork with eight palettes. It does not claim photorealistic AI image generation. New generated songs attempt a private automatic cover save; failure preserves the song and offers retry through the cover tool. Create / animate cover lets the user edit title/artist, save/download a PNG and choose an animated overlay for a vertical cover video using the existing video exporter. The PNG itself is still. Browser video export requires keeping the page open and a supported codec; no new server rendering queue or background export is claimed.

## Private work and public discovery

The root page is the public Discover/listening experience for every role. My Studio routes continue to enforce creator/owner access. Search works across public song title, artist, genre/style and released instrument metadata; genre filtering occurs before pagination. Published artist cards show released artwork, plays, positive reactions, followers and Follow buttons. Private drafts, unlisted links, blocked releases, deleted songs and incomplete generations stay outside public discovery. Publishing remains explicit. Cover files are served publicly only through a currently eligible public release. No private asset URL becomes public by saving a cover.

Account ownership, revision conflicts, release moderation, voice rights, usage metering and billing checks remain in place. Public profiles currently use published cover artwork rather than a new independent profile-photo system. Video downloads, device sharing where supported and upload links are retained; direct authenticated social posting is not newly implemented.

Delete replaces Archive, with a clear 14-day recovery period and server-owned deadlines. A new additive migration and scheduled cleanup worker implement durable batched removal with account isolation, dependency protection, checkpoint scrubbing and retries. Legacy archives receive a fresh 14-day grace period. Older open clients must reload before starting a new deletion under this policy. See `SONG_DELETION.md` for exact behavior and the required hosted scheduler verification. Independent editable sessions/templates are separate work, not silently erased with a song.

## Verification and remaining work

`npm run verify:studio` covers 29 groups; see the timestamped machine-readable result for the latest pass. This includes TypeScript, production build, simulated DOM controls, real in-memory SQLite migrations/transactions, isolated route/storage/provider fixtures, rendering geometry at beginning/middle/end of a six-minute timeline, portable-template round trips, Unicode text, source/timing preservation, private ownership, release filtering, deletion recovery/races/retries and preservation of existing integrations. Party Files adds a genuine 30-minute MP3 render checked with FFprobe/FFmpeg. `npm run db:generate` checks schema drift. The deletion migration only adds a table/index; it does not reset existing tables or user data.

No real browser or physical-device QA was available because the managed environment's required browser runner is absent. Canvas geometry tests are not evidence of final visual quality or native exported-video codec playback. No paid live song generation, live plan entitlement, voice audition, hosted scheduled cleanup, actual production data migration or continuously broadcasting external radio was exercised locally. Production publication is verified separately by the native Sites deployment result.

External dependencies remain honest: Eleven Music access depends on a supported paid plan/key; speech Voice Library IDs are not asserted to work as arbitrary singers in the music endpoint. Current provider limits and actual output quality require live testing. Existing 6-minute Studio requests are not a guarantee that every provider accepts/returns that length. Subscription checkout requires the existing configured Stripe products, secrets and verified webhooks. True 24/7 server radio, a full-song server render queue, new multiplayer collaboration and direct social publishing remain unfinished external infrastructure, not demonstrations advertised as working services.

Useful public workflow references: [Suno Simple mode](https://help.suno.com/en/articles/2462273), [Custom lyrics](https://help.suno.com/en/articles/2415873), [Reuse Prompt](https://help.suno.com/en/articles/2417409), [Eleven Music](https://elevenlabs.io/docs/overview/capabilities/music), [ElevenLabs Voice Library](https://elevenlabs.io/docs/eleven-creative/voices/voice-library/). These inform familiar workflow patterns; this app uses its own identity and the actual authorized providers already integrated.

The subsequent Logo Creator, Musical Ad and uploaded product-video extension is documented in [BRAND_AND_MUSICAL_ADS.md](BRAND_AND_MUSICAL_ADS.md). The categorized handoff is in [RELEASE_STATUS.md](RELEASE_STATUS.md).

Music Creation now appears first under Create, with a direct visual-video gateway below it. The subsequent private Party Files, voice recording, section editing, stems/MIDI access and caption-ready generation improvements are documented in [PARTY_FILES_AND_SECTION_EDITING.md](PARTY_FILES_AND_SECTION_EDITING.md). The cosmic site background retains the existing Discover hero and uses subtle constellations around it.
