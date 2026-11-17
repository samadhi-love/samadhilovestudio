import { serverStorage as env } from "./server/storage";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { creatorAccounts } from "../db/schema";

export function creatorBetaEnabled() {
  return env.STUDIO_CREATOR_BETA === "1";
}

export function creatorAccount(id: string) {
  return getDb().select().from(creatorAccounts).where(eq(creatorAccounts.id, id)).get();
}

export async function reserveCreatorGeneration(id: string) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await getDb().update(creatorAccounts).set({
    usageDay: today,
    attempts: sql`case when ${creatorAccounts.usageDay} = ${today} then ${creatorAccounts.attempts} + 1 else 1 end`,
  }).where(sql`${creatorAccounts.id} = ${id} and ${creatorAccounts.suspended} = 0 and ${creatorAccounts.limit} >
    (case when ${creatorAccounts.usageDay} = ${today} then ${creatorAccounts.attempts} else 0 end)`)
    .returning({ attempts: creatorAccounts.attempts });
  return rows.length === 1;
}
