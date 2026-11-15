"use client";
import { useEffect, useRef, useState } from "react";
import { animatedLogoSvg } from "./animated-brand-logo";
import type { BrandLogo } from "./brand-logo";
import type { LogoAnimation } from "./logo-nature-scenes";

export function NatureLogoPreview({ design, animation, paused }: { design: BrandLogo; animation: LogoAnimation; paused: boolean }) {
  const host = useRef<HTMLDivElement>(null), time = useRef(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (query?.matches) setPlaying(false);
    const update = () => { if (query?.matches) setPlaying(false); };
    query?.addEventListener?.("change", update);
    return () => query?.removeEventListener?.("change", update);
  }, []);
  useEffect(() => {
    if (host.current) host.current.innerHTML = animatedLogoSvg(design, animation, time.current);
    if (!playing || paused || !window.requestAnimationFrame) return;
    let request = 0, previous = 0, painted = 0;
    const tick = (now: number) => {
      if (previous && document.visibilityState !== "hidden") time.current += Math.min(.15, (now - previous) / 1000);
      previous = now;
      if (now - painted >= 62.5 && host.current && document.visibilityState !== "hidden") {
        host.current.innerHTML = animatedLogoSvg(design, animation, time.current);
        painted = now;
      }
      request = window.requestAnimationFrame(tick);
    };
    request = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(request);
  }, [design, animation, playing, paused]);
  return <>
    <div className="brand-logo-preview nature-logo-frame" role="img" aria-label="Animated nature logo preview" ref={host} dangerouslySetInnerHTML={{ __html: animatedLogoSvg(design, animation, 0) }}/>
    <button type="button" className="secondary" aria-pressed={playing} disabled={paused} onClick={() => setPlaying(value => !value)}>{playing ? "Pause animation preview" : "Play animation preview"}</button>
  </>;
}
