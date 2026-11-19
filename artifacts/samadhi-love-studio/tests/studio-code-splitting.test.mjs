// M3: the recording desk, mix editor and lyric video editor download only when
// opened. A plain `import` of any of them would put them back into the main
// Studio file that must download before the Studio can be used.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const studio=readFileSync(new URL("../app/studio.tsx",import.meta.url),"utf8");
const editors=[["RecordingDesk","./recording-desk"],["Multitrack","./multitrack"],["LyricVideoPro","./lyric-video-pro"]];

for(const [name,path] of editors){
  test(`${name} is loaded on demand, not bundled into the main Studio file`,()=>{
    assert.doesNotMatch(studio,new RegExp(`^import[^\\n]*from "${path.replace(".","\\.")}";`,"m"));
    assert.match(studio,new RegExp(`const ${name} = lazy\\(\\(\\) => import\\("${path.replace(".","\\.")}"\\)\\.then\\(m => \\(\\{ default: m\\.${name} \\}\\)\\)\\);`));
    const source=readFileSync(new URL(`../app/${path.slice(2)}.tsx`,import.meta.url),"utf8");
    assert.match(source,new RegExp(`^export function ${name}\\(`,"m"),`${path} must keep exporting ${name}`);
  });
}
test("every on-demand editor shows a status message while it downloads",()=>{
  for(const [name] of editors){
    const at=studio.indexOf(`<${name} `);
    assert.ok(at>0,`${name} is rendered`);
    assert.equal(studio.slice(Math.max(0,at-29),at),"<Suspense fallback={opening}>",`${name} is inside <Suspense>`);
  }
  assert.match(studio,/const opening = <p className="muted" role="status">/);
});
