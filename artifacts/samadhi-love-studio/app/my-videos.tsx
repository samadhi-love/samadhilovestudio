"use client";
import { useState } from "react";
import type { Song } from "./studio-data";
import { assetUrl } from "./lyric-pro-data";
import { VideoLinkActions } from "./video-publishing";

const shapeLabel = { wide: "YouTube · wide", vertical: "Phone · Shorts", square: "Square" } as const;

/** Every finished video from every song, newest first: watch, download or share. */
export function MyVideos({ songs, makeVideo }: { songs: Song[]; makeVideo?: () => void }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const items = songs.filter(song => !song.deletedAt)
    .flatMap(song => (song.lyricVideo?.pro?.exports ?? []).filter(video => video.asset).map(video => ({ song, video })))
    .sort((a, b) => b.video.at.localeCompare(a.video.at));
  return <section className="panel form-panel my-videos" data-testid="my-videos">
    <h2>🎬 My Videos</h2>
    {!items.length ? <>
      <p className="muted">Every video you finish is saved here automatically, privately in your account.</p>
      {makeVideo && <button type="button" className="primary" onClick={makeVideo}>Make a video</button>}
    </> : <>
      <p className="muted">{items.length} saved privately · newest first</p>
      <div className="my-videos-grid">{items.map(({ song, video }) => {
        const url = assetUrl(song.id, video.asset!);
        return <article key={video.id} className={`my-video my-video-${video.format}`} data-testid={`my-video-${video.id}`}>
          <div className="my-video-frame">{playing === video.id
            ? <video src={url} controls autoPlay playsInline preload="metadata" aria-label={`${song.name} video`}/>
            : <button type="button" className="my-video-play" data-testid={`button-watch-${video.id}`} aria-label={`Watch ${song.name}`} onClick={() => setPlaying(video.id)}>▶</button>}</div>
          <strong>{song.name}</strong>
          <small className="muted">{shapeLabel[video.format] ?? video.format} · {new Date(video.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</small>
          <div className="actions">
            <a className="secondary small" href={url} download={`${song.name}-${video.format}.${video.extension}`}>Download</a>
            <VideoLinkActions url={url} title={song.name}/>
          </div>
        </article>;
      })}</div>
    </>}
  </section>;
}
