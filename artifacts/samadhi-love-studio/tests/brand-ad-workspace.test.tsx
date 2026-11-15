import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {defaultBrandLogo,isBrandLogo,logoSvg,logoSymbols,logoPalettes} from "../app/brand-logo";
import {BrandLogoDesigner} from "../app/brand-logo-designer";
import {emptyMusicalAd,isMusicalAd,musicalAdPrompt,type MusicalAd} from "../app/musical-ad";
import {makeSavedSongPrompt,readSavedAd,savedPromptFromSong} from "../app/saved-song-prompts";
import {footageTime,isAdFootage,type AdFootage} from "../app/advertising-footage";
import {drawProFrame} from "../app/lyric-pro-render";
import {isLyricProject,type LyricProject} from "../app/lyric-video-data";
import {newProSettings} from "../app/lyric-pro-data";
import {freshSong} from "../app/studio-data";
import {QuickCreate} from "../app/quick-create";
const ad:MusicalAd={brand:"نور Coffee",benefit:"Freshly roasted coffee",audience:"Coffee lovers",cta:"Visit نور Coffee today",seconds:15,style:"rap"};
const clip:AdFootage={asset:"owned-clip",duration:12,trimStart:2,trimEnd:8,loop:true,fit:"contain"};
test("all logo symbols, palettes and layouts produce safe XML including Arabic and hostile text",()=>{
 const dom=new JSDOM("");
 for(const symbol of Object.keys(logoSymbols) as (keyof typeof logoSymbols)[])for(const palette of Object.keys(logoPalettes) as (keyof typeof logoPalettes)[])for(const layout of ["stacked","horizontal","badge"] as const){
  const design={...defaultBrandLogo,symbol,palette,layout,name:'نور & <script>alert(1)</script>',tagline:'Music " <image href="https://evil.test"/>'};
  const svg=logoSvg(design),doc=new dom.window.DOMParser().parseFromString(svg,"image/svg+xml");assert.equal(doc.querySelector("parsererror"),null);assert.equal(doc.querySelector("script,image,foreignObject"),null);assert.equal(doc.documentElement.tagName,"svg");assert(doc.querySelector("title")!.textContent!.includes("<script>"));assert(doc.querySelectorAll('text[direction="rtl"]').length>=1);
 }
 assert(!isBrandLogo({...defaultBrandLogo,palette:"url(https://evil.test)"}));assert.throws(()=>logoSvg({...defaultBrandLogo,name:""}));dom.window.close();
});
test("advertisement briefs require creator-supplied facts, preserve multilingual names and survive prompt reuse",()=>{
 assert(isMusicalAd(ad));assert(!isMusicalAd({...ad,seconds:360}));assert(!isMusicalAd({...ad,benefit:""}));assert(!isMusicalAd({...ad,style:"unknown"}));
 const prompt=musicalAdPrompt(ad);assert(prompt.includes(ad.benefit));assert(prompt.includes(ad.cta));assert.match(prompt,/15-second/);assert.match(prompt,/do not invent/);
 const song={...freshSong("ad","Coffee spot",0),musicalAd:ad};const template=makeSavedSongPrompt(savedPromptFromSong(song),"prompt-ad");assert.deepEqual(readSavedAd(template.notes.promotion),{kind:"musical-ad/v1",...ad});assert.equal(readSavedAd('{"kind":"musical-ad/v1","brand":"invalid"}'),undefined);
 const p=newProSettings({...song,logoAsset:"private-logo"},15);assert.equal(p.logo,"private-logo");assert.deepEqual(p.advertisement,{brand:ad.brand,cta:ad.cta});
});
test("uploaded footage maps source time through trims, looping and held final frames without shifting lyrics",()=>{
 assert(isAdFootage(clip));assert.equal(footageTime(120,120,clip),2);assert.equal(footageTime(125,120,clip),7);assert.equal(footageTime(126,120,clip),2);assert.equal(footageTime(300,120,clip),2);assert.equal(footageTime(130,120,{...clip,loop:false}),7.999);assert.equal(footageTime(0,120,clip),2);
 for(const patch of [{asset:"https://evil.test/movie.mp4"},{trimStart:8},{trimEnd:13},{duration:NaN},{duration:70},{fit:"stretch"}])assert(!isAdFootage({...clip,...patch}));
 const song=freshSong("ad-video","Product",0);const project:LyricProject={theme:"cosmic",motion:"drift",format:"vertical",cues:[{time:120,end:125,text:"نور وحب"}],pro:{...newProSettings(song,360),range:{start:120,end:150},backgroundVideo:clip}};
 assert(isLyricProject(JSON.parse(JSON.stringify(project))));assert(!isLyricProject({...project,pro:{...project.pro!,backgroundVideo:{...clip,trimEnd:90}}}));assert.equal(project.cues[0].time,120);
});
test("preview and export source-time rendering draw the actual footage and final call to action with fit preserved",()=>{
 const frames:unknown[][]=[],texts:string[]=[];const ctx=new Proxy({canvas:{width:720,height:1280}}, {get:(target,key)=>key==="canvas"?target.canvas:key==="measureText"?(text:string)=>({width:text.length*12}):key==="createRadialGradient"||key==="createLinearGradient"?()=>({addColorStop(){}}):(...args:unknown[])=>{if(key==="drawImage")frames.push(args);if(key==="fillText")texts.push(args[0] as string);},set:()=>true}) as unknown as CanvasRenderingContext2D;
 const song=freshSong("ad-render","Product",0),project:LyricProject={theme:"cosmic",format:"vertical",motion:"still",cues:[],pro:{...newProSettings(song,180),range:{start:120,end:150},advertisement:{brand:ad.brand,cta:ad.cta}}};const source={} as CanvasImageSource,footage={frame:source,width:1600,height:900,fit:"contain" as const};
 drawProFrame(ctx,121,project,song.name,new Map(),{clean:true,footage});assert.equal(frames[0][0],source);assert.equal(frames[0][3],720);assert.equal(frames[0][4],405);assert(!texts.includes(ad.cta));
 frames.length=0;texts.length=0;drawProFrame(ctx,27,project,song.name,new Map(),{clean:true,footage,exportTime:true});assert(texts.includes(ad.cta));assert(texts.includes(ad.brand));assert.equal(frames[0][0],source);
});
async function setup(){const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});const{createRoot}=await import("react-dom/client");const root=createRoot(document.getElementById("root")!);const button=(label:string)=>[...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent?.trim()===label)!;const input=async(label:string,text:string)=>act(async()=>{const el=[...document.querySelectorAll("label")].find(l=>l.firstChild?.textContent===label)!.querySelector("input")!;Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),"value")!.set!.call(el,text);el.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});return{dom,root,button,input,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};}
test("musical-ad controls feed the same real creator callback with duration, product facts and directions",async()=>{
 const h=await setup();let payload:any;
 try{await act(async()=>h.root.render(<QuickCreate connected saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async input=>{payload=input;return undefined;}} saveSketch={async()=>undefined}/>));await act(async()=>h.button("Musical ad").click());for(const[label,value]of[["Brand or product",ad.brand],["One key benefit",ad.benefit],["Audience (optional)",ad.audience],["Call to action",ad.cta]])await h.input(label,value);const length=[...document.querySelectorAll('select')].find(s=>s.parentElement?.firstChild?.textContent==="Spot length")!;await act(async()=>{length.value="15";length.dispatchEvent(new h.dom.window.Event("change",{bubbles:true}));});await act(async()=>h.button("Prepare my musical ad").click());await act(async()=>document.querySelector("form")!.dispatchEvent(new h.dom.window.Event("submit",{bubbles:true,cancelable:true})));assert.equal(payload.duration,15);assert.equal(payload.musicalAd.brand,ad.brand);assert(payload.prompt.includes(ad.benefit));assert(payload.prompt.includes(ad.cta));assert.equal(payload.openingMode,"direct");assert.match(payload.arrangement,/Brand ending/);
 }finally{await h.close();}
});
test("logo editor preserves transparent vector settings and its saved design without navigating away",async()=>{
 const h=await setup();let captured:Blob|undefined;const original=URL.createObjectURL;URL.createObjectURL=(blob:Blob)=>{captured=blob;return"blob:logo";};h.dom.window.HTMLAnchorElement.prototype.click=function(){};
 try{await act(async()=>h.root.render(<BrandLogoDesigner name="نور Music"/>));const checkbox=document.querySelector('input[type=checkbox]') as HTMLInputElement;assert(checkbox.checked);await h.input("Tagline (optional)","Love & light");await act(async()=>h.button("Download SVG").click());assert(captured);assert.equal(captured!.type,"image/svg+xml");const doc=new h.dom.window.DOMParser().parseFromString(await captured!.text(),"image/svg+xml");assert.equal(doc.querySelector("parsererror"),null);assert(doc.documentElement.textContent!.includes("Love & light"));assert.equal(doc.querySelector("svg > rect"),null);assert.equal(h.button("Save logo to song"),undefined);
 }finally{URL.createObjectURL=original;await h.close();}
});
