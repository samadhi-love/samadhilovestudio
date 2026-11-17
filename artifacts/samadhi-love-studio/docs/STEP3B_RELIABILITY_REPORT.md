# Step 3 Part B: saving and recovering work

- **Music and lyric timing:** Studio records a job in D1 before processing. The
  approved inputs and lightweight results live in private R2. Closing the page
  does not cancel the server's work. On startup, and when checking a stale job,
  Studio marks waiting or working jobs without a heartbeat for ten minutes as
  interrupted. It does not replay them. Music drafts remain in My Songs.
- **Try again:** Failed music and lyric timing jobs can be retried explicitly.
  If the last attempt may have reached ElevenLabs, Studio warns that the
  retry may use credits again and waits for confirmation. The retry uses
  the saved input, a new request ID and the current credit quote when
  applicable. Existing reservation and refund rules still apply; an uncertain
  hold is not refunded merely because a retry was requested.
- **Video:** Kept the browser renderer to preserve its fonts, visuals and caption
  layout. Guided WebCodecs exports checkpoint five-second video segments on
  the same device, then remux them with the full soundtrack. Reopening the same
  project and choosing Resume export reuses completed segments. Real-time
  MediaRecorder and the Classic editor must restart an unfinished encode.
  Finished files are checkpointed locally when possible and uploaded immediately
  to private R2 up to the existing 120 MB limit. A closed tab cannot upload;
  reopen to continue. Device storage limits, clearing browser data, switching
  devices, or changing the project can prevent segment reuse. No checkpoints
  are automatically deleted.
- **Autosave:** Simple and Custom Create writing use private per-song drafts,
  saved after roughly two seconds. Existing song and guided-video autosave
  remains. Account draft recovery and on-device recovery both remain available.
  Conflicting edits are rejected with a message rather than silently replacing
  the newer save.
- **Rough timing:** If precise sync is unavailable and lyric text exists, the
  editor can spread the lines across the recording and mark them for review.
  Existing timing is not replaced automatically. If transcription fails and
  there are no words to time, Studio asks for pasted lyrics rather than inventing
  captions.

## Verification

The full offline pass finished with **45/45 verification groups and 27/27
individual test commands** passing (the counts overlap). After final
adjustments, the full workspace typecheck/build and targeted job, language and
audio/caption tests passed. The five new job checks use local SQLite and fake
provider responses. Preview health returned HTTP 200, and both new private
endpoints rejected signed-out access.

No publication, paid provider testing, billing changes, domain changes or user
data deletion. Native phone sleep/resume, stitched video playback, signed-in
production saves and live provider billing have not been verified.
