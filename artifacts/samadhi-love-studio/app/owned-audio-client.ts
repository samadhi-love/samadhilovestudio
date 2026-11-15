import {isAudioFormat,type Song,type Studio} from "./studio-data";
const uploadIds=new WeakMap<Blob,string>();
export async function uploadOwnedAudio(blob:Blob,name:string,format:string,owner:string,source:"upload"|"recording"|"mix",options:{signal?:AbortSignal;projectId?:string;editPlan?:unknown}={}){
 if(!isAudioFormat(format))throw new Error("Choose a supported MP3, WAV, M4A, FLAC, OGG, Opus or WebM file.");
 if(!uploadIds.has(blob))uploadIds.set(blob,crypto.randomUUID());
 const request=await fetch("/api/studio",{cache:"no-store",signal:options.signal}),workspace=await request.json() as {workspace?:string;revision?:number;error?:string};
 if(!request.ok||workspace.workspace!==owner||!Number.isSafeInteger(workspace.revision))throw new Error("Your account or library changed. Reopen your Studio before saving this audio.");
 const response=await fetch("/api/studio/audio",{method:"POST",signal:options.signal,headers:{"Content-Type":blob.type||"application/octet-stream","X-Studio-Workspace":owner,"X-Studio-Revision":String(workspace.revision),"X-Audio-Format":format,"X-Audio-Size":String(blob.size),"X-Song-Title":encodeURIComponent(name.slice(0,100)),"X-Studio-Clean-Audio":"1","X-Party-Source":source,"X-Party-Rights":"authorized","X-Party-Upload-Id":uploadIds.get(blob)!,...(options.projectId?{"X-Project-Song-Id":options.projectId}:{}),...(options.editPlan?{"X-Section-Edit-Plan":encodeURIComponent(JSON.stringify(options.editPlan))}:{})},body:blob});
 const result=await response.json() as {error?:string;songId?:string;data?:Studio};if(!response.ok||!result.songId)throw new Error(result.error||"The recording could not save. Your local audio is preserved; retry.");const song=result.data?.songs.find(s=>s.id===result.songId);if(!song?.audioFormat)throw new Error("The recording save was incomplete. Check My Music before retrying.");return song as Song;
}
