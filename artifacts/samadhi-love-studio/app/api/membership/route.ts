import { privateWorkspace } from "../../studio-access";
import { creatorAccount } from "../../creator-accounts";
import { creditQuery, creditsData, CreditError } from "../../credits/account-ledger";
import { plans, type Plan } from "../../credits/data";
import { acceptMembership, billingAccount } from "../../billing/service";
import { billingReady, membershipNoticeVersion, paymentMode } from "../../billing/config";
import { privateHeaders } from "../studio/store";
import { readBoundedText, recoverableRoute } from "../studio/request-errors";
export const dynamic = "force-dynamic";
async function get(request: Request) {
  const access = await privateWorkspace();
  if (!access) return Response.json({ error: "Sign in and create your private member workspace." }, { status: 401, headers: privateHeaders });
  if (new URL(request.url).searchParams.has("reviews")) {
    if (access.role !== "owner") return Response.json({ error: "Owner access is required." }, { status: 403, headers: privateHeaders });
    const rows = await creditQuery("select b.owner as id,coalesce(c.display_name,'Studio owner') as name from billing_accounts b left join creator_accounts c on c.id=b.owner where b.blocked=1 limit 100").all();
    return Response.json({ reviews: rows.results }, { headers: privateHeaders });
  }
  const [profile, usage, creator] = await Promise.all([billingAccount(access.id), creditsData(access.id, access.role === "owner"), access.role === "creator" ? creatorAccount(access.id) : null]);
  return Response.json({ workspace: access.id, name: creator?.displayName ?? "Studio owner", studio: access.role === "owner" ? "/owner" : "/creator", usage,
    billing: { ready: billingReady() && (paymentMode() === "live" || access.role === "owner"), mode: paymentMode(), hasCustomer: !!profile.customer, status: profile.blocked ? "review" : profile.status, selectedPlan: profile.selected_plan, cancelAtEnd: !!profile.cancel_at_end, periodEnd: profile.period_end },
    noticeAccepted: profile.notice_version === membershipNoticeVersion, noticeVersion: membershipNoticeVersion }, { headers: privateHeaders });
}
async function post(request: Request) {
  const access = await privateWorkspace();
  if (!access) return Response.json({ error: "Sign in to your member account." }, { status: 401, headers: privateHeaders });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Open Membership directly to change your account." }, { status: 403, headers: privateHeaders });
  const expected = request.headers.get("X-Studio-Workspace");
  if (expected !== access.id) return Response.json({ error: "Your account changed. Reload Membership before continuing." }, { status: 409, headers: privateHeaders });
  let input;
  try { input = JSON.parse(await readBoundedText(request, 4096)); } catch { return Response.json({ error: "Invalid membership request." }, { status: 400, headers: privateHeaders }); }
  if (typeof input?.plan !== "string" || !Object.hasOwn(plans, input.plan)) return Response.json({ error: "Choose a member plan." }, { status: 400, headers: privateHeaders });
  if (input.action === "accept") {
    if (input.confirmed !== true || input.adult !== true || input.version !== membershipNoticeVersion) throw new CreditError("Review the membership notice and confirm your eligibility.", 400);
    await acceptMembership(access.id, input.plan as Plan);
  } else if (input.action === "choose-plan") {
    await billingAccount(access.id);
    await creditQuery("update billing_accounts set selected_plan=? where owner=?", input.plan, access.id).run();
  } else return Response.json({ error: "Choose a supported member action." }, { status: 400, headers: privateHeaders });
  return Response.json({ saved: true, paid: false }, { headers: privateHeaders });
}
export const GET = recoverableRoute(get, "Membership information could not load. Your private library is preserved.");
export const POST = recoverableRoute(async (request: Request) => { try { return await post(request); } catch (e) { if (e instanceof CreditError) return Response.json({ error: e.message }, { status: e.status, headers: privateHeaders }); throw e; } }, "Member settings could not save. Reload to check before retrying.");
