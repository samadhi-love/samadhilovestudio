// Sacred Geometry: its own tab in the Library of Light, right after the Tree of Life.
// Every picture here is computed from exact geometry in code (no outside images, no hotlinks).
// Interactive parts use only CSS (checkbox toggles), because the site allows no inline scripts.
// Facts checked Nov 2026. Where a name or a story is modern, the "What history records" page says so gently.

const GOLD = "#f2c46d", PALE = "#fff3c4", LAV = "#c9b8ff", TEAL = "#9fe7dc", ROSE = "#f6b8d0";
const f = (n) => Number(n.toFixed(2));
const PHI = (1 + Math.sqrt(5)) / 2;

function stars(n, w, h, seed) {
  let s = seed, out = "";
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) out += `<circle cx="${f(r() * w)}" cy="${f(r() * h)}" r="${f(r() * 1.2 + 0.3)}" fill="#fff" opacity="${f(r() * 0.5 + 0.2)}"/>`;
  return out;
}
const bg = (id, w, h, seed) => `<defs><radialGradient id="${id}-sky" cx="50%" cy="45%" r="80%"><stop offset="0" stop-color="#483b20"/><stop offset="1" stop-color="#0d0b08"/></radialGradient></defs><rect width="${w}" height="${h}" rx="18" fill="url(#${id}-sky)"/>${stars(50, w, h, seed)}`;
const circle = (x, y, r, stroke = GOLD, w = 1.6, extra = "") => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="${stroke}" stroke-width="${w}"${extra}/>`;
const line = (a, b, stroke = GOLD, w = 1.2, extra = "") => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${stroke}" stroke-width="${w}"${extra}/>`;
const poly = (pts, stroke = GOLD, w = 1.6, fill = "none", extra = "") => `<polygon points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"${extra}/>`;
const label = (x, y, t, size = 13, color = "#d9cfee") => `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" font-family="Georgia, serif" font-size="${size}" fill="${color}">${t}</text>`;
const ring = (cx, cy, r, n, start = -90) => Array.from({ length: n }, (_, i) => { const a = ((start + (360 / n) * i) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

// A figure with optional CSS toggles: "construction lines" (.sg-c) and "gentle rotation" (.sg-r).
function explorer(id, title, caption, w, h, inner, { lines = "Show construction lines", spin = true } = {}) {
  const lid = `sgx-${id}-l`, sid = `sgx-${id}-s`;
  const inputs = `${lines ? `<input type="checkbox" id="${lid}" class="sgx-lines">` : ""}${spin ? `<input type="checkbox" id="${sid}" class="sgx-spin">` : ""}`;
  const controls = lines || spin ? `<div class="sgx-controls">${lines ? `<label for="${lid}">${lines}</label>` : ""}${spin ? `<label for="${sid}">Gentle rotation</label>` : ""}</div>` : "";
  return `<figure class="cross-hero sgx">${inputs}<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="${id}-t">${title}</title>${inner}</svg>${controls}<figcaption class="fine">${caption} Drawn in exact geometry for SAMADHI LOVE.</figcaption></figure>`;
}
const rot = (cx, cy, body) => `<g class="sg-r" style="transform-origin:${cx}px ${cy}px">${body}</g>`;
const cons = (body) => `<g class="sg-c">${body}</g>`;

// 1. Circle and point
function monad() {
  const c = [360, 210], r = 160;
  return explorer("monad", "A single point at the centre of a circle", "The point and the circle: the One, and the first space it opens.", 720, 420,
    `${bg("mo", 720, 420, 11)}${cons(`${line(c, [c[0] + r, c[1]], LAV, 1.2, ' stroke-dasharray="5 5"')}${label(c[0] + r / 2, c[1] - 10, "radius", 12, LAV)}<path d="M${c[0] + r - 6} ${c[1] - 40} A${r} ${r} 0 0 1 ${c[0] + r - 6} ${c[1] + 40}" fill="none" stroke="${LAV}" stroke-width="1.2"/>`)}
${rot(c[0], c[1], `${circle(c[0], c[1], r, GOLD, 2.4)}${ring(c[0], c[1], r, 12).map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="2" fill="${PALE}"/>`).join("")}`)}
<circle cx="${c[0]}" cy="${c[1]}" r="60" fill="${PALE}" opacity=".12"/><circle cx="${c[0]}" cy="${c[1]}" r="7" fill="${PALE}"/>`);
}

// 2. Vesica Piscis
function vesica() {
  const r = 120, a = [300, 210], b = [420, 210], hgt = (r * Math.sqrt(3)) / 2;
  const almond = `M360 ${f(210 - hgt)} A${r} ${r} 0 0 1 360 ${f(210 + hgt)} A${r} ${r} 0 0 1 360 ${f(210 - hgt)} Z`;
  return explorer("vesica", "Two equal circles, each centred on the edge of the other, with the almond shape where they overlap", "The Vesica Piscis: its height is √3 times the radius.", 720, 420,
    `${bg("ve", 720, 420, 21)}<path d="${almond}" fill="${GOLD}" opacity=".18"/>
${rot(360, 210, `${circle(a[0], a[1], r, GOLD, 2.2)}${circle(b[0], b[1], r, GOLD, 2.2)}`)}
${cons(`${line(a, b, LAV, 1.4)}${line([360, 210 - hgt], [360, 210 + hgt], TEAL, 1.6)}<circle cx="${a[0]}" cy="${a[1]}" r="4" fill="${LAV}"/><circle cx="${b[0]}" cy="${b[1]}" r="4" fill="${LAV}"/>${label(360, 248 + hgt, "height = √3 × radius", 14, TEAL)}${label(360, 200, "1", 13, LAV)}${poly([a, b, [360, 210 - hgt]], LAV, 1, "none", ' stroke-dasharray="4 4"')}`)}`);
}

// 3. Seed of Life and Flower of Life
function seedAndFlower() {
  const r = 46;
  const seedC = [190, 220];
  const seed = [seedC, ...ring(seedC[0], seedC[1], r, 6)].map((p) => circle(p[0], p[1], r, GOLD, 1.8)).join("");
  const fc = [530, 220], R = 3 * r * 0.78, rr = r * 0.78;
  const pts = [];
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const x = fc[0] + rr * (i + j / 2), y = fc[1] + rr * (j * Math.sqrt(3) / 2), d = Math.hypot(x - fc[0], y - fc[1]);
    if (d < R + 0.01) pts.push([x, y, d]);
  }
  const main = pts.filter((p) => p[2] < 2 * rr + 0.01).map((p) => circle(p[0], p[1], rr, GOLD, 1.6)).join("");
  const outer = pts.filter((p) => p[2] >= 2 * rr + 0.01).map((p) => circle(p[0], p[1], rr, LAV, 1.1)).join("");
  return explorer("flower", "The Seed of Life of seven circles, and the Flower of Life of nineteen circles in a larger circle", "Left: the Seed of Life, seven circles. Right: the Flower of Life, nineteen circles in six-fold symmetry.", 720, 440,
    `${bg("fl", 720, 440, 31)}<defs><clipPath id="fl-clip"><circle cx="${fc[0]}" cy="${fc[1]}" r="${f(R)}"/></clipPath></defs>
${rot(seedC[0], seedC[1], seed)}${circle(seedC[0], seedC[1], 2 * r, LAV, 1.2)}
${rot(fc[0], fc[1], `<g clip-path="url(#fl-clip)">${cons(outer)}${main}</g>${circle(fc[0], fc[1], R, GOLD, 2.2)}`)}
${label(seedC[0], 405, "Seed of Life · 7 circles", 14)}${label(fc[0], 405, "Flower of Life · 19 circles", 14)}`);
}

// 5. Metatron's Cube
function metatron() {
  const c = [360, 225], r = 38;
  const centres = [c, ...ring(c[0], c[1], 2 * r, 6), ...ring(c[0], c[1], 4 * r, 6)];
  let lines = "";
  for (let i = 0; i < centres.length; i++) for (let j = i + 1; j < centres.length; j++) lines += line(centres[i], centres[j], GOLD, 1, ' stroke-opacity=".75"');
  return explorer("metatron", "Thirteen circles joined by seventy-eight straight lines", "Thirteen circles, and the 78 lines that join every centre to every other.", 720, 450,
    `${bg("me", 720, 450, 41)}${rot(c[0], c[1], `${lines}${cons(centres.map((p) => circle(p[0], p[1], r, LAV, 1.3)).join(""))}${centres.map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="3.2" fill="${PALE}"/>`).join("")}`)}`, { lines: "Show the 13 circles" });
}

// 6. Sri Yantra (a careful drawing after the traditional pattern)
function sriYantra() {
  const c = [360, 250], R = 150;
  const X = (x) => c[0] + x * R, Y = (y) => c[1] + y * R;
  // [baseY, apexY, halfWidth] in units of the inner circle radius; upward triangles have apex above base.
  const up = [[0.67, -0.97, 0.74], [0.45, -0.64, 0.9], [0.32, -0.36, 0.8], [0.14, -0.12, 0.56]];
  const down = [[-0.67, 0.97, 0.74], [-0.5, 0.76, 0.88], [-0.36, 0.5, 0.86], [-0.2, 0.31, 0.66], [-0.04, 0.16, 0.42]];
  const tri = ([b, a, w], col) => poly([[X(-w), Y(b)], [X(w), Y(b)], [X(0), Y(a)]], col, 2);
  const petals = (n, r1, r2) => ring(c[0], c[1], r1, n).map((p, i) => {
    const a1 = ((-90 + (360 / n) * (i - 0.5)) * Math.PI) / 180, a2 = ((-90 + (360 / n) * (i + 0.5)) * Math.PI) / 180, am = ((-90 + (360 / n) * i) * Math.PI) / 180;
    const p1 = [c[0] + r1 * Math.cos(a1), c[1] + r1 * Math.sin(a1)], p2 = [c[0] + r1 * Math.cos(a2), c[1] + r1 * Math.sin(a2)], tip = [c[0] + r2 * Math.cos(am), c[1] + r2 * Math.sin(am)];
    return `<path d="M${f(p1[0])} ${f(p1[1])} Q${f(tip[0] - (p2[0] - p1[0]) * 0.1)} ${f(tip[1] - (p2[1] - p1[1]) * 0.1)} ${f(tip[0])} ${f(tip[1])} Q${f(tip[0] + (p2[0] - p1[0]) * 0.1)} ${f(tip[1] + (p2[1] - p1[1]) * 0.1)} ${f(p2[0])} ${f(p2[1])}" fill="none" stroke="${ROSE}" stroke-width="1.4"/>`;
  }).join("");
  const s = 240, g = 34;
  const gate = (pts) => `<polyline points="${pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}" fill="none" stroke="${TEAL}" stroke-width="2"/>`;
  const L = c[0] - s, Rr = c[0] + s, T = c[1] - s, B = c[1] + s;
  const bhupura = gate([[L, T], [c[0] - g, T], [c[0] - g, T - 18], [c[0] + g, T - 18], [c[0] + g, T], [Rr, T], [Rr, c[1] - g], [Rr + 18, c[1] - g], [Rr + 18, c[1] + g], [Rr, c[1] + g], [Rr, B], [c[0] + g, B], [c[0] + g, B + 18], [c[0] - g, B + 18], [c[0] - g, B], [L, B], [L, c[1] + g], [L - 18, c[1] + g], [L - 18, c[1] - g], [L, c[1] - g], [L, T]]);
  return explorer("sri", "The Sri Yantra: nine interlocking triangles around a central point, within lotus petals and a square gateway", "A simplified drawing of the Sri Yantra: four upward and five downward triangles around the bindu, two rings of lotus petals, and the square gateway.", 720, 520,
    `${bg("sr", 720, 520, 51)}<g transform="translate(0 10) scale(1)">${bhupura}${cons(circle(c[0], c[1], R * 1.02, LAV, 1.2) + circle(c[0], c[1], R * 1.2, LAV, 1))}${petals(8, R * 1.04, R * 1.2)}${petals(16, R * 1.2, R * 1.38)}${circle(c[0], c[1], R * 1.4, GOLD, 1.6)}
${up.map((t) => tri(t, GOLD)).join("")}${down.map((t) => tri(t, "#f3a6c8")).join("")}<circle cx="${c[0]}" cy="${c[1] + 0.03 * R}" r="4.5" fill="${PALE}"/></g>`, { spin: false, lines: "Show the inner circles" });
}

// 3D helpers for the Merkaba and the Platonic solids
function rotate([x, y, z], ax, ay) {
  const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
  const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}
function edgesOf(v) {
  let min = Infinity;
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) min = Math.min(min, Math.hypot(...v[i].map((a, k) => a - v[j][k])));
  const e = [];
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (Math.abs(Math.hypot(...v[i].map((a, k) => a - v[j][k])) - min) < 1e-6) e.push([i, j]);
  return e;
}
function wire(v, e, cx, cy, size, color, ax = 0.45, ay = 0.6) {
  const r = v.map((p) => rotate(p, ax, ay));
  const m = Math.max(...r.map((p) => Math.hypot(p[0], p[1], p[2])));
  const P = r.map((p) => [cx + (p[0] / m) * size, cy + (p[1] / m) * size, p[2] / m]);
  return e.map(([i, j]) => { const z = (P[i][2] + P[j][2]) / 2; return line(P[i], P[j], color, 1.8, ` stroke-opacity="${f(0.45 + 0.55 * (z + 1) / 2)}"${z < -0.15 ? ' stroke-dasharray="5 4"' : ""}`); }).join("");
}
const solids = {
  tetrahedron: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
  cube: [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [-1, 1].map((c) => [a, b, c]))),
  octahedron: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
  icosahedron: [-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [[0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]])),
  dodecahedron: [
    ...[-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [-1, 1].map((c) => [a, b, c]))),
    ...[-1, 1].flatMap((a) => [-1, 1].flatMap((b) => [[0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [b * PHI, 0, a / PHI]])),
  ],
};

// 7. Merkaba
function merkaba() {
  const up = solids.tetrahedron, down = up.map((p) => p.map((x) => -x));
  const c = [360, 220];
  return explorer("merkaba", "A star tetrahedron: two interlocking tetrahedra pointing in opposite directions, shown in three dimensions", "The Merkaba: two tetrahedra, one pointing up and one pointing down, forming a star tetrahedron.", 720, 440,
    `${bg("mk", 720, 440, 61)}<circle cx="${c[0]}" cy="${c[1]}" r="150" fill="${PALE}" opacity=".06"/>${rot(c[0], c[1], `${cons(wire(solids.cube, edgesOf(solids.cube), c[0], c[1], 170, LAV, 0.5, 0.75))}${wire(up, edgesOf(up), c[0], c[1], 170, GOLD, 0.5, 0.75)}${wire(down, edgesOf(down), c[0], c[1], 170, TEAL, 0.5, 0.75)}`)}`, { lines: "Show the cube around it" });
}

// 8. Torus (top view: circles of equal size whose edges all pass through the centre)
function torus() {
  const c = [360, 220], r = 95, n = 36;
  const circles = ring(c[0], c[1], r, n).map((p, i) => circle(p[0], p[1], r, i % 2 ? LAV : GOLD, 1.1, ' stroke-opacity=".8"')).join("");
  return explorer("torus", "A torus drawn from thirty-six equal circles turning around a centre, like a flow folding back on itself", "The torus seen from above: 36 equal circles, every one passing through the centre.", 720, 440,
    `${bg("to", 720, 440, 71)}${rot(c[0], c[1], circles)}${cons(`${circle(c[0], c[1], r, TEAL, 1.6, ' stroke-dasharray="6 5"')}${circle(c[0], c[1], 2 * r, TEAL, 1.6, ' stroke-dasharray="6 5"')}`)}<circle cx="${c[0]}" cy="${c[1]}" r="5" fill="${PALE}"/>`, { lines: "Show the guiding circles" });
}

// 9. Islamic eight-pointed star pattern (khatam)
function khatam() {
  const s = 120, W = 720, H = 420, x0 = 120, y0 = 90;
  let stars8 = "", grid = "";
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    const cx = x0 + i * s, cy = y0 + j * s, h = s * 0.36;
    const sq1 = [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
    const d = h * Math.SQRT2, sq2 = [[cx, cy - d], [cx + d, cy], [cx, cy + d], [cx - d, cy]];
    stars8 += poly(sq1, GOLD, 1.8) + poly(sq2, GOLD, 1.8);
    grid += circle(cx, cy, d, LAV, 1, ' stroke-dasharray="3 4"');
    if (i < 4) stars8 += line([cx + d, cy], [cx + s - d, cy], TEAL, 1.6);
    if (j < 2) stars8 += line([cx, cy + d], [cx, cy + s - d], TEAL, 1.6);
  }
  for (let i = 0; i <= 5; i++) grid += line([x0 - s / 2 + i * s, y0 - s / 2], [x0 - s / 2 + i * s, y0 + 2.5 * s], LAV, 0.8, ' stroke-dasharray="2 5"');
  for (let j = 0; j <= 3; j++) grid += line([x0 - s / 2, y0 - s / 2 + j * s], [x0 + 4.5 * s, y0 - s / 2 + j * s], LAV, 0.8, ' stroke-dasharray="2 5"');
  return explorer("khatam", "A repeating pattern of eight-pointed stars, each made from two overlapping squares, joined in a grid", "Eight-pointed stars (khatam), each two squares turned by 45°, built with compass and straightedge.", W, H,
    `${bg("kh", W, H, 81)}${cons(grid)}${stars8}`, { spin: false, lines: "Show the compass grid" });
}

// 10. The five Platonic solids
const solidInfo = [
  ["tetrahedron", "Tetrahedron", "4 triangles · Fire"],
  ["cube", "Cube", "6 squares · Earth"],
  ["octahedron", "Octahedron", "8 triangles · Air"],
  ["icosahedron", "Icosahedron", "20 triangles · Water"],
  ["dodecahedron", "Dodecahedron", "12 pentagons · the Cosmos"],
];
function platonic() {
  const cells = solidInfo.map(([k, name, sub], i) => {
    const cx = 80 + i * 140, cy = 160;
    return `${rot(cx, cy, wire(solids[k], edgesOf(solids[k]), cx, cy, 56, [GOLD, ROSE, TEAL, "#8fd3ff", LAV][i]))}${label(cx, 255, name, 14, PALE)}${label(cx, 275, sub, 11.5)}`;
  }).join("");
  return explorer("platonic", "The five Platonic solids: tetrahedron, cube, octahedron, icosahedron and dodecahedron, each with its element", "The five Platonic solids and the elements Plato gave them in the Timaeus. Dashed edges are at the back.", 720, 310,
    `${bg("pl", 720, 310, 91)}${cells}`, { lines: false });
}

// 11. Golden ratio: golden rectangle with its spiral, and a sunflower head
function golden() {
  // Cut squares off a 21 × 13 golden rectangle: left, top, right, bottom, again and again.
  const u = 14.5;
  let x = 40, y = 70, w = 21 * u, h = 13 * u;
  let squares = "", arcs = "";
  for (let k = 0; k < 7; k++) {
    const side = Math.min(w, h), d = k % 4;
    const S = (sx, sy) => { squares += `<rect x="${f(sx)}" y="${f(sy)}" width="${f(side)}" height="${f(side)}" fill="none" stroke="${LAV}" stroke-width="1.1"/>${side >= 3 * u ? label(sx + side / 2, sy + side / 2 + 4, Math.round(side / u), 12, LAV) : ""}`; };
    const A = (a, b) => { arcs += `<path d="M${f(a[0])} ${f(a[1])} A${f(side)} ${f(side)} 0 0 1 ${f(b[0])} ${f(b[1])}" fill="none" stroke="${GOLD}" stroke-width="2.4"/>`; };
    if (d === 0) { S(x, y); A([x, y + side], [x + side, y]); x += side; w -= side; }
    else if (d === 1) { S(x, y); A([x, y], [x + side, y + side]); y += side; h -= side; }
    else if (d === 2) { S(x + w - side, y); A([x + w, y], [x + w - side, y + side]); w -= side; }
    else { S(x, y + h - side); A([x + w, y + h], [x, y + h - side]); h -= side; }
  }
  const golden = (137.507764 * Math.PI) / 180, scx = 560, scy = 210;
  const seeds = Array.from({ length: 420 }, (_, n) => { const r = 6.4 * Math.sqrt(n + 1), a = (n + 1) * golden; return `<circle cx="${f(scx + r * Math.cos(a))}" cy="${f(scy + r * Math.sin(a))}" r="${f(2 + n / 260)}" fill="${n % 21 === 0 ? ROSE : n % 13 === 0 ? TEAL : GOLD}" opacity=".9"/>`; }).join("");
  return explorer("golden", "A golden rectangle divided into Fibonacci squares with a spiral through them, and a sunflower head of seeds placed at the golden angle", "Left: a 21 × 13 golden rectangle cut into Fibonacci squares, with its spiral. Right: 420 seeds, each turned 137.5° from the last, as in a sunflower.", 720, 440,
    `${bg("go", 720, 440, 101)}${cons(squares)}${arcs}${seeds}${label(560, 418, "golden angle ≈ 137.5°", 13, PALE)}${label(192, 418, "1 · 1 · 2 · 3 · 5 · 8 · 13 · 21 …", 13, PALE)}`, { spin: false, lines: "Show the squares" });
}

export function geometryArt(key) {
  return { "geo-monad": monad, "geo-vesica": vesica, "geo-flower": seedAndFlower, "geo-metatron": metatron, "geo-sri": sriYantra, "geo-merkaba": merkaba, "geo-torus": torus, "geo-khatam": khatam, "geo-platonic": platonic, "geo-golden": golden }[key]?.() || "";
}

const sacredSources = {
  euclid: "Euclid, [*Elements*](https://mathcs.clarku.edu/~djoyce/java/elements/elements.html) (about 300 BCE), edited by David E. Joyce",
  timaeus: "Plato, [*Timaeus*](https://classics.mit.edu/Plato/timaeus.html) 53c–56c (Jowett translation)",
};

export const sacredGeometry = [
  { slug: "sacred-geometry", tag: "Overview", title: "Sacred Geometry: The Language of Creation",
    summary: "Circles, triangles, stars and spirals: the ancient art of seeing cosmic order in number and shape, from Pythagoras and Plato to temple builders, cathedral masons and Islamic artists.",
    body: `{{geo-flower}}

**Sacred geometry** is the ancient art and teaching that number, proportion and shape reveal the hidden order of creation. Long before anyone wrote the word "science", the sages looked at the circle, the triangle and the star and saw in them the fingerprints of the Creator.

## A thread through many civilizations
- **Pythagoras** (6th century BCE) and his followers taught that the cosmos is ordered by number and harmony. Their holy symbol was the *tetractys*: ten points in a triangle of 1, 2, 3 and 4. See [Pythagoras and the Music of Numbers](/teachings/pythagoras-music-of-numbers).
- **Plato**, in the *Timaeus*, described the elements of the world as five perfect solid shapes, and the soul of the world as circles turning in harmony.
- **Euclid's *Elements*** (about 300 BCE) built all of geometry from a point, a line and a circle, drawn only with compass and straightedge.
- **Hindu and Buddhist temple builders** laid out temples and stupas as *mandalas*: maps of the cosmos in stone.
- **The Gothic cathedral masons** drew their arches and rose windows from circles and their proportions.
- **Islamic artists** covered mosques and palaces with star patterns of breathtaking complexity, built with compass and straightedge, expressing the unity of God without images.
- **Johannes Kepler** (1571–1630) searched the heavens for the same perfect shapes, and wrote that geometry existed before the creation, as eternal as the mind of God.

## The heart of the teaching
- **Everything begins from one point.** The whole of geometry unfolds from a single centre and the circle around it.
- **Proportion is harmony.** The same ratios that make music beautiful make a building, a flower or a face beautiful.
- **The pattern repeats on every level.** "As above, so below": the shapes of the heavens appear in the seed, the shell and the soul.
- **To draw it is to pray.** For many traditions, drawing or contemplating these shapes calms the mind and turns it towards the One.

## In this tab
- [The Symbols of Sacred Geometry](/teachings/the-symbols-of-sacred-geometry): eleven symbols, each drawn in exact geometry, with buttons to show how it is built.
- [The Five Platonic Solids](/teachings/the-five-platonic-solids)
- [The Golden Ratio and the Fibonacci Numbers](/teachings/the-golden-ratio-and-fibonacci)
- [Sacred Geometry in Temples, Mosques and Cathedrals](/teachings/sacred-geometry-in-architecture)
- [What History Records](/teachings/sacred-geometry-what-history-records)

## Samadhi's view
*This is Samadhi's own understanding.*

Sacred geometry is the language the Creator used to write the universe. When we draw a circle from its centre, we repeat the first act of creation: the One opening into the many. Every pattern of nature, every flower and every star carries this signature of divine order, and it reminds us that we, too, are part of the design.

## Sources

- ${sacredSources.euclid}, Book I.
- ${sacredSources.timaeus}.
- Johannes Kepler, *Harmonices Mundi* (1619), Book IV.
- Robert Lawlor, *Sacred Geometry: Philosophy and Practice* (1982).` },

  { slug: "the-symbols-of-sacred-geometry", tag: "Explorer", title: "The Symbols of Sacred Geometry",
    summary: "Eleven symbols drawn in exact geometry: the point and circle, the Vesica Piscis, the Seed and Flower of Life, the Tree of Life, Metatron's Cube, the Sri Yantra, the Merkaba, the torus, Islamic stars, the Platonic solids and the golden ratio.",
    body: `Each symbol below is drawn from exact geometry, not copied from a picture. Under many of them are two buttons: one shows the hidden lines used to build the shape, and one turns it gently.

## 1. The circle and the point: the Monad and the Bindu

{{geo-monad}}

A single point inside a circle. The Pythagoreans called it the **Monad**, the One from which all numbers come. In India it is the **bindu**, the seed point at the centre of every yantra, where creation begins and returns. In ancient Egypt the same sign stood for the sun. It shows unity, the undivided origin, and the first space opening out from one centre.

## 2. The Vesica Piscis

{{geo-vesica}}

Two equal circles, each drawn with its centre on the edge of the other. The almond shape where they overlap is the *vesica piscis*, Latin for "the bladder of a fish". It is the very first construction in Euclid's *Elements* (Book I, Proposition 1), used there to draw a perfect equilateral triangle. Its height is exactly **√3** times its width, a proportion builders loved. In Christian art the same almond, the *mandorla*, surrounds Christ in glory, and the pointed Gothic arch is drawn from two of its arcs. It is the symbol of two worlds meeting, and of the birth of form from union.

## 3. The Seed of Life and the Flower of Life

{{geo-flower}}

Draw a circle, then six more of the same size around it, each centred on the edge of the first: this is the **Seed of Life**, seven circles in six-fold symmetry. Keep going, and the pattern grows into the **Flower of Life**: nineteen circles inside a great circle, the same shape repeating without end. Leonardo da Vinci filled pages of his notebooks with these patterns. Teachers today read it as the pattern of growth: one becoming many, as a single cell divides into a living body.

## 4. The Tree of Life

{{tree-sefirot}}

Ten spheres, the Sefirot, in three pillars, joined by twenty-two paths: the great map of the Kabbalah, showing how the light of God flows into the world and how the soul climbs back. Modern sacred geometry teachers also draw it over the grid of the Flower of Life. Read the full teaching in the [Tree of Life](/library?tab=tree-of-life) tab.

## 5. Metatron's Cube

{{geo-metatron}}

Thirteen circles, often called the **Fruit of Life**, with every centre joined to every other by a straight line: seventy-eight lines in all. Hidden inside appear the outline of a cube, the star tetrahedron and the octahedron, drawn flat. It is named after the archangel **Metatron**, the heavenly scribe. See [Archangel Metatron](/teachings/archangel-metatron).

## 6. The Sri Yantra

{{geo-sri}}

The holiest yantra of the Hindu Shri Vidya tradition: **nine interlocking triangles**, four pointing up for Shiva and five pointing down for Shakti, around the central **bindu**. Their crossings form **forty-three** small triangles. Around them bloom lotuses of eight and sixteen petals, and all of it sits inside a square with four gates, the *bhupura*. In meditation the eye travels inward from the gates, through the petals and triangles, to the bindu: the journey of the soul from the outer world to the One. Tradition links its worship with Adi Shankaracharya. See [Adi Shankara](/teachings/adi-shankara).

## 7. The Merkaba: the star tetrahedron

{{geo-merkaba}}

Two tetrahedra, one pointing up and one pointing down, locked together into an eight-pointed star in three dimensions. Leonardo drew it for Luca Pacioli's *On the Divine Proportion* (1509), and Kepler named it the *stella octangula*, the eight-pointed star. *Merkavah* is Hebrew for "chariot", the throne-chariot of God in Ezekiel's vision. Modern meditation teachers use the star tetrahedron as a picture of the body of light, with its two fields turning in opposite directions: heaven and earth, giving and receiving, in perfect balance.

## 8. The torus

{{geo-torus}}

A ring shaped like a doughnut, where the flow rises through the centre, curves out over the top, and returns underneath: a movement that feeds itself forever. A smoke ring moves this way, and the field around a magnet takes a torus-like shape. Many teachers see in it the shape of the heart's field, and of all life breathing in and out.

## 9. Islamic star patterns: khatam and girih

{{geo-khatam}}

Islamic art expresses the unity and infinity of God through pattern rather than pictures. Its stars of six, eight, ten and twelve points are built only with compass and straightedge, and repeat without end in every direction. The eight-pointed **khatam** is made of two squares, one turned by 45°. By the 13th century, artisans were building their patterns from a few shaped tiles, the *girih* tiles, and on the Darb-i Imam shrine in Isfahan (1453) they created a nearly perfect pattern of a kind Western mathematicians only discovered in the 1970s.

## 10. The five Platonic solids

{{geo-platonic}}

The only five solids whose faces are all the same regular shape, with the same number meeting at every corner. Plato gave each one an element. Read more in [The Five Platonic Solids](/teachings/the-five-platonic-solids).

## 11. The golden ratio and the Fibonacci numbers

{{geo-golden}}

The golden ratio, **Φ ≈ 1.618**, is the proportion in which the whole is to the larger part as the larger part is to the smaller. The Fibonacci numbers 1, 1, 2, 3, 5, 8, 13, 21… grow towards it. In plants it is real: sunflower seeds, pinecone scales and many leaves are placed about **137.5°** apart, the golden angle, packing them perfectly. Read more in [The Golden Ratio and the Fibonacci Numbers](/teachings/the-golden-ratio-and-fibonacci).

*Where a symbol's name or story is modern, [What History Records](/teachings/sacred-geometry-what-history-records) gives the dates gently.*

## Sources

- ${sacredSources.euclid}, Book I, Proposition 1 (the vesica) and Book XIII (the five solids).
- ${sacredSources.timaeus}; Ezekiel 1, King James Bible.
- Luca Pacioli, *De Divina Proportione* (1509), with drawings by Leonardo da Vinci; Johannes Kepler, *Harmonices Mundi* (1619).
- Madhu Khanna, *Yantra: The Tantric Symbol of Cosmic Unity* (1979).
- Peter Lu and Paul Steinhardt, ["Decagonal and quasi-crystalline tilings in medieval Islamic architecture"](https://pubmed.ncbi.nlm.nih.gov/17322056/), *Science* 315 (2007).
- Keith Critchlow, *Islamic Patterns: An Analytical and Cosmological Approach* (1976).` },

  { slug: "the-five-platonic-solids", tag: "The perfect solids", title: "The Five Platonic Solids",
    summary: "The tetrahedron, cube, octahedron, icosahedron and dodecahedron: the only five perfect solids, the elements Plato gave them, and why there can never be a sixth.",
    body: `{{geo-platonic}}

A **Platonic solid** is a solid shape whose faces are all the same regular polygon, with the same number of faces meeting at every corner. There are exactly five of them, no more and no fewer.

| Solid | Faces | Corners | Edges | Plato's element |
| --- | --- | --- | --- | --- |
| Tetrahedron | 4 triangles | 4 | 6 | Fire |
| Cube (hexahedron) | 6 squares | 8 | 12 | Earth |
| Octahedron | 8 triangles | 6 | 12 | Air |
| Icosahedron | 20 triangles | 12 | 30 | Water |
| Dodecahedron | 12 pentagons | 20 | 30 | The whole cosmos |

## Plato's elements
In the *Timaeus*, Plato teaches that the four elements are made of these shapes. **Fire** is the sharp, light tetrahedron. **Earth** is the steady cube, the hardest to move. **Air** is the octahedron, and **water** the rolling icosahedron. The fifth, the **dodecahedron**, God used "for the whole", to embroider the heavens with constellations. Later writers called it the shape of the *aether*, the fifth element.

## Why only five?
At every corner of a solid, at least three faces must meet, and their angles must add up to less than a full circle, or the corner would lie flat. Three, four or five triangles fit; three squares fit; three pentagons fit. Six triangles, four squares or three hexagons make a flat floor and cannot fold into a solid. So there are only five. Euclid proved this in the very last proposition of his *Elements* (Book XIII, Proposition 18).

## Pairs and harmony
The solids come in pairs. Join the centres of the faces of a cube, and you get an octahedron; do the same to an octahedron, and you get a cube. The dodecahedron and the icosahedron are partners in the same way, and the tetrahedron is its own partner. Two tetrahedra together make the star tetrahedron, the Merkaba.

## Kepler's vision
In 1596 the young astronomer **Johannes Kepler** imagined the six planets known in his day carried on spheres nested between the five solids, one inside the other, in his book *The Cosmic Mystery*. He spent his life searching the heavens for that harmony, and in the search he discovered the true laws of the planets' motion.

## Samadhi's view
*This is Samadhi's own understanding.*

The five solids show that perfection has its own law: only a few shapes are complete in themselves. In the same way, the soul is shaped by divine order, and when it lives in balance it becomes a perfect form of light.

## Sources

- ${sacredSources.timaeus}.
- ${sacredSources.euclid}, Book XIII, Proposition 18.
- Johannes Kepler, *Mysterium Cosmographicum* (1596).` },

  { slug: "the-golden-ratio-and-fibonacci", tag: "Φ ≈ 1.618", title: "The Golden Ratio and the Fibonacci Numbers",
    summary: "The divine proportion and the numbers that grow towards it, and where they truly shape nature: the sunflower, the pinecone and the leaf, placed at the golden angle of 137.5°.",
    body: `{{geo-golden}}

## The golden ratio
Divide a line so that the **whole is to the longer part as the longer part is to the shorter**. That proportion is the golden ratio, written with the Greek letter **Φ** (phi):

> **Φ = (1 + √5) ÷ 2 ≈ 1.6180339…**

Euclid called it dividing a line in "extreme and mean ratio" (*Elements*, Book VI). In 1509 the friar **Luca Pacioli** named it the **divine proportion**, in a book illustrated by Leonardo da Vinci, because like God it is one, it is unchanging, and it can never be written out completely as a fraction.

It has a beautiful property: take a golden rectangle, cut off a square, and what remains is a smaller golden rectangle. Repeat for ever, and a spiral appears.

## The Fibonacci numbers
In 1202 **Leonardo of Pisa**, known as Fibonacci, posed a puzzle about rabbits in his *Book of Calculation*. Its answer is the sequence in which each number is the sum of the two before:

> **1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144…**

Divide each number by the one before it, and the answers come closer and closer to Φ: 8 ÷ 5 = 1.6; 13 ÷ 8 = 1.625; 89 ÷ 55 = 1.618…

## Where it truly shapes nature
The clearest place is the way plants arrange their seeds and leaves, called **phyllotaxis**:
- **The golden angle.** Each new seed or leaf grows about **137.5°** around from the last. That angle is the full circle divided by the golden ratio, and it never lines up with the seeds before it.
- **Sunflowers.** Because of that angle, the seeds form two sets of spirals, one turning each way. Count them, and the numbers are almost always neighbouring Fibonacci numbers: 34 and 55, or 55 and 89.
- **Pinecones and pineapples** show the same pairs of spirals: 8 and 13 on many pinecones, 8, 13 and 21 on a pineapple.
- **Leaves** placed at the golden angle around a stem shade each other as little as possible, so each one receives its share of light.

This is the golden ratio not as an idea laid over nature, but as the way living things actually grow.

## Samadhi's view
*This is Samadhi's own understanding.*

The golden proportion is a signature of the Creator in living things. A sunflower does not know mathematics, yet it grows in perfect divine order. When we live in harmony with that order, our lives unfold just as gracefully.

## Sources

- ${sacredSources.euclid}, Book VI, Definition 3.
- Luca Pacioli, *De Divina Proportione* (1509); Leonardo of Pisa (Fibonacci), *Liber Abaci* (1202).
- Helmut Vogel, "A better way to construct the sunflower head", *Mathematical Biosciences* 44 (1979).
- Mario Livio, *The Golden Ratio* (2002).` },

  { slug: "sacred-geometry-in-architecture", tag: "Built in stone", title: "Sacred Geometry in Temples, Mosques and Cathedrals",
    summary: "How builders made heaven visible on earth: the circles and arches of Gothic cathedrals, the star tilework of mosques and the Alhambra, and the mandala plans of Hindu and Buddhist temples.",
    body: `{{geo-khatam}}

Across the world, the builders of holy places used geometry to make the order of heaven visible on earth. A temple, a mosque or a cathedral was meant to be a small cosmos: a place where the soul could feel the harmony of creation.

## Gothic cathedrals
- **The pointed arch** of the Gothic cathedral is drawn from two arcs, each centred where the other begins: the geometry of the Vesica Piscis. It carries weight downward and lifts the eye upward.
- **Rose windows**, such as the great roses of Chartres and Notre-Dame de Paris (13th century), are built from circles divided into equal parts, like petals or the spokes of a wheel. Light pours through them as through a mandala of glass.
- **The masons' secret.** The 13th-century notebook of **Villard de Honnecourt** shows faces, animals and buildings drawn over simple geometric figures, a glimpse of how the master masons designed with compass and square.

## Mosques and Islamic palaces
- **Star patterns** cover walls, ceilings, doors and fountains, built only with compass and straightedge.
- **The Alhambra** in Granada (14th century, Nasrid dynasty) is famous for its *zellij*-style tile mosaics, carved plaster and wooden ceilings in star patterns that seem to go on for ever.
- **The Darb-i Imam shrine** in Isfahan, Iran (1453) shows a nearly perfect pattern built from *girih* tiles, of a kind Western mathematicians only described in the 1970s.
- The patterns turn the eye from the many to the One: endless variety, flowing from a single centre.

## Hindu and Buddhist temples
- **The Vastu Purusha Mandala.** The ancient Indian science of building, *Vastu Shastra*, lays a temple out on a square grid, often 8 × 8 or 9 × 9 squares, with Brahma, the Creator, at the centre and the gods of the directions around him. The temple becomes a diagram of the cosmos, facing the rising sun.
- **The stupa** is a cosmic mountain: square base for the earth, dome for the heavens, spire for the path upward.
- **Borobudur** in Java (9th century) is built as a great three-dimensional mandala. Pilgrims walk round it, rising level by level from the world of desire to the open circular terraces at the top.

## Samadhi's view
*This is Samadhi's own understanding.*

These builders knew that beauty is a doorway. When we stand under a rose window or a dome of stars, the body feels the harmony before the mind understands it. Sacred geometry in stone is prayer made visible.

## Sources

- Villard de Honnecourt, sketchbook (about 1230), Bibliothèque nationale de France, MS Fr 19093.
- Robert Irwin, *The Alhambra* (2004); Keith Critchlow, *Islamic Patterns* (1976).
- Peter Lu and Paul Steinhardt, ["Decagonal and quasi-crystalline tilings in medieval Islamic architecture"](https://pubmed.ncbi.nlm.nih.gov/17322056/), *Science* 315 (2007).
- Stella Kramrisch, *The Hindu Temple* (1946).` },

  { slug: "sacred-geometry-what-history-records", tag: "History", title: "Sacred Geometry: What History Records",
    summary: "The geometry itself is ancient and real. Some of the names and stories around it are newer, and here are their dates, told gently.",
    body: `The shapes of sacred geometry are truly ancient: circles, triangles, stars and spirals have been drawn and honoured for thousands of years. Some of the names and stories around them are newer. Knowing the dates takes nothing away from the meaning; the geometry speaks for itself.

## The golden ratio in old buildings
The golden ratio is real, and it truly shapes the growth of plants. Many books also say that the builders of the **Great Pyramid** and the **Parthenon**, or the proportions of the human body, were planned on it. No ancient plan or writing from those builders survives to say so, and the measurements depend on which points one chooses to measure. What is certain is that Euclid described the proportion, and that from the Renaissance onward many artists and architects chose to use it.

## The name "Metatron's Cube"
The thirteen circles and their lines are ancient geometry, and Metatron is an ancient name for the heavenly scribe in Jewish tradition. The habit of calling this figure "Metatron's Cube" is much more recent: it became widely known through the sacred-geometry teachers of the late 20th century. A careful note: the figure as usually drawn contains the cube, the octahedron and the tetrahedra exactly, while the icosahedron and dodecahedron need extra points to be drawn properly. For who Metatron is in the old writings, see [The Books of Enoch](/teachings/the-books-of-enoch).

## The Flower of Life at Abydos
At the Osireion, the temple of Osiris at Abydos in Egypt, several Flower of Life patterns appear on the great granite pillars. They are not carved: they are drawn in red ochre. Greek writing appears near them, and so most researchers think they were added much later than the temple itself, perhaps in the Greek period of Egypt (after 332 BCE) or after. The name "Flower of Life" itself became widely known in the 1990s through Drunvalo Melchizedek's teachings.

## The Tree of Life and the Flower of Life
The old Kabbalah draws the Tree of Life on its own. Laying it over the Flower of Life grid is a beautiful modern discovery of sacred-geometry teachers.

## The Merkaba as a light body
*Merkavah*, the chariot of Ezekiel's vision, is ancient, and so is the star tetrahedron, drawn by Leonardo. Teaching the star tetrahedron as a spinning body of light for meditation is a modern practice, taught since the 1990s.

## Why it still matters
None of this lessens the beauty or the spiritual meaning of the patterns. A symbol does not need to be old to be true: it becomes sacred in the heart of the one who contemplates it. Here, as everywhere on this site, the teaching and its history are given side by side, so that every reader can see both.

## Sources

- George Markowsky, "Misconceptions about the Golden Ratio", *The College Mathematics Journal* 23 (1992).
- Margaret Murray, *The Osireion at Abydos* (1904).
- Drunvalo Melchizedek, *The Ancient Secret of the Flower of Life* (1999).
- ${sacredSources.euclid}, Book VI, Definition 3, and Book XIII.` },
];
