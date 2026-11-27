// Star maps for the Star Nations pages, drawn in SVG for SAMADHI LOVE to look like the real night sky.
// Positions of the named stars are J2000 catalogue values (right ascension in hours, declination in degrees).
// Every other star, its colour and its brightness come from a real catalogue (see lib/starmap-data.js,
// made by scripts/build-star-data.mjs). No star on these maps is invented.
// The sky is shown as you see it looking up: north at the top, east on the LEFT.

import { SKY } from "./starmap-data.js";

// ra "h m s" -> hours, dec "d m s" -> degrees
const hms = (h, m, s) => h + m / 60 + s / 3600;
const dms = (d, m, s) => (d < 0 || Object.is(d, -0) ? -1 : 1) * (Math.abs(d) + m / 60 + s / 3600);

const LIGHT_YEAR = "A light-year is how far light travels in one year, about 5.9 trillion miles.";

// Distances: checked against NASA, ESA (Hipparcos, new reduction by van Leeuwen 2007; Gaia) and other
// reliable sources. "about" marks the ones scientists are still unsure of. See README notes in the report.
const maps = {
  pleiadians: {
    title: "The Pleiades in Taurus",
    find: "Follow the three stars of Orion's Belt up and to the right, past orange Aldebaran, to a tiny, misty dipper of stars. Most eyes see six or seven. They are best seen on evenings from November to February: they rise in the east after dark in autumn and ride high in the south in winter.",
    special: "The Pleiades are a family of young stars, about 100 million years old, all born together from the same cloud; our Sun is about 4.6 billion years old. The cluster holds more than a thousand stars, held loosely together by gravity. The soft blue haze around them is a passing cloud of dust lit by their starlight.",
    light: ["the Pleiades", "them", "445"],
    stars: {
      aldebaran: [hms(4, 35, 55), dms(16, 30, 33)],
      elnath: [hms(5, 26, 18), dms(28, 36, 27)],
      zeta: [hms(5, 37, 39), dms(21, 8, 33)],
      ain: [hms(4, 28, 37), dms(19, 10, 50)],
      gamma: [hms(4, 19, 48), dms(15, 37, 39)],
      delta: [hms(4, 22, 56), dms(17, 32, 33)],
      theta: [hms(4, 28, 40), dms(15, 52, 15)],
      lambda: [hms(4, 0, 41), dms(12, 29, 25)],
      omicron: [hms(3, 24, 49), dms(9, 1, 44)],
      xi: [hms(3, 27, 10), dms(9, 43, 58)],
      alcyone: [hms(3, 47, 29), dms(24, 6, 18)],
      atlas: [hms(3, 49, 10), dms(24, 3, 12)],
      electra: [hms(3, 44, 53), dms(24, 6, 48)],
      maia: [hms(3, 45, 50), dms(24, 22, 4)],
      merope: [hms(3, 46, 20), dms(23, 56, 54)],
      taygeta: [hms(3, 45, 12), dms(24, 28, 2)],
      pleione: [hms(3, 49, 11), dms(24, 8, 12)],
      celaeno: [hms(3, 44, 48), dms(24, 17, 22)],
      sterope: [hms(3, 45, 54), dms(24, 33, 17)],
    },
    lines: [["lambda", "gamma"], ["gamma", "delta"], ["delta", "ain"], ["ain", "elnath"], ["gamma", "theta"], ["theta", "aldebaran"], ["aldebaran", "zeta"], ["lambda", "xi"], ["xi", "omicron"]],
    labels: { aldebaran: ["Aldebaran", "67 light-years"], elnath: ["Elnath", "134 light-years"] },
    home: { at: "alcyone", label: ["The Pleiades", "445 light-years"], radius: 24 },
    haze: ["alcyone", "atlas", "electra", "maia", "merope", "taygeta", "pleione", "celaeno", "sterope"],
    inset: {
      box: [18, 222, 262, 206], zoom: 7.5, boost: 2.2,
      title: ["The Seven Sisters, up close", "all about 445 light-years away"],
      names: { alcyone: "Alcyone", atlas: "Atlas", electra: "Electra", maia: "Maia", merope: "Merope", taygeta: "Taygeta", pleione: "Pleione", celaeno: "Celaeno", sterope: "Sterope" },
    },
  },
  "orions-of-light": {
    title: "Orion",
    find: "Look for three bright stars close together in a short, straight row: that is Orion's Belt. Orange-red Betelgeuse marks his shoulder at the upper left and blue-white Rigel his knee at the lower right. Orion rises in the east on late-autumn evenings and stands high in the south on winter evenings, from December to March.",
    special: "Betelgeuse is a red supergiant so large that, if it stood where our Sun is, it would swallow the orbits of Mercury, Venus, Earth and Mars. The Orion Nebula, the soft glow in Orion's sword just below the Belt, is a nursery where new stars are being born right now. It is the closest place to Earth where great, bright stars are being born.",
    light: ["the Orion Nebula", "it", "1,344"],
    stars: {
      betelgeuse: [hms(5, 55, 10), dms(7, 24, 25)],
      rigel: [hms(5, 14, 32), dms(-8, 12, 6)],
      bellatrix: [hms(5, 25, 8), dms(6, 20, 59)],
      mintaka: [hms(5, 32, 0), dms(-0, 17, 57)],
      alnilam: [hms(5, 36, 13), dms(-1, 12, 7)],
      alnitak: [hms(5, 40, 46), dms(-1, 56, 34)],
      saiph: [hms(5, 47, 45), dms(-9, 40, 11)],
      meissa: [hms(5, 35, 8), dms(9, 56, 3)],
      hatysa: [hms(5, 35, 26), dms(-5, 54, 36)],
      m42: [hms(5, 35, 17), dms(-5, 23, 28)],
    },
    lines: [["betelgeuse", "meissa"], ["meissa", "bellatrix"], ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"], ["mintaka", "alnilam"], ["alnilam", "alnitak"], ["alnitak", "saiph"], ["mintaka", "rigel"], ["alnilam", "m42"], ["m42", "hatysa"]],
    nebula: "m42",
    labels: {
      betelgeuse: ["Betelgeuse", "about 550 light-years"], rigel: ["Rigel", "about 860 light-years"],
      bellatrix: ["Bellatrix", "about 250 light-years"], saiph: ["Saiph", "about 650 light-years"],
      m42: ["Orion Nebula", "1,344 light-years"],
    },
    home: { at: "alnilam", label: ["Orion's Belt", "about 700 to 2,000 light-years"], radius: 42 },
  },
  lyrans: {
    title: "Lyra and Vega",
    find: "On summer evenings look almost straight overhead for the brilliant blue-white star Vega, the brightest corner of the Summer Triangle (with Deneb and Altair). Lyra's small parallelogram of stars hangs just beside it. It is best seen from June to September, and still shines in the west on autumn evenings.",
    special: "Vega was the first star other than the Sun ever photographed, at Harvard in 1850. Because the Earth slowly wobbles like a spinning top, Vega was the North Star about 12,000 years before Christ and will be again in the far future. The Ring Nebula, between Sheliak and Sulafat, is a glowing shell of gas gently cast off by an old, sun-like star; a small telescope shows it as a tiny ring of smoke.",
    light: ["Vega", "it", "25"],
    stars: {
      vega: [hms(18, 36, 56), dms(38, 47, 1)],
      sheliak: [hms(18, 50, 5), dms(33, 21, 46)],
      sulafat: [hms(18, 58, 57), dms(32, 41, 22)],
      delta2: [hms(18, 54, 30), dms(36, 53, 55)],
      zeta: [hms(18, 44, 46), dms(37, 36, 18)],
      epsilon: [hms(18, 44, 20), dms(39, 40, 12)],
      m57: [hms(18, 53, 35), dms(33, 1, 45)],
    },
    lines: [["vega", "epsilon"], ["vega", "zeta"], ["zeta", "delta2"], ["delta2", "sulafat"], ["sulafat", "sheliak"], ["sheliak", "zeta"]],
    ring: "m57",
    labels: { sheliak: ["Sheliak", "about 960 light-years"], sulafat: ["Sulafat", "about 620 light-years"], m57: ["Ring Nebula", "about 2,570 light-years"] },
    home: { at: "vega", label: ["Vega", "25 light-years"], radius: 28 },
  },
  sirians: {
    title: "Sirius in Canis Major",
    find: "Follow Orion's Belt down and to the left: the dazzling star you come to is Sirius. It is best seen on evenings from January to March, low in the south-east to south. When it is low, the air often makes it flash with colours.",
    special: "Sirius is the brightest star of the whole night sky, the eye of the Great Dog. It is really two stars: a bright white star and a tiny companion, Sirius B, a white dwarf smaller than the Earth yet nearly as heavy as the Sun. The ancient Egyptians watched for Sirius rising before dawn, which came near the time of the Nile's yearly flood.",
    light: ["Sirius", "it", "8.6"],
    stars: {
      sirius: [hms(6, 45, 9), dms(-16, 42, 58)],
      mirzam: [hms(6, 22, 42), dms(-17, 57, 21)],
      muliphein: [hms(7, 3, 45), dms(-15, 37, 60)],
      iota: [hms(6, 56, 8), dms(-17, 3, 15)],
      theta: [hms(6, 54, 11), dms(-12, 2, 19)],
      omicron2: [hms(7, 3, 1), dms(-23, 49, 59)],
      wezen: [hms(7, 8, 23), dms(-26, 23, 36)],
      adhara: [hms(6, 58, 38), dms(-28, 58, 20)],
      aludra: [hms(7, 24, 6), dms(-29, 18, 11)],
      furud: [hms(6, 20, 19), dms(-30, 3, 48)],
    },
    lines: [["mirzam", "sirius"], ["sirius", "iota"], ["iota", "muliphein"], ["muliphein", "theta"], ["theta", "iota"], ["sirius", "omicron2"], ["omicron2", "wezen"], ["wezen", "adhara"], ["adhara", "furud"], ["wezen", "aludra"]],
    labels: { mirzam: ["Mirzam", "about 490 light-years"], wezen: ["Wezen", "about 1,600 light-years"], adhara: ["Adhara", "about 400 light-years"], aludra: ["Aludra", "about 2,000 light-years"] },
    home: { at: "sirius", label: ["Sirius", "8.6 light-years"], radius: 30 },
  },
  arcturians: {
    title: "Arcturus in Boötes",
    find: "Find the Big Dipper, follow the curve of its handle away from the bowl, and “arc to Arcturus”, the bright orange star at the foot of Boötes, the Herdsman. It is best seen on evenings from April to August: in the east in spring, high in the south in early summer.",
    special: "Arcturus is the brightest star in the northern half of the sky, an orange giant about 25 times wider than our Sun. On May 27, 1933, its starlight, caught by telescopes, switched on the lights of the Chicago World's Fair.",
    light: ["Arcturus", "it", "37"],
    stars: {
      arcturus: [hms(14, 15, 40), dms(19, 10, 57)],
      izar: [hms(14, 44, 59), dms(27, 4, 27)],
      muphrid: [hms(13, 54, 41), dms(18, 23, 52)],
      seginus: [hms(14, 32, 5), dms(38, 18, 30)],
      nekkar: [hms(15, 1, 57), dms(40, 23, 26)],
      delta: [hms(15, 15, 30), dms(33, 18, 53)],
      rho: [hms(14, 31, 50), dms(30, 22, 17)],
      zeta: [hms(14, 41, 9), dms(13, 43, 42)],
      alkaid: [hms(13, 47, 32), dms(49, 18, 48)],
      mizar: [hms(13, 23, 55), dms(54, 55, 31)],
      alioth: [hms(12, 54, 2), dms(55, 57, 35)],
    },
    lines: [["arcturus", "izar"], ["izar", "delta"], ["delta", "nekkar"], ["nekkar", "seginus"], ["seginus", "rho"], ["rho", "arcturus"], ["arcturus", "muphrid"], ["arcturus", "zeta"], ["alioth", "mizar"], ["mizar", "alkaid"]],
    arc: { through: ["alioth", "mizar", "alkaid", "arcturus"], label: "arc to Arcturus" },
    labels: { izar: ["Izar", "about 200 light-years"], seginus: ["Seginus", "87 light-years"], alkaid: ["Alkaid", "104 light-years"], mizar: ["Mizar", "86 light-years"], alioth: ["Alioth", "83 light-years"] },
    home: { at: "arcturus", label: ["Arcturus", "37 light-years"], radius: 28 },
  },
  andromedans: {
    title: "The Andromeda galaxy",
    find: "On autumn evenings, from September to December, find the Great Square of Pegasus high in the sky. From its corner star Alpheratz, step east to Mirach, then turn north through two fainter stars. Away from city lights, Andromeda shows as a soft oval glow.",
    special: "It is the farthest thing most people can ever see with their eyes alone. Andromeda is a great spiral galaxy, a city of about a trillion stars, larger than our own Milky Way. Two small companion galaxies, M32 and M110, travel with it.",
    light: ["the Andromeda galaxy", "it", "2.5 million"],
    stars: {
      alpheratz: [hms(0, 8, 23), dms(29, 5, 26)],
      mirach: [hms(1, 9, 44), dms(35, 37, 14)],
      almach: [hms(2, 3, 54), dms(42, 19, 47)],
      delta: [hms(0, 39, 20), dms(30, 51, 40)],
      mu: [hms(0, 56, 45), dms(38, 29, 58)],
      nu: [hms(0, 49, 49), dms(41, 4, 44)],
      pi: [hms(0, 36, 53), dms(33, 43, 10)],
      m31: [hms(0, 42, 44), dms(41, 16, 9)],
      m32: [hms(0, 42, 42), dms(40, 51, 55)],
      m110: [hms(0, 40, 22), dms(41, 41, 7)],
    },
    lines: [["alpheratz", "delta"], ["delta", "mirach"], ["mirach", "almach"], ["alpheratz", "pi"], ["mirach", "mu"], ["mu", "nu"]],
    pointer: ["nu", "m31"],
    // True sizes (degrees) and position angles (degrees from north through east).
    galaxies: { m31: [3.2, 1.0, 35], m32: [0.145, 0.11, 170], m110: [0.36, 0.18, 170] },
    labels: { alpheratz: ["Alpheratz", "97 light-years"], mirach: ["Mirach", "197 light-years"], almach: ["Almach", "about 390 light-years"] },
    home: { at: "m31", label: ["Andromeda galaxy", "2.5 million light-years"], radius: 50 },
    inset: {
      box: [18, 238, 300, 196], zoom: 2.4, boost: 1,
      title: ["Andromeda and its two companions, up close"],
      labels: { m32: ["M32", "2.5 million light-years"], m110: ["M110", "2.7 million light-years"] },
    },
  },
};

export const starMapFamilies = Object.keys(maps);
const OBJECTS = new Set(["m42", "m57", "m31", "m32", "m110"]);

const W = 800, H = 450;
const rad = (d) => (d * Math.PI) / 180;
const f = (n) => n.toFixed(1);

// Gnomonic projection around the map's centre; east to the left as seen from the ground.
function projector(list) {
  const ras = list.map((s) => s[0] * 15), decs = list.map((s) => s[1]);
  const ra0 = (Math.min(...ras) + Math.max(...ras)) / 2, dec0 = (Math.min(...decs) + Math.max(...decs)) / 2;
  const raw = (raDeg, dec, clamp = false) => {
    let a = rad(raDeg - ra0);
    a = Math.atan2(Math.sin(a), Math.cos(a));
    const d = rad(dec), d0 = rad(dec0);
    const c = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a);
    const cc = clamp ? Math.max(c, 0.02) : c;
    return [-(Math.cos(d) * Math.sin(a)) / cc, (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a)) / cc, c];
  };
  const pts = list.map((s) => raw(s[0] * 15, s[1]));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const pad = 58;
  const scale = Math.min((W - 2 * pad) / (Math.max(...xs) - Math.min(...xs) || 1), (H - 2 * pad) / (Math.max(...ys) - Math.min(...ys) || 1));
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const px = (x, y) => [W / 2 + (x - cx) * scale, H / 2 - (y - cy) * scale];
  const project = (s) => { const [x, y] = raw(s[0] * 15, s[1]); return px(x, y); };
  project.deg = (raDeg, dec) => { const [x, y, c] = raw(raDeg, dec, true); return [...px(x, y), c]; };
  project.perDegree = scale * rad(1);
  // Screen angle (degrees, clockwise from the +x axis) of a position angle measured from north through east.
  project.pa = (s, paDeg) => {
    const step = 0.2, [x0, y0] = project(s);
    const [x1, y1] = project([s[0] + (step * Math.sin(rad(paDeg))) / Math.cos(rad(s[1])) / 15, s[1] + step * Math.cos(rad(paDeg))]);
    return (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  };
  return project;
}

// Used by scripts/build-star-data.mjs, so the catalogue stars line up exactly with the named ones.
export function mapProjection(family) { return maps[family] ? projector(Object.values(maps[family].stars)) : null; }
export function namedStars(family) { return maps[family] ? maps[family].stars : {}; }

// The colour of a star from its B–V colour index: Ballesteros' formula for temperature, then black-body colour.
export function starColor(bv) {
  const b = Math.min(2, Math.max(-0.4, Number.isFinite(bv) ? bv : 0.6));
  const t = 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62)) / 100;
  const clip = (v) => Math.min(255, Math.max(0, v));
  const r = t <= 66 ? 255 : clip(329.698727446 * Math.pow(t - 60, -0.1332047592));
  const g = t <= 66 ? clip(99.4708025861 * Math.log(t) - 161.1195681661) : clip(288.1221695283 * Math.pow(t - 60, -0.0755148492));
  const bl = t >= 66 ? 255 : t <= 19 ? 0 : clip(138.5177312231 * Math.log(t - 10) - 305.0447927307);
  // Seen by eye, star colours are soft: blend a little toward white.
  const w = b > 0.9 ? 0.08 : 0.2, mix = (v) => Math.round(v * (1 - w) + 255 * w);
  return `#${[r, g, bl].map((v) => mix(v).toString(16).padStart(2, "0")).join("")}`;
}

const starR = (mag) => 0.6 + 4.4 * Math.pow(10, -0.21 * (mag + 1.5));
const starOpacity = (mag) => (mag < 3 ? 1 : Math.max(0.45, 1 - (mag - 3) * 0.17));

function drawStar(id, x, y, mag, bv, twinkle) {
  const c = starColor(bv), r = starR(mag);
  let out = "";
  if (mag < 3) {
    const g = r * (mag < 1 ? 3.4 : 2.6);
    out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(g)}" fill="${c}" opacity="${mag < 1 ? 0.5 : mag < 2 ? 0.36 : 0.24}" filter="url(#${id}-glow)"${twinkle ? ` class="sm-tw" style="animation-delay:${twinkle}s"` : ""}/>`;
  }
  if (mag < 0.6) {
    // Gentle diffraction rays, as a camera or the eye sees the very brightest stars.
    const L = r * 7.5, l = r * 3.6;
    out += `<g stroke="${c}" stroke-linecap="round" filter="url(#${id}-soft)"><path d="M${f(x - L)} ${f(y)}H${f(x + L)}M${f(x)} ${f(y - L)}V${f(y + L)}" stroke-width=".7" opacity=".32"/><path d="M${f(x - l)} ${f(y)}H${f(x + l)}M${f(x)} ${f(y - l)}V${f(y + l)}" stroke-width="1.1" opacity=".5"/></g>`;
  }
  out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}" opacity="${starOpacity(mag).toFixed(2)}"/>`;
  if (mag < 3.5) out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.45)}" fill="#fff" opacity=".9"/>`;
  return out;
}

// The Orion Nebula: a soft pink-red cloud at its true size (about 65 by 60 arc-minutes), with little M43 beside it.
function nebula(id, project, s) {
  const [x, y] = project(s), k = project.perDegree, [mx, my] = project([s[0], s[1] + 0.2]);
  return `<g filter="url(#${id}-neb)"><ellipse cx="${f(x)}" cy="${f(y + 0.04 * k)}" rx="${f(0.55 * k)}" ry="${f(0.5 * k)}" fill="#a83a62" opacity=".42"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(0.3 * k)}" ry="${f(0.27 * k)}" fill="#ff7aa2" opacity=".55"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(0.12 * k)}" ry="${f(0.11 * k)}" fill="#ffd9e6" opacity=".75"/><ellipse cx="${f(mx)}" cy="${f(my)}" rx="${f(0.08 * k)}" ry="${f(0.07 * k)}" fill="#ff98b8" opacity=".45"/></g>`;
}

// A spiral galaxy seen tilted: faint halo, disk, dark dust lane and bright core, at true size and angle.
function spiral(id, x, y, k, size, angle) {
  const [a, b] = size, A = (a / 2) * k, B = (b / 2) * k;
  return `<g transform="rotate(${f(angle)} ${f(x)} ${f(y)})"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(A * 1.12)}" ry="${f(B * 1.25)}" fill="url(#${id}-halo)" filter="url(#${id}-neb)"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(A)}" ry="${f(B)}" fill="url(#${id}-gal)"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(A * 0.62)}" ry="${f(B * 0.6)}" fill="none" stroke="#d8dcff" stroke-width="${f(Math.max(0.6, B * 0.12))}" opacity=".18" filter="url(#${id}-soft)"/><ellipse cx="${f(x)}" cy="${f(y - B * 0.18)}" rx="${f(A * 0.78)}" ry="${f(B * 0.5)}" fill="none" stroke="#0b0a1c" stroke-width="${f(Math.max(0.8, B * 0.14))}" opacity=".55" filter="url(#${id}-soft)"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(Math.max(2.5, A * 0.13))}" ry="${f(Math.max(1.4, B * 0.2))}" fill="#fff6e4" filter="url(#${id}-soft)"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(Math.max(1, B * 0.07))}" fill="#fff"/></g>`;
}

// A small elliptical galaxy: a smooth soft oval.
function elliptical(id, x, y, k, size, angle) {
  const A = Math.max(1.6, (size[0] / 2) * k), B = Math.max(1.2, (size[1] / 2) * k);
  return `<g transform="rotate(${f(angle)} ${f(x)} ${f(y)})"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(A)}" ry="${f(B)}" fill="#f3e6d2" opacity=".55" filter="url(#${id}-soft)"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(A * 0.35)}" ry="${f(B * 0.35)}" fill="#fff5e6" opacity=".8"/></g>`;
}

// Label placement: try places around the point and keep the one that touches nothing.
function placer(bounds) {
  const boxes = [], dots = [];
  const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  return {
    block(box) { boxes.push(box); },
    dot(x, y, r, w = 1) { dots.push([x, y, r, w]); },
    place(x, y, gap, lines, sizes) {
      const w = Math.max(...lines.map((t, i) => t.length * sizes[i] * 0.56)) + 6, h = sizes[0] + sizes[1] + 6;
      const tries = [];
      [gap, gap + 14, gap + 30].forEach((g, tier) => [[1, 0], [-1, 0], [0.7, -0.7], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [0, -1], [0, 1]].forEach(([dx, dy], i) => tries.push([dx, dy, g, tier * 70 + i * 3])));
      let best = null;
      tries.forEach(([dx, dy, g, pref]) => {
        const ax = x + dx * g, ay = y + dy * g;
        const x0 = dx > 0.3 ? ax : dx < -0.3 ? ax - w : ax - w / 2;
        const y0 = dy > 0.3 ? ay : dy < -0.3 ? ay - h : ay - h / 2;
        const box = [x0, y0, x0 + w, y0 + h];
        let cost = pref;
        if (box[0] < bounds[0] + 4 || box[1] < bounds[1] + 4 || box[2] > bounds[2] - 4 || box[3] > bounds[3] - 4) cost += 1e7;
        for (const b of boxes) cost += overlap(box, b) * 500;
        for (const [px, py, pr, pw] of dots) if (px > box[0] - pr && px < box[2] + pr && py > box[1] - pr && py < box[3] + pr) cost += 300 * pw;
        if (!best || cost < best.cost) best = { cost, box, far: g > gap };
      });
      boxes.push(best.box);
      best.box.far = best.far;
      return best.box;
    },
  };
}

function label(box, lines, sizes, color = "#f4eedb", from) {
  const [x0, y0] = box;
  let lead = "";
  if (from && box.far) {
    const tx = Math.min(Math.max(from[0], box[0]), box[2]), ty = Math.min(Math.max(from[1], box[1] + 4), box[3] - 4);
    const d = Math.hypot(tx - from[0], ty - from[1]);
    if (d > from[2] + 8) { const ux = (tx - from[0]) / d, uy = (ty - from[1]) / d; lead = `<line x1="${f(from[0] + ux * from[2])}" y1="${f(from[1] + uy * from[2])}" x2="${f(tx - ux * 4)}" y2="${f(ty - uy * 4)}" stroke="#aebbe9" stroke-width=".8" opacity=".45"/>`; }
  }
  return `${lead}<text class="sm-label" x="${f(x0 + 3)}" y="${f(y0 + sizes[0])}" paint-order="stroke" stroke="#03040c" stroke-width="4" stroke-linejoin="round"><tspan font-size="${sizes[0]}" font-weight="600" fill="${color}">${lines[0]}</tspan><tspan x="${f(x0 + 3)}" dy="${sizes[1] + 3}" font-size="${sizes[1]}" fill="#aebbe9">${lines[1]}</tspan></text>`;
}

const NAME = 19, DIST = 15;

export function starMap(family) {
  const m = maps[family], sky = SKY[family];
  if (!m || !sky) return "";
  const id = `sm-${family}`;
  const project = projector(Object.values(m.stars));
  const k = project.perDegree;
  const P = Object.fromEntries(Object.entries(m.stars).map(([key, s]) => [key, project(s)]));
  const lay = placer([0, 0, W, H]);
  let body = "";

  // The Milky Way, where it truly runs, very faint.
  if (sky.mw.length) body += `<g fill="#c9d3ff" filter="url(#${id}-mw)">${sky.mw.map((d) => `<path d="${d}" opacity=".045"/>`).join("")}</g>`;

  // Deep-sky objects.
  if (m.nebula) body += nebula(id, project, m.stars[m.nebula]);
  if (m.haze) body += `<g fill="#8fb4ff" filter="url(#${id}-neb)">${m.haze.map((key) => `<circle cx="${f(P[key][0])}" cy="${f(P[key][1])}" r="${f(Math.max(3, 0.22 * k))}" opacity=".2"/>`).join("")}</g>`;
  if (m.galaxies) for (const [key, size] of Object.entries(m.galaxies)) {
    const [x, y] = P[key], angle = project.pa(m.stars[key], size[2]);
    body += key === "m31" ? spiral(id, x, y, k, size, angle) : elliptical(id, x, y, k, size, angle);
  }
  if (m.ring) { const [x, y] = P[m.ring]; body += `<circle cx="${f(x)}" cy="${f(y)}" r="2.4" fill="none" stroke="#9fe6d8" stroke-width="1.1" opacity=".9"/>`; lay.dot(x, y, 4, 3); }

  // Thin, faint constellation lines that stop short of the stars.
  const magOf = (key) => (sky.named[key] ? sky.named[key][0] : 4);
  body += `<g stroke="#9fb0e0" stroke-width=".9" opacity=".34">${m.lines.map(([a, b]) => {
    const [x1, y1] = P[a], [x2, y2] = P[b], len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ga = OBJECTS.has(a) ? 6 : starR(magOf(a)) + 4, gb = OBJECTS.has(b) ? 6 : starR(magOf(b)) + 4;
    if (len < ga + gb + 4) return "";
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    for (let t = ga; t < len - gb; t += 10) lay.dot(x1 + ux * t, y1 + uy * t, 2, 0.1);
    return `<line x1="${f(x1 + ux * ga)}" y1="${f(y1 + uy * ga)}" x2="${f(x2 - ux * gb)}" y2="${f(y2 - uy * gb)}"/>`;
  }).join("")}</g>`;

  // Finding aids: the arc from the Big Dipper's handle, and the pointer to Andromeda.
  if (m.arc) {
    const pts = m.arc.through.map((key) => P[key]);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i - 1], [c, e] = pts[i]; d += ` Q${f((a + c) / 2 - (e - b) * 0.12)} ${f((b + e) / 2 + (c - a) * 0.12)} ${f(c)} ${f(e)}`; }
    body += `<path d="${d}" fill="none" stroke="#9cc7ff" stroke-width="1.2" stroke-dasharray="5 7" opacity=".5"/>`;
  }
  if (m.pointer) { const [[a, b], [c, d]] = m.pointer.map((key) => P[key]); body += `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c)}" y2="${f(d)}" stroke="#c9b6ff" stroke-width="1" stroke-dasharray="3 5" opacity=".55"/>`; }

  // Every star brighter than about magnitude 6, from the catalogue, in its true colour.
  const stars = [...sky.stars].sort((a, b) => b[2] - a[2]);
  let tw = 0;
  for (const [x, y, mag, bv] of stars) {
    body += drawStar(id, x, y, mag, bv, mag < 1.6 ? -(tw++ * 1.7 + 0.4) : 0);
    if (mag < 5) lay.dot(x, y, starR(mag) + 2, mag < 2.5 ? 4 : mag < 4 ? 0.6 : 0.2);
  }

  // The home of the star family: a quiet gold ring.
  const [hx, hy] = P[m.home.at];
  body += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${m.home.radius}" fill="none" stroke="#f2c46d" stroke-width="1.2" opacity=".5"/>`;

  // The insets are blocked out before the labels are placed.
  if (m.inset) lay.block([m.inset.box[0] - 4, m.inset.box[1] - 4, m.inset.box[0] + m.inset.box[2] + 4, m.inset.box[1] + m.inset.box[3] + 4]);
  lay.block([W - 104, H - 30, W, H]);

  let labels = label(lay.place(hx, hy, m.home.radius + 5, m.home.label, [NAME + 1, DIST]), m.home.label, [NAME + 1, DIST], "#f6d98f");
  const order = Object.keys(m.labels).sort((a, b) => magOf(a) - magOf(b));
  for (const key of order) {
    const [x, y] = P[key], gap = OBJECTS.has(key) ? (key === "m42" ? 0.6 * k : 7) : starR(magOf(key)) + 6;
    labels += label(lay.place(x, y, gap, m.labels[key], [NAME, DIST]), m.labels[key], [NAME, DIST], undefined, [x, y, gap - 2]);
  }
  if (m.arc) {
    const [ax, ay] = P[m.arc.through[2]], [bx, by] = P[m.arc.through[3]];
    const box = lay.place((ax + bx) / 2, (ay + by) / 2, 10, [m.arc.label, ""], [15, 1]);
    labels += `<text x="${f(box[0] + 3)}" y="${f(box[1] + 15)}" fill="#9cc7ff" font-size="15" font-style="italic" paint-order="stroke" stroke="#03040c" stroke-width="4">${m.arc.label}</text>`;
  }

  let inset = "";
  if (m.inset) inset = drawInset(id, m, sky, P, project, family);

  return `<figure class="star-map">
<div class="star-map-scroll" data-focus="${(hx / W).toFixed(3)}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Star map: ${m.title}, as seen looking up at the night sky" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="${id}-sky" cx="50%" cy="42%" r="78%"><stop offset="0" stop-color="#0b1130"/><stop offset=".6" stop-color="#060920"/><stop offset="1" stop-color="#020309"/></radialGradient>
<radialGradient id="${id}-gal"><stop offset="0" stop-color="#fff3df" stop-opacity=".95"/><stop offset=".25" stop-color="#f1e4d0" stop-opacity=".6"/><stop offset=".6" stop-color="#b9c2ec" stop-opacity=".28"/><stop offset="1" stop-color="#8f9de0" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-halo"><stop offset="0" stop-color="#cfd6ff" stop-opacity=".22"/><stop offset="1" stop-color="#cfd6ff" stop-opacity="0"/></radialGradient>
<filter id="${id}-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="${id}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation=".9"/></filter>
<filter id="${id}-neb" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${f(Math.max(1.6, k * 0.09))}"/></filter>
<filter id="${id}-mw" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
<clipPath id="${id}-clip"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#${id}-clip)">
<rect width="${W}" height="${H}" fill="url(#${id}-sky)"/>
${body}
${inset}
${labels}
<text x="${W - 16}" y="${H - 14}" text-anchor="end" fill="#8f99c4" font-size="14">N ↑ · E ←</text>
</g>
</svg></div>
<figcaption>
<p class="sm-swipe fine">Swipe sideways to see the whole sky.</p>
<p><strong>${m.title}.</strong> <strong>How to find it:</strong> ${m.find}</p>
<p><strong>What makes it special:</strong> ${m.special}</p>
<p class="sm-ly">${LIGHT_YEAR} The light you see from ${m.light[0]} tonight left ${m.light[1]} about ${m.light[2]} years ago.</p>
<p class="fine">Drawn for SAMADHI LOVE from real star positions, as you see the sky looking up: north at the top, east on the left. Stars, colours and brightness from the HYG star database (built from ESA's Hipparcos and the Yale Bright Star catalogues, CC BY-SA 4.0); the Milky Way from d3-celestial by Olaf Frohn. Distances checked against NASA, ESA Hipparcos and Gaia.${m.ring ? " The Ring Nebula is drawn a little larger than life so it can be seen." : ""}</p>
</figcaption>
</figure>`;
}

// A close-up box: the same real sky, magnified around the home point.
function drawInset(id, m, sky, P, project, family) {
  const { box: [bx, by, bw, bh], zoom } = m.inset;
  const [cx, cy] = P[m.home.at], ox = bx + bw / 2, oy = by + (bh - 8 - 16 * m.inset.title.length) / 2;
  const Z = ([x, y]) => [ox + (x - cx) * zoom, oy + (y - cy) * zoom];
  const tl = m.inset.title.length, inside = ([x, y]) => x > bx + 3 && x < bx + bw - 3 && y > by + 3 && y < by + bh - 8 - 16 * tl;
  const k = project.perDegree * zoom;
  let g = "";
  const lay = placer([bx, by, bx + bw, by + bh - 4 - 16 * m.inset.title.length]);
  if (m.haze) {
    const [hx, hy] = Z(P[m.home.at]);
    g += `<ellipse cx="${f(hx - 6)}" cy="${f(hy - 4)}" rx="${f(0.75 * k)}" ry="${f(0.5 * k)}" fill="#6f95e6" opacity=".12" filter="url(#${id}-mw)"/><g fill="#9cbcff" filter="url(#${id}-neb)">${m.haze.map((key) => { const [x, y] = Z(P[key]); return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.06 * k)}" opacity=".16"/>`; }).join("")}</g>`;
  }
  if (m.galaxies) for (const [key, size] of Object.entries(m.galaxies)) {
    const [x, y] = Z(P[key]), angle = project.pa(m.stars[key], size[2]);
    g += key === "m31" ? spiral(id, x, y, k, size, angle) : elliptical(id, x, y, k, size, angle);
    lay.dot(x, y, key === "m31" ? 10 : 6, 3);
  }
  for (const [x0, y0, mag, bv] of [...sky.stars].sort((a, b) => b[2] - a[2])) {
    const [x, y] = Z([x0, y0]);
    if (!inside([x, y])) continue;
    const im = Math.max(mag - m.inset.boost, 0.7);
    g += drawStar(id, x, y, im, bv, 0);
    lay.dot(x, y, starR(im) + 2, 2);
  }
  let labels = "";
  if (m.inset.names) for (const [key, name] of Object.entries(m.inset.names)) {
    const [x, y] = Z(P[key]);
    if (!inside([x, y])) continue;
    const b = lay.place(x, y, starR(Math.max((sky.named[key] || [4])[0] - m.inset.boost, 0.7)) + 3, [name, ""], [13, 1]);
    labels += `<text x="${f(b[0] + 3)}" y="${f(b[1] + 13)}" fill="#dfe6ff" font-size="13" paint-order="stroke" stroke="#05060f" stroke-width="3">${name}</text>`;
  }
  if (m.inset.labels) for (const [key, lines] of Object.entries(m.inset.labels)) {
    const [x, y] = Z(P[key]);
    labels += label(lay.place(x, y, 8, lines, [15, 13]), lines, [15, 13]);
  }
  const [lx, ly] = [bx + bw, by + 18];
  return `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(lx)}" y2="${f(ly)}" stroke="#f2c46d" stroke-opacity=".35" stroke-dasharray="3 4"/>
<g><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="14" fill="#03050f" fill-opacity=".93" stroke="#f2c46d" stroke-opacity=".45"/>
<clipPath id="${id}-inset"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="14"/></clipPath>
<g clip-path="url(#${id}-inset)">${g}</g>${labels}
${m.inset.title.map((t, i, all) => `<text x="${bx + bw / 2}" y="${by + bh - 10 - 16 * (all.length - 1 - i)}" text-anchor="middle" fill="#f2c46d" font-size="13">${t}</text>`).join("")}</g>`;
}
