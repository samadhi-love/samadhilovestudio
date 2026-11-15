import {applyCreatorVideoLook} from './creator-video-presets';
import type {LyricProject} from './lyric-video-data';
/** Visual changes never replace the song, lyric words or source recording. */
export function applyPlayVisual(project:LyricProject,look?:string,photoAsset?:string){
 const next=look?applyCreatorVideoLook(project,look):project;
 return photoAsset&&next.pro?{...next,pro:{...next.pro,useTemplateBackground:true,background:photoAsset,sections:next.pro.sections.map(section=>({...section,background:undefined,theme:undefined}))}}:next;
}
