import type { OverlayStyle } from "./lyric-overlay-designs";

const tau = Math.PI * 2;
const cycle = (n: number) => ((n % 1) + 1) % 1;

/** Procedural canvas artwork, rendered from song time in both preview and export.
 * All loops have fixed bounds. These are decorative animations, not simulated FFT meters.
 * Coordinates are local to the upper-middle of the frame, behind the lyric contrast shade. */
export function drawAmbientMotion(
  ctx: CanvasRenderingContext2D, style: OverlayStyle, clock: number,
  width: number, height: number, radius: number, amount: number, pulse: number, ink: string,
) {
  const span = Math.min(width, height);
  if (style === "aurora" || style === "ribbons") {
    const colors = style === "aurora" ? ["#9affdf", "#b9a2ff", "#7bc9ff"] : ["#ffa9df", "#b1b1ff", "#9affdf"];
    for (let band = 0; band < 3; band++) {
      const points = Array.from({ length: 25 }, (_, i) => {
        const x = (i / 24 - .5) * width * 1.2;
        const y = Math.sin(i / 24 * tau + clock * .23 + band * 1.1) * span * .1 + (band - 1) * span * .09;
        return { x, y };
      });
      ctx.fillStyle = colors[band]; ctx.globalAlpha = amount * .13;
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      for (let i = points.length - 1; i >= 0; i--) ctx.lineTo(points[i].x, points[i].y + span * (.05 + .012 * Math.sin(clock * .17 + i)));
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = amount * .35; ctx.strokeStyle = colors[band];
      ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    }
  } else if (style === "constellation") {
    const stars = Array.from({ length: 24 }, (_, i) => ({
      x: Math.sin(i * 7.13) * width * .47 + Math.sin(clock * .06 + i) * span * .015,
      y: Math.cos(i * 3.83) * height * .27 + Math.cos(clock * .07 + i) * span * .015,
    }));
    ctx.strokeStyle = ink;
    for (let i = 0; i < stars.length; i++) {
      const a = stars[i], b = stars[(i + 1) % stars.length];
      if (Math.hypot(a.x - b.x, a.y - b.y) < span * .36) {
        ctx.globalAlpha = amount * .18; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.globalAlpha = amount * (.35 + .15 * Math.sin(clock * .45 + i));
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(a.x, a.y, span * (i % 5 ? .002 : .004), 0, tau); ctx.fill();
    }
  } else if (style === "orbit") {
    for (let ring = 0; ring < 4; ring++) {
      ctx.save(); ctx.rotate(-.35 + ring * .24);
      const rx = radius * (1.2 + ring * .32), ry = rx * .42;
      ctx.globalAlpha = amount * .22; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, tau); ctx.stroke();
      const angle = clock * (.18 + ring * .035) + ring * 1.7;
      ctx.globalAlpha = amount * .7; ctx.beginPath(); ctx.arc(Math.cos(angle) * rx, Math.sin(angle) * ry, span * .006, 0, tau); ctx.fill();
      ctx.restore();
    }
  } else if (style === "spectrum") {
    const bars = 32, step = width * .026;
    for (let i = 0; i < bars; i++) {
      const shape = .2 + .8 * (1 + Math.sin(i * .68 + clock * .6)) / 2;
      const h = span * (.04 + shape * .13 + pulse * .035);
      ctx.fillStyle = i % 3 === 0 ? "#c6a5ff" : ink; ctx.globalAlpha = amount * .38;
      ctx.fillRect((i - (bars - 1) / 2) * step, -h / 2, step * .48, h);
    }
  } else if (style === "bokeh") {
    for (let i = 0; i < 16; i++) {
      const x = Math.sin(i * 4.73 + clock * .055) * width * .52;
      const y = (cycle(i * .173 - clock * .013) - .5) * height * .82;
      const r = span * (.025 + (i % 4) * .012);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, ink); glow.addColorStop(1, "#ffffff00");
      ctx.fillStyle = glow; ctx.globalAlpha = amount * .25;
      ctx.beginPath(); ctx.arc(x, y, r, 0, tau); ctx.fill();
    }
  } else if (style === "mandala") {
    ctx.rotate(clock * .025);
    for (let ring = 0; ring < 2; ring++) {
      ctx.globalAlpha = amount * (ring ? .22 : .34);
      for (let i = 0; i < 12; i++) {
        const angle = i / 12 * tau + ring * Math.PI / 12;
        ctx.beginPath(); ctx.ellipse(Math.cos(angle) * radius * .65, Math.sin(angle) * radius * .65, radius * (ring ? 1.1 : .85), radius * .21, angle, 0, tau); ctx.stroke();
      }
    }
  } else if (style === "comet") {
    for (let i = 0; i < 7; i++) {
      const progress = cycle(i / 7 + clock * .025);
      const x = (progress - .5) * width * 1.6, y = (cycle(i * .317) - .5) * height * .65 + progress * span * .2;
      const tail = span * .12;
      const glow = ctx.createLinearGradient(x - tail, y - tail * .25, x, y);
      glow.addColorStop(0, "#ffffff00"); glow.addColorStop(1, ink);
      ctx.strokeStyle = glow; ctx.lineWidth = span * .002;
      ctx.globalAlpha = amount * Math.sin(progress * Math.PI) * .6;
      ctx.beginPath(); ctx.moveTo(x - tail, y - tail * .25); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x, y, span * .003, 0, tau); ctx.fill();
    }
  } else if (style === "petals") {
    for (let i = 0; i < 22; i++) {
      const progress = cycle(i / 22 + clock * .018);
      const x = Math.sin(i * 5.83) * width * .5 + Math.sin(clock * .18 + i) * span * .04;
      const y = (progress - .5) * height * .9;
      ctx.fillStyle = i % 2 ? "#ffd5dc" : "#e9b7ff";
      ctx.globalAlpha = amount * Math.sin(progress * Math.PI) * .48;
      ctx.beginPath(); ctx.ellipse(x, y, span * .011, span * .022, i + clock * .13, 0, tau); ctx.fill();
    }
  }
}
