"use client";

import { useEffect, useRef, useState } from "react";
import { captionFile, videoThemes } from "./lyric-video-data";
import { assetUrl } from "./lyric-pro-data";
import { pinnedMaster, projectMembers, projectRoot, validReleaseMetadata } from "./project-assets";
import { isExplicitSong } from "./clean-content";
import { rightsUrl, type RightsStatus } from "./rights-data";
import { RecoveryPanel, useDraftRecovery } from "./draft-recovery";
import { songAudioUrl, type Song } from "./studio-data";

export const packageLimit = 200 * 1024 * 1024;
export function packageFileName(value: string) {
  return value.replace(/[\\/:*?"<>|\x00-\x1f]/g, "-").replace(/\.{2,}/g, "-").trim().slice(0, 100) || "SAMADHI LOVE";
}
type PackageFile = { name: string; bytes: Uint8Array };

async function fetchFile(url: string, signal: AbortSignal, allowance: number) {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) throw new Error("A package asset could not load. Check the project's recordings and saved exports.");
  if (Number(response.headers.get("Content-Length")) > allowance) { await response.body.cancel(); throw new Error("The package exceeds 200 MB. Turn off optional videos or alternate recordings and retry."); }
  const chunks: Uint8Array[] = []; let total = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      signal.throwIfAborted(); const part = await reader.read(); if (part.done) break;
      total += part.value.length;
      if (total > allowance) { await reader.cancel(); throw new Error("The package exceeds 200 MB. Turn off optional videos or alternate recordings and retry."); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

async function coverPng(song: Song, signal: AbortSignal) {
  const [{ drawLyricVideo }, { loadCaptionFonts }] = await Promise.all([import("./lyric-video-render"), import("./lyric-caption-templates")]);
  await loadCaptionFonts(); signal.throwIfAborted();
  const project = song.lyricVideo ?? { cues: [], theme: "cosmic" as const, motion: "still" as const, format: "square" as const };
  const src = project.pro?.background ? assetUrl(song.id, project.pro.background) : videoThemes[project.theme].image;
  let image: HTMLImageElement | null = null;
  if (src) {
    image = new Image();
    await new Promise<void>((resolve, reject) => {
      const cancel = () => { image!.src = ""; reject(new DOMException("Canceled", "AbortError")); };
      image!.onload = () => { signal.removeEventListener("abort", cancel); resolve(); };
      image!.onerror = () => { signal.removeEventListener("abort", cancel); reject(new Error("Cover artwork could not load. Review the project's visual design.")); };
      signal.addEventListener("abort", cancel, { once: true }); image!.src = src;
    });
  }
  signal.throwIfAborted();
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 3000;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Cover export is unavailable in this browser.");
  drawLyricVideo(context, 0, { ...project, cues: [], format: "square", motion: "still" }, song.name, image);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Cover export failed.")), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}

export async function zipPackage(files: PackageFile[], signal: AbortSignal) {
  const { zip } = await import("fflate"); signal.throwIfAborted();
  return new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    const cancel = () => { terminate(); reject(new DOMException("Canceled", "AbortError")); };
    const terminate = zip(Object.fromEntries(files.map(f => [f.name, [f.bytes, { level: 0 }]])), { level: 0 }, (error, bytes) => {
      signal.removeEventListener("abort", cancel); if (error) reject(error); else resolve(bytes as Uint8Array<ArrayBuffer>);
    });
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) cancel();
  });
}

export function ReleasePackage({ song, songs, saving, save }: { song: Song; songs: Song[]; saving: boolean; save: (song: Song, message?: string) => Promise<boolean> }) {
  const root = projectRoot(songs, song), master = pinnedMaster(songs, root);
  const media = master?.song.lyricVideo ? master.song : root;
  const [metadata, setMetadata] = useState(root.releaseMetadata ?? { artist: root.lyricVideo?.pro?.artist ?? "SAMADHI LOVE", credits: root.lyricVideo?.pro?.credits ?? "", isrc: "", upc: "", copyright: "" });
  const [videos, setVideos] = useState(false);
  const [originals, setOriginals] = useState(false);
  const [cover, setCover] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null), downloadUrl = useRef("");
  const recovery = useDraftRecovery(`release-metadata:${root.id}`, metadata, setMetadata, JSON.stringify(metadata) !== JSON.stringify(root.releaseMetadata ?? {}));
  useEffect(() => () => { request.current?.abort(); if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current); }, []);
  const members = projectMembers(songs, root).filter(s => !isExplicitSong(s));
  const savedVideos = members.flatMap(member => (member.lyricVideo?.pro?.exports ?? []).filter(e => e.asset).map(e => ({ ...e, songId: member.id }))).sort((a, b) => a.at.localeCompare(b.at));
  async function download() {
    if (busy || !master) return;
    if (!validReleaseMetadata(metadata)) { setError("Use a 12-character ISRC and a 12- or 13-digit UPC, or leave those fields blank."); return; }
    const controller = new AbortController(); request.current = controller; setBusy(true); setError("");
    const files: PackageFile[] = []; let total = 0;
    const text = (name: string, value: string) => { const bytes = new TextEncoder().encode(value); total += bytes.length; files.push({ name, bytes }); };
    const add = async (name: string, url: string) => { setStatus(`Preparing ${name}…`); const bytes = await fetchFile(url, controller.signal, packageLimit - total); total += bytes.length; files.push({ name, bytes }); };
    try {
      // Save credits first so the account and the downloaded package agree.
      if (!await save({ ...root, releaseMetadata: metadata }, "Release metadata saved")) throw new Error("Save the release metadata before preparing this package.");
      await recovery.clear(); controller.signal.throwIfAborted();
      const members = projectMembers(songs, root).filter(s => !isExplicitSong(s));
      text("release-metadata.json", JSON.stringify({ title: root.name, ...metadata, releaseDate: root.releaseDate || null, links: root.releaseLinks, finalMaster: root.master, preparedAt: new Date().toISOString() }, null, 2));
      const rightsResponse = await fetch(rightsUrl(master.song.id, master.audioId), { signal: controller.signal });
      if (!rightsResponse.ok) throw new Error("Rights notes could not load for the selected master. Retry before packaging.");
      const rights = await rightsResponse.json() as RightsStatus;
      text("rights-review.json", JSON.stringify({ recordingVersion: master.audioId, declaration: rights.review, excerptChecks: rights.checks, historyTruncated: rights.truncated ?? false, notice: "User declarations and catalog matches are not copyright clearance. No match means unknown. Composition, lyrics, samples, and voice permissions require separate review." }, null, 2));
      text("lyrics.txt", (master.song.generation?.audioId === master.audioId ? master.song.generation.approvedLyrics : master.song.notes.lyrics) || root.notes.lyrics || "No approved lyrics have been saved.\n");
      text("credits.txt", [`${root.name} — ${metadata.artist}`, metadata.credits, metadata.copyright, metadata.isrc && `ISRC: ${metadata.isrc}`, metadata.upc && `UPC: ${metadata.upc}`].filter(Boolean).join("\n\n"));
      text("project.json", JSON.stringify({ schemaVersion: 1, projectId: root.id, songs: members }, null, 2));
      text("promotion.txt", [root.notes.promotion, root.releaseLinks?.spotify, root.releaseLinks?.hyperfollow].filter(Boolean).join("\n\n"));
      text("README.txt", "SAMADHI LOVE release package\n\nReview all files, credits, and permissions before distribution. rights-review.json contains user declarations and any excerpt checks, not a license or copyright clearance. Identifiers left blank have not been issued by this Studio.\nmaster/ contains your explicitly selected recording version.\ncover.png, when included, is rendered from the project's current visual design; review it before use.\nCaptions retain the lyric-video project's source timing, which may differ from the chosen master.\nproject.json preserves project relationships and notes; this is not a full backup of every original, vocal session, or historical recording. Originals remain in your account.\nUpload and schedule the release with your chosen distributor. No publication or submission was performed.\n");
      await add(`master/${packageFileName(root.name)}.${master.format}`, master.url);
      if (originals) for (const item of members.filter(s => s.audioFormat && !(s.id === master.song.id && (s.audioId ?? s.id) === master.audioId)))
        await add(`recordings/${packageFileName(item.name)}-${item.id}.${item.audioFormat}`, songAudioUrl(item.id, item.audioId));
      if (cover) { setStatus("Rendering 3000 × 3000 cover…"); const bytes = await coverPng({ ...media, name: root.name }, controller.signal); total += bytes.length; if (total > packageLimit) throw new Error("Package exceeds 200 MB. Turn off optional assets and retry."); files.push({ name: "cover.png", bytes }); }
      if (media.lyricVideo?.cues.length) {
        const end = media.lyricVideo.pro?.duration ?? Math.max(...media.lyricVideo.cues.map(c => c.end ?? c.time + 5));
        for (const format of ["srt", "vtt"] as const) text(`captions/lyrics.${format}`, captionFile(media.lyricVideo.cues, 0, end, format));
        text("captions/project.json", JSON.stringify(media.lyricVideo, null, 2));
      }
      if (videos) for (const format of ["vertical", "wide", "square"] as const) {
        const item = savedVideos.filter(v => v.format === format).at(-1);
        if (item?.asset) await add(`video/${format}.${item.extension}`, assetUrl(item.songId, item.asset));
      }
      if (total > packageLimit) throw new Error("Package exceeds 200 MB. Turn off optional assets and retry.");
      text("manifest.json", JSON.stringify(files.map(f => ({ name: f.name, bytes: f.bytes.length })), null, 2));
      setStatus("Packing release files…"); const bytes = await zipPackage(files, controller.signal); controller.signal.throwIfAborted();
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
      downloadUrl.current = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
      const link = document.createElement("a"); link.href = downloadUrl.current; link.download = `${packageFileName(root.name)} - release.zip`; link.click();
      setStatus(`Release package ready: ${files.length} files. Review the artwork, credits, and captions before submitting.`);
    } catch (e) { if (controller.signal.aborted) setStatus("Package canceled. Saved projects and original files are preserved."); else { setError(e instanceof Error ? e.message : "Package could not finish."); setStatus(""); } }
    finally { request.current = null; setBusy(false); }
  }
  return <section className="panel form-panel release-package"><h2>Release package · {root.name}</h2><RecoveryPanel recovery={recovery}/>
    <p className="muted">Bundle your pinned master, lyrics, credits, promotional text, artwork, and saved captions. Optional video and recording files share a 200 MB package limit.</p>
    <fieldset disabled={busy || saving}>
      <div className="field-grid">{([['artist', 'Artist'], ['isrc', 'ISRC (optional)'], ['upc', 'UPC (optional)'], ['copyright', 'Copyright (optional)']] as const).map(([key, label]) => <label key={key} className="field">{label}<input maxLength={200} value={metadata[key]} onChange={e => setMetadata({ ...metadata, [key]: key === "isrc" ? e.target.value.toUpperCase().replace(/[-\s]/g, "") : e.target.value })}/></label>)}</div>
      <label className="field">Credits<textarea rows={3} maxLength={4000} value={metadata.credits} onChange={e => setMetadata({ ...metadata, credits: e.target.value })}/></label>
      <div className="actions"><label className="checkline"><input type="checkbox" checked={cover} onChange={e => setCover(e.target.checked)}/> Include cover PNG</label>
        <label className="checkline"><input type="checkbox" checked={videos} onChange={e => setVideos(e.target.checked)}/> Include latest saved videos</label>
        <label className="checkline"><input type="checkbox" checked={originals} onChange={e => setOriginals(e.target.checked)}/> Include current project recordings</label></div>
      <button type="button" className="secondary" disabled={!recovery.ready} onClick={async () => { if (!validReleaseMetadata(metadata)) { setError("Check ISRC and UPC, or leave them blank."); return; } if (await save({ ...root, releaseMetadata: metadata }, "Release credits saved")) await recovery.clear(); }}>Save release credits</button>
      <button type="button" className="primary" disabled={!master || !recovery.ready} onClick={() => void download()}>Download release package</button>
    </fieldset>
    {master && media.lyricVideo?.pro?.sourceAudioId && media.lyricVideo.pro.sourceAudioId !== master.audioId && <p className="notice">The saved captions use a different recording version from your selected master. Review their synchronization before distribution.</p>}
    {!master && <p className="notice">Choose a final master in Mix Lab to enable this download.</p>}
    {busy && <button type="button" className="secondary" onClick={() => request.current?.abort()}>Cancel package</button>}
    {status && <p role="status">{status}</p>}{error && <p className="notice" role="alert">{error}</p>}
  </section>;
}
