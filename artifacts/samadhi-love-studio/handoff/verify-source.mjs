import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(readFileSync(new URL('./SOURCE_MANIFEST.json',import.meta.url),'utf8'));
let failures=0;
for(const file of manifest.files){
  try{
    const bytes=readFileSync(path.join(root,file.path));
    if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw new Error('hash mismatch');
  }catch{console.error('Missing or changed source:',file.path);failures++;}
}
console.log(JSON.stringify({commit:manifest.commit,sourceFiles:manifest.files.length,failures}));
process.exitCode=failures?1:0;
