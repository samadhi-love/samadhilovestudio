"use client";
import {useState} from "react";
import {Layers} from "lucide-react";
import type {Song} from "./studio-data";

/** Chooses one of your finished songs and opens Mix & Edit with both as separate tracks. Nothing is uploaded here. */
export function LayerOverSong({blob,title,songs,disabled,layer,initialSongId=""}:{blob:Blob|undefined;title:string;songs:Song[];disabled?:boolean;layer:(blob:Blob,title:string,songId:string)=>void;initialSongId?:string}){
 const choices=songs.filter(s=>s.audioFormat&&!s.deletedAt);
 const [songId,setSongId]=useState(choices.some(s=>s.id===initialSongId)?initialSongId:"");
 if(!choices.length)return null;
 return <div className="layer-over-song" data-testid="layer-over-song">
  <label className="field">Song to layer over<select value={songId} disabled={disabled} onChange={e=>setSongId(e.target.value)}><option value="">Choose one of your songs</option>{choices.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  <button type="button" className="secondary" disabled={disabled||!blob||!songId} onClick={()=>{if(blob&&songId)layer(blob,title,songId);}}><Layers size={15}/> Layer over song</button>
 </div>;
}
