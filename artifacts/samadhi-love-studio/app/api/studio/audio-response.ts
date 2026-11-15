import { env } from "cloudflare:workers";
import { audioTypes, type AudioFormat } from "../../studio-data";
import { audioKey, privateHeaders } from "./store";

function problem(error: string, status: number) {
  return Response.json({ error }, { status, headers: privateHeaders });
}

export async function serveAudio(request: Request, id: string, songId: string, format: AudioFormat) {
  const bucket = env.BUCKET;
  if (!bucket) return problem("Audio storage is temporarily unavailable.", 503);
  const key = audioKey(id, songId);
  const range = request.headers.get("Range");
  const headers = new Headers({
    "Cache-Control": "private, no-store, no-transform",
    "Accept-Ranges": "bytes",
    "Content-Type": audioTypes[format],
    "X-Content-Type-Options": "nosniff",
  });
  if (range || request.method === "HEAD") {
    const info = await bucket.head(key);
    if (!info) return problem("Audio not found.", 404);
    if (!range) {
      headers.set("Content-Length", String(info.size));
      return new Response(null, { headers });
    }
    const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
    const start = match?.[1] ? Number(match[1]) : Math.max(0, info.size - Number(match?.[2]));
    const end = match?.[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || start > end) {
      headers.set("Content-Range", `bytes */${info.size}`);
      return new Response(null, { status: 416, headers });
    }
    const length = end - start + 1;
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
    headers.set("Content-Length", String(length));
    if (request.method === "HEAD") return new Response(null, { status: 206, headers });
    const audio = await bucket.get(key, { range: { offset: start, length } });
    if (!audio) return problem("Audio not found.", 404);
    return new Response(audio.body, { status: 206, headers });
  }

  const audio = await bucket.get(key);
  if (!audio) return problem("Audio not found.", 404);
  headers.set("Content-Length", String(audio.size));
  return new Response(audio.body, { headers });
}
