#!/usr/bin/env node
/**
 * One-time, owner-approved: creates 7 original photo-realistic lyric-video
 * backgrounds with fal.ai (FLUX 1.1 Pro Ultra, about $0.06 each).
 *
 *   node scripts/generate-scene-photos.mjs           # make the missing photos
 *   node scripts/generate-scene-photos.mjs --dry-run # show what would be made; no cost
 *
 * - Each photo is requested ONCE. A paid request is never retried automatically;
 *   if one fails, the script reports it and moves on.
 * - Photos that already exist are skipped (re-running costs nothing for them).
 * - Provenance is written to public/lyric-art/photo/SOURCES.json (prompt, model,
 *   fal request ID, date) so every picture can be traced.
 * - Prompts ask for original scenes with no text, logos or brand signs. The
 *   Statue of Liberty and the US flag are public domain.
 */
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { findFalKey } from "./storage/runtime.mjs";

const model = "fal-ai/flux-pro/v1.1-ultra";
const outDir = new URL("../public/lyric-art/photo/", import.meta.url);
const common = "photorealistic, professional photograph, natural light, high detail, centered composition with the main subject in the middle third, no text, no words, no logos, no watermarks, no brand signs";
export const scenePhotos = {
  balloons: "Colorful helium balloons in red, yellow, blue, green, pink and purple floating upward into a bright blue summer sky with soft white clouds, joyful children's birthday party mood, warm sunlight, gentle bokeh",
  meadow: "A vivid rainbow arching over a lush green meadow full of colorful wildflowers, a few butterflies, fluffy white clouds in a blue sky, soft morning sunlight, cheerful and gentle, no people",
  undersea: "Underwater photograph of a bright, healthy coral reef with friendly colorful tropical fish, sunbeams shining down through clear turquoise water, small rising bubbles, cheerful and calm, no divers",
  lullaby: "A large glowing crescent moon in a deep blue and violet night sky full of twinkling stars above soft moonlit clouds and a calm sleepy countryside with gentle hills, peaceful bedtime mood",
  flag: "A large American flag with 50 stars and 13 red and white stripes waving dramatically across the top half of the frame in the foreground, close to the camera and slightly soft, with the White House, its fountain, green lawn and red flower beds sharp in the lower half of the background, cloudy blue sky, patriotic and bright",
  liberty: "Aerial view at golden hour of the Statue of Liberty on its star-shaped granite base on Liberty Island, green patina statue in the left-center, the calm harbor water with a few small boats, the Manhattan skyline glowing in warm sunset light on the horizon, soft orange and pink clouds",
  nycnight: "The New York City Manhattan skyline at blue hour seen from across the Hudson River, skyscrapers lit with warm golden and white lights, a tall art-deco spire tower in the center, colorful light reflections shimmering on the calm river water, deep blue sky",
};

async function exists(url) { try { await access(url); return true; } catch { return false; } }

async function generate(key, prompt) {
  const headers = { Authorization: `Key ${key}`, "Content-Type": "application/json" };
  const submit = await fetch(`https://queue.fal.run/${model}`, { method: "POST", headers,
    body: JSON.stringify({ prompt: `${prompt}. ${common}`, aspect_ratio: "16:9", num_images: 1, output_format: "jpeg", safety_tolerance: "2" }) });
  if (!submit.ok) throw new Error(`fal.ai refused the request (HTTP ${submit.status}).`);
  const queued = await submit.json();
  if (!queued.request_id || !queued.status_url || !queued.response_url) throw new Error("fal.ai did not return a request reference.");
  const deadline = Date.now() + 5 * 60_000;
  for (;;) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${queued.request_id}. It may still finish on fal.ai; not retried.`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const status = await (await fetch(queued.status_url, { headers })).json(); // status checks are free
    if (status.status === "COMPLETED") break;
    if (status.status && !["IN_QUEUE", "IN_PROGRESS"].includes(status.status)) throw new Error(`fal.ai status ${status.status}.`);
  }
  const result = await (await fetch(queued.response_url, { headers })).json();
  const image = result.images?.[0];
  if (!image?.url) throw new Error("fal.ai finished without an image (it may have been blocked by the safety check).");
  if (result.has_nsfw_concepts?.[0]) throw new Error("The safety check flagged this image; it was not saved.");
  const download = await fetch(image.url);
  if (!download.ok) throw new Error(`The finished image could not be downloaded (HTTP ${download.status}).`);
  return { requestId: queued.request_id, bytes: new Uint8Array(await download.arrayBuffer()), width: image.width, height: image.height };
}

const dryRun = process.argv.includes("--dry-run");
const key = findFalKey();
if (!key && !dryRun) { console.error("No fal.ai key found (FAL_KEY / Fal_key). Nothing was requested."); process.exit(1); }
await mkdir(outDir, { recursive: true });
const sourcesUrl = new URL("SOURCES.json", outDir);
const sources = await exists(sourcesUrl) ? JSON.parse(await readFile(sourcesUrl, "utf8")) : {};
const report = [];
for (const [id, prompt] of Object.entries(scenePhotos)) {
  const file = new URL(`${id}.jpg`, outDir);
  if (await exists(file)) { report.push(`${id}: already exists, skipped (no cost)`); continue; }
  if (dryRun) { report.push(`${id}: would be created (~$0.06)`); continue; }
  try {
    const made = await generate(key, prompt);
    await writeFile(file, made.bytes);
    sources[id] = { file: `/lyric-art/photo/${id}.jpg`, model, prompt: `${prompt}. ${common}`, falRequestId: made.requestId, width: made.width, height: made.height, createdAt: new Date().toISOString(), rights: "Original AI-generated image created for Versual Studio (fal.ai output terms). Statue of Liberty and US flag are public domain." };
    await writeFile(sourcesUrl, JSON.stringify(sources, null, 2) + "\n");
    report.push(`${id}: created (${made.width}x${made.height}, request ${made.requestId})`);
  } catch (error) {
    report.push(`${id}: FAILED, not retried — ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
console.log(report.join("\n"));
