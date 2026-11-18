import {privateWorkspace} from "../../../studio-access";
import {duplicatePrivateSong,savePrivateVoiceReference,readPrivateVoiceReference,SongActionError} from "../../../server/song-actions";
import {privateHeaders} from "../store";
import {readBoundedText,recoverableRoute,RequestBodyError} from "../request-errors";
export const dynamic="force-dynamic";
async function boundedForm(request:Request){
  const limit=3*1024*1024;
  if(Number(request.headers.get("Content-Length"))>limit)throw new RequestBodyError("Keep this reference clip under 2 MB.",413);
  const reader=request.body?.getReader();
  if(!reader)throw new RequestBodyError("Choose a voice reference first.",400);
  const chunks:Uint8Array[]=[];let length=0;
  try{
    for(;;){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>limit){await reader.cancel();throw new RequestBodyError("Keep this reference clip under 2 MB.",413);}chunks.push(part.value);}
  }finally{reader.releaseLock();}
  const body=new Uint8Array(length);let at=0;for(const chunk of chunks){body.set(chunk,at);at+=chunk.length;}
  try{return await new Request(request.url,{method:"POST",headers:{"Content-Type":request.headers.get("Content-Type")??""},body}).formData();}
  catch{throw new RequestBodyError("Choose a short voice reference and try again.",400);}
}
async function handle(request:Request){
  const access=await privateWorkspace();
  if(!access)return Response.json({error:"Sign in to use your private songs."},{status:401,headers:privateHeaders});
  try{
    if(request.method==="GET"){
      const file=await readPrivateVoiceReference(access.id,new URL(request.url).searchParams.get("voice")??"");
      return new Response(file.body,{headers:{...privateHeaders,"Content-Type":"audio/mpeg","Content-Length":String(file.size),"X-Content-Type-Options":"nosniff"}});
    }
    if(request.headers.get("Origin")!==new URL(request.url).origin)return Response.json({error:"Open Studio directly to save this change."},{status:403,headers:privateHeaders});
    if(request.headers.get("Content-Type")?.includes("multipart/form-data")){
      const form=await boundedForm(request),clip=form.get("clip");
      if(!clip||typeof clip==="string"||form.get("permission")!=="true")throw new SongActionError("Confirm you have permission to save this private vocal reference.");
      const text=(key:string)=>typeof form.get(key)==="string"?String(form.get(key)):"";
      const result=await savePrivateVoiceReference(access.id,{id:text("id"),songId:text("songId"),audioId:text("audioId"),
        name:text("name"),vocals:text("vocals"),from:Number(text("from")),to:Number(text("to")),bytes:new Uint8Array(await clip.arrayBuffer())});
      return Response.json(result,{headers:privateHeaders});
    }
    let input:{action?:string;songId?:string;id?:string};
    try{input=JSON.parse(await readBoundedText(request,4000));}catch(error){if(error instanceof RequestBodyError)throw error;throw new SongActionError("Choose the song to duplicate.");}
    if(input?.action!=="duplicate")throw new SongActionError("Choose an available song action.");
    return Response.json(await duplicatePrivateSong(access.id,input.songId??"",input.id??""),{headers:privateHeaders});
  }catch(error){
    if(error instanceof SongActionError)return Response.json({error:error.message,...(error.voiceReferenceId?{voiceReferenceId:error.voiceReferenceId}:{})},{status:error.status,headers:privateHeaders});
    throw error;
  }
}
export const GET=recoverableRoute(handle,"Your private reference could not load. Try again.");
export const POST=recoverableRoute(handle,"The change could not be confirmed. Your original song is safe; check Your songs before trying again.");
