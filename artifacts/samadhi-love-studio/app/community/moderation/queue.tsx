"use client";

import { useCommunityResource } from "../client";
import { communityApi, songHref, type ModerationData } from "../data";

export function ModerationConsole() {
  const { data, error, notice, update, refresh, busy } = useCommunityResource<ModerationData>(communityApi + "?moderation=1");
  return <main className="listener-shell community-shell">
    <header className="listener-hero community-hero"><p className="eyebrow">OWNER ONLY</p><h1>Community moderation</h1>
      <p>Review encouragement before it appears, and handle reports privately.</p><a href="/community/artist-dashboard">Artist dashboard</a></header>
    {error && <p role="alert" className="notice">{error} <button type="button" className="text-button" onClick={() => void refresh()}>Refresh</button></p>}
    {notice && <p role="status" className="community-notice">{notice}</p>}
    {!data ? !error && <p className="empty">Opening the moderation queue…</p> : <>
      <section className="section community-section"><h2>Comment review</h2>
        {!data.comments.length && <p className="muted">No comments to review.</p>}
        {data.comments.map(item => <article className="community-comment" key={item.id}><p className="eyebrow">{item.status.toUpperCase()} · {item.title}</p><p>{item.body}</p>
          <div className="actions">
            {item.status === "pending" && <button type="button" className="primary small" disabled={busy} onClick={() => void update({ action: "moderate-comment", id: item.id, value: "approved" }, "Comment approved.")}>Approve</button>}
            <button type="button" className="secondary small" disabled={busy} onClick={() => void update({ action: "moderate-comment", id: item.id, value: "hidden" }, "Comment hidden.")}>Hide comment</button>
          </div>
        </article>)}</section>
      <section className="section community-section"><h2>Private reports</h2>
        {!data.reports.length && <p className="muted">No open reports.</p>}
        {data.reports.map(item => <article className="community-comment" key={item.id}><h3>{item.title}</h3>
          <p>{item.comment ? "Comment report" : "Song report"} · {item.reason}</p>
          {item.commentBody && <p className="muted">{item.commentBody}</p>}
          <div className="actions">
            {!item.blocked && <a className="text-button" href={songHref(item.release)}>Open release</a>}
            {item.comment ? item.commentBody && <button className="secondary small" disabled={busy} type="button" onClick={() => void update({ action: "moderate-comment", id: item.comment, value: "hidden" }, "Comment hidden.")}>Hide reported comment</button> :
              !item.blocked && <button className="secondary small" disabled={busy} type="button" onClick={() => void update({ action: "moderate-release", id: item.release, value: true }, "Release hidden from Community.")}>Hide release</button>}
            <button className="text-button" disabled={busy} type="button" onClick={() => void update({ action: "close-report", id: item.id }, "Report closed.")}>Close report</button>
          </div>
        </article>)}</section>
      <section className="section community-section"><h2>Hidden releases</h2>
        {!data.hidden.length && <p className="muted">No releases are hidden by moderation.</p>}
        {data.hidden.map(item => <div className="community-playlist-row" key={item.id}><strong>{item.title}</strong>
          <button type="button" className="secondary small" disabled={busy} onClick={() => void update({ action: "moderate-release", id: item.id, value: false }, "Moderation hold removed.")}>Remove hold</button></div>)}
      </section>
    </>}
  </main>;
}
