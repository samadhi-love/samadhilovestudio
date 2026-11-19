import type { ReactNode } from "react";
import { brand } from "./brand";
import { HologramSlogan } from "./hologram-slogan";

const stars = Array.from({ length: 36 }, (_, i) => {
  const a = i * 2.39996, r = 18 + ((i * 37) % 82);
  return { x: Math.round((50 + Math.cos(a) * r * 0.6) * 100) / 100, y: Math.round((50 + Math.sin(a) * r * 0.55) * 100) / 100, s: 1 + (i % 3), d: (i % 7) * 0.6 };
});

/** Cosmetic shell around the real Clerk widget: portal rings, core and brand copy. */
export function AuthPortal({ mode, children, note }: { mode: "sign-in" | "sign-up"; children: ReactNode; note: ReactNode }) {
  return <main className="studio-auth cosmic-portal" data-cosmic-portal={mode}>
    <div className="portal-sky" aria-hidden="true">{stars.map((s, i) => <i key={i} style={{ left: s.x + "%", top: s.y + "%", width: s.s, height: s.s, animationDelay: s.d + "s" }}/>)}</div>
    <section className="portal-stage" aria-hidden="true">
      <div className="portal-rings"><span className="ring ring-a"/><span className="ring ring-b"/><span className="ring ring-c"/><span className="portal-core"/></div>
      <p className="portal-line">Step through. Your songs are waiting.</p>
    </section>
    <section className="portal-card">
      <a className="brand portal-brand" href="/"><img src="/favicon.svg" alt=""/><span><strong>{brand.name}</strong><small>{brand.subline}</small></span></a>
      <p className="portal-eyebrow">THE PORTAL</p>
      <h1 className="portal-slogan"><HologramSlogan/></h1>
      <div className="portal-widget">{children}</div>
      {note}
    </section>
  </main>;
}
