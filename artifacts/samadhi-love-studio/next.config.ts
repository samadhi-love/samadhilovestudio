import type { NextConfig } from "next";

/**
 * Browser safety rules sent with every page and API reply.
 * - The content policy is in "watch only" (Report-Only) mode: it reports anything
 *   unexpected to /api/studio/csp-report but blocks nothing, so sign-in, fonts,
 *   recording and video export keep working. Switch to enforcing after review.
 * - No X-Frame-Options: Replit's preview shows the app inside a frame.
 * - Microphone and speaker choice stay allowed for recording and Live mode.
 */
export const contentPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://img.clerk.com https://storage.googleapis.com https://*.fal.media https://fal.media",
  "media-src 'self' blob: data:",
  "connect-src 'self' blob: data: https://*.clerk.accounts.dev https://*.clerk.com",
  "worker-src 'self' blob:",
  "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "report-uri /api/studio/csp-report",
].join("; ");

export const safetyHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), microphone=(self)" },
  { key: "Content-Security-Policy-Report-Only", value: contentPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: safetyHeaders }];
  },
};

export default nextConfig;
