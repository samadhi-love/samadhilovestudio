import { env } from "cloudflare:workers";
import { privateWorkspace } from "../../../studio-access";
import { isExplicitSong } from "../../../clean-content";
import { privateHeaders, readStudio, audioKey } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";
import { validRecognitionWav, validRightsReview, type RecordingMatch } from "../../../rights-data";
export const dynamic = "force-dynamic";
const problem = (error: string, status: number) => Response.json({ error }, { status, headers: privateHeaders });
const json = (value: unknown) => Response.json(value, { headers: privateHeaders });
const id = (value: unknown): value is string => typeof value === "string" && /^[\w-]{1,100}$/.test(value);
async function handle(request: Request) {
  const access = await privateWorkspace(); if (!access) return problem("Sign in to review your recording rights.",401);
  const url = new URL(request.url), songId = url.searchParams.get("song"), audioId = url.searchParams.get("audio");
  if (!id(songId) || !id(audioId)) return problem("Choose a saved recording version.",400);
  if (request.method !== "GET" && request.headers.get("origin") !== url.origin) return problem("Open Studio directly to review rights.",403);
  const { data } = await readStudio(access.id), song = data?.songs.find(s => s.id === songId && !s.deletedAt && !isExplicitSong(s));
  if (!song?.audioFormat || ((song.audioId ?? song.id) !== audioId && !song.audioHistory?.some(a => a.audioId === audioId))) return problem("That recording is unavailable in your account.",404);
  const bucket = env.BUCKET; if (!bucket) return problem("Private review storage is unavailable.",503);
  const prefix = `rights/v1/${encodeURIComponent(access.id)}/${songId}/${audioId}/`;
  if (request.method === "GET") {
    const [review, listing] = await Promise.all([bucket.get(prefix+"review"), bucket.list({ prefix: prefix+"checks/", limit: 100 })]);
    const checks = await Promise.all(listing.objects.slice(-30).map(async o => (await bucket.get(o.key))?.json()));
    return json({ available: !!env.AUDD_API_TOKEN, review: review ? await review.json() : null, checks: checks.filter(Boolean), truncated: listing.truncated });
  }
  if (request.method === "PUT") {
    const raw = await readBoundedText(request,32000); if (raw.length > 8000) return problem("Keep permission notes below 4,000 characters.",413);
    let review: unknown; try { review = JSON.parse(raw); } catch { return problem("Invalid rights review.",400); }
    if (!validRightsReview(review)) return problem("Check the source and permission fields.",400);
    const saved = { recording: review.recording, composition: review.composition, voices: review.voices, notes: review.notes, reviewedAt: new Date().toISOString() };
    await bucket.put(prefix+"review",JSON.stringify(saved),{ httpMetadata: { contentType: "application/json" } }); return json({ review: saved });
  }
  if (request.headers.get("X-Recognition-Consent") !== "yes") return problem("Confirm sending audio excerpts to AudD before checking.",400);
  if (!env.AUDD_API_TOKEN) return problem("Recording matching is not connected. The Studio owner must configure an AudD account token; manual rights review remains available.",503);
  const start = Number(request.headers.get("X-Excerpt-Start")), size = Number(request.headers.get("Content-Length"));
  if (!Number.isFinite(start) || start < 0 || start > 600 || size > 530000 || request.headers.get("Content-Type") !== "audio/wav") return problem("Choose a short PCM WAV excerpt.",400);
  if (!await bucket.head(audioKey(access.id,audioId))) return problem("The original recording is unavailable.",404);
  const reader = request.body?.getReader(); if (!reader) return problem("Choose an audio excerpt.",400);
  const chunks: Uint8Array[] = []; let total=0;
  for (;;) { const part=await reader.read(); if(part.done)break; total+=part.value.length; if(total>530000){await reader.cancel();return problem("Audio excerpts must be at most 12 seconds.",413);}chunks.push(part.value); }
  const bytes=new Uint8Array(total);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
  if (!validRecognitionWav(bytes)) return problem("Choose a mono 22.05 kHz PCM excerpt between half a second and 12 seconds.",400);
  const digest=await crypto.subtle.digest("SHA-256",bytes), hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
  const cacheKey=prefix+"checks/"+String(Math.round(start*1000)).padStart(9,"0")+"-"+hash, cached=await bucket.get(cacheKey); if(cached)return json({check:await cached.json(),cached:true});
  // Atomic per-account daily budget: concurrent requests cannot silently exceed the limit.
  const dailyKey=`rights/v1/${encodeURIComponent(access.id)}/budget/${new Date().toISOString().slice(0,10)}`;
  const old=await bucket.get(dailyKey), count=old ? (await old.json<{count:number}>()).count : 0;
  if(count>=12)return problem("Today's 12 excerpt-check attempts are used. Saved reviews and results remain available.",429);
  const reserved=await bucket.put(dailyKey,JSON.stringify({count:count+1}),{onlyIf:old?{etagMatches:old.etag}:{etagDoesNotMatch:"*"}});
  if(!reserved)return problem("Another recognition request is starting. Try again shortly.",429);
  const form=new FormData();form.set("api_token",env.AUDD_API_TOKEN);form.set("file",new Blob([bytes],{type:"audio/wav"}),"excerpt.wav");
  const response=await fetch("https://api.audd.io/",{method:"POST",body:form,signal:AbortSignal.any([request.signal,AbortSignal.timeout(45000)])});
  if(!response.ok)return problem("AudD could not complete this check. No copyright clearance was issued.",502);
  const result=await response.json<{status?:string;result?:null|Record<string,unknown>}>();
  if(result.status!=="success" || result.result===undefined)return problem("AudD returned an unavailable or invalid recognition result. Try again later.",502);
  const match=result.result;
  if(match && (typeof match.title!=="string" || typeof match.artist!=="string"))return problem("The recognition response was incomplete.",502);
  const text=(v:unknown)=>typeof v==="string"?v.slice(0,250):undefined;
  let link:string|undefined;try {if(match?.song_link){const u=new URL(String(match.song_link));if(u.protocol==="https:"&&!u.username&&!u.password)link=u.href;}}catch{}
  const check:RecordingMatch={status:match?"match":"no-match",provider:"AudD",checkedAt:new Date().toISOString(),songId,audioId,start,duration:(bytes.length-44)/44100,excerptSha256:hash,...(match?{title:text(match.title),artist:text(match.artist),album:text(match.album),link}:{})};
  await bucket.put(cacheKey,JSON.stringify(check),{httpMetadata:{contentType:"application/json"}});return json({check});
}
const route=recoverableRoute(handle,"The rights review could not finish. Saved recordings are unchanged.");
export const GET=route;export const PUT=route;export const POST=route;
