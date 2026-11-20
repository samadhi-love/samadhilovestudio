import test from "node:test";
import assert from "node:assert/strict";
import {build} from "esbuild";
import {mkdirSync} from "node:fs";

// Lyric sync and stems stream the recording to ElevenLabs. On Replit this runs
// on Node, whose fetch refuses a streamed body unless duplex:"half" is set.
// The fetch stub builds a real Node Request so that rule is enforced here.
const directory="generated-artifacts/tests/provider-stream-upload";
mkdirSync(directory,{recursive:true});
await build({stdin:{contents:`export {sendProviderAudio} from "./app/api/studio/elevenlabs/audio-upload";`,resolveDir:process.cwd(),loader:"ts"},
  bundle:true,platform:"node",format:"esm",packages:"external",outfile:`${directory}/upload.mjs`});
const {sendProviderAudio}=await import(`../${directory}/upload.mjs`);

// Same stand-in the production Node runtime installs (scripts/storage/runtime.mjs).
globalThis.FixedLengthStream??=class extends TransformStream{constructor(expected){let count=0;super({transform(chunk,c){count+=chunk.byteLength;if(count>expected)throw new Error("long");c.enqueue(chunk);},flush(){if(count!==expected)throw new Error("short");}});}};

test("recordings stream to ElevenLabs under Node's fetch rules",async()=>{
  const bytes=new TextEncoder().encode("fake-audio");
  const audio={size:bytes.length,body:new ReadableStream({start(c){c.enqueue(bytes);c.close();}})};
  const realFetch=globalThis.fetch;
  let received="";
  globalThis.fetch=async(input,init)=>{
    const request=new Request(input,init); // throws "duplex option is required" without the fix
    received=await request.text();
    return new Response(JSON.stringify({words:[]}),{status:200});
  };
  try{
    const response=await sendProviderAudio(audio,"mp3","test-key",{text:"line one"},"forced-alignment",AbortSignal.timeout(5000));
    assert.equal(response.status,200);
    assert.match(received,/name="text"\r\n\r\nline one/);
    assert.match(received,/fake-audio/);
  }finally{globalThis.fetch=realFetch;}
});
