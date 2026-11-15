import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const work = path.join(root, "work", "internal-integrity"); mkdirSync(work, { recursive: true });
await build({ stdin: { contents: 'import "./tests/internal-integrity.test.ts"; import "./tests/internal-controls.test.tsx";', resolveDir: root, loader: "tsx" }, jsx: "automatic", bundle: true, platform: "node", format: "esm", packages: "external", outfile: path.join(work, "tests.mjs") });
for (const command of [["--test", path.join(work, "tests.mjs")], [path.join(root, "scripts/verify-internal-integrity-api.mjs")]]) {
  const result = spawnSync(process.execPath, command, { stdio: "inherit" });
  if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
}
