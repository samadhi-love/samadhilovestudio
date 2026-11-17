"use client";
import {crashDiagnostic} from "./crash-diagnostics";
export function reportPanelCrash(panel:string,action:string,error?:unknown) {
  try{
    const payload=crashDiagnostic(panel,action,error);
    const base=import.meta.env?.BASE_URL??"/";
    void fetch(`${base.replace(/\/$/,"")}/api/studio/client-errors`,{
      method:"POST",credentials:"same-origin",keepalive:true,
      headers:{"Content-Type":"application/json","X-Studio-Request-Id":payload.requestId},
      body:JSON.stringify(payload),
    }).catch(()=>{}); // Diagnostics must never crash or trigger a retry of a user action.
  }catch{/* Reporting itself is best effort, with no raw error fallback. */}
}
export function installActionCrashReporting() {
  const panel=()=>document.querySelector("[data-workspace]")?.getAttribute("data-workspace")??"studio";
  const error=(event:ErrorEvent)=>reportPanelCrash(panel(),"event",event.error);
  const rejection=(event:PromiseRejectionEvent)=>reportPanelCrash(panel(),"unhandled-rejection",event.reason);
  window.addEventListener("error",error);window.addEventListener("unhandledrejection",rejection);
  return()=>{window.removeEventListener("error",error);window.removeEventListener("unhandledrejection",rejection);};
}
