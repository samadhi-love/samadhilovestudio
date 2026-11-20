"use client";
/**
 * The 3-tap lyric video panel (Song → Vibe → Make it), shown right beside the
 * live preview. Every background stays available: the Vibe box has a chip for
 * each collection and its own scroll bar, so nothing needs a long page scroll.
 * Everything else lives in the Fine-tune drawer below (nothing removed).
 */
import { Check, Download, Film, Music2, PenLine, Smartphone, Square, Tv } from "lucide-react";
import { type LyricProject, type VideoFormat, type VideoTheme } from "./lyric-video-data";
import { applyLyricBackground } from "./lyric-background-picker";
import { applyCreatorVideoLook, applyVideoShape, creatorVideoLooks } from "./creator-video-presets";
import { BackgroundChooser, type BackgroundKey } from "./background-chooser";
import type { Song } from "./studio-data";

export { suggestedThemes } from "./background-chooser";

export type CaptionState = "timing" | "none" | "rough" | "synced" | "reviewed";
export function QuickVideoPanel(props: {
  song: Song; project: LyricProject; time: number; busy: boolean; captionState: CaptionState;
  edit: (next: LyricProject) => void; make: () => void; progress: number | null;
  blocked: { text: string; step: number }[]; latest?: { url: string; extension: string; format: VideoFormat };
  addWords: () => void; fixWords: () => void; openFineTune: (step: number) => void;
}) {
  const { project, busy } = props;
  const customBackground = !!project.pro?.background;
  const isSelected = (key: BackgroundKey) => {
    if (customBackground) return false;
    const [kind, id] = key.split(":");
    if (kind === "theme") return project.theme === id;
    const look = creatorVideoLooks.find(l => l.id === id);
    return !!look && project.theme === look.theme && project.captionTemplate === look.caption;
  };
  const pick = (key: BackgroundKey) => {
    const [kind, id] = key.split(":");
    props.edit(kind === "look" ? applyCreatorVideoLook(project, id) : applyLyricBackground(project, id as VideoTheme, "all", props.time));
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
        <BackgroundChooser song={props.song} disabled={busy} isSelected={isSelected} pick={pick}
          extra={<button type="button" className="qv-link" disabled={busy} onClick={() => props.openFineTune(3)}>More lettering and motion</button>}/>
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
