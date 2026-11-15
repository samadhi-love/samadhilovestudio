declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    STUDIO_OWNER_EMAIL?: string;
    STUDIO_ELEVENLABS_VAULT_KEY?: string;
    /** Managed secret alias accepted for first-time Studio vault setup. */
    vault?: string;
    BUCKET?: R2Bucket;
  }
}

declare namespace Cloudflare {
  interface Env {
    STUDIO_CREATOR_BETA?: string;
    STUDIO_CREDITS_ENABLED?: string;
    STUDIO_MANAGED_PRODUCTION_APPROVED?: string;
    STUDIO_MANAGED_ELEVENLABS_KEY?: string;
    STUDIO_MANAGED_MONTHLY_CREDIT_CAP?: string;
    STUDIO_MANAGED_CONCURRENCY_CAP?: string;
  }
}

declare namespace Cloudflare { interface Env { JAMENDO_CLIENT_ID?: string; } }

declare namespace Cloudflare { interface Env { AUDD_API_TOKEN?: string; } }

declare namespace Cloudflare { interface Env {
  STUDIO_BILLING_LAUNCH_APPROVED?: string;
  STUDIO_LEGAL_BUSINESS_NAME?: string;
  STUDIO_BILLING_CONTACT_EMAIL?: string;
  STUDIO_TERMS_URL?: string;
  STUDIO_PRIVACY_URL?: string;
  STUDIO_REFUND_URL?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_CREATOR?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_STUDIO?: string;
  STRIPE_PORTAL_CONFIGURATION?: string;
  STRIPE_AUTOMATIC_TAX?: string;
} }
