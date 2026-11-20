import { serverStorage } from "../server/storage";
import { storageHealth } from "../server/health";
export const dynamic="force-dynamic";
/** Build stamp (commit + build time); "dev" in preview. Never includes secrets. */
function version(){try{return JSON.parse(import.meta.env.VITE_STUDIO_VERSION??"") as {commit:string;builtAt:string};}catch{return {commit:"dev",builtAt:""};}}
export async function GET() {
  const result=await storageHealth(serverStorage);
  return Response.json({...result,version:version()},{status:result.status==="ok"?200:503,headers:{"Cache-Control":"no-store"}});
}
