import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {LyricVideoPro} from "../app/lyric-video-pro";
import {freshSong} from "../app/studio-data";
import {newProSettings} from "../app/lyric-pro-data";
import type {ElevenLabsKey} from "../app/elevenlabs-key";

test("auto lyric action aligns the selected recording once, requires review and protects existing timings",async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Image:dom.window.Image,localStorage:dom.window.localStorage,requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},IS_REACT_ACT_ENVIRONMENT:true});
 Object.defineProperty(document,"fonts",{value:{load:async()=>[]}});
 window.matchMedia=(()=>({matches:false,addEventListener(){},removeEventListener(){}})) as any;dom.window.HTMLCanvasElement.prototype.getContext=(()=>null) as any;
 const oldFetch=globalThis.fetch;const requests:Record<string,any>[]=[],snapshots:Record<string,any>[]=[];
 globalThis.fetch=async(url,init)=>{if(String(url)==="/api/studio/credits")return Response.json({funding:"own",credits:0,enabled:true});if(String(url)==="/api/studio/jobs"){const queued=JSON.parse(String(init?.body));assert.equal(queued.route,"/api/studio/lyric-sync");const input=queued.input;requests.push(input);if(input.mode==="audit"){assert.equal(snapshots.length,1,"timed captions save before a second paid recognition request");return Response.json({error:"Recognition is temporarily unavailable"},{status:503});}return Response.json({cues:[{text:"Love is here",time:0,end:5}],engine:"fixture alignment",warnings:[]});}if(String(url)==="/api/studio/lyric-project"&&init?.method==="PUT"){const input=JSON.parse(String(init.body));snapshots.push(input);return Response.json({project:{...input.project,pro:{...input.project.pro,updatedAt:"2026-11-13T12:00:00Z"}},data:{songs:[],templates:[]},revision:1});}return Response.json({versions:[],workspace:""});};
 const{createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 const base={...freshSong("selected","Selected song",0),audioId:"exact-recording",audioFormat:"mp3" as const};base.notes.lyrics="Love is here";
 const song={...base,lyricVideo:{theme:"cosmic" as const,motion:"drift" as const,format:"wide" as const,cues:[],pro:newProSettings(base,60)}};
 const provider={connected:true,busy:false,status:{available:true,saved:true,musicAccess:"available"}} as ElevenLabsKey;
 const props={songs:[song],initialSongId:song.id,saving:false,save:async()=>true,elevenLabs:provider,connectionSettings(){},upload(){},generate:async()=>undefined,importFile:async()=>undefined,persisted(){},persistBusy(){},dirty(){}};
 try{await act(async()=>root.render(<LyricVideoPro {...props} autoCaptionRequest={{songId:song.id,id:"click-one"}}/>));assert.equal(requests.filter(r=>r.mode!=="audit").length,1);assert.equal(requests[0].songId,song.id);assert.equal(requests[0].audioId,"exact-recording");assert.equal(requests[0].mode,"align");assert.equal(requests[0].text,"Love is here");assert.ok(document.body.textContent!.includes("mark the review complete"));assert.equal(snapshots[0].project.cues[0].text,"Love is here");assert.equal(snapshots[0].snapshot,true);assert.equal(snapshots[0].project.pro.alignment.reviewed,false);
  await act(async()=>root.render(<LyricVideoPro {...props} autoCaptionRequest={{songId:song.id,id:"click-one"}}/>));assert.equal(requests.filter(r=>r.mode!=="audit").length,1,"rerenders cannot trigger duplicate provider jobs");
  await act(async()=>root.render(<LyricVideoPro key="existing" {...props} songs={[{...song,lyricVideo:{...song.lyricVideo,cues:[{text:"Keep timing",time:1,end:4}]}}]} autoCaptionRequest={{songId:song.id,id:"click-two"}}/>));assert.equal(requests.filter(r=>r.mode!=="audit").length,1);assert.ok(document.body.textContent!.includes("already has timed captions"));
 }finally{await act(async()=>root.unmount());globalThis.fetch=oldFetch;dom.window.close();}
});
