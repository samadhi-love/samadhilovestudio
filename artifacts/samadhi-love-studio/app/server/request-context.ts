/**
 * Traceability: one ID follows a request through the server, its background
 * job and every AI provider call it makes, so a single user action can be
 * reconstructed from the logs.
 *
 * Log lines are one JSON object each. Never put lyrics, prompts, keys, signed
 * URLs, cookies or raw provider/error text in a log field.
 */
import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = { requestId: string; route: string; jobId?: string };
type Field = string | number | boolean | undefined;

const store = new AsyncLocalStorage<RequestContext>();
const validId = /^[\w-]{8,64}$/;

export const currentRequest = () => store.getStore();

/** Reuse the browser's ID when it sent a safe one, otherwise make a new one. */
export function requestIdFor(request: Request | undefined) {
  const supplied = request?.headers.get("X-Studio-Request-Id");
  return supplied && validId.test(supplied) ? supplied : crypto.randomUUID();
}

export function withRequestContext<T>(context: RequestContext, run: () => T): T {
  return store.run(context, run);
}

/** Adds the job ID to the current context (e.g. a background song job). */
export function withJob<T>(jobId: string, run: () => T): T {
  const parent = store.getStore();
  return store.run({ requestId: parent?.requestId ?? jobId, route: parent?.route ?? "job", jobId }, run);
}

export function logEvent(event: string, fields: Record<string, Field> = {}, level: "info" | "error" = "info") {
  const context = store.getStore();
  const line = JSON.stringify({
    level, event, at: new Date().toISOString(),
    requestId: context?.requestId, jobId: context?.jobId, route: context?.route,
    ...fields,
  });
  if (level === "error") console.error(line); else console.log(line);
}

/** Puts the request ID on the response. A route that already returned its own
 * reference (e.g. a settings check or a crash report) keeps it; that ID is returned
 * so the log line links the two. */
export function stampRequestId(response: Response, requestId: string) {
  const existing = response.headers.get("X-Studio-Request-Id");
  if (existing && existing !== requestId) return existing.slice(0, 64);
  try { response.headers.set("X-Studio-Request-Id", requestId); } catch { /* immutable (proxied media) */ }
  return undefined;
}

/** Safe route label: replaces long IDs in a path so logs never carry private identifiers or URLs. */
export function routeLabel(path: string) {
  return path.split("/").map(part => /^[\w-]{16,}$/.test(part) && /\d/.test(part) ? ":id" : part).join("/").slice(0, 120);
}

/** Adds a request ID header and one "api.request" log line to a route handler without
 * changing how it answers or handles errors (a crash is logged, then re-thrown). */
export function traced<T extends unknown[]>(handler: (...args: T) => Response | Promise<Response>) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] instanceof Request ? args[0] : undefined;
    const requestId = requestIdFor(request), started = Date.now();
    const route = request ? routeLabel(new URL(request.url).pathname) : "studio";
    return withRequestContext({ requestId, route }, async () => {
      try {
        const response = await handler(...args);
        const own = stampRequestId(response, requestId);
        logEvent("api.request", { method: request?.method, status: response.status, ms: Date.now() - started, ...(own ? { linkedRequestId: own } : {}) }, response.status >= 500 ? "error" : "info");
        return response;
      } catch (error) {
        logEvent("api.request", { method: request?.method, status: 500, ms: Date.now() - started,
          errorType: error instanceof TypeError ? "TypeError" : error instanceof Error ? "Error" : "Unknown" }, "error");
        throw error;
      }
    });
  };
}
