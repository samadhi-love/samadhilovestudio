import {assemblyDuration,assemblyGain,planAudioAssembly,protectMixPeak,type AssemblyClip} from "./audio-assembly";
import {songEndFadeGain} from "./song-region-actions";
export type MixSource={id:string;url?:string;blob?:Blob};
export type AssemblyResult={blob:Blob;seconds:number;sampleRate:number;codec:string;plan:ReturnType<typeof planAudioAssembly>};
/** One second of output PCM and at most two active decoders; no full-party PCM allocation. */
export async function renderStreamingMix(sources:MixSource[],options:{clips?:AssemblyClip[];fade:number;fadeOut?:number;limit:number;repeat?:boolean;bitrate?:96000|128000|192000;metadata?:{title?:string;comment?:string};inheritCredits?:boolean;signal:AbortSignal;progress:(fraction:number,message:string)=>void}):Promise<AssemblyResult>{
 const media=await import("mediabunny"),task=options.signal;task.throwIfAborted();
 if(!sources.length||sources.length>96)throw new Error("Choose 1–96 authorized source tracks.");
 const sourceMap=new Map(sources.map(s=>[s.id,s])),live=new Set<InstanceType<typeof media.Input>>();
 const open=async(source:MixSource)=>{task.throwIfAborted();const input=new media.Input({source:source.blob?new media.BlobSource(source.blob):new media.UrlSource(source.url!,{requestInit:{credentials:"same-origin"},maxCacheSize:2*1024*1024,getRetryDelay:attempt=>attempt<2?.25:null}),formats:media.ALL_FORMATS});live.add(input);try{const track=await input.getPrimaryAudioTrack();if(!track||!await track.canDecode())throw new Error("This browser cannot decode one of the sources. Try an MP3 or WAV file.");const first=Math.max(0,await track.getFirstTimestamp()),end=await track.computeDuration(),duration=end-first;if(!Number.isFinite(duration)||duration<=0||duration>7200.1)throw new Error("A source has an unreadable duration or exceeds two hours.");return{input,track,first,duration};}catch(error){live.delete(input);input.dispose();throw error;}};
 const close=(input:InstanceType<typeof media.Input>)=>{live.delete(input);input.dispose();};
 const abort=()=>{for(const input of live)input.dispose();};task.addEventListener("abort",abort,{once:true});
 let output:InstanceType<typeof media.Output>|undefined;
 try{
  const durations=new Map<string,number>(),credits:string[]=[];
  for(let i=0;i<sources.length;i++){options.progress(.05*i/sources.length,`Checking source ${i+1} of ${sources.length}`);const item=await open(sources[i]);durations.set(sources[i].id,item.duration);if(options.inheritCredits){const tags=await item.input.getMetadataTags();if(tags.comment)credits.push(tags.comment);}close(item.input);}
  let clips=options.clips??sources.map(s=>({id:s.id,from:0,to:durations.get(s.id)!}));
  if(clips.some(c=>!sourceMap.has(c.id)||c.to>(durations.get(c.id)??0)+.001))throw new Error("A selected section is outside its source recording.");
  if(options.repeat){const seed=clips,cycle=assemblyDuration(planAudioAssembly(seed,options.fade,7200));if(cycle<.1)throw new Error("These clips are too short to repeat.");clips=Array.from({length:Math.min(2000,Math.ceil(options.limit/Math.max(.1,cycle-options.fade))+1)},()=>seed).flat().slice(0,2000);}
  const plan=planAudioAssembly(clips,options.fade,options.limit),seconds=assemblyDuration(plan),rate=44100,total=Math.ceil(seconds*rate);
  if(options.fadeOut!==undefined&&(!Number.isFinite(options.fadeOut)||options.fadeOut<0||options.fadeOut>seconds))throw new Error("Choose an ending fade inside the song.");
  if(!total)throw new Error("The selected file has no playable audio.");
  if(!await media.canEncodeAudio("mp3")){const{registerMp3Encoder}=await import("@mediabunny/mp3-encoder");registerMp3Encoder();}
  const parts:Blob[]=[];let bytes=0;
  output=new media.Output({format:new media.Mp3OutputFormat({xingHeader:false}),target:new media.AppendOnlyStreamTarget(new WritableStream<Uint8Array>({write(chunk){task.throwIfAborted();bytes+=chunk.byteLength;if(bytes>210*1024*1024)throw new Error("This file exceeds the 210 MB export limit. Export the individual party files instead.");parts.push(new Blob([chunk.slice()]));}}))});
  const comment=[options.metadata?.comment,...new Set(credits)].filter(Boolean).join("\n\n");if(comment.length>500000)throw new Error("These source credits are too long for one mix. Export fewer source tracks per file.");if(options.metadata||comment)output.setMetadataTags({...options.metadata,...(comment?{comment}:{})});
  const encoded=new media.AudioSampleSource({codec:"mp3",bitrate:options.bitrate??128000});output.addAudioTrack(encoded);await output.start();
  type Reader={input:InstanceType<typeof media.Input>;first:number;iterator:AsyncGenerator<{buffer:AudioBuffer;timestamp:number}>;part?:{buffer:AudioBuffer;timestamp:number};done:boolean};
  const readers=new Map<number,Reader>();
  async function reader(index:number){let r=readers.get(index);if(r)return r;const p=plan[index],opened=await open(sourceMap.get(p.id)!);r={input:opened.input,first:opened.first,iterator:new media.AudioBufferSink(opened.track).buffers(opened.first+p.from,opened.first+p.to),done:false};readers.set(index,r);return r;}
  for(let offset=0;offset<total;offset+=rate){task.throwIfAborted();const count=Math.min(rate,total-offset),left=new Float32Array(count),right=new Float32Array(count),start=offset/rate,end=(offset+count)/rate;
   for(let index=0;index<plan.length;index++){const p=plan[index];if(p.start>=end||p.start+p.duration<=start)continue;const r=await reader(index),from=Math.max(0,Math.ceil((p.start-start)*rate)),until=Math.min(count,Math.ceil((p.start+p.duration-start)*rate));
    for(let i=from;i<until;i++){const time=start+i/rate,sourceTime=r.first+p.from+time-p.start;while(!r.done&&(!r.part||r.part.timestamp+r.part.buffer.duration<=sourceTime)){const next=await r.iterator.next();r.done=!!next.done;r.part=next.value;}const part=r.part;if(!part||sourceTime<part.timestamp||sourceTime>=part.timestamp+part.buffer.duration)continue;const b=part.buffer,x=(sourceTime-part.timestamp)*b.sampleRate,at=Math.floor(x),fraction=x-at,a=b.getChannelData(0),c=b.getChannelData(Math.min(1,b.numberOfChannels-1)),next=Math.min(at+1,a.length-1),gain=assemblyGain(p,time);left[i]+=((a[at]??0)*(1-fraction)+(a[next]??0)*fraction)*gain;right[i]+=((c[at]??0)*(1-fraction)+(c[next]??0)*fraction)*gain;}
   }
   for(const[index,r]of readers)if(plan[index].start+plan[index].duration<=end+.00001){await r.iterator.return(undefined);close(r.input);readers.delete(index);}
   const pcm=new Float32Array(count*2);for(let i=0;i<count;i++){const edge=Math.min(1,(offset+i)/(rate*.025),(total-offset-i)/(rate*.025))*songEndFadeGain((offset+i)/rate,seconds,options.fadeOut);pcm[i]=protectMixPeak(left[i])*edge;pcm[count+i]=protectMixPeak(right[i])*edge;}
   const sample=new media.AudioSample({data:pcm,format:"f32-planar",numberOfChannels:2,sampleRate:rate,timestamp:offset/rate});try{await encoded.add(sample);}finally{sample.close();}
   options.progress(.05+.94*(offset+count)/total,`Blending ${Math.floor(end/60)}:${String(Math.floor(end%60)).padStart(2,"0")} of ${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,"0")}`);await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  encoded.close();task.throwIfAborted();await output.finalize();const blob=new Blob(parts,{type:"audio/mpeg"});if(!blob.size)throw new Error("The encoder returned an empty file.");options.progress(1,"Finished continuous MP3");return{blob,seconds,sampleRate:rate,codec:"MP3 · stereo · "+((options.bitrate??128000)/1000)+" kbps",plan};
 }catch(error){await output?.cancel().catch(()=>{});if(task.aborted)throw new DOMException("Mix cancelled. Saved source tracks are preserved.","AbortError");throw error;}finally{task.removeEventListener("abort",abort);for(const input of live)input.dispose();live.clear();}
}
export async function readMixCredits(url:string){const{Input,UrlSource,ALL_FORMATS}=await import("mediabunny"),input=new Input({source:new UrlSource(url,{requestInit:{credentials:"same-origin"},maxCacheSize:1024*1024,getRetryDelay:n=>n<2?.25:null}),formats:ALL_FORMATS});try{return(await input.getMetadataTags()).comment??"No embedded credit notes were supplied. Check the original source permissions before sharing.";}finally{input.dispose();}}
