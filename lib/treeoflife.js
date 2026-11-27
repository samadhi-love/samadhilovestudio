// The Tree of Life: its own branch of the Library of Light, right after the Chakras.
// Every fact here was checked against scholarly and traditional sources (Nov 2026).
// Quotations are from public-domain translations only: King James Bible, Pickthall's Qur'an (1930),
// Edwin Arnold's Gita (1885), Bellows' Poetic Edda (1923). Where scholars disagree, the page says so.

// The ten Sefirot, drawn for SAMADHI LOVE: gold on a night sky. No outside images.
const S = {
  keter: [200, 58, "Keter", "Crown"],
  chokhmah: [318, 128, "Chokhmah", "Wisdom"],
  binah: [82, 128, "Binah", "Understanding"],
  daat: [200, 196, "Da'at", "Knowledge"],
  chesed: [318, 268, "Chesed", "Loving-kindness"],
  gevurah: [82, 268, "Gevurah", "Strength"],
  tiferet: [200, 338, "Tiferet", "Beauty"],
  netzach: [318, 448, "Netzach", "Endurance"],
  hod: [82, 448, "Hod", "Splendour"],
  yesod: [200, 518, "Yesod", "Foundation"],
  malkhut: [200, 618, "Malkhut", "Kingdom"],
};
// The 22 paths, as most modern diagrams draw them (Kircher, 1653, and the Western tradition after him).
const PATHS = [
  ["keter", "chokhmah"], ["keter", "binah"], ["keter", "tiferet"], ["chokhmah", "binah"], ["chokhmah", "tiferet"],
  ["chokhmah", "chesed"], ["binah", "tiferet"], ["binah", "gevurah"], ["chesed", "gevurah"], ["chesed", "tiferet"],
  ["chesed", "netzach"], ["gevurah", "tiferet"], ["gevurah", "hod"], ["tiferet", "netzach"], ["tiferet", "yesod"],
  ["tiferet", "hod"], ["netzach", "hod"], ["netzach", "yesod"], ["netzach", "malkhut"], ["hod", "yesod"],
  ["hod", "malkhut"], ["yesod", "malkhut"],
];

function stars(n, w, h, seed) {
  let s = seed, out = "";
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) out += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(r() * 1.2 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`;
  return out;
}

function sefirotArt() {
  const lines = PATHS.map(([a, b]) => `<line x1="${S[a][0]}" y1="${S[a][1]}" x2="${S[b][0]}" y2="${S[b][1]}"/>`).join("");
  const node = (k) => {
    const [x, y, he, en] = S[k];
    const hidden = k === "daat", heart = k === "tiferet";
    return `<g><circle cx="${x}" cy="${y}" r="31" fill="${heart ? "url(#tol-heart)" : "#120d24"}" stroke="${hidden ? "#c9b98a" : "url(#tol-gold)"}" stroke-width="${hidden ? 1.5 : 3}"${hidden ? ' stroke-dasharray="5 5" opacity=".8"' : ""}/>
<text x="${x}" y="${y + 4}" text-anchor="middle" font-family="Georgia, serif" font-size="${he.length > 7 ? 11 : 12.5}" fill="${heart ? "#1a1230" : "#fff3c4"}" font-weight="bold">${he}</text>
<text x="${x}" y="${y + 47}" text-anchor="middle" font-family="Georgia, serif" font-size="11.5" fill="#d9cfee">${en}</text></g>`;
  };
  return `<figure class="cross-hero tol-figure"><svg viewBox="0 0 400 700" role="img" aria-labelledby="tol-t" xmlns="http://www.w3.org/2000/svg"><title id="tol-t">The Tree of Life: the ten Sefirot in three pillars, joined by twenty-two paths</title>
<defs><linearGradient id="tol-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f2c46d"/><stop offset="1" stop-color="#b8862f"/></linearGradient>
<radialGradient id="tol-sky" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#2a1f4a"/><stop offset="1" stop-color="#07060f"/></radialGradient>
<radialGradient id="tol-heart" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#fff8dc"/><stop offset="1" stop-color="#f2c46d"/></radialGradient>
<radialGradient id="tol-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".45"/><stop offset="1" stop-color="#f2c46d" stop-opacity="0"/></radialGradient></defs>
<rect width="400" height="700" rx="18" fill="url(#tol-sky)"/>${stars(60, 400, 700, 7717)}
<circle cx="200" cy="338" r="120" fill="url(#tol-halo)"/>
<text x="82" y="26" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#bfb3dc" letter-spacing="1">SEVERITY</text>
<text x="200" y="20" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#bfb3dc" letter-spacing="1">BALANCE</text>
<text x="318" y="26" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#bfb3dc" letter-spacing="1">MERCY</text>
<g stroke="#f2c46d" stroke-opacity=".55" stroke-width="2.2">${lines}</g>
${Object.keys(S).map(node).join("")}</svg>
<figcaption class="fine">The ten Sefirot in three pillars, joined by twenty-two paths. The dotted circle is Da'at, the hidden one, which is not counted with the ten. Tiferet, the heart, shines at the centre. Drawn for SAMADHI LOVE.</figcaption></figure>`;
}


// The animated Tree of Life explorer for the Ten Sefirot page.
// Only CSS drives it (radio buttons), because the site allows no inline scripts.
const FLASH = ["keter", "chokhmah", "binah", "chesed", "gevurah", "tiferet", "netzach", "hod", "yesod", "malkhut"];
function smooth(keys) {
  const p = keys.map((k) => [S[k][0], S[k][1]]);
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], n = p[i + 2] || c;
    const c1 = [b[0] + (c[0] - a[0]) / 5, b[1] + (c[1] - a[1]) / 5], c2 = [c[0] - (n[0] - b[0]) / 5, c[1] - (n[1] - b[1]) / 5];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${c[0]} ${c[1]}`;
  }
  return d;
}
const TX_STEPS = [
  ["tree", "The Tree", `<h3>The Tree of Life</h3><p>Ten spheres of light, the <strong>Sefirot</strong>, joined by twenty-two paths. In Kabbalah each sphere is a quality through which the light of the Infinite, <em>Ein Sof</em>, flows into creation. Choose a button to see the tree come alive, one teaching at a time.</p>`],
  ["pillars", "Three pillars", `<h3>The three pillars</h3><p>On the right, the pillar of <strong>Mercy</strong>: Chokhmah, Chesed, Netzach. On the left, the pillar of <strong>Severity</strong>: Binah, Gevurah, Hod. In the middle, the pillar of <strong>Balance</strong>: Keter, Tiferet, Yesod, Malkhut.</p><p>Love without limits floods; limits without love become cruelty. Holiness lives in the middle, where both are held together.</p>`],
  ["flash", "The lightning flash", `<h3>The light comes down</h3><p>The light flows from the Crown, <strong>Keter</strong>, through every sphere in order, one to ten, down to <strong>Malkhut</strong>, this world. Later teachers drew this path as a zig-zag flash of lightning: creation pouring out of the Divine.</p>`],
  ["return", "The path of return", `<h3>The soul climbs home</h3><p>The soul begins in Malkhut, this world, and climbs back up the way the light came down, sphere by sphere, toward the Crown. Every prayer, every good deed and every act of balance is a step.</p><p>The Western mystery schools pictured this climb as a serpent of wisdom winding up the tree.</p>`],
  ["paths", "The 22 paths", `<h3>The twenty-two paths</h3><p>The oldest book of Kabbalah, the <em>Sefer Yetzirah</em>, speaks of <strong>thirty-two paths of wisdom</strong>: the ten sefirot and the twenty-two letters of the Hebrew alphabet. On the tree, each line joining two spheres is one of the twenty-two. Watch them light up one by one.</p><p>Different schools joined the paths in different ways; this drawing follows the layout most people know today.</p>`],
  ["triads", "Three triangles", `<h3>The three triangles</h3><p>Many teachers read the tree as three triangles and a final sphere:</p><ul><li><strong>The highest triangle</strong> (Keter, Chokhmah, Binah): the Divine mind.</li><li><strong>The middle triangle</strong> (Chesed, Gevurah, Tiferet): the heart and the moral life.</li><li><strong>The lower triangle</strong> (Netzach, Hod, Yesod): the life of nature, feeling and form.</li><li><strong>Malkhut</strong>: this world, where all of it comes to rest.</li></ul>`],
  ["worlds", "Four worlds", `<h3>The four worlds</h3><p>The light steps down through four worlds: <strong>Atzilut</strong> (Emanation), <strong>Beriah</strong> (Creation), <strong>Yetzirah</strong> (Formation) and <strong>Asiyah</strong> (Action). The colours show one common way of placing them on the tree, used by the Western mystery schools.</p><p>Jewish Kabbalah teaches that the whole tree is present in each of the four worlds. See <a href="/teachings/the-four-worlds">The Four Worlds</a>.</p>`],
];
const TX_WORLDS = [[0, 205, "#fff3c4", "ATZILUT"], [205, 395, "#9fc8ff", "BERIAH"], [395, 565, "#c9a7ff", "YETZIRAH"], [565, 700, "#9fe7b0", "ASIYAH"]];
function treeExplorer() {
  const pt = (k) => `${S[k][0]},${S[k][1]}`;
  const inputs = TX_STEPS.map(([id], i) => `<input type="radio" name="tx-step" id="tx-${id}" class="tx-in"${i === 0 ? " checked" : ""}>`).join("");
  const labels = TX_STEPS.map(([id, name]) => `<label for="tx-${id}">${name}</label>`).join("");
  const notes = TX_STEPS.map(([id, , html]) => `<div class="tx-note tx-n-${id}">${html}</div>`).join("");
  const pillars = [[82, "SEVERITY"], [200, "BALANCE"], [318, "MERCY"]].map(([x, t], i) => `<g class="tx-pillar" style="animation-delay:${i * 0.5}s"><rect x="${x - 44}" y="30" width="88" height="${x === 200 ? 640 : 470}" rx="44" fill="${["#ff9a8a", "#fff3c4", "#9fc8ff"][i]}" opacity=".16"/><text x="${x}" y="${x === 200 ? 690 : 524}" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="#fff3c4" letter-spacing="2">${t}</text></g>`).join("");
  const worlds = TX_WORLDS.map(([y0, y1, c, t], i) => `<g class="tx-world" style="animation-delay:${i * 0.6}s"><rect x="8" y="${y0 + 4}" width="384" height="${y1 - y0 - 8}" rx="14" fill="${c}" opacity=".13"/><text x="20" y="${y0 + 22}" font-family="Georgia, serif" font-size="11" fill="${c}" letter-spacing="2">${t}</text></g>`).join("");
  const tri = [["keter", "chokhmah", "binah", "#fff3c4"], ["chesed", "gevurah", "tiferet", "#ffb3c7"], ["netzach", "hod", "yesod", "#b3a6ff"]].map(([a, b, c, col], i) => `<polygon class="tx-tri" style="animation-delay:${i * 0.7}s" points="${pt(a)} ${pt(b)} ${pt(c)}" fill="${col}" fill-opacity=".2" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>`).join("");
  const paths = PATHS.map(([a, b], i) => `<line class="tx-path" style="animation-delay:${(i * 0.32).toFixed(2)}s" x1="${S[a][0]}" y1="${S[a][1]}" x2="${S[b][0]}" y2="${S[b][1]}"/>`).join("");
  const base = PATHS.map(([a, b]) => `<line x1="${S[a][0]}" y1="${S[a][1]}" x2="${S[b][0]}" y2="${S[b][1]}"/>`).join("");
  const flashPts = FLASH.map(pt).join(" ");
  const node = (k) => {
    const [x, y, he, en] = S[k];
    const hidden = k === "daat";
    const fi = FLASH.indexOf(k);
    return `<g class="tx-node"${fi >= 0 ? ` style="--d:${fi}"` : ""}><circle class="tx-orb" cx="${x}" cy="${y}" r="31" fill="#120d24" stroke="${hidden ? "#c9b98a" : "url(#tx-gold)"}" stroke-width="${hidden ? 1.5 : 3}"${hidden ? ' stroke-dasharray="5 5" opacity=".8"' : ""}/>
<text x="${x}" y="${y + 4}" text-anchor="middle" font-family="Georgia, serif" font-size="${he.length > 7 ? 11 : 12.5}" fill="#fff3c4" font-weight="bold">${he}</text>
<text x="${x}" y="${y + 47}" text-anchor="middle" font-family="Georgia, serif" font-size="11.5" fill="#d9cfee">${en}</text></g>`;
  };
  return `<figure class="cross-hero tolx">${inputs}<svg viewBox="0 0 400 700" role="img" aria-labelledby="tx-t" xmlns="http://www.w3.org/2000/svg"><title id="tx-t">The Tree of Life, animated: the ten Sefirot in three pillars, joined by twenty-two paths</title>
<defs><linearGradient id="tx-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f2c46d"/><stop offset="1" stop-color="#b8862f"/></linearGradient>
<radialGradient id="tx-sky" cx="50%" cy="40%" r="80%"><stop offset="0" stop-color="#2a1f4a"/><stop offset="1" stop-color="#07060f"/></radialGradient>
<filter id="tx-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect width="400" height="700" rx="18" fill="url(#tx-sky)"/>${stars(60, 400, 700, 9311)}
<g class="tx-layer tx-l-worlds">${worlds}</g>
<g class="tx-layer tx-l-pillars">${pillars}</g>
<g stroke="#f2c46d" stroke-opacity=".45" stroke-width="2.2">${base}</g>
<g class="tx-layer tx-l-paths" stroke="#fff3c4" stroke-width="4" stroke-linecap="round" filter="url(#tx-glow)">${paths}</g>
<g class="tx-layer tx-l-triads">${tri}</g>
<polyline class="tx-layer tx-l-flash" points="${flashPts}" pathLength="1" fill="none" stroke="#fff8dc" stroke-width="5" stroke-linejoin="miter" stroke-linecap="round" filter="url(#tx-glow)"/>
<path class="tx-layer tx-l-return" d="${smooth([...FLASH].reverse())}" pathLength="1" fill="none" stroke="#9fe7b0" stroke-width="5" stroke-linecap="round" filter="url(#tx-glow)"/>
${Object.keys(S).map(node).join("")}</svg>
<div class="tx-side"><div class="sgx-controls tx-controls">${labels}</div>${notes}</div>
<figcaption class="fine">The Tree of Life, drawn and animated for SAMADHI LOVE. Choose a button to explore it.</figcaption></figure>`;
}


// Samadhi's golden tree with the Tree of Life drawn over it: the same ten Sefirot and the same 22 paths
// as the drawings above, scaled so Keter crowns the leaves and Malkhut rests in the roots.
// Gentle light flows down the paths, each sphere glows in turn, then the whole tree glows together.
// Tapping a sphere shows its meaning (a plain link to the note below works without scripts too).
const HE = { keter: "כתר", chokhmah: "חכמה", binah: "בינה", daat: "דעת", chesed: "חסד", gevurah: "גבורה", tiferet: "תפארת", netzach: "נצח", hod: "הוד", yesod: "יסוד", malkhut: "מלכות" };
const PILLAR = { keter: "Balance", daat: "Balance", tiferet: "Balance", yesod: "Balance", malkhut: "Balance", chokhmah: "Mercy", chesed: "Mercy", netzach: "Mercy", binah: "Severity", gevurah: "Severity", hod: "Severity" };
const NOTE = {
  keter: "Pure divine will, closest to the Infinite. The first and highest sphere, where the light of Ein Sof first shines into creation.",
  chokhmah: "The first flash of insight, before any words. Wisdom heads the pillar of Mercy.",
  binah: "The mind that gives the flash its shape and detail. Understanding heads the pillar of Severity.",
  daat: "The hidden one, drawn as a dotted circle. Here wisdom and understanding join and become real knowing. The Kabbalists never count it with the ten.",
  chesed: "Love that gives freely, without limit.",
  gevurah: "Strength and judgement: the power to set limits and say no. Love with no limits floods and drowns; Gevurah gives it form.",
  tiferet: "Beauty and harmony: the heart, where love and judgement meet in balance. It shines at the centre of the tree.",
  netzach: "Endurance and victory: the drive to persist and overcome.",
  hod: "Splendour: humility, gratitude and form.",
  yesod: "Foundation: the channel that gathers all the lights and passes them on.",
  malkhut: "Kingdom: this world, and the presence of God within it, the Shekhinah. Here the soul begins its climb back home.",
};
const TL = (k) => [400 + (S[k][0] - 200) * 1.42, 125 + (S[k][1] - 58) * 1.42];
const STEP = 0.9; // seconds between one sphere and the next
function goldenTree() {
  const r = 64;
  const fit = (t, base, room, w = 0.54) => Math.min(base, room / (t.length * w)).toFixed(1);
  const paths = PATHS.map(([a, b]) => {
    // Light always flows downward, from the sphere higher on the tree (or earlier in the order) to the lower.
    const [p, q] = FLASH.indexOf(a) <= FLASH.indexOf(b) ? [a, b] : [b, a];
    const [x1, y1] = TL(p), [x2, y2] = TL(q), len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const s = [x1 + ux * r, y1 + uy * r], e = [x2 - ux * r, y2 - uy * r];
    const d = `M${s[0].toFixed(1)} ${s[1].toFixed(1)}L${e[0].toFixed(1)} ${e[1].toFixed(1)}`;
    return [`<path d="${d}"/>`, `<path class="tl-flow" d="${d}" pathLength="1" style="animation-delay:${(FLASH.indexOf(p) * STEP + 0.3).toFixed(2)}s"/>`];
  });
  // Long meanings go on two lines so they stay readable on a phone.
  const SPLIT = { "Loving-kindness": ["Loving-", "kindness"], Understanding: ["Under-", "standing"] };
  const meaning = (x, y, en) => SPLIT[en]
    ? SPLIT[en].map((t, j) => `<text x="${x.toFixed(1)}" y="${(y + 6 + j * 20).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#f6e2b0">${t}</text>`).join("")
    : `<text x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-size="${fit(en, 23, 118)}" fill="#f6e2b0">${en}</text>`;
  const node = (k) => {
    const [x, y] = TL(k), [, , name, en] = S[k], hidden = k === "daat", i = FLASH.indexOf(k), two = Boolean(SPLIT[en]);
    return `<a href="#tln-${k}" class="tl-node${hidden ? " tl-daat" : ""}" data-tl="${k}" aria-label="${name}, ${en}"><g${i >= 0 ? ` class="tl-pulse" style="animation-delay:${(i * STEP).toFixed(2)}s"` : ""}>
<circle class="tl-halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 10}" fill="url(#tl-halo)"/>
<circle class="tl-orb" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#1a1206" fill-opacity="${hidden ? 0.35 : 0.62}" stroke="${hidden ? "#f6e2b0" : "url(#tl-gold)"}" stroke-width="${hidden ? 2.5 : 4}"${hidden ? ' stroke-dasharray="7 7"' : ""}/></g>
<text x="${x.toFixed(1)}" y="${(y - (two ? 20 : 14)).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="${fit(name, 27, 112, 0.62)}" fill="#fff3c4">${name}</text>
${meaning(x, y, en)}
<text x="${x.toFixed(1)}" y="${(y + (two ? 50 : 42)).toFixed(1)}" text-anchor="middle" direction="rtl" font-family="'SBL Hebrew', 'Ezra SIL', 'Times New Roman', serif" font-size="27" fill="#ffe39a">${HE[k]}</text></a>`;
  };
  const titles = [["SEVERITY", TL("binah")[0]], ["BALANCE", 400], ["MERCY", TL("chokhmah")[0]]].map(([t, x]) => `<text x="${x.toFixed(1)}" y="44" text-anchor="middle" font-family="Georgia, serif" font-size="22" letter-spacing="4" fill="#fff3c4">${t}</text>`).join("");
  const notes = Object.keys(S).map((k) => `<div class="tl-note" id="tln-${k}"><h3>${S[k][2]} · ${S[k][3]} · <span lang="he" dir="rtl">${HE[k]}</span></h3><p class="fine">The pillar of ${PILLAR[k]}</p><p>${NOTE[k]}</p></div>`).join("");
  return `<figure class="cross-hero tl-gold-figure">
<svg viewBox="0 0 800 1000" role="img" aria-labelledby="tl-gold-t" xmlns="http://www.w3.org/2000/svg"><title id="tl-gold-t">The Tree of Life drawn in gold over a great golden tree: ten spheres in three pillars, Severity, Balance and Mercy, joined by twenty-two paths, from Keter at the top of the leaves to Malkhut in the roots</title>
<defs><linearGradient id="tl-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".5" stop-color="#f2c46d"/><stop offset="1" stop-color="#c8963a"/></linearGradient>
<radialGradient id="tl-halo"><stop offset=".6" stop-color="#ffe39a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient>
<filter id="tl-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="tl-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140c2c" stop-opacity=".75"/><stop offset="1" stop-color="#140c2c" stop-opacity="0"/></linearGradient></defs>
<image href="/images/tree-of-life-gold.jpg" width="800" height="1000"/>
<rect width="800" height="90" fill="url(#tl-top)"/>
<rect width="800" height="1000" fill="#0a0612" opacity=".16"/>
${titles}
<g class="tl-all">
<g stroke="#ffe39a" stroke-width="3" stroke-opacity=".75" fill="none" filter="url(#tl-glow)">${paths.map((p) => p[0]).join("")}</g>
<g stroke="#fffbe8" stroke-width="6" stroke-linecap="round" fill="none" filter="url(#tl-glow)">${paths.map((p) => p[1]).join("")}</g>
<g paint-order="stroke" stroke="#1a1206" stroke-width="4" stroke-linejoin="round" stroke-opacity=".7">${Object.keys(S).map(node).join("")}</g>
</g></svg>
<div class="tl-notes" aria-live="polite"><div class="tl-note tl-hint is-open"><p><strong>Tap a sphere</strong> to read what it means.</p></div>${notes}</div>
<figcaption class="fine">The Tree of Life over a great golden tree: Keter, the Crown, at the top of the leaves, and Malkhut, the Kingdom, in the roots. Light flows down the twenty-two paths, and each sphere glows in turn. Picture shared by Samadhi; the tree drawn for SAMADHI LOVE.</figcaption></figure>`;
}

export function treeArt(key) {
  if (key === "tree-sefirot") return sefirotArt();
  if (key === "tree-explorer") return treeExplorer();
  if (key === "tree-gold") return goldenTree();
  return "";
}

const sourcesNote = (lines) => `\n\n## Sources\n${lines.map((l) => `- ${l}`).join("\n")}`;

export const treeOfLife = [
  { slug: "the-tree-of-life", tag: "Overview", title: "The Tree of Life: One Symbol, Many Traditions",
    summary: "Roots in the unseen, fruit in this world. How the Bible, the Qur'an, Kabbalah, the Norse, Hindu, Buddhist, Egyptian and Maya traditions all drew the same great tree, and what it teaches.",
    body: `Almost every people on earth has pictured the universe as a great tree. Its roots reach into the hidden source, its trunk rises through our world, and its branches touch the heavens. Life flows down from the source, and the soul grows back up toward it.

This branch of the Library gathers what each tradition truly teaches about the Tree of Life. Each page keeps apart what the scriptures say, what the mystics teach, and what historians can confirm.

## The Tree across the world

| Tradition | The tree | What it teaches |
| --- | --- | --- |
| The Bible | The Tree of Life in Eden and in the heavenly city | Life with God, lost at the start and given back at the end |
| The Qur'an | The good tree, and the Lote Tree of the Utmost Boundary | A good word grows like a tree with branches in heaven |
| Kabbalah | The ten Sefirot | How the light of God flows into creation, and how the soul climbs back |
| Norse | Yggdrasil, the great ash | The tree that holds the nine worlds together |
| Hindu | The eternal ashvattha | A tree with its roots above and its branches below |
| Buddhist | The Bodhi tree | The place of awakening |
| Ancient Egypt | The sacred ished tree of Heliopolis | The gods write the king's name on its leaves |
| Maya | The world tree, often a ceiba | The centre of the world, joining underworld, earth and sky |

## What they share
- **The source is above or within, hidden from the eyes.** The roots are in the unseen.
- **Everything is connected.** One trunk carries many branches, as one God carries many worlds.
- **There is a way back.** The tree is also a ladder for the soul.
- **Balance is the path.** In Kabbalah the tree stands on three pillars, and the middle pillar is the way of harmony.

## Pages in this branch
- [The Ten Sefirot: The Tree of Life in Kabbalah](/teachings/the-ten-sefirot), with an animated tree to explore
- [The Four Worlds: How the Light Comes Down](/teachings/the-four-worlds)
- [The Breaking of the Vessels and the Mending of the World](/teachings/the-breaking-of-the-vessels)
- [The Tree of Life in the Bible and the Qur'an](/teachings/tree-of-life-in-scripture)
- [The World Trees: Yggdrasil, the Ashvattha, the Bodhi Tree and More](/teachings/the-world-trees)
- [The Tree in the Western Mysteries](/teachings/the-tree-in-the-western-mysteries)
- [Living the Tree of Life](/teachings/living-the-tree-of-life)

See also [How God Built the Universe: The 22 Letters and the 32 Paths](/teachings/the-32-paths-of-wisdom) in The Mystics.

## Sources

- Genesis 2:9 and Revelation 22:2, King James Bible; Qur'an 14:24–25 and 53:14.
- Bhagavad Gita 15:1 and *Katha Upanishad* 2.3.1, on the ashvattha.
- *Grímnismál* and *Völuspá* in the *Poetic Edda*, on Yggdrasil.
- [Britannica: Tree of Life](https://www.britannica.com/topic/tree-of-life-religion) and [world tree](https://www.britannica.com/topic/world-tree).
- The sources for each tradition are given on its own page in this branch.` },

  { slug: "the-ten-sefirot", tag: "Kabbalah", title: "The Ten Sefirot: The Tree of Life in Kabbalah",
    summary: "The great diagram of Jewish mysticism: ten qualities of God in three pillars, joined by twenty-two paths. What each one means, where the teaching comes from, and how the soul climbs back up.",
    body: `{{tree-gold}}

In Kabbalah, the mystical tradition of Judaism, the Tree of Life (*Etz Chayim*) is a map of how the Infinite gives itself to creation. Kabbalists call God in His hidden essence *Ein Sof*, "without end". Nothing can be said about Ein Sof. But the light of Ein Sof shines out through ten qualities, the **Sefirot**, and these can be known.

{{tree-explorer}}

## The ten Sefirot

| | Sefirah | Meaning | What it is |
| --- | --- | --- | --- |
| 1 | Keter | Crown | Pure divine will, closest to the Infinite |
| 2 | Chokhmah | Wisdom | The first flash of insight, before any words |
| 3 | Binah | Understanding | The mind that gives the flash its shape and detail |
| 4 | Chesed | Loving-kindness | Love that gives freely, without limit |
| 5 | Gevurah | Strength, judgement | The power to set limits and say no |
| 6 | Tiferet | Beauty, harmony | The heart, where love and judgement meet in balance |
| 7 | Netzach | Endurance, victory | The drive to persist and overcome |
| 8 | Hod | Splendour | Humility, gratitude and form |
| 9 | Yesod | Foundation | The channel that gathers all the lights and passes them on |
| 10 | Malkhut | Kingdom | This world, and the presence of God within it, the *Shekhinah* |

## The three pillars
The Sefirot stand in three columns:
- **The pillar of Mercy** on the right: Chokhmah, Chesed, Netzach.
- **The pillar of Severity** on the left: Binah, Gevurah, Hod.
- **The middle pillar of Balance**: Keter, Tiferet, Yesod, Malkhut.

This is the heart of the teaching. Love with no limits floods and drowns. Judgement with no love becomes cruelty. Holiness lives in the middle, where the two are held together. That is why Tiferet, the heart of the tree, is called Beauty: beauty is harmony.

## Da'at, the hidden one
Between Chokhmah and Binah many diagrams show a dotted circle, **Da'at**, "Knowledge". It is where wisdom and understanding join and become real knowing. The Kabbalists never count more than ten: when Da'at is counted, Keter is left out, because the Crown is too high to be counted with the rest. Isaac Luria usually counted it this way.

## Down and up the tree
- **The light comes down** from Keter to Malkhut in order, from one to ten. Later writers drew this path as a zig-zag flash of lightning.
- **The soul climbs back up** from Malkhut, this world, toward the Crown. Every good deed, every prayer and every act of balance between love and limits is a step on the way home.

## Where the teaching comes from
- **Sefer Yetzirah**, the "Book of Formation", is the oldest source. It speaks of 32 paths of wisdom: ten *sefirot* and the 22 letters of the Hebrew alphabet. In this early book the ten sefirot are the ten primal numbers, not yet the qualities of God of later Kabbalah.
- **The Bahir**, first known in Provence in southern France in 1176, already speaks of the divine powers as a tree.
- **The Zohar**, the great book of Kabbalah, appeared in Castile in Spain in the late 13th century, through Moses de León. Tradition gives it to the 2nd-century sage Shimon bar Yochai.
- **In Safed**, in the Galilee, the 16th century brought the great masters: Moses Cordovero (1522 to 1570) and Isaac Luria (1534 to 1572), whose teachings were written down by Hayyim Vital in the book called *Etz Chayim*, "Tree of Life".
- **The drawing itself changed over time.** Jewish Kabbalists drew the Sefirot in several ways, and the paths between them were joined differently from one school to another. The layout most people know today was printed by the Jesuit scholar Athanasius Kircher in 1653, building on earlier diagrams. See [The Tree in the Western Mysteries](/teachings/the-tree-in-the-western-mysteries).

## A word of respect
Kabbalah is the living mystical tradition of the Jewish people. For centuries its teachers asked that students first be grounded in study, ethics and a steady life. A well-known rabbinic custom, recorded in the 17th century, says one should wait until the age of forty, the age of understanding in the Mishnah. Many great Kabbalists began younger, and today many teachers open the study more widely. The spirit of the custom remains wise: this knowledge is meant to be lived with a humble heart, not collected.${sourcesNote([
      "Sefer Yetzirah 1:1, translated by W. Wynn Westcott (1887).",
      "Gershom Scholem, *Major Trends in Jewish Mysticism* (1941) and *Kabbalah* (1974).",
      "Mishnah, Pirkei Avot 5:21 (forty is the age of understanding); Shach on Shulchan Aruch, Yoreh De'ah 246.",
      "Daniel Stolzenberg on Kircher's tree, and Kircher, *Oedipus Aegyptiacus*, vol. 2 (1653).",
    ])}` },

  { slug: "the-four-worlds", tag: "Kabbalah", title: "The Four Worlds: How the Light Comes Down",
    summary: "Emanation, Creation, Formation and Action: the four levels through which the light of God steps down into our world, and the same four levels inside every human being.",
    body: `The Kabbalists teach that the light of God does not fall into our world all at once. It steps down through four worlds, each one a little more veiled than the one above, like light passing through four curtains. The whole Tree of Life is present in each world.

They found the names of the four worlds in one verse of the prophet Isaiah:

> "Even every one that is called by my name: for I have created him for my glory, I have formed him; yea, I have made him." (Isaiah 43:7, King James Bible)

## The four worlds

| World | Meaning | What it is | In the human being |
| --- | --- | --- | --- |
| Atzilut | Emanation | Pure divine light, still one with God | The spark of the soul, mind and heart united with God |
| Beriah | Creation | The first sense of something apart from God | Thought |
| Yetzirah | Formation | Things take on shape and feeling | Speech and emotion |
| Assiah | Action | The world of doing, ending in the physical world | Action |

Some teachers add a fifth world above all four, *Adam Kadmon*, the "primordial human": the first pure blueprint of creation.

## What it means for us
The four worlds are not far-away places in space. Chabad teachers describe them as four levels of perception, all present here and now. A single good deed passes through all four: it begins as a spark of will, becomes a thought, then a word, then an action in the world. That is why the mystics say that our small acts are felt in the highest worlds, and why intention matters as much as the act.${sourcesNote([
      "Isaiah 43:7, King James Bible.",
      "Chabad.org, \"The Four Worlds\".",
      "Gershom Scholem, *Kabbalah* (1974), on the doctrine of the worlds.",
    ])}` },

  { slug: "the-breaking-of-the-vessels", tag: "Kabbalah", title: "The Breaking of the Vessels and the Mending of the World",
    summary: "Isaac Luria's great vision: God made room for the world, the vessels of light shattered, and sparks of holiness fell everywhere. Our task is to lift them up, one kind act at a time.",
    body: `In the 16th century, in the hill town of Safed in the Galilee, a young master named **Isaac Luria** (1534 to 1572), called the *Ari*, "the Lion", gave Kabbalah its most moving story. He wrote almost nothing himself. His student Hayyim Vital recorded his teachings, above all in the book *Etz Chayim*, "Tree of Life". Luria died at about thirty-eight, yet his vision shaped Jewish spirituality for centuries.

The great scholar Gershom Scholem summed it up in three words: **tzimtzum**, **shevirah** and **tikkun**.

## 1. Tzimtzum: God makes room
Before creation, the light of the Infinite filled everything. For a world to exist, God drew His light back into Himself, leaving an empty space. Into that space He sent a single ray of light.

*The teaching:* love makes room for the other. To create, even God steps back.

## 2. Shevirah: the vessels break
The light came down into vessels, the Sefirot, to be held. The higher vessels held it. The lower ones could not bear so much light, and they shattered. Sparks of holy light fell and were scattered through all of creation, hidden in shells of darkness.

*The teaching:* the brokenness of the world is real. But there is holy light hidden inside everything, even inside what looks dark.

## 3. Tikkun: the mending
The task of every soul is to find the sparks and lift them back up. We do this through kindness, prayer, honesty, study and love: every good deed done with the right intention raises a spark. When all the sparks are gathered, the world will be whole.

The phrase *tikkun olam*, "the mending of the world", is used widely today for acts of justice and kindness. Its mystical root is here.

## For our life
- **Nothing is wasted.** Even pain and failure hold a spark that can be lifted.
- **Every person matters.** Each soul has its own sparks that only it can raise.
- **Small acts are great acts.** A kind word lifts a spark as surely as a great prayer.
- **Forgiveness is mending.** See [The Power of Forgiveness](/teachings/the-power-of-forgiveness).${sourcesNote([
      "Gershom Scholem, *On the Kabbalah and Its Symbolism* (1965).",
      "Lawrence Fine, *Physician of the Soul, Healer of the Cosmos: Isaac Luria and His Kabbalistic Fellowship* (2003).",
      "Encyclopaedia Britannica, \"Isaac ben Solomon Luria\".",
    ])}` },

  { slug: "tree-of-life-in-scripture", tag: "Scripture", title: "The Tree of Life in the Bible and the Qur'an",
    summary: "The Bible opens and closes with the Tree of Life. Wisdom is called a tree of life. The Qur'an compares a good word to a good tree, and tells of the Lote Tree at the edge of heaven.",
    body: `## In the Bible
**At the beginning**, in the garden of Eden, God plants two special trees:

> "And out of the ground made the LORD God to grow every tree that is pleasant to the sight, and good for food; the tree of life also in the midst of the garden, and the tree of knowledge of good and evil." (Genesis 2:9)

After Adam and Eve eat from the tree of knowledge, they leave the garden, and the way back is guarded:

> "...and he placed at the east of the garden of Eden Cherubims, and a flaming sword which turned every way, to keep the way of the tree of life." (Genesis 3:24)

**In the wisdom books**, the tree of life becomes a picture of wisdom itself, open to all who seek her:

> "She is a tree of life to them that lay hold upon her: and happy is every one that retaineth her." (Proverbs 3:18)

> "The fruit of the righteous is a tree of life; and he that winneth souls is wise." (Proverbs 11:30)

Jewish tradition reads Proverbs 3:18 as speaking of the Torah, and sings it each time the Torah scroll is returned to the ark.

**The prophet Ezekiel** sees a river flowing from the temple, with trees on its banks whose fruit is food and whose leaves are for healing (Ezekiel 47:12).

**At the end**, in the book of Revelation, the tree that was guarded is given back to all:

> "In the midst of the street of it, and on either side of the river, was there the tree of life, which bare twelve manner of fruits, and yielded her fruit every month: and the leaves of the tree were for the healing of the nations." (Revelation 22:2)

So the whole Bible is framed by this tree: lost in the first pages, restored in the last, with its leaves for the healing of the nations.

*Bible quotations: King James Version (public domain).*

## In the Qur'an
**The good tree.** The Qur'an compares a good word to a good tree:

> "Seest thou not how Allah coineth a similitude: A goodly saying, as a goodly tree, its root set firm, its branches reaching into heaven," (Qur'an 14:24, Pickthall)

The next verse says it gives its fruit at every season by the permission of its Lord. Many commentators teach that the good word is the truth of God's oneness, firmly rooted in the believer's heart.

**The Lote Tree of the Utmost Boundary.** In Surah an-Najm (53:14 to 16), the Prophet sees the angel Gabriel by the *Sidrat al-Muntaha*, the lote tree at the farthest limit, near the Garden of Abode. Islamic tradition places it in the seventh heaven, on the night of the Prophet's journey to heaven: the point beyond which even the angels' knowledge does not pass.

**The tree in the garden.** The Qur'an tells the story of Adam and his wife in the garden, but it speaks of only one forbidden tree. Satan whispers to Adam that it is "the tree of immortality" (20:120), and this is his deception. There is no separate tree of knowledge of good and evil in the Qur'an.

*Qur'an quotation: Marmaduke Pickthall, The Meaning of the Glorious Koran (1930).*

## What they share
Bible and Qur'an alike use the tree to speak of what lasts: wisdom, a good word, and life with God. Its roots are firm, its branches reach heaven, and its fruit feeds everyone who comes.${sourcesNote([
      "The Holy Bible, King James Version: Genesis 2:9, 3:24; Proverbs 3:18, 11:30; Ezekiel 47:12; Revelation 22:2.",
      "The Qur'an 14:24 to 25, 20:120, 53:13 to 16; translation of 14:24 by M. M. Pickthall (1930).",
    ])}` },

  { slug: "the-world-trees", tag: "World Traditions", title: "The World Trees: Yggdrasil, the Ashvattha, the Bodhi Tree and More",
    summary: "The Norse ash that holds nine worlds, the Hindu tree with its roots in heaven, the fig tree of the Buddha's awakening, the Egyptian tree of names and the Maya tree at the centre of the world.",
    body: `## Yggdrasil, the Norse world tree
In the old poems of Iceland, the **Poetic Edda** and Snorri Sturluson's **Prose Edda** (13th century), the universe is held together by a giant ash tree, **Yggdrasil**. The nine worlds are gathered around it. The sources describe its three great roots differently; Snorri places a well under each one:
- **The Well of Urd**, where three wise women, the Norns, shape the fates of gods and humans.
- **Mimir's Well**, the well of wisdom, for which the god Odin gave one of his eyes.
- **Hvergelmir**, the roaring spring in the cold north.

In the poem *Hávamál*, Odin tells how he sacrificed himself on the tree to win the runes, the sacred letters of wisdom:

> "I ween that I hung on the windy tree,\\
> Hung there for nights full nine;\\
> With the spear I was wounded, and offered I was\\
> To Othin, myself to myself,\\
> On the tree that none may ever know\\
> What root beneath it runs." (Hávamál 138, Bellows translation, 1923)

*The teaching:* wisdom is not bought cheaply. It is won by giving the small self to the greater self.

## The Ashvattha, the tree with roots above
The **Bhagavad Gita** opens its fifteenth chapter with a mysterious tree, the *ashvattha* or sacred fig, which grows upside down:

> "Men call the Aswattha, the Banyan-tree,\\
> Which hath its boughs beneath, its roots above,\\
> The ever-holy tree. Yea! for its leaves\\
> Are green and waving hymns which whisper Truth!\\
> Who knows the Aswattha, knows Veds, and all." (Bhagavad Gita 15:1, Edwin Arnold, 1885)

The same image appears earlier in the **Katha Upanishad** (6:1). The root above is the Divine; the branches below are the world we live in. Krishna teaches that the tree of worldly life is cut with the axe of non-attachment, and then one seeks the source from which it all grew. Arnold calls it a banyan, but in Sanskrit the ashvattha is the sacred fig, the same kind of tree as the Bodhi tree.

## The Bodhi tree, the tree of awakening
Around 2,500 years ago, the young seeker Siddhartha Gautama sat beneath a sacred fig (*Ficus religiosa*) at **Bodh Gaya** in India and vowed not to rise until he awoke. There he became the Buddha, "the awakened one". The tree has been honoured ever since.

The tree standing at Bodh Gaya today is held to be a descendant of the original. A cutting of the first tree was carried to Sri Lanka by **Sanghamitta**, the daughter of Emperor Ashoka, and planted at **Anuradhapura**. That tree, the **Jaya Sri Maha Bodhi**, is still alive and is regarded as the oldest living tree planted by human hands with a known date: 288 BCE in the Sri Lankan chronicle, though some sources give 236 BCE.

## The ished tree of ancient Egypt
At **Heliopolis**, the city of the sun, stood a sacred tree called the *ished*, often identified with the persea. Temple carvings show the god **Thoth** and the goddess of writing **Seshat** writing the king's name and the years of his reign on its leaves and fruit. The tree of life here keeps the record of a life lived. Egyptians also honoured the sycamore fig as a tree of the sky goddesses, who reach out from its branches to give food and water to the souls of the dead.

## The Maya world tree
For the **Maya** of Central America, a great world tree stood at the centre of the universe, joining the underworld, the earth and the sky, with four more trees at the four directions. It was often pictured as a **ceiba**, a huge tree still sacred in the region. On the carved lid of the tomb of King **K'inich Janaab Pakal** of Palenque (died 683 CE), the king is shown at his death at the foot of the world tree, with a celestial bird at its top. Some scholars also see the Milky Way as the world tree in the night sky.

## An open question: the Assyrian sacred tree
Ancient Assyrian palaces are full of carvings of a stylised sacred tree. The scholar Simo Parpola argued that it was an early form of the Kabbalistic Tree of Life. Many other scholars disagree, so this link remains a theory, not a fact.${sourcesNote([
      "Hávamál 138, in *The Poetic Edda*, translated by Henry Adams Bellows (1923); Snorri Sturluson, *Gylfaginning* 15 to 16.",
      "Bhagavad Gita 15:1 to 4, translated by Edwin Arnold, *The Song Celestial* (1885); Katha Upanishad 6:1.",
      "Encyclopaedia Britannica and UNESCO (Sacred City of Anuradhapura) on the Bodhi tree and the Jaya Sri Maha Bodhi.",
      "Alix Wilkinson, *The Garden in Ancient Egypt* (1998), on the ished tree.",
      "Studies of the Palenque sarcophagus lid and the Mesoamerican world tree (Schele, Taube, McDonald).",
    ])}` },

  { slug: "the-tree-in-the-western-mysteries", tag: "Western Mysteries", title: "The Tree in the Western Mysteries",
    summary: "How the Kabbalistic Tree passed to Christian scholars, the Rosicrucians, the Martinists and the Golden Dawn, where it became a ladder of initiation linked to tarot and astrology, and how this differs from Jewish Kabbalah.",
    body: `From the Renaissance onward, Christian scholars in Europe fell in love with Kabbalah. They believed it held an ancient wisdom that agreed with their own faith. Out of their work grew a second tradition, often spelled **Cabala** or **Qabalah**, to set it apart from Jewish Kabbalah.

## How the Tree passed to the West
- **1516:** Paulus Ricius published *Portae Lucis*, a Latin translation of a Kabbalistic book. Its cover shows one of the earliest printed pictures of the Tree of the Sefirot.
- **1625:** Philippe d'Aquin, a scholar of Jewish birth in Paris, published a Tree diagram.
- **1653:** the Jesuit Athanasius Kircher printed his famous Tree in *Oedipus Aegyptiacus*, with 22 paths, each marked with a Hebrew letter. Historians have shown that he built it on earlier diagrams, including d'Aquin's. His layout became the standard one of the Western tradition, and it is the shape most people know today.

## Rosicrucians and Martinists
The **Rosicrucian** manifestos of the early 1600s spoke of a hidden brotherhood that united Christian faith with the wisdom of nature and the Kabbalah. Later Rosicrucian orders made the Tree part of their teaching on the soul's ascent.

The **Martinist** tradition, which honours Louis-Claude de Saint-Martin, "the Unknown Philosopher", also drew on Kabbalah. It teaches the reintegration of the human being: the soul's return to its first divine state. On the Tree, that is the climb from the Kingdom back up to the Crown.

## The Golden Dawn
In 1888 the **Hermetic Order of the Golden Dawn** was founded in London. It built a full system on the Tree of Life:
- The 22 cards of the tarot's major arcana were matched to the 22 paths.
- The planets and signs of the zodiac were matched to the Sefirot and the paths.
- The member's grades of initiation were matched to the Sefirot, climbing from Malkhut upward.

Much of today's popular "Qabalah", and the familiar Rider-Waite-Smith tarot deck, comes from this school.

## Honest about the difference
Both are real traditions, but they are not the same:
- **Jewish Kabbalah** lives inside Judaism: its Torah, its prayer, its commandments and its chain of teachers.
- **Hermetic Qabalah** is a Western esoteric adaptation. Its links to tarot, astrology and the chakras were added by European and modern teachers. They are not found in the Jewish sources.

Knowing this is a mark of respect to both. Each can be honoured for what it truly is.

## The Tree and the chakras
Some modern teachers compare the middle pillar of the Tree with the chakras along the spine: the soul rising from the root of this world to the crown of the spirit. This is a modern comparison, not an ancient teaching of either tradition. But the shared vision is beautiful: in India and in Kabbalah alike, the way home is a rising through centres of light to the crown. See [The Seven Chakras](/teachings/the-seven-chakras).${sourcesNote([
      "Daniel Stolzenberg, on the sources of Kircher's Tree; Athanasius Kircher, *Oedipus Aegyptiacus*, vol. 2 (1653).",
      "Joseph Dan (ed.), *The Christian Kabbalah* (1997).",
      "Robert A. Gilbert, *The Golden Dawn: Twilight of the Magicians* (1983).",
      "Antoine Faivre, *Access to Western Esotericism* (1994).",
    ])}` },

  { slug: "living-the-tree-of-life", tag: "Practice", title: "Living the Tree of Life",
    summary: "The Tree of Life is meant to be lived, not only studied. Simple ways to bring its wisdom into daily life: balance love and limits, lift the sparks, and walk the middle way.",
    body: `All the traditions agree on one thing: the Tree of Life is not only a diagram to study. It is a way to live. Here are simple ways to walk it, drawn from what the traditions teach.

## 1. Walk the middle pillar
Each day we lean too far one way or the other: too soft or too hard, too giving or too closed. The Tree teaches balance.
- When you are about to give in where you should stand firm, remember **Gevurah**, strength.
- When you are about to judge harshly, remember **Chesed**, loving-kindness.
- Seek **Tiferet**, the heart, where both meet in beauty.

## 2. Lift a spark every day
Isaac Luria taught that holy sparks are hidden in everything. Choose one small act each day: a kind word, a patient answer, a meal shared, a prayer for someone who hurt you. Each one lifts a spark. See [The Breaking of the Vessels and the Mending of the World](/teachings/the-breaking-of-the-vessels).

## 3. Follow a good deed through the four worlds
Before you act, notice the four steps: the spark of will, the thought, the word, the deed. Let all four be clean, and the act becomes whole. See [The Four Worlds](/teachings/the-four-worlds).

## 4. Be a good tree
The Qur'an compares a good word to a good tree, its root firm and its branches in heaven. Speak words that are rooted in truth and that lift others up.

## 5. Sit under your own Bodhi tree
Find a quiet place, under a tree if you can. Sit still. Breathe slowly. Feel your roots go down into the earth and your crown open to the sky. You are the tree: rooted in this world, reaching for the light.

## A short meditation
Sit with your back straight. Breathe in, and feel light coming down from above your head, through your heart, to the base of your spine: from the Crown to the Kingdom. Breathe out, and feel it rise again, from the earth through your heart to the crown. Do this seven times. Rest in the heart, in Tiferet, in balance.

## From the heart of SAMADHI LOVE
*As above, so below.* The same light that shines in the highest heaven lives in every soul, every animal and every leaf. We all carry the divine spark. The Tree of Life reminds us that we came from the light, we live in it now, and the way home is love.${sourcesNote([
      "The teachings of the earlier pages in this branch, and the sources listed on them.",
    ])}` },
];
