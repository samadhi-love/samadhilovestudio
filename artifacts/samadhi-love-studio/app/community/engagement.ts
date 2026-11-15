import { serveAudio } from "../api/studio/audio-response";
import { privateHeaders } from "../api/studio/store";
import { hasExplicitWords } from "../clean-content";
import { minListenMs, reactions, reportReasons } from "./data";
import { artistIsVisible, dayMs, db, publicRelease, query, sessionMs, utcDay, validId } from "./store";

export const reply = (data: object, status = 200) => Response.json(data, { status, headers: privateHeaders });
export const problem = (error: string, status = 400) => reply({ error }, status);

export async function streamRelease(request: Request, id: string, viewer: string | null, token: string | null) {
  const release = await publicRelease(id);
  if (!release) return problem("This recording is unavailable.", 404);
  const response = await serveAudio(request, release.owner, release.recording, release.song.audioFormat);
  if (response.ok && response.body && request.method === "GET" && viewer && validId(token) &&
      Number(response.headers.get("Content-Length")) >= 4096) {
    const now = Date.now();
    await query(`update community_playback set served_at = ? where viewer = ? and token = ? and release = ?
      and recording = ? and served_at is null and started_at >= ?`, now, viewer, token, id, release.recording, now - sessionMs).run()
      .catch(() => {});
  }
  return response;
}

export async function engage(viewer: string, input: Record<string, unknown>) {
  const now = Date.now();
  const { action, id, value } = input;
  if (action === "create-playlist") {
    const name = typeof value === "string" ? value.trim() : "";
    if (!name || name.length > 60 || hasExplicitWords(name)) return problem("Enter a family-friendly playlist name up to 60 characters.");
    const result = await query(`insert into community_playlists (id, viewer, name, created_at) select ?, ?, ?, ?
      where (select count(*) from community_playlists where viewer = ?) < 20`,
      crypto.randomUUID(), viewer, name, now, viewer).run();
    return result.meta.changes ? reply({ ok: true }) : problem("You can keep up to 20 community playlists.", 409);
  }
  if (!validId(id)) return problem("Choose a song, artist, or playlist.");
  if (action === "remove-playlist") {
    await query("delete from community_playlists where id = ? and viewer = ?", id, viewer).run();
    return reply({ ok: true });
  }
  if (action === "follow") {
    if (value !== true && value !== false) return problem("Choose whether to follow this artist.");
    if (!value) {
      await query("delete from community_marks where viewer = ? and target = ? and kind = 'follow'", viewer, id).run();
      return reply({ ok: true });
    }
    const artist = await query("select owner from community_artists where id = ?", id).first<string>("owner");
    if (!artist || artist === viewer) return problem("Choose another artist to follow.");
    if (!await artistIsVisible(artist)) return problem("This artist is unavailable.", 404);
    await query("insert into community_marks values (?, ?, 'follow', '1', ?) on conflict do nothing", viewer, id, now).run();
    return reply({ ok: true });
  }
  if (action === "save" && value === false) {
    await query("delete from community_marks where viewer = ? and target = ? and kind = 'save'", viewer, id).run();
    return reply({ ok: true });
  }
  if (action === "playlist" && value === false) {
    if (!validId(input.playlist)) return problem("Choose one of your playlists.");
    await query(`delete from community_playlist_songs where playlist = ? and release = ?
      and exists (select 1 from community_playlists where id = ? and viewer = ?)`, input.playlist, id, input.playlist, viewer).run();
    return reply({ ok: true });
  }
  if (action === "delete-comment") {
    await query("delete from community_comments where release = ? and viewer = ?", id, viewer).run();
    return reply({ ok: true });
  }
  const release = await publicRelease(id);
  if (!release) return problem("This release is unavailable.", 404);

  switch (action) {
    case "start": {
      if (viewer === release.owner) return reply({ token: null });
      const ref = validId(input.ref)
        ? await query("select id from community_shares where id = ? and release = ? and sender <> ?", input.ref, id, viewer).first<string>("id")
        : null;
      const token = crypto.randomUUID();
      await query(`insert into community_playback (viewer, token, release, recording, started_at, served_at, share) values (?, ?, ?, ?, ?, null, ?)
        on conflict(viewer) do update set token = excluded.token, release = excluded.release, recording = excluded.recording,
          started_at = excluded.started_at, served_at = null, share = excluded.share`, viewer, token, id, release.recording, now, ref).run();
      return reply({ token });
    }
    case "listen": {
      if (viewer === release.owner || !validId(input.token)) return problem("Start the song from the community player.");
      const session = await query("select served_at as served, started_at as started from community_playback where viewer = ? and release = ? and token = ? and recording = ?",
        viewer, id, input.token, release.recording).first<{ served: number | null; started: number }>();
      if (!session || now - session.started > sessionMs) return problem("This listening session has ended.", 409);
      if (!session.served || now - session.served < minListenMs) return problem("Keep listening a moment longer.", 425);
      const [insert] = await db().batch([
        query(`insert into community_listens (release, viewer, day, shared)
          select release, viewer, ?, case when share is null then 0 else 1 end from community_playback
          where viewer = ? and token = ? and release = ? and recording = ? and served_at <= ?
          on conflict do nothing`, utcDay(now), viewer, input.token, id, release.recording, now - minListenMs),
        query("delete from community_playback where viewer = ? and token = ?", viewer, input.token),
      ]);
      return reply({ counted: !!insert.meta.changes });
    }
    case "reaction": {
      if (viewer === release.owner) return problem("Appreciation totals come from listeners.");
      if (value === null) {
        await query("delete from community_marks where viewer = ? and target = ? and kind = 'reaction'", viewer, id).run();
      } else {
        if (typeof value !== "string" || !Object.hasOwn(reactions, value)) return problem("Choose Like, Love, or Inspired.");
        await query(`insert into community_marks values (?, ?, 'reaction', ?, ?) on conflict(viewer, target, kind)
          do update set value = excluded.value, created_at = excluded.created_at`, viewer, id, value, now).run();
      }
      return reply({ ok: true });
    }
    case "save":
      if (value !== true) return problem("Choose whether to save this song.");
      await query("insert into community_marks values (?, ?, 'save', '1', ?) on conflict do nothing", viewer, id, now).run();
      return reply({ ok: true });
    case "playlist": {
      if (!validId(input.playlist) || value !== true) return problem("Choose one of your playlists.");
      if (!await query("select id from community_playlists where id = ? and viewer = ?", input.playlist, viewer).first())
        return problem("Playlist unavailable.", 404);
      const result = await query(`insert into community_playlist_songs (playlist, release, added_at)
        select id, ?, ? from community_playlists where id = ? and viewer = ?
        and (select count(*) from community_playlist_songs where playlist = ?) < 100 on conflict do nothing`,
        id, now, input.playlist, viewer, input.playlist).run();
      if (!result.meta.changes && !await query("select 1 from community_playlist_songs where playlist = ? and release = ?", input.playlist, id).first())
        return problem("This playlist is full or unavailable.", 409);
      return reply({ ok: true });
    }
    case "share": {
      const token = await query(`insert into community_shares (id, release, sender) values (?, ?, ?)
        on conflict(release, sender) do update set id = community_shares.id returning id`,
        crypto.randomUUID(), id, viewer).first<string>("id");
      return reply({ ref: token });
    }
    case "comment": {
      const body = typeof value === "string" ? value.trim() : "";
      if (!release.comments) return problem("Comments are closed for this song.", 403);
      if (!body || body.length > 280 || hasExplicitWords(body) || /https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(body))
        return problem("Write an encouraging, family-friendly message up to 280 characters. Leave out links and contact details.");
      const result = await query(`insert into community_comments (id, release, viewer, body, status, created_at)
        select ?, ?, ?, ?, 'pending', ?
        where (select count(*) from community_comments where viewer = ? and created_at >= ?) < 8
        on conflict(release, viewer) do update set id = excluded.id, body = excluded.body, status = 'pending', created_at = excluded.created_at`,
        crypto.randomUUID(), id, viewer, body, now, viewer, now - dayMs).run();
      return result.meta.changes ? reply({ ok: true }) : problem("You’ve reached today’s comment limit. Try again later.", 429);
    }
    case "report": {
      if (typeof value !== "string" || !reportReasons.some(reason => reason === value)) return problem("Choose a reason for the report.");
      const comment = validId(input.comment) ? input.comment : "";
      if (comment && (!release.comments || !await query("select 1 from community_comments where id = ? and release = ? and status = 'approved'", comment, id).first()))
        return problem("This comment is no longer available.", 404);
      const result = await query(`insert into community_reports (id, release, viewer, comment, reason, created_at)
        select ?, ?, ?, ?, ?, ? where (select count(*) from community_reports where viewer = ? and created_at >= ?) < 12
        on conflict(release, viewer, comment) do nothing`, crypto.randomUUID(), id, viewer, comment, value, now, viewer, now - dayMs).run();
      if (!result.meta.changes && !await query("select 1 from community_reports where release = ? and viewer = ? and comment = ?", id, viewer, comment).first())
        return problem("You’ve reached today’s reporting limit. Try again later.", 429);
      return reply({ ok: true });
    }
    default:
      return problem("Unknown community action.");
  }
}
