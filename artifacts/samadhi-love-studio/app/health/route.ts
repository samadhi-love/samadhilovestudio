import { serverStorage } from "../server/storage";
import { storageHealth } from "../server/health";
export const dynamic="force-dynamic";
export async function GET() {
  const result=await storageHealth(serverStorage);
  return Response.json(result,{status:result.status==="ok"?200:503,headers:{"Cache-Control":"no-store"}});
}
