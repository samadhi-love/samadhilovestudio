"use client";
/**
 * The one background picker used everywhere a video is made (Create page and
 * LyriVid). Every background is a picture box with its name. Find one by typing
 * its name, or browse the group tabs; the boxes sit in one short area with its
 * own scroll bar, so nothing needs a long page scroll.
 *
 * Choices are plain keys: "theme:<background id>", "look:<complete look id>"
 * or, where the page supports them, "sig:<animated design id>".
 */
import { useState } from "react";
import { Dice5, Search, X } from "lucide-react";
import { videoThemes, type VideoTheme } from "./lyric-video-data";
import { lyricBackgroundGroups } from "./lyric-background-picker";
import { creatorVideoLooks } from "./creator-video-presets";
import { signatureLooks } from "./lyric-signature";
import type { Song } from "./studio-data";
import { OwnBackgroundPanel, type OwnBackground } from "./own-background";

export type BackgroundKey = `theme:${string}` | `look:${string}` | `sig:${string}`;
type Tab = "song" | "yours" | "looks" | "animated" | keyof typeof lyricBackgroundGroups;
const tabNames: Record<Tab, string> = {
  song: "For this song", yours: "Yours · photo, video, camera", looks: "Complete looks", animated: "Animated designs", kids: "Kids", usa: "USA and New York", world: "World",
  sacred: "Sacred", scenes: "Cosmic and scenes", colors: "Colors",
};

/** Picks the collections that fit the song first (kids, USA, sacred, party…), then sensible defaults. */
export function suggestedThemes(song?: Pick<Song, "name" | "notes" | "tags"> | null): VideoTheme[] {
  const text = song ? `${song.name} ${song.notes.prompt} ${song.tags.join(" ")}`.toLowerCase() : "";
  const picks: VideoTheme[] = [];
  const add = (...ids: VideoTheme[]) => ids.forEach(id => { if (!picks.includes(id)) picks.push(id); });
  if (/lion|jungle|monkey|elephant|tiger|safari|zoo/.test(text)) add("jungle");
  if (/farm|cow|pig|chick|duck|sheep|horse|barn|tractor/.test(text)) add("farm");
  if (/pupp|dog|kitt|cat\b|cats\b|pet/.test(text)) add("pets");
  if (/kid|child|lullab|nursery|baby|birthday|school|abc|toddler|bedtime|sleep/.test(text)) add("balloons", "jungle", "farm", "pets", "meadow", "undersea", "lullaby");
  if (/america|usa|u\.s\.|patriot|freedom|liberty|flag|4th of july|independence|new york|nyc|brooklyn|manhattan|city/.test(text)) add("flag", "liberty", "nycnight");
  if (/god|jesus|christ|mary|angel|pray|prayer|gospel|worship|mantra|om\b|kriya|buddha|sacred|spirit|soul|medit|heal/.test(text)) add("archangel", "masters", "lotus", "temple", "mandala", "jesus");
  if (/dance|party|club|edm|house|techno|pop|hype/.test(text)) add("futuristic", "portal", "nebula", "nycnight", "balloons");
  if (/ocean|sea|beach|water|summer/.test(text)) add("undersea", "ocean", "lake");
  if (/love|heart|romance|r&b|rnb/.test(text)) add("rose", "sunset", "lunar");
  add("cosmic", "celestial", "nebula", "silkroad", "lake", "portal");
  return picks.slice(0, 8);
}

export function backgroundArt(theme: VideoTheme) {
  const item = videoThemes[theme] as { image: string; thumb?: string; colors: readonly string[] };
  const picture = item.thumb || item.image;
  return picture ? { backgroundImage: `url(${picture})` } : { backgroundImage: `radial-gradient(ellipse at 50% 25%,${item.colors[0]},${item.colors[1]} 50%,${item.colors[2]})` };
}

const allThemes = Object.keys(videoThemes) as VideoTheme[];
const groupOf = (id: VideoTheme) => (Object.entries(lyricBackgroundGroups) as [keyof typeof lyricBackgroundGroups, { themes: readonly VideoTheme[] }][])
  .find(([, group]) => group.themes.includes(id))?.[0];

export function BackgroundChooser(props: {
  song?: Pick<Song, "name" | "notes" | "tags"> | null; disabled?: boolean;
  isSelected: (key: BackgroundKey) => boolean; pick: (key: BackgroundKey) => void;
  extra?: React.ReactNode;
  /** Your own photo, video or camera. The "Yours" tab shows only where it is given. */
  own?: OwnBackground;
  /** Show the animated signature designs (pages that can apply "sig:" keys). */
  signatures?: boolean;
  /** Tab to open on (default: "For this song"). */
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(() => props.own?.active ? "yours" : props.initialTab ?? "song");
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase();
  // Typing searches every background and complete look by name, whatever tab is open.
  const themes: VideoTheme[] = words
    ? allThemes.filter(id => `${videoThemes[id].title} ${tabNames[groupOf(id) ?? "song"]}`.toLowerCase().includes(words))
    : tab === "song" ? suggestedThemes(props.song) : tab === "looks" || tab === "yours" || tab === "animated" ? [] : [...lyricBackgroundGroups[tab].themes];
  const looks = words ? creatorVideoLooks.filter(l => `${l.name} ${l.vibe} ${l.category}`.toLowerCase().includes(words)) : tab === "looks" ? creatorVideoLooks : [];
  const animated = !props.signatures ? [] : words ? signatureLooks.filter(l => `${l.name} ${l.note}`.toLowerCase().includes(words)) : tab === "animated" ? [...signatureLooks] : [];
  const surprise = () => {
    const pool = suggestedThemes(props.song).filter(id => !props.isSelected(`theme:${id}`));
    if (pool.length) props.pick(`theme:${pool[Math.floor(Math.random() * pool.length)]}`);
  };
  return (
    <div className="bg-chooser" data-testid="background-chooser">
      <label className="bg-search">
        <Search size={15} aria-hidden="true" />
        <input type="search" aria-label="Find a background by name" value={query} placeholder="Find a background · flag, ocean, Jesus…" onChange={e => setQuery(e.target.value)} data-testid="bg-search" />
        {query && <button type="button" className="qv-link" aria-label="Clear search" onClick={() => setQuery("")}><X size={14} aria-hidden="true" /></button>}
      </label>
      <div className="qv-chips" role="tablist" aria-label="Background groups">
        {(Object.keys(tabNames) as Tab[]).filter(id => (id !== "yours" || props.own) && (id !== "animated" || props.signatures)).map(id => (
          <button type="button" role="tab" key={id} aria-selected={!words && tab === id} className="qv-chip" onClick={() => { setTab(id); setQuery(""); }} data-testid={`qv-chip-${id}`}>{tabNames[id]}</button>
        ))}
      </div>
      {!words && tab === "yours" && props.own ? <div className="qv-grid qv-grid-own" data-testid="qv-grid" role="tabpanel" aria-label={tabNames.yours}><OwnBackgroundPanel own={props.own} disabled={props.disabled} /></div> :
      <div className="qv-grid" data-testid="qv-grid" role="tabpanel" aria-label={words ? `Results for ${query}` : tabNames[tab]}>
        {themes.map(id => (
          <button type="button" key={id} className="qv-card" disabled={props.disabled} aria-pressed={props.isSelected(`theme:${id}`)}
            onClick={() => props.pick(`theme:${id}`)} data-testid={`qv-theme-${id}`}>
            <span className="qv-art" style={backgroundArt(id)} aria-hidden="true" /><span className="qv-name">{videoThemes[id].title}</span>
          </button>))}
        {looks.map(look => (
          <button type="button" key={look.id} className="qv-card" disabled={props.disabled} title={look.vibe} aria-pressed={props.isSelected(`look:${look.id}`)}
            onClick={() => props.pick(`look:${look.id}`)} data-testid={`qv-look-${look.id}`}>
            <span className="qv-art" style={backgroundArt(look.theme)} aria-hidden="true" /><span className="qv-name">{look.name} <small>· look</small></span>
          </button>))}
        {animated.map(design => (
          <button type="button" key={design.id} className="qv-card" disabled={props.disabled} title={design.note} aria-pressed={props.isSelected(`sig:${design.id}`)}
            onClick={() => props.pick(`sig:${design.id}`)} data-testid={`qv-sig-${design.id}`}>
            <span className="qv-art" style={backgroundArt(design.theme as VideoTheme)} aria-hidden="true" /><span className="qv-name">{design.name} <small>· animated</small></span>
          </button>))}
        {!themes.length && !looks.length && !animated.length && <p className="lvp-note" role="status">No background called “{query}”. Try another word, or pick a tab.</p>}
      </div>}
      <div className="qv-row">
        <button type="button" disabled={props.disabled} onClick={surprise} data-testid="qv-surprise"><Dice5 size={15} aria-hidden="true" /> Surprise me</button>
        {props.extra}
      </div>
    </div>
  );
}
