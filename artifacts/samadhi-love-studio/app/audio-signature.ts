/**
 * Upload safety: confirm an uploaded file really starts like an audio file.
 *
 * The file-type label comes from the browser and can be wrong or faked, so the
 * server looks at the first bytes. Any known audio container is accepted (a
 * phone may save M4A audio under a different label); anything else — web
 * pages, images, programs, documents — is refused before it is stored.
 */
export const signatureBytes = 12;
export const notAudioMessage =
  "This file doesn't look like audio. Choose an MP3, WAV, M4A, FLAC, OGG, OPUS or WebM recording.";

const ascii = (bytes: Uint8Array, offset: number, text: string) =>
  [...text].every((char, index) => bytes[offset + index] === char.charCodeAt(0));

/** True when the first bytes match a supported audio container. */
export function looksLikeAudio(head: Uint8Array): boolean {
  if (head.byteLength < 4) return false;
  if (ascii(head, 0, "ID3")) return true; // MP3 (or FLAC) with tags
  if (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return true; // MP3/AAC frame sync
  if ((ascii(head, 0, "RIFF") || ascii(head, 0, "RF64")) && ascii(head, 8, "WAVE")) return true; // WAV
  if (ascii(head, 4, "ftyp")) return true; // M4A / MP4 audio
  if (ascii(head, 0, "fLaC")) return true; // FLAC
  if (ascii(head, 0, "OggS")) return true; // OGG / OPUS
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return true; // WebM
  return false;
}

export class NotAudioError extends Error {
  constructor() {
    super(notAudioMessage);
    this.name = "NotAudioError";
  }
}

/**
 * Passes the upload through unchanged, but stops it with NotAudioError if the
 * first bytes are not audio. Files shorter than the check window can't hold
 * playable audio or anything harmful, and pass through (tests rely on this).
 * `refused` stays true afterwards, so the caller can tell this apart from a
 * storage error even if storage reports its own error first.
 */
export function audioSignatureCheck(): TransformStream<Uint8Array, Uint8Array> & {readonly refused: boolean} {
  let head = new Uint8Array(0);
  let checked = false;
  const check = () => {
    checked = true;
    if (!looksLikeAudio(head)) {
      refused = true;
      throw new NotAudioError();
    }
  };
  let refused = false;
  const stream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (!checked) {
        const needed = signatureBytes - head.byteLength;
        const joined = new Uint8Array(head.byteLength + Math.min(needed, chunk.byteLength));
        joined.set(head);
        joined.set(chunk.subarray(0, needed), head.byteLength);
        head = joined;
        if (head.byteLength >= signatureBytes) check();
      }
      controller.enqueue(chunk);
    },
  });
  return Object.defineProperty(stream, "refused", {get: () => refused}) as TransformStream<Uint8Array, Uint8Array> & {
    readonly refused: boolean;
  };
}
