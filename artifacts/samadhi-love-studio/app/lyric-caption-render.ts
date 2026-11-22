import { projectBeatPulse } from "./lyric-visual-layers";
import { captionColors, type LyricCue, type LyricProject } from "./lyric-video-data";
import { captionTypefaces, getCaptionTemplate, type CaptionTemplate } from "./lyric-caption-templates";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => 1 - (1 - clamp(n)) ** 3;
const rtlText = (text: string) => /^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(text);
const joinedText = (text: string) => /[\p{Script=Arabic}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Tamil}\p{Script=Thai}]/u.test(text);
const cjkText = (text: string) => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text) && !/[\p{Script=Latin}\p{Script=Arabic}\p{Script=Hebrew}]/u.test(text);
const glyphSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: "word" });
const graphemes = (text: string) => Array.from(glyphSegmenter.segment(text), s => ({ text: s.segment, offset: s.index }));
export type CaptionToken = { text: string; start: number; end: number; time: number; until: number };

/** Offsets are UTF-16, matching the existing alignment API. No text is rewritten. */
export function captionTokens(cue: LyricCue, end: number): CaptionToken[] {
  const parts = /\s/u.test(cue.text) ? Array.from(cue.text.matchAll(/\S+/gu), m => ({ text: m[0], offset: m.index })) :
    Array.from(wordSegmenter.segment(cue.text), s => ({ text: s.segment, offset: s.index })).filter(p => p.text.trim());
  const duration = Math.max(0.05, end - cue.time);
  const tokens = parts.map(part => {
    const start = part.offset, finish = start + part.text.length;
    const alignedIndex = cue.words?.findIndex(word => word.offset >= finish) ?? -1;
    const aligned = alignedIndex >= 0 ? cue.words![alignedIndex] : undefined;
    const previousOffset = alignedIndex > 0 ? cue.words![alignedIndex - 1].offset : 0;
    const nextTime = alignedIndex >= 0 ? cue.words?.[alignedIndex + 1]?.time ?? end : end;
    const fraction = aligned ? (cue.text.slice(previousOffset, start).trim() ? clamp((start - previousOffset) / Math.max(1, aligned.offset - previousOffset)) : 0) : start / Math.max(1, cue.text.length);
    const onset = aligned ? aligned.time + Math.max(0, nextTime - aligned.time) * fraction : cue.time + duration * fraction;
    return { text: part.text, start, end: finish, time: Math.min(end, Math.max(cue.time, onset)), until: end };
  });
  return tokens.map((token, i) => ({ ...token, until: tokens[i + 1]?.time ?? end }));
}

/** Where the lyric block sits. Phone videos stay inside the TikTok/Reels/Shorts safe zone (above the bottom ~24%). */
export function captionCenterY(phone: boolean, height: number, halfBlock: number, position?: number) {
  return Math.min(height * (phone ? .76 : .84) - halfBlock, Math.max(height * (phone ? .2 : .22) + halfBlock, height * (position ?? (phone ? 0.62 : 0.72))));
}
/** Wide caption area for phone videos leaves the right-hand button column clear. */
export const captionWidthShare = (phone: boolean) => phone ? 0.74 : 0.8;
export function captionRows(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const rows: { text: string; offset: number }[] = [];
  let from = 0, lastSpace = -1;
  const glyphs = graphemes(text);
  for (let i = 0; i < glyphs.length; i++) {
    const g = glyphs[i];
    if (/\s/u.test(g.text)) lastSpace = g.offset;
    if (ctx.measureText(text.slice(from, g.offset + g.text.length)).width <= maxWidth || g.offset === from) continue;
    const cut = lastSpace > from ? lastSpace : g.offset;
    rows.push({ text: text.slice(from, cut).trimEnd(), offset: from });
    from = cut;
    while (/\s/u.test(text[from] ?? "") && from < text.length) from++;
    lastSpace = -1;
    // Reconsider glyphs after a word-boundary break on the next iteration.
    i = Math.max(-1, glyphs.findIndex(item => item.offset >= from) - 1);
  }
  if (from < text.length) rows.push({ text: text.slice(from).trimEnd(), offset: from });
  return rows;
}

function emphasized(cue: LyricCue, token: CaptionToken, index: number, count: number) {
  if (cue.accentWords !== undefined) return cue.accentWords.includes(token.end);
  return index === count - 1 || /^(love|light|rise|home|heart|alive|shine|dream|نور|حب|愛|光)[!?.،。]*$/iu.test(token.text);
}

function paintFill(ctx: CanvasRenderingContext2D, template: CaptionTemplate, color: string, width: number, size: number, time: number, still: boolean) {
  if (!template.fill) return color;
  const gradient = ctx.createLinearGradient(-width / 2, -size / 2, width / 2, size / 2);
  if (template.fill === "metallic") {
    const shine = still ? 0.5 : 0.25 + 0.5 * ((Math.sin(time * 1.3) + 1) / 2);
    gradient.addColorStop(0, "#c0cede"); gradient.addColorStop(Math.max(0.01, shine - 0.2), "#e8f2ff");
    gradient.addColorStop(shine, "#ffffff"); gradient.addColorStop(Math.min(0.99, shine + 0.2), "#b7c7dc"); gradient.addColorStop(1, "#f3f8ff");
  } else for (let i = 0; i < 5; i++) gradient.addColorStop(i / 4, `hsl(${(i * 65 + (still ? 0 : time * 28)) % 360} 88% 78%)`);
  return gradient;
}

function orbit(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, size: number, time: number, color: string, rays: boolean) {
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.fillStyle = color; ctx.strokeStyle = color;
  for (let i = 0; i < (rays ? 6 : 3); i++) {
    const angle = time * 0.8 + i * Math.PI * 2 / (rays ? 6 : 3);
    const px = x + Math.cos(angle) * (w / 2 + size * 0.3), py = y + Math.sin(angle) * size * 0.75;
    ctx.globalAlpha *= 0.75;
    ctx.beginPath();
    if (rays) { ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(angle) * size * 0.16, py + Math.sin(angle) * size * 0.16); ctx.lineWidth = 2; ctx.stroke(); }
    else { ctx.arc(px, py, size * 0.045, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

export function drawTemplateCaptions(ctx: CanvasRenderingContext2D, time: number, project: LyricProject, width: number, height: number) {
  const template = getCaptionTemplate(project.captionTemplate);
  if (!template) return;
  const cueIndex = project.cues.findLastIndex(cue => cue.time <= time);
  const cue = project.cues[cueIndex];
  if (!cue || (cue.end !== undefined && time >= cue.end)) return;
  const end = Math.min(cue.end ?? Infinity, project.cues[cueIndex + 1]?.time ?? cue.end ?? cue.time + Math.max(3, cue.text.length * 0.075));
  const tokens = captionTokens(cue, end);
  const active = project.pro?.captionMode === "lines" ? -1 : tokens.findIndex(token => time >= token.time && time < token.until);
  const still = project.intensity === "still";
  const strength = still ? 0 : project.intensity === "gentle" ? 0.3 : 1;
  const age = time - cue.time;
  const entrance = still ? 1 : ease(age / (template.animation === "shimmer" ? 0.6 : 0.32));
  const exit = still ? 1 : clamp((end - time) / 0.12);
  const face = captionTypefaces[project.font ?? template.font];
  const singerIndex = cue.singer ? Math.max(0,[...new Set(project.cues.map(c=>c.singer).filter(Boolean))].indexOf(cue.singer))%2 : 0;
  const color = cue.singer ? (project.pro?.duetColors?.[singerIndex] ?? (singerIndex ? "#b8eeff" : "#ffe2b0")) : captionColors[project.color ?? template.color];
  const look = project.pro?.formatLooks?.[project.format] ?? project.pro?.look;
  const joined = joinedText(cue.text), rtl = rtlText(cue.text);
  const mixedBidi = /[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(cue.text) && /\p{Script=Latin}/u.test(cue.text);
  const vertical = template.animation === "vertical" && project.captionLayout !== "horizontal" && cjkText(cue.text);
  let size = (project.format === "wide" ? 57 : 51) * Math.min(width / (project.format === "wide" ? 1280 : 720), height / (project.format === "wide" ? 720 : 1080));
  if (project.format === "square") size *= 1.22;
  size = Math.max(size, width * 0.035) * (look?.size ?? 1);
  // Phone videos (TikTok, Reels, Shorts): the apps cover the bottom ~22% (captions, music line) and a
  // column of buttons on the right, so lyrics stay inside a safe zone there.
  const phone = project.format === "vertical";
  const maxWidth = width * captionWidthShare(phone), maxHeight = height * (phone ? 0.3 : 0.37);
  const setFont = () => {
    ctx.font = `${"italic" in face ? "italic " : ""}${face.weight} ${size}px ${face.family}`;
    ctx.letterSpacing = `${!joined && !rtl && !cjkText(cue.text) ? (template.tracking ?? 0) * size : 0}px`;
  };
  ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = rtl ? "rtl" : "ltr";
  setFont();
  let rows = captionRows(ctx, cue.text, maxWidth);
  while ((rows.length * size * (look?.spacing ?? 1.35) > maxHeight || rows.some(row => ctx.measureText(row.text).width > maxWidth)) && size > width * 0.022) {
    size *= 0.92; setFont(); rows = captionRows(ctx, cue.text, maxWidth);
  }
  const halfBlock = Math.min(maxHeight, rows.length * size * (look?.spacing ?? 1.35)) / 2;
  const centerY = captionCenterY(phone, height, halfBlock, look?.position);
  const pulse = still ? 0 : project.visualLayers ? projectBeatPulse(time, project) : (1 + Math.sin(time * (project.bpm ?? 100) / 60 * Math.PI * 2)) / 2;
  const lineX = template.animation === "slide" || template.animation === "impact" ? (1 - entrance) * width * 0.045 * strength : 0;
  const lineY = template.animation === "rise" || template.animation === "underline" ? (1 - entrance) * size * 0.5 * strength : 0;
  ctx.globalAlpha = (still ? 1 : (1 - strength) + entrance * strength) * exit;
  ctx.translate(lineX, lineY);
  ctx.lineJoin = "round";
  const drawText = (text: string, x: number, y: number, fill: string | CanvasGradient, glow = 0) => {
    ctx.shadowColor = glow ? template.accent : "#000"; ctx.shadowBlur = (glow || size * 0.16) * (look?.shadow ?? 1);
    ctx.lineWidth = (template.outline ? size * 0.11 : size * 0.055) * (look?.outline ?? 1);
    ctx.strokeStyle = template.animation === "orbit" ? "#2c193d" : "#090c18";
    if ((look?.outline ?? 1)>0) ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
  };

  if (vertical) {
    const glyphs = graphemes(cue.text).filter(g => g.text.trim());
    const perColumn = Math.max(3, Math.floor(maxHeight / (size * 1.2)));
    const columns = Math.ceil(glyphs.length / perColumn);
    // Shrink long passages until all columns fit within the title-safe width.
    while (columns * size * 1.45 > maxWidth) size *= 0.92;
    setFont();
    glyphs.forEach((glyph, i) => {
      const x = width / 2 + ((columns - 1) / 2 - Math.floor(i / perColumn)) * size * 1.45;
      const y = centerY - maxHeight / 2 + (i % perColumn + 0.5) * size * 1.2;
      const token = tokens.find(t => glyph.offset >= t.start && glyph.offset < t.end);
      if (!still && token && time < token.time) return;
      const current = token && time >= token.time && time < token.until;
      drawText(glyph.text, x, y, current ? template.accent : color, current ? size * 0.3 : 0);
      if (current && strength > 0.5) orbit(ctx, x, y, size, size * 0.65, time, template.accent, false);
    });
    ctx.restore(); return;
  }

  rows.forEach((row, rowIndex) => {
    const rowWidth = ctx.measureText(row.text).width;
    const y = centerY + (rowIndex - (rows.length - 1) / 2) * size * (look?.spacing ?? 1.35);
    const left = (width - rowWidth) / 2;
    if (template.plate) {
      ctx.save(); ctx.shadowBlur = 0; ctx.fillStyle = "#050910eb";
      ctx.beginPath(); ctx.roundRect(left - size * 0.3, y - size * 0.68, rowWidth + size * 0.6, size * 1.36, size * 0.14); ctx.fill(); ctx.restore();
    }
    // Full-line shaping is always retained. Word effects are masks over that shaped line.
    let reveal = row.text.length;
    if (template.animation === "typewriter" && !still && !mixedBidi && project.pro?.captionMode !== "lines") {
      const current = active >= 0 ? tokens[active] : undefined;
      const count = current ? clamp((time - current.time) / Math.max(0.08, current.until - current.time)) : 1;
      const glyphs = current ? graphemes(current.text) : [];
      const glyph = glyphs[Math.min(glyphs.length - 1, Math.floor(count * glyphs.length))];
      reveal = Math.max(0, Math.min(row.text.length, (current ? current.start + (glyph?.offset ?? 0) + (glyph?.text.length ?? 0) : cue.text.length) - row.offset));
    }
    ctx.save();
    if (reveal < row.text.length) {
      const litWidth = ctx.measureText(row.text.slice(0, reveal)).width;
      ctx.beginPath(); ctx.rect(rtl ? left + rowWidth - litWidth : left, y - size, litWidth, size * 2); ctx.clip();
    }
    ctx.save(); ctx.translate(width / 2, y);
    drawText(row.text, 0, 0, paintFill(ctx, template, color, rowWidth, size, time, still), template.animation === "pulse" || template.animation === "illuminate" ? size * (0.15 + pulse * 0.2 * strength) : 0);
    ctx.restore(); ctx.restore();

    tokens.forEach((token, i) => {
      const from = Math.max(0, token.start - row.offset), to = Math.min(row.text.length, token.end - row.offset);
      if (to <= from) return;
      const prefix = ctx.measureText(row.text.slice(0, from)).width;
      const wordWidth = mixedBidi ? rowWidth : ctx.measureText(row.text.slice(from, to)).width;
      const x = mixedBidi ? width / 2 : rtl ? left + rowWidth - prefix - wordWidth / 2 : left + prefix + wordWidth / 2;
      const current = i === active;
      const marked = emphasized(cue, token, i, tokens.length);
      const wordAge = time - token.time;
      const mode = cue.emphasis && cue.emphasis !== "auto" ? cue.emphasis : template.emphasis;
      const popping = ["pop", "orbit", "punch", "impact"].includes(template.animation);
      if (!current) return;
      const progress = clamp(wordAge / 0.42);
      const overshoot = Math.sin(progress * Math.PI * 1.4) * Math.exp(-progress * 3);
      let scale = 1 + (mode === "pop" && marked || popping ? 0.2 * Math.max(0, overshoot) : template.animation === "pulse" ? 0.07 : 0) * strength;
      if (joined) scale = 1;
      const lift = (template.animation === "rainbow" ? Math.sin(wordAge * 4) * size * 0.07 : template.animation === "typewriter" ? -size * 0.05 : 0) * strength;
      const shake = template.animation === "impact" && marked && wordAge < 0.18 ? Math.sin(wordAge * 75) * size * 0.035 * (1 - wordAge / 0.18) * strength : 0;
      ctx.save();
      ctx.beginPath(); ctx.rect(x - wordWidth / 2 - size * 0.06, y - size, wordWidth + size * 0.12, size * 2); ctx.clip();
      if (template.animation === "typewriter" && reveal < row.text.length) {
        const revealedWidth = ctx.measureText(row.text.slice(0, reveal)).width;
        ctx.beginPath(); ctx.rect(rtl ? left + rowWidth - revealedWidth : left, y - size, revealedWidth, size * 2); ctx.clip();
      }
      ctx.translate(x + shake, y + lift); ctx.scale(scale, scale); ctx.translate(-x, -y);
      const glow = mode === "glow" || ["pulse", "illuminate"].includes(template.animation) ? size * ((marked ? 0.4 : 0.15) + 0.2 * pulse * strength) : 0;
      drawText(row.text, width / 2, y, marked || mode === "color" ? template.accent : color, glow);
      ctx.restore();
      if (["underline", "slide", "rise"].includes(template.animation)) {
        ctx.save(); ctx.shadowBlur = 0; ctx.lineWidth = Math.max(2, size * 0.045); ctx.strokeStyle = template.accent;
        const length = wordWidth * (still ? 1 : ease(wordAge / 0.25));
        ctx.beginPath(); ctx.moveTo(rtl ? x + wordWidth / 2 : x - wordWidth / 2, y + size * 0.62);
        ctx.lineTo(rtl ? x + wordWidth / 2 - length : x - wordWidth / 2 + length, y + size * 0.62); ctx.stroke(); ctx.restore();
      }
      if (marked && strength > 0.5 && ["orbit", "illuminate", "vertical"].includes(template.animation)) orbit(ctx, x, y, wordWidth, size, time, template.accent, template.animation === "illuminate");
    });
    if (template.animation === "illuminate" && rowIndex === 0) {
      // Gild the first complete grapheme, without changing the original text.
      const initial = graphemes(row.text)[0]?.text ?? "";
      const initialWidth = ctx.measureText(initial).width;
      ctx.save(); ctx.beginPath(); ctx.rect(rtl ? left + rowWidth - initialWidth : left, y - size, initialWidth, size * 2); ctx.clip();
      drawText(row.text, width / 2, y, "#ffe9a8", size * 0.25); ctx.restore();
    }
  });
  ctx.restore();
}
