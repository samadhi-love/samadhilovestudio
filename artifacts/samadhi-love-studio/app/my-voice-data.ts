export type SavedVoice = { id: string; name: string; duration: number; createdAt: string; mime: string };
export const voiceMimeTypes = ["audio/wav", "audio/mpeg", "audio/webm", "audio/ogg", "audio/mp4", "audio/flac", "audio/x-wav", "application/octet-stream"];
export const myVoiceUrl = (id?: string) => "/api/studio/my-voice" + (id ? "?id=" + encodeURIComponent(id) : "");
export function detectVoiceMime(bytes:Uint8Array,fallback="application/octet-stream"){
 const text=(a:number,b:number)=>String.fromCharCode(...bytes.subarray(a,b));
 if(text(0,4)==="RIFF"&&text(8,12)==="WAVE")return "audio/wav";
 if(text(0,4)==="OggS")return "audio/ogg";
 if(text(0,4)==="fLaC")return "audio/flac";
 if(text(4,8)==="ftyp")return "audio/mp4";
 if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)return "audio/webm";
 if(text(0,3)==="ID3"||(bytes[0]===255&&(bytes[1]&224)===224))return "audio/mpeg";
 return voiceMimeTypes.includes(fallback.split(";")[0])?fallback.split(";")[0]:"application/octet-stream";
}
