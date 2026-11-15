import { soundtrackIdentity } from "./lyric-audio-identity";
import type { LyricProject } from "./lyric-video-data";
import { drawAmbientMotion } from "./lyric-ambient-motion";

export function beatPulse(time: number, bpm: number, offset = 0) {
  const cycles = (time - offset) * bpm / 60;
  return (1 + Math.cos(cycles * Math.PI * 2)) / 2;
}

export function projectBeatPulse(time:number,project:LyricProject){
 const grid=project.pro?.beatGrid;
 if(grid?.reviewed&&grid.source===soundtrackIdentity(project)&&grid.beats.length){let lo=0,hi=grid.beats.length;while(lo<hi){const mid=(lo+hi)>>>1;if(grid.beats[mid]<=time)lo=mid+1;else hi=mid;}return lo?Math.exp(-(time-grid.beats[lo-1])/.18):0;}
 return beatPulse(time,project.bpm??100,project.visualLayers?.beatOffset??0);
}
/** Bounded, deterministic geometry: the same source time gives the same preview/export frame. */
export function drawSignatureOverlay(ctx: CanvasRenderingContext2D, time: number, project: LyricProject, width: number, height: number, ink: string) {
  const layers = project.visualLayers;
  if (!layers || !layers.overlayAmount || layers.overlayStyle === "none") return;
  const clock = layers.overlayMotion ? time : 0;
  const pulse = layers.overlayMotion ? projectBeatPulse(clock, project) : 0.5;
  const energy = project.pro?.audioReactive && layers.overlayMotion ? project.pro.energy?.[Math.floor(time * 20)] ?? 0 : 0;
  const radius = Math.min(width, height) * (0.16 + pulse * 0.006 + energy * 0.012);
  ctx.save(); ctx.translate(width * 0.5, height * 0.38);
  ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = Math.max(1, width / 850);
  ctx.globalAlpha = layers.overlayAmount * (0.12 + pulse * 0.06);
  if (layers.overlayStyle === "rays") {
    ctx.rotate(clock * 0.014);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(radius * 0.2, 0); ctx.lineTo(radius * 1.8, radius * 0.18); ctx.lineTo(radius * 1.8, -radius * 0.18); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = layers.overlayAmount * 0.35;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, radius * (0.65 + i * 0.27), 0, Math.PI * 2); ctx.stroke(); }
  } else if (layers.overlayStyle === "unity") {
    ctx.rotate(clock * 0.025);
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI / 3;
      ctx.beginPath(); ctx.arc(i === 6 ? 0 : Math.cos(angle) * radius, i === 6 ? 0 : Math.sin(angle) * radius, radius, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (layers.overlayStyle === "flame") {
    for (let i = 0; i < 18; i++) {
      const progress = ((i / 18 + clock * 0.028) % 1 + 1) % 1;
      const x = Math.sin(i * 2.4 + clock * 0.18) * radius * (0.3 + progress);
      ctx.globalAlpha = layers.overlayAmount * Math.sin(progress * Math.PI) * 0.32;
      ctx.beginPath(); ctx.ellipse(x, radius * (1.5 - progress * 3), radius * (0.04 + progress * 0.025), radius * 0.15, Math.sin(clock * 0.2 + i), 0, Math.PI * 2); ctx.fill();
    }
  } else {
    drawAmbientMotion(ctx, layers.overlayStyle, clock, width, height, radius, layers.overlayAmount, pulse, ink);
  }
  ctx.restore();
}
