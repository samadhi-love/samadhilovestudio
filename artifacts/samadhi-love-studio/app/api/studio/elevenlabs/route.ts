import { managedAvailable, ensureCreditAccount } from "../../../credits/account-ledger";
import { privateWorkspace } from "../../../studio-access";
import { privateHeaders } from "../store";
import { testElevenLabs } from "./provider";
import { keyStatus, removeElevenLabsKey, resolveElevenLabsKey, saveElevenLabsKey, validElevenLabsKey } from "./vault";
import { traced } from "../../../server/request-context";

export const dynamic = "force-dynamic";
const options = { headers: privateHeaders };

function problem(error: string, status: number) {
  return Response.json({ error }, { ...options, status });
}

async function GETHandler() {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to your creator workspace.", 401);
  const id = access.id;
  try {
    if (managedAvailable()) {
      const account = await ensureCreditAccount(id);
      if (account.funding === "studio" && ["beta", "active"].includes(account.status) && account.period_end > Date.now())
        return Response.json({ available:true, saved:true, defaultProvider:true, connection:"connected", musicAccess:"available", managed:true,owner:access.role==="owner",
          accountMessage:"Studio-funded production is configured. Credits are checked before processing." }, options);
    }
    return Response.json({...((await keyStatus(id)).status),owner:access.role==="owner"}, options);
  }
  catch (error) {
    return problem("Studio could not access its encrypted key store. Reload and try again.", 503);
  }
}

async function manageConnection(request: Request) {
  const access = await privateWorkspace();
  if (!access) return problem("Sign in to your creator workspace.", 401);
  const id = access.id;
  const requestId=crypto.randomUUID();
  const responseOptions={headers:{...privateHeaders,"X-Studio-Request-Id":requestId}};
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return problem("Open the studio directly to manage your key.", 403);

  try {
    const { status, etag } = await keyStatus(id);
    if (request.method === "DELETE") {
      if (!await removeElevenLabsKey(id, access.role === "owner")) return problem("The secure credential store is unavailable.", 503);
      return Response.json((await keyStatus(id)).status, options);
    }
    if (!status.available) return problem("The secure credential store is unavailable. Try again later.", 503);

    if (request.method === "PUT") {
      const raw = await request.text();
      if (raw.length > 1024) return problem("Check the API key and try again.", 413);
      let input;
      try { input = JSON.parse(raw); } catch { return problem("Enter an ElevenLabs API key.", 400); }
      const key = typeof input?.apiKey === "string" ? input.apiKey.trim() : "";
      if (!validElevenLabsKey(key) || /^(?:ELEVENLABS_API_KEY=|["'])/.test(key))
        return problem("Paste only the ElevenLabs API key, without a variable name, quotes, or spaces.", 400);
      const check = await testElevenLabs(key,requestId);
      if (check.connection === "error") return Response.json({error:"The new key was not saved. "+check.accountMessage,requestId},{status:422,...responseOptions});
      const defaultProvider = status.defaultProvider && check.musicAccess !== "unavailable";
      if (!await saveElevenLabsKey(id, key, check, defaultProvider, etag))
        return problem("Connection settings changed in another tab. Reload and try again.", 409);
      return Response.json({ ...status, saved: true, defaultProvider, ...check,owner:access.role==="owner",requestId }, responseOptions);
    }

    let key: string | null;
    try { key = await resolveElevenLabsKey(id); }
    catch { return problem("Studio could not decrypt the saved key. Try again, or choose Reconnect to verify and replace it.", 503); }
    if (!key) return problem("Studio has no usable saved key. Connect your ElevenLabs account or use Reconnect to replace the key.", 400);
    const checking = request.method === "POST";
    const check = checking ? await testElevenLabs(key,requestId) : status;
    if (!checking && (status.connection !== "connected" || status.musicAccess === "unavailable"))
      return problem("Pass Test Connection before setting ElevenLabs as the default.", 422);
    if (!await saveElevenLabsKey(id, key, check, checking ? status.defaultProvider : true, etag))
      return problem("Connection settings changed in another tab. Reload and try again.", 409);
    return Response.json({ ...status, ...check, defaultProvider: checking ? status.defaultProvider : true,owner:access.role==="owner",requestId }, responseOptions);
  } catch {
    return problem("Could not manage the ElevenLabs connection. Try again.", 503);
  }
}

export const PUT=traced(manageConnection);
export const POST=traced(manageConnection);
export const PATCH=traced(manageConnection);
export const DELETE=traced(manageConnection);
export const GET=traced(GETHandler);
