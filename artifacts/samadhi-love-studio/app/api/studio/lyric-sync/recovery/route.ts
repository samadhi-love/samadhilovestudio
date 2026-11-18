import {privateWorkspace} from "../../../../studio-access";
import {readStudio,privateHeaders} from "../../store";
import {readCaptionRecovery} from "../../../../server/caption-recovery";
import {recoverableRoute} from "../../request-errors";
export const dynamic="force-dynamic";
export const GET=recoverableRoute(async(request:Request)=>{
  const access=await privateWorkspace();
  if(!access)return Response.json({error:"Sign in to restore your captions."},{status:401,headers:privateHeaders});
  const query=new URL(request.url).searchParams,songId=query.get("song")??"",audio=query.get("audio")??"";
  const {data}=await readStudio(access.id),song=data?.songs.find(s=>s.id===songId&&!s.deletedAt);
  if(!song||!(/^[\w-]{1,100}$/).test(audio)||audio!==(song.audioId??song.id)&&!song.audioHistory?.some(a=>a.audioId===audio))
    return Response.json({error:"Choose a recording from your songs."},{status:404,headers:privateHeaders});
  return Response.json({recovery:await readCaptionRecovery(access.id,songId,audio)},{headers:privateHeaders});
},"Your caption recovery could not load. Your saved project is unchanged.");
