import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url)),work=path.join(root,"work","meditative-tests");mkdirSync(work,{recursive:true});
await build({stdin:{contents:'import "./tests/meditative.test.ts";import "./tests/meditative-controls.test.tsx";',resolveDir:root,loader:"tsx"},bundle:true,jsx:"automatic",platform:"node",format:"esm",packages:"external",outfile:path.join(work,"tests.mjs")});
for(const args of [["--test",path.join(work,"tests.mjs")],[path.join(root,"scripts/verify-meditative-api.mjs")]]){const r=spawnSync(process.execPath,args,{stdio:"inherit"});if(r.status!==0){process.exitCode=r.status??1;break;}}
