import { withProductionUsage, managedProviderKey,jobExecution } from "../../../credits/production";
import { sendProviderAudio } from "../elevenlabs/audio-upload";
import { resolveElevenLabsKey } from "../elevenlabs/vault";
import { serverStorage as env } from "../../../server/storage";
import { cleanWordsMessage, hasExplicitWords, isExplicitSong } from "../../../clean-content";
import { alignLyricLines, captionsFromTranscript } from "../../../lyric-alignment";
import { compareLyrics, reviewTiming, proLanguages } from "../../../lyric-pro-data";
import { lyricAssetKey } from "../lyric-assets/route";
import { lyricLines } from "../../../lyric-video-data";
import {captionReadyLines,savedLyricsForAudio} from "../../../caption-ready-lyrics";
import { isAudioFormat, maxAudioBytes } from "../../../studio-data";
import { audioKey, privateHeaders, readStudio } from "../store";
import { readBoundedText, recoverableRoute } from "../request-errors";

import { privateWorkspace } from "../../../studio-access";
import {clipCaptionTimes} from "../../../caption-edit-continuity";
import {saveCaptionRecovery} from "../../../server/caption-recovery";

export const dynamic = "force-dynamic";

function problem(error: string, status: number) {
  return Response.json({ error }, { status, headers: privateHeaders });
}

async function syncLyrics(request: Request) {
  const id = jobExecution.get(request)?.owner??(await privateWorkspace())?.id;
  if (!id) return problem("Sign in to your private Studio to sync captions.", 401);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return problem("Open the studio directly to sync captions.", 403);

  const raw = await readBoundedText(request, 64_000);
  if (raw.length > 16_000) return problem("The lyric text is too long.", 413);
  let input: { songId?: unknown; audioId?: unknown; mode?: unknown; text?: unknown; language?: string; duration?: number; analysisAsset?: string; sourceAudioId?: string; analysisOffset?: number; window?:{start:number;end:number} } | null;
  try { input = JSON.parse(raw); } catch { return problem("Invalid caption request.", 400); }
  let key: string | null;
  try { key = managedProviderKey(request) ?? await resolveElevenLabsKey(id); }
  catch { return problem("Could not read the saved ElevenLabs key. Update it in Settings → AI Music Providers.", 503); }
  if (!key) return problem("Open Settings → AI Music Providers to connect ElevenLabs.", 400);
  if (input?.mode !== "auto" && input?.mode !== "align" && input?.mode !== "transcribe" && input?.mode !== "audit") return problem("Choose an automatic caption option.", 400);
  let text = typeof input.text === "string" ? input.text : "";

  const { data } = await readStudio(id);
  const song = data?.songs.find(song => song.id === input.songId && !song.deletedAt);
  if (!song?.audioFormat || !isAudioFormat(song.audioFormat) || isExplicitSong(song))
    return problem("Choose a clean recording from the Song Library.", 404);
  if ((song.audioId ?? null) !== (input.audioId ?? null)) return problem("This recording has changed. Reload the studio and try again.", 409);
  const sourceId = input.sourceAudioId ?? song.audioId ?? song.id;
  const source = sourceId === (song.audioId ?? song.id) ? song : song.audioHistory?.find(a => a.audioId === sourceId);
  if (!source?.audioFormat) return problem("That original recording is no longer available.", 404);
  if(input.mode==="auto"||input.mode==="align"&&!text.trim())text=savedLyricsForAudio(song,sourceId);
  const mode=input.mode==="auto"?(lyricLines(text).length?"align":"transcribe"):input.mode,lines=captionReadyLines(text);
  if(mode==="align"||mode==="audit"){if(!lines.length||lines.length>200||text.length>5000||lines.some(line=>line.length>180||!/[\p{L}\p{N}]/u.test(line)))return problem("Use up to 5,000 characters and 200 readable caption lines, or choose a shorter excerpt.",400);if(hasExplicitWords(text))return problem(cleanWordsMessage,422);}
  const duration = input.duration;
  if (duration !== undefined && (!Number.isFinite(duration) || duration <= 0 || duration > 600.1)) return problem("Choose a recording up to ten minutes long.", 400);
  if (input.language !== undefined && !Object.hasOwn(proLanguages,input.language)) return problem("Choose a supported language setting.",400);
  const offset = input.analysisOffset ?? 0;
  if (!Number.isFinite(offset) || Math.abs(offset)>2) return problem("Check the analysis timing offset.",400);
  const bucket = env.BUCKET;
  if (!bucket) return problem("Audio storage is temporarily unavailable.", 503);
  const window=input.window;
  if(window&&(!Number.isFinite(window.start)||!Number.isFinite(window.end)||window.start<0||window.end<=window.start||!duration||window.end>duration||!input.analysisAsset||mode!=="align"))
    return problem("Choose a valid changed-part excerpt to align.",400);

  const deadline = AbortSignal.any([request.signal, AbortSignal.timeout(240_000)]);
  try {
    let format = source.audioFormat;
    const audio = await bucket.get(input.analysisAsset && /^[\w-]{1,80}$/.test(input.analysisAsset) ? lyricAssetKey(id,song.id,input.analysisAsset) : audioKey(id,sourceId));
    if (input.analysisAsset) {
      if (!audio || !["analysis","vocal"].includes(audio.customMetadata?.kind ?? "") || audio.customMetadata?.song !== song.id || audio.customMetadata?.source !== sourceId)
        return problem("The analysis audio belongs to a different recording. Choose the original or analyze again.",409);
      if(window&&(audio.customMetadata?.windowStart!==String(window.start)||audio.customMetadata?.windowEnd!==String(window.end)))
        return problem("Upload only the selected changed-part audio before aligning.",409);
      const type=audio.httpMetadata?.contentType;
      format = type?.includes("wav") ? "wav" : type?.includes("mp4") ? "m4a" : type?.includes("flac") ? "flac" : type?.includes("ogg") ? "ogg" : "mp3";
    }
    if (!audio || audio.size < 1 || audio.size > maxAudioBytes) return problem("The recording is unavailable for sync.", 404);
    const aligning = mode === "align";
    const execution=jobExecution.get(request);
    if(execution)execution.providerStarted=true;
    const response = await sendProviderAudio(audio, format, key, aligning ? { text: lines.join("\n") } : {
      model_id: "scribe_v2", timestamps_granularity: "word", tag_audio_events: "true", diarize: "true",
      ...(input.language && input.language !== "auto" ? { language_code: input.language } : {}),
    }, aligning ? "forced-alignment" : "speech-to-text", deadline);
    if (response.status === 401 || response.status === 403)
      return problem("Check your ElevenLabs key and enable Speech to Text or Forced Alignment permissions.", 422);
    if (response.status === 429) return problem("ElevenLabs is busy or your account limit was reached. Try again in a moment.", 429);
    if (!response.ok) return problem("ElevenLabs could not process this recording. Try a shorter or clearer vocal track.", 502);
    const result = await response.json() as { characters?: unknown; words?: unknown; text?: unknown; language_code?: string; language_probability?: number };
    let cues = aligning ? alignLyricLines(lines, result,{splitPauses:true}) : captionsFromTranscript(result.words);
    if (!cues?.length) return problem("The vocals could not be timed reliably. Check the lyrics against the recording or use manual timing.", 422);
    if (cues.length > 200 || cues.some(cue => cue.text.length > 180) || cues.map(cue => cue.text).join("\n").length > 5000)
      return problem("The caption draft is too long. Try a shorter recording or paste the lyrics you want to time.", 422);
    if (!aligning && (hasExplicitWords(result.text) || hasExplicitWords(...cues.map(cue => cue.text))))
      return problem("The caption draft contained explicit language. Paste a clean version to time instead.", 422);
    if (mode === "audit") return Response.json({
      transcript: typeof result.text === "string" ? result.text.slice(0,8000) : cues.map(c=>c.text).join(" "),
      differences: compareLyrics(text,typeof result.text === "string" ? result.text : cues.map(c=>c.text).join(" ")),
      confidenceAvailable: false, language: result.language_code,
    }, {headers:privateHeaders});
    if (input.analysisAsset && offset) cues = cues.map(c=>({...c,time:Math.max(0,c.time-offset),end:c.end===undefined?undefined:Math.max(.001,c.end-offset),words:c.words?.map(w=>({...w,time:Math.max(0,w.time-offset)}))}));
    let clippedLines=0;
    if(duration!==undefined){
      try{const clipped=clipCaptionTimes(cues,window?window.end-window.start:duration);cues=clipped.cues;clippedLines=clipped.clippedLines;}
      catch{return problem("Most caption lines fall outside this recording. Check the selected audio.",422);}
    }
    if(window)cues=cues.map(c=>({...c,time:c.time+window.start,end:c.end===undefined?undefined:c.end+window.start,words:c.words?.map(w=>({...w,time:w.time+window.start}))}));
    const warnings = ["Sung lyrics, overlapping voices, and dialects may be misrecognized. Review the result. Reliable word confidence scores are not available."];
    if(clippedLines)warnings.push(`${clippedLines} caption lines were clipped to the recording end.`);
    if (duration) warnings.push(...reviewTiming(cues,duration).slice(0,20).map(f=>`Line ${f.index+1}: ${f.message}`));
    const savedResult={cues,window,clippedLines,language: result.language_code, languageProbability: result.language_probability,
      confidenceAvailable: false, warnings, engine: aligning ? "ElevenLabs forced alignment" : "ElevenLabs Scribe v2",
      vocalSections: cues.map(c=>({start:c.time,end:c.end})),
    };
    try{await saveCaptionRecovery(id,song.id,sourceId,savedResult);}
    catch{warnings.push("Your captions are ready, but the private recovery copy could not save. Save this project before leaving.");}
    return Response.json(savedResult, { headers: privateHeaders });
  } catch {
    return problem("Automatic sync could not finish. Try again or adjust the captions manually.", 502);
  }
}
export const POST = withProductionUsage(recoverableRoute(syncLyrics, "Caption synchronization could not start. Keep your lyrics and try again."));
