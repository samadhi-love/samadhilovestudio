import type { SectionDirection } from "./song-section-directions";
import type { LanguageProfile } from "./music-language";
import type { Discovery } from "./music-workspace-data";
import type { Instrumental } from "./creation-guide";
import type { PlaylistId } from "./playlist-data";
import type { LyricProject } from "./lyric-video-data";

export { featuredGenres as styles } from "./music-genres";
import { featuredGenres as styles } from "./music-genres";
export const stages = ["Idea", "Writing", "Production", "Release ready", "Released"];
export const artNames = ["Solar", "Violet", "Ocean", "Rose"];
export const tasks = ["Lock lyrics and final mix", "Export master and stems", "Approve cover art and credits", "Export lyric video and short clips", "Schedule distribution and release date", "Prepare captions and promo links", "Publish and share the release"];

export const fields = {
  lyrics: "Lyrics", prompt: "Creative prompt", vocals: "Vocal direction", instruments: "Instrument direction",
  cover: "Cover-art concept", video: "Lyric-video concept", promotion: "Promotion plan"
} as const;
export type Field = keyof typeof fields;
export type Version = { id: string; label: string; date: string; text: string };
export type Mix = { id: string; name: string; notes: string; link: string; audioSongId?: string };
export type Template = { id: string; name: string; description: string; tags: string[]; notes: Record<Field, string>; favorite?: boolean };
export const audioTypes = { mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", flac: "audio/flac", ogg: "audio/ogg", opus: "audio/ogg", webm: "audio/webm" } as const;
export type AudioFormat = keyof typeof audioTypes;
export const audioAccept = Object.keys(audioTypes).map(format => "." + format).join(",");
export const audioFormatsLabel = "MP3, WAV, M4A, FLAC, OGG, OPUS or WebM";
export const maxAudioBytes = 96 * 1024 * 1024;
/** Owner-scoped upload retry receipts; never permit them to overwrite a target. */
export function validCreationReference(id: string | null, target: string | null, instrumental: string | null) {
  if (!id) return true;
  if (target || !/^[\w-]{1,100}$/.test(id)) return false;
  // Keep legacy local-sketch references. Ordinary recorded audio uses UUIDs.
  return !!instrumental || /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(id);
}
export function isAudioFormat(value: string): value is AudioFormat {
  return Object.hasOwn(audioTypes, value);
}

export type Song = {
  writingRevision?:number;
  id: string; name: string; summary: string; tags: string[]; stage: string; art: number; example: boolean;
  notes: Record<Field, string>; versions: Record<"lyrics" | "prompt", Version[]>;
  audioFormat?: AudioFormat;
  audioId?: string;
  partySource?:"upload"|"recording"|"mix";
  sectionEdit?:import("./song-section-data").SectionEditPlan;
  coverAsset?:string;
  logoAsset?:string;
  melodyReference?: { assetId: string; contentType: string; durationSeconds: number; savedAt: string };
  melodyReferences?: { assetId: string; contentType: string; durationSeconds: number; savedAt: string }[];
  musicalAd?:import("./musical-ad").MusicalAd;
  logoDesign?:import("./brand-logo").BrandLogo;
  audioHistory?: { audioId: string; audioFormat: AudioFormat; date: string; name: string; sectionEdit?:import("./song-section-data").SectionEditPlan }[];
  explicit?: boolean;
  lyricVideo?: LyricProject;
  generation?: { requestId?:string; provider: string; model: string; audioId?: string; status?: "generating" | "complete" | "incomplete"; approvedLyrics: string; compositionPlan: unknown; createdAt: string; captionReady: boolean; timingSource: string; languageProfile?: LanguageProfile };
  creationDraft?: boolean;
  instrumental?: Instrumental;
  creationKind?: "instrumental";
  creationSeconds?: number;
  createdAt?: string;
  updatedAt?: string;
  sectionDirections?: SectionDirection[];
  deletedAt?: string;
  deleteAfter?: string;
  favorite?: boolean;
  folderId?: string;
  suno?: { bpm: string; mood: string; minutes: "3" | "4"; duet: boolean };
  releaseLinks?: { spotify: string; hyperfollow: string };
  projectId?: string;
  sourceSessionId?: string;
  master?: { songId: string; audioId: string };
  releaseMetadata?: { artist: string; credits: string; isrc: string; upc: string; copyright: string };
  mixes: Mix[]; preferred: string; done: boolean[]; releaseDate: string;
};
export const playerSkins = { classic: "Classic Silver", cosmic: "Cosmic Violet", solar: "Solar Gold" } as const;
export type CustomPlaylist = { id: string; name: string; tracks: string[] };
export type Folder = { id: string; name: string };
export type Station = { skin: keyof typeof playerSkins; queue?: string[]; playlists?: Partial<Record<PlaylistId, string[]>>; customPlaylists?: CustomPlaylist[] };
export type Voice = { id: string; name: string; description: string };
export type StorageVersions = {songs:Record<string,{revision:number;hash:string}>;settings:{revision:number;hash:string}};
export type Studio = { songs: Song[]; templates: Template[]; station?: Station; voices?: Voice[]; folders?: Folder[]; discovery?: Discovery; autoSavePrompts?: boolean; _storage?:StorageVersions };

export function songAudioUrl(id: string, audioId?: string) {
  const url = `/api/studio/audio?song=${encodeURIComponent(id)}`;
  return audioId ? `${url}&v=${encodeURIComponent(audioId)}` : url;
}

export const emptyNotes: Record<Field, string> = { lyrics: "", prompt: "", vocals: "", instruments: "", cover: "", video: "", promotion: "" };
export function freshSong(id: string, name: string, index: number, template?: Template): Song {
  return {
    id, name, art: index % artNames.length, stage: "Idea", example: false, summary: template?.description ?? "",
    tags: [...(template?.tags ?? [])], notes: { ...(template?.notes ?? emptyNotes) }, versions: { lyrics: [], prompt: [] },
    mixes: [], preferred: "", done: tasks.map(() => false), releaseDate: "",
  };
}
const templates: Template[] = [
  { id: "duet", name: "Dabke x Euro House Duet", description: "A stomping call-and-response that opens into a melodic festival drop.", tags: [styles[0], styles[1]], notes: {
    ...emptyNotes, lyrics: "[Intro – Spoken male]\nTHIS IS SAMADHI!\n\n[Verse – Male]\n\n[Pre-Chorus – Female]\n\n[Chorus – Both]\n\n[Darbuka Breakdown]\n\n[Final Chorus – Crowd]",
    prompt: "Arabian Euro House fused with Lebanese Dabke, 130 BPM. Clear, forward vocals, clipped deep male talk-sing answered by a soaring female lead. Darbuka dum-tek, oud, mijwiz, bright piano and a wide melodic drop.",
    vocals: "Deep male call, soaring female response, both leads in the hook.", instruments: "Darbuka, oud, mijwiz, warm sub-bass and bright piano."
  }},
  { id: "mantra", name: "Spiritual Dance Mantra", description: "A short mantra, layered harmonies and an uplifting, patient build.", tags: [styles[5], styles[4]], notes: {
    ...emptyNotes, lyrics: "[Whispered Intro]\n\n[Mantra]\n\n[Verse]\n\n[Mantra – Layered]\n\n[Instrumental Lift]\n\n[Final Mantra]",
    prompt: "Uplifting spiritual dance and melodic trance, intimate clear lead vocal, soft hand percussion, warm arpeggios, shimmering pads and a gradual euphoric lift.",
    vocals: "Start close and quiet. Let stacked harmonies bloom around the mantra.", instruments: "Hand percussion, ambient pads, arpeggiated synth and warm bass."
  }},
  { id: "bounce", name: "R&B / Hip-hop Crossover", description: "Soulful phrasing and tight rap over a half-time bounce.", tags: [styles[2], styles[3]], notes: {
    ...emptyNotes, lyrics: "[Intro – Whisper]\n\n[Verse – Rap]\n\n[Hook – Sung]\n\n[Verse – Rap]\n\n[Bridge – Duet]\n\n[Final Hook]",
    prompt: "Soulful R&B meets hip-hop. Crisp tin-can percussion, warm 808, oud accents, clipped staccato rap and a clearly sung duet hook.",
    vocals: "Alternate rhythmic talk-sing and smooth R&B. Keep consonants clear.", instruments: "808, dry tin-can hits, oud, ney and syncopated hi-hats."
  }},
];
const first = freshSong("home", "Love Will Take Us Home", 0, templates[0]);
Object.assign(first, { summary: "A dance anthem about finding our way home through love and compassion.", stage: "Production", example: true });
first.notes = { ...first.notes, lyrics: "[Intro – Deep male]\nTHIS IS SAMADHI!\n\n[Chorus – Both]\nLove will take us home\nEvery hand becomes a bridge\nEvery heart becomes a road\nLove will take us home",
  cover: "Two gold paths converge beneath a peach-colored eclipse.", video: "Let the hook appear one phrase at a time as gold orbits expand on the beat.",
  promotion: "Cut a 15-second hook teaser, then share a second clip with the live darbuka break." };
first.versions = { lyrics: [{ id: "seed-lyric", label: "First hook", date: "2026-11-09T12:00:00Z", text: first.notes.lyrics }], prompt: [{ id: "seed-prompt", label: "Duet arrangement", date: "2026-11-09T12:00:00Z", text: first.notes.prompt }] };
first.mixes = [{ id: "dawn", name: "Dawn Mix", notes: "Open on oud and a close duet. Let the piano enter at the first chorus. Save full percussion for the finale.", link: "" }, { id: "festival", name: "Festival Mix", notes: "Open with darbuka and clipped vocals. Bring in the full kick and mijwiz on the first drop.", link: "" }];
first.done[0] = true;
const second = freshSong("frequency", "I Am the Frequency", 1, templates[1]);
Object.assign(second, { summary: "A rising trance mantra built around love, light and remembrance.", stage: "Writing", example: true });
const third = freshSong("god", "Me, You & God", 2, templates[2]);
Object.assign(third, { summary: "An intimate duet about devotion and the space love makes for two.", stage: "Idea", example: true });
export const initialStudio: Studio = { songs: [first, second, third], templates };

export const emptyCreatorStudio: Studio = { songs: [], templates };
