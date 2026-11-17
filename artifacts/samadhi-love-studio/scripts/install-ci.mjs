import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// This imported app now belongs to the pnpm workspace. An npm ci here would
// recreate a second, conflicting dependency tree and requires an obsolete lock.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const result = spawnSync("pnpm", ["install", "--frozen-lockfile"], {
  cwd: root, stdio: "inherit",
});
if (result.error) throw new Error("Workspace installation could not start. Install pnpm and run pnpm install --frozen-lockfile from the workspace root.");
process.exitCode = result.status ?? 1;
