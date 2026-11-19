"use client";
import { useState } from "react";
import { Film, Headphones, Lock, Megaphone, Mic, Scissors, Send, Sparkles, Video } from "lucide-react";
import type { QuickSeed } from "./quick-create";
import type { SectionView } from "./studio-routes";
import { BrandLogoDesigner } from "./brand-logo-designer";
import { MusicalAdBuilder } from "./musical-ad-builder";
import { adStyles, emptyMusicalAd, isMusicalAd, musicalAdPrompt, type MusicalAd } from "./musical-ad";
import { isExplicitSong } from "./clean-content";
import { uploadLyricAsset } from "./lyric-pro-media";
import { Community } from "./community/community";
import { PartyMix } from "./party/studio";
import { SubscriberRoom } from "./subscriber-room";
import { MemberDashboard } from "./members/member-dashboard";
import { PlanCards } from "./plans/plan-cards";
import { CreditPanel } from "./credits/credit-panel";
import type { Song } from "./studio-data";
import "./explore-cosmos.css";

export type ExploreTab = "radio" | "discover" | "party" | "listening-room";
export type PlanTab = "membership" | "plans" | "credits";

function Tabs<T extends string>({ label, value, change, items }: { label: string; value: T; change: (v: T) => void; items: [T, string][] }) {
  return <div className="screen-sections screen-subtabs" role="tablist" aria-label={label}>
    {items.map(([id, text]) => <button key={id} type="button" role="tab" data-testid={`tab-${id}`} aria-selected={value === id} className={value === id ? "screen-section-active" : ""} onClick={() => change(id)}>{text}</button>)}
  </div>;
}

/** Explore: the real Discover/Community, Radio, Party Mix and Subscriber Listening Room components.
 * "Following" is a presentation-only view of Discover (route tab stays "discover"); the Listening Room
 * keeps its existing route tab and is reachable from the secondary tool link. */
export function ExploreScreen({ tab, setTab, signOut, owner }: { tab: ExploreTab; setTab: (t: ExploreTab) => void; signOut: string; owner: boolean }) {
  const [following, setFollowing] = useState(false);
  const view = tab === "discover" && following ? "following" : tab;
  const pick = (next: ExploreTab | "following") => { if (next === "following") { setFollowing(true); setTab("discover"); } else { setFollowing(false); setTab(next); } };
  return <section className="explore-screen galaxy-map" data-testid="screen-explore" data-cosmic-screen="explore">
    <header className="galaxy-head">
      <p className="eyebrow">THE GALAXY MAP</p>
      <h1>Explore</h1>
      <p className="galaxy-poem hologram-guide">Music shared by the community. Only kind reactions — no rankings, no noise.</p>
    </header>
    <div className="galaxy-tabbar">
      <Tabs<ExploreTab | "following"> label="Explore" value={view} change={pick} items={[["discover", "Discover"], ["radio", "Radio"], ["party", "Party Mix"], ["following", "Following"]]}/>
      <button type="button" className="galaxy-tool" data-testid="tab-listening-room" aria-pressed={tab === "listening-room"} onClick={() => pick("listening-room")}><Lock size={14}/> Listening Room</button>
    </div>
    {tab === "discover" && <div className="explore-embed"><Community key={view} initialTab={following ? "following" : "discover"} songId={null} artistId={null} signIn="/login" signOut={signOut}/></div>}
    {tab === "party" && <div className="explore-embed"><PartyMix/></div>}
    {tab === "listening-room" && <div className="explore-embed"><SubscriberRoom signOut={signOut} ownerPreview={owner}/></div>}
  </section>;
}

/** Plan & Credits: membership, plans (display only, billing not enabled here) and private credit usage. */
export function PlanCreditsScreen({ tab, setTab, owner, signOut }: { tab: PlanTab; setTab: (t: PlanTab) => void; owner: boolean; signOut: string }) {
  return <section className="plan-credits-screen" data-testid="screen-plan-credits">
    <header className="screen-intro"><p className="eyebrow">SETTINGS & HELP</p><h1>Plan & Credits</h1><p className="muted">Your membership, the available plans and how your production credits are used, together.</p></header>
    <Tabs label="Plan & Credits" value={tab} change={setTab} items={[["membership", "My Membership"], ["plans", "Plans"], ["credits", "Credits & Usage"]]}/>
    {tab === "membership" && <MemberDashboard returned={false} signOut={signOut}/>}
    {tab === "plans" && <PlanCards ready={false}/>}
    {tab === "credits" && <CreditPanel owner={owner}/>}
  </section>;
}

/** Promote: the actual Logo Creator (with animated nature logos) and the Musical Ad builder, which hands its
 * prepared brief to Create (Custom, Musical ad) without submitting. */
export function PromoteScreen({ songs, songId, setSongId, creatorName, working, saveSong, createAd, openVideo }: {
  songs: Song[]; songId: string; setSongId: (id: string) => void; creatorName: string; working: (busy: boolean) => void;
  saveSong: (song: Song, message?: string) => Promise<boolean>; createAd: (seed: Omit<QuickSeed, "id">) => void; openVideo: (id: string) => void;
}) {
  const song = songs.find(s => s.id === songId);
  const [tool, setTool] = useState<"logo" | "ad">("logo");
  const [ad, setAd] = useState<MusicalAd>(song?.musicalAd ?? emptyMusicalAd);
  const [notice, setNotice] = useState("");
  return <section className="promote-screen" data-testid="screen-promote">
    <header className="screen-intro"><p className="eyebrow"><Megaphone size={14}/> PROMOTE</p><h1>Give your song a face.</h1><p className="muted hologram-guide">Logos, animated nature logos and musical ads. Everything you save stays with the chosen song.</p></header>
    <label className="field">Song<select data-testid="select-promote-song" value={songId} onChange={e => { setSongId(e.target.value); setAd(songs.find(s => s.id === e.target.value)?.musicalAd ?? emptyMusicalAd); setNotice(""); }}>
      <option value="">No song · standalone logo</option>{songs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <Tabs label="Promote tools" value={tool} change={setTool} items={[["logo", "Logo Creator"], ["ad", "Musical ad"]]}/>
    {tool === "logo" ? <BrandLogoDesigner key={songId || "standalone"} working={working} name={creatorName} initial={song?.logoDesign} save={song ? async (blob, design) => {
      const asset = await uploadLyricAsset(song.id, "logo", blob);
      const next = { ...song, logoAsset: asset, logoDesign: design, ...(song.lyricVideo?.pro ? { lyricVideo: { ...song.lyricVideo, pro: { ...song.lyricVideo.pro, logo: asset } } } : {}) };
      if (!await saveSong(next, "Logo saved privately")) throw new Error("Logo upload finished, but the project save could not be confirmed. Retry.");
    } : undefined}/> : <>
      <MusicalAdBuilder value={ad} change={setAd} disabled={false} prepare={() => {
        if (!isMusicalAd(ad)) { setNotice("Complete the product name, benefit and call to action."); return; }
        createAd({ custom: true, ad, idea: musicalAdPrompt(ad), title: (ad.brand + " · Musical ad").slice(0, 100), styles: [adStyles[ad.style].genre], notice: "Ad brief prepared in Create. Review, then press Create; nothing is generated until you do." });
      }}/>
      {notice && <p role="status" data-testid="text-promote-notice">{notice}</p>}
      {song && <div className="actions">
        <button type="button" className="secondary small" data-testid="button-save-ad-brief" onClick={async () => { if (await saveSong({ ...song, musicalAd: ad }, "Musical ad brief saved with the song")) setNotice("Brief saved with the song."); }} disabled={!isMusicalAd(ad)}>Keep brief with this song</button>
        <button type="button" className="secondary small" data-testid="button-promote-video" onClick={() => openVideo(song.id)}><Film size={15}/> Make a short ad video</button></div>}
    </>}
  </section>;
}

/** Voice / Podcast switch for the Record screen, with Vocal Studio Pro as a fold-out. Switching never interrupts a live take. */
export function RecordSwitch({ view, beginner, capturing, navigate }: { view: SectionView; beginner: boolean; capturing: boolean; navigate: (v: SectionView) => boolean | undefined }) {
  const vocal = view === "vocal-studio";
  return <div className="record-switch" data-testid="record-switch">
    <div className="record-mode-toggle" role="radiogroup" aria-label="Record mode">
      {([["recording", "Voice", Mic], ["podcast", "Podcast", Headphones]] as const).map(([id, label, Icon]) =>
        <button key={id} type="button" role="radio" data-testid={`radio-record-${id}`} aria-checked={view === id} disabled={capturing && view !== id} onClick={() => navigate(id)}><Icon size={16}/> {label}</button>)}
    </div>
    {(!beginner || vocal) && <button type="button" className="record-pro-fold" data-testid="toggle-vocal-studio" aria-expanded={vocal} disabled={capturing} onClick={() => navigate(vocal ? "recording" : "vocal-studio")}>
      <Sparkles size={15}/> Vocal Studio Pro <small>{vocal ? "Close" : "Sing over a track, layer and tune"}</small></button>}
  </div>;
}

/** The four song steps shown on every song in My Songs. */
export function SongSteps({ song, busy, listening, listen, fix, video, release }: { song: Song; busy: boolean; listening: boolean; listen: () => void; fix: () => void; video: () => void; release: () => void }) {
  const playable = !!song.audioFormat && !isExplicitSong(song);
  return <ol className="song-steps" aria-label={`Steps for ${song.name}`} data-testid={`steps-${song.id}`}>
    <li><button type="button" data-testid={`button-listen-${song.id}`} aria-pressed={listening} disabled={!playable} onClick={listen}><Headphones size={15}/> Listen</button></li>
    <li><button type="button" data-testid={`button-fix-${song.id}`} disabled={busy || !playable} onClick={fix}><Scissors size={15}/> Fix a part</button></li>
    <li><button type="button" data-testid={`button-video-${song.id}`} disabled={busy || !playable} onClick={video}><Video size={15}/> Make video</button></li>
    <li><button type="button" data-testid={`button-release-${song.id}`} disabled={busy} onClick={release}><Send size={15}/> Release</button></li>
  </ol>;
}

export type RadioSource = "personal" | "community";
/** One station at a time: switching source deactivates (pauses) the other player. */
export function RadioSourceSwitch({ value, change }: { value: RadioSource; change: (next: RadioSource) => void }) {
  return <div className="record-mode-toggle radio-source-toggle" role="radiogroup" aria-label="Radio source" data-testid="radio-source-switch">
    {([["personal", "My station"], ["community", "Community station"]] as const).map(([id, label]) =>
      <button key={id} type="button" role="radio" aria-checked={value === id} data-testid={`radio-source-${id}`} onClick={() => { if (value !== id) change(id); }}>{label}</button>)}
  </div>;
}
