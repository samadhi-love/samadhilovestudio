import { acceptMembership } from "../../../billing/service";
import { membershipNoticeVersion } from "../../../billing/config";
import { plans, type Plan } from "../../../credits/data";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { creatorAccounts } from "../../../../db/schema";
import { cleanWordsMessage, hasExplicitWords } from "../../../clean-content";
import { creatorBetaEnabled } from "../../../creator-accounts";
import { studioAccess } from "../../../studio-access";
import { privateHeaders } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";

export const dynamic = "force-dynamic";

async function registerAccount(request: Request) {
  const reply = (error: string, status: number) => Response.json({ error }, { status, headers: privateHeaders });
  if (!creatorBetaEnabled()) return reply("Creator registration is closed.", 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply("Open the Studio directly to register.", 403);
  const access = await studioAccess();
  if (access.role !== "subscriber") return reply("Sign in to register a creator account.", 401);
  const raw = await readBoundedText(request, 4096);
  if (raw.length > 1024) return reply("Use a display name up to 60 characters.", 400);
  let body;
  try { body = JSON.parse(raw); } catch { return reply("Enter a display name.", 400); }
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) return reply("Use a display name up to 60 characters.", 400);
  if (hasExplicitWords(name)) return reply(cleanWordsMessage, 422);

  if (body?.membershipAcknowledged !== true || body?.adult !== true || body?.noticeVersion !== membershipNoticeVersion)
    return reply("Review the membership notice and confirm you are at least 18 before creating a workspace.", 400);
  const selectedPlan: Plan = typeof body?.plan === "string" && Object.hasOwn(plans, body.plan) ? body.plan : "free";
  const db = getDb();
  await db.insert(creatorAccounts).values({ id: access.id, displayName: name, createdAt: new Date().toISOString() }).onConflictDoNothing();
  const account = await db.select().from(creatorAccounts).where(eq(creatorAccounts.id, access.id)).get();
  if (!account || account.suspended) return reply("This creator account is currently suspended.", 403);
  await acceptMembership(access.id, selectedPlan);
  return Response.json({ registered: true, paid: false }, { headers: privateHeaders });
}
export const POST = recoverableRoute(registerAccount, "Registration could not finish. Reload to check your account before retrying.");
