"use client";
import "./cosmic-song-card.css";
import { MusicLanguageSummary } from "./music-language-summary";
import { languageForAudio } from "./music-language";
import {deletionNotice,deletionDeadline,canRestoreSong} from "./song-deletion";
import {createContext,memo,useContext,useEffect,useId,useRef,useState,type KeyboardEvent,type ReactNode,type CSSProperties} from "react";
import {createPortal} from "react-dom";
import {Trash2,Heart,Music2,MoreHorizontal,Play,Scissors,FastForward,RotateCcw,Film,Mic,Share2,Globe,Download,Copy,FolderPlus,Wrench,Undo2} from "lucide-react";
import type {Folder,Song,Station} from "./studio-data";
import {SongShareControls} from "./song-share-controls";
import {songCreatedTime,songStatus} from "./song-library";
import {isExplicitSong} from "./clean-content";
import {AudioPlayer} from "./audio-player";
import {AudioActions} from "./audio-actions";
import {SavedLyricVideos} from "./saved-lyric-videos";
import {isInstrumental} from "./creation-guide";
import {songAudioUrl} from "./studio-data";
import {artistDashboardHref,songHref} from "./community/data";
import {engineCapabilities,type MusicEngine} from "./music-engine-data";

export type SongAction="sections"|"extend"|"redo-part"|"make-like-this"|"stems-midi"|"logo"|"cover"|"save-prompt"|"auto-video"|"short-video"|"details"|"lyrics"|"record"|"mix"|"master"|"video"|"release"|"export"|"remix"|"regenerate"|"versions"|"artwork"|"save-voice";
export type SongHub={busy:boolean;simple?:boolean;folders:Folder[];station?:Station;stemsConnected:boolean;preview:string;setPreview:(id:string)=>void;expanded:string;setExpanded:(id:string)=>void;
 save:(song:Song,message?:string)=>Promise<boolean>;action:(action:SongAction,song:Song)=>void;archive:(song:Song)=>Promise<boolean>;duplicate:(song:Song)=>Promise<boolean>;
 publish:(song:Song)=>Promise<void>;playlist:(song:Song,id:string)=>Promise<boolean>;unlist?:(song:Song)=>Promise<boolean>;
 releases?:Record<string,{status:string;releaseId?:string}>;releaseLoaded?:boolean;
 /** Active music engine. Paid continuation is shown only where this exact engine supports it. */
 engine?:MusicEngine;};
const Hub=createContext<SongHub|null>(null);
export function SongHubProvider({value,children}:{value:SongHub;children:ReactNode}){return <Hub.Provider value={value}>{children}</Hub.Provider>;}

type Sheet="tools"|"share"|"download"|"organize"|"videos";
type MenuItem={key:string;label:string;icon:ReactNode;run:()=>void;disabled?:boolean;danger?:boolean};

// Re-draws only when its song, its reuse action or the shared song hub changes.
export const SongCard=memo(function SongCard({song,onReuse}:{song:Song;onReuse?:(song:Song)=>void}){
 const hub=useContext(Hub),id=useId(),[name,setName]=useState(song.name),[rename,setRename]=useState(false),[playlist,setPlaylist]=useState("");
 const [status,setStatus]=useState(""),[sheet,setSheet]=useState<Sheet>("tools");
 const savedVideoCount=song.lyricVideo?.pro?.exports?.filter(v=>v.asset).length??0;
 const [localOpen,setLocalOpen]=useState(false),[localPreview,setLocalPreview]=useState(false),[menu,setMenu]=useState(false);
 const menuRef=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const open=hub?hub.expanded===song.id:localOpen,preview=hub?hub.preview===song.id:localPreview;
 const blocked=isExplicitSong(song),ready=!!song.audioFormat&&!blocked,archived=!!song.deletedAt,busy=hub?.busy??false;
 const melodyReferences=Array.from(new Map([...(song.melodyReference?[song.melodyReference]:[]),...(song.melodyReferences??[])].map(reference=>[reference.assetId,reference])).values());
 const time=songCreatedTime(song),act=(action:SongAction)=>hub?.action(action,song);
 const release=hub?.releases?.[song.id],published=!!hub?.releaseLoaded&&release?.status==="Published"&&!!release.releaseId;
 const instrumental=song.creationKind==="instrumental"||isInstrumental(song.instrumental);
 const caps=hub?.engine?engineCapabilities[hub.engine]:null;
 const keepGoing=!caps||caps.extend;
 const videoAction:SongAction=song.lyricVideo?.cues.length||instrumental?"video":"auto-video";
 function setOpen(next:boolean){if(hub)hub.setExpanded(next?song.id:"");else setLocalOpen(next);}
 function openSheet(next:Sheet){setSheet(next);setOpen(true);setStatus("");}
 function togglePreview(){if(hub)hub.setPreview(preview?"":song.id);else setLocalPreview(!preview);}
 async function shareRelease(){if(!published||!release?.releaseId)return;const url=new URL(songHref(release.releaseId),window.location.origin).href;try{if(navigator.share)await navigator.share({title:song.name,url});else if(navigator.clipboard)await navigator.clipboard.writeText(url);else{setStatus("Use Open release below to copy its address.");return;}setStatus("Release link ready to share.");}catch(e){if(!(e instanceof DOMException&&e.name==="AbortError"))setStatus("Use Open release below to copy its address.");}}
 const button=(label:string,action:SongAction,needsAudio=false)=><button type="button" className="secondary small" disabled={busy||!hub||needsAudio&&!ready} onClick={()=>act(action)}>{label}</button>;
 const restore=()=>void hub?.save({...song,deletedAt:undefined,deleteAfter:undefined},"Restored to Your songs");

 const items:MenuItem[]=archived?[
  {key:"restore",label:"Restore",icon:<Undo2 size={16}/>,run:restore,disabled:!canRestoreSong(song)},
 ]:[
  {key:"play",label:preview?"Close player":"Play",icon:<Play size={16}/>,run:togglePreview,disabled:!ready},
  {key:"edit",label:"Edit in Shape",icon:<Scissors size={16}/>,run:()=>act("sections"),disabled:!ready},
  ...(keepGoing?[{key:"extend",label:"Keep Going",icon:<FastForward size={16}/>,run:()=>act("extend"),disabled:!ready}]:[]),
  {key:"redo",label:"Redo a Part",icon:<RotateCcw size={16}/>,run:()=>act("redo-part"),disabled:!ready},
  {key:"video",label:"Make LyriVid",icon:<Film size={16}/>,run:()=>act(videoAction),disabled:!ready},
  {key:"mix",label:"Mix & edit",icon:<Wrench size={16}/>,run:()=>act("mix"),disabled:!ready},
  ...(!instrumental?[{key:"voice",label:"Save Voice",icon:<Mic size={16}/>,run:()=>act("save-voice"),disabled:!ready}]:[]),
  {key:"share",label:"Share",icon:<Share2 size={16}/>,run:()=>openSheet("share")},
  {key:"publish",label:"Publish",icon:<Globe size={16}/>,run:()=>void hub?.publish(song),disabled:!ready},
  {key:"download",label:"Download",icon:<Download size={16}/>,run:()=>openSheet("download")},
  {key:"duplicate",label:"Duplicate",icon:<Copy size={16}/>,run:()=>void hub?.duplicate(song)},
  {key:"logo",label:"Logo & ad",icon:<Globe size={16}/>,run:()=>act("logo")},
  {key:"organize",label:"Add to Project / Playlist",icon:<FolderPlus size={16}/>,run:()=>openSheet("organize")},
  {key:"tools",label:"More tools",icon:<Wrench size={16}/>,run:()=>openSheet("tools")},
  {key:"delete",label:"Delete",icon:<Trash2 size={16}/>,run:()=>void hub?.archive(song),danger:true},
 ];
 useEffect(()=>{if(!menu)return;menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
  const away=(event:PointerEvent)=>{if(!menuRef.current?.contains(event.target as Node)&&!trigger.current?.contains(event.target as Node))setMenu(false);};
   const resize=()=>setMenu(false),scroll=(event:Event)=>{if(event.target!==menuRef.current)setMenu(false);};
   document.addEventListener("pointerdown",away);document.addEventListener("scroll",scroll,true);window.addEventListener("resize",resize);
   return()=>{document.removeEventListener("pointerdown",away);document.removeEventListener("scroll",scroll,true);window.removeEventListener("resize",resize);};},[menu]);
 function menuKeys(event:KeyboardEvent<HTMLDivElement>){
  const list=[...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')??[])],at=list.indexOf(document.activeElement as HTMLButtonElement);
  if(event.key==="Escape"){event.preventDefault();setMenu(false);trigger.current?.focus();}
  else if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();const next=(at+(event.key==="ArrowDown"?1:-1)+list.length)%list.length;list[next]?.focus();}
  else if(event.key==="Home"){event.preventDefault();list[0]?.focus();}else if(event.key==="End"){event.preventDefault();list.at(-1)?.focus();}
  else if(event.key==="Tab"){setMenu(false);trigger.current?.focus();}
 }
 const anchor=menu?trigger.current?.getBoundingClientRect():undefined;
 const menuPosition=anchor?{
   "--song-menu-left":Math.max(12,Math.min(window.innerWidth-292,anchor.right-280))+"px",
   "--song-menu-top":Math.max(12,Math.min(window.innerHeight-Math.min(window.innerHeight*.7,520,items.length*46+12)-12,anchor.bottom+8))+"px",
 } as CSSProperties:undefined;

 return <article className={`song-card${archived?" song-card-archived":""}${!ready&&melodyReferences.length?" song-card-hum":""}`} aria-label={song.name} data-song-id={song.id}>
  <div className="song-card-header"><div className={`song-card-art art-${song.art%4}`} aria-hidden="true">{song.coverAsset?<img style={{width:"100%",height:"100%",objectFit:"cover"}} src={`/api/studio/lyric-assets?song=${encodeURIComponent(song.id)}&asset=${encodeURIComponent(song.coverAsset)}`} alt=""/>:<Music2 size={24}/>}</div>
   <button type="button" className="song-card-title" disabled={busy||!hub||archived} onClick={()=>act("details")}><strong>{song.name}</strong><span>{song.tags.slice(0,3).join(" · ")||song.stage}</span><small>{time!==null?<time dateTime={new Date(time).toISOString()}>{new Date(time).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}</time>:"Earlier saved creation · date unavailable"} · {archived?"Deleted":blocked?"Needs review":songStatus(song)}{!archived&&hub?.releaseLoaded?" · "+(release?.status??"Private"):""}</small></button>
   <div className="song-card-buttons">
    {ready&&!archived&&<button type="button" className="secondary small song-lyrivid" data-testid={`button-lyrivid-${song.id}`} disabled={busy||!hub} aria-label={`Make a LyriVid for ${song.name}`} onClick={()=>act(videoAction)}><Film size={15}/> LyriVid</button>}
    {ready&&!archived&&!!song.lyricVideo&&<button type="button" className="secondary small song-videos" data-testid={`button-videos-${song.id}`} disabled={busy||!hub} aria-label={`Saved videos for ${song.name}`} onClick={()=>openSheet("videos")}>🎬 Videos{savedVideoCount?` (${savedVideoCount})`:""}</button>}
    {ready&&!archived&&<button type="button" className="song-play" aria-pressed={preview} aria-label={`${preview?"Close player for":"Play"} ${song.name}`} onClick={togglePreview}><Play size={16} fill={preview?"currentColor":"none"}/></button>}
    {!archived&&<button type="button" className={`song-like${song.favorite?" liked":""}`} aria-pressed={!!song.favorite} aria-label={`${song.favorite?"Unlike":"Like"} ${song.name}`} disabled={busy||!hub} onClick={()=>void hub?.save({...song,favorite:!song.favorite},song.favorite?"Removed from Liked songs":"Added to Liked songs")}><Heart size={18} fill={song.favorite?"currentColor":"none"}/><span>{song.favorite?"Liked":"Like"}</span></button>}
    <div className="song-menu-wrap">
     <button ref={trigger} type="button" className="song-menu-trigger" aria-haspopup="menu" aria-expanded={menu} aria-controls={`${id}-menu`} aria-label={`Song actions for ${song.name}`} data-testid="song-menu" onClick={()=>setMenu(v=>!v)} onKeyDown={e=>{if(e.key==="ArrowDown"&&!menu){e.preventDefault();setMenu(true);}}}><MoreHorizontal size={20}/></button>
     {menu&&createPortal(<div ref={menuRef} className="song-menu" style={menuPosition} role="menu" id={`${id}-menu`} aria-label={`Actions for ${song.name}`} onKeyDown={menuKeys}>
      {items.map(item=><button key={item.key} type="button" role="menuitem" className={item.danger?"danger":undefined} disabled={busy||!hub||item.disabled} onClick={()=>{setMenu(false);item.run();}}>{item.icon}<span>{item.label}</span></button>)}
     </div>,document.body)}
    </div>
   </div>
  </div>
  {!archived&&melodyReferences.length>0&&<div className="song-reference-summary"><span>Hum · {melodyReferences.length} {melodyReferences.length===1?"take":"takes"}</span>{!ready&&hub&&<button type="button" className="secondary small" disabled={busy} onClick={()=>act("make-like-this")} title="Reuse this song’s writing. Your private recordings stay attached here.">Begin a song from this</button>}</div>}
  <MusicLanguageSummary profile={languageForAudio(song)}/>
  {preview&&ready&&!archived&&<AudioPlayer src={songAudioUrl(song.id,song.audioId)} label={`Listen to ${song.name}`}/>}
  {archived&&<div className="song-card-restore"><p>{deletionNotice}</p>{deletionDeadline(song)!==null&&<p>{canRestoreSong(song)?"Restore before":"Recovery ended"}: {new Date(deletionDeadline(song)!).toLocaleString()}</p>}<button type="button" className="primary small" disabled={busy||!hub||!canRestoreSong(song)} onClick={restore}>Restore to Your songs</button><p className="muted">A restored release remains unlisted until you explicitly publish it again.</p></div>}
  {!archived&&!!melodyReferences.length&&open&&sheet==="tools"&&<section className="song-melody-reference"><h3>Melody references · {melodyReferences.length}</h3><p className="muted">Private recordings saved as references, not sent to the music provider.</p>{melodyReferences.map((reference,index)=><div className="melody-reference-saved" key={reference.assetId}><strong>Take {index+1} · {Math.floor(reference.durationSeconds/60)}:{String(Math.floor(reference.durationSeconds%60)).padStart(2,"0")}</strong><audio controls preload="none" data-testid="melody-reference-player" aria-label={`Play private melody reference ${index+1}`} src={`/api/studio/lyric-assets?song=${encodeURIComponent(song.id)}&asset=${encodeURIComponent(reference.assetId)}`}/></div>)}</section>}
  {open&&!archived&&<div className="song-card-panel" id={`${id}-actions`} data-sheet={sheet}>
   <div className="song-sheet-head"><h3>{sheet==="videos"?"Your videos":sheet==="tools"?"More tools":sheet==="share"?"Share privately":sheet==="download"?"Download":"Project & playlist"}</h3><button type="button" className="text-button" onClick={()=>setOpen(false)}>Close</button></div>
   {sheet==="videos"&&<section className="song-sheet" data-testid="sheet-videos"><SavedLyricVideos song={song}/>{!savedVideoCount&&<p className="muted">Videos you finish are saved here automatically. Open “Find all saved video files” to check for older ones.</p>}</section>}
   {sheet==="tools"&&<section className="song-sheet">
    <p className="muted">Everything else this song can do. The original recording always stays saved; new generations show their credit estimate first.</p>
    <div className="actions">{button("Edit details","details")}{button("Lyrics & prompts","lyrics")}{button("Save prompt","save-prompt")}{button("Record vocals","record",true)}{button("Open mixer","mix",true)}{isInstrumental(song.instrumental)?button("Remix instrumental","remix",true):button("Remix · new take like this","remix",true)}{button("Make a Short","short-video",true)}</div>
    <h4>Look</h4><div className="actions">{button("Create / animate cover","cover")}{button("Create logo","logo")}{button("Artwork & visuals","artwork")}</div>
    <h4>Versions</h4><div className="actions">{button("Versions & final master","versions",true)}</div>
    <h4>Start fresh</h4><p className="muted">Make a brand-new composition from this song’s settings, not a cover or edit of the recording.</p><div className="actions">{onReuse?<button type="button" className="secondary small" disabled={busy} onClick={()=>onReuse(song)}>Make another like this</button>:button("Make another like this","make-like-this")}</div>
    <h4>Name</h4><div className="actions"><button type="button" className="secondary small" disabled={busy||!hub} onClick={()=>{setName(song.name);setRename(v=>!v);}}>Rename</button></div>
    {rename&&<form onSubmit={async e=>{e.preventDefault();if(name.trim()&&await hub?.save({...song,name:name.trim()},"Song renamed"))setRename(false);}}><label>Song name<input maxLength={100} required value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label><button className="secondary small" disabled={busy||!name.trim()}>Save name</button></form>}
   </section>}
   {sheet==="share"&&<section className="song-sheet">
    <p className="muted">A private listening link only reaches people you send it to. It never lists your song publicly; Publish is a separate, explicit step.</p>
    {ready?<SongShareControls songId={song.id} title={song.name} disabled={busy}/>:<p>Add a ready, reviewed recording to share it.</p>}
    {ready&&<AudioActions song={song} mode="share"/>}
    {published&&<div className="actions"><button type="button" className="secondary small" disabled={busy} onClick={()=>void shareRelease()}>Share release link</button><a className="secondary small" href={songHref(release!.releaseId!)}>Open release</a>{hub?.unlist&&<button type="button" className="secondary small" disabled={busy} onClick={()=>void hub.unlist?.(song)}>Unlist release</button>}</div>}
    {ready&&<a className="secondary small" href={artistDashboardHref(song.id)}>Artist dashboard &amp; sharing</a>}
   </section>}
    {sheet==="download"&&<section className="song-sheet">{ready?<><AudioActions song={song} mode="download"/><SavedLyricVideos song={song}/><div className="actions">{button("Stems & MIDI","stems-midi",true)}{button("Release download package","export",true)}</div></>:<p>Add a ready, reviewed recording to enable audio and video downloads.</p>}</section>}
   {sheet==="organize"&&<section className="song-sheet">
    <label>Project folder<select value={song.folderId??""} disabled={busy||!hub} onChange={e=>void hub?.save({...song,folderId:e.target.value||undefined},"Folder updated")}><option value="">Unfiled</option>{hub?.folders.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
    {ready?<><label>Add to private playlist<select value={playlist} disabled={busy||!hub} onChange={e=>setPlaylist(e.target.value)}><option value="">Choose a playlist</option><option value="__new">Create a playlist…</option>{hub?.station?.customPlaylists?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button type="button" className="secondary small" disabled={busy||!playlist||!hub} onClick={async()=>{if(await hub?.playlist(song,playlist)){setStatus("Saved to your private playlist.");setPlaylist("");}}}>Add to playlist</button></>:<p className="muted">Playlists hold finished recordings. This writing project can still live in a folder.</p>}
   </section>}
   {status&&<p role="status">{status}</p>}
  </div>}
  {archived&&status&&<p role="status">{status}</p>}
 </article>;
});
