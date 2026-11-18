import {isMusicalAd} from "../../../musical-ad";
import { defaultLanguageChoice, resolveLanguage, singingDirection, languageStyles, generatedScriptIssue, type LanguageProfile } from "../../../music-language";
import { vocalStyles } from "../../../vocal-matching";
import {titlesFromLyrics} from "../../../song-cover";
import {genreTags} from "../../../music-genres";
import { performanceWeight, songOpenings, type SongOpening } from "../../../song-opening";
import { withProductionUsage, managedProviderKey, jobExecution } from "../../../credits/production";
import { attachRenderedMix, projectRoot } from "../../../project-assets";
import { isExplicitSong } from "../../../clean-content";
import {storePaidAudio,finishPaidAudio} from "../../../server/audio-storage";
import { directSections, isSectionDirections, type SectionDirection } from "../../../song-section-directions";
import { applyChunkStyleCues, lyricStyleCues, lyricDirectionScopes, notationStyles, productionLyricChunks } from "../../../lyric-style-cues";
import { stampSong } from "../../../song-library";
import { serverStorage as env } from "../../../server/storage";
import { cleanWordsMessage, hasExplicitWords } from "../../../clean-content";
import { freshSong, emptyCreatorStudio, initialStudio, type Studio } from "../../../studio-data";
import { isTrackDuration } from "../../../track-duration";
import { elevenLabsFailureMessage, elevenLabsRequest, musicModel as model } from "../elevenlabs/provider";
import { resolveElevenLabsKey } from "../elevenlabs/vault";
import { audioKey, maxStudioBytes, privateHeaders, readStudio, writeStudio } from "../store";

import { privateWorkspace } from "../../../studio-access";
import { reserveCreatorGeneration } from "../../../creator-accounts";
import { readBoundedText, recoverableRoute } from "../request-errors";

export const dynamic = "force-dynamic";
const options = { headers: privateHeaders };

function problem(error: string, status: number) {
  return Response.json({ error }, { status, headers: privateHeaders });
}

function chunkDurations(weights: number[], duration: number) {
  let remaining = duration;
  let remainingWeight = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight, index) => {
    const after = weights.length - index - 1;
    const ideal = remainingWeight ? Math.round(remaining * weight / remainingWeight) : remaining;
    const milliseconds = Math.min(120000, remaining - 3000 * after, Math.max(3000, remaining - 120000 * after, ideal));
    remaining -= milliseconds;
    remainingWeight -= weight;
    return milliseconds;
  });
}

function lyricChunks(lyrics: string, prompt: string, duration: number, sectionDirections?: SectionDirection[], readStyles = true) {
  const sections = productionLyricChunks(lyrics,readStyles,!!sectionDirections,sectionDirections?.map(s=>s.name));
  if (sections.length > 30 || sections.length * 3000 > duration) return null;
  const count = Math.max(sections.length, Math.ceil(duration / 120000));
  const positive_styles = prompt.split(/[,;\n]/).map(part => part.trim()).filter(Boolean).slice(0, 20);
  const lengths = chunkDurations(Array.from({ length: count }, (_, index) => sections[index] ? performanceWeight(sections[index].text) : 0), duration);
  const chunks = lengths.map((duration_ms, index) => {
    const section = sections[index]?.text ?? "";
    return {
      text: section ? (/^\[/.test(section) ? section : "[Verse]\n" + section) : "[Instrumental outro]",
      duration_ms,
      positive_styles: [...(sections[index]?.genre ? [sections[index].genre!] : []), ...notationStyles(sections[index]?.directions ?? []), ...positive_styles].slice(0,20),
      negative_styles: ["profanity", "sexually explicit lyrics", "graphic violence", "hateful or degrading language"],
      context_adherence: "high",
    };
  });
  return { chunks };
}

function carryArrangementCues(chunks: { text?: string; duration_ms?: number; positive_styles?: unknown }[], arrangement: string, readStyles = true, names: string[] = []) {
  const key = (name: string) => name.trim().toLowerCase().replace(/^verse$/, "verse 1");
  const scopes = lyricDirectionScopes(arrangement,readStyles,names), seen = new Map<string,number>();
  return chunks.map(chunk => {
    const heading = /^\s*\[([^\]\r\n]+)\]/.exec(chunk.text ?? "");
    const matching = heading ? scopes.sections.filter(s=>key(s.name)===key(heading[1])) : [];
    const index = heading ? seen.get(key(heading[1])) ?? 0 : 0;
    const section = matching[Math.min(index,matching.length-1)];
    if (heading) seen.set(key(heading[1]),index+1);
    return { ...chunk, positive_styles: [...(section?.genre?[section.genre]:[]),...notationStyles([...scopes.global,...section?.notes??[]]),...(Array.isArray(chunk.positive_styles)?chunk.positive_styles:[])].slice(0,20) };
  });
}

async function saveCreation(id: string, starter: Studio, update: (studio: Studio) => Studio) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readStudio(id);
    const data = update(current.data ?? starter);
    const content = JSON.stringify(data);
    if (new TextEncoder().encode(content).length > maxStudioBytes) break;
    const saved = await writeStudio(id, current.revision, content);
    if (saved) return readStudio(id);
  }
  return null;
}

async function createMusic(request: Request) {
  const job=jobExecution.get(request);
  const access = job?{id:job.owner,role:job.role}:await privateWorkspace();
  if (!access) return problem("Sign in to use Create.", 401);
  const id = access.id;
  const expectedWorkspace = request.headers.get("X-Studio-Workspace");
  if (expectedWorkspace && expectedWorkspace !== id) return problem("Your signed-in account changed. Reload before creating music; no generation request was sent.", 409);
  const starter = access.role === "owner" ? initialStudio : emptyCreatorStudio;
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return problem("Open the studio directly to use Create.", 403);

  const body = await readBoundedText(request, 80_000);
  if (body.length > 20000) return problem("These creation inputs are too long.", 413);
  let input;
  try { input = JSON.parse(body); } catch { return problem("Invalid creation request.", 400); }
  if(input?.musicalAd!==undefined&&!isMusicalAd(input.musicalAd))return problem("Check the musical advertisement brief.",400);
  if (input?.openingMode !== undefined && (typeof input.openingMode !== "string" || !Object.hasOwn(songOpenings,input.openingMode))) return problem("Choose a supported song opening.",400);
  const openingMode: SongOpening = input?.openingMode ?? "auto";
  const text = (name: string) => typeof input?.[name] === "string" ? input[name] as string : "";
  if (hasExplicitWords(text("title"), text("description"), text("prompt"), text("lyrics"), text("voice"), text("arrangement"),text("instruments"),text("genres"),input?.musicalAd?JSON.stringify(input.musicalAd):""))
    return problem(cleanWordsMessage, 422);
  let languageProfile: LanguageProfile | undefined;
  if (input?.action === "lyric-plan" || input?.action === "song" && input?.instrumental !== true) {
    try {
      languageProfile = resolveLanguage({
        language: input.language ?? defaultLanguageChoice.language,
        dialect: input.dialect ?? "",
        selected: input.selected ?? (input.language ? undefined : false),
      }, text("lyrics"), text("prompt"));
    } catch (error) { return problem((error as Error).message, 400); }
  }
  let key: string | null;
  try { key = managedProviderKey(request) ?? await resolveElevenLabsKey(id); }
  catch { return problem("Could not read the saved ElevenLabs key. Update it in Settings → AI Music Providers.", 503); }
  if (!key) return problem("Open Settings → AI Music Providers to connect ElevenLabs.", 400);
  const execution=jobExecution.get(request);
  const call = (path: string, payload: object) => {
    if(execution)execution.providerStarted=true;
    return elevenLabsRequest(key, path, payload, 300_000);
  };
  let pendingCreationId: string | null = null;
  async function preservedProblem(error: string, status: number) {
    if (!pendingCreationId) return problem(error,status);
    const saved = await saveCreation(id,starter,studio=>({...studio,songs:studio.songs.map(song=>song.id===pendingCreationId&&song.generation?{...song,generation:{...song.generation,status:"incomplete"}}:song)}));
    return Response.json({error:error+" Your approved writing draft is preserved in My Originals.",...(saved??{}),songId:pendingCreationId},{status,headers:privateHeaders});
  }

  try {
    if (input?.action === "preview-voice" || input?.action === "save-voice") {
      if (access.role !== "owner") return problem("Voice design is available in the owner workspace.", 403);
      const description = text("description").trim();
      if (description.length < 20 || description.length > 1000)
        return problem("Describe the voice in 20 to 1,000 characters.", 400);

      if (input.action === "preview-voice") {
        const response = await call("text-to-voice/design?output_format=mp3_22050_32", {
          voice_description: description, text: "From the silence comes the light. Take a breath and listen. Each voice has a place in this moment, and every moment can begin again.",
        });
        if (!response.ok) return problem(await elevenLabsFailureMessage(response, "voice"), 502);
        const result = await response.json() as { previews?: { generated_voice_id: string; audio_base_64: string }[] };
        if (!Array.isArray(result.previews) || !result.previews.length)
          return problem("No voice previews came back. Try a different description.", 502);
        const previews = result.previews.slice(0, 3).map(preview => ({
          id: preview.generated_voice_id, audio: preview.audio_base_64,
        }));
        return Response.json({ previews }, options);
      }

      const name = text("title").trim();
      const previewId = text("previewId");
      if (!name || name.length > 80 || !/^[\w-]{1,128}$/.test(previewId))
        return problem("Name the voice and choose a preview.", 400);
      const response = await call("text-to-voice", {
        voice_name: name, voice_description: description, generated_voice_id: previewId,
      });
      if (!response.ok) return problem(await elevenLabsFailureMessage(response, "voice"), 502);
      const result = await response.json() as { voice_id?: string };
      if (!result.voice_id) return problem("ElevenLabs did not return a saved voice.", 502);
      const voice = { id: result.voice_id, name, description };
      const saved = await saveCreation(id, starter, studio => ({ ...studio, voices: [...(studio.voices ?? []), voice] }));
      if (!saved) return problem("The voice was created in ElevenLabs, but the studio could not save its profile.", 409);
      return Response.json(saved, options);
    }

    if (input?.action === "lyric-plan") {
      const prompt = text("prompt").trim(), duration = Number(input.duration);
      if (!prompt || prompt.length > 1600 || !isTrackDuration(duration)) return problem("Describe the song and choose a length from 3 to 600 seconds.",400);
      if (access.role === "creator" && !managedProviderKey(request) && !await reserveCreatorGeneration(id)) return problem("This account reached its daily provider attempt limit.",429);
      const response=await call("music/plan",{model_id:model,prompt:singingDirection(languageProfile!)+"\nCreate original clean lyrics with explicit section headings. Keep sung phrasing clear, leave breath spaces, and follow the requested language or dialect exactly. "+songOpenings[openingMode].direction+" "+prompt,music_length_ms:duration*1000});
      if(!response.ok)return problem(await elevenLabsFailureMessage(response,"music"),502);
      const plan=await response.json() as {chunks?:{text?:string}[]};
      const lyrics=Array.isArray(plan.chunks)?plan.chunks.map(c=>c.text??"").join("\n\n"):"";
      if(!performanceWeight(lyrics)||lyrics.length>5000||hasExplicitWords(lyrics))return problem("The provider did not return a usable lyric draft. Try again or enter your own lyrics.",422);
      const scriptIssue = generatedScriptIssue(languageProfile!, lyrics);
      if (scriptIssue) return problem(scriptIssue, 422);
      return Response.json({lyrics,languageProfile},options);
    }

    const bucket = env.BUCKET;
    if (!bucket) return problem("Audio storage is temporarily unavailable.", 503);
    const title = text("title").trim();
    const prompt = text("prompt").trim();
    const instrumental = input?.instrumental === true;
    const captionReady = !instrumental && input?.captionReady !== false;
    const suppliedLyrics = instrumental ? "" : text("lyrics");
    const voice = instrumental ? "" : text("voice").trim();
    const arrangement = text("arrangement").trim();
    const instruments=text("instruments").trim(),genres=text("genres").trim();
    const readLyricStyles = input?.readLyricStyles !== false;
    const duration = Number(input?.duration);
    if (input?.action !== "song" || title.length > 100 || !prompt || prompt.length > 1600 ||
      suppliedLyrics.length > 5000 || instruments.length>500 || genres.length>600 || voice.length > 1000 || arrangement.length > 2000 || !isTrackDuration(duration))
      return problem("Check the song prompt, lyrics and length.", 400);
    if(input?.musicalAd&&input.musicalAd.seconds!==duration)return problem("The ad length and song request must match.",400);
    if (suppliedLyrics.trim() && !performanceWeight(suppliedLyrics)) return problem("These lyrics contain section headings or directions but no words to perform. Add your lyrics, or choose Write lyrics for me instead.",400);
    const coded=lyricStyleCues(suppliedLyrics+"\n"+arrangement);if(coded.errors.length)return problem(coded.errors[0],400);

    if (input?.captionReady===true && instrumental) return problem("Caption-ready vocal production needs a song with vocals.",400);

    let sectionDirections: SectionDirection[] | undefined;
    const rawSections = text("sectionDirections");
    if (!instrumental && rawSections) {
      let parsed: unknown;
      try { parsed = JSON.parse(rawSections); } catch { return problem("Check the Tent’s section directions.", 400); }
      if (!isSectionDirections(parsed) || parsed.some(section => hasExplicitWords(section.genre, section.instruments, section.voice)))
        return problem("Check the Tent’s section genres and pronunciation notes.", 400);
      sectionDirections = parsed;
    }
    const before = await readStudio(id);
    const requestedProject = text("projectId");
    const sourceProject = requestedProject ? before.data?.songs.find(s => s.id === requestedProject && !s.deletedAt && !isExplicitSong(s)) : undefined;
    if (requestedProject && !sourceProject) return problem("Choose an available project before generating.", 400);
    const queuedId=execution?.songId;
    if(queuedId&&!before.data?.songs.some(song=>song.id===queuedId&&song.creationDraft&&!song.deletedAt))
      return problem("This writing draft changed. No generation was started.",409);
    let draft = stampSong(freshSong(queuedId||crypto.randomUUID(), title || "Untitled song", (before.data ?? starter).songs.length));
    if (sourceProject) draft.projectId = projectRoot(before.data!.songs, sourceProject).id;
    if(input?.musicalAd){draft.musicalAd=input.musicalAd;draft.notes.promotion=JSON.stringify({kind:"musical-ad/v1",...input.musicalAd});}
    draft.stage = "Production";
    draft.audioFormat = "mp3";
    draft.creationDraft = true;
    draft.creationSeconds = duration;
    draft.sectionDirections = sectionDirections;
    if (instrumental) draft.creationKind = "instrumental";
    draft.notes.prompt = [prompt, "Opening: " + songOpenings[openingMode].name, arrangement && "Arrangement code\n" + arrangement].filter(Boolean).join("\n\n");
    draft.notes.vocals = voice;
    draft.notes.instruments=instruments;
    if(genres)draft.tags=genreTags(genres);
    const direction = [languageProfile && singingDirection(languageProfile), prompt, instruments&&"Featured instruments: "+instruments, songOpenings[openingMode].direction, captionReady && "Caption-ready vocal production: a forward intelligible lead, clear consonants, manageable phrasing, breathing space between lines, restrained reverb, avoid masking lead vocals with instruments. Follow approved lyrics and section order exactly; avoid added ad-libs unless requested. These directions do not guarantee exact pronunciation or caption recognition.", voice && "Vocal direction: " + voice, "Clean, uplifting original lyrics. Avoid profanity, vulgar or sexually explicit language, graphic violence, hate, and degrading expressions."].filter(Boolean).join("\n");
    const durationMs = duration * 1000;

    const bpm = /\b\d{2,3}\s*BPM\b/i.exec(prompt)?.[0] ?? "";
    const applyDirections = <T extends { text?: string; positive_styles?: unknown }>(chunks: T[]) => {
      const coded=applyChunkStyleCues(chunks,readLyricStyles,sectionDirections?.map(s=>s.name));
      return sectionDirections ? directSections(coded, sectionDirections, bpm, voice) : { chunks:coded, missing: [] };
    };
    const lyricPlan = suppliedLyrics.trim() ? lyricChunks(suppliedLyrics, direction, durationMs, sectionDirections,readLyricStyles) : null;
    if (suppliedLyrics.trim() && !lyricPlan) return problem("Choose a longer song for these lyrics or combine some sections.", 400);
    let plan: object | null = lyricPlan;
    if (lyricPlan) {
      const directed = applyDirections(lyricPlan.chunks);
      if (directed.missing.length)
        return problem("Add these section headings to your lyrics: " + directed.missing.map(name => "[" + name + "]").join(", ") + ".", 422);
      plan = { chunks: directed.chunks };
    }
    if (sectionDirections && sectionDirections.length * 3000 > durationMs)
      return problem("Choose at least three seconds per section.", 422);
    if (access.role === "creator" && !managedProviderKey(request) && !await reserveCreatorGeneration(id))
      return problem("This creator account reached its daily generation attempt limit. The limit resets at midnight UTC.", 429);
    if (suppliedLyrics.trim()) {
      draft.notes.lyrics = suppliedLyrics;
    } else if (!instrumental) {
      const arrangementGuide = arrangement
        ? "\nFollow this section order and keep the indicated performers and delivery. Directions in braces are production cues. Keep spoken and whispered passages distinct from sung lyrics.\n" + (readLyricStyles?arrangement:applyChunkStyleCues([{text:arrangement}],false)[0].text)
        : "";
      const sectionGuide = sectionDirections ? "\nUse every one of these exact headings in order. Write each section in its assigned language or dialect.\n" +
        sectionDirections.map(section => "[" + section.name + "] " + section.genre + " with " + section.instruments + ". " + section.voice).join("\n") : "";
      const response = await call("music/plan", {
        prompt: "Write an original song with sung lyrics. " + direction.slice(0, arrangement ? 1800 : undefined) + arrangementGuide + sectionGuide,
        music_length_ms: durationMs, model_id: model,
      });
      if (!response.ok) return problem(await elevenLabsFailureMessage(response, "music"), 502);
      const generated = await response.json() as { chunks?: { text?: string; duration_ms?: number }[] };
      if (!Array.isArray(generated.chunks) || !generated.chunks.length)
        return problem("The music service returned an empty arrangement.", 502);
      if (generated.chunks.length > 30 || generated.chunks.length * 3000 > durationMs)
        return problem("The generated arrangement needs more time. Choose a longer track length or try again.", 422);
      const directed = carryArrangementCues(generated.chunks, arrangement,readLyricStyles,sectionDirections?.map(s=>s.name));
      draft.notes.lyrics = directed.map(chunk => chunk.text ?? "").join("\n\n");
      const scriptIssue = generatedScriptIssue(languageProfile!, draft.notes.lyrics);
      if (scriptIssue) return problem(scriptIssue, 422);
      if (!performanceWeight(draft.notes.lyrics)) return problem("The provider returned section directions without sung words. Try again or supply your own lyrics. No audio generation was started.",502);
      if (hasExplicitWords(draft.notes.lyrics, ...generated.chunks.flatMap(chunk => {
        const styles = (chunk as { positive_styles?: unknown }).positive_styles;
        return Array.isArray(styles) ? styles : [];
      }))) return problem("The generated lyrics triggered the clean-content rules. Try a different prompt.", 422);
      const styled = applyDirections(directed);
      if (styled.missing.length)
        return problem("The music provider omitted these sections: " + styled.missing.join(", ") + ". Try again or supply your own sectioned lyrics.", 422);
      const chunks = [...styled.chunks];
      while (chunks.length * 120000 < durationMs) chunks.push({ text: "[Instrumental outro]", duration_ms: 120000, positive_styles: [] });
      const lengths = chunkDurations(chunks.map(chunk => chunk.duration_ms && chunk.duration_ms > 0 ? chunk.duration_ms : 1), durationMs);
      plan = { ...generated, chunks: chunks.map((chunk, index) => ({ ...chunk, duration_ms: lengths[index] })) };
    }

    const finalChunks = (plan as { chunks?: { text?: string; positive_styles?: unknown }[] } | null)?.chunks;
    if (Array.isArray(finalChunks)) {
      const coded = applyChunkStyleCues(finalChunks, readLyricStyles,sectionDirections?.map(s=>s.name));
      const styled = sectionDirections ? coded : vocalStyles(coded, voice);
      plan = { ...plan, chunks: languageProfile ? languageStyles(styled, languageProfile) : styled };
    }
    if(input.autoTitle===true&&draft.notes.lyrics.trim()){const suggested=titlesFromLyrics(draft.notes.lyrics)[0];if(suggested)draft.name=suggested;}
    draft.generation = { ...(request.headers.get("X-Production-Id")&&/^[a-f0-9-]{36}$/i.test(request.headers.get("X-Production-Id")!)?{requestId:request.headers.get("X-Production-Id")!}:{}),provider: "ElevenLabs", model, audioId: draft.id, status:"generating", approvedLyrics: draft.notes.lyrics, compositionPlan: plan,
      createdAt: new Date().toISOString(), captionReady, timingSource: "not-provided", languageProfile };
    // Preserve every approved writing/arrangement draft before the audio request.
    {
      const writing = await saveCreation(id,starter,studio=>{
        const prior=studio.songs.find(song=>song.id===draft.id);
        if(queuedId&&!prior?.creationDraft)throw new Error("The draft changed before generation.");
        return {...studio,songs:[{...prior,...draft,notes:{...prior?.notes,...draft.notes},audioFormat:undefined},...studio.songs.filter(song=>song.id!==draft.id)]};
      });
      if (!writing) return problem("The approved writing draft could not save. Generation was not started.",409);
      pendingCreationId = draft.id;
    }
    const response = await call("music?output_format=mp3_44100_128", instrumental
      ? { model_id: model, prompt: [songOpenings[openingMode].direction, prompt].join("\n"), music_length_ms: durationMs, force_instrumental: true }
      : { model_id: model, composition_plan: plan });
    if (!response.ok) return preservedProblem(await elevenLabsFailureMessage(response, "music"), 502);
    if (!response.headers.get("content-type")?.includes("audio"))
      return preservedProblem("ElevenLabs did not return an audio file.", 502);
    const audio = await response.arrayBuffer();
    if (!audio.byteLength || audio.byteLength > 12 * 1024 * 1024)
      return preservedProblem("The music service returned an invalid audio file.", 502);

    draft.generation = { ...draft.generation!, status:"complete" };
    draft.creationDraft=false;
    draft.updatedAt=new Date().toISOString();

    try{draft=await storePaidAudio(id,draft,audio);}
    catch{return preservedProblem("ElevenLabs returned your recording, but it could not be stored. Check ElevenLabs history before generating again. Open My Songs and Recover unfinished songs to check for a stored copy.",502);}
    const saved = await saveCreation(id, starter, studio => {
      const source = draft.projectId && studio.songs.find(s => s.id === draft.projectId && !s.deletedAt);
      const completed = studio.songs.find(s => s.id === draft.id);
      const audioSong = completed ? { ...completed, audioFormat: draft.audioFormat,audioId:draft.audioId, generation: draft.generation,creationDraft:false,updatedAt:draft.updatedAt } : draft;
      return { ...studio, songs: source ? attachRenderedMix(studio.songs, source, audioSong) : completed ? studio.songs.map(s => s.id === draft.id ? audioSong : s) : [draft, ...studio.songs] };
    });
    if (saved) {
      // Receipt cleanup must never turn a committed, paid song into a failed
      // creation. Recovery also excludes attached songs without reading receipts.
      try{
        if(!await finishPaidAudio(id,draft))console.warn("Paid song saved; recovery receipt changed before completion.");
      }catch{console.warn("Paid song saved; recovery receipt completion is pending.");}
      return Response.json({ ...saved, songId: draft.id }, options);
    }
    return problem("Your recording is safely stored but could not be attached. Open My Songs and choose Recover unfinished songs. Do not generate it again.", 409);
  } catch {
    return preservedProblem("Creation could not finish. Check your drafts and ElevenLabs account before retrying.", 502);
  }
}

const paidCreation = withProductionUsage(recoverableRoute(createMusic, "Creation could not finish. Check saved drafts before retrying; existing recordings are preserved."));
// Reject invalid/unavailable choices before accounting; uncertain text defaults to English.
// Keep that wrapper and its authentication, quota and refund behavior unchanged.
export const POST = recoverableRoute(async (request: Request) => {
  let input;
  try { input = JSON.parse(await readBoundedText(request.clone() as unknown as Request, 80_000)); }
  catch { return problem("Invalid creation request.", 400); }
  if (input?.action === "lyric-plan" || input?.action === "song" && input?.instrumental !== true) {
    try { resolveLanguage({language: input.language ?? defaultLanguageChoice.language, dialect: input.dialect ?? "", selected: input.selected ?? (input.language ? undefined : false)}, typeof input.lyrics === "string" ? input.lyrics : "", typeof input.prompt === "string" ? input.prompt : ""); }
    catch (error) { return problem((error as Error).message, 400); }
  }
  return paidCreation(request);
}, "Creation could not finish. Existing recordings are preserved.");
