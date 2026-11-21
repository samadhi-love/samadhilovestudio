import { audioTypes } from "../../../studio-data";
import { providerRequest } from "../../../server/ai-provider";

export async function sendProviderAudio(audio: R2ObjectBody, format: keyof typeof audioTypes, key: string,
  fields: Record<string, string>, endpoint: "forced-alignment" | "speech-to-text" | `music/stem-separation?output_format=${"mp3_44100_128" | "mp3_44100_192"}`, signal: AbortSignal) {
  const boundary = "samadhi-" + crypto.randomUUID();
  const encoder = new TextEncoder();
  const prefix = encoder.encode(Object.entries(fields).map(([name, value]) =>
    `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`).join("") +
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="recording.${format}"\r\nContent-Type: ${audioTypes[format]}\r\n\r\n`);
  const suffix = encoder.encode(`\r\n--${boundary}--\r\n`);
  const canceled = new AbortController();
  const uploadSignal = AbortSignal.any([signal, canceled.signal]);
  const stream = new FixedLengthStream(prefix.length + audio.size + suffix.length);
  const pump = (async () => {
    const start = stream.writable.getWriter();
    try { await start.write(prefix); } finally { start.releaseLock(); }
    await audio.body.pipeTo(stream.writable, { preventClose: true, signal: uploadSignal });
    const finish = stream.writable.getWriter();
    try { await finish.write(suffix); await finish.close(); } finally { finish.releaseLock(); }
  })();
  void pump.catch(() => {});
  const response = providerRequest(key, endpoint, {
    method: "POST", redirect: "manual", signal,
    headers: { "Content-Type": "multipart/form-data; boundary=" + boundary },
    body: stream.readable,
  });
  // Let provider rejections surface even when it closes the request before reading the file.
  try {
    const result = await response;
    if (result.ok) await pump;
    else canceled.abort();
    return result;
  } catch (error) {
    canceled.abort();
    throw error;
  }
}

