import {assemblyDuration,planAudioAssembly,type AssemblyClip} from "./audio-assembly";
import {maxGeneratedSongSeconds} from "./track-duration";
/** Check the untruncated timeline, including the same join overlaps as rendering. */
export function assertSongEditLength(clips:AssemblyClip[],fade:number){
 const seconds=assemblyDuration(planAudioAssembly(clips,fade,7200));
 if(seconds>maxGeneratedSongSeconds)throw new Error("This edit would exceed 6:00. Choose a shorter added section; your original stays unchanged.");
 return seconds;
}
export type SectionEditPlan={sourceSongId:string;sourceAudioId:string;fade:number;fadeOut?:number;clips:{songId:string;audioId:string;from:number;to:number}[]};
export function isSectionEditPlan(value:unknown):value is SectionEditPlan{const v=value as SectionEditPlan,id=(s:unknown)=>typeof s==="string"&&/^[\w-]{1,100}$/.test(s);return !!v&&id(v.sourceSongId)&&id(v.sourceAudioId)&&Number.isFinite(v.fade)&&v.fade>=0&&v.fade<=2&&(v.fadeOut===undefined||Number.isFinite(v.fadeOut)&&v.fadeOut>=0&&v.fadeOut<=360)&&Array.isArray(v.clips)&&v.clips.length>0&&v.clips.length<=48&&v.clips.every(c=>c&&id(c.songId)&&id(c.audioId)&&Number.isFinite(c.from)&&Number.isFinite(c.to)&&c.from>=0&&c.to>c.from&&c.to<=7200);}
export function editSongSection(sourceId:string,duration:number,action:"remove"|"replace"|"insert"|"trim",start:number,end:number,replacement?:AssemblyClip):AssemblyClip[]{
 if(!sourceId||!Number.isFinite(duration)||duration<=0||duration>600.1||!Number.isFinite(start)||start<0||start>duration||action!=="insert"&&(!Number.isFinite(end)||end<start||end>duration||end<=start))throw new Error("Choose a valid section inside the song.");
 if(action==="trim")return[{id:sourceId,from:start,to:end}];
 if(action!=="remove"&&(!replacement||!Number.isFinite(replacement.from)||!Number.isFinite(replacement.to)||replacement.from<0||replacement.to<=replacement.from))throw new Error("Choose the replacement audio and its excerpt.");
 const clips:AssemblyClip[]=[];if(start>0)clips.push({id:sourceId,from:0,to:start});if(action!=="remove")clips.push(replacement!);const after=action==="insert"?start:end;if(after<duration)clips.push({id:sourceId,from:after,to:duration});if(!clips.length)throw new Error("Keep at least one audible section.");return clips;
}
