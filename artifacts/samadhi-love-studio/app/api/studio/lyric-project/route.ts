import { serverStorage as env } from "../../../server/storage";
import { privateWorkspace } from "../../../studio-access";
import { isExplicitSong } from "../../../clean-content";
import {changedCaptionProblem} from "../../../caption-edit-continuity";
import { isLyricProject, type LyricProject } from "../../../lyric-video-data";
import { type ProVersion } from "../../../lyric-pro-data";
import { readBoundedText, recoverableRoute } from "../request-errors";
import {
  privateHeaders,
  readStudio,
  writeStudio,
  maxStudioBytes,
} from "../store";
export const dynamic = "force-dynamic";
const valid = (s: unknown): s is string =>
  typeof s === "string" && /^[\w-]{1,100}$/.test(s);
const problem = (error: string, status: number) =>
  Response.json({ error }, { status, headers: privateHeaders });
const prefix = (owner: string, song: string) =>
  `lyric-projects/${encodeURIComponent(owner)}/${song}/`;
async function getProject(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to open this project.", 401);
  const url = new URL(request.url),
    songId = url.searchParams.get("song"),
    version = url.searchParams.get("version"),
    cursor = url.searchParams.get("cursor");
  if (!valid(songId) || (version && !valid(version)))
    return problem("Choose a saved project.", 400);
  if (cursor !== null && (!cursor || cursor.length > 2048)) return problem("Invalid history page.", 400);
  const { data } = await readStudio(access.id);
  const song = data?.songs.find((s) => s.id === songId && !s.deletedAt);
  if (!song || isExplicitSong(song)) return problem("Project not found.", 404);
  if (version) {
    const object = await env.BUCKET?.get(
      prefix(access.id, songId) + version + ".json",
    );
    if (!object) return problem("That version is unavailable.", 404);
    return new Response(object.body, {
      headers: { ...privateHeaders, "Content-Type": "application/json" },
    });
  }
  const listOptions: R2ListOptions & { include: string[] } = {
    prefix: prefix(access.id, songId),
    include: ["customMetadata"],
    limit: 1000,
    ...(cursor ? { cursor } : {}),
  };
  if (!env.BUCKET) return problem("Saved video history is temporarily unavailable. Your project is unchanged.", 503);
  const listed = await env.BUCKET.list(listOptions);
  const versions: ProVersion[] = (listed?.objects ?? [])
    .map((o) => ({
      id: o.key
        .split("/")
        .pop()!
        .replace(/\.json$/, ""),
      name: o.customMetadata?.name ?? "Saved version",
      at: o.customMetadata?.at ?? o.uploaded.toISOString(),
      audioId: o.customMetadata?.audioId ?? "",
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
  return Response.json(
    {
      workspace: access.id,
      project: song.lyricVideo ?? null,
      versions,
      truncated: listed.truncated,
      next: listed.truncated ? listed.cursor : null,
    },
    { headers: privateHeaders },
  );
}
async function putProject(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to save this project.", 401);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return problem("Open Studio directly to save.", 403);
  const raw = await readBoundedText(request, 2_400_000);
  if (raw.length > 600000)
    return problem(
      "This project is too large to save. Remove unused analysis data.",
      413,
    );
  let input: {
    songId: string;
    project: LyricProject;
    expected?: string | null;
    snapshot?: boolean;
    label?: string;
  };
  try {
    input = JSON.parse(raw);
  } catch {
    return problem("Invalid project data.", 400);
  }
  if (
    !input || !valid(input.songId) ||
    !isLyricProject(input.project) ||
    !input.project.pro
  )
    return problem("Check the project settings and timing before saving.", 400);
  const p = input.project.pro;
  for(const photo of p.adPhotoStory?.photos??[]){const info=await env.BUCKET?.head(`lyric-assets/${encodeURIComponent(access.id)}/${input.songId}/${photo.asset}`);if(!info||info.customMetadata?.kind!=="background"||!info.httpMetadata?.contentType?.startsWith("image/"))return problem("Choose uploaded photos from this song’s private project.",400);}
  if(p.backgroundVideo){const info=await env.BUCKET?.head(`lyric-assets/${encodeURIComponent(access.id)}/${input.songId}/${p.backgroundVideo.asset}`);if(!info||info.customMetadata?.kind!=="sourceVideo"||!info.httpMetadata?.contentType?.startsWith("video/"))return problem("Choose an uploaded video from this song’s private project.",400);}

  if (
    p.sourceSongId !== input.songId ||
    !valid(p.sourceAudioId)
  )
    return problem("Check the project's lyrics and text.", 422);
  if (
    input.project.cues.some(
      (c) =>
        c.time >= p.duration ||
        (c.end !== undefined && c.end > p.duration + 0.01),
    )
  )
    return problem("Some captions extend beyond this recording.", 422);
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readStudio(access.id),
      song = current.data?.songs.find(
        (s) => s.id === input.songId && !s.deletedAt,
      );
    if (!current.data || !song || song.explicit===true)
      return problem("The source song is unavailable.", 404);
    const flagged=changedCaptionProblem(input.project,song.lyricVideo);
    if(flagged)return Response.json(flagged,{status:422,headers:privateHeaders});
    if (
      p.sourceAudioId !== (song.audioId ?? song.id) &&
      !song.audioHistory?.some((a) => a.audioId === p.sourceAudioId)
    )
      return problem(
        "This source recording is no longer available. Choose the song again.",
        409,
      );
    if ((song.lyricVideo?.pro?.updatedAt ?? null) !== (input.expected ?? null))
      return problem(
        "This video was edited in another tab. Reload the saved project before saving again.",
        409,
      );
    const at = new Date(Math.max(Date.now(),(Date.parse(song.lyricVideo?.pro?.updatedAt??"")||0)+1)).toISOString(),
      project = { ...input.project, pro: { ...p, updatedAt: at } };
    const next = {
        ...current.data,
        songs: current.data.songs.map((s) =>
          s.id === song.id ? { ...s, lyricVideo: project } : s,
        ),
      },
      content = JSON.stringify(next);
    if (new TextEncoder().encode(content).length > maxStudioBytes)
      return problem(
        "Studio storage is full. Download editable project data before trying again.",
        413,
      );
    const saved = await writeStudio(access.id, current.revision, content).catch(error=>{
      if(error instanceof Error&&/malformed JSON|revision.conflict/i.test(error.message))return undefined;
      throw error;
    });
    if (!saved) continue;
    let snapshotId: string | undefined, warning: string | undefined;
    if (input.snapshot) {
      snapshotId = crypto.randomUUID();
      try {
        if (!env.BUCKET) throw new Error();
        await env.BUCKET.put(
          prefix(access.id, song.id) + snapshotId + ".json",
          JSON.stringify(project),
          {
            httpMetadata: { contentType: "application/json" },
            customMetadata: {
              name:
                typeof input.label === "string"
                  ? input.label.slice(0, 100)
                  : p.name,
              at,
              audioId: p.sourceAudioId,
            },
          },
        );
      } catch {
        warning =
          "The project saved, but its history snapshot could not save. Try Save version again.";
      }
    }
    return Response.json(
      { project, ...await readStudio(access.id), snapshotId, warning },
      { headers: privateHeaders },
    );
  }
  return problem(
    "Another save happened at the same time. Your edits are still here; try again.",
    409,
  );
}

/** Attach an uploaded mix without fetching external listening links or replacing its source song. */
async function attachMix(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to attach a saved mix.", 401);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return problem("Open Studio directly to attach a mix.", 403);
  const raw = await readBoundedText(request, 8000);
  if (raw.length > 2000) return problem("Invalid mix attachment.", 413);
  let input: { sourceSongId: string; mixId: string; audioSongId: string };
  try {
    input = JSON.parse(raw);
  } catch {
    return problem("Invalid mix attachment.", 400);
  }
  if (
    !input || !valid(input.sourceSongId) ||
    !valid(input.mixId) ||
    !valid(input.audioSongId) ||
    input.sourceSongId === input.audioSongId
  )
    return problem("Choose the source mix and its uploaded audio.", 400);
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readStudio(access.id),
      source = current.data?.songs.find(
        (s) => s.id === input.sourceSongId && !s.deletedAt,
      ),
      audio = current.data?.songs.find(
        (s) => s.id === input.audioSongId && !s.deletedAt,
      );
    if (
      !current.data ||
      !source ||
      !audio?.audioFormat ||
      isExplicitSong(source) ||
      isExplicitSong(audio) ||
      !source.mixes.some((m) => m.id === input.mixId)
    )
      return problem("The mix or uploaded recording is unavailable.", 404);
    const next = {
      ...current.data,
      songs: current.data.songs.map((s) =>
        s.id === source.id
          ? {
              ...s,
              mixes: s.mixes.map((m) =>
                m.id === input.mixId ? { ...m, audioSongId: audio.id } : m,
              ),
            }
          : s.id === audio.id
            ? {
                ...s,
                notes: {
                  ...s.notes,
                  lyrics: source.notes.lyrics,
                  prompt: source.notes.prompt,
                  vocals: source.notes.vocals,
                },
              }
            : s,
      ),
    };
    const content = JSON.stringify(next);
    if (new TextEncoder().encode(content).length > maxStudioBytes)
      return problem("Studio storage is full.", 413);
    const saved = await writeStudio(access.id, current.revision, content);
    if (saved)
      return Response.json(
        { ...await readStudio(access.id) },
        { headers: privateHeaders },
      );
  }
  return problem("A newer edit arrived. Try attaching this mix again.", 409);
}

export const GET = recoverableRoute(getProject, "The saved video project could not load. Try again; existing versions are preserved.");
export const PUT = recoverableRoute(putProject, "The video project could not save. Keep this tab open and retry; existing versions are preserved.");
export const PATCH = recoverableRoute(attachMix, "The mix could not attach. Keep your edits and retry.");
