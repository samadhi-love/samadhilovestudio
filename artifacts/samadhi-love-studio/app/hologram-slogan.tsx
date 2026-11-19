"use client";

import { createContext, Fragment, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { brand } from "./brand";
import "./hologram-slogan.css";

const digitalGlyphs = "01<>/#*+=";
const phrases = brand.slogan.split(/(?<=\.)\s+/).filter(Boolean);
type AttentionLine = "slogan" | "simple-view" | "originals" | "start-song" | "video-description";
const AttentionContext = createContext<AttentionLine | null>(null);

/** One explicitly chosen attention line for the entire screen, including its sidebar. */
export function HologramScope({ primary, children }: { primary: AttentionLine; children: ReactNode }) {
  return <AttentionContext.Provider value={primary}>{children}</AttentionContext.Provider>;
}

function HologramLine({ kind, text, soft = false, prose = false }: { kind: AttentionLine; text: string; soft?: boolean; prose?: boolean }) {
  const primary = useContext(AttentionContext);
  if (soft || (primary !== null && primary !== kind)) return <span className="hologram-guide">{text}</span>;
  return <HologramText text={text} prose={prose}/>;
}

/** Only the existing brand slogan: small-print uses remain ordinary text. */
export function HologramSlogan({ part, soft = false }: { part?: 0 | 1 | 2; soft?: boolean }) {
  const text = part === undefined ? brand.slogan : phrases[part];
  return <HologramLine kind="slogan" text={text} soft={soft}/>;
}

/** An additional line explicitly approved for the same treatment. */
export function HologramSimpleViewNote() {
  return <HologramLine kind="simple-view" text="Simple view · start with an idea"/>;
}

export function HologramOriginalsLine() {
  return <HologramLine kind="originals" text="Originals in motion, one frequency at a time."/>;
}

export function HologramStartSongNote() {
  return <HologramLine kind="start-song" text="Start a song to give your next idea a home."/>;
}

export function HologramVideoDescription() {
  return <HologramLine kind="video-description" prose text="Turn your music into a lyric video, animated cover or social short. Choose cosmic and sacred scenes, cinematic backgrounds and animated lyric templates in the same studio."/>;
}

function HologramText({ text, prose = false }: { text: string; prose?: boolean }) {
  const [visual, setVisual] = useState(text);
  const element = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!element.current || !window.matchMedia || !window.IntersectionObserver) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = window.matchMedia("(forced-colors: active)");
    let played = false;
    let timer: number | undefined;
    const wordEnds = prose ? Array.from(text.matchAll(/\S+/g), match => match.index! + match[0].length) : [];
    const finish = () => {
      window.clearTimeout(timer);
      timer = undefined;
      setVisual(text);
    };
    const observer = new window.IntersectionObserver(entries => {
      if (played || !entries.some(entry => entry.isIntersecting)) return;
      played = true;
      observer.disconnect();
      if (motion.matches || contrast.matches || document.hidden) return;
      const started = window.performance.now();
      const frame = () => {
        const progress = Math.min(1, (window.performance.now() - started) / (prose ? 1500 : 1800));
        if (progress >= 1) { finish(); return; }
        const resolved = prose
          ? wordEnds[Math.floor(progress * wordEnds.length) - 1] ?? 0
          : Math.floor(progress * text.length);
        // Randomness is visual-only, after mount and intersection; SSR is real text.
        setVisual(Array.from(text, (letter, index) =>
          index < resolved || /[\s.,·]/.test(letter)
            ? letter
            : digitalGlyphs[Math.floor(Math.random() * digitalGlyphs.length)]
        ).join(""));
        timer = window.setTimeout(frame, 50);
      };
      frame();
    }, { threshold: 0.1 });
    const preferenceChanged = () => {
      if (motion.matches || contrast.matches) {
        played = true;
        observer.disconnect();
        finish();
      }
    };
    const visibilityChanged = () => { if (document.hidden && played) finish(); };
    observer.observe(element.current);
    motion.addEventListener("change", preferenceChanged);
    contrast.addEventListener("change", preferenceChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      motion.removeEventListener("change", preferenceChanged);
      contrast.removeEventListener("change", preferenceChanged);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [text, prose]);

  let offset = 0;
  return <span ref={element} className={`hologram-slogan${prose ? " hologram-slogan--description" : ""}`} role="img" aria-label={text}>
    <span aria-hidden="true">
      {text.split(" ").map((word, wordIndex, words) => {
        const start = offset;
        offset += word.length + 1;
        return <Fragment key={wordIndex}><span className="hologram-slogan__word">
          {Array.from(word, (letter, index) => <span key={index} className="hologram-slogan__letter" data-letter={letter}>
            <span className="hologram-slogan__glyph">{visual[start + index] ?? letter}</span>
          </span>)}
        </span>{wordIndex < words.length - 1 ? " " : null}</Fragment>;
      })}
    </span>
  </span>;
}
