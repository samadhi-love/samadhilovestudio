export async function encodeMp3(audio: AudioBuffer) {
  const { AudioBufferSource, BufferTarget, Mp3OutputFormat, Output, canEncodeAudio } = await import("mediabunny");
  if (!await canEncodeAudio("mp3")) {
    const { registerMp3Encoder } = await import("@mediabunny/mp3-encoder");
    registerMp3Encoder();
  }
  const output = new Output({ format: new Mp3OutputFormat(), target: new BufferTarget() });
  const source = new AudioBufferSource({ codec: "mp3", bitrate: 192_000 });
  output.addAudioTrack(source);
  await output.start();
  try {
    await source.add(audio);
    source.close();
    await output.finalize();
    if (!output.target.buffer?.byteLength) throw new Error("The MP3 encoder returned an empty file.");
    return new Blob([output.target.buffer], { type: "audio/mpeg" });
  } catch (error) {
    await output.cancel().catch(() => {});
    throw error;
  }
}
