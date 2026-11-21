"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { pageVolumeWorks } from "./page-volume";

function time(seconds: number) {
  const whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
}

export function AudioPlayer({ src, label, onPosition }: { src: string; label: string; onPosition?: (seconds: number) => void }) {
  const player = useRef<HTMLAudioElement>(null);
  const attempt = useRef(0);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  // iPhone/iPad Safari ignores page volume (only the device buttons work), so
  // the slider would move without changing the sound. Show it only where it works.
  const [volumeWorks, setVolumeWorks] = useState(true);
  useEffect(() => { setVolumeWorks(pageVolumeWorks()); }, []);
  useEffect(() => {
    const audio = player.current;
    attempt.current++;
    setFailed(false); setPlaying(false); setStarting(false); setBuffering(false);
    setPosition(0); setDuration(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- counter ref is bumped on purpose so late results from this run are ignored
    return () => { attempt.current++; if (audio && !audio.paused) audio.pause(); };
  }, [src]);
  function pause() {
    attempt.current++;
    player.current?.pause();
    setPlaying(false); setStarting(false); setBuffering(false);
  }
  async function play(restart = false) {
    const audio = player.current;
    if (!audio) return;
    if (failed) { setFailed(false); audio.load(); }
    if (restart && Number.isFinite(audio.duration)) audio.currentTime = 0;
    const current = ++attempt.current;
    setStarting(true); setBuffering(false);
    try { await audio.play(); }
    catch (error) {
      if (current === attempt.current && !(error instanceof DOMException && error.name === "AbortError")) {
        setFailed(true); setPlaying(false); setBuffering(false);
      }
    } finally { if (current === attempt.current) setStarting(false); }
  }
  return <div className="song-player" role="group" aria-label={label}>
    <audio ref={player} preload="metadata" src={src} onError={() => { attempt.current++; setFailed(true); setPlaying(false); setStarting(false); setBuffering(false); }}
      onPlay={() => setPlaying(true)}
      onPlaying={() => { setPlaying(true); setStarting(false); setBuffering(false); }}
      onWaiting={() => { if (!player.current?.paused) setBuffering(true); }}
      onPause={() => { setPlaying(false); setStarting(false); setBuffering(false); }}
      onEnded={() => { setPlaying(false); setStarting(false); setBuffering(false); }}
      onDurationChange={event => {
        const value = event.currentTarget.duration;
        setDuration(Number.isFinite(value) ? value : 0);
      }} onTimeUpdate={event => { setPosition(event.currentTarget.currentTime); onPosition?.(event.currentTarget.currentTime); }}/>
    <div className="actions">
      <button type="button" className="secondary small" onClick={() => playing || starting ? pause() : void play()}>{playing || starting ? <Pause size={15}/> : <Play size={15}/>} {playing || starting ? "Pause" : "Play"}</button>
      <button type="button" className="secondary small" onClick={() => play(true)}><RotateCcw size={14}/> Replay</button>
      {volumeWorks && <label className="player-volume">Volume <input className="volume-slider" type="range" min="0" max="1" step="0.01" value={volume} onChange={event => {
        const value = Number(event.target.value);
        if (player.current) player.current.volume = value;
        setVolume(value);
      }}/></label>}
    </div>
    <div className="song-seek"><span>{time(position)}</span><input type="range" aria-label="Seek" min="0" max={duration || 1} step="0.01" value={Math.min(position, duration)} disabled={!duration} onChange={event => {
      const value = Number(event.target.value);
      if (player.current) player.current.currentTime = value;
      setPosition(value);
    }}/><span>{time(duration)}</span></div>
    {!failed && (buffering || starting) && <p className="muted" role="status">{buffering ? "Buffering audio…" : "Starting audio…"}</p>}
    {failed && <div className="actions"><p className="muted" role="alert">This recording could not play. Try again, or attach an MP3 or PCM WAV that opens on your device.</p>
      <button type="button" className="secondary small" onClick={() => play()}>Retry playback</button></div>}
  </div>;
}

