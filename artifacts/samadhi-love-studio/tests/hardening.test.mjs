import test from "node:test";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {build} from "esbuild";

const directory="generated-artifacts/tests/hardening";
mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`
export {rateLimited,resetRateLimits,limits} from "./app/server/rate-limit";
export {stemOutputFormat,stemFormats} from "./app/api/studio/elevenlabs/provider";
export {cspSummary,POST as cspReport} from "./app/api/studio/csp-report/route";
export {summarizeDeletedSongs,retentionPreview} from "./app/server/retention-preview";
export {falLyricRequest,falLyricModel,falLyricWriter} from "./app/server/fal-music";
export {falRequest} from "./app/server/ai-provider";
export {safetyHeaders,contentPolicy} from "./next.config";
export {default as nextConfig} from "./next.config";
export {fitSections,maxEngineSections,maxSectionChars,productionLyricChunks} from "./app/lyric-style-cues";
export {removeOldAutoParts} from "./app/auto-song-parts";
export {autoSinger,lyricVoiceHints} from "./app/singer-library";
export {videoBitrate} from "./app/lyric-pro-export";
export {looksLikeImage,imageSignatureCheck,NotImageError} from "./app/image-signature";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${directory}/bundle.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"silent",jsx:"automatic",loader:{".css":"empty"},plugins:[{name:"offline",setup(b){
  b.onResolve({filter:/^cloudflare:workers$/},()=>({path:"cf",namespace:"offline"}));
  b.onLoad({filter:/.*/,namespace:"offline"},()=>({contents:"export const env={};",loader:"js"}));
}}]});
const api=await import(`../${directory}/bundle.mjs`);

test("speed limits allow normal use, then slow one person down without affecting others",()=>{
  api.resetRateLimits();
  const now=1_000_000;
  for(let i=0;i<api.limits.stems.perMinute;i++)assert.equal(api.rateLimited("stems","ana",now+i),null);
  const blocked=api.rateLimited("stems","ana",now+10);
  assert.equal(blocked.status,429);
  assert.ok(Number(blocked.headers.get("Retry-After"))>0);
  assert.equal(api.rateLimited("stems","ben",now+10),null,"another person is not affected");
  assert.equal(api.rateLimited("upload","ana",now+10),null,"other actions are counted separately");
  assert.equal(api.rateLimited("stems","ana",now+61_000),null,"a minute later it works again");
});

test("speed-limit message is friendly and says nothing was lost",async()=>{
  api.resetRateLimits();
  for(let i=0;i<api.limits.stems.perMinute;i++)api.rateLimited("stems","cy",5);
  const body=await api.rateLimited("stems","cy",6).json();
  assert.equal(body.code,"rate-limited");assert.match(body.error,/Slow down/);assert.match(body.error,/Nothing was lost/);
});

test("hourly cap applies even when spread out",()=>{
  api.resetRateLimits();
  let t=0;for(let i=0;i<api.limits.stems.perHour;i++){assert.equal(api.rateLimited("stems","dee",t),null);t+=25_000;}
  assert.equal(api.rateLimited("stems","dee",t).status,429);
});

test("stems use 192k MP3 on Creator plans and above, 128k otherwise or when the check fails",async()=>{
  const original=globalThis.fetch;
  const plan=tier=>async()=>Response.json({tier,character_count:1,character_limit:10});
  try{
    for(const [tier,expected] of [["creator","mp3_44100_192"],["pro","mp3_44100_192"],["free","mp3_44100_128"],["starter","mp3_44100_128"]]){
      globalThis.fetch=plan(tier);assert.equal(await api.stemOutputFormat("key"),expected,tier);
    }
    globalThis.fetch=async()=>new Response("",{status:401});assert.equal(await api.stemOutputFormat("key"),"mp3_44100_128");
    globalThis.fetch=async()=>{throw new TypeError("offline");};assert.equal(await api.stemOutputFormat("key"),"mp3_44100_128");
  }finally{globalThis.fetch=original;}
});

test("lyric writer uses fal's supported router with a pinned model",()=>{
  assert.equal(api.falLyricModel,"openrouter/router");
  const body=api.falLyricRequest({description:"sunrise",singing:"",duration:90});
  assert.equal(body.model,api.falLyricWriter);assert.ok(body.system_prompt.includes("Return ONLY the lyrics"));
  assert.throws(()=>api.falRequest("k","/fal-ai/any-llm",{method:"POST"}),/Unexpected fal destination/,"retired endpoint is no longer reachable");
  assert.throws(()=>api.falRequest("k","/openrouter/router/other",{method:"POST"}),/Unexpected fal destination/);
});

test("safety headers: watch-only policy, no frame blocking, microphone kept",async()=>{
  const [rule]=await api.nextConfig.headers();
  assert.equal(rule.source,"/:path*");
  const names=rule.headers.map(h=>h.key);
  assert.ok(names.includes("Content-Security-Policy-Report-Only"));
  assert.ok(!names.includes("Content-Security-Policy"),"policy must not block yet");
  assert.ok(!names.includes("X-Frame-Options"),"Replit preview frames the app");
  assert.match(rule.headers.find(h=>h.key==="Permissions-Policy").value,/microphone=\(self\)/);
  assert.match(api.contentPolicy,/report-uri \/api\/studio\/csp-report/);
  assert.match(api.contentPolicy,/worker-src 'self' blob:/,"video export worker allowed");
});

test("content-policy reports keep only rule and host name",async()=>{
  assert.deepEqual(api.cspSummary({"csp-report":{"effective-directive":"img-src","blocked-uri":"https://evil.example/path?token=secret"}}),{directive:"img-src",blocked:"evil.example"});
  assert.deepEqual(api.cspSummary({"csp-report":{"violated-directive":"script-src 'self'","blocked-uri":"inline"}}),{directive:"script-src",blocked:"inline"});
  assert.equal(api.cspSummary("nope"),null);
  const reply=await api.cspReport(new Request("https://x.test/api/studio/csp-report",{method:"POST",body:JSON.stringify({"csp-report":{"effective-directive":"img-src","blocked-uri":"https://a.b/c"}})}));
  assert.equal(reply.status,204);
  const junk=await api.cspReport(new Request("https://x.test/api/studio/csp-report",{method:"POST",body:"not json"}));
  assert.equal(junk.status,204);
});

test("cleanup preview counts deleted songs past the 30-day grace period and deletes nothing",async()=>{
  const day=86_400_000,now=Date.UTC(2026,10,21);
  const iso=t=>new Date(t).toISOString();
  const rows=[
    {deleted_at:iso(now-40*day),delete_after:iso(now-10*day)},
    {deleted_at:iso(now-5*day),delete_after:iso(now+25*day)},
    {deleted_at:iso(now-40*day),delete_after:null},
    {deleted_at:null,delete_after:null},
  ];
  const summary=api.summarizeDeletedSongs(rows,now);
  assert.equal(summary.pastGrace,1);assert.equal(summary.restorable,2);assert.equal(summary.deletedSongs,3);
  assert.equal(summary.oldestPastGrace,iso(now-10*day));
  const sql=[];
  const DB={prepare(q){sql.push(q);return {bind:()=>({all:async()=>({results:rows})})};}};
  const preview=await api.retentionPreview(DB,now);
  assert.equal(preview.mode,"preview");assert.equal(preview.pastGrace,1);
  assert.ok(sql.every(q=>/^\s*SELECT/i.test(q)),"read-only");
  assert.equal(await api.retentionPreview({prepare(){throw new Error("busy");}},now),null);
});

test("more than 30 sections are joined into neighbours, keeping every word in order",()=>{
  const lyrics=Array.from({length:58},(_,i)=>`[Verse ${i+1}]\nLine number ${i+1} of the song`).join("\n\n");
  const parsed=api.productionLyricChunks(lyrics,true,false);
  assert.equal(parsed.length,58);
  const fitted=api.fitSections(parsed,api.maxEngineSections);
  assert.ok(fitted&&fitted.length<=30,`got ${fitted?.length}`);
  assert.ok(fitted.every(s=>s.text.length<=api.maxSectionChars));
  const words=t=>t.replace(/\[[^\]]*\]/g,"").split(/\s+/).filter(Boolean).join(" ");
  assert.equal(words(fitted.map(s=>s.text).join("\n")),words(parsed.map(s=>s.text).join("\n")),"same words, same order");
  assert.equal(api.fitSections(parsed.slice(0,5),30).length,5,"short songs are untouched");
  assert.equal(api.fitSections([{text:"x".repeat(790)},{text:"y".repeat(790)}],1),null,"truly too long is reported, not cut");
});

test("old automatic labels are removed from drafts; the writer's own labels and words stay",()=>{
  const old="[Intro]\n[INTRO – Powerful male spoken, crystal-clear]\n\n"+Array.from({length:8},(_,i)=>`[Verse ${i+1}]\nLine ${i+1}`).join("\n\n")+"\n\n[Chorus]\nFind the middle!";
  const cleaned=api.removeOldAutoParts(old);
  assert.doesNotMatch(cleaned,/^\[(Intro|Verse \d+|Chorus)\]$/m);
  assert.match(cleaned,/^\[INTRO – Powerful male spoken, crystal-clear\]$/m);
  for(let i=1;i<=8;i++)assert.match(cleaned,new RegExp(`^Line ${i}$`,"m"));
  assert.match(cleaned,/Find the middle!/);
  const writer="[Verse]\nMy words\n\n[Chorus]\nMy hook";
  assert.equal(api.removeOldAutoParts(writer),writer,"a writer's own few labels are left alone");
  assert.equal(api.removeOldAutoParts("[Chorus]\n[CHORUS – Clear]\nFind it"),"[CHORUS – Clear]\nFind it","plain duplicate above the writer's tag goes");
});

test("Auto singer reads the lyrics' voice notes and your main style first",()=>{
  const lyrics="melodies, clear powerful male vocals, 88–92 BPM\n[INTRO – Powerful male spoken, crystal-clear]\nI remember who I am";
  const styles="Arabian Euro House, Lebanese Dabke, R&B, analog synths";
  assert.equal(api.autoSinger(" "+api.lyricVoiceHints(lyrics),styles)?.name,"Arabic tarab · male");
  assert.notEqual(api.autoSinger(" "+api.lyricVoiceHints(lyrics),"R&B, Soul")?.arrangement,"Solo female lead","a male song never gets a female singer");
  assert.equal(api.autoSinger(" "+api.lyricVoiceHints("[Verse]\nEvery man and woman"),"R&B")?.name,"Soulful R&B · female","sung words are not read as voice notes");
  assert.equal(api.autoSinger("male voice","Spiritual Dance")?.arrangement,undefined,"no fitting male singer: the studio decides instead of switching gender");
});

test("video quality: 12 Mbps at 1080p, 6 Mbps at 720p, stepping down only to keep a full song under 512 MB",()=>{
  assert.equal(api.videoBitrate(1080,60),12_000_000);
  assert.equal(api.videoBitrate(720,200),6_000_000);
  for(const seconds of [240,330,390]){const bytes=(api.videoBitrate(1080,seconds)+192_000)*seconds/8;assert.ok(bytes<512*1024*1024,`${seconds}s fits: ${Math.round(bytes/1048576)} MB`);}
  assert.ok(api.videoBitrate(1080,390)>=8_000_000,"even a 6.5-minute 1080p video keeps at least 8 Mbps");
});

test("uploaded pictures are checked by their real content, not just their name",async()=>{
  const png=new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13,1,2,3]);
  const jpeg=new Uint8Array([0xff,0xd8,0xff,0xe0,0,16,74,70,73,70,0,1,1]);
  const webp=new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80,86,80,56]);
  const html=new TextEncoder().encode("<html><script>alert(1)</script></html>");
  assert.ok(api.looksLikeImage(png,"image/png")&&api.looksLikeImage(jpeg,"image/jpeg")&&api.looksLikeImage(webp,"image/webp"));
  assert.ok(!api.looksLikeImage(html,"image/png"));
  const run=async(bytes,allowed)=>{const check=api.imageSignatureCheck(allowed);const out=new Response(new Blob([bytes]).stream().pipeThrough(check));try{const got=new Uint8Array(await out.arrayBuffer());return {ok:true,same:got.length===bytes.length,refused:check.state.refused};}catch(e){return {ok:false,error:e,refused:check.state.refused};}};
  const good=await run(jpeg,["image/png","image/jpeg","image/webp"]);assert.ok(good.ok&&good.same,"a JPEG named .png still uploads, unchanged");
  const bad=await run(html,["image/png","image/jpeg","image/webp"]);assert.ok(!bad.ok&&bad.refused&&bad.error instanceof api.NotImageError,"a fake picture is refused");
  const logo=await run(jpeg,["image/png","image/webp"]);assert.ok(!logo.ok,"logos stay PNG/WebP (they need transparency)");
});
