import type { ElevenLabsSettings } from "../../../elevenlabs-settings-data";

export const musicModel = "music_v2_5";

export function elevenLabsRequest(key: string, path: string, payload?: object, timeout = 45_000) {
  return fetch("https://api.elevenlabs.io/v1/" + path, {
    method: payload ? "POST" : "GET",
    headers: { "xi-api-key": key, Accept: "application/json, audio/*", ...(payload && { "Content-Type": "application/json" }) },
    body: payload ? JSON.stringify(payload) : undefined,
    // Sites rejects redirect: "error" on outbound fetches. Manual keeps the key on the original host.
    redirect: "manual",
    signal: AbortSignal.timeout(timeout),
  });
}

type Scope = "account" | "music" | "voice";
type Failure = {
  kind: "key" | "permission" | "ip" | "plan" | "credits" | "rate" | "model" | "request" | "upstream" | "network" | "timeout" | "response" | "denied";
  message: string;
  status?: number;
};
type Probe<T> = { ok: true; value: T } | { ok: false; failure: Failure };

async function failureFromResponse(response: Response, scope: Scope): Promise<Failure> {
  const status = response.status;
  const cause = (kind: Failure["kind"], message: string): Failure => ({ kind, message: message + ` (HTTP ${status})`, status });
  if (status >= 300 && status < 400) {
    await response.body?.cancel().catch(() => {});
    return cause("upstream", "ElevenLabs redirected the request. Studio stopped the request to protect your API key. Retry, then contact support if the redirect persists.");
  }
  const body = await response.json().catch(() => null) as { detail?: unknown } | null;
  const detail = body?.detail;
  const fields = detail && typeof detail === "object" && !Array.isArray(detail) ? detail as Record<string, unknown> : {};
  const code = typeof fields.code === "string" ? fields.code : "";
  const legacy = typeof fields.status === "string" ? fields.status : "";
  const type = typeof fields.type === "string" ? fields.type : "";
  const raw = typeof fields.message === "string" ? fields.message : typeof detail === "string" ? detail : "";
  const matches = (...values: string[]) => values.includes(code) || values.includes(legacy);

  // Match provider errors internally. Provider payloads can contain submitted data.
  if (matches("invalid_api_key", "api_key_expired", "missing_api_key", "api_key_revoked"))
    return cause("key", "ElevenLabs rejected the API key. In ElevenLabs, copy an active key from the intended workspace, then choose Reconnect in Studio.");
  if (matches("ip_not_allowed", "ip_not_whitelisted", "ip_not_allowlisted", "invalid_ip_address") || /ip address.*(?:allow|whitelist)|ip (?:allowlist|whitelist)/i.test(raw))
    return cause("ip", "ElevenLabs blocked the request under the key’s IP restrictions. Check the key’s IP allowlist with your ElevenLabs workspace administrator. Studio sends requests from its server.");
  if (matches("missing_permissions", "missing_permission", "insufficient_permissions") || /missing (?:the )?.*permission|does not have (?:the )?(?:required )?permission/i.test(raw)) {
    const permission = scope === "account" ? "User read" : scope === "music" ? "Music access" : "Voice Design access";
    return cause("permission", `The key lacks ${permission}. Edit the restricted key under ElevenLabs → Developers → API Keys, enable ${permission}, and test again.`);
  }
  if (matches("quota_exceeded", "insufficient_credits", "credit_limit_exceeded") || /insufficient (?:credits|quota)|credit (?:quota|limit).*(?:exceeded|reached)/i.test(raw))
    return cause("credits", "ElevenLabs reports a credit or key quota limit. Check the workspace’s usage and the key’s credit cap in ElevenLabs.");
  if (matches("paid_plan_required", "subscription_required", "plan_not_supported", "paid_plan_only", "feature_not_available_for_tier") || /(?:paid|higher) (?:plan|tier|subscription)|not (?:available|included) (?:on|in) your (?:current )?(?:plan|tier)/i.test(raw))
    return cause("plan", "The ElevenLabs plan doesn’t include this feature. Verify that the key belongs to the workspace with the required plan.");
  if (status === 402 || type === "payment_required")
    return cause("credits", "ElevenLabs requires payment or available credits for this request. Check your plan, remaining credits, and key spending cap in ElevenLabs.");
  if (status === 429 || type === "rate_limit_error")
    return cause("rate", matches("concurrent_limit_exceeded") ? "ElevenLabs has too many active requests. Wait for them to finish, then retry." : "ElevenLabs rate-limited the request. Wait a moment before retrying.");
  if (matches("model_not_found", "unsupported_model", "invalid_model_id"))
    return cause("model", "ElevenLabs rejected the configured model. Check Music v2.5 availability in this workspace and retry.");
  if (status === 401 || type === "authentication_error")
    return cause("key", "ElevenLabs did not accept the key for this request. Check that it is active and belongs to the intended workspace. Reconnect if you copied or replaced it.");
  if (status === 403 || type === "authorization_error")
    return cause("denied", scope === "account" ? "ElevenLabs denied subscription access. Check User read permission and the key’s workspace and IP restrictions." :
      scope === "music" ? "ElevenLabs denied Music access. Check the key’s Music permission, the workspace plan, and any IP restrictions." :
        "ElevenLabs denied voice access. Check Voice Design permission and the key’s workspace and IP restrictions.");
  if (status >= 500)
    return cause("upstream", "ElevenLabs returned a server error. Retry after a short wait and check the ElevenLabs status page if it persists.");
  if (status === 400 || status === 404 || status === 422)
    return cause("request", scope === "music" ? "ElevenLabs rejected the Music request. Check the workspace’s Music v2.5 access. If the test still fails, contact support with this result." :
      "ElevenLabs rejected the request. Review the inputs and permissions, then try again.");
  return cause("response", "ElevenLabs returned an unexpected HTTP response. Retry and contact support if it persists.");
}

export async function elevenLabsFailureMessage(response: Response, scope: Scope) {
  return (await failureFromResponse(response, scope)).message;
}

async function probe<T>(key: string, scope: Scope, path: string, timeout: number, parse: (body: unknown) => T | undefined, payload?: object): Promise<Probe<T>> {
  let response: Response;
  try {
    response = await elevenLabsRequest(key, path, payload, timeout);
  } catch (error) {
    const timeoutReached = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return { ok: false, failure: timeoutReached ?
      { kind: "timeout", message: "ElevenLabs took too long to respond. Wait a moment and run Test Connection again." } :
      { kind: "network", message: "The Studio server could not reach ElevenLabs. Retry and check the ElevenLabs status page if it persists." } };
  }
  if (!response.ok) return { ok: false, failure: await failureFromResponse(response, scope) };
  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError"))
      return { ok: false, failure: { kind: "timeout", message: "ElevenLabs took too long to finish sending its response. Run Test Connection again." } };
  }
  const value = parse(data);
  if (value !== undefined) return { ok: true, value };
  return { ok: false, failure: {
    kind: "response", status: response.status,
    message: scope === "music" ? "ElevenLabs returned no usable Music v2.5 composition plan. Retry the test and contact support if this repeats." :
      "ElevenLabs returned no usable subscription information. Check the ElevenLabs dashboard and retry.",
  } };
}

const tiers = new Set(["free", "starter", "creator", "pro", "scale", "business", "enterprise"]);
function readSubscription(body: unknown) {
  if (!body || typeof body !== "object") return undefined;
  const { tier: rawTier, character_count: used, character_limit: limit } = body as Record<string, unknown>;
  const tier = typeof rawTier === "string" && tiers.has(rawTier.toLowerCase()) ? rawTier.toLowerCase() : undefined;
  const usage = typeof used === "number" && Number.isSafeInteger(used) && used >= 0 &&
    typeof limit === "number" && Number.isSafeInteger(limit) && limit >= 0 ? { tier, used, limit } : undefined;
  return tier || usage ? { tier, usage } : undefined;
}

function readMusicPlan(body: unknown) {
  if (!body || typeof body !== "object" || !("chunks" in body) || !Array.isArray(body.chunks)) return undefined;
  return body.chunks.some(chunk => chunk && typeof chunk.duration_ms === "number" && chunk.duration_ms > 0) ? true : undefined;
}

export async function testElevenLabs(key: string): Promise<Pick<ElevenLabsSettings, "connection" | "musicAccess" | "checkedAt" | "musicMessage" | "accountMessage" | "usage" | "error">> {
  const [account, music] = await Promise.all([
    probe(key, "account", "user/subscription", 12_000, readSubscription),
    probe(key, "music", "music/plan", 45_000, readMusicPlan, {
      prompt: "A short, uplifting instrumental piano sketch.",
      music_length_ms: 10000,
      model_id: musicModel,
    }),
  ]);
  const connected = account.ok || music.ok;
  const free = account.ok && account.value.tier === "free";
  const musicBlocked = free || (!music.ok && ["key", "permission", "ip", "plan", "credits", "denied", "model"].includes(music.failure.kind));

  // Log only locally defined result categories and numeric statuses for troubleshooting.
  const outcome = <T>(result: Probe<T>) => result.ok ? { result: "verified" } :
    { result: result.failure.kind, http: result.failure.status };
  console.info("ElevenLabs connection check", { account: outcome(account), music: outcome(music), plan: free ? "free" : undefined });

  return {
    connection: connected ? "connected" : "error",
    musicAccess: music.ok && !free ? "available" : musicBlocked ? "unavailable" : "unknown",
    checkedAt: new Date().toISOString(),
    accountMessage: account.ok ? "ElevenLabs accepted the key for the subscription check." : account.failure.message,
    musicMessage: free ? "ElevenLabs reports a Free plan. Use a key from a paid workspace with Music API access." :
      music.ok ? "ElevenLabs returned a Music v2.5 composition plan." : music.failure.message,
    usage: account.ok ? account.value.usage : undefined,
    error: connected ? undefined : "Neither ElevenLabs check verified the key. See the account and Music results below.",
  };
}
