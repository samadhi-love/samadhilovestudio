import {serverStorage as env} from "./storage";
import {videoFingerprint,sha256} from "../video-upload-identity";
import {clearStaleVideoUploads} from "./video-upload-cleanup";
export const videoChunkBytes=8*1024*1024;
export const maxPrivateVideoBytes=512*1024*1024;
type Manifest={id:string;owner?:string;song:string;source:string;size:number;type:string;createdAt:string;fingerprint?:string;hashes?:string[]};
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
async function bytes(request:Request,limit:number){
  const reader=request.body!.getReader(),chunks:Uint8Array[]=[];let size=0;
  try{for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>limit)throw new Error("Upload chunk is too large.");chunks.push(chunk.value);}}
  catch(error){await reader.cancel().catch(()=>{});throw error;}
  finally{reader.releaseLock();}
  const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
/** Private, bounded chunks through the existing storage boundary, not public URLs. */
export async function uploadVideoChunks(request:Request,owner:string,song:string,source:string,size:number,type:string){
  const bucket=env.BUCKET!;
  const url=new URL(request.url),upload=url.searchParams.get("upload");
  const root=`private/video-uploads/${encodeURIComponent(owner)}/`;
  if(upload==="init"){
    const requested=url.searchParams.get("session");
    await clearStaleVideoUploads(bucket,root,requested);
    if(requested&&!/^[a-f\d-]{36}$/i.test(requested))return response({error:"Choose a valid private upload session."},400);
    let identity:{fingerprint?:string;hashes?:string[]}={};
    if(request.headers.has("X-Video-Fingerprint")){
      try{
        identity=JSON.parse(new TextDecoder().decode(await bytes(request,16000)));
        if(!/^[a-f\d]{64}$/.test(identity.fingerprint??"")||identity.fingerprint!==request.headers.get("X-Video-Fingerprint")||
          !Array.isArray(identity.hashes)||identity.hashes.length!==Math.ceil(size/videoChunkBytes)||
          !identity.hashes.every(h=>typeof h==="string"&&/^[a-f\d]{64}$/.test(h))||
          identity.fingerprint!==await videoFingerprint(size,type,identity.hashes))
          return response({error:"The video identity changed. Choose the same finished file to resume."},409);
      }catch{return response({error:"The private video identity could not be read."},400);}
    }
    const manifest:Manifest={id:requested??crypto.randomUUID(),owner,song,source,size,type,createdAt:new Date().toISOString(),fingerprint:identity.fingerprint,hashes:identity.hashes};
    const path=root+manifest.id+"/manifest";
    const written=await bucket.put(path,JSON.stringify(manifest),{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"application/json"}});
    if(!written){
      const existing=await bucket.get(path),prior=await existing?.json<Manifest>();
      if(!prior||prior.song!==song||prior.source!==source||prior.size!==size||prior.type!==type||
        prior.fingerprint!==identity.fingerprint||JSON.stringify(prior.hashes)!==JSON.stringify(identity.hashes))
        return response({error:"This upload belongs to a different video. Its saved parts are unchanged."},409);
    }
    const complete=await bucket.head(`lyric-assets/${encodeURIComponent(owner)}/${song}/${manifest.id}`);
    return response({upload:manifest.id,chunkSize:videoChunkBytes,...(complete?.customMetadata?.upload===manifest.id&&complete.size===size?{id:manifest.id}:{})});
  }
  if(!upload||!/^[a-f\d-]{36}$/i.test(upload))return response({error:"Start the private video upload again."},400);
  const prefix=root+upload+"/",stored=await bucket.get(prefix+"manifest");
  if(!stored)return response({error:"This private upload was not found. Retry saving your video."},404);
  const manifest=await stored.json<Manifest>();
  if(manifest.song!==song||manifest.source!==source||manifest.size!==size||manifest.type!==type||
    manifest.owner!==undefined&&manifest.owner!==owner||
    manifest.fingerprint!==undefined&&manifest.fingerprint!==request.headers.get("X-Video-Fingerprint"))return response({error:"Video upload details changed. Start saving again."},409);
  const key=`lyric-assets/${encodeURIComponent(owner)}/${song}/${upload}`,count=Math.ceil(size/videoChunkBytes);
  const existing=await bucket.head(key);
  if(existing?.customMetadata?.upload===upload&&existing.size===size&&(!manifest.fingerprint||existing.customMetadata?.fingerprint===manifest.fingerprint))return response({id:upload,kind:"video",size});
  if(url.searchParams.get("complete")==="1"){
    for(let index=0;index<count;index++){
      const part=await bucket.head(prefix+index);
      if(!part||part.size!==Math.min(videoChunkBytes,size-index*videoChunkBytes)||
        manifest.hashes&&part.customMetadata?.hash!==manifest.hashes[index])return response({error:"A video chunk is missing or changed. Retry saving the same video."},409);
    }
    // Pull one part at a time. The Node R2 adapter spools this stream to a
    // private, size-capped temporary file; no full-video ArrayBuffer is made.
    let index=0,reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
    const body=new ReadableStream<Uint8Array>({
      async pull(controller){
        try{
          for(;;){
            if(!reader){
              if(index===count){controller.close();return;}
              const part=await bucket.get(prefix+index++);
              if(!part)throw new Error("A saved video chunk became unavailable.");
              reader=part.body.getReader();
            }
            const chunk=await reader.read();
            if(chunk.done){reader.releaseLock();reader=undefined;continue;}
            controller.enqueue(chunk.value);
            return;
          }
        }catch(error){controller.error(error);}
      },
      async cancel(){await reader?.cancel();},
    });
    const fixed=new FixedLengthStream(size),piping=body.pipeTo(fixed.writable);
    try{
      await Promise.all([piping,bucket.put(key,fixed.readable,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:type},customMetadata:{
        song,kind:"video",source,createdAt:manifest.createdAt,upload,...(manifest.fingerprint?{fingerprint:manifest.fingerprint}:{}),
      }})]);
    }catch{
      // Final-write ambiguity is resolved by the stable asset ID on retry.
      return response({error:"The final video save was not confirmed. Keep this tab open and retry; uploaded chunks are retained."},503);
    }
    const saved=await bucket.head(key);
    if(!saved||saved.size!==size)return response({error:"The video save could not be verified. Retry saving."},503);
    // Only our own temporary chunks, and only after the finished private video
    // is verified. Retain the tiny manifest to make repeated completion safe.
    for(let index=0;index<count;index++)try{await bucket.delete(prefix+index);}catch{/* Finished video is safe; leftover temporary chunks can be cleaned later. */}
    return response({id:upload,kind:"video",size});
  }
  const raw=url.searchParams.get("part"),part=Number(raw);
  if(raw===null||!Number.isSafeInteger(part)||part<0||part>=count)return response({error:"Choose a valid video chunk."},400);
  const expected=Math.min(videoChunkBytes,size-part*videoChunkBytes);
  const content=await bytes(request,expected);
  if(content.byteLength!==expected)return response({error:"A video chunk was incomplete. Retry saving."},400);
  const hash=await sha256(content);
  if(manifest.hashes&&manifest.hashes[part]!==hash)return response({error:"This video chunk does not match the original file. Its completed parts were kept."},409);
  const previous=await bucket.head(prefix+part);
  if(previous){
    if(previous.size!==expected||previous.customMetadata?.hash!==hash)return response({error:"This video chunk changed. Start saving again."},409);
  }else{
    const saved=await bucket.put(prefix+part,content,{onlyIf:{etagDoesNotMatch:"*"},customMetadata:{hash}});
    if(!saved){const concurrent=await bucket.head(prefix+part);if(concurrent?.customMetadata?.hash!==hash)return response({error:"This video chunk changed in another save."},409);}
  }
  return response({part,size:expected});
}

/** Caller authenticates the account and verifies access to the song/recording. */
export async function videoUploadStatus(request:Request,owner:string,song:string,source:string){
  const bucket=env.BUCKET,upload=new URL(request.url).searchParams.get("upload");
  if(!bucket)return response({error:"Private video storage is unavailable."},503);
  if(!upload||!/^[a-f\d-]{36}$/i.test(upload))return response({error:"Choose a valid private upload."},400);
  const prefix=`private/video-uploads/${encodeURIComponent(owner)}/${upload}/`;
  const object=await bucket.get(prefix+"manifest");
  if(!object)return response({error:"This private upload was not found."},404);
  const manifest=await object.json<Manifest>();
  if(manifest.owner!==owner||manifest.song!==song||manifest.source!==source||
    !manifest.fingerprint||manifest.fingerprint!==request.headers.get("X-Video-Fingerprint")||!manifest.hashes)
    return response({error:"This upload does not match the account, recording and video file."},409);
  const complete=await bucket.head(`lyric-assets/${encodeURIComponent(owner)}/${song}/${upload}`);
  if(complete?.customMetadata?.upload===upload&&complete.customMetadata?.fingerprint===manifest.fingerprint&&complete.size===manifest.size)
    return response({id:upload,upload,fingerprint:manifest.fingerprint,chunkSize:videoChunkBytes,parts:[]});
  const parts:number[]=[];
  for(let i=0;i<manifest.hashes.length;i++){
    const part=await bucket.head(prefix+i);
    if(part?.size===Math.min(videoChunkBytes,manifest.size-i*videoChunkBytes)&&part.customMetadata?.hash===manifest.hashes[i])parts.push(i);
  }
  return response({upload,fingerprint:manifest.fingerprint,chunkSize:videoChunkBytes,parts});
}

