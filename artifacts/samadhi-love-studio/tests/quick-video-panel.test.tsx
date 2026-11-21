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
    assert.equal(reachable.size,49,"46 + 3 favourite-animal scenes");
    await act(async()=>q("qv-chip-kids")!.click());
    await act(async()=>q("qv-theme-balloons")!.click());
    assert.equal(q("qv-theme-balloons")!.getAttribute("aria-pressed"),"true","tap = chosen (preview updates)");
    await act(async()=>q("qv-chip-looks")!.click());
    assert.ok(document.querySelectorAll('[data-testid^="qv-look-"]').length>=20,"complete looks (background + lettering) in one tap");
    await act(async()=>q("qv-purpose-phone")!.click());
    assert.equal(q("qv-purpose-phone")!.getAttribute("aria-checked"),"true");
    assert.match(q("qv-making")!.textContent??"",/Phone · full song · Phone 9:16 · full song/);
    assert.ok(q("qv-make-video"));
    await act(async()=>q("qv-words-action")!.click());
    assert.equal((q("details-fine-tune") as HTMLDetailsElement).open,true,"Fix a word opens Fine-tune at the caption editor");
  }finally{await h.close();}
});

test("the video page asks what the video is for FIRST, and the choice sets shape and length",async()=>{
  const h=await open({cues:[{text:"Love is here",time:0,end:5}]});
  try{
    const steps=[...document.querySelectorAll<HTMLElement>(".qv-step .qv-kicker")].map(el=>el.textContent);
    assert.deepEqual(steps.map(t=>t!.split(" · ")[0]),["1","2","3","4"]);
    assert.match(steps[0]!,/What is it for\?/,"step 1 is the shape choice, before song, vibe and make");
    assert.deepEqual([...document.querySelectorAll('[data-testid^="qv-purpose-"]')].map(el=>(el as HTMLElement).dataset.testid),
      ["qv-purpose-youtube","qv-purpose-shorts","qv-purpose-phone","qv-purpose-square"]);
    assert.equal(q("qv-purpose-youtube")!.getAttribute("aria-checked"),"true","a wide song opens as YouTube");
    await act(async()=>q("qv-purpose-square")!.click());
    assert.equal(q("qv-purpose-square")!.getAttribute("aria-checked"),"true");
    assert.match(q("qv-making")!.textContent??"",/Square 1:1 · full song/);
    await act(async()=>q("qv-purpose-shorts")!.click());
    assert.equal(q("qv-purpose-shorts")!.getAttribute("aria-checked"),"true","the tapped card stays lit, even when a 60-second song makes Shorts and Phone the same");
    assert.match(q("qv-making")!.textContent??"",/Shorts · TikTok · Reels · Phone 9:16/,"Shorts = tall video");
    await act(async()=>q("qv-purpose-youtube")!.click());
    assert.match(q("qv-making")!.textContent??"",/YouTube 16:9 · full song/);
    assert.equal(document.querySelectorAll('[data-testid^="qv-shape-"]').length,0,"no second, smaller shape picker");
  }finally{await h.close();}
});

test("one background box on the video page: every background, look and animated design once, no repeat boxes",async()=>{
  const h=await open({cues:[{text:"Love is here",time:0,end:5}]});
  try{
    assert.equal(document.querySelectorAll('[data-testid="background-chooser"]').length,1,"exactly one background box");
    await act(async()=>q("qv-chip-animated")!.click());
    assert.equal(document.querySelectorAll('[data-testid^="qv-sig-"]').length,12,"the 12 animated designs moved into the Vibe box");
    await act(async()=>q("qv-sig-awaken")!.click());
    assert.equal(q("qv-sig-awaken")!.getAttribute("aria-pressed"),"true");
    assert.equal(q("heading-backgrounds"),null,"no 'Backgrounds · all 46 designs' repeat");
    assert.ok(![...document.querySelectorAll("summary")].some(s=>/Quick complete looks|Animated looks · 12|^More looks$/.test(s.textContent??"")),"repeat look boxes are gone");
    const more=[...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent==="More motion and visual tools")!;
    for(let i=0;i<20&&more.disabled;i++)await settle();
    assert.equal(more.disabled,false,"the page is ready (captions finished)");
    await act(async()=>more.click());await settle();
    assert.ok(q("look-in-vibe"),"Fine-tune points back to the one Vibe box");
    assert.equal(document.querySelectorAll('[data-testid="background-chooser"]').length,1,"still one background box with Fine-tune open");
    assert.ok(q("details-section-background"),"per-section background, own design and templates are kept");
    assert.ok(q("details-more-looks"),"AI visuals, ads, lettering and beat motion are kept");
  }finally{await h.close();}
});

test("3 · Vibe shows Background and Lyric style as two boxes; every lyric style is one tap away",async()=>{
  const h=await open({cues:[{text:"Love is here",time:0,end:5}]});
  try{
    const {captionTemplates}=await import("../app/lyric-caption-templates");
    assert.ok(q("qv-background-box"),"Background box");
    const box=q("qv-lyric-box")!;
    assert.ok(box,"Lyric style box beside it");
    const cards=[...box.querySelectorAll<HTMLButtonElement>(".caption-template-card")];
    assert.equal(cards.length,captionTemplates.length,"all lyric styles in the box");
    assert.ok(cards.length>=8,"at least 8 lettering styles");
    assert.ok(new Set(captionTemplates.map(t=>t.animation)).size>=8,"at least 8 different word animations");
    assert.ok(new Set(captionTemplates.map(t=>t.font)).size>=8,"at least 8 different lettering fonts");
    assert.ok(captionTemplates.some(t=>t.emphasis==="glow")&&captionTemplates.some(t=>(t as {fill?:string}).fill==="metallic")&&captionTemplates.some(t=>(t as {fill?:string}).fill==="rainbow"),"glow, metallic and rainbow effects");
    const neon=cards.find(c=>/Neon Pulse/.test(c.textContent??""))!;
    await act(async()=>neon.click());
    assert.equal(neon.getAttribute("aria-pressed"),"true","tap = chosen");
    assert.ok(![...document.querySelectorAll("summary")].some(s=>/Customize lettering/.test(s.textContent??"")),"no second lyric-style picker in Fine-tune");
  }finally{await h.close();}
});

test("'For this song' suggests the right collections from the song itself",()=>{
  const song=(name:string,prompt="")=>({name,notes:{prompt} as any,tags:[] as string[]});
  assert.deepEqual(suggestedThemes(song("ABC Bedtime","gentle kids lullaby")).slice(0,7),["balloons","jungle","farm","pets","meadow","undersea","lullaby"]);
  assert.equal(suggestedThemes(song("Moo Moo","a song about a cow on the farm"))[0],"farm","animal words pick their scene");
  assert.equal(suggestedThemes(song("Roar","a lion and a monkey"))[0],"jungle");
  assert.equal(suggestedThemes(song("Best Friends","my puppy and my kitten"))[0],"pets");
  assert.deepEqual(suggestedThemes(song("Land of the Free","patriotic anthem")).slice(0,3),["flag","liberty","nycnight"]);
  assert.ok(suggestedThemes(song("Om Shanti","mantra meditation")).includes("lotus"));
  for(const id of suggestedThemes(song("Anything")))assert.ok(id in videoThemes);
});

test("find any background by typing its name, from any tab",async()=>{
  const h=await open({cues:[{text:"Love is here",time:0,end:5}]});
  try{
    const input=q("bg-search") as HTMLInputElement;
    const type=async(text:string)=>act(async()=>{const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")!.set!;set.call(input,text);input.dispatchEvent(new window.Event("input",{bubbles:true}));});
    await type("liberty");
    assert.deepEqual([...document.querySelectorAll<HTMLElement>('[data-testid^="qv-theme-"]')].map(e=>e.dataset.testid),["qv-theme-liberty"]);
    await type("sea");
    assert.ok(q("qv-theme-undersea"),"Under the Sea");
    await type("zzzz");
    assert.match(q("qv-grid")!.textContent!,/No background called/);
    await act(async()=>q("qv-chip-kids")!.click());
    assert.equal(input.value,"","picking a tab clears the search");
    assert.ok(q("qv-theme-balloons"));
  }finally{await h.close();}
});

test("a background picked on the Create page is the one the video opens with",async()=>{
  const {applyPlayVisual}=await import("../app/creative-video-handoff");
  const base=freshSong("x","X",0);
  const project={theme:"cosmic" as const,motion:"drift" as const,format:"vertical" as const,cues:[{text:"Hi",time:0,end:1}],pro:newProSettings(base,30)};
  assert.equal(applyPlayVisual(project,"theme:nycnight").theme,"nycnight");
  assert.equal(applyPlayVisual(project,"theme:not-a-background").theme,"cosmic","unknown keys change nothing");
  assert.equal(applyPlayVisual(project,"look:sacred-gold").theme,"masters");
  assert.equal(applyPlayVisual(project,"sacred-gold").theme,"masters","older saved choices still work");
  assert.deepEqual(applyPlayVisual(project,"theme:flag").cues,project.cues,"words and timing untouched");
});
