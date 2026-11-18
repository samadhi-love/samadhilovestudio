import test from "node:test";
import assert from "node:assert/strict";
import {mkdir,readFile,mkdtemp,writeFile,rm} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {tmpdir} from "node:os";
import {build} from "esbuild";
import React,{act} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {JSDOM} from "jsdom";
import {syncBrandNotices} from "../scripts/brand-assets.mjs";

const root=fileURLToPath(new URL("../",import.meta.url));
const output=path.join(root,"generated-artifacts/tests/versual/landing.mjs");
await mkdir(path.dirname(output),{recursive:true});
await build({
  stdin:{contents:'export {VersualLanding} from "./app/landing";export {brand,brandDescription} from "./app/brand";',resolveDir:root,loader:"tsx"},
  outfile:output,bundle:true,format:"esm",platform:"node",jsx:"automatic",packages:"external",
  plugins:[{name:"offline-public-catalog",setup(b){
    b.onResolve({filter:/\.css$/},()=>({path:"css",namespace:"fixture"}));
    b.onResolve({filter:/^(?:\.\.\/community\/client|\.\/client)$/},()=>({path:"community",namespace:"fixture"}));
    b.onLoad({filter:/.*/,namespace:"fixture"},({path})=>({loader:"js",contents:path==="css"?"":`
      export class CommunityError extends Error {constructor(message,status){super(message);this.status=status;}}
      export async function communityRequest(){throw new Error("Offline preview must not write community data.");}
      export function useCommunityResource(url){globalThis.__versualUrl=url;return globalThis.__versualFeed;}
    `}));
  }}],
});
const {VersualLanding,brand,brandDescription}=await import(pathToFileURL(output));
const feed=(data=null,error="")=>{globalThis.__versualFeed={data,error,refresh:async()=>true};};
const render=()=>renderToStaticMarkup(React.createElement(VersualLanding));
const parse=()=>new JSDOM(render()).window.document;
const release=n=>({id:`song-${n}`,title:`Published song ${n}`,artist:{id:`artist-${n}`,name:n===1?"ليلى & نور":`Artist ${n}`},releasedAt:n,art:n,tags:["Oud Fusion"],stats:{listens:0,reactions:{like:0,love:0,inspired:0}},inspirational:false,comments:false});

test("the compact welcome appears once directly between the slogan band and quotes",()=>{
  feed({releases:[]});const doc=parse(),banner=doc.querySelector(".divine-spark--banner");
  assert.equal(doc.querySelectorAll(".divine-spark").length,1);
  assert.equal(doc.querySelector(".vl-band").nextElementSibling,banner);
  assert.ok(banner.nextElementSibling.querySelector("blockquote"));
  for(const line of [
    "Welcome to SAMADHI LOVE",
    "A UNIQUE CREATIVE PLATFORM WHERE MUSIC, POSITIVE VIBES AND FREQUENCY MEET",
    "♫ ✧ ❨ Music is for the soul ❩ ✧ ♫",
  ])assert.equal(doc.body.textContent.split(line).length-1,1,line);
});

test("shared identity comes from one config and describes the product",async()=>{
  const source=JSON.parse(await readFile(path.join(root,"brand.json"),"utf8"));
  assert.deepEqual(brand,source);assert.ok(Object.isFrozen(brand));
  for(const value of Object.values(source))assert.ok(brandDescription.includes(value));
  const quick=await readFile(path.join(root,"app/quick-create.tsx"),"utf8");
  assert.ok(quick.includes("brand.slogan"));assert.ok(!quick.includes(source.slogan));
});
test("public page renders the requested sections and shared footer",()=>{
  feed({releases:[]});const doc=parse(),text=doc.body.textContent;
  assert.match(doc.querySelector("h1").textContent,/Your soul has a sound\./);
  for(const copy of ["Everything vibrates.","Receive. Create. Radiate.","Every song becomes a moving sky.","Rising in the cosmos","The harmonic series","The golden ratio","Music of the spheres","Where words fail, music speaks."])assert.ok(text.includes(copy),copy);
  for(const copy of Object.values(brand))assert.ok(doc.querySelector("footer").textContent.includes(copy),copy);
  assert.equal(doc.querySelectorAll(".vl-phone").length,4);
  assert.equal(doc.querySelectorAll(".vl-hero-art .vl-orbit").length,3);
  assert.equal(doc.querySelectorAll(".vl-starpop .vl-pop").length,3);
});
test("top navigation, calls to action and footer link to existing routes",()=>{
  feed({releases:[]});const doc=parse();
  const nav=Array.from(doc.querySelectorAll('nav[aria-label="Main"] a')).map(a=>[a.textContent,a.getAttribute("href")]);
  assert.deepEqual(nav,[["Discover","/community"],["Create","/creator"],["Radio","/radio"],["Plans","/plans"],["Sign in","/sign-in"],["Start creating","/creator"]]);
  assert.equal(doc.querySelector('[data-testid="link-create-song"]').getAttribute("href"),"/creator");
  assert.equal(doc.querySelector('[data-testid="link-enter-cosmos"]').getAttribute("href"),"/community");
  assert.deepEqual(Array.from(doc.querySelectorAll("footer nav a")).map(a=>a.getAttribute("href")),["/community","/plans","/sign-in"]);
});
test("orbital geometry is stable across tiny server/browser trigonometry differences",()=>{
  feed({releases:[]});
  const expected=parse().querySelector(".vl-flower").outerHTML,sin=Math.sin,cos=Math.cos;
  try{
    Math.sin=n=>sin(n)-1e-13;Math.cos=n=>cos(n)+1e-13;
    assert.equal(parse().querySelector(".vl-flower").outerHTML,expected);
  }finally{Math.sin=sin;Math.cos=cos;}
});
test("empty public catalog is honest and home has no Party Spotlight",async()=>{
  feed({releases:[],catalog:{releases:[]}});const html=render();
  assert.match(html,/The first songs are rising soon/);
  assert.doesNotMatch(html,/Party Spotlight|POSITIVE MUSIC COMMUNITY|data-testid="card-release/);
  const source=await readFile(path.join(root,"app/landing/index.tsx"),"utf8");
  assert.doesNotMatch(source,/PartySpotlight|party\/spotlight/);
  assert.equal(globalThis.__versualUrl,"/api/community?page=1&search=&genre=");
});
test("published releases are deduplicated and limited to four without invented statistics",()=>{
  feed({releases:[release(1),release(2)],catalog:{releases:[release(1),release(3),release(4),release(5)]}});
  const doc=parse(),cards=Array.from(doc.querySelectorAll(".vl-release"));
  assert.equal(cards.length,4);assert.equal(doc.querySelectorAll("audio").length,4);
  assert.deepEqual(cards.map(c=>c.querySelector(".vl-release-title").textContent),[1,2,3,4].map(n=>`Published song ${n}`));
  assert.equal(cards[0].querySelector(".vl-release-artist").textContent,"ليلى & نور");
  assert.equal(cards[0].querySelector(".vl-release-title").getAttribute("href"),"/community?song=song-1");
  assert.equal(cards[0].querySelector(".vl-release-artist").getAttribute("href"),"/community?artist=artist-1");
  assert.doesNotMatch(cards.map(c=>c.textContent).join(""),/50K|followers|1,000/);
});
test("a catalog of fewer than four shows only actual songs and safely renders titles",()=>{
  const song={...release(1),title:"<script>not executable</script>",cover:"/api/community?cover=song-1"};
  feed({releases:[song]});const doc=parse();
  assert.equal(doc.querySelectorAll(".vl-release").length,1);
  assert.equal(doc.querySelector(".vl-release-title").textContent,song.title);
  assert.equal(doc.querySelectorAll("script").length,0);
  assert.equal(doc.querySelector(".vl-cover").getAttribute("src"),song.cover);
});
test("loading and connection failure are distinct from an empty catalog",()=>{
  feed();let doc=parse();
  assert.ok(doc.querySelector('[aria-label="Loading songs"]'));
  assert.ok(!doc.body.textContent.includes("The first songs are rising soon"));
  feed(null,"Offline");doc=parse();
  assert.match(doc.querySelector('[role="alert"]').textContent,/could not load community songs/);
  assert.match(doc.querySelector('[role="alert"] button').textContent,/Try again/);
  assert.ok(!doc.body.textContent.includes("The first songs are rising soon"));
});
test("motion is scoped, fully disabled for reduced motion, and phones have responsive rules",async()=>{
  const css=await readFile(path.join(root,"app/landing/landing.css"),"utf8");
  assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css,/\.versual-landing \*,\.versual-landing \*:before,\.versual-landing \*:after\{animation:none !important;transition:none !important\}/);
  assert.match(css,/\.vl-pop,\.vl-quote-in,\.vl-star,\.vl-rays\{opacity:1 !important;transform:none !important\}/);
  assert.match(css,/@media\(max-width:767px\)/);
  assert.match(css,/body:has\(\.versual-landing\) \.cosmic-frame\{display:none\}/);
});
test("offline DOM: reduced-motion quotes stop, playback uses the real engine, failure can retry",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.example.test/"});
  const keys=["window","document","navigator","HTMLElement","HTMLMediaElement","Event","MouseEvent","IS_REACT_ACT_ENVIRONMENT"];
  const originals=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  for(const key of keys)Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:key==="IS_REACT_ACT_ENVIRONMENT"?true:dom.window[key]});
  const listeners=new Set(),timers=new Map();let timerId=0,played=0,retries=0;
  const query={matches:true,addEventListener:(_type,fn)=>listeners.add(fn),removeEventListener:(_type,fn)=>listeners.delete(fn)};
  dom.window.matchMedia=()=>query;
  dom.window.setInterval=fn=>{timers.set(++timerId,fn);return timerId;};
  dom.window.clearInterval=id=>timers.delete(id);
  dom.window.HTMLMediaElement.prototype.play=async function(){played++;};
  const {createRoot}=await import("react-dom/client"),client=createRoot(dom.window.document.getElementById("root"));
  try{
    feed({releases:[release(1)]});
    await act(async()=>client.render(React.createElement(VersualLanding)));
    assert.equal(dom.window.document.querySelectorAll(".vl-quotes figure").length,4);
    assert.equal(timers.size,0);
    await act(async()=>dom.window.document.querySelector(".vl-player button").click());
    assert.equal(played,1);
    const audio=dom.window.document.querySelector("audio");
    assert.equal(audio.getAttribute("src"),"/api/community?audio=song-1");assert.equal(audio.hidden,false);
    await act(async()=>{query.matches=false;listeners.forEach(fn=>fn());});
    assert.equal(timers.size,1);assert.equal(dom.window.document.querySelectorAll(".vl-quotes figure").length,1);
    await act(async()=>Array.from(timers.values())[0]());
    assert.equal(dom.window.document.querySelector(".vl-quotes figcaption").textContent,"Victor Hugo");
    await act(async()=>{query.matches=true;listeners.forEach(fn=>fn());});
    assert.equal(timers.size,0);
    feed(null,"Offline");globalThis.__versualFeed.refresh=async()=>{retries++;return false;};
    await act(async()=>client.render(React.createElement(VersualLanding)));
    await act(async()=>dom.window.document.querySelector(".vl-rising button").click());
    assert.equal(retries,1);
  }finally{
    await act(async()=>client.unmount());assert.equal(timers.size,0);assert.equal(listeners.size,0);
    dom.window.close();for(const [key,value]of originals){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}
  }
});
test("static notices use the same brand without adding network access to vault setup",async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),"versual-brand-"));
  try{
    await mkdir(path.join(directory,"public"));
    const fixture={...brand,name:'Orbit <Studio> & Co'};
    await writeFile(path.join(directory,"brand.json"),JSON.stringify(fixture));
    for(const file of ["vault-key-setup.html","audio-licenses.html"])
      await writeFile(path.join(directory,"public",file),'<title data-brand-title="Setup">Old title</title><span data-brand-name>Old name</span><script>const localOnly=true;</script>');
    await syncBrandNotices(directory);
    const once=await readFile(path.join(directory,"public/vault-key-setup.html"),"utf8");
    assert.match(once,/Setup · Orbit &lt;Studio&gt; &amp; Co/);assert.doesNotMatch(once,/\bfetch\b|XMLHttpRequest/);
    await syncBrandNotices(directory);
    assert.equal(await readFile(path.join(directory,"public/vault-key-setup.html"),"utf8"),once);
    await writeFile(path.join(directory,"brand.json"),JSON.stringify({...fixture,name:""}));
    await assert.rejects(()=>syncBrandNotices(directory),/brand.json is missing name/);
  }finally{await rm(directory,{recursive:true,force:true});}
});
