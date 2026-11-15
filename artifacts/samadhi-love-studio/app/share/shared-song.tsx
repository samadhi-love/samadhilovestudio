"use client";
import { useCommunityResource } from "../community/client";
export function SharedSong({ token }: { token: string }) {
  const { data, error, refresh } = useCommunityResource<{ title: string; artist: string; audio: string }>("/api/song-share?token=" + encodeURIComponent(token));
  return <main className="listener-shell"><header className="listener-nav"><a className="brand" href="/community">SAMADHI LOVE</a></header><section className="listener-hero"><p className="eyebrow">SHARED LISTENING LINK</p>
    {error ? <p role="alert">{error} <button type="button" onClick={() => void refresh()}>Retry</button></p> : data ? <><h1>{data.title}</h1><p>{data.artist}</p><audio controls preload="metadata" src={data.audio} aria-label={`Listen to ${data.title}`}/><p className="muted">Shared by its creator. This song is not listed in public discovery. Please respect the artist’s rights.</p></> : <p role="status">Opening shared song…</p>}
  </section></main>;
}
