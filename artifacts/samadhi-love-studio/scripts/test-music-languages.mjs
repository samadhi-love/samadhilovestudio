import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const out = fileURLToPath(new URL("../../../generated-artifacts/music-languages/", import.meta.url));
mkdirSync(out, { recursive: true });
await build({
  entryPoints: [root + "tests/music-language.test.tsx"], bundle: true,
  jsx: "automatic", platform: "node", format: "esm", packages: "external",
  outfile: out + "tests.mjs",
  plugins: [{ name: "workspace-packages", setup(b) {
    b.onResolve({ filter: /^[^./]/ }, args => ({
      path: args.path.startsWith("node:") ? args.path : require.resolve(args.path), external: true,
    }));
  } }],
});
// Keep package resolution within the app for the bundled tests without copying dependencies.
const result = spawnSync(process.execPath, ["--test", out + "tests.mjs"], {
  cwd: root, stdio: "inherit",
});
process.exitCode = result.status ?? 1;
