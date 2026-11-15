import test from "node:test";
import assert from "node:assert/strict";
import React, { act, useState } from "react";
import { JSDOM } from "jsdom";
import { AVTimeline } from "../app/av-timeline";
import { newAVSettings, type AVSettings } from "../app/av-timeline-data";
import { freshSong } from "../app/studio-data";
import { newProSettings } from "../app/lyric-pro-data";
import type { MixTrack } from "../app/multitrack-audio";

test("the unified editor imports saved lyrics, maps stems, follows placement and releases playback", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, HTMLAudioElement: dom.window.HTMLAudioElement, IS_REACT_ACT_ENVIRONMENT: true });
  const oldContext = globalThis.AudioContext, started: number[][] = []; let closed = 0;
  const node = () => ({ connect() { return this; }, disconnect() {}, gain: { value: 0 }, frequency: { value: 0 }, Q: { value: 0 }, pan: { value: 0 } });
  class Context {
    currentTime = 0; destination = {}; async resume() {} async close() { closed++; }
    createGain = node; createBiquadFilter = node; createStereoPanner = node;
    createBufferSource() { return { ...node(), start: (...args: number[]) => started.push(args), stop() {} }; }
  }
  Object.assign(globalThis, { AudioContext: Context });
  const samples = new Float32Array(16000).fill(.2), original = { ...freshSong("song", "My original", 0), audioId: "vocal-audio", audioFormat: "wav" as const };
  original.lyricVideo = { ...newAVSettings().look, cues: [{ text: "Love and light", time: .5, end: 1.8 }], pro: { ...newProSettings(original, 2), sourceAudioId: original.audioId } };
  const source: MixTrack = { id: crypto.randomUUID(), name: "Lead stem", start: 0, end: 2, at: 0, level: 1, pan: 0, lowCut: 15, presence: 0, reverb: 0, echo: 0, compression: false, mute: false, solo: false,
    peaks: [.2,.4], buffer: { duration: 2, length: samples.length, sampleRate: 8000, numberOfChannels: 1, getChannelData: () => samples } as unknown as AudioBuffer };
  let settings: AVSettings, updateTrack: (changes: Partial<MixTrack>) => void, deactivate: () => void;
  function Harness() {
    const [s, set] = useState(newAVSettings), [tracks, setTracks] = useState([source]), [active, setActive] = useState(true);
    settings = s; updateTrack = changes => setTracks(items => items.map(t => ({ ...t, ...changes }))); deactivate = () => setActive(false);
    return <AVTimeline active={active} tracks={tracks} settings={s} change={set} patchTrack={(_id, changes) => updateTrack(changes)} songs={[original]} projectId={original.id} title="My visual mix" disabled={false} onBusy={() => {}}/>;
  }
  const { createRoot } = await import("react-dom/client"), root = createRoot(document.getElementById("root")!);
  const button = (text: string) => [...document.querySelectorAll("button")].find(b => b.textContent === text)!;
  try {
    await act(async () => root.render(<Harness/>));
    await act(async () => button("Add stem mapping").click());
    assert.equal(settings!.mappings[0].source, source.id); assert.equal(settings!.mappings[0].target, "light");
    const anchor = [...document.querySelectorAll("select")].find(s => s.options[0]?.textContent === "Choose the matching vocal track")!;
    await act(async () => { anchor.value = source.id; anchor.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    await act(async () => button("Use saved lyrics & look").click());
    assert.equal(settings!.anchor, source.id); assert.equal(settings!.look.cues[0].text, "Love and light"); assert.equal(settings!.reviewed, false);
    await act(async () => updateTrack!({ at: 3 }));
    assert(document.querySelector(".av-cue-lane")!.textContent!.includes("0:03.5"));
    assert.equal(original.lyricVideo!.cues[0].time, .5);
    const preview = document.createElement("audio"); let previewPaused = false;
    preview.pause = () => { previewPaused = true; };
    document.getElementById("root")!.appendChild(preview);
    await act(async () => button("Play mix + visuals").click());
    assert.equal(started[0][0], 3.035); assert.equal(started[0][1], 0);
    assert(previewPaused, "shared playback pauses the separate audio preview");
    await act(async () => preview.dispatchEvent(new dom.window.Event("play")));
    assert(button("Play mix + visuals"), "a separate audio preview stops the shared transport");
    await act(async () => button("Play mix + visuals").click());
    await act(async () => deactivate!()); assert(closed > 0);
    assert(document.body.textContent!.includes("not multiplayer comments"));
    assert(document.body.textContent!.includes("no signatures"));
  } finally { await act(async () => root.unmount()); globalThis.AudioContext = oldContext; dom.window.close(); }
});
