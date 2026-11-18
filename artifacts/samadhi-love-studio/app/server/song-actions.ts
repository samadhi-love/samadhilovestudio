import {serverStorage} from "./storage";
import {readStudio,writeStudio,maxStudioBytes,audioKey} from "../api/studio/store";
import {duplicateSongDetails,stampSong} from "../song-library";
import {makeSavedSongPrompt,readSavedShape} from "../saved-song-prompts";
import {carryEditedCaptions} from "../caption-edit-continuity";
import {hasExplicitWords,isExplicitSong} from "../clean-content";
import type {Song,Studio} from "../studio-data";
import {isStudio} from "../studio-validation";
import {preservePaidSong,finishPaidSong} from "./song-recovery";
import {newProSettings} from "../lyric-pro-data";

export class SongActionError extends Error {
  constructor(message:string,readonly status=400,readonly voiceReferenceId?:string){super(message);}
}
export const validSongActionId=(value:unknown):value is string=>typeof value==="string"&&/^[\w-]{1,100}$/.test(value);
const prefix=(owner:string)=>`song-voice-references/v1/${encodeURIComponent(owner)}/`;
const sourceSong=(data:Studio|null,id:string)=>{
  const song=data?.songs.find(song=>song.id===id&&!song.deletedAt);
  if(!song)throw new SongActionError("Choose an available song from Your songs.",404);
  if(isExplicitSong(song))throw new SongActionError("Use a song with clean words for this action.");
  return song;
};
async function commit(owner:string,current:Awaited<ReturnType<typeof readStudio>>,data:Studio){
  if(!isStudio(data))throw new SongActionError("This change could not fit safely in your library. Your existing work is unchanged.",422);
  const content=JSON.stringify(data);
  if(new TextEncoder().encode(content).length>maxStudioBytes)throw new SongActionError("This library is too large to save another copy.",413);
  return writeStudio(owner,current.revision,content);
}
/** Copies trusted, owned metadata, never client-supplied audio identifiers. */
export async function duplicatePrivateSong(owner:string,sourceId:string,id:string){
  if(!validSongActionId(sourceId)||!validSongActionId(id)||sourceId===id)throw new SongActionError("Choose the song to duplicate.");
  const initial=await readStudio(owner),source=sourceSong(initial.data,sourceId),bucket=serverStorage.BUCKET;
  let copy:Song={...duplicateSongDetails(source,id),melodyReferences:undefined};
  const prior=initial.data!.songs.find(song=>song.id===id);
  if(prior){
    const object=source.audioFormat?await bucket?.head(audioKey(owner,id)):null;
    if(!prior.deletedAt&&(source.audioFormat?prior.audioId===id&&object?.customMetadata?.copySourceSongId===source.id:
      prior.name===copy.name&&JSON.stringify(prior.notes)===JSON.stringify(copy.notes)))return {song:prior};
    throw new SongActionError("That copy already exists. Refresh Your songs before trying again.",409);
  }
  if(source.audioFormat){
    if(!bucket)throw new SongActionError("Private recording storage is unavailable.",503);
    copy={...copy,creationDraft:false,stage:"Production",audioFormat:source.audioFormat,audioId:id,audioHistory:undefined,
      generation:source.generation?{...structuredClone(source.generation),audioId:id}:undefined,creationSeconds:source.creationSeconds};
    const project=source.lyricVideo?.pro&&source.lyricVideo.pro.sourceAudioId!==(source.audioId??source.id)?undefined:source.lyricVideo;
    if(project){
      const duration=project.pro?.duration;
      copy.lyricVideo=duration&&duration>0?carryEditedCaptions(structuredClone(project),{
        sourceSongId:source.id,sourceAudioId:source.audioId??source.id,fade:0,
        clips:[{songId:source.id,audioId:source.audioId??source.id,from:0,to:duration}],
      },id,id):structuredClone(project);
      if(copy.lyricVideo.pro){
        const carried=copy.lyricVideo.pro;
        // Keep timing/language, not private visual-asset links into the original.
        copy.lyricVideo.pro={...newProSettings(copy,carried.duration),approvedLyrics:carried.approvedLyrics,
          language:carried.language,languageProfile:carried.languageProfile,detectedLanguage:carried.detectedLanguage,
          alignment:carried.alignment?{...carried.alignment,audioId:id}:undefined};
      }
    }
    if(!isStudio({...initial.data!,songs:[copy,...initial.data!.songs]}))throw new SongActionError("This copy could not fit safely in your library. Nothing was changed.",422);
    const key=audioKey(owner,id),old=await bucket.head(key);
    const matches=(object:typeof old)=>object?.customMetadata?.copySourceSongId===source.id&&object.customMetadata.copySourceAudioId===(source.audioId??source.id);
    if(old&&!matches(old))throw new SongActionError("That recording identifier is already in use. Nothing was overwritten.",409);
    if(!old){
      const original=await bucket.get(audioKey(owner,source.audioId??source.id));
      if(!original)throw new SongActionError("The original recording could not be found. Nothing was changed.",404);
      const stored=await bucket.put(key,original.body,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:original.httpMetadata,
        customMetadata:{recoverable:"1",songId:id,audioId:id,audioFormat:source.audioFormat,title:copy.name,createdAt:new Date().toISOString(),
          copySourceSongId:source.id,copySourceAudioId:source.audioId??source.id}});
      if(!stored&&!matches(await bucket.head(key)))throw new SongActionError("The copy could not be confirmed. Your original is unchanged.",409);
    }
  }
  copy=stampSong(copy);
  if(source.audioFormat)await preservePaidSong(owner,copy); // Same private recovery format, no provider call/charge.
  for(let attempt=0;attempt<4;attempt++){
    const current=await readStudio(owner);
    if(!current.data)throw new SongActionError("Reopen Your songs before saving this copy.",409);
    const exists=current.data.songs.find(song=>song.id===id);
    if(exists){if(!exists.deletedAt&&exists.audioId===copy.audioId)return {song:exists};throw new SongActionError("This copy changed in another tab. Reopen Your songs.",409);}
    if(await commit(owner,current,{...current.data,songs:[copy,...current.data.songs]})){
      if(source.audioFormat){
        try{if(!await finishPaidSong(owner,copy))console.error("Song copy recovery completion pending",{requestId:crypto.randomUUID()});}
        catch{console.error("Song copy recovery completion pending",{requestId:crypto.randomUUID()});}
      }
      return {song:copy};
    }
  }
  throw new SongActionError("Your library changed while copying. Your original is safe; the audio copy is kept for recovery. Refresh and try again.",409);
}

export type VoiceReferenceInput={id:string;songId:string;audioId:string;name:string;vocals:string;from:number;to:number;bytes:Uint8Array};
export async function savePrivateVoiceReference(owner:string,input:VoiceReferenceInput){
  const {id,songId,audioId,name,vocals,from,to,bytes}=input;
  if(![id,songId,audioId].every(validSongActionId)||id.length>90||!name.trim()||name.length>100||!vocals.trim()||vocals.length>1000||
    hasExplicitWords(name)||hasExplicitWords(vocals)||!Number.isFinite(from)||!Number.isFinite(to)||from<0||to<=from||to-from>30)
    throw new SongActionError("Name the vocal idea, describe its sound, and choose up to 30 seconds.");
  const mp3=bytes.length>=12&&(bytes[0]===73&&bytes[1]===68&&bytes[2]===51||bytes[0]===255&&(bytes[1]&224)===224);
  if(!mp3||bytes.length>2*1024*1024)throw new SongActionError("Use a short MP3 reference clip smaller than 2 MB.");
  const initial=await readStudio(owner),source=sourceSong(initial.data,songId);
  if(!source.audioFormat||(source.audioId??source.id)!==audioId)throw new SongActionError("This recording changed. Reopen Save Voice and choose the current version.",409);
  const bucket=serverStorage.BUCKET;
  if(!bucket)throw new SongActionError("Private reference storage is unavailable.",503);
  if(!await bucket.head(audioKey(owner,audioId)))throw new SongActionError("The original recording is not available in your private storage.",404);
  const key=prefix(owner)+id,templateId="voice-"+id;
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new Uint8Array(bytes).buffer)),value=>value.toString(16).padStart(2,"0")).join("");
  const existing=await bucket.head(key);
  if(existing&&existing.customMetadata?.sha256!==hash)throw new SongActionError("That reference is already saved. Reopen Save Voice for a different clip.",409);
  if(!existing){
    const page=await bucket.list({prefix:prefix(owner),limit:64});
    if(page.objects.length>=64)throw new SongActionError("Your private vocal-reference collection is full. Existing clips have not been changed.",409);
    const stored=await bucket.put(key,bytes,{onlyIf:{etagDoesNotMatch:"*"},httpMetadata:{contentType:"audio/mpeg"},
      customMetadata:{name:name.trim(),sourceSongId:songId,sourceAudioId:audioId,from:String(from),to:String(to),sha256:hash,templateId,referenceOnly:"true"}});
    if(!stored){
      const raced=await bucket.head(key);
      if(raced?.customMetadata?.sha256!==hash)throw new SongActionError("The reference could not be confirmed. Your original is safe; try saving again.",409,id);
    }
  }
  // Keep the independently saved clip even if its library entry needs a retry.
  try{
    for(let attempt=0;attempt<4;attempt++){
      const current=await readStudio(owner);
      sourceSong(current.data,songId);
      const existingTemplate=current.data!.templates.find(template=>template.id===templateId);
      if(existingTemplate){
        if(readSavedShape(existingTemplate)?.voiceReferenceId!==id)throw new SongActionError("That saved sound already exists.",409,id);
        if(existingTemplate.name!==name.trim()||existingTemplate.notes.vocals!==vocals.trim())throw new SongActionError("This vocal idea was already saved with different details. Reopen Your Sounds or save a new idea; no writing was overwritten.",409,id);
        return {voice:{id,name:existingTemplate.name,duration:to-from}};
      }
      const template=makeSavedSongPrompt({name:name.trim(),tags:[...source.tags],lyrics:"",idea:"",
        instruments:source.notes.instruments,vocals:vocals.trim(),shape:{voiceReferenceId:id}},templateId);
      if(await commit(owner,current,{...current.data!,templates:[template,...current.data!.templates]}))
        return {voice:{id,name:template.name,duration:to-from}};
    }
  }catch(error){
    if(error instanceof SongActionError)throw error;
    throw new SongActionError("Your voice clip is kept privately, but its saved sound could not be confirmed. Press Save again.",503,id);
  }
  throw new SongActionError("Your voice clip is kept privately. Your library changed; press Save again to add its description.",409,id);
}
export async function readPrivateVoiceReference(owner:string,id:string){
  if(!validSongActionId(id))throw new SongActionError("Choose a saved reference.",400);
  const file=await serverStorage.BUCKET?.get(prefix(owner)+id);
  if(!file)throw new SongActionError("This private reference could not be found.",404);
  return file;
}
