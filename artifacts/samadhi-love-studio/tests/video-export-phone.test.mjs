// Phone-safe video export: streams to private storage with or without createWritable.
// Runs in plain Node (22.18+ strips TypeScript types).
import test from "node:test";
import assert from "node:assert/strict";
import {createVideoFile, keepScreenAwake, noDiskExport, maxVideoBytes} from "../app/video-export-storage.ts";

/** In-memory stand-in for the browser's private file storage. */
function fakeStorage({writable}) {
  const files = new Map();
  const bytes = (name) => files.get(name) ?? new Uint8Array();
  const put = (name, position, data) => {
    const current = bytes(name);
    const next = new Uint8Array(Math.max(current.byteLength, position + data.byteLength));
    next.set(current);
    next.set(data, position);
    files.set(name, next);
  };
  const handle = (name) => ({
    ...(writable && {
      async createWritable() {
        return {
          async write({position, data}) { put(name, position, data); },
          async close() {},
          async abort() {},
        };
      },
    }),
    async getFile() { return new Blob([bytes(name)]); },
  });
  const root = {
    async getFileHandle(name) { if (!files.has(name)) files.set(name, new Uint8Array()); return handle(name); },
    async removeEntry(name) { files.delete(name); },
  };
  const workers = [];
  const makeWorker = () => {
    let open;
    const worker = {
      onmessage: null, onerror: null, terminated: false,
      postMessage(message, transfer) {
        if (message.op === "write") assert.ok(transfer.includes(message.data), "write buffers are transferred, not copied");
        queueMicrotask(() => {
          let reply = {id: message.id, ok: true};
          if (message.op === "open") open = message.name;
          else if (message.op === "write") put(open, message.position, new Uint8Array(message.data));
          else if (message.op === "close" || message.op === "abort") open = undefined;
          worker.onmessage?.({data: reply});
        });
      },
      terminate() { worker.terminated = true; },
    };
    workers.push(worker);
    return worker;
  };
  let pageHide;
  const env = {
    getDirectory: async () => root,
    makeWorker,
    randomId: () => "id" + files.size,
    onPageHide: (listener) => { pageHide = listener; },
  };
  return {env, files, workers, hidePage: () => pageHide?.()};
}

async function writeVideo(file) {
  const writer = file.stream.getWriter();
  await writer.write({type: "write", position: 0, data: new Uint8Array([1, 2, 3, 4])});
  await writer.write({type: "write", position: 4, data: new Uint8Array([5, 6])});
  await writer.write({type: "write", position: 1, data: new Uint8Array([9])}); // MP4 header patch
  await writer.close();
  return new Uint8Array(await (await file.finish()).arrayBuffer());
}

test("computer browsers stream through createWritable", async () => {
  const {env, workers} = fakeStorage({writable: true});
  const file = await createVideoFile(env);
  assert.equal(file.mode, "writable");
  assert.deepEqual([...(await writeVideo(file))], [1, 9, 3, 4, 5, 6]);
  assert.equal(workers.length, 0);
});

test("iPhone Safari without createWritable streams through the worker", async () => {
  const {env, workers} = fakeStorage({writable: false});
  const file = await createVideoFile(env);
  assert.equal(file.mode, "worker");
  assert.deepEqual([...(await writeVideo(file))], [1, 9, 3, 4, 5, 6]);
  assert.equal(workers[0].terminated, true, "worker is shut down after finishing");
});

test("real-time recorder chunks append in order on the worker path", async () => {
  const {env} = fakeStorage({writable: false});
  const file = await createVideoFile(env);
  await file.write(new Blob([new Uint8Array([1, 2])]));
  await file.write(new Blob([new Uint8Array([3])]));
  const blob = await file.finish("video/webm");
  assert.equal(blob.type, "video/webm");
  assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())], [1, 2, 3]);
});

test("cancelled or hidden exports leave no file behind", async () => {
  const {env, files, hidePage} = fakeStorage({writable: false});
  const file = await createVideoFile(env);
  await file.write(new Blob([new Uint8Array([1])]));
  await file.dispose();
  assert.equal(files.size, 0);
  const second = await createVideoFile(env);
  await second.write(new Blob([new Uint8Array([1])]));
  await second.finish();
  assert.equal(files.size, 1);
  hidePage();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(files.size, 0);
});

test("oversized videos are refused before writing", async () => {
  const {env} = fakeStorage({writable: false});
  const file = await createVideoFile(env);
  const writer = file.stream.getWriter();
  await assert.rejects(
    writer.write({type: "write", position: maxVideoBytes, data: new Uint8Array([1])}),
    /512 MB/,
  );
});

test("browsers with no private storage get a clear message", async () => {
  await assert.rejects(
    createVideoFile({randomId: () => "x", onPageHide() {}}),
    (error) => error.message === noDiskExport,
  );
  const {env, files} = fakeStorage({writable: false});
  await assert.rejects(createVideoFile({...env, makeWorker: undefined}), (error) => error.message === noDiskExport);
  assert.equal(files.size, 0, "the empty file is removed");
});

test("screen stays awake during export and is released; refusal never blocks export", async () => {
  let released = false;
  const release = await keepScreenAwake({
    wakeLock: {request: async (kind) => { assert.equal(kind, "screen"); return {release: async () => { released = true; }}; }},
  });
  release();
  assert.equal(released, true);
  const noLock = await keepScreenAwake({wakeLock: {request: async () => { throw new Error("denied"); }}});
  noLock();
  (await keepScreenAwake({}))();
});
