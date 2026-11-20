import {applyCreatorVideoLook} from './creator-video-presets';
import {applyLyricBackground} from './lyric-background-picker';
import {videoThemes,type LyricProject,type VideoTheme} from './lyric-video-data';
/** Visual changes never replace the song, lyric words or source recording.
 * `look` is a background picker key ("theme:<id>" or "look:<id>") or an older plain look id. */
export function applyPlayVisual(project:LyricProject,look?:string,photoAsset?:string,footage?:{asset:string;duration:number}):LyricProject{
 let next=project;
 if(look?.startsWith('theme:')){const id=look.slice(6);if(Object.hasOwn(videoThemes,id))next=applyLyricBackground(project,id as VideoTheme,'all',0);}
 else if(look)next=applyCreatorVideoLook(project,look.startsWith('look:')?look.slice(5):look);
 // Your own short video fills the frame and loops; its sound stays muted.
 if(footage&&next.pro&&footage.duration>0&&footage.duration<=60.1)return {...next,pro:{...next.pro,useTemplateBackground:false,adPhotoStory:undefined,backgroundVideo:{asset:footage.asset,duration:footage.duration,trimStart:0,trimEnd:footage.duration,loop:true,fit:'cover' as const}}};
 return photoAsset&&next.pro?{...next,pro:{...next.pro,useTemplateBackground:true,background:photoAsset,sections:next.pro.sections.map(section=>({...section,background:undefined,theme:undefined}))}}:next;
}
