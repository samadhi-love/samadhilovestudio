// The consent words matcher: the person's promise must be said; names can be misheard.
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";
const directory="generated-artifacts/tests/consent-check";mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`export {consentMatches,consentWords} from "./app/server/consent-check";export {consentPhrase} from "./app/my-voice-data";`,resolveDir:process.cwd(),loader:"ts"},
  bundle:true,platform:"node",format:"esm",packages:"external",outfile:`${directory}/m.mjs`,plugins:[{name:"x",setup(b){
    b.onResolve({filter:/ai-provider$|fal-transcribe$/},a=>({path:a.path,namespace:"x"}));
    b.onLoad({filter:/.*/,namespace:"x"},()=>({loader:"js",contents:"export const providerRequest=()=>{throw new Error('no')};export class FalSyncFailed extends Error{};export const transcribeWithFal=()=>{throw new Error('no')};"}));
  }}]});
const m=await import(`../${directory}/m.mjs`);
const phrase=m.consentPhrase("Samadhi Love");

test("the exact sentence, or speech-to-text spelling of it, matches",()=>{
  assert.equal(m.consentMatches(phrase,phrase).matched,true);
  assert.equal(m.consentMatches("my name is samadi luv this is my own voice i am eighteen or older and i agree to use it in versatile studio",phrase).matched,true);
  assert.equal(m.consentMatches("My name's Samadhi. This is my own voice, I'm 18 or older and I agree to use it in Versual Studio",phrase).matched,true);
});
test("other words, or a missing promise, do not match",()=>{
  assert.equal(m.consentMatches("",phrase).matched,false);
  assert.equal(m.consentMatches("hello hello testing one two three",phrase).matched,false);
  const noOwn=m.consentMatches("My name is Samadhi Love. This is a voice. I am 18 or older, and I agree to use it in Versual Studio.",phrase);
  assert.equal(noOwn.matched,false);assert.deepEqual(noOwn.missing,["my own voice"]);
  const noAgree=m.consentMatches("My name is Samadhi Love. This is my own voice. I am 18 or older, and I do not want it in Versual Studio.",phrase);
  assert.equal(noAgree.matched,false);assert.ok(noAgree.missing.includes("I agree"));
  assert.equal(m.consentMatches("My name is Samadhi Love. This is my own voice. I am 18 or older, and I don't agree to use it in Versual Studio.",phrase).matched,false,"saying no is not consent");
});
test("words are compared plainly",()=>{
  assert.deepEqual(m.consentWords("I'm 18, OK?"),["im","eighteen","ok"]);
});
