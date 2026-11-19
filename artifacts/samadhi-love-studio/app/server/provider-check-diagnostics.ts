import {AsyncLocalStorage} from "node:async_hooks";
import {channel} from "node:diagnostics_channel";
import {randomUUID} from "node:crypto";

type Phase="request"|"connecting"|"waiting_response"|"reading_response"|"dns"|"tls";
export type CheckTrace={requestId:string;started:number;phase:Phase;httpStatus?:number};
const active=new AsyncLocalStorage<CheckTrace>();
const codes=new Set(["ENOTFOUND","EAI_AGAIN","ECONNREFUSED","ECONNRESET","ETIMEDOUT","EHOSTUNREACH","ENETUNREACH","UND_ERR_CONNECT_TIMEOUT","UND_ERR_HEADERS_TIMEOUT","UND_ERR_BODY_TIMEOUT","UND_ERR_SOCKET","ERR_TLS_CERT_ALTNAME_INVALID","DEPTH_ZERO_SELF_SIGNED_CERT","SELF_SIGNED_CERT_IN_CHAIN","CERT_HAS_EXPIRED","UNABLE_TO_VERIFY_LEAF_SIGNATURE","UNABLE_TO_GET_ISSUER_CERT_LOCALLY","ERR_SSL_WRONG_VERSION_NUMBER"]);
export function safeCheckFailure(error:unknown,phase:Phase){
  let value=error as {code?:unknown;name?:unknown;cause?:unknown}|undefined;
  let code:string|undefined,timeout=false;
  for(let n=0;value&&n<8;n++,value=value.cause as typeof value){
    if(typeof value.code==="string"&&codes.has(value.code)){code=value.code;break;}
    if(value.name==="TimeoutError"||value.name==="AbortError")timeout=true;
  }
  const kind=code==="ENOTFOUND"||code==="EAI_AGAIN"?"dns":
    code==="ECONNREFUSED"?"connection_refused":code==="ECONNRESET"||code==="UND_ERR_SOCKET"?"connection_reset":
    code&&(code.startsWith("ERR_TLS")||code.includes("CERT")||code.includes("SSL")||code.startsWith("DEPTH_"))?"tls":
    code==="UND_ERR_CONNECT_TIMEOUT"?"connect_timeout":code==="UND_ERR_HEADERS_TIMEOUT"?"response_timeout":
    code==="UND_ERR_BODY_TIMEOUT"?"body_timeout":timeout||code==="ETIMEDOUT"?
      phase==="connecting"?"connect_timeout":phase==="reading_response"?"body_timeout":phase==="waiting_response"?"response_timeout":"request_timeout":"network";
  return {kind,code:code??(timeout?"TIMEOUT":"NETWORK_ERROR")};
}
export function logCheckFailure(trace:CheckTrace,error?:unknown){
  console.warn("ElevenLabs check failed",{
    requestId:trace.requestId,phase:trace.phase,elapsedMs:Math.max(0,Date.now()-trace.started),
    ...(error?safeCheckFailure(error,trace.phase):{kind:"http",code:"HTTP_RESPONSE"}),
    ...(trace.httpStatus!==undefined?{httpStatus:trace.httpStatus}:{}),at:new Date().toISOString(),
  });
}
/** Observe only this check's Undici events, never headers, bodies or credentials.
 * On runtimes without these events the phase remains 'request' (unknown), not
 * an invented DNS/connect diagnosis. Subscriptions are removed after each check.
 */
export async function observeProviderCheck<T>(requestId:string|undefined,operation:(trace:CheckTrace)=>Promise<T>){
  const trace:CheckTrace={requestId:requestId??randomUUID(),started:Date.now(),phase:"request"};
  const requests=new WeakSet<object>();
  const requestOf=(event:unknown)=>(event as {request:object}).request;
  const listeners:[string,(event:unknown)=>void][]=[
    ["undici:request:create",event=>{if(active.getStore()===trace){requests.add(requestOf(event));trace.phase="request";}}],
    ["undici:client:beforeConnect",()=>{if(active.getStore()===trace)trace.phase="connecting";}],
    ["undici:client:sendHeaders",event=>{if(requests.has(requestOf(event)))trace.phase="waiting_response";}],
    ["undici:request:headers",event=>{if(requests.has(requestOf(event)))trace.phase="reading_response";}],
  ];
  for(const [name,listener]of listeners)channel(name).subscribe(listener);
  try{return await active.run(trace,()=>operation(trace));}
  finally{for(const [name,listener]of listeners)channel(name).unsubscribe(listener);}
}

export type ReachabilityResult={
  reachable:boolean;requestId:string;summary:string;httpStatus?:number;
  timings:{dnsMs?:number;connectionMs?:number;tlsMs?:number;responseMs?:number;totalMs:number};
};
/** Fixed-host HEAD, fresh socket, no key/cookie/body and no redirects. Only an
 * authenticated owner route calls this. A 401 is expected and proves a reply.
 */
export async function diagnoseProviderConnectivity(requestId:string,requester?:typeof import("node:https").request,timeoutMs=30_000):Promise<ReachabilityResult>{
  const request=requester??(await import("node:https")).request;
  const trace:CheckTrace={requestId,started:Date.now(),phase:"dns"};
  return new Promise(resolve=>{
    const timings:ReachabilityResult["timings"]={totalMs:0};
    let finished=false,timer:ReturnType<typeof setTimeout>|undefined;
    const elapsed=()=>Math.max(0,Date.now()-trace.started);
    const finish=(result:Omit<ReachabilityResult,"timings"|"requestId">)=>{
      if(finished)return;finished=true;clearTimeout(timer);
      timings.totalMs=elapsed();resolve({...result,requestId,timings});
    };
    const failed=(error:unknown)=>{
      if(finished)return;
      logCheckFailure(trace,error);
      const reason=safeCheckFailure(error,trace.phase).kind;
      const summary=reason==="dns"?"The server could not look up ElevenLabs' address.":
        reason==="connection_refused"?"ElevenLabs refused the server connection.":
        reason==="connection_reset"?"The server connection was interrupted.":
        reason==="tls"?"The secure connection to ElevenLabs could not be established.":
        reason.includes("timeout")?`The reachability check timed out during ${trace.phase.replaceAll("_"," ")}.`:
        "The server could not reach ElevenLabs. Use the request reference to check the server logs.";
      finish({reachable:false,summary});
    };
    try{
      const req=request("https://api.elevenlabs.io/v1/user/subscription",{method:"HEAD",agent:false},response=>{
        timings.responseMs=elapsed()-(timings.dnsMs??0)-(timings.connectionMs??0)-(timings.tlsMs??0);
        const status=response.statusCode;
        finish({reachable:true,httpStatus:status,summary:`ElevenLabs answered the server (HTTP ${status??"unknown"}). ${status===401?"An authorization response is expected because this check sends no key.":"This proves reachability, not key or feature permissions."}`});
        response.resume();req.destroy();
      });
      req.once("socket",socket=>{
        socket.once("lookup",()=>{timings.dnsMs=elapsed();trace.phase="connecting";});
        socket.once("connect",()=>{timings.connectionMs=elapsed()-(timings.dnsMs??0);trace.phase="tls";});
        socket.once("secureConnect",()=>{timings.tlsMs=elapsed()-(timings.dnsMs??0)-(timings.connectionMs??0);trace.phase="waiting_response";});
      });
      req.once("error",failed);
      timer=setTimeout(()=>{const error=new Error("Connection check deadline");error.name="TimeoutError";failed(error);req.destroy();},timeoutMs);
      req.end();
    }catch(error){failed(error);}
  });
}
