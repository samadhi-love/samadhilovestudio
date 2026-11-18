// Shared server entry point for durable processing state.
import {serverStorage} from "./storage";
import {createExclusiveJob,readJob,updateJob,listJobs} from "../../scripts/storage/jobs.mjs";
function database(){
  if(!serverStorage.DB)throw new Error("Job storage is unavailable.");
  return serverStorage.DB;
}
export type JobType="music-generation"|"lyric-sync"|"video-render";
export const createStudioJob=async(owner:string,input:{id?:string;type:JobType;songId:string})=>{
  const db=database();
  if(serverStorage.STUDIO_ROW_STORAGE!=="verified"){
    // FK-only anchor, not a song copy or an active song store. Only an owned
    // legacy song can create one; never overwrite any existing per-song data.
    await db.prepare(`INSERT INTO studio_songs(owner,id,revision,content,position)
      SELECT ?,?,0,'{}',0 FROM studios w,json_each(w.content,'$.songs') s
      WHERE w.owner=? AND json_extract(s.value,'$.id')=?
      AND json_extract(s.value,'$.deletedAt') IS NULL
      AND NOT EXISTS(SELECT 1 FROM studio_accounts WHERE owner=? AND verified=1)
      ON CONFLICT(owner,id) DO NOTHING`).bind(owner,input.songId,owner,input.songId,owner).run();
  }
  return createExclusiveJob(db,owner,{id:input.id??crypto.randomUUID(),type:input.type,songId:input.songId});
};
export const readStudioJob=(owner:string,id:string)=>readJob(database(),owner,id);
export const listStudioJobs=(owner:string,options:{songId?:string;limit?:number}={})=>listJobs(database(),owner,options);
export const startStudioJob=(owner:string,id:string)=>updateJob(database(),owner,id,"waiting","working");
export const finishStudioJob=(owner:string,id:string)=>updateJob(database(),owner,id,"working","done");
export const failStudioJob=(owner:string,id:string,errorMessage:string)=>updateJob(database(),owner,id,"working","failed",{errorMessage});
