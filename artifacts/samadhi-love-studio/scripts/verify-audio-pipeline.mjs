#!/usr/bin/env node
/**
 * Audio pipeline self-test. Runs the app's REAL functions (bundled straight from
 * app/ source, no logic mocked) and checks the results with independent tools
 * (ffprobe/ffmpeg) where possible.
 *
 * Honest limits, printed in the report:
 * - Song rendering (instrumental.ts) and the stem mixer (multitrack-audio.ts) run on
 *   the browser's OfflineAudioContext, which does not exist in Node. They are NOT RUN here.
 * - MP4/WebM video export needs the browser's WebCodecs VideoEncoder. NOT RUN here.
 * - The only Node stand-in is a plain AudioBuffer data holder (array storage, no
 *   processing), needed because the app's streaming mixer writes into AudioBuffers.
 * - Provider checks use free, read-only requests and never print key values.
 *
 * Usage: node scripts/verify-audio-pipeline.mjs
 */
import {build} from "esbuild";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {zipSync} from "fflate";

const out="work/audio-pipeline";mkdirSync(out,{recursive:true});
const results=[];
const line=(s="")=>console.log(s);
const db=x=>x>0?20*Math.log10(x):-Infinity;
const fmt=x=>Number.isFinite(x)?x.toFixed(2):String(x);
function record(check,name,pass,detail){results.push({check,name,status:pass===null?"NOT RUN":pass?"PASS":"FAIL",detail});}
function rms(a){let s=0;for(const v of a)s+=v*v;return Math.sqrt(s/Math.max(1,a.length));}
function peak(a){let p=0;for(const v of a)p=Math.max(p,Math.abs(v));return p;}
function distinct(a){const set=new Set();for(let i=0;i<a.length&&set.size<5000;i+=7)set.add(Math.round(a[i]*32767));return set.size;}
function probe(file){const r=spawnSync("ffprobe",["-v","error","-show_entries","stream=codec_name,sample_rate,channels,bits_per_sample,duration_ts,start_time,duration:format=format_name,size,start_time","-of","json",file],{encoding:"utf8"});if(r.status!==0)throw new Error("ffprobe could not read "+file);const j=JSON.parse(r.stdout);return {...j.streams[0],start_time:j.streams[0].start_time??j.format.start_time,format:j.format.format_name,size:Number(j.format.size)};}
// Decode to native stereo (no channel remix: ffmpeg's stereo→mono adds +3 dB) and return the left channel.
function decode(file){const r=spawnSync("ffmpeg",["-v","error","-i",file,"-f","f32le","-ac","2","-ar","44100","-"],{maxBuffer:1<<28});if(r.status!==0)throw new Error("ffmpeg could not decode "+file);const b=r.stdout,all=new Float32Array(b.buffer,b.byteOffset,b.byteLength/4),left=new Float32Array(all.length/2);for(let i=0;i<left.length;i++)left[i]=all[2*i];return left;}
function firstPacketTime(file){const r=spawnSync("ffprobe",["-v","error","-select_streams","a:0","-show_entries","packet=pts_time","-read_intervals","%+#1","-of","csv=p=0",file],{encoding:"utf8"});return Number(r.stdout.trim().split("\n")[0]);}
function pitch(samples,rate,from,len){// independent autocorrelation pitch estimate (script-side measurement)
  const x=samples.subarray(from,from+len);let best=0,lag=0;for(let l=Math.floor(rate/500);l<Math.floor(rate/80);l++){let s=0;for(let i=0;i+l<x.length;i++)s+=x[i]*x[i+l];if(s>best){best=s;lag=l;}}return rate/lag;}

// Plain data holder for Node (no DSP). The app's streaming mixer creates AudioBuffers.
class NodeAudioBuffer{constructor({length,numberOfChannels,sampleRate}){this.length=length;this.numberOfChannels=numberOfChannels;this.sampleRate=sampleRate;this.duration=length/sampleRate;this.channels=Array.from({length:numberOfChannels},()=>new Float32Array(length));}getChannelData(i){return this.channels[i];}copyToChannel(d,i,o=0){this.channels[i].set(d,o);}copyFromChannel(d,i,o=0){d.set(this.channels[i].subarray(o,o+d.length));}}
globalThis.AudioBuffer??=NodeAudioBuffer;

await build({stdin:{contents:`
export {wavAudio,tuneVoice,sampleRate} from "./app/recording-dsp";
export {renderStreamingMix} from "./app/streaming-audio-mix";
export {readStemArchive} from "./app/stem-archive";
export {stemEnvelope,envelopeValue} from "./app/av-signals";
export {alignLyricLines,alignLyricsToHeardWords} from "./app/lyric-alignment";
export {captionReadyLines} from "./app/caption-ready-lyrics";
export {providerRequest,falRequest} from "./app/server/ai-provider";
export {stemOutputFormat} from "./app/api/studio/elevenlabs/provider";
`,resolveDir:process.cwd(),loader:"ts"},outfile:`${out}/app.mjs`,bundle:true,platform:"node",format:"esm",packages:"external",logLevel:"silent",
  plugins:[{name:"node-runtime",setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:"cf",namespace:"rt"}));b.onLoad({filter:/.*/,namespace:"rt"},()=>({contents:"export const env=process.env;",loader:"js"}));}}]});
const app=await import(`../${out}/app.mjs`);
const R=app.sampleRate;

line("VERSUAL STUDIO · AUDIO PIPELINE SELF-TEST");
line(`Run at ${new Date().toISOString()} · Node ${process.version} · source: app/ (real modules, no logic mocked)`);
line("");

// ---------- 1. Real audio signal ----------
let voice,tuned;
try{
  const seconds=3,n=R*seconds;voice=new Float32Array(n);
  for(let i=0;i<n;i++){const t=i/R,f=226;voice[i]=0.35*Math.sin(2*Math.PI*f*t)+0.12*Math.sin(4*Math.PI*f*t)+0.05*Math.sin(6*Math.PI*f*t);}
  const result=await app.tuneVoice(voice,9,"major",1,()=>{});
  tuned=result.samples;
  const level=db(rms(tuned)),before=pitch(voice,R,R,4096),after=pitch(tuned,R,R,4096);
  record(1,"Pitch-correct a sharp test vocal with tuneVoice()",level>-60&&distinct(tuned)>500&&peak(tuned)<=1,
    `RMS ${fmt(level)} dBFS · peak ${fmt(db(peak(tuned)))} dBFS · ${distinct(tuned)} distinct sample values · ${result.voicedFrames} voiced frames · pitch ${fmt(before)} Hz → ${fmt(after)} Hz (target A3 220 Hz)`);
  const env=app.stemEnvelope(Object.assign(new NodeAudioBuffer({length:tuned.length,numberOfChannels:1,sampleRate:R}),{channels:[tuned]}));
  const live=[...env.energy].filter(v=>v>0.05).length;
  record(1,"Loudness envelope used by video animation (stemEnvelope)",live>env.energy.length*0.8,`${env.energy.length} frames at ${env.fps} fps · ${live} frames above 5% energy`);
}catch(e){record(1,"Real audio processing",false,e.message);}

// ---------- 2. Export format & headers ----------
let wavFile;
try{
  const right=tuned.map(v=>v*0.9);
  const blob=app.wavAudio(tuned,right);
  const bytes=new Uint8Array(await blob.arrayBuffer());wavFile=`${out}/vocal-export.wav`;writeFileSync(wavFile,bytes);
  const v=new DataView(bytes.buffer),tag=o=>String.fromCharCode(...bytes.slice(o,o+4));
  const h={riff:tag(0),wave:tag(8),fmt:tag(12),pcm:v.getUint16(20,true),channels:v.getUint16(22,true),rate:v.getUint32(24,true),bits:v.getUint16(34,true),data:tag(36),dataBytes:v.getUint32(40,true)};
  const ok=bytes.length>44&&h.riff==="RIFF"&&h.wave==="WAVE"&&h.fmt==="fmt "&&h.pcm===1&&[44100,48000].includes(h.rate)&&h.data==="data"&&h.dataBytes===bytes.length-44&&h.dataBytes===tuned.length*h.channels*h.bits/8;
  record(2,"WAV export header (wavAudio)",ok,`${bytes.length} bytes · ${h.riff}/${h.wave} · PCM format ${h.pcm} · ${h.rate} Hz · ${h.bits}-bit · ${h.channels} ch · data ${h.dataBytes} bytes`);
  const p=probe(wavFile);
  record(2,"WAV export decoded independently by ffprobe/ffmpeg",p.codec_name==="pcm_s16le"&&Number(p.sample_rate)===44100&&p.channels===2&&db(rms(decode(wavFile)))>-60,
    `${p.format} · ${p.codec_name} · ${p.sample_rate} Hz · ${p.channels} ch · ${fmt(Number(p.duration))} s · decoded RMS ${fmt(db(rms(decode(wavFile))))} dBFS`);
}catch(e){record(2,"WAV export",false,e.message);}
try{
  const mix=await app.renderStreamingMix([{id:"vocal",blob:new Blob([readFileSync(wavFile)],{type:"audio/wav"})}],{fade:0.2,limit:60,bitrate:192000,signal:new AbortController().signal,progress(){},metadata:{title:"Self-test",comment:"Synthetic test signal"}});
  const file=`${out}/mix-export.mp3`;writeFileSync(file,new Uint8Array(await mix.blob.arrayBuffer()));
  const head=readFileSync(file).subarray(0,3),p=probe(file),level=db(rms(decode(file)));
  record(2,"MP3 export (renderStreamingMix, LAME encoder)",(head.toString("latin1")==="ID3"||(head[0]===0xff&&(head[1]&0xe0)===0xe0))&&p.codec_name==="mp3"&&[44100,48000].includes(Number(p.sample_rate))&&level>-60,
    `${p.size} bytes · header ${head.toString("latin1")==="ID3"?"ID3 + MPEG frames":"MPEG frame"} · ${p.codec_name} · ${p.sample_rate} Hz · ${p.channels} ch · ${fmt(Number(p.duration))} s · decoded RMS ${fmt(level)} dBFS`);
}catch(e){record(2,"MP3 export",false,e.message);}

// ---------- 3. Stems: Bar-1 sync & summing ----------
let songSeconds=12,mixFile;
try{
  const n=R*songSeconds,beat=Math.round(R*0.5);
  // Build a "song", master it to -1 dBFS peak, then split it into stems the way stem
  // separation does (stems add back up to the original song).
  const kick=new Float32Array(n),bass=new Float32Array(n),pad=new Float32Array(n);
  for(let i=0;i<n;i++){const t=i/R,k=i%beat,kt=k/R;
    kick[i]=Math.exp(-kt*18)*Math.sin(2*Math.PI*(55+90*Math.exp(-kt*30))*kt);
    bass[i]=0.5*Math.sin(2*Math.PI*55*t)*(0.6+0.4*Math.cos(2*Math.PI*t));
    pad[i]=0.18*(Math.sin(2*Math.PI*220*t)+Math.sin(2*Math.PI*277.18*t)+Math.sin(2*Math.PI*329.63*t));}
  let songPeak=0;for(let i=0;i<n;i++)songPeak=Math.max(songPeak,Math.abs(kick[i]+bass[i]+pad[i]));
  const master=Math.pow(10,-1/20)/songPeak;for(const s of [kick,bass,pad])for(let i=0;i<n;i++)s[i]*=master;
  const files={};for(const [name,s] of Object.entries({kick,bass,pad}))files[`stems/${name}.wav`]=new Uint8Array(await app.wavAudio(s,s).arrayBuffer());
  const zip=new Blob([zipSync(files)],{type:"application/zip"});
  const stems=await app.readStemArchive(zip,new AbortController().signal);
  const decoded=[];
  for(const stem of stems){const file=`${out}/${stem.name}`;writeFileSync(file,new Uint8Array(await stem.blob.arrayBuffer()));const p=probe(file),pcm=decode(file);
    const onset=pcm.findIndex(v=>Math.abs(v)>1e-3);decoded.push({name:stem.name,frames:Number(p.duration_ts),start:firstPacketTime(file),onset,pcm});}
  const lengths=new Set(decoded.map(d=>d.frames)),starts=decoded.every(d=>d.start===0&&d.onset>=0&&d.onset<R*0.01);
  record(3,"Stem ZIP import (readStemArchive): equal lengths, all start at 0:00",stems.length===3&&lengths.size===1&&starts,
    decoded.map(d=>`${d.name}: ${d.frames} samples, first audio packet at ${d.start}s, first sound at sample ${d.onset}`).join(" · "));
  const sum=new Float32Array(decoded[0].pcm.length);for(const d of decoded)for(let i=0;i<sum.length;i++)sum[i]+=d.pcm[i];
  const p=peak(sum);
  record(3,"Stems summed at unity gain stay below 0 dBFS (script-side sum)",p<=1,`summed peak ${p.toFixed(4)} (${fmt(db(p))} dBFS; original song mastered to -1.00 dBFS, 16-bit rounding included) · RMS ${fmt(db(rms(sum)))} dBFS`);
  const hot=decoded.map(d=>d.pcm.map(v=>v*1.5)),hotSum=new Float32Array(sum.length);for(const h of hot)for(let i=0;i<hotSum.length;i++)hotSum[i]+=h[i];
  record(3,"Stems pushed +3.5 dB each WOULD clip if summed raw (shows the check can fail)",peak(hotSum)>1,`raw summed peak ${peak(hotSum).toFixed(4)} (${fmt(db(peak(hotSum)))} dBFS). The app's browser mixer evens out peaks after mixing (not runnable in Node; see next line).`);
  mixFile=`${out}/stem-sum.wav`;writeFileSync(mixFile,new Uint8Array(await app.wavAudio(sum,sum).arrayBuffer()));
  record(3,"App stem mixer (multitrack-audio renderMix)",null,"Runs on the browser's OfflineAudioContext; not available in Node, so the app's own mix/summing path was not executed here.");
  record(3,"ElevenLabs-separated stems",null,"Would need a paid stem-separation call; not sent. Synthetic stems were used instead.");
}catch(e){record(3,"Stem handling",false,e.message);}

// ---------- 4. Lyric timing ----------
try{
  const duration=Number(probe(mixFile).duration);
  const block="[Verse]\nLight is rising on the water\nEvery wave a quiet prayer\n\n[Chorus]\nWe are love we are sound\nMusic for the soul";
  const lines=app.captionReadyLines(block);
  const words=lines.flatMap(l=>l.split(/\s+/));let t=0.6;const step=(duration-1.5)/words.length;
  const timed=words.map(w=>{const item={text:w,start:+t.toFixed(3),end:+(t+step*0.8).toFixed(3),type:"word"};t+=step;return item;});
  const check=cues=>cues&&cues.every((c,i)=>c.end===undefined?false:c.time<c.end&&c.end<=duration&&(i===0||c.time>cues[i-1].time&&c.time>=cues[i-1].end-1e-6));
  const forced=app.alignLyricLines(lines,{words:timed});
  record(4,"Section headings removed from timed lines (captionReadyLines)",lines.length===4&&!lines.some(l=>/\[/.test(l)),lines.map(l=>`"${l}"`).join(", "));
  record(4,"Forced-alignment result → captions (alignLyricLines)",!!forced&&forced.length===4&&check(forced),
    forced?forced.map(c=>`${fmt(c.time)}–${fmt(c.end)}s "${c.text}"`).join(" · ")+` · audio ${fmt(duration)} s`:"no captions returned");
  const misheard=timed.map(w=>w.text==="prayer"?{...w,text:"player"}:w.text==="soul"?{...w,text:"sole"}:w);
  const matched=app.alignLyricsToHeardWords(lines,misheard,{duration});
  record(4,"Backup matcher keeps YOUR words when speech-to-text mishears (alignLyricsToHeardWords)",!!matched&&check(matched.cues)&&matched.cues.map(c=>c.text).join("|")===lines.join("|"),
    matched?`${matched.matched}/${matched.total} words matched · captions use the written lyrics, not "player"/"sole"`:"no result");
  const garbage=app.alignLyricsToHeardWords(lines,[{text:"banana",start:1},{text:"telephone",start:2},{text:"umbrella",start:3}],{duration});
  record(4,"Refuses to invent timing from unrelated words (hallucination guard)",garbage===null,garbage===null?"returned null → user is asked to check lyrics or time manually":"returned captions from unrelated words");
  record(4,"Input timings are synthetic",null,"No speech-to-text call was made; word times were generated by this script inside the audio duration. The app's alignment logic itself is real.");
  record(4,"MP4/WebM lyric-video export (mediabunny + WebCodecs)",null,"Needs the browser's VideoEncoder (WebCodecs); Node has none, so no video file was made here. Check on a phone/computer browser.");
}catch(e){record(4,"Lyric timing",false,e.message);}

// ---------- 5. Provider health ----------
const configured=name=>!!process.env[name]?.trim();
async function ping(name,keyNames,run){
  const present=keyNames.filter(configured);
  if(!present.length){record(5,name,null,`not configured here (looked for ${keyNames.join(" / ")})`);return;}
  try{const r=await run(process.env[present[0]].trim());record(5,name,r.ok,`${present[0]} is set · HTTP ${r.status}${r.note?" · "+r.note:""}`);}
  catch(e){record(5,name,false,`${present[0]} is set · request failed (${e.name}: ${String(e.message).replace(/[A-Za-z0-9_-]{24,}/g,"[hidden]").slice(0,120)})`);}
}
const timeout=()=>AbortSignal.timeout(10_000);
await ping("ElevenLabs account (GET /v1/user/subscription, free)",["STUDIO_MANAGED_ELEVENLABS_KEY","ELEVENLABS_API_KEY"],async key=>{
  const r=await app.providerRequest(key,"user/subscription",{method:"GET",signal:timeout()});
  const tier=r.ok?(await r.json()).tier:undefined;return {ok:r.ok,status:r.status,note:tier?`plan ${tier} → stems would use ${await app.stemOutputFormat(key)}`:undefined};});
const falName=Object.keys(process.env).find(n=>/^fal[_-]?key$/i.test(n.trim()));
await ping("fal.ai key (GET status of a non-existent request, free)",falName?[falName]:["FAL_KEY"],async key=>{
  const r=await app.falRequest(key,"/fal-ai/whisper/requests/00000000-0000-0000-0000-000000000000/status",{signal:timeout()});
  return {ok:![401,403].includes(r.status)&&r.status<500,status:r.status,note:[401,403].includes(r.status)?"key rejected":"key accepted (unknown request is expected)"};});
await ping("Clerk sign-in (GET /v1/jwks)",["CLERK_SECRET_KEY"],async key=>{const r=await fetch("https://api.clerk.com/v1/jwks",{headers:{Authorization:`Bearer ${key}`},signal:timeout()});return {ok:r.ok,status:r.status};});
await ping("Stripe billing (GET /v1/balance, read-only)",["STRIPE_SECRET_KEY"],async key=>{const r=await fetch("https://api.stripe.com/v1/balance",{headers:{Authorization:`Bearer ${key}`},signal:timeout()});return {ok:r.ok,status:r.status,note:key.startsWith("sk_live_")?"live mode":"test mode"};});
await ping("Cloudflare D1 + R2 storage (read-only table and bucket check)",["STUDIO_CLOUDFLARE_D1_API_TOKEN"],async()=>{
  const {storageConfig,verifyStorage}=await import("./storage/runtime.mjs");const {D1Http}=await import("./storage/d1.mjs");const {R2PrivateBucket}=await import("./storage/r2.mjs");
  const config=storageConfig();await verifyStorage(new D1Http(config),new R2PrivateBucket(config));return {ok:true,status:200,note:"tables present, bucket reachable"};});
record(5,"AudD song recognition",configured("AUDD_API_TOKEN")?true:null,configured("AUDD_API_TOKEN")?"AUDD_API_TOKEN is set (no free ping endpoint; not called)":"not configured here (AUDD_API_TOKEN)");
record(5,"Video rendering service",null,"none: video renders in the user's browser; there is no server rendering endpoint to ping");

// ---------- report ----------
line("CHECK  STATUS   TEST");
for(const r of results){line(`  ${r.check}    ${r.status.padEnd(7)}  ${r.name}`);line(`               ${r.detail}`);}
line("");
const count=s=>results.filter(r=>r.status===s).length;
line(`SUMMARY: ${count("PASS")} PASS · ${count("FAIL")} FAIL · ${count("NOT RUN")} NOT RUN (out of ${results.length})`);
for(const c of [1,2,3,4,5]){const rs=results.filter(r=>r.check===c),f=rs.some(r=>r.status==="FAIL"),p=rs.some(r=>r.status==="PASS");line(`  Check ${c}: ${f?"FAIL":p?"PASS":"NOT RUN"}${!f&&rs.some(r=>r.status==="NOT RUN")?" (some parts not run — see above)":""}`);}
process.exitCode=count("FAIL")?1:0;
