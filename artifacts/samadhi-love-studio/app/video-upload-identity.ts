export const videoPartBytes=8*1024*1024;
export async function sha256(bytes:Uint8Array){
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes as Uint8Array<ArrayBuffer>)),b=>b.toString(16).padStart(2,"0")).join("");
}
export async function videoFingerprint(size:number,type:string,hashes:string[]){
  return sha256(new TextEncoder().encode(JSON.stringify([size,type,hashes])));
}
/** Read one bounded part at a time, including for disk-backed export Blobs. */
export async function identifyVideo(blob:Blob,signal?:AbortSignal){
  const hashes:string[]=[];
  for(let offset=0;offset<blob.size;offset+=videoPartBytes){
    signal?.throwIfAborted();
    hashes.push(await sha256(new Uint8Array(await blob.slice(offset,offset+videoPartBytes).arrayBuffer())));
  }
  signal?.throwIfAborted();
  const type=blob.type.split(";")[0].trim().toLowerCase();
  return {hashes,type,fingerprint:await videoFingerprint(blob.size,type,hashes)};
}
