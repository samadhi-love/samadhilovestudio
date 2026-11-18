/** Shared, bounded metadata reader; uses authenticated app URLs, never public R2. */
export async function readOwnedAudioDuration(url:string,signal:AbortSignal){
  const {Input,UrlSource,ALL_FORMATS}=await import("mediabunny");
  const input=new Input({source:new UrlSource(url,{maxCacheSize:1024*1024,requestInit:{credentials:"same-origin"},getRetryDelay:n=>n<2?.25:null}),formats:ALL_FORMATS});
  let timer:ReturnType<typeof setTimeout>|undefined;
  let rejectWait:(reason:Error)=>void=()=>{};
  const deadline=new Promise<never>((_,reject)=>{rejectWait=reject;timer=setTimeout(()=>{input.dispose();reject(new Error("The recording took too long to load. Try opening it again."));},20_000);});
  const abort=()=>{input.dispose();rejectWait(new DOMException("Reading cancelled.","AbortError"));};signal.addEventListener("abort",abort,{once:true});
  try{
    signal.throwIfAborted();
    return await Promise.race([deadline,(async()=>{
      const track=await input.getPrimaryAudioTrack();
      if(!track)throw new Error("This source has no audio track.");
      const seconds=(await track.computeDuration())-Math.max(0,await track.getFirstTimestamp());
      if(!Number.isFinite(seconds)||seconds<=0)throw new Error("The recording length could not be read. Reopen the song and try again.");
      return seconds;
    })()]);
  }finally{if(timer)clearTimeout(timer);signal.removeEventListener("abort",abort);input.dispose();}
}
