import { withProductionUsage, managedProviderKey } from "../../../credits/production";
import { serverStorage as env } from "../../../server/storage";
import { privateWorkspace } from "../../../studio-access";
import { reserveCreatorGeneration } from "../../../creator-accounts";
import { isExplicitSong } from "../../../clean-content";
import { isAudioFormat, maxAudioBytes } from "../../../studio-data";
import { sendProviderAudio } from "../elevenlabs/audio-upload";
import { elevenLabsFailureMessage } from "../elevenlabs/provider";
import { resolveElevenLabsKey } from "../elevenlabs/vault";
import { audioKey, privateHeaders, readStudio } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";

export const dynamic = "force-dynamic";
const problem = (error: string, status: number) => Response.json({ error }, { status, headers: privateHeaders });

async function separateStems(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to your artist workspace to separate stems.", 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return problem("Open Studio directly to separate stems.", 403);
  const raw = await readBoundedText(request, 8192);
  if (raw.length > 2048) return problem("Invalid stem request.", 413);
  let input: { songId?: string; audioId?: string; mode?: string; confirmed?: boolean } | null;
  try { input = JSON.parse(raw); } catch { return problem("Invalid stem request.", 400); }
  if (input?.confirmed !== true || (input.mode !== "two_stems_v1" && input.mode !== "six_stems_v1"))
    return problem("Choose the stem count and confirm sending your recording to ElevenLabs.", 400);
  try {
    const key = managedProviderKey(request) ?? await resolveElevenLabsKey(access.id);
    if (!key) return problem("Connect ElevenLabs in Settings → AI Music Providers.", 400);
    const { data } = await readStudio(access.id);
    const song = data?.songs.find(item => item.id === input.songId && !item.deletedAt);
    if (!song?.audioFormat || !isAudioFormat(song.audioFormat) || isExplicitSong(song))
      return problem("Choose a clean recording in your Studio.", 404);
    const requestedAudio = input.audioId ?? song.audioId ?? song.id;
    const format = requestedAudio === (song.audioId ?? song.id) ? song.audioFormat : song.audioHistory?.find(a => a.audioId === requestedAudio)?.audioFormat;
    if (!format || !isAudioFormat(format)) return problem("This recording version is unavailable. Reopen it and try again.", 409);
    const audio = await env.BUCKET?.get(audioKey(access.id, requestedAudio));
    if (!audio || !audio.size || audio.size > maxAudioBytes) return problem("Choose an available recording up to 96 MB.", 422);
    if (access.role === "creator" && !managedProviderKey(request) && !await reserveCreatorGeneration(access.id))
      return problem("This creator account reached its daily provider attempt limit.", 429);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(240_000)]);
    const response = await sendProviderAudio(audio, format, key, { stem_variation_id: input.mode },
      "music/stem-separation?output_format=mp3_44100_128", signal);
    if (!response.ok) return problem(await elevenLabsFailureMessage(response, "music"), 502);
    if (!response.body || !/^(application\/(zip|x-zip-compressed|octet-stream)|binary\/octet-stream)(?:;|$)/i.test(response.headers.get("content-type") ?? ""))
      return problem("ElevenLabs did not return a stem archive.", 502);
    return new Response(response.body, { headers: { ...privateHeaders, "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="stems.zip"', "X-Content-Type-Options": "nosniff" } });
  } catch {
    return problem("Stem separation could not finish. Check the provider and try again.", 502);
  }
}
export const POST = withProductionUsage(recoverableRoute(separateStems, "Stem separation could not start. Your original recording is preserved; try again."));
