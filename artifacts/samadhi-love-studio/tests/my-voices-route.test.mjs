import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";

// The verified-voice rules run on the real route with an in-memory private bucket.
const directory="generated-artifacts/tests/my-voices";
mkdirSync(directory,{recursive:true});
globalThis.__voices={};
await build({stdin:{contents:`export {GET,POST,DELETE} from "./app/api/studio/my-voice/route";export {consentPhrase,verifiedVoiceLimit} from "./app/my-voice-data";`,resolveDir:process.cwd(),loader:"ts"},
  bundle:true,platform:"node",format:"esm",packages:"external",outfile:`${directory}/route.mjs`,plugins:[{name:"offline-voices",setup(b){
    b.onResolve({filter:/.*/},a=>{
      if(/server\/storage$/.test(a.path))return {path:"storage",namespace:"fake"};
      if(/studio-access$/.test(a.path))return {path:"auth",namespace:"fake"};
      if(/\/elevenlabs\/vault$/.test(a.path))return {path:"vault",namespace:"fake"};
      if(/server\/music-engine$/.test(a.path))return {path:"engine",namespace:"fake"};
      if(/\/ai-provider$/.test(a.path))return {path:"provider",namespace:"fake"};
      if(/\/fal-transcribe$/.test(a.path))return {path:"whisper",namespace:"fake"};
    });
    b.onLoad({filter:/.*/,namespace:"fake"},a=>({loader:"js",contents:{
      storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__voices.env[k]});",
      auth:"export const privateWorkspace=async()=>globalThis.__voices.access;",
      // Speech-to-text fixtures: no paid calls in tests.
      vault:"export const resolveElevenLabsKey=async()=>globalThis.__voices.elevenKey??null;",
      engine:"export const falKey=()=>globalThis.__voices.falKey??'';",
      provider:"export const providerRequest=(...a)=>globalThis.__voices.eleven(...a);",
      whisper:"export class FalSyncFailed extends Error{constructor(reason,message){super(message);this.reason=reason;}};export const transcribeWithFal=(...a)=>{if(globalThis.__voices.falSilent)throw new FalSyncFailed('no-words','none');return globalThis.__voices.fal(...a);};",
    }[a.path]}));
  }}]});
const api=await import(`../${directory}/route.mjs`);
const origin="https://studio.test";

function fixture(){
  const objects=new Map();
  const state=globalThis.__voices={access:{id:"owner"},objects,env:{BUCKET:{
    async put(key,value,options={}){
      if(options.onlyIf?.etagDoesNotMatch==="*"&&objects.has(key))return null;
      const bytes=new Uint8Array(await new Response(value).arrayBuffer());
      objects.set(key,{key,bytes,customMetadata:options.customMetadata??{},httpMetadata:options.httpMetadata??{},uploaded:new Date()});return {key};
    },
    async get(key){const o=objects.get(key);return o?{...o,body:new Response(o.bytes).body}:null;},
    async delete(keys){for(const k of Array.isArray(keys)?keys:[keys])objects.delete(k);},
    async list({prefix}){return {objects:[...objects.values()].filter(o=>o.key.startsWith(prefix)),truncated:false};},
  }}};
  return state;
}
const wav=(n=64)=>{const b=new Uint8Array(n);b.set(new TextEncoder().encode("RIFF0000WAVEdata"));return b;};
function form(over={}){
  const f=new FormData(),speaker=over.speaker??"Samadhi";
  const fields={name:"Warm voice",speaker,consentText:api.consentPhrase(speaker),ownVoice:"true",adult:"true",voiceDuration:"42.5",consentDuration:"7.2",...over};
  for(const [k,v] of Object.entries(fields))if(k!=="voice"&&k!=="consent"&&v!==undefined)f.set(k,v);
  if(over.voice!==null)f.set("voice",new Blob([over.voice??wav()],{type:"audio/wav"}),"voice");
  if(over.consent!==null)f.set("consent",new Blob([over.consent??wav()],{type:"audio/wav"}),"consent");
  return f;
}
const save=(f,headers={origin})=>api.POST(new Request(origin+"/api/studio/my-voice",{method:"POST",headers,body:f}));
const list=async()=>(await (await api.GET(new Request(origin+"/api/studio/my-voice"))).json()).voices;

test("a verified voice keeps the voice and the spoken consent, privately, and lists as verified",async()=>{
  const state=fixture();
  const response=await save(form());assert.equal(response.status,200);
  const {voice}=await response.json();
  assert.equal(voice.verified,true);assert.equal(voice.speaker,"Samadhi");
  const keys=[...state.objects.keys()];
  assert.ok(keys.includes(`my-voice/v1/owner/${voice.id}`));assert.ok(keys.includes(`my-voice-consent/v1/owner/${voice.id}`));
  const consent=state.objects.get(`my-voice-consent/v1/owner/${voice.id}`);
  assert.equal(consent.customMetadata.consentText,"My name is Samadhi. This is my own voice. I am 18 or older, and I agree to use it in Versual Studio.");
  const saved=state.objects.get(`my-voice/v1/owner/${voice.id}`).customMetadata;
  assert.deepEqual([saved.verified,saved.adultConfirmed,saved.ownVoiceConfirmed],["1","1","1"]);
  const listed=await list();assert.equal(listed.length,1);assert.equal(listed[0].verified,true);
  const clip=await api.GET(new Request(`${origin}/api/studio/my-voice?consent=${voice.id}`));
  assert.equal(clip.status,200);assert.equal(clip.headers.get("Content-Type"),"audio/wav");
});

test("only adults' own voices with the exact consent sentence and real audio are accepted",async()=>{
  fixture();
  const cases=[
    [{adult:"false"},/18 or older/],
    [{ownVoice:undefined},/your own voice/],
    [{consentText:"I agree"},/consent sentence/],
    [{voiceDuration:"4"},/between 10 seconds and 10 minutes/],
    [{voiceDuration:"900"},/between 10 seconds and 10 minutes/],
    [{consentDuration:"1"},/consent sentence in your own voice/],
    [{voice:new TextEncoder().encode("not audio at all, just text")},/real audio/],
    [{consent:null},/real audio/],
    [{name:""},/short name/],
  ];
  for(const [over,message] of cases){
    const response=await save(form(over));
    assert.equal(response.status,400,JSON.stringify(over));
    assert.match((await response.json()).error,message);
  }
  assert.equal((await list()).length,0,"nothing kept from refused saves");
  assert.equal((await save(form(),{origin:"https://elsewhere.test"})).status,403,"saves only from the studio itself");
});

test("each person keeps at most 4 verified voices, and deleting one frees its place and its consent",async()=>{
  const state=fixture();const ids=[];
  for(let i=0;i<4;i++){const r=await save(form({name:"Voice "+i}));assert.equal(r.status,200);ids.push((await r.json()).voice.id);}
  const fifth=await save(form({name:"Voice 5"}));
  assert.equal(fifth.status,409);assert.match((await fifth.json()).error,/already have 4 verified voices/);
  assert.equal((await list()).length,4);
  const removed=await api.DELETE(new Request(`${origin}/api/studio/my-voice?id=${ids[0]}`,{method:"DELETE",headers:{origin}}));
  assert.equal(removed.status,200);
  assert.ok(![...state.objects.keys()].some(k=>k.endsWith(ids[0])),"voice and consent both removed");
  assert.equal((await save(form({name:"Voice 5"}))).status,200);
});

test("two saves at the same moment can't pass the limit",async()=>{
  fixture();
  for(let i=0;i<3;i++)assert.equal((await save(form({name:"Voice "+i}))).status,200);
  const results=await Promise.all([save(form({name:"A"})),save(form({name:"B"}))]);
  assert.ok(results.filter(r=>r.status===200).length<=1);
  assert.equal((await list()).filter(v=>v.verified).length<=4,true);
});

test("voices belong to one person only",async()=>{
  const state=fixture();
  const {voice}=await (await save(form())).json();
  state.access={id:"someone-else"};
  assert.equal((await list()).length,0);
  assert.equal((await api.GET(new Request(`${origin}/api/studio/my-voice?consent=${voice.id}`))).status,404);
  state.access=null;
  assert.equal((await api.GET(new Request(origin+"/api/studio/my-voice"))).status,401);
});

test("the consent clip is listened to: the sentence must really be said, or nothing is saved",async()=>{
  const state=fixture();const calls=[];
  state.elevenKey="el-key";
  state.eleven=async(key,path,init)=>{calls.push([key,path,init.body.get("model_id")]);return Response.json({text:state.heard});};
  state.heard="My name is Sam Addy. This is my own voice. I am eighteen or older, and I agree to use it in Versual Studio.";
  const ok=await save(form());assert.equal(ok.status,200,"a misspelled name is fine; the promise words were said");
  const {voice}=await ok.json();assert.equal(voice.consentHeard,true);
  assert.deepEqual(calls[0],["el-key","speech-to-text","scribe_v2"]);
  assert.equal(state.objects.get(`my-voice-consent/v1/owner/${voice.id}`).customMetadata.consentHeard,"matched");
  assert.equal(state.objects.get(`my-voice-consent/v1/owner/${voice.id}`).customMetadata.heardBy,"ElevenLabs Scribe");
  assert.equal((await list())[0].consentHeard,true);

  state.heard="la la la this is a song about summer";
  const before=state.objects.size;
  const wrong=await save(form({name:"Second"}));assert.equal(wrong.status,422);
  const {error}=await wrong.json();
  assert.match(error,/didn't match the sentence on screen/);assert.match(error,/we heard: “la la la/);assert.match(error,/Nothing was saved/);
  assert.equal(state.objects.size,before,"nothing kept when the words don't match");

  state.heard="My name is Samadhi. This is my own voice. I agree to use it in Versual Studio.";
  const noAge=await save(form({name:"Third"}));assert.equal(noAge.status,422);
  assert.match((await noAge.json()).error,/18 or older/,"the adult promise must be said");
  assert.equal(calls.length,3,"one request per save, never retried");
});

test("fal Whisper listens when ElevenLabs isn't connected or fails; with neither, the save still works as before",async()=>{
  const state=fixture();const heard=[];
  state.elevenKey="el-key";state.eleven=async()=>new Response("busy",{status:429});
  state.falKey="fal-key";state.fal=async(key,url,lang,api,wait)=>{heard.push([key,url.slice(0,22),wait]);return {text:"My name is Samadhi. This is my own voice. I am 18 or older, and I agree to use it in Versual Studio.",words:[]};};
  const ok=await save(form());assert.equal(ok.status,200);
  assert.deepEqual(heard[0],["fal-key","data:audio/wav;base64,",60000]);
  const {voice}=await ok.json();assert.equal(state.objects.get(`my-voice-consent/v1/owner/${voice.id}`).customMetadata.heardBy,"fal Whisper");

  const s2=fixture();s2.falKey="fal-key";s2.falSilent=true;
  const silent=await save(form());assert.equal(silent.status,422,"a silent consent clip is refused");
  assert.match((await silent.json()).error,/we heard no words/);

  const s3=fixture();
  const plain=await save(form());assert.equal(plain.status,200,"no speech service: saved as before");
  const {voice:v3}=await plain.json();assert.equal(v3.consentHeard,false);
  assert.equal(s3.objects.get(`my-voice-consent/v1/owner/${v3.id}`).customMetadata.consentHeard,"not-checked");
});
