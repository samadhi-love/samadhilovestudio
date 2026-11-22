/** Checks the first bytes of an uploaded picture, so a file only claiming to be an image is refused. */
export class NotImageError extends Error {
  constructor() { super("That file isn't a PNG, JPEG or WebP picture."); this.name = "NotImageError"; }
}
export function looksLikeImage(head: Uint8Array, type: string) {
  const at = (bytes: number[], from = 0) => bytes.every((byte, i) => head[from + i] === byte);
  if (type === "image/png") return at([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (type === "image/jpeg") return at([0xff, 0xd8, 0xff]);
  if (type === "image/webp") return at([0x52, 0x49, 0x46, 0x46]) && at([0x57, 0x45, 0x42, 0x50], 8);
  return false;
}
/** A pass-through stream that stops the upload as soon as the start of the file is not the claimed picture type. */
export function imageSignatureCheck(allowed: string[]) {
  const ok = (head: Uint8Array) => allowed.some(type => looksLikeImage(head, type));
  let head = new Uint8Array(0), checked = false;
  const state = { refused: false };
  const refuse = (controller: TransformStreamDefaultController<Uint8Array>) => { state.refused = true; controller.error(new NotImageError()); };
  const stream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (!checked) {
        const joined = new Uint8Array(head.length + chunk.length); joined.set(head); joined.set(chunk, head.length); head = joined;
        if (head.length < 12) return;
        checked = true;
        if (!ok(head)) { refuse(controller); return; }
        controller.enqueue(head); return;
      }
      controller.enqueue(chunk);
    },
    flush(controller) {
      if (checked) return;
      if (!ok(head)) { refuse(controller); return; }
      controller.enqueue(head);
    },
  });
  return Object.assign(stream, { state });
}
