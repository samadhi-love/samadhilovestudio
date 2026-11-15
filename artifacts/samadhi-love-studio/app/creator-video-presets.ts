import type { LyricProject, VideoTheme } from "./lyric-video-data";
import { getCaptionTemplate, type CaptionTemplateId } from "./lyric-caption-templates";
import { defaultProLook } from "./lyric-pro-data";
import { applyVisualTemplate } from "./lyric-visual-template";

export const socialVideoPresets = [
  {id:"tiktok",name:"TikTok",note:"Vertical hook · 30 seconds",format:"vertical",seconds:30,platform:"tiktok"},
  {id:"reels",name:"Reels",note:"Vertical moment · 30 seconds",format:"vertical",seconds:30,platform:"instagram"},
  {id:"shorts",name:"YouTube Shorts",note:"Vertical story · 60 seconds",format:"vertical",seconds:60,platform:"youtube"},
  {id:"youtube",name:"YouTube full song",note:"Widescreen · full song",format:"wide",seconds:0,platform:"youtube"},
  {id:"feed",name:"Square feed",note:"Square preview · 30 seconds",format:"square",seconds:30,platform:"instagram"},
] as const;
export type SocialVideoTarget = typeof socialVideoPresets[number]["id"];
/** Source-time range: the existing exporter shifts captions and audio together. */
export function shortClipRange(duration:number, start:number, seconds:number) {
  if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(start)||!Number.isFinite(seconds)||seconds<=0)throw new Error("Wait for the recording length, then choose a clip length.");
  const length=Math.min(seconds,duration),from=Math.max(0,Math.min(start,duration-length));
  return {start:from,end:Math.min(duration,from+length)};
}
export function suggestedHookStart(project:LyricProject) {
  const section=project.pro?.sections.find(s=>/chorus|hook|لازمة|كورس|припев|nakarat/i.test(s.name));
  return section?.time??project.cues.find(c=>c.text.trim())?.time??0;
}
export function applySocialVideoPreset(project:LyricProject,target:SocialVideoTarget,start=0,seconds?:number):LyricProject {
  const preset=socialVideoPresets.find(p=>p.id===target)!;
  if(!project.pro?.duration)throw new Error("Choose a recording and wait for its length before preparing a video.");
  const range=preset.seconds===0?{start:0,end:project.pro.duration}:shortClipRange(project.pro.duration,start,seconds??preset.seconds);
  return applyVideoShape({...project,pro:{...project.pro,range}},preset.format);
}
/** Reframe one project without trimming audio, rewriting captions or losing format overrides. */
export function applyVideoShape(project:LyricProject,format:LyricProject["format"]):LyricProject{
  if(!project.pro)return{...project,format};
  const existing=project.pro.formatLooks?.[format],look=existing??project.pro.look??defaultProLook;
  return{...project,format,pro:{...project.pro,formatLooks:{...project.pro.formatLooks,[format]:existing??{...look,safe:true,position:format==="vertical"?Math.min(.62,look.position):look.position}}}};
}

type CreatorLook={id:string;name:string;category:string;vibe:string;theme:VideoTheme;caption:CaptionTemplateId};
export const creatorVideoLooks:CreatorLook[]=[
  {id:"cosmic-hook",name:"Cosmic Hook",category:"Cosmic",vibe:"Cyan glow · floating words",theme:"cosmic",caption:"neon-pulse"},
  {id:"starlit-poetry",name:"Starlit Poetry",category:"Cosmic",vibe:"Moonlit silver · gentle shimmer",theme:"celestial",caption:"silver-cinema"},
  {id:"nebula-pop",name:"Nebula Pop",category:"Cosmic",vibe:"Coral skies · springy hooks",theme:"nebula",caption:"pop-burst"},
  {id:"violet-orbit",name:"Violet Orbit",category:"Cosmic",vibe:"Violet dream · orbiting accents",theme:"lavender",caption:"bubble-daydream"},
  {id:"sacred-gold",name:"Sacred Gold",category:"Sacred",vibe:"Warm devotion · illuminated verse",theme:"masters",caption:"illuminated-verse"},
  {id:"jesus-light",name:"Jesus",category:"Sacred",vibe:"Golden light · illuminated verse",theme:"jesus",caption:"illuminated-verse"},
  {id:"mary-grace",name:"Mother Mary",category:"Sacred",vibe:"Blue serenity · sacred script",theme:"mary",caption:"sacred-script"},
  {id:"lotus-light",name:"Lotus Light",category:"Sacred",vibe:"Gentle uplift · flowing script",theme:"lotus",caption:"sacred-script"},
  {id:"kriya-verse",name:"Kriya Verse",category:"Sacred",vibe:"Lineage artwork · readable gold",theme:"kriya",caption:"world-glyphs"},
  {id:"angel-song",name:"Angel Song",category:"Sacred",vibe:"Soft radiance · airy lettering",theme:"archangel",caption:"quiet-space"},
  {id:"desert-dialogue",name:"Desert Dialogue",category:"World Fusion",vibe:"Desert warmth · multilingual lyrics",theme:"desert",caption:"world-glyphs"},
  {id:"golden-dabke",name:"Golden Dabke",category:"World Fusion",vibe:"Amber celebration · bold hooks",theme:"amber",caption:"outline-anthem"},
  {id:"silk-road",name:"Silk Road",category:"World Fusion",vibe:"Teal geometry · graceful script",theme:"peacock",caption:"sacred-script"},
  {id:"world-garden",name:"World Garden",category:"World Fusion",vibe:"Living green · global poetry",theme:"tree",caption:"vertical-garden"},
  {id:"house-aurora",name:"House Aurora",category:"Dance",vibe:"Electric atmosphere · neon pulse",theme:"futuristic",caption:"neon-pulse"},
  {id:"chorus-drop",name:"Chorus Drop",category:"Dance",vibe:"Midnight contrast · impact words",theme:"midnight",caption:"impact-cut"},
  {id:"prism-party",name:"Prism Party",category:"Dance",vibe:"Color sweeps · kinetic chorus",theme:"portal",caption:"prism-flow"},
  {id:"sunset-bounce",name:"Sunset Bounce",category:"Dance",vibe:"Warm sunset · playful pop-ups",theme:"sunset",caption:"pop-burst"},
  {id:"ocean-letter",name:"Ocean Letter",category:"Cinematic",vibe:"Blue calm · handwritten reveal",theme:"ocean",caption:"ink-echo"},
  {id:"mountain-verse",name:"Mountain Verse",category:"Cinematic",vibe:"Open landscape · silver shimmer",theme:"nature",caption:"silver-cinema"},
  {id:"acoustic-dawn",name:"Acoustic Dawn",category:"Cinematic",vibe:"Golden morning · intimate words",theme:"dawn",caption:"ink-echo"},
  {id:"moonlit-rnb",name:"Moonlit R&B",category:"Cinematic",vibe:"Soft rose · rounded lettering",theme:"rose",caption:"bubble-daydream"},
  {id:"clean-hook",name:"Clean Hook",category:"Minimal",vibe:"Clear subtitles · gold highlight",theme:"monochrome",caption:"clear-voice"},
  {id:"silver-space",name:"Silver Space",category:"Minimal",vibe:"Cool silver · measured motion",theme:"silver",caption:"quiet-space"},
  {id:"arctic-voice",name:"Arctic Voice",category:"Minimal",vibe:"Crisp contrast · global lettering",theme:"arctic",caption:"world-glyphs"},
  {id:"bold-statement",name:"Bold Statement",category:"Minimal",vibe:"Rich ruby · outlined anthem",theme:"ruby",caption:"outline-anthem"},
];
export function applyCreatorVideoLook(project:LyricProject,id:string):LyricProject {
  const look=creatorVideoLooks.find(l=>l.id===id);if(!look)throw new Error("Choose an available video look.");
  const caption=getCaptionTemplate(look.caption)!;
  return applyVisualTemplate(project,{schema:"samadhi-lyric-visual/v1",name:look.name,visual:{theme:look.theme,motion:"drift",format:project.format,font:caption.font,color:caption.color,captionTemplate:look.caption,intensity:"gentle",bpm:project.bpm??100},captionMode:"karaoke",layout:{...(project.pro?.formatLooks?.[project.format]??project.pro?.look??defaultProLook),safe:true}});
}
