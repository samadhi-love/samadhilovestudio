import { eligibleSong } from "../song-visibility";
export { eligibleSong } from "../song-visibility";
import { serverStorage as env } from "../server/storage";
import { readStudio } from "../api/studio/store";
import { hasExplicitWords } from "../clean-content";
import { type Song } from "../studio-data";
import { reactions, type ArtistDashboard, type CommunityData, type ModerationData, type PublicComment, type Reaction, type ReleaseStats } from "./data";
import { rankDiscovery, type RankedRelease } from "./ranking";

export const dayMs = 86_400_000;
export const sessionMs = 60 * 60_000;
export const utcDay = (time = Date.now()) => Math.floor(time / dayMs);
export const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,96}$/.test(value);

export function db() {
  if (!env.DB) throw new Error("Community storage unavailable.");
  return env.DB;
}

export function query(statement: string, ...parameters: (string | number | null)[]) {
  return db().prepare(statement).bind(...parameters);
}

type PublicRow = {
  id: string; owner: string; songId: string; recording: string; releasedAt: number; inspirational: number; comments: number;
  artistId: string; artistName: string; bio: string; songJson: string;
};
type StatRow = { listens: number; recentListeners: number; shares: number; like: number; love: number; inspired: number };
type CatalogRow = PublicRow & StatRow;

const visible = `
  select r.id, r.owner, r.song_id as songId, r.recording, r.released_at as releasedAt, r.inspirational, r.comments,
         a.id as artistId, a.name as artistName, a.bio,
         json_object('id', r.song_id, 'name', json_extract(song.value, '$.name'),
          'art', json_extract(song.value, '$.art'), 'audioFormat', json_extract(song.value, '$.audioFormat'),
          'tags', json_extract(song.value, '$.tags'), 'instruments', json_extract(song.value, '$.notes.instruments'), 'coverAsset', json_extract(song.value, '$.coverAsset'), 'notes', json_object('lyrics', json_extract(song.value, '$.notes.lyrics'))) as songJson
  from community_releases r
  join community_artists a on a.owner = r.owner
   join studio_catalog_songs song on song.owner = r.owner and song.id = r.song_id
  left join creator_accounts creator on creator.id = r.owner
  where r.listed = 1 and r.blocked = 0 and coalesce(creator.suspended, 0) = 0
    and json_extract(song.value, '$.deletedAt') is null
    and coalesce(json_extract(song.value, '$.creationDraft'), 0) = 0
    and coalesce(json_extract(song.value, '$.explicit'), 0) = 0
    and json_extract(song.value, '$.audioFormat') in ('mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus', 'webm')
    and coalesce(json_extract(song.value, '$.audioId'), r.song_id) = r.recording
`;

const stats = `
  (select count(*) from community_listens where release = r.id) as listens,
  (select count(distinct viewer) from community_listens where release = r.id and day >= ?) as recentListeners,
  (select count(distinct viewer) from community_listens where release = r.id and shared = 1) as shares,
  (select count(*) from community_marks where target = r.id and kind = 'reaction' and value = 'like') as like,
  (select count(*) from community_marks where target = r.id and kind = 'reaction' and value = 'love') as love,
  (select count(*) from community_marks where target = r.id and kind = 'reaction' and value = 'inspired') as inspired
`;


function audioFrom(row: PublicRow) {
  const song = JSON.parse(row.songJson) as Song;
  return eligibleSong(song) ? song : null;
}

export async function publicRelease(id: string) {
  const row = await query(`with available as (${visible}) select * from available where id = ?`, id).first<PublicRow>();
  const song = row && audioFrom(row);
  return row && song ? { ...row, song } : null;
}

export async function artistIsVisible(owner: string) {
  const rows = await query(`with available as (${visible}) select * from available where owner = ?`, owner).all<PublicRow>();
  return rows.results.some(audioFrom);
}

function counts(row: StatRow): ReleaseStats {
  return { listens: row.listens, shares: row.shares, reactions: { like: row.like, love: row.love, inspired: row.inspired } };
}

function toRelease(row: CatalogRow): RankedRelease | null {
  const song = audioFrom(row);
  if (!song) return null;
  return {
    id: row.id, title: song.name, artist: { id: row.artistId, name: row.artistName }, releasedAt: row.releasedAt,
    inspirational: !!row.inspirational, comments: !!row.comments,
    tags: Array.isArray(song.tags) ? song.tags.filter(tag => typeof tag === "string" && tag.length <= 55 && !hasExplicitWords(tag)).slice(0, 6) : [],
    instruments: typeof (song as Song&{instruments?:unknown}).instruments==="string"?String((song as Song&{instruments?:string}).instruments).slice(0,500):"",
    ...(song.coverAsset?{cover:"/api/community?cover="+encodeURIComponent(row.id)}:{}),
    art: Number.isInteger(song.art) ? song.art : 0,
    recentListeners: row.recentListeners, stats: counts(row),
  };
}

export async function loadCommunity(viewer: string | null, releaseId: string | null, artistId: string | null, options: { page?: number; search?: string; genre?:string } = {}): Promise<CommunityData> {
  const page = Math.max(1, Math.min(100000, Math.floor(options.page ?? 1) || 1));
  const search = (options.search ?? "").trim().slice(0, 80);
  const pattern = "%" + search.replace(/[\\%_]/g, "\\$&") + "%";
  const genre=(options.genre??"").trim().slice(0,60);
  const matching = "((json_extract(r.songJson, '$.name') like ? escape '\\' or r.artistName like ? escape '\\' or json_extract(r.songJson, '$.instruments') like ? escape '\\' or exists(select 1 from json_each(r.songJson,'$.tags') tag where cast(tag.value as text) like ? escape '\\')) and (? = '' or exists(select 1 from json_each(r.songJson,'$.tags') tag where cast(tag.value as text) = ? collate nocase)))";
  const statements = [
    query(`with available as (${visible}), scored as (select r.*, ${stats} from available r),
    ranked as (
      select *, row_number() over (partition by owner order by releasedAt desc, id) as newest,
        row_number() over (partition by owner order by love desc, releasedAt desc, id) as loved,
        row_number() over (partition by owner order by recentListeners desc, releasedAt desc, id) as trending,
        row_number() over (partition by owner order by cast(listens / 10 as integer), (releasedAt / 86400000 + ?) % 29, id) as gems,
        row_number() over (partition by owner order by inspirational desc, listens, id) as inspiration
      from scored
    ), candidates as (
      select id from ranked where newest <= 3 order by newest, releasedAt desc limit 96
    ), loves as (
      select id from ranked where loved <= 3 and love > 0 order by loved, love desc limit 64
    ), trends as (
      select id from ranked where trending <= 3 and recentListeners > 0 order by trending, recentListeners desc limit 64
    ), hidden as (
      select id from ranked where gems <= 3 order by gems, cast(listens / 10 as integer), (releasedAt / 86400000 + ?) % 31 limit 64
    ), uplifting as (
      select id from ranked where inspiration <= 3 and inspirational = 1 order by inspiration, listens, (releasedAt / 86400000 + ?) % 31 limit 64
    )
    select * from ranked where id in (select id from candidates union select id from loves union select id from trends union select id from hidden union select id from uplifting)`,
      utcDay() - 6, utcDay(), utcDay(), utcDay()),
    query(`with available as (${visible}) select r.*, ${stats} from available r where r.id = ? or r.artistId = ?
       or exists (select 1 from community_marks m where m.viewer = ? and m.kind = 'save' and m.target = r.id)
       or exists (select 1 from community_playlists p join community_playlist_songs ps on ps.playlist = p.id where p.viewer = ? and ps.release = r.id)
       or exists (select 1 from community_marks m where m.viewer = ? and m.kind = 'follow' and m.target = r.artistId)
       order by (r.id = ?) desc, (r.artistId = ?) desc, r.releasedAt desc limit 500`, utcDay() - 6, releaseId, artistId, viewer, viewer, viewer, releaseId, artistId),
    query("select target, kind, value from community_marks where viewer = ?", viewer),
    query(`select p.id, p.name, ps.release from community_playlists p left join community_playlist_songs ps on ps.playlist = p.id
      where p.viewer = ? order by p.created_at, ps.added_at`, viewer),
  ];
  statements.push(
    query(`with available as (${visible}) select r.*, ${stats} from available r where ${matching} order by releasedAt desc, id limit 20 offset ?`, utcDay() - 6, pattern, pattern, pattern, pattern, genre, genre, (page - 1) * 20),
    query(`with available as (${visible}) select count(*) as total from available r where ${matching}`, pattern, pattern, pattern, pattern, genre, genre),
    query(`with available as (${visible}), scored as (select r.*, ${stats} from available r)
      select artistId as id, artistName as name, count(*) as songs, sum(listens) as listens, sum(like) as likes,
      max(cast(json_extract(songJson, '$.art') as integer)) as art,
      (select count(*) from community_marks m where m.kind='follow' and m.target=scored.artistId) as followers,
      max(case when json_extract(songJson,'$.coverAsset') is not null then id end) as coverRelease from scored group by artistId, artistName order by max(releasedAt) desc, artistId limit 24`, utcDay() - 6),
  );
  const [feed, extras, marks, items, catalog, totalRows, artistRows] = await db().batch(statements);
  const rows = [...feed.results, ...extras.results, ...catalog.results] as CatalogRow[];
  const valid = rows.map(toRelease).filter((item): item is RankedRelease => !!item);
  const releases = [...new Map(valid.map(release => [release.id, release])).values()];
  const ranked = new Set((feed.results as CatalogRow[]).map(row => row.id));
  const featured = releases.find(release => release.id === releaseId) ?? null;
  const artistRow = artistId ? rows.find(row => row.artistId === artistId) : null;
  const artistReleases = artistRow ? releases.filter(release => release.artist.id === artistId) : [];
  const [followers, comments, myComment] = await Promise.all([
    artistReleases.length ? query("select count(*) as count from community_marks where target = ? and kind = 'follow'", artistId).first<number>("count") : 0,
    featured?.comments ? query("select id, body, created_at as createdAt from community_comments where release = ? and status = 'approved' order by created_at desc limit 40", featured.id).all<PublicComment>() : null,
    viewer && featured?.comments ? query("select body, status from community_comments where release = ? and viewer = ?", featured.id, viewer).first<CommunityData["myComment"]>() : null,
  ]);
  const playlists = new Map<string, CommunityData["playlists"][number]>();
  for (const row of items.results as { id: string; name: string; release: string | null }[]) {
    if (!playlists.has(row.id)) playlists.set(row.id, { id: row.id, name: row.name, songs: [] });
    if (row.release) playlists.get(row.id)!.songs.push(row.release);
  }
  const own = rows.filter(row => row.owner === viewer).map(row => row.id);
  const viewerMarks = marks.results as { target: string; kind: string; value: string }[];
  return {
    catalog: { releases: (catalog.results as CatalogRow[]).map(toRelease).filter((item): item is RankedRelease => !!item),
      page, pages: Math.max(1, Math.ceil(Number((totalRows.results[0] as { total?: number } | undefined)?.total ?? 0) / 20)), total: Number((totalRows.results[0] as { total?: number } | undefined)?.total ?? 0), search },
    artists: artistRows.results as NonNullable<CommunityData["artists"]>,
    releases, sections: rankDiscovery(releases.filter(release => ranked.has(release.id)), Date.now()), featured,
    artist: artistRow && artistReleases.length ? {
      id: artistRow.artistId, name: artistRow.artistName, bio: artistRow.bio,
      listens: artistReleases.reduce((sum, release) => sum + release.stats.listens, 0), followers: followers ?? 0, releases: artistReleases,
    } : null,
    comments: comments?.results ?? [], myComment, canEngage: !!viewer, own: [...new Set(own)],
    reactionBySong: Object.fromEntries(viewerMarks.filter(mark => mark.kind === "reaction" && Object.hasOwn(reactions, mark.value)).map(mark => [mark.target, mark.value as Reaction])),
    saved: viewerMarks.filter(mark => mark.kind === "save").map(mark => mark.target),
    following: viewerMarks.filter(mark => mark.kind === "follow").map(mark => mark.target),
    playlists: [...playlists.values()],
  };
}

export async function loadArtistDashboard(owner: string): Promise<ArtistDashboard> {
  const [profile, workspace, records, followers] = await Promise.all([
    query("select id, name, bio from community_artists where owner = ?", owner).first<ArtistDashboard["profile"]>(),
    readStudio(owner),
    query(`select r.id, r.song_id as songId, r.recording, r.listed, r.blocked, r.inspirational, r.comments, ${stats}
      from community_releases r where r.owner = ?`, utcDay() - 6, owner)
      .all<StatRow & { id: string; songId: string; recording: string; listed: number; blocked: number; inspirational: number; comments: number }>(),
    query("select count(*) as count from community_marks where kind = 'follow' and target = (select id from community_artists where owner = ?)", owner).first<number>("count"),
  ]);
  const songs = new Map((workspace.data?.songs ?? []).map(song => [song.id, song]));
  const result: ArtistDashboard["songs"] = records.results.map(record => {
    const song = songs.get(record.songId);
    const available = eligibleSong(song);
    songs.delete(record.songId);
    return {
      songId: record.songId, title: song?.name ?? "Archived recording", available, releaseId: record.id,
      status: record.blocked ? "Hidden by moderator" : !record.listed ? "Unlisted" :
        available && (song.audioId ?? song.id) === record.recording ? "Published" : "Review required",
      inspirational: !!record.inspirational, comments: !!record.comments, stats: counts(record),
    };
  });
  for (const song of songs.values()) if (eligibleSong(song)) result.push({ songId: song.id, title: song.name, available: true, status: "Private" });
  return { profile, followers: followers ?? 0, songs: result };
}

export async function loadModeration(): Promise<ModerationData> {
  const [comments, reports, hidden] = await db().batch([
    query(`select c.id, c.release, c.body, c.status, coalesce(json_extract(song.value, '$.name'), 'Unavailable recording') as title
      from community_comments c join community_releases r on r.id = c.release
       left join studio_catalog_songs song on song.owner = r.owner and song.id = r.song_id
      where c.status in ('pending', 'approved') order by (c.status = 'pending') desc, c.created_at desc limit 80`),
    query(`select f.id, f.release, f.reason, f.comment, c.body as commentBody, r.blocked, coalesce(json_extract(song.value, '$.name'), 'Unavailable recording') as title
      from community_reports f join community_releases r on r.id = f.release
      left join community_comments c on c.id = f.comment
       left join studio_catalog_songs song on song.owner = r.owner and song.id = r.song_id
      where f.closed = 0 order by f.created_at desc limit 80`),
    query(`select r.id, coalesce(json_extract(song.value, '$.name'), 'Unavailable recording') as title
       from community_releases r left join studio_catalog_songs song on song.owner = r.owner and song.id = r.song_id
      where r.blocked = 1 order by r.released_at desc limit 80`),
  ]);
  return { comments: comments.results as ModerationData["comments"], reports: reports.results as ModerationData["reports"], hidden: hidden.results as ModerationData["hidden"] };
}
