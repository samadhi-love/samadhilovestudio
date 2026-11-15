import {build} from "esbuild";
import {fileURLToPath} from "node:url";
import {mkdirSync} from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
const root=fileURLToPath(new URL("../",import.meta.url)),work=path.join(root,"work","voice-rights-tests");mkdirSync(work,{recursive:true});
await build({stdin:{contents:'import "./tests/voice-rights.test.ts";import "./tests/voice-rights-controls.test.tsx";',resolveDir:root,loader:"tsx"},bundle:true,jsx:"automatic",format:"esm",platform:"node",packages:"external",outfile:path.join(work,"tests.mjs")});
for(const args of [["--test",path.join(work,"tests.mjs")],[path.join(root,"scripts/verify-voice-rights-api.mjs")]]){const r=spawnSync(process.execPath,args,{stdio:"inherit"});if(r.status!==0){process.exitCode=r.status??1;break;}}
