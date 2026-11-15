"use client";
import { useEffect, useRef, useState } from "react";
import { VideoLinkActions } from "./video-publishing";
import type { Song } from "./studio-data";
import { assetUrl } from "./lyric-pro-data";
type SavedVideo = { id: string; at: string; source: string; extension: "mp4" | "webm"; size: number };
export function SavedLyricVideos({ song }: { song: Song }) {
  const [files, setFiles] = useState<SavedVideo[]>([]), [next, setNext] = useState<string | null>(null), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useRef<AbortController | null>(null), generation = useRef(0);
  useEffect(() => { generation.current++; request.current?.abort(); setFiles([]); setNext(null); setLoaded(false); setError(""); setBusy(false); return () => { generation.current++; request.current?.abort(); }; }, [song.id]);
  const videos = song.lyricVideo?.pro?.exports?.filter(v => v.asset).slice(-3).reverse() ?? [];
  async function browse(cursor?: string) {
    if (busy) return;
    request.current?.abort(); const task = new AbortController(); request.current = task; const token = generation.current;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/studio/lyric-assets?song=${encodeURIComponent(song.id)}&videos=1${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`, { signal: task.signal });
      const result = await response.json() as { videos?: SavedVideo[]; next?: string | null; error?: string };
      if (!response.ok || !Array.isArray(result.videos)) throw new Error(result.error ?? "Saved videos could not load. Retry; existing files are preserved.");
      if (token !== generation.current || task.signal.aborted) return;
      setFiles(items => [...new Map([...(cursor ? items : []), ...result.videos!].map(v => [v.id, v])).values()].sort((a,b) => b.at.localeCompare(a.at))); setNext(result.next ?? null); setLoaded(true);
    } catch (e) { if (token === generation.current && !task.signal.aborted) setError((e as Error).message); }
    finally { if (token === generation.current) setBusy(false); }
  }
  const extra = files.filter(file => !videos.some(v => v.asset === file.id));
  return <div className="saved-lyric-videos"><p className="muted">Private lyric videos</p>
    {videos.map(v => <div key={v.id}><a className="secondary small" href={assetUrl(song.id, v.asset!)} download={`${song.name}-${v.format}.${v.extension}`}>Download {v.format} {v.extension.toUpperCase()}</a><VideoLinkActions url={assetUrl(song.id, v.asset!)} title={song.name}/></div>)}
    <details><summary>Find all saved video files · Classic &amp; Pro</summary><p className="muted">Browse this song’s private cloud video exports, including older recordings. Files from both editors stay separate from their editable settings. Source labels reflect stored metadata; listen to confirm older exports.</p><button type="button" className="secondary small" disabled={busy} onClick={() => void browse()}>{busy ? "Loading saved videos…" : loaded ? "Refresh saved videos" : "Browse saved videos"}</button>
      {error && <p role="alert">{error}</p>}
      {extra.map(file => <div key={file.id}><p className="muted">{file.at.slice(0,16).replace("T", " ")} · {file.source ? file.source === (song.audioId ?? song.id) ? "Current recording" : "Earlier recording version" : "Source version not recorded"}</p><a className="secondary small" href={assetUrl(song.id, file.id)} download={`${song.name.replace(/[\\/:*?"<>|]/g,"_")}-video-${file.id}.${file.extension}`}>Download saved {file.extension.toUpperCase()}</a><VideoLinkActions url={assetUrl(song.id, file.id)} title={song.name}/></div>)}
      {loaded && !files.length && <p>No video exports found in this storage page.</p>}{next && <><p className="muted">More media remains to check; storage pages are not chronological.</p><button type="button" className="secondary small" disabled={busy} onClick={() => void browse(next)}>Load next saved-video page</button></>}
    </details>
  </div>;
}
