"use client";
/**
 * The lyric video panel, shown right beside the live preview:
 * What is it for? → Song → Vibe → Make it.
 * The shape comes first, so the preview shows the real shape before a
 * background is picked. The Vibe box is the one place for every background,
 * complete look and animated design (no repeats elsewhere on the page).
 * Everything else lives in the Fine-tune drawer below.
 */
import { useState } from "react";
import { Check, Download, Film, Music2, PenLine } from "lucide-react";
import { type LyricProject, type VideoFormat, type VideoTheme } from "./lyric-video-data";
import { applyLyricBackground } from "./lyric-background-picker";
import { applyCreatorVideoLook, creatorVideoLooks, suggestedHookStart } from "./creator-video-presets";
import { applyVibe } from "./vibe-look-picker";
import { signatureLooks, type SignatureLookId } from "./lyric-signature";
import { applyVideoPurpose, videoPurposes, type VideoPurposeId } from "./video-purpose";
import { BackgroundChooser, type BackgroundKey } from "./background-chooser";
import type { Song } from "./studio-data";
import type { OwnBackground } from "./own-background";

import { purposeFileName } from "./video-purpose";
export { suggestedThemes } from "./background-chooser";

export type CaptionState = "timing" | "none" | "rough" | "synced" | "reviewed";
const shapeName: Record<VideoFormat, string> = { wide: "YouTube 16:9", vertical: "Phone 9:16", square: "Square 1:1" };
/** Is this Vibe-box choice (background, complete look or animated design) the one showing? */
export function backgroundKeySelected(project: LyricProject, key: BackgroundKey) {
  const [kind, id] = key.split(":");
  if (kind === "theme") return project.theme === id;
  const look = kind === "sig" ? signatureLooks.find(l => l.id === id) : creatorVideoLooks.find(l => l.id === id);
  return !!look && project.theme === look.theme && project.captionTemplate === look.caption;
}
/** Applies a Vibe-box choice to the whole video. */
export function applyBackgroundKey(project: LyricProject, key: BackgroundKey, time: number): LyricProject {
  const [kind, id] = key.split(":");
  return kind === "look" ? applyCreatorVideoLook(project, id)
    : kind === "sig" ? applyVibe(project, id as SignatureLookId)
    : applyLyricBackground(project, id as VideoTheme, "all", time);
}
/** Which "What is it for?" card matches the project's shape and length. */
export function purposeOf(project: LyricProject): VideoPurposeId {
  if (project.format === "wide") return "youtube";
  if (project.format === "square") return "square";
  return clipLength(project) === "full song" ? "phone" : "shorts";
}
/** How much of the song the video uses, for the button: "full song" or "0:60 highlight". */
function clipLength(project: LyricProject) {
  const range = project.pro?.range, total = project.pro?.duration ?? 0;
  if (!range || total <= 0 || range.end - range.start >= total - 0.5) return "full song";
  const seconds = Math.round(range.end - range.start);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} highlight`;
}
export function QuickVideoPanel(props: {
  song: Song; project: LyricProject; time: number; busy: boolean; captionState: CaptionState;
  edit: (next: LyricProject) => void; make: () => void; progress: number | null;
  /** Make YouTube 16:9, Phone 9:16 and Square 1:1 in one go. */
  makeAll?: () => void;
  /** Every file from the last make (one, or all three shapes). */
  results?: { url: string; extension: string; format: VideoFormat }[];
  blocked: { text: string; step: number }[]; latest?: { url: string; extension: string; format: VideoFormat };
  addWords: () => void; fixWords: () => void; openFineTune: (step: number) => void;
  /** Your own photo, video or camera ("Yours" tab). */
  own?: OwnBackground;
  /** Upload & share block for one finished file (save, share, email, open YouTube/TikTok/Instagram, copy post). */
  shareFor?: (result: { url: string; extension: string; format: VideoFormat }) => React.ReactNode;
  /** Point the upload button at the site the video is for. */
  choosePlatform?: (platform: (typeof videoPurposes)[number]["platform"]) => void;
}) {
  const { project, busy } = props;
  // Your own photo or video is on: no gallery box shows as picked.
  const customBackground = !!props.own?.active || !!project.pro?.background;
  const isSelected = (key: BackgroundKey) => !customBackground && backgroundKeySelected(project, key);
  const pick = (key: BackgroundKey) => props.edit(applyBackgroundKey(project, key, props.time));
  // Remember the card tapped: for a song of a minute or less, Shorts and
  // Phone make the same video, and the tapped card should stay lit.
  const [chosen, setChosen] = useState<VideoPurposeId | null>(null);
  const derived = purposeOf(project);
  const purpose = chosen && (chosen === derived || (chosen === "shorts" && derived === "phone" && (project.pro?.duration ?? 0) <= 61)) ? chosen : derived;
  const purposeInfo = videoPurposes.find(p => p.id === purpose)!;
  const choosePurpose = (id: VideoPurposeId) => {
    const picked = videoPurposes.find(p => p.id === id)!;
    try {
      props.edit(applyVideoPurpose(project, picked, picked.seconds > 0 ? suggestedHookStart(project) : 0));
      setChosen(id);
      props.choosePlatform?.(picked.platform);
    } catch { /* The recording's length is still loading; the cards stay as they are. */ }
  };
  const words = {
    timing: { text: "Timing the words to the voice…", action: null },
    none: { text: "No words yet", action: { label: "Add words", run: props.addWords } },
    rough: { text: "Rough timing · words spread evenly", action: { label: "Fix timing", run: props.fixWords } },
    synced: { text: "Words timed to the voice", action: { label: "Fix a word", run: props.fixWords } },
    reviewed: { text: "Words checked by you", action: { label: "Fix a word", run: props.fixWords } },
  }[props.captionState];
  return (
    <section className="qv-panel" aria-label="Make your video in three taps" data-testid="quick-video-panel">
      <div className="qv-step qv-purpose" id="qv-purpose" data-testid="qv-purpose">
        <span className="qv-kicker">1 · What is it for?</span>
        <div className="qv-purposes" role="radiogroup" aria-label="What is the video for?">
          {videoPurposes.map(p => (
            <button type="button" role="radio" key={p.id} aria-checked={p.id === purpose} className={p.id === purpose ? "active" : ""}
              disabled={busy || !project.pro?.duration} onClick={() => choosePurpose(p.id)} data-testid={`qv-purpose-${p.id}`}>
              <span className="qv-purpose-icon" aria-hidden="true">{p.icon}</span>
              <strong>{p.name}</strong><small>{p.shape}</small>
            </button>))}
        </div>
      </div>

      <div className="qv-step" data-testid="qv-song">
        <span className="qv-kicker">2 · Song</span>
        <div className="qv-row">
          <Music2 size={17} aria-hidden="true" /><strong>{props.song.name}</strong>
          <span className={`qv-words qv-words-${props.captionState}`} role="status" data-testid="qv-words-status">
            {props.captionState === "synced" || props.captionState === "reviewed" ? <Check size={14} aria-hidden="true" /> : null} {words.text}
          </span>
          {words.action && <button type="button" className="qv-link" disabled={busy} onClick={words.action.run} data-testid="qv-words-action"><PenLine size={14} aria-hidden="true" /> {words.action.label}</button>}
        </div>
      </div>

      <div className="qv-step qv-vibe" id="qv-vibe" data-testid="qv-vibe">
        <span className="qv-kicker">3 · Vibe · background, lettering and motion</span>
        <BackgroundChooser song={props.song} disabled={busy} isSelected={isSelected} pick={pick} own={props.own} signatures
          extra={<button type="button" className="qv-link" disabled={busy} onClick={() => props.openFineTune(3)}>More lettering and motion</button>}/>
      </div>

      <div className="qv-step" data-testid="qv-make">
        <span className="qv-kicker">4 · Make it, then upload &amp; share</span>
        <p className="qv-making" data-testid="qv-making">
          Making: <strong>{purposeInfo.icon} {purposeInfo.name}</strong> · {shapeName[project.format]} · {clipLength(project)}{" "}
          <button type="button" className="qv-link" disabled={busy} onClick={() => document.getElementById("qv-purpose")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Change</button>
        </p>
        {props.blocked.length > 0 && (
          <p className="qv-blocked" role="alert" data-testid="qv-blocked">{props.blocked[0].text}{" "}
            <button type="button" className="qv-link" disabled={busy} onClick={() => props.openFineTune(props.blocked[0].step)}>Fix it</button></p>
        )}
        <button type="button" className="lvp-primary qv-make" disabled={busy || props.blocked.length > 0} onClick={props.make} data-testid="qv-make-video">
          <Film size={17} aria-hidden="true" /> {props.progress !== null ? `Making your video… ${Math.round(props.progress * 100)}%` : "Make my video"}
        </button>
        {props.makeAll && props.progress === null && <button type="button" className="secondary qv-make-all" disabled={busy || props.blocked.length > 0} onClick={props.makeAll} data-testid="qv-make-all">
          ▭ ▯ ◻ Make all 3 shapes <small>YouTube 16:9 · Phone 9:16 · Square 1:1 · {clipLength(project)}</small>
        </button>}
        {(props.results?.length ? props.results : props.latest ? [props.latest] : []).length > 0 && (
          <div className={`qv-results${(props.results?.length ?? 1) > 1 ? " is-many" : ""}`}>
            {(props.results?.length ? props.results : [props.latest!]).map(result => (
              <div className="qv-result" data-testid={`qv-result-${result.format}`} key={result.url}>
                <strong className="qv-result-label">{shapeName[result.format]}</strong>
                <video src={result.url} controls playsInline preload="metadata" aria-label={`Your finished ${shapeName[result.format]} video`} />
                {props.shareFor
                  ? <div className="qv-share" data-testid={`qv-share-${result.format}`}>{props.shareFor(result)}</div>
                  : <a className="lvp-primary qv-download" href={result.url} download={purposeFileName(props.song.name, result.format, result.extension)}><Download size={15} aria-hidden="true" /> Download</a>}
              </div>))}
            <button type="button" className="qv-link" onClick={() => props.openFineTune(4)} data-testid="qv-share-options">Write the post text · YouTube title, description and hashtags</button>
          </div>
        )}
      </div>
    </section>
  );
}
