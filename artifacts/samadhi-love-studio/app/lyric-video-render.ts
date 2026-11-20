import { drawAnimatedScene, drawPhotoMotion, drawWavingPhoto, isAnimatedScene } from "./lyric-animated-scenes";
import { captionColors, videoThemes, type LyricProject } from "./lyric-video-data";
import { drawTemplateCaptions } from "./lyric-caption-render";
import { drawSignatureOverlay } from "./lyric-visual-layers";
import { captionTypefaces } from "./lyric-caption-templates";
import type { VisualSignal } from "./av-signals";
import type { VideoFrameImage } from "./advertising-footage";

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: { text: string; offset: number }[] = [];
  let start = 0;
  let end = 0;
  for (const word of text.matchAll(/\S+/gu)) {
    const next = word.index + word[0].length;
    if (end > start && ctx.measureText(text.slice(start, next)).width > width) {
      lines.push({ text: text.slice(start, end), offset: start });
      start = word.index;
    }
    end = next;
  }
  if (end > start) lines.push({ text: text.slice(start, end), offset: start });
  return lines;
}

export function drawLyricVideo(ctx: CanvasRenderingContext2D, time: number, project: LyricProject, title: string, image: HTMLImageElement | VideoFrameImage | null, logicalSize?: number, signal?: VisualSignal) {
  const { width, height } = logicalSize ? { width: logicalSize, height: logicalSize } : ctx.canvas;
  const [glow, atmosphere, night, ink] = videoThemes[project.theme].colors;
  const motion = project.motion === "still" ? 0 : time * (project.visualLayers?.backgroundMotion ?? 1);
  ctx.save();
  if (signal) {
    const zoom = 1 + Math.min(1, Math.max(0, signal.camera)) * .035;
    ctx.translate(width / 2, height / 2); ctx.scale(zoom, zoom); ctx.translate(-width / 2, -height / 2);
    if (signal.color) ctx.filter = `hue-rotate(${Math.min(1, Math.max(0, signal.color)) * 45}deg)`;
  }
  const sky = ctx.createRadialGradient(width * 0.51, height * 0.38, 0, width * 0.5, height * 0.4, Math.max(width, height) * 0.7);
  sky.addColorStop(0, glow); sky.addColorStop(0.55, atmosphere); sky.addColorStop(1, night);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if(image && "frame" in image){
    const paint=(frame:CanvasImageSource,iw:number,ih:number,alpha:number)=>{const scale=(image.fit==="contain"?Math.min:Math.max)(width/iw,height/ih)*(image.zoom??1),w=iw*scale,h=ih*scale;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(frame,(width-w)/2+(image.shiftX??0)*width,(height-h)/2,w,h);ctx.restore();};
    paint(image.frame,image.width,image.height,1);
    if(image.nextFrame&&image.blend)paint(image.nextFrame,image.nextWidth??image.width,image.nextHeight??image.height,image.blend);
  } else if (image?.naturalWidth && image.naturalHeight) {
    const zoom = project.motion === "zoom" ? 1.01 + 0.15 * (1 - Math.exp(-motion / 18)) : project.motion === "drift" ? 1.09 : 1;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom;
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    const shiftX = project.motion === "drift" ? width * 0.024 * Math.sin(motion / 8) : 0;
    const shiftY = project.motion === "drift" ? height * 0.021 * Math.sin(motion / 13) : 0;
    const rect = { x: (width - w) / 2 + shiftX, y: (height - h) / 2 + shiftY, w, h };
    // Photo backgrounds for the animated scenes get live motion on top; the flag photo waves.
    if (project.theme === "flag" && isAnimatedScene(project.theme)) drawWavingPhoto(ctx, image, rect, motion);
    else ctx.drawImage(image, rect.x, rect.y, w, h);
    drawPhotoMotion(ctx, project.theme, image, rect, width, height, motion);
  } else if (drawAnimatedScene(ctx, project.theme, width, height, motion)) {
    // Animated scene drawn (balloons, meadow, undersea, lullaby, flag, liberty, nycnight).
  } else if (project.theme === "nature") {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(width * 0.63, height * (0.31 - Math.min(motion * 0.0004, 0.07)), width * 0.105, 0, Math.PI * 2);
    ctx.fill();
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = ["#476e6d", "#284c53", "#14363f"][layer];
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = 0; i <= 16; i++) {
        const ridge = Math.sin(i * 0.61 + layer * 2) * 0.09 + Math.cos(i * 1.8 + layer) * 0.033;
        ctx.lineTo(width * i / 16, height * (0.57 + layer * 0.11 + ridge));
      }
      ctx.lineTo(width, height);
      ctx.fill();
    }
  } else if (project.theme === "meditation") {
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = ink; ctx.lineWidth = i % 2 ? 1 : 2;
      ctx.globalAlpha = 0.25 + 0.12 * Math.sin(i * 0.9 - motion * 0.75);
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.39, Math.min(width, height) * (0.09 + i * 0.037), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = ink;
    for (let i = 0; i < 105; i++) {
      ctx.globalAlpha = 0.17 + 0.35 * (0.5 + 0.5 * Math.sin(i * 13 + motion / 3));
      ctx.beginPath();
      ctx.arc(((i * 313.37 + motion * (i % 4 + 1)) % width), (i * 173.63) % height, i % 9 === 0 ? 2 : 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = ink; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.41, width * (0.24 + i * 0.035), height * (0.09 + i * 0.018), -0.52 + motion / 150, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawSignatureOverlay(ctx, time, project, width, height, ink);
  ctx.restore();
  if (signal?.light) {
    ctx.save(); ctx.globalAlpha = Math.min(.13, Math.max(0, signal.light) * .13);
    ctx.fillStyle = ink; ctx.fillRect(0, 0, width, height); ctx.restore();
  }

  if (project.pro?.audioReactive && (project.visualLayers ? project.visualLayers.overlayMotion && project.visualLayers.overlayAmount > 0 : project.intensity !== "still")) {
    const energy = project.pro.energy?.[Math.floor(time*20)] ?? 0;
    const accent = project.pro.accents?.findLast(t=>t<=time);
    const pulse = accent === undefined ? 0 : Math.exp(-(time-accent)/.18);
    ctx.save(); ctx.globalAlpha = Math.min(.2,energy*.09+pulse*.1) * (project.visualLayers?.overlayAmount ?? 1);
    ctx.fillStyle = ink; ctx.fillRect(0,0,width,height); ctx.restore();
  }
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "#08061591"); shade.addColorStop(0.31, "#08061500");
  shade.addColorStop(0.53, "#0806151c"); shade.addColorStop(1, "#080615ee");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.direction = "ltr";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  ctx.font = `700 ${project.pro ? width * 0.027 : 20}px system-ui`;
  ctx.fillText(project.pro?.advertisement?.brand || project.pro?.artist || "S A M A D H I   L O V E", width / 2, height * 0.105, width * 0.85);
  const cue = project.cues.findLast(line => line.time <= time);
  if (!cue || (cue.end !== undefined && time >= cue.end)) {
    if (cue) return;
    ctx.font = "600 57px Georgia";
    wrap(ctx, title, width * 0.84).forEach((line, index) => ctx.fillText(line.text, width / 2, height * 0.72 + index * 62, width * 0.86));
    return;
  }
  const look = project.pro?.formatLooks?.[project.format] ?? project.pro?.look;
  ctx.save();
  if (signal?.lyrics) {
    const scale = 1 + Math.min(1, Math.max(0, signal.lyrics)) * .1;
    const center = height * (look?.position ?? .72);
    ctx.translate(width / 2, center); ctx.scale(scale, scale); ctx.translate(-width / 2, -center);
  }
  if (project.captionTemplate) {
    drawTemplateCaptions(ctx, time, project, width, height);
    ctx.restore();
    return;
  }
  const age = Math.min(1, (time - cue.time) / 0.28);
  const effect = project.effect ?? "fade";
  if (effect === "fade") ctx.globalAlpha = Math.max(0.4, age);
  const rise = effect === "rise" ? (1 - age) ** 2 * 24 : 0;
  const face = captionTypefaces[project.font ?? "classic"];
  const font = face.family;
  const weight = face.weight;
  const fontStyle = "italic" in face ? "italic " : "";
  const color = captionColors[project.color ?? "pearl"];
  const highlight = project.color === "gold" ? "#a6fff3" : "#ffd488";
  let size = (project.format === "wide" ? 56 : 50) * (project.pro ? width / (project.format === "wide" ? 1280 : 720) : 1) * (look?.size ?? 1);
  ctx.font = `${fontStyle}${weight} ${size}px ${font}`;
  let lines = wrap(ctx, cue.text, width * 0.83);
  while (lines.length > 4 && size > 28) {
    size -= 3; ctx.font = `${fontStyle}${weight} ${size}px ${font}`; lines = wrap(ctx, cue.text, width * 0.83);
  }
  const activeOffset = cue.words?.findLast(word => word.time <= time)?.offset ?? 0;
  const rtl = /^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(cue.text);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 12;
  lines.forEach((line, index) => {
    const y = height * (look?.position ?? .75) + rise + (index - (lines.length - 1) / 2) * size * (look?.spacing ?? 1.15);
    ctx.fillStyle = color;
    ctx.fillText(line.text, width / 2, y, width * 0.87);
    if (activeOffset <= line.offset) return;
    const measured = ctx.measureText(line.text).width;
    const full = Math.min(measured, width * 0.87);
    const lit = ctx.measureText(line.text.slice(0, activeOffset - line.offset)).width * (full / Math.max(1, measured));
    ctx.save();
    ctx.beginPath();
    ctx.rect(rtl ? (width + full) / 2 - lit : (width - full) / 2, y - size, lit, size * 2);
    ctx.clip();
    ctx.fillStyle = highlight;
    ctx.fillText(line.text, width / 2, y, width * 0.87);
    ctx.restore();
  });
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}
