import type {ProSettings} from './lyric-pro-data';
/** Retain inactive assets in the project, but never fetch/decode them for preview or export. */
export function activeAdMedia(pro?:ProSettings){
 if(!pro||pro.useTemplateBackground)return{footage:undefined,photos:[]};
 return{footage:pro.backgroundVideo,photos:pro.backgroundVideo?[]:pro.adPhotoStory?.photos??[]};
}
