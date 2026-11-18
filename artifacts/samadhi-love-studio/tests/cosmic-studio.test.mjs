import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {build} from "esbuild";
import React,{act} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createRoot} from "react-dom/client";
import {JSDOM} from "jsdom";

const root=fileURLToPath(new URL("../",import.meta.url));
const output=path.join(root,"generated-artifacts/tests/cosmic-studio/screens.mjs");
await mkdir(path.dirname(output),{recursive:true});
await build({
  stdin:{contents:`
    export {StudioNavigation} from "./app/studio-navigation";
    export {SongSky,SongSkyToggle} from "./app/song-sky";
    export {QuickCreate} from "./app/quick-create";
    export {RecordingDesk} from "./app/recording-desk";
    export {LyricVideoStudio} from "./app/lyric-video-studio";
    export {ExploreScreen} from "./app/studio-screens";
    export {Community} from "./app/community/community";
    export {AuthPortal} from "./app/auth-portal";
    export {ClaimOwner} from "./app/owner/claim";
    export {SongCard,SongHubProvider} from "./app/song-card";
    export {VideoFormatPicker} from "./app/video-format-picker";
    export {FlowerOfLife} from "./app/cosmic-flower-of-life";
    export {freshSong} from "./app/studio-data";
    export {screens,screenHome} from "./app/studio-routes";
    export {brand} from "./app/brand";`,resolveDir:root,loader:"tsx"},
  outfile:output,bundle:true,format:"esm",platform:"node",jsx:"automatic",packages:"external",
  plugins:[{name:"offline-cosmic-screens",setup(b){
    b.onResolve({filter:/\.css$/},()=>({path:"css",namespace:"cosmic-fixture"}));
    b.onResolve({filter:/client$/},args=>{
      if(args.path.includes("community/client")||(args.path==="./client"&&args.importer.includes("/community/")))
        return {path:"community",namespace:"cosmic-fixture"};
    });
    b.onLoad({filter:/.*/,namespace:"cosmic-fixture"},({path})=>({loader:"js",contents:path==="css"?"":`
      export class CommunityError extends Error {}
      export async function communityRequest(){throw new Error("No network writes in presentation tests.");}
      export function useCommunityResource(url){return {data:globalThis.__cosmicCommunity??null,error:"",loading:false,refresh:async()=>true};}
    `}));
  }}],
});
const ui=await import(pathToFileURL(output));
const el=React.createElement,noop=()=>{};
const render=(Component,props={})=>renderToStaticMarkup(el(Component,props));
const domOf=(Component,props)=>new JSDOM(render(Component,props));
const source=file=>readFile(path.join(root,"app",file),"utf8");
const navProps={activeView:"overview",owner:false,navigate:()=>true,settings:noop,guide:noop};
const song=(id,name,date)=>({...ui.freshSong(id,name,0),createdAt:date,audioId:`audio-${id}`,audioFormat:"mp3"});

async function mounted(element,fn){
  const dom=new JSDOM('<div id="root"></div>',{url:"https://offline.test"});
  const keys=["window","document","navigator","HTMLElement","Element","Node","IS_REACT_ACT_ENVIRONMENT"];
  const descriptors=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const key of keys)Object.defineProperty(globalThis,key,{configurable:true,value:key==="IS_REACT_ACT_ENVIRONMENT"?true:key==="window"?dom.window:dom.window[key]});
  dom.window.scrollTo=noop;
  dom.window.matchMedia=()=>({matches:true,addEventListener:noop,removeEventListener:noop});
  const app=createRoot(dom.window.document.getElementById("root"));
  try{await act(async()=>app.render(element));await fn(dom.window.document,app);}
  finally{await act(async()=>app.unmount());dom.window.close();for(const [key,descriptor]of descriptors)descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key];}
}

test("all nine screens retain their real IDs and themed five-entry navigation",async()=>{
  const css=await source("cosmic-theme.css");
  for(const screen of ui.screens){
    assert.ok(css.includes(`data-cosmic-screen=${screen}`),screen);
    const doc=domOf(ui.StudioNavigation,{...navProps,activeView:ui.screenHome[screen],activeScreen:screen,beginner:false}).window.document;
    assert.equal(doc.querySelectorAll(".studio-mobile-dock button").length,5);
    for(const id of ["create","songs","lyric-video","record","explore"])assert.ok(doc.querySelector(`[data-testid="nav-${id}"]`));
    assert.match(doc.querySelector('[data-testid="nav-songs"]').textContent,/Your songs/);
    assert.ok(doc.querySelector('[data-testid="nav-settings"]'));
    assert.ok(doc.querySelector('[data-testid="nav-plan-credits"]'));
  }
  for(const screen of ["settings","guide","plan-credits"])assert.ok(css.includes(`data-cosmic-screen=${screen}`));
});

test("one canonical theme supplies colors, fonts, panels and accessible motion opt-out",async()=>{
  const css=await source("cosmic-theme.css"),layout=await source("layout.tsx");
  for(const color of ["#04030d","#7fe9ff","#a77bff","#ff5fd2","#ffe9a8","#eef1ff","#c9cdf0","#a9afd8"])assert.ok(css.includes(color));
  for(const font of ["Syne","Space Grotesk","Cormorant Garamond"])assert.ok(css.includes(font));
  assert.ok(layout.includes('"./cosmic-theme.css"'));
  assert.ok(layout.includes("serverHostname={serverHostname}"));
  for(const file of ["cosmic-theme.css","cosmic-views.css","auth-pages.css","explore-cosmos.css"]){
    const text=await source(file);
    assert.match(text,/@media\s*\(prefers-reduced-motion:\s*reduce\)/,file);
    assert.match(text,/animation(?:-duration)?:\s*(?:none|0\.0?1ms|\.01ms)/,file);
  }
});

test("navigation respects reduced-motion preferences when moving between screens",async()=>{
  const opened=[],scrolls=[];
  await mounted(el(ui.StudioNavigation,{...navProps,openScreen:id=>{opened.push(id);return true;}}),async doc=>{
    window.scrollTo=options=>scrolls.push(options);
    await act(async()=>doc.querySelector('[data-testid="nav-songs"]').click());
    assert.deepEqual(opened,["songs"]);
    assert.deepEqual(scrolls,[{top:0,behavior:"auto"}]);
  });
});

test("Create renders the real guided form and truthful local/cost controls",()=>{
  const doc=domOf(ui.QuickCreate,{connected:false,saving:false,drafts:[],settings:noop,guided:noop,openDrafts:noop,generateSong:async()=>undefined,saveSketch:async()=>undefined}).window.document;
  assert.equal(doc.querySelector("#quick-create-heading").textContent,"Begin a song");
  assert.ok(doc.querySelector('[data-testid="input-song-description"]'));
  assert.match(doc.body.textContent,/Nothing is sent until you press Create/);
  assert.match(doc.body.textContent,/Help me describe it/);
  assert.match(doc.body.textContent,/uses double credits/);
  assert.equal(doc.querySelector('[data-testid="checkbox-make-two-versions"]').checked,false);
});

test("Record keeps actual idle state, recorder and Advanced gating",()=>{
  const props={active:true,requestedMode:"record",songs:[],saving:false,onCapture:noop,save:async()=>null,open:noop,mixTake:noop,vocalTake:noop,consolidated:true,advanced:false,beginSavedSong:noop};
  const doc=domOf(ui.RecordingDesk,props).window.document;
  assert.ok(doc.querySelector('.resonance-chamber[data-transport="idle"]'));
  assert.equal(doc.querySelector(".chamber-ripple"),null);
  assert.equal(doc.querySelector('[data-testid="details-recording-advanced"]'),null);
  assert.match(doc.body.textContent,/Every take stays private/);
  assert.match(doc.body.textContent,/8 minutes/);
  assert.ok(doc.querySelector('[data-testid="button-begin-song-from-take"]')?.disabled);
  assert.ok(domOf(ui.RecordingDesk,{...props,advanced:true}).window.document.querySelector('[data-testid="details-recording-advanced"]'));
});

test("Video renders its real empty state and does not invent a ready song",()=>{
  const doc=domOf(ui.LyricVideoStudio,{songs:[],initialSongId:"",saving:false,save:async()=>true,elevenLabs:{connected:false},connectionSettings:noop,upload:noop}).window.document;
  assert.match(doc.body.textContent,/Make your video/);
  assert.match(doc.body.textContent,/Pick a vibe/);
  assert.ok(doc.querySelector("[data-observatory]"));
  assert.equal(doc.querySelector('a[download]'),null);
});

test("format labels are real accessible text, while format values and square stay unchanged",async()=>{
  const picked=[];
  await mounted(el(ui.VideoFormatPicker,{value:"vertical",change:id=>picked.push(id)}),async doc=>{
    const buttons=[...doc.querySelectorAll(".video-shape-option")];
    assert.match(buttons[0].textContent,/Phone · Reels & Shorts|YouTube/);
    assert.ok(buttons.some(b=>b.textContent.includes("Phone · Reels & Shorts")));
    assert.ok(buttons.some(b=>b.textContent.includes("YouTube")));
    await act(async()=>buttons.find(b=>b.textContent.includes("YouTube")).click());
    await act(async()=>doc.querySelector("details button").click());
    assert.deepEqual(picked,["wide","square"]);
  });
});

test("both portals wrap the unchanged sign-in content and use shared branding",async()=>{
  for(const mode of ["sign-in","sign-up"]){
    const doc=domOf(ui.AuthPortal,{mode,children:el("form",{"data-existing-widget":true}),note:el("p",{className:"studio-auth-note"},"Existing help")}).window.document;
    assert.equal(doc.querySelectorAll(".portal-rings > .ring").length,3);
    assert.ok(doc.querySelector("form[data-existing-widget]"));
    assert.match(doc.body.textContent,/THE PORTAL/);
    for(const text of Object.values(ui.brand))assert.ok(doc.body.textContent.includes(text));
  }
  const css=await source("auth-pages.css");
  assert.match(css,/\.portal-card\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/\.portal-card>\*\{[^}]*min-width:0/);
  assert.doesNotMatch(css,/\.cl-(?:formFieldInput|formButtonPrimary|socialButtonsBlockButton)/);
});

test("Claim owner keeps the verified-email explanation and blocked-account guard",()=>{
  const allowed=domOf(ui.ClaimOwner,{blocked:false,storageAvailable:true}).window.document;
  assert.ok(allowed.querySelector(".cosmic-claim"));
  assert.match(allowed.body.textContent,/verified sign-in email/);
  const blocked=domOf(ui.ClaimOwner,{blocked:true,storageAvailable:true}).window.document;
  assert.equal(blocked.querySelector("button.primary"),null);
  assert.match(blocked.body.textContent,/already been claimed/);
});

test("song sky uses only supplied real songs, connects actual versions and handles empty filters",async()=>{
  const first=song("first","نور & light","2025-01-01"),second={...song("second","A second take","2026-01-01"),projectId:"first"},other=song("other","Independent","2024-01-01");
  const all=[first,second,other],props={songs:all,allSongs:all,open:noop};
  const doc=domOf(ui.SongSky,props).window.document;
  assert.equal(doc.querySelectorAll("button.song-star").length,3);
  assert.equal(doc.querySelectorAll("line").length,1);
  assert.match(doc.querySelector('[data-testid="sky-star-first"]').getAttribute("aria-label"),/نور & light/);
  assert.equal(render(ui.SongSky,props),render(ui.SongSky,props));
  assert.equal(domOf(ui.SongSky,{...props,songs:[other]}).window.document.querySelectorAll("line").length,0);
  assert.equal(domOf(ui.SongSky,{...props,songs:[]}).window.document.querySelectorAll("button.song-star").length,0);
  const opened=[];
  await mounted(el(ui.SongSky,{...props,open:id=>opened.push(id)}),async doc=>{
    const button=doc.querySelector('[data-testid="sky-star-second"]');
    button.focus();assert.equal(doc.activeElement,button);
    await act(async()=>button.click());assert.deepEqual(opened,["second"]);
  });
});

test("collapsed song rows reuse the existing four actions without starting any request",async()=>{
  const calls=[],saved=song("one","Private song","2026-01-01");
  const hub={busy:false,simple:true,folders:[],stemsConnected:false,preview:"",setPreview:noop,expanded:"",setExpanded:noop,save:async()=>true,action:action=>calls.push(action),archive:async()=>true,duplicate:async()=>true,publish:async()=>{},playlist:async()=>true};
  await mounted(el(ui.SongHubProvider,{value:hub},el(ui.SongCard,{song:saved})),async doc=>{
    const buttons=[...doc.querySelectorAll(".song-card-quick-actions button")];
    assert.equal(buttons.length,4);
    for(const button of buttons)await act(async()=>button.click());
    assert.deepEqual(calls,["redo-part","extend","make-like-this","short-video"]);
    assert.ok(buttons[3].classList.contains("primary"));
  });
});

test("Explore retains original tab IDs and Listening Room without claiming an empty station is live",()=>{
  globalThis.__cosmicCommunity=null;
  const doc=domOf(ui.ExploreScreen,{tab:"radio",setTab:noop,signOut:"/logout",owner:false}).window.document;
  for(const id of ["discover","radio","party","following","listening-room"])assert.ok(doc.querySelector(`[data-testid="tab-${id}"]`),id);
  assert.match(doc.body.textContent,/Only kind reactions/);
});

test("Following opens the existing Discover route rather than creating a new route",async()=>{
  const routes=[];globalThis.__cosmicCommunity=null;
  function Explore(){
    const[tab,setTab]=React.useState("radio");
    return el(ui.ExploreScreen,{tab,setTab:next=>{routes.push(next);setTab(next);},signOut:"/logout",owner:false});
  }
  await mounted(el(Explore),async doc=>{
    await act(async()=>doc.querySelector('[data-testid="tab-following"]').click());
    assert.deepEqual(routes,["discover"]);
    assert.equal(doc.querySelector('[data-testid="tab-following"]').getAttribute("aria-selected"),"true");
    assert.ok(doc.querySelector('[data-testid="tab-listening-room"]'));
  });
});

test("community keeps real releases and reaction IDs but hides public numeric rankings",()=>{
  const release={id:"release-one",title:"A real fixture",artist:{id:"artist-one",name:"نور"},releasedAt:1,inspirational:false,comments:false,tags:["Oud"],art:0,stats:{listens:812345671,reactions:{like:812345672,love:812345673,inspired:812345674}}};
  globalThis.__cosmicCommunity={releases:[release],artists:[],sections:{"Most Loved":["release-one"],"Trending Songs":["release-one"],"New Releases":["release-one"],"Hidden Gems":[],"Inspirational Music":[]},featured:release,artist:null,comments:[],myComment:null,canEngage:true,reactionBySong:{},saved:[],following:[],playlists:[],own:[]};
  try{
    const doc=domOf(ui.Community,{songId:"release-one",artistId:null,signIn:"/login"}).window.document;
    assert.match(doc.body.textContent,/A real fixture/);
    assert.match(doc.body.textContent,/Felt this/);
    assert.doesNotMatch(doc.body.textContent,/812.?345.?67[1-4]/);
  }finally{globalThis.__cosmicCommunity=null;}
});

test("decorative geometry is deterministic and SVG coordinates are rounded",()=>{
  const markup=render(ui.FlowerOfLife);
  assert.equal(markup,render(ui.FlowerOfLife));
  const doc=new JSDOM(markup).window.document;
  for(const node of doc.querySelectorAll("[cx],[cy]"))for(const attr of ["cx","cy"]){
    const value=node.getAttribute(attr);if(value!==null)assert.match(value,/^-?\d+(?:\.\d{1,2})?$/);
  }
});
