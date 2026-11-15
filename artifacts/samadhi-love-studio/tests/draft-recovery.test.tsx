import assert from "node:assert/strict";
import test from "node:test";
import React, { act, useState } from "react";
import { JSDOM } from "jsdom";
import { indexedDB } from "fake-indexeddb";
import { DraftRecoveryProvider, RecoveryPanel, recoveryStore, useDraftRecovery } from "../app/draft-recovery";

const delay = (ms = 25) => new Promise(resolve => setTimeout(resolve, ms));

test("device recovery isolates accounts, flushes navigation changes, and requires explicit restoration", async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  type Value = { text: string; blob?: Blob };
  let controls: { update: (value: Value) => void; recovery: ReturnType<typeof useDraftRecovery<Value>> };
  function Harness({ fail = false }: { fail?: boolean }) {
    const [value, update] = useState<Value>({ text: "" });
    const recovery = useDraftRecovery("test-writing", value, restored => { if (fail) throw new Error("A source is unavailable"); update(restored); }, !!value.text);
    controls = { update, recovery };
    return <><span id="value">{value.text}</span><RecoveryPanel recovery={recovery}/></>;
  }
  let root: ReturnType<typeof createRoot>;
  async function mount(scope: string, fail = false) {
    root = createRoot(document.getElementById("root")!);
    await act(async () => { root.render(<DraftRecoveryProvider scope={scope}><Harness fail={fail}/></DraftRecoveryProvider>); await delay(); });
    await act(async () => { await delay(); });
  }
  async function unmount() { await act(async () => root.unmount()); await delay(); }
  // Missing storage must be reported, not presented as a successful backup.
  await mount("no-storage");
  assert.match(controls!.recovery.status, /unavailable/i);
  await unmount();
  Object.assign(globalThis, { indexedDB });
  await mount("account-a");
  const blob = new Blob(["original take"], { type: "audio/wav" });
  await act(async () => controls!.update({ text: "Unfinished lyrics", blob }));
  // Navigate away before the debounce fires: cleanup still retains the newest input.
  await unmount();
  const copy = await recoveryStore<Value>("account-a:test-writing", "read");
  assert.equal(copy!.value.text, "Unfinished lyrics"); assert.equal(await copy!.value.blob!.text(), "original take");
  await mount("account-b"); assert.equal(controls!.recovery.candidate, null); assert.equal(document.getElementById("value")!.textContent, ""); await unmount();
  await mount("account-a");
  assert(controls!.recovery.candidate); assert.equal(controls!.recovery.ready, false);
  assert.equal(document.getElementById("value")!.textContent, "");
  await act(async () => { await delay(450); });
  assert.equal((await recoveryStore<Value>("account-a:test-writing", "read"))!.value.text, "Unfinished lyrics");
  await act(async () => controls!.recovery.recover());
  assert.equal(document.getElementById("value")!.textContent, "Unfinished lyrics"); assert.equal(controls!.recovery.candidate, null);
  await unmount();
  await mount("account-a", true); await act(async () => controls!.recovery.recover());
  assert(controls!.recovery.candidate); assert.match(controls!.recovery.status, /source is unavailable/); await unmount();
  await mount("account-a");
  // A failed deletion must preserve the offered recovery record and show the error.
  const request = indexedDB.open("samadhi-love-recovery-v1", 1);
  const database = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const prototype = Object.getPrototypeOf(database), originalTransaction = prototype.transaction;
  prototype.transaction = () => { throw new Error("quota/storage unavailable"); };
  await act(async () => controls!.recovery.clear()); assert(controls!.recovery.candidate); assert.match(controls!.recovery.status, /storage unavailable/);
  prototype.transaction = originalTransaction; database.close();
  await act(async () => { controls!.update({ text: "" }); await controls!.recovery.clear(); });
  await unmount(); assert.equal(await recoveryStore("account-a:test-writing", "read"), undefined);
  dom.window.close();
});

test("A/B controls schedule both sources together, switch matched gains, pin a master, and release audio", async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="comparison"></div></body></html>', { url: "https://studio.test" });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement });
  const { createRoot } = await import("react-dom/client");
  const { ProjectComparison } = await import("../app/project-production");
  const { freshSong } = await import("../app/studio-data");
  const originalFetch = globalThis.fetch, originalContext = globalThis.AudioContext;
  const scheduled: { time: number; offset: number; duration: number }[] = [];
  const gains: { gain: { value: number; setTargetAtTime: (value: number) => void }; connect: () => unknown; disconnect: () => void }[] = [];
  let context: FakeContext;
  class FakeContext {
    currentTime = 10; destination = {}; closed = false;
    constructor() { context = this; }
    async resume() {} async close() { this.closed = true; }
    async decodeAudioData(data: ArrayBuffer) { const samples = new Float32Array(64).fill(new Uint8Array(data)[0] ? 0.25 : 0.5); return { duration: 10, numberOfChannels: 1, getChannelData: () => samples }; }
    createGain() { const node = { gain: { value: 0, setTargetAtTime(value: number) { this.value = value; } }, connect() { return this; }, disconnect() {} }; gains.push(node); return node; }
    createBufferSource() { return { buffer: null, onended: null, connect(node: unknown) { return node; }, disconnect() {}, stop() {}, start(time: number, offset: number, duration: number) { scheduled.push({ time, offset, duration }); } }; }
  }
  globalThis.AudioContext = FakeContext as unknown as typeof AudioContext;
  globalThis.fetch = async input => new Response(new Uint8Array([String(input).includes("song=original") ? 0 : 1]));
  const song = { ...freshSong("original", "Original", 0), audioFormat: "mp3" as const, audioId: "source-v1" };
  const mix = { ...freshSong("mix", "Mix", 1), audioFormat: "wav" as const, projectId: song.id };
  let saved: typeof song | undefined;
  const root = createRoot(document.getElementById("comparison")!);
  try {
    await act(async () => root.render(<ProjectComparison songs={[song, mix]} song={song} saving={false} save={async value => { saved = value as typeof song; return true; }}/>));
    const click = async (name: string) => { const button = [...document.querySelectorAll("button")].find(b => b.textContent === name)!; assert(button); await act(async () => { button.click(); await delay(); }); };
    await click("Prepare A/B"); await click("Play comparison");
    assert.equal(scheduled.length, 2); assert.deepEqual(scheduled[0], scheduled[1]); assert.equal(gains[0].gain.value, 0.5); assert.equal(gains[1].gain.value, 0);
    await click("Listen to B"); assert.equal(gains[0].gain.value, 0); assert.equal(gains[1].gain.value, 1);
    context!.currentTime = 11; await click("Pause comparison"); await click("Play comparison");
    assert.deepEqual(scheduled[2], scheduled[3]); assert(scheduled[2].offset > 0);
    await click("Use Mix as final master"); assert.deepEqual((saved as unknown as { master: unknown }).master, { songId: "mix", audioId: "mix" });
    await act(async () => root.unmount()); assert(context!.closed);
  } finally { globalThis.fetch = originalFetch; globalThis.AudioContext = originalContext; dom.window.close(); }
});
