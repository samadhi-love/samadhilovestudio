// Builds lib/starmap-data.js: the real stars (to about magnitude 6) and the real Milky Way outline
// for each Star Nations map. Run once when the maps change:
//
//   node scripts/build-star-data.mjs <hygdata_v41.csv> <mw.json>
//
// hygdata_v41.csv: the HYG star database, https://github.com/astronexus/HYG-Database (CC BY-SA 4.0),
//   built from ESA's Hipparcos catalogue, the Yale Bright Star Catalogue and the Gliese catalogue.
// mw.json: the Milky Way outline from d3-celestial by Olaf Frohn, https://github.com/ofrohn/d3-celestial (BSD).

import { readFileSync, writeFileSync } from "node:fs";
import { mapProjection, namedStars, starMapFamilies } from "../lib/starmaps.js";

const [hygPath, mwPath] = process.argv.slice(2);
if (!hygPath || !mwPath) { console.error("usage: node scripts/build-star-data.mjs <hygdata_v41.csv> <mw.json>"); process.exit(1); }

const W = 800, H = 450, FAINTEST = 6.0;

// A small CSV reader (fields may be quoted).
function parseLine(line) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out;
}

const lines = readFileSync(hygPath, "utf8").split(/\r?\n/);
const head = parseLine(lines[0]);
const col = (name) => head.indexOf(name);
const [iRa, iDec, iMag, iCi, iId] = ["ra", "dec", "mag", "ci", "id"].map(col);
const catalogue = [];
for (let n = 1; n < lines.length; n++) {
  if (!lines[n]) continue;
  const r = parseLine(lines[n]);
  const mag = Number(r[iMag]);
  if (r[iId] === "0" || !(mag <= FAINTEST)) continue; // id 0 is the Sun
  const ci = r[iCi] === "" ? NaN : Number(r[iCi]);
  catalogue.push({ ra: Number(r[iRa]) * 15, dec: Number(r[iDec]), mag, bv: Number.isFinite(ci) ? ci : 0.6 });
}

// Sutherland–Hodgman clipping of a polygon to a rectangle.
function clip(poly, [x0, y0, x1, y1]) {
  const edges = [[(p) => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]]];
  let out = poly;
  for (const [inside, cut] of edges) {
    const input = out; out = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const a = input[(i + input.length - 1) % input.length], b = input[i];
      if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); }
      else if (inside(a)) out.push(cut(a, b));
    }
  }
  return out;
}

const mw = JSON.parse(readFileSync(mwPath, "utf8"));
const sep = (a, b) => { // angular separation in degrees
  const r = Math.PI / 180;
  return Math.acos(Math.min(1, Math.sin(a.dec * r) * Math.sin(b.dec * r) + Math.cos(a.dec * r) * Math.cos(b.dec * r) * Math.cos((a.ra - b.ra) * r))) / r;
};

const data = {};
for (const family of starMapFamilies) {
  const project = mapProjection(family);
  const stars = [];
  for (const s of catalogue) {
    const [x, y, c] = project.deg(s.ra, s.dec);
    if (c > 0.2 && x > -6 && x < W + 6 && y > -6 && y < H + 6) stars.push([+x.toFixed(1), +y.toFixed(1), +s.mag.toFixed(2), +s.bv.toFixed(2)]);
  }
  // The catalogue brightness and colour of each named star (nearest catalogue star within 0.15°).
  const named = {};
  for (const [key, [raH, dec]] of Object.entries(namedStars(family))) {
    let best = null, bestD = 0.15;
    for (const s of catalogue) { if (Math.abs(s.dec - dec) > 0.2) continue; const d = sep(s, { ra: raH * 15, dec }); if (d < bestD) { bestD = d; best = s; } }
    if (best) named[key] = [+best.mag.toFixed(2), +best.bv.toFixed(2)];
  }
  // The Milky Way: five levels of brightness, each a set of outlines.
  const levels = [];
  for (const feature of mw.features) {
    let d = "";
    for (const polygon of feature.geometry.coordinates) for (const ring of polygon) {
      const pts = ring.map(([lon, lat]) => project.deg(lon < 0 ? lon + 360 : lon, lat)).map(([x, y]) => [x, y]);
      const cut = clip(pts, [-40, -40, W + 40, H + 40]);
      if (cut.length < 3) continue;
      const kept = [];
      for (const p of cut) { const last = kept[kept.length - 1]; if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 3) kept.push(p); }
      if (kept.length < 3) continue;
      d += "M" + kept.map((p) => `${Math.round(p[0])} ${Math.round(p[1])}`).join("L") + "Z";
    }
    if (d) levels.push(d);
  }
  data[family] = { stars, named, mw: levels };
  console.log(`${family}: ${stars.length} stars, ${Object.keys(named).length} named matched, ${levels.length} Milky Way levels`);
}

const header = `// Made by scripts/build-star-data.mjs. Do not edit by hand.
// Stars: the HYG star database v4.1 (https://github.com/astronexus/HYG-Database), licensed CC BY-SA 4.0,
// built from ESA's Hipparcos catalogue, the Yale Bright Star Catalogue and the Gliese catalogue.
// Each star is [x, y, magnitude, B–V colour index], already placed on the 800 × 450 map.
// Milky Way: the outline from d3-celestial by Olaf Frohn (https://github.com/ofrohn/d3-celestial), BSD licence.
`;
writeFileSync(new URL("../lib/starmap-data.js", import.meta.url), `${header}export const SKY = ${JSON.stringify(data)};\n`);
