import { privateWorkspace, studioAccess } from "../../../studio-access";
import { privateHeaders } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";
import { ownerAction } from "../../../server/request-context";
import { plans, type Plan } from "../../../credits/data";
import { CreditError, assignBeta, creditQuery, creditsData, setFunding, settleJob } from "../../../credits/account-ledger";
import { productionIdValid, quoteProduction } from "../../../credits/production";
export const dynamic = "force-dynamic";
const reply = (data: object, status = 200) => Response.json(data, { status, headers: privateHeaders });
async function get(request: Request) {
  const access = await privateWorkspace();
  if (!access) return reply({ error: "Sign in to view your credit allowance." }, 401);
  const params = new URL(request.url).searchParams;
  if (params.has("accounts")) {
    if (access.role !== "owner") return reply({ error: "Owner access is required." }, 403);
    const accounts = await creditQuery(`select c.id, c.display_name as name, a.plan,a.balance,a.status from creator_accounts c
      left join credit_accounts a on a.owner=c.id order by c.created_at desc limit 100`).all();
    return reply({ accounts: [{ id: access.id, name: "Owner workspace" }, ...accounts.results] });
  }
  const target = params.get("account");
  if (target && access.role !== "owner") return reply({ error: "Only the owner can review another allowance." }, 403);
  return reply(await creditsData(target ?? access.id, access.role === "owner"));
}
async function post(request: Request) {
  const access = await privateWorkspace();
  if (!access) return reply({ error: "Sign in to manage credits." }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Open Studio directly to change credits." }, 403);
  const expected = request.headers.get("X-Studio-Workspace");
  if (expected && expected !== access.id) return reply({ error: "Your signed-in account changed. Reload before continuing." }, 409);
  let input;
  try { input = JSON.parse(await readBoundedText(request, 80000)); } catch { return reply({ error: "Check the credit request." }, 400); }
  try {
    if (input?.action === "quote") {
      if (!["/api/studio/create", "/api/studio/stems", "/api/studio/lyric-sync"].includes(input.route) || !input.input || typeof input.input !== "object") return reply({ error: "Choose a production tool." }, 400);
      return reply(await quoteProduction(access.id, input.route, input.input));
    }
    if (input?.action === "funding" && ["own", "studio"].includes(input.funding)) {
      await setFunding(access.id, input.funding); ownerAction("credits.funding", access.id, { role: access.role, funding: input.funding }); return reply({ saved: true });
    }
    if (access.role !== "owner" || (await studioAccess()).role !== "owner") return reply({ error: "Only the owner can assign beta allowances or resolve interrupted jobs." }, 403);
    if (typeof input.account !== "string" || input.account.length > 200 || !input.account) return reply({ error: "Choose an account." }, 400);
    if (input.account !== access.id && !await creditQuery("select id from creator_accounts where id=?", input.account).first()) return reply({ error: "Creator account not found." }, 404);
    if (input.action === "assign-beta" && typeof input.plan === "string" && Object.hasOwn(plans, input.plan) && productionIdValid(input.requestId) && input.confirmed === true) {
      await assignBeta(input.account, input.plan as Plan, access.id, input.requestId); ownerAction("credits.assign-plan", access.id, { account: input.account, plan: input.plan }); return reply({ saved: true });
    }
    if (input.action === "resolve-job" && productionIdValid(input.jobId) && input.confirmed === true) {
      const job = await creditQuery("select created_at from production_jobs where id=? and owner=? and status='held'", input.jobId, input.account).first<{ created_at: number }>();
      if (!job || job.created_at > Date.now() - 15 * 60000) return reply({ error: "Only interrupted jobs older than 15 minutes can be resolved. Check that the provider has stopped processing first." }, 409);
      await settleJob(input.account, input.jobId, true);
      await creditQuery("insert into credit_ledger values (?,?,0,'admin',?,?) on conflict do nothing", "recovery:" + input.jobId, access.id, "Interrupted job refunded for account " + input.account, Date.now()).run();
      ownerAction("credits.refund-interrupted-job", access.id, { account: input.account, productionJob: input.jobId });
      return reply({ saved: true });
    }
    return reply({ error: "Choose a supported credit action and confirm the change." }, 400);
  } catch (error) { if (error instanceof CreditError) return reply({ error: error.message }, error.status); throw error; }
}
export const GET = recoverableRoute(get, "Credit information is temporarily unavailable. Your music is preserved.");
export const POST = recoverableRoute(post, "Credit settings could not save. Reload the account before retrying.");
