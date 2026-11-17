"use client";
import {useEffect,useRef,useState} from "react";
import {useRecoveryScope} from "./draft-recovery";

type Writing={title:string;prompt:string;lyrics:string;voice:string};
export function useAccountWriting(kind:"simple"|"custom",writing:Writing,enabled:boolean,restore:(writing:Writing)=>void){
  const json=JSON.stringify(writing);
  const scope=useRecoveryScope();
  const saved=useRef(""),version=useRef<number|null>(null),blocked=useRef(false),inFlight=useRef<Promise<void>|undefined>(undefined);
  const [status,setStatus]=useState("");
  const [candidate,setCandidate]=useState<{revision:number;writing:Writing}|null>(null);
  useEffect(()=>{
    if(!scope)return;
    let active=true;
    void fetch(`/api/studio/writing-draft?kind=${kind}`,{cache:"no-store"}).then(async r=>{
      if(!r.ok||!active)return;
      const result=await r.json() as {revision:number;writing?:Writing};
      if(!active||version.current!==null)return;
      if(result.writing){blocked.current=true;setCandidate({revision:result.revision,writing:result.writing});}
      else version.current=result.revision;
    }).catch(()=>{});
    return()=>{active=false;};
  },[scope,kind]);
  useEffect(()=>{
    if(!scope||!enabled||blocked.current||saved.current===json||!Object.values(writing).some(v=>v.trim()))return;
    let active=true;
    async function save(){
      try{
        if(version.current===null){
          const r=await fetch(`/api/studio/writing-draft?kind=${kind}`,{cache:"no-store"});
          if(!r.ok)throw new Error();
          const result=await r.json() as {revision:number;writing?:Writing};
          if(!active)return;
          // Do not silently overwrite a draft this form never opened.
          if(result.writing&&JSON.stringify(result.writing)!==json){
            blocked.current=true;setCandidate({revision:result.revision,writing:result.writing});setStatus("Your account draft was kept. Open it before continuing account autosave.");return;
          }
          version.current=result.revision;
        }
        const r=await fetch("/api/studio/writing-draft",{method:"PUT",headers:{"Content-Type":"application/json","X-Studio-Workspace":scope},body:JSON.stringify({kind,writing,revision:version.current})});
        const result=await r.json() as {revision:number;error?:string};
        if(r.status===409){blocked.current=true;setStatus(result.error??"This draft changed in another tab. Your device copy is safe.");return;}
        if(!r.ok)throw new Error();
        version.current=result.revision;saved.current=json;
        if(active)setStatus("Saved");
      }catch{if(active)setStatus("Not saved to your account. Your device recovery is still available.");}
    }
    const timer=setTimeout(async()=>{
      await inFlight.current;
      if(!active||blocked.current||saved.current===json)return;
      const pending=save();
      inFlight.current=pending;
      await pending;
      if(inFlight.current===pending)inFlight.current=undefined;
    },2200);
    return()=>{active=false;clearTimeout(timer);};
  },[json,enabled,kind,scope]);
  return {status,available:!!candidate,open(){
    if(!candidate)return;
    if(Object.values(writing).some(v=>v.trim()&&v!=="Writing draft")&&!window.confirm("Open the saved account draft in this form? Copy any current text you want to keep first."))return;
    version.current=candidate.revision;saved.current=JSON.stringify(candidate.writing);blocked.current=false;
    restore(candidate.writing);setCandidate(null);setStatus("Saved");
  }};
}
