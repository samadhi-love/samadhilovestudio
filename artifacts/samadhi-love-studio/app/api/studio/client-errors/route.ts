import {privateWorkspace} from "../../../studio-access";
import {validateDiagnostic} from "../../../crash-diagnostics";
import {readBoundedText,RequestBodyError} from "../request-errors";
import { logEvent, traced } from "../../../server/request-context";
const recent=new Map<string,{start:number;count:number}>();
const headers={"Cache-Control":"private, no-store"};
async function POSTHandler(request:Request) {
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Open Studio directly."},{status:403,headers});
  const access=await privateWorkspace();
  if(!access)return Response.json({error:"Sign in to report a Studio error."},{status:401,headers});
  if(!request.headers.get("content-type")?.startsWith("application/json"))return Response.json({error:"Use a JSON diagnostic report."},{status:415,headers});
  const now=Date.now(),previous=recent.get(access.id);
  if(previous&&now-previous.start<60000&&previous.count>=20)return Response.json({error:"Too many reports. Please wait a moment."},{status:429,headers});
  let value;
  try{value=validateDiagnostic(JSON.parse(await readBoundedText(request,2048)));}
  catch(error){return Response.json({error:"The diagnostic report could not be read."},{status:error instanceof RequestBodyError?error.status:400,headers});}
  if(!value)return Response.json({error:"The diagnostic report is invalid."},{status:400,headers});
  if(recent.size>=1000){for(const[key,row]of recent)if(now-row.start>=60000)recent.delete(key);}
  if(recent.size>=1000&&!recent.has(access.id))return Response.json({error:"Please try again later."},{status:429,headers});
  recent.set(access.id,previous&&now-previous.start<60000?{...previous,count:previous.count+1}:{start:now,count:1});
  // Only validated, private-safe fields reach the log and the owner's history.
  logEvent("client.crash",Object.fromEntries(Object.entries(value).filter(([,v])=>["string","number","boolean"].includes(typeof v)).map(([k,v])=>[k==="requestId"?"reportId":k,v as string|number|boolean])),"error");
  return Response.json({requestId:value.requestId},{status:202,headers:{...headers,"X-Studio-Request-Id":String(value.requestId)}});
}
export const POST=traced(POSTHandler);
