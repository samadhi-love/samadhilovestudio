import { privateHeaders } from "./store";
import { StorageFullError } from "./storage-full";
import { logEvent, requestIdFor, routeLabel, stampRequestId, withRequestContext } from "../../server/request-context";

export class RequestBodyError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Enforce limits while streaming, before a large body is materialized in Worker memory. */
export async function readBoundedText(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("Content-Length"));
  if (declared > maxBytes) throw new RequestBodyError("This request is too large. Reduce its size and try again.", 413);
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder(); let size = 0, text = "";
  try {
    for (let part = await reader.read(); !part.done; part = await reader.read()) {
      size += part.value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new RequestBodyError("This request is too large. Reduce its size and try again.", 413);
      }
      text += decoder.decode(part.value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

/** Infrastructure failures must reach clients as recoverable JSON, never an HTML error page.
 * Every request also gets one ID (returned as X-Studio-Request-Id) that follows it into
 * jobs and AI provider calls, plus one structured log line with its outcome and duration. */
export function recoverableRoute<T extends unknown[]>(handler: (...args: T) => Promise<Response>, message: string) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] instanceof Request ? args[0] : undefined;
    const requestId = requestIdFor(request);
    const route = request ? routeLabel(new URL(request.url).pathname) : handler.name || "studio";
    const started = Date.now();
    return withRequestContext({ requestId, route }, async () => {
      let response: Response;
      try { response = await handler(...args); }
      catch (error) {
        if (error instanceof RequestBodyError || error instanceof StorageFullError)
          response = Response.json({ error: error.message }, { status: error.status, headers: privateHeaders });
        else {
          // Do not log request bodies, credentials, lyrics, or provider error payloads.
          // Do not include raw errors, causes, stacks or messages. Any of those
          // can contain submitted text, signed media URLs or provider payloads.
          logEvent("api.failure", { operation: handler.name,
            errorType: error instanceof TypeError ? "TypeError" : error instanceof Error ? "Error" : "Unknown" }, "error");
          response = Response.json({ error: message, requestId, retryable: true }, { status: 503, headers: { ...privateHeaders, "X-Studio-Request-Id": requestId } });
        }
      }
      const own = stampRequestId(response, requestId);
      logEvent("api.request", { method: request?.method, status: response.status, ms: Date.now() - started, ...(own ? { linkedRequestId: own } : {}) }, response.status >= 500 ? "error" : "info");
      return response;
    });
  };
}
