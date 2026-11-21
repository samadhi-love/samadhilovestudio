"use client";
/**
 * "Make your video" box beside "Begin a song" on the Create page.
 * 1. Pick the look (gallery, or your own photo / video / camera under "Yours").
 *    It shows right away on the phone-shaped screen.
 * 2. Put a finished song in: drag it onto the screen, or tap "Use in video"
 *    (easiest on a phone). The song plays over your picture with its words.
 * 3. Choose what it is for: YouTube (wide), Shorts/TikTok/Reels (tall highlight),
 *    Phone (tall, full song) or Square box. The screen takes that shape and the
 *    choice is remembered.
 * 4. Make my video opens LyriVid with everything filled in, framed for that use.
 * A video's own sound is always off: it is only a moving picture behind the words.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Film, GripVertical, Music2, Pause, Play, X } from "lucide-react";
import { BackgroundChooser, backgroundArt, type BackgroundKey } from "./background-chooser";
import type { OwnBackground } from "./own-background";
import { videoThemes, type VideoTheme } from "./lyric-video-data";
import { creatorVideoLooks } from "./creator-video-presets";
import { songAudioUrl, type Song } from "./studio-data";
import { isExplicitSong } from "./clean-content";
import { sortSongs } from "./song-library";
import { readVideoPurpose, rememberVideoPurpose, videoPurposeById, videoPurposes, type VideoPurposeId } from "./video-purpose";

export const songDragType = "application/x-versual-song";
/** Lets any song on the page be dragged into the video box. */
export function songDragProps(id: string) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => { e.dataTransfer.setData(songDragType, id); e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "copy"; },
  };
}

/** Sung words for the preview: section labels and {cues} removed. */
export function previewLines(lyrics: string) {
  return lyrics.split("\n").map(l => l.replace(/\{[^{}]*\}/g, "").trim()).filter(l => l && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l)).slice(0, 80);
}

export function themeForKey(key: BackgroundKey): VideoTheme | undefined {
  const [kind, id] = key.split(":");
  if (kind === "theme") return Object.hasOwn(videoThemes, id) ? id as VideoTheme : undefined;
  return creatorVideoLooks.find(l => l.id === id)?.theme;
}

/** Finished songs that can become a video, newest first. */
export function videoReadySongs(songs: Song[]) {
  return sortSongs(songs.filter(s => !s.deletedAt && !s.example && !!s.audioFormat && !isExplicitSong(s)), "newest");
}

export function CreateVideoBox(props: {
  songs: Song[]; songId: string; setSongId: (id: string) => void;
  look: BackgroundKey; pickLook: (key: BackgroundKey) => void; own: OwnBackground;
  photo: Blob | null; clip: Blob | null;
  busy: boolean; make?: (song: Song, purpose: VideoPurposeId) => void | Promise<void>;
  /** Optional: the Create page holds the choice (a saved prompt can bring it back). */
  purpose?: VideoPurposeId; setPurpose?: (id: VideoPurposeId) => void;
}) {
  const ready = useMemo(() => videoReadySongs(props.songs), [props.songs]);
  const song = ready.find(s => s.id === props.songId);
  const [over, setOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(0);
  const [picture, setPicture] = useState("");
  const [ownPurpose, setOwnPurpose] = useState<VideoPurposeId>("shorts");
  const purposeId = props.purpose ?? ownPurpose;
  const purpose = videoPurposeById(purposeId)!;
  // The last choice comes back on the next visit.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the remembered choice once after the page loads
  useEffect(() => { if (!props.purpose) setOwnPurpose(readVideoPurpose()); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once, on load
  const choosePurpose = (id: VideoPurposeId) => { (props.setPurpose ?? setOwnPurpose)(id); rememberVideoPurpose(id); };
  const audio = useRef<HTMLAudioElement>(null);
  const lines = useMemo(() => previewLines(song?.notes.lyrics ?? ""), [song]);
  const theme = themeForKey(props.look);
  const own = props.clip ?? props.photo;

  // Your own photo or clip shows on the screen right away.
  useEffect(() => {
    if (!own) return;
    const url = URL.createObjectURL(own);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the chosen file into a preview link, cleaned up on change
    setPicture(url);
    return () => { URL.revokeObjectURL(url); setPicture(""); };
  }, [own]);
  const choose = (id: string) => { audio.current?.pause(); setPlaying(false); setLine(0); props.setSongId(id); };
  const drop = (e: React.DragEvent) => {
    e.preventDefault(); setOver(false);
    const id = e.dataTransfer.getData(songDragType) || e.dataTransfer.getData("text/plain");
    if (ready.some(s => s.id === id)) choose(id);
  };
  const toggle = () => {
    const el = audio.current; if (!el) return;
    if (el.paused) void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); else { el.pause(); setPlaying(false); }
  };
  const words = song ? (lines[line] ?? song.name) : "Your words appear here";

  return (
    <section className="cvb" aria-labelledby="cvb-heading" data-testid="create-video-box">
      <h2 id="cvb-heading"><Film size={18} aria-hidden="true" /> Make your video</h2>
      <fieldset className="cvb-purpose" data-testid="cvb-purpose">
        <legend>What is it for?</legend>
        <div className="cvb-purpose-options" role="radiogroup" aria-label="What is your video for?">
          {videoPurposes.map(p => <button type="button" role="radio" key={p.id} aria-checked={p.id === purposeId} className={p.id === purposeId ? "active" : ""}
            disabled={props.busy} onClick={() => choosePurpose(p.id)} data-testid={`cvb-purpose-${p.id}`}>
            <span className={`cvb-shape ${p.format}`} aria-hidden="true" /><span><strong>{p.name}</strong><small>{p.shape}</small></span>
          </button>)}
        </div>
        <p className="cvb-hint" data-testid="cvb-purpose-note">For {purpose.where}. When it&apos;s done you can save it to your device or open {purpose.name === "YouTube" ? "YouTube Studio" : "the upload page"} to post it.</p>
      </fieldset>
      <div className={`cvb-stage is-${purpose.format}`}>
        <div className={`cvb-screen ${purpose.format}${over ? " is-over" : ""}`} data-testid="cvb-screen" data-format={purpose.format}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
          style={!picture && theme ? backgroundArt(theme) : undefined} aria-label={song ? `Preview of ${song.name}` : "Video preview. Drop a song here."} role="img">
          {picture && props.clip && <video className="cvb-media" src={picture} muted autoPlay loop playsInline aria-hidden="true" data-testid="cvb-own-video" />}
          {picture && !props.clip && <img className="cvb-media" src={picture} alt="" data-testid="cvb-own-photo" />}
          {!song && <span className="cvb-drop" data-testid="cvb-drop"><Music2 size={18} aria-hidden="true" /> Drop a song here</span>}
          <span className="cvb-words" key={`${song?.id}-${line}`} data-testid="cvb-words">{words}</span>
        </div>
        <div className="cvb-side">
          {song ? <div className="cvb-chosen" data-testid="cvb-chosen">
            <button type="button" className="cvb-play" onClick={toggle} aria-label={playing ? "Pause the song" : "Play the song"} data-testid="cvb-play">{playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}</button>
            <strong>{song.name}</strong>
            <small>{playing ? "Playing over your picture" : "Tap play to hear it"}</small>
            <button type="button" className="qv-link" onClick={() => { audio.current?.pause(); setPlaying(false); props.setSongId(""); }} aria-label="Take the song out"><X size={14} aria-hidden="true" /></button>
            <audio ref={audio} src={songAudioUrl(song.id, song.audioId)} preload="none" onEnded={() => setPlaying(false)}
              onTimeUpdate={e => { const el = e.currentTarget; if (lines.length && el.duration > 0) setLine(Math.min(lines.length - 1, Math.floor(el.currentTime / (el.duration / lines.length)))); }} />
          </div> : <p className="cvb-hint">Drag a song onto the screen, or tap <b>Use in video</b>.</p>}
          {ready.length ? <ul className="cvb-songs" aria-label="Your finished songs" data-testid="cvb-songs">
            {ready.slice(0, 6).map(s => <li key={s.id} {...songDragProps(s.id)} aria-current={s.id === props.songId || undefined}>
              <GripVertical size={15} aria-hidden="true" className="cvb-grip" /><span>{s.name}</span>
              <button type="button" disabled={props.busy || s.id === props.songId} onClick={() => choose(s.id)} data-testid={`cvb-use-${s.id}`}>{s.id === props.songId ? "In video" : "Use in video"}</button>
            </li>)}
          </ul> : <p className="cvb-hint">Your finished songs show here. Begin a song on the left first.</p>}
          {ready.length > 6 && <label className="cvb-more">More songs
            <select value={ready.slice(6).some(s => s.id === props.songId) ? props.songId : ""} onChange={e => e.target.value && choose(e.target.value)} data-testid="cvb-more">
              <option value="">Pick an older song</option>
              {ready.slice(6).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>}
        </div>
      </div>
      <BackgroundChooser song={song} disabled={props.busy} isSelected={key => !props.own.active && props.look === key} pick={props.pickLook} own={props.own} />
      <p className="cvb-note">Video sound is off. Your song is the soundtrack. Words get timed to the voice in the next step.</p>
      {props.make && <button type="button" className="primary cvb-make" disabled={props.busy || !song} onClick={() => song && void props.make?.(song, purposeId)} data-testid="cvb-make">
        <Film size={17} aria-hidden="true" /> {song ? `Make my ${purpose.name} video` : "Add a song to make your video"}</button>}
    </section>
  );
}
