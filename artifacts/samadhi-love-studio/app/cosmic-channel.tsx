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
export function CosmicChannel() {
  return <aside className="cosmic-frame" aria-label={`${affirmations.join(". ")}. ${wayHome}`}>
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
  </aside>;
}

export function DivineSpark() {
  return <section className="divine-spark about-samadhi welcome-samadhi" aria-label="Welcome to SAMADHI LOVE">
    <div className="welcome-cosmos" aria-hidden="true">
      <span className="welcome-ringed-planet"/>
      <svg className="welcome-earth" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="welcome-ocean" cx=".28" cy=".25" r=".8"><stop stopColor="#7ce7ee"/><stop offset=".4" stopColor="#187ea8"/><stop offset="1" stopColor="#06152d"/></radialGradient>
          <radialGradient id="welcome-night" cx=".25" cy=".2" r=".8"><stop offset=".25" stopColor="#071322" stopOpacity="0"/><stop offset="1" stopColor="#010811" stopOpacity=".92"/></radialGradient>
          <clipPath id="welcome-globe"><circle cx="60" cy="60" r="51"/></clipPath>
        </defs>
        <circle cx="60" cy="60" r="55" fill="#68d8ff" fillOpacity=".07"/>
        <g clipPath="url(#welcome-globe)">
          <circle cx="60" cy="60" r="51" fill="url(#welcome-ocean)"/>
          <path d="m51 12 11 3 3 8 12 2 6 7 16-2 14 14-13 8-12-5-9 4-3 10-8 1-6-7-8-1-8-10-9 1-2-7 12-6-3-7 7-4ZM48 48l14 2 8 8 12 2 4 10-10 8-4 17-9 10-7-11-2-14-8-7-5-14ZM23 10l8 5-5 12-8 5-3-12Z" fill="#83b18c"/>
          <path d="M17 40c17-12 24-3 36-7s18-7 33-3M28 78c15 9 20 2 31 7m16-34c11 2 17 10 29 7" stroke="#e0f8fa" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="60" cy="60" r="51" fill="url(#welcome-night)"/>
        </g>
        <circle cx="60" cy="60" r="51" stroke="#b3f3ff" strokeOpacity=".42"/>
      </svg>
    </div>
    <div className="welcome-note-field" aria-hidden="true">{["♪", "♫", "♬", "♩", "♫", "♪", "♬", "♬", "♩", "♪", "♫", "♬", "♫", "♪"].map((note, index) => <span key={index}>{note}</span>)}</div>
    <div className="about-samadhi-copy">
      <h2 className="glitter-words">Welcome to SAMADHI LOVE</h2>
      <div className="welcome-message"><Geometry/><p>A UNIQUE CREATIVE PLATFORM WHERE MUSIC, POSITIVE VIBES AND FREQUENCY MEET</p><Geometry variant={1}/></div>
      <p className="welcome-soul"><span aria-hidden="true">♫ ✧ </span>❨ Music is for the soul ❩<span aria-hidden="true"> ✧ ♫</span></p>
    </div>
  </section>;
}
