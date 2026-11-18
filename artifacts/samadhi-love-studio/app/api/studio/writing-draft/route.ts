import {privateWorkspace} from "../../../studio-access";
import {serverStorage as env} from "../../../server/storage";
import {emptyCreatorStudio,freshSong} from "../../../studio-data";
import {readStudio,writeStudio,privateHeaders} from "../store";
import {readBoundedText,recoverableRoute} from "../request-errors";
import {hasExplicitWords,cleanWordsMessage} from "../../../clean-content";
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:privateHeaders});
const draftId=(kind:unknown)=>kind==="simple"?"account-writing-simple":kind==="custom"?"account-writing-custom":null;
async function revision(owner:string,id:string){
  const row=await env.DB!.prepare("SELECT revision,removed FROM studio_songs WHERE owner=? AND id=?").bind(owner,id).first<{revision:number;removed:number}>();
  return row?.removed?-1:row?.revision??0;
}
async function draftRevision(owner:string,id:string,current:Awaited<ReturnType<typeof readStudio>>){
  if(env.STUDIO_ROW_STORAGE==="verified")return current.data?._storage?.songs[id]?.revision??await revision(owner,id);
  const song=current.data?.songs.find(s=>s.id===id);
  return song?.deletedAt?-1:song?.writingRevision??0;
}
export const GET=recoverableRoute(async(request:Request)=>{
  const owner=(await privateWorkspace())?.id,id=draftId(new URL(request.url).searchParams.get("kind"));
  if(!owner)return reply({error:"Sign in to save writing."},401);
  if(!id)return reply({error:"Choose a draft."},400);
  const current=await readStudio(owner);
  const song=current.data?.songs.find(s=>s.id===id&&!s.deletedAt);
  return reply({revision:await draftRevision(owner,id,current),writing:song?{title:song.name,prompt:song.notes.prompt,lyrics:song.notes.lyrics,voice:song.notes.vocals}:undefined});
},"Your account draft could not load.");
export const PUT=recoverableRoute(async(request:Request)=>{
  const owner=(await privateWorkspace())?.id;
  if(!owner)return reply({error:"Sign in to save writing."},401);
  if(request.headers.get("origin")!==new URL(request.url).origin)return reply({error:"Open Studio directly to save."},403);
  if(request.headers.get("X-Studio-Workspace")!==owner)return reply({error:"Your signed-in account changed. Reload before saving."},409);
  const input=JSON.parse(await readBoundedText(request,40000));
  const id=draftId(input?.kind),w=input?.writing;
  if(!id||!Number.isSafeInteger(input.revision)||!w||Object.entries({title:120,prompt:8000,lyrics:5000,voice:1000}).some(([key,max])=>typeof w[key]!=="string"||w[key].length>max))
    return reply({error:"Shorten the writing before saving."},400);
  if(hasExplicitWords(w.title,w.prompt,w.lyrics,w.voice))return reply({error:cleanWordsMessage},422);
  const current=await readStudio(owner);
  const old=current.data?.songs.find(s=>s.id===id);
  const rev=await draftRevision(owner,id,current);
  if(rev!==input.revision||rev<0||old&&(old.deletedAt||!old.creationDraft||old.audioFormat))
    return reply({error:"This writing draft changed in another tab. Your device copy is safe; reload before editing again."},409);
  const data=current.data??emptyCreatorStudio;
  const draft=old??freshSong(id,"Writing draft",data.songs.length);
  const next={...draft,name:w.title.trim()||"Writing draft",creationDraft:true,notes:{...draft.notes,prompt:w.prompt,lyrics:w.lyrics,vocals:w.voice}};
  if(old&&JSON.stringify(old)===JSON.stringify(next))return reply({revision:rev});
  if(env.STUDIO_ROW_STORAGE!=="verified")next.writingRevision=rev+1;
  try{
    const saved=await writeStudio(owner,current.revision,JSON.stringify({...data,songs:old?data.songs.map(s=>s.id===id?next:s):[next,...data.songs]}));
    if(!saved)return reply({error:"Another tab saved first. Your device copy is safe; reload before editing again."},409);
    return reply({revision:rev+1});
  }catch(error){
    if(error instanceof Error&&/malformed JSON|revision.conflict/i.test(error.message))return reply({error:"Another tab saved first. Your writing is still on this device."},409);
    throw error;
  }
},"Your writing could not save to your account. Device recovery is unchanged.");
