"use client";
import {useEffect,useRef,useState} from "react";
import {disconnectedEngine,type MusicEngine,type MusicEngineStatus} from "./music-engine-data";
export function useMusicEngine(scope=""){
  const [status,setStatus]=useState(disconnectedEngine),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const sequence=useRef(0);
  async function update(engine?:MusicEngine){
    const current=++sequence.current;
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/studio/music-engine",{method:engine?"PUT":"GET",cache:"no-store",...(engine?{headers:{"Content-Type":"application/json"},body:JSON.stringify({engine})}:{})});
      const result=await response.json() as MusicEngineStatus&{error?:string};
      if(!response.ok)throw new Error(result.error??"Music settings could not be read.");
      if(typeof result.owner!=="boolean"||!["ace-step","elevenlabs"].includes(result.engine)||!["ace-step","elevenlabs"].includes(result.preferred))throw new Error("Music settings could not be read.");
      if(current===sequence.current)setStatus(result as MusicEngineStatus);
    }catch(error){if(current===sequence.current)setError(error instanceof Error?error.message:"Music settings could not be read.");}
    finally{if(current===sequence.current)setBusy(false);}
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- counter ref is bumped on purpose so late results from this run are ignored
  useEffect(()=>{setStatus(disconnectedEngine);void update();const refresh=()=>void update();window.addEventListener("focus",refresh);return()=>{sequence.current++;window.removeEventListener("focus",refresh);};},[scope]);
  return {status,error,busy,update};
}
export function MusicEngineSettings({access,advanced}:{access:ReturnType<typeof useMusicEngine>;advanced:boolean}){
  if(!advanced||!access.status.owner)return null;
  return <section className="provider-settings" aria-label="Music engine">
    <h3>Music engine · Advanced</h3>
    <label className="field">Owner&apos;s music engine<select value={access.status.preferred} disabled={access.busy} onChange={event=>void access.update(event.target.value as MusicEngine)}>
      <option value="ace-step">ACE-Step 1.5 · thinking quality</option><option value="elevenlabs">ElevenLabs</option>
    </select></label>
    <p className="muted">{access.status.notice||"ACE-Step is owner-funded and owner-only. Other creators keep their own ElevenLabs connection."}</p>
    {!access.status.configured&&<p className="muted">To connect ACE-Step, create a fal.ai account and add FAL_KEY in this project&apos;s Secrets. Never paste it into chat. Then refresh this panel.</p>}
    <p className="muted">Auto length uses Studio&apos;s song planner. With ACE-Step, the same fal.ai account also writes lyrics from your description (about a tenth of a cent); ElevenLabs is only a backup writer. Precise captions still use your ElevenLabs connection. Your private hum takes are not sent to either engine.</p>
    <button className="secondary" type="button" disabled={access.busy} onClick={()=>void access.update()}>Refresh engine status</button>
    {access.error&&<p role="alert">{access.error}</p>}
  </section>;
}
