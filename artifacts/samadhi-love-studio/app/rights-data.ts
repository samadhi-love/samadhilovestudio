export type RightsReview = { recording: "original" | "licensed" | "provider" | "cover" | "unknown"; composition: "original" | "licensed" | "public-domain" | "cover" | "unknown"; voices: "self" | "permission" | "none" | "unknown"; notes: string; reviewedAt?: string };
export type RecordingMatch = { status: "match" | "no-match"; provider: "AudD"; checkedAt: string; songId: string; audioId: string; start: number; duration: number; excerptSha256: string; artist?: string; title?: string; album?: string; link?: string };
export type RightsStatus = { available: boolean; review: RightsReview | null; checks: RecordingMatch[]; truncated?: boolean };
export const emptyRights: RightsReview = { recording: "unknown", composition: "unknown", voices: "unknown", notes: "" };
export function validRightsReview(value: unknown): value is RightsReview {
  const v = value as RightsReview;
  return !!v && ["original", "licensed", "provider", "cover", "unknown"].includes(v.recording) && ["original", "licensed", "public-domain", "cover", "unknown"].includes(v.composition) && ["self", "permission", "none", "unknown"].includes(v.voices) && typeof v.notes === "string" && v.notes.length <= 4000;
}
export const rightsUrl = (song: string, audio: string) => `/api/studio/rights?song=${encodeURIComponent(song)}&audio=${encodeURIComponent(audio)}`;
export function excerptPositions(duration: number) {
  if (!Number.isFinite(duration) || duration < .5) throw new Error("Choose a recording at least half a second long.");
  if (duration <= 10) return [0];
  if (duration < 20) return [0];
  if (duration < 30) return [0, duration - 10];
  return [0, (duration - 10) / 2, duration - 10];
}
/** A bounded mono 22.05kHz PCM excerpt, with no gain increase or original modification. */
export function recognitionExcerpt(buffer: Pick<AudioBuffer, "duration" | "sampleRate" | "numberOfChannels" | "getChannelData">, start: number) {
  const rate = 22050, duration = Math.min(10, buffer.duration - start);
  if (!Number.isFinite(start) || start < 0 || duration < .5) throw new Error("Choose an excerpt inside the recording.");
  const frames = Math.floor(duration * rate), bytes = new Uint8Array(44 + frames * 2), view = new DataView(bytes.buffer);
  const str = (at: number, value: string) => [...value].forEach((c,i) => view.setUint8(at+i,c.charCodeAt(0)));
  str(0,"RIFF"); view.setUint32(4,bytes.length-8,true); str(8,"WAVE"); str(12,"fmt "); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true); view.setUint32(24,rate,true); view.setUint32(28,rate*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true); str(36,"data"); view.setUint32(40,frames*2,true);
  const channels = Array.from({ length: buffer.numberOfChannels },(_,c) => buffer.getChannelData(c));
  for (let i=0;i<frames;i++) { const index = Math.min(channels[0].length-1,Math.floor((start+i/rate)*buffer.sampleRate)); const value = channels.reduce((sum,c) => sum+c[index],0)/channels.length; view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,value))*32767),true); }
  return { bytes, duration: frames/rate };
}
export function validRecognitionWav(bytes: Uint8Array) {
  if (bytes.length < 44 || bytes.length > 44 + 12 * 22050 * 2) return false;
  const v = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength), text = (a:number,b:number) => String.fromCharCode(...bytes.subarray(a,b));
  return text(0,4)==="RIFF" && text(8,12)==="WAVE" && text(12,16)==="fmt " && text(36,40)==="data" && v.getUint32(4,true)===bytes.length-8 && v.getUint32(16,true)===16 && v.getUint16(20,true)===1 && v.getUint16(22,true)===1 && v.getUint32(24,true)===22050 && v.getUint32(28,true)===44100 && v.getUint16(32,true)===2 && v.getUint16(34,true)===16 && v.getUint32(40,true)===bytes.length-44 && (bytes.length-44)%2===0 && bytes.length>=44+22050;
}
