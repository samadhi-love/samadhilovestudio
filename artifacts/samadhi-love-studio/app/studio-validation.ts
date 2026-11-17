import {isBrandLogo} from "./brand-logo";
import {isLanguageProfile} from "./music-language";
import {isSectionEditPlan} from "./song-section-data";
import {isMusicalAd} from "./musical-ad";
import { fields, isAudioFormat, type Studio } from "./studio-data";
import { isLyricProject } from "./lyric-video-data";
import { isDiscovery } from "./music-workspace-data";
import { isSectionDirections } from "./song-section-directions";
import { isInstrumental } from "./creation-guide";
import { validReleaseMetadata } from "./project-assets";

const object = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string";
const id = (v: unknown): v is string => text(v) && /^[\w-]{1,100}$/.test(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text);
const optional = (v: unknown, check: (v: any) => boolean) => v === undefined || check(v);
const validMelodyReference = (reference: unknown) => object(reference) && id(reference.assetId) &&
  ["audio/webm", "audio/wav", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/flac"].includes(reference.contentType) &&
  Number.isFinite(reference.durationSeconds) && reference.durationSeconds > 0 && reference.durationSeconds <= 300 &&
  text(reference.savedAt) && Number.isFinite(Date.parse(reference.savedAt));
const notes = (v: unknown) => object(v) && Object.keys(fields).every(k => text(v[k]));
function entries(v: unknown, check: (v: Record<string, any>) => boolean) {
  if (!Array.isArray(v)) return false;
  const ids = new Set<string>();
  return v.every(item => {
    if (!object(item) || !id(item.id) || ids.has(item.id) || !check(item)) return false;
    ids.add(item.id); return true;
  });
}
const versions = (v: unknown) => object(v) && ["lyrics", "prompt"].every(k =>
  entries(v[k], item => text(item.label) && text(item.date) && text(item.text)));
const audio = (v: unknown) => typeof v === "string" && isAudioFormat(v);
const boolean = (v: unknown) => typeof v === "boolean";

/** Validate without normalizing, stripping extensions, or rewriting old saved data. */
export function isStudio(value: unknown): value is Studio {
  try {
    if (!object(value)) return false;
    return entries(value.songs, s =>
      text(s.name) && text(s.summary) && strings(s.tags) && text(s.stage) &&
      Number.isSafeInteger(s.art) && s.art >= 0 && boolean(s.example) && notes(s.notes) && versions(s.versions) &&
      entries(s.mixes, m => text(m.name) && text(m.notes) && text(m.link) && optional(m.audioSongId, id)) &&
      text(s.preferred) && Array.isArray(s.done) && s.done.every(boolean) && text(s.releaseDate) &&
      [s.projectId, s.sourceSessionId, s.folderId, s.audioId,s.coverAsset,s.logoAsset].every(v => optional(v, id)) &&
      optional(s.melodyReference, validMelodyReference) &&
      optional(s.melodyReferences, references => Array.isArray(references) && references.every(validMelodyReference)) &&
      optional(s.partySource,(value:unknown)=>["upload","recording","mix"].includes(value as string)) &&
      optional(s.sectionEdit,isSectionEditPlan) &&
      optional(s.logoDesign,isBrandLogo) && optional(s.musicalAd,isMusicalAd) &&
      (s.generation?.languageProfile === undefined || isLanguageProfile(s.generation.languageProfile)) &&
      [s.explicit, s.creationDraft, s.favorite].every(v => optional(v, boolean)) &&
      optional(s.deletedAt, text) && optional(s.deleteAfter,d=>typeof d==="string"&&d.length<=40&&Number.isFinite(Date.parse(d))) && optional(s.audioFormat, audio) &&
      [s.createdAt,s.updatedAt].every(v=>optional(v,(d:unknown)=>typeof d==="string"&&d.length<=40&&Number.isFinite(Date.parse(d)))) &&
      optional(s.audioHistory, history => Array.isArray(history) && history.every(a => object(a) && id(a.audioId) && audio(a.audioFormat) && text(a.date) && text(a.name) && optional(a.sectionEdit,isSectionEditPlan))) &&
      optional(s.master, m => object(m) && id(m.songId) && id(m.audioId)) &&
      optional(s.releaseMetadata, validReleaseMetadata) &&
      optional(s.releaseLinks, l => object(l) && text(l.spotify) && text(l.hyperfollow)) &&
      optional(s.suno, v => object(v) && text(v.bpm) && text(v.mood) && text(v.minutes) && boolean(v.duet)) &&
      optional(s.creationSeconds, n => Number.isFinite(n) && n > 0 && n <= 600) &&
      optional(s.instrumental, isInstrumental) && optional(s.sectionDirections, isSectionDirections) &&
      optional(s.lyricVideo, isLyricProject)) &&
      entries(value.templates, t => text(t.name) && text(t.description) && strings(t.tags) && notes(t.notes) && optional(t.favorite, boolean)) &&
      optional(value.autoSavePrompts, boolean) &&
      optional(value.folders, f => entries(f, item => text(item.name))) &&
      optional(value.voices, v => entries(v, item => optional(item.name, text) && optional(item.description, text))) &&
      optional(value.discovery, isDiscovery) &&
      optional(value.station, s => object(s) && ["classic", "cosmic", "solar"].includes(s.skin) &&
        optional(s.queue, strings) && optional(s.playlists, p => object(p) && Object.values(p).every(strings)) &&
        optional(s.customPlaylists, p => entries(p, item => text(item.name) && strings(item.tracks))));
  } catch {
    return false;
  }
}
