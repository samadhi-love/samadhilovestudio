import { privateHeaders } from "./store";

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

/** Infrastructure failures must reach clients as recoverable JSON, never an HTML error page. */
export function recoverableRoute<T extends unknown[]>(handler: (...args: T) => Promise<Response>, message: string) {
  return async (...args: T): Promise<Response> => {
    try { return await handler(...args); }
    catch (error) {
      if (error instanceof RequestBodyError)
        return Response.json({ error: error.message }, { status: error.status, headers: privateHeaders });
      const requestId = crypto.randomUUID();
      // Do not log request bodies, credentials, lyrics, or provider error payloads.
      console.error("Studio operation unavailable", { operation: handler.name, requestId });
      return Response.json({ error: message, requestId, retryable: true }, { status: 503, headers: { ...privateHeaders, "X-Studio-Request-Id": requestId } });
    }
  };
}
