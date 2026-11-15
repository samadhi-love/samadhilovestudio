import {normalizeSongDeletion,deletionDeadline,songDependsOn} from "../../song-deletion";
import { isSectionDirections } from "../../song-section-directions";
import { env } from "cloudflare:workers";
import { revokeSongShare } from "../../song-sharing";
import { stampSong } from "../../song-library";
import { maxStudioBytes, privateHeaders, readStudio, saveConflict, writeStudio } from "./store";
import { cleanWordsMessage, hasExplicitWords, isExplicitSong } from "../../clean-content";
import { isLyricProject } from "../../lyric-video-data";
import { isDiscovery } from "../../music-workspace-data";
import { isTrackDuration } from "../../track-duration";
import { emptyCreatorStudio, type Studio } from "../../studio-data";
import { projectMembers, validReleaseMetadata } from "../../project-assets";
import { privateWorkspace } from "../../studio-access";
import { isStudio } from "../../studio-validation";
import { readBoundedText, recoverableRoute } from "./request-errors";

export const dynamic = "force-dynamic";
const options = { headers: privateHeaders };

export async function GET() {
  const access = await privateWorkspace();
  if (!access) return Response.json({ error: "Sign in to open your studio." }, { status: 401 });
  try {
    let current = await readStudio(access.id);
    if(current.data?.songs.some(song=>song.deletedAt&&deletionDeadline(song)===null)){
      const next={...current.data,songs:current.data.songs.map(song=>song.deletedAt&&deletionDeadline(song)===null?normalizeSongDeletion(song,song):song)};
      const saved=await writeStudio(access.id,current.revision,JSON.stringify(next));
      if(!saved)return saveConflict();current={data:next,revision:saved.revision};
    }
    return Response.json({ ...(access.role === "creator" && !current.data ? { ...current, data: emptyCreatorStudio } : current), workspace: access.id }, options);
  } catch (error) {
    console.error("Studio load failed", error);
    return Response.json({ error: "The studio could not load. Try again." }, { ...options, status: 503 });
  }
}

async function putWorkspace(request: Request) {
  const access = await privateWorkspace();
  if (!access) return Response.json({ error: "Sign in to save your studio." }, { status: 401 });
  const id = access.id;
  const expectedWorkspace = request.headers.get("X-Studio-Workspace");
  if (expectedWorkspace && expectedWorkspace !== id)
    return Response.json({ error: "Your signed-in account changed. Reload this workspace before saving; your edits have not been written to another account." }, { status: 409, headers: privateHeaders });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Open the studio directly to save." }, { status: 403 });
  const raw = await readBoundedText(request, maxStudioBytes);
  if (new TextEncoder().encode(raw).length > maxStudioBytes)
    return Response.json({ error: "The studio has reached its storage limit." }, { status: 413 });
  let input;
  try { input = JSON.parse(raw); } catch { return Response.json({ error: "Invalid workspace." }, { status: 400 }); }
  if (!Number.isSafeInteger(input?.revision) || input.revision < 0 || !isStudio(input?.data))
    return Response.json({ error: "Invalid workspace." }, { status: 400 });
  const { revision, data } = input as { revision: number; data: Studio };
  if (data.discovery !== undefined && !isDiscovery(data.discovery))
    return Response.json({ error: "Invalid music collection." }, { status: 400 });
  if (data.songs.some(song => song?.lyricVideo !== undefined && !isLyricProject(song.lyricVideo)))
    return Response.json({ error: "Check the lyric lines and timing before saving." }, { status: 400 });
  if (data.songs.some(song => song?.sectionDirections !== undefined &&
    (!isSectionDirections(song.sectionDirections) || song.sectionDirections.some(section => hasExplicitWords(section.genre, section.instruments, section.voice)))))
    return Response.json({ error: "Check the genres and vocal directions for each song section." }, { status: 400 });
  const previous = await readStudio(id);
  if (previous.revision !== revision) return saveConflict();
  const previousSongs = new Map((previous.data?.songs ?? []).map(song => [song.id, song]));
  for (const song of data.songs) {
    if (song.releaseMetadata !== undefined && (!validReleaseMetadata(song.releaseMetadata) || hasExplicitWords(...Object.values(song.releaseMetadata))))
      return Response.json({ error: "Check the release credits, ISRC, and UPC fields." }, { status: 400 });
    const old = previousSongs.get(song.id);
    if(song.coverAsset&&song.coverAsset!==old?.coverAsset){const asset=await env.BUCKET?.head(`lyric-assets/${encodeURIComponent(id)}/${song.id}/${song.coverAsset}`);if(!asset||asset.customMetadata?.kind!=="background"||asset.httpMetadata?.contentType!=="image/png")return Response.json({error:"Save an owned PNG cover image before selecting it."},{status:400,...options});}
    if(song.logoAsset&&song.logoAsset!==old?.logoAsset){const asset=await env.BUCKET?.head(`lyric-assets/${encodeURIComponent(id)}/${song.id}/${song.logoAsset}`);if(!asset||asset.customMetadata?.kind!=="logo"||asset.httpMetadata?.contentType!=="image/png")return Response.json({error:"Save an owned PNG logo before selecting it."},{status:400,...options});}
    if (!old && song.projectId && !previousSongs.has(song.projectId)) return Response.json({ error: "Choose an existing project." }, { status: 400 });
    if (JSON.stringify(song.master) !== JSON.stringify(old?.master) && song.master !== undefined) {
      const master = song.master;
      const member = old && projectMembers(previous.data!.songs, old).find(s => s.id === master?.songId && s.audioFormat);
      if (!member || (member.audioId ?? member.id) !== master.audioId || isExplicitSong(member))
        return Response.json({ error: "Choose a current clean recording from this project as the final master." }, { status: 400 });
    }
  }
  try {
    data.songs=data.songs.map(song=>normalizeSongDeletion(song,previousSongs.get(song.id)));
    for(const song of data.songs){
      const old=previousSongs.get(song.id);
      if(song.deletedAt&&!old?.deletedAt&&request.headers.get("X-Studio-Deletion-Policy")!=="14-days-v1")
        return Response.json({error:"The deletion policy has changed. Reload the Studio to review the 14-day recovery notice before deleting this song."},{status:409,...options});
      if(song.deletedAt&&!old?.deletedAt&&data.songs.some(other=>!other.deletedAt&&songDependsOn(other,song)))
        return Response.json({error:"Another song uses this recording, mix or video source. Choose a replacement in that song before deleting this one."},{status:409,...options});
      if(!old&&env.DB&&await env.DB.prepare("select song_id from song_deletion_jobs where owner = ? and song_id = ?").bind(id,song.id).first())
        return Response.json({error:"This song has been permanently deleted. Reload your library before creating another song."},{status:409,...options});
    }
  }catch(error){return Response.json({error:(error as Error).message},{status:409,...options});}
  const previousTemplates = new Map((previous.data?.templates ?? []).map(template => [template.id, template]));
  const dirtyText = (value: unknown, old: unknown, depth = 0): boolean => {
    if (depth > 8) return true;
    if (value === old) return false;
    if (typeof value === "string") return hasExplicitWords(value);
    if (!value || typeof value !== "object") return false;
    const previous = old && typeof old === "object" ? old as Record<string, unknown> : {};
    return Object.entries(value).some(([key, next]) => dirtyText(next, previous[key], depth + 1));
  };
  const dirtyNotes = (notes: Record<string, string> | undefined, old: Record<string, string> | undefined) =>
    Object.entries(notes ?? {}).some(([field, value]) => dirtyText(value, old?.[field]));
  const rejected = data.songs.some(song => {
    const old = previousSongs.get(song?.id);
    const cues = song?.lyricVideo?.cues ?? [];
    const newSnapshots = (["lyrics", "prompt"] as const).some(field => Array.isArray(song?.versions?.[field]) &&
      song.versions[field].some(version => dirtyText(version?.text, old?.versions?.[field]?.find(item => item.id === version?.id)?.text)));
    return (song?.explicit === true && old?.explicit !== true) ||
      dirtyText(song?.logoDesign,old?.logoDesign) || dirtyText(song?.musicalAd,old?.musicalAd) || dirtyText(song?.name, old?.name) || dirtyText(song?.suno, old?.suno) || dirtyNotes(song?.notes, old?.notes) ||
      dirtyText(song?.summary, old?.summary) || dirtyText(song?.tags, old?.tags) || dirtyText(song?.mixes, old?.mixes) || newSnapshots ||
      (JSON.stringify(cues) !== JSON.stringify(old?.lyricVideo?.cues ?? []) && cues.some(cue => hasExplicitWords(cue.text)));
  }) || data.templates.some(template => {
    const old = previousTemplates.get(template?.id);
    return dirtyText(template?.name, old?.name) || dirtyText(template?.description, old?.description) || dirtyText(template?.tags, old?.tags) || dirtyNotes(template?.notes, old?.notes);
  });
  if (rejected || dirtyText(data.discovery, previous.data?.discovery) || dirtyText(data.station?.customPlaylists?.map(item => item.name), previous.data?.station?.customPlaylists?.map(item => item.name)) ||
      dirtyText(data.folders?.map(item => item.name), previous.data?.folders?.map(item => item.name)) ||
      dirtyText(data.voices?.map(item => [item.name, item.description]), previous.data?.voices?.map(item => [item.name, item.description]))) return Response.json({ error: cleanWordsMessage }, { status: 422 });
  const songs: Studio["songs"] = data.songs.map(song => {
    const existing = previousSongs.get(song?.id);
    if (song.lyricVideo?.pro && JSON.stringify(song.lyricVideo) !== JSON.stringify(existing?.lyricVideo))
      song = { ...song, lyricVideo: { ...song.lyricVideo, pro: { ...song.lyricVideo.pro, updatedAt: new Date().toISOString() } } };
    return stampSong({ ...song, partySource:existing?.partySource,sectionEdit:existing?.sectionEdit,coverAsset:song.coverAsset??existing?.coverAsset,logoAsset:song.logoAsset??existing?.logoAsset,logoDesign:song.logoDesign??existing?.logoDesign,musicalAd:song.musicalAd??existing?.musicalAd,projectId: existing ? existing.projectId : song.projectId, sourceSessionId: existing?.sourceSessionId, explicit: existing?.explicit, audioFormat: existing?.audioFormat, audioId: existing?.audioId, audioHistory: existing?.audioHistory, generation: existing?.generation, instrumental: existing?.instrumental, creationKind: existing?.creationKind, creationSeconds: existing?.creationSeconds ?? (!existing?.audioFormat && song.creationDraft && isTrackDuration(song.creationSeconds) ? song.creationSeconds : undefined) },existing);
  });
  // Omission is not an explicit Delete action. Preserve songs from older clients.
  const incomingIds = new Set(songs.map(song => song.id));
  for (const song of previousSongs.values()) {
    if (!incomingIds.has(song.id)) songs.push(song);
  }
  // Older clients may omit newly added collections/settings. Omission is not deletion.
  const next = { ...previous.data, ...data, songs, ...(data.discovery === undefined && previous.data?.discovery ? { discovery: previous.data.discovery } : {}) };
  const content = JSON.stringify(next);
  if (new TextEncoder().encode(content).length > maxStudioBytes)
    return Response.json({ error: "The studio has reached its storage limit." }, { status: 413 });
  try {
    // Restoring an archive must never silently republish an earlier release.
    // Unlist before changing archive state; a failed write is safe to retry.
    for(const song of songs){const old=previousSongs.get(song.id);if(old&&!!old.deletedAt!==!!song.deletedAt){await revokeSongShare(id,song.id);if(env.DB)await env.DB.prepare("update community_releases set listed = 0 where owner = ? and song_id = ?").bind(id,song.id).run();}}
    const saved = await writeStudio(id, revision, content);
    return saved ? Response.json({ ...saved, data: next }, options) : saveConflict();
  } catch (error) {
    console.error("Studio save failed", error);
    return Response.json({ error: "The studio could not save your changes. Keep this page open and try again." }, { status: 503 });
  }
}

export const PUT = recoverableRoute(putWorkspace, "The studio could not save. Your edits are still in this tab; try again.");
