"use client";
import {useState} from "react";
import type {LyricProject} from "./lyric-video-data";
import {beatGrid} from "./beat-analysis";
import {soundtrackIdentity} from "./lyric-audio-identity";
export function BeatGridControls({project,change,disabled,analyze}:{project:LyricProject;change:(p:LyricProject)=>void;disabled:boolean;analyze:()=>void}){
 const [selected,setSelected]=useState(0),[error,setError]=useState("");const p=project.pro;if(!p)return null;const grid=p.beatGrid,stale=grid&&grid.source!==soundtrackIdentity(project);
 function patch(times:number[]){if(!grid)return;const sorted=[...times].sort((a,b)=>a-b);if(sorted.some((v,i)=>!Number.isFinite(v)||v<0||v>p!.duration||(i>0&&v<=sorted[i-1]))){setError("Keep beats distinct and inside the soundtrack.");return;}setError("");change({...project,pro:{...p!,beatGrid:{...grid,bpm:project.bpm??grid.bpm,offset:project.visualLayers?.beatOffset??grid.offset,beats:sorted,reviewed:false}}});}
 return <fieldset className="lvp-layer-controls" disabled={disabled}><legend>Detect &amp; review animation beats</legend>
 <p className="lvp-note">Estimate a fixed-tempo beat grid from the selected soundtrack on this device. Listen and correct it; rubato, syncopation, and half/double tempo can confuse detection. Lyric timestamps stay unchanged.</p>
 <button type="button" className="secondary" onClick={analyze}>Estimate beats from soundtrack</button>
 {grid&&<><p className="lvp-note">{grid.bpm} BPM · {grid.beats.length} beats · {grid.reviewed&&!stale?"Reviewed grid drives animation":"Estimate requires review"}{stale?" · soundtrack changed; analyze again":""}.</p>
 <div className="lvp-fields"><label>Beat to correct<select value={Math.min(selected,Math.max(0,grid.beats.length-1))} onChange={e=>setSelected(Number(e.target.value))}>{grid.beats.map((t,i)=><option key={i} value={i}>{i+1} · {t.toFixed(3)}s</option>)}</select></label>
 <label>Beat time (seconds)<input type="number" min="0" max={p.duration} step=".01" value={grid.beats[Math.min(selected,Math.max(0,grid.beats.length-1))]??0} disabled={!grid.beats.length} onChange={e=>{const n=e.target.valueAsNumber;if(Number.isFinite(n))patch(grid.beats.map((t,i)=>i===Math.min(selected,grid.beats.length-1)?n:t));}}/></label></div>
 <div className="lvp-actions"><button type="button" onClick={()=>{try{patch(beatGrid(project.bpm??grid.bpm,project.visualLayers?.beatOffset??grid.offset,p.duration));}catch(e){setError(e instanceof Error?e.message:"Check tempo.");}}}>Rebuild from tempo &amp; beat origin</button>
 <button type="button" disabled={!!stale||!grid.beats.length} onClick={()=>change({...project,pro:{...p,beatGrid:{...grid,reviewed:!grid.reviewed}}})}>{grid.reviewed?"Use manual tempo instead":"Mark reviewed · use this grid"}</button></div></>}
 {error&&<p role="alert">{error}</p>}
 </fieldset>;
}
