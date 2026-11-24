// Paints the star family portraits for SAMADHI LOVE with FLUX 1.1 Pro Ultra on fal.ai
// (approved by Samadhi: 3 per family, 18 in all, about $0.06 each).
//
//   FAL_KEY must be set in Replit Secrets.   Run:  node scripts/paint-star-families.mjs
//
// Pictures go to public/candidates/<family>-portrait/<family>-<n>.jpg and are added to
// public/candidates/candidates.json, so they show in "Choose your pictures" at /owner/choose.
// Nothing is deleted or replaced: a picture that already exists is skipped, so running it
// again only paints what is missing (and never pays twice for the same picture).
// These are our own originals, written from the teachings' descriptions; no outside image is used as a model.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "candidates");
const listFile = path.join(dir, "candidates.json");
const MODEL = "fal-ai/flux-pro/v1.1-ultra";

const style = "Lifelike fine-art painting with photographic realism, soft cinematic starlight, rich deep blues, violets and gold, " +
  "serene, kind and dignified expression, peaceful and uplifting, respectful sacred atmosphere, highly detailed, " +
  "no text, no letters, no logos, no weapons, nothing frightening.";

const families = {
  lyrans: {
    name: "Lyrans",
    prompts: [
      "A tall, noble Lyran being of light with warm golden skin and a gentle, lion-like grace: a softly broad nose, wise amber eyes and a flowing golden mane of hair framing a kind human face. Wearing simple ivory and gold robes, standing on a golden plateau at dusk under a vast starry sky where the brilliant blue-white star Vega shines.",
      "Close portrait of a Lyran elder, tall and golden, with gentle lion-like features in a calm human face, a long golden mane streaked with light, amber eyes full of warmth. A soft halo of golden light behind the head, deep starfield and the small constellation Lyra glowing above.",
      "A Lyran man and woman, tall and golden-skinned with graceful lion-like features and flowing golden manes, standing side by side in white and gold garments beside a crystal temple on their home world, the radiant star Vega rising in a violet sky.",
    ],
  },
  pleiadians: {
    name: "Pleiadians",
    prompts: [
      "A radiant Pleiadian woman, very human-like and beautiful, with luminous fair skin, long flowing light-golden hair and clear blue eyes, wearing soft white and pale-blue garments, standing in a flowering meadow on a lush blue-green world; above her the seven bright blue stars of the Pleiades glow in a soft nebula.",
      "Close portrait of a Pleiadian man, human-like with a gentle radiant face, shoulder-length light hair and kind blue eyes, a soft glow of heart light around him, dressed in a simple pale silver tunic, the blue Pleiades cluster and wisps of blue nebula behind.",
      "Two Pleiadians, a man and a woman, human-like and radiant with light hair and serene smiles, walking through a garden of glowing crystal flowers beside a calm lake, the sky full of soft blue starlight and the seven sisters stars reflected in the water.",
    ],
  },
  sirians: {
    name: "Sirians",
    prompts: [
      "A tall, serene Sirian being with smooth skin of a soft aqua-blue tint, dark gentle almond eyes and a calm human-like face, wearing white linen robes with fine gold collar and armbands in the spirit of ancient Egypt, standing on the steps of a white stone temple by a luminous turquoise ocean; in the sky shines the brilliant white star Sirius with its tiny companion.",
      "Close portrait of a Sirian woman, tall and graceful with faintly aqua-blue skin and dark wise eyes, a simple gold circlet on her brow, white linen and gold, soft light from a brilliant white double star reflected on calm water behind her.",
      "A tall aqua-skinned Sirian teacher in white and gold standing waist-deep in clear glowing turquoise water at twilight, dolphins swimming peacefully nearby, a pyramid-shaped temple of white stone on the shore and the dazzling star Sirius above the horizon.",
    ],
  },
  arcturians: {
    name: "Arcturians",
    prompts: [
      "A slender, gentle Arcturian being with smooth blue-toned skin, large dark almond-shaped eyes full of kindness and small delicate features, wearing a simple flowing robe of soft violet light, standing in a healing chamber of clear crystal and glowing sacred geometry; through a high window the great orange star Arcturus glows.",
      "Close portrait of an Arcturian healer, slender with soft blue skin and large luminous dark eyes, a calm and loving expression, hands raised gently with violet healing light between them, a faint pattern of sacred geometry glowing in the air behind.",
      "Three slender blue-skinned Arcturians with large gentle eyes standing peacefully on a violet crystalline world at twilight, wearing pale silver robes, a giant soft orange star filling part of the sky, glowing geometric crystal towers in the distance.",
    ],
  },
  andromedans: {
    name: "Andromedans",
    prompts: [
      "A tall, graceful Andromedan being, human-like with pale luminous skin, long silver-white hair and deep blue eyes, wearing flowing silver and midnight-blue garments, standing on a high crystal terrace; the vast spiral of the Andromeda galaxy fills the night sky behind.",
      "Close portrait of an Andromedan woman, tall and serene with pale glowing skin, silver-white hair and deep sapphire eyes, a calm free spirit, soft spiral light of a great galaxy reflected in her eyes and around her.",
      "A tall Andromedan elder with silver-white hair and pale luminous skin, in long silver robes, standing beside a calm sea of starlight on a peaceful world, gazing up at an enormous glowing spiral galaxy that stretches across the whole sky.",
    ],
  },
  "orions-of-light": {
    name: "Orions of light",
    prompts: [
      "A wise Orion being of light, human-like with a calm weathered face, kind grey eyes and dark hair touched with silver, wearing deep-blue robes with a soft golden glow, standing where night meets dawn on a mountain ridge; above, the three stars of Orion's Belt shine and the pink Orion Nebula glows below them.",
      "Close portrait of a young Orion healer, human-like and luminous, gentle dark eyes, one side of her face in soft shadow and the other in warm golden light, symbolising wisdom earned through the shadow, the glowing rose and teal Orion Nebula behind her.",
      "A gathering of Orion beings of light, human-like men and women of many shades in simple blue and gold robes, standing in a circle of soft light in a stone sanctuary open to the night sky, the constellation Orion and its glowing nebula overhead.",
    ],
  },
};

const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
if (!key) {
  console.error("FAL_KEY is not set. Add your fal.ai key in Replit Secrets as FAL_KEY, then run this again.");
  process.exit(1);
}

function readList() {
  if (!existsSync(listFile)) return { wrap: false, items: [] };
  const raw = JSON.parse(readFileSync(listFile, "utf8"));
  return Array.isArray(raw) ? { wrap: false, items: raw } : { wrap: true, raw, items: raw.images || [] };
}
function writeList(list) {
  const out = list.wrap ? { ...list.raw, images: list.items } : list.items;
  writeFileSync(listFile, JSON.stringify(out, null, 2) + "\n");
}

// A lighter 960px copy for the chooser and pages, if ImageMagick is on the machine; otherwise the original is used.
function smallCopy(full) {
  const small = full.replace(/\.jpg$/, ".w960.jpg");
  if (existsSync(small)) return;
  for (const cmd of ["magick", "convert"]) {
    const r = spawnSync(cmd, [full, "-resize", "960x", "-quality", "82", "-strip", small]);
    if (r.status === 0) return;
  }
}

async function paint(prompt) {
  const res = await fetch(`https://fal.run/${MODEL}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: `${prompt} ${style}`, aspect_ratio: "16:9", num_images: 1, output_format: "jpeg", enable_safety_checker: true, safety_tolerance: "2", raw: false }),
  });
  if (!res.ok) throw new Error(`fal answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error("fal returned no picture");
  const img = await fetch(url);
  if (!img.ok) throw new Error(`could not download the picture (${img.status})`);
  return { bytes: Buffer.from(await img.arrayBuffer()), seed: data.seed };
}

const list = readList();
let painted = 0, skipped = 0, failed = 0;
for (const [slug, fam] of Object.entries(families)) {
  const folder = `${slug}-portrait`;
  mkdirSync(path.join(dir, folder), { recursive: true });
  for (let i = 0; i < fam.prompts.length; i++) {
    const rel = `candidates/${folder}/${slug}-${i + 1}.jpg`;
    const full = path.join(root, "public", rel);
    const known = list.items.some((it) => String(it.file || "").replace(/^\/+|^public\//g, "") === rel);
    if (existsSync(full)) {
      skipped++;
      smallCopy(full);
      if (known) continue;
    } else {
      try {
        const { bytes, seed } = await paint(fam.prompts[i]);
        writeFileSync(full, bytes);
        smallCopy(full);
        painted++;
        console.log(`painted ${rel}${seed ? ` (seed ${seed})` : ""}`);
      } catch (err) {
        failed++;
        console.error(`could not paint ${rel}: ${err.message}`);
        continue;
      }
    }
    if (!known) {
      list.items.push({
        file: rel,
        subject: fam.name,
        subject_slug: folder,
        title: `${fam.name}, portrait ${i + 1}`,
        artist: "AI-painted artwork for SAMADHI LOVE, as the teachings describe them",
        licence: "Original artwork made for SAMADHI LOVE (FLUX 1.1 Pro Ultra)",
        changes: "None",
        source: "/teachings/" + slug,
      });
      writeList(list);
    }
  }
}
console.log(`Done: ${painted} painted, ${skipped} already there, ${failed} failed.`);
if (failed) process.exitCode = 1;
