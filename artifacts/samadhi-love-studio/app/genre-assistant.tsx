"use client";
import { useId } from "react";
import { fusionGenres, type GenreFusion } from "./genre-assist";

export function GenreAssistant({fusion,auto,setAuto,history,setHistory,name,setName,variation,apply,disabled=false,readCues,setReadCues,showCues=true}:{
  fusion:GenreFusion;auto:boolean;setAuto:(v:boolean)=>void;history:boolean;setHistory:(v:boolean)=>void;name:string;setName:(v:string)=>void;variation:()=>void;apply:(genres:string[])=>void;disabled?:boolean;readCues?:boolean;setReadCues?:(v:boolean)=>void;showCues?:boolean;
}){
 const id=useId();
 return <div className="genre-assistant" role="group" aria-label="Studio genre assistant"><div className="genre-assistant-heading"><h3>Let Studio invent a blend</h3><label className="checkline"><input type="checkbox" checked={auto} disabled={disabled} onChange={e=>setAuto(e.target.checked)}/> Studio chooses</label></div>
   <p>Build a named fusion from your description, saved prompt styles, and explicit lyric cues. You can edit every choice.</p>
   <label className="checkline"><input type="checkbox" checked={history} disabled={disabled} onChange={e=>setHistory(e.target.checked)}/> Use my saved prompts for suggestions</label>
   <div className="genre-fusion-preview"><strong>{name.trim()||fusion.name}</strong><span>{fusion.genres.join(" + ")}</span><small>{fusion.source}{history?` · ${fusion.historyCount} saved projects considered`:""}. Suggestions use text rules, not audio analysis or model training.</small></div>
   <label htmlFor={`${id}-name`}>Name your fusion<input id={`${id}-name`} maxLength={60} value={name} disabled={disabled} placeholder={fusion.name} onChange={e=>setName(e.target.value.replace(/[,\r\n]/g," "))}/></label>
   <div className="actions"><button type="button" className="secondary small" disabled={disabled} onClick={()=>apply(fusionGenres(fusion,name))}>Use this blend</button><button type="button" className="text-button" disabled={disabled} onClick={variation}>Try another blend</button></div>
   {showCues&&<div className="genre-lyric-cues">{setReadCues&&<label className="checkline"><input type="checkbox" checked={readCues} disabled={disabled} onChange={e=>setReadCues(e.target.checked)}/> Read genre directions from lyric code</label>}
     <p>Use <code>[Verse 1 | genre: Lebanese Dabke]</code> and <code>[Chorus | genre: Afro House]</code>, or put <code>{"{genre: R&B}"}</code> below a section heading. These are production directions; your lyric words stay unchanged.</p>
     {fusion.cues.cues.length>0&&<ul>{fusion.cues.cues.map((c,i)=><li key={i}><strong>{c.section}:</strong> {c.genre}</li>)}</ul>}
     {fusion.cues.errors.map((message,i)=><p role="alert" key={i}>{message}</p>)}
   </div>}
   <p className="muted">The connected music engine interprets the blend; exact genre transitions are not guaranteed. Built-in sketches retain their four palettes. Your full prompt history is not sent to the provider.</p>
 </div>;
}
