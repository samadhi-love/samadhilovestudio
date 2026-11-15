"use client";
import type {Song} from './studio-data';
export function MobileProjectBar({songs,currentId,disabled,select}:{songs:Song[];currentId:string;disabled:boolean;select:(id:string)=>void}){
 return <div className="mobile-project-bar"><label htmlFor="mobile-project-select">My project</label><select id="mobile-project-select" aria-label="Open saved project" value={songs.some(s=>s.id===currentId)?currentId:''} disabled={disabled||!songs.length} onChange={e=>{if(e.target.value)select(e.target.value);}}><option value="">{songs.length?'Choose a saved song…':'Your saved songs appear here'}</option>{songs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>;
}
