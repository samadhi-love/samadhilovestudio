export type AdFootage = { asset: string; duration: number; trimStart: number; trimEnd: number; loop: boolean; fit: "cover" | "contain" };
export type VideoFrameImage = { frame: CanvasImageSource; width: number; height: number; fit: "cover" | "contain"; zoom?:number; shiftX?:number; blend?:number; nextFrame?:CanvasImageSource; nextWidth?:number; nextHeight?:number };
export function isAdFootage(value: unknown): value is AdFootage {
  const v=value as AdFootage;
  return !!v && typeof v==="object" && typeof v.asset==="string" && /^[\w-]{1,80}$/.test(v.asset) && Number.isFinite(v.duration) && v.duration>0 && v.duration<=60.1 && Number.isFinite(v.trimStart) && v.trimStart>=0 && Number.isFinite(v.trimEnd) && v.trimEnd>v.trimStart && v.trimEnd<=v.duration && typeof v.loop==="boolean" && ["cover","contain"].includes(v.fit);
}
/** Video starts with the selected music excerpt. Trimming the song never moves caption timestamps. */
export function footageTime(sourceTime:number,rangeStart:number,footage:AdFootage){
 const elapsed=Math.max(0,sourceTime-rangeStart),length=footage.trimEnd-footage.trimStart;
 return footage.trimStart+(footage.loop?elapsed%length:Math.min(elapsed,Math.max(0,length-.001)));
}
export type FootageDecoder={duration:number;frameAt:(seconds:number,signal?:AbortSignal)=>Promise<VideoFrameImage>;dispose:()=>void};
/** Decode actual uploaded video frames. The clip's audio is intentionally not mixed into the song. */
export async function openFootage(source:string|Blob,signal?:AbortSignal):Promise<FootageDecoder>{
 const {Input,BlobSource,CanvasSink,ALL_FORMATS}=await import("mediabunny");
 signal?.throwIfAborted();
 const blob=typeof source==="string"?await fetch(source,{signal,credentials:"same-origin"}).then(r=>{if(!r.ok)throw new Error("The product video could not load. Sign in and retry.");return r.blob();}):source;
 if(!blob.size||blob.size>120*1024*1024)throw new Error("Choose a product video up to 120 MB.");
 const input=new Input({source:new BlobSource(blob),formats:ALL_FORMATS});
 try{
  const track=await input.getPrimaryVideoTrack();if(!track||!await track.canDecode())throw new Error("This browser cannot decode that video. Try an MP4 with H.264 video in a current browser.");
  const first=Math.max(0,await track.getFirstTimestamp()),end=await track.computeDuration(),duration=end-first;
  if(!Number.isFinite(duration)||duration<=0||duration>60.1)throw new Error("Choose a short product video up to 60 seconds long.");
  const sink=new CanvasSink(track,{width:Math.min(1920,track.displayWidth),poolSize:2});
  let disposed=false;
  const frameAt=async(seconds:number,task?:AbortSignal)=>{task?.throwIfAborted();if(disposed)throw new Error("Video decoder closed. Reopen the project and retry.");const result=await sink.getCanvas(first+Math.max(0,Math.min(seconds,duration-.001)));task?.throwIfAborted();if(!result)throw new Error("A frame in this clip could not decode. Try another MP4 recording.");return{frame:result.canvas,width:result.canvas.width,height:result.canvas.height,fit:"cover" as const};};
  await frameAt(0,signal);
  return{duration,frameAt,dispose:()=>{if(!disposed){disposed=true;input.dispose();}}};
 }catch(error){input.dispose();throw error;}
}
