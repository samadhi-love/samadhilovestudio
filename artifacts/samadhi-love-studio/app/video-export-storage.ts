import type {WriterCommand, WriterReply, WriterRequest} from "./video-export-writer-protocol";

/**
 * Disk-backed browser output. Never builds a full MP4 ArrayBuffer.
 *
 * The video is streamed into private browser storage (OPFS). Two ways to write:
 * 1. "writable" — the page opens a writable stream (Chrome, Edge, Firefox, new Safari).
 * 2. "worker"   — a small worker writes with a sync access handle. This is the
 *                 path for iPhone/iPad Safari versions without `createWritable`.
 */
export const maxVideoBytes = 512 * 1024 * 1024;
const tooLarge = "This video exceeds 512 MB. Choose 720p or a shorter excerpt and retry.";
export const noDiskExport =
  "This browser can't save a full video while exporting. On iPhone or iPad, update iOS and use Safari with Private Browsing off — or export on a computer.";
const storageClosed = "Browser storage could not open. Free device space or turn off private browsing, then retry.";

type WorkerLike = {
  postMessage(message: WriterRequest, transfer: Transferable[]): void;
  onmessage: ((event: {data: WriterReply}) => void) | null;
  onerror: ((event: unknown) => void) | null;
  terminate(): void;
};

/** Everything the browser provides, injectable so tests can run in Node. */
export type VideoFileEnv = {
  getDirectory?: () => Promise<FileSystemDirectoryHandle>;
  makeWorker?: () => WorkerLike;
  randomId: () => string;
  onPageHide: (listener: () => void) => void;
};

type Sink = {
  mode: "writable" | "worker";
  writeAt(position: number, data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
};

function browserEnv(): VideoFileEnv {
  const storage = typeof navigator !== "undefined" ? navigator.storage : undefined;
  return {
    getDirectory: storage?.getDirectory ? () => storage.getDirectory() : undefined,
    makeWorker:
      typeof Worker === "undefined"
        ? undefined
        : () =>
            new Worker(new URL("./video-export-writer.worker.ts", import.meta.url), {
              type: "module",
            }) as unknown as WorkerLike,
    randomId: () => crypto.randomUUID(),
    onPageHide: (listener) => window.addEventListener("pagehide", listener, {once: true}),
  };
}

async function openWritableSink(handle: FileSystemFileHandle): Promise<Sink | undefined> {
  if (typeof (handle as {createWritable?: unknown}).createWritable !== "function") return undefined;
  let writer: FileSystemWritableFileStream;
  try {
    writer = await handle.createWritable();
  } catch {
    return undefined; // Fall through to the worker path.
  }
  return {
    mode: "writable",
    writeAt: (position, data) => writer.write({type: "write", position, data: data as Uint8Array<ArrayBuffer>}),
    close: () => writer.close(),
    abort: () => writer.abort().catch(() => {}),
  };
}

async function openWorkerSink(name: string, makeWorker: () => WorkerLike): Promise<Sink> {
  const worker = makeWorker();
  const pending = new Map<number, {resolve: () => void; reject: (error: Error) => void}>();
  let nextId = 1;
  let broken: Error | undefined;
  worker.onmessage = ({data}) => {
    const waiting = pending.get(data.id);
    if (!waiting) return;
    pending.delete(data.id);
    if (data.ok) waiting.resolve();
    else waiting.reject(new Error(data.error));
  };
  worker.onerror = () => {
    broken = new Error(storageClosed);
    for (const waiting of pending.values()) waiting.reject(broken);
    pending.clear();
  };
  const call = (command: WriterCommand, transfer: Transferable[] = []) =>
    new Promise<void>((resolve, reject) => {
      if (broken) return reject(broken);
      const id = nextId++;
      pending.set(id, {resolve, reject});
      worker.postMessage({...command, id} as WriterRequest, transfer);
    });
  try {
    await call({op: "open", name});
  } catch {
    worker.terminate();
    throw new Error(storageClosed);
  }
  let finished = false;
  return {
    mode: "worker",
    writeAt(position, data) {
      // Copy into a buffer of exactly this chunk, then hand it to the worker
      // without a second copy. The caller may reuse its own buffer.
      const buffer = data.slice().buffer;
      return call({op: "write", position, data: buffer}, [buffer]);
    },
    async close() {
      try {
        await call({op: "close"});
      } finally {
        finished = true;
        worker.terminate();
      }
    },
    async abort() {
      if (finished) return;
      finished = true;
      await call({op: "abort"}).catch(() => {});
      worker.terminate();
    },
  };
}

export async function createVideoFile(env: VideoFileEnv = browserEnv()) {
  if (!env.getDirectory) throw new Error(noDiskExport);
  const root = await env.getDirectory();
  const name = "studio-export-" + env.randomId() + ".mp4";
  const handle = await root.getFileHandle(name, {create: true});
  let sink = await openWritableSink(handle);
  if (!sink && env.makeWorker) {
    try {
      sink = await openWorkerSink(name, env.makeWorker);
    } catch {
      sink = undefined;
    }
  }
  if (!sink) {
    await root.removeEntry(name).catch(() => {});
    throw new Error(env.makeWorker ? storageClosed : noDiskExport);
  }
  const output = sink;
  let closed = false;
  let appendAt = 0;
  const dispose = async () => {
    if (!closed) {
      closed = true;
      await output.abort();
    }
    await root.removeEntry(name).catch(() => {});
  };
  const writeAt = async (position: number, data: Uint8Array) => {
    if (position + data.byteLength > maxVideoBytes) throw new Error(tooLarge);
    await output.writeAt(position, data);
  };
  const close = async () => {
    if (closed) return;
    closed = true;
    await output.close();
  };
  const stream = new WritableStream<{type: "write"; position: number; data: Uint8Array<ArrayBuffer>}>({
    write: (chunk) => writeAt(chunk.position, chunk.data),
    close,
    abort: dispose,
  });
  return {
    stream,
    dispose,
    /** How the file is being written — "worker" means the iPhone-safe path. */
    mode: output.mode,
    /** Appends a recorder chunk (real-time MediaRecorder path). */
    async write(blob: Blob) {
      if (appendAt + blob.size > maxVideoBytes) throw new Error(tooLarge);
      const data = new Uint8Array(await blob.arrayBuffer());
      await writeAt(appendAt, data);
      appendAt += data.byteLength;
    },
    async finish(type = "video/mp4") {
      await close();
      const file = await handle.getFile();
      if (!file.size) throw new Error("No video data was saved. Retry the export.");
      // File.slice retains its disk backing; it does not copy file bytes to JS.
      env.onPageHide(() => {
        void dispose();
      });
      return file.slice(0, file.size, type);
    },
  };
}

/**
 * Keeps the phone screen on during an export, where the browser allows it.
 * A screen that dims and locks hides the page, which stops the export.
 * Returns a function that releases the lock. Never throws.
 */
export async function keepScreenAwake(nav: Navigator | undefined = typeof navigator === "undefined" ? undefined : navigator) {
  let lock: WakeLockSentinel | undefined;
  try {
    lock = await nav?.wakeLock?.request("screen");
  } catch {
    lock = undefined; // Not allowed (low battery, unsupported) — export still runs.
  }
  return () => {
    void lock?.release().catch(() => {});
  };
}

export function assertVideoDuration(actual: number, expected: number) {
  if (!Number.isFinite(actual) || actual <= 0 || Math.abs(actual - expected) > 0.1)
    throw new Error(
      "The exported video is shorter or longer than expected. It was not saved or offered for download. Keep Studio visible and retry the export.",
    );
}
export function codecCompatibility(codec: string) {
  return /(?:avc1|avc3|\bavc\b|h\.?264)/i.test(codec) && /(?:mp4a|\baac\b)/i.test(codec)
    ? codec
    : codec +
        " — Not H.264/AAC: may not play on iPhone or social apps. Use a compatible browser for H.264/AAC.";
}
