import { serverStorage as env } from "../server/storage";
import { audioKey, readStudio } from "../api/studio/store";
import { hasExplicitWords } from "../clean-content";
import { problem, reply } from "./engagement";
import { eligibleSong, query, validId } from "./store";

export async function manageRelease(owner: string, input: Record<string, unknown>) {
  const { action, id } = input;
  if (action === "profile") {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const bio = typeof input.bio === "string" ? input.bio.trim() : "";
    if (!name || name.length > 60 || bio.length > 280 || hasExplicitWords(name, bio) || /https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(name + " " + bio))
      return problem("Enter a family-friendly artist name and short bio. Leave out links and contact details.");
    await query(`insert into community_artists (owner, id, name, bio) values (?, ?, ?, ?)
      on conflict(owner) do update set name = excluded.name, bio = excluded.bio`, owner, crypto.randomUUID(), name, bio).run();
    return reply({ ok: true });
  }
  if (!validId(id)) return problem("Choose a recording.");
  if (action === "unlist") {
    await query("update community_releases set listed = 0 where owner = ? and song_id = ?", owner, id).run();
    return reply({ ok: true });
  }
  if (action !== "publish") return problem("Unknown artist action.");
  if (input.confirmedClean !== true) return problem("Confirm that this recording is clean and that you have permission to share it.");
  const [{ data }, profile] = await Promise.all([
    readStudio(owner), query("select id from community_artists where owner = ?", owner).first(),
  ]);
  if (!profile) return problem("Save your artist profile first.");
  const song = data?.songs.find(song => song.id === id);
  if (!eligibleSong(song)) return problem("Choose a clean, saved library song with an attached recording.");
  const recording = song.audioId ?? song.id;
  if (!env.BUCKET || !await env.BUCKET.head(audioKey(owner, recording))) return problem("The recording could not be found. Check the song in your library.", 409);
  const result = await query(`insert into community_releases (id, owner, song_id, recording, released_at, inspirational, comments)
    select ?, ?, ?, ?, ?, ?, ? where
    (select count(*) from community_releases where owner = ?) < 100 or exists (select 1 from community_releases where owner = ? and song_id = ?)
    on conflict(owner, song_id) do update set recording = excluded.recording, listed = 1,
      inspirational = excluded.inspirational, comments = excluded.comments where community_releases.blocked = 0`,
    crypto.randomUUID(), owner, id, recording, Date.now(), Number(input.inspirational === true), Number(input.comments === true), owner, owner, id).run();
  return result.meta.changes ? reply({ ok: true }) : problem("The release is hidden by a moderator or the artist’s release limit has been reached.", 409);
}

export async function moderate(input: Record<string, unknown>) {
  const { action, id, value } = input;
  if (!validId(id)) return problem("Choose an item to review.");
  if (action === "moderate-comment") {
    if (value !== "approved" && value !== "hidden") return problem("Choose a moderation action.");
    const result = await query(`update community_comments set status = ? where id = ?
      and ((? = 'approved' and status = 'pending') or ? = 'hidden')`, value, id, value, value).run();
    if (!result.meta.changes) return problem("This comment has already been reviewed.", 409);
  } else if (action === "moderate-release" && typeof value === "boolean") {
    await query("update community_releases set blocked = ? where id = ?", Number(value), id).run();
  } else if (action === "close-report") {
    await query("update community_reports set closed = 1 where id = ?", id).run();
  } else {
    return problem("Unknown moderation action.");
  }
  return reply({ ok: true });
}
