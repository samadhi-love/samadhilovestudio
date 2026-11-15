"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { isExplicitSong } from "./clean-content";
import { AudioFormatDownload } from "./audio-format-download";
import { audioTypes, songAudioUrl, type Song } from "./studio-data";

export function AudioActions({ song }: { song: Song }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  if (!song.audioFormat || isExplicitSong(song)) return null;
  const format = song.audioFormat;
  const filename = (song.name.replace(/[\\/:*?"<>|]/g, "_").trim() || "Samadhi Love") + "." + format;
  const url = songAudioUrl(song.id, song.audioId);
  async function share() {
    setBusy(true); setStatus("");
    try {
      if (!navigator.share || !navigator.canShare) {
        setStatus("Download the audio to share it from this device.");
        return;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      const file = new File([await response.blob()], filename, { type: audioTypes[format] });
      if (navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: song.name });
      else setStatus("Download the audio to share it from this device.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setStatus("Download the audio to share it from this device.");
    } finally { setBusy(false); }
  }
  return <>
    <div className="actions">
      <a className="secondary small" href={url} download={filename}><Download size={15}/> Download audio</a>
      <button type="button" className="secondary small" disabled={busy} onClick={share}><Share2 size={15}/> Share audio</button>
    </div>
    <AudioFormatDownload key={song.audioId ?? song.id} url={url} title={song.name} sourceKey={song.id + ":" + (song.audioId ?? "original")}/>
    {status && <p className="muted" role="status">{status}</p>}
  </>;
}
