import {serverStorage as env} from "./storage";
export const videoChunkBytes=8*1024*1024;
export const maxPrivateVideoBytes=512*1024*1024;
type Manifest={id:string;song:string;source:string;size:number;type:string;createdAt:string};
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
    const manifest:Manifest={id:crypto.randomUUID(),song,source,size,type,createdAt:new Date().toISOString()};
    await bucket.put(root+manifest.id+"/manifest",JSON.stringify(manifest),{httpMetadata:{contentType:"application/json"}});
    return response({upload:manifest.id,chunkSize:videoChunkBytes});
  }
  if(!upload||!/^[a-f\d-]{36}$/i.test(upload))return response({error:"Start the private video upload again."},400);
  const prefix=root+upload+"/",stored=await bucket.get(prefix+"manifest");
  if(!stored)return response({error:"This private upload was not found. Retry saving your video."},404);
  const manifest=await stored.json<Manifest>();
  if(manifest.song!==song||manifest.source!==source||manifest.size!==size||manifest.type!==type)return response({error:"Video upload details changed. Start saving again."},409);
  const key=`lyric-assets/${encodeURIComponent(owner)}/${song}/${upload}`,count=Math.ceil(size/videoChunkBytes);
  const existing=await bucket.head(key);
  if(existing?.customMetadata?.upload===upload)return response({id:upload,kind:"video",size});
  if(url.searchParams.get("complete")==="1"){
    for(let index=0;index<count;index++){
      const part=await bucket.head(prefix+index);
      if(!part||part.size!==Math.min(videoChunkBytes,size-index*videoChunkBytes))return response({error:"A video chunk is missing. Keep this tab open and retry saving."},409);
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
        song,kind:"video",source,createdAt:manifest.createdAt,upload,
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
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",content)),b=>b.toString(16).padStart(2,"0")).join("");
  const previous=await bucket.head(prefix+part);
  if(previous){
    if(previous.size!==expected||previous.customMetadata?.hash!==hash)return response({error:"This video chunk changed. Start saving again."},409);
  }else{
    const saved=await bucket.put(prefix+part,content,{onlyIf:{etagDoesNotMatch:"*"},customMetadata:{hash}});
    if(!saved){const concurrent=await bucket.head(prefix+part);if(concurrent?.customMetadata?.hash!==hash)return response({error:"This video chunk changed in another save."},409);}
  }
  return response({part,size:expected});
}
