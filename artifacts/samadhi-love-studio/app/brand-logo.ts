import {isLogoAnimation,type LogoAnimation} from "./logo-nature-scenes";
export const logoSymbols = { orbit: "Cosmic orbit", lotus: "Sacred lotus", wave: "Flowing wave", equalizer: "Music bars", monogram: "Monogram", spark: "Starlight", sunrise: "Rising sun", diamond: "Modern diamond" } as const;
export const logoPalettes = { gold: ["#e4bd6b", "#fff0b3"], cosmic: ["#a693ff", "#7aefed"], rose: ["#ee9ebb", "#ffd7dc"], ocean: ["#4ec9cf", "#c4fff1"], silver: ["#c4cddd", "#ffffff"], ink: ["#151c2d", "#38465e"] } as const;
export const logoFonts = { modern: "Arial, sans-serif", elegant: "Georgia, serif", rounded: "Verdana, sans-serif", impact: "Impact, Arial, sans-serif" } as const;
export type BrandLogo = { name: string; tagline: string; symbol: keyof typeof logoSymbols; palette: keyof typeof logoPalettes; font: keyof typeof logoFonts; layout: "stacked" | "horizontal" | "badge"; transparent: boolean; animation?:LogoAnimation };
export const defaultBrandLogo: BrandLogo = { name: "SAMADHI LOVE", tagline: "MUSIC · LIGHT · CONNECTION", symbol: "orbit", palette: "gold", font: "modern", layout: "stacked", transparent: true };
export function isBrandLogo(value: unknown): value is BrandLogo {
  const v = value as BrandLogo;
  return !!v && typeof v === "object" && typeof v.name === "string" && !!v.name.trim() && v.name.length <= 70 && typeof v.tagline === "string" && v.tagline.length <= 80 && Object.hasOwn(logoSymbols, v.symbol) && Object.hasOwn(logoPalettes, v.palette) && Object.hasOwn(logoFonts, v.font) && ["stacked", "horizontal", "badge"].includes(v.layout) && typeof v.transparent === "boolean" && (v.animation===undefined||isLogoAnimation(v.animation));
}
const escapeXml = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const rtl = (s: string) => /^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(s);
const glyphCount = (s: string) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].length;
/** Original vector marks only. User text is escaped; no scripts, uploaded SVG or external URLs. */
export function logoSvg(design: BrandLogo) {
  if (!isBrandLogo(design)) throw new Error("Enter a logo name and choose a supported design.");
  const wide = design.layout === "horizontal", w = wide ? 1600 : 1200, h = wide ? 600 : 1000;
  const name = design.name.trim(), [a, b] = logoPalettes[design.palette];
  const initials = name.split(/\s+/u).slice(0, 2).map(word => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word)][0]?.segment ?? "").join("");
  let mark = "";
  if (design.symbol === "orbit") mark = '<circle r="112"/><ellipse rx="175" ry="61" transform="rotate(-30)"/><circle cx="150" cy="-75" r="12" fill="url(#logo-ink)"/>';
  if (design.symbol === "lotus") mark = '<path d="M0 120C-85 45-80-45 0-140C80-45 85 45 0 120ZM0 120C-145 95-180 0-145-70C-60-65 5 10 0 120ZM0 120C145 95 180 0 145-70C60-65-5 10 0 120Z"/>';
  if (design.symbol === "wave") mark = '<path d="M-175-35Q-90-150 0-35T175-35M-175 25Q-90-90 0 25T175 25M-145 85Q-70-15 15 85T175 85"/>';
  if (design.symbol === "equalizer") mark = [-135,-90,-45,0,45,90,135].map((x,i)=>`<path d="M${x} ${-[40,75,115,150,115,75,40][i]}V${[40,75,115,150,115,75,40][i]}"/>`).join("");
  if (design.symbol === "monogram") mark = `<circle r="170"/><text y="12" fill="url(#logo-ink)" stroke="none" text-anchor="middle" dominant-baseline="middle" font-family="${logoFonts[design.font]}" font-size="140" direction="${rtl(initials)?"rtl":"ltr"}">${escapeXml(initials)}</text>`;
  if (design.symbol === "spark") mark = '<path d="M0-175L32-32L175 0L32 32L0 175L-32 32L-175 0L-32-32Z"/><circle cx="130" cy="-130" r="16"/>';
  if (design.symbol === "sunrise") mark = '<path d="M-170 95H170M-110 70A110 110 0 0 1 110 70M0-120V-160M-100-80L-130-110M100-80L130-110M-150-5L-185-15M150-5L185-15"/>';
  if (design.symbol === "diamond") mark = '<path d="M0-180L180 0L0 180L-180 0ZM0-120L120 0L0 120L-120 0Z"/>';
  const textX = wide ? 1020 : 600, textY = wide ? 263 : 700, maxText = wide ? 960 : 1000;
  const size = Math.max(18, Math.min(wide ? 100 : 104, maxText / Math.max(1, glyphCount(name) * .68)));
  const taglineSize = Math.max(12, Math.min(30, maxText / Math.max(1, glyphCount(design.tagline) * .65)));
  const badge = design.layout === "badge" ? '<circle cx="600" cy="500" r="455" fill="none" stroke="url(#logo-ink)" stroke-width="3" opacity=".65"/>' : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${escapeXml(name)} logo</title><defs><linearGradient id="logo-ink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>${design.transparent?"":`<rect width="${w}" height="${h}" rx="40" fill="${design.palette==="ink"?"#f8f6ef":"#111322"}"/>`}${badge}<g transform="translate(${wide?260:600} ${wide?300:350})" fill="none" stroke="url(#logo-ink)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">${mark}</g><text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" direction="${rtl(name)?"rtl":"ltr"}" font-family="${logoFonts[design.font]}" font-size="${size}" font-weight="700" fill="${a}">${escapeXml(name)}</text><text x="${textX}" y="${textY+size*.85+35}" text-anchor="middle" direction="${rtl(design.tagline)?"rtl":"ltr"}" font-family="Arial, sans-serif" font-size="${taglineSize}" fill="${a}">${escapeXml(design.tagline)}</text></svg>`;
}
export async function logoPng(design: BrandLogo): Promise<Blob> {
  const svg = logoSvg(design), url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve,reject)=>{ image.onload=()=>resolve();image.onerror=()=>reject(new Error("This browser could not render the logo. Download SVG instead."));image.src=url; });
    const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Logo drawing is unavailable. Download SVG instead.");
    ctx.drawImage(image,0,0);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("The PNG could not export. Download SVG instead.")),"image/png"));
  } finally { URL.revokeObjectURL(url); }
}
