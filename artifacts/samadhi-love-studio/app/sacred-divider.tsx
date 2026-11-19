import "./sacred-divider.css";

/* Fixed, rounded coordinates so server and browser markup always match. */
const r2 = (n: number) => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? 0 : v; };
const ring = (count: number, radius: number, offset = 0): [number, number][] =>
  Array.from({ length: count }, (_, k) => {
    const a = offset + (Math.PI * 2 * k) / count;
    return [r2(Math.cos(a) * radius), r2(Math.sin(a) * radius)];
  });
const poly = (points: [number, number][]) => points.map(([x, y]) => `${x},${y}`).join(" ");

export type SacredSymbol = "seed" | "hexagram" | "vesica" | "metatron" | "yantra" | "lotus";
export const sacredSymbols: readonly SacredSymbol[] = ["seed", "hexagram", "vesica", "metatron", "yantra", "lotus"];

const hex = ring(6, 14, -Math.PI / 2);
const triUp = ring(3, 14, -Math.PI / 2), triDown = ring(3, 14, Math.PI / 2);

function Shape({ symbol }: { symbol: SacredSymbol }) {
  switch (symbol) {
    case "seed": // Seed of Life
      return <>{[[0, 0] as [number, number], ...ring(6, 6)].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6"/>)}<circle r="12"/></>;
    case "hexagram": // Star of David within the circle
      return <><circle r="17"/><polygon points={poly(triUp)}/><polygon points={poly(triDown)}/><circle r="3"/></>;
    case "vesica": // Vesica Piscis
      return <><circle cx="-5" r="10"/><circle cx="5" r="10"/><circle r="17"/><line x1="0" y1="-8.66" x2="0" y2="8.66"/></>;
    case "metatron": // Simplified Metatron's Cube
      return <><polygon points={poly(hex)}/>{hex.map(([x, y], i) => <line key={i} x1="0" y1="0" x2={x} y2={y}/>)}
        <polygon points={poly(triUp)}/><polygon points={poly(triDown)}/>{[[0, 0] as [number, number], ...hex].map(([x, y], i) => <circle key={`c${i}`} cx={x} cy={y} r="2.4"/>)}</>;
    case "yantra": // Interlaced triangles in a lotus square, after the Sri Yantra
      return <><rect x="-17" y="-17" width="34" height="34"/><circle r="14.5"/>
        <polygon points={poly(ring(3, 12, -Math.PI / 2))}/><polygon points={poly(ring(3, 9, -Math.PI / 2).map(([x, y]) => [x, r2(y + 3)]))}/>
        <polygon points={poly(ring(3, 12, Math.PI / 2))}/><polygon points={poly(ring(3, 7, Math.PI / 2).map(([x, y]) => [x, r2(y - 3)]))}/><circle r="1.2"/></>;
    case "lotus": // Eight-petal lotus
      return <><circle r="4"/>{ring(8, 9).map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="7" ry="3.2" transform={`rotate(${i * 45} ${x} ${y})`}/>)}<circle r="17"/></>;
  }
}

/** A small sacred-geometry mark, decorative only. */
export function SacredMark({ symbol, className = "" }: { symbol: SacredSymbol; className?: string }) {
  return <svg className={`sacred-mark ${className}`.trim()} viewBox="-20 -20 40 40" aria-hidden="true" focusable="false"><Shape symbol={symbol}/></svg>;
}

/** A thin golden line with a slowly turning symbol at its heart: placed between sections. */
export function SacredDivider({ symbol }: { symbol: SacredSymbol }) {
  return <div className="sacred-divider" aria-hidden="true" data-symbol={symbol}>
    <span className="sacred-divider__line"/>
    <SacredMark symbol={symbol} className="sacred-divider__mark"/>
    <span className="sacred-divider__line"/>
  </div>;
}

/** Wraps a short line with a symbol at its beginning and end. */
export function SacredLine({ symbols, children }: { symbols: [SacredSymbol, SacredSymbol]; children: React.ReactNode }) {
  return <span className="sacred-line"><SacredMark symbol={symbols[0]}/>{children}<SacredMark symbol={symbols[1]}/></span>;
}
