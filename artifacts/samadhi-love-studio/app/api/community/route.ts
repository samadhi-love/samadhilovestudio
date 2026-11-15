import {env} from "cloudflare:workers";
import {publicRelease} from "../../community/store";
import { publicListener } from "../../community/public-listener";
import { privateWorkspace, studioAccess } from "../../studio-access";
import { engage, problem, reply, streamRelease } from "../../community/engagement";
import { manageRelease, moderate } from "../../community/manage";
import { loadArtistDashboard, loadCommunity, loadModeration, validId } from "../../community/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const access = await studioAccess();
    if (params.has("moderation")) {
      if (access.role !== "owner") return problem("Owner access is required.", 403);
      return reply(await loadModeration());
    }
    if (params.has("dashboard")) {
      const workspace = await privateWorkspace();
      if (!workspace) return problem("Sign in to your artist workspace.", 403);
      return reply(await loadArtistDashboard(workspace.id));
    }
    const cover=params.get("cover");
    if(validId(cover)){const release=await publicRelease(cover),asset=release?.song.coverAsset;if(!release||!asset)return problem("Cover unavailable.",404);const object=await env.BUCKET?.get(`lyric-assets/${encodeURIComponent(release.owner)}/${release.songId}/${asset}`);if(!object)return problem("Cover unavailable.",404);return new Response(object.body,{headers:{"Content-Type":"image/png","Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff"}});}
    const audio = params.get("audio");
    if (validId(audio)) {
      let viewer = access.id;
      if (!viewer && params.has("ticket")) { try { viewer = (await publicListener(request)).viewer; } catch { /* Playback remains available if counting is unavailable. */ } }
      return await streamRelease(request, audio, viewer, params.get("ticket"));
    }
    const song = params.get("song");
    const artist = params.get("artist");
    return reply(await loadCommunity(access.id, validId(song) ? song : null, validId(artist) ? artist : null, { page: Number(params.get("page")) || 1, search: params.get("search") ?? "",genre:params.get("genre")??"" }));
  } catch (error) {
    console.error("Community read failed", error);
    return problem("Community could not load. Try again.", 503);
  }
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return problem("Open the Studio directly to make this change.", 403);
  const access = await studioAccess();
  if (!request.headers.get("content-type")?.startsWith("application/json")) return problem("Invalid community request.");
  const reader = request.body?.getReader();
  if (!reader) return problem("Invalid community request.");
  const decoder = new TextDecoder();
  let size = 0;
  let raw = "";
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      size += chunk.value.byteLength;
      if (size > 4096) { await reader.cancel(); return problem("This request is too long.", 413); }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
    let input;
    try { input = JSON.parse(raw); } catch { return problem("Invalid community request."); }
    if (!input || typeof input !== "object" || Array.isArray(input)) return problem("Invalid community request.");
    if (!access.id) {
      if (input.action !== "start" && input.action !== "listen") return problem("Sign in to take part in the community.", 401);
      let listener;
      try { listener = await publicListener(request, input.action === "start"); }
      catch { return input.action === "start" ? reply({ token: null }) : problem("Play counting is temporarily unavailable.", 503); }
      if (!listener.viewer) return problem("Start the song again to count this play.", 409);
      const response = await engage(listener.viewer, input);
      if (listener.cookie) response.headers.set("Set-Cookie", listener.cookie);
      return response;
    }
    if (["moderate-comment", "moderate-release", "close-report"].includes(input.action))
      return access.role === "owner" ? await moderate(input) : problem("Owner access is required.", 403);
    if (["profile", "publish", "unlist"].includes(input.action)) {
      const workspace = await privateWorkspace();
      return workspace ? await manageRelease(workspace.id, input) : problem("Sign in to your artist workspace.", 403);
    }
    return await engage(access.id, input);
  } catch (error) {
    console.error("Community change failed", error);
    return problem("The change could not be saved. Try again.", 503);
  } finally {
    reader.releaseLock();
  }
}

export async function HEAD(request: Request) {
  return new URL(request.url).searchParams.has("audio") ? GET(request) : new Response(null, { status: 405 });
}
