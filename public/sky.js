/* Cosmic scenes for SAMADHI LOVE: nebulae, stars and planets drawn in the browser.
   Any <canvas data-sky="scene-name"> on the page is painted once it has a size. */
(function () {
'use strict';
class SkyPainter {
start() {
  this.paintAll();
  this._onResize = () => { clearTimeout(this._rt); this._rt = setTimeout(() => this.paintAll(), 250); };
  window.addEventListener('resize', this._onResize);
  this._late = setTimeout(() => this.paintAll(), 600);
}
stop() {
  window.removeEventListener('resize', this._onResize);
  clearTimeout(this._rt); clearTimeout(this._late);
}
paintOne(c) {
  const w = c.clientWidth, h = c.clientHeight;
  if (!w || !h || (c._pw === w && c._ph === h)) return;
  c._pw = w; c._ph = h;
  try { this.paint(c, c.getAttribute('data-sky')); } catch (e) { /* keep page usable */ }
}
// Paints only the scenes on or near the screen; the rest are painted as the reader scrolls to them.
paintAll() {
  requestAnimationFrame(() => {
    const all = document.querySelectorAll('canvas[data-sky]');
    if (!('IntersectionObserver' in window)) { all.forEach((c) => this.paintOne(c)); return; }
    if (!this._io) this._io = new IntersectionObserver((list) => list.forEach((en) => { if (en.isIntersecting) this.paintOne(en.target); }), { rootMargin: '400px 0px' });
    all.forEach((c) => { this._io.unobserve(c); this._io.observe(c); });
  });
}
noise(seed) {
  const p = new Uint8Array(512); let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const perm = []; for (let i = 0; i < 256; i++) perm.push(i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const h = (x, y, z) => p[p[p[x & 255] + (y & 255)] + (z & 255)] / 255;
  const n = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    return lerp(
      lerp(lerp(h(xi, yi, zi), h(xi + 1, yi, zi), xf), lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
      lerp(lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf), zf);
  };
  return (x, y, z, o) => { let v = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < (o || 5); i++) { v += a * n(x * f, y * f, z * f); t += a; a *= 0.5; f *= 2.03; } return v / t; };
}
paint(c, mode) {
  // Phones get a lighter drawing: fewer pixels for the same picture.
  this.light = window.innerWidth < 700;
  const dpr = Math.min(window.devicePixelRatio || 1, this.light ? 1.5 : 2), w = c.clientWidth, h = c.clientHeight;
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  const S = this.scenes(w, h)[mode]; if (!S) return;
  const fbm = this.noise(S.seed || 11);
  let s = ((S.seed || 11) * 9301 + 49297) % 2147483647;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  if (S.bg) { const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#03020a'); bg.addColorStop(0.6, '#070414'); bg.addColorStop(1, '#0b0620'); g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  if (S.nebula) this.nebula(g, w, h, fbm, S.nebula);
  if (S.stars) this.stars(g, w, h, rnd, S.stars.density);
  if (S.cluster) this.cluster(g, S.cluster);
  if (S.sun) this.sun(g, S.sun);
  (S.planets || []).forEach((P) => this.planet(g, P, fbm, dpr));
}
scenes(w, h) {
  const m = Math.min(w, h), L = [-0.75, -0.45, 0.5];
  return {
    hero: { seed: 7, bg: 1, nebula: { cols: [[90, 40, 200], [200, 60, 170], [40, 170, 200], [240, 170, 80]], band: [0, 0.95, 1, 0.05], width: 0.42, strength: 1.25 }, stars: { density: 1 },
      planets: [
        { type: 'gas', x: w * 0.8, y: h * 0.68, r: Math.min(w * 0.24, h * 0.4), bands: 9, tilt: -0.32, light: L, pal: [[90, 55, 40], [176, 120, 75], [225, 190, 140], [245, 225, 190], [160, 95, 60]], atmo: '255,200,150', atmoA: 0.22, ring: { tilt: -0.32, flat: 0.26, inner: 1.3, outer: 2.05, alpha: 0.8, col: '225,205,170' } },
        { type: 'earth', x: w * 0.56, y: h * 0.21, r: m * 0.075, tilt: 0.35, light: L, atmo: '90,160,255', atmoA: 0.55 },
        { type: 'moon', x: w * 0.63, y: h * 0.12, r: m * 0.022, light: L }] },
    lib: { seed: 17, bg: 1, nebula: { cols: [[60, 50, 210], [190, 60, 190], [40, 190, 210]], band: [0, 0.2, 1, 0.9], width: 0.6, strength: 1.2 }, stars: { density: 1.2 },
      planets: [
        { type: 'earth', x: w * 0.84, y: h * 0.62, r: Math.min(w * 0.13, h * 0.42), tilt: 0.3, light: [-0.8, -0.4, 0.45], atmo: '90,160,255', atmoA: 0.55 },
        { type: 'moon', x: w * 0.7, y: h * 0.26, r: m * 0.07, light: [-0.8, -0.4, 0.45] }] },
    studio: { seed: 21, bg: 1, nebula: { cols: [[30, 160, 190], [110, 60, 220], [220, 80, 180]], band: [0, 0.2, 1, 0.8], width: 0.5, strength: 1.1 }, stars: { density: 0.8 },
      planets: [{ type: 'ice', x: w * 0.88, y: h * 0.55, r: h * 0.36, bands: 14, tilt: 0.2, pal: [[45, 110, 185], [150, 215, 235]], light: [-0.8, -0.3, 0.5], atmo: '120,200,255', atmoA: 0.4 }] },
    art1: { seed: 31, bg: 1, nebula: { cols: [[240, 160, 60], [230, 90, 120], [140, 60, 200]], band: [0.5, 0, 0.5, 1], width: 0.6, strength: 1.4 }, stars: { density: 0.9 }, sun: { x: w * 0.5, y: h * 0.48, r: m * 0.12 } },
    art2: { seed: 41, bg: 1, stars: { density: 1 }, nebula: { cols: [[40, 90, 200], [90, 60, 200]], band: [0, 1, 1, 0], width: 0.5, strength: 0.6 },
      planets: [{ type: 'earth', x: w * 0.5, y: h * 1.25, r: w * 0.62, tilt: 0.1, light: [-0.5, -0.75, 0.45], atmo: '90,160,255', atmoA: 0.6 }] },
    art3: { seed: 51, bg: 1, nebula: { cols: [[60, 120, 255], [120, 80, 240], [40, 200, 220]], band: [0, 0.3, 1, 0.7], width: 0.6, strength: 1 }, stars: { density: 2.2 }, cluster: { x: w * 0.5, y: h * 0.45, s: m / 220 } },
    'orb-earth': { seed: 3, planets: [{ type: 'earth', x: w / 2, y: h / 2, r: m * 0.36, tilt: 0.3, light: [-0.6, -0.5, 0.6], atmo: '90,160,255', atmoA: 0.6 }] },
    'orb-sun': { seed: 4, sun: { x: w / 2, y: h / 2, r: m * 0.08 } },
    'orb-ice': { seed: 5, planets: [{ type: 'ice', x: w / 2, y: h / 2, r: m * 0.22, bands: 12, tilt: -0.3, pal: [[50, 110, 190], [160, 220, 240]], light: [-0.6, -0.5, 0.6], atmo: '140,200,255', atmoA: 0.45, ring: { tilt: -0.3, flat: 0.32, inner: 1.35, outer: 2.0, alpha: 0.75, col: '190,215,240' } }] },
    'orb-gas': { seed: 8, planets: [{ type: 'gas', x: w / 2, y: h / 2, r: m * 0.36, bands: 10, tilt: 0.25, light: [-0.6, -0.5, 0.6], pal: [[120, 60, 35], [200, 130, 80], [235, 200, 150], [250, 230, 200], [170, 100, 60]], atmo: '255,200,150', atmoA: 0.3 }] },
    'orb-moon': { seed: 6, planets: [{ type: 'moon', x: w / 2, y: h / 2, r: m * 0.34, light: [-0.6, -0.5, 0.6] }] }
  };
}
nebula(g, w, h, fbm, N) {
  const sc = this.light ? 6 : 4, ow = Math.max(2, Math.ceil(w / sc)), oh = Math.max(2, Math.ceil(h / sc));
  const off = document.createElement('canvas'); off.width = ow; off.height = oh;
  const o = off.getContext('2d'); const im = o.createImageData(ow, oh); const d = im.data;
  const ax = N.band[0] * w, ay = N.band[1] * h, dx = (N.band[2] - N.band[0]) * w, dy = (N.band[3] - N.band[1]) * h, l2 = dx * dx + dy * dy || 1;
  const cols = N.cols, last = cols.length - 1;
  for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++) {
    const x = i * sc, y = j * sc;
    const t = ((x - ax) * dx + (y - ay) * dy) / l2;
    const dist = Math.hypot(x - (ax + dx * t), y - (ay + dy * t)) / (Math.min(w, h) * N.width);
    const warp = fbm(x * 0.003, y * 0.003, 0.5, 3);
    const mask = Math.exp(-dist * dist * 1.6) * (0.55 + 0.9 * warp);
    const n = fbm(x * 0.0045 + warp * 1.5, y * 0.0045, 1.7, 6);
    let dens = Math.max(0, (n - 0.42) * 2.4) * mask;
    const dust = fbm(x * 0.008, y * 0.008, 4.2, 4);
    dens *= 1 - Math.min(0.85, Math.max(0, (dust - 0.55) * 3));
    dens = Math.min(1, dens * N.strength);
    const k = Math.min(last - 0.001, Math.max(0, fbm(x * 0.002, y * 0.002, 7.7, 3) * last * 1.4 - 0.2 * last));
    const k0 = Math.floor(k), f = k - k0, c0 = cols[k0], c1 = cols[Math.min(k0 + 1, last)];
    const core = Math.pow(dens, 2.4) * 0.55 * 255;
    const idx = (j * ow + i) * 4;
    d[idx] = Math.min(255, (c0[0] + (c1[0] - c0[0]) * f) * dens + core);
    d[idx + 1] = Math.min(255, (c0[1] + (c1[1] - c0[1]) * f) * dens + core);
    d[idx + 2] = Math.min(255, (c0[2] + (c1[2] - c0[2]) * f) * dens + core);
    d[idx + 3] = 255;
  }
  o.putImageData(im, 0, 0);
  g.save(); g.globalCompositeOperation = 'lighter'; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(off, 0, 0, w, h); g.restore();
}
stars(g, w, h, rnd, density) {
  const n = Math.round((w * h) / 650 * density);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h, big = rnd() > 0.985;
    const sz = big ? 1.2 + rnd() * 1.8 : 0.25 + rnd() * 0.9;
    const tint = rnd(), col = tint < 0.15 ? '170,200,255' : tint < 0.25 ? '255,220,180' : '255,255,255';
    const a = 0.25 + rnd() * 0.75;
    g.fillStyle = 'rgba(' + col + ',' + a + ')'; g.beginPath(); g.arc(x, y, sz * 0.6, 0, 6.2832); g.fill();
    if (sz > 1.6) {
      const gr = g.createRadialGradient(x, y, 0, x, y, sz * 6);
      gr.addColorStop(0, 'rgba(' + col + ',0.45)'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, sz * 6, 0, 6.2832); g.fill();
      if (sz > 2.3) { g.strokeStyle = 'rgba(' + col + ',0.35)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x - sz * 9, y); g.lineTo(x + sz * 9, y); g.moveTo(x, y - sz * 9); g.lineTo(x, y + sz * 9); g.stroke(); }
    }
  }
  g.restore();
}
glowStar(g, x, y, r, col) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 7);
  gr.addColorStop(0, 'rgba(' + col + ',0.9)'); gr.addColorStop(0.15, 'rgba(' + col + ',0.35)'); gr.addColorStop(1, 'rgba(' + col + ',0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 7, 0, 6.2832); g.fill();
  g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.arc(x, y, r * 0.7, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(' + col + ',0.45)'; g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(x - r * 12, y); g.lineTo(x + r * 12, y); g.moveTo(x, y - r * 12); g.lineTo(x, y + r * 12); g.stroke();
}
cluster(g, C) {
  const pts = [[0, 0, 2.6], [-38, -20, 2.1], [30, -34, 2.3], [52, 6, 1.8], [-14, 30, 1.9], [-62, 18, 1.6], [16, 44, 1.5]];
  g.save(); g.globalCompositeOperation = 'lighter';
  pts.forEach((q) => this.glowStar(g, C.x + q[0] * C.s, C.y + q[1] * C.s, q[2] * C.s, '150,190,255'));
  g.restore();
}
sun(g, S) {
  g.save(); g.globalCompositeOperation = 'lighter';
  [[S.r * 6, '255,160,70', 0.2], [S.r * 3, '255,195,110', 0.4], [S.r * 1.4, '255,235,190', 0.85]].forEach((q) => {
    const gr = g.createRadialGradient(S.x, S.y, 0, S.x, S.y, q[0]);
    gr.addColorStop(0, 'rgba(' + q[1] + ',' + q[2] + ')'); gr.addColorStop(1, 'rgba(' + q[1] + ',0)');
    g.fillStyle = gr; g.beginPath(); g.arc(S.x, S.y, q[0], 0, 6.2832); g.fill();
  });
  g.fillStyle = 'rgba(255,250,236,1)'; g.beginPath(); g.arc(S.x, S.y, S.r * 0.55, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(255,225,180,0.35)'; g.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(S.x - Math.cos(a) * S.r * 5, S.y - Math.sin(a) * S.r * 5); g.lineTo(S.x + Math.cos(a) * S.r * 5, S.y + Math.sin(a) * S.r * 5); g.stroke(); }
  g.restore();
}
ring(g, P, front) {
  const R = P.ring; g.save(); g.translate(P.x, P.y); g.rotate(R.tilt); g.scale(1, R.flat);
  const n = 150, r0 = P.r * R.inner, r1 = P.r * R.outer;
  for (let k = 0; k < n; k++) {
    const t = k / n, rad = r0 + (r1 - r0) * t;
    let a = 0.35 + 0.25 * Math.sin(t * 61) + 0.2 * Math.sin(t * 23 + 1.3) + 0.15 * Math.sin(t * 137);
    if (t > 0.56 && t < 0.61) a *= 0.08;
    a = Math.max(0, a) * R.alpha * (front ? 1 : 0.8);
    g.strokeStyle = 'rgba(' + R.col + ',' + a.toFixed(3) + ')'; g.lineWidth = (r1 - r0) / n * 1.4;
    g.beginPath(); if (front) g.arc(0, 0, rad, 0, Math.PI); else g.arc(0, 0, rad, Math.PI, Math.PI * 2); g.stroke();
  }
  g.restore();
}
planet(g, P, fbm, dpr) {
  const R = Math.max(4, Math.round(P.r * dpr)), D = R * 2;
  const off = document.createElement('canvas'); off.width = D; off.height = D;
  const o = off.getContext('2d'); const im = o.createImageData(D, D); const d = im.data;
  let L = P.light || [-0.6, -0.4, 0.7]; const ll = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ll, L[1] / ll, L[2] / ll];
  const hl = Math.hypot(L[0], L[1], L[2] + 1), H = [L[0] / hl, L[1] / hl, (L[2] + 1) / hl];
  const ct = Math.cos(P.tilt || 0), st = Math.sin(P.tilt || 0), pal = P.pal;
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let py = 0; py < D; py++) for (let px = 0; px < D; px++) {
    const dx = (px + 0.5 - R) / R, dy = (py + 0.5 - R) / R, rr = dx * dx + dy * dy;
    if (rr > 1) continue;
    const nz = Math.sqrt(1 - rr), ux = dx * ct - dy * st, uy = dx * st + dy * ct;
    let r, gg, b, spec = 0;
    if (P.type === 'gas') {
      const wv = fbm(ux * 1.8 + 3, uy * 1.8, nz * 1.8, 4), fine = fbm(ux * 5, uy * 22, nz * 5, 3);
      const band = Math.sin(uy * P.bands + wv * 5 + fine * 1.2) * 0.5 + 0.5;
      const t = Math.min(0.999, Math.max(0, band * 0.8 + fine * 0.35 - 0.08)), k = t * (pal.length - 1), k0 = Math.floor(k), f = k - k0;
      const c0 = pal[k0], c1 = pal[Math.min(k0 + 1, pal.length - 1)];
      r = c0[0] + (c1[0] - c0[0]) * f; gg = c0[1] + (c1[1] - c0[1]) * f; b = c0[2] + (c1[2] - c0[2]) * f;
    } else if (P.type === 'ice') {
      const wv = fbm(ux * 2 + 1, uy * 2, nz * 2, 4), band = Math.sin(uy * P.bands + wv * 3) * 0.5 + 0.5;
      r = pal[0][0] + (pal[1][0] - pal[0][0]) * band; gg = pal[0][1] + (pal[1][1] - pal[0][1]) * band; b = pal[0][2] + (pal[1][2] - pal[0][2]) * band;
    } else if (P.type === 'moon') {
      const e = fbm(ux * 3 + 2, uy * 3, nz * 3, 6), cr = fbm(ux * 9, uy * 9, nz * 9, 3), mare = sm(0.5, 0.6, fbm(ux * 1.4 + 4, uy * 1.4, nz * 1.4, 4));
      const v = 150 + e * 80 - mare * 55 - Math.max(0, cr - 0.62) * 180; r = v; gg = v * 0.97; b = v * 0.94;
    } else {
      const e = fbm(ux * 1.7 + 9, uy * 1.7, nz * 1.7, 6);
      if (e > 0.52) { const hg = (e - 0.52) * 4; r = 60 + hg * 90; gg = 95 + hg * 40; b = 45 + hg * 20; if (hg > 0.35) { r = 150 + hg * 40; gg = 125 + hg * 30; b = 85; } }
      else { const dp = Math.min(1, (0.52 - e) * 3); r = 10 + (1 - dp) * 20; gg = 45 + (1 - dp) * 50; b = 110 + (1 - dp) * 70; spec = 1; }
      const au = Math.abs(uy); if (au > 0.84) { const ic = sm(0.84, 0.93, au); r += (235 - r) * ic; gg += (240 - gg) * ic; b += (250 - b) * ic; if (ic > 0.5) spec = 0; }
      const ca = sm(0.5, 0.7, fbm(ux * 2.6 + 20, uy * 3.2, nz * 2.6, 5)) * 0.92;
      r += (250 - r) * ca; gg += (250 - gg) * ca; b += (255 - b) * ca; if (ca > 0.3) spec = 0;
    }
    const diff = dx * L[0] + dy * L[1] + nz * L[2], lit = sm(-0.18, 0.55, diff), limb = 0.55 + 0.45 * Math.pow(nz, 0.6);
    const mul = (0.035 + lit * 0.97) * limb;
    const sr = spec ? Math.pow(Math.max(0, dx * H[0] + dy * H[1] + nz * H[2]), 45) * 0.8 * lit : 0;
    const idx = (py * D + px) * 4;
    d[idx] = Math.min(255, r * mul + sr * 255); d[idx + 1] = Math.min(255, gg * mul + sr * 240); d[idx + 2] = Math.min(255, b * mul + sr * 220);
    d[idx + 3] = 255 * Math.min(1, (1 - Math.sqrt(rr)) * R * 1.2);
  }
  o.putImageData(im, 0, 0);
  if (P.ring) this.ring(g, P, false);
  g.save(); g.imageSmoothingQuality = 'high'; g.drawImage(off, P.x - P.r, P.y - P.r, P.r * 2, P.r * 2); g.restore();
  if (P.atmo) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(P.x + L[0] * P.r * 0.1, P.y + L[1] * P.r * 0.1, P.r * 0.9, P.x, P.y, P.r * 1.14);
    gr.addColorStop(0, 'rgba(' + P.atmo + ',0)'); gr.addColorStop(0.45, 'rgba(' + P.atmo + ',' + (P.atmoA || 0.4) + ')'); gr.addColorStop(1, 'rgba(' + P.atmo + ',0)');
    g.fillStyle = gr; g.beginPath(); g.arc(P.x, P.y, P.r * 1.16, 0, 6.2832); g.fill(); g.restore();
  }
  if (P.ring) this.ring(g, P, true);
}

}
const sky = new SkyPainter();
// Pause / play button for the moving truths.
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest && ev.target.closest('[data-ticker-toggle]');
  if (!btn) return;
  const still = document.documentElement.classList.toggle('still');
  btn.setAttribute('aria-pressed', still ? 'true' : 'false');
  btn.textContent = still ? 'Play' : 'Pause';
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => sky.start());
else sky.start();
})();

// Tables wider than the screen: show the "swipe" hint, hide it once the reader reaches the end.
(function () {
  function mark() {
    document.querySelectorAll('.table-wrap').forEach((t) => {
      t.classList.toggle('scrolls', t.scrollWidth > t.clientWidth + 2);
      t.classList.toggle('scrolled-end', t.scrollLeft + t.clientWidth >= t.scrollWidth - 2);
    });
  }
  function start() {
    mark();
    window.addEventListener('resize', mark, { passive: true });
    document.querySelectorAll('.table-wrap').forEach((t) => t.addEventListener('scroll', mark, { passive: true }));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
