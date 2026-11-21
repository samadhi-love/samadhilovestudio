/** True when the browser lets a page change playback volume (false on iPhone/iPad Safari). */
export function pageVolumeWorks(make: () => { volume: number } = () => document.createElement("audio")) {
  try {
    const probe = make();
    probe.volume = 0.5;
    return Math.abs(probe.volume - 0.5) < 0.01;
  } catch {
    return true;
  }
}
