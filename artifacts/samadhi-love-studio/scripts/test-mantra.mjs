import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const outfile=root+"work/mantra-tests/tests.mjs";
await build({entryPoints:[root+"tests/mantra.test.tsx"],bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic",outfile});
const result=spawnSync(process.execPath,["--test",outfile],{cwd:root,stdio:"inherit"});
process.exitCode=result.status??1;
