/**
 * Cleanup preview: counts songs people already deleted, split into those still
 * restorable and those past their 30-day grace period. Read-only: it never
 * changes or deletes anything. Permanent cleanup stays off until the owner
 * reviews this and approves it separately.
 */
import { deletionDeadline } from "../song-deletion";

type Row = { deleted_at: unknown; delete_after: unknown };
type Database = { prepare(sql: string): { bind(...values: unknown[]): { all<T>(): Promise<{ results?: T[] }> } } };

/** At most this many deleted songs are read for one preview. */
export const previewLimit = 5000;

export function summarizeDeletedSongs(rows: Row[], now = Date.now()) {
  let restorable = 0, pastGrace = 0, oldest: number | null = null;
  for (const row of rows) {
    const deletedAt = typeof row.deleted_at === "string" ? row.deleted_at : undefined;
    const deleteAfter = typeof row.delete_after === "string" ? row.delete_after : undefined;
    if (!deletedAt) continue;
    const deadline = deletionDeadline({ deletedAt, deleteAfter });
    if (deadline !== null && deadline <= now) {
      pastGrace++;
      oldest = oldest === null ? deadline : Math.min(oldest, deadline);
    } else restorable++;
  }
  return { deletedSongs: restorable + pastGrace, restorable, pastGrace,
    oldestPastGrace: oldest === null ? null : new Date(oldest).toISOString(),
    capped: rows.length >= previewLimit };
}

export async function retentionPreview(DB: Database, now = Date.now()) {
  try {
    const rows = (await DB.prepare(`SELECT json_extract(song.value, '$.deletedAt') AS deleted_at,
        json_extract(song.value, '$.deleteAfter') AS delete_after
      FROM studios, json_each(studios.content, '$.songs') AS song
      WHERE json_extract(song.value, '$.deletedAt') IS NOT NULL LIMIT ?`).bind(previewLimit).all<Row>()).results ?? [];
    return { mode: "preview" as const, ...summarizeDeletedSongs(rows, now) };
  } catch {
    return null; // Preview only; a busy database must never break the status page.
  }
}
export type RetentionPreview = NonNullable<Awaited<ReturnType<typeof retentionPreview>>>;
