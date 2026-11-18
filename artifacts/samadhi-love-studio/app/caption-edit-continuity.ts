import {assemblyDuration,planAudioAssembly} from "./audio-assembly";
import type {SectionEditPlan} from "./song-section-data";
import type {LyricCue,LyricProject} from "./lyric-video-data";
import {hasExplicitWords} from "./clean-content";

/** Use the renderer's actual overlap plan, not a sum of excerpt lengths. */
export function carryEditedCaptions(project:LyricProject,edit:SectionEditPlan,songId:string,audioId:string):LyricProject {
  const p=project.pro;
  if(!p||p.sourceAudioId!==edit.sourceAudioId)return project;
  const clips=planAudioAssembly(edit.clips.map((c,i)=>({id:String(i),from:c.from,to:c.to})),edit.fade);
  const duration=assemblyDuration(clips);
  const original=(i:number)=>edit.clips[i].audioId===edit.sourceAudioId&&edit.clips[i].songId===edit.sourceSongId;
  const first=edit.clips[0],last=edit.clips.at(-1)!;
  const before=original(0)&&first.from===0?first.to:0;
  const after=original(clips.length-1)&&Math.abs(last.to-p.duration)<.02?last.from:p.duration;
  const changedStart=Math.max(0,before-(clips[0]?.fadeOut??0));
  const tail=clips.at(-1)!;
  const changedEnd=Math.min(duration,original(clips.length-1)&&after<p.duration?tail.start+tail.fadeIn:duration);
  const window={start:changedStart,end:Math.max(changedStart+.001,changedEnd)};
  const inserted=edit.clips.some((_,i)=>!original(i));
  const cues:LyricCue[]=[];
  for(let i=0;i<project.cues.length;i++){
    const cue=project.cues[i],end=cue.end??project.cues[i+1]?.time??p.duration;
    const j=edit.clips.findIndex((c,k)=>original(k)&&cue.time>=c.from&&end<=c.to);
    if(j>=0){
      const shift=clips[j].start-edit.clips[j].from;
      const time=Math.max(0,cue.time+shift),stop=Math.min(duration,end+shift);
      if(time>=stop)continue;
      const review=time<window.end&&stop>window.start;
      cues.push({...cue,time,end:stop,words:review?undefined:cue.words?.map(w=>({...w,time:w.time+shift})),needsReview:review||cue.needsReview||undefined});
    }else if(cue.time<after&&end>before&&(inserted||cue.time<before||end>after)){
      const time=Math.min(duration-.001,window.start),stop=Math.min(duration,window.end);
      cues.push({...cue,time,end:stop,words:undefined,needsReview:true});
    }
    // Removed-only ranges intentionally have no corresponding caption.
  }
  const review=cues.filter(c=>c.needsReview);
  // Keep unresolved earlier edits in the review window rather than silently
  // treating their approximate timing as precise after a second edit.
  for(const cue of review){window.start=Math.min(window.start,cue.time);window.end=Math.min(duration,Math.max(window.end,cue.end??cue.time));}
  review.forEach((cue,i)=>{cue.time=window.start+(window.end-window.start)*i/review.length;cue.end=window.start+(window.end-window.start)*(i+1)/review.length;});
  const unchanged=clips.length===1&&first.from===0&&first.to===p.duration;
  return {...project,cues:cues.sort((a,b)=>a.time-b.time),pro:{...p,
    sourceSongId:songId,sourceAudioId:audioId,duration,range:{start:0,end:duration},sections:[],
    analysisAsset:undefined,vocalAsset:undefined,soundtrackAsset:undefined,reactiveStem:undefined,
    beatGrid:undefined,energy:undefined,waveform:undefined,accents:undefined,
    useEnhancedAnalysis:false,useEnhancedSoundtrack:false,soundtrackConfirmed:undefined,
    captionEdit:unchanged?undefined:window,updatedAt:new Date().toISOString(),
    alignment:{engine:"Audio edit carry-over",at:new Date().toISOString(),audioId,reviewed:false,
      warnings:unchanged?[]:["Captions in the changed part need review."]}}};
}

export function mergeWindowCaptions(cues:LyricCue[],replacement:LyricCue[],window:{start:number;end:number}){
  return [...cues.filter(c=>(c.end??c.time)<=window.start||c.time>=window.end),
    ...replacement.filter(c=>c.time<window.end&&(c.end??window.end)>window.start).map(c=>({...c,time:Math.max(window.start,c.time),end:Math.min(window.end,c.end??window.end),needsReview:undefined}))]
    .sort((a,b)=>a.time-b.time);
}

export function clipCaptionTimes(cues:LyricCue[],duration:number){
  const words=cues.flatMap(c=>c.words??[]);
  if(cues.filter(c=>c.time>=duration||(c.end??c.time)<=0).length>cues.length/2||
    words.length>0&&words.filter(w=>w.time>=duration||w.time<0).length>words.length/2)
    throw new Error("Most caption lines fall outside this recording. Check the selected audio.");
  let clippedLines=0;
  const result=cues.flatMap(c=>{
    if(c.time>=duration||(c.end??c.time)<=0){clippedLines++;return [];}
    const words=c.words?.filter(w=>w.time<duration).map(w=>({...w,time:Math.max(0,w.time)}));
    if(c.time<0||(c.end??0)>duration||words?.length!==c.words?.length)clippedLines++;
    return [{...c,time:Math.max(0,c.time),end:c.end===undefined?undefined:Math.min(duration,c.end),words}];
  });
  return {cues:result,clippedLines};
}

export function changedCaptionProblem(next:LyricProject,previous?:LyricProject){
  // Cues have no stable IDs. Match unchanged field values as a multiset so
  // inserting/reordering a clean line doesn't re-flag an untouched old line.
  for(const field of ["text","translation","transliteration"] as const){
    const remaining=new Map<string|undefined,number>();
    for(const cue of previous?.cues??[])remaining.set(cue[field],(remaining.get(cue[field])??0)+1);
    for(let i=0;i<next.cues.length;i++){
      const value=next.cues[i][field],count=remaining.get(value)??0;
      if(count){remaining.set(value,count-1);continue;}
      if(hasExplicitWords(value))return {error:`Line ${i+1}: please use clean words in the ${field}.`,line:i+1,field};
    }
  }
  return null;
}
