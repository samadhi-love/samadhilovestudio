import { NotImageError, imageSignatureCheck } from "../../../image-signature";
import { serverStorage as env } from "../../../server/storage";
import { privateWorkspace } from "../../../studio-access";
import { isExplicitSong } from "../../../clean-content";
import { serveAudio } from "../audio-response";
import { privateHeaders, readStudio } from "../store";
import { recoverableRoute } from "../request-errors";
import {maxPrivateVideoBytes,uploadVideoChunks,videoUploadStatus} from "../../../server/video-upload";
export const dynamic = "force-dynamic";
const validId = (id: unknown): id is string =>
  typeof id === "string" && /^[\w-]{1,100}$/.test(id);
export const lyricAssetKey = (owner: string, song: string, asset: string) =>
  `lyric-assets/${encodeURIComponent(owner)}/${song}/${asset}`;
const problem = (error: string, status: number) =>
  Response.json({ error }, { status, headers: privateHeaders });
const kinds: Record<string, string[]> = {
  background: ["image/png", "image/jpeg", "image/webp"],
  logo: ["image/png", "image/webp"],
  analysis: ["audio/wav"],
  soundtrack: ["audio/wav"],
  vocal: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/flac", "audio/ogg"],
  reference: ["audio/webm", "audio/wav", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/flac"],
  stems: ["application/zip"],
  video: ["video/mp4", "video/webm"],
  sourceVideo: ["video/mp4", "video/webm", "video/quicktime"],
};
async function saveAsset(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to save project media.", 401);
  if(request.headers.get("X-Studio-Workspace")&&request.headers.get("X-Studio-Workspace")!==access.id)
    return problem("Your signed-in account changed. Reopen your own Studio before saving this video.",409);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return problem("Open Studio directly to save media.", 403);
  const songId = request.headers.get("X-Song-Id"),
    kind = request.headers.get("X-Asset-Kind") ?? "",
    type = (request.headers.get("Content-Type") ?? "").split(";")[0].trim().toLowerCase();
  const size = Number(request.headers.get("X-Asset-Size"));
  const query=new URL(request.url).searchParams;
  const chunkUpload=kind==="video"&&query.has("upload");
  const metadataOnly=chunkUpload&&(query.get("upload")==="init"||query.get("complete")==="1");
  if (
    !validId(songId) ||
    !kinds[kind]?.includes(type) ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > (kind==="video"?maxPrivateVideoBytes:120 * 1024 * 1024) ||
    (!request.body&&!metadataOnly)
  )
    return problem("Choose a supported file: videos up to 512 MB, other media up to 120 MB.", 400);
  if (["background", "logo"].includes(kind) && size > 15 * 1024 * 1024)
    return problem("Choose an image up to 15 MB.", 413);
  const { data } = await readStudio(access.id);
  const song = data?.songs.find((s) => s.id === songId && !s.deletedAt);
  if (!song || isExplicitSong(song))
    return problem("Choose an available song in your Studio.", 404);
  const source =
    request.headers.get("X-Source-Audio-Id") ?? song.audioId ?? song.id;
  if (
    source !== (song.audioId ?? song.id) &&
    !song.audioHistory?.some((a) => a.audioId === source)
  )
    return problem("That source recording is unavailable.", 409);
  const bucket = env.BUCKET;
  if (!bucket) return problem("Project media storage is unavailable.", 503);
  if(chunkUpload)return uploadVideoChunks(request,access.id,songId,source,size,type);
  const windowStart=request.headers.get("X-Window-Start"),windowEnd=request.headers.get("X-Window-End");
  if((windowStart!==null||windowEnd!==null)&&(kind!=="analysis"||windowStart===null||windowEnd===null||!Number.isFinite(Number(windowStart))||!Number.isFinite(Number(windowEnd))||Number(windowStart)<0||Number(windowEnd)<=Number(windowStart)||Number(windowEnd)>600.1))
    return problem("Choose a valid audio excerpt for this alignment.",400);
  if(!request.body)return problem("Choose a non-empty project file.",400);
  if(size>120*1024*1024)return problem("Save this full-length video using the chunked video uploader.",413);
  const id = crypto.randomUUID(),
    key = lyricAssetKey(access.id, songId, id),
    stream = new FixedLengthStream(size);
  const picture = kind === "background" || kind === "logo";
  const check = picture ? imageSignatureCheck(kinds[kind]) : undefined;
  const body = check ? request.body.pipeThrough(check) : request.body;
  try {
    await Promise.all([
      body.pipeTo(stream.writable),
      bucket.put(key, stream.readable, {
        httpMetadata: { contentType: type },
        customMetadata: {
          song: songId,
          kind,
          source,
          ...(windowStart!==null&&windowEnd!==null?{windowStart,windowEnd}:{}),
          createdAt: new Date().toISOString(),
        },
      }),
    ]);
    return Response.json({ id, kind, size }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof NotImageError || check?.state.refused) { await bucket.delete(key).catch(() => {}); return problem(new NotImageError().message, 415); }
    return problem(
      "The file could not save. Your original recording is unchanged. Try again.",
      502,
    );
  }
}
async function getAsset(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to open project media.", 401);
  if(request.headers.get("X-Studio-Workspace")&&request.headers.get("X-Studio-Workspace")!==access.id)
    return problem("Your signed-in account changed. Reopen your own Studio before resuming this video.",409);
  const url = new URL(request.url),
    songId = url.searchParams.get("song"),
    id = url.searchParams.get("asset"),
    source = url.searchParams.get("source");
  if (!validId(songId)) return problem("Choose a song.", 400);
  const { data } = await readStudio(access.id);
  const song = data?.songs.find((s) => s.id === songId && !s.deletedAt);
  if (!song || isExplicitSong(song))
    return problem("Project media not found.", 404);
  if(url.searchParams.has("upload")){
    const recording=source??song.audioId??song.id;
    if(recording!==(song.audioId??song.id)&&!song.audioHistory?.some(a=>a.audioId===recording))
      return problem("That source recording is unavailable.",409);
    if(url.searchParams.get("upload")==="identity")return Response.json({workspace:access.id,source:recording},{headers:privateHeaders});
    return videoUploadStatus(request,access.id,songId,recording);
  }
  if (url.searchParams.get("videos") === "1") {
    const cursor = url.searchParams.get("cursor");
    if (cursor !== null && (!cursor || cursor.length > 2048)) return problem("Invalid saved-video page.", 400);
    const bucket = env.BUCKET;
    if (!bucket) return problem("Saved video storage is temporarily unavailable.", 503);
    const assetPrefix = lyricAssetKey(access.id, songId, "");
    const options: R2ListOptions & { include: string[] } = { prefix: assetPrefix, include: ["customMetadata", "httpMetadata"], limit: 1000, ...(cursor ? { cursor } : {}) };
    const listing = await bucket.list(options);
    const videos = listing.objects.filter(o => o.customMetadata?.kind === "video" && o.customMetadata?.song === songId && ["video/mp4", "video/webm"].includes(o.httpMetadata?.contentType ?? "") && validId(o.key.slice(assetPrefix.length))).map(o => ({
      id: o.key.slice(assetPrefix.length), at: o.customMetadata?.createdAt ?? o.uploaded.toISOString(), source: o.customMetadata?.source ?? "", extension: o.httpMetadata?.contentType === "video/mp4" ? "mp4" : "webm", size: o.size,
    })).sort((a,b) => b.at.localeCompare(a.at));
    return Response.json({ videos, next: listing.truncated ? listing.cursor : null }, { headers: privateHeaders });
  }
  if (source) {
    const original =
      source === (song.audioId ?? song.id)
        ? song
        : song.audioHistory?.find((a) => a.audioId === source);
    if (!original?.audioFormat)
      return problem("That original recording is unavailable.", 404);
    return serveAudio(request, access.id, source, original.audioFormat);
  }
  if (!validId(id)) return problem("Choose a project file.", 400);
  const bucket = env.BUCKET;
  if (!bucket) return problem("Project media storage is unavailable.", 503);
  const key = lyricAssetKey(access.id, songId, id),
    info = await bucket.head(key);
  if (!info || info.customMetadata?.song !== songId)
    return problem("Project file not found.", 404);
  const headers = new Headers({
    ...privateHeaders,
    "Content-Type":
      info.httpMetadata?.contentType ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  });
  let offset = 0,
    length = info.size,
    status = 200;
  const range = request.headers.get("Range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/i.exec(range);
    offset = match?.[1]
      ? Number(match[1])
      : Math.max(0, info.size - Number(match?.[2]));
    const end =
      match?.[1] && match?.[2]
        ? Math.min(Number(match[2]), info.size - 1)
        : info.size - 1;
    if (
      !match ||
      (!match[1] && !match[2]) ||
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset > end
    ) {
      headers.set("Content-Range", `bytes */${info.size}`);
      return new Response(null, { status: 416, headers });
    }
    length = end - offset + 1;
    status = 206;
    headers.set("Content-Range", `bytes ${offset}-${end}/${info.size}`);
  }
  headers.set("Content-Length", String(length));
  if (request.method === "HEAD") return new Response(null, { status, headers });
  const file = await bucket.get(
    key,
    range ? { range: { offset, length } } : undefined,
  );
  return file
    ? new Response(file.body, { status, headers })
    : problem("Project file not found.", 404);
}
export const GET = recoverableRoute(getAsset, "This project file could not load. Try again; saved media is preserved.");
export const HEAD = GET;
export const POST = recoverableRoute(saveAsset, "Project media could not save. Keep this tab open and retry; original recordings are preserved.");
