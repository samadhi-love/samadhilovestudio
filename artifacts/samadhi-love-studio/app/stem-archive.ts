export type ExtractedStem={name:string;blob:Blob};
const types:Record<string,string>={mp3:"audio/mpeg",wav:"audio/wav",m4a:"audio/mp4",flac:"audio/flac",ogg:"audio/ogg",webm:"audio/webm"};
export async function readStemArchive(blob:Blob,signal:AbortSignal):Promise<ExtractedStem[]>{
 if(!blob.size||blob.size>120*1024*1024)throw new Error("Choose a stem ZIP up to 120 MiB.");signal.throwIfAborted();
 const bytes=new Uint8Array(await blob.arrayBuffer());signal.throwIfAborted();
 const {unzip}=await import("fflate");let total=0,count=0;let limitError="";
 return new Promise((resolve,reject)=>{const abort=()=>{stop();reject(new DOMException("Canceled","AbortError"));};
 const stop=unzip(bytes,{filter:file=>{if(!/\.(mp3|wav|m4a|flac|ogg|webm)$/i.test(file.name)||file.name.includes("__MACOSX")||file.name.split(/[\\/]/).includes(".."))return false;
   if(++count>12||file.originalSize>96*1024*1024||(total+=file.originalSize)>128*1024*1024){limitError="Stem archive exceeds 12 audio files, 96 MiB per file, or 128 MiB unpacked. Import smaller files individually.";return false;}return !limitError;}},(error,files)=>{signal.removeEventListener("abort",abort);if(error||limitError){reject(error??new Error(limitError));return;}
   const entries=Object.entries(files);if(!entries.length){reject(new Error("No supported audio stems were found."));return;}
   const actual=entries.reduce((sum,[,data])=>sum+data.length,0);if(actual>128*1024*1024){reject(new Error("Unpacked stem files exceed the memory limit."));return;}
   resolve(entries.map(([path,data])=>{const name=path.split(/[\\/]/).at(-1)!.slice(0,100),ext=name.split(".").at(-1)!.toLowerCase();return{name,blob:new Blob([data as Uint8Array<ArrayBuffer>],{type:types[ext]})};}));});
 signal.addEventListener("abort",abort,{once:true});if(signal.aborted)abort();});
}
