import {stemVisualSignal} from "./stem-reactive";
import {photoStoryFrame} from "./ad-photo-story";
import { drawLyricVideo } from "./lyric-video-render";
import { captionRows, drawTemplateCaptions } from "./lyric-caption-render";
import type { VisualSignal } from "./av-signals";
import { assetUrl } from "./lyric-pro-data";
import { videoThemes, type LyricProject } from "./lyric-video-data";
import type { VideoFrameImage } from "./advertising-footage";
export function drawProFrame(
  ctx: CanvasRenderingContext2D,
  time: number,
  project: LyricProject,
  title: string,
  images: Map<string, HTMLImageElement>,
  options: { clean?: boolean; guides?: boolean; exportTime?: boolean; signal?: VisualSignal; separateVocals?: boolean;footage?:VideoFrameImage } = {},
) {
  const p = project.pro,
    { width, height } = ctx.canvas;
  if (!p) {
    drawLyricVideo(ctx, time, project, title, null);
    return;
  }
  const elapsed = options.exportTime ? time : time - p.range.start + p.intro;
  const sourceTime = options.exportTime
    ? p.range.start + Math.max(0, elapsed - p.intro)
    : time;
  const inIntro = elapsed < p.intro,
    inOutro = elapsed >= p.intro + p.range.end - p.range.start;
  const section = p.sections.findLast(
    (s) => s.time <= sourceTime && sourceTime < s.end,
  );
  const theme = section?.theme ?? project.theme;
  const background =
    section?.background ?? (section?.theme ? undefined : p.background);
  const image = background
    ? images.get(assetUrl(p.sourceSongId, background))
    : images.get(videoThemes[theme].image);
  const activeFootage=p.useTemplateBackground?undefined:options.footage;
  let photoFrame:VideoFrameImage|undefined;
  const story=p.adPhotoStory;
  if(story?.photos.length&&!p.useTemplateBackground&&!activeFootage){
    const scene=photoStoryFrame(sourceTime,p.range.start,p.range.end,story.photos.length,story.transition==="dissolve");
    const photo=images.get(assetUrl(p.sourceSongId,story.photos[scene.index].asset)),next=images.get(assetUrl(p.sourceSongId,story.photos[scene.next].asset));
    if(photo)photoFrame={frame:photo,width:photo.naturalWidth,height:photo.naturalHeight,fit:story.fit,zoom:story.motion==="zoom"?1+scene.progress*.1:story.motion==="drift"?1.08:1,shiftX:story.motion==="drift"?(scene.progress-.5)*.04:0,...(next?{nextFrame:next,nextWidth:next.naturalWidth,nextHeight:next.naturalHeight,blend:scene.blend}:{})};
  }
  const cues =
    options.clean || inIntro || inOutro
      ? []
      : project.cues
          .filter(
            (c) =>
              (!options.separateVocals || !c.role || c.role === "lead") &&
              (p.includeBacking || c.role !== "backing") &&
              (p.includeAdlibs || c.role !== "adlib"),
          )
          .map((c) => {
            const marker = p.sections.findLast(
              (s) => s.time <= c.time && c.time < s.end,
            );
            return { ...c, singer: c.singer || marker?.singer };
          });
  const timedCues = cues.map((cue, index) => ({
    ...cue,
    end: cue.end ?? cues[index + 1]?.time ?? p.duration,
  }));
  const look = p.formatLooks?.[project.format] ?? p.look;
  const framed = { ...project, theme, cues: timedCues };
  const signal=options.signal??stemVisualSignal(p.reactiveStem,p.sourceAudioId,sourceTime,project.intensity==="still");
  // Drawing without captions must not fall back to the song title in clean exports.
  drawLyricVideo(
    ctx,
    sourceTime,
    options.clean
      ? { ...framed, cues: [{ text: " ", time: 0, end: 601 }] }
      : framed,
    title,
    activeFootage ?? photoFrame ?? image ?? null,
    undefined,
    signal,
  );
  if (options.separateVocals && !options.clean && !inIntro && !inOutro) {
    for (const role of ["adlib", "backing"] as const) {
      const cue = project.cues.findLast((c,i) => c.role === role && c.time <= sourceTime && (c.end ?? project.cues[i+1]?.time ?? p.duration) > sourceTime);
      if (!cue) continue;
      const callout = { ...project, captionTemplate: project.captionTemplate ?? "clear-voice" as const,
        cues: [cue], color: role === "adlib" ? "turquoise" as const : "lilac" as const,
        pro: { ...p, formatLooks: undefined, look: { ...look, size: .65, position: role === "adlib" ? .4 : .84 } } };
      drawTemplateCaptions(ctx, sourceTime, callout, width, height);
    }
  }
  if (inIntro || inOutro) {
    ctx.save();
    ctx.fillStyle = "#090b1ccb";
    ctx.fillRect(0, height * 0.3, width, height * 0.6);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff9ee";
    ctx.font = `600 ${width * 0.055}px Georgia`;
    captionRows(ctx, inOutro ? p.credits || title : title, width * 0.8)
      .slice(0, 5)
      .forEach((row, i) =>
        ctx.fillText(row.text, width * 0.5, height * 0.48 + i * width * 0.067),
      );
    ctx.font = `400 ${width * 0.026}px system-ui`;
    ctx.fillText(p.artist, width * 0.5, height * 0.8, width * 0.85);
    ctx.restore();
  } else if (!options.clean) {
    const cue = cues.findLast(
      (c) =>
        c.time <= sourceTime && (c.end === undefined || c.end > sourceTime),
    );
    if (cue) {
      const secondary = [cue.transliteration, cue.translation].filter(
        (s): s is string => !!s,
      );
      const look = p.formatLooks?.[project.format] ?? p.look;
      let y = Math.min(0.88, look.position + 0.105) * height;
      ctx.save();
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 8;
      secondary.forEach((text, index) => {
        let size = width * 0.031;
        ctx.font = `500 ${size}px "Noto Sans",system-ui,sans-serif`;
        while (
          ctx.measureText(text).width > width * 0.8 &&
          size > width * 0.019
        ) {
          size *= 0.93;
          ctx.font = `500 ${size}px "Noto Sans",system-ui,sans-serif`;
        }
        ctx.direction = /^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(
          text,
        )
          ? "rtl"
          : "ltr";
        ctx.fillStyle = index ? "#e8e4f2" : "#fff7de";
        ctx.fillText(text, width * 0.5, y, width * 0.8);
        y += size * 1.5;
      });
      ctx.restore();
    }
  }
  if(p.advertisement?.cta && !inIntro && !inOutro && sourceTime>=Math.max(p.range.start,p.range.end-4)){
    ctx.save();const fade=Math.min(1,(sourceTime-Math.max(p.range.start,p.range.end-4))/.3);ctx.globalAlpha=Math.max(0,fade);
    ctx.fillStyle="#080b20dc";ctx.fillRect(width*.08,height*.77,width*.84,height*.12);
    ctx.fillStyle="#fff5dc";ctx.textAlign="center";ctx.textBaseline="middle";ctx.direction=/^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(p.advertisement.cta)?"rtl":"ltr";
    ctx.font=`600 ${width*.032}px "Noto Sans",Arial,sans-serif`;
    const rows=captionRows(ctx,p.advertisement.cta,width*.76).slice(0,2);
    rows.forEach((row,i)=>ctx.fillText(row.text,width*.5,height*.83+(i-(rows.length-1)/2)*width*.043,width*.76));ctx.restore();
  }
  if (p.logo) {
    const logo = images.get(assetUrl(p.sourceSongId, p.logo));
    if (logo?.naturalWidth) {
      const w = width * 0.12,
        h = (w * logo.naturalHeight) / logo.naturalWidth;
      ctx.drawImage(
        logo,
        width * 0.06,
        height * 0.13,
        w,
        Math.min(h, height * 0.1),
      );
    }
  }
  if (options.guides) {
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff7";
    ctx.strokeRect(width * 0.1, height * 0.14, width * 0.8, height * 0.69);
    ctx.font = `${width * 0.022}px system-ui`;
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.fillText("Safe area · preview only", width * 0.11, height * 0.17);
    ctx.restore();
  }
}
