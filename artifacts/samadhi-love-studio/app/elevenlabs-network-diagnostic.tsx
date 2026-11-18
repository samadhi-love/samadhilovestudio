"use client";
import {useState} from "react";
type Result={reachable:boolean;summary:string;requestId:string;httpStatus?:number;timings:{dnsMs?:number;connectionMs?:number;tlsMs?:number;responseMs?:number;totalMs:number}};
export function ElevenLabsNetworkDiagnostic({owner}:{owner:boolean}){
  const [busy,setBusy]=useState(false),[result,setResult]=useState<Result|null>(null),[error,setError]=useState("");
  if(!owner)return null;
  async function check(){
    if(busy)return;
    setBusy(true);setError("");setResult(null);
    try{
      const response=await fetch("/api/studio/elevenlabs/diagnostic",{method:"POST",cache:"no-store",signal:AbortSignal.timeout(35_000)});
      const value=await response.json() as Result&{error?:string};
      if(!response.ok)throw new Error(value.error??"The connection diagnostic could not finish.");
      setResult(value);
    }catch{setError("The connection diagnostic didn't finish. Try again in a moment.");}
    finally{setBusy(false);}
  }
  return <div className="guide-tip">
    <h4>Owner connection diagnostic</h4>
    <p className="muted">Check the server’s connection to ElevenLabs without sending a key or using credits. This does not verify music permissions.</p>
    <button type="button" className="secondary" disabled={busy} onClick={()=>void check()}>{busy?"Checking server connection…":"Check server reachability"}</button>
    {error&&<p role="alert">{error}</p>}
    {result&&<div role="status"><p>{result.summary}</p><dl>
      {([["dnsMs","Address lookup"],["connectionMs","Connection"],["tlsMs","Secure connection"],["responseMs","Waiting for response"],["totalMs","Total"]] as const).map(([field,label])=><div key={field}><dt>{label}</dt><dd>{result.timings[field]===undefined?"Not measured":`${result.timings[field]} ms`}</dd></div>)}
    </dl><p className="muted">Request reference: {result.requestId}</p></div>}
  </div>;
}
