import { visualModel, visualRatio, type VisualMode } from "../../../visual-generation-data";
import type { VideoFormat } from "../../../lyric-video-data";
import { elevenLabsRequest } from "../elevenlabs/provider";

export async function visualJson(response: Response): Promise<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The visual provider returned an empty response.");
  let size = 0, text = "";
  const decoder = new TextDecoder();
  try {
    for (let part = await reader.read(); !part.done; part = await reader.read()) {
      size += part.value.length;
      if (size > 65536) { await reader.cancel(); throw new Error("The visual provider response was too large."); }
      text += decoder.decode(part.value, {stream:true});
    }
    const value = JSON.parse(text + decoder.decode());
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } finally { reader.releaseLock(); }
}

export function visualFailure(status: number) {
  if (status === 401) return "ElevenLabs rejected the saved key. Reconnect it in Settings.";
  if (status === 402) return "ElevenLabs requires Pro or higher, available credits and a sufficient key spending cap for image/video generation.";
  if (status === 403) return "Check Image & Video (Flows) permission, workspace access and regional restrictions on your ElevenLabs key.";
  if (status === 429) return "ElevenLabs is busy or your request limit was reached. Wait before starting another generation.";
  if ([400,404,422].includes(status)) return "ElevenLabs rejected these visual inputs or this model. Review the prompt, reference image and your workspace’s model access.";
  return "The provider did not confirm this request. Check its Image & Video history before generating again to avoid a second charge.";
}

export async function visualPlan(key: string) {
  try {
    const response = await elevenLabsRequest(key, "user/subscription", undefined, 10000);
    if (!response.ok) { await response.body?.cancel(); return {tier:null, eligible:null}; }
    const body = await visualJson(response), tier = typeof body.tier === "string" ? body.tier : null;
    // Unknown future/enterprise tiers are checked by the generation API, never guessed eligible.
    return {tier, eligible:tier && ["free","starter","creator"].includes(tier) ? false : null};
  } catch { return {tier:null, eligible:null}; }
}

export function visualPayload(mode: VisualMode, prompt: string, format: VideoFormat, reference?: {content_base64:string;mime_type:string}) {
  const common = {model_id:visualModel(mode), prompt, aspect_ratio:visualRatio(format,mode)};
  return mode === "image" ? common : {...common, duration_secs:4, resolution:"720p", generate_audio:false, enhance_prompt:false,
    ...(reference ? {start_frame:{type:"inline_base64",...reference}} : {})};
}

export const visualProvider = (key: string, kind: "image" | "video", id?: string, payload?: object) =>
  elevenLabsRequest(key, `flows/${kind}${id ? "/"+encodeURIComponent(id) : ""}`, payload, 45000);
