import type { Party, PartyTrack } from "./data";
export type CachedParty = { party: Party; tracks: PartyTrack[] };
export type OfflineData = {
  used: number;
  files: { track: PartyTrack; blob: Blob }[];
  parties: CachedParty[];
};
export type Engine = {
  length: number;
  buffers: AudioBuffer[];
  playing: boolean;
  prepare: (
    party: Party,
    tracks: PartyTrack[],
    loader: (track: PartyTrack) => Promise<Blob>,
    progress: (text: string) => void,
  ) => Promise<void>;
  play: () => void;
  pause: () => void;
  seek: (value: number) => void;
  position: () => number;
  setVolume: (value: number) => void;
  render: () => Promise<AudioBuffer>;
  close: () => void;
};
export type Runtime = {
  PartyEngine: new () => Engine;
  offlineData: (viewer: string) => Promise<OfflineData>;
  cacheParty: (
    viewer: string,
    party: Party,
    tracks: PartyTrack[],
    loader: (track: PartyTrack) => Promise<Blob>,
  ) => Promise<void>;
  removeOffline: (viewer: string, partyId: string) => Promise<void>;
  loadAudio: (viewer: string, track: PartyTrack) => Promise<Blob>;
  fetchAudio: (track: PartyTrack, video?: boolean) => Promise<Blob>;
  estimateTempo: (buffer: AudioBuffer) => number;
  zipFiles: (files: { name: string; blob: Blob }[]) => Promise<Blob>;
  download: (blob: Blob, name: string) => void;
};
declare global {
  interface Window {
    SamadhiPartyRuntime?: Runtime;
  }
}
let loading: Promise<Runtime> | undefined;
export function partyRuntime(): Promise<Runtime> {
  if (window.SamadhiPartyRuntime)
    return Promise.resolve(window.SamadhiPartyRuntime);
  if (loading) return loading;
  loading = new Promise<Runtime>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/party-runtime.js";
    script.onload = () =>
      window.SamadhiPartyRuntime
        ? resolve(window.SamadhiPartyRuntime)
        : reject(new Error("Party audio could not initialize."));
    script.onerror = () => {
      loading = undefined;
      script.remove();
      reject(new Error("Party audio could not load. Refresh and try again."));
    };
    document.head.appendChild(script);
  });
  return loading;
}
