import { privateWorkspace } from "../../studio-access";
import { createSongShare, ownSongShare, resolveSongShare, revokeSongShare, sharePath, validShareToken } from "../../song-sharing";
import { privateHeaders } from "../studio/store";
import { readBoundedText, recoverableRoute } from "../studio/request-errors";
import { serveAudio } from "../studio/audio-response";
import { validId } from "../../community/store";

export const dynamic = "force-dynamic";
const reply = (data: object, status = 200) => Response.json(data, { status, headers: { ...privateHeaders, "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" } });
async function getShare(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = params.get("token");
  if (token !== null) {
    const shared = validShareToken(token) ? await resolveSongShare(token) : null;
    if (!shared) return reply({ error: "This listening link is unavailable or was revoked." }, 404);
    if (params.has("audio")) {
      const response = await serveAudio(request, shared.grant.owner, shared.grant.recording, shared.song.audioFormat!);
      response.headers.set("Referrer-Policy", "no-referrer");
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
    return reply({ title: shared.song.name, artist: shared.artist, audio: "/api/song-share?token=" + token + "&audio=1" });
  }
  const workspace = await privateWorkspace();
  if (!workspace) return reply({ error: "Sign in to your own Studio." }, 401);
  const songId = params.get("song");
  if (!validId(songId)) return reply({ error: "Choose your song." }, 400);
  const current = await ownSongShare(workspace.id, songId);
  const active = current?.token && await resolveSongShare(current.token);
  return reply({ path: active ? sharePath(current.token!) : null });
}
async function changeShare(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Open Studio directly to change sharing." }, 403);
  const workspace = await privateWorkspace();
  if (!workspace) return reply({ error: "Sign in to your own Studio." }, 401);
  let input;
  try { input = JSON.parse(await readBoundedText(request, 2048)); } catch { return reply({ error: "Invalid sharing request." }, 400); }
  if (!validId(input?.songId)) return reply({ error: "Choose your song." }, 400);
  if (input.action === "revoke") {
    await revokeSongShare(workspace.id, input.songId);
    return reply({ path: null });
  }
  if (input.action !== "create" || input.confirmedRights !== true) return reply({ error: "Confirm that you have permission to share this recording." }, 400);
  const grant = await createSongShare(workspace.id, input.songId);
  return grant ? reply({ path: sharePath(grant.token) }) : reply({ error: "Choose your own ready, reviewed recording." }, 404);
}
export const GET = recoverableRoute(getShare, "Sharing could not load. Try again.");
export const HEAD = GET;
export const POST = recoverableRoute(changeShare, "Sharing could not save. Reload its status before retrying.");
