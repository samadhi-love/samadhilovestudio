// Star maps for the Star Nations pages, drawn in SVG for SAMADHI LOVE from real star positions
// (right ascension in hours, declination in degrees, brightness as magnitude; J2000 catalogue values).
// The sky is shown as you see it looking up: north at the top, east on the LEFT.

const warm = "#ffc58a", orange = "#ffb070", red = "#ff9a6b", blue = "#cfe0ff", white = "#ffffff";

// ra "h m s" -> hours, dec "d m s" -> degrees
const hms = (h, m, s) => h + m / 60 + s / 3600;
const dms = (d, m, s) => (d < 0 || Object.is(d, -0) ? -1 : 1) * (Math.abs(d) + m / 60 + s / 3600);

const maps = {
  pleiadians: {
    title: "The Pleiades in Taurus",
    note: "The Pleiades sit on the shoulder of Taurus, the Bull, near orange Aldebaran.",
    stars: {
      aldebaran: [hms(4, 35, 55), dms(16, 30, 33), 0.85, orange, "Aldebaran"],
      elnath: [hms(5, 26, 18), dms(28, 36, 27), 1.65, blue, "Elnath"],
      zeta: [hms(5, 37, 39), dms(21, 8, 33), 3.0, blue],
      ain: [hms(4, 28, 37), dms(19, 10, 50), 3.53, warm],
      gamma: [hms(4, 19, 48), dms(15, 37, 39), 3.65, warm],
      delta: [hms(4, 22, 56), dms(17, 32, 33), 3.76, warm],
      theta: [hms(4, 28, 40), dms(15, 52, 15), 3.4, white],
      lambda: [hms(4, 0, 41), dms(12, 29, 25), 3.4, blue],
      omicron: [hms(3, 24, 49), dms(9, 1, 44), 3.6, warm],
      xi: [hms(3, 27, 10), dms(9, 43, 58), 3.7, blue],
      alcyone: [hms(3, 47, 29), dms(24, 6, 18), 2.87, blue],
      atlas: [hms(3, 49, 10), dms(24, 3, 12), 3.62, blue],
      electra: [hms(3, 44, 53), dms(24, 6, 48), 3.7, blue],
      maia: [hms(3, 45, 50), dms(24, 22, 4), 3.87, blue],
      merope: [hms(3, 46, 20), dms(23, 56, 54), 4.18, blue],
      taygeta: [hms(3, 45, 12), dms(24, 28, 2), 4.3, blue],
      pleione: [hms(3, 49, 11), dms(24, 8, 12), 5.05, blue],
      celaeno: [hms(3, 44, 48), dms(24, 17, 22), 5.45, blue],
      sterope: [hms(3, 45, 54), dms(24, 33, 17), 5.76, blue],
    },
    lines: [["lambda", "gamma"], ["gamma", "delta"], ["delta", "ain"], ["ain", "elnath"], ["gamma", "theta"], ["theta", "aldebaran"], ["aldebaran", "zeta"], ["lambda", "xi"], ["xi", "omicron"]],
    home: { at: "alcyone", label: "The Pleiades", radius: 26, pos: "right" },
    inset: { stars: ["alcyone", "atlas", "electra", "maia", "merope", "taygeta", "pleione", "celaeno", "sterope"], label: "The Seven Sisters, up close", names: { alcyone: "Alcyone", atlas: "Atlas", electra: "Electra", maia: "Maia", merope: "Merope", taygeta: "Taygeta", pleione: "Pleione", celaeno: "Celaeno", sterope: "Sterope" } },
  },
  "orions-of-light": {
    title: "Orion",
    note: "Orion's Belt is the row of three stars; the Orion Nebula glows just below it, in his sword.",
    stars: {
      betelgeuse: [hms(5, 55, 10), dms(7, 24, 25), 0.5, red, "Betelgeuse"],
      rigel: [hms(5, 14, 32), dms(-8, 12, 6), 0.13, blue, "Rigel"],
      bellatrix: [hms(5, 25, 8), dms(6, 20, 59), 1.64, blue, "Bellatrix"],
      mintaka: [hms(5, 32, 0), dms(-0, 17, 57), 2.23, blue, "Mintaka"],
      alnilam: [hms(5, 36, 13), dms(-1, 12, 7), 1.69, blue, "Alnilam"],
      alnitak: [hms(5, 40, 46), dms(-1, 56, 34), 1.77, blue, "Alnitak"],
      saiph: [hms(5, 47, 45), dms(-9, 40, 11), 2.09, blue, "Saiph"],
      meissa: [hms(5, 35, 8), dms(9, 56, 3), 3.39, blue],
      hatysa: [hms(5, 35, 26), dms(-5, 54, 36), 2.77, blue],
      m42: [hms(5, 35, 17), dms(-5, 23, 28), 4.0, "#ffb3d1"],
    },
    lines: [["betelgeuse", "meissa"], ["meissa", "bellatrix"], ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"], ["mintaka", "alnilam"], ["alnilam", "alnitak"], ["alnitak", "saiph"], ["mintaka", "rigel"], ["alnilam", "m42"], ["m42", "hatysa"]],
    nebula: { at: "m42", rx: 9, ry: 12, color: "#ff8fbf" },
    home: { at: "alnilam", label: "Orion's Belt", radius: 46, pos: "left", extra: { at: "m42", label: "Orion Nebula", radius: 16, pos: "left" } },
  },
  lyrans: {
    title: "Lyra and Vega",
    note: "Lyra is small: brilliant Vega and a little parallelogram of stars. The Ring Nebula lies between its two lower stars.",
    stars: {
      vega: [hms(18, 36, 56), dms(38, 47, 1), 0.03, blue, "Vega"],
      sheliak: [hms(18, 50, 5), dms(33, 21, 46), 3.52, blue, "Sheliak"],
      sulafat: [hms(18, 58, 57), dms(32, 41, 22), 3.25, blue, "Sulafat"],
      delta2: [hms(18, 54, 30), dms(36, 53, 55), 4.3, red],
      zeta: [hms(18, 44, 46), dms(37, 36, 18), 4.36, white],
      epsilon: [hms(18, 44, 20), dms(39, 40, 12), 4.67, white],
      m57: [hms(18, 53, 35), dms(33, 1, 45), 6, "#9fe6d8"],
    },
    lines: [["vega", "epsilon"], ["vega", "zeta"], ["zeta", "delta2"], ["delta2", "sulafat"], ["sulafat", "sheliak"], ["sheliak", "zeta"]],
    ring: "m57",
    home: { at: "vega", label: "Vega", radius: 30, pos: "right", extra: { at: "m57", label: "Ring Nebula", radius: 12, pos: "right" } },
  },
  sirians: {
    title: "Sirius in Canis Major",
    note: "Sirius is the brightest star of the night sky, the eye of the Great Dog. Follow Orion's Belt down and to the left to find it.",
    stars: {
      sirius: [hms(6, 45, 9), dms(-16, 42, 58), -1.46, white, "Sirius"],
      mirzam: [hms(6, 22, 42), dms(-17, 57, 21), 1.98, blue, "Mirzam"],
      muliphein: [hms(7, 3, 45), dms(-15, 37, 60), 4.1, blue],
      iota: [hms(6, 56, 8), dms(-17, 3, 15), 4.4, blue],
      theta: [hms(6, 54, 11), dms(-12, 2, 19), 4.07, orange],
      omicron2: [hms(7, 3, 1), dms(-23, 49, 59), 3.0, blue],
      wezen: [hms(7, 8, 23), dms(-26, 23, 36), 1.83, warm, "Wezen"],
      adhara: [hms(6, 58, 38), dms(-28, 58, 20), 1.5, blue, "Adhara"],
      aludra: [hms(7, 24, 6), dms(-29, 18, 11), 2.45, blue, "Aludra"],
      furud: [hms(6, 20, 19), dms(-30, 3, 48), 3.0, blue],
    },
    lines: [["mirzam", "sirius"], ["sirius", "iota"], ["iota", "muliphein"], ["muliphein", "theta"], ["theta", "iota"], ["sirius", "omicron2"], ["omicron2", "wezen"], ["wezen", "adhara"], ["adhara", "furud"], ["wezen", "aludra"]],
    home: { at: "sirius", label: "Sirius", radius: 34 },
  },
  arcturians: {
    title: "Arcturus in Boötes",
    note: "Follow the curve of the Big Dipper's handle and “arc to Arcturus”, the bright orange star at the foot of Boötes, the Herdsman.",
    stars: {
      arcturus: [hms(14, 15, 40), dms(19, 10, 57), -0.05, orange, "Arcturus"],
      izar: [hms(14, 44, 59), dms(27, 4, 27), 2.37, warm, "Izar"],
      muphrid: [hms(13, 54, 41), dms(18, 23, 52), 2.68, white, "Muphrid"],
      seginus: [hms(14, 32, 5), dms(38, 18, 30), 3.03, white, "Seginus"],
      nekkar: [hms(15, 1, 57), dms(40, 23, 26), 3.5, warm, "Nekkar"],
      delta: [hms(15, 15, 30), dms(33, 18, 53), 3.47, warm],
      rho: [hms(14, 31, 50), dms(30, 22, 17), 3.58, warm],
      zeta: [hms(14, 41, 9), dms(13, 43, 42), 3.78, white],
      alkaid: [hms(13, 47, 32), dms(49, 18, 48), 1.86, blue, "Alkaid"],
      mizar: [hms(13, 23, 55), dms(54, 55, 31), 2.23, white, "Mizar"],
      alioth: [hms(12, 54, 2), dms(55, 57, 35), 1.77, white, "Alioth"],
    },
    lines: [["arcturus", "izar"], ["izar", "delta"], ["delta", "nekkar"], ["nekkar", "seginus"], ["seginus", "rho"], ["rho", "arcturus"], ["arcturus", "muphrid"], ["arcturus", "zeta"], ["alioth", "mizar"], ["mizar", "alkaid"]],
    arc: { through: ["alioth", "mizar", "alkaid", "arcturus"], label: "arc to Arcturus" },
    home: { at: "arcturus", label: "Arcturus", radius: 30, pos: "left" },
  },
  andromedans: {
    title: "The Andromeda galaxy",
    note: "From Mirach, step up through two faint stars to find the Andromeda galaxy, a soft oval of light on a dark night.",
    stars: {
      alpheratz: [hms(0, 8, 23), dms(29, 5, 26), 2.06, blue, "Alpheratz"],
      mirach: [hms(1, 9, 44), dms(35, 37, 14), 2.05, red, "Mirach"],
      almach: [hms(2, 3, 54), dms(42, 19, 47), 2.1, orange, "Almach"],
      delta: [hms(0, 39, 20), dms(30, 51, 40), 3.27, orange],
      mu: [hms(0, 56, 45), dms(38, 29, 58), 3.87, white],
      nu: [hms(0, 49, 49), dms(41, 4, 44), 4.53, blue],
      pi: [hms(0, 36, 53), dms(33, 43, 10), 4.36, blue],
      m31: [hms(0, 42, 44), dms(41, 16, 9), 3.4, "#e9dcff"],
    },
    lines: [["alpheratz", "delta"], ["delta", "mirach"], ["mirach", "almach"], ["alpheratz", "pi"], ["mirach", "mu"], ["mu", "nu"]],
    pointer: ["nu", "m31"],
    galaxy: { at: "m31", sizeDeg: [4, 1.3], angle: 35 },
    home: { at: "m31", label: "Andromeda galaxy", radius: 44, pos: "right" },
  },
};

export const starMapFamilies = Object.keys(maps);

const W = 800, H = 450;
const rad = (d) => (d * Math.PI) / 180;

// Gnomonic projection around the map's centre; east to the left as seen from the ground.
function projector(list) {
  const ras = list.map((s) => s[0] * 15), decs = list.map((s) => s[1]);
  const ra0 = (Math.min(...ras) + Math.max(...ras)) / 2, dec0 = (Math.min(...decs) + Math.max(...decs)) / 2;
  const raw = ([ra, dec]) => {
    const a = rad(ra * 15 - ra0), d = rad(dec), d0 = rad(dec0);
    const c = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a);
    return [-(Math.cos(d) * Math.sin(a)) / c, (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a)) / c];
  };
  const pts = list.map(raw);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const pad = 58;
  const scale = Math.min((W - 2 * pad) / (Math.max(...xs) - Math.min(...xs) || 1), (H - 2 * pad) / (Math.max(...ys) - Math.min(...ys) || 1));
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const project = (s) => { const [x, y] = raw(s); return [W / 2 + (x - cx) * scale, H / 2 - (y - cy) * scale]; };
  project.perDegree = scale * rad(1);
  return project;
}

const size = (mag) => Math.max(1.1, 6.2 - 1.25 * mag);
const f = (n) => n.toFixed(1);

function background(seed) {
  let s = seed, out = "";
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 140; i++) out += `<circle cx="${f(rnd() * W)}" cy="${f(rnd() * H)}" r="${(0.3 + rnd() * 0.6).toFixed(2)}" fill="#fff" opacity="${(0.15 + rnd() * 0.35).toFixed(2)}"/>`;
  return out;
}

function ring(id, x, y, r, label, big, pos = "above") {
  if (pos === "above" && y - r - 10 < 22) pos = "below";
  const fs = big ? 19 : 14;
  const [lx, ly, anchor] = pos === "below" ? [x, y + r + fs + 2, "middle"] : pos === "left" ? [x - r - 8, y + 5, "end"] : pos === "right" ? [x + r + 8, y + 5, "start"] : [x, y - r - 10, "middle"];
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="none" stroke="#f2c46d" stroke-width="${big ? 2 : 1.4}" stroke-dasharray="${big ? "none" : "4 4"}" opacity=".9" filter="url(#${id}-soft)"/>
<text x="${f(lx)}" y="${f(ly)}" text-anchor="${anchor}" fill="#f2c46d" font-size="${fs}" font-weight="600" letter-spacing=".5" paint-order="stroke" stroke="#05060f" stroke-width="4" stroke-linejoin="round">${label}</text>`;
}

export function starMap(family) {
  const m = maps[family];
  if (!m) return "";
  const id = `sm-${family}`;
  const project = projector(Object.values(m.stars));
  const P = Object.fromEntries(Object.entries(m.stars).map(([k, s]) => [k, project(s)]));
  const hidden = new Set(m.inset ? m.inset.stars.filter((k) => k !== m.home.at) : []);
  let body = background(family.length * 7919 + 17);

  // A soft glow for nebulae and the galaxy.
  if (m.nebula) { const [x, y] = P[m.nebula.at]; body += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${m.nebula.rx}" ry="${m.nebula.ry}" fill="${m.nebula.color}" opacity=".55" filter="url(#${id}-soft)"/>`; }
  if (m.galaxy) {
    const [x, y] = P[m.galaxy.at], k = project.perDegree;
    body += `<g transform="rotate(${-m.galaxy.angle} ${f(x)} ${f(y)})"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(m.galaxy.sizeDeg[0] * k / 2)}" ry="${f(m.galaxy.sizeDeg[1] * k / 2)}" fill="url(#${id}-gal)"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="5" ry="2.4" fill="#fff" filter="url(#${id}-soft)"/></g>`;
  }
  if (m.ring) { const [x, y] = P[m.ring]; body += `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" fill="none" stroke="#9fe6d8" stroke-width="1.6"/>`; }

  // The arc from the Big Dipper's handle, and the pointer to Andromeda.
  if (m.arc) {
    const pts = m.arc.through.map((k) => P[k]);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i - 1], [c, e] = pts[i]; d += ` Q${f((a + c) / 2 - (e - b) * 0.12)} ${f((b + e) / 2 + (c - a) * 0.12)} ${f(c)} ${f(e)}`; }
    const [mx, my] = P[m.arc.through[2]];
    body += `<path d="${d}" fill="none" stroke="#9cc7ff" stroke-width="1.6" stroke-dasharray="6 6" opacity=".7"/><text x="${f(mx - 16)}" y="${f(my + 34)}" fill="#9cc7ff" font-size="14" font-style="italic" text-anchor="end">${m.arc.label}</text>`;
  }
  if (m.pointer) { const [[a, b], [c, d]] = m.pointer.map((k) => P[k]); body += `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(d)}" stroke="#c9b6ff" stroke-width="1.4" stroke-dasharray="4 5" opacity=".8"/>`; }

  body += m.lines.map(([a, b]) => `<line x1="${f(P[a][0])}" y1="${f(P[a][1])}" x2="${f(P[b][0])}" y2="${f(P[b][1])}" stroke="#f2c46d" stroke-width="1.3" opacity=".55"/>`).join("");

  for (const [k, s] of Object.entries(m.stars)) {
    if (hidden.has(k) || k === m.ring || k === "m31" || (m.nebula && k === m.nebula.at)) continue;
    const [x, y] = P[k], r = size(s[2]);
    body += `${r > 3 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.2)}" fill="${s[3]}" opacity=".25" filter="url(#${id}-soft)"/>` : ""}<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${s[3]}"/>`;
    if (s[4] && k !== m.home.at) body += `<text x="${f(x + r + 6)}" y="${f(y + 4)}" fill="#cfc8f0" font-size="13" paint-order="stroke" stroke="#05060f" stroke-width="3" stroke-linejoin="round">${s[4]}</text>`;
  }

  const [hx, hy] = P[m.home.at];
  body += ring(id, hx, hy, m.home.radius, m.home.label, true, m.home.pos);
  if (m.home.extra) { const [ex, ey] = P[m.home.extra.at]; body += ring(id, ex, ey, m.home.extra.radius, m.home.extra.label, false, m.home.extra.pos); }

  // A close-up of the Pleiades, whose stars are too close together to see at full-sky scale.
  if (m.inset) {
    const bx = 26, by = 238, bw = 230, bh = 172;
    const sub = m.inset.stars.map((k) => m.stars[k]);
    const ras = sub.map((s) => s[0]), decs = sub.map((s) => s[1]);
    const ra0 = (Math.min(...ras) + Math.max(...ras)) / 2, dec0 = (Math.min(...decs) + Math.max(...decs)) / 2;
    const cosd = Math.cos(rad(dec0));
    const sx = (bw - 70) / ((Math.max(...ras) - Math.min(...ras)) * 15 * cosd), sy = (bh - 70) / (Math.max(...decs) - Math.min(...decs));
    const k = Math.min(sx, sy);
    body += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="14" fill="#080a1e" fill-opacity=".88" stroke="#f2c46d" stroke-opacity=".6"/>
<line x1="${f(hx - 18)}" y1="${f(hy + 18)}" x2="${bx + bw}" y2="${by + 20}" stroke="#f2c46d" stroke-opacity=".5" stroke-dasharray="3 4"/>
<text x="${bx + bw / 2}" y="${by + bh - 10}" text-anchor="middle" fill="#f2c46d" font-size="12.5">${m.inset.label}</text>`;
    for (const key of m.inset.stars) {
      const s = m.stars[key];
      const x = bx + bw / 2 - (s[0] - ra0) * 15 * cosd * k, y = by + (bh - 18) / 2 - (s[1] - dec0) * k;
      const r = Math.max(1.6, 7 - 1.1 * s[2]);
      body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2)}" fill="#bcd6ff" opacity=".3" filter="url(#${id}-soft)"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#e3eeff"/><text x="${f(x + r + 4)}" y="${f(y + 4)}" fill="#cfc8f0" font-size="10.5">${m.inset.names[key]}</text>`;
    }
  }

  return `<figure class="star-map">
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Star map: ${m.title}" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="${id}-sky" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#141a3d"/><stop offset="1" stop-color="#05060f"/></radialGradient>
<radialGradient id="${id}-gal"><stop offset="0" stop-color="#fff4e0" stop-opacity=".95"/><stop offset=".35" stop-color="#d9c8ff" stop-opacity=".55"/><stop offset="1" stop-color="#7f6cff" stop-opacity="0"/></radialGradient>
<filter id="${id}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>
${body}
<text x="20" y="${H - 16}" fill="#8f88b8" font-size="12">N ↑ · E ←</text>
</svg>
<figcaption><strong>${m.title}.</strong> ${m.note} <span class="fine">Drawn for SAMADHI LOVE from real star positions, as seen looking up.</span></figcaption>
</figure>`;
}
