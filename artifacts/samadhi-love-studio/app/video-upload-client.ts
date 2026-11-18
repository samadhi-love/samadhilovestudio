import {identifyVideo,videoPartBytes} from "./video-upload-identity";
import {readVideoUpload,saveVideoUpload,type VideoUploadCheckpoint} from "./video-render-recovery";

/** Stable account/file identity survives an explicit retry or the render recovery flow. */
export async function resumePrivateVideo(song:string,blob:Blob,signal?:AbortSignal,source?:string,expectedOwner?:string){
  const base="/api/studio/lyric-assets";
  const identityResponse=await fetch(`${base}?song=${encodeURIComponent(song)}&upload=identity${source?`&source=${encodeURIComponent(source)}`:""}`,{
    signal,cache:"no-store",headers:expectedOwner?{"X-Studio-Workspace":expectedOwner}:{},
  });
  const identity=await identityResponse.json() as {workspace?:string;source?:string;error?:string};
  if(!identityResponse.ok||!identity.workspace||!identity.source)throw new Error(identity.error??"Sign in again before saving this video.");
  const file=await identifyVideo(blob,signal);
  const scope={owner:identity.workspace,song,source:identity.source,...file,size:blob.size};
  const headers={"X-Song-Id":song,"X-Asset-Kind":"video","X-Asset-Size":String(blob.size),"Content-Type":file.type,
    "X-Source-Audio-Id":identity.source,"X-Studio-Workspace":identity.workspace,"X-Video-Fingerprint":file.fingerprint};
  async function send(query:string,body:Blob|string){
    for(let attempt=0;attempt<3;attempt++){
      signal?.throwIfAborted();
      try{
        const response=await fetch(`${base}?${query}`,{method:"POST",headers,body,signal});
        const result=await response.json() as {error?:string;upload?:string;chunkSize?:number;id?:string};
        if(response.ok)return result;
        if(response.status<500&&response.status!==429||attempt===2)throw Object.assign(new Error(result.error??"Your video could not save."),{terminal:true});
      }catch(error){if(signal?.aborted||(error as {terminal?:boolean}).terminal||attempt===2)throw error;}
      await new Promise(resolve=>setTimeout(resolve,300*(attempt+1)));
    }
    throw new Error("Retry saving your video; its uploaded parts are kept privately.");
  }
  let saved=await readVideoUpload(scope).catch(()=>undefined),parts:number[]=[];
  if(saved&&(saved.owner!==scope.owner||saved.song!==song||saved.source!==scope.source||saved.size!==blob.size||saved.type!==file.type||saved.fingerprint!==file.fingerprint||JSON.stringify(saved.hashes)!==JSON.stringify(file.hashes)))saved=undefined;
  if(saved){
    const response=await fetch(`${base}?song=${encodeURIComponent(song)}&source=${encodeURIComponent(scope.source)}&upload=${encodeURIComponent(saved.upload)}`,{headers,cache:"no-store",signal});
    const status=await response.json() as {error?:string;id?:string;parts?:number[];fingerprint?:string;chunkSize?:number};
    if(response.ok){
      if(status.fingerprint!==file.fingerprint||status.chunkSize!==videoPartBytes)throw new Error("This saved upload does not match your video. Its private files were kept.");
      if(status.id)return status.id;
      parts=status.parts??[];
    }else if(response.status!==404)throw new Error(status.error??"The private upload status could not be checked. Retry without starting over.");
  }
  const checkpoint:VideoUploadCheckpoint=saved??{...scope,upload:crypto.randomUUID()};
  // Persist BEFORE init so a lost init response or reload reuses the same ID.
  // If device storage is unavailable, fail before sending any file bytes.
  await saveVideoUpload(checkpoint);
  const init=await send(`upload=init&session=${encodeURIComponent(checkpoint.upload)}`,JSON.stringify({fingerprint:file.fingerprint,hashes:file.hashes}));
  if(init.upload!==checkpoint.upload||init.chunkSize!==videoPartBytes)throw new Error("The private upload session could not be confirmed.");
  if(init.id)return init.id;
  const completed=new Set(parts);
  for(let index=0;index<file.hashes.length;index++){
    if(completed.has(index))continue;
    await send(`upload=${checkpoint.upload}&part=${index}`,blob.slice(index*videoPartBytes,(index+1)*videoPartBytes));
  }
  const finished=await send(`upload=${checkpoint.upload}&complete=1`,"");
  if(!finished.id)throw new Error("Your video save was not confirmed. Retry to check the same saved file.");
  return finished.id;
}
