import {privateWorkspace} from "../../../../studio-access";
import {privateHeaders} from "../../store";
import {diagnoseProviderConnectivity} from "../../../../server/ai-provider";
import { traced } from "../../../../server/request-context";
export const dynamic="force-dynamic";
async function POSTHandler(request:Request){
  const access=await privateWorkspace();
  if(access?.role!=="owner")return Response.json({error:"Only the verified owner can run this connection diagnostic."},{status:403,headers:privateHeaders});
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Open Studio directly to run the connection diagnostic."},{status:403,headers:privateHeaders});
  const requestId=crypto.randomUUID();
  const result=await diagnoseProviderConnectivity(requestId);
  return Response.json(result,{headers:{...privateHeaders,"X-Studio-Request-Id":requestId}});
}
export const POST=traced(POSTHandler);
