/**
 * Writes an exported video into private browser storage (OPFS) from a worker.
 *
 * Used when the page itself cannot open a writable file stream
 * (`createWritable` is missing — older iPhone/iPad Safari). Workers can use
 * `createSyncAccessHandle`, which every OPFS browser supports, so the video is
 * still streamed to disk and never held whole in memory.
 */
import type {WriterReply, WriterRequest} from "./video-export-writer-protocol";

/** Minimal shape of the worker-only sync handle (kept local so the page's DOM types don't clash). */
type SyncAccess = {
  write(data: Uint8Array, options: {at: number}): number;
  truncate(size: number): void;
  flush(): void;
  close(): void;
};
let access: SyncAccess | undefined;

function reply(message: WriterReply) {
  (self as unknown as {postMessage(message: WriterReply): void}).postMessage(message);
}

self.onmessage = async (event: MessageEvent<WriterRequest>) => {
  const request = event.data;
  try {
    switch (request.op) {
      case "open": {
        const root = await navigator.storage.getDirectory();
        const handle = await root.getFileHandle(request.name, {create: true});
        access = await (handle as unknown as {createSyncAccessHandle(): Promise<SyncAccess>}).createSyncAccessHandle();
        access.truncate(0);
        break;
      }
      case "write": {
        if (!access) throw new Error("The video file is not open.");
        const data = new Uint8Array(request.data);
        let written = 0;
        while (written < data.byteLength) {
          const count = access.write(data.subarray(written), {at: request.position + written});
          if (count <= 0) throw new Error("The device ran out of space while saving the video.");
          written += count;
        }
        break;
      }
      case "close": {
        access?.flush();
        access?.close();
        access = undefined;
        break;
      }
      case "abort": {
        try {
          access?.close();
        } finally {
          access = undefined;
        }
        break;
      }
    }
    reply({id: request.id, ok: true});
  } catch (error) {
    reply({
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : "Saving the video failed.",
    });
  }
};
