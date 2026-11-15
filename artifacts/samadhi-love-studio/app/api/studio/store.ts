import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { listenerStation, studios } from "../../../db/schema";
import type { Studio } from "../../studio-data";

export const maxStudioBytes = 1_500_000;
export const privateHeaders = { "Cache-Control": "private, no-store" };

export async function readStudio(id: string) {
  const row = await getDb().select().from(studios).where(eq(studios.owner, id)).get();
  return row ? { data: JSON.parse(row.content) as Studio, revision: row.revision } : { data: null, revision: 0 };
}

export async function checkpointStudio(id: string, expectedRevision?: number, name = "pre-upgrade") {
  const bucket = env.BUCKET;
  if (!bucket) throw new Error("Workspace backup storage is unavailable.");
  const key = `checkpoints/${encodeURIComponent(id)}/${name}.json`;
  if (await bucket.head(key)) return true;
  const db = getDb();
  const row = await db.select().from(studios).where(eq(studios.owner, id)).get();
  const revision = row?.revision ?? 0;
  if (expectedRevision !== undefined && revision !== expectedRevision) return false;
  const stations = await db.select().from(listenerStation).where(eq(listenerStation.owner, id));
  await bucket.put(key, JSON.stringify({ createdAt: new Date().toISOString(), revision, data: row ? JSON.parse(row.content) : null, stations }), {
    onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: "application/json" },
  });
  return true;
}

export async function writeStudio(id: string, revision: number, content: string) {
  const db = getDb();
  const previous=await db.select().from(studios).where(eq(studios.owner,id)).get();
  if((previous?.revision??0)!==revision)return undefined;
  if (revision > 0 && !await checkpointStudio(id, revision)) return undefined;
  if (revision > 0 && !await checkpointStudio(id, revision, "before-project-workflow-v2")) return undefined;
  const oldIds=new Set<string>(previous?(JSON.parse(previous.content).songs??[]).map((s:{id:string})=>s.id):[]);
  for(const song of ((JSON.parse(content) as Studio).songs??[])){if(!oldIds.has(song.id)&&await env.DB!.prepare("select song_id from song_deletion_jobs where owner = ? and song_id = ?").bind(id,song.id).first())throw new Error("This song ID has been permanently deleted. Start a new song with a new ID.");}
  const rows = revision === 0
    ? await db.insert(studios).values({ owner: id, content, revision: 1 }).onConflictDoNothing().returning({ revision: studios.revision })
    : await db.update(studios).set({ content, revision: revision + 1 })
        .where(and(eq(studios.owner, id), eq(studios.revision, revision))).returning({ revision: studios.revision });
  return rows[0];
}

export function saveConflict() {
  return Response.json({ error: "A newer save exists in another tab. Copy any unsaved text and reload before editing." }, { status: 409 });
}

export function audioKey(ownerId: string, songId: string) {
  return `songs/${encodeURIComponent(ownerId)}/${songId}`;
}
