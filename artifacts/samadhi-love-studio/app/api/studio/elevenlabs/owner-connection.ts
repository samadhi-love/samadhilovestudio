import { env } from "cloudflare:workers";
import { testElevenLabsAccount } from "./provider";
import { keyStatus, saveElevenLabsKey, validElevenLabsKey } from "./vault";

export class OwnerConnectionError extends Error {}

/**
 * Complete the explicitly approved owner setup on their first settings load.
 * Do not overwrite an existing connection or reattach one the owner disconnected.
 * No project key is returned to the browser or used on behalf of other accounts.
 */
export async function prepareOwnerConnection(access: { role: string; id: string }) {
  if (access.role !== "owner" || !env.STUDIO_OWNER_EMAIL?.trim()) return;
  const key = env.ELEVENLABS_API_KEY;
  if (!key) return;
  const { status, etag } = await keyStatus(access.id);
  if (etag) return;
  if (!status.available) throw new OwnerConnectionError("Owner connection setup needs the existing secure credential store.");
  if (!validElevenLabsKey(key)) throw new OwnerConnectionError("The saved project key is not a valid ElevenLabs key format.");
  const check = await testElevenLabsAccount(key);
  if (check.connection !== "connected") throw new OwnerConnectionError(check.error ?? "ElevenLabs did not accept the saved project key.");
  const saved = await saveElevenLabsKey(access.id, key, check, false);
  if (!saved && !(await keyStatus(access.id)).etag)
    throw new OwnerConnectionError("The owner connection could not be saved securely. Reload Studio to try setup again.");
}
