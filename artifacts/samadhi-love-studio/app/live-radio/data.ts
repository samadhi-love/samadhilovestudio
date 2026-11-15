import type {AudioFormat,Song} from "../studio-data";
import type {RightsReview} from "../rights-data";
export const radioDayMs=86_400_000;
export type RadioSubmission={id:string;sequence:number;owner:string;role:"owner"|"creator";songId:string;audioId:string;format:AudioFormat;title:string;artist:string;duration:number;submittedAt:number;status:"pending"|"approved"|"playing"|"played"|"rejected"|"withdrawn";grant:string;rights:RightsReview;approvedAt?:number;reviewNote?:string;reviewedBy?:string};
export type RadioState={version:1;revision:number;nextSequence:number;live:boolean;accepting:boolean;current:{id:string;start:number;end:number}|null;submissions:RadioSubmission[];cooldowns:{owner:string;at:number}[];reports:{id:string;owner:string;reason:string;at:number}[];launchReviewedAt?:number};
export const emptyRadio=():RadioState=>({version:1,revision:0,nextSequence:1,live:false,accepting:true,current:null,submissions:[],cooldowns:[],reports:[]});
export function advanceRadio(state:RadioState,now:number){
 if(!state.live)return;
 let cursor=now;
 if(state.current){const current=state.submissions.find(s=>s.id===state.current!.id);if(current?.status==="playing"&&state.current.end>now)return;cursor=state.current.end;if(current?.status==="playing")current.status="played";state.current=null;}
 for(;;){const next=state.submissions.filter(s=>s.status==="approved").sort((a,b)=>a.sequence-b.sequence)[0];if(!next)return;const start=Math.max(cursor,next.approvedAt??now),end=start+next.duration*1000;next.status=end<=now?"played":"playing";if(end>now){state.current={id:next.id,start,end};return;}cursor=end;}
}
export function pruneRadio(state:RadioState,now:number){state.cooldowns=state.cooldowns.filter(c=>now-c.at<radioDayMs);const completed=state.submissions.filter(s=>["played","rejected","withdrawn"].includes(s.status)).sort((a,b)=>b.sequence-a.sequence).slice(0,100);state.submissions=[...state.submissions.filter(s=>["pending","approved","playing"].includes(s.status)),...completed].sort((a,b)=>a.sequence-b.sequence);state.reports=state.reports.slice(-100);}
export function nextSubmissionAt(state:RadioState,owner:string){return(state.cooldowns.find(c=>c.owner===owner)?.at??-radioDayMs)+radioDayMs;}
export type PublicRadioItem=Pick<RadioSubmission,"id"|"title"|"artist"|"duration"|"submittedAt"|"status"|"sequence"> & {mine:boolean};
export type RadioView={serverNow:number;revision:number;live:boolean;accepting:boolean;moderator:boolean;canSubmit:boolean;nextSubmissionAt:number;current:(PublicRadioItem&{start:number;end:number})|null;queue:PublicRadioItem[];mine:PublicRadioItem[];review?:RadioSubmission[];reports?:RadioState["reports"];songs:Pick<Song,"id"|"name"|"audioId">[]};
export function publicRadio(state:RadioState,viewer:string,moderator:boolean,canSubmit:boolean,now:number,songs:RadioView["songs"]):RadioView{
 const item=(s:RadioSubmission):PublicRadioItem=>({id:s.id,title:s.title,artist:s.artist,duration:s.duration,submittedAt:s.submittedAt,status:s.status,sequence:s.sequence,mine:s.owner===viewer});
 const current=state.current&&state.submissions.find(s=>s.id===state.current!.id&&s.status==="playing");
 return{serverNow:now,revision:state.revision,live:state.live,accepting:state.accepting,moderator,canSubmit,nextSubmissionAt:Math.max(now,nextSubmissionAt(state,viewer)),current:current?{...item(current),start:state.current!.start,end:state.current!.end}:null,queue:state.submissions.filter(s=>s.status==="approved").sort((a,b)=>a.sequence-b.sequence).map(item),mine:state.submissions.filter(s=>s.owner===viewer).map(item),...(moderator?{review:state.submissions.filter(s=>["pending","approved","playing"].includes(s.status)),reports:state.reports}:{}),songs};
}
