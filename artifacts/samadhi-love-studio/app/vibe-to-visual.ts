import type {LyricProject,VideoTheme} from "./lyric-video-data";
import {applyVisualTemplate} from "./lyric-visual-template";
import {defaultProLook} from "./lyric-pro-data";
import {getCaptionTemplate,type CaptionTemplateId} from "./lyric-caption-templates";
import type {OverlayStyle} from "./lyric-overlay-designs";

type Vibe={id:string;name:string;note:string;theme:VideoTheme;caption:CaptionTemplateId;overlay:OverlayStyle;motion:LyricProject['motion'];terms:RegExp};
export const visualVibes:Vibe[]=[
  {id:"cosmic",name:"Cosmic Sacred Geometry",note:"Golden geometry · spacious glowing lyrics",theme:"silkroad",caption:"illuminated-verse",overlay:"mandala",motion:"drift",terms:/cosmic|sacred|spirit(?:ual)?|celestial|meditat(?:ion|ive)?|mantra|twilight|كون|روح|مقدس|نور/giu},
  {id:"neon",name:"Neon Synthwave",note:"Electric light · clean neon lettering",theme:"futuristic",caption:"neon-pulse",overlay:"spectrum",motion:"drift",terms:/synth(?:wave|esizer|s)?|neon|retro|cyber|futuris(?:tic|m)?|trance|electro/giu},
  {id:"minimal",name:"Minimalist Cinematic",note:"Quiet scenery · restrained readable captions",theme:"monochrome",caption:"quiet-space",overlay:"none",motion:"still",terms:/minimal|cinema(?:tic)?|acoustic|piano|intimate|ballad|quiet|soft|r&b|rnb|هادئ|بيانو/giu},
  {id:"organic",name:"Tribal Organic",note:"World instruments · warm gold and teal",theme:"earthbeat",caption:"world-glyphs",overlay:"unity",motion:"drift",terms:/tribal|organic|world|oud|darbuka|dabke|arab|tabla|sitar|afro|kora|djembe|bansuri|عود|دبكة|طبلة|عربي/giu},
  {id:"pop",name:"High-Energy Kinetic Pop",note:"Color ribbons · springy words",theme:"nebula",caption:"pop-burst",overlay:"ribbons",motion:"zoom",terms:/pop|energy|energetic|party|dance|house|bass|drop|hip.?hop|rap|رقص|راب/giu},
];
/** Transparent keyword matching of the artist's cues, not invented acoustic/instrument recognition. */
export function matchVisualVibe(text:string){
  const scores=visualVibes.map(v=>({v,score:[...text.slice(0,6000).matchAll(new RegExp(`(?:^|[^\\p{Script=Latin}\\p{N}])(?:${v.terms.source})(?=$|[^\\p{Script=Latin}\\p{N}])`,v.terms.flags))].length}));
  scores.sort((a,b)=>b.score-a.score);
  return {vibe:scores[0].score?scores[0].v:visualVibes[0],matched:scores[0].score>0};
}
export function applyVisualVibe(project:LyricProject,id:string,keepBackground=true):LyricProject{
  const vibe=visualVibes.find(v=>v.id===id);
  if(!vibe)throw new Error("Choose one of the available visual vibes.");
  const caption=getCaptionTemplate(vibe.caption)!;
  const layout=project.pro?.formatLooks?.[project.format]??project.pro?.look??defaultProLook;
  const next=applyVisualTemplate(project,{schema:"samadhi-lyric-visual/v1",name:vibe.name,
    visual:{theme:vibe.theme,format:project.format,motion:vibe.motion,font:caption.font,color:caption.color,captionTemplate:vibe.caption,intensity:vibe.id==="minimal"?"gentle":"full",bpm:project.bpm??100,
      visualLayers:{backgroundMotion:vibe.id==="minimal"?0:.4,overlayAmount:vibe.id==="minimal"?0:.25,overlayStyle:vibe.overlay,overlayMotion:vibe.id!=="minimal",beatOffset:project.visualLayers?.beatOffset??0}},
    layout:{...layout,safe:true},captionMode:project.pro?.captionMode??"karaoke"});
  // Keep uploaded/generated images, footage, photo stories and section artwork by default.
  if(keepBackground){next.theme=project.theme;if(next.pro&&project.pro)next.pro={...next.pro,background:project.pro.background,useTemplateBackground:project.pro.useTemplateBackground,sections:project.pro.sections};}
  return next;
}
