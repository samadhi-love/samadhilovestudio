import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";

// "Write them for me" failed live with "The production result could not be
// confirmed": the lyric-plan answer {lyrics, languageProfile} has no revision,
// and the studio treated every revision-less answer from create as unconfirmed.
const directory="generated-artifacts/tests/words-only-result";
mkdirSync(directory,{recursive:true});
await build({entryPoints:["app/production-result.ts"],bundle:true,platform:"node",format:"esm",outfile:`${directory}/result.mjs`,logLevel:"silent"});
const {wordsOnlyResult}=await import(`../${directory}/result.mjs`);

test("the lyric writer's answer is accepted as words, not an unconfirmed production",()=>{
  assert.equal(wordsOnlyResult(true,{lyrics:"[Verse]\nStars above",languageProfile:{language:"en"}}),true);
});
test("anything that could be a song production still needs a confirmed revision",()=>{
  assert.equal(wordsOnlyResult(false,{lyrics:"[Verse]\nStars"}),false,"an error status is never accepted");
  assert.equal(wordsOnlyResult(true,{lyrics:""}),false,"empty words are not a result");
  assert.equal(wordsOnlyResult(true,{lyrics:"x",revision:4,data:{}}),false,"saved answers keep the revision path");
  assert.equal(wordsOnlyResult(true,{songId:"s1"}),false,"a song answer without revision stays unconfirmed");
  assert.equal(wordsOnlyResult(true,null),false);
});
test("the studio checks for words before reporting an unconfirmed production",()=>{
  const studio=readFileSync("app/studio.tsx","utf8");
  const words=studio.indexOf("if (wordsOnlyResult(response.ok, result))"),strict=studio.indexOf("!Number.isSafeInteger(result.revision)) throw");
  assert.ok(words>0&&strict>words);
});
