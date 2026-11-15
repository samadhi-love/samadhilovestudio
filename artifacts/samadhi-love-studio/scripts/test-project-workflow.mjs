import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const work = path.join(root, "work", "project-workflow-tests"); mkdirSync(work, { recursive: true });
await build({ stdin: { contents: 'import "./tests/project-workflow.test.ts"; import "./tests/draft-recovery.test.tsx";', resolveDir: root, loader: "tsx" }, bundle: true, jsx: "automatic", platform: "node", format: "esm", packages: "external", outfile: path.join(work, "tests.mjs") });
const result = spawnSync(process.execPath, ["--test", path.join(work, "tests.mjs")], { stdio: "inherit" });
process.exitCode = result.status ?? 1;
if (!process.exitCode) for (const script of ["verify-project-workflow-api.mjs", "verify-workflow-checkpoints.mjs"]) {
  const checked = spawnSync(process.execPath, [path.join(root, "scripts", script)], { stdio: "inherit" });
  if (checked.status !== 0) { process.exitCode = checked.status ?? 1; break; }
}
