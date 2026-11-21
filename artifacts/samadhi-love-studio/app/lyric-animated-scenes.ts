/**
 * Animated lyric-video backgrounds drawn entirely in code: original artwork,
 * no photos, fonts or third-party images, so they are copyright-safe.
 * The US flag (official proportions) and the Statue of Liberty are public domain;
 * the New York skyline is a generic, original silhouette.
 *
 * Every scene is a pure function of (size, t): the same time always draws the
 * same picture, so previews and exported videos match frame for frame.
 * `t` is the background motion time (0 when the video uses "still" motion).
 */
export const animatedScenes = ["balloons", "meadow", "undersea", "lullaby", "jungle", "farm", "pets", "flag", "liberty", "nycnight"] as const;
export type AnimatedScene = typeof animatedScenes[number];
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const TAU = Math.PI * 2;
/** Deterministic 0..1 noise for scene layout. */
const rnd = (i: number, salt = 1) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };

// Static layers (flag cloth, skyline) are drawn once per size and reused every frame.
const cache = new Map<string, CanvasImageSource>();
function cached(key: string, w: number, h: number, draw: (c: Ctx) => void): CanvasImageSource | null {
  const hit = cache.get(key);
  if (hit) return hit;
  let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  if (typeof OffscreenCanvas !== "undefined") canvas = new OffscreenCanvas(w, h);
  else if (typeof document !== "undefined") { canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; }
  const c = canvas?.getContext("2d") as Ctx | null | undefined;
  if (!canvas || !c) return null;
  draw(c);
  if (cache.size > 24) cache.clear();
  cache.set(key, canvas);
  return canvas;
}

function vertical(c: Ctx, h: number, stops: [number, string][]) {
  const g = c.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}
function cloud(c: Ctx, x: number, y: number, s: number, color: string, alpha: number) {
  c.save(); c.globalAlpha = alpha; c.fillStyle = color; c.beginPath();
  for (const [dx, dy, r] of [[0, 0, 0.5], [0.45, -0.18, 0.42], [0.9, 0, 0.45], [0.45, 0.12, 0.5], [-0.35, 0.08, 0.35], [1.25, 0.1, 0.3]])
    { c.moveTo(x + dx * s + r * s, y + dy * s); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); }
  c.fill(); c.restore();
}
function star(c: Ctx, x: number, y: number, r: number, points = 5, inner = 0.45, rotate = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 ? r * inner : r, a = rotate + i * Math.PI / points;
    if (i) c.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius); else c.moveTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
  }
  c.closePath();
}

/* ---------------- Kids: Balloon Party ---------------- */
function balloons(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#7cc8ff"], [0.55, "#bfe6ff"], [1, "#ffd3ec"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  for (let i = 0; i < 4; i++) cloud(c, ((rnd(i, 3) * 1.4 - 0.2) * w + t * m * 0.012 * (1 + i % 2)) % (w * 1.3) - w * 0.15, h * (0.1 + 0.16 * i), m * (0.07 + rnd(i, 4) * 0.04), "#ffffff", 0.85);
  const colors = ["#ff5d73", "#ffb703", "#4cc9f0", "#57cc99", "#b388ff", "#ff8fab", "#ff7b00"];
  for (let i = 0; i < 16; i++) {
    const r = m * (0.04 + rnd(i, 5) * 0.025), speed = 0.05 + rnd(i, 6) * 0.05;
    const span = h + r * 6;
    const y = h + r * 2 - ((t * speed * h * 0.6 + rnd(i, 7) * span) % span);
    const x = (0.05 + 0.9 * rnd(i, 8)) * w + Math.sin(t * 0.7 + i) * m * 0.02;
    c.strokeStyle = "#ffffffaa"; c.lineWidth = Math.max(1, m * 0.002); c.beginPath(); c.moveTo(x, y + r * 1.15);
    c.quadraticCurveTo(x + Math.sin(t * 1.3 + i) * r * 0.6, y + r * 2.4, x - r * 0.1, y + r * 3.6); c.stroke();
    c.fillStyle = colors[i % colors.length];
    c.beginPath(); c.ellipse(x, y, r * 0.86, r, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x, y + r * 0.95); c.lineTo(x - r * 0.12, y + r * 1.15); c.lineTo(x + r * 0.12, y + r * 1.15); c.fill();
    c.fillStyle = "#ffffff70"; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.38, r * 0.16, r * 0.27, -0.5, 0, TAU); c.fill();
  }
  for (let i = 0; i < 70; i++) {
    const x = rnd(i, 9) * w + Math.sin(t + i) * m * 0.01, y = ((t * (0.04 + rnd(i, 10) * 0.05) * h + rnd(i, 11) * h) % h);
    c.save(); c.translate(x, y); c.rotate(t * (1 + rnd(i, 12) * 2) + i); c.fillStyle = colors[(i + 3) % colors.length];
    c.fillRect(-m * 0.006, -m * 0.003, m * 0.012, m * 0.006); c.restore();
  }
}

/* ---------------- Kids: Rainbow Meadow ---------------- */
function meadow(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#63c5ff"], [0.6, "#c9efff"], [1, "#e9fbff"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h), sx = w * 0.17, sy = h * 0.15, sr = m * 0.075;
  c.save(); c.translate(sx, sy); c.rotate(t * 0.15); c.fillStyle = "#ffe066";
  for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(sr * 1.15, -sr * 0.12); c.lineTo(sr * 1.75, 0); c.lineTo(sr * 1.15, sr * 0.12); c.fill(); }
  c.restore();
  c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
  const cx = w * 0.55, cy = h * 0.7, R = Math.max(w * 0.5, h * 0.36), band = R * 0.045;
  ["#ff595e", "#ff924c", "#ffca3a", "#8ac926", "#1982c4", "#4267ac", "#6a4c93"].forEach((color, i) => {
    c.strokeStyle = color; c.globalAlpha = 0.78; c.lineWidth = band; c.beginPath(); c.arc(cx, cy, R - i * band, Math.PI, TAU); c.stroke();
  });
  c.globalAlpha = 1;
  for (let i = 0; i < 4; i++) cloud(c, ((rnd(i, 13) * w + t * m * 0.015 * (1 + (i % 3) * 0.4)) % (w * 1.3)) - w * 0.15, h * (0.08 + 0.12 * i), m * (0.06 + rnd(i, 14) * 0.035), "#ffffff", 0.92);
  const hill = (base: number, amp: number, color: string, phase: number) => {
    c.fillStyle = color; c.beginPath(); c.moveTo(0, h);
    for (let i = 0; i <= 24; i++) c.lineTo(w * i / 24, h * base + Math.sin(i * 0.5 + phase) * h * amp);
    c.lineTo(w, h); c.fill();
  };
  hill(0.66, 0.03, "#84d97f", 0); hill(0.76, 0.025, "#4cb963", 2);
  const petals = ["#ff6fa5", "#ffffff", "#ffd23f", "#b388ff", "#ff8c42"];
  for (let i = 0; i < 22; i++) {
    const x = rnd(i, 15) * w, base = h * (0.8 + rnd(i, 16) * 0.16), stem = m * (0.04 + rnd(i, 17) * 0.03);
    const sway = Math.sin(t * 1.6 + i) * stem * 0.25, fx = x + sway, fy = base - stem, pr = m * 0.011;
    c.strokeStyle = "#2f8f46"; c.lineWidth = Math.max(1, m * 0.003); c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x, base - stem * 0.5, fx, fy); c.stroke();
    c.fillStyle = petals[i % petals.length];
    for (let p = 0; p < 5; p++) { const a = p * TAU / 5 + t * 0.2; c.beginPath(); c.arc(fx + Math.cos(a) * pr, fy + Math.sin(a) * pr, pr * 0.75, 0, TAU); c.fill(); }
    c.fillStyle = "#ffb703"; c.beginPath(); c.arc(fx, fy, pr * 0.6, 0, TAU); c.fill();
  }
  ["#ff70a6", "#70d6ff", "#ffd670"].forEach((color, i) => {
    const x = w * (0.5 + 0.32 * Math.sin(t * 0.35 + i * 2.1)), y = h * (0.45 + 0.12 * Math.sin(t * 0.7 + i * 1.3)), s = m * 0.022, flap = 0.25 + 0.75 * Math.abs(Math.sin(t * 7 + i));
    c.save(); c.translate(x, y); c.fillStyle = color;
    for (const side of [-1, 1]) { c.save(); c.scale(side * flap, 1); c.beginPath(); c.ellipse(s * 0.6, -s * 0.35, s * 0.6, s * 0.45, 0.4, 0, TAU); c.ellipse(s * 0.45, s * 0.35, s * 0.4, s * 0.32, -0.4, 0, TAU); c.fill(); c.restore(); }
    c.fillStyle = "#3d2c2e"; c.fillRect(-s * 0.06, -s * 0.6, s * 0.12, s * 1.2); c.restore();
  });
}

/* ---------------- Kids: Under the Sea ---------------- */
function undersea(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#48cae4"], [0.45, "#0077b6"], [1, "#03045e"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  c.save(); c.globalAlpha = 0.12; c.fillStyle = "#ffffff";
  for (let i = 0; i < 6; i++) { const x = w * (i / 5) + Math.sin(t * 0.3 + i) * w * 0.04; c.beginPath(); c.moveTo(x - w * 0.03, 0); c.lineTo(x + w * 0.03, 0); c.lineTo(x + w * 0.12, h * 0.85); c.lineTo(x - w * 0.02, h * 0.85); c.fill(); }
  c.restore();
  c.fillStyle = "#f4d58d"; c.beginPath(); c.moveTo(0, h);
  for (let i = 0; i <= 16; i++) c.lineTo(w * i / 16, h * (0.9 + Math.sin(i * 0.8) * 0.015)); c.lineTo(w, h); c.fill();
  for (let i = 0; i < 12; i++) {
    const x = rnd(i, 18) * w, len = h * (0.18 + rnd(i, 19) * 0.2), segs = 8;
    c.strokeStyle = i % 2 ? "#2d6a4f" : "#40916c"; c.lineWidth = m * 0.012; c.lineCap = "round"; c.beginPath(); c.moveTo(x, h * 0.92);
    for (let s = 1; s <= segs; s++) c.lineTo(x + Math.sin(t * 1.2 + s * 0.6 + i) * m * 0.012 * s / 2, h * 0.92 - len * s / segs);
    c.stroke();
  }
  const fishColors = [["#ff8c42", "#ffd166"], ["#ffd166", "#ff6b6b"], ["#ff6fa5", "#ffd6e8"], ["#06d6a0", "#e0fff6"], ["#b388ff", "#f1e6ff"]];
  for (let i = 0; i < 8; i++) {
    const dir = i % 2 ? 1 : -1, size = m * (0.03 + rnd(i, 20) * 0.025), span = w + size * 6;
    const x = dir > 0 ? ((t * w * (0.03 + rnd(i, 21) * 0.03) + rnd(i, 22) * span) % span) - size * 3 : w + size * 3 - ((t * w * (0.03 + rnd(i, 21) * 0.03) + rnd(i, 22) * span) % span);
    const y = h * (0.2 + rnd(i, 23) * 0.6) + Math.sin(t * 1.5 + i) * size * 0.6;
    const [body, fin] = fishColors[i % fishColors.length];
    c.save(); c.translate(x, y); c.scale(dir, 1);
    c.fillStyle = fin; c.beginPath(); c.moveTo(-size * 0.8, 0); c.lineTo(-size * 1.4, -size * 0.5 * (1 + 0.2 * Math.sin(t * 9 + i))); c.lineTo(-size * 1.4, size * 0.5); c.fill();
    c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, size, size * 0.6, 0, 0, TAU); c.fill();
    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(size * 0.5, -size * 0.12, size * 0.16, 0, TAU); c.fill();
    c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(size * 0.55, -size * 0.12, size * 0.08, 0, TAU); c.fill();
    c.restore();
  }
  c.strokeStyle = "#ffffffaa"; c.lineWidth = Math.max(1, m * 0.002);
  for (let i = 0; i < 45; i++) {
    const r = m * (0.004 + rnd(i, 24) * 0.01), y = h - ((t * h * (0.05 + rnd(i, 25) * 0.06) + rnd(i, 26) * h) % h);
    const x = rnd(i, 27) * w + Math.sin(t * 2 + i) * m * 0.008;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  }
}

/* ---------------- Kids: Starry Lullaby ---------------- */
function lullaby(c: Ctx, w: number, h: number, t: number) {
  const sky = vertical(c, h, [[0, "#141e5b"], [0.6, "#2b1055"], [1, "#4a2a7a"]]);
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  for (let i = 0; i < 140; i++) {
    c.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1 + rnd(i, 28) * 2) + i * 3));
    c.fillStyle = "#fff7d6"; const x = rnd(i, 29) * w, y = rnd(i, 30) * h * 0.85, r = m * (0.0015 + rnd(i, 31) * 0.003);
    if (i % 12 === 0) { star(c, x, y, r * 4, 5, 0.45, t * 0.2 + i); c.fill(); } else { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  }
  c.globalAlpha = 1;
  const mx = w * 0.7, my = h * 0.2, mr = m * 0.11;
  const halo = c.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 2.6);
  halo.addColorStop(0, "#fff4c244"); halo.addColorStop(1, "#fff4c200"); c.fillStyle = halo; c.beginPath(); c.arc(mx, my, mr * 2.6, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.clip();
  c.fillStyle = "#fff1b8"; c.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
  c.fillStyle = sky; c.beginPath(); c.arc(mx + mr * 0.42, my - mr * 0.18, mr * 0.88, 0, TAU); c.fill();
  c.restore();
  const cycle = 7, phase = (t % cycle) / cycle, n = Math.floor(t / cycle);
  if (phase < 0.18) {
    const p = phase / 0.18, x0 = w * (0.1 + rnd(n, 32) * 0.4), y0 = h * (0.05 + rnd(n, 33) * 0.2), dx = w * 0.35, dy = h * 0.12;
    const g = c.createLinearGradient(x0 + dx * (p - 0.25), y0 + dy * (p - 0.25), x0 + dx * p, y0 + dy * p);
    g.addColorStop(0, "#ffffff00"); g.addColorStop(1, "#ffffff"); c.strokeStyle = g; c.lineWidth = Math.max(1.5, m * 0.004);
    c.beginPath(); c.moveTo(x0 + dx * Math.max(0, p - 0.25), y0 + dy * Math.max(0, p - 0.25)); c.lineTo(x0 + dx * p, y0 + dy * p); c.stroke();
  }
  for (let i = 0; i < 5; i++) cloud(c, ((rnd(i, 34) * w + t * m * 0.008 * (1 + i % 2)) % (w * 1.3)) - w * 0.15, h * (0.55 + 0.08 * i), m * (0.08 + rnd(i, 35) * 0.04), "#b9a6e8", 0.22 + 0.08 * (i % 2));
}

/* ---------------- USA: Stars & Stripes (waving flag) ---------------- */
function drawFlatFlag(c: Ctx, fw: number, fh: number) {
  for (let s = 0; s < 13; s++) { c.fillStyle = s % 2 ? "#ffffff" : "#b22234"; c.fillRect(0, s * fh / 13, fw, fh / 13 + 1); }
  const cw = fh * 0.76, ch = fh * 7 / 13; c.fillStyle = "#3c3b6e"; c.fillRect(0, 0, cw, ch);
  c.fillStyle = "#ffffff";
  for (let row = 0; row < 9; row++) for (let col = 0; col < 11; col++) {
    if ((row + col) % 2) continue;
    star(c, fh * 0.063 * (col + 1), fh * 0.054 * (row + 1), fh * 0.0616 / 2, 5, 0.382); c.fill();
  }
}
function flag(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#0d1b3e"], [0.5, "#1d3557"], [1, "#457b9d"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  for (let i = 0; i < 40; i++) {
    c.globalAlpha = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.8 + i)); c.fillStyle = "#ffffff";
    c.beginPath(); c.arc(rnd(i, 36) * w, (rnd(i, 37) * h + t * m * 0.01) % h, m * (0.004 + rnd(i, 38) * 0.012), 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  const fw = Math.min(w * 0.82, h * 0.42 * 1.9), fh = fw / 1.9, px = (w - fw) / 2 + fw * 0.03, py = h * 0.22;
  const cloth = cached(`flag:${Math.round(fw)}x${Math.round(fh)}`, Math.ceil(fw), Math.ceil(fh), c2 => drawFlatFlag(c2, fw, fh));
  const slices = Math.max(48, Math.min(160, Math.round(fw / 3))), amp = fh * 0.07;
  c.fillStyle = "#c9ced6"; c.fillRect(px - fw * 0.025, py - fh * 0.08, fw * 0.018, h * 0.9 - py);
  c.fillStyle = "#e9c46a"; c.beginPath(); c.arc(px - fw * 0.016, py - fh * 0.09, fw * 0.018, 0, TAU); c.fill();
  for (let s = 0; s < slices; s++) {
    const u = s / slices, x = fw * u, sw = fw / slices + 1;
    const wave = Math.sin(u * TAU * 1.3 - t * 2.4), dy = wave * amp * u, light = Math.cos(u * TAU * 1.3 - t * 2.4) * u;
    if (cloth) c.drawImage(cloth, x, 0, sw, fh, px + x, py + dy, sw, fh);
    else { c.save(); c.translate(px, py + dy); c.beginPath(); c.rect(x, 0, sw, fh); c.clip(); drawFlatFlag(c, fw, fh); c.restore(); }
    c.fillStyle = light > 0 ? `rgba(255,255,255,${light * 0.12})` : `rgba(0,0,0,${-light * 0.22})`;
    c.fillRect(px + x, py + dy, sw + 0.5, fh);
  }
}

/* ---------------- USA: Liberty Torch ---------------- */
function liberty(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#1b1446"], [0.45, "#7a2e6b"], [0.75, "#f2715a"], [1, "#ffb46b"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  for (let i = 0; i < 50; i++) { c.globalAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.5 + i * 2)); c.fillStyle = "#fff3d6"; c.beginPath(); c.arc(rnd(i, 39) * w, rnd(i, 40) * h * 0.4, m * 0.002, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
  // Fireworks in red, white and blue on a repeating schedule.
  const fireColors = ["#ff4d6d", "#ffffff", "#4dabf7"];
  for (let k = 0; k < 3; k++) {
    const cycle = 4.5, local = (t + k * 1.5) % cycle, n = Math.floor((t + k * 1.5) / cycle);
    if (local > 1.6) continue;
    const p = local / 1.6, fx = w * (0.15 + rnd(n * 3 + k, 41) * 0.7), fy = h * (0.12 + rnd(n * 3 + k, 42) * 0.2), reach = m * 0.13 * (1 - Math.pow(1 - p, 3));
    c.globalAlpha = 1 - p; c.fillStyle = fireColors[(n + k) % 3];
    for (let i = 0; i < 28; i++) { const a = i * TAU / 28; c.beginPath(); c.arc(fx + Math.cos(a) * reach, fy + Math.sin(a) * reach + p * p * m * 0.03, m * 0.004, 0, TAU); c.fill(); }
  }
  c.globalAlpha = 1;
  const water = h * 0.86;
  c.fillStyle = "#2a2350"; c.fillRect(0, water, w, h - water);
  c.strokeStyle = "#ffc48a66"; c.lineWidth = Math.max(1, m * 0.003);
  for (let i = 0; i < 18; i++) { const y = water + (h - water) * rnd(i, 43), x = ((rnd(i, 44) * w + Math.sin(t + i) * m * 0.03) % w), len = m * (0.03 + rnd(i, 45) * 0.06); c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke(); }
  // Statue (normalized: unit = statue height; x centered).
  const S = Math.min(h * 0.7, w * 1.1), ox = w * 0.5, oy = water - S * 1.0;
  const P = (x: number, y: number): [number, number] => [ox + x * S, oy + y * S];
  const poly = (points: [number, number][]) => { c.beginPath(); points.forEach(([x, y], i) => { const [X, Y] = P(x, y); if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.closePath(); c.fill(); };
  c.fillStyle = "#14303a";
  poly([[-0.2, 0.74], [0.2, 0.74], [0.2, 0.78], [0.16, 0.78], [0.16, 1.0], [-0.16, 1.0], [-0.16, 0.78], [-0.2, 0.78]]);
  poly([[-0.13, 0.74], [-0.1, 0.5], [-0.105, 0.36], [-0.09, 0.3], [-0.04, 0.275], [0.04, 0.275], [0.095, 0.3], [0.11, 0.36], [0.1, 0.5], [0.13, 0.74]]);
  poly([[-0.095, 0.33], [-0.055, 0.3], [-0.098, 0.07], [-0.138, 0.075]]);
  poly([[0.06, 0.34], [0.145, 0.32], [0.16, 0.47], [0.075, 0.5]]);
  poly([[-0.03, 0.29], [0.03, 0.29], [0.026, 0.255], [-0.026, 0.255]]);
  const [hx, hy] = P(0, 0.235); c.beginPath(); c.arc(hx, hy, S * 0.04, 0, TAU); c.fill();
  c.lineWidth = S * 0.011; c.strokeStyle = "#14303a"; c.lineCap = "round";
  for (let i = 0; i < 7; i++) { const a = Math.PI + 0.35 + i * (Math.PI - 0.7) / 6; c.beginPath(); c.moveTo(hx + Math.cos(a) * S * 0.038, hy + Math.sin(a) * S * 0.038); c.lineTo(hx + Math.cos(a) * S * 0.09, hy + Math.sin(a) * S * 0.09); c.stroke(); }
  poly([[-0.135, 0.075], [-0.1, 0.075], [-0.105, 0.035], [-0.13, 0.035]]);
  poly([[-0.145, 0.035], [-0.09, 0.035], [-0.1, 0.02], [-0.135, 0.02]]);
  c.strokeStyle = "#f2a65a88"; c.lineWidth = Math.max(1, S * 0.005); c.beginPath(); c.moveTo(...P(0.13, 0.74)); c.lineTo(...P(0.1, 0.5)); c.lineTo(...P(0.11, 0.36)); c.lineTo(...P(0.095, 0.3)); c.stroke();
  c.beginPath(); c.moveTo(...P(0.2, 0.74)); c.lineTo(...P(0.2, 0.78)); c.moveTo(...P(0.16, 0.78)); c.lineTo(...P(0.16, 1)); c.stroke();
  const [fx, fy] = P(-0.117, 0.01), flick = 1 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 7.3);
  const glow = c.createRadialGradient(fx, fy, 0, fx, fy, S * 0.16 * flick); glow.addColorStop(0, "#ffd16699"); glow.addColorStop(1, "#ffd16600");
  c.fillStyle = glow; c.beginPath(); c.arc(fx, fy, S * 0.16 * flick, 0, TAU); c.fill();
  const flame = c.createLinearGradient(fx, fy - S * 0.07 * flick, fx, fy); flame.addColorStop(0, "#fff3b0"); flame.addColorStop(0.5, "#ffb703"); flame.addColorStop(1, "#fb8500");
  c.fillStyle = flame; c.beginPath(); c.moveTo(fx - S * 0.022, fy);
  c.quadraticCurveTo(fx - S * 0.03, fy - S * 0.035, fx + Math.sin(t * 5) * S * 0.006, fy - S * 0.075 * flick);
  c.quadraticCurveTo(fx + S * 0.03, fy - S * 0.035, fx + S * 0.022, fy); c.closePath(); c.fill();
}

/* ---------------- New York City at night ---------------- */
type Building = { x: number; w: number; h: number; kind: "plain" | "spire" | "crown" };
function skyline(w: number, h: number, layer: number): Building[] {
  const list: Building[] = [];
  let x = -w * 0.02, i = layer * 100, spire = false, crown = false;
  while (x < w * 1.02) {
    const bw = w * (0.035 + rnd(i, 46) * 0.05) * (layer ? 1 : 0.8), tall = rnd(i, 47);
    let kind: Building["kind"] = "plain";
    if (layer === 1 && !spire && x + bw > w * 0.4) { kind = "spire"; spire = true; }
    else if (layer === 1 && !crown && x > w * 0.64) { kind = "crown"; crown = true; }
    const bh = h * (kind === "spire" ? 0.5 : kind === "crown" ? 0.42 : (layer ? 0.14 : 0.2) + tall * (layer ? 0.24 : 0.26));
    list.push({ x, w: bw, h: bh, kind }); x += bw * (0.92 + rnd(i, 48) * 0.2); i++;
  }
  return list;
}
function drawSkyline(c: Ctx, w: number, h: number, ground: number) {
  for (const layer of [0, 1]) {
    c.fillStyle = layer ? "#0a0e1f" : "#1b2547";
    for (const b of skyline(w, h, layer)) {
      const top = ground - b.h;
      if (b.kind === "spire") {
        const steps = [[1, 0.62], [0.78, 0.18], [0.56, 0.1], [0.36, 0.07]]; let y = ground;
        for (const [scale, part] of steps) { const sw = b.w * scale, sh = b.h * part; c.fillRect(b.x + (b.w - sw) / 2, y - sh, sw, sh); y -= sh; }
        c.fillRect(b.x + b.w * 0.47, y - b.h * 0.12, b.w * 0.06, b.h * 0.12);
      } else if (b.kind === "crown") {
        c.fillRect(b.x, top + b.h * 0.1, b.w, b.h * 0.9);
        let y = top + b.h * 0.1;
        for (let k = 0; k < 4; k++) { const r = b.w / 2 * (0.9 - k * 0.2); c.beginPath(); c.arc(b.x + b.w / 2, y, r, Math.PI, TAU); c.fill(); y -= r * 0.55; }
        c.beginPath(); c.moveTo(b.x + b.w * 0.46, y); c.lineTo(b.x + b.w * 0.5, y - b.h * 0.16); c.lineTo(b.x + b.w * 0.54, y); c.fill();
      } else c.fillRect(b.x, top, b.w, b.h);
    }
    if (!layer) continue;
    for (const [n, b] of skyline(w, h, 1).entries()) {
      const cols = Math.max(2, Math.floor(b.w / Math.max(4, w * 0.008))), rows = Math.floor(b.h * (b.kind === "plain" ? 0.95 : 0.6) / Math.max(5, h * 0.012));
      const cw = b.w / cols;
      for (let r = 1; r < rows; r++) for (let q = 0; q < cols; q++) {
        if (rnd(n * 997 + r * 31 + q, 49) > 0.42) continue;
        c.fillStyle = rnd(n + r + q, 50) > 0.8 ? "#9ad1ff" : "#ffd27a";
        c.globalAlpha = 0.55 + rnd(r * q + n, 51) * 0.45;
        c.fillRect(b.x + q * cw + cw * 0.3, ground - r * Math.max(5, h * 0.012), cw * 0.4, Math.max(2, h * 0.006));
      }
      c.globalAlpha = 1;
    }
  }
}
function nycnight(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#070b1f"], [0.5, "#16224a"], [0.78, "#3b2b63"], [1, "#0a0e1f"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h), ground = h * 0.8;
  for (let i = 0; i < 70; i++) { c.globalAlpha = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 1.7)); c.fillStyle = "#e8eeff"; c.beginPath(); c.arc(rnd(i, 52) * w, rnd(i, 53) * h * 0.38, m * 0.0018, 0, TAU); c.fill(); }
  c.globalAlpha = 1; c.fillStyle = "#f4f1de"; c.beginPath(); c.arc(w * 0.82, h * 0.13, m * 0.045, 0, TAU); c.fill();
  const glow = c.createRadialGradient(w * 0.5, ground, 0, w * 0.5, ground, Math.max(w, h) * 0.6); glow.addColorStop(0, "#ff9e6d33"); glow.addColorStop(1, "#ff9e6d00");
  c.fillStyle = glow; c.fillRect(0, 0, w, h);
  const city = cached(`nyc:${Math.round(w)}x${Math.round(h)}`, Math.ceil(w), Math.ceil(h), c2 => drawSkyline(c2, w, h, ground));
  if (city) c.drawImage(city, 0, 0); else drawSkyline(c, w, h, ground);
  // A few windows switch on and off; the spire beacon blinks.
  for (const [n, b] of skyline(w, h, 1).entries()) {
    if (n % 3) continue;
    const on = Math.sin(t * 0.6 + n * 2.3) > 0.3;
    c.fillStyle = on ? "#fff1b0" : "#0a0e1f"; c.fillRect(b.x + b.w * 0.35, ground - b.h * (0.3 + rnd(n, 54) * 0.4), b.w * 0.3, Math.max(2, h * 0.007));
    if (b.kind === "spire") { const beacon = 0.5 + 0.5 * Math.sin(t * 3); c.fillStyle = `rgba(255,70,70,${0.3 + 0.7 * beacon})`; c.beginPath(); c.arc(b.x + b.w * 0.5, ground - b.h * 1.07 - b.h * 0.12, m * 0.006, 0, TAU); c.fill(); }
  }
  c.fillStyle = "#05070f"; c.fillRect(0, ground, w, h - ground);
  // Suspension bridge with moving car lights; city lights shimmer on the water.
  const deck = ground + (h - ground) * 0.28;
  c.strokeStyle = "#5c6b9a"; c.lineWidth = Math.max(1, m * 0.004); c.beginPath(); c.moveTo(0, deck); c.lineTo(w, deck); c.stroke();
  for (const tx of [0.28, 0.72]) { c.fillStyle = "#2a3358"; c.fillRect(w * tx - m * 0.012, deck - h * 0.12, m * 0.024, h * 0.12); }
  c.lineWidth = Math.max(1, m * 0.0025); c.beginPath(); c.moveTo(0, deck - h * 0.05); c.quadraticCurveTo(w * 0.14, deck - h * 0.02, w * 0.28, deck - h * 0.12); c.quadraticCurveTo(w * 0.5, deck + h * 0.02, w * 0.72, deck - h * 0.12); c.quadraticCurveTo(w * 0.86, deck - h * 0.02, w, deck - h * 0.05); c.stroke();
  for (let i = 0; i < 14; i++) { const dir = i % 2 ? 1 : -1, x = (rnd(i, 55) * w + dir * t * w * 0.05 + w * 10) % w; c.fillStyle = dir > 0 ? "#fff3c4" : "#ff5d5d"; c.beginPath(); c.arc(x, deck - m * 0.004, m * 0.0035, 0, TAU); c.fill(); }
  for (let i = 0; i < 40; i++) { const x = rnd(i, 56) * w, y = deck + (h - deck) * (0.15 + rnd(i, 57) * 0.8), len = m * (0.01 + rnd(i, 58) * 0.04) * (0.6 + 0.4 * Math.sin(t * 2 + i)); c.fillStyle = rnd(i, 59) > 0.7 ? "#9ad1ff55" : "#ffd27a55"; c.fillRect(x, y, len, Math.max(1, m * 0.002)); }
}

/* ---------------- Kids: favourite animals (original drawings, made in code) ---------------- */
function eye(c: Ctx, x: number, y: number, r: number, blink: number) {
  c.fillStyle = "#2b2118"; c.beginPath(); c.ellipse(x, y, r, r * Math.max(0.12, blink), 0, 0, TAU); c.fill();
  if (blink > 0.5) { c.fillStyle = "#ffffff"; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, TAU); c.fill(); }
}
/** Eyes open most of the time, with a quick blink every few seconds. */
const blinkAt = (t: number, seed: number) => ((t + seed) % 3.7) < 0.14 ? 0.1 : 1;
function cheeks(c: Ctx, x: number, y: number, gap: number, r: number) {
  c.fillStyle = "#ff8fab66"; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * gap, y, r, r * 0.65, 0, 0, TAU); c.fill(); }
}
function smile(c: Ctx, x: number, y: number, r: number, color = "#2b2118") {
  c.strokeStyle = color; c.lineWidth = Math.max(1, r * 0.22); c.lineCap = "round";
  c.beginPath(); c.arc(x - r * 0.55, y, r * 0.55, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  c.beginPath(); c.arc(x + r * 0.55, y, r * 0.55, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
}
function grassHills(c: Ctx, w: number, h: number, colors: [string, string]) {
  const hill = (base: number, amp: number, color: string, phase: number) => {
    c.fillStyle = color; c.beginPath(); c.moveTo(0, h);
    for (let i = 0; i <= 24; i++) c.lineTo(w * i / 24, h * base + Math.sin(i * 0.5 + phase) * h * amp);
    c.lineTo(w, h); c.fill();
  };
  hill(0.68, 0.03, colors[0], 0.7); hill(0.8, 0.02, colors[1], 2.4);
}
function sun(c: Ctx, x: number, y: number, r: number, t: number) {
  c.save(); c.translate(x, y); c.rotate(t * 0.12); c.fillStyle = "#ffe066";
  for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(r * 1.15, -r * 0.12); c.lineTo(r * 1.7, 0); c.lineTo(r * 1.15, r * 0.12); c.fill(); }
  c.restore(); c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

/* Jungle Friends: a lion, an elephant and a swinging monkey. */
function jungle(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#ffd29d"], [0.5, "#bde7b0"], [1, "#6cc070"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  sun(c, w * 0.82, h * 0.14, m * 0.07, t);
  for (let i = 0; i < 3; i++) cloud(c, ((rnd(i, 41) * w + t * m * 0.012 * (1 + i * 0.4)) % (w * 1.3)) - w * 0.15, h * (0.08 + 0.1 * i), m * 0.05, "#ffffff", 0.8);
  // Jungle trees: trunks and round leafy crowns.
  for (let i = 0; i < 7; i++) {
    const x = w * (i / 6), top = h * (0.28 + rnd(i, 42) * 0.12), r = m * (0.12 + rnd(i, 43) * 0.06);
    c.fillStyle = "#8b5a2b"; c.fillRect(x - m * 0.02, top, m * 0.04, h - top);
    c.fillStyle = i % 2 ? "#2d9a4b" : "#3fb35d";
    for (const [dx, dy, s] of [[0, 0, 1], [-0.6, 0.3, 0.75], [0.6, 0.3, 0.75], [0, -0.45, 0.7]]) { c.beginPath(); c.arc(x + dx * r, top + dy * r, r * s * 0.7, 0, TAU); c.fill(); }
  }
  grassHills(c, w, h, ["#57b65a", "#3a9a46"]);
  // Monkey swinging on a vine from the top.
  const vx = w * 0.5, swing = Math.sin(t * 1.6) * 0.35, len = h * 0.34, mx = vx + Math.sin(swing) * len, my = Math.cos(swing) * len;
  c.strokeStyle = "#2f7d32"; c.lineWidth = Math.max(2, m * 0.008); c.beginPath(); c.moveTo(vx, 0); c.lineTo(mx, my); c.stroke();
  const mr = m * 0.055;
  c.fillStyle = "#8d5524"; c.beginPath(); c.ellipse(mx, my + mr * 1.5, mr * 0.75, mr, 0, 0, TAU); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.arc(mx + s * mr * 0.95, my + mr * 0.1, mr * 0.38, 0, TAU); c.fill(); }
  c.beginPath(); c.arc(mx, my + mr * 0.2, mr, 0, TAU); c.fill();
  c.fillStyle = "#f1c27d"; c.beginPath(); c.ellipse(mx, my + mr * 0.42, mr * 0.68, mr * 0.55, 0, 0, TAU); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.arc(mx + s * mr * 0.95, my + mr * 0.1, mr * 0.2, 0, TAU); c.fill(); }
  for (const s of [-1, 1]) eye(c, mx + s * mr * 0.3, my + mr * 0.05, mr * 0.13, blinkAt(t, 1));
  smile(c, mx, my + mr * 0.55, mr * 0.22);
  // Lion, bouncing gently, bottom left.
  const lx = w * 0.24, ly = h * 0.74 - Math.abs(Math.sin(t * 2.2)) * m * 0.02, lr = m * 0.085;
  c.fillStyle = "#e0861d";
  for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + Math.sin(t * 1.5) * 0.05; c.beginPath(); c.arc(lx + Math.cos(a) * lr * 1.05, ly + Math.sin(a) * lr * 1.05, lr * 0.42, 0, TAU); c.fill(); }
  c.fillStyle = "#f6c35b"; c.beginPath(); c.arc(lx, ly, lr, 0, TAU); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.arc(lx + s * lr * 0.72, ly - lr * 0.72, lr * 0.25, 0, TAU); c.fill(); }
  for (const s of [-1, 1]) eye(c, lx + s * lr * 0.35, ly - lr * 0.15, lr * 0.11, blinkAt(t, 0));
  c.fillStyle = "#7a4a1d"; c.beginPath(); c.moveTo(lx - lr * 0.14, ly + lr * 0.12); c.lineTo(lx + lr * 0.14, ly + lr * 0.12); c.lineTo(lx, ly + lr * 0.28); c.fill();
  smile(c, lx, ly + lr * 0.32, lr * 0.16, "#7a4a1d"); cheeks(c, lx, ly + lr * 0.25, lr * 0.55, lr * 0.14);
  // Elephant, trunk swaying, bottom right.
  const ex = w * 0.76, ey = h * 0.74, er = m * 0.09;
  c.fillStyle = "#9aa7b5"; c.beginPath(); c.ellipse(ex + er * 0.4, ey + er * 0.55, er * 1.2, er * 0.75, 0, 0, TAU); c.fill();
  c.fillStyle = "#b5c0cc"; c.beginPath(); c.ellipse(ex - er * 0.7, ey - er * 0.05, er * 0.65, er * 0.8, -0.2 + Math.sin(t * 1.2) * 0.08, 0, TAU); c.fill();
  c.fillStyle = "#9aa7b5"; c.beginPath(); c.arc(ex - er * 0.25, ey - er * 0.05, er * 0.72, 0, TAU); c.fill();
  c.strokeStyle = "#9aa7b5"; c.lineWidth = er * 0.32; c.lineCap = "round"; const sway = Math.sin(t * 1.4) * er * 0.35;
  c.beginPath(); c.moveTo(ex - er * 0.65, ey + er * 0.2); c.quadraticCurveTo(ex - er * 1.2, ey + er * 0.7, ex - er * 1.1 + sway, ey + er * 1.05); c.stroke();
  eye(c, ex - er * 0.48, ey - er * 0.2, er * 0.09, blinkAt(t, 2)); cheeks(c, ex - er * 0.25, ey + er * 0.15, er * 0.3, er * 0.1);
  // Leaves drifting down.
  for (let i = 0; i < 14; i++) {
    const x = rnd(i, 44) * w + Math.sin(t + i) * m * 0.03, y = (t * (0.03 + rnd(i, 45) * 0.04) * h + rnd(i, 46) * h) % h;
    c.save(); c.translate(x, y); c.rotate(t + i); c.fillStyle = i % 2 ? "#7ccf5a" : "#4caf50"; c.beginPath(); c.ellipse(0, 0, m * 0.014, m * 0.007, 0, 0, TAU); c.fill(); c.restore();
  }
}

/* Farm Friends: a red barn, a cow, a pig and a hopping chick. */
function farm(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#6ec6ff"], [0.6, "#cdeeff"], [1, "#e8fbe8"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  sun(c, w * 0.14, h * 0.14, m * 0.065, t);
  for (let i = 0; i < 4; i++) cloud(c, ((rnd(i, 51) * w + t * m * 0.014 * (1 + i * 0.3)) % (w * 1.3)) - w * 0.15, h * (0.07 + 0.09 * i), m * (0.05 + rnd(i, 52) * 0.03), "#ffffff", 0.9);
  grassHills(c, w, h, ["#8bd46e", "#5cb85c"]);
  // Barn.
  const bx = w * 0.72, by = h * 0.42, bw = m * 0.34, bh = m * 0.26;
  c.fillStyle = "#d62828"; c.fillRect(bx - bw / 2, by, bw, bh);
  c.fillStyle = "#9d0208"; c.beginPath(); c.moveTo(bx - bw * 0.6, by + 2); c.lineTo(bx, by - bh * 0.55); c.lineTo(bx + bw * 0.6, by + 2); c.fill();
  c.fillStyle = "#ffffff"; c.fillRect(bx - bw * 0.16, by + bh * 0.38, bw * 0.32, bh * 0.62);
  c.strokeStyle = "#d62828"; c.lineWidth = Math.max(2, m * 0.006);
  c.beginPath(); c.moveTo(bx - bw * 0.16, by + bh * 0.38); c.lineTo(bx + bw * 0.16, by + bh); c.moveTo(bx + bw * 0.16, by + bh * 0.38); c.lineTo(bx - bw * 0.16, by + bh); c.stroke();
  c.fillStyle = "#ffffff"; c.beginPath(); c.arc(bx, by - bh * 0.12, bh * 0.1, 0, TAU); c.fill();
  // Fence.
  c.fillStyle = "#f3e9dc"; const fy = h * 0.8;
  for (let x = 0; x < w; x += m * 0.06) c.fillRect(x, fy - m * 0.06, m * 0.014, m * 0.08);
  c.fillRect(0, fy - m * 0.045, w, m * 0.012); c.fillRect(0, fy - m * 0.015, w, m * 0.012);
  // Cow walking slowly back and forth.
  const cx = w * (0.32 + 0.06 * Math.sin(t * 0.4)), cy = h * 0.68, cr = m * 0.075, dir = Math.cos(t * 0.4) >= 0 ? 1 : -1;
  c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(cx, cy, cr * 1.3, cr * 0.8, 0, 0, TAU); c.fill();
  c.fillStyle = "#2b2118"; for (const [dx, dy, s] of [[-0.5, -0.2, 0.3], [0.4, 0.15, 0.35], [0.05, -0.4, 0.2]]) { c.beginPath(); c.ellipse(cx + dx * cr, cy + dy * cr, cr * s, cr * s * 0.7, 0.4, 0, TAU); c.fill(); }
  c.fillStyle = "#ffffff"; for (const s of [-0.8, -0.3, 0.3, 0.8]) c.fillRect(cx + s * cr - cr * 0.08, cy + cr * 0.5, cr * 0.16, cr * 0.55);
  const hx = cx + dir * cr * 1.35, hy = cy - cr * 0.35;
  c.beginPath(); c.ellipse(hx, hy, cr * 0.55, cr * 0.6, 0, 0, TAU); c.fill();
  c.fillStyle = "#ffb3c6"; c.beginPath(); c.ellipse(hx, hy + cr * 0.32, cr * 0.42, cr * 0.26, 0, 0, TAU); c.fill();
  c.fillStyle = "#f4d35e"; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(hx + s * cr * 0.38, hy - cr * 0.55, cr * 0.1, cr * 0.2, s * 0.5, 0, TAU); c.fill(); }
  for (const s of [-1, 1]) eye(c, hx + s * cr * 0.2, hy - cr * 0.1, cr * 0.08, blinkAt(t, 3));
  // Pig bouncing.
  const px = w * 0.12, py = h * 0.75 - Math.abs(Math.sin(t * 2.6)) * m * 0.025, pr = m * 0.06;
  c.fillStyle = "#ffafcc"; c.beginPath(); c.ellipse(px, py + pr * 0.4, pr * 1.1, pr * 0.8, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(px + pr * 0.9, py - pr * 0.1, pr * 0.62, 0, TAU); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(px + pr * (0.9 + s * 0.35), py - pr * 0.55); c.lineTo(px + pr * (0.9 + s * 0.5), py - pr * 0.95); c.lineTo(px + pr * (0.9 + s * 0.12), py - pr * 0.7); c.fill(); }
  c.fillStyle = "#ff85a1"; c.beginPath(); c.ellipse(px + pr * 1.1, py + pr * 0.05, pr * 0.28, pr * 0.2, 0, 0, TAU); c.fill();
  c.fillStyle = "#c9184a"; for (const s of [-1, 1]) { c.beginPath(); c.arc(px + pr * 1.1 + s * pr * 0.09, py + pr * 0.05, pr * 0.05, 0, TAU); c.fill(); }
  for (const s of [-1, 1]) eye(c, px + pr * (0.9 + s * 0.22), py - pr * 0.25, pr * 0.09, blinkAt(t, 4));
  // Chick hopping across the grass.
  const kx = (w * 0.2 + t * m * 0.08) % (w * 1.1) - w * 0.05, ky = h * 0.9 - Math.abs(Math.sin(t * 4)) * m * 0.03, kr = m * 0.03;
  c.fillStyle = "#ffd60a"; c.beginPath(); c.arc(kx, ky, kr, 0, TAU); c.fill(); c.beginPath(); c.arc(kx + kr * 0.7, ky - kr * 0.8, kr * 0.65, 0, TAU); c.fill();
  c.fillStyle = "#fb8500"; c.beginPath(); c.moveTo(kx + kr * 1.3, ky - kr * 0.85); c.lineTo(kx + kr * 1.65, ky - kr * 0.7); c.lineTo(kx + kr * 1.3, ky - kr * 0.55); c.fill();
  eye(c, kx + kr * 0.85, ky - kr * 0.95, kr * 0.13, blinkAt(t, 5));
}

/* Puppy & Kitty: best friends in a pastel park with floating hearts and a bouncing ball. */
function pets(c: Ctx, w: number, h: number, t: number) {
  c.fillStyle = vertical(c, h, [[0, "#ffd6e8"], [0.55, "#e2f0ff"], [1, "#d8f8d1"]]); c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  for (let i = 0; i < 3; i++) cloud(c, ((rnd(i, 61) * w + t * m * 0.012 * (1 + i * 0.5)) % (w * 1.3)) - w * 0.15, h * (0.08 + 0.1 * i), m * 0.055, "#ffffff", 0.9);
  grassHills(c, w, h, ["#a7e3a0", "#7fcf86"]);
  // Floating hearts.
  for (let i = 0; i < 12; i++) {
    const s = m * (0.016 + rnd(i, 62) * 0.014), span = h * 0.9, y = h * 0.85 - ((t * (0.05 + rnd(i, 63) * 0.04) * h + rnd(i, 64) * span) % span);
    const x = rnd(i, 65) * w + Math.sin(t * 1.2 + i) * m * 0.02;
    c.fillStyle = ["#ff5d8f", "#ff97b7", "#c77dff", "#ffafcc"][i % 4]; c.globalAlpha = 0.8;
    c.beginPath(); c.moveTo(x, y + s * 0.9); c.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.3, x, y - s * 0.45);
    c.bezierCurveTo(x + s * 0.6, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); c.fill(); c.globalAlpha = 1;
  }
  // Puppy with a wagging tail.
  const dx = w * 0.32, dy = h * 0.7, dr = m * 0.085;
  c.fillStyle = "#d4a373"; c.beginPath(); c.ellipse(dx, dy + dr * 0.75, dr * 0.95, dr * 0.65, 0, 0, TAU); c.fill();
  c.save(); c.translate(dx - dr * 0.85, dy + dr * 0.55); c.rotate(-0.8 + Math.sin(t * 9) * 0.45); c.fillRect(-dr * 0.08, -dr * 0.6, dr * 0.16, dr * 0.6); c.restore();
  c.beginPath(); c.arc(dx, dy, dr * 0.75, 0, TAU); c.fill();
  c.fillStyle = "#8b5e34"; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(dx + s * dr * 0.7, dy + dr * 0.05, dr * 0.22, dr * 0.48, s * 0.25 + Math.sin(t * 2 + s) * 0.06, 0, TAU); c.fill(); }
  c.fillStyle = "#f5e6cc"; c.beginPath(); c.ellipse(dx, dy + dr * 0.3, dr * 0.38, dr * 0.3, 0, 0, TAU); c.fill();
  c.fillStyle = "#2b2118"; c.beginPath(); c.ellipse(dx, dy + dr * 0.15, dr * 0.13, dr * 0.09, 0, 0, TAU); c.fill();
  for (const s of [-1, 1]) eye(c, dx + s * dr * 0.3, dy - dr * 0.12, dr * 0.1, blinkAt(t, 6));
  c.fillStyle = "#ff6b8a"; c.beginPath(); c.ellipse(dx, dy + dr * 0.48, dr * 0.1, dr * 0.13 + Math.abs(Math.sin(t * 3)) * dr * 0.04, 0, 0, TAU); c.fill();
  // Kitty with a curling tail.
  const kx = w * 0.66, ky = h * 0.7, kr = m * 0.075;
  c.fillStyle = "#f4a261"; c.beginPath(); c.ellipse(kx, ky + kr * 0.8, kr * 0.85, kr * 0.62, 0, 0, TAU); c.fill();
  c.strokeStyle = "#f4a261"; c.lineWidth = kr * 0.2; c.lineCap = "round"; c.beginPath(); c.moveTo(kx + kr * 0.75, ky + kr * 0.9);
  c.quadraticCurveTo(kx + kr * 1.5, ky + kr * 0.6, kx + kr * 1.25 + Math.sin(t * 2.4) * kr * 0.25, ky - kr * 0.05); c.stroke();
  c.beginPath(); c.arc(kx, ky, kr * 0.72, 0, TAU); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(kx + s * kr * 0.62, ky - kr * 0.2); c.lineTo(kx + s * kr * 0.55, ky - kr * 0.95); c.lineTo(kx + s * kr * 0.12, ky - kr * 0.6); c.fill(); }
  c.fillStyle = "#ffcad4"; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(kx + s * kr * 0.5, ky - kr * 0.35); c.lineTo(kx + s * kr * 0.5, ky - kr * 0.75); c.lineTo(kx + s * kr * 0.25, ky - kr * 0.55); c.fill(); }
  for (const s of [-1, 1]) eye(c, kx + s * kr * 0.28, ky - kr * 0.08, kr * 0.11, blinkAt(t, 7));
  c.fillStyle = "#ff6b8a"; c.beginPath(); c.moveTo(kx - kr * 0.08, ky + kr * 0.12); c.lineTo(kx + kr * 0.08, ky + kr * 0.12); c.lineTo(kx, ky + kr * 0.22); c.fill();
  c.strokeStyle = "#2b2118"; c.lineWidth = Math.max(1, kr * 0.03);
  for (const s of [-1, 1]) for (const a of [-0.12, 0.08]) { c.beginPath(); c.moveTo(kx + s * kr * 0.18, ky + kr * 0.22); c.lineTo(kx + s * kr * 0.75, ky + kr * (0.22 + a)); c.stroke(); }
  cheeks(c, kx, ky + kr * 0.25, kr * 0.42, kr * 0.12);
  // Ball bouncing between them.
  const bx = w * 0.49, by = h * 0.88 - Math.abs(Math.sin(t * 2.8)) * h * 0.14, br = m * 0.03;
  c.fillStyle = "#4cc9f0"; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill();
  c.fillStyle = "#ffbe0b"; c.beginPath(); c.arc(bx, by, br, -Math.PI / 2, Math.PI / 2); c.fill();
  c.fillStyle = "#ffffff80"; c.beginPath(); c.arc(bx - br * 0.35, by - br * 0.35, br * 0.25, 0, TAU); c.fill();
}

const painters: Record<AnimatedScene, (c: Ctx, w: number, h: number, t: number) => void> = { balloons, meadow, undersea, lullaby, jungle, farm, pets, flag, liberty, nycnight };
export function isAnimatedScene(theme: string): theme is AnimatedScene { return (animatedScenes as readonly string[]).includes(theme); }
/** Draws the scene for `theme` and returns true, or returns false for any other theme. */
export function drawAnimatedScene(c: Ctx, theme: string, w: number, h: number, t: number) {
  if (!isAnimatedScene(theme)) return false;
  c.save(); painters[theme](c, w, h, t); c.restore();
  return true;
}

/* ================= Photo-realistic backgrounds: live motion on top ================= */
export type PhotoRect = { x: number; y: number; w: number; h: number };
type Source = CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number; src?: string };

// Bright spots (lit windows, stars, sun glints) found once per photo, in 0..1 photo coordinates.
const brightCache = new Map<string, { x: number; y: number; level: number }[]>();
export function brightSpots(image: Source, key: string, count = 90) {
  const hit = brightCache.get(key);
  if (hit) return hit;
  const W = 192, H = 108;
  let spots: { x: number; y: number; level: number }[] = [];
  try {
    let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
    if (typeof OffscreenCanvas !== "undefined") canvas = new OffscreenCanvas(W, H);
    else if (typeof document !== "undefined") { canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H; }
    const c = canvas?.getContext("2d", { willReadFrequently: true } as CanvasRenderingContext2DSettings) as Ctx | null | undefined;
    if (c) {
      c.drawImage(image, 0, 0, W, H);
      const data = c.getImageData(0, 0, W, H).data, found: { x: number; y: number; level: number }[] = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = (y * W + x) * 4, level = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11) / 255;
        const around = ((data[i - 4] + data[i + 4] + data[i - W * 4] + data[i + W * 4]) / 4) / 255;
        if (level > 0.62 && level - around * 0.85 > 0.08) found.push({ x: x / W, y: y / H, level });
      }
      found.sort((a, b) => b.level - a.level);
      for (const p of found) { if (spots.length >= count) break; if (spots.every(q => Math.hypot(q.x - p.x, (q.y - p.y) * 0.56) > 0.025)) spots.push(p); }
    }
  } catch { spots = []; } // e.g. a cross-origin picture: motion still works, just without twinkles
  brightCache.set(key, spots);
  return spots;
}

function twinkle(c: Ctx, r: PhotoRect, spots: { x: number; y: number }[], t: number, size: number, color: string) {
  c.save(); c.globalCompositeOperation = "lighter";
  spots.forEach((p, i) => {
    const on = Math.pow(0.5 + 0.5 * Math.sin(t * (0.8 + rnd(i, 60) * 1.6) + i * 2.1), 6);
    if (on < 0.05) return;
    const x = r.x + p.x * r.w, y = r.y + p.y * r.h, s = size * (0.6 + rnd(i, 61) * 0.8) * on;
    const g = c.createRadialGradient(x, y, 0, x, y, s * 3); g.addColorStop(0, color); g.addColorStop(1, "rgba(255,255,255,0)");
    c.globalAlpha = on * 0.9; c.fillStyle = g; c.beginPath(); c.arc(x, y, s * 3, 0, TAU); c.fill();
    c.globalAlpha = on * 0.6; c.fillRect(x - s * 2.2, y - 0.5, s * 4.4, 1); c.fillRect(x - 0.5, y - s * 2.2, 1, s * 4.4);
  });
  c.restore();
}
function shimmer(c: Ctx, r: PhotoRect, top: number, t: number, m: number, colors: string[]) {
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 70; i++) {
    const y = r.y + r.h * (top + (1 - top) * rnd(i, 62)), depth = (y - (r.y + r.h * top)) / (r.h * (1 - top) || 1);
    const x = r.x + ((rnd(i, 63) * r.w + t * m * (0.01 + rnd(i, 64) * 0.02)) % r.w), len = m * (0.012 + depth * 0.05) * (0.5 + 0.5 * Math.sin(t * 2.2 + i));
    c.globalAlpha = 0.18 + 0.25 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7)); c.fillStyle = colors[i % colors.length];
    c.fillRect(x, y, len, Math.max(1, m * 0.0016 * (1 + depth)));
  }
  c.restore();
}
function motes(c: Ctx, w: number, h: number, t: number, m: number, color: string, count: number, rise: number) {
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < count; i++) {
    const r = m * (0.003 + rnd(i, 65) * 0.012), x = (rnd(i, 66) * w + Math.sin(t * 0.5 + i) * m * 0.03 + w) % w;
    const y = ((rnd(i, 67) * h - t * rise * m * (0.01 + rnd(i, 68) * 0.03)) % h + h) % h;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, "rgba(255,255,255,0)");
    c.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t + i)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  c.restore();
}
function bubbles(c: Ctx, w: number, h: number, t: number, m: number) {
  c.save();
  for (let i = 0; i < 40; i++) {
    const r = m * (0.004 + rnd(i, 69) * 0.012), y = h - ((t * h * (0.05 + rnd(i, 70) * 0.07) + rnd(i, 71) * h) % h), x = rnd(i, 72) * w + Math.sin(t * 2 + i) * m * 0.01;
    c.globalAlpha = 0.55; c.strokeStyle = "#e8fbff"; c.lineWidth = Math.max(1, r * 0.18); c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.globalAlpha = 0.7; c.fillStyle = "#ffffff"; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, TAU); c.fill();
  }
  c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.035; c.fillStyle = "#bff6ff";
  for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse((rnd(i, 73) * w + Math.sin(t * 0.7 + i) * w * 0.08), h * (0.1 + rnd(i, 74) * 0.5), w * 0.07, h * 0.018, Math.sin(t * 0.4 + i), 0, TAU); c.fill(); }
  c.restore();
}
/** Night fireworks (kept for photos taken after dark). */
export function fireworks(c: Ctx, w: number, h: number, t: number, m: number, band: number) {
  const colors = ["#ff4d6d", "#ffffff", "#4dabf7", "#ffd166"];
  c.save(); c.globalCompositeOperation = "lighter";
  for (let k = 0; k < 3; k++) {
    const cycle = 5, local = (t + k * 1.7) % cycle, n = Math.floor((t + k * 1.7) / cycle);
    if (local > 1.8) continue;
    const p = local / 1.8, fx = w * (0.15 + rnd(n * 3 + k, 75) * 0.7), fy = h * band * (0.3 + rnd(n * 3 + k, 76) * 0.7), reach = m * 0.12 * (1 - Math.pow(1 - p, 3));
    c.globalAlpha = (1 - p) * 0.9; c.fillStyle = colors[(n + k) % colors.length];
    for (let i = 0; i < 32; i++) { const a = i * TAU / 32; c.beginPath(); c.arc(fx + Math.cos(a) * reach, fy + Math.sin(a) * reach + p * p * m * 0.03, m * 0.0035, 0, TAU); c.fill(); }
  }
  c.restore();
}

/** Draws the flag photo with its cloth moving. The flag fills the top of the picture, so only
 * that part ripples (strongest at the top edge, fading to nothing by `still`); the building,
 * lawn and anything below stay perfectly still. */
export function drawWavingPhoto(c: Ctx, image: Source, r: PhotoRect, t: number, still = 0.6) {
  const iw = (image.naturalWidth || image.width) ?? 0, ih = (image.naturalHeight || image.height) ?? 0;
  if (!iw || !ih) return;
  c.drawImage(image, r.x, r.y, r.w, r.h);
  const cols = Math.max(48, Math.min(140, Math.round(r.w / 8))), rows = 10, amp = r.h * 0.022;
  for (let row = 0; row < rows; row++) {
    const v0 = still * row / rows, v1 = still * (row + 1) / rows, weight = Math.pow(1 - (v0 + v1) / 2 / still, 1.5);
    for (let col = 0; col < cols; col++) {
      const u = col / cols, phase = u * TAU * 1.3 + v0 * 4 - t * 2.2, dy = Math.sin(phase) * amp * weight, light = Math.cos(phase) * weight;
      const dx = r.x + r.w * u, dw = r.w / cols + 1, dyTop = r.y + r.h * v0 + dy, dh = r.h * (v1 - v0) + 1;
      c.drawImage(image, iw * u, ih * v0, iw / cols, ih * (v1 - v0), dx, dyTop, dw, dh);
      if (Math.abs(light) > 0.02) { c.fillStyle = light > 0 ? `rgba(255,255,255,${light * 0.07})` : `rgba(0,0,0,${-light * 0.14})`; c.fillRect(dx, dyTop, dw, dh); }
    }
  }
}

/** Live motion layered over a photo background, matched to where the photo is drawn (r). */
export function drawPhotoMotion(c: Ctx, theme: string, image: Source, r: PhotoRect, w: number, h: number, t: number) {
  if (!isAnimatedScene(theme)) return false;
  const m = Math.min(w, h), key = `${theme}:${image.src ?? ""}`;
  c.save();
  if (theme === "balloons") { motes(c, w, h, t, m, "rgba(255,240,200,0.9)", 28, 0.6); }
  else if (theme === "meadow") { motes(c, w, h, t, m, "rgba(255,250,220,0.85)", 45, 0.25); twinkle(c, r, brightSpots(image, key, 25), t, m * 0.006, "rgba(255,250,230,0.9)"); }
  else if (theme === "undersea") { bubbles(c, w, h, t, m); }
  else if (theme === "jungle" || theme === "farm" || theme === "pets") { motes(c, w, h, t, m, "rgba(255,245,210,0.85)", 30, 0.4); }
  else if (theme === "lullaby") { twinkle(c, r, brightSpots(image, key, 110), t, m * 0.005, "rgba(255,248,220,0.95)"); motes(c, w, h, t, m, "rgba(210,200,255,0.6)", 12, 0.05); }
  else if (theme === "flag") { motes(c, w, h, t, m, "rgba(255,255,255,0.5)", 18, 0.2); }
  else if (theme === "liberty") { motes(c, w, h, t, m, "rgba(255,236,200,0.7)", 16, 0.1); shimmer(c, r, 0.5, t, m, ["#ffd8a8", "#fff3d6"]); twinkle(c, r, brightSpots(image, key, 40), t, m * 0.006, "rgba(255,230,180,0.9)"); }
  else if (theme === "nycnight") { twinkle(c, r, brightSpots(image, key, 120), t, m * 0.0045, "rgba(255,236,190,0.95)"); shimmer(c, r, 0.68, t, m, ["#ffd27a", "#9ad1ff", "#ff7aa8"]); }
  c.restore();
  return true;
}
