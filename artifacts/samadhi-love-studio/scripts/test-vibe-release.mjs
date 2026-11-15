import {build} from 'esbuild';import{mkdirSync}from'node:fs';import{spawnSync}from'node:child_process';
mkdirSync('work/vibe-release-tests',{recursive:true});await build({entryPoints:['tests/vibe-release.test.tsx'],bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external',outfile:'work/vibe-release-tests/tests.mjs'});
const result=spawnSync(process.execPath,['--test','work/vibe-release-tests/tests.mjs'],{stdio:'inherit'});process.exitCode=result.status??1;
