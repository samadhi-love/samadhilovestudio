import { serverStorage as env } from "../../../server/storage";
import { ownerSetup } from "../../../studio-access";
import { traced } from "../../../server/request-context";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
async function POSTHandler(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Open Studio directly to claim your workspace." }, { status: 403, headers });
  const setup = await ownerSetup();
  if (!setup || setup.blocked) return Response.json({ error: "Only the verified account matching STUDIO_OWNER_EMAIL can claim this workspace." }, { status: 403, headers });
  if (setup.claimed) return Response.json({ claimed: true }, { headers });
  if (!env.BUCKET) return Response.json({ error: "Private storage must be connected first." }, { status: 503, headers });
  const result = await env.BUCKET.put("private/setup/owner-claim-v1.json",
    JSON.stringify({ userId: setup.userId, claimedAt: new Date().toISOString() }),
    { onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: "application/json" } });
  return Response.json(result ? { claimed: true } : { error: "Owner setup changed in another tab. Reload this page." },
    { status: result ? 200 : 409, headers });
}
export const POST=traced(POSTHandler);
