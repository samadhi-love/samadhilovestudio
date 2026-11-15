export type AssemblyClip={id:string;from:number;to:number;gain?:number};
export type PlannedAudioClip=AssemblyClip&{start:number;duration:number;fadeIn:number;fadeOut:number};
/** A crossfaded timeline in seconds, with all joins clamped for short source clips. */
export function planAudioAssembly(clips:AssemblyClip[],fade:number,limit=7200):PlannedAudioClip[]{
 if(!clips.length||clips.length>2000||!Number.isFinite(fade)||fade<0||fade>20||!Number.isFinite(limit)||limit<=0||limit>7200)throw new Error("Choose audio clips, a valid blend, and a duration up to two hours.");
 const plan:PlannedAudioClip[]=[];
 for(const clip of clips){if(!clip.id||!Number.isFinite(clip.from)||!Number.isFinite(clip.to)||clip.from<0||clip.to<=clip.from||clip.gain!==undefined&&(!Number.isFinite(clip.gain)||clip.gain<0||clip.gain>2))throw new Error("Check the selected audio range.");const duration=clip.to-clip.from,prior=plan.at(-1),overlap=prior?Math.min(fade,duration/3,prior.duration/3):0,start=prior?prior.start+prior.duration-overlap:0;if(start>=limit)break;const length=Math.min(duration,limit-start);if(length<=0)break;if(prior)prior.fadeOut=overlap;plan.push({...clip,to:clip.from+length,start,duration:length,fadeIn:overlap,fadeOut:0});if(start+length>=limit)break;}
 return plan;
}
export function assemblyDuration(plan:PlannedAudioClip[]){const last=plan.at(-1);return last?last.start+last.duration:0;}
export function assemblyGain(clip:PlannedAudioClip,time:number){const age=time-clip.start;if(age<0||age>=clip.duration)return 0;const a=clip.fadeIn?Math.sin(Math.min(1,age/clip.fadeIn)*Math.PI/2):1,b=clip.fadeOut?Math.sin(Math.min(1,(clip.duration-age)/clip.fadeOut)*Math.PI/2):1;return a*b*(clip.gain??1);}
export function protectMixPeak(sample:number){const x=Number.isFinite(sample)?sample*.82:0,level=Math.abs(x);return level<=.9?x:Math.sign(x)*(.9+.09*Math.tanh((level-.9)/.09));}
