"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Disc3, Play, Sparkles } from "lucide-react";
import { brand } from "../brand";
import { DivineSpark } from "../cosmic-channel";
import { useCommunityResource } from "../community/client";
import { artistHref, communityApi, songHref, type CommunityData, type Release } from "../community/data";
import { CommunityPlayer } from "../community/player";
import "./landing.css";

const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap";
const phrases = brand.slogan.split(/(?<=\.)\s+/).filter(Boolean);
const tones = ["vl-cyan", "vl-violet", "vl-magenta"];

const quotes = [
  ["There is geometry in the humming of the strings, there is music in the spacing of the spheres.", "Pythagoras"],
  ["Music expresses that which cannot be said and on which it is impossible to be silent.", "Victor Hugo"],
  ["Nada Brahma — the whole universe is sound.", "Ancient Vedic teaching"],
  ["The heavenly motions are nothing but a continuous song for several voices.", "Johannes Kepler, Harmonices Mundi, 1619"],
];
const styles = ["Sufi Soul", "Arabic Pop", "Afrobeats", "Mantra", "Oud Fusion", "Ambient", "R&B", "Dabke", "Khaleeji"];
const looks = [
  ["Aurora Silk", "I followed the river of light", "vl-look-a"],
  ["Violet Flame", "Burn slow, burn true", "vl-look-b"],
  ["Sacred Bloom", "Every petal knows the sun", "vl-look-c"],
  ["Star Stories", "We were written in the sky", "vl-look-d"],
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const on = () => setReduced(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return reduced;
}

function OrbitLogo({ size = 38 }: { size?: number }) {
  return <svg className="vl-logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <defs><linearGradient id="vl-lg" x1="0" x2="1"><stop offset="0" stopColor="#7fe9ff"/><stop offset="1" stopColor="#a77bff"/></linearGradient></defs>
    <circle cx="20" cy="20" r="7" fill="url(#vl-lg)"/>
    <ellipse cx="20" cy="20" rx="17" ry="7" fill="none" stroke="url(#vl-lg)" strokeWidth="1.6" transform="rotate(-24 20 20)"/>
    <circle cx="34.5" cy="13.2" r="2.6" fill="#ff5fd2"/>
  </svg>;
}

function Starfield() {
  const stars = Array.from({ length: 90 }, (_, i) => {
    const x = (i * 73.13) % 100, y = (i * 41.7 + (i % 7) * 13) % 100;
    return <i key={i} style={{ left: x + "%", top: y + "%", animationDelay: (i % 11) * 0.43 + "s", width: i % 9 === 0 ? 3 : i % 3 === 0 ? 2 : 1.4, height: i % 9 === 0 ? 3 : i % 3 === 0 ? 2 : 1.4 }}/>;
  });
  return <div className="vl-sky" aria-hidden="true">
    <div className="vl-stars">{stars}</div>
    <span className="vl-neb vl-neb-1"/><span className="vl-neb vl-neb-2"/><span className="vl-neb vl-neb-3"/>
  </div>;
}

function FlowerOfLife() {
  const pts: [number, number][] = [[0, 0]];
  for (let k = 0; k < 6; k++) pts.push([Math.cos(k * Math.PI / 3) * 40, Math.sin(k * Math.PI / 3) * 40]);
  for (let k = 0; k < 6; k++) pts.push([Math.cos(k * Math.PI / 3 + Math.PI / 6) * 69.3, Math.sin(k * Math.PI / 3 + Math.PI / 6) * 69.3]);
  return <svg className="vl-flower" viewBox="-130 -130 260 260" aria-hidden="true">
    {pts.map(([x, y], i) => <circle key={i} cx={Number(x.toFixed(3))} cy={Number(y.toFixed(3))} r="40"/>)}
    <circle r="120"/>
    <polygon points="0,-110 95.3,55 -95.3,55"/><polygon points="0,110 95.3,-55 -95.3,-55"/>
  </svg>;
}

function Bars({ className = "" }: { className?: string }) {
  return <span className={"vl-eq " + className} aria-hidden="true"><i/><i/><i/><i/><i/></span>;
}

function HeroVisual() {
  return <div className="vl-hero-art" aria-label="Illustrative preview of the creative cosmos" role="img">
    <FlowerOfLife/>
    <div className="vl-orbit vl-orbit-1"><span/></div>
    <div className="vl-orbit vl-orbit-2"><span/></div>
    <div className="vl-orbit vl-orbit-3"><span/></div>
    <div className="vl-planet"><Bars className="vl-planet-eq"/></div>
    <div className="vl-float vl-float-a"><small>Now creating</small><strong>Sufi soul × Afrobeats</strong><Bars/></div>
    <div className="vl-float vl-float-b"><small>LYRIC · LIVE</small><em>From the silence comes the light.</em></div>
    <span className="vl-preview-tag">Illustrative preview</span>
  </div>;
}

function Quotes({ reduced }: { reduced: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setI(n => (n + 1) % quotes.length), 6000);
    return () => window.clearInterval(t);
  }, [reduced]);
  if (reduced) return <div className="vl-quotes vl-quotes-static">{quotes.map(([q, a]) =>
    <figure key={a}><blockquote>“{q}”</blockquote><figcaption>{a}</figcaption></figure>)}</div>;
  const [q, a] = quotes[i];
  return <div className="vl-quotes" aria-live="polite">
    <figure key={i} className="vl-quote-in"><blockquote>“{q}”</blockquote><figcaption>{a}</figcaption></figure>
    <div className="vl-dots">{quotes.map((_, n) => <button key={n} type="button" aria-label={"Show quote " + (n + 1)} aria-pressed={n === i} onClick={() => setI(n)}/>)}</div>
  </div>;
}

function StringDiagram() {
  return <svg viewBox="0 0 240 120" className="vl-diagram" aria-hidden="true">
    <line x1="14" y1="60" x2="226" y2="60" className="vl-d-base"/>
    <path className="vl-h vl-wave-1" d="M14 60 Q120 10 226 60 Q120 110 14 60"/>
    <path className="vl-h vl-wave-2" d="M14 60 Q67 25 120 60 T226 60"/>
    <path className="vl-h vl-wave-3" d="M14 60 Q49 38 84 60 T155 60 T226 60"/>
    <circle cx="14" cy="60" r="4" fill="#ffe9a8"/><circle cx="226" cy="60" r="4" fill="#ffe9a8"/>
  </svg>;
}
function GoldenDiagram() {
  return <svg viewBox="-4 -4 241 152" className="vl-diagram" aria-hidden="true">
    <g className="vl-fib"><rect width="144" height="144"/><rect x="144" width="89" height="89"/><rect x="178" y="89" width="55" height="55"/><rect x="144" y="110" width="34" height="34"/><rect x="144" y="89" width="21" height="21"/><rect x="165" y="89" width="13" height="13"/><rect x="170" y="102" width="8" height="8"/><rect x="165" y="105" width="5" height="5"/></g>
    <path className="vl-spiral" d="M0 144 A144 144 0 0 1 144 0 A89 89 0 0 1 233 89 A55 55 0 0 1 178 144 A34 34 0 0 1 144 110 A21 21 0 0 1 165 89 A13 13 0 0 1 178 102 A8 8 0 0 1 170 110 A5 5 0 0 1 165 105 A3 3 0 0 1 168 102" />
  </svg>;
}
function SpheresDiagram() {
  return <svg viewBox="0 0 240 150" className="vl-diagram" aria-hidden="true">
    <circle cx="120" cy="75" r="11" fill="#ffe9a8" className="vl-sun"/>
    {[30, 50, 68].map((r, n) => <g key={r} className={"vl-sph vl-sph-" + n} style={{ transformOrigin: "120px 75px" }}>
      <circle cx="120" cy="75" r={r} className="vl-ring"/>
      <circle cx={120 + r} cy="75" r={n === 2 ? 5 : 4} fill={["#7fe9ff", "#a77bff", "#ff5fd2"][n]}/>
    </g>)}
  </svg>;
}

const MicIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="17" y="6" width="14" height="24" rx="7"/><path d="M11 23a13 13 0 0 0 26 0M24 36v6M17 42h14"/></svg>;
const BarsIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 28v-8M16 34V14M24 40V8M32 32V16M40 27v-6"/></svg>;
const SunIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/></svg>;

const gradients = ["linear-gradient(140deg,#7fe9ff,#a77bff)", "linear-gradient(140deg,#a77bff,#ff5fd2)", "linear-gradient(140deg,#ff5fd2,#ffe9a8)", "linear-gradient(140deg,#2a6bff,#7fe9ff)"];

function RisingCard({ song, refresh }: { song: Release; refresh: () => Promise<boolean> }) {
  return <article className="vl-glass vl-release" data-testid={"card-release-" + song.id}>
    {song.cover ? <img src={song.cover} alt={"Cover for " + song.title} loading="lazy" className="vl-cover"/> :
      <div className="vl-cover" style={{ background: gradients[Math.abs(song.art) % 4] }} aria-hidden="true"><Disc3 size={34}/></div>}
    <div className="vl-release-meta">
      <a className="vl-release-title" href={songHref(song.id)}>{song.title}</a>
      <a className="vl-release-artist" href={artistHref(song.artist.id)}>{song.artist.name}</a>
      {!!song.tags.length && <div className="vl-tags">{song.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}</div>}
    </div>
    <div className="vl-player"><CommunityPlayer song={song} countable={false} refresh={refresh}/></div>
  </article>;
}

function Rising() {
  const { data, error, refresh } = useCommunityResource<CommunityData>(communityApi + "?page=1&search=&genre=");
  const seen = new Set<string>();
  const releases = [...(data?.releases ?? []), ...(data?.catalog?.releases ?? [])].filter(r => !seen.has(r.id) && !!seen.add(r.id)).slice(0, 4);
  const reload = () => refresh();
  return <section className="vl-section vl-rising" aria-labelledby="vl-rising-h">
    <div className="vl-section-head"><h2 id="vl-rising-h" className="vl-h2">Rising in the cosmos</h2>
      <a className="vl-link" href="/community">Discover more <ArrowRight size={16}/></a></div>
    {error && !data ? <div className="vl-glass vl-state" role="alert">We could not load community songs right now. <button type="button" className="vl-btn vl-btn-outline" onClick={() => void refresh()}>Try again</button></div> :
      !data ? <div className="vl-grid4" role="status" aria-label="Loading songs">{[0, 1, 2, 3].map(n => <div key={n} className="vl-glass vl-skel"><span/><i/><i/></div>)}</div> :
        releases.length ? <div className="vl-grid4">{releases.map(r => <RisingCard key={r.id} song={r} refresh={reload}/>)}</div> :
          <div className="vl-glass vl-state">The first songs are rising soon.</div>}
  </section>;
}

function StarPop() {
  return <section className="vl-starpop" aria-label={brand.slogan}>
    <div className="vl-star-wrap" aria-hidden="true">
      <span className="vl-rays"/>
      <svg viewBox="0 0 100 100" className="vl-star"><path d="M50 6l12.6 28.5 31 3.1-23.3 20.6 6.8 30.4L50 72.9 22.9 88.6l6.8-30.4L6.4 37.6l31-3.1z"/></svg>
    </div>
    <p>{phrases.map((p, n) => <span key={p} className={"vl-pop " + tones[n % 3]} style={{ animationDelay: 0.9 + n * 0.6 + "s" }}>{p}</span>)}</p>
  </section>;
}

export function VersualLanding() {
  const reduced = useReducedMotion();
  return <div className="versual-landing">
    <link rel="stylesheet" href={FONTS} precedence="default"/>
    <Starfield/>
    <header className="vl-top">
      <a href="/" className="vl-brand" aria-label={brand.name}><OrbitLogo/><span><strong>{brand.name}</strong><small>{brand.subline}</small></span></a>
      <nav className="vl-nav" aria-label="Main">
        <a href="/community">Discover</a><a href="/creator">Create</a><a href="/radio">Radio</a><a href="/plans">Plans</a><a href="/sign-in">Sign in</a>
        <a href="/creator" className="vl-btn vl-btn-outline vl-btn-sm">Start creating</a>
      </nav>
    </header>

    <main>
      <section className="vl-hero">
        <div className="vl-hero-copy">
          <p className="vl-eyebrow"><Sparkles size={15}/> {brand.slogan.toUpperCase()}</p>
          <h1 className="vl-h1"><span className="vl-headline-line">Your soul</span><span className="vl-grad vl-headline-line">has a sound.</span></h1>
          <p className="vl-lede">Bring the melody that lives in you down to earth. Describe it, write it, hum it — and watch it become a full song and a glowing lyric video.</p>
          <div className="vl-ctas">
            <a href="/creator" className="vl-btn vl-btn-primary" data-testid="link-create-song"><Sparkles size={17}/> Create your song</a>
            <a href="/community" className="vl-btn vl-btn-outline" data-testid="link-enter-cosmos"><Play size={16}/> Enter the cosmos</a>
          </div>
        </div>
        <HeroVisual/>
      </section>

      <section className="vl-band" aria-label={brand.slogan}>
        {phrases.map((p, n) => <span key={p} className={tones[n % 3]}>{p}</span>)}
      </section>

      <DivineSpark variant="banner"/>

      <section className="vl-section"><Quotes reduced={reduced}/></section>

      <div className="vl-strip" aria-label={styles.join(", ")}><div className="vl-strip-track" aria-hidden="true">
        {[0, 1].map(k => <span key={k}>{styles.map(s => <b key={s}>{s}<i>✧</i></b>)}</span>)}
      </div></div>

      <section className="vl-section">
        <p className="vl-kicker">THE SCIENCE OF SOUND</p>
        <h2 className="vl-h2">Everything vibrates.</h2>
        <p className="vl-sub">From a single string to the orbits of planets, the same laws of harmony run through it all. Your song is part of that pattern.</p>
        <div className="vl-grid3">
          <article className="vl-glass vl-card vl-c-cyan"><StringDiagram/><p className="vl-tag">PHYSICS</p><h3>The harmonic series</h3><code>fₙ = n · v / 2L</code><p>A plucked string sings its note and, hidden inside it, every whole-number multiple of that note. Harmony is built into matter itself.</p></article>
          <article className="vl-glass vl-card vl-c-gold"><GoldenDiagram/><p className="vl-tag">SACRED GEOMETRY</p><h3>The golden ratio</h3><code>φ = (1 + √5) / 2 ≈ 1.618</code><p>The proportion found in shells, sunflowers and galaxies. Musicians have long used it to shape where a song turns and where it peaks.</p></article>
          <article className="vl-glass vl-card vl-c-magenta"><SpheresDiagram/><p className="vl-tag">COSMOLOGY</p><h3>Music of the spheres</h3><code>E = h · ν</code><p>Pythagoras heard harmony in the heavens; Kepler found it in the planets' orbits. Light and sound are both waves — energy riding on frequency.</p></article>
        </div>
      </section>

      <section className="vl-section">
        <p className="vl-kicker">THE JOURNEY</p>
        <h2 className="vl-h2">Receive. Create. Radiate.</h2>
        <div className="vl-grid3 vl-journey">
          <article className="vl-glass vl-card vl-c-cyan"><span className="vl-icon"><MicIcon/></span><span className="vl-step">01</span><h3>Receive</h3><p>A melody arrives. Hum it in, describe the feeling, or write your words in any language. It's saved the moment it lands.</p></article>
          <article className="vl-glass vl-card vl-c-violet"><span className="vl-icon"><BarsIcon/></span><span className="vl-step">02</span><h3>Create</h3><p>Get a full song with vocals and world-music fusion. Keep your favourite take, redo any part, let it grow longer.</p></article>
          <article className="vl-glass vl-card vl-c-magenta"><span className="vl-icon"><SunIcon/></span><span className="vl-step">03</span><h3>Radiate</h3><p>Your lyrics glow in time with your voice on a cosmic visual — ready for Reels, Shorts and YouTube.</p></article>
        </div>
      </section>

      <section className="vl-section">
        <div className="vl-section-head"><h2 className="vl-h2">Every song becomes a moving sky.</h2><a className="vl-link" href="/community">Watch the community <ArrowRight size={16}/></a></div>
        <p className="vl-sub vl-small">Visual look previews</p>
        <div className="vl-grid4 vl-phones">
          {looks.map(([name, line, cls]) => <figure key={name} className={"vl-phone " + cls}>
            <div className="vl-phone-screen"><span className="vl-phone-orb"/><em>{line}</em><Bars/></div>
            <figcaption>{name}</figcaption>
          </figure>)}
        </div>
      </section>

      <Rising/>

      <section className="vl-section vl-close">
        <OrbitLogo size={56}/>
        <h2 className="vl-quote-big">Where words fail, <span className="vl-grad">music speaks.</span></h2>
        <p className="vl-attr">Hans Christian Andersen</p>
        <a href="/creator" className="vl-btn vl-btn-primary vl-btn-lg"><Sparkles size={18}/> Let your song be heard</a>
        <p className="vl-fine">Free to start · No music skills needed · Private until you choose to share</p>
      </section>

      <StarPop/>
    </main>

    <footer className="vl-foot">
      <p>© {brand.name} · {brand.slogan} · {brand.subline}</p>
      <nav aria-label="Footer"><a href="/community">Discover</a><a href="/plans">Plans</a><a href="/sign-in">Sign in</a></nav>
    </footer>
  </div>;
}
