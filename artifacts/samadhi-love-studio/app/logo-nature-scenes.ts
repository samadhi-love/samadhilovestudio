import type { VideoFormat } from "./lyric-video-data";

export const logoNatureScenes = {
  ocean: { name: "Ocean Light", vibe: "Rolling turquoise waves and a warm coastal sky", sky: ["#204b80", "#f4b9a0"], land: "#143e58", water: "#237f98" },
  forest: { name: "Forest Breeze", vibe: "Swaying evergreens, sunbeams and drifting fireflies", sky: ["#234f56", "#d4dca3"], land: "#193e3b", water: "#427c69" },
  waterfall: { name: "Waterfall Mist", vibe: "Flowing cascades, deep green cliffs and soft mist", sky: ["#213951", "#9ccac7"], land: "#1c4547", water: "#368a9b" },
  lotus: { name: "Lotus Sanctuary", vibe: "Floating lotus flowers and gentle pond ripples", sky: ["#5b6592", "#f6cfba"], land: "#4e696b", water: "#547d8e" },
  mountain: { name: "Golden Peaks", vibe: "Snowy mountains, moving clouds and a sunrise lake", sky: ["#586cac", "#f6c78c"], land: "#465b88", water: "#536e9e" },
  dunes: { name: "Desert Reverie", vibe: "Layered golden dunes and flowing desert wind", sky: ["#5a5987", "#efb583"], land: "#9a625a", water: "#d69a6d" },
  blossom: { name: "Blossom Drift", vibe: "Falling pink petals over a quiet mountain pond", sky: ["#77668d", "#efcad6"], land: "#7c748f", water: "#9b8eaf" },
  aurora: { name: "Aurora Lake", vibe: "Flowing northern lights above a starlit alpine lake", sky: ["#080f2c", "#244964"], land: "#15243c", water: "#143b54" },
} as const;
export type LogoNatureScene = keyof typeof logoNatureScenes;
export type LogoAnimation = { scene: LogoNatureScene; seconds: 6 | 10 | 15; format: VideoFormat; logoMotion: "float" | "breathe" | "still"; intensity: number };
export const defaultLogoAnimation: LogoAnimation = { scene: "lotus", seconds: 10, format: "vertical", logoMotion: "float", intensity: .65 };
export function isLogoAnimation(value: unknown): value is LogoAnimation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as LogoAnimation;
  return Object.hasOwn(logoNatureScenes, v.scene) && [6, 10, 15].includes(v.seconds) && ["vertical", "wide", "square"].includes(v.format) && ["float", "breathe", "still"].includes(v.logoMotion) && Number.isFinite(v.intensity) && v.intensity >= 0 && v.intensity <= 1;
}
const n = (x: number) => Number(x.toFixed(2));
const seed = (i: number) => {
  let x = (Math.trunc(i) * 374761393 + 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const circle = (x: number, y: number, r: number, fill: string, opacity = 1) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" opacity="${n(opacity)}"/>`;
const ellipse = (x: number, y: number, rx: number, ry: number, fill: string, opacity = 1) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" opacity="${n(opacity)}"/>`;
const path = (d: string, fill: string, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const wave = (y: number, a: number, phase: number) => {
  let d = `M-80 ${n(y + Math.sin(phase) * a)}`;
  for (let x = -40; x <= 1080; x += 40) d += `L${x} ${n(y + Math.sin(x / 105 + phase) * a)}`;
  return d;
};
function pine(x: number, base: number, height: number, fill: string, sway = 0) {
  return `<g transform="translate(${n(x)} ${n(base)}) rotate(${n(sway)})"><path d="M0 0V${n(-height)}" stroke="${fill}" stroke-width="5"/>` + [0, 1, 2].map(i => path(`M0 ${n(-height + i * height * .17)}L${n(-height * (.22 + i * .055))} ${n(-height * (.36 - i * .15))}H${n(height * (.22 + i * .055))}Z`, fill)).join("") + "</g>";
}

/** Original, bounded vector scenery. All motion comes from normalized source time. */
export function natureSceneFrame(animation: LogoAnimation, seconds: number) {
  if (!isLogoAnimation(animation) || !Number.isFinite(seconds)) throw new Error("Choose a supported nature animation.");
  const W = 1000, H = animation.format === "vertical" ? 16000 / 9 : animation.format === "wide" ? 562.5 : 1000;
  const p = animation.intensity === 0 ? 0 : ((seconds / animation.seconds) % 1 + 1) % 1;
  const phase = p * Math.PI * 2, strength = animation.intensity, scene = animation.scene, colors = logoNatureScenes[scene];
  const horizon = H * .58;
  const defs = `<linearGradient id="nature-sky" x2="0" y2="1"><stop stop-color="${colors.sky[0]}"/><stop offset="1" stop-color="${colors.sky[1]}"/></linearGradient><linearGradient id="nature-water" x2="0" y2="1"><stop stop-color="${colors.water}"/><stop offset="1" stop-color="${colors.land}"/></linearGradient><radialGradient id="nature-sun"><stop stop-color="#fff6cf" stop-opacity=".7"/><stop offset="1" stop-color="#fff1b1" stop-opacity="0"/></radialGradient><radialGradient id="nature-contrast"><stop stop-color="#080c20" stop-opacity=".72"/><stop offset="1" stop-color="#080c20" stop-opacity="0"/></radialGradient><linearGradient id="nature-aurora" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#82f8df" stop-opacity="0"/><stop offset=".6" stop-color="#89f6d2" stop-opacity=".48"/><stop offset="1" stop-color="#bc9bff" stop-opacity="0"/></linearGradient>`;
  let body = `<rect width="1000" height="${H}" fill="url(#nature-sky)"/>`;
  if (scene !== "aurora") {
    body += circle(760, H * .24, Math.min(230, H * .33), "url(#nature-sun)") + circle(760, H * .24, Math.min(44, H * .07), "#ffedc2", .85);
    for (let i = 0; i < 6; i++) body += ellipse(seed(i + 5) * 1100 - 50 + Math.sin(phase + i) * 30 * strength, H * (.14 + seed(i + 2) * .26), 100 + i * 13, 12 + i * 2, "#fff5e6", .09 + (i % 3) * .035);
  }
  if (["ocean", "lotus", "mountain", "blossom", "aurora"].includes(scene)) {
    for (let layer = 0; layer < 3; layer++) {
      let ridge = `M-40 ${n(horizon)}`;
      for (let x = -40; x <= 1040; x += 90) ridge += `L${x} ${n(horizon - (45 + seed(x + layer * 41) * H * .23) * (1 - layer * .21))}`;
      body += path(ridge + `L1040 ${horizon + 15}H-40Z`, [colors.land, colors.water, colors.land][layer], `opacity="${.27 + layer * .2}"`);
    }
    body += `<rect y="${horizon}" width="1000" height="${H - horizon}" fill="url(#nature-water)"/>`;
    for (let i = 0; i < 20; i++) {
      const y = horizon + (i / 19) ** 1.5 * (H - horizon);
      body += path(wave(y, (2 + i * .42) * strength, phase * 2 + i * .64), "none", `stroke="${scene === "aurora" ? "#8fdfcf" : "#fff1dc"}" stroke-width="${n(1 + i * .09)}" opacity="${n(.06 + (i % 4) * .02)}"`);
    }
  }
  if (scene === "ocean") {
    body += path(`M0 ${H * .45}Q120 ${H * .43} 180 ${H * .65}L70 ${H * .78}H0Z`, "#224f66") + path(`M1000 ${H * .47}Q890 ${H * .42} 812 ${H * .66}L940 ${H * .74}H1000Z`, "#365d73");
    for (let i = 0; i < 7; i++) body += path(wave(H * (.67 + i * .055), (9 + i * 2) * strength, -phase * 2 + i), "none", `stroke="${i % 2 ? "#b3ebe1" : "#77bfcc"}" stroke-width="${3 + i * 1.5}" opacity=".35"`);
    body += path(`M0 ${H}L0 ${H * .94}Q230 ${H * .89} 470 ${H}Z`, "#d6b08c", 'opacity=".65"');
  }
  if (scene === "forest") {
    for (let layer = 0; layer < 3; layer++) body += path(`M0 ${H * (.53 + layer * .15)}Q260 ${H * (.34 + layer * .16)} 570 ${H * (.53 + layer * .15)}T1000 ${H * (.55 + layer * .12)}V${H}H0Z`, ["#709582", "#365d51", "#1f443e"][layer]);
    for (let i = 0; i < 6; i++) body += path(`M780 ${H * .05}L${i * 180 - 100} ${H}H${i * 180 + 30}Z`, "#fff5bf", 'opacity=".026"');
    for (let i = 0; i < 20; i++) body += pine(i < 10 ? i * 33 - 10 : 750 + (i - 10) * 32, H * (.92 + seed(i) * .13), H * (.28 + seed(i + 19) * .27), i % 3 ? "#163b35" : "#285346", Math.sin(phase + i) * strength);
    body += path(`M260 ${H}Q430 ${H * .66} 730 ${H * .65}Q410 ${H * .8} 630 ${H}Z`, "#d2c18c", 'opacity=".24"');
    for (let i = 0; i < 28; i++) body += circle(seed(i + 31) * W + Math.sin(phase + i) * 16 * strength, H * (.25 + seed(i + 29) * .7) + Math.cos(phase * 2 + i) * 12 * strength, 1.4 + seed(i) * 2, "#edffc0", .2 + .5 * Math.abs(Math.sin(phase + i)));
  }
  if (scene === "waterfall") {
    for (let i = 0; i < 5; i++) {
      body += path(`M0 0H${170 + i * 48}L${205 + i * 31} ${H * .35}L${120 + i * 50} ${H * .75}H0Z`, i % 2 ? "#285c58" : "#1b4146", `opacity="${.4 + i * .1}"`);
      body += path(`M1000 0H${830 - i * 45}L${790 - i * 25} ${H * .4}L${870 - i * 44} ${H * .78}H1000Z`, i % 2 ? "#315d54" : "#1d4648", `opacity="${.4 + i * .1}"`);
    }
    body += path(`M434 ${H * .2}Q490 ${H * .16} 563 ${H * .21}L592 ${H * .82}H409Z`, "#a5dcdf", 'opacity=".72"');
    for (let i = 0; i < 16; i++) {
      const x = 438 + i * 7.6, drop = ((p * 3 + seed(i)) % 1) * H * .6;
      body += path(`M${n(x)} ${n(H * .2)}Q${n(x - 7)} ${H * .48} ${n(x + Math.sin(phase + i) * 5 * strength)} ${H * .82}`, "none", 'stroke="#e0fcf5" stroke-width="3" opacity=".34"');
      body += path(`M${n(x)} ${n(H * .2 + drop)}v${n(H * .055)}`, "none", 'stroke="#f3ffff" stroke-width="2" opacity=".6"');
    }
    body += `<rect y="${H * .81}" width="1000" height="${H * .19}" fill="url(#nature-water)"/>`;
    for (let i = 0; i < 9; i++) body += ellipse(300 + i * 48 + Math.sin(phase + i) * 24 * strength, H * (.79 + seed(i) * .05), 88, 17 + i % 4 * 5, "#e2faf0", .07 + (i % 3) * .03);
    for (let i = 0; i < 7; i++) body += ellipse(500, H * (.85 + i * .023), 60 + i * 47 + Math.sin(phase + i) * 8 * strength, 5 + i * 2, "none").replace('fill="none"', 'fill="none" stroke="#a8dfd5" stroke-opacity=".25"');
  }
  if (scene === "lotus") {
    for (let i = 0; i < 6; i++) {
      const x = [105, 835, 270, 720, 430, 945][i], y = H * (.74 + seed(i + 1) * .22) + Math.sin(phase + i) * 4 * strength;
      body += ellipse(x, y + 12, 40 + i % 2 * 18, 9, "#315f5c", .9) + ellipse(x, y + 17, 63, 10, "none").replace('fill="none"', 'fill="none" stroke="#efd7ca" stroke-opacity=".2"');
      for (let petal = -2; petal <= 2; petal++) body += `<g transform="translate(${x} ${n(y)}) rotate(${petal * 25})">${path("M0 8Q-23-13 0-49Q23-13 0 8Z", petal % 2 ? "#dfa0bd" : "#f6cbd3")}</g>`;
      body += circle(x, y - 6, 6, "#f9e3a8");
    }
    for (let i = 0; i < 9; i++) {
      const control = 100 + Math.sin(phase + i) * 10 * strength, end = 80 + i * 17;
      body += path(`M${i * 10} 0Q${control} ${H * .2} ${end} ${H * .46}`, "none", 'stroke="#4f6760" stroke-width="2" opacity=".6"');
      for (let leaf = 1; leaf <= 6; leaf++) {
        const t = leaf / 7, x = (1 - t) ** 2 * i * 10 + 2 * (1 - t) * t * control + t * t * end, y = 2 * (1 - t) * t * H * .2 + t * t * H * .46;
        body += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="5" ry="13" fill="#759079" opacity=".8" transform="rotate(-30 ${n(x)} ${n(y)})"/>`;
      }
    }
  }
  if (scene === "mountain" || scene === "aurora") {
    body += path(`M40 ${horizon}L295 ${H * .18}L505 ${horizon}ZM480 ${horizon}L720 ${H * .13}L1010 ${horizon}Z`, scene === "aurora" ? "#25334b" : "#5b6d99");
    body += path(`M215 ${H * .3}L295 ${H * .18}L377 ${H * .33}L322 ${H * .29}L292 ${H * .31}L270 ${H * .28}ZM639 ${H * .29}L720 ${H * .13}L833 ${H * .32}L758 ${H * .26}L730 ${H * .29}L703 ${H * .25}Z`, scene === "aurora" ? "#7894b1" : "#f4e5df", 'opacity=".83"');
    if (scene === "mountain") for (let i = 0; i < 4; i++) body += ellipse(170 + i * 210 + Math.sin(phase + i) * 55 * strength, H * (.13 + i % 2 * .16), 140, 14, "#fff4e6", .22);
    for (let i = 0; i < 10; i++) body += pine(i < 5 ? i * 24 : 900 + (i - 5) * 28, H, H * (.15 + seed(i) * .14), "#152f40");
  }
  if (scene === "dunes") {
    for (let i = 0; i < 5; i++) {
      const y = H * (.45 + i * .115), bend = Math.sin(phase + i) * strength * 8;
      body += path(`M0 ${n(y)}Q${260 + bend} ${n(y - H * .22)} 570 ${n(y)}T1000 ${n(y - H * .08)}V${H}H0Z`, ["#a98083", "#bc8c7d", "#c79679", "#d9ac6d", "#d8a476"][i]);
      body += path(`M30 ${n(y + H * .028)}Q330 ${n(y - H * .14)} 650 ${n(y + H * .03)}`, "none", 'stroke="#fff0c1" stroke-width="1.5" opacity=".35"');
    }
    for (let i = 0; i < 20; i++) body += path(`M${n(seed(i + 4) * 1000 + Math.sin(phase + i) * 32 * strength)} ${n(H * (.5 + seed(i + 20) * .47))}q42 -9 85 0`, "none", 'stroke="#ffdfae" stroke-width="1" opacity=".23"');
  }
  if (scene === "blossom") {
    for (const side of [0, 1]) {
      body += `<g transform="translate(${side ? 1000 : 0} 0) scale(${side ? -1 : 1} 1)">` + path(`M-20 ${H * .45}Q65 ${H * .2} 340 ${H * .1}M70 ${H * .26}Q100 ${H * .12} 180 0M180 ${H * .16}Q220 ${H * .25} 305 ${H * .25}`, "none", 'stroke="#543e56" stroke-width="9" stroke-linecap="round"');
      for (let i = 0; i < 27; i++) {
        body += `<g transform="translate(${n(30 + seed(i + 8) * 265)} ${n(H * (.04 + seed(i) * .23))})">` + Array.from({ length: 5 }, (_, j) => `<ellipse rx="8" ry="13" cy="-7" fill="${i % 2 ? "#ebafc9" : "#f9dce8"}" transform="rotate(${j * 72})"/>`).join("") + circle(0, 0, 3, "#f1d6a4") + "</g>";
      }
      body += "</g>";
    }
    for (let i = 0; i < 26; i++) {
      const x = seed(i + 19) * 1100 - 50 + Math.sin(phase + i) * 38 * strength, y = ((seed(i + 7) + p) % 1) * (H + 100) - 50;
      body += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${4 + i % 3}" ry="${7 + i % 4}" fill="#ffd5e6" opacity=".7" transform="rotate(${n(Math.sin(phase + i) * 100)} ${n(x)} ${n(y)})"/>`;
    }
  }
  if (scene === "aurora") {
    let curtains = "", stars = "";
    for (let layer = 0; layer < 5; layer++) {
      let d = `M-60 ${H * .08}`;
      for (let x = -60; x <= 1060; x += 35) d += `L${x} ${n(H * (.13 + layer * .025) + Math.sin(x / 160 + phase + layer * .6) * H * .065 * strength)}`;
      for (let x = 1060; x >= -60; x -= 35) d += `L${x} ${n(H * (.36 + layer * .02) + Math.sin(x / 160 + phase + layer * .6) * H * .07 * strength)}`;
      curtains += path(d + "Z", "url(#nature-aurora)");
    }
    for (let i = 0; i < 65; i++) stars += circle(seed(i + 40) * W, seed(i + 10) * horizon * .85, i % 7 ? .9 : 1.9, "#e4e8ff", .25 + Math.abs(Math.sin(phase + i)) * .5);
    body = body.replace(/(<rect width="1000"[^>]+\/>)/, `$1${stars}${curtains}`);
  }
  return { width: W, height: H, defs, body, phase, strength };
}
export function natureSceneSvg(scene: LogoNatureScene) {
  const f = natureSceneFrame({ ...defaultLogoAnimation, scene, format: "wide" }, 0);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 ${f.width} ${f.height}"><defs>${f.defs}</defs>${f.body}</svg>`;
}
