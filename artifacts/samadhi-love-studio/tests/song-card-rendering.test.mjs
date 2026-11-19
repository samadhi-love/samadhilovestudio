// M2: song cards re-draw only when a value they show changes, not on every
// Studio update (a toast, a modal, typing in search).
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";
import {JSDOM} from "jsdom";

const dom=new JSDOM("<!doctype html><div id=root></div>",{pretendToBeVisual:true,url:"https://studio.test/"});
for(const key of ["window","document","navigator","HTMLElement","Node","MutationObserver","getComputedStyle","requestAnimationFrame","cancelAnimationFrame"])
  if(!(key in globalThis))Object.defineProperty(globalThis,key,{value:key==="window"?dom.window:dom.window[key],configurable:true,writable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const directory="generated-artifacts/tests/song-card-rendering";
mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`
export {SongCard,SongHubProvider} from "./app/song-card";
export {freshSong} from "./app/studio-data";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/bundle.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"error",loader:{".css":"empty"}});
const {SongCard,SongHubProvider,freshSong}=await import(`../${directory}/bundle.mjs`);
const React=(await import("react")).default,{act}=await import("react"),{createRoot}=await import("react-dom/client");

// Count real executions of the card's own render code (memo or not).
let renders=0;
const Card=SongCard.type?Object.assign({},SongCard,{type:function CountedSongCard(props){renders++;return SongCard.type(props);}})
  :function CountedSongCard(props){renders++;return SongCard(props);};
const songs=Array.from({length:100},(_,i)=>freshSong(`song-${i}`,`Song ${i}`,i));
const hubFor=busy=>({busy,folders:[],stemsConnected:false,preview:"",setPreview(){},expanded:"",setExpanded(){},
  save:async()=>true,action(){},archive:async()=>true,duplicate:async()=>true,publish:async()=>{},playlist:async()=>true});
let setToast,setHub,setList;
function Harness(){
  const [,toast]=React.useState(0),[hub,hub$]=React.useState(()=>hubFor(false)),[list,list$]=React.useState(songs);
  setToast=toast;setHub=hub$;setList=list$;
  return React.createElement(SongHubProvider,{value:hub},list.map(song=>React.createElement(Card,{song,key:song.id})));
}
const root=createRoot(document.getElementById("root"));
await act(async()=>{root.render(React.createElement(Harness));});

test("an unrelated Studio update re-draws no song cards",async()=>{
  renders=0;
  await act(async()=>{setToast(n=>n+1);});
  console.log(`  unrelated update: ${renders} of 100 cards re-drawn`);
  assert.equal(renders,0);
});
test("editing one song re-draws only that card",async()=>{
  renders=0;
  await act(async()=>{setList(list=>list.map(s=>s.id==="song-7"?{...s,name:"Edited"}:s));});
  console.log(`  one song edited: ${renders} of 100 cards re-drawn`);
  assert.equal(renders,1);
  assert.match(document.getElementById("root").textContent,/Edited/);
});
test("a change cards do show (busy) still reaches every card",async()=>{
  renders=0;
  await act(async()=>{setHub(hubFor(true));});
  assert.equal(renders,100);
});
test("the Studio passes one memoized hub whose actions always call the newest version",()=>{
  const studio=readFileSync(new URL("../app/studio.tsx",import.meta.url),"utf8");
  assert.match(studio,/const songHub = useMemo\(\(\) => \(\{/);
  assert.match(studio,/<SongHubProvider value=\{songHub\}>/);
  assert.match(studio,/hubActions\.current = \{ save: saveSong, action: songAction, archive: archiveSong, duplicate: duplicateSong, publish: publishSong, playlist: addSongPlaylist, unlist: unlistSong \};/);
  assert.match(studio,/const folders = data\.folders \?\? noFolders;/);
});
