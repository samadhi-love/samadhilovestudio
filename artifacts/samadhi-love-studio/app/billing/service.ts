import { env } from "cloudflare:workers";
import { creditQuery, CreditError, ensureCreditAccount } from "../credits/account-ledger";
import { plans, type Plan } from "../credits/data";
import { billingReady, membershipNoticeVersion, paidPlan, paymentMode, planFromPrice, priceId, stripeVersion } from "./config";
export type BillingAccount = { owner: string; customer: string | null; subscription: string | null; status: string; selected_plan: Plan; cancel_at_end: number; period_end: number; blocked: number;
  checkout: string | null; checkout_lock: string | null; lock_at: number; notice_version: string | null; notice_at: number };
type StripeSubscription = { id: string; customer: string; status: string; metadata?: { owner?: string; plan?: string }; current_period_end: number; cancel_at_period_end: boolean; latest_invoice?: string; created: number };
type StripeInvoice = { id: string; customer: string; subscription: string | null; status: string; billing_reason: string; amount_paid: number; currency: string;
  lines: { has_more?: boolean; data: { type: string; proration: boolean; quantity: number; price: { id: string }; period: { start: number; end: number } }[] } };
const providerId = (id: unknown, prefix: string): id is string => typeof id === "string" && new RegExp("^" + prefix + "_[A-Za-z0-9_]+$").test(id);
export async function billingAccount(owner: string) {
  await creditQuery("insert into billing_accounts(owner) values(?) on conflict do nothing", owner).run();
  return (await creditQuery("select * from billing_accounts where owner=?", owner).first<BillingAccount>())!;
}
export async function acceptMembership(owner: string, plan: Plan) {
  await billingAccount(owner);
  await creditQuery("update billing_accounts set notice_version=?,notice_at=?,selected_plan=? where owner=?", membershipNoticeVersion, Date.now(), plan, owner).run();
}
export async function stripe<T>(path: string, body?: Record<string, string>, idempotency?: string): Promise<T> {
  if (!env.STRIPE_SECRET_KEY) throw new CreditError("The payment account is not connected.", 503);
  const response = await fetch("https://api.stripe.com/v1/" + path, { method: body ? "POST" : "GET", redirect: "manual", signal: AbortSignal.timeout(25000),
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY, "Stripe-Version": stripeVersion, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(idempotency ? { "Idempotency-Key": idempotency } : {}) },
    ...(body ? { body: new URLSearchParams(body) } : {}) });
  if (!response.ok) throw new CreditError("The payment provider could not complete this request. Your Studio account has not been upgraded. Check Membership before retrying.", 503);
  return response.json<T>();
}
function safeProviderUrl(url: unknown, host: string) {
  if (typeof url !== "string") throw new CreditError("The payment provider did not return a secure page.", 502);
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== host || parsed.username || parsed.password) throw new CreditError("The payment provider returned an unexpected page.", 502);
  return parsed.href;
}
async function customerFor(owner: string, email?: string) {
  const current = await billingAccount(owner);
  if (current.customer) return current.customer;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(owner));
  const hash = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, "0")).join("");
  const result = await stripe<{ id: string }>("customers", { "metadata[owner]": owner, ...(email ? { email } : {}) }, "samadhi-customer-" + hash);
  if (!providerId(result.id, "cus")) throw new CreditError("The billing customer could not be verified.", 502);
  await creditQuery("update billing_accounts set customer=? where owner=? and customer is null", result.id, owner).run();
  return (await billingAccount(owner)).customer!;
}
export async function startCheckout(owner: string, plan: Plan, origin: string, email?: string) {
  if (!paidPlan(plan) || !billingReady()) throw new CreditError("Paid subscriptions are not open yet. Your plan choice can be saved without a payment.", 503);
  const profile = await billingAccount(owner);
  if (profile.notice_version !== membershipNoticeVersion) throw new CreditError("Review the membership notice before subscribing.", 400);
  if (profile.blocked) throw new CreditError("This billing account needs owner review before another purchase.", 403);
  const lock = crypto.randomUUID(), now = Date.now();
  const locked = await creditQuery("update billing_accounts set checkout_lock=?,lock_at=? where owner=? and (checkout_lock is null or lock_at<?)", lock, now, owner, now - 600000).run();
  if (!locked.meta.changes) throw new CreditError("A checkout is already being prepared. Wait a moment, then refresh Membership.");
  try {
    const current = await billingAccount(owner), customer = await customerFor(owner, email);
    const subscriptions = await stripe<{ data: { status: string }[]; has_more?: boolean }>("subscriptions?" + new URLSearchParams({ customer, status: "all", limit: "100" }));
    if (subscriptions.has_more || subscriptions.data.some(sub => !["canceled", "incomplete_expired"].includes(sub.status))) throw new CreditError("You already have a subscription or payment awaiting completion. Use Manage billing instead of buying a second subscription.");
    if (current.checkout && providerId(current.checkout, "cs")) {
      const pending = await stripe<{ status: string; url?: string; subscription?: string; metadata?: { plan?: string } }>("checkout/sessions/" + current.checkout);
      if (pending.status === "open") {
        if (pending.metadata?.plan === plan) return safeProviderUrl(pending.url, "checkout.stripe.com");
        await stripe("checkout/sessions/" + current.checkout + "/expire", {});
      }
      if (pending.status === "complete") {
        const old = pending.subscription ? await stripe<{ status: string }>("subscriptions/" + pending.subscription) : null;
        if (!old || !["canceled", "incomplete_expired"].includes(old.status)) throw new CreditError("Your previous checkout completed. Refresh Membership while its verified payment is processed.");
      }
    }
    const price = await stripe<{ id: string; active: boolean; currency: string; unit_amount: number; recurring?: { interval: string; interval_count: number } }>("prices/" + priceId(plan));
    if (!price.active || price.currency !== "usd" || price.unit_amount !== plans[plan].price * 100 || price.recurring?.interval !== "month" || price.recurring.interval_count !== 1)
      throw new CreditError("This plan’s payment price does not match its advertised monthly USD price. Checkout is paused until the owner fixes the configuration.", 503);
    const session = await stripe<{ id: string; url: string }>("checkout/sessions", { mode: "subscription", customer, client_reference_id: owner,
      "consent_collection[terms_of_service]": "required", "line_items[0][price]": price.id, "line_items[0][quantity]": "1", "subscription_data[metadata][owner]": owner, "subscription_data[metadata][plan]": plan, "metadata[plan]": plan,
      success_url: origin + "/members?checkout=returned", cancel_url: origin + "/plans?checkout=cancelled", expires_at: String(Math.floor(now / 1000) + 1800),
      billing_address_collection: "required", "automatic_tax[enabled]": env.STRIPE_AUTOMATIC_TAX === "1" ? "true" : "false", "customer_update[address]": "auto",
    }, "samadhi-checkout-" + lock);
    if (!providerId(session.id, "cs")) throw new CreditError("The checkout reference was invalid.", 502);
    await creditQuery("update billing_accounts set checkout=?,selected_plan=? where owner=? and checkout_lock=?", session.id, plan, owner, lock).run();
    return safeProviderUrl(session.url, "checkout.stripe.com");
  } finally { await creditQuery("update billing_accounts set checkout_lock=null where owner=? and checkout_lock=?", owner, lock).run(); }
}
export async function billingPortal(owner: string, origin: string) {
  const profile = await billingAccount(owner);
  if (!profile.customer || !env.STRIPE_SECRET_KEY) throw new CreditError("No payment account is linked to this membership.", 404);
  const session = await stripe<{ url: string }>("billing_portal/sessions", { customer: profile.customer, return_url: origin + "/members", ...(env.STRIPE_PORTAL_CONFIGURATION ? { configuration: env.STRIPE_PORTAL_CONFIGURATION } : {}) });
  return safeProviderUrl(session.url, "billing.stripe.com");
}
export async function verifyStripeSignature(raw: string, signature: string | null) {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature || signature.length > 4096) return false;
  const parts = signature.split(",").map(part => part.trim().split("="));
  const timestamp = parts.find(([kind]) => kind === "t")?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  for (const [kind, value] of parts) if (kind === "v1" && /^[a-f0-9]{64}$/i.test(value)) {
    const bytes = new Uint8Array(value.match(/../g)!.map(pair => parseInt(pair, 16)));
    if (await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(timestamp + "." + raw))) return true;
  }
  return false;
}
async function mappedSubscription(id: string) {
  if (!providerId(id, "sub")) throw new CreditError("Invalid subscription reference.", 400);
  const subscription = await stripe<StripeSubscription>("subscriptions/" + id);
  const profile = await creditQuery("select * from billing_accounts where customer=?", subscription.customer).first<BillingAccount>();
  if (!profile || subscription.metadata?.owner !== profile.owner) throw new CreditError("This subscription is not linked to a verified Studio account.", 400);
  if (profile.subscription && profile.subscription !== subscription.id) {
    const previous = await stripe<StripeSubscription>("subscriptions/" + profile.subscription);
    if (previous.created >= subscription.created || !["canceled", "incomplete_expired"].includes(previous.status)) return { subscription, profile, stale: true };
  }
  return { subscription, profile, stale: false };
}
async function syncSubscription(id: string) {
  const { subscription: sub, profile, stale } = await mappedSubscription(id);
  if (stale) return { sub, profile, stale: true };
  await creditQuery("update billing_accounts set subscription=?,status=?,cancel_at_end=?,period_end=? where owner=?", sub.id, sub.status, sub.cancel_at_period_end ? 1 : 0, sub.current_period_end * 1000, profile.owner).run();
  // Cancellation at period end keeps current paid access. Immediate provider termination stops funded production, never library access.
  if (["canceled", "unpaid", "incomplete_expired", "paused"].includes(sub.status))
    await creditQuery("update credit_accounts set status='paused',last_change=? where owner=? and status='active'", "subscription:" + crypto.randomUUID(), profile.owner).run();
  return { sub, profile, stale: false };
}
export async function applyPaidInvoice(id: string) {
  if (!providerId(id, "in")) throw new CreditError("Invalid invoice reference.", 400);
  const invoice = await stripe<StripeInvoice>("invoices/" + id);
  if (invoice.status !== "paid" || !invoice.subscription || !["subscription_create", "subscription_cycle"].includes(invoice.billing_reason)) return;
  const { sub, profile, stale } = await syncSubscription(invoice.subscription);
  if (stale || sub.customer !== invoice.customer || profile.blocked || sub.status !== "active") return;
  const lines = invoice.lines.data.filter(line => line.type === "subscription" && !line.proration);
  if (invoice.lines.has_more || lines.length !== 1 || lines[0].quantity !== 1 || invoice.currency !== "usd") throw new CreditError("This invoice needs manual billing review.", 400);
  const line = lines[0], plan = planFromPrice(line.price.id);
  if (!plan || sub.metadata?.plan !== plan) throw new CreditError("The invoice plan does not match the Studio price configuration.", 400);
  const start = line.period.start * 1000, end = line.period.end * 1000;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end <= start || end - start > 35 * 86400000) throw new CreditError("The invoice period is invalid.", 400);
  for (let attempt = 0; attempt < 5; attempt++) {
    if (await creditQuery("select invoice from billing_invoices where invoice=?", id).first()) return;
    const account = await ensureCreditAccount(profile.owner);
    if ((["active", "paused"].includes(account.status) && account.period_end >= end) || end <= Date.now()) {
      await creditQuery("insert into billing_invoices values(?,?,?,?,?,?,?,?,?) on conflict do nothing", id, profile.owner, plan, start, end, invoice.amount_paid, invoice.currency, 0, Date.now()).run(); return;
    }
    const amount = plans[plan].credits, now = Date.now();
    const [updated] = await env.DB!.batch([
      creditQuery(`update credit_accounts set plan=?,status='active',funding='studio',balance=?,period_start=?,period_end=?,last_change=?
        where owner=? and last_change=? and not exists(select 1 from billing_invoices where invoice=?)
        and not exists(select 1 from billing_accounts where owner=? and blocked=1)`, plan, amount, start, end, id, profile.owner, account.last_change, id, profile.owner),
      creditQuery(`insert into credit_ledger(id,owner,amount,kind,note,created_at) select ?,owner,?,'subscription',?,? from credit_accounts where owner=? and last_change=? on conflict do nothing`,
        "invoice:" + id, amount - account.balance, "Verified paid monthly allowance · " + plan, now, profile.owner, id),
      creditQuery(`insert into billing_invoices select ?,owner,?,?,?,?,?,?,? from credit_accounts where owner=? and last_change=? on conflict do nothing`,
        id, plan, start, end, invoice.amount_paid, invoice.currency, amount, now, profile.owner, id),
    ]);
    if (updated.meta.changes) return;
  }
  throw new CreditError("The payment is verified but the allowance save conflicted. The webhook must retry.", 503);
}
export async function handleStripeEvent(event: { type?: string; livemode?: boolean; data?: { object?: { id?: string; customer?: string; amount?: number; amount_refunded?: number } } }) {
  if (event.livemode !== (paymentMode() === "live")) throw new CreditError("Payment environment mismatch.", 400);
  const object = event.data?.object;
  if (!object?.id) throw new CreditError("Invalid payment event.", 400);
  if (event.type === "invoice.paid") return applyPaidInvoice(object.id);
  if (event.type === "invoice.payment_failed") {
    if (!providerId(object.id, "in")) throw new CreditError("Invalid invoice reference.", 400);
    const invoice = await stripe<StripeInvoice>("invoices/" + object.id);
    if (invoice.subscription) await syncSubscription(invoice.subscription);
    return;
  }
  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type ?? "")) { await syncSubscription(object.id); return; }
  if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
    // Verify the charge again at the provider before placing the mapped account under review.
    const chargeId = event.type === "charge.refunded" ? object.id : (await stripe<{ charge: string }>("disputes/" + object.id)).charge;
    if (!providerId(chargeId, "ch")) throw new CreditError("Invalid charge reference.", 400);
    const charge = await stripe<{ customer: string; amount: number; amount_refunded: number }>("charges/" + chargeId);
    if (event.type === "charge.refunded" && charge.amount_refunded < charge.amount) return;
    const profile = await creditQuery("select * from billing_accounts where customer=?", charge.customer).first<BillingAccount>();
    if (profile) await env.DB!.batch([
      creditQuery("update billing_accounts set blocked=1,status='review' where owner=?", profile.owner),
      creditQuery("update credit_accounts set status='paused',last_change=? where owner=?", "review:" + chargeId, profile.owner),
      creditQuery("insert into credit_ledger values(?,?,0,'billing-review','Payment refund or dispute requires owner review',?) on conflict do nothing", "review:" + chargeId, profile.owner, Date.now()),
    ]);
  }
}
