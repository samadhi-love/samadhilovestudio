// Backup lyric timing: when ElevenLabs cannot time a song (or isn't connected),
// fal Whisper hears the words through a private short-lived link and they are
// matched to the known lyrics. Providers and storage are fixtures (no cost).
import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";

const directory="generated-artifacts/tests/caption-backup";mkdirSync(directory,{recursive:true});
globalThis.__backup={};
await build({stdin:{contents:`export {POST as sync} from "./app/api/studio/lyric-sync/route";export {emptyCreatorStudio,freshSong} from "./app/studio-data";`,resolveDir:process.cwd(),loader:"ts"},
  outfile:`${directory}/route.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",plugins:[{name:"fixtures",setup(b){
  b.onResolve({filter:/.*/},a=>{
    if(/server\/storage$/.test(a.path)||a.path==="./storage"&&a.importer.includes("/server/"))return {path:"storage",namespace:"f"};
    if(/studio-access$/.test(a.path))return {path:"access",namespace:"f"};
    if(/\/store$/.test(a.path))return {path:"store",namespace:"f"};
    if(/credits\/production$/.test(a.path))return {path:"credits",namespace:"f"};
    if(/\/elevenlabs\/vault$/.test(a.path))return {path:"vault",namespace:"f"};
    if(/\/elevenlabs\/audio-upload$/.test(a.path))return {path:"eleven",namespace:"f"};
    if(/server\/fal-transcribe$/.test(a.path))return {path:"whisper",namespace:"f"};
    if(/server\/music-engine$/.test(a.path))return {path:"engine",namespace:"f"};
    if(/server\/caption-recovery$/.test(a.path))return {path:"recovery",namespace:"f"};
    if(/lyric-assets\/route$/.test(a.path))return {path:"assets",namespace:"f"};
  });
  b.onLoad({filter:/.*/,namespace:"f"},a=>({loader:"js",contents:{
    storage:"export const serverStorage=new Proxy({}, {get:(_,k)=>globalThis.__backup.env[k]});",
    access:"export const privateWorkspace=async()=>({id:'owner',role:'owner'});",
    store:`export const privateHeaders={"Cache-Control":"private,no-store"};export const audioKey=(o,a)=>"songs/"+o+"/"+a;export const readStudio=async()=>({data:globalThis.__backup.studio,revision:1});`,
    credits:"export const jobExecution=new WeakMap();export const managedProviderKey=()=>null;export const withProductionUsage=f=>f;",
    vault:"export const resolveElevenLabsKey=async()=>globalThis.__backup.elevenKey;",
    eleven:"export async function sendProviderAudio(){globalThis.__backup.elevenCalls++;return globalThis.__backup.eleven();}",
    whisper:`export class FalSyncFailed extends Error{constructor(reason,message){super(message);this.reason=reason;}}
      export async function transcribeWithFal(key,url,language){globalThis.__backup.whisperCalls.push({key,url});return globalThis.__backup.heard;}`,
    engine:"export const falKey=()=>globalThis.__backup.falKey;",
    recovery:"export async function saveCaptionRecovery(){}",
    assets:"export const lyricAssetKey=(o,s,a)=>'lyric-assets/'+o+'/'+s+'/'+a;",
  }[a.path]}));
}}]});
const api=await import(`../${directory}/route.mjs`);
const lyrics="Morning light across the sea\nA little hope awakens me";
const heardGood=[["Morning",1],["light",1.4],["across",1.8],["the",2.2],["sea",2.5],["A",8],["little",8.3],["hope",8.7],["awakens",9.1],["me",9.6]].map(([text,start])=>({text,start,end:start+0.3}));
function setup({elevenKey="el-key",falKey="fal-key",eleven=()=>Response.json({error:"x"},{status:502}),heard={words:heardGood,text:"morning light across the sea a little hope awakens me"},presign=true}={}){
  const song={...api.freshSong("song-1","Morning",0),audioId:"audio-1",audioFormat:"mp3"};song.notes.lyrics=lyrics;
  const bytes=new Uint8Array(2048);
  const bucket={async get(key){return key==="songs/owner/audio-1"?{size:bytes.length,body:new Response(bytes).body,arrayBuffer:async()=>bytes.buffer,customMetadata:{}}:null;}};
  if(presign)bucket.presignGet=(key,expires)=>`https://r2.example/${key}?expires=${expires}&signature=fixture`;
  globalThis.__backup={env:{BUCKET:bucket},studio:{...structuredClone(api.emptyCreatorStudio),songs:[song]},elevenKey,falKey,eleven,heard,elevenCalls:0,whisperCalls:[]};
  return globalThis.__backup;
}
const sync=()=>api.sync(new Request("https://studio.test/api/studio/lyric-sync",{method:"POST",headers:{origin:"https://studio.test","Content-Type":"application/json"},
  body:JSON.stringify({songId:"song-1",audioId:"audio-1",sourceAudioId:"audio-1",mode:"align",text:lyrics,duration:30})}));
const quiet=async run=>{const l=console.log,e=console.error;console.log=()=>{};console.error=()=>{};try{return await run();}finally{console.log=l;console.error=e;}};

test("ElevenLabs fails → the backup times the words to the voice (one request, private 10-minute link)",async()=>{
  const s=setup();
  const response=await quiet(sync);
  assert.equal(response.status,200,await response.clone().text());
  const body=await response.json();
  assert.equal(body.engine,"fal Whisper + lyric matching");
  assert.deepEqual(body.cues.map(c=>[c.text,c.time]),[["Morning light across the sea",1],["A little hope awakens me",8]]);
  assert.equal(s.elevenCalls,1);
  assert.equal(s.whisperCalls.length,1,"never resubmitted");
  assert.match(s.whisperCalls[0].url,/^https:\/\/r2\.example\/songs\/owner\/audio-1\?expires=600&/);
});

test("no ElevenLabs connection → the backup is used directly",async()=>{
  const s=setup({elevenKey:null});
  const response=await quiet(sync);
  assert.equal(response.status,200);
  assert.equal((await response.json()).engine,"fal Whisper + lyric matching");
  assert.equal(s.elevenCalls,0);
});

test("if the backup can't match the words either, the original reason is returned (rough timing then says why)",async()=>{
  setup({heard:{words:[{text:"banana",start:1},{text:"rocket",start:2}],text:"banana rocket"}});
  const response=await quiet(sync);
  assert.equal(response.status,502);
  assert.match((await response.json()).error,/ElevenLabs could not process this recording/);
});

test("ElevenLabs works → the backup is not used (no extra cost)",async()=>{
  const characters=[..."Morning light across the sea\nA little hope awakens me"].map((text,i)=>({text,start:1+i*0.15,end:1.15+i*0.15}));
  const s=setup({eleven:()=>Response.json({characters})});
  const response=await quiet(sync);
  assert.equal(response.status,200);
  assert.equal((await response.json()).engine,"ElevenLabs forced alignment");
  assert.equal(s.whisperCalls.length,0);
});

test("no ElevenLabs and no backup available → the usual 'connect ElevenLabs' message",async()=>{
  setup({elevenKey:null,falKey:null});
  const response=await quiet(sync);
  assert.equal(response.status,400);
  assert.match((await response.json()).error,/connect ElevenLabs/);
  setup({elevenKey:null,presign:false});
  assert.equal((await quiet(sync)).status,400,"preview storage without private links can't use the backup");
});

test("private links are signed exactly like Amazon's published example (Signature V4), and only for safe keys and short lifetimes",async()=>{
  const {presignS3Get,R2PrivateBucket}=await import("../scripts/storage/r2.mjs");
  const url=presignS3Get({host:"examplebucket.s3.amazonaws.com",path:"/test.txt",region:"us-east-1",accessKeyId:"AKIAIOSFODNN7EXAMPLE",
    secretAccessKey:"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",expires:86400,now:new Date("2013-05-24T00:00:00Z")});
  assert.match(url,/X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404$/);
  const bucket=new R2PrivateBucket({accountId:"acct",bucket:"private",accessKeyId:"id",secretAccessKey:"secret",client:{}});
  assert.match(bucket.presignGet("songs/owner/audio-1"),/^https:\/\/acct\.r2\.cloudflarestorage\.com\/private\/songs\/owner\/audio-1\?X-Amz-Algorithm=AWS4-HMAC-SHA256&.*X-Amz-Expires=600&/);
  assert.throws(()=>bucket.presignGet("../secret"),/Invalid storage key/);
  assert.throws(()=>bucket.presignGet("songs/a",7200),/Invalid link lifetime/);
  assert.ok(!JSON.stringify(bucket).includes("secret"),"the signing secret is never serialized");
});
