import { env } from "cloudflare:workers";
export function publicLegalUrl(value?: string) { try { const url = new URL(value ?? ""); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; } }
export function legalDetails() {
  const contact = env.STUDIO_BILLING_CONTACT_EMAIL?.trim();
  return { business: env.STUDIO_LEGAL_BUSINESS_NAME?.trim() ?? "", contact: contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : null,
    terms: publicLegalUrl(env.STUDIO_TERMS_URL), privacy: publicLegalUrl(env.STUDIO_PRIVACY_URL), refunds: publicLegalUrl(env.STUDIO_REFUND_URL) };
}
