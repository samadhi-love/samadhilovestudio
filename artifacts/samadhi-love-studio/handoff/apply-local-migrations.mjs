import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const config=path.join(root,'dist/server/wrangler.json');
if(!existsSync(config))throw new Error('Build first with npm run build. No database was changed.');
const files=readdirSync(path.join(root,'drizzle')).filter(f=>/^\d+.*\.sql$/.test(f)).sort();
const expected=new Set(files.flatMap(f=>[...readFileSync(path.join(root,'drizzle',f),'utf8').matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?[`"]?(\w+)/g)].map(m=>m[1])));
if(!files.length||!expected.size)throw new Error('No expected source migrations found.');
const base=['--import',path.join(root,'scripts/sites-env.mjs'),path.join(root,'node_modules/wrangler/bin/wrangler.js'),'d1','execute','DB','--local','--config',config,'--persist-to',path.join(root,'.wrangler/state')];
const query=spawnSync(process.execPath,[...base,'--command',"SELECT name FROM sqlite_master WHERE type = 'table'",'--json'],{cwd:root,encoding:'utf8'});
if(query.status!==0){console.error(query.stderr);throw new Error('Cannot inspect local database. No migrations applied.');}
let rows;
try{rows=JSON.parse(query.stdout).flatMap(result=>result.results??[]);}catch{throw new Error('Could not parse local schema inspection; refusing to apply migrations.');}
const present=new Set(rows.map(row=>row.name)),existing=[...expected].filter(t=>present.has(t));
if(existing.length===expected.size){console.log('All expected local tables already exist; no SQL replayed.');process.exit(0);}
if(existing.length){throw new Error('Partially initialized or older local database. Inspect it and apply only pending SQL manually; this fresh-database helper will not reset or replay it.');}
for(const file of files){
  console.log('Applying local migration:',file);
  const result=spawnSync(process.execPath,[...base,'--file',path.join(root,'drizzle',file)],{cwd:root,stdio:'inherit'});
  if(result.status!==0)process.exit(result.status??1);
}
console.log('Fresh local database initialized. This helper never uses remote database execution.');
