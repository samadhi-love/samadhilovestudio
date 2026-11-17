# Shared radio submissions and daily scenes

The existing private Studio Radio remains intact. Radio now has **My studio radio** and **Shared live station & submissions** views. A separate `/radio` listener page is linked from Studio Radio and the subscriber room. Existing Site audience/access settings are unchanged; listeners must sign in. No station was activated during implementation.

## Queue policy

Active creator workspaces and the owner may submit a current clean recording from their own Song Library. Each account gets one accepted submission per rolling 24 hours, measured by server time. Rejection and withdrawal do not refund that interval. This is per account, not a verified unique human. Existing creator-registration and suspension boundaries are preserved.

Submissions require a completed recording/composition/voice review in Release Tools, an explicit streaming grant, artist display name and permission-reference notes. Notes are private to the submitter/station owner and are not a verified license. Accepted submissions start pending. The owner must preview the exact recording, verify its duration, acknowledge listening/rights review and document the review before approving.

Playback is FIFO by server-assigned submission sequence among approved songs. Pending reviews do not block approved songs and never play automatically. An older pending submission approved later enters ahead of later waiting approved songs, without interrupting an already playing track. Songs play once; there is no automatic replay. Active capacity is 100 submissions, with an additional bounded history. Total state size is bounded; capacity errors preserve existing state.

The owner can close/open submissions, reject/remove tracks, start and stop the station. Launch requires the owner's explicit confirmation that permissions and applicable streaming requirements have been reviewed. The default station is offline with submissions open. Stopping returns the current song to the approved queue; starting restarts it. Submitters can withdraw pending/queued/current entries. Audience reports are sent privately to the owner and do not automatically prove infringement or remove a track.

## Playback implementation and limits

One R2 state document uses conditional ETag writes for atomic cooldowns, FIFO sequence assignment, review actions and programme transitions. Failed concurrent writes retry against fresh state. No database migration or changes to private song records are required.

The programme uses a server-authoritative clock. Listeners press Listen to satisfy browser autoplay requirements and join the current song position. Browser pause does not pause the station. Polling and boundary refreshes advance metadata; late joins seek into the current programme. If nobody is connected, the schedule still advances logically when next requested. Programme history is not evidence of actual listeners, performances or royalty reporting.

This is a synchronized website player serving authorized audio files, not Icecast, SHOUTcast, HLS, a continuous encoded broadcast stream, or an external radio-directory feed. Multi-device timing, codec behavior, background playback, gap size, concurrent traffic and bandwidth need real browser/load testing. No gapless or precise synchronization claim is made.

Media checks allow general listeners only the currently playing approved entry while the station is live. The owner may preview submissions for review. Future/pending/completed tracks are not offered on demand to listeners. Song replacement, deletion, explicit flags and creator suspension invalidate eligibility; the media route checks the pinned recording ID and never substitutes another version. Withdrawal/rejection blocks new media requests. Previously delivered/buffered audio cannot be recalled, and connected clients learn of changes on refresh.

## Rights and operator responsibilities

No detector, user checkbox or owner approval guarantees zero infringement. Catalog matches/no-matches are not clearance. Rights in recordings, compositions/lyrics, samples and performers can differ. AI provider outputs and covers require their own terms/permission review. Depending on audience, territory and service design, the station operator may need additional licensing, agreements, reporting and a formal takedown process. The current report form is not a complete legal compliance or royalty-reporting system.

References reviewed:
- U.S. Copyright Office: https://www.copyright.gov/engage/musicians/
- SoundExchange licensing overview: https://www.soundexchange.com/service-provider/licensing-101/

## Radio atmosphere

Private and shared players now use realistic cinematic stills: Deep-space nebula, Golden-hour coast, Mountain sunrise, and Sunlit cedar forest. Three original AI-generated nature assets are bundled as compressed WebP files; the nebula reuses the existing Studio artwork. They are photorealistic artwork, not live camera footage. Visual scene cards complement the existing dropdown. The original scene IDs and saved preferences remain compatible. The default Daily option still rotates deterministically by UTC day. Slow camera drift and restrained light movement pause when the workspace is inactive and respect reduced-motion preferences. Contrast shading keeps station text readable. No external image requests, video downloads or extra audio tracks are added; scene changes do not remount the radio audio player. A failed image falls back to the scene color gradient. The visuals are decorative, not an audio-frequency measurement or recording.

## Verification

`npm run test:radio` exercises schedule/FIFO, pending isolation, rolling cooldowns, safe listener serialization, daily scenes, simulated scene/motion controls and server-position playback, and isolated APIs with CAS conflicts, cross-origin/role checks, rights grants, review/launch controls, exact-source media, reports, replacement/withdrawal, and queue reopening. Existing production/workflow/video tests and a production build are also run.

Browser-control tools were unavailable. Actual appearance, mobile playback/autoplay, multi-device listening, load behavior and station licensing have not been verified. The deployed feature starts offline; launching it is an owner operation after the operator's review.
