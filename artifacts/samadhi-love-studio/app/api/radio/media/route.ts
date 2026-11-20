import { traced } from "../../../server/request-context";
import{studioAccess}from"../../../studio-access";
import{serveAudio}from"../../studio/audio-response";
import{privateHeaders}from"../../studio/store";
import{updateRadio,validRadioSource,RadioError}from"../../../live-radio/store";
export const dynamic="force-dynamic";
async function GETHandler(request:Request){try{const access=await studioAccess();if(!access.id)return Response.json({error:"Sign in to listen."},{status:401,headers:privateHeaders});const id=new URL(request.url).searchParams.get("id"),state=await updateRadio(()=>{}),item=state.submissions.find(s=>s.id===id);
 const onAir=state.live&&state.current?.id===id&&item?.status==="playing";
 if(!item||(!onAir&&access.role!=="owner")||!await validRadioSource(item))return Response.json({error:"This recording is not available for shared playback."},{status:404,headers:privateHeaders});
 return serveAudio(request,item.owner,item.audioId,item.format);
}catch(e){return Response.json({error:"Station audio is temporarily unavailable."},{status:e instanceof RadioError?e.status:503,headers:privateHeaders});}}
export const GET=traced(GETHandler);
