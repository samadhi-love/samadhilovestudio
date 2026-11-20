import{serverStorage as env}from"../../server/storage";
import{studioAccess,privateWorkspace}from"../../studio-access";
import{readStudio,privateHeaders}from"../studio/store";
import{eligibleSong}from"../../community/store";
import{hasExplicitWords}from"../../clean-content";
import{validRightsReview,type RightsReview}from"../../rights-data";
import{updateRadio,validRadioSource,RadioError}from"../../live-radio/store";
import{advanceRadio,nextSubmissionAt,publicRadio,type RadioState}from"../../live-radio/data";
export const dynamic="force-dynamic";
const problem=(error:string,status:number)=>Response.json({error},{status,headers:privateHeaders});
async function handle(request:Request){const access=await studioAccess();if(!access.id)return problem("Sign in to listen or submit to the shared station.",401);const workspace=await privateWorkspace(),moderator=access.role==="owner";const now=Date.now();
 let songs:ReturnType<typeof publicRadio>["songs"]=[];if(workspace){const{data}=await readStudio(workspace.id);songs=(data?.songs??[]).filter(eligibleSong).map(s=>({id:s.id,name:s.name,audioId:s.audioId}));}
 if(request.method==="GET"){const state=await updateRadio(()=>{});return Response.json(publicRadio(state,access.id,moderator,!!workspace,Date.now(),songs),{headers:privateHeaders});}
 if(request.headers.get("origin")!==new URL(request.url).origin)return problem("Open the station directly to change the queue.",403);
 const raw=await request.text();if(raw.length>6000)return problem("Keep the submission and review notes short.",413);let input:Record<string,unknown>;try{input=JSON.parse(raw);}catch{return problem("Invalid radio request.",400);}if(!input||typeof input!=="object")return problem("Invalid radio request.",400);
 const action=input.action;
 const state=await updateRadio(async(state,time)=>{
  if(action==="submit"){
   if(!workspace)throw new RadioError("An active creator workspace is required to submit your own saved music.",403);
   if(!state.accepting)throw new RadioError("Radio submissions are currently closed.",409);
   if(nextSubmissionAt(state,workspace.id)>time)throw new RadioError("One song per account every rolling 24 hours. Rejection or withdrawal does not reset the limit.",429);
   if(state.submissions.filter(s=>["pending","approved","playing"].includes(s.status)).length>=100)throw new RadioError("The station queue is full. Try later.",409);
   if(input.grant!==true||typeof input.artist!=="string"||!input.artist.trim()||input.artist.length>60||hasExplicitWords(input.artist)||typeof input.permissionNotes!=="string"||input.permissionNotes.trim().length<10||input.permissionNotes.length>1500||hasExplicitWords(input.permissionNotes))throw new RadioError("Confirm streaming permission and provide your artist name and rights reference notes.");
   const{data}=await readStudio(workspace.id),song=data?.songs.find(s=>s.id===input.songId);if(!eligibleSong(song)||(song.audioId??song.id)!==input.audioId)throw new RadioError("Choose a current clean recording from your own Song Library.",409);
   const file=await env.BUCKET!.get(`rights/v1/${encodeURIComponent(workspace.id)}/${song.id}/${song.audioId??song.id}/review`),review=file?await file.json<RightsReview>():null;
   if(!validRightsReview(review)||[review.recording,review.composition,review.voices].includes("unknown"))throw new RadioError("Save the recording, composition and voice-permission review in Release Tools before submitting.",409);
   const duration=Number(input.duration);if(!Number.isFinite(duration)||duration<.5||duration>600)throw new RadioError("Radio submissions must be between half a second and ten minutes.");
   state.submissions.push({id:crypto.randomUUID(),sequence:state.nextSequence++,owner:workspace.id,role:workspace.role,songId:song.id,audioId:song.audioId??song.id,format:song.audioFormat,title:song.name,artist:input.artist.trim(),duration,submittedAt:time,status:"pending",grant:input.permissionNotes.trim(),rights:review});state.cooldowns=state.cooldowns.filter(c=>c.owner!==workspace.id);state.cooldowns.push({owner:workspace.id,at:time});return;
  }
  const item=state.submissions.find(s=>s.id===input.id);
  if(action==="withdraw"){if(!item||item.owner!==access.id)throw new RadioError("Choose your own submission.",403);if(!["pending","approved","playing"].includes(item.status))throw new RadioError("This submission is already completed.",409);item.status="withdrawn";if(state.current?.id===item.id)state.current=null;return;}
  if(action==="report"){if(!item||typeof input.reason!=="string"||input.reason.trim().length<10||input.reason.length>1500)throw new RadioError("Describe the rights or content concern in 10–1500 characters.");if(state.reports.some(r=>r.owner===access.id&&r.id===item.id&&time-r.at<86400000))throw new RadioError("Your report is already with the station owner.",409);state.reports.push({id:item.id,owner:access.id,reason:input.reason.trim(),at:time});return;}
  if(!moderator)throw new RadioError("Only the station owner can review or operate the station.",403);
  if(input.revision!==state.revision)throw new RadioError("The station changed. Refresh before reviewing or operating it.",409);
  if(action==="approve"){
   if(!item||item.status!=="pending"||input.reviewed!==true||typeof input.reviewNote!=="string"||input.reviewNote.trim().length<10||input.reviewNote.length>1500)throw new RadioError("Listen and document the permission review before approving.");if(!await validRadioSource(item))throw new RadioError("The submitted recording changed or is no longer available.",409);
   const duration=Number(input.duration);if(!Number.isFinite(duration)||duration<.5||duration>600)throw new RadioError("Verify the recording duration before approving.");item.duration=duration;item.status="approved";item.approvedAt=time;item.reviewNote=input.reviewNote.trim();item.reviewedBy=access.id;return;
  }
  if(action==="reject"){if(!item||!['pending','approved','playing'].includes(item.status)||typeof input.reviewNote!=="string"||input.reviewNote.trim().length<10||input.reviewNote.length>1500)throw new RadioError("Choose a pending/queued recording and explain its removal.");item.status="rejected";item.reviewNote=input.reviewNote.trim();item.reviewedBy=access.id;if(state.current?.id===item.id)state.current=null;return;}
  if(action==="start"){if(input.launchReviewed!==true)throw new RadioError("Confirm station permissions and applicable streaming requirements before launch.");state.live=true;state.launchReviewedAt=time;advanceRadio(state,time);return;}
  if(action==="stop"){state.live=false;if(state.current){const playing=state.submissions.find(s=>s.id===state.current!.id);if(playing?.status==="playing")playing.status="approved";state.current=null;}return;}
  if(action==="accepting"){state.accepting=input.value===true;return;}
  throw new RadioError("Unknown radio action.");
 });
 return Response.json(publicRadio(state,access.id,moderator,!!workspace,Date.now(),songs),{headers:privateHeaders});
}
async function route(request:Request){try{return await handle(request);}catch(e){return problem(e instanceof RadioError?e.message:"The station could not update. Try again.",e instanceof RadioError?e.status:503);}}
export const GET=route;export const POST=route;
