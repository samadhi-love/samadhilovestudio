import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'work/checkpoint-tests');mkdirSync(out,{recursive:true});
const objects=new Map();
const original={songs:[{id:'keep',notes:{lyrics:'Preserve every word'},audioId:'immutable-recording'}],templates:[{id:'template-keep'}],voices:[{id:'voice-keep'}]};
const state={row:{owner:'owner',content:JSON.stringify(original),revision:4},stations:[{id:'subscriber',owner:'owner',trackIds:'["keep"]'}],env:{BUCKET:{async head(key){return objects.has(key)?{}:null},async put(key,value){if(!objects.has(key))objects.set(key,value);return {}}}}};
globalThis.__checkpoint=state;
const mocks={env:'export const env=globalThis.__checkpoint.env;',schema:'export const studios={owner:"owner",revision:"revision"};export const listenerStation={owner:"owner",kind:"station"};',orm:'export const eq=(field,value)=>[field,value];export const and=(...conditions)=>conditions;',db:`
export function getDb() {
  const s = globalThis.__checkpoint;
  return {
    select() {
      return { from(table) { return { where() { return {
        get: async () => structuredClone(s.row),
        then(resolve) { return Promise.resolve(table.kind === 'station' ? structuredClone(s.stations) : []).then(resolve); }
      }; } }; } };
    },
    update() {
      return { set(values) { return { where(conditions) { return {
        returning: async () => {
          if (conditions.some(([key, value]) => s.row[key] !== value)) return [];
          Object.assign(s.row, values); return [{ revision: s.row.revision }];
        }
      }; } }; } };
    }
  };
}
`};
await build({entryPoints:[path.join(root,'app/api/studio/store.ts')],bundle:true,platform:'node',format:'esm',outfile:path.join(out,'store.mjs'),plugins:[{name:'mock-db',setup(b){b.onResolve({filter:/cloudflare:workers|drizzle-orm$|\/db$|db\/schema$/},a=>({path:a.path==='cloudflare:workers'?'env':a.path==='drizzle-orm'?'orm':a.path.endsWith('/schema')?'schema':'db',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
const {writeStudio}=await import(pathToFileURL(path.join(out,'store.mjs')).href);
let checks=0;const check=(v,m)=>{assert(v,m);checks++};
check(objects.size===0,'reading code never mutates live or fixture data');
let saved=await writeStudio('owner',4,JSON.stringify({...original,change:'new version'}));check(saved.revision===5,'optimistic write succeeds');
const checkpoint=JSON.parse(objects.get('checkpoints/owner/before-project-workflow-v2.json'));
check(JSON.stringify(checkpoint.data)===JSON.stringify(original),'pre-workflow snapshot preserves complete original metadata');
check(JSON.stringify(checkpoint.stations)===JSON.stringify(state.stations),'subscriber grants included');
check(checkpoint.revision===4,'checkpoint records the original revision');
const preserved=objects.get('checkpoints/owner/before-project-workflow-v2.json');
await writeStudio('owner',5,JSON.stringify({...original,change:'another version'}));check(objects.get('checkpoints/owner/before-project-workflow-v2.json')===preserved,'backup never overwritten by later edits');
const before=JSON.stringify(state.row);saved=await writeStudio('owner',4,'{}');check(!saved&&JSON.stringify(state.row)===before,'stale writes preserve current row');
state.env.BUCKET=null;await assert.rejects(writeStudio('owner',6,'{}'),/backup storage/);check(JSON.stringify(state.row)===before,'missing backup storage prevents changes');
console.log(JSON.stringify({checkpointChecks:checks,status:'passed',storage:'isolated fake DB and R2; no live changes'}));
