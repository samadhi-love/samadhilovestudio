// "Make my voice sound better" one-tap tuning, and the Kids genre on Create.
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";

const directory="generated-artifacts/tests/voice-polish-kids";
mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`
export {polishClip,polishLevelOf,polishLevels,VoicePolish} from "./app/vocal/voice-polish";
export {dry,noTuning,effectControls} from "./app/vocal/session";
export {quickGenres,autoInstruments} from "./app/auto-instruments";
export {familySafe,isFamilySong} from "./app/family-voices";
export {suggestedThemes} from "./app/background-chooser";
export {createElement} from "react";
export {renderToStaticMarkup} from "react-dom/server";
`,resolveDir:process.cwd(),loader:"tsx"},outfile:`${directory}/bundle.mjs`,bundle:true,platform:"node",format:"esm",jsx:"automatic",packages:"external",logLevel:"error",loader:{".css":"empty"}});
const api=await import(`../${directory}/bundle.mjs`);

const clip=()=>({id:"c",source:"s",name:"Lead",role:"Lead",start:0,end:10,at:0,volume:1,pan:0,mute:false,solo:false,bypass:false,
  effects:{...api.dry},tuning:{...api.noTuning,key:7,notes:[{start:1,end:2,midi:60}]}});

test("voice polish: Off, Light, Medium, Strong each tune and polish, stronger each step",()=>{
  const levels=["light","medium","strong"].map(l=>api.polishClip(clip(),l));
  for(let i=1;i<levels.length;i++){
    assert.ok(levels[i].tuning.strength>levels[i-1].tuning.strength,"more pitch correction");
    assert.ok(levels[i].effects.compression>levels[i-1].effects.compression,"more even volume");
  }
  for(const l of levels){
    assert.equal(l.tuning.scale,"chromatic","tunes to the nearest note in any key");
    assert.equal(l.tuning.key,7,"your chosen key is kept");
    assert.deepEqual(l.tuning.notes,[{start:1,end:2,midi:60}],"manual note fixes are kept");
    assert.ok(l.effects.lowCut>0&&l.effects.deEss>0&&l.effects.limiter>0,"rumble cut, softer S sounds, safety limiter");
    assert.equal(l.bypass,false);
    for(const [key,,min,max] of api.effectControls)assert.ok(l.effects[key]>=min&&l.effects[key]<=max,`${key} within its safe range`);
  }
  const off=api.polishClip({...clip(),...levels[2]},"off");
  assert.equal(off.tuning.strength,0,"Off = no tuning");
  assert.deepEqual(off.effects,api.dry,"Off = your voice exactly as recorded");
});

test("voice polish knows which level is on, and shows four clear choices",()=>{
  for(const level of ["off","light","medium","strong"])assert.equal(api.polishLevelOf({...clip(),...api.polishClip(clip(),level)}),level);
  const custom={...clip(),...api.polishClip(clip(),"medium")};custom.effects={...custom.effects,reverb:77};
  assert.equal(api.polishLevelOf(custom),null,"your own changes show no level as chosen");
  const html=api.renderToStaticMarkup(api.createElement(api.VoicePolish,{clip:{...clip(),...api.polishClip(clip(),"medium")},update(){}}));
  assert.match(html,/Make my voice sound better/);
  for(const name of ["Off","Light","Medium","Strong"])assert.match(html,new RegExp(`>${name}<`));
  assert.match(html,/data-testid="button-polish-medium"[^>]*aria-checked="true"|aria-checked="true"[^>]*data-testid="button-polish-medium"/);
  assert.match(html,/Your original take is kept/);
});

test("Kids genre: a playful kids song, sung by friendly adult voices, with kids' backgrounds for its video",()=>{
  assert.ok(api.quickGenres.includes("Kids"),"Kids button on Create");
  const request=api.familySafe({genres:"Kids, Pop",prompt:"a song about brushing teeth",voice:"girl voice"});
  assert.ok(api.isFamilySong({genres:"Kids"}));
  assert.match(request.voice,/friendly adult voices/);
  assert.doesNotMatch(request.voice,/girl voice/,"child-like voices are never requested");
  assert.match(request.negativeStyle,/child or child-like vocals/);
  assert.match(api.autoInstruments("",["Kids"]),/ukulele/,"playful kids instruments");
  const themes=api.suggestedThemes({name:"Brush Your Teeth",notes:{prompt:"a song for kids"},tags:["Kids"]});
  assert.ok(themes.includes("balloons"),"kids' backgrounds suggested for the video");
});
