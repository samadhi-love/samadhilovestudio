import { env } from "cloudflare:workers";
import { privateWorkspace } from "../../studio-access";
import { getChatGPTUser } from "../../chatgpt-auth";
import { billingAccount, billingPortal, startCheckout, applyPaidInvoice, stripe } from "../../billing/service";
import { paidPlan, paymentMode, billingReady } from "../../billing/config";
import { CreditError, creditQuery } from "../../credits/account-ledger";
import { privateHeaders } from "../studio/store";
import { readBoundedText, recoverableRoute } from "../studio/request-errors";
export const dynamic = "force-dynamic";
async function change(request: Request) {
  const access = await privateWorkspace();
  if (!access) throw new CreditError("Sign in to your private member account before billing.", 401);
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) throw new CreditError("Open Membership directly to manage billing.", 403);
  if (request.headers.get("X-Studio-Workspace") !== access.id) throw new CreditError("Your account changed. Reload Membership before billing.", 409);
  let input;
  try { input = JSON.parse(await readBoundedText(request, 4096)); } catch { throw new CreditError("Invalid billing request.", 400); }
  if (input?.action === "clear-review") {
    if (access.role !== "owner" || input.confirmed !== true || typeof input.account !== "string" || input.account.length > 200) throw new CreditError("Only the owner can clear a reviewed billing restriction.", 403);
    const id = "billing-clear:" + crypto.randomUUID();
    const [, changed] = await env.DB!.batch([
      creditQuery("insert into credit_ledger select ?,?,0,'admin',?,? where exists(select 1 from billing_accounts where owner=? and blocked=1)", id, access.id, "Owner cleared billing review for account " + input.account + "; no credits restored", Date.now(), input.account),
      creditQuery("update billing_accounts set blocked=0,status='review-cleared' where owner=? and blocked=1", input.account),
    ]);
    if (!changed.meta.changes) throw new CreditError("That account has no pending billing restriction.", 404);
    return Response.json({ saved: true, creditsRestored: false }, { headers: privateHeaders });
  }
  if (input?.action === "checkout") {
    if (billingReady() && paymentMode() === "test" && access.role !== "owner") throw new CreditError("Sandbox billing is available only to the Studio owner.", 403);
    if (!paidPlan(input.plan) || input.confirmed !== true) throw new CreditError("Choose a paid plan and confirm recurring monthly billing.", 400);
    return Response.json({ url: await startCheckout(access.id, input.plan, origin, (await getChatGPTUser())?.email) }, { headers: privateHeaders });
  }
  if (input?.action === "portal") return Response.json({ url: await billingPortal(access.id, origin) }, { headers: privateHeaders });
  if (input?.action === "refresh") {
    const account = await billingAccount(access.id);
    let subscription = account.subscription;
    if (!subscription && account.checkout) {
      const session = await stripe<{ customer: string; subscription?: string }>("checkout/sessions/" + account.checkout);
      if (session.customer !== account.customer) throw new CreditError("The checkout does not match this member account.", 403);
      subscription = session.subscription ?? null;
    }
    if (subscription) {
      const sub = await stripe<{ customer: string; latest_invoice?: string }>("subscriptions/" + subscription);
      if (sub.customer !== account.customer) throw new CreditError("The subscription does not match this member account.", 403);
      if (sub.latest_invoice) await applyPaidInvoice(sub.latest_invoice);
    }
    return Response.json({ refreshed: true }, { headers: privateHeaders });
  }
  throw new CreditError("Choose a supported billing action.", 400);
}
export const POST = recoverableRoute(async (request: Request) => { try { return await change(request); } catch (error) { if (error instanceof CreditError) return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders }); throw error; } }, "Billing is temporarily unavailable. Check Membership before retrying; your songs are preserved.");
