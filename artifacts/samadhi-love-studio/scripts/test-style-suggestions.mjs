import {build} from "esbuild";
import {fileURLToPath} from "node:url";
import {mkdirSync} from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url)),work=path.join(root,"work","style-tests");mkdirSync(work,{recursive:true});
await build({entryPoints:[path.join(root,"tests/style-suggestions.test.ts")],bundle:true,platform:"node",format:"esm",packages:"external",outfile:path.join(work,"tests.mjs")});
const result=spawnSync(process.execPath,["--test",path.join(work,"tests.mjs")],{stdio:"inherit"});process.exitCode=result.status??1;
