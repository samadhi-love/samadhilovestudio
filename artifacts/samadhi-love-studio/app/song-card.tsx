"use client";
import { MusicLanguageSummary } from "./music-language-summary";
import { languageForAudio } from "./music-language";
import {deletionNotice,deletionDeadline,canRestoreSong} from "./song-deletion";
import {createContext,useContext,useId,useState,type ReactNode} from "react";
import {Trash2,ChevronDown,Heart,Music2} from "lucide-react";
import type {Folder,Song,Station} from "./studio-data";
import {SongShareControls} from "./song-share-controls";
import {songCreatedTime,songStatus} from "./song-library";
import {isExplicitSong} from "./clean-content";
import {AudioPlayer} from "./audio-player";
import {AudioActions} from "./audio-actions";
import {SavedLyricVideos} from "./saved-lyric-videos";
import {InstrumentalExports,SeparatedStems} from "./production-exports";
import {isInstrumental} from "./creation-guide";
import {songAudioUrl} from "./studio-data";
import {artistDashboardHref,songHref} from "./community/data";

export type SongAction="sections"|"extend"|"redo-part"|"make-like-this"|"stems-midi"|"logo"|"cover"|"save-prompt"|"auto-video"|"short-video"|"details"|"lyrics"|"record"|"mix"|"master"|"video"|"release"|"export"|"remix"|"regenerate"|"versions"|"artwork";
export type SongHub={busy:boolean;simple?:boolean;folders:Folder[];station?:Station;stemsConnected:boolean;preview:string;setPreview:(id:string)=>void;expanded:string;setExpanded:(id:string)=>void;
 save:(song:Song,message?:string)=>Promise<boolean>;action:(action:SongAction,song:Song)=>void;archive:(song:Song)=>Promise<boolean>;duplicate:(song:Song)=>Promise<boolean>;
 publish:(song:Song)=>Promise<void>;playlist:(song:Song,id:string)=>Promise<boolean>;unlist?:(song:Song)=>Promise<boolean>;
 releases?:Record<string,{status:string;releaseId?:string}>;releaseLoaded?:boolean;};
const Hub=createContext<SongHub|null>(null);
export function SongHubProvider({value,children}:{value:SongHub;children:ReactNode}){return <Hub.Provider value={value}>{children}</Hub.Provider>;}

export function SongCard({song,onReuse}:{song:Song;onReuse?:(song:Song)=>void}){
 const hub=useContext(Hub),id=useId(),[name,setName]=useState(song.name),[rename,setRename]=useState(false),[playlist,setPlaylist]=useState("");
 const [stems,setStems]=useState(false),[status,setStatus]=useState("");
 const [localOpen,setLocalOpen]=useState(false),[localPreview,setLocalPreview]=useState(false);
 const open=hub?hub.expanded===song.id:localOpen,preview=hub?hub.preview===song.id:localPreview;
 const blocked=isExplicitSong(song),ready=!!song.audioFormat&&!blocked,archived=!!song.deletedAt,busy=hub?.busy??false;
  const melodyReferences=Array.from(new Map([...(song.melodyReference?[song.melodyReference]:[]),...(song.melodyReferences??[])].map(reference=>[reference.assetId,reference])).values());
 const time=songCreatedTime(song),act=(action:SongAction)=>hub?.action(action,song);
 const release=hub?.releases?.[song.id],published=!!hub?.releaseLoaded&&release?.status==="Published"&&!!release.releaseId;
 async function shareRelease(){if(!published||!release?.releaseId)return;const url=new URL(songHref(release.releaseId),window.location.origin).href;try{if(navigator.share)await navigator.share({title:song.name,url});else if(navigator.clipboard)await navigator.clipboard.writeText(url);else{setStatus("Use Open release below to copy its address.");return;}setStatus("Release link ready to share.");}catch(e){if(!(e instanceof DOMException&&e.name==="AbortError"))setStatus("Use Open release below to copy its address.");}}
 const button=(label:string,action:SongAction,needsAudio=false)=><button type="button" className="secondary small" disabled={busy||!hub||needsAudio&&!ready} onClick={()=>act(action)}>{label}</button>;
 return <article className={`song-card${archived?" song-card-archived":""}`} aria-label={song.name} data-song-id={song.id}>
   <div className="song-card-header"><div className={`song-card-art art-${song.art%4}`} aria-hidden="true">{song.coverAsset?<img style={{width:"100%",height:"100%",objectFit:"cover"}} src={`/api/studio/lyric-assets?song=${encodeURIComponent(song.id)}&asset=${encodeURIComponent(song.coverAsset)}`} alt=""/>:<Music2 size={24}/>}</div>
     <button type="button" className="song-card-title" disabled={busy||!hub||archived} onClick={()=>act("details")}><strong>{song.name}</strong><span>{song.tags.slice(0,3).join(" · ")||song.stage}</span><small>{time!==null?<time dateTime={new Date(time).toISOString()}>{new Date(time).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}</time>:"Earlier saved creation · date unavailable"} · {archived?"Deleted":blocked?"Needs review":songStatus(song)}{!archived&&hub?.releaseLoaded?" · "+(release?.status??"Private"):""}</small></button>
     <div className="song-card-buttons">{ready&&!archived&&<button type="button" className="secondary small" disabled={busy||!hub} onClick={()=>act("sections")}>Edit audio</button>}{ready&&!archived&&<button type="button" className="secondary small" aria-expanded={preview} onClick={()=>hub?hub.setPreview(preview?"":song.id):setLocalPreview(!preview)}>{preview?"Close player":"Listen"}</button>}
       {!archived&&<button type="button" className={`song-like${song.favorite?" liked":""}`} aria-pressed={!!song.favorite} aria-label={`${song.favorite?"Unlike":"Like"} ${song.name}`} disabled={busy||!hub} onClick={()=>void hub?.save({...song,favorite:!song.favorite},song.favorite?"Removed from Liked songs":"Added to Liked songs")}><Heart size={18} fill={song.favorite?"currentColor":"none"}/><span>{song.favorite?"Liked":"Like"}</span></button>}
       <button type="button" className="secondary small" aria-expanded={open} aria-controls={`${id}-actions`} onClick={()=>{hub?hub.setExpanded(open?"":song.id):setLocalOpen(!open);setStatus("");}}>Song actions <ChevronDown size={15}/></button>
     </div>
   </div>
   <MusicLanguageSummary profile={languageForAudio(song)}/>
   {preview&&ready&&!archived&&<AudioPlayer src={songAudioUrl(song.id,song.audioId)} label={`Listen to ${song.name}`}/>}
   {open&&<div className="song-card-panel" id={`${id}-actions`}>
       {!!melodyReferences.length&&<section className="song-melody-reference"><h3>Melody references · {melodyReferences.length}</h3><p className="muted">Private recordings saved as references, not sent to the music provider.</p>{melodyReferences.map((reference,index)=><div className="melody-reference-saved" key={reference.assetId}><strong>Take {index+1} · {Math.floor(reference.durationSeconds/60)}:{String(Math.floor(reference.durationSeconds%60)).padStart(2,"0")}</strong><audio controls preload="none" data-testid="melody-reference-player" aria-label={`Play private melody reference ${index+1}`} src={`/api/studio/lyric-assets?song=${encodeURIComponent(song.id)}&asset=${encodeURIComponent(reference.assetId)}`}/></div>)}</section>}
     {archived?<div><p>{deletionNotice}</p>{deletionDeadline(song)!==null&&<p>{canRestoreSong(song)?"Restore before":"Recovery ended"}: {new Date(deletionDeadline(song)!).toLocaleString()}</p>}<button type="button" className="primary small" disabled={busy||!hub||!canRestoreSong(song)} onClick={()=>void hub?.save({...song,deletedAt:undefined,deleteAfter:undefined},"Restored to My Songs")}>Restore to My Songs</button><p className="muted">A restored release remains unlisted until you explicitly publish it again.</p></div>:<>
       <div className="song-action-groups">
          <section><h3>Create &amp; edit</h3><div className="actions">{button("Edit details","details")}{button("Save prompt","save-prompt")}{button("Create / animate cover","cover")}{button("Create logo","logo")}{button("Lyrics & prompts","lyrics")}{button("Stems & MIDI","stems-midi",true)}{button(isInstrumental(song.instrumental)?"Remix instrumental":"Remix / mix vocals","remix",true)}{hub?.simple?<>{button("Add / record voice","record",true)}{button("Mix / add audio","mix",true)}{button(song.lyricVideo?.cues.length?"Edit lyric video":song.creationKind==="instrumental"||isInstrumental(song.instrumental)?"Make music video":"Auto lyric video",song.lyricVideo?.cues.length||song.creationKind==="instrumental"||isInstrumental(song.instrumental)?"video":"auto-video",true)}{button("Make a Short","short-video",true)}</>:<>{button("Generate new version","regenerate")}{button("Record vocals","record")}{button("Open mixer","mix",true)}{button("Create lyric video","video",true)}{button("Artwork & visuals","artwork")}{button("Versions & final master","versions",true)}</>}{onReuse&&<button type="button" className="secondary small" disabled={busy} onClick={()=>onReuse(song)}>Reuse creation settings</button>}</div>{hub?.simple&&<details><summary>More song tools</summary><div className="actions">{button("Generate new version","regenerate")}{button("Record vocals","record")}{button("Open mixer","mix",true)}{button("Artwork & visuals","artwork")}{button("Versions & final master","versions",true)}</div></details>}</section>
          <section><h3>Next steps</h3><div className="actions">{button("Make it longer","extend",true)}{button("Redo a part","redo-part",true)}{button("Make another like this","make-like-this")}{!hub?.simple&&button("Make a Short","short-video",true)}</div><p className="muted">The original recording stays saved. New generations show their credit estimate before they start.</p></section>
         <section><h3>Organize</h3><div className="actions"><button type="button" className="secondary small" disabled={busy||!hub} onClick={()=>{setName(song.name);setRename(v=>!v);}}>Rename</button><button type="button" className="secondary small" disabled={busy||!hub} onClick={()=>void hub?.duplicate(song)}>Duplicate writing project</button></div>
           {rename&&<form onSubmit={async e=>{e.preventDefault();if(name.trim()&&await hub?.save({...song,name:name.trim()},"Song renamed"))setRename(false);}}><label>Song name<input maxLength={100} required value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label><button className="secondary small" disabled={busy||!name.trim()}>Save name</button></form>}
           <label>Folder<select value={song.folderId??""} disabled={busy||!hub} onChange={e=>void hub?.save({...song,folderId:e.target.value||undefined},"Folder updated")}><option value="">Unfiled</option>{hub?.folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
           {ready&&<><label>Add to private playlist<select value={playlist} disabled={busy||!hub} onChange={e=>setPlaylist(e.target.value)}><option value="">Choose a playlist</option><option value="__new">Create a playlist…</option>{hub?.station?.customPlaylists?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button type="button" className="secondary small" disabled={busy||!playlist||!hub} onClick={async()=>{if(await hub?.playlist(song,playlist)){setStatus("Saved to your private playlist.");setPlaylist("");}}}>Add to playlist</button></>}
           <p className="muted">A writing-project copy preserves notes and writing versions; it does not duplicate audio files.</p>
         </section>
         <section><h3>Publish &amp; share</h3><div className="actions"><button type="button" className="secondary small" disabled={busy||!ready||!hub} onClick={()=>void hub?.publish(song)}>Publish / manage visibility</button>{published&&<><button type="button" className="secondary small" disabled={busy} onClick={()=>void shareRelease()}>Share release link</button><a className="secondary small" href={songHref(release!.releaseId!)}>Open release</a>{hub?.unlist&&<button type="button" className="secondary small" disabled={busy} onClick={()=>void hub.unlist?.(song)}>Unlist release</button>}</>}{ready&&<a className="secondary small" href={artistDashboardHref(song.id)}>Artist dashboard &amp; sharing</a>}{button("Release checklist","release")}{button("Release download package","export",true)}</div><p className="muted">Private to your account until you explicitly share a listening link or publish. Your Artist dashboard manages public releases.</p>{ready&&<SongShareControls songId={song.id} title={song.name} disabled={busy}/>}</section>
         <section><h3>Download</h3>{ready?<><AudioActions song={song}/><SavedLyricVideos song={song}/><div className="actions">{!hub?.simple&&<>{button("Auto lyric video","auto-video",true)}{button("Caption files & video settings","video",true)}</>}<button type="button" className="secondary small" disabled={busy} aria-expanded={stems} onClick={()=>setStems(v=>!v)}>Stems &amp; production exports</button></div>{stems&&(isInstrumental(song.instrumental)?<InstrumentalExports settings={song.instrumental} title={song.name} disabled={busy}/>:<SeparatedStems songId={song.id} audioId={song.audioId} title={song.name} connected={hub?.stemsConnected??false}/>)}</>:<p>Add a ready, reviewed recording to enable audio and video downloads.</p>}</section>
       </div>
       <div className="song-card-preserve"><button type="button" className="text-button" disabled={busy||!hub} onClick={()=>void hub?.archive(song)}><Trash2 size={16}/> Delete song</button><small>{deletionNotice}</small></div>
     </>}
     {status&&<p role="status">{status}</p>}
   </div>}
 </article>;
}
