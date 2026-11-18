import type {AssemblyClip} from "./audio-assembly";
import {editSongSection} from "./song-section-data";

export type RegionOperation="remove"|"replace"|"insert"|"trim"|"move"|"paste"|"fade";
/** Builds a non-destructive recipe; positions refer to the original waveform. */
export function regionEditClips(input:{
  sourceId:string;seconds:number;action:RegionOperation;start:number;end:number;
  replacement?:AssemblyClip;at?:number;clipboard?:AssemblyClip;
}):AssemblyClip[]{
  const {sourceId,seconds,action,start,end,replacement,clipboard}=input;
  if(!sourceId||!Number.isFinite(seconds)||seconds<=0||seconds>600.1)
    throw new Error("Wait for the song to load before editing.");
  if(action==="fade")return [{id:sourceId,from:0,to:seconds}];
  if(action==="paste"){
    if(!clipboard)throw new Error("Copy a section before pasting it.");
    const at=input.at??start;
    return editSongSection(sourceId,seconds,"insert",at,at,clipboard);
  }
  if(action!=="move")return editSongSection(sourceId,seconds,action,start,end,replacement);
  // Validate the selected range with the existing trim implementation.
  const selection=editSongSection(sourceId,seconds,"trim",start,end)[0];
  const at=input.at??NaN;
  if(!Number.isFinite(at)||at<0||at>seconds||at>=start&&at<=end)
    throw new Error("Choose a move destination outside the selected section.");
  const clip=(from:number,to:number):AssemblyClip=>({id:sourceId,from,to});
  return (at<start
    ?[clip(0,at),selection,clip(at,start),clip(end,seconds)]
    :[clip(0,start),clip(end,at),selection,clip(at,seconds)]
  ).filter(clip=>clip.to>clip.from);
}

/** Last samples reach silence; this changes gain, never encoded duration. */
export function songEndFadeGain(time:number,seconds:number,fadeOut=0){
  if(!fadeOut)return 1;
  return Math.max(0,Math.min(1,(seconds-time)/fadeOut));
}
