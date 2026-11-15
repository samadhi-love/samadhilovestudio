import { env } from "cloudflare:workers";
import {
  query,
  loadCommunity,
  publicRelease,
  eligibleSong,
} from "../community/store";
import { readStudio } from "../api/studio/store";
import {
  mixLicense,
  type Party,
  type PartyData,
  type PartyTrack,
} from "./data";

type LibraryRow = { id: string; content: string; active: number };
export type LibraryAsset = PartyTrack & {
  audioUrl?: string;
  audioKey?: string;
  videoKey?: string;
  active?: boolean;
};
export async function libraryTracks(admin = false) {
  const rows = await query(
    "select * from party_library " +
      (admin ? "" : "where active = 1 ") +
      "limit 300",
  ).all<LibraryRow>();
  return rows.results.map(
    (row) =>
      ({ ...JSON.parse(row.content), active: !!row.active }) as LibraryAsset,
  );
}
export function publicTrack(track: LibraryAsset): PartyTrack {
  const { audioUrl, audioKey, videoKey, active, ...safe } = track;
  void audioUrl;
  void audioKey;
  void videoKey;
  void active;
  return safe;
}
export async function catalog(viewer: string, personal: boolean) {
  const community = await loadCommunity(viewer, null, null);
  const stationOwner = await query(
    "select owner from listener_station where id = 'subscriber'",
  ).first<string>("owner");
  const tracks: PartyTrack[] = [];
  for (const item of community.releases.slice(0, 48)) {
    const release = await publicRelease(item.id);
    if (
      !release ||
      (release.owner !== viewer && release.owner !== stationOwner)
    )
      continue;
    tracks.push({
      id: "release:" + item.id,
      title: item.title,
      artist: item.artist.name,
      source: "Original catalog",
      seconds:
        release.song.creationSeconds ?? release.song.instrumental?.seconds ?? 0,
      bpm:
        release.song.instrumental?.bpm ?? (Number(release.song.suno?.bpm) || 0),
      tags: item.tags,
      license: "Artist-authorized party playback",
      licenseUrl: "",
      attribution:
        "Original recording. Redistribution requires the artist’s permission.",
      sourceUrl: "/community?song=" + item.id,
      format: release.song.audioFormat!,
      video: false,
      revision: release.recording,
    });
  }
  if (personal) {
    const { data } = await readStudio(viewer);
    for (const song of data?.songs ?? []) {
      if (!eligibleSong(song)) continue;
      tracks.push({
        id: "mine:" + song.id,
        title: song.name,
        artist: song.partySource==="upload"?"My uploads":song.partySource==="recording"?"My recordings":song.partySource==="mix"?"My mixes":"My Originals",
        source: "Original catalog",
        seconds: song.creationSeconds ?? song.instrumental?.seconds ?? 0,
        bpm: song.instrumental?.bpm ?? (Number(song.suno?.bpm) || 0),
        tags: song.tags,
        license: song.partySource==="upload"?"Creator-authorized audio":song.partySource==="recording"?"Your private voice recording":song.partySource==="mix"?"Your private rendered mix":"Your original recording",
        licenseUrl: "",
        sourceUrl: "/creator",
        attribution:
          song.partySource?"Private creator-authorized audio. Sharing or publishing requires the appropriate rights and an explicit action.":"Private original. Publish the song in Community before adding it to a public party.",
        format: song.audioFormat,
        video: false,
        private: true,
        revision: song.audioId ?? song.id,
      });
    }
  }
  return tracks;
}
export type SetRow = {
  id: string;
  owner: string;
  content: string;
  revision: number;
  published: number;
  featured: number;
  artist?: string;
  likes?: number;
  liked?: number;
};
export const setSelect = `select p.*, coalesce(a.name, 'Music lover') as artist,
 (select count(*) from party_likes l where l.party = p.id) as likes,
 (select count(*) from party_likes l where l.party = p.id and l.viewer = ?) as liked
 from party_sets p left join community_artists a on a.owner = p.owner`;
export function publicParty(row: SetRow, viewer: string): Party {
  return {
    ...JSON.parse(row.content),
    revision: row.revision,
    published: !!row.published,
    featured: !!row.featured,
    artist: row.artist ?? "Music lover",
    likes: row.likes ?? 0,
    liked: !!row.liked,
    mine: row.owner === viewer,
  };
}
export async function loadParties(
  viewer: string,
  admin: boolean,
  personal: boolean,
  selected = "",
): Promise<PartyData> {
  const [library, originals, own, feed, comments] = await Promise.all([
    libraryTracks(admin),
    catalog(viewer, personal),
    query(
      setSelect + " where p.owner = ? order by p.updated desc limit 50",
      viewer,
      viewer,
    ).all<SetRow>(),
    query(
      setSelect +
        " where p.published = 1 order by (p.id = ?) desc, p.featured desc, p.updated desc limit 60",
      viewer,
      selected,
    ).all<SetRow>(),
    query(
      `select c.* from party_comments c join party_sets p on p.id = c.party
      where (p.published = 1 or p.owner = ?) and (c.approved = 1 or c.viewer = ? or ? = 1) order by c.created desc limit 150`,
      viewer,
      viewer,
      Number(admin),
    ).all<{
      id: string;
      party: string;
      viewer: string;
      body: string;
      approved: number;
    }>(),
  ]);
  const result: PartyData = {
    creator:personal,
    viewer,
    admin,
    tracks: [
      ...originals,
      ...library
        .filter((t) => t.active && mixLicense(t.licenseUrl))
        .map(publicTrack),
    ],
    library: admin
      ? library.map((t) => ({ ...publicTrack(t), active: !!t.active }))
      : [],
    parties: own.results.map((row) => publicParty(row, viewer)),
    feed: feed.results.map((row) => publicParty(row, viewer)),
    comments: {},
  };
  for (const comment of comments.results) {
    (result.comments[comment.party] ??= []).push({
      id: comment.id,
      body: comment.body,
      mine: comment.viewer === viewer,
      pending: !comment.approved,
    });
  }
  return result;
}
export async function libraryAsset(id: string) {
  const row = await query(
    "select * from party_library where id = ? and active = 1",
    id,
  ).first<LibraryRow>();
  if (!row) return null;
  const track = JSON.parse(row.content) as LibraryAsset;
  return mixLicense(track.licenseUrl) ? track : null;
}
export async function providerJson(url: string) {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(18000),
      redirect: "error",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error(
      "The music source could not be reached from this server. Check outbound HTTPS access or use a reviewed upload.",
    );
  }
  if (!response.ok)
    throw new Error(
      "The music source is unavailable (" +
        response.status +
        "). Try again later.",
    );
  const raw = await response.text();
  if (raw.length > 1_000_000)
    throw new Error("The source response is too large.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "The music source did not return readable metadata. Try a reviewed upload.",
    );
  }
}
export async function jamendoTrack(id: string): Promise<LibraryAsset> {
  if (!env.JAMENDO_CLIENT_ID)
    throw new Error(
      "Configure JAMENDO_CLIENT_ID in the server environment to import Jamendo music.",
    );
  const params = new URLSearchParams({
    client_id: env.JAMENDO_CLIENT_ID,
    id,
    format: "json",
    limit: "1",
    audiodlformat: "mp32",
    include: "musicinfo+licenses",
  });
  const data = await providerJson(
    "https://api.jamendo.com/v3.0/tracks/?" + params,
  );
  const track = data.results?.[0];
  if (
    !track ||
    track.audiodownload_allowed !== true ||
    !mixLicense(track.license_ccurl)
  )
    throw new Error(
      "This track does not allow downloads under CC BY or CC0. Choose another track.",
    );
  const audio = new URL(track.audiodownload);
  if (
    audio.protocol !== "https:" ||
    !/(^|\.)jamendo\.com$/.test(audio.hostname)
  )
    throw new Error("Jamendo returned an unsupported download location.");
  return {
    id: "jamendo:" + id,
    title: String(track.name).slice(0, 120),
    artist: String(track.artist_name).slice(0, 120),
    source: "Jamendo",
    seconds: Number(track.duration) || 0,
    bpm: Number(track.musicinfo?.bpm) || 0,
    tags: [],
    license: mixLicense(track.license_ccurl)!,
    licenseUrl: track.license_ccurl,
    sourceUrl: "https://www.jamendo.com/track/" + id,
    attribution: String(
      track.licenses?.cc?.attribution ??
        "Credit the artist and link to the license. Audio may be crossfaded and tempo-adjusted.",
    ),
    format: "mp3",
    video: false,
    revision: crypto.randomUUID(),
    audioUrl: audio.href,
  };
}
