import { env } from "cloudflare:workers";
import { creatorAccount, creatorBetaEnabled } from "./creator-accounts";
import { getChatGPTUser } from "./chatgpt-auth";

export async function studioAccess() {
  const user = await getChatGPTUser();
  if (!user) return { role: "guest", id: null } as const;
  const ownerEmail = env.STUDIO_OWNER_EMAIL?.trim().toLowerCase();
  if (ownerEmail && user.email.trim().toLowerCase() === ownerEmail)
    return { role: "owner", id: user.userId } as const;
  return { role: "subscriber", id: user.userId } as const;
}


export async function privateWorkspace() {
  const access = await studioAccess();
  if (access.role === "owner") return access;
  if (access.role !== "subscriber" || !creatorBetaEnabled()) return null;
  const account = await creatorAccount(access.id);
  return account && !account.suspended ? { role: "creator", id: access.id } as const : null;
}
