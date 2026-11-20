/**
 * One server-only outbound ElevenLabs transport. JSON, official SDK streaming
 * and multipart alignment/stems all use this boundary. No shared-key fallback.
 * A credential is provided by the owner's existing encrypted-vault resolver.
 */
import { retryRead } from "../../scripts/storage/retry.mjs";
import { logEvent, routeLabel } from "./request-context";
export {observeProviderCheck,logCheckFailure,diagnoseProviderConnectivity} from "./provider-check-diagnostics";
const origin = "https://api.elevenlabs.io";
/** One log line per paid (non-GET) provider call and per failed call: provider, step,
 * status, duration and the provider's own request ID. Successful status polls are
 * skipped to keep logs readable. Never logs keys, bodies, lyrics or media URLs. */
async function observed(provider:"fal.ai"|"ElevenLabs",step:string,method:string,send:()=>Promise<Response>){
  const started=Date.now();
  try{
    const response=await send();
    if(method!=="GET"&&method!=="HEAD"||!response.ok){
      let providerRequestId:string|undefined;
      if(provider==="fal.ai"&&response.ok)try{const id=(await response.clone().json() as {request_id?:unknown}).request_id;if(typeof id==="string"&&/^[\w-]{1,128}$/.test(id))providerRequestId=id;}catch{/* not JSON */}
      if(provider==="ElevenLabs")providerRequestId=response.headers.get("request-id")??response.headers.get("x-request-id")??undefined;
      logEvent("provider.call",{provider,step,method,status:response.status,ok:response.ok,ms:Date.now()-started,providerRequestId},response.ok?"info":"error");
    }
    return response;
  }catch(error){
    const name=error instanceof Error?error.name:"";
    logEvent("provider.call",{provider,step,method,ok:false,ms:Date.now()-started,errorType:name==="TimeoutError"?"timeout":name==="AbortError"?"aborted":"network"},"error");
    throw error;
  }
}
export function elevenLabsTransport(input:RequestInfo|URL,init:RequestInit={}) {
  const url=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
  if(url.origin!==origin||!url.pathname.startsWith("/v1/")||url.username||url.password)
    throw new Error("Unexpected ElevenLabs destination. No request was sent.");
  // Request wrappers can cross runtimes and fail instanceof Request. Inspect
  // their method rather than accidentally treating a paid POST as a safe GET.
  const inheritedMethod=typeof input==="object"&&"method" in input&&typeof input.method==="string"?input.method:"GET";
  const method=(init.method??inheritedMethod).toUpperCase();
  // Node's fetch (Replit) refuses a streamed body without duplex:"half".
  const streamed=typeof ReadableStream!=="undefined"&&init.body instanceof ReadableStream?{duplex:"half"}:{};
  const send=()=>observed("ElevenLabs",routeLabel(url.pathname),method,()=>fetch(input,{...init,...streamed,redirect:"manual"} as RequestInit));
  // Production IDs deduplicate our app, but provider billing idempotency is not
  // guaranteed. Never replay POST music/plans/alignment/stems/visual requests.
  return method==="GET"||method==="HEAD"?retryRead(send,{signal:init.signal??undefined}):send();
}
export function providerRequest(key:string,path:string,init:RequestInit) {
  if(!key.trim())throw new Error("Connect your own ElevenLabs key before processing.");
  const url=new URL("/v1/"+path,origin);
  if(!url.pathname.startsWith("/v1/"))throw new Error("Invalid ElevenLabs request path.");
  const headers=new Headers(init.headers);
  headers.set("xi-api-key",key);
  return elevenLabsTransport(url.href,{...init,headers});
}
// Generated-media retrieval is intentionally unauthenticated. Never attach the
// owner's API key to a signed download URL or follow a storage redirect.
export function providerMediaRequest(value:string) {
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.port||
    !["storage.googleapis.com","api.elevenlabs.io"].includes(url.hostname))
    throw new Error("Unexpected generated-media destination.");
  return retryRead(()=>fetch(url.href,{redirect:"manual",signal:AbortSignal.timeout(60_000)}));
}

/** Queue submissions are paid: never replay a POST, including on 429/5xx. */
export function falRequest(key:string,path:string,init:RequestInit={}) {
  if(!key.trim())throw new Error("Connect fal.ai before using ACE-Step.");
  if(!/^\/fal-ai\/(?:ace-step-1\.5|any-llm|whisper)(?:\/requests\/[\w-]+(?:\/status)?)?$/.test(path))
    throw new Error("Unexpected fal destination.");
  const headers=new Headers(init.headers);headers.set("Authorization",`Key ${key}`);headers.set("Content-Type","application/json");
  const step=path.replace(/^\/fal-ai\//,"").replace(/\/requests\/[\w-]+\/status$/,"/status").replace(/\/requests\/[\w-]+$/,"/result");
  const send=()=>observed("fal.ai",step==="ace-step-1.5"||step==="any-llm"?step+"/submit":step,(init.method??"GET").toUpperCase(),()=>fetch(`https://queue.fal.run${path}`,{...init,headers,redirect:"manual"}));
  return !init.method||init.method==="GET"?retryRead(send,{signal:init.signal??undefined}):send();
}
export function falMediaRequest(value:string) {
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.port||
    !(url.hostname==="fal.media"||url.hostname.endsWith(".fal.media")))
    throw new Error("Unexpected fal media destination.");
  return retryRead(()=>fetch(url.href,{redirect:"manual",signal:AbortSignal.timeout(60_000)}));
}
