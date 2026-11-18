import { serverStorage as env } from "../../../server/storage";
import { hasExplicitWords, cleanWordsMessage, isExplicitSong } from "../../../clean-content";
import { creationPresets, isInstrumental, type Instrumental } from "../../../creation-guide";
import { serveAudio } from "../audio-response";
import { audioFormatsLabel, audioTypes, freshSong, emptyCreatorStudio, initialStudio, isAudioFormat, maxAudioBytes, validCreationReference, type Song } from "../../../studio-data";
import { audioKey, maxStudioBytes, privateHeaders, readStudio, saveConflict, writeStudio } from "../store";
import {preservePaidSong} from "../../../server/song-recovery";
import {audioSignatureCheck,NotAudioError,notAudioMessage} from "../../../audio-signature";
import {readOwnedSong} from "../../../server/song-lookup";

import { privateWorkspace } from "../../../studio-access";
import { recoverableRoute } from "../request-errors";
import { attachRenderedMix, projectRoot } from "../../../project-assets";
import { stampSong } from "../../../song-library";
import {isSectionEditPlan,assertSongEditLength,type SectionEditPlan} from "../../../song-section-data";
import {carryEditedCaptions} from "../../../caption-edit-continuity";

export const dynamic = "force-dynamic";

function problem(error: string, status: number) {
  return Response.json({ error }, { status, headers: privateHeaders });
}

async function uploadAudio(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to upload a song.", 401);
  const id = access.id;
  const expectedWorkspace = request.headers.get("X-Studio-Workspace");
  if (expectedWorkspace && expectedWorkspace !== id) return problem("Your signed-in account changed. Reload before uploading; the recording has not been saved to another account.", 409);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return problem("Open the studio directly to upload.", 403);
  const bucket = env.BUCKET;
  if (!bucket) return problem("Audio storage is temporarily unavailable.", 503);

  const format = request.headers.get("X-Audio-Format") ?? "";
  if (!isAudioFormat(format)) return problem(`Choose a supported file (${audioFormatsLabel}).`, 415);
  const size = Number(request.headers.get("X-Audio-Size") ?? request.headers.get("Content-Length"));
  if (!Number.isSafeInteger(size) || size < 1 || !request.body)
    return problem("Choose a non-empty audio file.", 400);
  const partySource=request.headers.get("X-Party-Source");
  if(partySource&&(!["upload","recording","mix"].includes(partySource)||request.headers.get("X-Party-Rights")!=="authorized"))return problem("Confirm you have permission to use and mix this recording.",400);
  if (size > (partySource==="mix"?128*1024*1024:maxAudioBytes)) return problem(partySource==="mix"?"Choose a rendered party file up to 128 MB.":"Choose an audio file up to 96 MB.", 413);

  let title: string;
  try { title = decodeURIComponent(request.headers.get("X-Song-Title") ?? "").trim(); }
  catch { return problem("Enter a valid song title.", 400); }
  const target = request.headers.get("X-Song-Id");
  if (request.headers.get("X-Audio-Explicit") === "1" || hasExplicitWords(title)) return problem(cleanWordsMessage, 422);
  if (request.headers.get("X-Studio-Clean-Audio") !== "1") return problem("Confirm the recording is clean before uploading.", 422);
  if (!target && (!title || title.length > 100)) return problem("Enter a song title up to 100 characters.", 400);
  const rawInstrumental = request.headers.get("X-Studio-Instrumental");
  const creationId=request.headers.get("X-Creation-Id");
  if(!validCreationReference(creationId,target,rawInstrumental))return problem("Invalid creation save reference.",400);
  let instrumental: { prompt: string; settings: Instrumental; arrangement?: string } | undefined;
  if (rawInstrumental !== null) {
    if (target || format !== "wav" || rawInstrumental.length > 40000)
      return problem("Check the instrumental draft settings.", 400);
    try {
      const input = JSON.parse(decodeURIComponent(rawInstrumental));
      if (!isInstrumental(input?.settings) || typeof input?.prompt !== "string" || input.prompt.length > 1600 ||
          (input.arrangement !== undefined && (typeof input.arrangement !== "string" || input.arrangement.length > 2000)))
        return problem("Check the instrumental draft settings.", 400);
      if (hasExplicitWords(input.prompt, input.arrangement)) return problem(cleanWordsMessage, 422);
      instrumental = { prompt: input.prompt, settings: input.settings, arrangement: input.arrangement };
    } catch { return problem("Check the instrumental draft settings.", 400); }
  }
  const expected = request.headers.get("X-Studio-Revision");
  const revision = Number(expected);
  if (expected === null || !Number.isSafeInteger(revision) || revision < 0)
    return problem("Reload the studio and try again.", 400);

  const previous = await readStudio(id);
  const studio = previous.data ?? (access.role === "owner" ? initialStudio : emptyCreatorStudio);
  const uploadId=request.headers.get("X-Party-Upload-Id");
  if(uploadId&&(!partySource||target||!/^[a-f\d-]{36}$/i.test(uploadId)))return problem("Invalid private upload receipt.",400);
  const uploaded=uploadId&&studio.songs.find(s=>s.id===uploadId);
  if(uploaded){if(uploaded.name!==title||uploaded.audioFormat!==format||uploaded.partySource!==partySource)return problem("This audio is already saved with different details. Open My Music before retrying.",409);return Response.json({...previous,data:studio,songId:uploaded.id},{headers:privateHeaders});}
  if(uploadId&&env.DB&&await env.DB.prepare("select song_id from song_deletion_jobs where owner = ? and song_id = ?").bind(id,uploadId).first())return problem("This upload was permanently deleted. Choose a new source file.",409);
  const receipt=creationId&&studio.songs.find(song=>song.id===creationId);
  if(receipt){
    if(receipt.name!==title||receipt.audioFormat!==format||JSON.stringify(receipt.instrumental)!==JSON.stringify(instrumental?.settings))return problem("This creation is already saved with different settings. Open My Songs before retrying.",409);
    return Response.json({...previous,data:studio,songId:receipt.id},{headers:privateHeaders});
  }
  const independentUpload=!target&&!request.headers.get("X-Project-Song-Id");
  if (previous.revision !== revision&&!independentUpload) return saveConflict();
  const projectId = request.headers.get("X-Project-Song-Id");
  const sourceSession = request.headers.get("X-Source-Session-Id") ?? undefined;
  const sourceProject = projectId ? studio.songs.find(s => s.id === projectId && !s.deletedAt && !isExplicitSong(s)) : undefined;
  let sectionEdit:SectionEditPlan|undefined;const rawEdit=request.headers.get("X-Section-Edit-Plan");
  if(rawEdit){try{const candidate=JSON.parse(decodeURIComponent(rawEdit));if(rawEdit.length>24000||!isSectionEditPlan(candidate)||partySource!=="mix"||candidate.sourceSongId!==projectId||candidate.sourceAudioId!==(sourceProject?.audioId??sourceProject?.id)||!candidate.clips.every(c=>studio.songs.some(s=>s.id===c.songId&&!s.deletedAt&&!isExplicitSong(s)&&(s.audioId??s.id)===c.audioId)))return problem("The section edit must use current audio from your private library.",400);sectionEdit=candidate;}catch{return problem("Check the section edit recipe.",400);}}
  if(sectionEdit){try{assertSongEditLength(sectionEdit.clips.map(c=>({id:c.audioId,from:c.from,to:c.to})),sectionEdit.fade);}catch(error){return problem((error as Error).message,400);}}
  if (projectId && (!sourceProject || target)) return problem("Choose an available project for this production mix.", 400);
  if (sourceSession && !/^[\w-]{1,100}$/.test(sourceSession)) return problem("Invalid source session.", 400);
  if (sourceProject && isExplicitSong(projectRoot(studio.songs, sourceProject))) return problem(cleanWordsMessage, 422);
  const existing = target ? studio.songs.find(song => song.id === target && !song.deletedAt) : undefined;
  if (target && !existing) return problem("That song is no longer in your studio.", 404);
  let song: Song = existing
    ? { ...existing, explicit: undefined, instrumental: undefined, creationKind: undefined, creationSeconds: undefined, sectionEdit:undefined, partySource:partySource?undefined:existing.partySource?"upload":undefined, audioFormat: format, audioId: crypto.randomUUID() }
    : { ...freshSong(uploadId??creationId??crypto.randomUUID(), title, studio.songs.length), ...(creationId||uploadId?{audioId:crypto.randomUUID()}:{}),stage: "Production", audioFormat: format };
  if (existing?.audioFormat) song.audioHistory = [...(existing.audioHistory ?? []), {
    audioId: existing.audioId ?? existing.id, audioFormat: existing.audioFormat, date: new Date().toISOString(), name: existing.name,
    ...(existing.sectionEdit?{sectionEdit:existing.sectionEdit}:{}),
  }];
  if(partySource){song.partySource=partySource as "upload"|"recording"|"mix";song.notes.promotion=partySource==="upload"?"Creator confirms permission to use and mix this uploaded audio. The original rights remain with its rights holders.":partySource==="recording"?"Private voice recording authorized by the creator.":"Continuous mix rendered from authorized source tracks. Check source rights before sharing or publishing.";}
  if(sectionEdit){song.sectionEdit=sectionEdit;song.notes.promotion+=" Section arrangement changed. Original approved lyrics are retained as a reference; review changed words and regenerate lyric alignment before video export.";}
  if (instrumental) {
    song.creationDraft = false;
    song.instrumental = instrumental.settings;
    song.notes.prompt = instrumental.arrangement
      ? instrumental.prompt + "\n\nArrangement code\n" + instrumental.arrangement
      : instrumental.prompt;
    song.tags = [creationPresets[instrumental.settings.preset].name];
  }
  song=stampSong(song,existing);
  if(sectionEdit&&sourceProject?.lyricVideo?.pro){
    if(!bucket)return problem("Private project storage is unavailable. Your original captions are unchanged.",503);
    const old=sourceProject.lyricVideo;
    const snapshotId=crypto.randomUUID(),at=new Date().toISOString();
    await bucket.put(`lyric-projects/${encodeURIComponent(id)}/${sourceProject.id}/${snapshotId}.json`,JSON.stringify(old),{
      httpMetadata:{contentType:"application/json"},
      customMetadata:{name:"Before audio section edit",at,audioId:old.pro!.sourceAudioId},
    });
    song.lyricVideo=carryEditedCaptions(old,sectionEdit,song.id,song.audioId??song.id);
  }
  const data = { ...studio, songs: existing ? studio.songs.map(item => item.id === song.id ? song : item)
    : sourceProject ? attachRenderedMix(studio.songs, sourceProject, song, sourceSession) : [song, ...studio.songs] };
  const content = JSON.stringify(data);
  if (new TextEncoder().encode(content).length > maxStudioBytes)
    return problem("The studio has reached its storage limit.", 413);

  const key = audioKey(id, song.audioId ?? song.id);
  const stream = new FixedLengthStream(size);
  const signature = audioSignatureCheck();
  try {
    await Promise.all([
      request.body.pipeThrough(signature).pipeTo(stream.writable),
      bucket.put(key, stream.readable, { httpMetadata: { contentType: audioTypes[format] },
        customMetadata:{recoverable:"1",songId:song.id,audioId:song.audioId??song.id,audioFormat:format,title:song.name,createdAt:new Date().toISOString()} }),
    ]);
  } catch (error) {
    if (error instanceof NotAudioError || signature.refused) {
      await bucket.delete(key).catch(() => {});
      return problem(notAudioMessage, 415);
    }
    console.error("Studio audio upload failed", {requestId:crypto.randomUUID(),errorType:error instanceof TypeError?"TypeError":"Error",at:new Date().toISOString()});
    return problem("The audio upload failed. Try again.", 502);
  }

  try {
    const saved = await writeStudio(id, independentUpload?previous.revision:revision, content);
    if (saved) return Response.json({ ...await readStudio(id), songId: song.id }, { headers: privateHeaders });
    if(independentUpload){
      for(let attempt=0;attempt<3;attempt++){
        const latest=await readStudio(id),library=latest.data??emptyCreatorStudio;
        const completed=library.songs.find(s=>s.id===song.id);
        if(completed){
          if(completed.deletedAt)break;
          if((completed.audioId??completed.id)!==(song.audioId??song.id))await bucket.delete(key);
          return Response.json({...latest,songId:completed.id},{headers:privateHeaders});
        }
        if(await env.DB?.prepare("SELECT song_id FROM song_deletion_jobs WHERE owner=? AND song_id=?").bind(id,song.id).first())break;
        const merged=JSON.stringify({...library,songs:[song,...library.songs]});
        if(new TextEncoder().encode(merged).length>maxStudioBytes)break;
        if(await writeStudio(id,latest.revision,merged))return Response.json({...await readStudio(id),songId:song.id},{headers:privateHeaders});
      }
    }
  } catch (error) {
    try{await preservePaidSong(id,song);}catch{/* The private audio metadata also tracks this orphan for recovery. */}
    console.error("Studio upload save failed", {requestId:crypto.randomUUID(),errorType:error instanceof TypeError?"TypeError":"Error",at:new Date().toISOString()});
    return problem("Your audio reached private storage, but its library save was not confirmed. Open My Songs and choose Recover unfinished songs before uploading again.", 503);
  }
  if(creationId||uploadId){
    const latest=await readStudio(id),completed=latest.data?.songs.find(s=>s.id===(creationId??uploadId));
    if(completed){
      if((completed.audioId??completed.id)!==(song.audioId??song.id))await bucket.delete(key).catch(()=>{});
      return Response.json({...latest,songId:completed.id},{headers:privateHeaders});
    }
  }
  try{await preservePaidSong(id,song);}catch{/* Metadata remains a recovery index when receipt storage fails. */}
  return problem("Your uploaded audio is safely stored, but another edit won the save. Open My Songs and choose Recover unfinished songs.",409);
}

async function getAudio(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to listen.", 401);
  const id = access.id;
  const params = new URL(request.url).searchParams;
  const songId = params.get("song"), version = params.get("v");
  // Reads only this song, not the whole library: players request many byte ranges.
  const found = songId ? await readOwnedSong(id, songId) : null;
  const song = found && !found.deletedAt ? found : undefined;
  if (!song || !song.audioFormat || !isAudioFormat(song.audioFormat)) return problem("Audio not found.", 404);
  if (isExplicitSong(song)) return problem(cleanWordsMessage, 422);
  const recording = version ?? song.audioId ?? song.id;
  const format = recording === (song.audioId ?? song.id) ? song.audioFormat : song.audioHistory?.find(a => a.audioId === recording)?.audioFormat;
  if (!format || !isAudioFormat(format)) return problem("This recording version is unavailable. Choose an available version from your project.", 404);
  return serveAudio(request, id, recording, format);
}

export const GET = recoverableRoute(getAudio, "This recording could not load. Try again; the saved original is preserved.");
export const HEAD = GET;
export const POST = recoverableRoute(uploadAudio, "The upload could not finish. Check your library before retrying; existing recordings are preserved.");
