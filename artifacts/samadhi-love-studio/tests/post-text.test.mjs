import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";

const directory="generated-artifacts/tests/post-text";
mkdirSync(directory,{recursive:true});
await build({entryPoints:["app/post-text.ts"],bundle:true,platform:"node",format:"esm",packages:"external",outfile:`${directory}/post.mjs`,logLevel:"silent"});
const {postTextFor,postCaption,hookLine}=await import(`../${directory}/post.mjs`);

const song={title:"Ocean Heart",artist:"SAMADHI LOVE",tags:["Afrobeats","Soul"],idea:"A love song about the ocean at dawn\n\nOpening: soft",lyrics:"[Verse 1]\nI walked alone {whisper}\n\n[Chorus]\nOcean heart, carry me home\n\n[Verse 2]\nMore"};

test("YouTube gets a title, a full description and three hashtags",()=>{
  const post=postTextFor("youtube",song);
  assert.equal(post.title,"Ocean Heart – SAMADHI LOVE (Lyric Video)");
  assert.match(post.body,/Ocean Heart by SAMADHI LOVE, the official lyric video\./);
  assert.match(post.body,/A love song about the ocean at dawn/);
  assert.doesNotMatch(post.body,/Opening:/);
  assert.match(post.body,/“Ocean heart, carry me home”/,"the chorus line, not the first verse");
  assert.match(post.body,/Style: Afrobeats, Soul/);
  assert.deepEqual(post.hashtags,["#LyricVideo","#Afrobeats","#Soul"]);
});

test("TikTok and Reels get a short hook with hashtags",()=>{
  const tiktok=postCaption("tiktok",song);
  assert.match(tiktok,/^“Ocean heart, carry me home”\nOcean Heart · SAMADHI LOVE 🎶/);
  assert.match(tiktok,/#fyp/);
  assert.match(tiktok,/#SAMADHILOVE/);
  assert.ok(postTextFor("instagram",song).hashtags.includes("#Reels"));
  assert.ok(postTextFor("x",song).hashtags.length<=3);
});

test("works with only a name, and never puts {cues} or section labels in the hook",()=>{
  assert.equal(hookLine("[Verse]\n{soft} \n(ooh)\nFirst words {belt}"),"First words");
  const bare=postTextFor("tiktok",{title:"Untitled"});
  assert.match(bare.body,/Untitled/);
  assert.equal(postTextFor("youtube",{title:""}).title,"New song (Lyric Video)");
});

test("the export step offers Write it, a YouTube title and a thumbnail for widescreen videos",()=>{
  const studio=readFileSync("app/lyric-video-pro.tsx","utf8");
  assert.match(studio,/data-testid="button-write-post"/);
  assert.match(studio,/data-testid="input-video-title"/);
  assert.match(studio,/setPostCaption\(readyPostCaption\(purpose\.platform,postSource\(\)\)\)/,"a video made for a purpose comes with its post text");
  const publish=readFileSync("app/video-publishing.tsx","utf8");
  assert.match(publish,/format === "wide" && <YouTubeThumbnail/);
  assert.match(publish,/canvas\.width = 1280; canvas\.height = 720/);
});
