/** Messages between the page and video-export-writer.worker.ts. */
export type WriterRequest =
  | {id: number; op: "open"; name: string}
  | {id: number; op: "write"; position: number; data: ArrayBuffer}
  | {id: number; op: "close"}
  | {id: number; op: "abort"};

export type WriterReply = {id: number; ok: true} | {id: number; ok: false; error: string};

/** Distributes Omit over the union so each request keeps its own fields. */
export type WriterCommand = WriterRequest extends infer R
  ? R extends {id: number}
    ? Omit<R, "id">
    : never
  : never;
