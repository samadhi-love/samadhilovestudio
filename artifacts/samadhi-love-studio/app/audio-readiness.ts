import { measureAudio } from "./audio-measurements";
import type { PCMSource, ExportTask } from "./audio-export-pcm";
export type AudioReadiness = { duration: number; sampleRate: number; channels: number; peakDb: number | null; rmsDb: number | null; clipped: number; leadingQuiet: number; trailingQuiet: number; silent: boolean; correlation: number | null; monoChangeDb: number | null; monoCancelled: boolean; dcOffset: number; warnings: string[] };
const db = (n: number) => n > 0 ? 20 * Math.log10(n) : null;
/** Decoded-source checks, not LUFS, true-peak measurement or automatic mastering. */
export async function checkAudioReadiness(audio: PCMSource, task: ExportTask = {}): Promise<AudioReadiness> {
  const count = audio.length, rate = audio.sampleRate, channels = audio.numberOfChannels;
  if (![1,2].includes(channels) || !Number.isInteger(count) || count < 1 || !Number.isInteger(rate) || rate < 8000 || rate > 192000 || count / rate > 600 || count * channels * 4 > 256 * 1024 * 1024) throw new Error("Check a mono or stereo recording up to 10 minutes.");
  const data = Array.from({ length: channels }, (_, c) => audio.getChannelData(c));
  if (data.some(c => c.length !== count)) throw new Error("Audio channel lengths do not match.");
  let peak = 0, energy = 0, clipped = 0, first = -1, last = -1, leftSum = 0, rightSum = 0, leftEnergy = 0, rightEnergy = 0, cross = 0;
  for (let start = 0; start < count; start += 32768) {
    if (task.signal?.aborted) throw new DOMException("Audio check cancelled.", "AbortError");
    const end = Math.min(count, start + 32768), measured = measureAudio({ numberOfChannels: channels, sampleRate: rate, getChannelData: c => data[c].subarray(start, end) });
    peak = Math.max(peak, Number.isFinite(measured.peakDb) ? 10 ** (measured.peakDb / 20) : 0); energy += Number.isFinite(measured.rmsDb) ? 10 ** (measured.rmsDb / 10) * (end - start) * channels : 0; clipped += measured.clipped;
    for (let i = start; i < end; i++) {
      const l = data[0][i], r = channels === 2 ? data[1][i] : l;
      if (Math.max(Math.abs(l), Math.abs(r)) >= .001) { if (first < 0) first = i; last = i; }
      leftSum += l; rightSum += r; leftEnergy += l*l; rightEnergy += r*r; cross += l*r;
    }
    task.progress?.(end / count); await new Promise(resolve => setTimeout(resolve, 0));
  }
  if (task.signal?.aborted) throw new DOMException("Audio check cancelled.", "AbortError");
  const rms = Math.sqrt(energy / (count * channels)), duration = count / rate, silent = first < 0;
  const leftVariance = Math.max(0, leftEnergy - leftSum*leftSum/count), rightVariance = Math.max(0, rightEnergy - rightSum*rightSum/count);
  const correlation = channels === 2 && leftVariance > 1e-12 && rightVariance > 1e-12 ? Math.max(-1, Math.min(1, (cross-leftSum*rightSum/count)/Math.sqrt(leftVariance*rightVariance))) : null;
  const monoEnergy = Math.max(0,(leftEnergy + rightEnergy + 2*cross)/4), stereoEnergy = (leftEnergy+rightEnergy)/2;
  const monoCancelled = channels === 2 && !silent && stereoEnergy > 1e-12 && monoEnergy <= 1e-12;
  const monoChangeDb = channels === 2 && stereoEnergy > 1e-12 && !monoCancelled ? db(Math.sqrt(monoEnergy/stereoEnergy)) : null;
  const dcOffset = Math.max(Math.abs(leftSum/count),Math.abs(rightSum/count));
  const leadingQuiet = silent ? duration : first/rate, trailingQuiet = silent ? duration : (count-1-last)/rate;
  const warnings: string[] = [];
  if (silent) warnings.push("No samples exceed -60 dBFS. Check whether this quiet or silent recording is intentional.");
  if (clipped) warnings.push(`${clipped.toLocaleString()} sample(s) reach or exceed full scale. Listen for distortion and consider lowering the mix level before rendering again.`);
  else if (peak >= .999) warnings.push("Very little sample-peak headroom remains. Check the final encoded file for overs or distortion.");
  if (!silent && leadingQuiet >= 2) warnings.push(`${leadingQuiet.toFixed(1)} seconds of opening audio stays below -60 dBFS. Review whether that lead-in is intended.`);
  if (!silent && trailingQuiet >= 3) warnings.push(`${trailingQuiet.toFixed(1)} seconds of ending audio stays below -60 dBFS. Review whether that tail is intended.`);
  if (monoCancelled || (monoChangeDb !== null && monoChangeDb < -9)) warnings.push("The stereo signal loses substantial level when combined to mono. Listen on speakers; binaural or other headphone-specific designs may intentionally differ.");
  if (channels === 2 && !silent && Math.min(leftEnergy,rightEnergy) < Math.max(leftEnergy,rightEnergy)*.001) warnings.push("One stereo channel has much less energy than the other. Check channel routing and intended panning.");
  if (dcOffset > .01) warnings.push("A noticeable DC offset is present. Review the source or use appropriate DC-removal processing before delivery.");
  return { duration, sampleRate: rate, channels, peakDb: db(peak), rmsDb: db(rms), clipped, leadingQuiet, trailingQuiet, silent, correlation, monoChangeDb, monoCancelled, dcOffset, warnings };
}
