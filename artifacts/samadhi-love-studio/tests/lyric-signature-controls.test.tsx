import assert from "node:assert/strict";
import test from "node:test";
import React, { act, useState } from "react";
import { JSDOM } from "jsdom";
import { SignaturePicker, VisualLayerControls } from "../app/lyric-signature-picker";
import { newProSettings } from "../app/lyric-pro-data";
import { freshSong } from "../app/studio-data";
import type { LyricProject } from "../app/lyric-video-data";

test("signature controls preview before applying, preserve sources, and update layers independently", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, Image: dom.window.Image, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  dom.window.HTMLCanvasElement.prototype.getContext = (() => null) as typeof dom.window.HTMLCanvasElement.prototype.getContext;
  const { createRoot } = await import("react-dom/client");
  const song = { ...freshSong("ui-song", "Original", 0), audioId: "original-audio", audioFormat: "mp3" as const };
  let current: LyricProject = { theme: "cosmic", motion: "drift", format: "vertical", cues: [{ text: "Original lyric", time: 2, end: 5 }], pro: newProSettings(song, 60) };
  let changes = 0;
  function Harness() {
    const [project, setProject] = useState(current);
    const change = (p: LyricProject) => { current = p; changes++; setProject(p); };
    return <><SignaturePicker project={project} change={change} disabled={false}/><VisualLayerControls project={project} change={change} disabled={false} time={4.25}/></>;
  }
  const root = createRoot(document.getElementById("root")!);
  try {
    await act(async () => root.render(<Harness/>));
    assert.equal(document.querySelectorAll(".lvp-signature-grid button").length, 12);
    const button = (label: string) => [...document.querySelectorAll("button")].find(b => b.textContent?.trim() === label)!;
    const choice = [...document.querySelectorAll("button")].find(b => b.querySelector("strong")?.textContent === "Violet Flame")!;
    await act(async () => choice.click()); assert.equal(changes, 0);
    await act(async () => button("Apply Violet Flame").click()); assert.equal(changes, 1);
    assert.equal(current.visualLayers?.overlayStyle, "flame"); assert.equal(current.pro?.sourceAudioId, "original-audio"); assert.equal(current.cues[0].time, 2);
    const originalMotion = current.motion, originalIntensity = current.intensity;
    const toggle = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    await act(async () => toggle.click()); assert.equal(current.visualLayers?.overlayMotion, false);
    assert.equal(current.motion, originalMotion); assert.equal(current.intensity, originalIntensity);
    await act(async () => button("Set animation beat at playhead").click()); assert.equal(current.visualLayers?.beatOffset, 4.25);
    await act(async () => button("Reset beat offset").click()); assert.equal(current.visualLayers?.beatOffset, 0);
    const orbit = [...document.querySelectorAll("button")].find(b => b.querySelector("strong")?.textContent === "Lunar Orbit")!;
    await act(async () => orbit.click()); assert.equal(current.visualLayers?.overlayStyle, "flame");
    await act(async () => button("Apply Lunar Orbit").click()); assert.equal(current.visualLayers?.overlayStyle, "orbit");
    const overlay = document.querySelector(".lvp-layer-controls select") as unknown as HTMLSelectElement;
    assert.equal(overlay.options.length, 13);
    await act(async () => { overlay.value = "petals"; overlay.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    assert.equal(current.visualLayers?.overlayStyle, "petals"); assert.equal(current.pro?.sourceAudioId, "original-audio");
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
