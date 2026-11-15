import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { creatorAccounts } from "../../../../db/schema";
import { studioAccess } from "../../../studio-access";
import { privateHeaders } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";

export const dynamic = "force-dynamic";

async function updateAccount(request: Request) {
  const reply = (error: string, status: number) => Response.json({ error }, { status, headers: privateHeaders });
  if ((await studioAccess()).role !== "owner") return reply("Owner access is required.", 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply("Open the Studio directly to manage accounts.", 403);
  const raw = await readBoundedText(request, 4096);
  if (raw.length > 1024) return reply("Invalid account settings.", 400);
  let input;
  try { input = JSON.parse(raw); } catch { return reply("Invalid account settings.", 400); }
  if (typeof input?.id !== "string" || typeof input?.suspended !== "boolean" || !Number.isInteger(input?.limit) || input.limit < 0 || input.limit > 100)
    return reply("Choose a daily limit between 0 and 100.", 400);
  const rows = await getDb().update(creatorAccounts).set({ suspended: input.suspended, limit: input.limit })
    .where(eq(creatorAccounts.id, input.id)).returning({ id: creatorAccounts.id });
  return rows.length ? Response.json({ saved: true }, { headers: privateHeaders }) : reply("Creator account unavailable.", 404);
}
export const PATCH = recoverableRoute(updateAccount, "Account settings could not save. Reload the current settings and retry.");
