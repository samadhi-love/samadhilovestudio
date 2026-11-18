/**
 * One server-only outbound ElevenLabs transport. JSON, official SDK streaming
 * and multipart alignment/stems all use this boundary. No shared-key fallback.
 * A credential is provided by the owner's existing encrypted-vault resolver.
 */
import { retryRead } from "../../scripts/storage/retry.mjs";
export {observeProviderCheck,logCheckFailure,diagnoseProviderConnectivity} from "./provider-check-diagnostics";
const origin = "https://api.elevenlabs.io";
export function elevenLabsTransport(input:RequestInfo|URL,init:RequestInit={}) {
  const url=new URL(typeof input==="string"?input:input instanceof URL?input.href:input.url);
  if(url.origin!==origin||!url.pathname.startsWith("/v1/")||url.username||url.password)
    throw new Error("Unexpected ElevenLabs destination. No request was sent.");
  // Request wrappers can cross runtimes and fail instanceof Request. Inspect
  // their method rather than accidentally treating a paid POST as a safe GET.
  const inheritedMethod=typeof input==="object"&&"method" in input&&typeof input.method==="string"?input.method:"GET";
  const method=(init.method??inheritedMethod).toUpperCase();
  const send=()=>fetch(input,{...init,redirect:"manual"});
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
  if(!/^\/fal-ai\/ace-step-1\.5(?:\/requests\/[\w-]+(?:\/status)?)?$/.test(path))
    throw new Error("Unexpected fal destination.");
  const headers=new Headers(init.headers);headers.set("Authorization",`Key ${key}`);headers.set("Content-Type","application/json");
  const send=()=>fetch(`https://queue.fal.run${path}`,{...init,headers,redirect:"manual"});
  return !init.method||init.method==="GET"?retryRead(send,{signal:init.signal??undefined}):send();
}
export function falMediaRequest(value:string) {
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.port||
    !(url.hostname==="fal.media"||url.hostname.endsWith(".fal.media")))
    throw new Error("Unexpected fal media destination.");
  return retryRead(()=>fetch(url.href,{redirect:"manual",signal:AbortSignal.timeout(60_000)}));
}
