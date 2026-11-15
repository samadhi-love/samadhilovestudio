import {estimateBeats} from "./beat-analysis";
self.onmessage=(event:MessageEvent<{samples:Float32Array;sampleRate:number}>)=>{try{self.postMessage({result:estimateBeats(event.data.samples,event.data.sampleRate)});}catch(e){self.postMessage({error:e instanceof Error?e.message:"Beat estimation failed."});}};
