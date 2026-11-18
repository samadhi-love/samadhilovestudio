"use client";
import {useEffect,useRef,useState} from "react";
import {songAudioUrl,type Song} from "./studio-data";
import {readOwnedAudioDuration} from "./song-audio-tools";
import {renderStreamingMix} from "./streaming-audio-mix";
import {AudioPlayer} from "./audio-player";

export function SaveVoiceReference({song,saved,working}:{song:Song;saved:()=>Promise<void>;working?:(value:boolean)=>void}){
  const [name,setName]=useState((song.name+" · Voice idea").slice(0,100));
  const [vocals,setVocals]=useState(song.notes.vocals||"");
  const [seconds,setSeconds]=useState(0),[from,setFrom]=useState(0),[to,setTo]=useState(20);
  const [permission,setPermission]=useState(false),[busy,setBusy]=useState(false),[progress,setProgress]=useState(""),[error,setError]=useState("");
  const [reload,setReload]=useState(0);
  const [position,setPosition]=useState(0);
  const cached=useRef<{identity:string;details:string;id:string;blob:Blob}|null>(null),task=useRef<AbortController|null>(null);
  useEffect(()=>{
    const controller=new AbortController();setError("");
    void readOwnedAudioDuration(songAudioUrl(song.id,song.audioId),controller.signal).then(duration=>{
      if(!controller.signal.aborted){setSeconds(duration);setTo(Math.min(20,duration));}
    }).catch(error=>{if(!controller.signal.aborted)setError(error instanceof Error?error.message:"The recording could not load.");});
    return()=>{controller.abort();task.current?.abort();};
  },[song.id,song.audioId,reload]);
  useEffect(()=>{working?.(busy);return()=>working?.(false);},[busy,working]);
  async function save(){
    if(busy)return;
    if(!permission||!name.trim()||!vocals.trim()||name.length>100||vocals.length>1000||!seconds||!Number.isFinite(from)||!Number.isFinite(to)||from<0||to<=from||to>seconds||to-from>30){
      setError("Name the vocal idea, describe its sound, choose up to 30 seconds and confirm permission.");return;
    }
    const controller=new AbortController();task.current=controller;setBusy(true);setError("");
    try{
      const identity=`${song.id}:${song.audioId}:${from}:${to}`;
      const details=JSON.stringify([name.trim(),vocals.trim()]);
      if(cached.current?.identity!==identity){
        const result=await renderStreamingMix([{id:song.id,url:songAudioUrl(song.id,song.audioId)}],{
          clips:[{id:song.id,from,to}],fade:0,limit:30,bitrate:128000,
          metadata:{title:"Private vocal reference"},inheritCredits:true,signal:controller.signal,
          progress:(_,message)=>setProgress(message),
        });
        cached.current={identity,details,id:crypto.randomUUID(),blob:result.blob};
      }
      if(cached.current.details!==details)cached.current={...cached.current,details,id:crypto.randomUUID()};
      controller.signal.throwIfAborted();setProgress("Saving your private clip and sound…");
      const clip=cached.current!,form=new FormData();
      for(const[key,value]of Object.entries({id:clip.id,songId:song.id,audioId:song.audioId??song.id,name,vocals,from:String(from),to:String(to),permission:"true"}))form.set(key,value);
      form.set("clip",clip.blob,"voice-reference.mp3");
      const response=await fetch("/api/studio/song-actions",{method:"POST",body:form,signal:controller.signal});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error??"The saved sound could not be confirmed. Your original is safe; try again.");
      await saved();
    }catch(error){if(!controller.signal.aborted)setError(error instanceof Error?error.message:"The reference could not save. Your original is safe.");}
    finally{task.current=null;setBusy(false);setProgress("");}
  }
  return <section aria-label="Save a vocal idea">
    <p>Keep a private clip and reusable voice description in Your Sounds. These engines cannot clone a singer or follow a voice recording.</p>
    <AudioPlayer src={songAudioUrl(song.id,song.audioId)} label={`Listen to ${song.name} before choosing a voice clip`} onPosition={setPosition}/>
    <button className="secondary" type="button" disabled={busy||!seconds} onClick={()=>{const start=Math.max(0,Math.min(position,seconds-1));setFrom(start);setTo(Math.min(seconds,start+20));}}>Use current position · up to 20 seconds</button>
    <label>Name<input value={name} maxLength={100} disabled={busy} onChange={event=>setName(event.target.value)}/></label>
    <label>Describe the voice<textarea value={vocals} maxLength={1000} disabled={busy} onChange={event=>setVocals(event.target.value)} placeholder="Warm soul lead, gentle rasp, intimate delivery…"/></label>
    <div className="form-grid"><label>Clip start · seconds<input type="number" min={0} max={seconds||undefined} step=".1" value={from} disabled={busy} onChange={event=>setFrom(Number(event.target.value))}/></label>
    <label>Clip end · seconds<input type="number" min={0} max={seconds||undefined} step=".1" value={to} disabled={busy} onChange={event=>setTo(Number(event.target.value))}/></label></div>
    <p className="muted">Up to 30 seconds · the original stays unchanged · no provider call or credits.</p>
    <label className="check"><input type="checkbox" checked={permission} disabled={busy} onChange={event=>setPermission(event.target.checked)}/>I have permission to keep this audio as a private reference.</label>
    {error&&<p role="alert">{error}</p>}
    {!seconds&&error&&<button className="secondary" type="button" disabled={busy} onClick={()=>setReload(value=>value+1)}>Load recording again</button>}
    {progress&&<p role="status">{progress}</p>}
    <button className="primary" disabled={busy||!seconds} onClick={()=>void save()}>{busy?"Saving…":"Save to Your Sounds"}</button>
  </section>;
}
