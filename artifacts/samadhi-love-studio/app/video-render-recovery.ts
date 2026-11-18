import {recoveryStore} from "./draft-recovery";

export type VideoCheckpoint={fingerprint:string;token:string;completed:number;finished?:boolean;jobId?:string;options?:{resolution:720|1080;fallback:boolean;cleanExport:boolean;batch:boolean}};
export function renderKey(workspace:string,songId:string){return `${encodeURIComponent(workspace)}:video-export:${songId}`;}
export async function readRender(key:string){return (await recoveryStore<VideoCheckpoint>(key,"read"))?.value;}
export async function saveRender(key:string,value:VideoCheckpoint){
  await recoveryStore(key,"write",{version:1,at:new Date().toISOString(),value});
}
export type VideoUploadCheckpoint={owner:string;song:string;source:string;size:number;type:string;fingerprint:string;hashes:string[];upload:string};
export function videoUploadKey(value:Pick<VideoUploadCheckpoint,"owner"|"song"|"source"|"fingerprint">){
  return `${renderKey(value.owner,value.song)}:upload:${encodeURIComponent(value.source)}:${value.fingerprint}`;
}
export async function readVideoUpload(value:Parameters<typeof videoUploadKey>[0]){
  return (await recoveryStore<VideoUploadCheckpoint>(videoUploadKey(value),"read"))?.value;
}
export async function saveVideoUpload(value:VideoUploadCheckpoint){
  await recoveryStore(videoUploadKey(value),"write",{version:1,at:new Date().toISOString(),value});
}
export function segmentStore(key:string,token:string,format:string){
  const at=(index:number)=>`${key}:${token}:${format}:${index}`;
  return {
    async read(index:number){return (await recoveryStore<Blob>(at(index),"read"))?.value;},
    async write(index:number,value:Blob){await recoveryStore(at(index),"write",{version:1,at:new Date().toISOString(),value});},
  };
}
export async function videoJob(input:object,workspace?:string){
  const response=await fetch("/api/studio/jobs",{method:"POST",headers:{"Content-Type":"application/json",...(workspace?{"X-Studio-Workspace":workspace}:{})},body:JSON.stringify(input),keepalive:true});
  const result=await response.json() as {error?:string;jobId?:string};
  if(!response.ok)throw new Error(result.error??"Your video job could not save.");
  window.dispatchEvent(new Event("samadhi-jobs-updated"));
  return result.jobId;
}
