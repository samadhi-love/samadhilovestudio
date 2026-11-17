# Audio downloads and automatic lyric-video entry

## Where to use

Open My Songs → Song actions → Download. The existing original-format download remains available. Expand More download formats to convert on the device. The same shared controls appear wherever the existing AudioActions component is used, including song editing and Release Tools.

- WAV: 16-bit or 24-bit PCM.
- MP3: 320 kbps, using the existing portable MP3 encoder package when a native encoder is unavailable.
- FLAC: 24-bit lossless relative to the quantized decoded source. Portable standard FLAC verbatim frames provide cross-browser encoding without a codec service. This is not a compressed-size optimization: file size can approach WAV.
- AAC in M4A: 256 kbps, offered conditionally at conversion time through the browser encoder capability check. Unsupported devices receive a clear alternative-format message, not a file with a misleading extension.

WAV/FLAC preserve the sample rate read from the source track using an OfflineAudioContext configured at that rate. No automatic upsampling or replacement of the stored original occurs. Re-encoding MP3/AAC to WAV, FLAC or higher bit depth cannot recover lost quality. Converted files are downloads, not replacement cloud masters; existing master selection and original storage remain unchanged.

Conversions accept mono/stereo input up to 96 MB and 10 minutes, with a decoded PCM estimate capped at 256 MiB. One conversion runs at a time across these download controls. WAV/FLAC rendering yields cooperatively and checks cancellation. Native decoding may finish before cancellation can release its memory; cancelled work never triggers a download. MP3/AAC cancellation propagates to the media output. Input parser resources and object URLs are released. Physical-device memory capacity still limits large exports.

Meditative Vibes has a tone-bed download format selector using the same converter. Its underlying synthesis and cloud audio saves remain 44.1 kHz / 16-bit WAV with a 3-minute render limit. The separate 10-minute live guided player remains available. None of these downloaded audio formats contains browser-spoken guidance; narration scripts can be downloaded separately.

## Automatic lyric-video entry

My Songs → Song actions → Download → Auto lyric video opens the existing Lyric Video Pro editor for that exact song and recording. After the source duration is known, it invokes the existing alignment flow for saved lyrics, or transcription when there are no lyrics. The connected provider and normal failure/source-version checks still apply. Provider requests may consume the account's normal credits. Re-rendering the page does not duplicate an explicitly requested job. Existing timed captions are preserved, with a message directing the user to review or deliberately regenerate them.

The workflow continues through existing timing review, visual selection and video export. The change does not claim automatic distribution or unattended final rendering. Video export remains MP4/WebM according to existing browser capabilities. WAV is a separate audio file, never a video container.

## Verification

`npm run test:audio-downloads` checks:
- independent FFmpeg sample-exact decoding of 16/24-bit mono/stereo WAV and FLAC, including partial FLAC frames and multi-byte frame numbers;
- clipping, padding, invalid lengths and cancellation;
- original download preservation and the actual Auto lyric video component handoff;
- one alignment request (plus the existing optional audit), exact recording identity, required timing review and protection of existing captions;
- mocked codec routing, bitrates, sample-rate configuration, registration, serialization and unsupported AAC behavior.

The FFmpeg checks validate actual WAV/FLAC files. Codec routing fixtures do not establish native MP3/AAC browser encoding, provider output quality, or real browser downloads/video rendering. Existing Meditative Vibes and My Songs regressions, TypeScript and the production build are also checked. No tests write production data.

## Audio readiness checks

The existing download panel now includes **Check audio readiness**. It decodes the original locally using the same bounded decoder, then reports sample peak, RMS, full-scale sample count, quiet opening/tail duration (below -60 dBFS), stereo correlation, level change on mono summation, channel imbalance and DC offset. Silent input and invalid samples are handled explicitly. Processing yields and supports cancellation; a single shared job guard prevents checks and conversions from running concurrently through this module.

Observations do not change audio or block downloads. Quiet passages, panning and stereo/headphone-specific effects can be intentional. This is not LUFS, oversampled true-peak measurement, mastering certification, copyright clearance, or analysis of the converted output. Codec changes can alter peaks; listen and inspect final deliverables separately.

A downloadable JSON report includes the source song/recording reference and timestamp. Reports are device-session results, not cloud-stored approvals. Switching recording versions cancels pending checks and hides the previous report. No original, project or publication state is rewritten.
