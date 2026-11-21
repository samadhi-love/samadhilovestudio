/**
 * Receives "watch only" content-policy reports from browsers. Keeps only the rule
 * name and the blocked site's host name (never full addresses, page text or IDs),
 * so the owner can see what would break before the policy is enforced.
 */
import { logEvent } from "../../../server/request-context";
import { readBoundedText } from "../request-errors";

export const dynamic = "force-dynamic";
let windowStart = 0, count = 0;
const empty = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export function cspSummary(body: unknown) {
  const report = (body && typeof body === "object" && "csp-report" in body ? (body as Record<string, unknown>)["csp-report"] : body) as Record<string, unknown> | undefined;
  if (!report || typeof report !== "object") return null;
  const directive = String(report["effective-directive"] ?? report["violated-directive"] ?? "").split(" ")[0].slice(0, 40);
  const raw = String(report["blocked-uri"] ?? "");
  let blocked = raw;
  try { blocked = new URL(raw).host || raw; } catch { /* keywords such as inline or eval */ }
  blocked = blocked.replace(/[^\w.:-]/g, "").slice(0, 80);
  return directive ? { directive, blocked: blocked || "unknown" } : null;
}

export async function POST(request: Request) {
  const now = Date.now();
  if (now - windowStart > 60_000) { windowStart = now; count = 0; }
  if (++count > 60) return empty(); // Never let reports flood the history.
  try {
    const summary = cspSummary(JSON.parse(await readBoundedText(request, 8192)));
    if (summary) logEvent("api.failure", { reason: "content-policy", ...summary }, "info");
  } catch { /* ignore unreadable reports */ }
  return empty();
}
