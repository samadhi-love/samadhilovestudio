"use client";
/**
 * The Create (main) page's cosmic home: a welcome hero above the song box, the
 * story of the studio below it, and a decorative sky (planets, notes, streaks,
 * sayings) behind everything. Decoration is aria-hidden, never clickable, and
 * stills itself for people who ask their device for reduced motion.
 */
import { useEffect, useState } from "react";
import "./cosmic-home.css";

export const homeQuotes = [
  { text: "Where words fail, music speaks.", by: "Hans Christian Andersen" },
  { text: "Every soul carries a song. We help it land.", by: "SAMADHI LOVE" },
  { text: "There is geometry in the humming of the strings, there is music in the spacing of the spheres.", by: "attributed to Pythagoras" },
  { text: "From silence, a frequency. From frequency, a song.", by: "SAMADHI LOVE" },
  { text: "Music expresses that which cannot be said and on which it is impossible to be silent.", by: "Victor Hugo" },
] as const;

export const homeWorlds = [
  { id: "cosmic", glyph: "✶", name: "Cosmic Devotion", line: "Choirs, drones and starlight for songs to the infinite.", idea: "A devotional song to the light inside every star", styles: ["Devotional", "Ambient"] },
  { id: "mantra", glyph: "ॐ", name: "Mantra & Meditation", line: "Slow, breathing, repeating. Room for the silence between.", idea: "A peaceful mantra for morning meditation", styles: ["Meditation"] },
  { id: "gospel", glyph: "✧", name: "Gospel Light", line: "Big voices, warm organ, a chorus that lifts the room.", idea: "A gospel song of gratitude for a new morning", styles: ["Gospel"] },
  { id: "afro", glyph: "☀", name: "Afro Sun", line: "Joyful rhythm, bright guitars, feet that cannot stay still.", idea: "An Afrobeats celebration of family and home", styles: ["Afrobeats"] },
  { id: "soul", glyph: "♥", name: "Love & Soul", line: "Tender, honest, made to be sung to someone.", idea: "A soulful love song about finding each other again", styles: ["Soul", "R&B"] },
  { id: "urban", glyph: "◆", name: "Urban Soul", line: "Hip hop flow with heart and a message that hits.", idea: "A hip hop track about rising above the noise", styles: ["Hip Hop"] },
  { id: "ocean", glyph: "≈", name: "Ocean Ambient", line: "Waves, pads and space. Music to float in.", idea: "An ambient song that sounds like the ocean at night", styles: ["Ambient"] },
  { id: "celebrate", glyph: "✺", name: "Celebration", line: "Birthdays, weddings, victories. Songs for the big days.", idea: "A happy birthday song for my mother", styles: ["Pop"] },
  { id: "kids", glyph: "✿", name: "Kids & Family", line: "Sing-alongs, lullabies and learning songs, sung by warm, friendly grown-up voices.", idea: "A happy sing-along song for kids about the colors of the rainbow", styles: ["Children's", "Pop"] },
] as const;
export type HomeWorld = typeof homeWorlds[number];

const wisdom = [
  { text: "Without music, life would be a mistake.", by: "Friedrich Nietzsche" },
  { text: "Where words fail, music speaks.", by: "Hans Christian Andersen" },
  { text: "Music expresses that which cannot be said and on which it is impossible to be silent.", by: "Victor Hugo" },
  { text: "There is geometry in the humming of the strings, there is music in the spacing of the spheres.", by: "attributed to Pythagoras" },
  { text: "You do not need to know music to make it. You only need to feel something true.", by: "SAMADHI LOVE" },
  { text: "A song is a prayer that learned to dance.", by: "SAMADHI LOVE" },
];
const riverA = ["LOVE", "LIGHT", "UNITY", "HARMONY", "FREQUENCY", "SOUL", "BREATH", "RHYTHM", "GRACE", "COSMOS"];
const riverB = ["SING", "FEEL", "CREATE", "SHINE", "HEAL", "DANCE", "DREAM", "RISE", "SHARE", "BELONG"];
const sayings = [
  { text: "Listen within. The song is already there.", side: "left", top: "9%" },
  { text: "Every heartbeat is a drum.", side: "right", top: "6%" },
  { text: "As above, so below. As within, so the melody.", side: "left", top: "42%" },
  { text: "You are the instrument the universe plays.", side: "right", top: "55%" },
  { text: "Breathe. Begin. Belong.", side: "left", top: "78%" },
] as const;
const noteGlyphs = ["♪", "♫", "♬", "♩", "𝄞"];
const noteSpots = [[1, 7], [97, 5], [2, 18], [96, 16], [1.5, 31], [97.5, 29], [0.5, 44], [96.5, 41], [2, 57], [97, 54], [1, 69], [96, 66], [2.5, 82], [97.5, 80], [1, 93], [96, 91]] as const;

function River({ words, tone }: { words: readonly string[]; tone: "gold" | "rose" }) {
  const line = words.map(w => `${w}  ✧  `).join("");
  return <div className={`cosmic-home-river cosmic-home-river--${tone}`} aria-hidden="true"><div>{line}{line}</div></div>;
}
function Wave() {
  const crest = (dy: number, step: number) => {
    let d = `M0 40 Q ${step / 2} ${40 + dy} ${step} 40`;
    for (let x = step * 2; x <= 1200; x += step) d += ` T ${x} 40`;
    return d;
  };
  return <svg className="cosmic-home-wave" aria-hidden="true" focusable="false" viewBox="0 0 1200 80" preserveAspectRatio="none">
    <path d={crest(-36, 74)} stroke="#ffd27a" strokeWidth="2.5"/>
    <path d={crest(30, 74)} stroke="#ff9fe6" strokeWidth="2" opacity=".8"/>
    <path d={crest(-20, 37)} stroke="#7fe9ff" strokeWidth="1.5" opacity=".7"/>
  </svg>;
}

/** Decoration behind the whole main page. */
export function CosmicHomeSky() {
  return <div className="cosmic-home-sky" aria-hidden="true" data-testid="cosmic-home-sky">
    <span className="cosmic-home-streak s1"/><span className="cosmic-home-streak s2"/><span className="cosmic-home-streak s3"/><span className="cosmic-home-streak s4"/>
    <span className="cosmic-home-shoot t1"/><span className="cosmic-home-shoot t2"/><span className="cosmic-home-shoot t3"/>
    <span className="cosmic-home-planet p-gold"><i/></span>
    <span className="cosmic-home-planet p-violet"/>
    <span className="cosmic-home-planet p-moon"/>
    <span className="cosmic-home-planet p-rose"><i/></span>
    <span className="cosmic-home-planet p-mint"/>
    <svg className="cosmic-home-lyre" viewBox="0 0 160 120" focusable="false">
      <path d="M20 100 L40 30 L80 12 L120 30 L140 100 M40 30 L60 70 L100 70 L120 30" fill="none"/>
      {[[20, 100], [40, 30], [80, 12], [120, 30], [140, 100], [60, 70], [100, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 2 ? 3 : 2.3}/>)}
    </svg>
    {noteSpots.map(([x, y], i) => <span key={i} className="cosmic-home-note" style={{ left: `${x}%`, top: `${y}%`, fontSize: 20 + (i * 7) % 24, animationDelay: `${((i * 1.3) % 9).toFixed(1)}s`, animationDuration: `${9 + (i % 5) * 2}s` }} data-tone={i % 6}>{noteGlyphs[i % noteGlyphs.length]}</span>)}
    {sayings.map((s, i) => <p key={i} className={`cosmic-home-saying ${s.side}`} style={{ top: s.top, animationDelay: `${i * 1.4}s` }} data-tone={i % 5}>{s.text}</p>)}
  </div>;
}

/** The welcome above the song box. */
export function CosmicHomeHero({ begin, video }: { begin: () => void; video: () => void }) {
  const [quote, setQuote] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    // Moving text pauses on hover or focus, and never moves for reduced-motion users.
    if (paused || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setQuote(q => (q + 1) % homeQuotes.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused]);
  const current = homeQuotes[quote];
  return <section className="cosmic-home-hero" aria-labelledby="cosmic-home-slogan" data-testid="cosmic-home-hero"
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <span className="cosmic-home-iam top" aria-hidden="true">I AM</span>
    <span className="cosmic-home-iam bottom" aria-hidden="true">I AM</span>
    <svg className="cosmic-home-flower" aria-hidden="true" focusable="false" viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="90"/><circle cx="100" cy="100" r="60"/><circle cx="100" cy="100" r="30"/>
      {[[100, 70], [100, 130], [126, 85], [74, 85], [126, 115], [74, 115]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="30"/>)}
    </svg>
    <p className="cosmic-home-eyebrow">SAMADHI LOVE · Versual Studio</p>
    <h2 id="cosmic-home-slogan" className="cosmic-home-slogan">Your song. Your world. Your video.</h2>
    <p className="cosmic-home-lede">Make real, full-length songs even if you have never written one. Then turn them into full-length lyric videos from scratch, every word timed to the voice. No experience needed. Just you and the universe.</p>
    <figure className="cosmic-home-quote" key={quote}>
      <blockquote>“{current.text}”</blockquote>
      <figcaption>— {current.by}</figcaption>
    </figure>
    <div className="cosmic-home-actions">
      <button type="button" className="cosmic-home-cta gold" data-testid="button-home-begin" onClick={begin}>✦ Begin a song</button>
      <button type="button" className="cosmic-home-cta cyan" data-testid="button-home-video" onClick={video}>▶ Make a lyric video</button>
    </div>
  </section>;
}

/** What the studio is, its worlds and its wisdom, below the song box. */
export function CosmicHomeStory({ pickWorld }: { pickWorld: (world: HomeWorld) => void }) {
  return <div className="cosmic-home-story" data-testid="cosmic-home-story">
    <Wave/>
    <section aria-labelledby="cosmic-home-what" className="cosmic-home-block">
      <p className="cosmic-home-kicker cyan">What this studio is</p>
      <h2 id="cosmic-home-what">From a feeling to a finished video</h2>
      <div className="cosmic-home-pillars">
        <article className="rose"><span aria-hidden="true">✿</span><h3>1 · Dream it</h3><p>Describe a feeling in your own words. The studio writes the lyrics and maps the song for you: Verse, Pre-Chorus, Chorus, Bridge, Outro. Nothing to learn.</p></article>
        <article className="gold"><span aria-hidden="true">♫</span><h3>2 · Hear it</h3><p>Full songs, not clips. Two versions to choose from, and a length that fits the spirit: a mantra breathes longer, a dance song moves faster.</p></article>
        <article className="cyan"><span aria-hidden="true">▶</span><h3>3 · See it</h3><p>A full-length lyric video from scratch, every word timed to the voice. Bring your own song or use one made here, pick a vibe, and download for YouTube, Reels or TikTok.</p></article>
      </div>
    </section>
    <River words={riverA} tone="gold"/>
    <section aria-labelledby="cosmic-home-worlds" className="cosmic-home-block">
      <p className="cosmic-home-kicker gold">Choose a world</p>
      <h2 id="cosmic-home-worlds">Every song lives somewhere</h2>
      <p className="cosmic-home-intro">Tap a world and it fills your song box with a starting idea and style. You can change anything.</p>
      <div className="cosmic-home-worlds">
        {homeWorlds.map(world => <button key={world.id} type="button" className="cosmic-home-world" data-world={world.id} data-testid={`button-world-${world.id}`} onClick={() => pickWorld(world)}>
          <span aria-hidden="true" className="glyph">{world.glyph}</span><strong>{world.name}</strong><span>{world.line}</span>
        </button>)}
      </div>
    </section>
    <River words={riverB} tone="rose"/>
    <section aria-labelledby="cosmic-home-wisdom" className="cosmic-home-wisdom">
      <h2 id="cosmic-home-wisdom">Words from the music of the spheres</h2>
      <div>{wisdom.map((w, i) => <figure key={i} data-tone={i % 6}><blockquote>“{w.text}”</blockquote><figcaption>— {w.by}</figcaption></figure>)}</div>
    </section>
    <Wave/>
  </div>;
}
