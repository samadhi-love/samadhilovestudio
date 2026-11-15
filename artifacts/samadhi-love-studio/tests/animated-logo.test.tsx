import test from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { defaultBrandLogo, isBrandLogo } from "../app/brand-logo";
import { animatedLogoSvg } from "../app/animated-brand-logo";
import { defaultLogoAnimation, isLogoAnimation, logoNatureScenes, natureSceneFrame, type LogoNatureScene } from "../app/logo-nature-scenes";
import { BrandLogoDesigner } from "../app/brand-logo-designer";
import { freshSong } from "../app/studio-data";
import { isStudio } from "../app/studio-validation";

test("eight distinct nature scenes animate on one repeatable timeline in all formats without external assets", () => {
  const dom = new JSDOM("");
  const designs = new Set<string>();
  for (const scene of Object.keys(logoNatureScenes) as LogoNatureScene[]) for (const format of ["vertical", "wide", "square"] as const) {
    const animation = { ...defaultLogoAnimation, scene, format, logoMotion: "still" as const };
    const design = { ...defaultBrandLogo, name: 'نور & <script>alert(1)</script>', tagline: 'Love <image href="https://evil.test"/>', animation };
    const start = animatedLogoSvg(design, animation, 0), middle = animatedLogoSvg(design, animation, 2.5);
    assert.notEqual(start, middle, "the scenery moves even with a steady logo");
    assert.equal(start, animatedLogoSvg(design, animation, animation.seconds), "loops return to the same frame");
    assert.equal(middle, animatedLogoSvg(design, animation, 2.5), "preview and export frames are repeatable");
    assert(start.length < 100_000); assert(!/NaN|Infinity/.test(start));
    for (const frame of [start, middle, animatedLogoSvg(design, animation, 9.9)]) {
      const doc = new dom.window.DOMParser().parseFromString(frame, "image/svg+xml");
      assert.equal(doc.querySelector("parsererror, script, image, foreignObject"), null);
      assert(doc.querySelector("title")!.textContent!.includes("نور"));
      assert(doc.querySelector('text[direction="rtl"]'));
      assert.equal(doc.documentElement.getAttribute("width"), format === "wide" ? "1920" : "1080");
      assert.equal(doc.documentElement.getAttribute("height"), format === "vertical" ? "1920" : "1080");
    }
    if (format === "square") designs.add(natureSceneFrame(animation, 0).body);
    const frozen = { ...animation, intensity: 0 };
    assert.equal(animatedLogoSvg(design, frozen, 0), animatedLogoSvg(design, frozen, 4));
  }
  assert.equal(designs.size, 8); dom.window.close();
});
test("animation settings remain optional for existing songs and reject unsafe or excessive inputs", () => {
  assert(isBrandLogo(defaultBrandLogo));
  const design = { ...defaultBrandLogo, animation: defaultLogoAnimation };
  const song = { ...freshSong("nature-logo", "Song", 0), logoDesign: design };
  const data = JSON.parse(JSON.stringify({ songs: [song], templates: [] }));
  assert(isStudio(data)); assert.deepEqual(data.songs[0].logoDesign?.animation, defaultLogoAnimation);
  for (const patch of [{ scene: "https://evil.test" }, { seconds: 1800 }, { intensity: NaN }, { intensity: -1 }, { intensity: 2 }, { format: "cinema" }, { logoMotion: "script" }]) {
    assert(!isLogoAnimation({ ...defaultLogoAnimation, ...patch }));
    assert(!isBrandLogo({ ...design, animation: { ...defaultLogoAnimation, ...patch } }));
  }
  assert.throws(() => animatedLogoSvg(design, defaultLogoAnimation, NaN));
});
test("logo creator exposes nature presets, keeps original lettering and recalls choices when switching modes", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client"), root = createRoot(document.getElementById("root")!);
  const button = (text: string) => [...document.querySelectorAll<HTMLButtonElement>("button")].find(el => el.textContent?.trim() === text)!;
  try {
    await act(async () => root.render(<BrandLogoDesigner name="My artist"/>));
    await act(async () => button("Animated nature").click());
    assert.equal(document.querySelectorAll(".logo-nature-card").length, 8);
    await act(async () => document.querySelectorAll<HTMLButtonElement>(".logo-nature-card")[7].click());
    assert(document.querySelector(".nature-logo-frame")!.innerHTML.includes("nature-aurora"));
    assert.equal(document.querySelectorAll('.logo-nature-card[aria-pressed="true"]')[0].querySelector("strong")!.textContent, "Aurora Lake");
    const length = [...document.querySelectorAll("select")].find(el => el.parentElement!.textContent!.startsWith("Clip length"))!;
    await act(async () => { length.value = "15"; length.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    await act(async () => button("Still logo").click());
    assert.equal(document.querySelector(".nature-logo-frame"), null);
    assert(document.querySelector(".brand-logo-preview")!.textContent!.includes("My artist"));
    await act(async () => button("Animated nature").click());
    assert.equal(([...document.querySelectorAll("select")].find(el => el.parentElement!.textContent!.startsWith("Clip length"))!).value, "15");
    assert.equal(document.querySelector('.logo-nature-card[aria-pressed="true"] strong')!.textContent, "Aurora Lake");
    assert(button("Download animated MP4")); assert(document.body.textContent!.includes("silent soundtrack"));
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
