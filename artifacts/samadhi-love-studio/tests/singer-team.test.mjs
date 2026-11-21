import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";

const directory="generated-artifacts/tests/singer-team";
mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`export * from "./app/singer-team";export {productionLyricChunks} from "./app/lyric-style-cues";`,resolveDir:process.cwd(),loader:"ts"},bundle:true,platform:"node",format:"esm",packages:"external",loader:{".css":"empty"},outfile:`${directory}/team.mjs`,logLevel:"silent"});
const {promptTeam,labelPartSingers,teamById,teamFromDirection,singerTeams,productionLyricChunks}=await import(`../${directory}/team.mjs`);

const heard=words=>promptTeam(words)?.id;

test("the person's words choose who sings",()=>{
  const cases={
    "A love duet about the ocean":"duet-mf",
    "a duo singing about home":"duet-mf",
    "sung by a man and a woman, slow ballad":"duet-mf",
    "male and female voices trading lines":"duet-mf",
    "two women singing a soul song":"duet-ff",
    "a female duet, country":"duet-ff",
    "two men singing a sea shanty":"duet-mm",
    "a group chant for the stadium":"group-chant",
    "chanting warriors, drums":"group-chant",
    "football chant with everyone":"group-chant",
    "gospel choir praising the morning":"choir",
    "gregorian chant in a cathedral":"choir",
    "a trio with tight harmonies":"trio",
    "girl group pop anthem":"trio",
    "call and response worship song":"call-response",
    "rapper with a singer on the chorus":"rap-sung",
    "rap verses with a sung hook":"rap-sung",
    "female vocals, dreamy pop":"solo-female",
    "sung by a man, folk":"solo-male",
  };
  for(const [words,id] of Object.entries(cases))assert.equal(heard(words),id,words);
});

test("story words do not switch the singers",()=>{
  for(const words of ["a song about a man and a woman in love","lost in the crowd tonight","we stand all together","a hopeful song about starting again","no choir, just one voice","without a duet"])
    assert.equal(heard(words),undefined,words);
});

test("each part of a duet is labeled with who sings it",()=>{
  const lyrics="[Verse 1]\nI walked alone\n\n[Chorus]\nWe rise\n\n[Verse 2]\nYou found me\n\n[Bridge]\nHold on\n\n[Chorus]\nWe rise";
  const out=labelPartSingers(lyrics,teamById("duet-mf"));
  assert.match(out,/\[Verse 1: Male voice\]/);
  assert.match(out,/\[Verse 2: Female voice\]/);
  assert.match(out,/\[Chorus: Both voices together in harmony\]/);
  assert.match(out,/\[Bridge: Female voice, then both voices\]/);
  // sung words are untouched
  assert.deepEqual(out.split("\n").filter(l=>!l.startsWith("[")),lyrics.split("\n").filter(l=>!l.startsWith("[")));
});

test("the labels reach the engine as directions, never as sung words",()=>{
  const out=labelPartSingers("[Verse 1]\nHello sky\n\n[Chorus]\nAll of us",teamById("group-chant"));
  const chunks=productionLyricChunks(out,true,false);
  assert.equal(chunks.length,2);
  assert.doesNotMatch(chunks[0].text,/chants back/);
  assert.match(chunks[0].text,/Hello sky/);
  assert.match(chunks[1].directions.join(" "),/Whole group chanting together/);
});

test("solo songs and the person's own part directions stay as written",()=>{
  const lyrics="[Verse 1]\nOne\n\n[Chorus: whisper]\nTwo";
  assert.equal(labelPartSingers(lyrics,teamById("solo-female")),lyrics);
  assert.equal(labelPartSingers(lyrics,undefined),lyrics);
  assert.match(labelPartSingers(lyrics,teamById("choir")),/\[Chorus: whisper\]/);
});

test("the server finds the group from the voice direction, adults only",()=>{
  for(const team of singerTeams){
    if(team.voices>1)assert.equal(teamFromDirection("Something. "+team.direction+" More.")?.id,team.id);
    assert.doesNotMatch(team.direction,/\b(child|children|kid|kids)\b/i);
    assert.ok(team.direction.length<=200,team.id);
  }
});

test("Create shows Who sings in both Just Begin and Shape It, and the route labels parts",()=>{
  const quick=readFileSync("app/quick-create.tsx","utf8");
  assert.equal(quick.match(/<TeamChoice /g)?.length,2);
  assert.match(quick,/pickedTeam\?\?wordTeam\?\?proTeam/);
  assert.doesNotMatch(quick,/labelPartSingers/,"your lyrics box is never rewritten; the server labels parts");
  const route=readFileSync("app/api/studio/create/route.ts","utf8");
  assert.match(route,/teamFromDirection\(voice\)/);
  assert.match(route,/labelPartSingers\(written,singingTeam\)/);
});
