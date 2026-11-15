"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Play } from "lucide-react";
import { CommunityError, communityRequest } from "./client";
import { communityApi, minListenMs, type Release } from "./data";

type Playback = { token: string; song: string; elapsed: number; mark: number; media: number; pending: boolean; retryAt: number };

export function CommunityPlayer({ song, countable, shareRef, refresh }: {
  song: Release; countable: boolean; shareRef?: string; refresh: () => Promise<boolean>;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const session = useRef<Playback | null>(null);
  const mounted = useRef(false);
  const pending = useRef(false);
  const [starting, setStarting] = useState(false);
  const [status, setStatus] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; session.current = null; };
  }, []);

  async function start() {
    if (!audio.current || pending.current) return;
    if (active) {
      if (audio.current.paused) await audio.current.play().catch(() => setStatus("Press Play on the audio controls to listen."));
      else audio.current.pause();
      return;
    }
    pending.current = true;
    setStatus(""); setStarting(true);
    try {
      const result = countable ? await communityRequest<{ token: string | null }>(communityApi, { action: "start", id: song.id, ref: shareRef }) : null;
      if (!mounted.current || !audio.current) return;
      const token = result?.token;
      session.current = token ? { token, song: song.id, elapsed: 0, media: 0, mark: 0, pending: false, retryAt: 0 } : null;
      audio.current.src = communityApi + "?audio=" + encodeURIComponent(song.id) + (token ? "&ticket=" + encodeURIComponent(token) : "");
      setActive(true);
      await audio.current.play().catch(() => setStatus("Press Play on the audio controls to listen."));
    } catch (error) {
      if (mounted.current) setStatus(error instanceof Error ? error.message : "Could not start playback. Try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setStarting(false);
    }
  }

  function resetProgress() {
    if (!session.current || !audio.current) return;
    session.current.mark = performance.now();
    session.current.media = audio.current.currentTime;
  }

  async function trackProgress() {
    const running = session.current;
    const element = audio.current;
    if (!running || !element || element.seeking) return;
    const wall = performance.now();
    const elapsed = (wall - running.mark) / 1000;
    const advanced = element.currentTime - running.media;
    if (running.mark && !element.paused && advanced > 0 && advanced <= elapsed * Math.max(element.playbackRate, 1) + 0.12)
      running.elapsed += Math.min(advanced, elapsed) * 1000;
    resetProgress();
    if (running.elapsed < minListenMs || running.pending || wall < running.retryAt) return;
    running.pending = true;
    try {
      const result = await communityRequest<{ counted: boolean }>(communityApi, { action: "listen", id: running.song, token: running.token });
      if (session.current !== running) return;
      session.current = null;
      if (result.counted) {
        setStatus("Listen counted.");
        await refresh();
      }
    } catch (error) {
      if (session.current !== running) return;
      if (error instanceof CommunityError && error.status === 409) {
        session.current = null;
        setStatus("This listening session ended. Refresh to start a new one.");
      } else {
        running.retryAt = performance.now() + 2000;
      }
    } finally { running.pending = false; }
  }

  return <div className="community-player">
    {!active && <button type="button" className="primary" disabled={starting} onClick={() => void start()}><Play size={16}/>{starting ? "Starting…" : "Play song"}</button>}
    <audio ref={audio} hidden={!active} controls preload="none" aria-label={`Listen to ${song.title}`}
      onTimeUpdate={() => void trackProgress()} onPlaying={resetProgress} onSeeking={resetProgress} onSeeked={resetProgress}
      onRateChange={resetProgress} onPause={resetProgress} onError={() => {
        session.current = null; setActive(false); setStatus("This recording could not play. Try again.");
      }}/>
    <small className="muted"><Headphones size={13}/> {countable ? "One qualified play per account or browser per UTC day after 10 seconds. Anonymous counting uses a 30-day first-party cookie." : "Your own playback does not increase listening totals."}</small>
    {status && <p role="status" className="muted">{status}</p>}
  </div>;
}
