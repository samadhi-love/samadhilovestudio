/* Ancient backgrounds for SAMADHI LOVE: dark stone with faint engraved gold instruments
   (astrolabe, compass rose, sacred geometry, dividers and measuring rules), drawn in the browser.
   Any <canvas data-sky="scene-name"> on the page is painted once it has a size. The astrolabe's
   inner ring turns very slowly; it stands still for visitors who prefer less motion. */
(function () {
'use strict';
const TAU = Math.PI * 2;
const still = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
class SkyPainter {
start() {
  this.live = new Set();
  this.paintAll();
  this._onResize = () => { clearTimeout(this._rt); this._rt = setTimeout(() => this.paintAll(), 250); };
  window.addEventListener('resize', this._onResize);
  this._late = setTimeout(() => this.paintAll(), 600);
  if (!still()) this.loop();
}
paintOne(c) {
  const w = c.clientWidth, h = c.clientHeight;
  if (!w || !h || (c._pw === w && c._ph === h)) return;
  c._pw = w; c._ph = h;
  try { this.paint(c, c.getAttribute('data-sky')); } catch (e) { /* keep page usable */ }
}
paintAll() {
  requestAnimationFrame(() => {
    const all = document.querySelectorAll('canvas[data-sky]');
    if (!('IntersectionObserver' in window)) { all.forEach((c) => this.paintOne(c)); return; }
    if (!this._io) this._io = new IntersectionObserver((list) => list.forEach((en) => {
      if (en.isIntersecting) { this.paintOne(en.target); this.live.add(en.target); } else this.live.delete(en.target);
    }), { rootMargin: '200px 0px' });
    all.forEach((c) => { this._io.unobserve(c); this._io.observe(c); });
  });
}
// About 12 frames a second, only for pictures on screen, and never while the tab is hidden.
loop() {
  let last = 0;
  const tick = (t) => {
    requestAnimationFrame(tick);
    if (document.hidden || t - last < 80) return;
    last = t;
    this.live.forEach((c) => { if (c._S && c._S.spin) this.draw(c, t / 1000); });
  };
  requestAnimationFrame(tick);
}
noise(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const p = new Uint8Array(512); const perm = []; for (let i = 0; i < 256; i++) perm.push(i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  const h = (x, y) => p[p[x & 255] + (y & 255)] / 255;
  const n = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = fade(x - xi), yf = fade(y - yi);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), xf), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), xf), yf); };
  return (x, y) => { let v = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < 5; i++) { v += a * n(x * f, y * f); t += a; a *= 0.5; f *= 2.03; } return v / t; };
}
// Dark stone: warm black with a faint grain, painted once and kept.
stone(w, h, seed, round) {
  const k = 4, cw = Math.max(1, Math.ceil(w / k)), ch = Math.max(1, Math.ceil(h / k));
  const off = document.createElement('canvas'); off.width = cw; off.height = ch;
  const o = off.getContext('2d'), im = o.createImageData(cw, ch), d = im.data, fbm = this.noise(seed);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const v = fbm(x / 26, y / 26), g = fbm(x / 6 + 40, y / 6), i = (y * cw + x) * 4;
    const l = 7 + v * 16 + g * 6;
    d[i] = l * 1.12; d[i + 1] = l * 1.0; d[i + 2] = l * 0.82; d[i + 3] = 255;
  }
  o.putImageData(im, 0, 0);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const g = out.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(off, 0, 0, w, h);
  const vg = g.createRadialGradient(w * 0.6, h * 0.45, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  if (round) { g.globalCompositeOperation = 'destination-in'; g.beginPath(); g.arc(w / 2, h / 2, Math.min(w, h) / 2 - 1, 0, TAU); g.fill(); }
  return out;
}
paint(c, mode) {
  this.light = window.innerWidth < 700;
  const dpr = Math.min(window.devicePixelRatio || 1, this.light ? 1.5 : 2), w = c.clientWidth, h = c.clientHeight;
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const S = this.scenes(w, h)[mode] || this.scenes(w, h).lib;
  c._S = S; c._dpr = dpr; c._w = w; c._h = h;
  c._stone = this.stone(w, h, S.seed, S.round);
  this.draw(c, 0);
}
draw(c, t) {
  const g = c.getContext('2d'), S = c._S, w = c._w, h = c._h;
  g.setTransform(c._dpr, 0, 0, c._dpr, 0, 0); g.clearRect(0, 0, w, h);
  g.drawImage(c._stone, 0, 0, w, h);
  g.lineCap = 'round'; g.lineJoin = 'round';
  S.items.forEach((it) => this[it.t](g, it, t));
}
gold(g, a, lw) { g.strokeStyle = 'rgba(222,184,110,' + a + ')'; g.fillStyle = 'rgba(222,184,110,' + a + ')'; g.lineWidth = lw || 1; }
ring(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
// An astrolabe: degree scale, hour divisions, the turning rete with its star pointers, and the rule.
astrolabe(g, it, t) {
  const { x, y, r, a } = it, spin = it.spin ? t * 0.02 : 0;
  this.gold(g, a, 1.4); this.ring(g, x, y, r); this.ring(g, x, y, r * 0.965);
  this.gold(g, a * 0.9, 1); this.ring(g, x, y, r * 0.86); this.ring(g, x, y, r * 0.5); this.ring(g, x, y, r * 0.08);
  for (let i = 0; i < 360; i += 2) {
    const ang = (i * Math.PI) / 180, l = i % 30 === 0 ? 0.09 : i % 10 === 0 ? 0.06 : 0.035;
    g.lineWidth = i % 30 === 0 ? 1.3 : 0.7;
    g.beginPath(); g.moveTo(x + Math.cos(ang) * r * 0.965, y + Math.sin(ang) * r * 0.965); g.lineTo(x + Math.cos(ang) * r * (0.965 - l), y + Math.sin(ang) * r * (0.965 - l)); g.stroke();
  }
  g.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) { const ang = (i * TAU) / 12; g.beginPath(); g.moveTo(x + Math.cos(ang) * r * 0.5, y + Math.sin(ang) * r * 0.5); g.lineTo(x + Math.cos(ang) * r * 0.86, y + Math.sin(ang) * r * 0.86); g.stroke(); }
  // Almucantars: the circles of equal height, drawn as offset arcs.
  this.gold(g, a * 0.55, 0.7);
  for (let k = 1; k <= 5; k++) { g.beginPath(); g.arc(x, y - r * 0.08 * k, r * (0.5 - k * 0.07), 0, TAU); g.stroke(); }
  // The rete turns slowly: the ecliptic ring and its pointers.
  g.save(); g.translate(x, y); g.rotate(spin);
  this.gold(g, a * 1.1, 1.2); this.ring(g, r * 0.16, 0, r * 0.6);
  for (let i = 0; i < 9; i++) {
    const ang = (i * TAU) / 9 + 0.3, rr = r * (0.55 + (i % 3) * 0.1), px = Math.cos(ang) * rr, py = Math.sin(ang) * rr;
    g.beginPath(); g.moveTo(px * 0.82, py * 0.82); g.quadraticCurveTo(px * 0.95 + py * 0.05, py * 0.95 - px * 0.05, px, py); g.stroke();
    g.beginPath(); g.arc(px, py, 2.2, 0, TAU); g.fill();
  }
  g.lineWidth = 1.6; g.beginPath(); g.moveTo(-r * 0.97, 0); g.lineTo(r * 0.97, 0); g.stroke();
  g.lineWidth = 0.8; g.beginPath(); g.moveTo(-r * 0.97, -3); g.lineTo(-r * 0.6, -3); g.moveTo(r * 0.6, 3); g.lineTo(r * 0.97, 3); g.stroke();
  g.restore();
}
// A compass rose of sixteen points.
rose(g, it) {
  const { x, y, r, a } = it;
  this.gold(g, a, 1); this.ring(g, x, y, r); this.ring(g, x, y, r * 0.92);
  for (let i = 0; i < 16; i++) {
    const ang = (i * TAU) / 16 - Math.PI / 2, L = i % 4 === 0 ? 1 : i % 2 === 0 ? 0.7 : 0.45, wdt = i % 4 === 0 ? 0.12 : 0.08;
    const tx = x + Math.cos(ang) * r * L, ty = y + Math.sin(ang) * r * L;
    const lx = x + Math.cos(ang - Math.PI / 2) * r * wdt, ly = y + Math.sin(ang - Math.PI / 2) * r * wdt;
    const rx = x + Math.cos(ang + Math.PI / 2) * r * wdt, ry = y + Math.sin(ang + Math.PI / 2) * r * wdt;
    g.beginPath(); g.moveTo(lx, ly); g.lineTo(tx, ty); g.lineTo(rx, ry); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(tx, ty); g.globalAlpha = 0.6; g.stroke(); g.globalAlpha = 1;
  }
  this.ring(g, x, y, r * 0.14);
}
// Sacred geometry: a circle with the six-pointed star, the seed of life and the square of the circle.
geometry(g, it) {
  const { x, y, r, a } = it;
  this.gold(g, a, 1); this.ring(g, x, y, r);
  const tri = (rot) => { g.beginPath(); for (let i = 0; i < 3; i++) { const ang = rot + (i * TAU) / 3; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(ang) * r, y + Math.sin(ang) * r); } g.closePath(); g.stroke(); };
  tri(-Math.PI / 2); tri(Math.PI / 2);
  this.gold(g, a * 0.7, 0.8); this.ring(g, x, y, r * 0.5);
  for (let i = 0; i < 6; i++) { const ang = (i * TAU) / 6; this.ring(g, x + Math.cos(ang) * r * 0.25, y + Math.sin(ang) * r * 0.25, r * 0.25); }
  g.strokeRect(x - r * 0.707, y - r * 0.707, r * 1.414, r * 1.414);
  for (let i = 0; i < 6; i++) { const ang = (i * TAU) / 6 - Math.PI / 2; g.beginPath(); g.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r, 2, 0, TAU); g.fill(); }
}
// A pair of dividers (drafting compasses) standing open over an arc.
dividers(g, it) {
  const { x, y, len, ang, a } = it, open = 0.32;
  const l1 = [x + Math.cos(ang - open) * len, y + Math.sin(ang - open) * len], l2 = [x + Math.cos(ang + open) * len, y + Math.sin(ang + open) * len];
  this.gold(g, a, 2); g.beginPath(); g.moveTo(x, y); g.lineTo(l1[0], l1[1]); g.moveTo(x, y); g.lineTo(l2[0], l2[1]); g.stroke();
  this.gold(g, a, 1); this.ring(g, x, y, len * 0.06); g.beginPath(); g.moveTo(x, y - len * 0.06); g.lineTo(x, y - len * 0.16); g.stroke();
  g.beginPath(); g.arc(x, y, len * 0.96, ang - open - 0.2, ang + open + 0.2); g.setLineDash([3, 5]); g.stroke(); g.setLineDash([]);
}
// A measuring rule with its divisions.
rule(g, it) {
  const { x1, y1, x2, y2, a } = it, L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
  this.gold(g, a, 1); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  for (let s = 0, i = 0; s <= L; s += 8, i++) { const k = i % 10 === 0 ? 12 : i % 5 === 0 ? 8 : 4; g.lineWidth = i % 10 === 0 ? 1.1 : 0.6;
    g.beginPath(); g.moveTo(x1 + ux * s, y1 + uy * s); g.lineTo(x1 + ux * s - uy * k, y1 + uy * s + ux * k); g.stroke(); }
}
scenes(w, h) {
  const m = Math.min(w, h), A = 0.2;
  const big = (x, y, r, seed) => ({ seed, spin: true, items: [
    { t: 'astrolabe', x, y, r, a: A, spin: true },
    { t: 'geometry', x: w * 0.56, y: h * 0.2, r: m * 0.13, a: A * 0.6 },
    { t: 'rose', x: w * 0.1, y: h * 0.84, r: m * 0.12, a: A * 0.6 },
    { t: 'dividers', x: w * 0.38, y: h * 0.62, len: m * 0.3, ang: 1.25, a: A * 0.55 },
    { t: 'rule', x1: w * 0.04, y1: h * 0.97, x2: w * 0.5, y2: h * 0.97, a: A * 0.6 }] });
  return {
    hero: big(w * 0.8, h * 0.4, Math.min(w * 0.3, h * 0.42), 7),
    lib: big(w * 0.83, h * 0.52, Math.min(w * 0.26, h * 0.58), 17),
    studio: big(w * 0.83, h * 0.52, Math.min(w * 0.26, h * 0.58), 21),
    art1: { seed: 31, items: [{ t: 'geometry', x: w * 0.78, y: h * 0.5, r: m * 0.44, a: A }, { t: 'rose', x: w * 0.15, y: h * 0.78, r: m * 0.16, a: A * 0.6 }, { t: 'rule', x1: w * 0.05, y1: h * 0.95, x2: w * 0.6, y2: h * 0.95, a: A * 0.5 }] },
    art2: { seed: 41, items: [{ t: 'rose', x: w * 0.8, y: h * 0.5, r: m * 0.44, a: A }, { t: 'dividers', x: w * 0.25, y: h * 0.3, len: m * 0.35, ang: 1.1, a: A * 0.6 }] },
    art3: { seed: 51, spin: true, items: [{ t: 'astrolabe', x: w * 0.8, y: h * 0.5, r: m * 0.46, a: A, spin: true }, { t: 'geometry', x: w * 0.2, y: h * 0.3, r: m * 0.16, a: A * 0.6 }] },
    'orb-sun': { seed: 4, round: true, items: [{ t: 'rose', x: w / 2, y: h / 2, r: m * 0.4, a: 0.85 }] },
    'orb-earth': { seed: 3, round: true, items: [{ t: 'geometry', x: w / 2, y: h / 2, r: m * 0.4, a: 0.85 }] },
    'orb-moon': { seed: 6, round: true, items: [{ t: 'rose', x: w / 2, y: h / 2, r: m * 0.4, a: 0.85 }] },
    'orb-ice': { seed: 5, round: true, items: [{ t: 'geometry', x: w / 2, y: h / 2, r: m * 0.4, a: 0.85 }] },
    'orb-gas': { seed: 8, round: true, items: [{ t: 'astrolabe', x: w / 2, y: h / 2, r: m * 0.44, a: 0.85 }] },
  };
}
}
const sky = new SkyPainter();
// Pause / play button for the moving truths.
// The visitor's choice is remembered on this device, so the words stay still on every page once paused.
const showTicker = (still) => document.querySelectorAll('[data-ticker-toggle]').forEach((b) => { b.setAttribute('aria-pressed', still ? 'true' : 'false'); b.textContent = still ? 'Play' : 'Pause'; });
try { if (localStorage.getItem('sl-ticker') === 'still') { document.documentElement.classList.add('still'); showTicker(true); } } catch (e) { /* storage may be blocked */ }
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest && ev.target.closest('[data-ticker-toggle]');
  if (!btn) return;
  const still = document.documentElement.classList.toggle('still');
  showTicker(still);
  try { localStorage.setItem('sl-ticker', still ? 'still' : 'moving'); } catch (e) { /* storage may be blocked */ }
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

// Menu panels are plain <details>; this only adds niceties: a click outside or Escape closes an open panel.
(() => {
  const open = () => [...document.querySelectorAll(".nav-drop[open]")];
  document.addEventListener("click", (e) => { open().forEach((d) => { if (!d.contains(e.target)) d.removeAttribute("open"); }); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    open().forEach((d) => { d.removeAttribute("open"); const s = d.querySelector("summary"); if (s && d.contains(document.activeElement)) s.focus(); });
  });
  // Older browsers without exclusive <details name>: opening one panel closes the other.
  document.querySelectorAll(".nav-drop").forEach((d) => d.addEventListener("toggle", () => { if (d.open) open().forEach((o) => { if (o !== d) o.removeAttribute("open"); }); }));
})();

// Star maps: on a narrow screen the map scrolls sideways; open it centred on the star family's home.
for (const box of document.querySelectorAll(".star-map-scroll[data-focus]")) {
  const centre = () => {
    if (box.scrollWidth <= box.clientWidth) return;
    const want = Number(box.dataset.focus) * box.scrollWidth - box.clientWidth / 2;
    box.scrollLeft = Math.max(0, Math.min(box.scrollWidth - box.clientWidth, want));
  };
  centre();
  window.addEventListener("load", centre, { once: true });
}

// The golden Tree of Life: tapping a sphere shows its meaning below, without jumping the page.
for (const fig of document.querySelectorAll(".tl-gold-figure")) {
  const notes = fig.querySelectorAll(".tl-note");
  fig.addEventListener("click", (ev) => {
    const a = ev.target.closest("a[data-tl]");
    if (!a) return;
    ev.preventDefault();
    const note = fig.querySelector(`#tln-${a.dataset.tl}`);
    notes.forEach((n) => n.classList.toggle("is-open", n === note));
    fig.querySelectorAll(".tl-node").forEach((n) => n.classList.toggle("is-chosen", n === a));
    if (note) note.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

// The wisdom tablet: one saying at a time. "Next saying" flips it over to the next one on the same page;
// on the home page it also turns by itself every 12 seconds (not while someone points at it).
for (const box of document.querySelectorAll("[data-wisdom-tablet]")) {
  const items = [...box.querySelectorAll(".wt-item")];
  const tablet = box.closest(".wisdom-tablet");
  if (items.length < 2 || !tablet) continue;
  const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let i = 0, hold = false, busy = false;
  const show = () => {
    if (busy) return;
    const swap = () => {
      items[i].classList.remove("is-on"); items[i].setAttribute("aria-hidden", "true");
      i = (i + 1) % items.length;
      items[i].classList.add("is-on"); items[i].removeAttribute("aria-hidden");
    };
    if (calm) { swap(); return; }
    busy = true;
    box.classList.add("is-flipping");
    setTimeout(() => { swap(); box.classList.remove("is-flipping"); box.classList.add("is-landing");
      setTimeout(() => { box.classList.remove("is-landing"); busy = false; }, 380); }, 380);
  };
  const next = tablet.querySelector("[data-wt-next]");
  if (next) next.addEventListener("click", () => show());
  tablet.addEventListener("mouseenter", () => { hold = true; });
  tablet.addEventListener("mouseleave", () => { hold = false; });
  if (!tablet.closest(".tab-flank-text, .teachings-heading, .banner")) setInterval(() => { if (!hold && !document.hidden) show(); }, 12000);
}
