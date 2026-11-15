import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {SavedLyricVideos} from "../app/saved-lyric-videos";
import {freshSong} from "../app/studio-data";
import {newProSettings} from "../app/lyric-pro-data";
test("Classic and Pro cloud exports are discoverable together without duplicate links or song rewrites",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});const old=globalThis.fetch;let calls=0,fail=false;
 const base={...freshSong("song","My original",0),audioId:"current",audioFormat:"wav" as const};const song={...base,lyricVideo:{theme:"cosmic" as const,motion:"drift" as const,format:"wide" as const,cues:[],pro:{...newProSettings(base,60),exports:[{id:"export-one",at:"2026-11-12",format:"wide" as const,extension:"mp4",asset:"pro-file",start:0,end:60}]}}};const snapshot=JSON.stringify(song);
 globalThis.fetch=async(url,init)=>{calls++;assert.ok(!init?.method||init.method==="GET");if(fail)return Response.json({error:"Storage temporarily unavailable"},{status:503});const next=String(url).includes("cursor=");return Response.json({videos:next?[{id:"classic-file",at:"2026-11-10",source:"old",extension:"webm",size:100},{id:"later-file",at:"2026-11-13",source:"current",extension:"mp4",size:200}]:[{id:"pro-file",at:"2026-11-12",source:"current",extension:"mp4",size:200},{id:"classic-file",at:"2026-11-10",source:"old",extension:"webm",size:100}],next:next?null:"opaque-next"});};
 const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);const button=(name:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent===name)!;
 try{await act(async()=>root.render(<SavedLyricVideos song={song}/>));assert.equal(calls,0,"cloud listing runs only when requested");await act(async()=>button("Browse saved videos").click());assert.equal(document.querySelectorAll('a[download][href*="pro-file"]').length,1);assert.equal(document.querySelectorAll('a[download][href*="classic-file"]').length,1);assert.ok(document.body.textContent!.includes("Earlier recording version"));await act(async()=>button("Load next saved-video page").click());assert.equal(document.querySelectorAll('a[download][href*="classic-file"]').length,1);assert.ok(document.querySelector('a[download][href*="later-file"]'));
 fail=true;await act(async()=>button("Refresh saved videos").click());assert.ok(document.body.textContent!.includes("Storage temporarily unavailable"));assert.ok(document.querySelector('a[download][href*="classic-file"]'));assert.equal(JSON.stringify(song),snapshot);
 }finally{await act(async()=>root.unmount());globalThis.fetch=old;dom.window.close();}
});
