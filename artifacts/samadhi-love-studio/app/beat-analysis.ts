export type BeatEstimate={bpm:number;offset:number;beats:number[];strength:number;onsets:number[]};
/** Onset-envelope autocorrelation with an explicit fixed-tempo grid. Not a confidence probability. */
export function estimateBeats(samples:Float32Array,sampleRate:number):BeatEstimate {
 if(!Number.isFinite(sampleRate)||sampleRate<1000||samples.length/sampleRate<4||samples.length/sampleRate>600.1)throw new Error("Use a soundtrack between four seconds and ten minutes for beat estimation.");
 const hop=Math.max(1,Math.round(sampleRate*.01)),env: number[]=[];let prior=0;
 for(let at=0;at<samples.length;at+=hop){let sum=0,diff=0;for(let i=at;i<Math.min(at+hop,samples.length);i++){const v=samples[i];sum+=v*v;diff+=Math.abs(v-prior);prior=v;}env.push(Math.sqrt(sum/hop)+diff/hop*.6);}
 const novelty=env.map((v,i)=>{const from=Math.max(0,i-12),mean=env.slice(from,i+1).reduce((a,b)=>a+b,0)/(i-from+1);return Math.max(0,v-mean);});
 const max=Math.max(...novelty);if(max<1e-5)throw new Error("No clear rhythmic attacks were found. Set tempo and beat origin manually.");
 const onsetFrames:number[]=[];for(let i=1;i<novelty.length-1;i++)if(novelty[i]>max*.17&&novelty[i]>=novelty[i-1]&&novelty[i]>novelty[i+1]&&i-(onsetFrames.at(-1)??-100)>8)onsetFrames.push(i);
 if(onsetFrames.length<4)throw new Error("Too few clear attacks for a useful estimate. Set tempo manually.");
 const fps=sampleRate/hop;let bestBpm=100,bestScore=-1;const scores:{bpm:number;score:number}[]=[];
 for(let bpm=60;bpm<=180;bpm+=.5){const lag=60*fps/bpm;let score=0,weight=0;
   for(const i of onsetFrames){const j=Math.round(i-lag);if(j<0)continue;let nearby=0;for(let k=Math.max(0,j-2);k<Math.min(novelty.length,j+3);k++){const distance=k-(i-lag);nearby=Math.max(nearby,novelty[k]*Math.exp(-distance*distance/2));}score+=novelty[i]*nearby;weight+=novelty[i]*max;}
   score/=Math.max(1e-9,weight);scores.push({bpm,score});
   // Resolve close octave/tie candidates toward a useful middle tempo, never claim certainty.
   const ranked=score*(1-.025*Math.abs(Math.log2(bpm/110)));if(ranked>bestScore){bestScore=ranked;bestBpm=bpm;}
 }
 const period=60/bestBpm;let phase=0,phaseScore=-1;
 for(const onset of onsetFrames){const candidate=(onset/fps)%period;let score=0;for(const i of onsetFrames){const d=Math.abs(((i/fps-candidate+period/2)%period+period)%period-period/2);score+=novelty[i]*Math.exp(-d*d/.0025);}if(score>phaseScore){phaseScore=score;phase=candidate;}}
 const duration=samples.length/sampleRate,beats:number[]=[];for(let t=phase;t<duration&&beats.length<2400;t+=period)beats.push(Math.min(duration,Math.round(t*1000)/1000));
 return{bpm:bestBpm,offset:Math.round(phase*1000)/1000,beats,strength:Math.max(0,Math.min(1,scores.find(s=>s.bpm===bestBpm)?.score??0)),onsets:onsetFrames.map(i=>Math.round(i/fps*1000)/1000).slice(0,2400)};
}
export function beatGrid(bpm:number,offset:number,duration:number){if(!Number.isFinite(bpm)||bpm<40||bpm>240||!Number.isFinite(offset)||offset<0||offset>duration)throw new Error("Choose a valid tempo and beat origin.");const result:number[]=[];for(let t=offset;t<duration&&result.length<2400;t+=60/bpm)result.push(Math.min(duration,Math.round(t*1000)/1000));return result;}
