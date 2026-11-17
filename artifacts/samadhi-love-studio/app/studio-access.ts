import { env } from "cloudflare:workers";
import { creatorAccount, creatorBetaEnabled } from "./creator-accounts";
import { getChatGPTUser } from "./chatgpt-auth";

export async function studioAccess() {
  const user = await getChatGPTUser();
  if (!user) return { role: "guest", id: null } as const;
  const ownerEmail = env.STUDIO_OWNER_EMAIL?.trim().toLowerCase();
  if (ownerEmail && user.email.trim().toLowerCase() === ownerEmail) {
    const marker = await env.BUCKET?.get("private/setup/owner-claim-v1.json");
    const claim = marker ? await marker.json<{ userId: string }>() : null;
    if (claim?.userId === user.userId) return { role: "owner", id: user.userId } as const;
  }
  return { role: "subscriber", id: user.userId } as const;
}

/** Identity comes exclusively from the verified Clerk bridge, never request headers. */
export async function ownerSetup() {
  const user = await getChatGPTUser();
  const email = env.STUDIO_OWNER_EMAIL?.trim().toLowerCase();
  if (!user || !email || user.email.trim().toLowerCase() !== email) return null;
  const marker = await env.BUCKET?.get("private/setup/owner-claim-v1.json");
  const claim = marker ? await marker.json<{ userId: string }>() : null;
  return { userId: user.userId, claimed: claim?.userId === user.userId,
    blocked: !!claim && claim.userId !== user.userId, storageAvailable: !!env.BUCKET };
}

export async function privateWorkspace() {
  const access = await studioAccess();
  if (access.role === "owner") return access;
  if (access.role !== "subscriber" || !creatorBetaEnabled()) return null;
  const account = await creatorAccount(access.id);
  return account && !account.suspended ? { role: "creator", id: access.id } as const : null;
}
