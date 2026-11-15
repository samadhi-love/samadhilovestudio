"use client";

import { SharedRadio } from "./shared-radio";
import { RadioAtmosphere, RadioSceneControls, useRadioScene } from "./radio-scenes";
import { HelpControl } from "./help-tip";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Pause, Play, Radio, SkipBack, SkipForward } from "lucide-react";
import { hasExplicitWords, isExplicitSong } from "./clean-content";
import { playlists, suggestedForPlaylist, type PlaylistId } from "./playlist-data";
import { playerSkins, songAudioUrl, type CustomPlaylist, type Song, type Station } from "./studio-data";

function clock(seconds: number) {
  const time = Math.floor(Number.isFinite(seconds) ? seconds : 0);
  return Math.floor(time / 60) + ":" + String(time % 60).padStart(2, "0");
}

export function StudioRadio({ active, songs, station, saving, save, pauseForRecording }: {
  active: boolean;
  songs: Song[];
  station?: Station;
  saving: boolean;
  pauseForRecording: boolean;
  save: (station: Station) => Promise<boolean>;
}) {
  const scenes=useRadioScene("private");
  const player = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState("");
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState("");
  const [addId, setAddId] = useState("");
  const [channel, setChannel] = useState("main");
  const [playlistName, setPlaylistName] = useState("");
  const [playlistError, setPlaylistError] = useState("");
  const [editing, setEditing] = useState<"new" | "rename" | null>(null);
  const customPlaylists = station?.customPlaylists ?? [];
  const custom = customPlaylists.find(item => item.id === channel);
  const builtIn = Object.hasOwn(playlists, channel) ? channel as PlaylistId : undefined;
  const channelTitle = custom?.name ?? (builtIn ? playlists[builtIn].title : "Station playlist");
  const saveCustom = (next: CustomPlaylist[]) => save({ ...station, skin, customPlaylists: next });
  async function submitPlaylist(event: React.FormEvent) {
    event.preventDefault();
    const name = playlistName.trim();
    if (!name) return;
    if (hasExplicitWords(name)) { setPlaylistError("Choose a clean playlist name."); return; }
    if (customPlaylists.some(item => item.id !== custom?.id && item.name.toLowerCase() === name.toLowerCase())) {
      setPlaylistError("That playlist name is already in use."); return;
    }
    if (editing === "rename" && custom) {
      if (!await saveCustom(customPlaylists.map(item => item.id === channel ? { ...item, name } : item))) return;
    } else {
      const id = crypto.randomUUID();
      if (!await saveCustom([...customPlaylists, { id, name, tracks: [] }])) return;
      setChannel(id); setAddId("");
    }
    setEditing(null);
  }
  const skin = station?.skin ?? "cosmic";
  const available = songs.filter(song => song.audioFormat && !isExplicitSong(song));
  const byId = new Map(available.map(song => [song.id, song]));
  const storedQueue = custom?.tracks ?? (builtIn
    ? station?.playlists?.[builtIn] ?? suggestedForPlaylist(builtIn, available)
    : station?.queue ?? available.map(song => song.id));
  const queue = storedQueue.filter(id => byId.has(id));
  function saveQueue(visible: string[]) {
    const next = [...visible, ...storedQueue.filter(id => !byId.has(id))];
    if (custom) return saveCustom(customPlaylists.map(item => item.id === channel ? { ...item, tracks: next } : item));
    return builtIn ? save({ ...station, skin, playlists: { ...station?.playlists, [builtIn]: next } }) : save({ ...station, skin, queue: next });
  }
  const nextUp = available.filter(song => !queue.includes(song.id));
  const now = byId.get(current);

  useEffect(() => { if (player.current) player.current.volume = volume; }, [volume]);
  useEffect(() => { if (pauseForRecording || !active) player.current?.pause(); }, [pauseForRecording,active]);
  useEffect(() => {
    if (current && !queue.includes(current) && player.current) {
      player.current.pause();
      player.current.removeAttribute("src");
      player.current.load();
      setCurrent(""); setPosition(0); setDuration(0);
    }
  }, [current, queue]);

  function play(id: string) {
    const media = player.current;
    if (!id || !media) return;
    setError("");
    const url = new URL(songAudioUrl(id, byId.get(id)?.audioId), window.location.href).href;
    if (media.src !== url || media.error || media.ended) {
      media.src = url;
      setPosition(0); setDuration(0); setCurrent(id);
    }
    void media.play().catch((error: DOMException) => {
      if (error.name !== "AbortError") setError("This track could not play. Try another track in the queue.");
    });
  }

  function step(direction: number) {
    if (!queue.length) return;
    const index = queue.indexOf(current);
    if (queue.length === 1 && player.current && Number.isFinite(player.current.duration)) player.current.currentTime = 0;
    play(queue[index < 0 ? 0 : (index + direction + queue.length) % queue.length]);
  }

  function move(index: number, direction: number) {
    const next = [...queue];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    void saveQueue(next);
  }

  function switchChannel(id: string) {
    player.current?.pause();
    player.current?.removeAttribute("src");
    player.current?.load();
    setCurrent(""); setPosition(0); setDuration(0); setError("");
    setChannel(id); setAddId(""); setEditing(null);
  }

  return <div hidden={!active}>
    <div className="chips playlist-switcher" aria-label="Radio playlists">
      <button className={`chip ${channel === "main" ? "active" : ""}`} aria-pressed={channel === "main"} onClick={() => switchChannel("main")}>Main rotation</button>
      {(Object.keys(playlists) as PlaylistId[]).map(id => <button key={id} className={`chip ${channel === id ? "active" : ""}`}
        aria-pressed={channel === id} onClick={() => switchChannel(id)}>{playlists[id].title}</button>)}
      {customPlaylists.map(item => <button key={item.id} className={`chip ${channel === item.id ? "active" : ""}`} aria-pressed={channel === item.id} onClick={() => switchChannel(item.id)}>{item.name}</button>)}
      <HelpControl subject="New playlist" tip="Create a named collection you can fill with songs and play on your station."><button className="chip" disabled={saving} onClick={() => { setEditing("new"); setPlaylistName(""); setPlaylistError(""); }}>+ New playlist</button></HelpControl>
    </div>
    {editing && <form className="panel form-panel" onSubmit={submitPlaylist}>
      <label className="field">Playlist name<input autoFocus value={playlistName} maxLength={80} required onChange={event => setPlaylistName(event.target.value)}/></label>
      {playlistError && <p className="notice" role="alert">{playlistError}</p>}
      <div className="actions"><button className="primary" disabled={saving}>Save playlist</button><button className="secondary" type="button" onClick={() => setEditing(null)}>Cancel</button></div>
    </form>}
    <audio ref={player} preload="metadata" onEnded={() => step(1)} onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)} onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
      onLoadedMetadata={event => setDuration(event.currentTarget.duration)}
      onError={() => { if (current) setError("This track could not load. Try the next track."); }}/>
    <div className={`radio-deck radio-${skin}`}>
      <div className="radio-brand"><Radio size={17}/> SAMADHI LOVE RADIO <span>{playing ? "● PLAYING" : "● STANDBY"}</span></div>
      <div className="radio-screen">
        <RadioAtmosphere scene={scenes.scene} motion={scenes.motion} active={active}/>
        <div>
          <div className="radio-kicker">PRIVATE STATION / CONTINUOUS PLAY</div>
          <strong>{now?.name ?? "Tune in to your frequency"}</strong>
          <small>{queue.length} {queue.length === 1 ? "track" : "tracks"} in rotation</small>
        </div>
        <div className={`radio-meter ${playing ? "playing" : ""}`} aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ height: `${18 + (i * 37) % 76}%`, animationDelay: `${i * -0.093}s` }}/>)}
        </div>
      </div>
      <RadioSceneControls settings={scenes}/>
      <div className="radio-progress"><span>{clock(position)}</span><input aria-label="Seek" type="range" min="0" step="0.1" max={Number.isFinite(duration) && duration > 0 ? duration : 1}
        value={position} disabled={!duration || !Number.isFinite(duration)} onChange={event => {
          if (player.current) player.current.currentTime = Number(event.target.value);
          setPosition(Number(event.target.value));
        }}/><span>{clock(duration)}</span></div>
      <div className="radio-controls">
        <div className="actions">
          <button aria-label="Previous track" disabled={!queue.length} onClick={() => step(-1)}><SkipBack size={18}/></button>
          <button className="radio-play" aria-label={playing ? "Pause radio" : "Play radio"} disabled={!queue.length} onClick={() => playing ? player.current?.pause() : play(current || queue[0])}>{playing ? <Pause size={21}/> : <Play size={21}/>}</button>
          <button aria-label="Next track" disabled={!queue.length} onClick={() => step(1)}><SkipForward size={18}/></button>
        </div>
        <label>Volume <input className="volume-slider" aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={event => setVolume(Number(event.target.value))}/></label>
        <HelpControl subject="Player skin" tip="Change how the radio player looks while keeping the current playlist."><label>Player skin <select value={skin} disabled={saving} onChange={event => { void save({ ...station, skin: event.target.value as Station["skin"] }); }}>
          {Object.entries(playerSkins).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label></HelpControl>
      </div>
      {error && <p role="alert" className="radio-error">{error}</p>}
    </div>
    <div className="panel form-panel station-queue">
      <div className="section-head"><h2>{channelTitle}</h2><div className="actions">
        <HelpControl subject="Sort A–Z" tip="Reorder the songs in the selected playlist alphabetically by title."><button className="secondary small" disabled={saving || queue.length < 2} onClick={() => saveQueue([...queue].sort((a, b) => (byId.get(a)?.name ?? "").localeCompare(byId.get(b)?.name ?? "")))}>Sort A–Z</button></HelpControl>
        {custom && <><button className="secondary small" disabled={saving} onClick={() => { setEditing("rename"); setPlaylistName(custom.name); setPlaylistError(""); }}>Rename playlist</button>
          <button className="text-button danger" disabled={saving} onClick={async () => {
            if (confirm("Remove this playlist? Its songs will stay in the library.") && await saveCustom(customPlaylists.filter(item => item.id !== channel))) switchChannel("main");
          }}>Remove playlist</button></>}
      </div></div>
      {builtIn && <p className="muted playlist-description">{playlists[builtIn].description} The starting list uses your song titles and tags. Add or reorder any clean recording below.</p>}
      {!available.length && <div className="radio-demo">
        <p className="muted">Upload a recording or move a finished creation into the Song Library to start your station.</p>
        <p>Test your speakers with this short studio sound check.</p>
        {active && <audio controls preload="none" aria-label="Studio sound check" src="/studio-sound-check.mp3"/>}
      </div>}
      {available.length > 0 && !queue.length && <p className="muted">Add a track to start the rotation.</p>}
      <ol>{queue.map((id, index) => <li key={id}>
        <button className="text-button" aria-current={id === current ? "true" : undefined} onClick={() => play(id)}>{byId.get(id)?.name}</button>
        <div className="actions">
          <button className="icon-button" aria-label={`Move ${byId.get(id)?.name} up`} disabled={saving || index === 0} onClick={() => move(index, -1)}><ArrowUp size={16}/></button>
          <button className="icon-button" aria-label={`Move ${byId.get(id)?.name} down`} disabled={saving || index === queue.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16}/></button>
          <button className="secondary small" disabled={saving} onClick={() => saveQueue(queue.filter(item => item !== id))}>Remove</button>
        </div>
      </li>)}</ol>
      {nextUp.length > 0 && <div className="actions station-add">
        <select aria-label="Recording to add" value={addId} onChange={event => setAddId(event.target.value)}>
          <option value="">Choose a recording</option>
          {nextUp.map(song => <option key={song.id} value={song.id}>{song.name}</option>)}
        </select>
        <HelpControl subject="Add to playlist" tip="Place the selected library song into this playlist."><button className="secondary" disabled={saving || !nextUp.some(song => song.id === addId)} onClick={async () => {
          if (await saveQueue([...queue, addId])) setAddId("");
        }}>Add to playlist</button></HelpControl>
      </div>}
    </div>
  </div>;
}

export function RadioWorkspace(props:Parameters<typeof StudioRadio>[0]){const[mode,setMode]=useState<"private"|"shared">("private");return <div hidden={!props.active}><div className="tabs" aria-label="Radio workspace"><button type="button" className={mode==="private"?"tab-active":""} aria-pressed={mode==="private"} onClick={()=>setMode("private")}>My studio radio</button><button type="button" className={mode==="shared"?"tab-active":""} aria-pressed={mode==="shared"} onClick={()=>setMode("shared")}>Shared live station &amp; submissions</button><a className="text-button" href="/radio">Open listener page</a></div><StudioRadio {...props} active={props.active&&mode==="private"} pauseForRecording={props.pauseForRecording||mode!=="private"}/>{mode==="shared"&&<SharedRadio active={props.active&&!props.pauseForRecording}/>}</div>;}
