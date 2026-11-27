// Chakra lotuses, drawn in code for SAMADHI LOVE.
// Petal counts, elements and inner shapes follow the Ṣaṭ-Cakra-Nirūpaṇa (1577), as translated
// by Arthur Avalon in The Serpent Power (1919). The rainbow colours are the modern Western scheme.
// Only CSS drives the buttons (checkboxes), because the site allows no inline scripts.

const GOLD = "#f2c46d", PALE = "#fff3c4";
const f = (n) => Number(n.toFixed(2));

export const LOTUS = [
  { n: 1, name: "Muladhara", english: "Root", petals: 4, color: "#ff4a4a", sound: "LAM", shape: "square", element: "earth" },
  { n: 2, name: "Svadhisthana", english: "Sacral", petals: 6, color: "#ff9a3c", sound: "VAM", shape: "crescent", element: "water" },
  { n: 3, name: "Manipura", english: "Solar plexus", petals: 10, color: "#ffd23f", sound: "RAM", shape: "triangle", element: "fire" },
  { n: 4, name: "Anahata", english: "Heart", petals: 12, color: "#3fc46a", sound: "YAM", shape: "star", element: "air" },
  { n: 5, name: "Vishuddha", english: "Throat", petals: 16, color: "#3d9bff", sound: "HAM", shape: "circle", element: "ether" },
  { n: 6, name: "Ajna", english: "Third eye", petals: 2, color: "#7b5cff", sound: "OM", shape: "triangle", element: "mind" },
  { n: 7, name: "Sahasrara", english: "Crown", petals: 1000, color: "#c9a7ff", sound: "", shape: "moon", element: "beyond" },
];

// One petal pointing up from radius r0 to r1, half-width w, then turned by angle a (degrees).
function petal(r0, r1, w, a) {
  const len = r1 - r0;
  return `<path d="M0 ${f(-r0)} C${f(w)} ${f(-r0 - len * 0.25)} ${f(w * 0.75)} ${f(-r1 + len * 0.2)} 0 ${f(-r1)} C${f(-w * 0.75)} ${f(-r1 + len * 0.2)} ${f(-w)} ${f(-r0 - len * 0.25)} 0 ${f(-r0)} Z" transform="rotate(${f(a)})"/>`;
}
function petalRing(count, r0, r1, start = 0) {
  const w = Math.min((Math.PI * (r0 + r1)) / count * 0.5, len(r0, r1));
  let out = "";
  for (let i = 0; i < count; i++) out += petal(r0, r1, w, start + (360 / count) * i);
  return out;
}
const len = (r0, r1) => (r1 - r0) * 0.55;

function petalsFor(c, s) {
  if (c.petals === 1000) {
    // The thousand petals, suggested in five layers.
    return [[40, 0.34, 1.0, 0], [40, 0.3, 0.86, 4.5], [32, 0.26, 0.72, 0], [24, 0.22, 0.58, 7.5], [16, 0.18, 0.44, 0]]
      .map(([n, a, b, st]) => petalRing(n, s * a, s * b, st)).join("");
  }
  if (c.petals === 2) return petal(s * 0.3, s * 1.0, s * 0.3, -90) + petal(s * 0.3, s * 1.0, s * 0.3, 90);
  return petalRing(c.petals, s * 0.34, s, c.petals === 4 ? 45 : 0);
}

function yantra(c, r) {
  const st = `fill="none" stroke="${PALE}" stroke-width="${f(Math.max(1.2, r / 22))}" stroke-linejoin="round"`;
  const tri = (down) => { const h = r * 0.85; const pts = down ? [[-h, -h * 0.5], [h, -h * 0.5], [0, h]] : [[-h, h * 0.5], [h, h * 0.5], [0, -h]]; return `<polygon points="${pts.map((p) => p.map(f).join(",")).join(" ")}" ${st}/>`; };
  switch (c.shape) {
    case "square": return `<rect x="${f(-r * 0.7)}" y="${f(-r * 0.7)}" width="${f(r * 1.4)}" height="${f(r * 1.4)}" ${st}/>`;
    case "crescent": return `<path d="M${f(-r * 0.8)} ${f(-r * 0.1)} A${f(r * 0.8)} ${f(r * 0.8)} 0 0 0 ${f(r * 0.8)} ${f(-r * 0.1)} A${f(r * 0.62)} ${f(r * 0.62)} 0 0 1 ${f(-r * 0.8)} ${f(-r * 0.1)} Z" ${st}/>`;
    case "triangle": return tri(true);
    case "star": return tri(true) + tri(false);
    case "circle": return `<circle r="${f(r * 0.72)}" ${st}/>`;
    case "moon": return `<circle r="${f(r * 0.8)}" fill="${PALE}" opacity=".85"/>`;
    default: return "";
  }
}

// One lotus at the origin, size s (outer petal radius).
function lotusBody(c, s, id) {
  const petals = petalsFor(c, s);
  const inner = c.petals === 1000 ? s * 0.18 : s * 0.34;
  return `<g class="lx-b">
<g class="lx-fill" fill="${c.color}" opacity="0">${petals}</g>
<g fill="none" stroke="${GOLD}" stroke-width="${f(c.petals === 1000 ? Math.max(0.6, s / 160) : Math.max(1, s / 70))}">${petals}</g>
<circle r="${f(inner)}" fill="#120d24" stroke="${GOLD}" stroke-width="${f(Math.max(1, s / 80))}"/>
<circle class="lx-fill" r="${f(inner)}" fill="${c.color}" opacity="0"/>
${yantra(c, inner * 0.82)}
${c.sound && s > 60 ? `<text y="${f(inner * 0.13)}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="${f(inner * 0.36)}" fill="${PALE}" stroke="#120d24" stroke-width="${f(inner * 0.08)}" paint-order="stroke">${c.sound}</text>` : ""}
</g>`;
}

const bg = (id, w, h) => `<defs><radialGradient id="${id}-sky" cx="50%" cy="45%" r="80%"><stop offset="0" stop-color="#271c4c"/><stop offset="1" stop-color="#07060f"/></radialGradient>
<radialGradient id="${id}-halo"><stop offset="0" stop-color="#fff3c4" stop-opacity=".35"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" rx="18" fill="url(#${id}-sky)"/>`;

function controls(id, extra) {
  return `<div class="sgx-controls lx-controls"><label for="lx-${id}-c" class="lx-lc">Show the colours</label>${extra}</div>`;
}

function single(c) {
  const id = `c${c.n}`;
  const names = { 1000: "a thousand petals, suggested here in layers" };
  const shapeText = { square: "the yellow square of earth", crescent: "the white crescent moon of water", triangle: c.n === 3 ? "the downward triangle of fire" : "the downward triangle", star: "the six-pointed star of air", circle: "the full-moon circle of ether", moon: "the full moon" }[c.shape];
  return `<figure class="cross-hero lx"><input type="checkbox" id="lx-${id}-c" class="lx-col"><input type="checkbox" id="lx-${id}-b" class="lx-br">
<svg viewBox="0 0 400 400" role="img" aria-labelledby="lx-${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="lx-${id}-t">The ${c.english} chakra, ${c.name}: a lotus of ${names[c.petals] || `${c.petals} petals`}, with ${shapeText} at its centre</title>
${bg(`lx${id}`, 400, 400)}<circle cx="200" cy="200" r="180" fill="url(#lx${id}-halo)" class="lx-halo"/>
<g transform="translate(200 200)">${lotusBody(c, 160, id)}</g></svg>
${controls(id, `<label for="lx-${id}-b" class="lx-lb">Breathe</label>`)}
<figcaption class="fine">${c.name}: ${names[c.petals] || `${c.petals} petals`}, with ${shapeText} at its centre${c.sound ? ` and the seed sound ${c.sound}` : ""}, as the old Sanskrit text describes it. "Show the colours" adds the modern rainbow colour. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

function all() {
  const W = 400, H = 760, x = 150, top = 70, step = 103;
  const ys = LOTUS.map((c, i) => H - top - i * step);
  const lotuses = LOTUS.map((c, i) => `<g class="lx-node" style="--i:${i}"><circle cx="${x}" cy="${ys[i]}" r="46" fill="${c.color}" opacity="0" class="lx-glow"/><g transform="translate(${x} ${ys[i]})">${lotusBody(c, 40, `a${c.n}`)}</g>
<text x="${x + 62}" y="${ys[i] - 4}" font-family="Georgia, serif" font-size="15" fill="${PALE}" font-weight="bold">${c.n}. ${c.name}</text>
<text x="${x + 62}" y="${ys[i] + 15}" font-family="Georgia, serif" font-size="12.5" fill="#d9cfee">${c.english} · ${c.petals === 1000 ? "1,000" : c.petals} petals</text></g>`).join("");
  return `<figure class="cross-hero lx lx-all"><input type="checkbox" id="lx-all-c" class="lx-col"><input type="checkbox" id="lx-all-r" class="lx-rise">
<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="lx-all-t" xmlns="http://www.w3.org/2000/svg"><title id="lx-all-t">The seven chakra lotuses along the spine, from the four-petalled root to the thousand-petalled crown</title>
${bg("lxa", W, H)}
<line x1="${x}" y1="${ys[6]}" x2="${x}" y2="${ys[0]}" stroke="${GOLD}" stroke-opacity=".5" stroke-width="3"/>
<text x="${x - 14}" y="${(ys[0] + ys[6]) / 2}" transform="rotate(-90 ${x - 14} ${(ys[0] + ys[6]) / 2})" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#bfb3dc" letter-spacing="3">SUSHUMNA</text>
<circle class="lx-dot" cx="${x}" cy="${ys[0]}" r="9" fill="${PALE}" opacity="0" style="--rise:${ys[6] - ys[0]}px"/>
${lotuses}</svg>
${controls("all", `<label for="lx-all-r" class="lx-lr">Energy rising</label>`)}
<figcaption class="fine">The seven lotuses along the central channel, the sushumna. Petal counts follow the <em>Ṣaṭ-Cakra-Nirūpaṇa</em>; the colours are the modern scheme. "Energy rising" shows the life-force climbing from root to crown, as the yoga traditions teach. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

export function lotusArt(key) {
  if (key === "lotus-all") return all();
  const c = LOTUS.find((l) => `lotus-${l.n}` === key);
  return c ? single(c) : "";
}
