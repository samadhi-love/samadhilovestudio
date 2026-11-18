import {privateWorkspace} from "../../../studio-access";
import {privateHeaders} from "../store";
import {readBoundedText} from "../request-errors";
import {musicEngineStatus,saveMusicEngine} from "../../../server/music-engine";
export const dynamic="force-dynamic";
export async function GET(){
  const access=await privateWorkspace();
  if(!access)return Response.json({error:"Sign in to your studio."},{status:401,headers:privateHeaders});
  try{return Response.json(await musicEngineStatus(access),{headers:privateHeaders});}
  catch{return Response.json({error:"Music settings could not be read. Try again."},{status:503,headers:privateHeaders});}
}
export async function PUT(request:Request){
  const access=await privateWorkspace();
  if(!access||access.role!=="owner")return Response.json({error:"This engine setting is owner-only."},{status:403,headers:privateHeaders});
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Open Settings directly."},{status:403,headers:privateHeaders});
  try{
    const input=JSON.parse(await readBoundedText(request,1024));
    if(input.engine!=="ace-step"&&input.engine!=="elevenlabs")return Response.json({error:"Choose a supported engine."},{status:400,headers:privateHeaders});
    await saveMusicEngine(access.id,input.engine);
    return Response.json(await musicEngineStatus(access),{headers:privateHeaders});
  }catch{return Response.json({error:"The engine choice was not saved. Try again."},{status:503,headers:privateHeaders});}
}
