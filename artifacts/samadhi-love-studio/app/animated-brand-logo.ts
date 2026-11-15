import { isBrandLogo, logoSvg, type BrandLogo } from "./brand-logo";
import { isLogoAnimation, natureSceneFrame, type LogoAnimation } from "./logo-nature-scenes";
import { exportProVideo, proVideoSize, type ProExportResult } from "./lyric-pro-export";

/** The live preview and video exporter use this same deterministic frame. */
export function animatedLogoSvg(design: BrandLogo, animation: LogoAnimation, time: number) {
  if (!isBrandLogo(design) || !isLogoAnimation(animation)) throw new Error("Check the logo name and animation settings.");
  const f = natureSceneFrame(animation, time), size = proVideoSize(animation.format);
  const aspect = design.layout === "horizontal" ? 1600 / 600 : 1200 / 1000;
  const width = Math.min(f.width * .86, f.height * .76 * aspect), height = width / aspect;
  const x = (f.width - width) / 2, cy = f.height * .49;
  const shift = animation.logoMotion === "float" ? Math.sin(f.phase) * f.height * .008 * f.strength : 0;
  const scale = animation.logoMotion === "breathe" ? 1 + Math.sin(f.phase) * .018 * f.strength : 1;
  const logo = logoSvg({ ...design, transparent: true }).replace(/^<svg[^>]*>/, `<svg x="${x}" y="${cy - height / 2}" width="${width}" height="${height}" viewBox="0 0 ${design.layout === "horizontal" ? "1600 600" : "1200 1000"}">`);
  const contrast = design.palette === "ink"
    ? `<rect x="${x}" y="${cy - height * .52}" width="${width}" height="${height * 1.04}" rx="32" fill="#fff9ed" opacity=".9"/>`
    : `<ellipse cx="500" cy="${cy}" rx="${width * .76}" ry="${height * .75}" fill="url(#nature-contrast)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${f.width} ${f.height}" role="img" aria-label="Animated nature logo"><defs>${f.defs}</defs>${f.body}<g transform="translate(0 ${shift}) translate(500 ${cy}) scale(${scale}) translate(-500 ${-cy})">${contrast}${logo}</g></svg>`;
}

/** Embedded vectors and escaped text only; no scripts or external media. */
async function frameImage(svg: string, signal: AbortSignal) {
  signal.throwIfAborted();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      if (signal.aborted) { bitmap.close(); signal.throwIfAborted(); }
      return { source: bitmap as CanvasImageSource, dispose: () => bitmap.close() };
    } catch (error) { if (signal.aborted) throw error; /* Some browsers require Image for SVG. */ }
  }
  const url = URL.createObjectURL(blob), image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      const clean = () => { image.onload = null; image.onerror = null; signal.removeEventListener("abort", abort); };
      const abort = () => { clean(); image.removeAttribute("src"); reject(new DOMException("Logo export canceled", "AbortError")); };
      image.onload = () => { clean(); resolve(); };
      image.onerror = () => { clean(); reject(new Error("This browser could not draw the nature scene. Try another current browser.")); };
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) return abort();
      image.src = url;
    });
    signal.throwIfAborted();
    return { source: image as CanvasImageSource, dispose: () => { image.removeAttribute("src"); URL.revokeObjectURL(url); } };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}
export async function exportAnimatedLogo(design: BrandLogo, signal: AbortSignal, progress: (fraction: number) => void): Promise<ProExportResult> {
  if (!isBrandLogo(design) || !isLogoAnimation(design.animation)) throw new Error("Choose an animated nature scene first.");
  signal.throwIfAborted();
  if (document.fonts) await Promise.all([document.fonts.load("700 80px Arial"), document.fonts.load("700 80px Georgia"), document.fonts.load("700 80px Verdana")]);
  signal.throwIfAborted();
  const animation = design.animation;
  // Genuine silent AAC track: no song is changed or sent to an external provider.
  if (typeof AudioBuffer === "undefined") throw new Error("This browser cannot prepare a logo video. Try another current browser, or download the still logo.");
  const audio = new AudioBuffer({ numberOfChannels: 2, sampleRate: 44100, length: animation.seconds * 44100 });
  try { return await exportProVideo({ audio, audioUrl: "", start: 0, end: animation.seconds, intro: 0, outro: 0,
    format: animation.format, resolution: 1080, signal, requiresFrameEncoding: true,
    frameEncodingError: "This browser cannot export an animated logo video. Try a current browser with H.264/AAC support. Still SVG and PNG downloads remain available.",
    paint: async (ctx, time) => {
      const frame = await frameImage(animatedLogoSvg(design, animation, time), signal);
      try { signal.throwIfAborted(); ctx.drawImage(frame.source, 0, 0, ctx.canvas.width, ctx.canvas.height); }
      finally { frame.dispose(); }
    },
  }, progress); }
  catch (error) {
    if (!signal.aborted && document.visibilityState !== "visible") throw new Error("Export stopped because the page was hidden. Your logo choices are still here. Retry with this page visible.");
    throw error;
  }
}
