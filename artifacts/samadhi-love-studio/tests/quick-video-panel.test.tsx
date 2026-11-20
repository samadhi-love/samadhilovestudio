import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {LyricVideoPro} from "../app/lyric-video-pro";
import {freshSong} from "../app/studio-data";
import {newProSettings} from "../app/lyric-pro-data";
import {lyricBackgroundGroups} from "../app/lyric-background-picker";
import {videoThemes} from "../app/lyric-video-data";
import {suggestedThemes} from "../app/quick-video-panel";
import type {ElevenLabsKey} from "../app/elevenlabs-key";

const q=(id:string)=>document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const settle=async()=>{for(let i=0;i<6;i++)await act(async()=>{await new Promise(r=>setTimeout(r,0));});};

async function open(options:{cues?:{text:string;time:number;end:number}[];recovery?:boolean;instrumental?:boolean;name?:string;prompt?:string}={}){
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,HTMLDetailsElement:dom.window.HTMLDetailsElement,Image:dom.window.Image,localStorage:dom.window.localStorage,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},IS_REACT_ACT_ENVIRONMENT:true});
  Object.defineProperty(document,"fonts",{value:{load:async()=>[]}});
  window.matchMedia=(()=>({matches:false,addEventListener(){},removeEventListener(){}})) as any;dom.window.HTMLCanvasElement.prototype.getContext=(()=>null) as any;
  const oldFetch=globalThis.fetch;const syncs:Record<string,any>[]=[];
  globalThis.fetch=(async(url:string,init?:RequestInit)=>{
    const u=String(url);
    if(u==="/api/studio/credits")return Response.json({funding:"own",credits:0,enabled:true});
    if(u==="/api/studio/jobs"&&init?.method==="POST"){const queued=JSON.parse(String(init.body));syncs.push(queued.input);if(queued.input.mode==="audit")return Response.json({error:"skip"},{status:503});return Response.json({cues:[{text:"Love is here",time:0,end:5}],engine:"fixture alignment",warnings:[]});}
    if(u.startsWith("/api/studio/lyric-sync/recovery"))return Response.json(options.recovery?{recovery:{cues:[{text:"Recovered line",time:0,end:4}],engine:"Recovered"}}:{});
    if(u==="/api/studio/lyric-project"&&init?.method==="PUT"){const input=JSON.parse(String(init.body));return Response.json({project:{...input.project,pro:{...input.project.pro,updatedAt:"2026-11-20T12:00:00Z"}},data:{songs:[],templates:[]},revision:1});}
    return Response.json({versions:[],workspace:""});
  }) as typeof fetch;
  const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
  const base={...freshSong("selected",options.name??"Selected song",0),audioId:"exact-recording",audioFormat:"mp3" as const,...(options.instrumental?{creationKind:"instrumental" as const}:{})};
  base.notes.lyrics="Love is here";base.notes.prompt=options.prompt??"";
  const song={...base,lyricVideo:{theme:"cosmic" as const,motion:"drift" as const,format:"wide" as const,cues:options.cues??[],pro:newProSettings(base,60)}};
  const provider={connected:true,busy:false,status:{available:true,saved:true,musicAccess:"available"}} as ElevenLabsKey;
  const props={songs:[song],initialSongId:song.id,saving:false,save:async()=>true,elevenLabs:provider,connectionSettings(){},upload(){},generate:async()=>undefined,importFile:async()=>undefined,persisted(){},persistBusy(){},dirty(){}};
  await act(async()=>root.render(<LyricVideoPro {...props}/>));await settle();
  return {syncs,root,rerender:async()=>{await act(async()=>root.render(<LyricVideoPro {...props}/>));await settle();},close:async()=>{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();}};
}

test("opening a song in the LyriVid tab starts its captions by itself, once, after checking for saved ones",async()=>{
  const h=await open();
  try{
    assert.equal(h.syncs.filter(s=>s.mode!=="audit").length,1,"one automatic sync");
    await h.rerender();
    assert.equal(h.syncs.filter(s=>s.mode!=="audit").length,1,"rerenders never start another paid sync");
    assert.match(q("qv-words-status")!.textContent!,/Words timed to the voice/);
  }finally{await h.close();}
});

test("no automatic sync when timing already exists, a recovery copy is waiting, or the song is instrumental",async()=>{
  for(const options of [{cues:[{text:"Keep",time:1,end:3}]},{recovery:true},{instrumental:true}]){
    const h=await open(options);
    try{assert.equal(h.syncs.length,0,JSON.stringify(options));}finally{await h.close();}
  }
});

test("3 taps beside the preview: every background is one chip away in a short scrolling box; Fine-tune starts closed",async()=>{
  const h=await open({cues:[{text:"Love is here",time:0,end:5}]});
  try{
    assert.ok(q("quick-video-panel"));
    assert.equal((q("details-fine-tune") as HTMLDetailsElement).open,false,"advanced tools start tucked away");
    const reachable=new Set<string>();
    for(const chip of Object.keys(lyricBackgroundGroups)){
      await act(async()=>q(`qv-chip-${chip}`)!.click());
      document.querySelectorAll<HTMLElement>('[data-testid^="qv-theme-"]').forEach(card=>reachable.add(card.dataset.testid!.slice(9)));
    }
    assert.deepEqual([...reachable].sort(),Object.values(lyricBackgroundGroups).flatMap(g=>[...g.themes]).sort(),"all backgrounds reachable, none removed");
    assert.equal(reachable.size,46);
    await act(async()=>q("qv-chip-kids")!.click());
    await act(async()=>q("qv-theme-balloons")!.click());
    assert.equal(q("qv-theme-balloons")!.getAttribute("aria-pressed"),"true","tap = chosen (preview updates)");
    await act(async()=>q("qv-chip-looks")!.click());
    assert.ok(document.querySelectorAll('[data-testid^="qv-look-"]').length>=20,"complete looks (background + lettering) in one tap");
    await act(async()=>q("qv-shape-vertical")!.click());
    assert.equal(q("qv-shape-vertical")!.getAttribute("aria-pressed"),"true");
    assert.ok(q("qv-make-video"));
    await act(async()=>q("qv-words-action")!.click());
    assert.equal((q("details-fine-tune") as HTMLDetailsElement).open,true,"Fix a word opens Fine-tune at the caption editor");
  }finally{await h.close();}
});

test("'For this song' suggests the right collections from the song itself",()=>{
  const song=(name:string,prompt="")=>({name,notes:{prompt} as any,tags:[] as string[]});
  assert.deepEqual(suggestedThemes(song("ABC Bedtime","gentle kids lullaby")).slice(0,4),["balloons","meadow","undersea","lullaby"]);
  assert.deepEqual(suggestedThemes(song("Land of the Free","patriotic anthem")).slice(0,3),["flag","liberty","nycnight"]);
  assert.ok(suggestedThemes(song("Om Shanti","mantra meditation")).includes("lotus"));
  for(const id of suggestedThemes(song("Anything")))assert.ok(id in videoThemes);
});
