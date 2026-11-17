import { legalDetails } from "./legal";
import { serverStorage as env } from "../server/storage";
import { plans, type Plan } from "../credits/data";
export { membershipNoticeVersion } from "./config-data";
export const stripeVersion = "2024-06-20";
export function priceId(plan: Plan) {
  return plan === "creator" ? env.STRIPE_PRICE_CREATOR : plan === "pro" ? env.STRIPE_PRICE_PRO : plan === "studio" ? env.STRIPE_PRICE_STUDIO : undefined;
}
export function paidPlan(value: unknown): value is Exclude<Plan, "free"> { return typeof value === "string" && value !== "free" && Object.hasOwn(plans, value); }
export function planFromPrice(id: string) { return (["creator", "pro", "studio"] as const).find(plan => priceId(plan) === id); }
export function billingReady() {
  const legal = legalDetails();
  return !!(legal.business && legal.contact && legal.terms && legal.privacy && legal.refunds) && env.STUDIO_BILLING_LAUNCH_APPROVED === "1" && env.STUDIO_CREDITS_ENABLED === "1" && env.STUDIO_MANAGED_PRODUCTION_APPROVED === "1" &&
    !!env.STUDIO_MANAGED_ELEVENLABS_KEY && /^sk_(test|live)_/.test(env.STRIPE_SECRET_KEY ?? "") && /^whsec_/.test(env.STRIPE_WEBHOOK_SECRET ?? "") &&
    (["creator", "pro", "studio"] as const).every(plan => /^price_/.test(priceId(plan) ?? ""));
}
export function paymentMode() { return env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "live" : "test"; }
