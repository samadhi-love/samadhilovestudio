import type {BeatEstimate} from "./beat-analysis";
export function analyzeBeatBuffer(buffer:AudioBuffer,signal:AbortSignal):Promise<BeatEstimate>{
 signal.throwIfAborted();if(typeof Worker==="undefined")return Promise.reject(new Error("This browser cannot run background beat analysis. Use manual tempo and beat origin."));
 const step=Math.max(1,Math.floor(buffer.sampleRate/11025)),samples=new Float32Array(Math.ceil(buffer.length/step)),channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
 for(let i=0;i<samples.length;i++){const at=Math.min(buffer.length-1,i*step);for(const channel of channels)samples[i]+=channel[at]/channels.length;}
 return new Promise((resolve,reject)=>{const worker=new Worker(new URL("./beat-worker.ts",import.meta.url),{type:"module"});
 const finish=()=>{worker.terminate();signal.removeEventListener("abort",abort);};const abort=()=>{finish();reject(new DOMException("Canceled","AbortError"));};
 signal.addEventListener("abort",abort,{once:true});worker.onerror=()=>{finish();reject(new Error("Background beat analysis could not run. Use manual tempo controls."));};worker.onmessage=e=>{finish();if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.result);};
 worker.postMessage({samples,sampleRate:buffer.sampleRate/step},[samples.buffer]);if(signal.aborted)abort();});
}
