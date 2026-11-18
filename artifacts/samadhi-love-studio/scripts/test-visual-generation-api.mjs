import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync,readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {pathToFileURL} from "node:url";
mkdirSync("work/visual-generation-tests",{recursive:true});
const objects=new Map();let serial=0;
const bytes=async value=>typeof value==="string"?new TextEncoder().encode(value):value instanceof ReadableStream?new Uint8Array(await new Response(value).arrayBuffer()):new Uint8Array(value);
const bucket={
  async put(key,value,options={}){
    const data=await bytes(value);
    const old=objects.get(key);
    if(options.onlyIf?.etagDoesNotMatch==="*"&&old||options.onlyIf?.etagMatches&&options.onlyIf.etagMatches!==old?.etag)return null;
    const item={data,etag:String(++serial),httpMetadata:options.httpMetadata??{},customMetadata:options.customMetadata??{},uploaded:new Date()};
    objects.set(key,item);return {...item,key,size:item.data.length};
  },
  async get(key){const item=objects.get(key);return item?{...item,size:item.data.length,body:new Response(item.data).body,text:async()=>new TextDecoder().decode(item.data),arrayBuffer:async()=>item.data.slice().buffer}:null;},
  async head(key){const item=objects.get(key);return item?{...item,key,size:item.data.length}:null;},
  async delete(key){objects.delete(key);},
  async list({prefix,limit=1000}){const all=[...objects].filter(([key])=>key.startsWith(prefix));return{objects:all.slice(0,limit).map(([key,item])=>({...item,key,size:item.data.length})),truncated:all.length>limit};},
};
const state=globalThis.__visual={id:"owner",env:{BUCKET:bucket},key:"fixture-private-key",studio:{songs:[{id:"song",title:"Celestial",audioId:"recording",audioHistory:[]}]}};
globalThis.FixedLengthStream=class {constructor(length){let size=0;const stream=new TransformStream({transform(chunk,c){size+=chunk.length;if(size>length)throw new Error("long stream");c.enqueue(chunk);},flush(){if(size!==length)throw new Error("short stream");}});this.readable=stream.readable;this.writable=stream.writable;}};
const mocks={env:"export const env=globalThis.__visual.env;",access:'export async function privateWorkspace(){return globalThis.__visual.id?{id:globalThis.__visual.id}:null;}',store:'export const privateHeaders={"Cache-Control":"private,no-store"};export async function readStudio(owner){return {data:owner==="owner"?globalThis.__visual.studio:null};}',vault:'export async function resolveElevenLabsKey(){return globalThis.__visual.key;}'};
await build({entryPoints:["app/api/studio/visual-generation/route.ts"],bundle:true,platform:"node",format:"esm",packages:"external",outfile:"work/visual-generation-tests/api.mjs",plugins:[{name:"visual-runtime",setup(b){b.onResolve({filter:/cloudflare:workers|studio-access$|\/store$|elevenlabs\/vault$/},a=>({path:a.path==="cloudflare:workers"?"env":a.path.endsWith("studio-access")?"access":a.path.endsWith("vault")?"vault":"store",namespace:"fixture"}));b.onLoad({filter:/.*/,namespace:"fixture"},a=>({contents:mocks[a.path],loader:"js"}));}}]});
const route=await import(pathToFileURL(process.cwd()+"/work/visual-generation-tests/api.mjs"));
const image=new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=","base64"));
let providerPosts=0,providerStatus="pending",postFailure=0,networkFailure=false,downloadFailure=false,tier="pro",mime="image/png",output=image,downloadUrl="https://storage.googleapis.com/generations/provider-id?signature=private";
const requests=[];
globalThis.fetch=async(input,options={})=>{
  const url=String(input);requests.push({url,...options});
  if(url.includes("user/subscription"))return Response.json({tier});
  if(url.includes("/v1/flows/")){
    assert.equal(new Headers(options.headers).get("xi-api-key"),"fixture-private-key");assert.equal(options.redirect,"manual");
    if(options.method==="POST"){providerPosts++;if(networkFailure)throw new Error("connection lost");if(postFailure)return Response.json({detail:"Never expose this provider payload"},{status:postFailure});return Response.json({id:"provider-id",status:"pending"});}
    const id=new URL(url).pathname.split("/").pop();
    return Response.json(providerStatus==="completed"?{id,status:providerStatus,content_url:downloadUrl,content_mime_type:mime}:providerStatus==="failed"?{id,status:"failed",failure_reason:"moderated",error_message:"private provider detail"}:{id,status:providerStatus});
  }
  assert.equal(url,downloadUrl);assert.equal(options.headers,undefined,"never forward key to signed media URL");assert.equal(options.redirect,"manual");
  if(downloadFailure)return new Response(null,{status:302,headers:{Location:"http://127.0.0.1/private"}});
  return new Response(output,{headers:{"Content-Type":mime,"Content-Length":String(output.length)}});
};
const id=()=>crypto.randomUUID();
const request=(payload,origin="https://studio.test")=>new Request("https://studio.test/api/studio/visual-generation",{method:"POST",headers:{"Content-Type":"application/json",Origin:origin},body:JSON.stringify(payload)});
const create=(requestId=id(),extra={})=>({action:"create",song:"song",source:"recording",id:requestId,mode:"image",format:"vertical",prompt:"A celestial lake under soft gold stars",billingConsent:true,rightsConsent:true,...extra});
const post=payload=>route.POST(request(payload));
const result=async payload=>{const r=await post(payload);assert.equal(r.status,200,JSON.stringify(await r.clone().json()));return r.json();};
const refresh=requestId=>result({action:"refresh",song:"song",id:requestId});
const reset=()=>{objects.clear();requests.length=0;providerPosts=0;providerStatus="pending";postFailure=0;networkFailure=false;downloadFailure=false;tier="pro";mime="image/png";output=image;downloadUrl="https://storage.googleapis.com/generations/provider-id?signature=private";state.id="owner";state.key="fixture-private-key";state.studio.songs[0].audioId="recording";state.studio.songs[0].audioHistory=[];delete state.studio.songs[0].deletedAt;};
let checks=0;const checked=(value,label)=>{assert(value,label);checks++;};

reset();state.id=null;checked((await post(create())).status===401,"anonymous generation denied");state.id="other";checked((await post(create())).status===404,"another account cannot generate on the song");checked((await route.GET(new Request("https://studio.test/api/studio/visual-generation?song=song"))).status===404,"another account cannot list jobs");state.id="owner";
checked((await route.POST(request(create(),"https://outside.test"))).status===403,"cross-origin spending denied");
checked((await post(create(id(),{billingConsent:false}))).status===400,"billing approval required");checked((await post(create(id(),{rightsConsent:false}))).status===400,"rights approval required");checked((await post(create("wrong"))).status===400,"malformed request ID rejected");checked((await post(create(id(),{source:"different"}))).status===409,"unavailable recording rejected");checked((await post(create(id(),{prompt:"x".repeat(1501)}))).status===400,"prompt bounded");checked(providerPosts===0,"validation never spends credits");
state.key=null;checked((await post(create())).status===409,"missing connection is actionable");state.key="fixture-private-key";tier="creator";checked((await post(create())).status===402&&providerPosts===0,"known lower plan blocked without paid POST");

reset();const receipt=create();let body=await result(receipt);checked(body.job.status==="pending","real provider receipt saved");const paid=JSON.parse(requests.find(r=>r.method==="POST").body);checked(paid.model_id==="gemini-2.5-flash-image"&&paid.aspect_ratio==="9:16","documented model/ratio contract used");
await result(receipt);checked(providerPosts===1,"retry uses immutable receipt instead of another paid POST");checked((await post({...receipt,prompt:"Another prompt"})).status===409,"same ID cannot change request");
let library=await (await route.GET(new Request("https://studio.test/api/studio/visual-generation?song=song"))).json();checked(library.jobs.length===1&&library.jobs[0].id===receipt.id,"close/reopen can recover job from durable storage");checked(!JSON.stringify(library).includes("fixture-private-key")&&!JSON.stringify(library).includes("provider-id"),"list omits key and provider receipt");
providerStatus="generating";checked((await refresh(receipt.id)).job.status==="generating","running job updates without fake percentage");providerStatus="completed";body=await refresh(receipt.id);checked(body.job.status==="ready"&&body.job.asset===receipt.id,"completed result copied privately");const saved=objects.get("lyric-assets/owner/song/"+receipt.id);checked(saved.customMetadata.kind==="background"&&saved.customMetadata.source==="recording","private asset keeps ownership, kind and source");assert.deepEqual(saved.data,image);checked(!JSON.stringify(body).includes("signature=private"),"signed download URL stays server-only");await refresh(receipt.id);checked(providerPosts===1,"reopening finished media does not regenerate");
library=await (await route.GET(new Request("https://studio.test/api/studio/visual-generation?song=song"))).json();checked(library.images.some(i=>i.id===receipt.id),"generated image available as an animation reference");

reset();const duplicate=create();const simultaneous=await Promise.all([post(duplicate),post(duplicate)]);checked(simultaneous.some(r=>r.status===200)&&simultaneous.every(r=>[200,409].includes(r.status))&&providerPosts===1,"simultaneous duplicate clicks win only one conditional paid-request claim");providerStatus="completed";const copying=await Promise.all([post({action:"refresh",song:"song",id:duplicate.id}),post({action:"refresh",song:"song",id:duplicate.id})]);checked(copying.every(r=>[200,409].includes(r.status))&&objects.has("lyric-assets/owner/song/"+duplicate.id),"simultaneous imports use a conditional lease");

reset();networkFailure=true;const uncertain=create();body=await result(uncertain);checked(body.job.status==="unknown","lost network result marked uncertain");networkFailure=false;await result(uncertain);checked(providerPosts===1,"uncertain billable POST is never retried");body=await result({action:"recover",song:"song",id:uncertain.id,providerId:"provider-id"});checked(body.job.status==="pending"&&providerPosts===1,"manual receipt recovery checks provider without new generation");
reset();postFailure=503;const ambiguous=create();checked((await result(ambiguous)).job.status==="unknown","provider 5xx has conservative charge uncertainty");await result(ambiguous);checked(providerPosts===1,"5xx replay cannot spend again");
reset();postFailure=403;body=await result(create());checked(body.job.status==="failed"&&/permission/i.test(body.job.error),"permission failure gives actionable safe error");checked(!JSON.stringify(body).includes("Never expose"),"raw provider error withheld");

reset();const stale=create();await result(stale);const key="lyric-assets/owner/song/visual-jobs/"+stale.id+".json";await bucket.put(key,JSON.stringify({...JSON.parse(await (await bucket.get(key)).text()),status:"submitting",providerId:undefined,touchedAt:0}));checked((await refresh(stale.id)).job.status==="unknown"&&providerPosts===1,"crashed submit becomes recoverable, not resubmitted");
reset();const importing=create();await result(importing);providerStatus="completed";downloadFailure=true;body=await refresh(importing.id);checked(body.job.status==="pending"&&!body.job.asset,"media redirect never followed; result remains recoverable");checked(!requests.some(r=>r.url.startsWith("http://127")),"no internal network fetch");downloadFailure=false;body=await refresh(importing.id);checked(body.job.status==="ready"&&providerPosts===1,"retry imports without second charge");

reset();const hostile=create();await result(hostile);providerStatus="completed";downloadUrl="http://127.0.0.1/secret";checked((await post({action:"refresh",song:"song",id:hostile.id})).status===502,"non-allowlisted provider URL blocked");checked(requests.every(r=>!r.url.startsWith("http://127")),"blocked URL never fetched");
reset();const invalid=create();await result(invalid);providerStatus="completed";output=new TextEncoder().encode("<html>not an image</html>");body=await refresh(invalid.id);checked(body.job.status==="pending"&&objects.has("lyric-assets/owner/song/"+invalid.id),"unconfirmed paid media bytes are preserved without marking the result ready");

reset();await bucket.put("lyric-assets/other/song/reference",image,{httpMetadata:{contentType:"image/png"},customMetadata:{kind:"background"}});checked((await post(create(id(),{mode:"animate",reference:"reference"}))).status===400,"another owner’s image cannot become a reference");await bucket.put("lyric-assets/owner/song/reference",image,{httpMetadata:{contentType:"image/png"},customMetadata:{kind:"background"}});const animation=create(id(),{mode:"animate",reference:"reference",format:"square"});await result(animation);const videoPayload=JSON.parse(requests.find(r=>r.method==="POST").body);checked(videoPayload.model_id==="veo-3.1-fast-generate-001"&&videoPayload.duration_secs===4&&videoPayload.generate_audio===false&&videoPayload.aspect_ratio==="16:9","motion contract is short, silent and accurately framed");checked(videoPayload.start_frame.type==="inline_base64"&&videoPayload.start_frame.content_base64===Buffer.from(image).toString("base64"),"owned image passed through documented inline reference");

// Test a genuine authorized synthetic H.264 clip through the private streaming import, not a renamed file.
const ffmpeg=spawnSync("ffmpeg",["-hide_banner","-loglevel","error","-y","-f","lavfi","-i","color=c=navy:s=320x180:r=24:d=4","-an","-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart","work/visual-generation-tests/source.mp4"]);
assert.equal(ffmpeg.status,0,ffmpeg.stderr?.toString());output=new Uint8Array(readFileSync("work/visual-generation-tests/source.mp4"));mime="video/mp4";providerStatus="completed";body=await refresh(animation.id);checked(body.job.status==="ready","actual MP4 copied from simulated provider");const clip=objects.get("lyric-assets/owner/song/"+animation.id);assert.deepEqual(clip.data,output);checked(clip.customMetadata.kind==="sourceVideo","clip uses existing video asset kind");
const probe=spawnSync("ffprobe",["-v","error","-show_entries","stream=codec_name,width,height","-show_entries","format=duration","-of","json","work/visual-generation-tests/source.mp4"]);const info=JSON.parse(probe.stdout);checked(info.streams[0].codec_name==="h264"&&Math.abs(Number(info.format.duration)-4)<.1,"fixture is verified H.264, four seconds");
reset();const changed=create();await result(changed);state.studio.songs[0].audioId="new-recording";state.studio.songs[0].audioHistory=[{audioId:"recording"}];providerStatus="completed";body=await refresh(changed.id);checked(body.job.source==="recording","old source remains pinned after replacement");state.studio.songs[0].deletedAt=new Date().toISOString();checked((await post({action:"refresh",song:"song",id:changed.id})).status===404,"deleted song jobs cannot be opened");
console.log(`${checks} AI visual API checks passed. No live provider requests, user records or credits used.`);
