"use client";
import {useEffect,useRef,useState} from "react";
import {useRecoveryScope} from "./draft-recovery";

type Writing={title:string;prompt:string;lyrics:string;voice:string};
export function useAccountWriting(kind:"simple"|"custom",writing:Writing,enabled:boolean,restore:(writing:Writing)=>void,device={ready:true,hasLocal:false}){
  const scope=useRecoveryScope(),key=`${scope}:${kind}`,json=JSON.stringify(writing);
  const latest=useRef(writing);latest.current=writing;
  const restoreRef=useRef(restore);restoreRef.current=restore;
  const saved=useRef(""),version=useRef<number|null>(null),blocked=useRef(false),inFlight=useRef<Promise<void>|undefined>(undefined);
  const forced=useRef<Writing|null>(null),context=useRef(key);
  const [resetCount,setResetCount]=useState(0),[hydrated,setHydrated]=useState(""),[status,setStatus]=useState("");
  if(context.current!==key){context.current=key;version.current=null;saved.current="";blocked.current=false;forced.current=null;}
  useEffect(()=>{
    if(!scope||!device.ready)return;
    let active=true;
    const initial=JSON.stringify(latest.current);
    void (async()=>{
      await inFlight.current;
      if(!active)return;
      try{
        const response=await fetch(`/api/studio/writing-draft?kind=${kind}`,{cache:"no-store"});
        if(!response.ok)throw new Error();
        const result=await response.json() as {revision:number;writing?:Writing};
        if(!active||context.current!==key)return;
        version.current=result.revision;
        // Device writing (including an explicit blank New song) wins. Never
        // replace typing that happened while this account read was in flight.
        if(!device.hasLocal&&!forced.current&&JSON.stringify(latest.current)===initial&&result.writing&&
          !Object.entries(latest.current).some(([field,value])=>value.trim()&&!(field==="title"&&value==="Writing draft"))){
          const resumed={...result.writing,title:result.writing.title==="Writing draft"?"":result.writing.title};
          restoreRef.current(resumed);saved.current=JSON.stringify(resumed);
        }
        setHydrated(key);
      }catch{if(active)setHydrated(key);}
    })();
    return()=>{active=false;};
  },[scope,kind,key,device.ready,resetCount]);
  useEffect(()=>{
    const keepBlank=device.hasLocal&&!Object.values(writing).some(value=>value.trim());
    if(!scope||!device.ready||hydrated!==key||blocked.current||(!enabled&&!forced.current&&!keepBlank)||saved.current===json&&!forced.current)return;
    let active=true;
    const snapshot=forced.current??writing,input=JSON.stringify(snapshot);
    async function save(){
      try{
        if(version.current===null){
          const response=await fetch(`/api/studio/writing-draft?kind=${kind}`,{cache:"no-store"});
          if(!response.ok)throw new Error();
          const result=await response.json() as {revision:number};
          if(!active||context.current!==key)return;
          version.current=result.revision;
        }
        const response=await fetch("/api/studio/writing-draft",{method:"PUT",headers:{"Content-Type":"application/json","X-Studio-Workspace":scope},body:JSON.stringify({kind,writing:snapshot,revision:version.current})});
        const result=await response.json() as {revision:number;error?:string};
        if(context.current!==key)return;
        if(response.status===409){blocked.current=true;setStatus("This writing changed in another tab. Your words are still kept on this device.");return;}
        if(!response.ok)throw new Error();
        version.current=result.revision;saved.current=input;
        if(forced.current===snapshot)forced.current=null;
        if(active)setStatus("");
      }catch{if(active)setStatus("Account saving did not finish. Your words are still kept on this device.");}
    }
    const timer=setTimeout(async()=>{
      await inFlight.current;
      if(!active||blocked.current||context.current!==key)return;
      const pending=save();inFlight.current=pending;await pending;
      if(inFlight.current===pending)inFlight.current=undefined;
    },forced.current?0:2200);
    return()=>{active=false;clearTimeout(timer);};
  },[json,enabled,kind,scope,key,hydrated,device.ready,resetCount]);
  return {status,available:false,open(){},reset(next:Writing){
    forced.current=next;blocked.current=false;version.current=null;saved.current="";setHydrated("");setStatus("");setResetCount(n=>n+1);
  }};
}
