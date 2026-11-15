import { checkAudioReadiness } from "./audio-readiness";
import { exportWav, type PCMSource, type ExportTask } from "./audio-export-pcm";
/** Explicit download-only edit. Never changes a saved soundtrack or its caption alignment. */
export async function prepareOpeningTrim(audio: PCMSource, task: ExportTask = {}) {
  const report = await checkAudioReadiness(audio, task);
  if (report.silent || report.leadingQuiet < .5) throw new Error("No removable opening silence was detected. Listen to the original before making manual edits.");
  // Keep a short pre-roll to protect quiet consonants and natural attacks.
  const offset = Math.max(0, Math.floor((report.leadingQuiet - .15) * audio.sampleRate));
  const trimmed: PCMSource = {sampleRate:audio.sampleRate,numberOfChannels:audio.numberOfChannels,length:audio.length-offset,getChannelData:channel=>audio.getChannelData(channel).subarray(offset)};
  const blob = await exportWav(trimmed,24,task);
  return {blob,removedSeconds:offset/audio.sampleRate};
}
