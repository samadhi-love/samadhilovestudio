"use client";
/**
 * The 3-tap lyric video panel (Song → Vibe → Make it), shown right beside the
 * live preview. Every background stays available: the Vibe box has a chip for
 * each collection and its own scroll bar, so nothing needs a long page scroll.
 * Everything else lives in the Fine-tune drawer below (nothing removed).
 */
import { useState } from "react";
import { Check, Dice5, Download, Film, Music2, PenLine, Smartphone, Square, Tv } from "lucide-react";
import { videoThemes, type LyricProject, type VideoFormat, type VideoTheme } from "./lyric-video-data";
import { applyLyricBackground, lyricBackgroundGroups } from "./lyric-background-picker";
import { applyCreatorVideoLook, applyVideoShape, creatorVideoLooks } from "./creator-video-presets";
import type { Song } from "./studio-data";

type Chip = "song" | "looks" | keyof typeof lyricBackgroundGroups;
const chipNames: Record<Chip, string> = {
  song: "For this song", looks: "Complete looks", kids: "Kids", usa: "USA and New York", world: "World",
  sacred: "Sacred", scenes: "Cosmic and scenes", colors: "Colors",
};

/** Picks the collections that fit the song first (kids, USA, sacred, party…), then sensible defaults. */
export function suggestedThemes(song: Pick<Song, "name" | "notes" | "tags">): VideoTheme[] {
  const text = `${song.name} ${song.notes.prompt} ${song.tags.join(" ")}`.toLowerCase();
  const picks: VideoTheme[] = [];
  const add = (...ids: VideoTheme[]) => ids.forEach(id => { if (!picks.includes(id)) picks.push(id); });
  if (/kid|child|lullab|nursery|baby|birthday|school|abc|toddler|bedtime|sleep/.test(text)) add("balloons", "meadow", "undersea", "lullaby");
  if (/america|usa|u\.s\.|patriot|freedom|liberty|flag|4th of july|independence|new york|nyc|brooklyn|manhattan|city/.test(text)) add("flag", "liberty", "nycnight");
  if (/god|jesus|christ|mary|angel|pray|prayer|gospel|worship|mantra|om\b|kriya|buddha|sacred|spirit|soul|medit|heal/.test(text)) add("archangel", "masters", "lotus", "temple", "mandala", "jesus");
  if (/dance|party|club|edm|house|techno|pop|hype/.test(text)) add("futuristic", "portal", "nebula", "nycnight", "balloons");
  if (/ocean|sea|beach|water|summer/.test(text)) add("undersea", "ocean", "lake");
  if (/love|heart|romance|r&b|rnb/.test(text)) add("rose", "sunset", "lunar");
  add("cosmic", "celestial", "nebula", "silkroad", "lake", "portal");
  return picks.slice(0, 8);
}

function art(theme: VideoTheme) {
  const item = videoThemes[theme] as { image: string; thumb?: string; colors: readonly string[] };
  const picture = item.thumb || item.image;
  return picture ? { backgroundImage: `url(${picture})` } : { backgroundImage: `radial-gradient(ellipse at 50% 25%,${item.colors[0]},${item.colors[1]} 50%,${item.colors[2]})` };
}

export type CaptionState = "timing" | "none" | "rough" | "synced" | "reviewed";
export function QuickVideoPanel(props: {
  song: Song; project: LyricProject; time: number; busy: boolean; captionState: CaptionState;
  edit: (next: LyricProject) => void; make: () => void; progress: number | null;
  blocked: { text: string; step: number }[]; latest?: { url: string; extension: string; format: VideoFormat };
  addWords: () => void; fixWords: () => void; openFineTune: (step: number) => void;
}) {
  const { project, busy } = props;
  const [chip, setChip] = useState<Chip>("song");
  const customBackground = !!project.pro?.background;
  const themes: VideoTheme[] = chip === "song" ? suggestedThemes(props.song)
    : chip === "looks" ? [] : [...lyricBackgroundGroups[chip].themes];
  const choose = (theme: VideoTheme) => props.edit(applyLyricBackground(project, theme, "all", props.time));
  const surprise = () => {
    const pool = suggestedThemes(props.song).filter(id => id !== project.theme);
    if (pool.length) choose(pool[Math.floor(Math.random() * pool.length)]);
  };
  const shapes: { id: VideoFormat; label: string; Icon: typeof Smartphone }[] = [
    { id: "vertical", label: "Phone", Icon: Smartphone }, { id: "wide", label: "YouTube", Icon: Tv }, { id: "square", label: "Square", Icon: Square },
  ];
  const words = {
    timing: { text: "Timing the words to the voice…", action: null },
    none: { text: "No words yet", action: { label: "Add words", run: props.addWords } },
    rough: { text: "Rough timing · words spread evenly", action: { label: "Fix timing", run: props.fixWords } },
    synced: { text: "Words timed to the voice", action: { label: "Fix a word", run: props.fixWords } },
    reviewed: { text: "Words checked by you", action: { label: "Fix a word", run: props.fixWords } },
  }[props.captionState];
  return (
    <section className="qv-panel" aria-label="Make your video in three taps" data-testid="quick-video-panel">
      <div className="qv-step" data-testid="qv-song">
        <span className="qv-kicker">1 · Song</span>
        <div className="qv-row">
          <Music2 size={17} aria-hidden="true" /><strong>{props.song.name}</strong>
          <span className={`qv-words qv-words-${props.captionState}`} role="status" data-testid="qv-words-status">
            {props.captionState === "synced" || props.captionState === "reviewed" ? <Check size={14} aria-hidden="true" /> : null} {words.text}
          </span>
          {words.action && <button type="button" className="qv-link" disabled={busy} onClick={words.action.run} data-testid="qv-words-action"><PenLine size={14} aria-hidden="true" /> {words.action.label}</button>}
        </div>
      </div>

      <div className="qv-step qv-vibe" id="qv-vibe" data-testid="qv-vibe">
        <span className="qv-kicker">2 · Vibe · background, lettering and motion</span>
        <div className="qv-chips" role="tablist" aria-label="Background collections">
          {(Object.keys(chipNames) as Chip[]).map(id => (
            <button type="button" role="tab" key={id} aria-selected={chip === id} className="qv-chip" onClick={() => setChip(id)} data-testid={`qv-chip-${id}`}>{chipNames[id]}</button>
          ))}
        </div>
        <div className="qv-grid" data-testid="qv-grid" role="tabpanel" aria-label={chipNames[chip]}>
          {chip === "looks"
            ? creatorVideoLooks.map(look => (
              <button type="button" key={look.id} className="qv-card" disabled={busy} title={look.vibe}
                aria-pressed={!customBackground && project.theme === look.theme && project.captionTemplate === look.caption}
                onClick={() => props.edit(applyCreatorVideoLook(project, look.id))} data-testid={`qv-look-${look.id}`}>
                <span className="qv-art" style={art(look.theme)} aria-hidden="true" /><span className="qv-name">{look.name}</span>
              </button>))
            : themes.map(id => (
              <button type="button" key={id} className="qv-card" disabled={busy} aria-pressed={!customBackground && project.theme === id}
                onClick={() => choose(id)} data-testid={`qv-theme-${id}`}>
                <span className="qv-art" style={art(id)} aria-hidden="true" /><span className="qv-name">{videoThemes[id].title}</span>
              </button>))}
        </div>
        <div className="qv-row">
          <button type="button" disabled={busy} onClick={surprise} data-testid="qv-surprise"><Dice5 size={15} aria-hidden="true" /> Surprise me</button>
          <button type="button" className="qv-link" disabled={busy} onClick={() => props.openFineTune(3)}>More lettering and motion</button>
        </div>
      </div>

      <div className="qv-step" data-testid="qv-make">
        <span className="qv-kicker">3 · Make it</span>
        <div className="qv-shapes" role="group" aria-label="Video shape">
          {shapes.map(({ id, label, Icon }) => (
            <button type="button" key={id} aria-pressed={project.format === id} disabled={busy} onClick={() => props.edit(applyVideoShape(project, id))} data-testid={`qv-shape-${id}`}>
              <Icon size={16} aria-hidden="true" /> {label}
            </button>))}
        </div>
        {props.blocked.length > 0 && (
          <p className="qv-blocked" role="alert" data-testid="qv-blocked">{props.blocked[0].text}{" "}
            <button type="button" className="qv-link" disabled={busy} onClick={() => props.openFineTune(props.blocked[0].step)}>Fix it</button></p>
        )}
        <button type="button" className="lvp-primary qv-make" disabled={busy || props.blocked.length > 0} onClick={props.make} data-testid="qv-make-video">
          <Film size={17} aria-hidden="true" /> {props.progress !== null ? `Making your video… ${Math.round(props.progress * 100)}%` : "Make my video"}
        </button>
        {props.latest && (
          <div className="qv-result" data-testid="qv-result">
            <video src={props.latest.url} controls playsInline preload="metadata" aria-label="Your finished video" />
            <div className="qv-row">
              <a className="lvp-primary qv-download" href={props.latest.url} download={`${props.song.name}.${props.latest.extension}`}><Download size={15} aria-hidden="true" /> Download</a>
              <button type="button" className="qv-link" onClick={() => props.openFineTune(4)}>Share and post options</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
