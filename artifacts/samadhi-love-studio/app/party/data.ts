export const vibes = [
  "meditation",
  "high-energy",
  "Arabic fusion",
  "chill",
  "uplifting",
];
export const sources = [
  "Original catalog",
  "Jamendo",
  "Free Music Archive",
  "ccMixter",
] as const;
export type Source = (typeof sources)[number];
export type PartyTrack = {
  id: string;
  title: string;
  artist: string;
  source: Source;
  seconds: number;
  bpm: number;
  tags: string[];
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  attribution: string;
  format: string;
  video: boolean;
  private?: boolean;
  revision: string;
};
export type Party = {
  files?:import("./file-data").PartyFile[];
  fileMix?:{songId:string;audioId:string;seconds:number;key:string};
  id: string;
  name: string;
  tags: string[];
  cover: string;
  tracks: string[];
  fade: number;
  beatmatch: boolean;
  tempos: Record<string, number>;
  published: boolean;
  revision: number;
  featured?: boolean;
  artist?: string;
  likes?: number;
  liked?: boolean;
  mine?: boolean;
};
export type PartyComment = {
  id: string;
  body: string;
  mine: boolean;
  pending: boolean;
};
export type PartyData = {
  creator?:boolean;
  viewer: string;
  admin: boolean;
  tracks: PartyTrack[];
  parties: Party[];
  feed: Party[];
  library: (PartyTrack & { active: boolean })[];
  comments: Record<string, PartyComment[]>;
  message?: string;
};
export const mediaUrl = (track: PartyTrack, video = false) =>
  "/api/party/media?id=" +
  encodeURIComponent(track.id) +
  "&v=" +
  encodeURIComponent(track.revision) +
  (video ? "&video=1" : "");
export const offlineLimit = 200 * 1024 * 1024;
export function attribution(track: PartyTrack) {
  return `${track.title} — ${track.artist}\nSource: ${track.sourceUrl}\nLicense: ${track.license} ${track.licenseUrl}\n${track.attribution}`;
}
// Admit licenses whose adaptation conditions can be carried through a mixed set.
export function mixLicense(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.port
    )
      return null;
    if (
      !["creativecommons.org", "www.creativecommons.org"].includes(
        parsed.hostname,
      )
    )
      return null;
    if (/^\/publicdomain\/zero\/1\.0\/?$/.test(parsed.pathname))
      return "CC0 1.0";
    const match = /^\/licenses\/by\/(1\.0|2\.0|2\.5|3\.0|4\.0)\/?$/.exec(
      parsed.pathname,
    );
    return match ? "CC BY " + match[1] : null;
  } catch {
    return null;
  }
}
export const blankParty = (): Party => ({
  id: crypto.randomUUID(),
  name: "",
  tags: [],
  cover: "solar",
  tracks: [],
  fade: 6,
  beatmatch: false,
  tempos: {},
  published: false,
  revision: 0,
});
