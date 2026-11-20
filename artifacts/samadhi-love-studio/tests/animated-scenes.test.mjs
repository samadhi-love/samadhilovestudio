import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,existsSync,readFileSync} from "node:fs";

const directory="generated-artifacts/tests/animated-scenes";mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`export {drawAnimatedScene,animatedScenes} from "./app/lyric-animated-scenes";export {videoThemes} from "./app/lyric-video-data";export {lyricBackgroundGroups} from "./app/lyric-background-picker";`,resolveDir:process.cwd(),loader:"ts"},bundle:true,platform:"node",format:"esm",packages:"external",jsx:"automatic",outfile:`${directory}/scenes.mjs`});
const api=await import(`../${directory}/scenes.mjs`);

/** A canvas stand-in that records every drawing call and rejects non-finite numbers. */
function recorder(){
  const calls=[];const gradient={addColorStop(at,color){assert.ok(Number.isFinite(at)&&typeof color==="string");}};
  return new Proxy({calls,createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get(target,key){
    if(key in target)return target[key];
    return (...args)=>{for(const a of args)if(typeof a==="number")assert.ok(Number.isFinite(a),`${String(key)} got ${a}`);calls.push(key+":"+args.filter(a=>typeof a==="number").map(n=>n.toFixed(2)).join(","));};
  },set(){return true;}});
}

test("all 7 animated scenes draw in every video shape without errors, and they actually move",()=>{
  assert.deepEqual([...api.animatedScenes],["balloons","meadow","undersea","lullaby","flag","liberty","nycnight"]);
  for(const scene of api.animatedScenes)for(const [w,h] of [[1080,1920],[1920,1080],[1080,1080]]){
    const a=recorder(),b=recorder();
    assert.equal(api.drawAnimatedScene(a,scene,w,h,0),true);
    api.drawAnimatedScene(b,scene,w,h,3.7);
    assert.ok(a.calls.length>20,`${scene} draws a full picture`);
    assert.notDeepEqual(a.calls,b.calls,`${scene} changes over time`);
  }
  assert.equal(api.drawAnimatedScene(recorder(),"cosmic",100,100,1),false,"other backgrounds are untouched");
});

test("new scenes are in the picker (Kids songs, USA & New York) with a preview picture, and use a real photo with live motion on top",()=>{
  assert.deepEqual([...api.lyricBackgroundGroups.kids.themes],["balloons","meadow","undersea","lullaby"]);
  assert.deepEqual([...api.lyricBackgroundGroups.usa.themes],["flag","liberty","nycnight"]);
  for(const id of api.animatedScenes){
    const theme=api.videoThemes[id];
    assert.equal(theme.image,`/lyric-art/photo/${id}.webp`,"realistic photo background");
    assert.ok(existsSync("public"+theme.image),`${id} photo exists`);
    assert.ok(existsSync("public"+theme.thumb),`${id} preview exists`);
    assert.equal(theme.colors.length,4);
  }
  const grouped=Object.values(api.lyricBackgroundGroups).flatMap(g=>g.themes);
  assert.equal(new Set(grouped).size,grouped.length,"no background listed twice");
  assert.match(readFileSync("app/lyric-video-render.ts","utf8"),/drawAnimatedScene\(ctx, project\.theme, width, height, motion\)/);
});

test("photo backgrounds: the flag photo waves and every scene adds live motion on top, matched to the photo",async()=>{
  const more=await import(`../${directory}/scenes.mjs`).then(()=>build({stdin:{contents:`export {drawPhotoMotion,drawWavingPhoto} from "./app/lyric-animated-scenes";`,resolveDir:process.cwd(),loader:"ts"},bundle:true,platform:"node",format:"esm",outfile:`${directory}/photo.mjs`})).then(()=>import(`../${directory}/photo.mjs`));
  const photo={width:1600,height:900,naturalWidth:1600,naturalHeight:900,src:"/lyric-art/photo/test.jpg"};
  const rect={x:-40,y:-20,w:1760,h:990};
  for(const scene of api.animatedScenes){
    const a=recorder(),b=recorder();
    assert.equal(more.drawPhotoMotion(a,scene,photo,rect,1920,1080,1),true);
    more.drawPhotoMotion(b,scene,photo,rect,1920,1080,2.6);
    assert.notDeepEqual(a.calls,b.calls,`${scene} moves on top of its photo`);
  }
  assert.equal(more.drawPhotoMotion(recorder(),"cosmic",photo,rect,100,100,1),false);
  const wave1=recorder(),wave2=recorder();
  more.drawWavingPhoto(wave1,photo,rect,0);more.drawWavingPhoto(wave2,photo,rect,1.5);
  assert.ok(wave1.calls.filter(c=>c.startsWith("drawImage")).length>=48,"cloth is drawn in many thin slices");
  assert.notDeepEqual(wave1.calls,wave2.calls,"the cloth moves");
});
