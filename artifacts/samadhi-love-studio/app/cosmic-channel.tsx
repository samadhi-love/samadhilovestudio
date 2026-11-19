"use client";
import { useEffect, useId } from "react";
import "./divine-spark-banner.css";
const affirmations = ["I AM THE SOUL.", "I AM THE LIGHT DIVINE.", "I AM LOVE", "I AM WILL", "I AM FIXED DESIGN", "I AM THE MONAD", "I AM THE LIGHT DIVINE", "I AM LOVE", "I AM WILL", "I AM FIXED DESIGN"];

function Geometry({ variant = 0 }: { variant?: number }) {
  return <svg className="sacred-symbol" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    <circle cx="20" cy="20" r="18"/>
    {variant % 3 === 0 ? <>{[0,60,120,180,240,300].map(angle => <circle key={angle} cx="20" cy="12" r="8" transform={`rotate(${angle} 20 20)`}/>)}<circle cx="20" cy="20" r="8"/></> : variant % 3 === 1 ? <><path d="M20 3 35 29H5ZM20 37 5 11H35Z"/><circle cx="20" cy="20" r="10"/></> : <><path d="M20 2 38 20 20 38 2 20ZM7 7H33V33H7Z"/><circle cx="20" cy="20" r="12"/></>}
  </svg>;
}

function Mantra() {
  return <>{affirmations.map((words, i) => <span className="mantra-piece" key={i}><span className="glitter-words">{words}</span><Geometry variant={i}/></span>)}</>;
}

const wayHome = "The way back home is by awakening the Divine spark in us—I AM THE WAY -,THE LOVE,THE SPARK ,THE LIGHT";
/** Independent rails keep every lyric upright and geometry on the sides. */
type Star = readonly [number, number, number];
/* Fixed, rounded coordinates (viewBox 0 0 100 100); the corner sits at 0,0. */
const constellationStars: readonly Star[] = [[8, 10, 2.4], [30, 18, 1.6], [52, 12, 2], [70, 30, 1.4], [46, 42, 2.2], [24, 52, 1.5], [62, 60, 1.8]];
const constellationLinks: readonly (readonly [number, number])[] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1], [4, 5], [4, 6]];
const constellationDust: readonly Star[] = [[16, 30, .7], [40, 28, .6], [84, 16, .8], [12, 74, .6], [78, 46, .7], [36, 70, .5], [90, 70, .6], [58, 84, .5]];

function Constellation({ corner }: { corner: "nw" | "ne" | "sw" | "se" }) {
  return <svg className={`vs-constellation vs-constellation-${corner}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <g className="vs-const-lines">{constellationLinks.map(([a, b]) => <line key={`${a}-${b}`} x1={constellationStars[a][0]} y1={constellationStars[a][1]} x2={constellationStars[b][0]} y2={constellationStars[b][1]}/>)}</g>
    <g className="vs-const-dust">{constellationDust.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r}/>)}</g>
    <g className="vs-const-stars">{constellationStars.map(([x, y, r], i) => <circle key={i} className={`vs-star-${i}`} cx={x} cy={y} r={r}/>)}</g>
  </svg>;
}

function Spacecraft({ variant }: { variant: 1 | 2 }) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `vs-ship-${name}-${uid}`;
  const lit = id("lit"), shade = id("shade"), wing = id("wing"), core = id("core"), glow = id("glow"), haze = id("haze");
  const one = variant === 1;
  /* Angular hulls seen from slightly above, nose to the right, lit by starlight from the top. */
  return <svg className={`vs-ship vs-ship-${variant}`} viewBox="0 0 120 40" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={lit} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3ecd8"/><stop offset=".35" stopColor="#9aa1ab"/><stop offset=".5" stopColor="#5b6370"/><stop offset="1" stopColor="#1a1f28"/></linearGradient>
      <linearGradient id={shade} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a414c"/><stop offset="1" stopColor="#0a0d13"/></linearGradient>
      <linearGradient id={wing} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#7b828c"/><stop offset="1" stopColor="#262c35"/></linearGradient>
      <radialGradient id={core}><stop offset="0" stopColor="#ffffff"/><stop offset=".4" stopColor="#c9f3ff"/><stop offset="1" stopColor="#3aa0ff" stopOpacity="0"/></radialGradient>
      <linearGradient id={glow} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#9fe6ff" stopOpacity=".55"/><stop offset="1" stopColor="#3a6cff" stopOpacity="0"/></linearGradient>
      <filter id={haze} x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation=".15"/></filter>
    </defs>
    <g className="vs-ship-bank">
      <g className="vs-ship-wake">
        {one ? <><path d="M4 17.2 20 16.4 20 18.4Z" fill={`url(#${glow})`}/><path d="M4 22.8 20 21.6 20 23.6Z" fill={`url(#${glow})`}/></>
          : <path d="M2 20 22 18.8 22 21.2Z" fill={`url(#${glow})`}/>}
      </g>
      <g filter={`url(#${haze})`}>
        {one ? <>
          <path d="M70 15 44 3 34 3.6 50 14.2Z" fill={`url(#${wing})`}/>
          <path d="M70 25 44 37 34 36.4 50 25.8Z" fill={`url(#${shade})`}/>
          <path d="M118 20 92 16.6 64 14.6 36 14 22 15.4 20 20 22 24.6 36 26 64 25.4 92 23.4Z" fill={`url(#${lit})`}/>
          <path d="M118 20 92 23.4 64 25.4 36 26 22 24.6 20 20Z" fill="#0d1118" opacity=".55"/>
          <path d="M100 18.4 110 19.4 100 20.2Z" fill="#ffe6a6" opacity=".85"/>
          <path d="M36 14 64 14.6 92 16.6 112 19.2" stroke="#fff4d8" strokeOpacity=".7" strokeWidth=".35" fill="none"/>
          <g stroke="#0b0f15" strokeWidth=".25" opacity=".75"><path d="M48 14.3V25.7M62 14.6V25.4M78 15.6V24.4M30 14.3V25.7M36 20H92"/></g>
          <rect x="17.6" y="15.6" width="3" height="3.4" fill="#1a1f27"/><rect x="17.6" y="21" width="3" height="3.4" fill="#1a1f27"/>
          <g className="vs-ship-engines"><ellipse cx="17.8" cy="17.3" rx="2.2" ry="1.4" fill={`url(#${core})`}/><ellipse cx="17.8" cy="22.7" rx="2.2" ry="1.4" fill={`url(#${core})`}/></g>
        </> : <>
          <path d="M78 17 60 8 54 8.4 64 16.4Z" fill={`url(#${wing})`}/>
          <path d="M78 23 60 32 54 31.6 64 23.6Z" fill={`url(#${shade})`}/>
          <path d="M116 20 100 17.4 80 16.6 60 16.4 40 16.8 24 17.6 22 20 24 22.4 40 23.2 60 23.6 80 23.4 100 22.6Z" fill={`url(#${lit})`}/>
          <path d="M116 20 100 22.6 80 23.4 60 23.6 40 23.2 24 22.4 22 20Z" fill="#0d1118" opacity=".55"/>
          <ellipse cx="46" cy="20" rx="2.6" ry="6.4" fill="none" stroke="#8c939d" strokeWidth=".7"/>
          <path d="M40 16.8 60 16.4 80 16.6 100 17.4 112 19.4" stroke="#fff4d8" strokeOpacity=".65" strokeWidth=".3" fill="none"/>
          <path d="M100 19 108 19.7 100 20.4Z" fill="#ffe6a6" opacity=".8"/>
          <g stroke="#0b0f15" strokeWidth=".22" opacity=".75"><path d="M56 16.5V23.5M70 16.5V23.5M86 16.9V23.1M32 17.2V22.8"/></g>
          <g className="vs-ship-engines"><ellipse cx="21.6" cy="20" rx="2.4" ry="1.6" fill={`url(#${core})`}/></g>
        </>}
      </g>
      <circle className="vs-nav vs-nav-red" cx={one ? 34.4 : 54.4} cy={one ? 36.2 : 31.4} r=".6"/>
      <circle className="vs-nav vs-nav-green" cx={one ? 34.4 : 54.4} cy={one ? 3.8 : 8.6} r=".6"/>
      <circle className="vs-nav vs-nav-white" cx={one ? 117.4 : 115.4} cy="20" r=".5"/>
    </g>
  </svg>;
}

/** Living deep-space backdrop and corner constellations; purely decorative. */
function CosmicSky() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => { if (document.hidden) root.setAttribute("data-vs-sky-paused", ""); else root.removeAttribute("data-vs-sky-paused"); };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => { document.removeEventListener("visibilitychange", sync); root.removeAttribute("data-vs-sky-paused"); };
  }, []);
  return <>
    <div className="vs-sky" aria-hidden="true">
      <div className="vs-nebula vs-nebula-a"/><div className="vs-nebula vs-nebula-b"/><div className="vs-nebula vs-nebula-c"/><div className="vs-nebula vs-nebula-d"/>
      <div className="vs-stars vs-stars-far"/><div className="vs-stars vs-stars-mid"/><div className="vs-stars vs-stars-near"/>
      <div className="vs-shooting"/>
      <div className="vs-ship-route vs-route-1"><Spacecraft variant={1}/></div>
      <div className="vs-ship-route vs-route-2"><Spacecraft variant={2}/></div>
    </div>
    <div className="vs-constellations" aria-hidden="true">
      {(["nw", "ne", "sw", "se"] as const).map(corner => <Constellation key={corner} corner={corner}/>)}
    </div>
  </>;
}

export function CosmicChannel() {
  return <><CosmicSky/><aside className="cosmic-frame" aria-label={`${affirmations.join(". ")}. ${wayHome}`}>
    {["top", "bottom"].map(side => <div key={side} className={`frame-rail frame-${side}`} aria-hidden="true">
      <div className="frame-lyric-track"><div className="frame-lyric-group">
        {side === "top" ? <Mantra/> : <><Geometry variant={1}/><span className="glitter-words">{wayHome}</span><Geometry variant={2}/></>}
      </div></div>
    </div>)}
    {["left", "right"].map(side => <div key={side} className={`frame-rail frame-${side}`} aria-hidden="true">
      <div className="frame-geometry-track">{[0, 1].map(copy => <div className="frame-geometry-group" key={copy}>
        {[0,1,2,0,1,2,0].map((variant, index) => <Geometry key={index} variant={variant}/>)}
      </div>)}</div>
    </div>)}
  </aside></>;
}

export function DivineSpark({ variant }: { variant?: "banner" } = {}) {
  const uid = useId().replace(/:/g, "");
  const banner = variant === "banner";
  const ocean = `welcome-ocean-${uid}`, night = `welcome-night-${uid}`, globe = `welcome-globe-${uid}`, headingId = `welcome-heading-${uid}`;
  const notes = banner ? ["♪", "♫", "♬", "♩"] : ["♪", "♫", "♬", "♩", "♫", "♪", "♬", "♬", "♩", "♪", "♫", "♬", "♫", "♪"];
  return <section className={`divine-spark about-samadhi welcome-samadhi${banner ? " divine-spark--banner" : ""}`} aria-labelledby={headingId}>
    <div className="welcome-cosmos" aria-hidden="true">
      <span className="welcome-ringed-planet"/>
      <svg className="welcome-earth" viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={ocean} cx=".28" cy=".25" r=".8"><stop stopColor="#7ce7ee"/><stop offset=".4" stopColor="#187ea8"/><stop offset="1" stopColor="#06152d"/></radialGradient>
          <radialGradient id={night} cx=".25" cy=".2" r=".8"><stop offset=".25" stopColor="#071322" stopOpacity="0"/><stop offset="1" stopColor="#010811" stopOpacity=".92"/></radialGradient>
          <clipPath id={globe}><circle cx="60" cy="60" r="51"/></clipPath>
        </defs>
        <circle cx="60" cy="60" r="55" fill="#68d8ff" fillOpacity=".07"/>
        <g clipPath={`url(#${globe})`}>
          <circle cx="60" cy="60" r="51" fill={`url(#${ocean})`}/>
          <path d="m51 12 11 3 3 8 12 2 6 7 16-2 14 14-13 8-12-5-9 4-3 10-8 1-6-7-8-1-8-10-9 1-2-7 12-6-3-7 7-4ZM48 48l14 2 8 8 12 2 4 10-10 8-4 17-9 10-7-11-2-14-8-7-5-14ZM23 10l8 5-5 12-8 5-3-12Z" fill="#83b18c"/>
          <path d="M17 40c17-12 24-3 36-7s18-7 33-3M28 78c15 9 20 2 31 7m16-34c11 2 17 10 29 7" stroke="#e0f8fa" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="60" cy="60" r="51" fill={`url(#${night})`}/>
        </g>
        <circle cx="60" cy="60" r="51" stroke="#b3f3ff" strokeOpacity=".42"/>
      </svg>
    </div>
    <div className="welcome-note-field" aria-hidden="true">{notes.map((note, index) => <span key={index}>{note}</span>)}</div>
    <div className="about-samadhi-copy">
      <h2 id={headingId} className="glitter-words">Welcome to SAMADHI LOVE</h2>
      <div className="welcome-message"><Geometry/><p>A UNIQUE CREATIVE PLATFORM WHERE MUSIC, POSITIVE VIBES AND FREQUENCY MEET</p><Geometry variant={1}/></div>
      <p className="welcome-soul">♫ ✧ ❨ Music is for the soul ❩ ✧ ♫</p>
    </div>
  </section>;
}
