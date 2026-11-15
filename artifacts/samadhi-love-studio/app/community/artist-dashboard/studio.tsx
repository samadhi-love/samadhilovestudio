"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, Heart, Share2, Users } from "lucide-react";
import { HelpField } from "../../help-tip";
import { useCommunityResource } from "../client";
import { artistHref, communityApi, reactions, songHref, type ArtistDashboard, type Reaction } from "../data";

type DashboardSong = ArtistDashboard["songs"][number];
type Resource = ReturnType<typeof useCommunityResource<ArtistDashboard>>;
const total = (stats: DashboardSong["stats"]) => stats ? Object.values(stats.reactions).reduce((sum, count) => sum + count, 0) : 0;

export function ArtistConsole({ studioHref, moderator, selectedRecording }: { studioHref: string; moderator: boolean; selectedRecording?: string }) {
  const resource = useCommunityResource<ArtistDashboard>(communityApi + "?dashboard=1");
  const { data, error, notice, refresh } = resource;
  const recordings = data?.songs ?? [];
  const selected = recordings.find(song => song.songId === selectedRecording);
  const ordered = selected ? [selected, ...recordings.filter(song => song !== selected)] : recordings;
  const listens = data?.songs.reduce((sum, song) => sum + (song.stats?.listens ?? 0), 0) ?? 0;
  const shares = data?.songs.reduce((sum, song) => sum + (song.stats?.shares ?? 0), 0) ?? 0;
  const appreciation = data?.songs.reduce((sum, song) => sum + total(song.stats), 0) ?? 0;
  return <main className="listener-shell community-shell">
    <header className="listener-nav"><a className="brand" href="/community"><img src="/favicon.svg" alt=""/><div><strong>SAMADHI LOVE</strong><small>COMMUNITY</small></div></a>
      <div className="actions"><a className="secondary small" href={studioHref}>Studio</a><a className="secondary small" href="/community">Discover music</a>
      {moderator && <a className="secondary small" href="/community/moderation">Moderation</a>}</div></header>
    <section className="listener-hero community-hero"><p className="eyebrow">PRIVATE ARTIST WORKSPACE</p><h1>Artist dashboard</h1>
      <p>Choose what to publish and see how listeners respond to your music.</p></section>
    {error && <p className="notice" role="alert">{error} <button type="button" className="text-button" onClick={() => void refresh()}>Refresh</button></p>}
    {notice && <p className="community-notice" role="status">{notice}</p>}
    {!data ? !error && <p className="empty">Opening your artist dashboard…</p> : <>
      <section className="community-stat-grid" aria-label="Private artist statistics">
        {([{ label: "Qualified listens", value: listens, icon: AudioLines }, { label: "Current followers", value: data.followers, icon: Users },
          { label: "Positive reactions", value: appreciation, icon: Heart }, { label: "Listeners from shares", value: shares, icon: Share2 }]).map(({ label, value, icon: Icon }) =>
            <article className="section community-stat" key={label}><Icon size={19}/><strong>{value.toLocaleString()}</strong><span>{label}</span></article>)}
      </section>
      <p className="muted">These totals cover your Community releases. Share totals add up distinct attributed listeners per song.</p>
      <ArtistProfile key={data.profile?.id ?? "new"} profile={data.profile} resource={resource}/>
      <section className="community-section"><h2>Your recordings</h2><p className="muted">Publishing shares the selected recording in Community with people who can access this site. Private notes, lyrics, mixes, and drafts stay in your workspace.</p>
        {ordered.length ? ordered.map(song => <div key={song.songId}><a className="secondary small" href={`${studioHref}?studio=songs&song=${encodeURIComponent(song.songId)}`}>Open Song actions in My Songs</a><ReleaseEditor song={song} focused={song === selected} hasProfile={!!data.profile} resource={resource}/></div>) :
          <p className="empty">Save a clean song with audio in Song Library to publish it here.</p>}
      </section>
    </>}
  </main>;
}

function ArtistProfile({ profile, resource }: { profile: ArtistDashboard["profile"]; resource: Resource }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  return <form className="section community-section" onSubmit={event => {
    event.preventDefault(); void resource.update({ action: "profile", name, bio }, "Artist profile saved.");
  }}>
    <h2>Artist profile</h2>
    <HelpField label="Artist name" tip="This public display name appears beside your releases."><input required maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="Your artist name"/></HelpField>
    <HelpField label="Short bio" tip="Say a little about the music you make. Leave out contact information."><textarea rows={3} maxLength={280} value={bio} onChange={event => setBio(event.target.value)}/></HelpField>
    <div className="actions"><button className="primary small" disabled={resource.busy || !name.trim()}>Save artist profile</button>
      {profile && resource.data?.songs.some(song => song.status === "Published") && <a className="secondary small" href={artistHref(profile.id)}>View artist profile</a>}</div>
  </form>;
}

function ReleaseEditor({ song, hasProfile, resource, focused }: { song: DashboardSong; hasProfile: boolean; resource: Resource; focused: boolean }) {
  const [edit, setEdit] = useState(focused && hasProfile && song.available && song.status !== "Published" && song.status !== "Hidden by moderator");
  const card = useRef<HTMLElement>(null);
  useEffect(() => { if (focused && hasProfile) card.current?.scrollIntoView({ block: "start" }); }, [focused, hasProfile]);
  const [inspirational, setInspirational] = useState(song.inspirational ?? false);
  const [comments, setComments] = useState(song.comments ?? false);
  const [confirmedClean, setConfirmedClean] = useState(false);
  const published = song.status === "Published";
  const blocked = song.status === "Hidden by moderator";
  return <article ref={card} className="section community-section community-song-editor">
    <div className="community-song-header"><div><p className="eyebrow">{song.status.toUpperCase()}</p><h3>{song.title}</h3></div>
      {song.releaseId && published && <a className="secondary small" href={songHref(song.releaseId)}>Open &amp; share release</a>}</div>
    {song.stats && <div className="actions community-track-stats">
      <span>{song.stats.listens.toLocaleString()} listens</span><span>{song.stats.shares.toLocaleString()} from shares</span>
      {(Object.keys(reactions) as Reaction[]).map(item => <span key={item}>{reactions[item]} {song.stats!.reactions[item].toLocaleString()}</span>)}
    </div>}
    {song.status === "Review required" && <p className="muted">The recording changed or is unavailable. Review the current song before republishing.</p>}
    <div className="actions">
      {song.available && !blocked && <button className="secondary small" type="button" aria-expanded={edit} disabled={resource.busy || !hasProfile}
        onClick={() => { setEdit(!edit); setConfirmedClean(false); }}>{edit ? "Cancel" : published ? "Edit release" : "Publish to Community"}</button>}
      {(published || song.status === "Review required") && <button type="button" className="text-button" disabled={resource.busy} onClick={async () => {
        if (confirm("Unlist this release from Community?") && await resource.update({ action: "unlist", id: song.songId }, "Release unlisted. Your studio recording is saved.")) setEdit(false);
      }}>Unlist release</button>}
    </div>
    {edit && <form className="community-release-settings" onSubmit={async event => {
      event.preventDefault();
      if (await resource.update({ action: "publish", id: song.songId, inspirational, comments, confirmedClean }, published ? "Release settings saved." : "Release published.")) {
        setEdit(false); setConfirmedClean(false);
      }
    }}>
      <label><input type="checkbox" checked={inspirational} onChange={event => setInspirational(event.target.checked)}/> Include in Inspirational Music</label>
      <label><input type="checkbox" checked={comments} onChange={event => setComments(event.target.checked)}/> Allow moderated encouraging comments</label>
      <label><input type="checkbox" required checked={confirmedClean} onChange={event => setConfirmedClean(event.target.checked)}/> I confirm the recording is family-friendly and I have permission to share it.</label>
      <button className="primary small" disabled={resource.busy || !confirmedClean}>{published ? "Save release settings" : "Publish recording"}</button>
    </form>}
  </article>;
}
