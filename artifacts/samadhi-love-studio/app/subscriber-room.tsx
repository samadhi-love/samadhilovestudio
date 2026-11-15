"use client";

import { useEffect, useRef, useState } from "react";
import { PartySpotlight } from "./party/spotlight";
import { Headphones, Radio } from "lucide-react";

export type ListenerTrack = { id: string; name: string };
export const listenerApi = "/api/studio/listener";

export function SubscriberRoom({ signOut, ownerPreview }: { signOut: string; ownerPreview: boolean }) {
  const [tracks, setTracks] = useState<ListenerTrack[] | null>(null);
  const [current, setCurrent] = useState("");
  const [error, setError] = useState("");
  const player = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch(listenerApi).then(async response => {
      if (!response.ok) throw new Error();
      const result = await response.json() as { tracks: ListenerTrack[] };
      setTracks(result.tracks);
    }).catch(() => setError("The station is unavailable. Refresh to try again."));
  }, []);

  function play(id: string) {
    if (!player.current || !id) return;
    setCurrent(id);
    setError("");
    player.current.src = listenerApi + "?song=" + encodeURIComponent(id);
    void player.current.play().catch((error: DOMException) => {
      if (error.name !== "AbortError") setError("This track could not play. Choose another track or refresh.");
    });
  }

  return <main className="listener-shell">
    <header className="listener-nav">
      <div className="brand"><img src="/favicon.svg" alt=""/><div><strong>SAMADHI LOVE</strong><small>THE LISTENING ROOM</small></div></div>
      <div className="actions"><a className="secondary" href="/party">Party Mix</a><a className="secondary" href="/radio">Shared radio</a><a className="secondary" href="/community">Discover music</a>{ownerPreview && <a className="secondary" href="/owner">Owner studio</a>}<a className="secondary" href={signOut} target="_top">Sign out</a></div>
    </header>
    <div className="listener-hero">
      <span className="eyebrow"><Headphones size={16}/> INVITED SUBSCRIBER PREVIEW</span>
      <h1>Find your frequency.</h1>
      <p>A listening room for the sounds of SAMADHI LOVE. From the silence comes the light.</p>
    </div>
    <PartySpotlight/><section className="radio-deck radio-cosmic listener-station">
      <div className="radio-brand"><Radio size={17}/> SAMADHI LOVE RADIO</div>
      <div className="radio-screen"><div><div className="radio-kicker">SUBSCRIBER ROTATION</div>
        <strong>{tracks?.find(track => track.id === current)?.name ?? "The Listening Room"}</strong>
        <small>{tracks === null ? "Opening the station…" : tracks.length ? "Choose a track to tune in." : "The artist is preparing the first rotation."}</small>
      </div></div>
      <audio ref={player} hidden={!current} controls onEnded={() => {
        if (tracks?.length) play(tracks[(tracks.findIndex(track => track.id === current) + 1) % tracks.length].id);
      }}/>
      {error && <p className="radio-error" role="alert">{error}</p>}
      {!!tracks?.length && <ol className="listener-tracks">{tracks.map(track =>
        <li key={track.id}><button className="text-button" aria-current={track.id === current ? "true" : undefined} onClick={() => play(track.id)}>{track.name}</button></li>)}</ol>}
    </section>
  </main>;
}
