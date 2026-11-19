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
  const metal = id("metal"), dome = id("dome"), rim = id("rim"), belly = id("belly"), core = id("core"), top = id("top"), side = id("side"), haze = id("haze");
  const defs = <defs>
    <linearGradient id={metal} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2f4f6"/><stop offset=".45" stopColor="#a9b0b9"/><stop offset="1" stopColor="#4a525d"/></linearGradient>
    <radialGradient id={dome} cx=".38" cy=".25" r=".85"><stop offset="0" stopColor="#ffffff"/><stop offset=".35" stopColor="#c3cad3"/><stop offset="1" stopColor="#3f4752"/></radialGradient>
    <linearGradient id={rim} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5d6570"/><stop offset=".35" stopColor="#e9edf1"/><stop offset=".6" stopColor="#b8bfc8"/><stop offset="1" stopColor="#4d5560"/></linearGradient>
    <linearGradient id={belly} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6f7782"/><stop offset="1" stopColor="#262c35"/></linearGradient>
    <radialGradient id={core}><stop offset="0" stopColor="#ffffff"/><stop offset=".35" stopColor="#fff3cf"/><stop offset="1" stopColor="#ffd27a" stopOpacity="0"/></radialGradient>
    <linearGradient id={top} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9aa3b4"/><stop offset=".6" stopColor="#6c7588"/><stop offset="1" stopColor="#4a5265"/></linearGradient>
    <linearGradient id={side} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3e4558"/><stop offset="1" stopColor="#171b26"/></linearGradient>
    <filter id={haze} x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation=".12"/></filter>
  </defs>;
  if (variant === 1) {
    /* Classic metallic flying saucer, seen slightly from below, with a ring of lights. */
    return <svg className="vs-ship vs-ship-1" viewBox="0 0 120 50" aria-hidden="true" focusable="false">{defs}
      <g className="vs-ship-bank" filter={`url(#${haze})`}>
        <path d="M44 21 C46 9 52 5 60 5 C68 5 74 9 76 21Z" fill={`url(#${dome})`}/>
        <path d="M56 5.6 C57 3.4 63 3.4 64 5.6Z" fill="#d9dee4"/>
        <path d="M49 12 C53 9.6 58 8.8 62 8.8" stroke="#ffffff" strokeOpacity=".7" strokeWidth=".5" fill="none"/>
        <ellipse cx="60" cy="22.5" rx="33" ry="6.5" fill={`url(#${metal})`}/>
        <g fill="#2a313b">{[38, 46, 54, 62, 70, 78].map(x => <ellipse key={x} cx={x + 2} cy={x === 38 || x === 78 ? 21.6 : 20.6} rx="1.5" ry=".9"/>)}</g>
        <ellipse cx="60" cy="27" rx="57" ry="5.6" fill={`url(#${rim})`}/>
        <path d="M5 26.4 C30 22.6 90 22.6 115 26.4" stroke="#ffffff" strokeOpacity=".75" strokeWidth=".45" fill="none"/>
        <ellipse cx="60" cy="30" rx="44" ry="4.6" fill={`url(#${belly})`}/>
        <ellipse cx="60" cy="33.2" rx="19" ry="3.4" fill="#1d222b"/>
        <g className="vs-ship-engines">{[44, 50, 56, 64, 70, 76].map((x, i) => <ellipse key={x} className={`vs-saucer-light vs-saucer-light-${i}`} cx={x} cy={i === 0 || i === 5 ? 33.4 : 34.6} rx="1.5" ry="1" fill={`url(#${core})`}/>)}</g>
      </g>
    </svg>;
  }
  /* Long angular starship cruiser, three-quarter view, nose to the right, twin rear engines. */
  return <svg className="vs-ship vs-ship-2" viewBox="0 0 140 50" aria-hidden="true" focusable="false">{defs}
    <g className="vs-ship-bank">
      <g className="vs-ship-wake"><path d="M2 30 22 27.4 22 32.2Z" fill="#8fdcff" opacity=".35"/><path d="M6 37 26 34.2 26 38.8Z" fill="#8fdcff" opacity=".3"/></g>
      <g filter={`url(#${haze})`}>
        <path d="M22 24 62 15 118 9 138 11 122 19 66 27 30 32Z" fill={`url(#${top})`}/>
        <path d="M30 32 66 27 122 19 117 27 70 35 34 41Z" fill={`url(#${side})`}/>
        <path d="M22 24 30 32 34 41 24 36Z" fill="#232836"/>
        <path d="M44 19 46 11 58 9 62 15Z" fill={`url(#${top})`}/>
        <path d="M46 11 49 5 53 5 58 9Z" fill="#8a93a5"/>
        <path d="M84 13 86 9 94 8 96 12Z" fill="#7a8396"/>
        <path d="M100 7 101 3 102 7" stroke="#b9c1cf" strokeWidth=".35" fill="none"/>
        <path d="M22 24 62 15 118 9 138 11" stroke="#e9eef6" strokeOpacity=".7" strokeWidth=".4" fill="none"/>
        <g stroke="#2b3142" strokeWidth=".25" opacity=".8" fill="none"><path d="M40 21 116 12M48 25 120 16M58 17 64 26M76 15 82 24M96 12 100 21"/></g>
        <g fill="#ffe7b0">{[44, 52, 60, 68, 76, 84, 92, 100, 108].map((x, i) => <rect key={x} x={x} y={r2ship(35.4 - i * 1.6)} width="1.4" height=".6" opacity=".85"/>)}</g>
        <rect x="18" y="26" width="8" height="6" rx="1" fill="#1b1f2a"/><rect x="22" y="33" width="8" height="6" rx="1" fill="#1b1f2a"/>
      </g>
      <g className="vs-ship-engines"><circle cx="20" cy="29" r="3.2" fill={`url(#${core})`}/><circle cx="24" cy="36" r="3.2" fill={`url(#${core})`}/></g>
      <circle className="vs-nav vs-nav-red" cx="34" cy="40.4" r=".6"/>
      <circle className="vs-nav vs-nav-green" cx="58" cy="9.4" r=".6"/>
      <circle className="vs-nav vs-nav-white" cx="137.4" cy="11" r=".5"/>
    </g>
  </svg>;
}
const r2ship = (n: number) => Math.round(n * 100) / 100;

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
