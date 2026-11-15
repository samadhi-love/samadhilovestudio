import {build} from "esbuild";
import {mkdirSync} from "node:fs";
import {spawnSync} from "node:child_process";
mkdirSync("work/visual-generation-tests",{recursive:true});
await build({entryPoints:["tests/visual-generation.test.tsx"],bundle:true,jsx:"automatic",platform:"node",format:"esm",packages:"external",outfile:"work/visual-generation-tests/controls.mjs"});
for(const args of [["--test","work/visual-generation-tests/controls.mjs"],["scripts/test-visual-generation-api.mjs"]]){const result=spawnSync(process.execPath,args,{stdio:"inherit"});if(result.status!==0){process.exitCode=result.status??1;break;}}
