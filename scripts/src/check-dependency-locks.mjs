import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

export function checkDependencyLocks(root) {
  // These are package roots, not cache folders or user-media directories.
  const roots = [root, join(root, "scripts")];
  for (const group of ["artifacts", "lib", "lib/integrations"]) {
    const folder = join(root, group);
    if (!existsSync(folder)) continue;
    for (const item of readdirSync(folder, { withFileTypes: true })) {
      if (item.isDirectory() && !item.name.startsWith(".")) roots.push(join(folder, item.name));
    }
  }
  const obsolete = roots.flatMap(folder =>
    ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock"]
      .map(name => join(folder, name)).filter(path => existsSync(path)));
  if (obsolete.length) throw new Error("Conflicting dependency lockfile found. This workspace uses pnpm-lock.yaml only. Remove obsolete npm/Yarn dependency manifests before building.");
  if (!existsSync(join(root, "pnpm-lock.yaml"))) throw new Error("The authoritative pnpm-lock.yaml is missing.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    checkDependencyLocks(fileURLToPath(new URL("../../", import.meta.url)));
    console.info("Dependency source check passed: pnpm-lock.yaml is the sole workspace lockfile.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
