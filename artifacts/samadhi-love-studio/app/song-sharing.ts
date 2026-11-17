import { serverStorage as env } from "./server/storage";
import { audioKey, readStudio } from "./api/studio/store";
import { eligibleSong } from "./song-visibility";

type Grant = { owner: string; song: string; recording: string; token: string; createdAt: string };
const indexKey = (owner: string, song: string) => `song-sharing/${encodeURIComponent(owner)}/${song}.json`;
const grantKey = (token: string) => `song-share-tokens/${token}.json`;
export const validShareToken = (token: unknown): token is string => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
export const sharePath = (token: string) => "/share?token=" + token;

export async function ownSongShare(owner: string, song: string) {
  const stored = await env.BUCKET?.get(indexKey(owner, song));
  return stored ? await stored.json<Grant | { token: null }>() : null;
}

export async function revokeSongShare(owner: string, song: string) {
  const bucket = env.BUCKET;
  if (!bucket) throw new Error("Sharing storage unavailable.");
  const current = await bucket.get(indexKey(owner, song));
  if (!current) return;
  const saved = await bucket.put(indexKey(owner, song), JSON.stringify({ token: null }), { onlyIf: { etagMatches: current.etag } });
  if (!saved) throw new Error("Sharing changed in another tab. Try again.");
}

export async function createSongShare(owner: string, songId: string) {
  const bucket = env.BUCKET;
  if (!bucket) throw new Error("Sharing storage unavailable.");
  const workspace = await readStudio(owner);
  const song = workspace.data?.songs.find(item => item.id === songId);
  if (!eligibleSong(song) || !await bucket.head(audioKey(owner, song.audioId ?? song.id))) return null;
  const current = await bucket.get(indexKey(owner, songId));
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const grant: Grant = { owner, song: songId, recording: song.audioId ?? song.id, token, createdAt: new Date().toISOString() };
  // Token grants stay private in R2. Only the active owner index authorizes access.
  await bucket.put(grantKey(token), JSON.stringify(grant));
  const saved = await bucket.put(indexKey(owner, songId), JSON.stringify(grant), {
    onlyIf: current ? { etagMatches: current.etag } : { etagDoesNotMatch: "*" },
  });
  if (!saved) throw new Error("Sharing changed in another tab. Try again.");
  return grant;
}

export async function resolveSongShare(token: string) {
  if (!validShareToken(token) || !env.BUCKET || !env.DB) return null;
  const stored = await env.BUCKET.get(grantKey(token));
  if (!stored) return null;
  const grant = await stored.json<Grant>();
  const current = await ownSongShare(grant.owner, grant.song);
  if (current?.token !== token) return null;
  const suspended = await env.DB.prepare("select suspended from creator_accounts where id = ?").bind(grant.owner).first<number>("suspended");
  if (suspended) return null;
  const workspace = await readStudio(grant.owner);
  const song = workspace.data?.songs.find(item => item.id === grant.song);
  if (!eligibleSong(song) || (song.audioId ?? song.id) !== grant.recording) return null;
  const artist = await env.DB.prepare("select name from community_artists where owner = ?").bind(grant.owner).first<string>("name");
  return { grant, song, artist: artist ?? "Independent creator" };
}
