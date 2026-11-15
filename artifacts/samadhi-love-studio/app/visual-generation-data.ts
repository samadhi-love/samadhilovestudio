import type { LyricProject, VideoFormat } from "./lyric-video-data";

export type VisualMode = "image" | "animate" | "video";
export type VisualJob = {
  id: string;
  song: string;
  source: string;
  mode: VisualMode;
  prompt: string;
  format: VideoFormat;
  createdAt: string;
  status: "submitting" | "pending" | "generating" | "importing" | "ready" | "failed" | "unknown";
  asset?: string;
  mime?: string;
  error?: string;
};

export const visualModes = {
  image: "Create an image",
  animate: "Animate an image",
  video: "Create a short video",
} as const;
export const visualModel = (mode: VisualMode) => mode === "image" ? "gemini-2.5-flash-image" : "veo-3.1-fast-generate-001";
export const visualRatio = (format: VideoFormat, mode: VisualMode) =>
  format === "vertical" ? "9:16" : format === "square" && mode === "image" ? "1:1" : "16:9";
export const visualActive = (job: VisualJob) => ["submitting", "pending", "generating", "importing"].includes(job.status);
export const visualId = (value: unknown): value is string => typeof value === "string" && /^[\w-]{1,100}$/.test(value);
export const visualRequestId = (value: unknown): value is string => typeof value === "string" && /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(value);

/** Only documented provider storage origins. Never follow a redirect or forward the API key. */
export function visualDownloadUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 16000) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      ["storage.googleapis.com", "api.elevenlabs.io"].includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

export function visualSignature(bytes: Uint8Array, mime: string) {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (mime === "image/png") return bytes.length >= 8 && [...bytes.slice(0,8)].join() === "137,80,78,71,13,10,26,10";
  if (mime === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === "image/webp") return ascii(0,4) === "RIFF" && ascii(8,12) === "WEBP";
  return mime === "video/mp4" && ascii(4,8) === "ftyp";
}

/** Applying a visual never edits audio, captions, excerpt boundaries or word timing. */
export function applyVisualJob(project:LyricProject,job:VisualJob,scene=false,duration?:number):LyricProject {
  const p=project.pro;
  if(!p||job.status!=="ready"||!job.asset||job.song!==p.sourceSongId||job.source!==p.sourceAudioId)
    throw new Error("Reopen the recording this visual belongs to before applying it.");
  if(job.mode==="image") {
    if(!scene)return {...project,pro:{...p,useTemplateBackground:true,background:job.asset,sections:p.sections.map(s=>({...s,background:undefined,theme:undefined}))}};
    const story=p.adPhotoStory??{photos:[],motion:"zoom",fit:"contain",transition:"dissolve",prompt:""};
    if(story.photos.some(photo=>photo.asset===job.asset))return {...project,pro:{...p,useTemplateBackground:false,backgroundVideo:undefined}};
    if(story.photos.length>=8)throw new Error("Use up to eight image scenes. Remove one before adding another.");
    return {...project,pro:{...p,useTemplateBackground:false,backgroundVideo:undefined,adPhotoStory:{...story,photos:[...story.photos,{asset:job.asset,name:job.prompt.slice(0,100)}]}}};
  }
  if(!duration||!Number.isFinite(duration)||duration<=0||duration>60)throw new Error("The generated clip could not be decoded as a supported short video.");
  return {...project,pro:{...p,useTemplateBackground:false,backgroundVideo:{asset:job.asset,duration,trimStart:0,trimEnd:duration,loop:true,fit:"contain"}}};
}
