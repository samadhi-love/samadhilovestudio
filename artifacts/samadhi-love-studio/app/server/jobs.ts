// Shared server entry point for durable processing state.
import {serverStorage} from "./storage";
import {createExclusiveJob,readJob,updateJob,listJobs} from "../../scripts/storage/jobs.mjs";
function database(){
  if(!serverStorage.DB)throw new Error("Job storage is unavailable.");
  return serverStorage.DB;
}
export type JobType="music-generation"|"lyric-sync"|"video-render";
export const createStudioJob=(owner:string,input:{id?:string;type:JobType;songId:string})=>createExclusiveJob(database(),owner,{id:input.id??crypto.randomUUID(),type:input.type,songId:input.songId});
export const readStudioJob=(owner:string,id:string)=>readJob(database(),owner,id);
export const listStudioJobs=(owner:string,options:{songId?:string;limit?:number}={})=>listJobs(database(),owner,options);
export const startStudioJob=(owner:string,id:string)=>updateJob(database(),owner,id,"waiting","working");
export const finishStudioJob=(owner:string,id:string)=>updateJob(database(),owner,id,"working","done");
export const failStudioJob=(owner:string,id:string,errorMessage:string)=>updateJob(database(),owner,id,"working","failed",{errorMessage});
