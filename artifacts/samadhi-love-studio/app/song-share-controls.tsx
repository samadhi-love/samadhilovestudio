"use client";
import { useEffect, useState } from "react";
import { communityRequest } from "./community/client";
export function SongShareControls({ songId, title, disabled = false }: { songId: string; title: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false), [path, setPath] = useState<string | null>(null), [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false), [confirmed, setConfirmed] = useState(false), [notice, setNotice] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setReady(false);
    communityRequest<{ path: string | null }>("/api/song-share?song=" + encodeURIComponent(songId), undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) { setPath(data.path); setReady(true); } })
      .catch(() => { if (!controller.signal.aborted) setNotice("Sharing status could not load. Close and reopen this panel to retry."); });
    return () => controller.abort();
  }, [open, songId]);
  const url = path && typeof window !== "undefined" ? new URL(path, window.location.origin).href : "";
  async function change(action: "create" | "revoke") {
    if (busy || disabled) return;
    setBusy(true); setNotice("");
    try {
      const data = await communityRequest<{ path: string | null }>("/api/song-share", { action, songId, confirmedRights: confirmed });
      setPath(data.path); setNotice(action === "create" ? "Listening link created. This does not publish the song." : "Listening link revoked.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Sharing could not save."); }
    finally { setBusy(false); }
  }
  return <div className="song-share-controls"><button type="button" className="secondary small" aria-expanded={open} onClick={() => setOpen(!open)}>Share listening link</button>
    {open && <div className="song-share-panel"><p>Anyone with this link can listen without signing in. It stays out of discovery. You can revoke it here. Replacing audio or deleting the song invalidates the link.</p>
      {!ready ? <p role="status">{notice || "Checking sharing…"}</p> : path ? <>
        <label>Listening link<input readOnly value={url} onFocus={event => event.target.select()}/></label><div className="actions">
          <button type="button" className="secondary small" onClick={async () => { try { await navigator.clipboard.writeText(url); setNotice("Link copied."); } catch { setNotice("Select and copy the link above."); } }}>Copy link</button>
          {typeof navigator.share === "function" && <button type="button" className="secondary small" onClick={async () => { try { await navigator.share({ title, url }); } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setNotice("Use Copy link instead."); } }}>Send / device share</button>}
          <a className="secondary small" href={"mailto:?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(url)}>Email link</a>
          <a className="secondary small" href={"https://wa.me/?text=" + encodeURIComponent(title + " " + url)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a className="secondary small" href={"https://twitter.com/intent/tweet?text=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(url)} target="_blank" rel="noopener noreferrer">Share to X</a>
          <button type="button" className="secondary small" disabled={busy || disabled} onClick={() => void change("revoke")}>Revoke link</button>
        </div></> : <><label><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/> I have permission to share this recording.</label><button type="button" className="secondary small" disabled={!confirmed || busy || disabled} onClick={() => void change("create")}>Create listening link</button></>}
      {ready && notice && <p role="status">{notice}</p>}
      <details><summary>Upload to your social account</summary><p>Use Download below to save the audio or finished video, then upload it from your own social account. These buttons open upload pages; they do not post automatically.</p><div className="actions"><a href="https://www.youtube.com/upload" target="_blank" rel="noopener noreferrer">YouTube upload</a><a href="https://www.tiktok.com/upload" target="_blank" rel="noopener noreferrer">TikTok upload</a><a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Open Instagram</a></div></details>
    </div>}
  </div>;
}
