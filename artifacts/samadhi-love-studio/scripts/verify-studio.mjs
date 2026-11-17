import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const checks = [
  ["Mantra phrase repetition, echo, microphone cleanup and safe recording saves", ["scripts/test-mantra.mjs"]],
  ["Singing languages, dialects and prompt interpretation", ["scripts/test-music-languages.mjs"]],
  ["Vibe matching, stem motion and caption release kits", ["scripts/test-vibe-release.mjs"]],
  ["AI visual generation, durable job recovery and private media", ["scripts/test-visual-generation.mjs"]],
  ["Style DNA, bounded song maps and genuine stem analysis", ["scripts/test-style-dna.mjs"]],
  ["Unified creator, world fusion and social-video presets", ["scripts/test-creator-workspace.mjs"]],
  ["Brand logos, musical advertisements and product footage", ["scripts/test-brand-ad-workspace.mjs"]],
  ["Party files, real 30-minute audio and non-destructive section editing", ["scripts/test-party-files.mjs"]],
  ["Song deletion, 14-day recovery and durable cleanup", ["scripts/test-song-deletion.mjs"]],
  ["Song deletion API ownership and deadline validation", ["scripts/verify-song-deletion-api.mjs"]],
  ["Frequency tools and removal of guided meditations", ["scripts/test-meditative.mjs"]],
  ["Public homepage and separate private Studio", ["scripts/test-public-home.mjs"]],
  ["Guided screens, legacy links and local video looks", ["scripts/test-studio-consolidation.mjs"]],
  ["TypeScript", ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"]],
  ["Member registration and verified subscription billing", ["scripts/test-membership-billing.mjs"]],
  ["Member plans and registration controls", ["scripts/test-membership-controls.mjs"]],
  ["Credits, usage, account isolation and production limits", ["scripts/test-credits.mjs"]],
  ["Credit confirmation and account controls", ["scripts/test-credit-controls.mjs"]],
  ["Start-a-song presets and genre choices", ["scripts/test-song-presets.mjs"]],
  ["Genre selection and generation handoff", ["scripts/test-genres.mjs"]],
  ["Audio downloads, readiness and non-destructive opening repair", ["scripts/test-audio-downloads.mjs"]],
  ["Song opening and playback recovery", ["scripts/test-song-opening.mjs"]],
  ["Automatic song duration and creation controls", ["scripts/test-track-duration.mjs"]],
  ["Song actions, Delete, sorting and automatic saves", ["scripts/test-song-library.mjs"]],
  ["Project workflow and checkpoints", ["scripts/test-project-workflow.mjs"]],
  ["Private sessions, voice recordings and rights", ["scripts/test-voice-rights.mjs"]],
  ["Community publishing, moderation and Party ownership", ["scripts/verify-community-integrity.mjs"]],
  ["Stems, beats and production controls", ["scripts/test-production-refinements.mjs"]],
  ["Shared audio visual timeline and MIDI", ["scripts/test-av-timeline.mjs"]],
  ["Radio scheduling and permissions", ["scripts/test-radio.mjs"]],
  ["Lyric Video and templates", ["scripts/test-lyric-video-pro.mjs"]],
  ["Lyric Video isolated APIs", ["scripts/verify-lyric-pro-api.mjs"]],
  ["Malformed inputs, audio versions and recovery", ["scripts/test-internal-integrity.mjs"]],
  ["Party Mix", ["scripts/test-party.mjs"]],
  ["Lyric notation and directions", ["scripts/test-lyric-notation.mjs"]],
  ["Photo-story advertisements", ["scripts/test-ad-photo-story.mjs"]],
  ["Non-destructive waveform crop and cut", ["scripts/test-song-audio-edit.mjs"]],
  ["Audit regression repairs", ["scripts/test-audit-repairs.mjs"]],
  ["Mobile quick navigation and project selection", ["scripts/test-mobile-studio.mjs"]],
  ["Start Play Share creator journey", ["scripts/test-creative-play.mjs"]],
  ["Production build", ["scripts/run-framework.mjs", "build"]],
];
const results = [];
for (const [name, args] of checks) {
  console.log(`\nChecking ${name}…`);
  const began = Date.now();
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit", timeout: 180_000 });
  results.push({ name, passed: result.status === 0, seconds: Math.round((Date.now() - began) / 100) / 10 });
  if (result.status !== 0) process.exitCode = 1;
}
const output = path.join(root, "work", "studio-verification"); mkdirSync(output, { recursive: true });
const report = { at: new Date().toISOString(), passed: results.length === checks.length && results.every(r => r.passed), results,
  scope: "Local source, simulated DOM/audio, isolated API/storage/provider fixtures and a genuine 30-minute MP3 mixer/encoder run verified with FFprobe/FFmpeg using synthetic authorized audio. No live user records, credentials, provider credits or station state changed.",
  notVerified: ["real browsers and physical devices", "live paid-provider processing and generated musical quality", "live paid-provider image/video access, charges and visual quality", "production account save/reopen/export", "production user-data migration", "continuous external radio broadcasting", "native uploaded-video decoding, PNG rasterization, H.264/AAC encoding and exported playback", "native microphone hardware, mobile Party Files performance and multi-hour renders", "physical-device logo, ad-video and sharing flows", "owner-approved retention scheduler activation (currently disabled) and actual scheduled cleanup"] };
writeFileSync(path.join(output, "latest.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
