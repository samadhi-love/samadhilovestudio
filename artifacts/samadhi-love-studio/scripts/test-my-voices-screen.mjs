import {build} from "esbuild";
import {fileURLToPath} from "node:url";
import {mkdirSync} from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url)),work=path.join(root,"work","my-voices-screen-tests");mkdirSync(work,{recursive:true});
await build({entryPoints:[path.join(root,"tests/my-voices-screen.test.tsx")],bundle:true,jsx:"automatic",platform:"node",format:"esm",packages:"external",outfile:path.join(work,"tests.mjs")});
const result=spawnSync(process.execPath,["--test",path.join(work,"tests.mjs")],{stdio:"inherit"});process.exitCode=result.status??1;
