// Original artwork for the Star Nations pages, drawn for SAMADHI LOVE in SVG.
// Each star family: a being of light in its own colours, with its own sky and symbols.

const palettes = {
  lyrans: { sky: ["#2a1a05", "#0b0612"], glow: "#ffcf6b", body: "#ffe3a3", accent: "#ff9f3c", name: "Lyrans" },
  pleiadians: { sky: ["#13224a", "#070614"], glow: "#9cc7ff", body: "#e3f0ff", accent: "#ff9ad5", name: "Pleiadians" },
  sirians: { sky: ["#05303a", "#040a12"], glow: "#6ff2e6", body: "#d8fffb", accent: "#3d9bff", name: "Sirians" },
  arcturians: { sky: ["#1d1150", "#06041a"], glow: "#a98bff", body: "#e9e2ff", accent: "#6fd3ff", name: "Arcturians" },
  andromedans: { sky: ["#0a1d4f", "#040616"], glow: "#6fa8ff", body: "#d6e6ff", accent: "#b9a3ff", name: "Andromedans" },
  orions: { sky: ["#141436", "#030309"], glow: "#8fb4ff", body: "#eef2ff", accent: "#ff7a6b", name: "Orions of light" },
  hathors: { sky: ["#3a0f2a", "#0d0510"], glow: "#ffb0d0", body: "#ffe8f2", accent: "#f2c46d", name: "Hathors" },
  essassani: { sky: ["#0c2f33", "#05070f"], glow: "#7ff0d0", body: "#e6fff7", accent: "#c9a7ff", name: "Essassani" },
  federation: { sky: ["#1a1240", "#04030c"], glow: "#f2c46d", body: "#fff6dc", accent: "#9cc7ff", name: "The Galactic Federation of Light" },
  shadow: { sky: ["#0c0c14", "#000000"], glow: "#f2c46d", body: "#fff1c2", accent: "#7a5cff", name: "Light in the darkness" },
};

function stars(seed, n, id) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = (rnd() * 800).toFixed(1), y = (rnd() * 450).toFixed(1), r = (rnd() < 0.06 ? 1.6 + rnd() * 1.4 : 0.4 + rnd() * 0.9).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${(0.35 + rnd() * 0.65).toFixed(2)}"${r > 1.5 ? ` filter="url(#${id}-soft)"` : ""}/>`;
  }
  return out;
}

// A standing being of light, arms gently open.
function being(id, p, { x = 400, scale = 1, halo = true } = {}) {
  return `<g transform="translate(${x} 0) scale(${scale}) translate(-400 0)">
  <ellipse cx="400" cy="300" rx="150" ry="170" fill="url(#${id}-aura)"/>
  ${halo ? `<circle cx="400" cy="160" r="52" fill="none" stroke="${p.glow}" stroke-width="2.5" opacity=".7" filter="url(#${id}-soft)"/>` : ""}
  <g fill="url(#${id}-body)" filter="url(#${id}-edge)">
    <path d="M370 204 Q400 192 430 204 Q468 218 476 262 L516 420 Q400 444 284 420 L324 262 Q332 218 370 204 Z"/>
    <path d="M372 214 Q326 252 296 302 Q290 316 304 316 Q342 288 364 262 Z"/>
    <path d="M428 214 Q474 252 504 302 Q510 316 496 316 Q458 288 436 262 Z"/>
    <rect x="388" y="180" width="24" height="28" rx="10"/>
    <circle cx="400" cy="160" r="30"/>
  </g>
  <circle cx="400" cy="252" r="9" fill="#fff" filter="url(#${id}-glow)"/>
  <path d="M400 222 L400 410" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
</g>`;
}

const emblems = {
  lyrans: (id, p) => `
  ${Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<line x1="${400 + Math.cos(a) * 40}" y1="${160 + Math.sin(a) * 40}" x2="${400 + Math.cos(a) * (70 + (i % 2) * 18)}" y2="${160 + Math.sin(a) * (70 + (i % 2) * 18)}" stroke="${p.glow}" stroke-width="3" stroke-linecap="round" opacity=".75"/>`; }).join("")}
  <g stroke="${p.accent}" stroke-width="1.5" opacity=".8" fill="none"><path d="M120 70 L160 110 L150 160 L190 170 L200 120 L160 110"/></g>
  <circle cx="120" cy="70" r="6" fill="#fff" filter="url(#${id}-glow)"/>${[[160, 110], [150, 160], [190, 170], [200, 120]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="3" fill="#fff"/>`).join("")}`,
  pleiadians: (id) => [[610, 70, 7], [650, 92, 5], [632, 118, 6], [588, 104, 5], [676, 66, 4], [700, 104, 5], [560, 76, 4]]
    .map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="#cfe4ff" filter="url(#${id}-glow)"/><circle cx="${a}" cy="${b}" r="${r / 2}" fill="#fff"/>`).join(""),
  sirians: (id, p) => `
  <circle cx="640" cy="90" r="16" fill="#fff" filter="url(#${id}-glow)"/><circle cx="640" cy="90" r="7" fill="#fff"/>
  <circle cx="678" cy="112" r="4" fill="${p.glow}"/>
  ${[0, 1, 2].map((i) => `<path d="M0 ${400 + i * 16} Q100 ${385 + i * 16} 200 ${400 + i * 16} T400 ${400 + i * 16} T600 ${400 + i * 16} T800 ${400 + i * 16}" fill="none" stroke="${p.glow}" stroke-width="2" opacity="${0.5 - i * 0.12}"/>`).join("")}`,
  arcturians: (id, p) => `
  <g transform="translate(400 260)" fill="none" stroke="${p.accent}" stroke-width="1.4" opacity=".55">
    <circle r="150"/>
    <polygon points="0,-150 130,-75 130,75 0,150 -130,75 -130,-75"/>
    <polygon points="0,-150 130,75 -130,75"/><polygon points="0,150 -130,-75 130,-75"/>
  </g>
  ${[[150, 330], [650, 320], [620, 120]].map(([a, b]) => `<polygon points="${a},${b - 34} ${a + 12},${b} ${a},${b + 34} ${a - 12},${b}" fill="${p.accent}" opacity=".55" filter="url(#${id}-soft)"/>`).join("")}`,
  andromedans: (id, p) => {
    let arms = "";
    for (let k = 0; k < 2; k++) {
      let d = "";
      for (let t = 0; t <= 40; t++) { const a = t * 0.17 + k * Math.PI, r = 6 + t * 3.4; d += `${t ? "L" : "M"}${(640 + Math.cos(a) * r * 1.6).toFixed(1)} ${(110 + Math.sin(a) * r * 0.7).toFixed(1)} `; }
      arms += `<path d="${d}" fill="none" stroke="${p.accent}" stroke-width="6" opacity=".45" filter="url(#${id}-soft)"/>`;
    }
    return `${arms}<ellipse cx="640" cy="110" rx="26" ry="11" fill="#fff" filter="url(#${id}-glow)"/>`;
  },
  orions: (id, p) => `
  <rect x="400" y="0" width="400" height="450" fill="#000" opacity=".5"/>
  ${[[300, 90], [400, 74], [500, 58]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="8" fill="#dfe8ff" filter="url(#${id}-glow)"/><circle cx="${a}" cy="${b}" r="3.5" fill="#fff"/>`).join("")}
  <circle cx="200" cy="40" r="7" fill="${p.accent}" filter="url(#${id}-glow)"/><circle cx="620" cy="400" r="7" fill="#bcd4ff" filter="url(#${id}-glow)"/>`,
  hathors: (id, p) => `
  ${[60, 95, 130, 165].map((r, i) => `<circle cx="400" cy="252" r="${r}" fill="none" stroke="${p.glow}" stroke-width="2" opacity="${0.55 - i * 0.1}"/>`).join("")}
  <circle cx="660" cy="80" r="10" fill="#fff6d0" filter="url(#${id}-glow)"/><circle cx="660" cy="80" r="4" fill="#fff"/>`,
  essassani: (id, p) => `
  <polygon points="620,60 700,130 540,130" fill="none" stroke="${p.glow}" stroke-width="3" filter="url(#${id}-soft)"/>
  <polygon points="620,60 700,130 540,130" fill="${p.glow}" opacity=".12"/>
  ${[[620, 74], [688, 126], [552, 126]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="5" fill="#fff" filter="url(#${id}-glow)"/>`).join("")}
  <path d="M620 132 L560 420 L680 420 Z" fill="${p.glow}" opacity=".08"/>`,
  federation: (id, p) => {
    const colors = ["#ffcf6b", "#9cc7ff", "#6ff2e6", "#a98bff", "#6fa8ff", "#ffb0d0", "#7ff0d0", "#ff9ad5", "#ffd23f", "#c9a7ff", "#8fb4ff", "#ff9f3c"];
    const ring = colors.map((c, i) => { const a = (i / colors.length) * Math.PI * 2 - Math.PI / 2; const x = 400 + Math.cos(a) * 300, y = 240 + Math.sin(a) * 170; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="${c}" opacity=".55" filter="url(#${id}-glow)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#fff"/><line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="400" y2="252" stroke="${c}" stroke-opacity=".18" stroke-width="1.5"/>`; }).join("");
    return `<ellipse cx="400" cy="240" rx="300" ry="170" fill="none" stroke="${p.glow}" stroke-opacity=".3" stroke-width="1.5" stroke-dasharray="2 6"/>${ring}`;
  },
  shadow: (id, p) => `
  <g stroke="${p.accent}" stroke-opacity=".35" stroke-width="1.2" fill="none"><path d="M90 120 L150 90 L210 130 L260 100 L300 150 L280 210 L330 250"/></g>
  <path d="M400 330 C 330 270, 330 200, 380 200 C 395 200, 400 214, 400 222 C 400 214, 405 200, 420 200 C 470 200, 470 270, 400 330 Z" fill="${p.glow}" filter="url(#${id}-glow)"/>
  <path d="M400 318 C 345 268, 345 212, 382 212 C 394 212, 400 224, 400 232 C 400 224, 406 212, 418 212 C 455 212, 455 268, 400 318 Z" fill="#fff8df"/>
  <circle cx="400" cy="260" r="150" fill="url(#${id}-aura)"/>`,
};

export function starArt(key) {
  const p = palettes[key];
  if (!p) return "";
  const id = `art-${key}`;
  const seed = [...key].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) % 2147483646 + 1;
  const figure = key === "shadow" ? "" : key === "federation" ? being(id, p, { scale: 0.85 }) : being(id, p);
  return `<figure class="star-art"><svg viewBox="0 0 800 450" role="img" aria-labelledby="${id}-t" xmlns="http://www.w3.org/2000/svg">
  <title id="${id}-t">Original artwork: ${p.name}, shown as ${key === "shadow" ? "a heart of light shining in the darkness" : "a being of light among the stars"}</title>
  <defs>
    <radialGradient id="${id}-sky" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></radialGradient>
    <radialGradient id="${id}-aura" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="${p.glow}" stop-opacity=".55"/><stop offset=".6" stop-color="${p.glow}" stop-opacity=".12"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${p.body}" stop-opacity=".95"/><stop offset="1" stop-color="${p.glow}" stop-opacity=".05"/></linearGradient>
    <filter id="${id}-glow" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="${id}-soft" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.5"/></filter>
    <filter id="${id}-edge" x="-.3" y="-.3" width="1.6" height="1.6"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <rect width="800" height="450" fill="url(#${id}-sky)"/>
  ${stars(seed, 110, id)}
  ${emblems[key](id, p)}
  ${figure}
</svg><figcaption>Original artwork for SAMADHI LOVE: ${p.name}, as the teachings describe them.</figcaption></figure>`;
}
