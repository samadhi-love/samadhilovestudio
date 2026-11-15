import {env}from"cloudflare:workers";
import {readStudio}from"../api/studio/store";
import {creatorAccount}from"../creator-accounts";
import {eligibleSong}from"../community/store";
import {emptyRadio,advanceRadio,pruneRadio,type RadioState,type RadioSubmission}from"./data";
const key="shared-radio/v1/station";
export class RadioError extends Error{constructor(message:string,public status=400){super(message);}}
export async function validRadioSource(item:RadioSubmission){
 if(item.role==="creator"){const creator=await creatorAccount(item.owner);if(!creator||creator.suspended)return false;}
 const {data}=await readStudio(item.owner),song=data?.songs.find(s=>s.id===item.songId);
 return eligibleSong(song)&&(song.audioId??song.id)===item.audioId;
}
export async function loadRadio(){if(!env.BUCKET)throw new RadioError("Shared station storage is unavailable.",503);const file=await env.BUCKET.get(key);return{state:file?await file.json<RadioState>():emptyRadio(),etag:file?.etag};}
/** A single CAS document atomically orders submissions, enforces cooldowns, and advances the programme. */
export async function updateRadio(mutate:(state:RadioState,now:number)=>Promise<void>|void){
 for(let attempt=0;attempt<5;attempt++){const{state,etag}=await loadRadio(),before=JSON.stringify(state),now=Date.now();
  const checks=new Map<string,Promise<boolean>>();const valid=(item:RadioSubmission)=>{const token=item.owner+":"+item.songId+":"+item.audioId;let result=checks.get(token);if(!result){result=validRadioSource(item);checks.set(token,result);}return result;};
  if(state.version!==1)throw new RadioError("This station version needs an update.",503);
  // Validate the current/next candidates before allowing their media to be shared.
  if(state.current){const current=state.submissions.find(s=>s.id===state.current!.id);if(current&&!(await valid(current))){current.status="withdrawn";current.reviewNote="Recording changed, removed, or creator access changed.";state.current=null;}}
  // Apply elapsed programme time before commands: stopping an expired song must not replay it.
  advanceRadio(state,now);
  await mutate(state,now);pruneRadio(state,now);
  if(state.live){for(let i=0;i<101;i++){advanceRadio(state,now);if(!state.current)break;const current=state.submissions.find(s=>s.id===state.current!.id)!;if(await valid(current))break;current.status="withdrawn";current.reviewNote="Recording unavailable at playback.";state.current=null;}}
  if(JSON.stringify(state)===before)return state;
  state.revision++;const content=JSON.stringify(state);if(new TextEncoder().encode(content).length>1_000_000)throw new RadioError("The station queue is at capacity. Try later.",409);
  const saved=await env.BUCKET!.put(key,content,{onlyIf:etag?{etagMatches:etag}:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"application/json"}});if(saved)return state;
 }
 throw new RadioError("The queue changed while saving. Refresh and retry; no second submission was accepted.",409);
}
