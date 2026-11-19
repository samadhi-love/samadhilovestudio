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
  const top = id("top"), belly = id("belly"), plate = id("plate"), spec = id("spec"), wake = id("wake"), core = id("core"), haze = id("haze"), soft = id("soft");
  const one = variant === 1;
  return <svg className={`vs-ship vs-ship-${variant}`} viewBox="0 0 120 30" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={top} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9e2cf"/><stop offset=".22" stopColor="#8f949c"/><stop offset=".55" stopColor="#4a515c"/><stop offset="1" stopColor="#1c222b"/></linearGradient>
      <linearGradient id={belly} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b323c"/><stop offset="1" stopColor="#090c12"/></linearGradient>
      <linearGradient id={plate} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3a414b"/><stop offset=".6" stopColor="#6d727a"/><stop offset="1" stopColor="#2a3039"/></linearGradient>
      <linearGradient id={spec} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff4d8" stopOpacity="0"/><stop offset=".55" stopColor="#fff4d8" stopOpacity=".9"/><stop offset="1" stopColor="#ffe3a6" stopOpacity="0"/></linearGradient>
      <linearGradient id={wake} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#bfefff" stopOpacity=".7"/><stop offset=".25" stopColor="#5fb8ff" stopOpacity=".35"/><stop offset="1" stopColor="#3a6cff" stopOpacity="0"/></linearGradient>
      <radialGradient id={core} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffffff"/><stop offset=".35" stopColor="#d8f6ff"/><stop offset=".7" stopColor="#5cc8ff" stopOpacity=".6"/><stop offset="1" stopColor="#2a6dff" stopOpacity="0"/></radialGradient>
      <filter id={haze} x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation=".18"/><feColorMatrix type="saturate" values=".75"/></filter>
      <filter id={soft} x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation=".7"/></filter>
    </defs>
    <g className="vs-ship-bank">
      <g className="vs-ship-wake" filter={`url(#${soft})`}>
        <path d={one ? "M-30 13.6 31 12.9 31 15.1-30 14.4Z" : "M-34 14.6 33 14.1 33 15.9-34 15.4Z"} fill={`url(#${wake})`}/>
        {one && <path d="M-18 17.1 31 16.6 31 18-18 17.5Z" fill={`url(#${wake})`} opacity=".7"/>}
      </g>
      <g filter={`url(#${haze})`}>
        {one ? <>
          <path d="M33 16 40 21 74 22.4 96 19 110 16 96 17.6 70 18.6Z" fill={`url(#${belly})`}/>
          <path d="M31 12.2 40 8.6 62 7.6 80 8.4 98 12.4 110 16 96 17.6 70 18.6 40 18.4 31 17.6Z" fill={`url(#${top})`}/>
          <path d="M44 8.4 58 5.4 70 5.8 76 8.2 60 8.8Z" fill={`url(#${plate})`}/>
          <path d="M48 19.8 60 24.6 70 24.2 66 21Z" fill="#141920"/>
          <path d="M52 5.6 54 1.6 57 1.6 58 5.4Z" fill="#3b424c"/>
          <path d="M86 9.6 89 3.4M89 3.4 92 3.6" stroke="#9aa1aa" strokeWidth=".35" fill="none"/>
          <circle cx="92.4" cy="3.6" r=".7" fill="none" stroke="#c9ccd1" strokeWidth=".3"/>
          <rect x="36" y="13" width="4" height="3.8" rx=".4" fill="#20262e" stroke="#7e858e" strokeWidth=".2"/>
          <path d="M31 13.2V17M34 12.8V17.4" stroke="#0a0d12" strokeWidth=".6"/>
          <g className="vs-ship-seams" stroke="#11161c" strokeWidth=".22" fill="none" opacity=".8">
            <path d="M46 8.4V18.4M58 7.8V18.6M72 8V18.6M84 9.8V18.2M96 12.2V17.6M40 13H98M64 15.6H90"/>
            <path d="M50 10.5h4M66 10.6h3M76 12h5" strokeOpacity=".6"/>
          </g>
          <path d="M40 8.7 62 7.7 80 8.5 98 12.4" stroke={`url(#${spec})`} strokeWidth=".35" fill="none"/>
          <path d="M45 5.6 58 5.5 70 5.8" stroke="#fff1cf" strokeOpacity=".55" strokeWidth=".25" fill="none"/>
          <path d="M62 11.2h1.2M64 11.2h1.2M66 11.2h1.2" stroke="#e3c27a" strokeOpacity=".7" strokeWidth=".3"/>
          <g className="vs-ship-engines"><ellipse cx="31.2" cy="14" rx="1.6" ry="1.1" fill={`url(#${core})`}/><ellipse cx="31.2" cy="17.2" rx="1.1" ry=".8" fill={`url(#${core})`}/></g>
        </> : <>
          <path d="M34 15.6 70 18.4 94 17 116 15.4 94 16.6 70 17.2Z" fill={`url(#${belly})`}/>
          <path d="M33 13 46 11.4 72 11.2 94 12.8 116 15.4 94 16.6 70 17.2 46 17.4 33 16.8Z" fill={`url(#${top})`}/>
          <path d="M48 11.3 56 8 68 8.2 72 11.2Z" fill={`url(#${plate})`}/>
          <path d="M40 16.8 46 21.4 54 21.2 52 17.2Z" fill="#141920"/>
          <path d="M74 11.4 104 13.6" stroke="#aab0b8" strokeWidth=".3"/>
          <path d="M60 8.1 62 3.8 63 3.8 63.4 8.1Z" fill="#3b424c"/>
          <circle cx="82" cy="14.6" r=".9" fill="none" stroke="#8d939b" strokeWidth=".25"/>
          <g className="vs-ship-seams" stroke="#11161c" strokeWidth=".2" fill="none" opacity=".8">
            <path d="M44 11.6V17.4M56 11.2V17.4M68 11.2V17.2M80 12V16.9M92 12.7V16.6M36 14.4H100"/>
          </g>
          <path d="M46 11.5 72 11.3 94 12.9 112 15" stroke={`url(#${spec})`} strokeWidth=".3" fill="none"/>
          <path d="M50 13h14" stroke="#e3c27a" strokeOpacity=".5" strokeWidth=".3"/>
          <g className="vs-ship-engines"><ellipse cx="33.3" cy="15" rx="1.5" ry="1.1" fill={`url(#${core})`}/></g>
        </>}
      </g>
      <circle className="vs-nav vs-nav-red" cx={one ? 66 : 50} cy={one ? 24 : 21} r=".55"/>
      <circle className="vs-nav vs-nav-green" cx={one ? 66 : 62} cy={one ? 5.6 : 4} r=".55"/>
      <circle className="vs-nav vs-nav-white" cx={one ? 109 : 115} cy={one ? 16 : 15.4} r=".5"/>
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
