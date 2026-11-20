"use client";
import {useEffect,useState} from "react";
import {AudioPlayer} from "./audio-player";
import {myVoiceUrl,type SavedVoice} from "./my-voice-data";
import {sessionRequest} from "./vocal/storage";
export function MyVoicePicker({disabled,onUseVoice,revision=0,initialId=""}:{disabled:boolean;onUseVoice:(blob:Blob,name:string)=>Promise<void>;revision?:number;initialId?:string}){
 const [voices,setVoices]=useState<SavedVoice[]>([]),[id,setId]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{let live=true;const controller=new AbortController();(async()=>{try{const all:SavedVoice[]=[];let cursor:string|null=null;const seen=new Set<string>();do{const page:{voices:SavedVoice[];next?:string}=await sessionRequest(myVoiceUrl()+(cursor?"?cursor="+encodeURIComponent(cursor):""),{signal:controller.signal});all.push(...page.voices);cursor=page.next??null;if(cursor&&seen.has(cursor))throw new Error("Voice listing stopped. Refresh to retry.");if(cursor)seen.add(cursor);}while(cursor);if(live){setVoices(all.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));setError("");}}catch(e){if(live)setError(e instanceof Error?e.message:"Your voices could not load.");}})();return()=>{live=false;controller.abort();};},[revision,refresh]);
 // A voice chosen in Create arrives already selected here.
 useEffect(()=>{if(initialId&&voices.some(v=>v.id===initialId))setId(initialId);},[initialId,voices]);
 const selected=voices.find(v=>v.id===id);
 return <section className="my-voice-picker" aria-label="My saved voice recordings"><h3>My Voice · reusable recordings</h3><p className="muted">Real saved performances for your productions. These are audio recordings, not a cloned voice model.</p>
 <label className="field">Saved voice<select value={id} disabled={disabled||busy} onChange={e=>setId(e.target.value)}><option value="">Choose your saved recording</option>{voices.map(v=><option value={v.id} key={v.id}>{v.name} · {v.duration.toFixed(1)}s</option>)}</select></label>
 {selected&&<AudioPlayer key={selected.id} src={myVoiceUrl(selected.id)} label="Saved original voice playback"/>}
 <div className="actions"><button type="button" className="secondary small" disabled={disabled||busy||!selected} onClick={async()=>{if(!selected)return;setBusy(true);setError("");try{const response=await fetch(myVoiceUrl(selected.id));if(!response.ok)throw new Error("The original voice could not load.");await onUseVoice(await response.blob(),selected.name);}catch(e){setError(e instanceof Error?e.message:"The voice could not be added.");}finally{setBusy(false);}}}>{busy?"Adding voice…":"Add saved voice to this production"}</button><button type="button" className="text-button" disabled={disabled||busy} onClick={()=>setRefresh(n=>n+1)}>Refresh voices</button></div>
 {!voices.length&&!error&&<p className="muted">Record in Vocal Studio, save the session, then select a take and choose “Save original to My Voice”.</p>}{error&&<p role="alert" className="notice">{error}</p>}
 </section>;
}
