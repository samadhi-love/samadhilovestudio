import { env } from "cloudflare:workers";
import { privateWorkspace } from "../studio-access";
import { privateHeaders, readStudio } from "../api/studio/store";
import { readBoundedText } from "../api/studio/request-errors";
import { creditPrice, type CreditQuote, type Operation } from "./data";
import { CreditError, ensureCreditAccount, managedAvailable, reserveJob, settleJob } from "./account-ledger";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const productionIdValid = (id: unknown): id is string => typeof id === "string" && uuid.test(id);
export function managedProviderKey(request: Request) {
  return request.headers.get("X-Samadhi-Production-Funding") === "studio" && managedAvailable() ? env.STUDIO_MANAGED_ELEVENLABS_KEY! : null;
}
export async function productionDescription(owner: string, route: string, input: Record<string, unknown>) {
  let operation: Operation;
  let seconds = 0;
  if (route.endsWith("/create")) {
    if (input.action === "song") operation = "music";
    else if (input.action === "lyric-plan") operation = "lyrics";
    else if (input.action === "preview-voice" || input.action === "save-voice") operation = "voice";
    else throw new CreditError("Choose a production action.", 400);
    seconds = operation === "voice" ? 0 : Number(input.duration);
    if (operation !== "voice" && (!Number.isFinite(seconds) || seconds < 3 || seconds > 600)) throw new CreditError("Choose a song length from 3 to 600 seconds.", 400);
  } else {
    if (route.endsWith("/lyric-sync") && ["auto", "align", "audit", "transcribe"].includes(String(input.mode))) operation = "captions";
    else if (route.endsWith("/stems") && ["two_stems_v1", "six_stems_v1"].includes(String(input.mode))) operation = "stems";
    else throw new CreditError("Choose a supported production action.", 400);
    const { data } = await readStudio(owner);
    const song = data?.songs.find(song => song.id === input.songId && !song.deletedAt);
    if (!song?.audioFormat) throw new CreditError("Choose a recording from your private library.", 404);
    // A requested client duration cannot determine a charge for uploaded media.
    const account = await ensureCreditAccount(owner);
    if (account.funding === "studio") {
      const current = song.audioId ?? song.id;
      const requested = input.sourceAudioId ?? input.audioId ?? current;
      if (input.analysisAsset || requested !== current || (song.generation?.audioId ?? song.id) !== current || song.generation?.status !== "complete" || !song.creationSeconds)
        throw new CreditError("Studio credits currently support caption/stem processing of current Studio-generated songs. Use your personal provider connection for uploads or earlier versions until server duration verification is added.", 422);
      seconds = song.creationSeconds;
    } else seconds = 0; // Do not invent measured duration for personal-account uploads.
  }
  return { operation, seconds: Math.ceil(seconds) };
}
export async function quoteProduction(owner: string, route: string, input: Record<string, unknown>): Promise<CreditQuote> {
  const account = await ensureCreditAccount(owner);
  const description = await productionDescription(owner, route, input);
  const funding = description.operation === "voice" ? "own" : account.funding;
  const credits = funding === "studio" ? creditPrice(description.operation, description.seconds) : 0;
  const enabled = funding === "own" || managedAvailable() && ["beta", "active"].includes(account.status) && account.period_end > Date.now() && account.balance >= credits;
  return { ...description, funding, credits, available: account.balance, enabled,
    message: funding === "own" ? "Your personal provider account pays its processing charges. No SAMADHI credits are deducted." :
      enabled ? `${credits} SAMADHI credits will be reserved. Unsuccessful jobs are refunded.` : "Studio-funded production is not available or your credit allowance is insufficient." };
}
export function withProductionUsage(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    // Never trust an incoming internal funding header, including when metering is disabled.
    const headers = new Headers(request.headers); headers.set("X-Samadhi-Production-Funding", "own");
    if (env.STUDIO_CREDITS_ENABLED !== "1") return handler(new Request(request, { headers }));
    let held: { id: string; credits: number; funding: string } | undefined, owner: string | undefined;
    try {
      const workspace = await privateWorkspace();
      if (!workspace) throw new CreditError("Sign in to your private workspace.", 401);
      owner = workspace.id;
      if (request.headers.get("origin") !== new URL(request.url).origin) throw new CreditError("Open Studio directly to start production.", 403);
      const expected = request.headers.get("X-Studio-Workspace");
      if (expected && expected !== owner) throw new CreditError("Your signed-in account changed. Reload before processing.");
      let input;
      try { input = JSON.parse(await readBoundedText(request.clone() as unknown as Request, 80000)); } catch { throw new CreditError("Check the production request.", 400); }
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new CreditError("Check the production request.", 400);
      const description = await productionDescription(owner, new URL(request.url).pathname, input);
      const requestId = request.headers.get("X-Production-Id") ?? crypto.randomUUID();
      if (!productionIdValid(requestId)) throw new CreditError("Invalid production reference.", 400);
      const rawAccepted = request.headers.get("X-Studio-Credits-Accepted");
      held = await reserveJob(owner, description.operation, description.seconds, requestId, rawAccepted === null ? null : Number(rawAccepted));
      headers.set("X-Samadhi-Production-Funding", held.funding);
      const response = await handler(new Request(request, { headers }));
      await settleJob(owner, held.id, !response.ok);
      response.headers.set("X-Production-Id", held.id);
      response.headers.set("X-Studio-Credits", String(response.ok ? held.credits : 0));
      return response;
    } catch (error) {
      if (held && owner) { try { await settleJob(owner, held.id, true); } catch { /* Held job remains visible for owner recovery. */ } }
      return Response.json({ error: error instanceof CreditError ? error.message : "Production accounting could not finish. Check Credits & Usage before retrying.",
        ...(held ? { productionId: held.id } : {}) }, { status: error instanceof CreditError ? error.status : 503, headers: privateHeaders });
    }
  };
}
