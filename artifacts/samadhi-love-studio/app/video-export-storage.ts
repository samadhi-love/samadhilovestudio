/** Disk-backed browser output. Never builds a full MP4 ArrayBuffer. */
export async function createVideoFile(){
  if(!navigator.storage?.getDirectory)throw new Error("This browser cannot safely store a full video while exporting. Use a current Chrome, Edge or Safari browser with private browsing turned off.");
  const root=await navigator.storage.getDirectory();
  const name="studio-export-"+crypto.randomUUID()+".mp4";
  const handle=await root.getFileHandle(name,{create:true});
  let writer:FileSystemWritableFileStream;
  try{writer=await handle.createWritable();}
  catch{await root.removeEntry(name);throw new Error("Browser storage could not open. Free device space or turn off private browsing, then retry.");}
  let closed=false,position=0;
  const dispose=async()=>{if(!closed){closed=true;await writer.abort().catch(()=>{});}await root.removeEntry(name).catch(()=>{});};
  const stream=new WritableStream<{type:"write";position:number;data:Uint8Array<ArrayBuffer>}>({
    async write(chunk){
      if(chunk.position+chunk.data.byteLength>512*1024*1024)throw new Error("This video exceeds 512 MB. Choose 720p or a shorter excerpt and retry.");
      await writer.write(chunk);
    },
    async close(){await writer.close();closed=true;},
    async abort(){await dispose();},
  });
  return {
    stream,dispose,
    async write(blob:Blob){if(position+blob.size>512*1024*1024)throw new Error("This video exceeds 512 MB. Choose 720p or a shorter excerpt.");await writer.write(blob);position+=blob.size;},
    async finish(type="video/mp4"){
      if(!closed){await writer.close();closed=true;}
      const file=await handle.getFile();
      if(!file.size)throw new Error("No video data was saved. Retry the export.");
      // File.slice retains its disk backing; it does not copy file bytes to JS.
      window.addEventListener("pagehide",()=>{void dispose();},{once:true});
      return file.slice(0,file.size,type);
    },
  };
}

export function assertVideoDuration(actual:number,expected:number){
  if(!Number.isFinite(actual)||actual<=0||Math.abs(actual-expected)>.1)
    throw new Error("The exported video is shorter or longer than expected. It was not saved or offered for download. Keep Studio visible and retry the export.");
}
export function codecCompatibility(codec:string){
  return /(?:avc1|avc3|\bavc\b|h\.?264)/i.test(codec)&&/(?:mp4a|\baac\b)/i.test(codec)
    ?codec
    :codec+" — Not H.264/AAC: may not play on iPhone or social apps. Use a compatible browser for H.264/AAC.";
}
