import test from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { performanceWeight, performedText } from "../app/song-opening";
import { AudioPlayer } from "../app/audio-player";

test("performance allocation counts sung multilingual words and excludes section and direction scaffolding", () => {
  const words = "نور وحب Love and light свет aşk 愛";
  assert(performanceWeight(words) > 0);
  assert.equal(performanceWeight("[Intro]\n{soft instrumental}\n[Verse 1]\n" + words), performanceWeight(words));
  assert.equal(performanceWeight("[Intro]\n[Chorus]\n{Whisper slowly}"), 0);
  assert.equal(performedText("[Verse]\nنور وحب"), "نور وحب");
});

test("playback reports starting and buffering, retries failure and resets for another recording", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(document.getElementById("root")!);
  let resolvePlay: () => void = () => {}, rejectPlay: (error: Error) => void = () => {}, pauses = 0;
  dom.window.HTMLMediaElement.prototype.play = function () { return new Promise<void>((resolve, reject) => { resolvePlay = resolve; rejectPlay = reject; }); };
  dom.window.HTMLMediaElement.prototype.pause = function () { pauses++; this.dispatchEvent(new dom.window.Event("pause")); };
  dom.window.HTMLMediaElement.prototype.load = function () {};
  const button = (name: string) => [...document.querySelectorAll("button")].find(b => b.textContent?.trim() === name)!;
  const status = () => document.querySelector('[role="status"]')?.textContent;
  try {
    await act(async () => root.render(<AudioPlayer src="/first.mp3" label="First"/>));
    await act(async () => button("Play").click());
    assert.equal(status(), "Starting audio…");
    const audio = document.querySelector("audio")!;
    Object.defineProperty(audio, "paused", { configurable: true, value: false });
    await act(async () => { audio.dispatchEvent(new dom.window.Event("play")); audio.dispatchEvent(new dom.window.Event("waiting")); });
    assert.equal(status(), "Buffering audio…");
    await act(async () => { audio.dispatchEvent(new dom.window.Event("playing")); resolvePlay(); });
    assert.equal(status(), undefined);
    Object.defineProperty(audio, "duration", { configurable: true, value: 240 });
    await act(async () => { audio.dispatchEvent(new dom.window.Event("durationchange")); audio.currentTime = 80; audio.dispatchEvent(new dom.window.Event("timeupdate")); });
    assert.match(document.querySelector(".song-seek")!.textContent!, /1:20/);
    await act(async () => button("Pause").click());
    assert(pauses > 0);
    await act(async () => button("Play").click());
    // The old play promise may fail after a different song is loaded.
    const staleReject = rejectPlay;
    await act(async () => root.render(<AudioPlayer src="/second.mp3" label="Second"/>));
    await act(async () => staleReject(new Error("old source failed")));
    assert.equal(document.querySelector('[role="alert"]'), null);
    assert.equal(status(), undefined);
    assert.equal(document.querySelector<HTMLInputElement>('[aria-label="Seek"]')!.disabled, true);
    assert.equal(document.querySelector(".song-seek")!.textContent, "0:000:00");
    await act(async () => button("Play").click());
    await act(async () => rejectPlay(new Error("network failure")));
    assert(document.querySelector('[role="alert"]'));
    await act(async () => button("Retry playback").click());
    assert.equal(document.querySelector('[role="alert"]'), null);
    await act(async () => button("Pause").click());
    assert.equal(status(), undefined);
    await act(async () => resolvePlay());
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
