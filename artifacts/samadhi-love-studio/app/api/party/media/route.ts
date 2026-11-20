import { serverStorage as env } from "../../../server/storage";
import { studioAccess, privateWorkspace } from "../../../studio-access";
import { serveAudio } from "../../studio/audio-response";
import { readStudio, privateHeaders } from "../../studio/store";
import { eligibleSong, publicRelease, query } from "../../../community/store";
import { jamendoTrack, libraryAsset } from "../../../party/server";
import { traced } from "../../../server/request-context";
export const dynamic = "force-dynamic";
const fail = (error: string, status = 404) =>
  Response.json({ error }, { status, headers: privateHeaders });
async function GETHandler(request: Request) {
  const access = await studioAccess();
  if (!access.id) return fail("Sign in to play party audio.", 401);
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  try {
    if (id.startsWith("mine:")) {
      const workspace = await privateWorkspace();
      if (!workspace) return fail("Private recording unavailable.");
      const { data } = await readStudio(workspace.id);
      const song = data?.songs.find((s) => "mine:" + s.id === id);
      if (song && params.get("v") !== (song.audioId ?? song.id))
        return fail(
          "This original recording changed. Reopen the party before downloading.",
          409,
        );
      return eligibleSong(song)
        ? serveAudio(
            request,
            workspace.id,
            song.audioId ?? song.id,
            song.audioFormat,
          )
        : fail("Recording unavailable.");
    }
    if (id.startsWith("release:")) {
      const release = await publicRelease(id.slice(8));
      const stationOwner = await query(
        "select owner from listener_station where id = 'subscriber'",
      ).first<string>("owner");
      if (
        release &&
        release.owner !== access.id &&
        release.owner !== stationOwner
      )
        return fail("This recording is outside the Party Mix catalog.");
      if (release && params.get("v") !== release.recording)
        return fail(
          "This shared recording changed. Reopen the party before downloading.",
          409,
        );
      return release
        ? serveAudio(
            request,
            release.owner,
            release.recording,
            release.song.audioFormat!,
          )
        : fail("This recording is no longer shared.");
    }
    const track = await libraryAsset(id);
    if (!track)
      return fail("This library track was removed or is not approved.");
    if (params.get("v") !== track.revision)
      return fail("This library recording changed. Reopen the party.", 409);
    const key = params.has("video") ? track.videoKey : track.audioKey;
    if (key) {
      const file = await env.BUCKET?.get(key);
      if (!file) return fail("Library file unavailable.");
      const headers = new Headers(privateHeaders);
      file.writeHttpMetadata(headers);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Content-Length", String(file.size));
      return new Response(file.body, { headers });
    }
    if (params.has("video"))
      return fail("No licensed video was supplied for this track.");
    // Refresh Jamendo permission at download time, including cached metadata URLs.
    const current =
      track.source === "Jamendo"
        ? await jamendoTrack(id.replace("jamendo:", ""))
        : track;
    if (!current.audioUrl)
      return fail("This track needs an uploaded audio file.");
    const url = new URL(current.audioUrl);
    const hosts =
      track.source === "Jamendo"
        ? /(^|\.)jamendo\.com$/
        : /(^|\.)ccmixter\.org$/;
    if (url.protocol !== "https:" || !hosts.test(url.hostname))
      return fail("The source download is not supported.");
    const response = await fetch(url, {
      signal: AbortSignal.timeout(45000),
      redirect: "error",
    });
    if (!response.ok || !response.body)
      return fail(
        "The source download is unavailable. Ask the curator to review it.",
        502,
      );
    const length = Number(response.headers.get("content-length"));
    if (!length || length > 50 * 1024 * 1024)
      return fail("The source must supply a file size up to 50 MB.", 422);
    return new Response(response.body, {
      headers: {
        ...privateHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Length": String(length),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail(
      "The music source could not be reached. Cached copies can be played from your offline library.",
      502,
    );
  }
}
export const GET=traced(GETHandler);
