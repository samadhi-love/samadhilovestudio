import test from "node:test";
import assert from "node:assert/strict";
import React,{act} from "react";
import {JSDOM} from "jsdom";
import {JobStatus,finishedShownMs} from "../app/job-status";
import {DraftRecoveryProvider} from "../app/draft-recovery";

test("the status bar says what finished, lets old Done messages go, and remembers what you close",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://studio.test"});
  const old={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  const now=Date.now(),long=now-finishedShownMs-60_000;
  const jobs=[
    ...[1,2,3,4].map(i=>({id:`old-${i}`,type:"music-generation",status:"done",song_id:"s",updated_at:long})),
    {id:"fresh-song",type:"music-generation",status:"done",song_id:"s",updated_at:now-5_000},
    {id:"fresh-video",type:"video-render",status:"done",song_id:"s",updated_at:now-5_000},
    {id:"broken",type:"lyric-sync",status:"failed",song_id:"s",updated_at:long,error_message:"No provider request was sent."},
    {id:"busy",type:"music-generation",status:"working",song_id:"s",updated_at:now},
  ];
  globalThis.fetch=(async()=>Response.json({jobs})) as typeof fetch;
  const {createRoot}=await import("react-dom/client");
  const mount=async()=>{const root=createRoot(document.getElementById("root")!);await act(async()=>root.render(<DraftRecoveryProvider scope="owner"><JobStatus completed={()=>{}}/></DraftRecoveryProvider>));await act(async()=>{await new Promise(r=>setTimeout(r,0));});return root;};
  let root=await mount();
  try{
    const text=()=>document.body.textContent!;
    assert.doesNotMatch(text(),/\bDone\b/,"no bare Done");
    assert.equal((text().match(/Your song is ready/g)??[]).length,1,"only the song that just finished, not the four old ones");
    assert.match(text(),/Your video is ready/);
    assert.match(text(),/Didn't finish/,"unfinished work stays until handled");
    assert.match(text(),/Making your song/);
    assert.equal(document.querySelector('[data-testid="button-dismiss-job-busy"]'),null,"work in progress can't be closed");
    await act(async()=>document.querySelector<HTMLButtonElement>('[data-testid="button-dismiss-job-broken"]')!.click());
    await act(async()=>document.querySelector<HTMLButtonElement>('[data-testid="button-dismiss-job-fresh-song"]')!.click());
    assert.doesNotMatch(text(),/Didn't finish|Your song is ready/);
    await act(async()=>root.unmount());
    root=await mount();
    assert.doesNotMatch(text(),/Didn't finish|Your song is ready/,"closed messages stay closed after a reload");
    assert.match(text(),/Your video is ready/);
  }finally{await act(async()=>root.unmount());Object.assign(globalThis,old);dom.window.close();}
});
