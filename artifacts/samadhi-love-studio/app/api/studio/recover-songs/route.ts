import {privateWorkspace} from "../../../studio-access";
import {recoverPaidSongs} from "../../../server/song-recovery";
import {readStudio,privateHeaders} from "../store";
import {recoverableRoute} from "../request-errors";
export const POST=recoverableRoute(async(request:Request)=>{
  const access=await privateWorkspace();
  if(!access)return Response.json({error:"Sign in to recover your songs."},{status:401,headers:privateHeaders});
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Open Studio directly to recover songs."},{status:403,headers:privateHeaders});
  if(request.headers.get("X-Studio-Workspace")&&request.headers.get("X-Studio-Workspace")!==access.id)return Response.json({error:"Your account changed. Reload Studio."},{status:409,headers:privateHeaders});
  const recovery=await recoverPaidSongs(access.id);
  return Response.json({...await readStudio(access.id),workspace:access.id,recovery},{headers:privateHeaders});
},"Recovery could not finish. Your recordings remain in private storage. Try again.");
