import test from "node:test";
import assert from "node:assert/strict";
import React,{act,useState} from "react";
import {JSDOM} from "jsdom";
import {freshSong,type Song} from "../app/studio-data";
import {duplicateSongDetails,songCreatedTime,songStatus,sortSongs,stampSong} from "../app/song-library";
import {SongCard,SongHubProvider,type SongHub} from "../app/song-card";
import {QuickCreate} from "../app/quick-create";
import {CreateStudio} from "../app/create-studio";
import type {ElevenLabsKey} from "../app/elevenlabs-key";

test("creation sorting is stable, likes stay positive, and undated legacy songs retain their order",()=>{
 const old={...freshSong("old","Old",0),createdAt:"2026-01-01T00:00:00Z",favorite:true},recent={...freshSong("new","New",0),createdAt:"2026-02-01T00:00:00Z"},a=freshSong("a","Legacy A",0),b=freshSong("b","Legacy B",0);
 const input=[a,recent,b,old],before=structuredClone(input);
 assert.deepEqual(sortSongs(input).map(s=>s.id),["new","old","a","b"]);assert.deepEqual(sortSongs(input,"oldest").map(s=>s.id),["old","new","a","b"]);
 assert.deepEqual(sortSongs(input,"liked").map(s=>s.id),["old"]);assert.deepEqual(input,before);assert.equal(songCreatedTime(a),null);
 const stamped=stampSong({...old,name:"Edited",createdAt:"2099-01-01T00:00:00Z"},old,"2026-03-01T00:00:00Z");assert.equal(stamped.createdAt,old.createdAt);assert.equal(stamped.updatedAt,"2026-03-01T00:00:00Z");
 const legacy=stampSong({...a,name:"Edit legacy"},a);assert.equal(legacy.createdAt,undefined);
 assert.equal(songStatus({...old,generation:{provider:"x",model:"x",status:"incomplete",approvedLyrics:"",compositionPlan:null,createdAt:old.createdAt,captionReady:false,timingSource:"none"}}),"Needs attention");
});
test("writing duplicates preserve creative work without copying private audio or publishing references",()=>{
 const source={...freshSong("original","Original",0),audioId:"immutable",audioFormat:"wav" as const,deletedAt:"2026-01-01T00:00:00Z",master:{songId:"original",audioId:"immutable"},notes:{...freshSong("x","x",0).notes,lyrics:"نور وحب"}};
 const copy=duplicateSongDetails(source,"copy");assert.equal(copy.notes.lyrics,source.notes.lyrics);assert.equal(copy.audioId,undefined);assert.equal(copy.deletedAt,undefined);assert.equal(copy.master,undefined);assert.equal(copy.createdAt,undefined);assert.equal(copy.creationDraft,true);copy.notes.lyrics="Edited";assert.equal(source.notes.lyrics,"نور وحب");
});
async function setup(){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:"https://studio.test"});
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,localStorage:dom.window.localStorage,requestAnimationFrame:()=>0,IS_REACT_ACT_ENVIRONMENT:true,__localRenders:[]});
 const {createRoot}=await import("react-dom/client"),root=createRoot(document.getElementById("root")!);
 const button=(label:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent?.trim()===label)!;
 const input=async(element:HTMLInputElement|HTMLTextAreaElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element),"value")!.set!.call(element,value);element.dispatchEvent(new dom.window.Event("input",{bubbles:true}));});
 const submit=()=>act(async()=>{document.querySelector("form")!.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));});
 return {root,button,input,submit,close:async()=>{await act(async()=>root.unmount());dom.window.close();}};
}
test("each song has working actions, personal likes, and 14-day deletion without automatic publication",async()=>{
 const h=await setup();let songs:Song[]=[{...freshSong("one","Sacred song",0),audioFormat:"wav",audioId:"source"},freshSong("two","Writing project",1)];let published=0,edited="";
 function Harness(){const [items,setItems]=useState(songs),[expanded,setExpanded]=useState(""),[preview,setPreview]=useState("");songs=items;const save=async(song:Song)=>{setItems(list=>list.map(s=>s.id===song.id?song:s));return true;};
 const hub:SongHub={busy:false,folders:[],stemsConnected:false,expanded,setExpanded,preview,setPreview,save,action:(_a,s)=>{edited=s.id;},archive:s=>save({...s,deletedAt:"2026-01-01T00:00:00Z"}),duplicate:async()=>true,publish:async()=>{published++;},playlist:async()=>true};
 return <SongHubProvider value={hub}>{items.map(song=><SongCard key={song.id} song={song}/>)}</SongHubProvider>;}
 try{await act(async()=>h.root.render(<Harness/>));assert.equal(document.querySelectorAll('button[aria-controls]').length,2);assert.equal(document.querySelectorAll("button button").length,0);
 await act(async()=>(document.querySelector('button[aria-label="Like Sacred song"]') as HTMLButtonElement).click());assert.equal(songs[0].favorite,true);
 await act(async()=>h.button("Song actions").click());assert(h.button("Generate new version"));await act(async()=>h.button("Edit details").click());assert.equal(edited,"one");assert.equal(published,0);
 await act(async()=>h.button("Delete song").click());assert(songs[0].deletedAt);assert.equal(songs[0].audioId,"source");assert.equal(published,0);assert(h.button("Restore to My Songs"));
 await act(async()=>h.button("Restore to My Songs").click());assert.equal(songs[0].deletedAt,undefined);assert.equal(songs[0].audioId,"source");assert.equal(published,0);
 await act(async()=>h.button("Publish / manage visibility").click());assert.equal(published,1);assert(!/Trash|Dislike|Archive creation/.test(document.body.textContent!));
 }finally{await h.close();}
});
test("Quick Create auto-saves local audio and retries a failed save with the same creation reference",async()=>{
 const h=await setup();const ids:(string|undefined)[]=[];let attempts=0;
 try{await act(async()=>h.root.render(<QuickCreate connected={false} saving={false} drafts={[]} settings={()=>{}} guided={()=>{}} openDrafts={()=>{}} generateSong={async()=>undefined} saveSketch={async(_file,_title,_prompt,_code,_take,id)=>{ids.push(id);return ++attempts===1?undefined:"saved";}}/>));
 await act(async()=>h.button("Custom").click());await act(async()=>h.button("Built-in sketch · no singing, no credits").click());await h.input(document.querySelector<HTMLTextAreaElement>('[data-testid="input-song-idea"]')!,"A 3-second instrumental");await h.submit();assert.equal(attempts,1);assert(h.button("Retry save to My Songs"));assert(document.querySelector('a[download]'));
 await act(async()=>h.button("Retry save to My Songs").click());assert.equal(attempts,2);assert.equal(ids[0],ids[1]);assert(ids[0]);assert(!h.button("Retry save to My Songs"));
 }finally{await h.close();}
});
test("Guided instrumental creation saves automatically and preserves a failed original for retry",async()=>{
 const h=await setup();const ids:(string|undefined)[]=[];let attempts=0;
 try{await act(async()=>h.root.render(<CreateStudio seed={{idea:"A 3-second instrumental",instrumental:true}} voiceDesignAllowed={false} elevenLabs={{connected:false,defaultProvider:false,busy:false} as ElevenLabsKey} connectionSettings={()=>{}} drafts={[]} voices={[]} saving={false} operationError="" startAtDrafts={false} firstSongRequest={false} finishFirstSongRequest={()=>{}} openVocalStudio={()=>{}} send={async()=>false} saveDraft={async()=>true} saveInstrumental={async(_file,_title,_prompt,_settings,_project,id)=>{ids.push(id);return ++attempts>1;}} move={async()=>true} open={()=>{}} remix={()=>{}}/>));
 await act(async()=>[...document.querySelectorAll("button")].find(b=>b.querySelector("strong")?.textContent==="Beginner")!.click());await h.submit();assert.equal(attempts,1);assert(h.button("Retry save to My Songs"));
 await act(async()=>h.button("Retry save to My Songs").click());assert.equal(attempts,2);assert.equal(ids[0],ids[1]);assert(ids[0]);assert(!h.button("Retry save to My Songs"));
 }finally{await h.close();}
});
test("release sharing requires verified publication and shares a release URL, never a private media endpoint",async()=>{
 const h=await setup(),song={...freshSong("mine","My song",0),audioFormat:"wav" as const};let copied="";
 const originalClipboard=Object.getOwnPropertyDescriptor(navigator,"clipboard");Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async(value:string)=>{copied=value;}}});
 const hub:SongHub={busy:false,folders:[],stemsConnected:false,expanded:song.id,setExpanded:()=>{},preview:"",setPreview:()=>{},save:async()=>true,action:()=>{},archive:async()=>true,duplicate:async()=>true,publish:async()=>{},playlist:async()=>true,releases:{mine:{status:"Published",releaseId:"release-mine"}}};
 try{await act(async()=>h.root.render(<SongHubProvider value={hub}><SongCard song={song}/></SongHubProvider>));assert(!h.button("Share release link"));
 await act(async()=>h.root.render(<SongHubProvider value={{...hub,releaseLoaded:true}}><SongCard song={song}/></SongHubProvider>));await act(async()=>h.button("Share release link").click());assert.equal(copied,"https://studio.test/community?song=release-mine");assert(!copied.includes("/api/studio/"));
 }finally{if(originalClipboard)Object.defineProperty(navigator,"clipboard",originalClipboard);else delete (navigator as unknown as {clipboard?:unknown}).clipboard;await h.close();}
});
test("private song sharing requires a deliberate grant and offers revocation plus honest social upload links",async()=>{
 const h=await setup(),originalFetch=globalThis.fetch,actions:string[]=[];
 globalThis.fetch=(async(_url:unknown,options?:RequestInit)=>{const body=options?.body?JSON.parse(String(options.body)):null;if(body)actions.push(body.action);return Response.json({path:body?.action==="create"?"/share?token="+"a".repeat(64):null});}) as typeof fetch;
 try{
  const {SongShareControls}=await import("../app/song-share-controls");
  await act(async()=>h.root.render(<SongShareControls songId="own" title="My sacred song"/>));assert.equal(actions.length,0);
  await act(async()=>h.button("Share listening link").click());assert.equal(h.button("Create listening link").disabled,true);assert.equal(actions.length,0);
  await act(async()=>(document.querySelector('input[type=checkbox]') as HTMLInputElement).click());
  await act(async()=>h.button("Create listening link").click());assert.deepEqual(actions,["create"]);
  const value=(document.querySelector('input[readonly]') as HTMLInputElement).value;assert(value.startsWith("https://studio.test/share?token="));assert(!value.includes("/api/studio"));
  assert([...document.querySelectorAll("a")].some(a=>a.href.startsWith("mailto:")));assert(document.body.textContent?.includes("do not post automatically"));
  await act(async()=>h.button("Revoke link").click());assert.deepEqual(actions,["create","revoke"]);assert.equal(document.querySelector('input[readonly]'),null);
 }finally{globalThis.fetch=originalFetch;await h.close();}
});

test("Recently deleted shows the 14-day policy and disables restore after its server deadline",async()=>{
 const h=await setup(),song={...freshSong('expired','Expired song',0),deletedAt:'2000-01-01T00:00:00Z',deleteAfter:'2000-01-15T00:00:00Z'};let saves=0;
 const hub:SongHub={busy:false,folders:[],stemsConnected:false,expanded:song.id,setExpanded(){},preview:'',setPreview(){},save:async()=>{saves++;return true;},action(){},archive:async()=>true,duplicate:async()=>true,publish:async()=>{},playlist:async()=>true};
 try{await act(async()=>h.root.render(<SongHubProvider value={hub}><SongCard song={song}/></SongHubProvider>));assert(document.body.textContent!.includes('14 days'));assert(document.body.textContent!.includes('Recovery ended'));assert(h.button('Restore to My Songs').disabled);await act(async()=>h.button('Restore to My Songs').click());assert.equal(saves,0);assert(!document.body.textContent!.includes('Archive creation'));}finally{await h.close();}
});
