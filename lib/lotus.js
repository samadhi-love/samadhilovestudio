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

// Traditional colours of the inner shapes (Ṣaṭ-Cakra-Nirūpaṇa): yellow earth, white water, red fire, smoky air, white ether.
const YANTRA_COL = { square: "#ffd54a", crescent: "#eef2ff", triangle: "#ff6b5a", star: "#b9c3d6", circle: "#f4f1ff", moon: PALE };
function yantra(c, r) {
  const col = c.n === 6 ? "#f4f1ff" : YANTRA_COL[c.shape] || PALE;
  const st = `fill="${col}" fill-opacity=".14" stroke="${col}" stroke-width="${f(Math.max(1.2, r / 20))}" stroke-linejoin="round"`;
  const tri = (down) => { const h = r * 0.85; const pts = down ? [[-h, -h * 0.5], [h, -h * 0.5], [0, h]] : [[-h, h * 0.5], [h, h * 0.5], [0, -h]]; return `<polygon points="${pts.map((p) => p.map(f).join(",")).join(" ")}" ${st}/>`; };
  switch (c.shape) {
    case "square": return `<rect x="${f(-r * 0.7)}" y="${f(-r * 0.7)}" width="${f(r * 1.4)}" height="${f(r * 1.4)}" ${st}/>`;
    case "crescent": return `<path d="M${f(-r * 0.8)} ${f(-r * 0.1)} A${f(r * 0.8)} ${f(r * 0.8)} 0 0 0 ${f(r * 0.8)} ${f(-r * 0.1)} A${f(r * 0.62)} ${f(r * 0.62)} 0 0 1 ${f(-r * 0.8)} ${f(-r * 0.1)} Z" ${st}/>`;
    case "triangle": return tri(true);
    case "star": return tri(true) + tri(false);
    case "circle": return `<circle r="${f(r * 0.72)}" ${st}/>`;
    case "moon": return `<circle r="${f(r * 0.8)}" fill="${PALE}" opacity=".9"/>`;
    default: return "";
  }
}

// One lotus at the origin, size s (outer petal radius). Rich lotuses get two layers of petals,
// a fine vein in each petal and a glowing centre; small ones (on the body) stay simple.
function lotusBody(c, s, id, rich = false) {
  const petals = petalsFor(c, s);
  const inner = c.petals === 1000 ? s * 0.18 : s * 0.34;
  const n = c.petals, step = 360 / n;
  const back = rich && n > 2 && n < 1000 ? petalRing(n, s * 0.3, s * 0.88, (n === 4 ? 45 : 0) + step / 2) : "";
  const veins = rich && n < 1000 ? (n === 2 ? [-90, 90] : Array.from({ length: n }, (_, i) => (n === 4 ? 45 : 0) + step * i))
    .map((a) => `<line x1="0" y1="${f(-inner - s * 0.06)}" x2="0" y2="${f(-s * 0.9)}" transform="rotate(${f(a)})"/>`).join("") : "";
  const dots = rich && n < 1000 ? (n === 2 ? [-90, 90] : Array.from({ length: n }, (_, i) => (n === 4 ? 45 : 0) + step * i))
    .map((a) => `<circle cx="0" cy="${f(-s * 0.86)}" r="${f(Math.max(1.5, s / 70))}" transform="rotate(${f(a)})"/>`).join("") : "";
  const sw = c.petals === 1000 ? Math.max(0.6, s / 160) : Math.max(1, s / 70);
  return `<defs><radialGradient id="${id}-pg" cx="0" cy="0" r="${f(s)}" gradientUnits="userSpaceOnUse"><stop offset=".3" stop-color="${c.color}" stop-opacity=".05"/><stop offset=".75" stop-color="${c.color}" stop-opacity=".28"/><stop offset="1" stop-color="${PALE}" stop-opacity=".4"/></radialGradient>
<radialGradient id="${id}-cg"><stop offset="0" stop-color="${c.color}" stop-opacity=".45"/><stop offset=".7" stop-color="#2e271a"/><stop offset="1" stop-color="#1f1b12"/></radialGradient></defs>
<g class="lx-b">
<g class="lx-s">${back ? `<g fill="url(#${id}-pg)" stroke="${GOLD}" stroke-opacity=".45" stroke-width="${f(sw * 0.8)}" opacity=".75">${back}</g>` : ""}
<g fill="url(#${id}-pg)">${petals}</g>
<g class="lx-fill" fill="${c.color}" opacity="0">${petals}</g>
<g fill="none" stroke="${GOLD}" stroke-width="${f(sw)}">${petals}</g>
${veins ? `<g stroke="${PALE}" stroke-width="${f(sw * 0.5)}" opacity=".45">${veins}</g><g fill="${PALE}" opacity=".8">${dots}</g>` : ""}
<circle class="lx-spark" cx="0" cy="${f(-s * 1.02)}" r="${f(Math.max(2.2, s / 22))}" fill="#fff8dc" opacity="0"/></g>
<circle r="${f(inner)}" fill="url(#${id}-cg)" stroke="${GOLD}" stroke-width="${f(Math.max(1, s / 80))}"/>
${rich ? `<circle r="${f(inner * 0.9)}" fill="none" stroke="${GOLD}" stroke-opacity=".5" stroke-width="${f(sw * 0.5)}" stroke-dasharray="2 4"/>` : ""}
<circle class="lx-fill" r="${f(inner)}" fill="${c.color}" opacity="0"/>
${yantra(c, inner * 0.82)}
${c.sound && s > 60 ? `<text y="${f(inner * 0.13)}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="${f(inner * (c.shape === "star" ? 0.22 : 0.36))}" fill="${GOLD}" stroke="#1f1b12" stroke-width="${f(inner * 0.06)}" paint-order="stroke">${c.sound}</text>` : ""}
</g>`;
}

const bg = (id, w, h) => `<defs><radialGradient id="${id}-sky" cx="50%" cy="45%" r="80%"><stop offset="0" stop-color="#483b20"/><stop offset="1" stop-color="#0d0b08"/></radialGradient>
<radialGradient id="${id}-halo"><stop offset="0" stop-color="#fff3c4" stop-opacity=".35"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" rx="18" fill="url(#${id}-sky)"/>`;

function controls(id, extra) {
  return `<div class="sgx-controls lx-controls"><label for="lx-${id}-c" class="lx-lc">Show the colours</label>${extra}</div>`;
}

function single(c) {
  const id = `c${c.n}`;
  const names = { 1000: "a thousand petals, suggested here in layers" };
  const shapeText = { square: "the yellow square of earth", crescent: "the white crescent moon of water", triangle: c.n === 3 ? "the downward triangle of fire" : "the downward triangle", star: "the six-pointed star of air", circle: "the full-moon circle of ether", moon: "the full moon" }[c.shape];
  return `<figure class="cross-hero lx"><input type="checkbox" id="lx-${id}-c" class="lx-col"><input type="checkbox" id="lx-${id}-b" class="lx-br"><input type="checkbox" id="lx-${id}-s" class="lx-spin" checked>
<svg viewBox="0 0 400 400" role="img" aria-labelledby="lx-${id}-t" xmlns="http://www.w3.org/2000/svg"><title id="lx-${id}-t">The ${c.english} chakra, ${c.name}: a lotus of ${names[c.petals] || `${c.petals} petals`}, with ${shapeText} at its centre</title>
${bg(`lx${id}`, 400, 400).replace("</defs>", `<radialGradient id="lx${id}-aura"><stop offset="0" stop-color="${c.color}" stop-opacity=".35"/><stop offset=".6" stop-color="${c.color}" stop-opacity=".1"/><stop offset="1" stop-color="${c.color}" stop-opacity="0"/></radialGradient></defs>`)}
<circle cx="200" cy="200" r="195" fill="url(#lx${id}-aura)"/><circle cx="200" cy="200" r="180" fill="url(#lx${id}-halo)" class="lx-halo"/>
<circle cx="200" cy="200" r="178" fill="none" stroke="${GOLD}" stroke-opacity=".35" stroke-width="1"/>${Array.from({ length: 36 }, (_, i) => { const a = (i * 10 * Math.PI) / 180; return `<circle cx="${f(200 + 178 * Math.cos(a))}" cy="${f(200 + 178 * Math.sin(a))}" r="${i % 3 ? 1.2 : 2.2}" fill="${PALE}" opacity="${i % 3 ? 0.4 : 0.8}"/>`; }).join("")}
<g transform="translate(200 200)">${lotusBody(c, 160, `lx${id}`, true)}</g></svg>
${controls(id, `<label for="lx-${id}-s" class="lx-ls">Spin</label><label for="lx-${id}-b" class="lx-lb">Breathe</label>`)}
<figcaption class="fine">${c.name}: ${names[c.petals] || `${c.petals} petals`}, with ${shapeText} at its centre${c.sound ? ` and the seed sound ${c.sound}` : ""}, as the old Sanskrit text describes it. "Show the colours" adds the modern rainbow colour; "Spin" turns the wheel, and "Breathe" opens and closes the lotus. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

// The seven lotuses on a seated meditator: a soft figure of light, never a realistic body.
const BODY_Y = [398, 342, 288, 228, 148, 101, 46];
const BODY_S = [27, 26, 27, 30, 21, 18, 34];
function all() {
  const W = 600, H = 480, cx = 220;
  const figure = `<g class="lx-body" transform="translate(${cx - 200} 0)" fill="url(#lxa-body)">
<circle cx="200" cy="106" r="30"/><rect x="188" y="128" width="24" height="30" rx="8"/>
<path d="M140 176 Q200 150 260 176 L249 300 Q256 338 264 372 L136 372 Q144 338 151 300 Z"/>
<g fill="none" stroke="url(#lxa-body)" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"><path d="M254 186 Q284 240 279 300 Q296 352 318 398"/><path d="M146 186 Q116 240 121 300 Q104 352 82 398"/></g>
<ellipse cx="200" cy="410" rx="150" ry="42"/><circle cx="320" cy="400" r="13"/><circle cx="80" cy="400" r="13"/></g>`;
  const lotuses = LOTUS.map((c, i) => `<g class="lx-node" style="--i:${i};--sp:${(5 + i * 0.8).toFixed(1)}s"><circle cx="${cx}" cy="${BODY_Y[i]}" r="${BODY_S[i] + 12}" fill="${c.color}" opacity="0" class="lx-glow"/><g transform="translate(${cx} ${BODY_Y[i]})">${lotusBody(c, BODY_S[i], `lxa${c.n}`, true)}</g>
<line x1="${cx + BODY_S[i] + 6}" y1="${BODY_Y[i]}" x2="388" y2="${BODY_Y[i]}" stroke="${c.color}" stroke-width="1" opacity=".45"/>
<text x="396" y="${BODY_Y[i] - 2}" font-family="Georgia, serif" font-size="15" fill="${PALE}" font-weight="bold">${c.n}. ${c.name}</text>
<text x="396" y="${BODY_Y[i] + 16}" font-family="Georgia, serif" font-size="12.5" fill="#d9cfee">${c.english} · ${c.petals === 1000 ? "1,000" : c.petals} petals</text></g>`).join("");
  return `<figure class="cross-hero lx lx-all"><input type="checkbox" id="lx-all-c" class="lx-col"><input type="checkbox" id="lx-all-s" class="lx-spin" checked><input type="checkbox" id="lx-all-b" class="lx-br"><input type="checkbox" id="lx-all-r" class="lx-rise">
<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="lx-all-t" xmlns="http://www.w3.org/2000/svg"><title id="lx-all-t">A seated meditator drawn in soft light, with the seven chakra lotuses along the spine, from the four-petalled root to the thousand-petalled crown above the head</title>
${bg("lxa", W, H).replace("</defs>", `<linearGradient id="lxa-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b3a86"/><stop offset="1" stop-color="#4e4025"/></linearGradient><filter id="lxa-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter></defs>`)}
<ellipse cx="${cx}" cy="230" rx="170" ry="220" fill="#fff3c4" opacity=".07" filter="url(#lxa-soft)"/>
<g opacity=".9">${figure}</g>
<line x1="${cx}" y1="${BODY_Y[6]}" x2="${cx}" y2="${BODY_Y[0]}" stroke="${GOLD}" stroke-opacity=".55" stroke-width="2.5"/>
<circle class="lx-dot" cx="${cx}" cy="${BODY_Y[0]}" r="8" fill="${PALE}" opacity="0" style="--rise:${BODY_Y[6] - BODY_Y[0]}px"/>
${lotuses}</svg>
${controls("all", `<label for="lx-all-s" class="lx-ls">Spin</label><label for="lx-all-b" class="lx-lb">Open and close</label><label for="lx-all-r" class="lx-lr">Energy rising</label>`)}
<figcaption class="fine">The seven lotuses on the body of a meditator, along the central channel, the sushumna: from the root at the base of the spine to the thousand-petalled crown above the head. Petal counts follow the <em>Ṣaṭ-Cakra-Nirūpaṇa</em>; the colours are the modern scheme. "Spin" turns the wheels, "Open and close" lets every lotus breathe, and "Energy rising" shows the life-force climbing from root to crown, as the yoga traditions teach. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}

export function lotusArt(key) {
  if (key === "lotus-all") return all();
  const c = LOTUS.find((l) => `lotus-${l.n}` === key);
  return c ? single(c) : "";
}
