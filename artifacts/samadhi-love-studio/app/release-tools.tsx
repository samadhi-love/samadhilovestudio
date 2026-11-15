"use client";
import { RightsReview } from "./rights-review";

import { ReleasePackage } from "./release-package";
import { pinnedMaster, projectRoot } from "./project-assets";
import { HelpControl, HelpField } from "./help-tip";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Clapperboard, Copy, ExternalLink, Music2 } from "lucide-react";
import { songAudioUrl, type Song } from "./studio-data";
import { exportShort } from "./short-export";
import {VideoFormatPicker} from "./video-format-picker";
import {videoFrameSize} from "./video-format-options";
import type {VideoFormat} from "./lyric-video-data";
import { cleanWordsMessage, hasExplicitWords } from "./clean-content";
import { AudioActions } from "./audio-actions";
import { CleanLyricsChecker } from "./clean-lyrics-checker";
import { videoPlatforms as platforms, VideoPublishing, type VideoExport, type VideoPlatform as Platform } from "./video-publishing";

function externalLink(value: string, domain: string) {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:" && url.hostname === domain && !url.username && !url.password) return url.href;
  } catch {}
  return null;
}

export function ReleaseTools({ initialSongId, songs, saving, save }: {
  initialSongId: string; songs: Song[];
  saving: boolean;
  save: (song: Song, message?: string) => Promise<boolean>;
}) {
  const [selection, setSelection] = useState(initialSongId);
  const song = songs.find(item => item.id === selection) ?? songs.find(item => item.audioFormat) ?? songs[0];

  return <>
    <div className="create-banner"><span className="eyebrow"><Clapperboard size={17}/> RELEASE TOOLS</span>
      <h1>Send your sound out.</h1><p>Open your distribution accounts, then cut a vertical clip to save, upload, or share.</p>
    </div>
    <div className="actions distribution-launch">
      <HelpControl subject="Upload at DistroKid" tip="Open DistroKid in a new tab to sign in and submit your release."><a className="primary" href="https://distrokid.com/new" target="_blank" rel="noreferrer">Upload at DistroKid <ExternalLink size={15}/></a></HelpControl>
      <a className="secondary" href="https://distrokid.com/mymusic/" target="_blank" rel="noreferrer">DistroKid releases <ExternalLink size={15}/></a>
      <a className="secondary" href="https://artists.spotify.com/" target="_blank" rel="noreferrer">Spotify for Artists <ExternalLink size={15}/></a>
    </div>
    {songs.length > 0 && <label className="field compact">Song<select value={song?.id ?? ""} onChange={event => setSelection(event.target.value)}>
      {songs.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
    </select></label>}
    {song && (() => { const master = pinnedMaster(songs, projectRoot(songs, song)); const target = master?.song ?? song; if (!target.audioFormat) return null; const audioId = master?.audioId ?? target.audioId ?? target.id;
      return <RightsReview key={target.id+audioId} song={target} audioId={audioId}/>; })()}
    {song && <ReleasePackage key={projectRoot(songs, song).id} song={song} songs={songs} saving={saving} save={save}/>}
    <div className="create-layout release-tools">
      <ShortMaker song={song}/>
      {song && <ReleaseLinks song={song} saving={saving} save={save}/>}
    </div>
  </>;
}

function ReleaseLinks({ song, saving, save }: { song: Song; saving: boolean; save: (song: Song, message: string) => Promise<boolean> }) {
  const [spotify, setSpotify] = useState(song.releaseLinks?.spotify ?? "");
  const [hyperfollow, setHyperfollow] = useState(song.releaseLinks?.hyperfollow ?? "");
  const [error, setError] = useState("");
  useEffect(() => {
    setSpotify(song.releaseLinks?.spotify ?? "");
    setHyperfollow(song.releaseLinks?.hyperfollow ?? "");
    setError("");
  }, [song.id, song.releaseLinks]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const safeSpotify = externalLink(spotify, "open.spotify.com");
    const safeHyperfollow = externalLink(hyperfollow, "distrokid.com");
    if (safeSpotify === null || (safeSpotify && !new URL(safeSpotify).pathname.startsWith("/track/"))) {
      setError("Paste the full Spotify track link from open.spotify.com."); return;
    }
    if (safeHyperfollow === null || (safeHyperfollow && !new URL(safeHyperfollow).pathname.startsWith("/hyperfollow/"))) {
      setError("Paste the full DistroKid HyperFollow link."); return;
    }
    setError("");
    await save({ ...song, releaseLinks: { spotify: safeSpotify, hyperfollow: safeHyperfollow } }, "Release links saved");
  }
  const spotifyLink = externalLink(song.releaseLinks?.spotify ?? "", "open.spotify.com");
  const followLink = externalLink(song.releaseLinks?.hyperfollow ?? "", "distrokid.com");
  return <form className="panel form-panel" onSubmit={submit}>
    <h2><Music2 size={18}/> Release links</h2>
    <p className="muted creation-note">Store the links you want in captions. DistroKid handles delivery to Spotify. Spotify for Artists is where you manage your artist profile and releases.</p>
    <HelpField label="Spotify track URL" tip="Paste the link to a released Spotify track to include it in your promotional caption."><input type="url" value={spotify} maxLength={500} onChange={event => setSpotify(event.target.value)} placeholder="https://open.spotify.com/track/…"/></HelpField>
    <HelpField label="DistroKid HyperFollow URL" tip="Paste your release landing page link so listeners can find it on their preferred service."><input type="url" value={hyperfollow} maxLength={500} onChange={event => setHyperfollow(event.target.value)} placeholder="https://distrokid.com/hyperfollow/…"/></HelpField>
    <div className="actions"><HelpControl subject="Save links" tip="Store the release URLs with the selected song."><button className="secondary" disabled={saving}>Save links</button></HelpControl>
      {spotifyLink && <a className="text-button" href={spotifyLink} target="_blank" rel="noreferrer">Open Spotify ↗</a>}
      {followLink && <a className="text-button" href={followLink} target="_blank" rel="noreferrer">Open HyperFollow ↗</a>}
    </div>
    <AudioActions song={song}/>
    {error && <p className="notice" role="alert">{error}</p>}
  </form>;
}

function ShortMaker({ song }: { song?: Song }) {
  const [format,setFormat]=useState<VideoFormat>("vertical");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [title, setTitle] = useState(song?.name ?? "");
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [video, setVideo] = useState("");
  const [confirmedClean, setConfirmedClean] = useState(false);
  const [sound, setSound] = useState(song?.audioFormat ? "song" : "video");
  const [start, setStart] = useState("0");
  const [length, setLength] = useState("15");
  const [output, setOutput] = useState<(VideoExport&{format:VideoFormat}) | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  const urls = useRef({ video: "", output: "" });
  useEffect(() => () => {
    pending.current?.abort();
    Object.values(urls.current).filter(Boolean).forEach(url => URL.revokeObjectURL(url));
  }, []);
  useEffect(() => {
    pending.current?.abort();
    if (urls.current.output) URL.revokeObjectURL(urls.current.output);
    urls.current.output = "";
    setTitle(song?.name ?? "");
    setSound(song?.audioFormat ? "song" : "video");
    setCaption(""); setOutput(null); setError(""); setMessage("");
  }, [song?.id, song?.name, song?.audioFormat]);

  function makeCaption() {
    if (hasExplicitWords(title, hook)) { setError(cleanWordsMessage); return; }
    setError("");
    const name = title.trim() || "A new frequency";
    const line = hook.trim() || "From the silence comes the light.";
    const url = song?.releaseLinks?.hyperfollow || song?.releaseLinks?.spotify;
    const hashtags = platform === "youtube" ? (format==="wide"?"#OriginalMusic #SamadhiLove":"#Shorts #SamadhiLove") :
      platform === "tiktok" ? "#SamadhiLove #OriginalMusic #MusicTok" : "#SamadhiLove #OriginalMusic #Reels";
    setCaption([line, `“${name}” by SAMADHI LOVE`, url, hashtags].filter(Boolean).join("\n\n"));
    setMessage("");
  }

  async function render(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    if (hasExplicitWords(title, hook)) { setError(cleanWordsMessage); return; }
    if (video && !confirmedClean) { setError("Confirm the video contains clean content."); return; }
    const controller = new AbortController();
    pending.current = controller;
    setError(""); setMessage(""); setProgress(0);
    try {
      const blob = await exportShort({
        audio: sound === "song" && song?.audioFormat ? songAudioUrl(song.id, song.audioId) : undefined,
        video: video || undefined,
        title: title.trim() || "SAMADHI LOVE", hook: hook.trim(),
        start: Number(start), length: Number(length), signal: controller.signal,
        frameSize:videoFrameSize(format),
      }, setProgress);
      if (urls.current.output) URL.revokeObjectURL(urls.current.output);
      const url = URL.createObjectURL(blob);
      urls.current.output = url;
      setOutput({ url, blob, extension: blob.type.includes("mp4") ? "mp4" : "webm",format });
      setMessage("Clip ready to preview and download.");
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Export failed. Try another file.");
    } finally { pending.current = null; setProgress(null); }
  }

  return <section className="panel form-panel">
    <h2>Video clip maker</h2>
    <p className="muted creation-note">Make a widescreen YouTube clip or an upright Shorts / Reels video from your song or authorized local video. Audio-only clips use a cosmic background.</p>
    <VideoFormatPicker value={format} change={value=>{setFormat(value);if(value==="wide")setPlatform("youtube");}} disabled={progress!==null}/>
    <form onSubmit={render}>
      <fieldset disabled={progress !== null}>
        <div className="field-grid">
          <HelpField label="Platform" tip="Choose where you plan to post. Studio uses that platform for the caption and upload shortcut."><select value={platform} onChange={event => setPlatform(event.target.value as Platform)}>
            {Object.entries(platforms).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}
          </select></HelpField>
          <HelpField label="Sound" tip="Choose whether the clip uses the song from your library or the uploaded video's original audio."><select value={sound} onChange={event => setSound(event.target.value)}>
            {song?.audioFormat && <option value="song">Song Library recording</option>}<option value="video">Original video sound</option>
          </select></HelpField>
        </div>
        <HelpField label={<>Video file {sound === "song" && <span className="muted">(optional)</span>}</>} subject="Video file" tip="Choose a local video for the clip. With a library recording, this is optional."><input type="file" accept="video/*,.mp4,.mov,.webm" onChange={event => {
          if (urls.current.video) URL.revokeObjectURL(urls.current.video);
          const file = event.target.files?.[0];
          const url = file ? URL.createObjectURL(file) : "";
          urls.current.video = url; setVideo(url); setConfirmedClean(false);
          if (file && !song?.audioFormat) setTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 100));
        }}/></HelpField>
        {video && <label className="checkline"><input type="checkbox" checked={confirmedClean} onChange={event => setConfirmedClean(event.target.checked)}/> I confirm this video contains clean content.</label>}
        <HelpField label="On-screen title" tip="This title appears inside the exported short video."><input value={title} maxLength={100} onChange={event => setTitle(event.target.value)}/></HelpField>
        <HelpField label="Hook or lyric line" tip="Add a short line viewers will see on the video and in the suggested post caption."><input value={hook} maxLength={140} onChange={event => setHook(event.target.value)} placeholder="One line you want people to remember"/></HelpField>
        {hasExplicitWords(title) && <CleanLyricsChecker lyrics={title} change={value => setTitle(value.slice(0, 100))} direction label="Clean on-screen title"/>}
        {hasExplicitWords(hook) && <CleanLyricsChecker lyrics={hook} change={value => setHook(value.slice(0, 140))} label="Clean hook"/>}
        <div className="field-grid">
          <HelpField label="Start time (seconds)" tip="Set where the short begins in the source recording or video."><input type="number" min="0" step="0.1" required value={start} onChange={event => setStart(event.target.value)}/></HelpField>
          <HelpField label="Clip length" tip="Set the maximum duration of the short from the selected start time."><select value={length} onChange={event => setLength(event.target.value)}>
            {[10, 15, 30, 60].map(value => <option key={value} value={value}>{value} seconds</option>)}
          </select></HelpField>
        </div>
        <HelpControl subject="Export video clip" tip="Create a playable video file in your chosen widescreen or upright format."><button className="primary" disabled={(sound === "song" ? !song?.audioFormat : !video) || (!!video && !confirmedClean) || hasExplicitWords(title, hook)}>Export {format==="wide"?"YouTube video":format==="vertical"?"Shorts / Reels video":"square video"}</button></HelpControl>
      </fieldset>
    </form>
    {progress !== null && <div className="actions"><progress max="1" value={progress} aria-label="Clip export progress"/><span className="muted">Keep this tab visible during export.</span><button className="secondary" onClick={() => pending.current?.abort()}>Cancel export</button></div>}
    {error && <p className="notice" role="alert">{error}</p>}
    {output && <div className="short-result" data-format={output.format}>
      <video controls playsInline preload="metadata" src={output.url} aria-label={output.format==="wide"?"Exported widescreen YouTube video":"Exported portrait Shorts / Reels video"}/>
      <VideoPublishing output={output} title={title.trim() || "SAMADHI LOVE"} caption={caption} platform={platform} setPlatform={setPlatform}/>
    </div>}
    <div className="short-caption">
      <HelpField label="Post caption" tip="Write the text to post alongside the clip or copy the suggested caption."><textarea rows={5} maxLength={2200} value={caption} onChange={event => setCaption(event.target.value)}/></HelpField>
      {hasExplicitWords(caption) && <CleanLyricsChecker lyrics={caption} change={setCaption} direction label="Clean post caption"/>}
      <div className="actions">
        <button className="secondary" onClick={makeCaption}>Draft {platforms[platform].label} caption</button>
        <button className="secondary" disabled={!caption} onClick={async () => {
          if (hasExplicitWords(caption)) { setError(cleanWordsMessage); return; }
          setError("");
          try { await navigator.clipboard.writeText(caption); setMessage("Caption copied."); }
          catch { setMessage("Select and copy the caption from the text box."); }
        }}><Copy size={15}/> Copy caption</button>
        {!output && <a className="secondary" href={platforms[platform].upload} target="_blank" rel="noreferrer">Open {platforms[platform].destination} <ExternalLink size={15}/></a>}
      </div>
      <p className="muted creation-note">Upload the downloaded clip and paste your caption on the platform. Review the audience before posting.</p>
      {message && <p role="status">{message}</p>}
    </div>
  </section>;
}
