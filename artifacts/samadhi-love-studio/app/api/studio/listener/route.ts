import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { listenerStation } from "../../../../db/schema";
import { studioAccess } from "../../../studio-access";
import { isExplicitSong } from "../../../clean-content";
import { isAudioFormat, type Song } from "../../../studio-data";
import { serveAudio } from "../audio-response";
import { checkpointStudio, privateHeaders, readStudio } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";

export const dynamic = "force-dynamic";
const options = { headers: privateHeaders };
const stationId = "subscriber";

function problem(error: string, status: number) {
  return Response.json({ error }, { ...options, status });
}

function recordings(songs: Song[]) {
  return songs.filter(song => !song.deletedAt && !song.creationDraft && !isExplicitSong(song) && song.audioFormat && isAudioFormat(song.audioFormat));
}

function recordingGrant(song: Song) {
  return song.audioId ? `${song.id}:${song.audioId}` : song.id;
}

async function getListener(request: Request) {
  if ((await studioAccess()).role === "guest") return problem("Sign in to listen.", 401);
  const row = await getDb().select().from(listenerStation).where(eq(listenerStation.id, stationId)).get();
  const songs = row ? recordings((await readStudio(row.owner)).data?.songs ?? []) : [];
  const ids = row ? JSON.parse(row.trackIds) as string[] : [];
  const byGrant = new Map(songs.map(song => [recordingGrant(song), song]));
  const approved = ids.flatMap(grant => {
    const song = byGrant.get(grant);
    return song ? [song] : [];
  });
  const songId = new URL(request.url).searchParams.get("song");
  if (songId !== null) {
    const song = approved.find(song => song.id === songId);
    return row && song?.audioFormat ? serveAudio(request, row.owner, song.audioId ?? song.id, song.audioFormat) : problem("Recording unavailable.", 404);
  }
  const tracks = approved.map(song => ({ id: song.id, name: song.name }));
  return Response.json({ tracks }, options);
}

async function saveListener(request: Request) {
  const access = await studioAccess();
  if (access.role !== "owner") return problem("Owner access is required.", 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) return problem("Open the studio directly to save.", 403);
  const body = await readBoundedText(request, 64_000);
  if (body.length > 16000) return problem("The listener playlist is too long.", 413);
  let input: { ids?: unknown; versions?: Record<string, unknown> } | null;
  try { input = JSON.parse(body); } catch { return problem("Invalid playlist.", 400); }
  const ids = input?.ids;
  if (!Array.isArray(ids) || ids.length > 100 || ids.some(id => typeof id !== "string"))
    return problem("Choose up to 100 recordings.", 400);
  const eligible = new Map(recordings((await readStudio(access.id)).data?.songs ?? []).map(song => [song.id, song]));
  const tracks = [...new Set(ids)].map(id => eligible.get(id));
  if (tracks.some(track => !track || track.audioId !== input?.versions?.[track.id]))
    return problem("A recording changed. Reload and select it again before sharing.", 409);
  const trackIds = JSON.stringify(tracks.map(track => recordingGrant(track!)));
  try { await checkpointStudio(access.id); }
  catch (error) {
    console.error("Could not checkpoint listener settings", {requestId:crypto.randomUUID(),errorType:error instanceof TypeError?"TypeError":"Error",at:new Date().toISOString()});
    return problem("The station could not save your changes. Try again.", 503);
  }
  await getDb().insert(listenerStation).values({ id: stationId, owner: access.id, trackIds })
    .onConflictDoUpdate({ target: listenerStation.id, set: { owner: access.id, trackIds } });
  return Response.json({ saved: true }, options);
}

export const GET = recoverableRoute(getListener, "The listening room could not load. Try again shortly.");
export const PUT = recoverableRoute(saveListener, "The listening selection could not save. Reload and retry; existing grants are preserved.");
export const HEAD = GET;
