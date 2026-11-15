import { ElevenLabsClient, ElevenLabsError } from "@elevenlabs/elevenlabs-js";

type ComposeRequest = NonNullable<Parameters<ElevenLabsClient["music"]["compose"]>[0]>;
type PlanRequest = Parameters<ElevenLabsClient["music"]["compositionPlan"]["create"]>[0];

/** Keep the Studio's persisted/provider JSON contract while using the SDK's camelCase types. */
function convertKeys(value: unknown, key: (name: string) => string): unknown {
  if (Array.isArray(value)) return value.map(item => convertKeys(item, key));
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [key(name), convertKeys(item, key)]));
  return value;
}
const camelCase = (name: string) => name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const snakeCase = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

export function isSdkMusicPath(path: string) {
  return path === "music" || path.startsWith("music?") || path === "music/plan";
}

/**
 * Server only. A resolved per-creator (or explicitly approved managed) key is
 * mandatory. Never fall back to the developer's ELEVENLABS_API_KEY for visitors.
 */
export async function sdkMusicRequest(key: string, path: string, payload: object, timeout: number): Promise<Response> {
  if (!key.trim()) throw new Error("A resolved ElevenLabs credential is required.");
  if (!isSdkMusicPath(path)) throw new Error("Unsupported SDK music endpoint.");
  const signal = AbortSignal.timeout(timeout);
  const client = new ElevenLabsClient({
    apiKey: key,
    // Automatic retries can create duplicate paid generations.
    maxRetries: 0,
    timeoutInSeconds: timeout / 1000,
    fetch: (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      if (url.origin !== "https://api.elevenlabs.io" || !["/v1/music", "/v1/music/plan"].includes(url.pathname))
        throw new Error("Unexpected ElevenLabs SDK destination.");
      // Workers does not support redirect: "error". Do not forward keys on redirects.
      return fetch(input, { ...init, redirect: "manual", signal });
    },
  });
  const requestOptions = { maxRetries: 0, timeoutInSeconds: timeout / 1000, abortSignal: signal };
  try {
    if (path === "music/plan") {
      const request = convertKeys(payload, camelCase) as PlanRequest;
      const { data, rawResponse } = await client.music.compositionPlan.create(request, requestOptions).withRawResponse();
      // Existing writing, section directions and saved drafts use snake_case.
      return Response.json(convertKeys(data, snakeCase), { status: rawResponse.status });
    }
    const request = convertKeys(payload, camelCase) as ComposeRequest;
    const outputFormat = new URLSearchParams(path.split("?")[1] ?? "").get("output_format");
    const { data, rawResponse } = await client.music.compose({
      ...request,
      ...(outputFormat && { outputFormat: outputFormat as ComposeRequest["outputFormat"] }),
    }, requestOptions).withRawResponse();
    // Stream bytes to the existing route, which validates audio and persists in R2.
    return new Response(data, { status: rawResponse.status, headers: rawResponse.headers });
  } catch (error) {
    if (signal.aborted) throw signal.reason;
    if (error instanceof ElevenLabsError && error.statusCode && error.statusCode >= 300 && error.statusCode <= 599) {
      // Keep provider errors internal so the existing redacted error mapper and
      // reservation/refund wrapper can handle them exactly as before.
      return Response.json(error.body ?? { detail: { code: "upstream_error" } }, { status: error.statusCode });
    }
    // Do not log SDK errors: their messages/bodies can contain submitted lyrics.
    throw error;
  }
}
