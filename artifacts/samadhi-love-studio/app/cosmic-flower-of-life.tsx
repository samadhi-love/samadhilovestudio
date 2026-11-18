/** Decorative Flower of Life. Coordinates are rounded (and -0 normalised) so server and browser markup match. */
const r2 = (n: number) => { const v = Math.round(n * 100) / 100; return Object.is(v, -0) ? 0 : v; };
const R = 30;
const centers: [number, number][] = [[0, 0]];
for (let ring = 1; ring <= 2; ring++) {
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k;
    const x = Math.cos(a) * R * ring, y = Math.sin(a) * R * ring;
    centers.push([r2(x), r2(y)]);
    if (ring === 2) {
      const b = a + Math.PI / 3;
      centers.push([r2((x + Math.cos(b) * R * 2) / 2), r2((y + Math.sin(b) * R * 2) / 2)]);
    }
  }
}
export function FlowerOfLife({ className }: { className?: string }) {
  return <svg className={className} viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
    <circle cx="0" cy="0" r={R * 3} fill="none" stroke="currentColor" strokeWidth="0.6"/>
    {centers.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={R} fill="none" stroke="currentColor" strokeWidth="0.5"/>)}
  </svg>;
}
