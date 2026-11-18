"use client";

import {brand} from "../brand";
import {GenrePicker} from "../genre-picker";
import { useState } from "react";
import { ArrowLeft, Bookmark, Disc3, Flag, Heart, ListMusic, Search, Share2, Sparkles, Star } from "lucide-react";
import "../explore-cosmos.css";
import { HelpField } from "../help-tip";
import { communityRequest, useCommunityResource } from "./client";
import { artistHref, communityApi, discoveryCategories, reportReasons, songHref, type CommunityData, type DiscoveryCategory, type Reaction, type Release } from "./data";
import { PartySpotlight } from "../party/spotlight";
import { CommunityPlayer } from "./player";

const number = (value: number) => value.toLocaleString();
const countLabel = (count: number, single: string) => number(count) + " " + single + (count === 1 ? "" : "s");
/** Display-only labels: request keys and API reaction IDs stay unchanged. */
const categoryLabel: Record<DiscoveryCategory, string> = {
  "Most Loved": "Warmly received", "Trending Songs": "Heard this week", "New Releases": "New in the sky", "Hidden Gems": "Quiet stars", "Inspirational Music": "Uplifting",
};
const reactionOrder: Reaction[] = ["like", "love", "inspired"];
const reactionView: Record<Reaction, [string, typeof Heart]> = { like: ["Felt this", Sparkles], love: ["Love", Heart], inspired: ["Inspired", Star] };
const roomText: Record<DiscoveryCategory, [string, string]> = {
  "Most Loved": ["Songs listeners have been sending love to.", "Songs appear here as listeners send their first Loves."],
  "Trending Songs": ["Songs people have been listening to over the last seven days.", "Songs appear here as people listen this week."],
  "New Releases": ["Fresh music from across the community.", "The first releases will appear here."],
  "Hidden Gems": ["A daily rotation that gives quieter releases and newer artists more room.", "There are no releases to spotlight yet."],
  "Inspirational Music": ["Uplifting releases selected by their artists.", "There are no inspirational releases yet."],
};

function CommunityArt({ art = 0,cover }: { art?: number;cover?:string }) {
  if(cover)return <img className="community-art" src={cover} alt="Song cover" loading="lazy"/>;
  return <div className={`community-art community-art-${Math.abs(art) % 4}`} aria-hidden="true"><Disc3 size={34}/></div>;
}

function ReleaseCard({ release }: { release: Release }) {
  return <article className="community-card section">
    <CommunityArt art={release.art} cover={release.cover}/>
    <div>
      <a className="community-track" href={songHref(release.id)}>{release.title}</a>
      <a className="muted community-artist" href={artistHref(release.artist.id)}>{release.artist.name}</a>
    </div>
    {release.instruments&&<p className="muted">{release.instruments}</p>}<div className="chips">{release.tags.slice(0,3).map(tag=><span className="chip" key={tag}>{tag}</span>)}</div><a className="secondary small" href={songHref(release.id)}>Listen</a>
  </article>;
}

export function Community({ songId, artistId, shareRef, signIn, signOut, studioLink, initialTab }: {
  songId: string | null; artistId: string | null; shareRef?: string; signIn: string; signOut?: string; studioLink?: string;
  /** Optional presentation-only starting section (used by Explore's Following tab). */
  initialTab?: "discover" | "following";
}) {
  const [genre,setGenre]=useState("");
  const [catalogPage, setCatalogPage] = useState(1), [search, setSearch] = useState(""), [searchDraft, setSearchDraft] = useState("");
  const endpoint = communityApi + (songId ? "?song=" + encodeURIComponent(songId) : artistId ? "?artist=" + encodeURIComponent(artistId) : "?page=" + catalogPage + "&search=" + encodeURIComponent(search)+"&genre="+encodeURIComponent(genre));
  const resource = useCommunityResource<CommunityData>(endpoint);
  const { data, error, notice, refresh, update, busy } = resource;
  const [tab, setTab] = useState<"Discover" | "Saved & playlists" | "Following">(initialTab === "following" ? "Following" : "Discover");
  const [category, setCategory] = useState<DiscoveryCategory>("New Releases");
  const [playlist, setPlaylist] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const ownArtist = (id: string) => !!data?.releases.some(release => release.artist.id === id && data.own.includes(release.id));
  const follow = (id: string) => {
    const following = data?.following.includes(id);
    return update({ action: "follow", id, value: !following }, following ? "Artist unfollowed." : "Artist followed.");
  };
  const list = data?.playlists.find(item => item.id === playlist);
  const byId = new Map(data?.releases.map(release => [release.id, release]));
  const discovery = (data?.sections[category] ?? []).flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  const saved = (list?.songs ?? data?.saved ?? []).flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  const following = data?.releases.filter(release => data.following.includes(release.artist.id)) ?? [];

  return <main className={`listener-shell community-shell${!songId&&!artistId?" community-space":""}`}>
    <header className="listener-nav">
      <a className="brand" href="/community"><img src="/favicon.svg" alt=""/><div><strong>{brand.name}</strong><small>DISCOVER</small></div></a>
      <div className="actions">
        <a className="secondary small" href="/plans">Plans</a><a className="secondary small" href={signOut ? "/members" : "/login"}>{signOut ? "My membership" : "Member login"}</a>
        <a className="secondary small" href="/subscriber">Listening Room</a>
        {!studioLink && <a className="secondary small" href="/creator">Create music / My Studio</a>}
        {studioLink && <><a className="secondary small" href={studioLink}>My Studio</a><a className="secondary small" href="/community/artist-dashboard">Artist dashboard</a></>}
        {signOut ? <a className="text-button" href={signOut} target="_top">Sign out</a> : <a className="primary small" href={signIn} target="_top">Sign in</a>}
      </div>
    </header>
    {songId || artistId ? <a className="text-button community-back" href="/community"><ArrowLeft size={15}/> Back to discovery</a> :
      <section className="listener-hero community-hero">
        <span className="eyebrow"><Sparkles size={15}/> THE GALAXY MAP</span>
        <h1>Explore</h1>
        <p className="galaxy-poem">Music shared by the community. Only kind reactions — no rankings, no noise.</p>
        <p>Listen to published songs from our creators—no account needed. Create your own music and lyric videos in My Studio.</p><p className="muted">Publishing is always your choice. Private projects and unlisted links stay out of this public feed.</p>
      </section>}
    {error && <p role="alert" className="notice">{error} <button className="text-button" type="button" onClick={() => void refresh()}>Refresh</button></p>}
    {notice && <p className="community-notice" role="status">{notice}</p>}
    {!data ? !error && <p role="status" className="empty">Opening Community…</p> :
      songId ? data.featured ? <ReleaseDetail key={data.featured.id} release={data.featured} data={data} resource={resource} shareRef={shareRef} signIn={signIn}/> :
        <div className="empty">This release is unavailable.</div> :
      artistId ? data.artist ? <>
        <section className="section community-profile"><CommunityArt/><div><p className="eyebrow">ARTIST PROFILE</p><h1>{data.artist.name}</h1>
          {data.artist.bio && <p>{data.artist.bio}</p>}
          <p className="muted">{countLabel(data.artist.releases.length, "published song")}</p>
          {!ownArtist(artistId) && (data.canEngage ? <button type="button" className="primary small" aria-pressed={data.following.includes(artistId)} disabled={busy} onClick={() => void follow(artistId)}>{data.following.includes(artistId) ? "Following · Unfollow" : "Follow Artist"}</button> :
            <a className="primary small" href={signIn} target="_top">Sign in to follow</a>)}</div></section>
        <section className="community-section"><h2>Releases</h2><div className="community-grid">{data.artist.releases.map(release => <ReleaseCard key={release.id} release={release}/>)}</div></section>
      </> : <div className="empty">This artist profile is unavailable.</div> : <>
        <PartySpotlight/>
        <nav className="community-tabs" aria-label="Community sections">{(["Discover", "Saved & playlists", "Following"] as const).map(item =>
          <button type="button" className="chip" aria-pressed={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
        {tab === "Discover" ? <section className="community-section" aria-labelledby="discovery-heading">
          <GenrePicker label="Browse by genre or style" value={genre?[genre]:[]} single allowCustom={false} change={next=>{setGenre(next[0]??"");setCatalogPage(1);}}/>
          {(genre||search)&&<button type="button" className="text-button" onClick={()=>{setGenre("");setSearch("");setSearchDraft("");setCatalogPage(1);}}>Clear filters · all published songs</button>}
          {!genre&&!search&&<><div className="chips community-categories" aria-label="Discovery categories">{discoveryCategories.map(item => <button type="button" className={`chip ${category === item ? "active" : ""}`} aria-pressed={category === item} key={item} onClick={() => setCategory(item)}>{categoryLabel[item]}</button>)}</div>
          <div><h2 id="discovery-heading">{categoryLabel[category]}</h2><p className="muted">{roomText[category][0]}</p></div>
          {discovery.length ? <div className="community-grid">{discovery.map(release => <ReleaseCard key={release.id} release={release}/>)}</div> : <p className="empty">{roomText[category][1]}</p>}
          {!!data.artists?.length && <section className="community-section"><h2>Published artists</h2><p className="muted">Each artist’s public page gathers their published songs. Private recordings stay in their own Studio.</p><div className="community-grid">{data.artists.map(artist => <article className="community-card section" key={artist.id}><CommunityArt art={artist.art} cover={artist.coverRelease?"/api/community?cover="+encodeURIComponent(artist.coverRelease):undefined}/><div><a className="community-track" href={artistHref(artist.id)}>{artist.name}</a><p className="muted">{countLabel(artist.songs, "published song")}</p>{!ownArtist(artist.id)&&(data.canEngage?<button type="button" className="secondary small" disabled={busy} aria-pressed={data.following.includes(artist.id)} onClick={()=>void follow(artist.id)}>{data.following.includes(artist.id)?"Following · Unfollow":"Follow artist"}</button>:<a className="secondary small" href={signIn} target="_top">Sign in to follow</a>)}</div></article>)}</div></section>}
          </>}
          {data.catalog && <section className="community-section"><h2>{genre?genre+" · published songs":"All published songs"}</h2><form className="music-inline" onSubmit={event => { event.preventDefault(); setCatalogPage(1); setSearch(searchDraft.trim()); }}><label className="galaxy-search"><span className="sr-only">Search artists, songs, styles</span><Search size={16} aria-hidden="true"/><input type="search" aria-label="Search artists, songs, styles" placeholder="Search artists, songs, styles" value={searchDraft} maxLength={80} onChange={event => setSearchDraft(event.target.value)}/></label><button type="submit" className="secondary small">Search</button></form><div className="community-grid">{data.catalog.releases.map(release => <ReleaseCard key={release.id} release={release}/>)}</div><div className="actions"><button type="button" className="secondary small" disabled={data.catalog.page <= 1} onClick={() => setCatalogPage(Math.max(1, data.catalog!.page - 1))}>Previous</button><span>Page {data.catalog.page} of {data.catalog.pages}</span><button type="button" className="secondary small" disabled={data.catalog.page >= data.catalog.pages} onClick={() => setCatalogPage(data.catalog!.page + 1)}>Next</button></div></section>}
          {category === "Hidden Gems" && <p className="muted">Discovery limits each artist to two spots per category and rotates lesser-heard songs daily.</p>}
        </section> : !data.canEngage ? <p className="empty"><a href={signIn} target="_top">Sign in</a> to save music, build playlists, and follow artists.</p> :
          tab === "Saved & playlists" ? <section className="community-section">
            <h2>Saved &amp; playlists</h2>
            <form className="music-inline" onSubmit={async event => {
              event.preventDefault();
              if (await update({ action: "create-playlist", value: playlistName }, "Playlist created.")) setPlaylistName("");
            }}><HelpField label="New playlist name" tip="Only you can see this playlist. Add tracks from a release page."><input required value={playlistName} maxLength={60} onChange={event => setPlaylistName(event.target.value)} placeholder="e.g. Songs for first light"/></HelpField>
              <button className="secondary small" disabled={busy || !playlistName.trim()}>Create playlist</button>
            </form>
            <div className="music-fields"><HelpField label="Your music" tip="Switch between songs you saved and your personal playlists."><select value={playlist} onChange={event => setPlaylist(event.target.value)}>
              <option value="">Saved songs</option>{data.playlists.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></HelpField>
              {list && <button type="button" className="text-button" disabled={busy} onClick={async () => {
                if (confirm(`Delete your playlist “${list.name}”?`) && await update({ action: "remove-playlist", id: list.id }, "Playlist deleted.")) setPlaylist("");
              }}>Delete playlist</button>}</div>
            {saved.length ? <div className="community-grid">{saved.map(release => <div key={release.id}><ReleaseCard release={release}/>
              <button type="button" className="text-button" disabled={busy} onClick={() => void update(list ? { action: "playlist", id: release.id, playlist: list.id, value: false } : { action: "save", id: release.id, value: false }, "Song removed.")}>{list ? "Remove from playlist" : "Remove saved song"}</button></div>)}</div> :
              <p className="empty">{list ? "Open a release and choose Add to Playlist to fill this collection." : "Open a release and select Save Song to keep it here."}</p>}
          </section> : <section className="community-section"><h2>From artists you follow</h2>
            {following.length ? <div className="community-grid">{following.map(release => <ReleaseCard key={release.id} release={release}/>)}</div> :
              <p className="empty">Follow artists from their profiles or songs to see their releases here.</p>}
          </section>}
      </>}
  </main>;
}

function ReleaseDetail({ release, data, resource, shareRef, signIn }: {
  release: Release; data: CommunityData; resource: ReturnType<typeof useCommunityResource<CommunityData>>; shareRef?: string; signIn: string;
}) {
  const { busy, update, refresh, setError, setNotice } = resource;
  const own = data.own.includes(release.id);
  const following = data.following.includes(release.artist.id);
  const saved = data.saved.includes(release.id);
  const reaction = data.reactionBySong[release.id];
  const [report, setReport] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [share, setShare] = useState("");
  const [sharing, setSharing] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  async function openShare() {
    if (share) { setShare(""); return; }
    setSharing(true); setError("");
    try {
      const url = new URL(songHref(release.id), window.location.origin);
      if (data.canEngage) {
        const result = await communityRequest<{ ref: string }>(communityApi, { action: "share", id: release.id });
        if (result.ref) url.searchParams.set("ref", result.ref);
      }
      setShare(url.toString());
    } catch (error) { setError(error instanceof Error ? error.message : "The link could not be prepared."); }
    finally { setSharing(false); }
  }

  return <>
    <section className="section community-profile community-release">
      <CommunityArt art={release.art} cover={release.cover}/>
      <div className="community-release-copy">
        <p className="eyebrow">{release.inspirational ? "INSPIRATIONAL RELEASE" : "COMMUNITY RELEASE"}</p>
        <h1>{release.title}</h1>
        <a className="community-artist" href={artistHref(release.artist.id)}>{release.artist.name}</a>
        <p className="muted">{new Date(release.releasedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>
        {!!release.tags.length && <div className="chips">{[...new Set(release.tags)].map(tag => <span className="chip" key={tag}>{tag}</span>)}</div>}
        <CommunityPlayer key={release.id} song={release} countable={!own} shareRef={shareRef} refresh={refresh}/>
        <div className="community-reactions actions" aria-label="Song appreciation">
          {reactionOrder.map(item => <button className="chip" type="button" key={item}
            aria-pressed={reaction === item} disabled={!data.canEngage || own || busy} onClick={() => void update({ action: "reaction", id: release.id, value: reaction === item ? null : item })}>
            {(() => { const [label, Icon] = reactionView[item]; return <><Icon size={14} aria-hidden="true"/> {label}</>; })()}
          </button>)}
        </div>
        <div className="actions community-track-actions">
          {data.canEngage && !own && <button type="button" className="secondary small" disabled={busy} aria-pressed={following} onClick={() => void update({ action: "follow", id: release.artist.id, value: !following }, following ? "Artist unfollowed." : "Artist followed.")}>{following ? "Following · Unfollow" : "Follow Artist"}</button>}
          {data.canEngage && <button type="button" className="secondary small" disabled={busy} aria-pressed={saved} onClick={() => void update({ action: "save", id: release.id, value: !saved }, saved ? "Song removed from Saved." : "Song saved.")}><Bookmark size={15}/> {saved ? "Saved · Remove" : "Save Song"}</button>}
          <button type="button" className="secondary small" disabled={sharing} aria-expanded={!!share} onClick={() => void openShare()}><Share2 size={15}/> {sharing ? "Preparing…" : "Share Song"}</button>
          {data.canEngage && <button type="button" className="secondary small" aria-expanded={playlistOpen} onClick={() => setPlaylistOpen(!playlistOpen)}><ListMusic size={15}/> Add to Playlist</button>}
        </div>
        {!data.canEngage && <p className="muted"><a href={signIn} target="_top">Sign in</a> to react, follow, and save songs.</p>}
      </div>
    </section>
    {share && <section className="section community-section"><h2>Share this release</h2><p className="muted">Send this link to anyone you think would feel it.</p>
      <HelpField label="Song link" tip="Copy this link to share this release with anyone."><input readOnly value={share} onFocus={event => event.target.select()}/></HelpField>
      <div className="actions">
        <button type="button" className="secondary small" onClick={async () => {
          try { await navigator.clipboard.writeText(share); setNotice("Song link copied."); } catch { setNotice("Select and copy the song link above."); }
        }}>Copy link</button>
        {typeof navigator.share === "function" && <button type="button" className="secondary small" onClick={async () => {
          try { await navigator.share({ title: release.title, url: share }); } catch (error) {
            if (!(error instanceof DOMException) || error.name !== "AbortError") setNotice("You can copy the song link above.");
          }
        }}>Share link</button>}
      </div></section>}
    {playlistOpen && <section className="section community-section"><h2>Add to one of your playlists</h2>
      {data.playlists.map(playlist => <div className="community-playlist-row" key={playlist.id}><strong>{playlist.name}</strong>
        <button type="button" className="secondary small" disabled={busy} aria-pressed={playlist.songs.includes(release.id)} onClick={() => {
          const added = playlist.songs.includes(release.id);
          void update({ action: "playlist", id: release.id, playlist: playlist.id, value: !added }, added ? "Removed from playlist." : "Added to playlist.");
        }}>{playlist.songs.includes(release.id) ? "Added · Remove" : "Add song"}</button></div>)}
      <form className="music-inline" onSubmit={async event => {
        event.preventDefault();
        if (await update({ action: "create-playlist", value: playlistName }, "Playlist created. Select Add song to use it.")) setPlaylistName("");
      }}><HelpField label="New playlist name" tip="Create a private playlist to organize your saved music."><input required maxLength={60} value={playlistName} onChange={event => setPlaylistName(event.target.value)}/></HelpField>
        <button className="secondary small" disabled={busy || !playlistName.trim()}>Create playlist</button></form>
    </section>}
    {release.comments && <section className="section community-section"><h2>Words of encouragement</h2>
      <p className="muted">Comments are reviewed before they appear. Keep the focus on what inspired you.</p>
      {data.comments.length ? data.comments.map(item => <article className="community-comment" key={item.id}><p>{item.body}</p>
        <div className="actions"><small className="muted">{new Date(item.createdAt).toLocaleDateString()}</small>
          {data.canEngage && <button className="text-button" type="button" onClick={() => { setReport(item.id); setReason(""); }}>Report comment privately</button>}</div></article>) :
        <p className="muted">No approved comments yet.</p>}
      {data.canEngage && <form onSubmit={async event => {
        event.preventDefault();
        if (await update({ action: "comment", id: release.id, value: comment }, "Comment submitted for review.")) setComment("");
      }}>
        {data.myComment && <p className="muted">Your comment is {data.myComment.status === "pending" ? "awaiting review" : data.myComment.status}. <button type="button" className="text-button" disabled={busy} onClick={() => void update({ action: "delete-comment", id: release.id }, "Your comment was removed.")}>Remove your comment</button></p>}
        <HelpField label={data.myComment ? "Replace your comment" : "Encouraging comment"} tip="You can keep one comment per song. Edits return to the moderation queue."><textarea required maxLength={280} rows={3} value={comment} onChange={event => setComment(event.target.value)} placeholder="What moved you about this song?"/></HelpField>
        <button className="secondary small" disabled={busy || !comment.trim()}>Send for review</button>
      </form>}
    </section>}
    {data.canEngage && <section className="community-section community-report">
      {report === null ? <button type="button" className="text-button" onClick={() => { setReport(""); setReason(""); }}><Flag size={14}/> Report song privately</button> :
        <form className="section" onSubmit={async event => {
          event.preventDefault();
          if (await update({ action: "report", id: release.id, comment: report || undefined, value: reason }, "Private report sent to the moderation team.")) { setReport(null); setReason(""); }
        }}><h2>{report ? "Report this comment" : "Report this song"}</h2><p className="muted">Reports go to the moderation team.</p>
          <HelpField label="Reason" tip="Choose the reason closest to your concern."><select required value={reason} onChange={event => setReason(event.target.value)}><option value="">Choose a reason</option>{reportReasons.map(item => <option key={item}>{item}</option>)}</select></HelpField>
          <div className="actions"><button className="secondary small" disabled={busy || !reason}>Send private report</button><button className="text-button" type="button" onClick={() => setReport(null)}>Cancel</button></div>
        </form>}
    </section>}
  </>;
}
