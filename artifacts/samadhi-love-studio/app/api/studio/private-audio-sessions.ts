import { env } from "cloudflare:workers";
import { privateWorkspace } from "../../studio-access";
import { hasExplicitWords } from "../../clean-content";
import { maxAudioBytes } from "../../studio-data";
import { uuid } from "../../vocal/session";
import { privateHeaders, readStudio } from "./store";
import { readBoundedText, recoverableRoute } from "./request-errors";


const options = { headers: privateHeaders };
const problem = (error: string, status: number) => Response.json({ error }, { ...options, status });

export function privateAudioSessions<T extends { id: string; name: string; projectSongId?: string }>(config: {
  namespace: string; valid: (value: unknown) => value is T; names: (session: T) => string[]; sourceIds: (session: T) => string[]; maxMetadataChars?: number; linkedSongIds?: (session:T)=>string[];
}) {
async function handle(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to your private workspace.", 401);
  const bucket = env.BUCKET;
  if (!bucket) return problem("Audio session storage is temporarily unavailable.", 503);
  const url = new URL(request.url);
  const id = url.searchParams.get("session");
  const source = url.searchParams.get("source");
  if ((id !== null && !uuid(id)) || (source !== null && (!id || !uuid(source)))) return problem("Invalid session or recording.", 400);
  const prefix = `${config.namespace}/v1/${encodeURIComponent(access.id)}/`;
  const metadata = prefix + "sessions/" + id;
  const asset = prefix + "recordings/" + id + "/" + source;
  if (request.method === "GET") {
    if (!id) {
      const listing: R2ListOptions & { include: string[] } = { prefix: prefix + "sessions/", include: ["customMetadata"], limit: 100 };
      const cursor = url.searchParams.get("cursor");
      if (cursor && cursor.length > 2048) return problem("Invalid session page.", 400);
      const objects = await bucket.list({ ...listing, ...(cursor ? { cursor } : {}) });
      const sessions = objects.objects.map(item => ({
        id: item.key.slice((prefix + "sessions/").length), name: item.customMetadata?.title ?? "Vocal session",
        updated: item.uploaded.toISOString(),
      })).sort((a, b) => b.updated.localeCompare(a.updated));
      return Response.json({ sessions, next: objects.truncated ? objects.cursor : null }, options);
    }
    if (source) {
      const audio = await bucket.get(asset);
      return audio ? new Response(audio.body, { headers: { ...privateHeaders, "Content-Type": "application/octet-stream" } })
        : problem("This original recording is missing.", 404);
    }
    const session = await bucket.get(metadata);
    return session ? Response.json({ session: await session.json(), revision: session.etag }, options) : problem("Session not found.", 404);
  }

  if (request.headers.get("origin") !== url.origin) return problem("Open the studio directly to save.", 403);
  if (!id) return problem("Choose a vocal session.", 400);
  if (source) {
    const size = Number(request.headers.get("X-Audio-Size"));
    if (!request.body || !Number.isSafeInteger(size) || size < 1 || size > maxAudioBytes) return problem("Choose an audio file up to 96 MB.", 413);
    // Recording objects are immutable. Retrying an upload with the same ID cannot replace an original.
    if (await bucket.head(asset)) return Response.json({ saved: true }, options);
    const stream = new FixedLengthStream(size);
    const [, saved] = await Promise.all([
      request.body.pipeTo(stream.writable),
      bucket.put(asset, stream.readable, { onlyIf: { etagDoesNotMatch: "*" } }),
    ]);
    if (!saved) return problem("This original was saved by another request. Retry before saving the session; the existing original was not replaced.", 409);
    return Response.json({ saved: true }, options);
  }

  const maxMetadataChars = config.maxMetadataChars ?? 160_000;
  const raw = await readBoundedText(request, maxMetadataChars * 4);
  if (raw.length > maxMetadataChars) return problem("This session is too large. Reduce MIDI events or production notes before saving.", 413);
  let session: unknown;
  try { session = JSON.parse(raw); } catch { return problem("Invalid session data.", 400); }
  if (!config.valid(session) || session.id !== id) return problem("Check clip timing and session settings.", 400);
  const linkedSongs=[...(session.projectSongId?[session.projectSongId]:[]),...(config.linkedSongIds?.(session)??[])];
  if(linkedSongs.length){const songs=(await readStudio(access.id)).data?.songs??[];if(linkedSongs.some(id=>!songs.some(song=>song.id===id&&!song.deletedAt)))return problem("Choose existing project and visual sources in your own workspace.",400);}
  if (hasExplicitWords(session.name, ...config.names(session)))
    return problem("Choose clean names for the session, clips, and presets.", 422);
  const originals = await Promise.all(config.sourceIds(session).map(sourceId => bucket.head(prefix + "recordings/" + id + "/" + sourceId)));
  if (originals.some(source => !source)) return problem("An original recording has not finished uploading. Retry the save.", 409);
  const revision = request.headers.get("If-Match");
  const saved = await bucket.put(metadata, raw, {
    customMetadata: { title: session.name, ...(session.projectSongId && { projectSongId: session.projectSongId }) },
    httpMetadata: { contentType: "application/json" },
    onlyIf: revision ? { etagMatches: revision } : { etagDoesNotMatch: "*" },
  });
  return saved ? Response.json({ revision: saved.etag }, options)
    : problem("This session changed in another tab. Open the latest version or save your edits as a new session.", 409);
}

const route = recoverableRoute(handle, "The audio session could not sync. Keep your edits and retry.");

return { GET: route, PUT: route };
}
