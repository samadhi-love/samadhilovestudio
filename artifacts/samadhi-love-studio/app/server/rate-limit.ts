/**
 * Per-person speed limits for the actions that cost money or heavy work.
 * Generous enough that a real person never notices; they stop one account or
 * a stuck script from flooding AI providers. Kept in memory: the app runs as
 * one server, and a restart simply starts fresh counts.
 */
import { logEvent } from "./request-context";

export const limits = {
  work: { perMinute: 20, perHour: 200, label: "starting songs or lyric timing" },
  create: { perMinute: 20, perHour: 200, label: "Create requests" },
  "lyric-sync": { perMinute: 10, perHour: 100, label: "lyric timing" },
  stems: { perMinute: 3, perHour: 30, label: "stem separation" },
  upload: { perMinute: 20, perHour: 300, label: "uploads" },
  visuals: { perMinute: 10, perHour: 100, label: "visual generation" },
} as const;
export type LimitName = keyof typeof limits;

const minute = 60_000, hour = 3_600_000, maxPeople = 5000;
const seen = new Map<string, number[]>();

/** Returns null when allowed, or a friendly 429 response when this person is going too fast. */
export function rateLimited(name: LimitName, person: string, now = Date.now()): Response | null {
  // Owner switch for emergencies and for offline route tests that send many requests at once.
  if (typeof process !== "undefined" && process.env.STUDIO_RATE_LIMITS === "off") return null;
  const rule = limits[name], key = name + ":" + person;
  const times = (seen.get(key) ?? []).filter(t => now - t < hour);
  const lastMinute = times.filter(t => now - t < minute).length;
  if (lastMinute >= rule.perMinute || times.length >= rule.perHour) {
    const waitMs = lastMinute >= rule.perMinute ? minute - (now - times.filter(t => now - t < minute)[0]) : hour - (now - times[0]);
    const wait = Math.max(1, Math.ceil(waitMs / 1000));
    seen.set(key, times);
    logEvent("api.failure", { reason: "rate-limited", limit: name, status: 429 }, "info");
    return Response.json({ error: `Slow down a little — too many ${rule.label} in a short time. Try again in ${wait < 90 ? wait + " seconds" : Math.ceil(wait / 60) + " minutes"}. Nothing was lost.`, code: "rate-limited", retryAfter: wait },
      { status: 429, headers: { "Cache-Control": "private, no-store", "Retry-After": String(wait) } });
  }
  times.push(now);
  if (!seen.has(key) && seen.size >= maxPeople) {
    for (const [k, list] of seen) if (!list.length || now - list[list.length - 1] >= hour) seen.delete(k);
    if (seen.size >= maxPeople) seen.delete(seen.keys().next().value!);
  }
  seen.set(key, times);
  return null;
}

/** Test helper: start from empty counts. */
export function resetRateLimits() { seen.clear(); }
