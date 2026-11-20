import { studioAccess } from "../../../../studio-access";
import { privateHeaders } from "../../store";
import { readBoundedText, recoverableRoute } from "../../request-errors";
import { ownerStatus } from "../../../../server/owner-status";
import { setUpEventHistory } from "../../../../server/event-store";
import { ownerAction } from "../../../../server/request-context";

export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: privateHeaders });

/** Owner-only, read-only summary of how the app is doing. */
async function status() {
  if ((await studioAccess()).role !== "owner") return reply({ error: "Owner access is required." }, 403);
  return reply(await ownerStatus());
}

/** Owner-approved one-time setup of the 30-day event history table (additive, safe to repeat). */
async function setup(request: Request) {
  const owner = await studioAccess();
  if (owner.role !== "owner") return reply({ error: "Owner access is required." }, 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Open the Status page directly." }, 403);
  let input: { action?: unknown } | null = null;
  try { input = JSON.parse(await readBoundedText(request, 256)); } catch { /* checked below */ }
  if (input?.action !== "setup-history") return reply({ error: "Choose a supported action." }, 400);
  await setUpEventHistory();
  ownerAction("event-history.setup", owner.id ?? "owner");
  return reply({ ready: true });
}
export const GET = recoverableRoute(status, "Status could not load. Try again in a moment.");
export const POST = recoverableRoute(setup, "History could not be set up. Nothing was changed; try again.");
