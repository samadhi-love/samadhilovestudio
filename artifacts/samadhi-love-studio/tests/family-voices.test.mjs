import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";

const directory="generated-artifacts/tests/family-voices";
mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`export * from "./app/family-voices";export {homeWorlds} from "./app/cosmic-home";`,resolveDir:process.cwd(),loader:"ts"},bundle:true,platform:"node",format:"esm",packages:"external",loader:{".css":"empty"},outfile:`${directory}/family.mjs`,logLevel:"silent"});
const {familySafe,isFamilySong,familyVoiceDirection,familyLeaveOut,homeWorlds}=await import(`../${directory}/family.mjs`);

test("a song for kids is sung by warm, friendly adult voices, on both engines",()=>{
  for(const prompt of ["A happy sing-along for kids about colors","A lullaby for my daughter","A nursery rhyme about the moon","Children's song about brushing teeth","A preschool counting song"]){
    const safe=familySafe({prompt,voice:"",negativeStyle:""});
    assert.equal(safe.voice,familyVoiceDirection,prompt);
    assert.equal(safe.negativeStyle,familyLeaveOut,prompt);
    assert.equal(safe.prompt,prompt,"the idea itself is kept");
  }
});

test("asking for a child's voice or a children's choir becomes friendly adult voices",()=>{
  const safe=familySafe({prompt:"A Christmas song with a children's choir and a little girl's voice",voice:"kids vocals, bright",genres:"Pop",negativeStyle:"heavy drums"});
  assert.doesNotMatch(safe.prompt+safe.voice,/children's choir|girl's voice|kids vocals/i);
  assert.match(safe.prompt,/friendly adult voices/);
  assert.equal(safe.voice,`friendly adult voices, bright; ${familyVoiceDirection}`);
  assert.equal(safe.negativeStyle,`heavy drums, ${familyLeaveOut}`,"the writer's own Leave Out is kept");
  assert.equal(familySafe(safe).negativeStyle,safe.negativeStyle,"never added twice");
  assert.ok(isFamilySong({voice:"boy soprano"}));
});

test("every other song is left exactly as written, including love songs that say baby",()=>{
  for(const fields of [{prompt:"Oh baby, a soulful love song",voice:"warm female R&B lead"},{prompt:"A hip hop track about the city",voice:""},{prompt:"A gospel song of gratitude",genres:"Gospel"}]){
    assert.equal(familySafe(fields),fields);
  }
});

test("the song route applies it before anything reads the request, and Kids & Family is a world on the main page",()=>{
  const route=readFileSync("app/api/studio/create/route.ts","utf8");
  const applied=route.indexOf("const safe = familySafe(fields);"),firstRead=route.indexOf('const text = (name: string)');
  assert.ok(applied>0&&applied<firstRead);
  const kids=homeWorlds.find(w=>w.id==="kids");
  assert.equal(kids.name,"Kids & Family");
  assert.match(kids.line,/grown-up voices/);
  assert.ok(isFamilySong({prompt:kids.idea}),"the world's own idea gets the safeguard");
  assert.match(readFileSync("app/cosmic-home.css","utf8"),/\.cosmic-home-worlds\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,"nine worlds in even rows of three");
});
