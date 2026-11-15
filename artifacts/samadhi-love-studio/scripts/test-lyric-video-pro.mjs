import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/, "");
const scratch = path.join(root, "work", "lyric-pro-unit-tests");
mkdirSync(scratch, { recursive: true });
await build({
  stdin: {
    contents:
      'import "./tests/lyric-signature-controls.test.tsx"; import "./tests/lyric-signature.test.ts"; import "./tests/lyric-video-pro.test.ts"; import "./tests/lyric-video-landing.test.tsx"; import "./tests/lyric-visual-template.test.ts"; import "./tests/pasted-lyrics-controls.test.tsx";',
    resolveDir: root,
    loader: "tsx",
  },
  jsx: "automatic",
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: path.join(scratch, "unit-tests.mjs"),
  packages: "external",
});
const result = spawnSync(
  process.execPath,
  ["--test", path.join(scratch, "unit-tests.mjs")],
  { stdio: "inherit" },
);
process.exitCode = result.status;
